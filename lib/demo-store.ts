import type { CartState, SidebarData, StoreCategory, StoreProduct, StorefrontData } from "@/lib/types";

const currency = "EUR";

const products: StoreProduct[] = [
  {
    id: 101,
    name: "VIP Rank",
    price: 1.00,
    currency,
    image: "/rank-vip.svg",
    categorySlug: "ranks",
    description: "A lightweight rank with starter commands, prefix cosmetics, and queue priority.",
    descriptionHtml:
      "<table><tbody><tr><td>yes</td><td>Click the rank image to see more information<br /></td></tr><tr><td>yes</td><td>/hat command</td></tr><tr><td>yes</td><td>Cool prefix</td></tr><tr><td>no</td><td>people saying you're poor</td></tr></tbody></table><p><br /></p><p>Includes:</p>",
    detailsHtml: "<p>A lightweight rank with starter commands, prefix cosmetics, and queue priority.</p><p>Includes:</p>",
    quantityLimit: 1,
    userLimit: 1,
    features: [
      { text: "Click the rank image to see more information", positive: true },
      { text: "/hat command", positive: true },
      { text: "Cool prefix", positive: true },
      { text: "people saying you're poor", positive: false },
    ],
  },
  {
    id: 102,
    name: "VIP+ Rank",
    price: 1.00,
    currency,
    image: "/rank-vip-plus.svg",
    categorySlug: "ranks",
    description: "Expanded rank perks, custom chat color, and inherited VIP benefits.",
    descriptionHtml:
      "<table><tbody><tr><td>yes</td><td>Click the rank image to see more information<br /></td></tr><tr><td>yes</td><td>all from previous rank</td></tr><tr><td>yes</td><td>custom + color</td></tr><tr><td>no</td><td>bad issues</td></tr></tbody></table><p><br /></p><p>Includes:</p>",
    detailsHtml: "<p>Expanded rank perks, custom chat color, and inherited VIP benefits.</p><p>Includes:</p>",
    quantityLimit: 1,
    userLimit: 1,
    features: [
      { text: "Click the rank image to see more information", positive: true },
      { text: "all from previous rank", positive: true },
      { text: "custom + color", positive: true },
      { text: "bad issues", positive: false },
    ],
  },
  {
    id: 103,
    name: "TITAN Rank (-20% off)",
    price: 1.00,
    currency,
    image: "/rank-titan.svg",
    categorySlug: "ranks",
    description: "The premium rank with the strongest bundle of commands and cosmetics.",
    descriptionHtml:
      "<table style=\"width:19%;\"><tbody><tr><td style=\"width:17.0634%;\">yes</td><td style=\"width:82.5799%;\">Click the rank image to see more information<br /></td></tr><tr><td style=\"width:17.0634%;\">yes</td><td style=\"width:82.5799%;\">all from previous rank</td></tr><tr><td style=\"width:17.0634%;\">yes</td><td style=\"width:82.5799%;\">/feed command</td></tr><tr><td style=\"width:17.0634%;\">yes</td><td style=\"width:82.5799%;\">tax evasion</td></tr></tbody></table><p><br /></p><p>Includes:</p>",
    detailsHtml: "<p>The premium rank with the strongest bundle of commands and cosmetics.</p><p>Includes:</p>",
    quantityLimit: 1,
    userLimit: 1,
    salePercent: 20,
    features: [
      { text: "Click the rank image to see more information", positive: true },
      { text: "all from previous rank", positive: true },
      { text: "/feed command", positive: true },
      { text: "tax evasion", positive: true },
    ],
  },
  {
    id: 201,
    name: "Ruby Crate Bundle",
    price: 4.99,
    currency,
    image: "/crate-ruby.svg",
    categorySlug: "crates",
    description: "A stackable crate bundle with cosmetic drops and seasonal rewards.",
    descriptionHtml: "<p>A stackable crate bundle with cosmetic drops and seasonal rewards.</p>",
    detailsHtml: "<p>A stackable crate bundle with cosmetic drops and seasonal rewards.</p>",
    quantityLimit: 24,
    features: [
      { text: "Buy multiple at once", positive: true },
      { text: "Seasonal cosmetics", positive: true },
      { text: "Delivery after checkout", positive: true },
    ],
  },
  {
    id: 202,
    name: "Ocean Crate Bundle",
    price: 8.99,
    currency,
    image: "/crate-ocean.svg",
    categorySlug: "crates",
    description: "A bigger crate set for players who want more rolls in one purchase.",
    descriptionHtml: "<p>A bigger crate set for players who want more rolls in one purchase.</p>",
    detailsHtml: "<p>A bigger crate set for players who want more rolls in one purchase.</p>",
    quantityLimit: 24,
    features: [
      { text: "Quantity controls enabled", positive: true },
      { text: "Rare particle effects", positive: true },
      { text: "No rank limit conflict", positive: true },
    ],
  },
];

const sidebar: SidebarData = {
  modules: [
    {
      id: "top-customer",
      type: "top_customer",
      header: "Top Customer",
      username: "ArikSquad",
      avatar: "https://mc-heads.net/body/ArikSquad/96",
      total: 1,
    },
    {
      id: "recent-payments",
      type: "recent_payments",
      header: "Recent Payments",
      payments: ["MHF_Steve", "Notch", "Technoblade", "Jeb_", "Dinnerbone"].map((username) => ({
        username,
        avatar: `https://mc-heads.net/avatar/${username}/48`,
      })),
    },
    {
      id: "payment-goal",
      type: "payment_goal",
      header: "Monthly Goal",
      current: 68,
      target: 100,
      description: "Keeping the network fast.",
    },
  ],
  topCustomer: {
    name: "ArikSquad",
    caption: "Paid the most this year.",
    avatar: "https://mc-heads.net/body/ArikSquad/96",
  },
  recentPayments: ["MHF_Steve", "Notch", "Technoblade", "Jeb_", "Dinnerbone"].map((name) => ({
    name,
    avatar: `https://mc-heads.net/avatar/${name}/48`,
  })),
};

export const demoCategories: StoreCategory[] = [
  {
    id: 0,
    name: "Home",
    slug: "home",
    description: "Welcome to MikArt Europe Store",
    icon: "home",
    products: [],
  },
  {
    id: 1,
    name: "Ranks",
    slug: "ranks",
    description: "To see more features of a rank, click it's picture.",
    icon: "crown",
    products: products.filter((product) => product.categorySlug === "ranks"),
  },
  {
    id: 2,
    name: "Crates",
    slug: "crates",
    description: "Crates are stackable, delivered after checkout, and support quantity purchases.",
    icon: "box",
    products: products.filter((product) => product.categorySlug === "crates"),
  }
];

export const demoStorefront: StorefrontData = {
  categories: demoCategories,
  sidebar,
  currency,
};

export function createDemoCart(lines: CartState["lines"] = []): CartState {
  const basePrice = lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);
  const salesTax = Number((basePrice * 0.24).toFixed(2));

  return {
    ident: "demo-basket",
    lines,
    coupons: [],
    giftcards: [],
    creatorCode: null,
    basePrice,
    salesTax,
    totalPrice: Number((basePrice + salesTax).toFixed(2)),
    currency,
    checkoutUrl: null,
    authUrl: null,
    demo: true,
  };
}

export function findDemoProduct(productId: number) {
  return products.find((product) => product.id === productId);
}
