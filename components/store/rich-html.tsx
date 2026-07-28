import { cn } from "@/lib/utils";
import sanitizeHtml from "sanitize-html";

export function RichHtml({ html, className }: { html: string; className?: string }) {
  if (!html) return null;
  const safeHtml = sanitizeHtml(html, {
    allowedTags: ["p", "br", "strong", "b", "em", "i", "u", "ul", "ol", "li", "a", "span"],
    allowedAttributes: { a: ["href", "target", "rel"] },
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer", target: "_blank" }),
    },
  });

  return (
    <div
      className={cn(
        "space-y-3 text-sm leading-6 text-[#c7cad6] [&_a]:font-black [&_a]:text-cyan-pop [&_li]:ml-5 [&_li]:list-disc [&_strong]:text-white",
        className
      )}
      dangerouslySetInnerHTML={{ __html: safeHtml }}
    />
  );
}
