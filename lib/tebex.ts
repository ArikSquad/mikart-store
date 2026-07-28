import { cacheLife } from "next/cache";
import { cookies, headers } from "next/headers";
import sanitizeHtml from "sanitize-html";
import { createEmptyCart } from "@/lib/cart";
import type { CartState, ServerStatus, SidebarData, SidebarModule, StoreCategory, StorefrontData, StoreProduct } from "@/lib/types";
import { slugify } from "@/lib/utils";

const API_BASE = "https://headless.tebex.io/api";
const token = process.env.TEBEX_PUBLIC_TOKEN;

type TebexEnvelope<T> = { data: T };

type RawPackage = {
  id?: number;
  name?: string;
  slug?: string;
  description?: string;
  image?: string | null;
  media: object;
  category: { id: number, name: string };
  base_price: number;
  sales_tax: number;
  total_price: number;
  currency: string;
  discount: number;
  disable_quantity: boolean;
  disable_gifting: boolean;
  expiration_date: null | Date;
  created_at: Date;
  updated_at: Date;
  order: number;
  creator_meta_data: null | object;
  vip_status: object | null;
  user_limit?: { limit?: number } | null;
  qty?: number;
};

type RawCategory = {
  id?: number;
  name?: string;
  description?: string;
  packages?: RawPackage[];
};

type RawBasket = {
  ident: string;
  complete: boolean;
  email: string;
  country: string;
  ip: string;
  username: string;
  username_id: string;
  cancel_url: string;
  complete_url: string;
  complete_auto_redirect: true;
  base_price: number;
  sales_tax: number;
  total_price: number;
  currency: string; // 'EUR' for example.
  packages?: RawPackage[];
  creator_code?: string;
  coupons: { coupon_code?: string }[];
  giftcards: { card_number?: string }[];
  links: { checkout?: string; payment?: string };
};

type RawSidebarModule = {
  id?: string | number;
  type?: string | null;
  data?: Record<string, unknown>;
};

class TebexError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
  }
}

async function tebexFetch<T>(path: string, init?: RequestInit, cache: RequestCache = "force-cache") {
  if (!token) throw new Error("TEBEX_PUBLIC_TOKEN is not configured");
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    cache,
    next: cache === "force-cache" ? { revalidate: 60 } : undefined,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  if (!response.ok) {
    const message = await response.json().catch(() => ({}));
    const details = [
      (message as { title?: unknown }).title,
      (message as { detail?: unknown }).detail,
      (message as { message?: unknown }).message,
      (message as { error?: unknown }).error,
    ]
      .filter(Boolean)
      .join(": ");
    throw new TebexError(response.status, `Tebex ${response.status}: ${details || "Request failed"}`);
  }

  return (await response.json()) as T;
}

function isMissingBasket(error: unknown) {
  return error instanceof TebexError && error.status === 404 && error.message.toLowerCase().includes("basket");
}

function cleanHtml(html: string) {
  return sanitizeHtml(html, {
    allowedTags: ["p", "br", "strong", "b", "em", "i", "u", "ul", "ol", "li", "a", "span"],
    allowedAttributes: {
      a: ["href", "target", "rel"],
    },
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer", target: "_blank" }),
    },
  }).trim();
}

function stripTags(html: string) {
  return sanitizeHtml(html, { allowedTags: [], allowedAttributes: {} })
    .replace(/\s+/g, " ")
    .trim();
}

function parseDescription(rawDescription: string) {
  const tablePattern = /<table[\s\S]*?<\/table>/i;
  const table = rawDescription.match(tablePattern)?.[0] ?? "";
  const features = Array.from(table.matchAll(/<tr[\s\S]*?<\/tr>/gi))
    .map((row) => Array.from(row[0].matchAll(/<td[\s\S]*?>([\s\S]*?)<\/td>/gi)).map((cell) => stripTags(cell[1])))
    .filter((cells) => cells.length >= 2)
    .map(([flag, ...rest]) => {
      const normalizedFlag = flag.toLowerCase();
      return {
        positive: ["yes", "y", "true", "1", "check", "✓"].includes(normalizedFlag),
        text: rest.join(" ").trim(),
      };
    })
    .filter((feature) => feature.text.length > 0);

  const detailsHtml = cleanHtml(rawDescription.replace(tablePattern, ""));
  return {
    descriptionHtml: cleanHtml(rawDescription),
    detailsHtml,
    features,
    plainDescription: stripTags(detailsHtml) || stripTags(rawDescription),
  };
}

function minecraftAvatar(usernameOrId?: string, size = 48) {
  const value = usernameOrId?.trim() || "Steve";
  return `https://mc-heads.net/avatar/${encodeURIComponent(value)}/${size}`;
}

