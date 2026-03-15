import React, { useCallback, useState, useRef, useEffect } from "react";
import { useFocusEffect } from "expo-router";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  FlatList,
  Dimensions,
  Platform,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  useAnimatedRef,
  useAnimatedReaction,
  scrollTo,
  withRepeat,
  withTiming,
  cancelAnimation,
  Easing,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { AppHeader } from "@/components/AppHeader";
import { CountryFilterModal, SortOption } from "@/components/CountryFilterModal";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api, Product, Country, Group } from "@/lib/api";
import { useTheme } from "@/contexts/ThemeContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { SideDrawer } from "@/components/SideDrawer";
import { ms, fs, W_SCREEN } from "@/lib/responsive";

const SCREEN_WIDTH = W_SCREEN;

const FALLBACK_COUNTRIES: { flag: string; code: string; name: string }[] = [
  { flag: "\u{1F1E8}\u{1F1EE}", code: "CI", name: "C\u00f4te d'Ivoire" },
  { flag: "\u{1F1F8}\u{1F1F3}", code: "SN", name: "S\u00e9n\u00e9gal" },
  { flag: "\u{1F1E7}\u{1F1EF}", code: "BJ", name: "B\u00e9nin" },
  { flag: "\u{1F1F9}\u{1F1EC}", code: "TG", name: "Togo" },
  { flag: "\u{1F1E8}\u{1F1F2}", code: "CM", name: "Cameroun" },
  { flag: "\u{1F1F2}\u{1F1F1}", code: "ML", name: "Mali" },
  { flag: "\u{1F1E7}\u{1F1EB}", code: "BF", name: "Burkina Faso" },
  { flag: "\u{1F1EC}\u{1F1F3}", code: "GN", name: "Guin\u00e9e" },
  { flag: "\u{1F1E8}\u{1F1EC}", code: "CG", name: "Congo" },
  { flag: "\u{1F1EC}\u{1F1E6}", code: "GA", name: "Gabon" },
];


const ACCENT_COLORS = ["#FF6B00", "#8B5CF6", "#3B82F6", "#22C55E", "#EC4899", "#F59E0B"];

function getAccentColor(index: number): string {
  return ACCENT_COLORS[index % ACCENT_COLORS.length];
}

function formatPrice(price: number, currency?: string): string {
  const formatted = Math.round(price).toLocaleString("fr-FR");
  return `${formatted} ${currency || "FCFA"}`;
}

const DEMO_WHOLESALE = [
  { id: 1, name: "Tissu Wax 6 yards", price: 8500, icon: "shirt-outline" as const, color: "#FF6B00", minOrder: 10 },
  { id: 2, name: "Itel A70 4G", price: 45000, icon: "phone-portrait-outline" as const, color: "#3B82F6", minOrder: 5 },
  { id: 3, name: "Huile Palme 5L", price: 6200, icon: "leaf-outline" as const, color: "#22C55E", minOrder: 20 },
  { id: 4, name: "Sac Cuir Marron", price: 15000, icon: "bag-handle-outline" as const, color: "#8B5CF6", minOrder: 3 },
  { id: 5, name: "Casque Bluetooth", price: 22000, icon: "headset-outline" as const, color: "#EC4899", minOrder: 5 },
  { id: 6, name: "Chaussures Sport", price: 18500, icon: "footsteps-outline" as const, color: "#F59E0B", minOrder: 6 },
  { id: 7, name: "Savon Karité x24", price: 4800, icon: "water-outline" as const, color: "#06B6D4", minOrder: 24 },
  { id: 8, name: "Riz Basmati 50kg", price: 35000, icon: "restaurant-outline" as const, color: "#84CC16", minOrder: 2 },
];

const DEMO_GROUP_BUYS = [
  { id: 1, name: "iPhone 14 Pro", price: 450000, remaining: 8, total: 20, icon: "phone-portrait-outline" as const, color: "#3B82F6" },
  { id: 2, name: 'TV Samsung 55"', price: 285000, remaining: 15, total: 30, icon: "tv-outline" as const, color: "#8B5CF6" },
  { id: 3, name: "Mixeur Pro Philips", price: 32000, remaining: 3, total: 10, icon: "restaurant-outline" as const, color: "#22C55E" },
  { id: 4, name: "Ventilateur Solaire", price: 48000, remaining: 12, total: 25, icon: "sunny-outline" as const, color: "#F59E0B" },
  { id: 5, name: "Réfrigérateur 2P", price: 195000, remaining: 6, total: 15, icon: "snow-outline" as const, color: "#06B6D4" },
  { id: 6, name: "Machine à Coudre", price: 78000, remaining: 4, total: 12, icon: "cut-outline" as const, color: "#EC4899" },
];

type DiscoveryProduct = {
  id: number; name: string; country: string; flag: string;
  price: number; rating: number; reviews: number;
  icon: string; accentColor: string; seller: string;
};

