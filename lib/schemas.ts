import { z } from "zod";

const finiteNumber = z.number();
const nonNegativeNumber = finiteNumber.nonnegative();
const nullableString = z.string().nullable();

export const userLimitSchema = z.union([
  z.number().int().positive(),
  z.object({
    limit: z.number().int().positive().nullable().optional(),
    period_length: nonNegativeNumber.nullable().optional(),
    period_unit: nullableString.optional(),
  }),
  z.null(),
]);

export const packageSchema = z.object({
  id: z.number().int().positive(),
  name: z.string(),
  description: z.string(),
  disable_gifting: z.boolean(),
  disable_quantity: z.boolean(),
  currency: z.string(),
  base_price: finiteNumber,
  total_price: finiteNumber,
  discount: finiteNumber,
  image: nullableString,
  user_limit: userLimitSchema.optional(),
});

export const categorySchema = z.object({
  id: z.number().int().positive(),
  name: z.string(),
  description: z.string(),
  packages: z.array(packageSchema).nullable(),
  slug: nullableString,
});

const moduleBase = { id: z.number().int().positive() };

const topCustomerModuleSchema = z.object({
  ...moduleBase,
  type: z.literal("top_customer"),
  data: z.object({
    header: z.string(), username: z.string(), username_id: z.string(), total: finiteNumber.optional(),
  }),
});
const textboxModuleSchema = z.object({
  ...moduleBase,
  type: z.literal("textbox"),
  data: z.object({ header: z.string(), text: z.string() }),
});
const recentPaymentsModuleSchema = z.object({
  ...moduleBase,
  type: z.literal("recent_payments"),
  data: z.object({
    header: z.string(),
    payments: z.array(z.object({
      username: z.string(),
      username_id: z.string(),
      created_at: nullableString.optional(),
      price: finiteNumber.nullable().optional(),
      currency: nullableString.optional(),
    })),
  }),
});
const featuredPackageModuleSchema = z.object({
  ...moduleBase,
  type: z.literal("featured_package"),
  data: z.object({ header: z.string(), package: packageSchema }),
});
const giftcardBalanceModuleSchema = z.object({
  ...moduleBase,
  type: z.literal("giftcard_balance"),
  data: z.object({ header: z.string() }),
});
const serverStatusModuleSchema = z.object({
  ...moduleBase,
  type: z.literal("server_status"),
  data: z.object({
    header: z.string(),
    hostname: z.string(),
    port: z.number().int().nonnegative(),
    online: z.boolean(),
    players: z.object({ online: nonNegativeNumber, max: nonNegativeNumber }).nullable(),
  }),
});
const goalData = z.object({
  header: z.string(),
  percentage: finiteNumber,
  bar_style: z.enum(["normal", "striped"]),
  bar_animated: z.boolean(),
  total: finiteNumber.nullable().optional(),
  target: finiteNumber.nullable().optional(),
});
const paymentGoalModuleSchema = z.object({
  ...moduleBase, type: z.literal("payment_goal"), data: goalData,
});
const communityGoalModuleSchema = z.object({
  ...moduleBase, type: z.literal("community_goal"), data: goalData,
});

export const moduleSchema = z.discriminatedUnion("type", [
  topCustomerModuleSchema,
  textboxModuleSchema,
  recentPaymentsModuleSchema,
  featuredPackageModuleSchema,
  giftcardBalanceModuleSchema,
  serverStatusModuleSchema,
  paymentGoalModuleSchema,
  communityGoalModuleSchema,
]);

export const storefrontSchema = z.object({
  categories: z.array(categorySchema),
  modules: z.array(moduleSchema),
  currency: z.string(),
});

export const basketPackageSchema = z.object({
  id: z.number().int().positive(),
  name: z.string(),
  description: z.string(),
  image: nullableString,
  in_basket: z.object({
    quantity: z.number().int().positive(),
    price: finiteNumber,
    gift_username_id: nullableString,
    gift_username: nullableString,
  }),
  disable_quantity: z.boolean().optional(),
  user_limit: userLimitSchema.optional(),
});

export const basketSchema = z.object({
  ident: z.string(),
  complete: z.boolean(),
  id: z.string(),
  country: z.string(),
  ip: z.string(),
  username_id: z.union([z.string(), finiteNumber, z.null()]),
  username: nullableString,
  cancel_url: z.string(),
  complete_url: nullableString,
  complete_auto_redirect: z.boolean(),
  base_price: finiteNumber,
  sales_tax: finiteNumber,
  total_price: finiteNumber,
  email: nullableString,
  currency: z.string(),
  packages: z.array(basketPackageSchema),
  coupons: z.array(z.object({ coupon_code: z.string() })),
  giftcards: z.array(z.object({ card_number: z.string() })),
  creator_code: nullableString,
  links: z.object({ payment: z.string().optional(), checkout: z.string().optional() }),
});

export const minecraftServerStatusSchema = z.object({
  online: z.boolean(), players: nonNegativeNumber, max_players: nonNegativeNumber.optional(),
});
