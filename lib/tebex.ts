import { getCookie, getRequest } from "@tanstack/react-start/server";
import { createEmptyBasket, MAX_CART_QUANTITY, type DiscountKind } from "@/lib/cart";
import { basketSchema, categorySchema, moduleSchema } from "@/lib/schemas";
import type {
  Basket,
  MinecraftServerStatus,
  Storefront,
} from "@/lib/types";
import { isRecord, normalizeString, parsePositiveInteger, sameMinecraftUsername } from "@/lib/validation";

const TEBEX_API_BASE = "https://headless.tebex.io/api";
const MINECRAFT_STATUS_API_BASE = "https://api.mcstatus.io/v2/status/java";
const DEFAULT_SERVER_HOST = "play.mikart.eu";
const TEBEX_REQUEST_TIMEOUT_MS = 10_000;
const EXTERNAL_REQUEST_TIMEOUT_MS = 5_000;
const STOREFRONT_CACHE_TTL_MS = 60_000;

type TebexCacheMode = "force-cache" | "no-store";

type PackageAddPayload = {
  package_id: string;
  quantity: number;
  target_username_id?: string;
  target_username?: string;
};

type DiscountPayload =
  | { coupon_code: string }
  | { card_number: string }
  | { creator_code: string };

const DISCOUNT_ENDPOINTS: Record<DiscountKind, string> = {
  coupon: "coupons",
  giftcard: "giftcards",
  creator: "creator-codes",
};

let storefrontCache: { data: Storefront; expiresAt: number } | null = null;
let storefrontRequest: Promise<Storefront> | null = null;

export class TebexError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message);
    this.name = "TebexError";
  }
}

function getTebexToken(): string {
  const token = process.env.TEBEX_PUBLIC_TOKEN?.trim();
  if (!token) throw new Error("TEBEX_PUBLIC_TOKEN is not configured");
  return token;
}

async function tebexFetch(
  path: string,
  init?: RequestInit,
  cache: TebexCacheMode = "force-cache"
): Promise<unknown> {
  const requestHeaders = new Headers(init?.headers);
  requestHeaders.set("Accept", "application/json");
  if (init?.body !== undefined && !requestHeaders.has("Content-Type")) {
    requestHeaders.set("Content-Type", "application/json");
  }

  const response = await fetch(`${TEBEX_API_BASE}${path}`, {
    ...init,
    cache,
    signal: init?.signal ?? AbortSignal.timeout(TEBEX_REQUEST_TIMEOUT_MS),
    headers: requestHeaders,
  });
  const body = await readResponseBody(response);

  if (!response.ok) {
    const details = getTebexErrorDetails(body);
    throw new TebexError(response.status, `Tebex ${response.status}: ${details || "Request failed"}`);
  }

  return body;
}

async function readResponseBody(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;

  try {
    const body: unknown = JSON.parse(text);
    return body;
  } catch {
    return text;
  }
}

function getTebexErrorDetails(body: unknown): string {
  if (!isRecord(body)) return "";

  return [body.title, body.detail, body.message, body.error]
    .map((value) => {
      if (typeof value === "string" && value.trim()) return value.trim();
      return typeof value === "number" ? String(value) : null;
    })
    .filter((value): value is string => value !== null)
    .join(": ");
}

function isMissingBasket(error: unknown): error is TebexError {
  return error instanceof TebexError && error.status === 404;
}

function accountPath(path: string): string {
  return `/accounts/${encodeURIComponent(getTebexToken())}${path}`;
}

function basketPath(ident: string, path = ""): string {
  return `/baskets/${encodeURIComponent(ident)}${path}`;
}

function accountBasketPath(ident: string, path = ""): string {
  return accountPath(basketPath(ident, path));
}

function getCurrentBasketIdent(): string | null {
  const ident = getCookie("basket_ident");
  return normalizeString(ident) || null;
}

function requireBasketIdent(basket: Basket): Basket {
  if (!isRecord(basket) || typeof basket.ident !== "string" || !basket.ident) {
    throw new TebexError(502, "Tebex returned a basket without an identifier.");
  }

  return basket;
}

function parseBasketResponse(body: unknown): Basket {
  if (!isRecord(body)) {
    throw new TebexError(502, "Tebex returned an invalid basket.");
  }
  const result = basketSchema.safeParse(body.data);
  if (!result.success) throw new TebexError(502, "Tebex returned an invalid basket.");
  return result.data;
}

export async function getStorefront(): Promise<Storefront> {
  if (storefrontCache && storefrontCache.expiresAt > Date.now()) {
    return storefrontCache.data;
  }
  if (storefrontRequest) return storefrontRequest;

  const request = loadStorefront()
    .then((data) => {
      storefrontCache = { data, expiresAt: Date.now() + STOREFRONT_CACHE_TTL_MS };
      return data;
    })
    .finally(() => {
      storefrontRequest = null;
    });
  storefrontRequest = request;
  return request;
}

