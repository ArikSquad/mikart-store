import type { z } from "zod";
import type {
  basketPackageSchema,
  basketSchema,
  categorySchema,
  minecraftServerStatusSchema,
  moduleSchema,
  packageSchema,
  storefrontSchema,
  userLimitSchema,
} from "@/lib/schemas";

export type UserLimit = z.infer<typeof userLimitSchema>;
export type Package = z.infer<typeof packageSchema>;
export type Category = z.infer<typeof categorySchema>;
export type Module = z.infer<typeof moduleSchema>;
export type Storefront = z.infer<typeof storefrontSchema>;
export type BasketPackage = z.infer<typeof basketPackageSchema>;
export type Basket = z.infer<typeof basketSchema>;
export type MinecraftServerStatus = z.infer<typeof minecraftServerStatusSchema>;

export type CheckoutResponse = {
  ident: string;
  checkout_url: string;
  auth_url: string | null;
};

export type PackageDetails = {
  detailsHtml: string;
  features: { text: string; positive: boolean }[];
};