function minecraftBody(usernameOrId?: string, size = 96) {
  const value = usernameOrId?.trim() || "Steve";
  return `https://mc-heads.net/body/${encodeURIComponent(value)}/${size}`;
}

function valueNumber(value: unknown, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function normalizePackage(pkg: RawPackage, categorySlug: string): StoreProduct {
  const id = valueNumber(pkg.id);
  const name = String(pkg.name ?? "Package");
  const totalPrice = valueNumber(pkg.total_price);
  const basePrice = valueNumber(pkg.base_price);
  const salesTax = valueNumber(pkg.sales_tax);
  const salePercent = valueNumber(pkg.discount) || undefined;
  const discount = valueNumber(pkg.discount);
  const originalPrice = salePercent && salePercent < 100
    ? Number((totalPrice / (1 - salePercent / 100)).toFixed(2))
    : undefined;
  const image = String(pkg.image ?? "") || "/rank-vip.svg";
  const currency = String(pkg.currency ?? "EUR");
  const rawUserLimit = valueNumber(pkg.user_limit?.limit, 0) || undefined;
  const isRank = categorySlug.includes("rank");
  const quantityLimit = pkg.disable_quantity || isRank ? 1 : undefined;
  const userLimit = rawUserLimit ?? (isRank ? 1 : undefined);
  const parsed = parseDescription(String(pkg.description ?? "Package delivered automatically after checkout."));

  return {
    id,
    name,
    totalPrice,
    basePrice,
    salesTax,
    discount,
    // TODO: originalPrice,
    currency,
    image,
    categorySlug,
    description: parsed.plainDescription,
    descriptionHtml: parsed.descriptionHtml,
    detailsHtml: parsed.detailsHtml,
    quantityLimit,
    userLimit,
    salePercent,
    features:
      parsed.features.length > 0
        ? parsed.features
        : [],
  };
}

function normalizeCategory(category: RawCategory): StoreCategory {
  const name = String(category.name);
  const slug = slugify(name);
  const icon = slug.includes("crate") ? "box" : slug.includes("rank") ? "crown" : "newspaper";

  return {
    id: valueNumber(category.id),
    name,
    slug,
    description: stripTags(String(category.description ?? `Browse ${name}.`)),
    icon,
    packages: category.packages!.map((pkg) => normalizePackage(pkg, slug)),
  };
}

export async function getStorefront(): Promise<StorefrontData> {
  "use cache";
  cacheLife("minutes");

  const [result, sidebar] = await Promise.all([
    tebexFetch<TebexEnvelope<RawCategory[]>>(`/accounts/${token}/categories?includePackages=1`),
    getSidebarData(),
  ]);
  const categories = result.data.map(normalizeCategory);
  return {
    categories,
    sidebar,
    currency: categories[0]?.packages[0]?.currency ?? "EUR",
  };
}

async function getSidebarData(): Promise<SidebarData> {
  const result = await tebexFetch<TebexEnvelope<RawSidebarModule[]>>(`/accounts/${token}/sidebar`);
  return {
    modules: result.data.map(normalizeSidebarModule).filter((module): module is SidebarModule => Boolean(module)),
  };
}

function normalizeSidebarModule(module: RawSidebarModule): SidebarModule | null {
  const data = module.data ?? {};
  const type = String(module.type ?? data.type ?? "").toLowerCase();
  const id = String(module.id ?? `${type}-${Math.random().toString(36).slice(2)}`);
  const header = String(data.header ?? data.title ?? type.replace(/_/g, " "));

  if (type === "top_customer") {
    const username = String(data.username ?? data.name ?? "Top Customer");
    const usernameId = String(data.username_id ?? data.uuid ?? username);
    return {
      id,
      type,
      header: header || "Top Customer",
      username,
      usernameId,
      avatar: minecraftBody(usernameId || username, 96),
      total: valueNumber(data.total, 0) || undefined,
    };
  }

  if (type === "recent_payments") {
    const rawPayments = Array.isArray(data.payments)
      ? data.payments
      : Array.isArray(data.recent_payments)
        ? data.recent_payments
        : [];
    return {
      id,
      type,
      header: header || "Recent Payments",
      payments: rawPayments.map((payment) => {
        const item = payment as Record<string, unknown>;
        const username = String(item.username ?? item.name ?? "Player");
        const usernameId = String(item.username_id ?? item.uuid ?? username);
        return {
          username,
          usernameId,
          avatar: minecraftAvatar(usernameId || username, 48),
          amount: valueNumber(item.amount ?? item.total, 0) || undefined,
        };
      }),
    };
  }

  if (type === "textbox") {
    return {
      id,
      type,
      header: header || "Information",
      html: cleanHtml(String(data.text ?? data.html ?? data.content ?? "")),
    };
  }

  if (type === "featured_package") {
    const pkg = (data.package ?? data.featured_package ?? data) as Record<string, unknown>;
    return {
      id,
      type,
      header: header || "Featured Package",
      packageId: valueNumber(pkg.id ?? pkg.package_id, 0) || undefined,
      name: String(pkg.name ?? data.name ?? "Featured Package"),
      image: String(pkg.image ?? pkg.image_url ?? "") || undefined,
      price: valueNumber(pkg.price ?? pkg.total_price, 0) || undefined,
      currency: String(pkg.currency ?? "EUR"),
    };
  }

  if (type === "giftcard_balance") {
    return { id, type, header: header || "Giftcard Balance" };
  }

  if (type === "server_status") {
    return {
      id,
      type,
      header: header || "Server Status",
      online: Boolean(data.online ?? data.status === "online"),
      players: valueNumber(data.players ?? data.online_players, 0) || undefined,
      maxPlayers: valueNumber(data.max_players, 0) || undefined,
    };
  }

  if (type === "payment_goal" || type === "community_goal") {
    return {
      id,
      type,
      header: header || (type === "payment_goal" ? "Payment Goal" : "Community Goal"),
      current: valueNumber(data.current ?? data.progress ?? data.amount, 0),
      target: valueNumber(data.target ?? data.goal, 0),
      description: String(data.description ?? ""),
    };
  }

  return null;
}

export async function getBasket(ident?: string | null): Promise<CartState> {
  if (!ident) return createEmptyCart();

  try {
    const result = await tebexFetch<TebexEnvelope<RawBasket>>(
      `/accounts/${token}/baskets/${ident}`,
      undefined,
      "no-store"
    );

    return enrichCartPrices(normalizeBasket(result.data));
  } catch (error) {
    if (isMissingBasket(error)) return createEmptyCart();
    throw error;
  }
}

export async function createBasket(username?: string) {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3000";
  const proto = requestHeaders.get("x-forwarded-proto") ?? "http";
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? `${proto}://${host}`;

  const result = await tebexFetch<TebexEnvelope<RawBasket>>(
    `/accounts/${token}/baskets`,
    {
      method: "POST",
      body: JSON.stringify({
        complete_url: `${origin}/thank-you`,
        cancel_url: origin,
        complete_auto_redirect: true,
        ...(username ? { username } : {}),
      }),
    },
    "no-store"
  );

  return normalizeBasket(result.data);
}

async function getMinecraftUsernameId(username: string) {
  const response = await fetch(`https://api.mojang.com/users/profiles/minecraft/${encodeURIComponent(username)}`, {
    cache: "no-store",
    headers: { Accept: "application/json" },
  });
  if (!response.ok) return null;
  const profile = (await response.json().catch(() => null)) as { id?: unknown } | null;
  return typeof profile?.id === "string" && profile.id ? profile.id : null;
}

async function packageAddPayload(productId: number, quantity: number, giftUsername?: string, useUsernameFallback = false) {
  const payload: Record<string, unknown> = {
    package_id: String(productId),
    quantity,
  };

  if (!giftUsername) return payload;

  const targetUsernameId = useUsernameFallback ? null : await getMinecraftUsernameId(giftUsername);
  if (targetUsernameId) {
    payload.target_username_id = targetUsernameId;
  } else {
    payload.target_username = giftUsername;
  }

  return payload;
}

async function postPackageToBasket(basketIdent: string, productId: number, quantity: number, giftUsername?: string) {
  const initialPayload = await packageAddPayload(productId, quantity, giftUsername);
  try {
    await tebexFetch(
      `/baskets/${basketIdent}/packages`,
      {
        method: "POST",
        body: JSON.stringify(initialPayload),
      },
      "no-store"
    );
  } catch (error) {
    if (!giftUsername || !(error instanceof TebexError) || error.status !== 400 || !("target_username_id" in initialPayload)) {
      throw error;
    }
    await tebexFetch(
      `/baskets/${basketIdent}/packages`,
      {
        method: "POST",
        body: JSON.stringify(await packageAddPayload(productId, quantity, giftUsername, true)),
      },
      "no-store"
    );
  }
}

export async function addPackage(productId: number, quantity: number, username?: string, giftUsername?: string) {
  const cookieStore = await cookies();
  const ident = cookieStore.get("basket_ident")?.value;

  const basket = ident ? await getBasket(ident) : await createBasket(username);
  const activeBasket = basket.ident ? basket : await createBasket(username);

  try {
    await postPackageToBasket(activeBasket.ident!, productId, quantity, giftUsername);
    return getBasket(activeBasket.ident);
  } catch (error) {
    if (!isMissingBasket(error)) throw error;
    const freshBasket = await createBasket(username);
    await postPackageToBasket(freshBasket.ident!, productId, quantity, giftUsername);
    return getBasket(freshBasket.ident);
  }
}

export async function updatePackageQuantity(productId: number, quantity: number) {
  const cookieStore = await cookies();
  const ident = cookieStore.get("basket_ident")?.value;
  if (!ident) return createEmptyCart();

  await tebexFetch(`/baskets/${ident}/packages/${productId}`, {
    method: "PUT",
    body: JSON.stringify({ quantity }),
  }, "no-store");
  return getBasket(ident);
}

export async function removePackage(productId: number) {
  const cookieStore = await cookies();
  const ident = cookieStore.get("basket_ident")?.value;
  if (!ident) return createEmptyCart();

  await tebexFetch(`/baskets/${ident}/packages/remove`, {
    method: "POST",
    body: JSON.stringify({ package_id: String(productId) }),
  }, "no-store");
  return getBasket(ident);
}

export async function applyDiscount(kind: "coupon" | "giftcard" | "creator", code: string) {
  const cookieStore = await cookies();
  const ident = cookieStore.get("basket_ident")?.value;
  if (!ident) throw new Error("Your basket is empty.");

  const endpoints = {
    coupon: "coupons",
    giftcard: "giftcards",
    creator: "creator-codes",
  } as const;
  const payload = kind === "creator" ? { creator_code: code } : { [kind === "coupon" ? "coupon_code" : "card_number"]: code };

  await tebexFetch(`/accounts/${token}/baskets/${ident}/${endpoints[kind]}`, {
    method: "POST",
    body: JSON.stringify(payload),
  }, "no-store");
  return getBasket(ident);
}

export async function getBasketAuth(ident: string) {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3000";
  const proto = requestHeaders.get("x-forwarded-proto") ?? "http";
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? `${proto}://${host}`;
  const auth = await tebexFetch<{ name?: string; url?: string }[]>(
    `/accounts/${token}/baskets/${ident}/auth?returnUrl=${encodeURIComponent(origin)}`,
    undefined,
    "no-store"
  );
  return auth[0]?.url ?? null;
}

export function normalizeBasket(basket: RawBasket): CartState {
  const lines = (basket.packages ?? []).map((pkg) => {
    return {
      packageId: valueNumber(pkg.id),
      name: String(pkg.name ?? "Package"),
      quantity: Math.max(1, valueNumber(pkg.qty, 1)),
      unitPrice: valueNumber(pkg.base_price),
      image: String(pkg.image ?? "") || "/rank-vip.svg",
      quantityLimit: pkg.disable_quantity ? 1 : undefined,
      userLimit: valueNumber(pkg.user_limit?.limit, 0) || undefined,
    };
  });

  const computedBasePrice = Number(lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0).toFixed(2));
  const basePrice = valueNumber(basket.base_price, computedBasePrice) || computedBasePrice;
  const salesTax = valueNumber(basket.sales_tax, 0);
  const totalPrice = valueNumber(basket.total_price, Number((basePrice + salesTax).toFixed(2))) || Number((basePrice + salesTax).toFixed(2));

  return {
    ident: basket.ident ?? null,
    lines,
    coupons: (basket.coupons ?? []).map((coupon) => coupon.coupon_code ?? "").filter(Boolean),
    giftcards: (basket.giftcards ?? []).map((giftcard) => giftcard.card_number ?? "").filter(Boolean),
    creatorCode: String(basket.creator_code ?? "") || null,
    basePrice,
    salesTax,
    totalPrice,
    currency: String(basket.currency ?? "EUR"),
    checkoutUrl: basket.links?.checkout ?? null,
  };
}

