import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/contexts/ThemeContext";
import { SellerProductCard, SellerProduct } from "@/components/SellerProductCard";
import * as Haptics from "expo-haptics";

const ACCENT = "#3B82F6";

const DEMO: SellerProduct[] = [
  { id: "1", shopName: "Grossiste Ouaga",  shopFlag: "🇧🇫", title: "Carton pagnes wax 50 pièces",       price: "180 000 FCFA",   rating: 4.6, reviewCount: 34, status: "active",   icon: "cube-outline",    color: "#1B4D9E", minQty: "50 pcs"     },
  { id: "2", shopName: "Palm Conakry",     shopFlag: "🇬🇳", title: "Palette huile de palme 24 bidons",  price: "72 000 FCFA",    rating: 4.3, reviewCount: 19, status: "active",   icon: "leaf-outline",    color: "#3B7A43", minQty: "24 bidons"  },
  { id: "3", shopName: "Beauté Pro Lomé",  shopFlag: "🇹🇬", title: "Carton savon karité 100 pcs",       price: "45 000 FCFA",    rating: 4.1, reviewCount: 11, status: "inactive", icon: "flower-outline",  color: "#9B2B6B", minQty: "100 pcs"    },
];

export default function MesProduitsGrossistePage() {
  const router  = useRouter();
  const insets  = useSafeAreaInsets();
  const { isDark } = useTheme();
  const paddingBottom = Platform.OS === "web" ? 34 : insets.bottom;

  const dynBG     = isDark ? "#0D1117" : "#F0F4FA";
  const dynHeader = isDark ? "#111827" : "#FFFFFF";
  const dynBorder = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.08)";
  const dynSub    = isDark ? "#64748B" : "#6B7280";

  return (
    <View style={[s.root, { backgroundColor: dynBG }]}>

      <View style={[s.header, { paddingTop: insets.top + 10, backgroundColor: dynHeader, borderBottomColor: dynBorder }]}>
        <TouchableOpacity style={[s.backBtn, { backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)" }]} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={20} color={isDark ? "#fff" : "#111"} />
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <View style={[s.headerIcon, { backgroundColor: ACCENT + "22" }]}>
            <Ionicons name="cube-outline" size={16} color={ACCENT} />
          </View>
          <Text style={[s.headerTitle, { color: isDark ? "#fff" : "#111" }]}>Gérer les articles</Text>
        </View>
        <TouchableOpacity onPress={() => { Haptics.selectionAsync(); router.push("/add-product" as any); }}>
          <Ionicons name="add" size={22} color={ACCENT} />
        </TouchableOpacity>
      </View>

      {/* Onglet unique EN GROS */}
      <View style={[s.tabBar, { backgroundColor: isDark ? "#111" : "#F8F8F8", borderBottomColor: dynBorder }]}>
        <View style={[s.tabSingle, { borderColor: ACCENT + "55", backgroundColor: ACCENT + "12" }]}>
          <Ionicons name="cube-outline" size={15} color={ACCENT} />
          <Text style={[s.tabLabel, { color: ACCENT }]}>Produits en gros</Text>
          <View style={[s.tabBadge, { backgroundColor: ACCENT + "25" }]}>
            <Text style={[s.tabBadgeText, { color: ACCENT }]}>{DEMO.length}</Text>
          </View>
        </View>
      </View>

      <FlatList
        data={DEMO}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ paddingHorizontal: 14, paddingTop: 14, paddingBottom: paddingBottom + 24 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <SellerProductCard item={item} isDark={isDark} isEngros accentColor={ACCENT} onEdit={() => {}} onVideo={() => {}} />
        )}
        ListEmptyComponent={<View style={s.empty}><Ionicons name="cube-outline" size={48} color={dynSub} /><Text style={[s.emptyTitle, { color: dynSub }]}>Aucun lot</Text></View>}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingBottom: 12, gap: 10, borderBottomWidth: 1 },
  backBtn: { width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  headerCenter: { flex: 1, flexDirection: "row", alignItems: "center", gap: 10 },
  headerIcon: { width: 30, height: 30, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontFamily: "Poppins_700Bold", fontSize: 17 },
  tabBar: { paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1 },
  tabSingle: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, borderRadius: 12, paddingVertical: 10, borderWidth: 1.5 },
  tabLabel: { fontFamily: "Poppins_600SemiBold", fontSize: 13 },
  tabBadge: { borderRadius: 10, paddingHorizontal: 6, paddingVertical: 1, minWidth: 20, alignItems: "center" },
  tabBadgeText: { fontFamily: "Poppins_700Bold", fontSize: 10 },
  empty: { alignItems: "center", justifyContent: "center", paddingTop: 80, gap: 12 },
  emptyTitle: { fontFamily: "Poppins_600SemiBold", fontSize: 15 },
});
