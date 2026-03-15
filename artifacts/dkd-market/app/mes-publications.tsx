import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Platform } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useTheme } from "../contexts/ThemeContext";
import { SellerProductCard, SellerProduct } from "@/components/SellerProductCard";

const ORANGE = "#FF6B00";
type Tab = "articles" | "engros";

const DEMO_ARTICLES: SellerProduct[] = [
  { id: "1", shopName: "Savons Ouaga",  shopFlag: "🇧🇫", title: "Savon Karité Naturel",       price: "1 500 FCFA",  rating: 4.7, reviewCount: 430, status: "active",   icon: "sparkles-outline",   color: "#4A7C59" },
  { id: "2", shopName: "Cuir Cotonou",  shopFlag: "🇧🇯", title: "Chaussures Cuir Homme",      price: "18 500 FCFA", rating: 4.4, reviewCount: 203, status: "active",   icon: "footsteps-outline",  color: "#7B4226" },
  { id: "3", shopName: "Mode Dakar",    shopFlag: "🇸🇳", title: "Pagne Wax Java 6 yards",     price: "12 500 FCFA", rating: 4.9, reviewCount: 178, status: "active",   icon: "shirt-outline",      color: "#1B4D9E" },
];

const DEMO_ENGROS: SellerProduct[] = [
  { id: "1", shopName: "Grossiste ABJ",   shopFlag: "🇨🇮", title: "Carton pagnes wax 50 pièces",       price: "180 000 FCFA", rating: 4.6, reviewCount: 34, status: "active",   icon: "cube-outline",   color: "#3B5998", minQty: "50 pcs"   },
  { id: "2", shopName: "Palm Conakry",    shopFlag: "🇬🇳", title: "Palette huile de palme 24 bidons",  price: "72 000 FCFA",  rating: 4.3, reviewCount: 19, status: "active",   icon: "leaf-outline",   color: "#3B7A43", minQty: "24 bidons"},
  { id: "3", shopName: "Beauté Pro Lomé", shopFlag: "🇹🇬", title: "Carton savon karité 100 pcs",       price: "45 000 FCFA",  rating: 4.1, reviewCount: 11, status: "inactive", icon: "flower-outline", color: "#9B2B6B", minQty: "100 pcs"  },
];

export default function MesPublications() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const paddingTop    = Platform.OS === "web" ? 0 : insets.top;
  const paddingBottom = Platform.OS === "web" ? 34 : insets.bottom;

  const dBG     = isDark ? "#0A0A0A" : "#F0F4F8";
  const dHEAD   = isDark ? "#111"    : "#1a1f2e";
  const dMUTED  = isDark ? "#6B7280" : "#9CA3AF";
  const dBORDER = isDark ? "#1E1E1E" : "rgba(0,0,0,0.08)";

  const [activeTab, setActiveTab] = useState<Tab>("articles");
  const [articles]  = useState(DEMO_ARTICLES);
  const [engros]    = useState(DEMO_ENGROS);

  const TABS = [
    { key: "articles" as Tab, label: "Articles", count: articles.length, icon: "bag-handle-outline" },
    { key: "engros"   as Tab, label: "En gros",  count: engros.length,   icon: "layers-outline"    },
  ];

  const data     = activeTab === "articles" ? articles : engros;
  const isEngros = activeTab === "engros";

  return (
    <View style={[s.container, { paddingTop, backgroundColor: dBG }]}>

      {/* Header */}
      <View style={[s.header, { backgroundColor: dHEAD, borderBottomColor: "rgba(255,255,255,0.08)" }]}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Mes publications</Text>
        <TouchableOpacity style={s.addBtn} onPress={() => router.push("/add-product" as any)}>
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={[s.tabBar, { backgroundColor: isDark ? "#111" : "#F8F8F8", borderBottomColor: dBORDER }]}>
        {TABS.map((tab) => {
          const active = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[s.tabItem, { backgroundColor: isDark ? "#1A1A1A" : "#EFEFEF" }, active && s.tabItemActive]}
              onPress={() => { setActiveTab(tab.key); Haptics.selectionAsync(); }}
              activeOpacity={0.8}
            >
              <Ionicons name={tab.icon as any} size={16} color={active ? ORANGE : dMUTED} />
              <Text style={[s.tabLabel, { color: active ? ORANGE : dMUTED }]}>{tab.label}</Text>
              <View style={[s.tabCount, { backgroundColor: isDark ? "#2D2D2D" : "#E5E7EB" }, active && s.tabCountActive]}>
                <Text style={[s.tabCountText, { color: active ? ORANGE : dMUTED }]}>{tab.count}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Content */}
      <FlatList
        key={activeTab}
        data={data}
        keyExtractor={(i) => i.id}
        contentContainerStyle={[s.list, { paddingBottom: paddingBottom + 24 }]}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <SellerProductCard
            item={item}
            isDark={isDark}
            isEngros={isEngros}
            accentColor={ORANGE}
            onEdit={() => {}}
            onVideo={() => {}}
          />
        )}
        ListEmptyComponent={
          <View style={s.emptyState}>
            <Ionicons name="bag-handle-outline" size={52} color={dMUTED} />
            <Text style={[s.emptyTitle, { color: dMUTED }]}>Aucune publication</Text>
            <Text style={[s.emptyDesc, { color: dMUTED }]}>Vos publications apparaîtront ici.</Text>
          </View>
        }
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },

  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  backBtn: { padding: 4, width: 36 },
  headerTitle: { flex: 1, textAlign: "center", fontFamily: "Poppins_700Bold", fontSize: 17, color: "#fff" },
  addBtn: { width: 36, alignItems: "flex-end" },

  tabBar: { flexDirection: "row", paddingHorizontal: 14, paddingVertical: 10, gap: 10, borderBottomWidth: 1 },
  tabItem: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 11, borderRadius: 12 },
  tabItemActive: { backgroundColor: "#FF6B0012", borderWidth: 1.5, borderColor: "#FF6B0050" },
  tabLabel: { fontFamily: "Poppins_600SemiBold", fontSize: 13 },
  tabCount: { borderRadius: 10, paddingHorizontal: 7, paddingVertical: 1, minWidth: 22, alignItems: "center" },
  tabCountActive: { backgroundColor: "#FF6B0025" },
  tabCountText: { fontFamily: "Poppins_700Bold", fontSize: 10 },

  list: { paddingHorizontal: 14, paddingTop: 14 },

  emptyState: { alignItems: "center", justifyContent: "center", paddingTop: 80, gap: 12 },
  emptyTitle: { fontFamily: "Poppins_600SemiBold", fontSize: 16 },
  emptyDesc:  { fontFamily: "Poppins_400Regular", fontSize: 13, textAlign: "center" },
});
