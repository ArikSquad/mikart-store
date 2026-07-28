"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  BadgeDollarSign,
  Box,
  Crown,
  Gift,
  Home,
  Newspaper,
  PlayCircle,
  Server,
  Star,
  Target,
  Users,
} from "lucide-react";
import { RichHtml } from "@/components/store/rich-html";
import type { Category, MinecraftServerStatus, Module } from "@/lib/types";
import { cn, formatMoney, slugify } from "@/lib/utils";

export function Sidebar({
  categories,
  modules,
  activeSlug,
}: {
  categories: Category[];
  modules: Module[];
  activeSlug: string;
}) {
  return (
    <aside className="hidden h-fit w-[392px] shrink-0 rounded-none bg-ink-900 px-6 py-8 lg:block lg:rounded-[18px] xl:px-8">
      <ServerButton />
      <Link href="/" className="mx-auto mt-8 block h-[250px] w-[250px]" aria-label="MikArt home">
        <img src="/logo.png" alt="MikArt" className="h-full w-full object-cover rounded-md" />
      </Link>

      <nav className="mt-6 space-y-2">
        <Link
          href="/"
          className={cn(
            "flex h-[60px] items-center gap-5 rounded-[14px] px-6 text-[15px] font-black transition",
            activeSlug === "home"
              ? "border-2 border-cyan-pop bg-[#123550] text-cyan-pop"
              : "text-[#d9dbe3] hover:bg-ink-850 hover:text-white"
          )}
        >
          <Home
            size={19}
            className={activeSlug === "home" ? "fill-cyan-pop/25" : "text-[#9fa4b3]"}
            strokeWidth={3}
          />
          Home
        </Link>
        {categories.map((category) => {
          const slug = category.slug ?? slugify(category.name);
          const Icon = slug.includes("crate") ? Box : slug.includes("rank") ? Crown : Newspaper;
          const active = activeSlug === slug;
          return (
            <Link
              key={category.id}
              href={slug === "home" ? "/" : `/category/${slug}`}
              className={cn(
                "flex h-[60px] items-center gap-5 rounded-[14px] px-6 text-[15px] font-black transition",
                active
                  ? "border-2 border-cyan-pop bg-[#123550] text-cyan-pop"
                  : "text-[#d9dbe3] hover:bg-ink-850 hover:text-white"
              )}
            >
              <Icon size={19} className={active ? "fill-cyan-pop/25" : "text-[#9fa4b3]"} strokeWidth={3} />
              {category.name}
            </Link>
          );
        })}
      </nav>

      <div className="mt-8 space-y-6">
        {modules.map((module) => (
          <SidebarModuleCard key={module.id} module={module} />
        ))}
      </div>
    </aside>
  );
}

