import React, { useState } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/contexts/ThemeContext";
import * as Haptics from "expo-haptics";

const ACCENT  = "#3B82F6";

type SaleMode = "wholesale_only";

const METHODS: {
  key: SaleMode;
  icon: string;
  color: string;
  label: string;
  sub: string;
  tags: string[];
}[] = [
  {
    key: "wholesale_only",
    icon: "cube-outline",
    color: "#34D399",
    label: "Vente en gros",
    sub: "Exclusivement destiné aux professionnels et revendeurs. Commandes minimales avec paliers de quantité et tarifs négociables.",
    tags: ["Professionnels", "Min. commande", "B2B"],
  },
];

export default function PublicationGrossistePage() {
  const router  = useRouter();
  const insets  = useSafeAreaInsets();
  const { isDark } = useTheme();

  const dynBG     = isDark ? "#0D1117" : "#F0F4FA";
  const dynCARD   = isDark ? "#161B25" : "#FFFFFF";
  const dynText   = isDark ? "#F0F6FF" : "#1A1A1A";
  const dynSub    = isDark ? "#64748B" : "#6B7280";
  const dynBorder = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.08)";
  const dynHeader = isDark ? "#111827" : "#FFFFFF";

  const [selected] = useState<SaleMode>("wholesale_only");

  const handleContinue = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.push(`/add-product?saleMode=${selected}&context=grossiste` as any);
  };

  return (
    <View style={[s.root, { backgroundColor: dynBG }]}>

      {/* ── HEADER ── */}
      <View style={[s.header, { paddingTop: insets.top + 10, backgroundColor: dynHeader, borderBottomColor: dynBorder }]}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color={dynText} />
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <View style={[s.headerIcon, { backgroundColor: ACCENT + "20" }]}>
            <Ionicons name="storefront-outline" size={18} color={ACCENT} />
          </View>
          <View>
            <Text style={[s.headerTitle, { color: dynText }]}>Publication grossiste</Text>
            <Text style={[s.headerSub, { color: dynSub }]}>Choisissez votre méthode de vente</Text>
          </View>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 100 }]}
      >

        {/* Intro */}
        <View style={[s.introBox, { backgroundColor: ACCENT + "12", borderColor: ACCENT + "30" }]}>
          <Ionicons name="information-circle-outline" size={18} color={ACCENT} />
          <Text style={[s.introText, { color: isDark ? "#93C5FD" : "#1D4ED8" }]}>
            Sélectionnez le type de publication adapté à votre activité. Vous pourrez renseigner tous les détails du produit à l'étape suivante.
          </Text>
        </View>

        {/* Method cards */}
        {METHODS.map((m) => (
          <View
            key={m.key}
            style={[s.card, { backgroundColor: dynCARD, borderColor: m.color, shadowColor: m.color }]}
          >
            {/* Color strip */}
            <View style={[s.strip, { backgroundColor: m.color }]} />

            <View style={s.cardInner}>
              {/* Top row */}
              <View style={s.cardTop}>
                <View style={[s.iconWrap, { backgroundColor: m.color + "22" }]}>
                  <Ionicons name={m.icon as any} size={24} color={m.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.methodLabel, { color: m.color }]}>{m.label}</Text>
                  <Text style={[s.methodSub, { color: dynSub }]}>{m.sub}</Text>
                </View>
                <View style={[s.radio, { borderColor: m.color, backgroundColor: m.color }]}>
                  <Ionicons name="checkmark" size={14} color="#fff" />
                </View>
              </View>

              {/* Tags */}
              <View style={s.tagsRow}>
                {m.tags.map((tag) => (
                  <View key={tag} style={[s.tag, { backgroundColor: m.color + "14", borderColor: m.color + "33" }]}>
                    <Text style={[s.tagText, { color: m.color }]}>{tag}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        ))}

        {/* What's next section */}
        <View style={[s.nextBox, { backgroundColor: dynCARD, borderColor: dynBorder }]}>
          <Text style={[s.nextTitle, { color: dynText }]}>À l'étape suivante vous pourrez :</Text>
          {[
            { icon: "camera-outline",    text: "Ajouter jusqu'à 6 photos + 1 vidéo" },
            { icon: "pricetag-outline",  text: "Définir les prix et paliers de quantité" },
            { icon: "grid-outline",      text: "Choisir la catégorie et les variantes" },
            { icon: "sparkles-outline",  text: "Générer la description avec l'IA" },
          ].map((item) => (
            <View key={item.icon} style={s.nextItem}>
              <View style={[s.nextIcon, { backgroundColor: ACCENT + "14" }]}>
                <Ionicons name={item.icon as any} size={14} color={ACCENT} />
              </View>
              <Text style={[s.nextItemText, { color: dynSub }]}>{item.text}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* ── STICKY FOOTER ── */}
      <View style={[s.footer, { paddingBottom: insets.bottom + 12, backgroundColor: dynHeader, borderTopColor: dynBorder }]}>
        <TouchableOpacity
          style={[s.continueBtn, { backgroundColor: ACCENT }]}
          onPress={handleContinue}
          activeOpacity={0.85}
        >
          <Ionicons name="arrow-forward-circle-outline" size={20} color="#fff" />
          <Text style={[s.continueBtnText, { color: "#fff" }]}>
            Continuer — Renseigner le produit
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.mgmtBtn, { borderColor: ACCENT + "55", backgroundColor: ACCENT + "12" }]}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push("/mes-publications" as any); }}
          activeOpacity={0.8}
        >
          <Ionicons name="list-outline" size={19} color={ACCENT} />
          <Text style={[s.mgmtBtnText, { color: ACCENT }]}>Gérer mes publications</Text>
          <Ionicons name="chevron-forward" size={16} color={ACCENT + "99"} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root:       { flex: 1 },

  header:     { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingBottom: 14, gap: 12, borderBottomWidth: 1 },
  backBtn:    { padding: 4 },
  headerCenter:{ flex: 1, flexDirection: "row", alignItems: "center", gap: 10 },
  headerIcon: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  headerTitle:{ fontFamily: "Poppins_700Bold", fontSize: 16 },
  headerSub:  { fontFamily: "Poppins_400Regular", fontSize: 11, marginTop: -1 },

  scroll:     { padding: 14, gap: 12 },

  introBox:   { flexDirection: "row", alignItems: "flex-start", gap: 10, borderRadius: 12, borderWidth: 1, padding: 12 },
  introText:  { flex: 1, fontFamily: "Poppins_400Regular", fontSize: 12, lineHeight: 18 },

  card:       {
    borderRadius: 16, borderWidth: 1.5, overflow: "hidden", flexDirection: "row",
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.18, shadowRadius: 8, elevation: 4,
  },
  strip:      { width: 5 },
  cardInner:  { flex: 1, padding: 14, gap: 10 },

  cardTop:    { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  iconWrap:   { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  labelRow:   { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  methodLabel:{ fontFamily: "Poppins_700Bold", fontSize: 14 },
  methodSub:  { fontFamily: "Poppins_400Regular", fontSize: 12, lineHeight: 17, marginTop: 3 },
  badge:      { borderRadius: 6, borderWidth: 1, paddingHorizontal: 7, paddingVertical: 2 },
  badgeText:  { fontFamily: "Poppins_700Bold", fontSize: 9 },
  radio:      { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: "center", justifyContent: "center", marginTop: 2 },

  tagsRow:    { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  tag:        { borderRadius: 8, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 3 },
  tagText:    { fontFamily: "Poppins_500Medium", fontSize: 10 },

  nextBox:    { borderRadius: 14, borderWidth: 1, padding: 14, gap: 10 },
  nextTitle:  { fontFamily: "Poppins_700Bold", fontSize: 13 },
  nextItem:   { flexDirection: "row", alignItems: "center", gap: 10 },
  nextIcon:   { width: 26, height: 26, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  nextItemText:{ fontFamily: "Poppins_400Regular", fontSize: 12, flex: 1 },

  footer:     { paddingHorizontal: 16, paddingTop: 12, borderTopWidth: 1, gap: 10 },
  footerHint: { fontFamily: "Poppins_400Regular", fontSize: 11, textAlign: "center" },
  continueBtn:{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 14, paddingVertical: 14 },
  continueBtnText: { fontFamily: "Poppins_700Bold", fontSize: 14 },
  mgmtBtn:    { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 14, paddingVertical: 13, borderWidth: 1 },
  mgmtBtnText:{ fontFamily: "Poppins_600SemiBold", fontSize: 14 },
});
