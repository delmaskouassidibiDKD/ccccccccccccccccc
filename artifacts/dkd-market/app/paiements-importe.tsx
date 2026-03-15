import React, { useState } from "react";
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/contexts/ThemeContext";
import * as Haptics from "expo-haptics";

const ACCENT = "#A855F7";

type Payment = {
  id: string;
  vendeur: string;
  initials: string;
  color: string;
  produit: string;
  pays: string;
  montant: number;
  date: string;
  status: "attente" | "paye";
};

const PAYMENTS: Payment[] = [
  { id: "i1", vendeur: "Shanghai Trade Co.",  initials: "ST", color: "#3B82F6", produit: "Tissus wax 6 yards (lot 100)", pays: "🇨🇳 Chine",   montant: 1500000, date: "13 mars 2026",  status: "attente" },
  { id: "i2", vendeur: "Vietnam Rice Export", initials: "VR", color: "#34D399", produit: "Riz long grain 50kg",          pays: "🇻🇳 Vietnam", montant: 910000,  date: "10 mars 2026",  status: "attente" },
  { id: "i3", vendeur: "Guangzhou Electro",   initials: "GE", color: "#A855F7", produit: "Téléphones Android lot ×50",  pays: "🇨🇳 Chine",   montant: 2750000, date: "25 févr. 2026", status: "attente" },
  { id: "i4", vendeur: "Ghana Palm Oil Ltd",  initials: "GP", color: "#F59E0B", produit: "Huile de palme 20L",           pays: "🇬🇭 Ghana",   montant: 480000,  date: "06 mars 2026",  status: "paye"    },
  { id: "i5", vendeur: "France Beauté SARL",  initials: "FB", color: "#EC4899", produit: "Cosmétiques gamme premium",   pays: "🇫🇷 France",  montant: 780000,  date: "02 mars 2026",  status: "paye"    },
];

type Tab = "attente" | "paye";