const DEMO_DISCOVERY: DiscoveryProduct[] = [
  { id: 1,  name: "Veste Kimono Artisanale",      seller: "Mode Abidjan",      country: "CI", flag: "🇨🇮", price: 25000, rating: 4.7, reviews: 190, icon: "shirt-outline",           accentColor: "#4D7C4F" },
  { id: 2,  name: "Smartphone Itel A70 4G",        seller: "TechShop CI",       country: "CI", flag: "🇨🇮", price: 45000, rating: 4.3, reviews: 312, icon: "phone-portrait-outline",   accentColor: "#1E3A5F" },
  { id: 3,  name: "Pagnes Wax Abidjan 6 Yards",    seller: "Wax & Co",          country: "CI", flag: "🇨🇮", price: 8500,  rating: 4.6, reviews: 287, icon: "color-palette-outline",    accentColor: "#9C3A00" },
  { id: 4,  name: "Tissu Wax Premium 6 Yards",     seller: "Dakar Tissus",      country: "SN", flag: "🇸🇳", price: 7500,  rating: 4.5, reviews: 210, icon: "color-palette-outline",    accentColor: "#7C3D6B" },
  { id: 5,  name: "Parfum Thiouraye Sénégal",      seller: "Parfums Baol",      country: "SN", flag: "🇸🇳", price: 9000,  rating: 4.8, reviews: 145, icon: "water-outline",            accentColor: "#5C2A00" },
  { id: 6,  name: "Sandales Cuir Artisan Dakar",   seller: "Artisan Plateau",   country: "SN", flag: "🇸🇳", price: 12000, rating: 4.3, reviews: 89,  icon: "footsteps-outline",        accentColor: "#704214" },
  { id: 7,  name: "Huile Palme Pure 5L",           seller: "Bio Douala",        country: "CM", flag: "🇨🇲", price: 6200,  rating: 4.8, reviews: 445, icon: "water-outline",            accentColor: "#5A7A3A" },
  { id: 8,  name: "Cacao en Poudre 1kg",           seller: "Cacao Yaoundé",     country: "CM", flag: "🇨🇲", price: 4500,  rating: 4.7, reviews: 321, icon: "cafe-outline",             accentColor: "#3B1A00" },
  { id: 9,  name: "Pagne Kaba Cameroun",           seller: "Tissus Foumban",    country: "CM", flag: "🇨🇲", price: 11000, rating: 4.4, reviews: 112, icon: "shirt-outline",            accentColor: "#1F5C3A" },
  { id: 10, name: "Beurre de Karité Bio 1kg",      seller: "Karité Burkina",    country: "BF", flag: "🇧🇫", price: 3500,  rating: 4.9, reviews: 523, icon: "leaf-outline",             accentColor: "#1F4D2B" },
  { id: 11, name: "Veste Bogolan Artisanale",      seller: "Artisan Bobo",      country: "BF", flag: "🇧🇫", price: 18000, rating: 4.6, reviews: 167, icon: "shirt-outline",            accentColor: "#7A4A1E" },
  { id: 12, name: "Savon Karité Naturel",          seller: "Savons Ouaga",      country: "BF", flag: "🇧🇫", price: 1500,  rating: 4.7, reviews: 430, icon: "sparkles-outline",         accentColor: "#5A6A2A" },
  { id: 13, name: "Casque Bluetooth Sans Fil",     seller: "TechLomé",          country: "TG", flag: "🇹🇬", price: 22000, rating: 4.1, reviews: 156, icon: "headset-outline",          accentColor: "#3B1F7A" },
  { id: 14, name: "Tissu Kente Togolais",          seller: "Kente Atelier",     country: "TG", flag: "🇹🇬", price: 14000, rating: 4.5, reviews: 203, icon: "color-palette-outline",    accentColor: "#8B5A00" },
  { id: 15, name: "Lampe Solaire LED 20W",         seller: "SolarTogo",         country: "TG", flag: "🇹🇬", price: 18500, rating: 4.2, reviews: 98,  icon: "flashlight-outline",       accentColor: "#1A4A6B" },
  { id: 16, name: "Sac en Cuir Artisanal",         seller: "Cuir Bamako",       country: "ML", flag: "🇲🇱", price: 15000, rating: 4.6, reviews: 98,  icon: "bag-handle-outline",       accentColor: "#6B3A00" },
  { id: 17, name: "Riz Basmati Long 5kg",          seller: "Grenier du Mali",   country: "ML", flag: "🇲🇱", price: 3500,  rating: 4.2, reviews: 178, icon: "restaurant-outline",       accentColor: "#4A5A1A" },
  { id: 18, name: "Boubou Brodé Mali",             seller: "Broderie Mopti",    country: "ML", flag: "🇲🇱", price: 35000, rating: 4.8, reviews: 76,  icon: "shirt-outline",            accentColor: "#5C1A00" },
  { id: 19, name: "Chaussures Cuir Homme",         seller: "Cuir Cotonou",      country: "BJ", flag: "🇧🇯", price: 18500, rating: 4.4, reviews: 203, icon: "footsteps-outline",        accentColor: "#7A3B1E" },
  { id: 20, name: "Tissu Kita Béninois",           seller: "Tissus Ouidah",     country: "BJ", flag: "🇧🇯", price: 9000,  rating: 4.3, reviews: 134, icon: "color-palette-outline",    accentColor: "#2A5C3A" },
  { id: 21, name: "Miel Pur Naturel 500g",         seller: "Ruche du Bénin",    country: "BJ", flag: "🇧🇯", price: 5000,  rating: 4.9, reviews: 289, icon: "leaf-outline",             accentColor: "#6B4A00" },
  { id: 22, name: "Parfum Oud Africain",           seller: "Oud Conakry",       country: "GN", flag: "🇬🇳", price: 12000, rating: 4.7, reviews: 341, icon: "color-palette-outline",    accentColor: "#5C1A3A" },
  { id: 23, name: "Café Guinée Forestière 250g",   seller: "Café Macenta",      country: "GN", flag: "🇬🇳", price: 4500,  rating: 4.8, reviews: 212, icon: "cafe-outline",             accentColor: "#3B1A00" },
  { id: 24, name: "Ventilateur Solaire 12V",       seller: "Solar Congo",       country: "CG", flag: "🇨🇬", price: 32000, rating: 4.1, reviews: 67,  icon: "sunny-outline",            accentColor: "#1A3A5C" },
  { id: 25, name: "Artisanat Bois Congo",          seller: "Bois Brazzaville",  country: "CG", flag: "🇨🇬", price: 8500,  rating: 4.5, reviews: 45,  icon: "construct-outline",        accentColor: "#4A2A00" },
  { id: 26, name: "Bois d'Ébène Sculpté",          seller: "Ébéniste Libreville", country: "GA", flag: "🇬🇦", price: 45000, rating: 4.9, reviews: 38,  icon: "construct-outline",      accentColor: "#1A1A1A" },
  { id: 27, name: "Huile Essentielle Niaouli",     seller: "Plantes Gabon",     country: "GA", flag: "🇬🇦", price: 7500,  rating: 4.6, reviews: 102, icon: "leaf-outline",             accentColor: "#1F5C2A" },
];

type PromoDemo = { id: number; badge: string; title: string; icon: string };
type WholesalerDemo = { id: number; name: string; icon: string; color: string };

const DEMO_PROMOS_BY_COUNTRY: Record<string, PromoDemo[]> = {
  CI: [
    { id: 1, badge: "Vente Flash 🔥", title: "Jusqu'à -50%\nsur les pagnes wax", icon: "shirt-outline" },
    { id: 2, badge: "Offre Spéciale ⚡", title: "-30% sur\nl'électronique", icon: "phone-portrait-outline" },
    { id: 3, badge: "Promo 🛍️", title: "Chaussures\ndès 10 000 FCFA", icon: "footsteps-outline" },
  ],
  SN: [
    { id: 1, badge: "Vente Flash 🔥", title: "Pagnes brodés\nà -40%", icon: "shirt-outline" },
    { id: 2, badge: "Soldes 🎉", title: "Électroménager\ndès 35 000 FCFA", icon: "home-outline" },
    { id: 3, badge: "Promo ✨", title: "Parfums de Dakar\ndès 5 000 FCFA", icon: "color-palette-outline" },
  ],
  BJ: [
    { id: 1, badge: "Vente Flash 🔥", title: "-35% sur\nles tissus importés", icon: "shirt-outline" },
    { id: 2, badge: "Flash Sale 💥", title: "Téléphones neufs\ndès 40 000 FCFA", icon: "phone-portrait-outline" },
    { id: 3, badge: "Promo 🛒", title: "Épicerie en gros\nà prix cassés", icon: "cart-outline" },
  ],
  TG: [
    { id: 1, badge: "Promo Lomé 🔥", title: "Bijoux artisanaux\nà -45%", icon: "color-palette-outline" },
    { id: 2, badge: "Offre Spéciale ⚡", title: "Meubles maison\ndès 28 000 FCFA", icon: "home-outline" },
    { id: 3, badge: "Flash Sale 💥", title: "Mode Togo\nà -30%", icon: "shirt-outline" },
  ],
  CM: [
    { id: 1, badge: "Vente Flash 🔥", title: "Cacao & Café\ngros lot -20%", icon: "leaf-outline" },
    { id: 2, badge: "Offre Yaounde ⚡", title: "Électro Douala\ndès 50 000 FCFA", icon: "flash-outline" },
    { id: 3, badge: "Promo 🛍️", title: "Mode Africaine\nà -40%", icon: "shirt-outline" },
  ],
  ML: [
    { id: 1, badge: "Promo Bamako 🔥", title: "Bazin riche\nà -35%", icon: "shirt-outline" },
    { id: 2, badge: "Soldes 🎉", title: "Or et bijoux\ndès 12 000 FCFA", icon: "diamond-outline" },
    { id: 3, badge: "Flash Sale 💥", title: "Épices du Mali\nen gros -25%", icon: "restaurant-outline" },
  ],
  BF: [
    { id: 1, badge: "Vente Flash 🔥", title: "Coton Faso\nà -40%", icon: "shirt-outline" },
    { id: 2, badge: "Promo ✨", title: "Karité naturel\ndès 3 000 FCFA", icon: "water-outline" },
    { id: 3, badge: "Offre Spéciale ⚡", title: "Artisanat local\nen promo", icon: "color-palette-outline" },
  ],
  GN: [
    { id: 1, badge: "Vente Flash 🔥", title: "Fruits tropicaux\nen gros -30%", icon: "nutrition-outline" },
    { id: 2, badge: "Promo Conakry 🛍️", title: "Bauxite & Mines\nfournisseurs", icon: "hammer-outline" },
    { id: 3, badge: "Flash Sale 💥", title: "Mode Guinée\nà -35%", icon: "shirt-outline" },
  ],
  CG: [
    { id: 1, badge: "Promo Brazza 🔥", title: "Bois exotique\nen gros -20%", icon: "leaf-outline" },
    { id: 2, badge: "Offre Spéciale ⚡", title: "Poisson fumé\ndès 5 000 FCFA", icon: "restaurant-outline" },
    { id: 3, badge: "Flash Sale 💥", title: "Huile de palme\nen gros -25%", icon: "water-outline" },
  ],
  GA: [
    { id: 1, badge: "Vente Flash 🔥", title: "Manganèse & minerais\nfournisseurs", icon: "hammer-outline" },
    { id: 2, badge: "Promo Libreville ⚡", title: "Produits bio\nà -30%", icon: "leaf-outline" },
    { id: 3, badge: "Flash Sale 💥", title: "Mode Gabon\nà -40%", icon: "shirt-outline" },
  ],
};

