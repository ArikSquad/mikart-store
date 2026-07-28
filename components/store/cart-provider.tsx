"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, useTransition } from "react";
import { createEmptyCart } from "@/lib/cart";
import type { CartState } from "@/lib/types";

type DiscountKind = "coupon" | "giftcard" | "creator";

type CartContextValue = {
  cart: CartState;
  username: string | null;
  setUsername: (username: string | null) => void;
  pending: boolean;
  drawerOpen: boolean;
  setDrawerOpen: (open: boolean) => void;
  addItem: (packageId: number, quantity?: number, giftUsername?: string) => Promise<void>;
  updateQuantity: (packageId: number, quantity: number) => Promise<void>;
  removeItem: (packageId: number) => Promise<void>;
  applyDiscount: (kind: DiscountKind, code: string) => Promise<void>;
  checkout: () => Promise<{ checkoutUrl?: string | null; authUrl?: string | null }>;
};

const CartContext = createContext<CartContextValue | null>(null);

async function postCart<T>(url: string, body?: unknown): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await response.text();
  let result: { error?: string } & T;
  try {
    result = text ? JSON.parse(text) : {};
  } catch {
    result = { error: text || "Cart request failed" } as { error?: string } & T;
  }
  if (!response.ok) throw new Error(result.error ?? "Cart request failed");
  return result;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartState>(() => createEmptyCart());
  const [username, setUsernameState] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [manualPending, setManualPending] = useState(false);

  useEffect(() => {
    setUsernameState(window.localStorage.getItem("minecraft_username"));
    fetch("/api/cart")
      .then((response) => response.json())
      .then(setCart)
      .catch(() => undefined);
  }, []);

  const setUsername = useCallback((nextUsername: string | null) => {
    const cleanUsername = nextUsername?.trim() || null;
    setUsernameState(cleanUsername);
    if (cleanUsername) {
      window.localStorage.setItem("minecraft_username", cleanUsername);
      document.cookie = `minecraft_username=${encodeURIComponent(cleanUsername)}; path=/; max-age=86400; samesite=lax`;
    } else {
      window.localStorage.removeItem("minecraft_username");
      document.cookie = "minecraft_username=; path=/; max-age=0; samesite=lax";
    }
  }, []);

  const run = useCallback(async (work: () => Promise<CartState>) => {
    setManualPending(true);
    try {
      const nextCart = await work();
      startTransition(() => setCart(nextCart));
      return nextCart;
    } finally {
      setManualPending(false);
    }
  }, []);

  const value = useMemo<CartContextValue>(
    () => ({
      cart,
      username,
      setUsername,
      pending: isPending || manualPending,
      drawerOpen,
      setDrawerOpen,
      addItem: async (packageId, quantity = 1, giftUsername) => {
        await run(() => postCart<CartState>("/api/cart/add", { packageId, quantity, username, giftUsername }));
      },
      updateQuantity: async (packageId, quantity) => {
        await run(() => postCart<CartState>("/api/cart/update", { packageId, quantity }));
      },
      removeItem: async (packageId) => {
        await run(() => postCart<CartState>("/api/cart/remove", { packageId }));
      },
      applyDiscount: async (kind, code) => {
        await run(() => postCart<CartState>("/api/cart/discount", { kind, code }));
      },
      checkout: () => postCart("/api/cart/checkout"),
    }),
    [cart, drawerOpen, isPending, manualPending, run, setUsername, username]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within CartProvider");
  return context;
}
