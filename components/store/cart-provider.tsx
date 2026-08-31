"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { createEmptyBasket, type DiscountKind } from "@/lib/cart";
import type { Basket, CheckoutResponse } from "@/lib/types";
import {
  addCartItemServer,
  applyCartDiscountServer,
  checkoutCartServer,
  getCartServer,
  removeCartItemServer,
  updateCartItemServer,
} from "@/lib/server-functions";
import { isMinecraftUsername, normalizeString, sameMinecraftUsername } from "@/lib/validation";

type CartContextValue = {
  cart: Basket;
  username: string | null;
  setUsername: (username: string | null) => void;
  pending: boolean;
  drawerOpen: boolean;
  setDrawerOpen: (open: boolean) => void;
  addItem: (packageId: number, quantity?: number, giftUsername?: string) => Promise<void>;
  updateQuantity: (packageId: number, quantity: number) => Promise<void>;
  removeItem: (packageId: number) => Promise<void>;
  applyDiscount: (kind: DiscountKind, code: string) => Promise<void>;
  checkout: () => Promise<CheckoutResponse>;
};

const USERNAME_STORAGE_KEY = "minecraft_username";
const USERNAME_CHANGE_EVENT = "mikart:username-change";

const CartContext = createContext<CartContextValue | null>(null);

function readStoredUsername(): string | null {
  if (typeof window === "undefined") return null;

  try {
    const username = normalizeString(window.localStorage.getItem(USERNAME_STORAGE_KEY));
    return username && isMinecraftUsername(username) ? username : null;
  } catch {
    return null;
  }
}

function subscribeToUsername(onChange: () => void): () => void {
  window.addEventListener("storage", onChange);
  window.addEventListener(USERNAME_CHANGE_EVENT, onChange);

  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(USERNAME_CHANGE_EVENT, onChange);
  };
}

function getServerUsername(): null {
  return null;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Basket>(() => createEmptyBasket());
  const username = useSyncExternalStore(subscribeToUsername, readStoredUsername, getServerUsername);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const cartRequestVersion = useRef(0);
  const cartMutationVersion = useRef(0);

  useEffect(() => {
    let active = true;
    const requestVersion = cartRequestVersion.current;
    const mutationVersion = cartMutationVersion.current;

    void getCartServer()
      .then((nextCart) => {
        if (
          active &&
          requestVersion === cartRequestVersion.current &&
          mutationVersion === cartMutationVersion.current
        ) {
          setCart(nextCart);
        }
      })
      .catch(() => {
        // An empty basket is already rendered while the request is pending.
      });

    return () => {
      active = false;
    };
  }, []);

  const setUsername = useCallback((nextUsername: string | null) => {
    const normalizedUsername = normalizeString(nextUsername);
    const nextUsernameValue = normalizedUsername && isMinecraftUsername(normalizedUsername) ? normalizedUsername : null;
    const accountChanged =
      username === null || nextUsernameValue === null
        ? username !== nextUsernameValue
        : !sameMinecraftUsername(username, nextUsernameValue);

    if (accountChanged) {
      cartRequestVersion.current += 1;
      setCart(createEmptyBasket());
    }

    try {
      if (nextUsernameValue) {
        window.localStorage.setItem(USERNAME_STORAGE_KEY, nextUsernameValue);
      } else {
        window.localStorage.removeItem(USERNAME_STORAGE_KEY);
      }
    } catch {
      // The cookie below still lets the server use the selected account.
    }

    const secure = window.location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `minecraft_username=${encodeURIComponent(nextUsernameValue ?? "")}; Path=/; Max-Age=${
      nextUsernameValue ? 60 * 60 * 24 * 30 : 0
    }; SameSite=Lax${secure}`;
    window.dispatchEvent(new Event(USERNAME_CHANGE_EVENT));
  }, [username]);

  const runWithPending = useCallback(async <T,>(work: () => Promise<T>): Promise<T> => {
    setPendingCount((count) => count + 1);
    try {
      return await work();
    } finally {
      setPendingCount((count) => Math.max(0, count - 1));
    }
  }, []);

  const updateCart = useCallback(
    async (work: () => Promise<Basket>): Promise<void> => {
      const requestVersion = cartRequestVersion.current;
      const mutationVersion = ++cartMutationVersion.current;
      const nextCart = await runWithPending(work);
      if (
        requestVersion === cartRequestVersion.current &&
        mutationVersion === cartMutationVersion.current
      ) {
        setCart(nextCart);
      }
    },
    [runWithPending]
  );

  const addItem = useCallback(
    async (packageId: number, quantity = 1, giftUsername?: string): Promise<void> => {
      await updateCart(() => addCartItemServer({
        data: {
          packageId,
          quantity,
          username,
          ...(giftUsername ? { giftUsername } : {}),
        },
      }));
    },
    [updateCart, username]
  );

  const updateQuantity = useCallback(
    async (packageId: number, quantity: number): Promise<void> => {
      await updateCart(() => updateCartItemServer({ data: { packageId, quantity } }));
    },
    [updateCart]
  );

  const removeItem = useCallback(
    async (packageId: number): Promise<void> => {
      await updateCart(() => removeCartItemServer({ data: { packageId } }));
    },
    [updateCart]
  );

  const applyDiscount = useCallback(
    async (kind: DiscountKind, code: string): Promise<void> => {
      await updateCart(() => applyCartDiscountServer({ data: { kind, code } }));
    },
    [updateCart]
  );

  const checkout = useCallback(
    (): Promise<CheckoutResponse> =>
      runWithPending(() => {
        if (!username) return Promise.reject(new Error("Connect your Minecraft account first."));
        return checkoutCartServer({ data: { username } });
      }),
    [runWithPending, username]
  );

  const value = useMemo<CartContextValue>(
    () => ({
      cart,
      username,
      setUsername,
      pending: pendingCount > 0,
      drawerOpen,
      setDrawerOpen,
      addItem,
      updateQuantity,
      removeItem,
      applyDiscount,
      checkout,
    }),
    [
      addItem,
      applyDiscount,
      cart,
      checkout,
      drawerOpen,
      pendingCount,
      removeItem,
      setUsername,
      updateQuantity,
      username,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within CartProvider");
  return context;
}