export default function PaiementsImportePage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();

  const dynBG     = isDark ? "#0D1117" : "#F0F4FA";
  const dynCARD   = isDark ? "#161B25" : "#FFFFFF";
  const dynText   = isDark ? "#F0F6FF" : "#1A1A1A";
  const dynSub    = isDark ? "#64748B" : "#6B7280";
  const dynBorder = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.08)";
  const dynHeader = isDark ? "#111827" : "#FFFFFF";

  const [tab, setTab] = useState<Tab>("attente");

  const attente = PAYMENTS.filter((p) => p.status === "attente");
  const payes   = PAYMENTS.filter((p) => p.status === "paye");

  const totalAttente = attente.reduce((acc, p) => acc + p.montant, 0);
  const totalPaye    = payes.reduce((acc, p) => acc + p.montant, 0);

  const displayed  = tab === "attente" ? attente : payes;
  const isPaidTab  = tab === "paye";

  return (
    <View style={[s.root, { backgroundColor: dynBG }]}>

      {/* HEADER */}
      <View style={[s.header, { paddingTop: insets.top + 10, backgroundColor: dynHeader, borderBottomColor: dynBorder }]}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color={dynText} />
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <View style={[s.headerIcon, { backgroundColor: ACCENT + "20" }]}>
            <Ionicons name="wallet-outline" size={16} color={ACCENT} />
          </View>
          <View>
            <Text style={[s.headerTitle, { color: dynText }]}>Paiements</Text>
            <Text style={[s.headerSub, { color: dynSub }]}>Importé</Text>
          </View>
        </View>
      </View>

      {/* TABS */}
      <View style={[s.tabsWrap, { backgroundColor: dynHeader, borderBottomColor: dynBorder }]}>
        <TouchableOpacity
          style={[s.tabBtn, tab === "attente" && [s.tabBtnActive, { borderColor: ACCENT, backgroundColor: ACCENT + "12" }]]}
          onPress={() => { Haptics.selectionAsync(); setTab("attente"); }}
          activeOpacity={0.8}
        >
          <Ionicons name="time-outline" size={15} color={tab === "attente" ? ACCENT : dynSub} />
          <Text style={[s.tabBtnText, { color: tab === "attente" ? ACCENT : dynSub }]}>En cours</Text>
          {attente.length > 0 && (
            <View style={[s.tabBadge, { backgroundColor: tab === "attente" ? ACCENT : (isDark ? "#1E293B" : "#E5E7EB") }]}>
              <Text style={[s.tabBadgeText, { color: tab === "attente" ? "#fff" : dynSub }]}>{attente.length}</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[s.tabBtn, tab === "paye" && [s.tabBtnActive, { borderColor: "#22C55E", backgroundColor: "#22C55E12" }]]}
          onPress={() => { Haptics.selectionAsync(); setTab("paye"); }}
          activeOpacity={0.8}
        >
          <Ionicons name="checkmark-circle-outline" size={15} color={tab === "paye" ? "#22C55E" : dynSub} />
          <Text style={[s.tabBtnText, { color: tab === "paye" ? "#22C55E" : dynSub }]}>Payé</Text>
          {payes.length > 0 && (
            <View style={[s.tabBadge, { backgroundColor: tab === "paye" ? "#22C55E" : (isDark ? "#1E293B" : "#E5E7EB") }]}>
              <Text style={[s.tabBadgeText, { color: tab === "paye" ? "#fff" : dynSub }]}>{payes.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* TOTAL BANNER */}
      <View style={[s.totalBanner, { backgroundColor: isPaidTab ? "#22C55E12" : ACCENT + "0E", borderBottomColor: dynBorder }]}>
        <Text style={[s.totalLabel, { color: dynSub }]}>
          {isPaidTab ? "Total payé" : "Total en attente"}
        </Text>
        <Text style={[s.totalValue, { color: isPaidTab ? "#22C55E" : ACCENT }]}>
          {(isPaidTab ? totalPaye : totalAttente).toLocaleString("fr-FR")} FCFA
        </Text>
      </View>

      {/* LIST */}
      {displayed.length === 0 ? (
        <View style={s.empty}>
          <Ionicons name={isPaidTab ? "checkmark-done-circle-outline" : "hourglass-outline"} size={48} color={dynSub} />
          <Text style={[s.emptyText, { color: dynSub }]}>
            {isPaidTab ? "Aucun paiement confirmé" : "Aucun paiement en attente"}
          </Text>
        </View>
      ) : (
        <FlatList
          data={displayed}
          keyExtractor={(p) => p.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 14, gap: 10, paddingBottom: insets.bottom + 30 }}
          renderItem={({ item }) => (
            <View style={[s.card, { backgroundColor: dynCARD, borderColor: isPaidTab ? "#22C55E22" : dynBorder }]}>
              <View style={[s.cardStripe, { backgroundColor: isPaidTab ? "#22C55E" : ACCENT }]} />
              <View style={s.cardInner}>
                <View style={s.cardRow}>
                  <View style={[s.avatar, { backgroundColor: item.color + "22" }]}>
                    <Text style={[s.avatarText, { color: item.color }]}>{item.initials}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.cardName, { color: dynText }]}>{item.vendeur}</Text>
                    <Text style={[s.cardService, { color: dynSub }]} numberOfLines={1}>{item.produit}</Text>
                    <Text style={[s.cardPays, { color: dynSub }]}>{item.pays}</Text>
                  </View>
                  <View style={[s.statusPill, { backgroundColor: isPaidTab ? "#22C55E18" : ACCENT + "18" }]}>
                    <Ionicons name={isPaidTab ? "checkmark-circle" : "time-outline"} size={11} color={isPaidTab ? "#22C55E" : ACCENT} />
                    <Text style={[s.statusText, { color: isPaidTab ? "#22C55E" : ACCENT }]}>
                      {isPaidTab ? "Payé" : "En attente"}
                    </Text>
                  </View>
                </View>

                <View style={[s.amountRow, { borderTopColor: dynBorder }]}>
                  <Text style={[s.amountLabel, { color: dynSub }]}>{item.date}</Text>
                  <Text style={[s.amountValue, { color: dynText }]}>{item.montant.toLocaleString("fr-FR")} FCFA</Text>
                </View>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root:   { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingBottom: 12, gap: 10, borderBottomWidth: 1 },
  backBtn:      { padding: 4 },
  headerCenter: { flex: 1, flexDirection: "row", alignItems: "center", gap: 10 },
  headerIcon:   { width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  headerTitle:  { fontFamily: "Poppins_700Bold", fontSize: 17 },
  headerSub:    { fontFamily: "Poppins_400Regular", fontSize: 11, marginTop: -2 },

  tabsWrap: { flexDirection: "row", gap: 10, padding: 12, borderBottomWidth: 1 },
  tabBtn:   { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, borderRadius: 14, borderWidth: 1.5, borderColor: "transparent", paddingVertical: 11 },
  tabBtnActive: {},
  tabBtnText: { fontFamily: "Poppins_700Bold", fontSize: 14 },
  tabBadge:   { borderRadius: 10, minWidth: 20, height: 20, alignItems: "center", justifyContent: "center", paddingHorizontal: 6 },
  tabBadgeText:{ fontFamily: "Poppins_700Bold", fontSize: 11 },

  totalBanner: { paddingHorizontal: 16, paddingVertical: 10, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomWidth: 1 },
  totalLabel:  { fontFamily: "Poppins_400Regular", fontSize: 12 },
  totalValue:  { fontFamily: "Poppins_700Bold", fontSize: 17 },

  empty:     { flex: 1, alignItems: "center", justifyContent: "center", gap: 10 },
  emptyText: { fontFamily: "Poppins_400Regular", fontSize: 14 },

  card:      { flexDirection: "row", borderRadius: 14, borderWidth: 1, overflow: "hidden" },
  cardStripe:{ width: 4 },
  cardInner: { flex: 1, padding: 12, gap: 0 },
  cardRow:   { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
  avatar:    { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center" },
  avatarText:{ fontFamily: "Poppins_700Bold", fontSize: 14 },
  cardName:  { fontFamily: "Poppins_700Bold", fontSize: 14 },
  cardService:{ fontFamily: "Poppins_400Regular", fontSize: 12 },
  cardPays:  { fontFamily: "Poppins_400Regular", fontSize: 11, marginTop: 1 },
  statusPill:{ flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  statusText:{ fontFamily: "Poppins_600SemiBold", fontSize: 10 },
  amountRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderTopWidth: 1, paddingTop: 10 },
  amountLabel:{ fontFamily: "Poppins_400Regular", fontSize: 12 },
  amountValue:{ fontFamily: "Poppins_700Bold", fontSize: 15 },
});
