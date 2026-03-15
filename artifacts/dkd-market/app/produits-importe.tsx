import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/contexts/ThemeContext";
import { SellerProductCard, SellerProduct } from "@/components/SellerProductCard";
import * as Haptics from "expo-haptics";

const ACCENT = "#34D399";
type Tab = "detail" | "engros";

const DEMO_DETAIL: SellerProduct[] = [
  { id: "1", shopName: "Import Chine",  shopFlag: "🇨🇳", title: "Tissu wax 6 yards Holland",      price: "15 000 FCFA", rating: 4.7, reviewCount: 203, status: "active",   icon: "shirt-outline",          color: "#7B3F00", origine: "Chine → Côte d'Ivoire"    },
  { id: "2", shopName: "ElectroShop",   shopFlag: "🇨🇳", title: "Téléphone Android 4G 128Go",     price: "55 000 FCFA", rating: 4.5, reviewCount: 88,  status: "active",   icon: "phone-portrait-outline",  color: "#1D4ED8", origine: "Chine → Mali"              },
  { id: "3", shopName: "VietFood",      shopFlag: "🇻🇳", title: "Riz long grain parfumé 50kg",    price: "13 000 FCFA", rating: 4.6, reviewCount: 142, status: "inactive", icon: "leaf-outline",            color: "#3B7A43", origine: "Vietnam → Burkina Faso"    },
];

const DEMO_ENGROS: SellerProduct[] = [
  { id: "1", shopName: "Import Chine",  shopFlag: "🇨🇳", title: "Carton tissus wax 200 pièces",   price: "2 500 000 FCFA", rating: 4.6, reviewCount: 34, status: "active",   icon: "cube-outline",    color: "#7B3F00", minQty: "200 pcs",   origine: "Chine → Côte d'Ivoire" },
  { id: "2", shopName: "TechGross",     shopFlag: "🇨🇳", title: "Lot téléphones Android 50 unités",price: "2 200 000 FCFA", rating: 4.4, reviewCount: 12, status: "active",   icon: "layers-outline",  color: "#1D4ED8", minQty: "50 unités", origine: "Chine → Sénégal"       },
  { id: "3", shopName: "VietFood Gros", shopFlag: "🇻🇳", title: "Palette riz parfumé 40 sacs",    price: "480 000 FCFA",   rating: 4.3, reviewCount: 9,  status: "inactive", icon: "archive-outline", color: "#3B7A43", minQty: "40 sacs",   origine: "Vietnam → Burkina Faso"},
];

export default function ProduitsImportePage() {
  const router  = useRouter();
  const insets  = useSafeAreaInsets();
  const { isDark } = useTheme();
  const paddingBottom = Platform.OS === "web" ? 34 : insets.bottom;

  const [activeTab, setActiveTab] = useState<Tab>("detail");

  const dynBG     = isDark ? "#0D1117" : "#F0F4FA";
  const dynHeader = isDark ? "#111827" : "#FFFFFF";
  const dynBorder = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.08)";
  const dynSub    = isDark ? "#64748B" : "#6B7280";

  const TABS = [
    { key: "detail" as Tab, label: "Détail",  count: DEMO_DETAIL.length, icon: "bag-handle-outline" },
    { key: "engros" as Tab, label: "En gros", count: DEMO_ENGROS.length, icon: "cube-outline"       },
  ];

  const data     = activeTab === "detail" ? DEMO_DETAIL : DEMO_ENGROS;
  const isEngros = activeTab === "engros";

  return (
    <View style={[s.root, { backgroundColor: dynBG, paddingTop: insets.top }]}>

      <View style={[s.header, { backgroundColor: dynHeader, borderBottomColor: dynBorder }]}>
        <TouchableOpacity style={[s.backBtn, { backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)" }]} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={20} color={isDark ? "#fff" : "#111"} />
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <View style={[s.headerIcon, { backgroundColor: ACCENT + "22" }]}>
            <Ionicons name="globe-outline" size={16} color={ACCENT} />
          </View>
          <Text style={[s.headerTitle, { color: isDark ? "#fff" : "#111" }]}>Gérer mes produits</Text>
        </View>
        <TouchableOpacity style={[s.addBtn, { backgroundColor: ACCENT }]} onPress={() => { Haptics.selectionAsync(); router.push("/add-product" as any); }} activeOpacity={0.85}>
          <Ionicons name="add" size={20} color="#fff" />
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
        ListEmptyComponent={<View style={s.empty}><Ionicons name="globe-outline" size={48} color={dynSub} /><Text style={[s.emptyTitle, { color: dynSub }]}>Aucun produit importé</Text></View>}
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
  addBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  tabBar: { flexDirection: "row", paddingHorizontal: 14, paddingVertical: 10, gap: 10, borderBottomWidth: 1 },
  tab: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10, borderRadius: 12 },
  tabActive: { borderWidth: 1.5 },
  tabLabel: { fontFamily: "Poppins_600SemiBold", fontSize: 13 },
  tabBadge: { borderRadius: 10, paddingHorizontal: 6, paddingVertical: 1, minWidth: 20, alignItems: "center" },
  tabBadgeText: { fontFamily: "Poppins_700Bold", fontSize: 10 },
  empty: { alignItems: "center", justifyContent: "center", paddingTop: 80, gap: 12 },
  emptyTitle: { fontFamily: "Poppins_600SemiBold", fontSize: 15 },
});
