"use client";

import { FormEvent, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Minus, Plus, ShoppingBasket, Sparkles, Tag, TicketPercent, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/components/store/cart-provider";
import { formatMoney } from "@/lib/utils";

export function CartButton() {
  const { cart, setDrawerOpen } = useCart();
  const count = cart.lines.reduce((sum, line) => sum + line.quantity, 0);

  return (
    <button
      type="button"
      onClick={() => setDrawerOpen(true)}
      className="inline-flex h-[60px] min-w-[124px] items-center justify-center gap-3 rounded-[16px] border-2 border-orange-pop bg-[#302525] px-5 text-orange-pop transition hover:bg-[#3a2a23]"
      aria-label="Open cart"
    >
      <ShoppingBasket size={17} strokeWidth={3} />
      <span className="rounded-[9px] bg-[#493020] px-3 py-1 text-xs font-black uppercase">
        {count ? `${count} item${count > 1 ? "s" : ""}` : "Empty"}
      </span>
    </button>
  );
}

export function CartDrawer() {
  const { cart, drawerOpen, setDrawerOpen, removeItem, updateQuantity, applyDiscount, checkout, pending } = useCart();
  const [code, setCode] = useState("");
  const [kind, setKind] = useState<"coupon" | "giftcard" | "creator">("coupon");
  const [message, setMessage] = useState("");
  const codeHelp = {
    coupon: "Discount codes reduce the basket price when the code is valid.",
    giftcard: "Gift cards use stored credit from a Tebex gift card number.",
    creator: "Creator codes support a creator without changing the package you receive.",
  } as const;

  async function submitDiscount(event: FormEvent) {
    event.preventDefault();
    if (!code.trim()) return;
    setMessage("");
    try {
      await applyDiscount(kind, code.trim());
      setCode("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not apply code.");
    }
  }

  async function startCheckout() {
    setMessage("");
    try {
      const result = await checkout();
      if (result.authUrl) {
        window.location.href = result.authUrl;
        return;
      }
      if (result.checkoutUrl) {
        window.location.href = result.checkoutUrl;
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Checkout failed.");
    }
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
                <h2 className="text-2xl font-black">Your Cart</h2>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setDrawerOpen(false)} aria-label="Close cart">
                <X size={20} />
              </Button>
            </div>

            <div className="space-y-3">
              {cart.lines.length === 0 ? (
                <div className="rounded-[16px] bg-ink-850 p-6 text-sm text-[#b9bdca]">
                  Your basket is empty.
                </div>
              ) : (
                cart.lines.map((line) => (
                  <motion.div
                    layout
                    key={line.packageId}
                    className="flex gap-3 rounded-[16px] bg-ink-850 p-3"
                  >
                    <img src={line.image} alt="" className="h-16 w-16 rounded-[10px] object-cover" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-black">{line.name}</p>
                      <p className="text-sm text-[#b9bdca]">
                        {line.quantity} x {formatMoney(line.unitPrice, cart.currency)}
                      </p>
                      {line.userLimit === 1 ? null : (
                        <div className="mt-2 inline-flex h-9 items-center rounded-[10px] bg-ink-900">
                          <button
                            type="button"
                            className="grid h-9 w-9 place-items-center text-cyan-pop disabled:opacity-40"
                            disabled={pending || line.quantity <= 1}
                            onClick={() => updateQuantity(line.packageId, line.quantity - 1)}
                            aria-label={`Decrease ${line.name} quantity`}
                          >
                            <Minus size={14} />
                          </button>
                          <span className="w-10 text-center text-xs font-black">{line.quantity}</span>
                          <button
                            type="button"
                            className="grid h-9 w-9 place-items-center text-cyan-pop disabled:opacity-40"
                            disabled={pending || line.quantity >= (line.quantityLimit ?? 99)}
                            onClick={() => updateQuantity(line.packageId, line.quantity + 1)}
                            aria-label={`Increase ${line.name} quantity`}
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(line.packageId)}
                      className="grid h-10 w-10 place-items-center rounded-[10px] text-[#ff4545] hover:bg-[#342334]"
                      aria-label={`Remove ${line.name}`}
                    >
                      <Trash2 size={17} />
                    </button>
                  </motion.div>
                ))
              )}
            </div>

            <form onSubmit={submitDiscount} className="mt-5 rounded-[16px] bg-ink-850 p-4">
              <div className="mb-3 grid grid-cols-3 gap-2">
                {[
                  ["coupon", TicketPercent],
                  ["giftcard", Tag],
                  ["creator", Sparkles],
                ].map(([value, Icon]) => {
                  const TypedIcon = Icon as typeof TicketPercent;
                  return (
                    <button
                      key={value as string}
                      type="button"
                      onClick={() => setKind(value as "coupon" | "giftcard" | "creator")}
                      className={`grid h-10 place-items-center rounded-[10px] border text-xs font-black uppercase ${
                        kind === value
                          ? "border-cyan-pop bg-[#123550] text-cyan-pop"
                          : "border-transparent bg-ink-900 text-[#9da3b4]"
                      }`}
                      aria-label={`${value} code`}
                    >
                      <TypedIcon size={16} />
                      <p className="text-xs font-bold uppercase">{(value as string).toLowerCase()}</p>
                    </button>
                  );
                })}
              </div>
              <div className="flex gap-2">
                <input
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                  placeholder="Code"
                  className="min-w-0 flex-1 rounded-[12px] border border-[#373d53] bg-ink-900 px-3 text-sm font-bold outline-none ring-cyan-pop/0 transition focus:ring-2"
                />
                <Button size="sm" disabled={pending || !code.trim()}>
                  Apply
                </Button>
              </div>
            </form>

           <div className="mt-5 space-y-2 rounded-[16px] bg-ink-850 p-4 text-sm">
              <div className="flex justify-between text-[#b9bdca]">
                <span>Subtotal</span>
                <span>{formatMoney(cart.basePrice, cart.currency)}</span>
              </div>
              <div className="flex justify-between text-[#b9bdca]">
                <span>Sales tax / VAT</span>
                <span>{formatMoney(cart.salesTax, cart.currency)}</span>
              </div>
              <div className="flex justify-between border-t border-[#30364b] pt-3 text-lg font-black">
                <span>Total incl. tax / VAT</span>
                <span>{formatMoney(cart.totalPrice, cart.currency)}</span>
              </div>
              {(cart.coupons.length > 0 || cart.giftcards.length > 0 || cart.creatorCode) && (
                <p className="pt-2 text-xs font-bold text-cyan-pop">
                  {[...cart.coupons, ...cart.giftcards, cart.creatorCode].filter(Boolean).join(", ")}
                </p>
              )}
            </div>

            {message && <p className="mt-4 rounded-[12px] bg-[#342334] p-3 text-sm text-orange-pop">{(message)}</p>}

            <Button
              className="mt-5 w-full"
              disabled={pending || cart.lines.length === 0}
              onClick={startCheckout}
            >
              <ShoppingBasket size={16} />
              Checkout
            </Button>
            <p className="mt-3 text-xs text-[#858b9d]">Sales are final and non-refundable.</p>
          </motion.aside>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
