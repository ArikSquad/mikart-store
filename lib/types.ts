export type ApiResponse<T> = {
  data: T;
};

export type BaseItem = {
  id: number;
  name: string;
};

export type PackageMedia = {
  type: "video" | "image";
  name: string | null;
  url: string;
  primary?: boolean;
  featured?: boolean;
};

export type RevenueShare = {
  wallet_ref: string;
  amount: number;
  gateway_fee_percent: number;
};

export type TierStatus = {
  id: number;
  description: string;
};

export type PendingDowngradePackage = {
  id: number;
  name: string;
};

export type Tier = {
  id: number;
  created_at: string;
  username_id: string;
  package: Package;
  active: boolean;
  recurring_payment_reference: string;
  next_payment_date: string;
  status: TierStatus;
  pending_downgrade_package: PendingDowngradePackage | null;
};

export type PackageType = "subscription" | "single" | "both" | (string & {});

export type UserLimit =
  | number
  | {
      limit?: number | null;
      period_length?: number | null;
      period_unit?: string | null;
    }
  | null;

export type Package = BaseItem & {
  description: string;
  type: PackageType;
  disable_gifting: boolean;
  disable_quantity: boolean;
  expiration_date: string | null;
  currency: string;
  category: BaseItem;
  base_price: number;
  sales_tax: number;
  total_price: number;
  prorate_price?: number | null;
  discount: number;
  image: string | null;
  media: PackageMedia[];
  created_at: string;
  updated_at: string;
  order?: number;
  slug?: string | null;
  variables?: string[];
  user_limit?: UserLimit;
  options?: unknown;
  creator_meta_data?: unknown;
};

export type Category = BaseItem & {
  description: string;
  parent: Category | null;
  order: number;
  packages: Package[] | null;
  display_type: "grid" | "list";
  slug: string | null;
  tiered?: boolean;
  active_tier?: Tier | null;
  image_url?: string | null;
  dynamic?: boolean;
};

export type CouponCode = {
  coupon_code: string;
};

export type GiftCardCode = {
  card_number: string;
};

export type InBasket = {
  quantity: number;
  price: number;
  gift_username_id: string | null;
  gift_username: string | null;
};

export type BasketPackage = BaseItem & {
  description: string;
  in_basket: InBasket;
  image: string | null;
  disable_quantity?: boolean;
  user_limit?: UserLimit;
  qty?: number;
  type?: PackageType;
  revenue_share?: RevenueShare[];
};

export type BasketLinks = {
  payment?: string;
  checkout?: string;
};

export type Basket = {
  ident: string;
  complete: boolean;
  id: string;
  country: string;
  ip: string;
  username_id: string | number | null;
  username: string | null;
  cancel_url: string;
  complete_url: string | null;
  complete_auto_redirect: boolean;
  base_price: number;
  sales_tax: number;
  total_price: number;
  email: string | null;
  currency: string;
  packages: BasketPackage[];
  coupons: CouponCode[];
  giftcards: GiftCardCode[];
  creator_code: string | null;
  links: BasketLinks;
  custom: Record<string, unknown> | null;
};

export type AuthUrl = {
  name: string;
  url: string;
};

export type ModuleBase = {
  id: number;
  type: string;
  start_time: string;
  end_time: string | null;
  data: unknown;
};

export type TopCustomerData = {
  header: string;
  username: string;
  username_id: string;
  total?: number;
};

export type TopCustomerModule = ModuleBase & {
  type: "top_customer";
  data: TopCustomerData;
};

export type TextboxData = {
  header: string;
  text: string;
};

export type TextboxModule = ModuleBase & {
  type: "textbox";
  data: TextboxData;
};

export type RecentPayment = {
  username: string;
  username_id: string;
  avatar_url?: string;
  package?: { name: string };
  created_at?: string | null;
  price?: number | null;
  currency?: string | null;
};

export type RecentPaymentsData = {
  header: string;
  payments: RecentPayment[];
};

export type RecentPaymentsModule = ModuleBase & {
  type: "recent_payments";
  data: RecentPaymentsData;
};

export type FeaturedPackageData = {
  header: string;
  package: Package;
};

export type FeaturedPackageModule = ModuleBase & {
  type: "featured_package";
  data: FeaturedPackageData;
};

export type GiftcardBalanceData = {
  header: string;
};

export type GiftcardBalanceModule = ModuleBase & {
  type: "giftcard_balance";
  data: GiftcardBalanceData;
};

export type Players = {
  online: number;
  max: number;
};

export type ServerStatusData = {
  header: string;
  hostname: string;
  port: number;
  online: boolean;
  players: Players | null;
};

export type ServerStatusModule = ModuleBase & {
  type: "server_status";
  data: ServerStatusData;
};

export type PaymentGoalData = {
  header: string;
  percentage: number;
  bar_style: "normal" | "striped";
  bar_animated: boolean;
  total?: number | null;
  target?: number | null;
};

export type PaymentGoalModule = ModuleBase & {
  type: "payment_goal";
  data: PaymentGoalData;
};

export type CommunityGoalData = {
  header: string;
  bar_style: "normal" | "striped";
  bar_animated: boolean;
  percentage: number;
};

export type CommunityGoalModule = ModuleBase & {
  type: "community_goal";
  data: CommunityGoalData;
};

export type Module =
  | TopCustomerModule
  | TextboxModule
  | RecentPaymentsModule
  | FeaturedPackageModule
  | GiftcardBalanceModule
  | ServerStatusModule
  | PaymentGoalModule
  | CommunityGoalModule;

export type Storefront = {
  categories: Category[];
  modules: Module[];
  currency: string;
};

export type MinecraftServerStatus = {
  online: boolean;
  players: number;
  max_players?: number;
};

export type CheckoutResponse = {
  ident: string;
  checkout_url?: string | null;
  auth_url?: string | null;
};

export type PackageDetails = {
  detailsHtml: string;
  features: { text: string; positive: boolean }[];
};
