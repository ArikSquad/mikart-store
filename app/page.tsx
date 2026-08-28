import { HomeContent } from "@/components/store/home-content";
import { StoreShell } from "@/components/store/store-shell";
import { getStorefront } from "@/lib/tebex";

export default async function HomePage() {
  const data = await getStorefront();

  return (
    <StoreShell data={data} activeSlug="home">
      <HomeContent />
    </StoreShell>
  );
}
