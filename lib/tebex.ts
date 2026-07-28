import { cacheLife } from "next/cache";
import { cookies, headers } from "next/headers";
import { createEmptyBasket } from "@/lib/cart";
import type {
  AuthUrl,
  Basket,
  Category,
  Data,
  MinecraftServerStatus,
  Module,
  Storefront,
} from "@/lib/types";

const API_BASE = "https://headless.tebex.io/api";
const token = process.env.TEBEX_PUBLIC_TOKEN;

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

export async function getStorefront(): Promise<Storefront> {
  "use cache";
  cacheLife("minutes");

  const [result, sidebar] = await Promise.all([
    tebexFetch<Data<Category[]>>(`/accounts/${token}/categories?includePackages=1`),
    tebexFetch<Data<Module[]>>(`/accounts/${token}/sidebar`),
  ]);
  return {
    categories: result.data,
    modules: sidebar.data,
    currency: result.data[0]?.packages?.[0]?.currency ?? "EUR",
  };
}

export async function getBasket(ident?: string | null): Promise<Basket> {
  if (!ident) return createEmptyBasket();

  try {
    const result = await tebexFetch<Data<Basket>>(
      `/accounts/${token}/baskets/${ident}`,
      undefined,
      "no-store"
    );

    return result.data;
  } catch (error) {
    if (isMissingBasket(error)) return createEmptyBasket();
    throw error;
  }
}

export async function createBasket(username?: string) {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3000";
  const proto = requestHeaders.get("x-forwarded-proto") ?? "http";
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? `${proto}://${host}`;

  const result = await tebexFetch<Data<Basket>>(
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

  return result.data;
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
  if (!ident) return createEmptyBasket();

  await tebexFetch(`/baskets/${ident}/packages/${productId}`, {
    method: "PUT",
    body: JSON.stringify({ quantity }),
  }, "no-store");
  return getBasket(ident);
}

export async function removePackage(productId: number) {
  const cookieStore = await cookies();
  const ident = cookieStore.get("basket_ident")?.value;
  if (!ident) return createEmptyBasket();

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
  const auth = await tebexFetch<AuthUrl[]>(
    `/accounts/${token}/baskets/${ident}/auth?returnUrl=${encodeURIComponent(origin)}`,
    undefined,
    "no-store"
  );
  return auth[0]?.url ?? null;
}

export async function getMinecraftServerStatus(hostname = "play.mikart.eu"): Promise<MinecraftServerStatus> {
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
      players: data.players?.online ?? 0,
      max_players: data.players?.max || undefined,
    };
  } catch {
    return { online: false, players: 0 };
  }
}
