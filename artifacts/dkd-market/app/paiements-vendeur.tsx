import React, { useState } from "react";
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/contexts/ThemeContext";
import * as Haptics from "expo-haptics";

const ACCENT = "#FF6B00";

type Payment = {
  id: string;
  name: string;
  initials: string;
  color: string;
  service: string;
  amount: number;
  date: string;
  status: "attente" | "paye";
  mode: string;
};

const PAYMENTS: Payment[] = [
  { id: "v1", name: "Kofi Mensah",      initials: "KM", color: "#EC4899", service: "Commande pagnes wax 6 yards",      amount: 75000,  date: "19 mars 2026", status: "attente", mode: "Marché"         },
  { id: "v2", name: "Aïssatou Ba",      initials: "AB", color: "#A855F7", service: "Carton savon karité 100 pcs",       amount: 45000,  date: "18 mars 2026", status: "attente", mode: "Grossiste"      },
  { id: "v3", name: "Ibrahim Traoré",   initials: "IT", color: "#F59E0B", service: "Plat traiteur séminaire (20 pers.)",amount: 120000, date: "17 mars 2026", status: "attente", mode: "Gastronomie"    },
  { id: "v4", name: "Mariam Coulibaly", initials: "MC", color: "#22C55E", service: "Chaussures cuir homme x3",          amount: 55500,  date: "16 mars 2026", status: "attente", mode: "Marché"         },
  { id: "v5", name: "Mamadou Diallo",   initials: "MD", color: "#3B82F6", service: "Palette huile de palme 24 bidons", amount: 72000,  date: "14 mars 2026", status: "paye",    mode: "Grossiste"      },
  { id: "v6", name: "Fatou Sow",        initials: "FS", color: "#EF4444", service: "Livraison repas semaine 11",        amount: 38000,  date: "13 mars 2026", status: "paye",    mode: "Gastronomie"    },
  { id: "v7", name: "Oumar Keita",      initials: "OK", color: "#10B981", service: "Pagne wax java — commande pro",     amount: 25000,  date: "10 mars 2026", status: "paye",    mode: "Marché"         },
];

type Tab = "attente" | "paye";

export default function PaiementsVendeurPage() {
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

  const totalAttente = attente.reduce((acc, p) => acc + p.amount, 0);
  const totalPaye    = payes.reduce((acc, p) => acc + p.amount, 0);

  const displayed = tab === "attente" ? attente : payes;
  const isPaidTab = tab === "paye";

  return (
    <View style={[s.root, { backgroundColor: dynBG }]}>

      {/* HEADER */}
      <View style={[s.header, { paddingTop: insets.top + 10, backgroundColor: dynHeader, borderBottomColor: dynBorder }]}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color={dynText} />
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <View style={[s.headerIconBox, { backgroundColor: ACCENT + "20" }]}>
            <Ionicons name="cash-outline" size={16} color={ACCENT} />
          </View>
          <View>
            <Text style={[s.headerTitle, { color: dynText }]}>Paiements en cours</Text>
            <Text style={[s.headerSub, { color: dynSub }]}>Tous mes modes</Text>
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
          {isPaidTab ? "Total encaissé" : "Total en attente"}
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
            {isPaidTab ? "Aucun paiement reçu" : "Aucun paiement en attente"}
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
                    <Text style={[s.cardName, { color: dynText }]}>{item.name}</Text>
                    <Text style={[s.cardService, { color: dynSub }]} numberOfLines={1}>{item.service}</Text>
                  </View>
                  <View style={[s.statusPill, { backgroundColor: isPaidTab ? "#22C55E18" : ACCENT + "18" }]}>
                    <Ionicons name={isPaidTab ? "checkmark-circle" : "time-outline"} size={11} color={isPaidTab ? "#22C55E" : ACCENT} />
                    <Text style={[s.statusText, { color: isPaidTab ? "#22C55E" : ACCENT }]}>
                      {isPaidTab ? "Payé" : "En cours"}
                    </Text>
                  </View>
                </View>

                <View style={[s.amountRow, { borderTopColor: dynBorder }]}>
                  <View style={s.modeRow}>
                    <View style={[s.modeBadge, { backgroundColor: ACCENT + "14" }]}>
                      <Text style={[s.modeText, { color: ACCENT }]}>{item.mode}</Text>
                    </View>
                    <Text style={[s.amountLabel, { color: dynSub }]}>{item.date}</Text>
                  </View>
                  <Text style={[s.amountValue, { color: dynText }]}>{item.amount.toLocaleString("fr-FR")} FCFA</Text>
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
  headerIconBox:{ width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center" },
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
  cardInner: { flex: 1, padding: 12 },
  cardRow:   { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
  avatar:    { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center" },
  avatarText:{ fontFamily: "Poppins_700Bold", fontSize: 14 },
  cardName:  { fontFamily: "Poppins_700Bold", fontSize: 14 },
  cardService:{ fontFamily: "Poppins_400Regular", fontSize: 12 },
  statusPill:{ flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  statusText:{ fontFamily: "Poppins_600SemiBold", fontSize: 10 },
  amountRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderTopWidth: 1, paddingTop: 10 },
  modeRow:   { flexDirection: "column", gap: 2 },
  modeBadge: { borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2, alignSelf: "flex-start" },
  modeText:  { fontFamily: "Poppins_600SemiBold", fontSize: 10 },
  amountLabel:{ fontFamily: "Poppins_400Regular", fontSize: 11 },
  amountValue:{ fontFamily: "Poppins_700Bold", fontSize: 15 },
});