async function loadStorefront(): Promise<Storefront> {
  const [categoriesBody, sidebarBody] = await Promise.all([
    tebexFetch(accountPath("/categories?includePackages=1")),
    tebexFetch(accountPath("/sidebar")),
  ]);

  const categories = isRecord(categoriesBody)
    ? categorySchema.array().safeParse(categoriesBody.data)
    : null;
  const modules = isRecord(sidebarBody) ? moduleSchema.array().safeParse(sidebarBody.data) : null;
  if (!categories?.success || !modules?.success) {
    throw new TebexError(502, "Tebex returned an invalid storefront.");
  }

  return {
    categories: categories.data,
    modules: modules.data,
    currency: categories.data[0]?.packages?.[0]?.currency ?? "EUR",
  };
}

export async function getBasket(ident?: string | null): Promise<Basket> {
  const normalizedIdent = normalizeString(ident);
  if (!normalizedIdent) return createEmptyBasket();

  try {
    const result = await tebexFetch(
      accountBasketPath(normalizedIdent),
      undefined,
      "no-store"
    );
    const basket = parseBasketResponse(result);

    return basket.complete ? createEmptyBasket() : basket;
  } catch (error) {
    if (isMissingBasket(error)) return createEmptyBasket();
    throw error;
  }
}

export async function createBasket(username?: string): Promise<Basket> {
  const origin = getSiteOrigin();
  const normalizedUsername = normalizeString(username);

  const result = await tebexFetch(
    accountPath("/baskets"),
    {
      method: "POST",
      body: JSON.stringify({
        complete_url: `${origin}/thank-you`,
        cancel_url: origin,
        complete_auto_redirect: true,
        ...(normalizedUsername ? { username: normalizedUsername } : {}),
      }),
    },
    "no-store"
  );

  return requireBasketIdent(parseBasketResponse(result));
}

function getSiteOrigin(): string {
  const configuredUrl = process.env.PUBLIC_SITE_URL?.trim();
  if (configuredUrl) {
    try {
      const configuredOrigin = new URL(configuredUrl);
      if (configuredOrigin.protocol === "http:" || configuredOrigin.protocol === "https:") {
        return configuredOrigin.origin;
      }
    } catch {
      // Fall back to the request origin when the optional override is invalid.
    }
  }

  try {
    return new URL(getRequest().url).origin;
  } catch {
    return "http://localhost:3000";
  }
}

async function getMinecraftUsernameId(username: string): Promise<string | null> {
  try {
    const response = await fetch(
      `https://api.mojang.com/users/profiles/minecraft/${encodeURIComponent(username)}`,
      {
        cache: "no-store",
        signal: AbortSignal.timeout(EXTERNAL_REQUEST_TIMEOUT_MS),
        headers: { Accept: "application/json" },
      }
    );
    if (!response.ok) return null;

    const profile: unknown = await response.json().catch(() => null);
    if (!isRecord(profile) || typeof profile.id !== "string" || !profile.id) return null;
    return profile.id;
  } catch {
    return null;
  }
}

function validatePackageRequest(productId: number, quantity: number): void {
  if (parsePositiveInteger(productId) === null) {
    throw new TebexError(400, "packageId must be a positive integer.");
  }

  if (parsePositiveInteger(quantity, MAX_CART_QUANTITY) === null) {
    throw new TebexError(400, `quantity must be an integer between 1 and ${MAX_CART_QUANTITY}.`);
  }
}

async function createPackageAddPayload(
  productId: number,
  quantity: number,
  giftUsername?: string,
  useUsernameFallback = false
): Promise<PackageAddPayload> {
  const payload: PackageAddPayload = {
    package_id: String(productId),
    quantity,
  };

  const normalizedGiftUsername = normalizeString(giftUsername);
  if (!normalizedGiftUsername) return payload;

  const targetUsernameId = useUsernameFallback ? null : await getMinecraftUsernameId(normalizedGiftUsername);
  if (targetUsernameId) {
    payload.target_username_id = targetUsernameId;
  } else {
    payload.target_username = normalizedGiftUsername;
  }

  return payload;
}

async function postPackageToBasket(
  basketIdent: string,
  productId: number,
  quantity: number,
  giftUsername?: string
): Promise<void> {
  const initialPayload = await createPackageAddPayload(productId, quantity, giftUsername);

  try {
    await tebexFetch(
      basketPath(basketIdent, "/packages"),
      {
        method: "POST",
        body: JSON.stringify(initialPayload),
      },
      "no-store"
    );
  } catch (error) {
    const canRetryWithUsername =
      Boolean(giftUsername) &&
      error instanceof TebexError &&
      error.status === 400 &&
      "target_username_id" in initialPayload;

    if (!canRetryWithUsername) throw error;

    await tebexFetch(
      basketPath(basketIdent, "/packages"),
      {
        method: "POST",
        body: JSON.stringify(await createPackageAddPayload(productId, quantity, giftUsername, true)),
      },
      "no-store"
    );
  }
}

