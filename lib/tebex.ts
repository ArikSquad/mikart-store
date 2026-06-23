import { cacheLife } from "next/cache";
import { cookies, headers } from "next/headers";
import sanitizeHtml from "sanitize-html";
import { demoStorefront, createDemoCart, findDemoProduct } from "@/lib/demo-store";
import type { CartLine, CartState, SidebarData, SidebarModule, StoreCategory, StorefrontData, StoreProduct } from "@/lib/types";
import { slugify } from "@/lib/utils";

const API_BASE = "https://headless.tebex.io/api";
const token = process.env.TEBEX_PUBLIC_TOKEN;

type TebexEnvelope<T> = { data: T };
type RawPackage = Record<string, unknown>;
type RawCategory = Record<string, unknown> & { packages?: RawPackage[] };
type RawBasket = Record<string, unknown> & {
  ident?: string;
  packages?: RawPackage[];
  coupons?: { coupon_code?: string }[];
  giftcards?: { card_number?: string }[];
  links?: { checkout?: string; payment?: string };
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

function isConfigured() {
  return Boolean(token);
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
    const message = await response.text();
    throw new TebexError(response.status, `Tebex ${response.status}: ${message}`);
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
  const id = valueNumber(pkg.id ?? pkg.package_id);
  const name = String(pkg.name ?? "Package");
  const price =
    valueNumber(pkg.total_price) ||
    valueNumber(pkg.price) ||
    valueNumber((pkg as { base_price?: unknown }).base_price);
  const image = String(pkg.image ?? (pkg as { image_url?: unknown }).image_url ?? "") || "/rank-vip.svg";
  const currency = String(pkg.currency ?? "EUR");
  const rawQuantityLimit = valueNumber((pkg as { limit?: unknown }).limit, 0) || undefined;
  const rawUserLimit = valueNumber((pkg as { user_limit?: unknown }).user_limit, 0) || undefined;
  const isRank = categorySlug.includes("rank");
  const quantityLimit = rawQuantityLimit ?? (isRank ? 1 : undefined);
  const userLimit = rawUserLimit ?? (isRank ? 1 : undefined);
  const parsed = parseDescription(String(pkg.description ?? "Package delivered automatically after checkout."));

  return {
    id,
    name,
    price,
    currency,
    image,
    categorySlug,
    description: parsed.plainDescription,
    descriptionHtml: parsed.descriptionHtml,
    detailsHtml: parsed.detailsHtml,
    quantityLimit,
    userLimit,
    features:
      parsed.features.length > 0
        ? parsed.features
        : [],
  };
}

function normalizeCategory(category: RawCategory): StoreCategory {
  const name = String(category.name ?? "Category");
  const slug = slugify(name);
  const icon = slug.includes("crate") ? "box" : slug.includes("rank") ? "crown" : "newspaper";

  return {
    id: valueNumber(category.id),
    name,
    slug,
    description: stripTags(String(category.description ?? `Browse ${name}.`)),
    icon,
    products: (category.packages ?? []).map((pkg) => normalizePackage(pkg, slug)),
  };
}

export async function getStorefront(): Promise<StorefrontData> {
  "use cache";
  cacheLife("minutes");

  if (!isConfigured()) return demoStorefront;

  try {
    const [result, sidebar] = await Promise.all([
      tebexFetch<TebexEnvelope<RawCategory[]>>(`/accounts/${token}/categories?includePackages=1`),
      getSidebarData(),
    ]);
    const categories = result.data.map(normalizeCategory);
    return {
      categories: [
        demoStorefront.categories[0],
        ...categories
      ],
      sidebar,
      currency: categories[0]?.products[0]?.currency ?? "EUR",
    };
  } catch {
    return demoStorefront;
  }
}

async function getSidebarData(): Promise<SidebarData> {
  if (!isConfigured()) return demoStorefront.sidebar;

  try {
    const result = await tebexFetch<TebexEnvelope<RawSidebarModule[]>>(`/accounts/${token}/sidebar`);
    const modules = result.data.map(normalizeSidebarModule).filter((module): module is SidebarModule => Boolean(module));
    const topCustomer = modules.find((module) => module.type === "top_customer");
    const recentPayments = modules.find((module) => module.type === "recent_payments");

    return {
      modules: modules.length > 0 ? modules : demoStorefront.sidebar.modules,
      topCustomer:
        topCustomer?.type === "top_customer"
          ? {
              name: topCustomer.username,
              caption: topCustomer.total ? `Paid ${topCustomer.total} this year.` : "Paid the most this year.",
              avatar: minecraftBody(topCustomer.usernameId ?? topCustomer.username, 96),
            }
          : demoStorefront.sidebar.topCustomer,
      recentPayments:
        recentPayments?.type === "recent_payments"
          ? recentPayments.payments.map((payment) => ({
              name: payment.username,
              avatar: minecraftAvatar(payment.usernameId ?? payment.username, 48),
            }))
          : demoStorefront.sidebar.recentPayments,
    };
  } catch {
    return demoStorefront.sidebar;
  }
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
  if (!isConfigured() || !ident || ident === "demo-basket") return createDemoCart();

  try {
    const result = await tebexFetch<TebexEnvelope<RawBasket>>(
      `/accounts/${token}/baskets/${ident}`,
      undefined,
      "no-store"
    );
    return normalizeBasket(result.data);
  } catch (error) {
    if (isMissingBasket(error)) return createDemoCart();
    throw error;
  }
}

export async function createBasket(username?: string) {
  if (!isConfigured()) return createDemoCart();

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

export async function addPackage(productId: number, quantity: number, username?: string) {
  const cookieStore = await cookies();
  const ident = cookieStore.get("basket_ident")?.value;

  if (!isConfigured()) {
    const product = findDemoProduct(productId);
    if (!product) return createDemoCart();
    const line: CartLine = {
      packageId: product.id,
      name: product.name,
      quantity: product.userLimit === 1 ? 1 : Math.min(quantity, product.quantityLimit ?? 99),
      unitPrice: product.price,
      image: product.image,
      quantityLimit: product.quantityLimit,
      userLimit: product.userLimit,
    };
    return createDemoCart([line]);
  }

  const basket = ident ? await getBasket(ident) : await createBasket(username);
  const activeBasket = basket.ident ? basket : await createBasket(username);

  try {
    await tebexFetch(
      `/baskets/${activeBasket.ident}/packages`,
      {
        method: "POST",
        body: JSON.stringify({ package_id: String(productId), quantity }),
      },
      "no-store"
    );
    return getBasket(activeBasket.ident);
  } catch (error) {
    if (!isMissingBasket(error)) throw error;
    const freshBasket = await createBasket(username);
    await tebexFetch(
      `/baskets/${freshBasket.ident}/packages`,
      {
        method: "POST",
        body: JSON.stringify({ package_id: String(productId), quantity }),
      },
      "no-store"
    );
    return getBasket(freshBasket.ident);
  }
}

export async function removePackage(productId: number) {
  const cookieStore = await cookies();
  const ident = cookieStore.get("basket_ident")?.value;
  if (!isConfigured() || !ident) return createDemoCart();

  await tebexFetch(`/baskets/${ident}/packages/remove`, {
    method: "POST",
    body: JSON.stringify({ package_id: String(productId) }),
  }, "no-store");
  return getBasket(ident);
}

export async function applyDiscount(kind: "coupon" | "giftcard" | "creator", code: string) {
  const cookieStore = await cookies();
  const ident = cookieStore.get("basket_ident")?.value;
  if (!isConfigured() || !ident) {
    const cart = createDemoCart();
    if (kind === "creator") cart.creatorCode = code;
    if (kind === "coupon") cart.coupons = [code];
    if (kind === "giftcard") cart.giftcards = [code];
    return cart;
  }

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
  if (!isConfigured()) return null;
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
  const lines = (basket.packages ?? []).map((pkg) => ({
    packageId: valueNumber(pkg.id ?? pkg.package_id),
    name: String(pkg.name ?? "Package"),
    quantity: valueNumber(pkg.qty ?? pkg.quantity, 1),
    unitPrice: valueNumber(pkg.price ?? pkg.base_price ?? pkg.total_price),
    image: String(pkg.image ?? "/rank-vip.svg"),
  }));

  return {
    ident: basket.ident ?? null,
    lines,
    coupons: (basket.coupons ?? []).map((coupon) => coupon.coupon_code ?? "").filter(Boolean),
    giftcards: (basket.giftcards ?? []).map((giftcard) => giftcard.card_number ?? "").filter(Boolean),
    creatorCode: String(basket.creator_code ?? "") || null,
    basePrice: valueNumber(basket.base_price),
    salesTax: valueNumber(basket.sales_tax),
    totalPrice: valueNumber(basket.total_price),
    currency: String(basket.currency ?? "EUR"),
    checkoutUrl: basket.links?.checkout ?? null,
    demo: false,
  };
}
