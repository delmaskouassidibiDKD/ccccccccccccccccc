import React, { useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/contexts/ThemeContext";

type Promo = {
  id: string;
  name: string;
  category: string;
  originalPrice: number;
  promoPrice: number;
  discount: number;
  emoji: string;
  badgeColor: string;
  endsIn: string;
};

const PROMOS: Promo[] = [
  { id: "p1", name: "Riz parfumé 25 kg", category: "Alimentation", originalPrice: 16000, promoPrice: 11200, discount: 30, emoji: "🌾", badgeColor: "#22C55E", endsIn: "2j 14h" },
  { id: "p2", name: "Smartphone Android 128Go", category: "Électronique", originalPrice: 85000, promoPrice: 59500, discount: 30, emoji: "📱", badgeColor: "#3B82F6", endsIn: "5j 08h" },
  { id: "p3", name: "Sac à main cuir femme", category: "Mode", originalPrice: 22000, promoPrice: 14300, discount: 35, emoji: "👜", badgeColor: "#EC4899", endsIn: "1j 06h" },
  { id: "p4", name: "Huile de tournesol (5L)", category: "Épicerie", originalPrice: 4500, promoPrice: 2700, discount: 40, emoji: "🫙", badgeColor: "#F59E0B", endsIn: "3j 22h" },
  { id: "p5", name: "Écouteurs Bluetooth Pro", category: "High-Tech", originalPrice: 18000, promoPrice: 10800, discount: 40, emoji: "🎧", badgeColor: "#8B5CF6", endsIn: "6j 12h" },
  { id: "p6", name: "Chaussures sport Nike", category: "Mode", originalPrice: 35000, promoPrice: 24500, discount: 30, emoji: "👟", badgeColor: "#EF4444", endsIn: "4j 03h" },
  { id: "p7", name: "Lait en poudre 900g", category: "Alimentation", originalPrice: 8500, promoPrice: 5950, discount: 30, emoji: "🥛", badgeColor: "#22C55E", endsIn: "2j 18h" },
  { id: "p8", name: "Casque moto intégral", category: "Automobile", originalPrice: 42000, promoPrice: 25200, discount: 40, emoji: "🏍️", badgeColor: "#FF6B00", endsIn: "7j 00h" },
  { id: "p9", name: "Parfum femme 100ml", category: "Beauté", originalPrice: 28000, promoPrice: 19600, discount: 30, emoji: "🌸", badgeColor: "#EC4899", endsIn: "1j 20h" },
  { id: "p10", name: "Set ustensiles cuisine 12 pcs", category: "Maison", originalPrice: 15000, promoPrice: 9000, discount: 40, emoji: "🍳", badgeColor: "#F59E0B", endsIn: "3j 11h" },
];

const FILTERS = ["Tous", "Alimentation", "Mode", "Électronique", "Maison", "Beauté"] as const;

export default function PromosPage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDark, colors } = useTheme();
  const [activeFilter, setActiveFilter] = useState<string>("Tous");

  const dynBG     = isDark ? "#0D1117" : "#F5F6FA";
  const dynHEAD   = isDark ? "#111827" : "#FFFFFF";
  const dynCARD   = isDark ? "#161B22" : "#FFFFFF";
  const dynTEXT   = isDark ? "#FFFFFF" : "#111827";
  const dynSUB    = isDark ? "rgba(255,255,255,0.6)" : "#6B7280";
  const dynBORDER = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)";

  const filtered = activeFilter === "Tous"
    ? PROMOS
    : PROMOS.filter((p) => p.category === activeFilter);

  return (
    <View style={[s.root, { paddingTop: insets.top, backgroundColor: dynBG }]}>

      {/* Header */}
      <View style={[s.header, { backgroundColor: dynHEAD, borderBottomColor: dynBORDER }]}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color={isDark ? "#fff" : "#111827"} />
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <Ionicons name="pricetag" size={20} color="#FF6B00" />
          <Text style={[s.headerTitle, { color: dynTEXT }]}>Promos</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Bannière flash */}
      <View style={s.banner}>
        <View style={s.bannerInner}>
          <Text style={s.bannerEmoji}>⚡</Text>
          <View>
            <Text style={s.bannerTitle}>Offres Flash</Text>
            <Text style={s.bannerSub}>Économisez jusqu'à 40% · Stocks limités</Text>
          </View>
          <View style={s.bannerBadge}>
            <Text style={s.bannerBadgeText}>{PROMOS.length} offres</Text>
          </View>
        </View>
      </View>

      {/* Filtres catégories */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.filtersRow}
      >
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f}
            style={[
              s.filterChip,
              {
                backgroundColor: activeFilter === f ? "#FF6B00" : (isDark ? "#1C2230" : "#F3F4F6"),
                borderColor:     activeFilter === f ? "#FF6B00" : dynBORDER,
              },
            ]}
            onPress={() => { Haptics.selectionAsync(); setActiveFilter(f); }}
            activeOpacity={0.8}
          >
            <Text style={[s.filterChipText, { color: activeFilter === f ? "#fff" : dynSUB }]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Liste des promos */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24, gap: 12 }}
      >
        {filtered.map((promo) => {
          const saving = promo.originalPrice - promo.promoPrice;
          return (
            <TouchableOpacity
              key={promo.id}
              style={[s.card, { backgroundColor: dynCARD, borderColor: dynBORDER }]}
              activeOpacity={0.88}
              onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
            >
              {/* Badge réduction */}
              <View style={[s.discountBadge, { backgroundColor: "#EF4444" }]}>
                <Text style={s.discountText}>-{promo.discount}%</Text>
              </View>

              <View style={s.cardContent}>
                {/* Emoji produit */}
                <View style={[s.emojiBox, { backgroundColor: promo.badgeColor + "18" }]}>
                  <Text style={s.emojiText}>{promo.emoji}</Text>
                </View>

                {/* Infos */}
                <View style={s.cardInfo}>
                  <Text style={[s.productName, { color: dynTEXT }]} numberOfLines={2}>
                    {promo.name}
                  </Text>
                  <Text style={[s.productCat, { color: dynSUB }]}>{promo.category}</Text>

                  <View style={s.priceRow}>
                    <Text style={s.promoPrice}>{promo.promoPrice.toLocaleString("fr-FR")} FCFA</Text>
                    <Text style={[s.originalPrice, { color: dynSUB }]}>
                      {promo.originalPrice.toLocaleString("fr-FR")} FCFA
                    </Text>
                  </View>

                  <View style={s.bottomRow}>
                    <View style={s.savingBadge}>
                      <Text style={s.savingText}>Économie : {saving.toLocaleString("fr-FR")} FCFA</Text>
                    </View>
                    <View style={[s.timerBadge, { backgroundColor: isDark ? "#1C2230" : "#F3F4F6" }]}>
                      <Ionicons name="time-outline" size={11} color={dynSUB} />
                      <Text style={[s.timerText, { color: dynSUB }]}>{promo.endsIn}</Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Bouton ajouter */}
              <TouchableOpacity
                style={s.addBtn}
                onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)}
                activeOpacity={0.8}
              >
                <Ionicons name="cart-outline" size={14} color="#fff" />
                <Text style={s.addBtnText}>Ajouter au panier</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root:            { flex: 1 },
  header:          { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 12, paddingVertical: 12, borderBottomWidth: 1 },
  backBtn:         { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerCenter:    { flexDirection: "row", alignItems: "center", gap: 8 },
  headerTitle:     { fontFamily: "Poppins_700Bold", fontSize: 18 },
  banner:          { margin: 16, marginBottom: 4, borderRadius: 16, backgroundColor: "#FF6B00", overflow: "hidden" },
  bannerInner:     { flexDirection: "row", alignItems: "center", gap: 12, padding: 16 },
  bannerEmoji:     { fontSize: 28 },
  bannerTitle:     { fontFamily: "Poppins_700Bold", fontSize: 16, color: "#fff" },
  bannerSub:       { fontFamily: "Poppins_400Regular", fontSize: 12, color: "rgba(255,255,255,0.85)" },
  bannerBadge:     { marginLeft: "auto", backgroundColor: "rgba(255,255,255,0.25)", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 },
  bannerBadgeText: { fontFamily: "Poppins_700Bold", fontSize: 12, color: "#fff" },
  filtersRow:      { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  filterChip:      { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  filterChipText:  { fontFamily: "Poppins_600SemiBold", fontSize: 12 },
  card:            { borderRadius: 16, padding: 14, borderWidth: 1, gap: 12, position: "relative" },
  discountBadge:   { position: "absolute", top: 14, right: 14, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  discountText:    { fontFamily: "Poppins_700Bold", fontSize: 11, color: "#fff" },
  cardContent:     { flexDirection: "row", gap: 14, alignItems: "flex-start" },
  emojiBox:        { width: 56, height: 56, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  emojiText:       { fontSize: 28 },
  cardInfo:        { flex: 1, gap: 4 },
  productName:     { fontFamily: "Poppins_600SemiBold", fontSize: 14, lineHeight: 20, paddingRight: 36 },
  productCat:      { fontFamily: "Poppins_400Regular", fontSize: 11 },
  priceRow:        { flexDirection: "row", alignItems: "baseline", gap: 8, marginTop: 2 },
  promoPrice:      { fontFamily: "Poppins_700Bold", fontSize: 16, color: "#FF6B00" },
  originalPrice:   { fontFamily: "Poppins_400Regular", fontSize: 12, textDecorationLine: "line-through" },
  bottomRow:       { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap", marginTop: 2 },
  savingBadge:     { backgroundColor: "#22C55E18", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  savingText:      { fontFamily: "Poppins_600SemiBold", fontSize: 10, color: "#22C55E" },
  timerBadge:      { flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  timerText:       { fontFamily: "Poppins_400Regular", fontSize: 10 },
  addBtn:          { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, backgroundColor: "#FF6B00", borderRadius: 12, paddingVertical: 10 },
  addBtnText:      { fontFamily: "Poppins_700Bold", fontSize: 13, color: "#fff" },
});
