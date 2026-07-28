import sanitizeHtml from "sanitize-html";
import type { PackageDetails } from "@/lib/types";

function cleanHtml(html: string) {
  return sanitizeHtml(html, {
    allowedTags: ["p", "br", "strong", "b", "em", "i", "u", "ul", "ol", "li", "a", "span"],
    allowedAttributes: { a: ["href", "target", "rel"] },
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer", target: "_blank" }),
    },
  }).trim();
}

function stripTags(html: string) {
  return sanitizeHtml(html, { allowedTags: [], allowedAttributes: {} })
    .replace(/\s+/g, " ")
    .trim();
}

export function getPackageDetails(description: string): PackageDetails {
  const tablePattern = /<table[\s\S]*?<\/table>/i;
  const table = description.match(tablePattern)?.[0] ?? "";
  const features = Array.from(table.matchAll(/<tr[\s\S]*?<\/tr>/gi))
    .map((row) => Array.from(row[0].matchAll(/<td[\s\S]*?>([\s\S]*?)<\/td>/gi)).map((cell) => stripTags(cell[1])))
    .filter((cells) => cells.length >= 2)
    .map(([flag, ...rest]) => ({
      positive: ["yes", "y", "true", "1", "check", "✓"].includes(flag.toLowerCase()),
      text: rest.join(" ").trim(),
    }))
    .filter((feature) => feature.text.length > 0);

  return {
    description_html: cleanHtml(description),
    details_html: cleanHtml(description.replace(tablePattern, "")),
    features,
  };
}