const DEMO_WHOLESALERS_BY_COUNTRY: Record<string, WholesalerDemo[]> = {
  CI: [
    { id: 1, name: "Huilerie Kossam", icon: "water-outline", color: "#22C55E" },
    { id: 2, name: "Textiles Abidjan", icon: "shirt-outline", color: "#FF6B00" },
    { id: 3, name: "AgriCôte Plus", icon: "leaf-outline", color: "#84CC16" },
    { id: 4, name: "ElecPro CI", icon: "flash-outline", color: "#3B82F6" },
    { id: 5, name: "Savons Beauté", icon: "color-palette-outline", color: "#EC4899" },
    { id: 6, name: "AgroCI Grains", icon: "restaurant-outline", color: "#F59E0B" },
  ],
  SN: [
    { id: 1, name: "Huilerie Baobab", icon: "water-outline", color: "#22C55E" },
    { id: 2, name: "Dakar Textile", icon: "shirt-outline", color: "#FF6B00" },
    { id: 3, name: "SénéFruits", icon: "nutrition-outline", color: "#F59E0B" },
    { id: 4, name: "TechDakar", icon: "phone-portrait-outline", color: "#3B82F6" },
    { id: 5, name: "Savonnerie BN", icon: "color-palette-outline", color: "#EC4899" },
  ],
  BJ: [
    { id: 1, name: "Huile Palme BJ", icon: "water-outline", color: "#22C55E" },
    { id: 2, name: "Textiles Cotonou", icon: "shirt-outline", color: "#FF6B00" },
    { id: 3, name: "Porto-Novo Bio", icon: "leaf-outline", color: "#84CC16" },
    { id: 4, name: "BéninElec", icon: "flash-outline", color: "#3B82F6" },
  ],
  TG: [
    { id: 1, name: "Togo Huiles", icon: "water-outline", color: "#22C55E" },
    { id: 2, name: "Lomé Mode", icon: "shirt-outline", color: "#FF6B00" },
    { id: 3, name: "ArtisaTogo", icon: "color-palette-outline", color: "#8B5CF6" },
    { id: 4, name: "TogoFarm", icon: "leaf-outline", color: "#84CC16" },
  ],
  CM: [
    { id: 1, name: "CamAgro", icon: "leaf-outline", color: "#22C55E" },
    { id: 2, name: "Textiles Douala", icon: "shirt-outline", color: "#FF6B00" },
    { id: 3, name: "Cacao Export", icon: "restaurant-outline", color: "#F59E0B" },
    { id: 4, name: "ElecYaounde", icon: "flash-outline", color: "#3B82F6" },
    { id: 5, name: "CamBeauté", icon: "color-palette-outline", color: "#EC4899" },
  ],
  ML: [
    { id: 1, name: "Mali Coton", icon: "shirt-outline", color: "#FF6B00" },
    { id: 2, name: "BamakoOr", icon: "diamond-outline", color: "#F59E0B" },
    { id: 3, name: "SahelAgri", icon: "leaf-outline", color: "#22C55E" },
    { id: 4, name: "MaliElec", icon: "flash-outline", color: "#3B82F6" },
  ],
  BF: [
    { id: 1, name: "FasoCoton", icon: "shirt-outline", color: "#FF6B00" },
    { id: 2, name: "Karité Burkina", icon: "water-outline", color: "#22C55E" },
    { id: 3, name: "BurkinArts", icon: "color-palette-outline", color: "#8B5CF6" },
    { id: 4, name: "AgroBF", icon: "leaf-outline", color: "#84CC16" },
  ],
  GN: [
    { id: 1, name: "GuinéeFruits", icon: "nutrition-outline", color: "#F59E0B" },
    { id: 2, name: "Conakry Mode", icon: "shirt-outline", color: "#FF6B00" },
    { id: 3, name: "MinesGN", icon: "hammer-outline", color: "#6B7280" },
    { id: 4, name: "GuinéeAgri", icon: "leaf-outline", color: "#22C55E" },
  ],
  CG: [
    { id: 1, name: "BoisCongo", icon: "leaf-outline", color: "#22C55E" },
    { id: 2, name: "Brazza Huile", icon: "water-outline", color: "#F59E0B" },
    { id: 3, name: "CGPêche", icon: "restaurant-outline", color: "#3B82F6" },
    { id: 4, name: "TextilesCongo", icon: "shirt-outline", color: "#FF6B00" },
  ],
  GA: [
    { id: 1, name: "GabonBois", icon: "leaf-outline", color: "#22C55E" },
    { id: 2, name: "LibrevillBio", icon: "nutrition-outline", color: "#84CC16" },
    { id: 3, name: "GaboMines", icon: "hammer-outline", color: "#6B7280" },
    { id: 4, name: "GabonMode", icon: "shirt-outline", color: "#FF6B00" },
  ],
};

