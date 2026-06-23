"use client";

import Link from "next/link";
import { LogIn, LogOut, Menu, PlayCircle } from "lucide-react";
import { CartButton } from "@/components/store/cart-drawer";
import type { StoreCategory } from "@/lib/types";
import { FormEvent, useState } from "react";
import { useCart } from "@/components/store/cart-provider";
import { Button } from "@/components/ui/button";

export function Topbar({ categories }: { categories: StoreCategory[] }) {
  const [open, setOpen] = useState(false);
  const [draftUsername, setDraftUsername] = useState("");
  const { username, setUsername } = useCart();

  function connectAccount(event: FormEvent) {
    event.preventDefault();
    if (draftUsername.trim()) setUsername(draftUsername);
  }

  return (
    <header className="rounded-[14px] bg-ink-900 p-4 md:p-6">
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="grid h-[50px] w-[50px] place-items-center rounded-[14px] border border-[#4b5268] text-[#aeb3c4] lg:hidden"
          aria-label="Toggle navigation"
        >
          <Menu size={21} />
        </button>

        {username ? (
          <div className="flex min-w-0 items-center gap-3 rounded-[16px] border-2 border-[#555b71] px-3 py-2">
            <img
              src={`https://mc-heads.net/avatar/${encodeURIComponent(username)}/42`}
              alt=""
              className="h-[42px] w-[42px] rounded-[8px]"
            />
            <div className="min-w-0 leading-none">
              <p className="text-[11px] font-black uppercase text-[#9fa4b3]">Welcome</p>
              <p className="truncate text-[15px] font-black">{username}</p>
            </div>
            <button
              type="button"
              onClick={() => setUsername(null)}
              className="ml-2 text-[#9fa4b3] transition hover:text-white"
              aria-label="Disconnect account"
            >
              <LogOut size={18} />
            </button>
          </div>
        ) : (
          <div className="hidden min-w-0 items-center gap-3 rounded-[16px] border-2 border-[#555b71] px-4 py-3 text-[#c7cad6] sm:flex">
            <LogIn size={18} className="text-cyan-pop" />
            <span className="text-sm font-black">Connect account</span>
          </div>
        )}

        <div className="ml-auto">
          <CartButton />
        </div>
      </div>

      {open && (
        <nav className="mt-4 grid grid-cols-2 gap-2 lg:hidden">
          {categories.map((category) => (
            <Link
              key={category.slug}
              href={category.slug === "home" ? "/" : `/category/${category.slug}`}
              onClick={() => setOpen(false)}
              className="rounded-[12px] bg-ink-850 px-4 py-3 text-sm font-black text-[#d9dbe3]"
            >
              {category.name}
            </Link>
          ))}
          <a
            href="minecraft://?addExternalServer=MikArt|play.mikart.eu:25565"
            className="col-span-2 inline-flex items-center justify-center gap-2 rounded-[12px] border border-orange-pop bg-[#302525] px-4 py-3 text-sm font-black text-orange-pop"
          >
            <PlayCircle size={16} className="fill-orange-pop" />
            Play Now
          </a>
        </nav>
      )}

      {!username && (
        <form onSubmit={connectAccount} className="mt-6 rounded-[14px] bg-ink-850 p-4 md:p-6">
          <h2 className="text-3xl font-black">Sign In</h2>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row">
            <input
              value={draftUsername}
              onChange={(event) => setDraftUsername(event.target.value)}
              placeholder="Enter your in-game username"
              className="min-h-12 min-w-0 flex-1 rounded-[12px] border border-transparent bg-ink-800 px-4 font-black text-white outline-none ring-[#42e95d]/0 transition placeholder:text-[#9da3b4] focus:ring-2"
            />
            <Button
              variant="primary"
              className="border-[#42e95d] bg-[#153f2b] text-[#42e95d] hover:bg-[#194a32]"
              disabled={!draftUsername.trim()}
            >
              Continue
            </Button>
          </div>
        </form>
      )}
    </header>
  );
}
