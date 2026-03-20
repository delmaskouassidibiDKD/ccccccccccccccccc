import { SellerProduct } from "@/components/SellerProductCard";

export const DEMO_ARTICLES: SellerProduct[] = [
  { id: "a1", shopName: "Ma Boutique", shopFlag: "🇨🇮", title: "Savon Karité Naturel",   price: "1 500 FCFA",  rating: 4.7, reviewCount: 430, status: "active",   icon: "sparkles-outline",  color: "#4A7C59" },
  { id: "a2", shopName: "Ma Boutique", shopFlag: "🇨🇮", title: "Chaussures Cuir Homme",  price: "18 500 FCFA", rating: 4.4, reviewCount: 203, status: "active",   icon: "footsteps-outline", color: "#7B4226" },
  { id: "a3", shopName: "Ma Boutique", shopFlag: "🇨🇮", title: "Pagne Wax Java 6 yards", price: "12 500 FCFA", rating: 4.9, reviewCount: 178, status: "active",   icon: "shirt-outline",     color: "#1B4D9E" },
];

export const DELETED_ARTICLES_KEY = "@dkd:deleted_article_ids";
