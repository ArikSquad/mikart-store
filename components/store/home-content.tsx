import { ShieldAlert, UserCheck } from "lucide-react";

export function HomeContent() {
  return (
    <div className="space-y-6">
      <section className="rounded-[14px] bg-ink-900 p-6 md:p-8">
        <p className="text-sm font-black uppercase text-cyan-pop">Welcome to</p>
        <h1 className="mt-1 text-4xl font-black tracking-normal">MikArt Europe Store</h1>
        <p className="mt-7 max-w-[880px] leading-7 text-[#c7cad6]">
          Welcome to our store, where you can find upgrades to support the server. We truly
          appreciate your help.
        </p>
        <h2 className="mt-6 text-2xl font-black">About MikArt Europe</h2>
        <p className="mt-3 max-w-[880px] leading-7 text-[#c7cad6]">
          We are a small team from Europe that hosts and codes projects for everybody to enjoy. All
          these projects, servers and code are only possible because of the community&apos;s help!
        </p>
        <p className="mt-4 text-[#c7cad6]">
          Join the Minecraft server using the IP{" "}
          <span className="rounded-[6px] bg-[#123550] px-2 py-1 text-cyan-pop">play.mikart.eu</span>
        </p>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-[14px] bg-ink-900 p-6">
          <h2 className="flex items-center gap-3 text-xl font-black text-[#ff3838]">
            <ShieldAlert size={22} className="fill-[#ff3838]/20" />
            Refund Policy
          </h2>
          <p className="mt-4 leading-6 text-[#c7cad6]">
            All payments are <strong className="text-white">final</strong> and{" "}
            <strong className="text-white">non-refundable</strong>. Attempting a chargeback or
            opening a PayPal dispute will result in permanent and irreversible banishment from all
            of our servers, and other stores.
          </p>
        </section>

        <section className="rounded-[14px] bg-ink-900 p-6">
          <h2 className="flex items-center gap-3 text-xl font-black text-cyan-pop">
            <UserCheck size={22} className="fill-cyan-pop/20" />
            Privacy Policy
          </h2>
          <p className="mt-4 leading-6 text-[#c7cad6]">
            All information that is required on this webstore is not shared with any other third
            parties and is <strong className="text-white">stored securely</strong>. All payments are
            processed via SSL enabled gateways and ensure that your payment details are secure.
          </p>
        </section>
      </div>
    </div>
  );
}
