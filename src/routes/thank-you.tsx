import { createFileRoute, Link } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/thank-you")({ component: ThankYouPage });

function ThankYouPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-ink-800 p-6 text-white">
      <section className="w-full max-w-[520px] rounded-[14px] bg-ink-900 p-8 text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#153f2b] text-[#42e95d]">
          <Check size={30} strokeWidth={3} />
        </div>
        <p className="mt-6 text-sm font-black uppercase text-cyan-pop">Payment complete</p>
        <h1 className="mt-2 text-3xl font-black">Thank you for your purchase!</h1>
        <p className="mt-4 leading-7 text-[#c7cad6]">
          Your purchase has been submitted. Any in-game items will be delivered to the selected
          Minecraft account.
        </p>
        <Button asChild className="mt-8 w-full">
          <Link to="/">Back to store</Link>
        </Button>
      </section>
    </main>
  );
}
