import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, FlatList, TextInput, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/contexts/ThemeContext";
import { SellerProductCard, SellerProduct } from "@/components/SellerProductCard";
import * as Haptics from "expo-haptics";

const ACCENT = "#06B6D4";
type Tab = "detail" | "engros";

const DEMO_DETAIL: SellerProduct[] = [
  { id: "1", shopName: "Atelier Ouaga",      shopFlag: "🇧🇫", title: "Broderie logo entreprise",          price: "15 000 FCFA", rating: 4.8, reviewCount: 64, status: "active",   icon: "color-palette-outline", color: "#0E7490" },
  { id: "2", shopName: "Couture Dakar",      shopFlag: "🇸🇳", title: "Robe de soirée sur-mesure",         price: "95 000 FCFA", rating: 4.9, reviewCount: 38, status: "active",   icon: "shirt-outline",         color: "#7C3AED" },
  { id: "3", shopName: "Uniforme Pro Lomé",  shopFlag: "🇹🇬", title: "Uniforme scolaire personnalisé",    price: "25 000 FCFA", rating: 4.4, reviewCount: 21, status: "inactive", icon: "people-outline",        color: "#1D4ED8" },
];

const DEMO_ENGROS: SellerProduct[] = [
  { id: "1", shopName: "Atelier Ouaga",      shopFlag: "🇧🇫", title: "Lot broderie 20 pièces",            price: "280 000 FCFA",    rating: 4.7, reviewCount: 12, status: "active",   icon: "cube-outline",    color: "#0E7490", minQty: "20 pcs"  },
  { id: "2", shopName: "Couture Pro Abidjan",shopFlag: "🇨🇮", title: "50 uniformes scolaires sur-mesure", price: "1 100 000 FCFA",  rating: 4.5, reviewCount: 8,  status: "active",   icon: "layers-outline",  color: "#7C3AED", minQty: "50 pcs"  },
  { id: "3", shopName: "Textile Lomé",       shopFlag: "🇹🇬", title: "Carton tenues traditionnelles 30",  price: "1 500 000 FCFA",  rating: 4.3, reviewCount: 5,  status: "inactive", icon: "grid-outline",    color: "#0F766E", minQty: "30 pcs"  },
];

export default function GererProduitsPersonnalisationPage() {
  const router  = useRouter();
  const insets  = useSafeAreaInsets();
  const { isDark } = useTheme();
  const paddingBottom = Platform.OS === "web" ? 34 : insets.bottom;

  const [activeTab, setActiveTab]     = useState<Tab>("detail");
  const [searchQuery, setSearchQuery] = useState("");

  const dynBG     = isDark ? "#0D1117" : "#F0F4FA";
  const dynHeader = isDark ? "#111827" : "#FFFFFF";
  const dynBorder = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.08)";
  const dynSub    = isDark ? "#64748B" : "#6B7280";

  const TABS = [
    { key: "detail" as Tab, label: "Détail",  count: DEMO_DETAIL.length, icon: "cube-outline"   },
    { key: "engros" as Tab, label: "En gros", count: DEMO_ENGROS.length, icon: "layers-outline" },
  ];

  const rawData  = activeTab === "detail" ? DEMO_DETAIL : DEMO_ENGROS;
  const isEngros = activeTab === "engros";
  const q        = searchQuery.toLowerCase().trim();
  const data     = q ? rawData.filter(i => i.title.toLowerCase().includes(q)) : rawData;

  return (
    <View style={[s.root, { backgroundColor: dynBG }]}>

      <View style={[s.header, { paddingTop: insets.top + 10, backgroundColor: dynHeader, borderBottomColor: dynBorder }]}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color={isDark ? "#fff" : "#111"} />
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <View style={[s.headerIcon, { backgroundColor: ACCENT + "20" }]}>
            <Ionicons name="color-palette-outline" size={16} color={ACCENT} />
          </View>
          <Text style={[s.headerTitle, { color: isDark ? "#fff" : "#111" }]}>Gérer mes produits</Text>
        </View>
      </View>

      <View style={[s.tabBar, { backgroundColor: isDark ? "#111" : "#F8F8F8", borderBottomColor: dynBorder }]}>
        {TABS.map((tab) => {
          const active = activeTab === tab.key;
          return (
            <TouchableOpacity key={tab.key} style={[s.tab, { backgroundColor: isDark ? "#1A1A1A" : "#EFEFEF" }, active && [s.tabActive, { borderColor: ACCENT + "66", backgroundColor: ACCENT + "14" }]]} onPress={() => { setActiveTab(tab.key); setSearchQuery(""); Haptics.selectionAsync(); }} activeOpacity={0.8}>
              <Ionicons name={tab.icon as any} size={15} color={active ? ACCENT : dynSub} />
              <Text style={[s.tabLabel, { color: active ? ACCENT : dynSub }]}>{tab.label}</Text>
              <View style={[s.tabBadge, { backgroundColor: active ? ACCENT + "28" : (isDark ? "#2D2D2D" : "#E5E7EB") }]}>
                <Text style={[s.tabBadgeText, { color: active ? ACCENT : dynSub }]}>{tab.count}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={[s.searchWrap, { backgroundColor: isDark ? "#0D1117" : "#F0F4FA", borderBottomColor: dynBorder }]}>
        <View style={[s.searchBox, { backgroundColor: isDark ? "#1E293B" : "#FFFFFF", borderColor: dynBorder }]}>
          <Ionicons name="search-outline" size={15} color={dynSub} />
          <TextInput
            style={[s.searchInput, { color: isDark ? "#fff" : "#111" }]}
            placeholder={isEngros ? "Rechercher en gros…" : "Rechercher un produit…"}
            placeholderTextColor={dynSub}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")} activeOpacity={0.7}>
              <Ionicons name="close-circle" size={16} color={dynSub} />
            </TouchableOpacity>
          )}
        </View>
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
        ListEmptyComponent={<View style={s.empty}><Ionicons name="color-palette-outline" size={48} color={dynSub} /><Text style={[s.emptyTitle, { color: dynSub }]}>{q ? "Aucun résultat" : "Aucun produit"}</Text></View>}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingBottom: 12, gap: 10, borderBottomWidth: 1 },
  backBtn: { padding: 4 },
  headerCenter: { flex: 1, flexDirection: "row", alignItems: "center", gap: 10 },
  headerIcon: { width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontFamily: "Poppins_700Bold", fontSize: 17 },
  tabBar: { flexDirection: "row", paddingHorizontal: 14, paddingVertical: 10, gap: 10, borderBottomWidth: 1 },
  tab: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10, borderRadius: 12 },
  tabActive: { borderWidth: 1.5 },
  tabLabel: { fontFamily: "Poppins_600SemiBold", fontSize: 13 },
  tabBadge: { borderRadius: 10, paddingHorizontal: 6, paddingVertical: 1, minWidth: 20, alignItems: "center" },
  tabBadgeText: { fontFamily: "Poppins_700Bold", fontSize: 10 },
  searchWrap: { paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1 },
  searchBox: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 9 },
  searchInput: { flex: 1, fontFamily: "Poppins_400Regular", fontSize: 13, padding: 0 },
  empty: { alignItems: "center", justifyContent: "center", paddingTop: 80, gap: 12 },
  emptyTitle: { fontFamily: "Poppins_600SemiBold", fontSize: 15 },
});