async function enrichCartPrices(cart: CartState): Promise<CartState> {
  if (cart.lines.length === 0) return cart;
  try {
    const storefront = await getStorefront();
    const products = new Map(
      storefront.categories.flatMap((category) => category.packages).map((product) => [product.id, product])
    );
    const lines = cart.lines.map((line) => {
      const product = products.get(line.packageId);
      return product
        ? {
            ...line,
            name: product.name,
            unitPrice: product.totalPrice,
            image: product.image,
            quantityLimit: product.quantityLimit,
            userLimit: product.userLimit,
          }
        : line;
    });
    return {
      ...cart,
      lines,
    };
  } catch {
    return cart;
  }
}

export async function getMinecraftServerStatus(hostname = "play.mikart.eu"): Promise<ServerStatus> {
  try {
    const response = await fetch(`https://api.mcstatus.io/v2/status/java/${encodeURIComponent(hostname)}`, {
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
    if (!response.ok) throw new Error("Server status request failed");
    const data = (await response.json()) as {
      online?: boolean;
      players?: { online?: number; max?: number };
    };
    return {
      online: Boolean(data.online),
      players: valueNumber(data.players?.online, 0),
      maxPlayers: valueNumber(data.players?.max, 0) || undefined,
    };
  } catch {
    return { online: false, players: 0 };
  }
}
