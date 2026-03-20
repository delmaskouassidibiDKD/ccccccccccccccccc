export type VideoPublication = {
  id: string;
  title: string;
  shopName: string;
  shopFlag: string;
  duration: string;
  views: number;
  likes: number;
  comments: number;
  price: string;
  color: string;
  icon: string;
  status: "published" | "draft";
  videoUrl?: string;
};

export const DEMO_VIDEOS: VideoPublication[] = [
  { id: "v1", shopName: "Savons Ouaga",  shopFlag: "🇧🇫", title: "Présentation savon karité naturel",    duration: "1:24", views: 1240, likes: 342, comments: 58, price: "1 500 FCFA",  color: "#4A7C59", icon: "sparkles-outline",      status: "published" },
  { id: "v2", shopName: "Mode Dakar",    shopFlag: "🇸🇳", title: "Collection pagne wax printemps 2025",  duration: "2:08", views: 876,  likes: 215, comments: 33, price: "12 500 FCFA", color: "#1B4D9E", icon: "shirt-outline",         status: "published" },
  { id: "v3", shopName: "Cuir Cotonou",  shopFlag: "🇧🇯", title: "Nouveau modèle chaussures cuir",       duration: "0:58", views: 322,  likes: 88,  comments: 12, price: "18 500 FCFA", color: "#7B4226", icon: "footsteps-outline",     status: "draft"     },
  { id: "v4", shopName: "Savons Ouaga",  shopFlag: "🇧🇫", title: "Recette savon liquide maison",          duration: "3:10", views: 2100, likes: 510, comments: 97, price: "900 FCFA",   color: "#A16207", icon: "water-outline",         status: "published" },
  { id: "v5", shopName: "Mode Dakar",    shopFlag: "🇸🇳", title: "Tenue soirée pagne wax",               duration: "1:45", views: 654,  likes: 178, comments: 24, price: "22 000 FCFA", color: "#7E22CE", icon: "color-palette-outline", status: "published" },
  { id: "v6", shopName: "Cuir Cotonou",  shopFlag: "🇧🇯", title: "Entretien chaussures cuir - astuces",  duration: "2:33", views: 489,  likes: 102, comments: 18, price: "18 500 FCFA", color: "#B45309", icon: "construct-outline",     status: "draft"     },
];