export async function addPackage(
  productId: number,
  quantity: number,
  username?: string,
  giftUsername?: string
): Promise<Basket> {
  validatePackageRequest(productId, quantity);

  const normalizedUsername = normalizeString(username);
  const basketIdent = getCurrentBasketIdent();
  const basket = basketIdent ? await getBasket(basketIdent) : await createBasket(normalizedUsername || undefined);
  const basketMatchesUsername =
    !basket.username || !normalizedUsername || sameMinecraftUsername(basket.username, normalizedUsername);
  const activeBasket =
    basket.ident && basketMatchesUsername ? basket : await createBasket(normalizedUsername || undefined);

  try {
    await postPackageToBasket(activeBasket.ident, productId, quantity, giftUsername);
    return await getBasket(activeBasket.ident);
  } catch (error) {
    if (!isMissingBasket(error)) throw error;

    const freshBasket = await createBasket(normalizedUsername || undefined);
    await postPackageToBasket(freshBasket.ident, productId, quantity, giftUsername);
    return await getBasket(freshBasket.ident);
  }
}

export async function updatePackageQuantity(productId: number, quantity: number): Promise<Basket> {
  validatePackageRequest(productId, quantity);

  const ident = getCurrentBasketIdent();
  if (!ident) return createEmptyBasket();

  await tebexFetch(
    basketPath(ident, `/packages/${encodeURIComponent(String(productId))}`),
    {
      method: "PUT",
      body: JSON.stringify({ quantity }),
    },
    "no-store"
  );
  return await getBasket(ident);
}

export async function removePackage(productId: number): Promise<Basket> {
  if (parsePositiveInteger(productId) === null) {
    throw new TebexError(400, "packageId must be a positive integer.");
  }

  const ident = getCurrentBasketIdent();
  if (!ident) return createEmptyBasket();

  await tebexFetch(
    basketPath(ident, "/packages/remove"),
    {
      method: "POST",
      body: JSON.stringify({ package_id: String(productId) }),
    },
    "no-store"
  );
  return await getBasket(ident);
}

function createDiscountPayload(kind: DiscountKind, code: string): DiscountPayload {
  switch (kind) {
    case "coupon":
      return { coupon_code: code };
    case "giftcard":
      return { card_number: code };
    case "creator":
      return { creator_code: code };
  }
}

export async function applyDiscount(kind: DiscountKind, code: string): Promise<Basket> {
  const ident = getCurrentBasketIdent();
  if (!ident) throw new TebexError(400, "Your basket is empty.");

  const normalizedCode = normalizeString(code);
  if (!normalizedCode) throw new TebexError(400, "A discount code is required.");

  await tebexFetch(
    accountBasketPath(ident, `/${DISCOUNT_ENDPOINTS[kind]}`),
    {
      method: "POST",
      body: JSON.stringify(createDiscountPayload(kind, normalizedCode)),
    },
    "no-store"
  );
  return await getBasket(ident);
}

export async function getBasketAuth(ident: string): Promise<string | null> {
  const normalizedIdent = normalizeString(ident);
  if (!normalizedIdent) throw new TebexError(400, "A basket is required for checkout.");

  const origin = getSiteOrigin();
  const auth = await tebexFetch(
    accountBasketPath(normalizedIdent, `/auth?returnUrl=${encodeURIComponent(origin)}`),
    undefined,
    "no-store"
  );
  const firstAuthUrl: unknown = Array.isArray(auth) ? auth[0] : null;
  return isRecord(firstAuthUrl) && typeof firstAuthUrl.url === "string" ? firstAuthUrl.url : null;
}

export async function getMinecraftServerStatus(
  hostname = DEFAULT_SERVER_HOST
): Promise<MinecraftServerStatus> {
  try {
    const response = await fetch(`${MINECRAFT_STATUS_API_BASE}/${encodeURIComponent(hostname)}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(EXTERNAL_REQUEST_TIMEOUT_MS),
      headers: { Accept: "application/json" },
    });
    if (!response.ok) throw new Error("Server status request failed");

    const data: unknown = await response.json();
    const players = isRecord(data) && isRecord(data.players) ? data.players : null;

    const maxPlayers = toOptionalNonNegativeNumber(players?.max);
    return {
      online: isRecord(data) && data.online === true,
      players: toNonNegativeNumber(players?.online),
      ...(maxPlayers === undefined ? {} : { max_players: maxPlayers }),
    };
  } catch {
    return { online: false, players: 0 };
  }
}

function toNonNegativeNumber(value: unknown): number {
  const number = toOptionalNonNegativeNumber(value);
  return number ?? 0;
}

function toOptionalNonNegativeNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : undefined;
}
