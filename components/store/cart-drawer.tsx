"use client";

import { type SyntheticEvent, useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Minus, Plus, ShoppingBasket, Sparkles, Tag, TicketPercent, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Image } from "@/components/ui/image";
import { useCart } from "@/components/store/cart-provider";
import { getMaxQuantity, type DiscountKind } from "@/lib/cart";
import { getErrorMessage } from "@/lib/errors";
import type { Basket } from "@/lib/types";
import { formatMoney } from "@/lib/utils";

const FALLBACK_PRODUCT_IMAGE = "/rank-vip.svg";

const DISCOUNT_OPTIONS = [
  { kind: "coupon", label: "coupon", icon: TicketPercent },
  { kind: "giftcard", label: "gift card", icon: Tag },
  { kind: "creator", label: "creator", icon: Sparkles },
] as const satisfies ReadonlyArray<{
  kind: DiscountKind;
  label: string;
  icon: typeof TicketPercent;
}>;

const CODE_HELP: Record<DiscountKind, string> = {
  coupon: "Discount codes reduce the basket price when the code is valid.",
  giftcard: "Gift cards use stored credit from a Tebex gift card number.",
  creator: "Creator codes support a creator without changing the package you receive.",
};

export function CartButton() {
  const { cart, setDrawerOpen } = useCart();
  const count = cart.packages.reduce((sum, line) => sum + line.in_basket.quantity, 0);
  const label = count ? `${count} item${count === 1 ? "" : "s"}` : "Empty";

  return (
    <button
      type="button"
      onClick={() => setDrawerOpen(true)}
      className="inline-flex h-[60px] min-w-[124px] items-center justify-center gap-3 rounded-[16px] border-2 border-orange-pop bg-[#302525] px-5 text-orange-pop transition hover:bg-[#3a2a23]"
      aria-label={`Open cart, ${label}`}
    >
      <ShoppingBasket size={17} strokeWidth={3} />
      <span className="rounded-[9px] bg-[#493020] px-3 py-1 text-xs font-black uppercase">{label}</span>
    </button>
  );
}

