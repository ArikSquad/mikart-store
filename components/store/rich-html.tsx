import { cn } from "@/lib/utils";

export function RichHtml({ html, className }: { html: string; className?: string }) {
  if (!html) return null;

  return (
    <div
      className={cn(
        "space-y-3 text-sm leading-6 text-[#c7cad6] [&_a]:font-black [&_a]:text-cyan-pop [&_li]:ml-5 [&_li]:list-disc [&_strong]:text-white",
        className
      )}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
