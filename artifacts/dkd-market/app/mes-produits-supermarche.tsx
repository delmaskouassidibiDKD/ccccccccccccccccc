import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/contexts/ThemeContext";
import { SellerProductCard, SellerProduct } from "@/components/SellerProductCard";
import * as Haptics from "expo-haptics";

const ACCENT = "#F97316";
type Tab = "rayons" | "engros";

const DEMO_RAYONS: SellerProduct[] = [
  { id: "1", shopName: "Super Abidjan",   shopFlag: "🇨🇮", title: "Riz parfumé Thaï 25kg",        price: "14 500 FCFA", rating: 4.8, reviewCount: 312, status: "active",   icon: "leaf-outline",    color: "#3B7A43" },
  { id: "2", shopName: "FreshMart Dakar", shopFlag: "🇸🇳", title: "Huile végétale 5L Palmy",      price: "3 800 FCFA",  rating: 4.5, reviewCount: 189, status: "active",   icon: "water-outline",   color: "#F59E0B" },
  { id: "3", shopName: "BioShop Lomé",    shopFlag: "🇹🇬", title: "Lait en poudre Nido 900g",     price: "6 200 FCFA",  rating: 4.6, reviewCount: 244, status: "active",   icon: "cafe-outline",    color: "#0EA5E9" },
];

const DEMO_ENGROS: SellerProduct[] = [
  { id: "1", shopName: "Grossiste ABJ",       shopFlag: "🇨🇮", title: "Palette riz Thaï 50 sacs",      price: "680 000 FCFA", rating: 4.7, reviewCount: 28, status: "active",   icon: "cube-outline",    color: "#1B4D9E", minQty: "50 sacs"  },
  { id: "2", shopName: "DistribPro Cotonou",  shopFlag: "🇧🇯", title: "Carton huile 24 bidons 5L",     price: "84 000 FCFA",  rating: 4.3, reviewCount: 15, status: "active",   icon: "layers-outline",  color: "#7B4226", minQty: "24 bidons"},
  { id: "3", shopName: "MegaStock Conakry",   shopFlag: "🇬🇳", title: "Lot lait en poudre 12 boîtes",  price: "72 000 FCFA",  rating: 4.1, reviewCount: 9,  status: "inactive", icon: "archive-outline", color: "#4B5563", minQty: "12 boîtes"},
];

export default function MesProduitsSuperMarchePage() {
  const router  = useRouter();
  const insets  = useSafeAreaInsets();
  const { isDark } = useTheme();
  const paddingBottom = Platform.OS === "web" ? 34 : insets.bottom;

  const [activeTab, setActiveTab] = useState<Tab>("rayons");

  const dynBG     = isDark ? "#0D1117" : "#F0F4FA";
  const dynHeader = isDark ? "#111827" : "#FFFFFF";
  const dynBorder = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.08)";
  const dynSub    = isDark ? "#64748B" : "#6B7280";

  const TABS = [
    { key: "rayons" as Tab, label: "Rayons",  count: DEMO_RAYONS.length,  icon: "cube-outline"   },
    { key: "engros" as Tab, label: "En gros", count: DEMO_ENGROS.length,  icon: "layers-outline" },
  ];

  const data     = activeTab === "rayons" ? DEMO_RAYONS : DEMO_ENGROS;
  const isEngros = activeTab === "engros";

  return (
    <View style={[s.root, { backgroundColor: dynBG, paddingTop: insets.top }]}>

      <View style={[s.header, { backgroundColor: dynHeader, borderBottomColor: dynBorder }]}>
        <TouchableOpacity style={[s.backBtn, { backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)" }]} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={20} color={isDark ? "#fff" : "#111"} />
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <View style={[s.headerIcon, { backgroundColor: ACCENT + "22" }]}>
            <Ionicons name="storefront-outline" size={16} color={ACCENT} />
          </View>
          <Text style={[s.headerTitle, { color: isDark ? "#fff" : "#111" }]}>Gérer mes produits</Text>
        </View>
        <TouchableOpacity onPress={() => router.push("/add-product" as any)}>
          <Ionicons name="add" size={22} color={ACCENT} />
        </TouchableOpacity>
      </View>

      <View style={[s.tabBar, { backgroundColor: isDark ? "#111" : "#F8F8F8", borderBottomColor: dynBorder }]}>
        {TABS.map((tab) => {
          const active = activeTab === tab.key;
          return (
            <TouchableOpacity key={tab.key} style={[s.tab, { backgroundColor: isDark ? "#1A1A1A" : "#EFEFEF" }, active && [s.tabActive, { borderColor: ACCENT + "66", backgroundColor: ACCENT + "14" }]]} onPress={() => { setActiveTab(tab.key); Haptics.selectionAsync(); }} activeOpacity={0.8}>
              <Ionicons name={tab.icon as any} size={15} color={active ? ACCENT : dynSub} />
              <Text style={[s.tabLabel, { color: active ? ACCENT : dynSub }]}>{tab.label}</Text>
              <View style={[s.tabBadge, { backgroundColor: active ? ACCENT + "28" : (isDark ? "#2D2D2D" : "#E5E7EB") }]}>
                <Text style={[s.tabBadgeText, { color: active ? ACCENT : dynSub }]}>{tab.count}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      <FlatList
        key={activeTab}
        data={data}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ paddingHorizontal: 14, paddingTop: 14, paddingBottom: paddingBottom + 24 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <SellerProductCard item={item} isDark={isDark} isEngros={isEngros} accentColor={ACCENT} onEdit={() => {}} onVideo={() => {}} />
        )}
        ListEmptyComponent={<View style={s.empty}><Ionicons name="cube-outline" size={48} color={dynSub} /><Text style={[s.emptyTitle, { color: dynSub }]}>Aucun produit</Text></View>}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, gap: 10 },
  backBtn: { width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  headerCenter: { flex: 1, flexDirection: "row", alignItems: "center", gap: 10 },
  headerIcon: { width: 30, height: 30, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontFamily: "Poppins_700Bold", fontSize: 17 },
  tabBar: { flexDirection: "row", paddingHorizontal: 14, paddingVertical: 10, gap: 10, borderBottomWidth: 1 },
  tab: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10, borderRadius: 12 },
  tabActive: { borderWidth: 1.5 },
  tabLabel: { fontFamily: "Poppins_600SemiBold", fontSize: 13 },
  tabBadge: { borderRadius: 10, paddingHorizontal: 6, paddingVertical: 1, minWidth: 20, alignItems: "center" },
  tabBadgeText: { fontFamily: "Poppins_700Bold", fontSize: 10 },
  empty: { alignItems: "center", justifyContent: "center", paddingTop: 80, gap: 12 },
  emptyTitle: { fontFamily: "Poppins_600SemiBold", fontSize: 15 },
});
