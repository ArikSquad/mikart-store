import { notFound } from "next/navigation";
import { Suspense } from "react";
import { HomeContent } from "@/components/store/home-content";
import { ProductGrid } from "@/components/store/product-card";
import { RichHtml } from "@/components/store/rich-html";
import { StoreShell } from "@/components/store/store-shell";
import { StoreSkeleton } from "@/components/store/skeletons";
import { getStorefront } from "@/lib/tebex";
import { slugify } from "@/lib/utils";

export async function generateStaticParams() {
  const data = await getStorefront();
  return data.categories
    .map((category) => category.slug ?? slugify(category.name))
    .filter((slug) => slug !== "home")
    .map((slug) => ({ slug }));
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const [{ slug }, data] = await Promise.all([params, getStorefront()]);
  const category = data.categories.find((item) => (item.slug ?? slugify(item.name)) === slug);
  if (!category) notFound();

  return (
    <StoreShell data={data} activeSlug={slug}>
        <div className="space-y-6">
          <section className="rounded-[14px] bg-ink-900 p-6">
            <h1 className="text-3xl font-black">{category.name}</h1>
            <RichHtml html={category.description} className="mt-2" />
          </section>
          <Suspense fallback={<StoreSkeleton />}>
            <ProductGrid products={category.packages ?? []} />
          </Suspense>
        </div>
    </StoreShell>
  );
}
