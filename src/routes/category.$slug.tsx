import { createFileRoute, notFound } from "@tanstack/react-router";
import { ProductGrid } from "@/components/store/product-card";
import { RichHtml } from "@/components/store/rich-html";
import { StoreShell } from "@/components/store/store-shell";
import { getStorefrontServer } from "@/lib/server-functions";
import { slugify } from "@/lib/utils";

export const Route = createFileRoute("/category/$slug")({
  loader: async ({ params }) => {
    const data = await getStorefrontServer();
    const category = data.categories.find(
      (item) => (item.slug ?? slugify(item.name)) === params.slug,
    );
    if (!category) throw notFound();
    return { data, category };
  },
  component: CategoryPage,
});

function CategoryPage() {
  const { data, category } = Route.useLoaderData();
  const { slug } = Route.useParams();

  return (
    <StoreShell data={data} activeSlug={slug}>
      <div className="space-y-6">
        <section className="rounded-[14px] bg-ink-900 p-6">
          <h1 className="text-3xl font-black">{category.name}</h1>
          <RichHtml html={category.description} className="mt-2" />
        </section>
        <ProductGrid products={category.packages ?? []} />
      </div>
    </StoreShell>
  );
}
