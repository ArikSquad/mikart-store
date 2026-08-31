import { createServerFn } from "@tanstack/react-start";
import { getCookie, setCookie } from "@tanstack/react-start/server";
import { z } from "zod";
import { createEmptyBasket, DISCOUNT_KINDS, MAX_CART_QUANTITY } from "@/lib/cart";
import {
  addPackage,
  applyDiscount,
  getBasket,
  getBasketAuth,
  getMinecraftServerStatus,
  getStorefront,
  removePackage,
  updatePackageQuantity,
} from "@/lib/tebex";
import { isMinecraftUsername, normalizeString, sameMinecraftUsername } from "@/lib/validation";

const minecraftUsernameSchema = z
  .string()
  .trim()
  .regex(/^[A-Za-z0-9_]{3,16}$/, "Enter a valid Minecraft username.");
const packageIdSchema = z.number().int().positive();
const quantitySchema = z.number().int().min(1).max(MAX_CART_QUANTITY);

const addItemSchema = z.object({
  packageId: packageIdSchema,
  quantity: quantitySchema.default(1),
  username: minecraftUsernameSchema.nullable(),
  giftUsername: minecraftUsernameSchema.optional(),
});

const updateQuantitySchema = z.object({
  packageId: packageIdSchema,
  quantity: quantitySchema,
});

const removeItemSchema = z.object({ packageId: packageIdSchema });

const applyDiscountSchema = z.object({
  kind: z.enum(DISCOUNT_KINDS),
  code: z.string().trim().min(1, "A discount code is required.").max(128),
});

const checkoutSchema = z.object({ username: minecraftUsernameSchema });

const BASKET_COOKIE = "basket_ident";
const USERNAME_COOKIE = "minecraft_username";

export const getStorefrontServer = createServerFn({ method: "GET" }).handler(getStorefront);

export const getServerStatusServer = createServerFn({ method: "GET" }).handler(() =>
  getMinecraftServerStatus(),
);

export const getCartServer = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const cart = await getBasket(getCookie(BASKET_COOKIE));
    const username = normalizeString(getCookie(USERNAME_COOKIE));
    return cart.username && username && !sameMinecraftUsername(cart.username, username)
      ? createEmptyBasket()
      : cart;
  } catch (error) {
    console.error("[cart] getCartServer failed", {
      message: error instanceof Error ? error.message : "Unknown cart error",
      name: error instanceof Error ? error.name : "UnknownError",
    });
    throw error;
  }
});

export const addCartItemServer = createServerFn({ method: "POST" })
  .validator(addItemSchema)
  .handler(async ({ data }) => {
    const username = data.username ?? normalizeString(getCookie(USERNAME_COOKIE));
    if (!isMinecraftUsername(username)) throw new Error("Connect your Minecraft account first.");

    const cart = await addPackage(
      data.packageId,
      data.quantity,
      username,
      data.giftUsername,
    );
    if (cart.ident) {
      setCookie(BASKET_COOKIE, cart.ident, cookieOptions(60 * 60 * 24, true));
    }
    setCookie(USERNAME_COOKIE, username, cookieOptions(60 * 60 * 24 * 30, false));
    return cart;
  });

export const updateCartItemServer = createServerFn({ method: "POST" })
  .validator(updateQuantitySchema)
  .handler(({ data }) => updatePackageQuantity(data.packageId, data.quantity));

export const removeCartItemServer = createServerFn({ method: "POST" })
  .validator(removeItemSchema)
  .handler(({ data }) => removePackage(data.packageId));

export const applyCartDiscountServer = createServerFn({ method: "POST" })
  .validator(applyDiscountSchema)
  .handler(({ data }) => applyDiscount(data.kind, data.code));

export const checkoutCartServer = createServerFn({ method: "POST" })
  .validator(checkoutSchema)
  .handler(async ({ data }) => {
    const cart = await getBasket(getCookie(BASKET_COOKIE));
    if (!cart.ident || cart.packages.length === 0) throw new Error("Your basket is empty.");
    if (cart.username && !sameMinecraftUsername(cart.username, data.username)) {
      throw new Error("This basket belongs to a different Minecraft account.");
    }
    if (!cart.links.checkout) throw new Error("Checkout is currently unavailable.");

    return {
      ident: cart.ident,
      checkout_url: cart.links.checkout,
      auth_url: await getBasketAuth(cart.ident),
    };
  });

function cookieOptions(maxAge: number, httpOnly: boolean) {
  return {
    httpOnly,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  };
}
