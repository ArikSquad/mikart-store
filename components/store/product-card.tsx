"use client";

import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { Check, Minus, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/components/store/cart-provider";
import { RichHtml } from "@/components/store/rich-html";
import type { StoreProduct } from "@/lib/types";
import { formatMoney } from "@/lib/utils";

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
  const [expanded, setExpanded] = useState(false);
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
        onClick={() => setExpanded((value) => !value)}
        className="w-full overflow-hidden rounded-[10px] bg-ink-800"
        aria-label={`Show ${product.name} details`}
      >
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

      <motion.div layout className="mt-4 space-y-2 text-[15px] text-[#c7cad6]">
        {expanded && <RichHtml html={product.detailsHtml} className="mb-4 rounded-[12px] bg-ink-800 p-4" />}
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
    </motion.article>
  );
}