function DiscoveryProductCard({ item, colors }: { item: DiscoveryProduct; colors: any }) {
  const stars = Math.round(item.rating);
  return (
    <TouchableOpacity
      activeOpacity={0.88}
      style={[styles.discCard, { backgroundColor: colors.backgroundCard, borderColor: colors.border }]}
      onPress={() => router.push("/search" as any)}
    >
      <View style={styles.discLeft}>
        <View style={styles.discSellerRow}>
          <Text style={[styles.discSeller, { color: colors.textMuted }]} numberOfLines={1}>{item.seller}</Text>
          <Text style={styles.discFlag}>{item.flag}</Text>
        </View>
        <Text style={[styles.discName, { color: colors.text }]} numberOfLines={2}>{item.name}</Text>
        <View style={styles.discRatingRow}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Ionicons key={i} name={i < stars ? "star" : "star-outline"} size={11} color="#F59E0B" />
          ))}
          <Text style={[styles.discRatingNum, { color: colors.textMuted }]}> {item.rating} ({item.reviews})</Text>
        </View>
        <View style={styles.discPriceRow}>
          <Text style={[styles.discPrice, { color: colors.primary }]}>{formatPrice(item.price)}</Text>
          <TouchableOpacity style={[styles.discCartBtn, { backgroundColor: colors.primary }]}>
            <Ionicons name="cart-outline" size={16} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={[styles.discRight, { backgroundColor: item.accentColor + "EE" }]}>
        <Ionicons name={item.icon as any} size={62} color="rgba(255,255,255,0.85)" />
      </View>
    </TouchableOpacity>
  );
}

function getCountryPromos(code: string): PromoDemo[] {
  return DEMO_PROMOS_BY_COUNTRY[code] ?? DEMO_PROMOS_BY_COUNTRY["CI"];
}

function getCountryWholesalers(code: string): WholesalerDemo[] {
  return DEMO_WHOLESALERS_BY_COUNTRY[code] ?? DEMO_WHOLESALERS_BY_COUNTRY["CI"];
}

function PromoCard({ item, colors, countryFlag }: { item: PromoDemo; colors: any; countryFlag: string }) {
  return (
    <TouchableOpacity activeOpacity={0.88} style={styles.promoCard}>
      <View style={styles.promoInner}>
        <View style={styles.promoLeft}>
          <View style={styles.promoBadgePill}>
            <Text style={styles.promoFlagInline}>{countryFlag}</Text>
            <Text style={styles.promoBadgeText}>{item.badge}</Text>
          </View>
          <Text style={styles.promoTitle}>{item.title}</Text>
          <View style={styles.promoBtn}>
            <Text style={[styles.promoBtnText, { color: colors.primary }]}>Voir les offres</Text>
            <Ionicons name="arrow-forward" size={13} color={colors.primary} />
          </View>
        </View>
        <View style={styles.promoRight}>
          <View style={styles.promoImgBox}>
            <Ionicons name={item.icon as any} size={38} color="rgba(255,255,255,0.55)" />
            <Text style={styles.promoImgLabel}>Article</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function WholesalerLogoCard({ item }: { item: WholesalerDemo }) {
  return (
    <TouchableOpacity activeOpacity={0.8} style={styles.wholesalerLogoCard}>
      <View style={[styles.wholesalerLogoBox, { backgroundColor: item.color + "18", borderColor: item.color + "40" }]}>
        <Ionicons name={item.icon as any} size={22} color={item.color} />
      </View>
      <Text style={styles.wholesalerLogoName} numberOfLines={2}>{item.name}</Text>
    </TouchableOpacity>
  );
}

const RESUME_DELAY_MS = 3500;
const CONTINUOUS_PX_PER_SEC = 40; // speed for the logo banner

// ─────────────────────────────────────────────────────────────
// AutoScrollCarousel
//   continuous=true  → Reanimated loop, always scrolling, ignores touches
//   continuous=false → discrete setInterval, pauses on touch, own rhythm
// ─────────────────────────────────────────────────────────────
function AutoScrollCarousel({
  data,
  renderItem,
  itemWidth,
  isActive,
  continuous = false,
  intervalMs = 2800,
  startDelay = 0,
}: {
  data: any[];
  renderItem: ({ item, index }: { item: any; index: number }) => React.ReactElement;
  itemWidth: number;
  isActive: boolean;
  continuous?: boolean;
  intervalMs?: number;
  startDelay?: number;
}) {
  const gap      = 12;
  const step     = itemWidth + gap;
  const n        = data.length;
  const loopData = [...data, ...data, ...data];

  // ── CONTINUOUS mode (logo banner) ──────────────────────────
  const animScrollRef = useAnimatedRef<Animated.ScrollView>();
  const scrollX       = useSharedValue(0);
  const oneLength     = n * step;
  const loopDuration  = oneLength > 0
    ? Math.round((oneLength / CONTINUOUS_PX_PER_SEC) * 1000)
    : 8000;

  const contResumeRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useAnimatedReaction(
    () => scrollX.value,
    (x) => { if (continuous) scrollTo(animScrollRef, x, 0, false); },
  );

  const startContinuous = useCallback(() => {
    if (!isActive) return;
    scrollX.value = 0;
    scrollX.value = withRepeat(
      withTiming(oneLength, { duration: loopDuration, easing: Easing.linear }),
      -1,
      false,
    );
  }, [isActive, scrollX, oneLength, loopDuration]);

  useEffect(() => {
    if (!continuous) return;
    if (!isActive) { cancelAnimation(scrollX); return; }
    startContinuous();
    return () => cancelAnimation(scrollX);
  }, [continuous, isActive, scrollX, startContinuous]);

  const onContinuousTouchStart = useCallback(() => {
    if (contResumeRef.current) clearTimeout(contResumeRef.current);
    cancelAnimation(scrollX);
  }, [scrollX]);

  const onContinuousScrollEnd = useCallback(() => {
    if (contResumeRef.current) clearTimeout(contResumeRef.current);
    contResumeRef.current = setTimeout(() => {
      startContinuous();
    }, 2000);
  }, [startContinuous]);

  // ── DISCRETE mode (promo / wholesale / group) ──────────────
  const discreteRef = useRef<ScrollView>(null);
  const offsetRef   = useRef(n * step);
  const intervalRef = useRef<ReturnType<typeof setInterval>  | null>(null);
  const resumeRef   = useRef<ReturnType<typeof setTimeout>   | null>(null);
  const pausedRef   = useRef(false);

  const advance = useCallback(() => {
    if (pausedRef.current || !discreteRef.current) return;
    let next = offsetRef.current + step;
    if (next >= n * 2 * step) {
      discreteRef.current.scrollTo({ x: n * step, animated: false });
      offsetRef.current = n * step;
      next = offsetRef.current + step;
    }
    discreteRef.current.scrollTo({ x: next, animated: true });
    offsetRef.current = next;
  }, [step, n]);

  const stopAuto = useCallback(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    if (resumeRef.current)   { clearTimeout(resumeRef.current);   resumeRef.current   = null; }
  }, []);

  const startAuto = useCallback(() => {
    stopAuto();
    if (!discreteRef.current) return;
    discreteRef.current.scrollTo({ x: n * step, animated: false });
    offsetRef.current = n * step;
    intervalRef.current = setInterval(advance, intervalMs);
  }, [advance, stopAuto, n, step, intervalMs]);

  useEffect(() => {
    if (continuous) return;
    if (isActive) {
      const t = setTimeout(startAuto, startDelay + 200);
      return () => { clearTimeout(t); stopAuto(); };
    }
    stopAuto();
    return undefined;
  }, [continuous, isActive, startAuto, stopAuto, startDelay]);

  const onTouchStart = useCallback(() => { pausedRef.current = true; stopAuto(); }, [stopAuto]);
  const onScrollBeginDrag = useCallback(() => { pausedRef.current = true; stopAuto(); }, [stopAuto]);
  const onScrollEnd = useCallback(() => {
    if (resumeRef.current) clearTimeout(resumeRef.current);
    resumeRef.current = setTimeout(() => {
      pausedRef.current = false;
      if (isActive) startAuto();
    }, RESUME_DELAY_MS);
  }, [isActive, startAuto]);
  const onScroll = useCallback((e: { nativeEvent: { contentOffset: { x: number } } }) => {
    offsetRef.current = e.nativeEvent.contentOffset.x;
  }, []);

  // ── RENDER ─────────────────────────────────────────────────
  if (continuous) {
    return (
      <Animated.ScrollView
        ref={animScrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingLeft: 16, gap, paddingBottom: 8 }}
        onTouchStart={onContinuousTouchStart}
        onScrollEndDrag={onContinuousScrollEnd}
        onMomentumScrollEnd={onContinuousScrollEnd}
        onTouchEnd={onContinuousScrollEnd}
      >
        {loopData.map((item, index) => (
          <View key={index} style={{ width: itemWidth }}>
            {renderItem({ item, index })}
          </View>
        ))}
      </Animated.ScrollView>
    );
  }

  return (
    <ScrollView
      ref={discreteRef}
      horizontal
      scrollEventThrottle={64}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingLeft: 16, gap, paddingBottom: 8 }}
      onScroll={onScroll}
      onTouchStart={onTouchStart}
      onScrollBeginDrag={onScrollBeginDrag}
      onScrollEndDrag={onScrollEnd}
      onMomentumScrollEnd={onScrollEnd}
      onTouchEnd={onScrollEnd}
    >
      {loopData.map((item, index) => (
        <View key={index} style={{ width: itemWidth }}>
          {renderItem({ item, index })}
        </View>
      ))}
    </ScrollView>
  );
}

