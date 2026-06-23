export type StoreProduct = {
  id: number;
  name: string;
  price: number;
  currency: string;
  image: string;
  categorySlug: string;
  description: string;
  descriptionHtml: string;
  detailsHtml: string;
  quantityLimit?: number;
  userLimit?: number;
  salePercent?: number;
  features: { text: string; positive: boolean }[];
};

export type StoreCategory = {
  id: number;
  name: string;
  slug: string;
  description: string;
  icon: "home" | "crown" | "box" | "newspaper";
  products: StoreProduct[];
};

export type SidebarData = {
  modules: SidebarModule[];
  topCustomer: {
    name: string;
    caption: string;
    avatar: string;
  };
  recentPayments: { name: string; avatar: string }[];
};

export type SidebarModule =
  | {
      id: string;
      type: "top_customer";
      header: string;
      username: string;
      usernameId?: string;
      avatar: string;
      total?: number;
    }
  | {
      id: string;
      type: "recent_payments";
      header: string;
      payments: { username: string; usernameId?: string; avatar: string; amount?: number }[];
    }
  | {
      id: string;
      type: "textbox";
      header: string;
      html: string;
    }
  | {
      id: string;
      type: "featured_package";
      header: string;
      packageId?: number;
      name: string;
      image?: string;
      price?: number;
      currency?: string;
    }
  | {
      id: string;
      type: "giftcard_balance";
      header: string;
    }
  | {
      id: string;
      type: "server_status";
      header: string;
      online: boolean;
      players?: number;
      maxPlayers?: number;
    }
  | {
      id: string;
      type: "payment_goal" | "community_goal";
      header: string;
      current: number;
      target: number;
      description?: string;
    };

export type StorefrontData = {
  categories: StoreCategory[];
  sidebar: SidebarData;
  currency: string;
};

export type CartLine = {
  packageId: number;
  name: string;
  quantity: number;
  unitPrice: number;
  image: string;
  quantityLimit?: number;
  userLimit?: number;
};

export type CartState = {
  ident: string | null;
  lines: CartLine[];
  coupons: string[];
  giftcards: string[];
  creatorCode?: string | null;
  basePrice: number;
  salesTax: number;
  totalPrice: number;
  currency: string;
  checkoutUrl?: string | null;
  authUrl?: string | null;
  demo: boolean;
};