export function CartDrawer() {
  const {
    cart,
    drawerOpen,
    setDrawerOpen,
    removeItem,
    updateQuantity,
    applyDiscount,
    checkout,
    pending,
    username,
    loadError,
    retryLoad,
  } = useCart();
  const [code, setCode] = useState("");
  const [kind, setKind] = useState<DiscountKind>("coupon");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!drawerOpen) return;

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") setDrawerOpen(false);
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [drawerOpen, setDrawerOpen]);

  async function runCartAction(action: () => Promise<void>): Promise<void> {
    setMessage(null);
    try {
      await action();
    } catch (error) {
      setMessage(getErrorMessage(error, "Cart request failed. Please try again."));
    }
  }

  async function submitDiscount(event: SyntheticEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const normalizedCode = code.trim();
    if (!normalizedCode) return;

    await runCartAction(async () => {
      await applyDiscount(kind, normalizedCode);
      setCode("");
    });
  }

  async function startCheckout(): Promise<void> {
    await runCartAction(async () => {
      const result = await checkout();
      const checkoutUrl = result.auth_url ?? result.checkout_url;
      if (!checkoutUrl) throw new Error("Checkout is currently unavailable.");
      window.location.assign(checkoutUrl);
    });
  }

  return (
    <AnimatePresence>
      {drawerOpen ? (
        <motion.div
          className="fixed inset-0 z-50 bg-black/55 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setDrawerOpen(false)}
        >
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-labelledby="cart-title"
            className="store-scrollbar ml-auto flex h-full w-full max-w-[440px] flex-col overflow-y-auto bg-ink-900 p-5 shadow-2xl"
            initial={{ x: 460 }}
            animate={{ x: 0 }}
            exit={{ x: 460 }}
            transition={{ type: "spring", stiffness: 420, damping: 34 }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-black uppercase text-cyan-pop">Basket</p>
                <h2 id="cart-title" className="text-2xl font-black">
                  Your Cart
                </h2>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setDrawerOpen(false)}
                aria-label="Close cart"
              >
                <X size={20} />
              </Button>
            </div>

            <div className="space-y-3">
              {loadError ? (
                <div role="alert" className="rounded-[16px] bg-[#342334] p-6 text-sm text-orange-pop">
                  <p>{loadError}</p>
                  <Button
                    type="button"
                    variant="orange"
                    className="mt-4"
                    disabled={pending}
                    onClick={() => void retryLoad()}
                  >
                    {pending ? "Trying again…" : "Try again"}
                  </Button>
                </div>
              ) : cart.packages.length === 0 ? (
                <div className="rounded-[16px] bg-ink-850 p-6 text-sm text-[#b9bdca]">Your basket is empty.</div>
              ) : (
                cart.packages.map((line) => {
                  const quantity = line.in_basket.quantity;
                  const maxQuantity = getMaxQuantity(line);
                  const canManageQuantity = maxQuantity > 1;

                  return (
                    <motion.div layout key={line.id} className="flex gap-3 rounded-[16px] bg-ink-850 p-3">
                      <Image
                        src={line.image || FALLBACK_PRODUCT_IMAGE}
                        alt=""
                        width={64}
                        height={64}
                        className="h-16 w-16 rounded-[10px] object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-black">{line.name}</p>
                        <p className="text-sm text-[#b9bdca]">
                          {quantity} x {formatMoney(line.in_basket.price, cart.currency)}
                        </p>
                        {canManageQuantity ? (
                          <div className="mt-2 inline-flex h-9 items-center rounded-[10px] bg-ink-900">
                            <button
                              type="button"
                              className="grid h-9 w-9 place-items-center text-cyan-pop disabled:opacity-40"
                              disabled={pending || quantity <= 1}
                              onClick={() => void runCartAction(() => updateQuantity(line.id, quantity - 1))}
                              aria-label={`Decrease ${line.name} quantity`}
                            >
                              <Minus size={14} />
                            </button>
                            <span className="w-10 text-center text-xs font-black">{quantity}</span>
                            <button
                              type="button"
                              className="grid h-9 w-9 place-items-center text-cyan-pop disabled:opacity-40"
                              disabled={pending || quantity >= maxQuantity}
                              onClick={() => void runCartAction(() => updateQuantity(line.id, quantity + 1))}
                              aria-label={`Increase ${line.name} quantity`}
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                        ) : null}
                      </div>
                      <button
                        type="button"
                        onClick={() => void runCartAction(() => removeItem(line.id))}
                        className="grid h-10 w-10 place-items-center rounded-[10px] text-[#ff4545] hover:bg-[#342334] disabled:opacity-40"
                        disabled={pending}
                        aria-label={`Remove ${line.name}`}
                      >
                        <Trash2 size={17} />
                      </button>
                    </motion.div>
                  );
                })
              )}
            </div>

            <form onSubmit={submitDiscount} className="mt-5 rounded-[16px] bg-ink-850 p-4">
              <div className="mb-3 grid grid-cols-3 gap-2" role="group" aria-label="Discount type">
                {DISCOUNT_OPTIONS.map(({ kind: optionKind, label, icon: Icon }) => (
                  <button
                    key={optionKind}
                    type="button"
                    onClick={() => setKind(optionKind)}
                    className={`grid h-10 place-items-center rounded-[10px] border text-xs font-black uppercase ${
                      kind === optionKind
                        ? "border-cyan-pop bg-[#123550] text-cyan-pop"
                        : "border-transparent bg-ink-900 text-[#9da3b4]"
                    }`}
                    aria-label={`${label} code`}
                    aria-pressed={kind === optionKind}
                  >
                    <Icon size={16} />
                    <span className="text-xs font-bold uppercase">{label}</span>
                  </button>
                ))}
              </div>
              <p className="mb-3 text-xs text-[#9da3b4]">{CODE_HELP[kind]}</p>
              <div className="flex gap-2">
                <label htmlFor="cart-discount-code" className="sr-only">
                  {kind} code
                </label>
                <input
                  id="cart-discount-code"
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                  placeholder="Code"
                  autoComplete="off"
                  required
                  className="min-w-0 flex-1 rounded-[12px] border border-[#373d53] bg-ink-900 px-3 text-sm font-bold outline-none ring-cyan-pop/0 transition focus:ring-2"
                />
                <Button type="submit" size="sm" disabled={pending || Boolean(loadError) || !code.trim()}>
                  Apply
                </Button>
              </div>
            </form>

            <div className="mt-5 space-y-2 rounded-[16px] bg-ink-850 p-4 text-sm">
              <div className="flex justify-between text-[#b9bdca]">
                <span>Subtotal</span>
                <span>{formatMoney(cart.base_price, cart.currency)}</span>
              </div>
              <div className="flex justify-between text-[#b9bdca]">
                <span>Sales tax</span>
                <span>{formatMoney(cart.sales_tax, cart.currency)}</span>
              </div>
              <div className="flex justify-between border-t border-[#30364b] pt-3 text-lg font-black">
                <span>Total</span>
                <span>{formatMoney(cart.total_price, cart.currency)}</span>
              </div>
              <AppliedCodes cart={cart} />
            </div>

            {message ? (
              <p role="alert" className="mt-4 rounded-xl bg-[#342334] p-3 text-sm text-orange-pop">
                {message}
              </p>
            ) : null}

            <Button
              type="button"
              className="mt-5 w-full"
              disabled={pending || Boolean(loadError) || !username || cart.packages.length === 0}
              onClick={() => void startCheckout()}
            >
              <ShoppingBasket size={16} />
              Checkout
            </Button>
            <p className="mt-3 text-xs text-[#858b9d]">
              Sales are final and non-refundable. Sales tax may not propagate before checkout.
            </p>
          </motion.aside>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function AppliedCodes({ cart }: { cart: Basket }) {
  const codes = [
    ...cart.coupons.map((item) => item.coupon_code),
    ...cart.giftcards.map((item) => item.card_number),
    cart.creator_code,
  ].filter(Boolean);

  return codes.length > 0 ? <p className="pt-2 text-xs font-bold text-cyan-pop">{codes.join(", ")}</p> : null;
}
