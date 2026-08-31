import { createFileRoute } from "@tanstack/react-router";
import { HomeContent } from "@/components/store/home-content";
import { StoreShell } from "@/components/store/store-shell";
import { getStorefrontServer } from "@/lib/server-functions";

export const Route = createFileRoute("/")({
  loader: () => getStorefrontServer(),
  pendingComponent: StoreLoading,
  component: HomePage,
});

function HomePage() {
  const data = Route.useLoaderData();
  return (
    <StoreShell data={data} activeSlug="home">
      <HomeContent />
    </StoreShell>
  );
}

function StoreLoading() {
  return <div className="min-h-screen bg-ink-800" />;
}