function WholesaleDemoCard({ item, colors }: { item: typeof DEMO_WHOLESALE[0]; colors: any }) {
  return (
    <TouchableOpacity
      activeOpacity={0.82}
      style={[styles.wholesaleCard, { backgroundColor: colors.backgroundCard, borderColor: colors.border }]}
    >
      <View style={[styles.wholesaleImgBox, { backgroundColor: item.color + "18" }]}>
        <Ionicons name={item.icon} size={28} color={item.color} />
      </View>
      <View style={styles.wholesaleInfo}>
        <Text style={[styles.wholesaleName, { color: colors.text }]} numberOfLines={2}>{item.name}</Text>
        <Text style={[styles.wholesalePrice, { color: colors.primary }]}>{formatPrice(item.price)}</Text>
        <Text style={[styles.wholesaleMin, { color: colors.textMuted }]}>Min. {item.minOrder} pcs</Text>
      </View>
    </TouchableOpacity>
  );
}

function GroupBuyDemoCard({ item, colors }: { item: typeof DEMO_GROUP_BUYS[0]; colors: any }) {
  const progress = 1 - item.remaining / item.total;
  const urgency = item.remaining <= 5;
  return (
    <TouchableOpacity
      activeOpacity={0.82}
      style={[styles.groupBuyCard, { backgroundColor: colors.backgroundCard, borderColor: urgency ? "#EF4444" : colors.border }]}
    >
      <View style={[styles.groupBuyImgBox, { backgroundColor: item.color + "18" }]}>
        <Ionicons name={item.icon} size={26} color={item.color} />
        {urgency && (
          <View style={styles.urgencyDot} />
        )}
      </View>
      <View style={styles.groupBuyInfo}>
        <Text style={[styles.groupBuyName, { color: colors.text }]} numberOfLines={1}>{item.name}</Text>
        <Text style={[styles.groupBuyPrice, { color: colors.primary }]}>{formatPrice(item.price)}</Text>
        <View style={[styles.groupBuyProgressBg, { backgroundColor: colors.backgroundElevated }]}>
          <View style={[styles.groupBuyProgressFill, { width: `${Math.round(progress * 100)}%`, backgroundColor: urgency ? "#EF4444" : colors.primary }]} />
        </View>
        <Text style={[styles.groupBuyRemaining, { color: urgency ? "#EF4444" : colors.textMuted }]}>
          {item.remaining} place{item.remaining > 1 ? "s" : ""} restante{item.remaining > 1 ? "s" : ""}
        </Text>
        <TouchableOpacity style={[styles.joinBtn, { backgroundColor: colors.primary }]}>
          <Text style={styles.joinBtnText}>Rejoindre</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

function SkeletonBlock({ width, height, style, bgColor }: { width: number | string; height: number; style?: any; bgColor?: string }) {
  return (
    <View
      style={[
        {
          width: width as any,
          height,
          backgroundColor: bgColor || "#F8F8F8",
          borderRadius: 12,
        },
        style,
      ]}
    />
  );
}

function ProductCardSkeleton({ bgColor, borderColor }: { bgColor?: string; borderColor?: string }) {
  return (
    <View style={[styles.productCard, { overflow: "hidden", backgroundColor: bgColor, borderColor: borderColor }]}>
      <SkeletonBlock width={160} height={120} style={{ borderRadius: 0 }} bgColor={bgColor} />
      <View style={{ padding: 10, gap: 6 }}>
        <SkeletonBlock width={120} height={12} bgColor={bgColor} />
        <SkeletonBlock width={60} height={10} bgColor={bgColor} />
        <SkeletonBlock width={90} height={14} bgColor={bgColor} />
      </View>
    </View>
  );
}

function GroupCardSkeleton({ bgColor, borderColor }: { bgColor?: string; borderColor?: string }) {
  return (
    <View style={[styles.groupCard, { overflow: "hidden", backgroundColor: bgColor, borderColor: borderColor }]}>
      <SkeletonBlock width={170} height={130} style={{ borderRadius: 0 }} bgColor={bgColor} />
      <View style={{ padding: 10, gap: 6 }}>
        <SkeletonBlock width={140} height={12} bgColor={bgColor} />
        <SkeletonBlock width={80} height={10} bgColor={bgColor} />
        <SkeletonBlock width={100} height={14} bgColor={bgColor} />
        <SkeletonBlock width="100%" height={4} bgColor={bgColor} />
      </View>
    </View>
  );
}

function SectionError({ message, onRetry, colors, retryLabel }: { message: string; onRetry?: () => void; colors: any; retryLabel?: string }) {
  return (
    <View style={styles.errorContainer}>
      <Ionicons name="cloud-offline-outline" size={24} color={colors.textMuted} />
      <Text style={[styles.errorText, { color: colors.textMuted }]}>{message}</Text>
      {onRetry && (
        <TouchableOpacity style={[styles.retryBtn, { borderColor: colors.primary }]} onPress={onRetry}>
          <Text style={[styles.retryText, { color: colors.primary }]}>{retryLabel || "↻"}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function ProductCard({ item, index, colors }: { item: Product; index: number; colors: any }) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const accent = getAccentColor(index);
  const badge = item.label || (item.min_order > 1 ? "GROS" : null);

  return (
    <Animated.View style={[styles.productCard, animStyle, { backgroundColor: colors.backgroundCard, borderColor: colors.border }]}>
      <TouchableOpacity
        activeOpacity={1}
        onPressIn={() => {
          scale.value = withSpring(0.97);
          Haptics.selectionAsync();
        }}
        onPressOut={() => {
          scale.value = withSpring(1);
        }}
        onPress={() => router.push({ pathname: "/product/[id]", params: { id: item.id.toString() } })}
      >
        <View style={[styles.productImagePlaceholder, { backgroundColor: accent + "22" }]}>
          <Ionicons name="bag-handle" size={36} color={accent} />
          {badge && (
            <View style={[styles.badgeTag, { backgroundColor: colors.primary }]}>
              <Text style={styles.badgeText}>{badge}</Text>
            </View>
          )}
        </View>
        <View style={styles.productInfo}>
          <Text style={[styles.productName, { color: colors.text }]} numberOfLines={2}>{item.name}</Text>
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={12} color="#F59E0B" />
            <Text style={[styles.ratingText, { color: colors.textSecondary }]}>{item.rating?.toFixed(1) || "0.0"}</Text>
          </View>
          <Text style={[styles.productPrice, { color: colors.primary }]}>{formatPrice(item.price, item.currency_code)}</Text>
          {item.min_order > 1 && (
            <Text style={[styles.minQty, { color: colors.textMuted }]}>Min. {item.min_order} pcs</Text>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

function GroupCard({ item, index, colors, t }: { item: Group; index: number; colors: any; t: any }) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const accent = getAccentColor(index + 2);
  const progress = item.target_quantity > 0 ? item.current_quantity / item.target_quantity : 0;
  const discountPct = item.discounted_price && item.unit_price > 0
    ? Math.round((item.unit_price - item.discounted_price) / item.unit_price * 100)
    : 0;

  return (
    <Animated.View style={[styles.groupCard, animStyle, { backgroundColor: colors.backgroundCard, borderColor: colors.border }]}>
      <TouchableOpacity
        activeOpacity={1}
        onPressIn={() => { scale.value = withSpring(0.97); Haptics.selectionAsync(); }}
        onPressOut={() => { scale.value = withSpring(1); }}
        onPress={() => router.push("/(tabs)/groupe")}
      >
        <View style={[styles.groupImagePlaceholder, { backgroundColor: colors.backgroundElevated }]}>
          <View style={[styles.flashBadge, { backgroundColor: colors.primary }]}>
            <Text style={styles.flashText}>{item.status === "active" ? t.home.inProgress : item.status.toUpperCase()}</Text>
          </View>
          <Ionicons name="bag-handle" size={40} color={accent} />
        </View>
        <View style={styles.groupInfo}>
          <Text style={[styles.groupName, { color: colors.text }]} numberOfLines={2}>{item.group_name}</Text>
          <Text style={[styles.groupPriceNew, { color: colors.primary }]}>
            {discountPct > 0 ? `-${discountPct}%` : formatPrice(item.discounted_price ?? item.unit_price)}
          </Text>
          <View style={[styles.progressBarContainer, { backgroundColor: colors.border }]}>
            <View style={[styles.progressBar, { width: `${Math.min(progress * 100, 100)}%` as any, backgroundColor: colors.primary }]} />
          </View>
          <Text style={[styles.membersText, { color: colors.textMuted }]}>
            {item.current_quantity}/{item.target_quantity} {t.groups.members}
          </Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [selectedCountry, setSelectedCountry] = useState(user?.country_code ?? "CI");
  const [sortBy, setSortBy] = useState<SortOption>("featured");
  const [showGlobeModal, setShowGlobeModal] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [carouselActive, setCarouselActive] = useState(false);
  const qc = useQueryClient();
  const { colors } = useTheme();
  const { t } = useLanguage();

  useEffect(() => {
    if (user?.country_code) {
      setSelectedCountry(user.country_code);
    }
  }, [user?.country_code]);

  useFocusEffect(useCallback(() => {
    setCarouselActive(true);
    return () => setCarouselActive(false);
  }, []));

  const bottomPadding = Platform.OS === "web" ? 34 : 90;

  const countryParam = selectedCountry ? `country=${selectedCountry}` : "";

  const configQuery = useQuery({
    queryKey: ["/api/config/public"],
    queryFn: () => api.config.public(),
    staleTime: 1000 * 60 * 30,
  });

  const featuredQuery = useQuery({
    queryKey: ["/api/products/featured", countryParam],
    queryFn: () => api.products.featured(countryParam || undefined),
  });

  const trendingQuery = useQuery({
    queryKey: ["/api/products/trending", countryParam],
    queryFn: () => api.products.trending(countryParam || undefined),
  });

  const promosQuery = useQuery({
    queryKey: ["/api/products/promos", countryParam],
    queryFn: () => api.products.promos(countryParam || undefined),
  });

  const groupsQuery = useQuery({
    queryKey: ["/api/groups"],
    queryFn: () => api.groups.list(),
  });

  const countries: { flag: string; code: string; name: string }[] = (() => {
    if (configQuery.data?.countries?.length) {
      return configQuery.data.countries.map((c: Country) => {
        const fallback = FALLBACK_COUNTRIES.find((f) => f.code === c.country_code);
        return {
          flag: fallback?.flag || "\u{1F30D}",
          code: c.country_code,
          name: c.name,
        };
      });
    }
    return FALLBACK_COUNTRIES;
  })();

  const promos = promosQuery.data ?? [];
  const groups = groupsQuery.data ?? [];

  const sortProducts = (products: Product[]): Product[] => {
    const list = [...products];
    if (sortBy === "price_asc") return list.sort((a, b) => a.price - b.price);
    if (sortBy === "price_desc") return list.sort((a, b) => b.price - a.price);
    if (sortBy === "popular") return list.sort((a, b) => (b.sales_count ?? 0) - (a.sales_count ?? 0));
    return list;
  };

  const featuredProducts = sortProducts(featuredQuery.data ?? []);
  const trendingProducts = sortProducts(trendingQuery.data ?? []);

  const wholesaleProducts = trendingProducts.length > 0
    ? trendingProducts
    : featuredProducts;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      qc.invalidateQueries({ queryKey: ["/api/products/featured"] }),
      qc.invalidateQueries({ queryKey: ["/api/products/trending"] }),
      qc.invalidateQueries({ queryKey: ["/api/products/promos"] }),
      qc.invalidateQueries({ queryKey: ["/api/categories/featured"] }),
      qc.invalidateQueries({ queryKey: ["/api/groups"] }),
    ]);
    setRefreshing(false);
  }, [qc]);

  const handleSearch = () => {
    if (searchText.trim()) {
      router.push({ pathname: "/search" as any, params: { q: searchText.trim() } });
    }
  };

  const mainScrollRef = useRef<ScrollView>(null);
  const scrollYRef = useRef(0);
  const hideTopBtnTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const topBtnScale = useSharedValue(0);
  const topBtnAnim = useAnimatedStyle(() => ({
    transform: [{ scale: topBtnScale.value }],
    opacity: topBtnScale.value,
  }));

  const handleMainScroll = (e: any) => {
    const y: number = e.nativeEvent.contentOffset.y;
    const isScrollingUp = y < scrollYRef.current && y > 120;
    scrollYRef.current = y;
    if (isScrollingUp) {
      if (hideTopBtnTimer.current) clearTimeout(hideTopBtnTimer.current);
      topBtnScale.value = withSpring(1, { damping: 14 });
      hideTopBtnTimer.current = setTimeout(() => {
        topBtnScale.value = withSpring(0, { damping: 10, stiffness: 60 });
      }, 3000);
    } else if (y <= 80) {
      if (hideTopBtnTimer.current) clearTimeout(hideTopBtnTimer.current);
      topBtnScale.value = withSpring(0, { damping: 14 });
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader
        onMenuPress={() => setDrawerOpen(true)}
        onGlobePress={() => router.push("/international" as any)}
        globeActive={false}
        countryFlag={user ? countries.find((c) => c.code === selectedCountry)?.flag : undefined}
      />

      <View style={[styles.searchContainer, { backgroundColor: colors.backgroundCard, borderColor: colors.border }]}>
        <Ionicons name="search-outline" size={18} color={colors.textMuted} style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder={t.home.searchPlaceholder}
          placeholderTextColor={colors.textMuted}
          value={searchText}
          onChangeText={setSearchText}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        <TouchableOpacity style={styles.filterBtn} onPress={handleSearch}>
          <Ionicons name="options-outline" size={18} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        ref={mainScrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: bottomPadding }}
        scrollEventThrottle={16}
        onScroll={handleMainScroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >


        <View style={styles.wholesalerHeader}>
          <Text style={[styles.wholesalerHeaderTitle, { color: colors.textMuted }]}>Grossistes partenaires</Text>
          <TouchableOpacity style={styles.wholesalerHeaderLink}>
            <Text style={[styles.wholesalerHeaderLinkText, { color: colors.primary }]}>Voir tout →</Text>
          </TouchableOpacity>
        </View>
        <AutoScrollCarousel
          data={getCountryWholesalers(selectedCountry)}
          itemWidth={72}
          isActive={carouselActive}
          continuous
          renderItem={({ item }) => <WholesalerLogoCard item={item} />}
        />


        <View style={styles.sectionHeader}>
          <View style={styles.liveIndicator}>
            <View style={[styles.liveDot, { backgroundColor: colors.primary }]} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t.home.exclusiveSelection}</Text>
          </View>
        </View>
        <AutoScrollCarousel
          data={getCountryPromos(selectedCountry)}
          itemWidth={Math.round(SCREEN_WIDTH * 0.72)}
          isActive={carouselActive}
          intervalMs={3000}
          startDelay={0}
          renderItem={({ item }) => {
            const flag = countries.find((c) => c.code === selectedCountry)?.flag ?? "🌍";
            return <PromoCard item={item} colors={colors} countryFlag={flag} />;
          }}
        />

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t.home.wholesale}</Text>
          <TouchableOpacity>
            <Text style={[styles.sectionLink, { color: colors.primary }]}>{t.common.seeAll} &#x2192;</Text>
          </TouchableOpacity>
        </View>
        <AutoScrollCarousel
          data={DEMO_WHOLESALE}
          itemWidth={130}
          isActive={carouselActive}
          intervalMs={3700}
          startDelay={1300}
          renderItem={({ item }) => <WholesaleDemoCard item={item} colors={colors} />}
        />

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t.groups.title.toUpperCase()}</Text>
          <TouchableOpacity onPress={() => router.push("/(tabs)/groupe")}>
            <Text style={[styles.sectionLink, { color: colors.primary }]}>{t.common.seeAll} &#x2192;</Text>
          </TouchableOpacity>
        </View>
        <AutoScrollCarousel
          data={DEMO_GROUP_BUYS}
          itemWidth={155}
          isActive={carouselActive}
          intervalMs={4200}
          startDelay={700}
          renderItem={({ item }) => <GroupBuyDemoCard item={item} colors={colors} />}
        />

        <View style={[styles.sectionHeader, { marginTop: 12 }]}>
          <View>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>✦ POUR VOUS</Text>
            <Text style={[styles.discSubtitle, { color: colors.textMuted }]}>Découverte personnalisée</Text>
          </View>
        </View>


        {(() => {
          const filtered = [...DEMO_DISCOVERY].sort(() => Math.random() - 0.5);
          return (
            <View style={styles.discFeed}>
              {filtered.length === 0 ? (
                <View style={styles.discEndMsg}>
                  <Ionicons name="globe-outline" size={22} color={colors.textMuted} />
                  <Text style={[styles.discEndText, { color: colors.textMuted }]}>Aucun produit pour ce pays pour l'instant</Text>
                </View>
              ) : (
                <>
                  {filtered.map((item) => (
                    <DiscoveryProductCard key={item.id} item={item} colors={colors} />
                  ))}
                  <View style={styles.discEndMsg}>
                    <Ionicons name="checkmark-circle-outline" size={22} color={colors.textMuted} />
                    <Text style={[styles.discEndText, { color: colors.textMuted }]}>Plus de produits disponibles</Text>
                  </View>
                </>
              )}
            </View>
          );
        })()}
      </ScrollView>

      <Animated.View style={[styles.scrollTopBtn, { bottom: (Platform.OS === "web" ? 84 : 52 + insets.bottom) + 16 }, topBtnAnim]} pointerEvents="box-none">
        <TouchableOpacity
          style={[styles.scrollTopBtnInner, { backgroundColor: colors.primary }]}
          onPress={() => mainScrollRef.current?.scrollTo({ y: 0, animated: true })}
          activeOpacity={0.85}
        >
          <Ionicons name="chevron-up" size={22} color="#fff" />
        </TouchableOpacity>
      </Animated.View>

      <SideDrawer visible={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <CountryFilterModal
        visible={showGlobeModal}
        onClose={() => setShowGlobeModal(false)}
        selectedCountry={selectedCountry}
        onSelectCountry={(code) => {
          setSelectedCountry(code);
          qc.invalidateQueries({ queryKey: ["/api/products/featured"] });
          qc.invalidateQueries({ queryKey: ["/api/products/trending"] });
          qc.invalidateQueries({ queryKey: ["/api/products/promos"] });
        }}
        sortBy={sortBy}
        onSelectSort={setSortBy}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 10,
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
  },
  scrollTopBtn: {
    position: "absolute",
    right: 20,
    zIndex: 99,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollTopBtnInner: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  searchIcon: { marginRight: 8 },
  searchInput: {
    flex: 1,
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    paddingVertical: 12,
  },
  filterBtn: { padding: 4 },
  countryRow: { paddingHorizontal: 16, gap: 8, paddingBottom: 12 },
  countryChip: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    gap: 4,
  },
  countryFlag: { fontSize: 18 },
  countryCode: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 11,
  },
  categoriesRow: { paddingHorizontal: 16, gap: 16, paddingBottom: 16 },
  categoryItem: { alignItems: "center", gap: 6 },
  categoryIcon: {
    width: ms(56),
    height: ms(56),
    borderRadius: ms(16),
    alignItems: "center",
    justifyContent: "center",
  },
  categoryName: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: fs(9),
    letterSpacing: 0.5,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 12,
    marginTop: 8,
  },
  liveIndicator: { flexDirection: "row", alignItems: "center", gap: 8 },
  liveDot: { width: 8, height: 8, borderRadius: 4 },
  sectionTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: fs(13),
    letterSpacing: 1,
  },
  sectionLink: {
    fontFamily: "Poppins_500Medium",
    fontSize: fs(12),
  },
  promoCard: {
    width: Math.round(SCREEN_WIDTH * 0.72),
    height: 140,
    borderRadius: 18,
    backgroundColor: "#F38020",
    overflow: "hidden",
  },
  promoInner: {
    flex: 1,
    flexDirection: "row",
  },
  promoLeft: {
    flex: 1,
    padding: 14,
    justifyContent: "space-between",
  },
  promoRight: {
    width: 100,
    alignItems: "center",
    justifyContent: "center",
    paddingRight: 10,
  },
  promoImgBox: {
    width: 80,
    height: 100,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  promoImgLabel: {
    color: "rgba(255,255,255,0.6)",
    fontFamily: "Poppins_400Regular",
    fontSize: fs(9),
  },
  promoBadgePill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.25)",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
    gap: 5,
  },
  promoFlagInline: {
    fontSize: 13,
  },
  promoBadgeText: {
    color: "#fff",
    fontFamily: "Poppins_600SemiBold",
    fontSize: fs(11),
  },
  promoTitle: {
    color: "#fff",
    fontFamily: "Poppins_700Bold",
    fontSize: fs(14),
    lineHeight: 19,
  },
  promoBtn: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#fff",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    gap: 5,
  },
  promoBtnText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: fs(12),
  },
  wholesalerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 4,
    paddingTop: 2,
  },
  wholesalerHeaderTitle: {
    fontFamily: "Poppins_500Medium",
    fontSize: fs(11),
  },
  wholesalerHeaderLink: { padding: 2 },
  wholesalerHeaderLinkText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: fs(11),
  },
  wholesalerLogoCard: {
    width: 72,
    alignItems: "center",
    gap: 4,
  },
  wholesalerLogoBox: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  wholesalerLogoName: {
    fontFamily: "Poppins_400Regular",
    fontSize: fs(9),
    textAlign: "center",
    color: "#555",
    lineHeight: 12,
  },
  listPadding: { paddingHorizontal: 16, gap: 12, paddingBottom: 8 },
  productCard: {
    width: ms(160),
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
  },
  productImagePlaceholder: {
    height: ms(120, 0.4),
    alignItems: "center",
    justifyContent: "center",
  },
  badgeTag: {
    position: "absolute",
    top: 8,
    right: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: { color: "#fff", fontFamily: "Poppins_700Bold", fontSize: fs(9) },
  productInfo: { padding: 10 },
  productName: { fontFamily: "Poppins_500Medium", fontSize: fs(12), marginBottom: 4 },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 3, marginBottom: 2 },
  ratingText: { fontFamily: "Poppins_500Medium", fontSize: fs(11) },
  productPrice: { fontFamily: "Poppins_700Bold", fontSize: fs(13) },
  minQty: { fontFamily: "Poppins_400Regular", fontSize: fs(10), marginTop: 2 },
  groupCard: {
    width: ms(170),
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
  },
  groupImagePlaceholder: {
    height: ms(130, 0.4),
    alignItems: "center",
    justifyContent: "center",
  },
  flashBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  flashText: { color: "#fff", fontFamily: "Poppins_700Bold", fontSize: fs(8) },
  ratingBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
  },
  ratingBadgeText: { fontFamily: "Poppins_600SemiBold", fontSize: fs(10) },
  groupInfo: { padding: 10 },
  groupName: { fontFamily: "Poppins_500Medium", fontSize: fs(12), marginBottom: 2 },
  groupPriceOld: {
    fontFamily: "Poppins_400Regular",
    fontSize: fs(10),
    textDecorationLine: "line-through",
  },
  groupPriceNew: { fontFamily: "Poppins_700Bold", fontSize: fs(13), marginBottom: 6 },
  progressBarContainer: {
    height: 4,
    borderRadius: 2,
    marginBottom: 4,
    overflow: "hidden",
  },
  progressBar: { height: "100%", borderRadius: 2 },
  membersText: { fontFamily: "Poppins_400Regular", fontSize: 10 },
  videosGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 12,
    gap: 8,
    marginBottom: 16,
  },
  videoThumb: {
    width: (SCREEN_WIDTH - 36) / 2,
  },
  videoThumbBg: {
    height: 120,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  videoViews: {
    position: "absolute",
    bottom: 6,
    left: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  videoViewsText: { color: "rgba(255,255,255,0.8)", fontFamily: "Poppins_500Medium", fontSize: 10 },
  videoTitle: { fontFamily: "Poppins_500Medium", fontSize: 12, marginBottom: 2 },
  videoSeller: { fontFamily: "Poppins_400Regular", fontSize: 11 },
  errorContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
    paddingHorizontal: 16,
    gap: 8,
  },
  errorText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    textAlign: "center",
  },
  retryBtn: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  retryText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 12,
  },
  emptySection: {
    alignItems: "center",
    paddingVertical: 20,
  },
  emptyText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
  },
  wholesaleCard: {
    width: 130,
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
  },
  wholesaleImgBox: {
    height: 80,
    alignItems: "center",
    justifyContent: "center",
  },
  wholesaleInfo: {
    padding: 8,
    gap: 2,
  },
  wholesaleName: {
    fontFamily: "Poppins_500Medium",
    fontSize: fs(11),
    lineHeight: 15,
  },
  wholesalePrice: {
    fontFamily: "Poppins_700Bold",
    fontSize: fs(12),
  },
  wholesaleMin: {
    fontFamily: "Poppins_400Regular",
    fontSize: fs(10),
  },
  groupBuyCard: {
    width: 155,
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1.5,
  },
  groupBuyImgBox: {
    height: 80,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  urgencyDot: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#EF4444",
  },
  groupBuyInfo: {
    padding: 8,
    gap: 3,
  },
  groupBuyName: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: fs(11),
  },
  groupBuyPrice: {
    fontFamily: "Poppins_700Bold",
    fontSize: fs(12),
  },
  groupBuyProgressBg: {
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
    marginVertical: 2,
  },
  groupBuyProgressFill: {
    height: "100%",
    borderRadius: 2,
  },
  groupBuyRemaining: {
    fontFamily: "Poppins_400Regular",
    fontSize: fs(10),
  },
  joinBtn: {
    marginTop: 4,
    borderRadius: 8,
    paddingVertical: 5,
    alignItems: "center",
  },
  joinBtnText: {
    color: "#fff",
    fontFamily: "Poppins_600SemiBold",
    fontSize: fs(11),
  },
  discSubtitle: {
    fontFamily: "Poppins_400Regular",
    fontSize: fs(11),
    marginTop: -2,
  },
  discChipsRow: {
    paddingHorizontal: 16,
    gap: 8,
    alignItems: "center",
  },
  discChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  discChipFlag: {
    fontSize: 14,
  },
  discChipLabel: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: fs(11),
  },
  discFeed: {
    paddingHorizontal: 16,
    gap: 12,
    paddingBottom: 24,
  },
  discCard: {
    width: "100%",
    height: 120,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: "row",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  discLeft: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 14,
    justifyContent: "space-between",
  },
  discSellerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  discSeller: {
    fontFamily: "Poppins_500Medium",
    fontSize: fs(11),
    flexShrink: 1,
  },
  discFlag: {
    fontSize: 14,
  },
  discName: {
    fontFamily: "Poppins_700Bold",
    fontSize: fs(13),
    lineHeight: 18,
    marginVertical: 2,
  },
  discRatingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 1,
  },
  discRatingNum: {
    fontFamily: "Poppins_400Regular",
    fontSize: fs(9),
  },
  discPriceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 2,
  },
  discPrice: {
    fontFamily: "Poppins_700Bold",
    fontSize: fs(16),
  },
  discRight: {
    width: 110,
    alignItems: "center",
    justifyContent: "center",
  },
  discCartBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  discEndMsg: {
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    paddingVertical: 20,
  },
  discEndText: {
    fontFamily: "Poppins_400Regular",
    fontSize: fs(13),
  },
});
