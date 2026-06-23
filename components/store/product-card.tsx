"use client";

import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { Check, Gift, Info, Minus, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/components/store/cart-provider";
import { RichHtml } from "@/components/store/rich-html";
import type { StoreProduct } from "@/lib/types";
import { formatMoney } from "@/lib/utils";
import * as Dialog from "@/components/ui/dialog";

export function ProductGrid({ products }: { products: StoreProduct[] }) {
  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      {products.map((product, index) => (
        <ProductCard key={product.id} product={product} index={index} />
      ))}
    </div>
  );
}

function ProductCard({ product, index }: { product: StoreProduct; index: number }) {
  const { addItem, cart, pending } = useCart();
  const existing = cart.lines.find((line) => line.packageId === product.id);
  const maxQuantity = product.userLimit === 1 ? 1 : product.quantityLimit ?? 64;
  const limitReached = product.userLimit === 1 && Boolean(existing);
  const [quantity, setQuantity] = useState(1);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [giftOpen, setGiftOpen] = useState(false);
  const [giftUsername, setGiftUsername] = useState("");
  const clampedQuantity = useMemo(() => Math.min(quantity, maxQuantity), [quantity, maxQuantity]);

  return (
    <motion.article
      className="rounded-[14px] bg-ink-900 p-6"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.22 }}
    >
      <button
        type="button"
        onClick={() => setDetailsOpen(true)}
        className="group relative w-full overflow-hidden rounded-[10px] bg-ink-800"
        aria-label={`Show ${product.name} details`}
      >
        <span className="absolute right-3 top-3 z-10 inline-flex h-9 w-9 items-center justify-center rounded-[10px] border-cyan-pop bg-[#123550] text-cyan-pop shadow-lg transition group-hover:bg-[#16425f]">
          <Info size={17} />
        </span>
        <img src={product.image} alt={product.name} className="mx-auto h-[168px] w-full object-contain p-4" />
        <div className="border-t border-[#171b29] px-4 py-5">
          <h2 className="text-center font-black">{product.name}</h2>
        </div>
      </button>

      <p className="mt-4 font-black">{formatMoney(product.price, product.currency)}</p>

      {product.userLimit === 1 ? (
        <p className="mt-2 text-xs font-bold text-[#9fa4b3]">Limited to one purchase per player.</p>
      ) : (
        <div className="mt-3 flex h-11 items-center rounded-[12px] bg-ink-800">
          <button
            type="button"
            className="grid h-11 w-11 place-items-center text-cyan-pop"
            onClick={() => setQuantity((value) => Math.max(1, value - 1))}
            aria-label="Decrease quantity"
          >
            <Minus size={16} />
          </button>
          <span className="flex-1 text-center text-sm font-black">{clampedQuantity}</span>
          <button
            type="button"
            className="grid h-11 w-11 place-items-center text-cyan-pop"
            onClick={() => setQuantity((value) => Math.min(maxQuantity, value + 1))}
            aria-label="Increase quantity"
          >
            <Plus size={16} />
          </button>
        </div>
      )}

      <Button
        className="mt-4 w-full"
        disabled={pending || limitReached}
        onClick={() => addItem(product.id, clampedQuantity)}
      >
        <Plus size={16} className="fill-cyan-pop" />
        {limitReached ? "Limit reached" : "Purchase"}
      </Button>
      <Button
        variant="orange"
        className="mt-3 w-full"
        disabled={pending || limitReached}
        onClick={() => setGiftOpen(true)}
      >
        <Gift size={16} />
        Gift package
      </Button>

      <motion.div layout className="mt-4 space-y-2 text-[15px] text-[#c7cad6]">
        {product.features.map((feature) => (
          <div key={feature.text} className="flex gap-3">
            <span
              className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full ${
                feature.positive ? "bg-[#42e95d] text-ink-950" : "bg-[#9ea2ad] text-ink-950"
              }`}
            >
              {feature.positive ? <Check size={14} /> : <X size={13} />}
            </span>
            <span>{feature.text}</span>
          </div>
        ))}
      </motion.div>

      <Dialog.Root open={detailsOpen} onOpenChange={setDetailsOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 grid max-h-[86vh] w-[calc(100vw-32px)] max-w-[900px] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[14px] bg-ink-900 shadow-2xl md:grid-cols-[280px_1fr]">
            <div className="bg-ink-850 p-5">
              <div className="overflow-hidden rounded-[10px] bg-ink-800">
                <img src={product.image} alt={product.name} className="mx-auto h-[190px] w-full object-contain p-4" />
                <div className="border-t border-[#171b29] px-4 py-4">
                  <h2 className="text-center font-black">{product.name}</h2>
                </div>
              </div>
              <p className="mt-4 font-black">{formatMoney(product.price, product.currency)}</p>
            </div>
            <div className="store-scrollbar overflow-y-auto p-5 md:p-6">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <Dialog.Title className="text-2xl font-black">{product.name}</Dialog.Title>
                  <Dialog.Description className="mt-2 text-sm text-[#b9bdca]">
                    Package information and included perks.
                  </Dialog.Description>
                </div>
                <Dialog.Close asChild>
                  <Button variant="ghost" size="icon" aria-label="Close item details">
                    <X size={20} />
                  </Button>
                </Dialog.Close>
              </div>
              <RichHtml html={product.detailsHtml} className="rounded-[12px] bg-ink-800 p-4" />
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <Dialog.Root open={giftOpen} onOpenChange={setGiftOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100vw-32px)] max-w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-[14px] bg-ink-900 p-5 shadow-2xl md:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <Dialog.Title className="text-2xl font-black">Gift package</Dialog.Title>
                <Dialog.Description className="mt-2 text-sm text-[#b9bdca]">
                  Add this package to the basket for another Minecraft username.
                </Dialog.Description>
              </div>
              <Dialog.Close asChild>
                <Button variant="ghost" size="icon" aria-label="Close gift modal">
                  <X size={20} />
                </Button>
              </Dialog.Close>
            </div>
            <div className="mt-5 rounded-[14px] bg-ink-850 p-4">
              <input
                value={giftUsername}
                onChange={(event) => setGiftUsername(event.target.value)}
                placeholder="Recipient username"
                className="min-h-12 w-full rounded-[12px] border border-transparent bg-ink-800 px-4 font-black text-white outline-none ring-orange-pop/0 transition placeholder:text-[#9da3b4] focus:ring-2"
              />
              <Button
                variant="orange"
                className="mt-3 w-full"
                disabled={pending || !giftUsername.trim()}
                onClick={async () => {
                  await addItem(product.id, clampedQuantity, giftUsername.trim());
                  setGiftUsername("");
                  setGiftOpen(false);
                }}
              >
                <Gift size={16} />
                Add gift
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </motion.article>
  );
}
