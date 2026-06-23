import { notFound } from "next/navigation";
import { Suspense } from "react";
import { HomeContent } from "@/components/store/home-content";
import { ProductGrid } from "@/components/store/product-card";
import { StoreShell } from "@/components/store/store-shell";
import { StoreSkeleton } from "@/components/store/skeletons";
import { getStorefront } from "@/lib/tebex";

export async function generateStaticParams() {
  const data = await getStorefront();
  return data.categories
    .filter((category) => category.slug !== "home")
    .map((category) => ({ slug: category.slug }));
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const [{ slug }, data] = await Promise.all([params, getStorefront()]);
  const category = data.categories.find((item) => item.slug === slug);
  if (!category) notFound();

  return (
    <StoreShell data={data} activeSlug={category.slug}>
        <div className="space-y-6">
          <section className="rounded-[14px] bg-ink-900 p-6">
            <h1 className="text-3xl font-black">{category.name}</h1>
            <p className="mt-2 text-[#c7cad6]">{category.description}</p>
          </section>
          <Suspense fallback={<StoreSkeleton />}>
            <ProductGrid products={category.products} />
          </Suspense>
        </div>
    </StoreShell>
  );
}
