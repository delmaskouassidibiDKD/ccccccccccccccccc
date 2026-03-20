import { SellerProduct } from "@/components/SellerProductCard";

export const DEMO_ENGROS: SellerProduct[] = [
  { id: "e1", shopName: "Ma Boutique", shopFlag: "🇨🇮", title: "Carton pagnes wax 50 pièces",      price: "180 000 FCFA", rating: 4.6, reviewCount: 34, status: "active",   icon: "cube-outline",   color: "#3B5998", minQty: "50 pcs"    },
  { id: "e2", shopName: "Ma Boutique", shopFlag: "🇨🇮", title: "Palette huile de palme 24 bidons", price: "72 000 FCFA",  rating: 4.3, reviewCount: 19, status: "active",   icon: "leaf-outline",   color: "#3B7A43", minQty: "24 bidons" },
  { id: "e3", shopName: "Ma Boutique", shopFlag: "🇨🇮", title: "Carton savon karité 100 pcs",      price: "45 000 FCFA",  rating: 4.1, reviewCount: 11, status: "inactive", icon: "flower-outline", color: "#9B2B6B", minQty: "100 pcs"   },
];

export const DELETED_ENGROS_KEY = "@dkd:deleted_engros_ids";
