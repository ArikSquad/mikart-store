"use client";

import Image from "next/image";
import Link from "next/link";
import { LogIn, LogOut, Menu, PlayCircle, X } from "lucide-react";
import { type FormEvent, useState } from "react";
import { CartButton } from "@/components/store/cart-drawer";
import type { Category } from "@/lib/types";
import { useCart } from "@/components/store/cart-provider";
import { Button } from "@/components/ui/button";
import * as Dialog from "@/components/ui/dialog";
import { isMinecraftUsername, normalizeString } from "@/lib/validation";
import { slugify } from "@/lib/utils";

export function Topbar({ categories }: { categories: Category[] }) {
  const [open, setOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [draftUsername, setDraftUsername] = useState("");
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const { username, setUsername } = useCart();

  function openAccountDialog(): void {
    setDraftUsername(username ?? "");
    setUsernameError(null);
    setAccountOpen(true);
  }

  function connectAccount(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const nextUsername = normalizeString(draftUsername);
    if (!isMinecraftUsername(nextUsername)) {
      setUsernameError("Enter a valid Minecraft username (3–16 letters, numbers, or underscores).");
      return;
    }

    setUsername(nextUsername);
    setAccountOpen(false);
  }

  return (
    <header className="rounded-[14px] bg-ink-900 p-4 md:p-6">
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="grid h-[50px] w-[50px] place-items-center rounded-[14px] border border-[#4b5268] text-[#aeb3c4] lg:hidden"
          aria-label="Toggle navigation"
          aria-expanded={open}
          aria-controls="mobile-navigation"
        >
          <Menu size={21} />
        </button>

        {username ? (
          <div className="flex min-w-0 items-center gap-3 rounded-[16px] border-2 border-[#555b71] px-3 py-2">
            <Image
              src={`https://mc-heads.net/avatar/${encodeURIComponent(username)}/42`}
              alt=""
              width={42}
              height={42}
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
          <button
            type="button"
            onClick={openAccountDialog}
            className="flex min-w-0 items-center gap-3 rounded-[16px] border-2 border-[#555b71] px-3 py-3 text-[#c7cad6] transition hover:border-cyan-pop hover:text-white sm:px-4"
            aria-label="Connect Minecraft account"
          >
            <LogIn size={18} className="text-cyan-pop" />
            <span className="hidden text-sm font-black sm:inline">Connect account</span>
          </button>
        )}

        <div className="ml-auto">
          <CartButton />
        </div>
      </div>

      {open && (
        <nav id="mobile-navigation" className="mt-4 grid grid-cols-2 gap-2 lg:hidden">
          <Link
            href="/"
            onClick={() => setOpen(false)}
            className="rounded-[12px] bg-ink-850 px-4 py-3 text-sm font-black text-[#d9dbe3]"
          >
            Home
          </Link>
          {categories.map((category) => {
            const slug = category.slug ?? slugify(category.name);
            if (slug === "home") return null;

            return (
              <Link
                key={category.id}
                href={`/category/${slug}`}
                onClick={() => setOpen(false)}
                className="rounded-[12px] bg-ink-850 px-4 py-3 text-sm font-black text-[#d9dbe3]"
              >
                {category.name}
              </Link>
            );
          })}
          <a
            href="minecraft://?addExternalServer=MikArt|play.mikart.eu:25565"
            className="col-span-2 inline-flex items-center justify-center gap-2 rounded-[12px] border border-orange-pop bg-[#302525] px-4 py-3 text-sm font-black text-orange-pop"
          >
            <PlayCircle size={16} className="fill-orange-pop" />
            Play Now
          </a>
        </nav>
      )}

      <Dialog.Root open={accountOpen} onOpenChange={setAccountOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100vw-32px)] max-w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-[14px] bg-ink-900 p-5 shadow-2xl md:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <Dialog.Title className="text-2xl font-black">Connect account</Dialog.Title>
                <Dialog.Description className="mt-2 text-sm text-[#b9bdca]">
                  Enter the Minecraft username that should receive purchases by default.
                </Dialog.Description>
              </div>
              <Dialog.Close asChild>
                <Button variant="ghost" size="icon" aria-label="Close account modal">
                  <X size={20} />
                </Button>
              </Dialog.Close>
            </div>
            <form onSubmit={connectAccount} className="mt-5 rounded-[14px] bg-ink-850 p-4">
              <label htmlFor="minecraft-username" className="sr-only">
                Minecraft username
              </label>
              <input
                id="minecraft-username"
                name="minecraft-username"
                type="text"
                value={draftUsername}
                onChange={(event) => {
                  setDraftUsername(event.target.value);
                  setUsernameError(null);
                }}
                placeholder="Enter username"
                autoComplete="off"
                required
                minLength={3}
                maxLength={16}
                pattern="[A-Za-z0-9_]{3,16}"
                aria-invalid={usernameError ? "true" : undefined}
                aria-describedby={usernameError ? "minecraft-username-error" : undefined}
                className="min-h-12 w-full rounded-[12px] border border-transparent bg-ink-800 px-4 font-black text-white outline-none ring-[#42e95d]/0 transition placeholder:text-[#9da3b4] focus:ring-2"
              />
              {usernameError ? (
                <p id="minecraft-username-error" className="mt-2 text-xs font-bold text-[#ff7777]">
                  {usernameError}
                </p>
              ) : null}
              <Button
                type="submit"
                variant="primary"
                className="mt-3 w-full border-[#42e95d] bg-[#153f2b] text-[#42e95d] hover:bg-[#194a32]"
                disabled={!draftUsername.trim()}
              >
                Continue
              </Button>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </header>
  );
}
