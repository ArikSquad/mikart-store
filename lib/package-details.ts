import type { PackageDetails } from "@/lib/types";
import { sanitizeRichHtml, stripHtml } from "@/lib/html";

const TABLE_PATTERN = /<table[\s\S]*?<\/table>/i;
const TABLE_ROW_PATTERN = /<tr[\s\S]*?<\/tr>/gi;
const TABLE_CELL_PATTERN = /<td[\s\S]*?>([\s\S]*?)<\/td>/gi;
const POSITIVE_FLAGS = new Set(["yes", "y", "true", "1", "check", "✓"]);

export function getPackageDetails(description: string): PackageDetails {
  const table = description.match(TABLE_PATTERN)?.[0] ?? "";
  const features = Array.from(table.matchAll(TABLE_ROW_PATTERN))
    .map(([rowHtml]) => Array.from(rowHtml.matchAll(TABLE_CELL_PATTERN)).map(([, cellHtml]) => stripHtml(cellHtml)))
    .filter((cells) => cells.length >= 2)
    .map(([flag, ...rest]) => ({
      positive: POSITIVE_FLAGS.has(flag.toLowerCase()),
      text: rest.join(" ").trim(),
    }))
    .filter((feature) => feature.text.length > 0);

  return {
    detailsHtml: sanitizeRichHtml(description.replace(TABLE_PATTERN, "")),
    features,
  };
}
