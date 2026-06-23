import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-ink-800 p-6 text-white">
      <section className="rounded-[14px] bg-ink-900 p-8 text-center">
        <p className="text-sm font-black uppercase text-cyan-pop">404</p>
        <h1 className="mt-2 text-3xl font-black">Category not found</h1>
        <Button asChild className="mt-6">
          <Link href="/">Back home</Link>
        </Button>
      </section>
    </main>
  );
}
