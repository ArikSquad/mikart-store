import type { ReactNode } from "react";
import { ExternalLink, GitBranch, Ruler } from "lucide-react";
import { CartDrawer } from "@/components/store/cart-drawer";
import { CartProvider } from "@/components/store/cart-provider";
import { Sidebar } from "@/components/store/sidebar";
import { Topbar } from "@/components/store/topbar";
import type { Storefront } from "@/lib/types";

export function StoreShell({
  data,
  activeSlug,
  children,
}: {
  data: Storefront;
  activeSlug: string;
  children: ReactNode;
}) {
  return (
    <CartProvider>
      <div className="min-h-screen bg-ink-800 lg:flex lg:justify-center lg:gap-6 lg:px-6">
        <Sidebar categories={data.categories} modules={data.modules} activeSlug={activeSlug} />
        <main className="min-w-0 flex-1 px-4 py-4 md:px-6 lg:max-w-[1040px] lg:px-0 lg:py-8">
          <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-[984px] flex-col">
            <Topbar categories={data.categories} />
            <div className="mt-6 flex-1">{children}</div>
            <Footer />
          </div>
        </main>
      </div>
      <CartDrawer />
    </CartProvider>
  );
}

function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-12 flex flex-col gap-6 pb-6 md:flex-row md:items-center md:justify-between">
      <div>
        <p className="font-black">Copyright © MikArt Europe {year}.</p>
        <p className="text-xs tracking-wide text-[#b8bdcd]">
          Powered by Tebex.io. We are not affiliated with Mojang AB.
        </p>
      </div>
      <div className="flex gap-3">
        <a className="grid h-16 w-16 place-items-center rounded-[14px] bg-ink-900 text-[#9da3b4]" href="https://github.com/ArikSquad/mikart-store" target="_blank" rel="noopener noreferrer" aria-label="GitHub">
          <GitBranch size={20} />
        </a>
        <a className="grid h-16 w-16 place-items-center rounded-[14px] bg-ink-900 text-[#9da3b4]" href="https://www.mikart.eu/docs/minecraft/rules" target="_blank" rel="noopener noreferrer" aria-label="Minecraft server rules">
          <Ruler size={22} />
        </a>
        <a className="flex h-16 items-center gap-4 rounded-[14px] bg-ink-900 px-6" href="https://www.mikart.eu/" target="_blank" rel="noopener noreferrer">
          <span className="text-[11px] font-black uppercase leading-none text-[#858b9d]">
            PRODUCT BY
            <strong className="block text-base normal-case text-white">ArikSquad</strong>
          </span>
          <ExternalLink size={18} className="text-[#a8adbb]" />
        </a>
      </div>
    </footer>
  );
}