function SidebarModuleCard({ module }: { module: Module }) {
  if (module.type === "top_customer") {
    return (
      <section className="rounded-[14px] bg-ink-800 p-6">
        <h2 className="flex items-center gap-3 text-xl font-black">
          <Star size={24} className="fill-white" />
          {module.data.header}
        </h2>
        <div className="mt-4 flex items-center gap-4">
          <div className="grid h-[136px] w-20 place-items-center overflow-hidden rounded-[12px] bg-ink-950">
            <img src={`https://mc-heads.net/body/${encodeURIComponent(module.data.username_id || module.data.username)}/96`} alt="" className="h-[112px] object-contain" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-lg font-black">{module.data.username}</p>
            <p className="text-[15px] text-[#c3c6d2]">
              {module.data.total ? `Paid ${module.data.total} this year.` : "Paid the most this year."}
            </p>
          </div>
        </div>
      </section>
    );
  }

  if (module.type === "recent_payments") {
    const payments = module.data.payments;
    return (
      <section className="rounded-[14px] bg-ink-800 p-6">
        <h2 className="flex items-center gap-3 text-xl font-black">
          <Users size={24} />
          {module.data.header}
        </h2>
        <div className="mt-4 flex gap-2">
          {payments.slice(0, 5).map((payment) => (
            <div key={`${payment.username}-${payment.username_id}`} className="group relative">
              <img
                src={`https://mc-heads.net/avatar/${encodeURIComponent(payment.username_id || payment.username)}/48`}
                alt={payment.username}
                className="h-10 w-10 rounded-[8px] bg-ink-950 transition group-hover:-translate-y-1 group-hover:rotate-[-5deg]"
              />
              <div className="pointer-events-none absolute bottom-[52px] left-1/2 z-20 hidden min-w-[230px] -translate-x-1/2 items-center gap-3 rounded-[12px] bg-ink-900 p-3 shadow-2xl group-hover:flex">
                <img src={`https://mc-heads.net/avatar/${encodeURIComponent(payment.username_id || payment.username)}/48`} alt="" className="h-10 w-10 rounded-[8px]" />
                <div className="min-w-0">
                  <p className="truncate font-black">{payment.username}</p>
                  {payment.price ? <p className="text-xs text-[#aeb3c4]">{formatMoney(payment.price, payment.currency ?? undefined)}</p> : null}
                </div>
              </div>
            </div>
          ))}
          <div className="h-10 w-10 rounded-[8px] bg-ink-950" />
        </div>
      </section>
    );
  }

  if (module.type === "textbox") {
    return (
      <section className="rounded-[14px] bg-ink-800 p-6">
        <h2 className="mb-3 flex items-center gap-3 text-xl font-black">
          <Newspaper size={22} />
          {module.data.header}
        </h2>
        <RichHtml html={module.data.text} />
      </section>
    );
  }

  if (module.type === "featured_package") {
    return (
      <section className="rounded-[14px] bg-ink-800 p-6">
        <h2 className="mb-4 flex items-center gap-3 text-xl font-black">
          <BadgeDollarSign size={22} />
          {module.data.header}
        </h2>
        {module.data.package.image ? <img src={module.data.package.image} alt="" className="mb-4 h-24 w-full rounded-[10px] object-contain bg-ink-950" /> : null}
        <p className="font-black">{module.data.package.name}</p>
        <p className="mt-1 text-sm text-[#c3c6d2]">{formatMoney(module.data.package.total_price, module.data.package.currency)}</p>
      </section>
    );
  }

  if (module.type === "server_status") {
    return (
      <section className="rounded-[14px] bg-ink-800 p-6">
        <h2 className="flex items-center gap-3 text-xl font-black">
          <Server size={22} />
          {module.data.header}
        </h2>
        <p className={cn("mt-3 font-black", module.data.online ? "text-[#42e95d]" : "text-[#ff4545]")}>
          {module.data.online ? "Online" : "Offline"}
        </p>
        {module.data.players ? (
          <p className="text-sm text-[#c3c6d2]">
            {module.data.players.online}/{module.data.players.max} players
          </p>
        ) : null}
      </section>
    );
  }

  if (module.type === "giftcard_balance") {
    return (
      <section className="rounded-[14px] bg-ink-800 p-6">
        <h2 className="flex items-center gap-3 text-xl font-black">
          <Gift size={22} />
          {module.data.header}
        </h2>
        <p className="mt-3 text-sm text-[#c3c6d2]">Apply a gift card from the basket drawer.</p>
      </section>
    );
  }

  return <GoalModule module={module} />;
}

function GoalModule({ module }: { module: Extract<Module, { type: "payment_goal" | "community_goal" }> }) {
  const percent = module.data.percentage;

  return (
    <section className="rounded-[14px] bg-ink-800 p-6">
      <h2 className="flex items-center gap-3 text-xl font-black">
        <Target size={22} />
        {module.data.header}
      </h2>
      <div className="mt-4 h-3 overflow-hidden rounded-full bg-ink-950">
        <div className="h-full rounded-full bg-cyan-pop" style={{ width: `${percent}%` }} />
      </div>
      <p className="mt-2 text-sm font-black text-cyan-pop">{percent}% complete</p>
    </section>
  );
}

function ServerButton() {
  const [status, setStatus] = useState<MinecraftServerStatus>({ online: false, players: 0 });

  useEffect(() => {
    let active = true;
    async function loadStatus() {
      try {
        const response = await fetch("/api/server-status", { cache: "no-store" });
        const nextStatus = (await response.json()) as MinecraftServerStatus;
        if (active) setStatus(nextStatus);
      } catch {
        if (active) setStatus({ online: false, players: 0 });
      }
    }
    loadStatus();
    const interval = window.setInterval(loadStatus, 30000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, []);

  return (
    <a
      href="minecraft://?addExternalServer=MikArt|play.mikart.eu:25565"
      className="mx-auto flex h-[70px] max-w-[345px] flex-col items-center justify-center rounded-[16px] border-2 border-orange-pop bg-[#302525] text-orange-pop"
    >
      <span className="inline-flex items-center gap-2 text-[15px] font-black">
        <PlayCircle size={17} className="fill-orange-pop" />
        Play Now
      </span>
      <span className="mt-1 rounded-[8px] bg-[#493020] px-3 py-0.5 text-[11px] font-black uppercase">
        {status.online ? `${status.players} Online` : "Checking..."}
      </span>
    </a>
  );
}
