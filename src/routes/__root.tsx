import "@fontsource-variable/geist";
import "@fontsource-variable/geist-mono";
import type { ReactNode } from "react";
import {
  createRootRoute,
  HeadContent,
  Link,
  Outlet,
  Scripts,
} from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import styles from "@/app/globals.css?url";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "MikArt Europe Store" },
      {
        name: "description",
        content: "Webstore for MikArt Europe's Minecraft Server.",
      },
    ],
    links: [{ rel: "stylesheet", href: styles }],
  }),
  component: RootComponent,
  notFoundComponent: NotFound,
});

function RootComponent() {
  return (
    <RootDocument>
      <Outlet />
    </RootDocument>
  );
}

function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body className="antialiased">
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-ink-800 p-6 text-white">
      <section className="rounded-[14px] bg-ink-900 p-8 text-center">
        <p className="text-sm font-black uppercase text-cyan-pop">404</p>
        <h1 className="mt-2 text-3xl font-black">Category not found</h1>
        <Button asChild className="mt-6">
          <Link to="/">Back home</Link>
        </Button>
      </section>
    </main>
  );
}
