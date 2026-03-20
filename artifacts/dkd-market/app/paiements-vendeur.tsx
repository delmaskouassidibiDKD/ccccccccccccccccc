import React, { useState } from "react";
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, ScrollView, Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/contexts/ThemeContext";
import * as Haptics from "expo-haptics";

const ACCENT = "#FF6B00";

type Product = {
  name: string;
  qty: number;
  unitPrice: number;
};

type Payment = {
  id: string;
  clientName: string;
  amount: number;
  date: string;
  status: "attente" | "paye";
  mode: string;
  orderRef: string;
  products: Product[];
};

const PAYMENTS: Payment[] = [
  {
    id: "v1", clientName: "Kofi Mensah", amount: 75000, date: "19 mars 2026", status: "attente", mode: "Marché", orderRef: "CMD-2026-0311",
    products: [
      { name: "Pagne Wax Java 6 yards", qty: 2, unitPrice: 12500 },
      { name: "Pagne bazin riche", qty: 3, unitPrice: 16667 },
    ],
  },
  {
    id: "v2", clientName: "Aïssatou Ba", amount: 45000, date: "18 mars 2026", status: "attente", mode: "Grossiste", orderRef: "CMD-2026-0298",
    products: [
      { name: "Carton savon karité 100 pcs", qty: 1, unitPrice: 45000 },
    ],
  },
  {
    id: "v3", clientName: "Ibrahim Traoré", amount: 120000, date: "17 mars 2026", status: "attente", mode: "Gastronomie", orderRef: "CMD-2026-0287",
    products: [
      { name: "Menu traiteur séminaire", qty: 20, unitPrice: 5000 },
      { name: "Boissons & desserts", qty: 20, unitPrice: 1000 },
    ],
  },
  {
    id: "v4", clientName: "Mariam Coulibaly", amount: 55500, date: "16 mars 2026", status: "attente", mode: "Marché", orderRef: "CMD-2026-0274",
    products: [
      { name: "Chaussures cuir homme", qty: 3, unitPrice: 18500 },
    ],
  },
  {
    id: "v5", clientName: "Mamadou Diallo", amount: 72000, date: "14 mars 2026", status: "paye", mode: "Grossiste", orderRef: "CMD-2026-0261",
    products: [
      { name: "Palette huile de palme", qty: 24, unitPrice: 3000 },
    ],
  },
  {
    id: "v6", clientName: "Fatou Sow", amount: 38000, date: "13 mars 2026", status: "paye", mode: "Gastronomie", orderRef: "CMD-2026-0249",
    products: [
      { name: "Repas semaine 11 — midi", qty: 5, unitPrice: 4500 },
      { name: "Repas semaine 11 — soir", qty: 5, unitPrice: 3100 },
    ],
  },
  {
    id: "v7", clientName: "Oumar Keita", amount: 25000, date: "10 mars 2026", status: "paye", mode: "Marché", orderRef: "CMD-2026-0231",
    products: [
      { name: "Pagne wax java commande pro", qty: 2, unitPrice: 12500 },
    ],
  },
];

type Tab = "attente" | "paye";

/* ── Logo DKD-MARKET inline ─────────────────────────────────── */
function DkdLogo({ size = 36 }: { size?: number }) {
  return (
    <View style={[logo.wrap, { width: size, height: size, borderRadius: size / 4 }]}>
      <Ionicons name="storefront" size={size * 0.5} color="#fff" />
    </View>
  );
}
const logo = StyleSheet.create({
  wrap: { backgroundColor: ACCENT, alignItems: "center", justifyContent: "center" },
});

/* ── Modal détails produits ─────────────────────────────────── */
function DetailsModal({
  payment, visible, onClose, isDark,
}: {
  payment: Payment | null;
  visible: boolean;
  onClose: () => void;
  isDark: boolean;
}) {
  const dynBG    = isDark ? "#0D1117" : "#F4F6FA";
  const dynCARD  = isDark ? "#161B25" : "#FFFFFF";
  const dynText  = isDark ? "#F0F6FF" : "#1A1A1A";
  const dynSub   = isDark ? "#64748B" : "#6B7280";
  const dynBorder= isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.08)";

  if (!payment) return null;
  const total = payment.products.reduce((s, p) => s + p.qty * p.unitPrice, 0);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={md.overlay} onPress={onClose} />
      <View style={[md.sheet, { backgroundColor: dynCARD }]}>

        {/* Handle */}
        <View style={md.handle} />

        {/* Header */}
        <View style={[md.header, { borderBottomColor: dynBorder }]}>
          <View>
            <Text style={[md.title, { color: dynText }]}>Détails de la commande</Text>
            <Text style={[md.ref,   { color: ACCENT }]}>{payment.orderRef}</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={md.closeBtn}>
            <Ionicons name="close" size={20} color={dynSub} />
          </TouchableOpacity>
        </View>

        {/* Source DKD-MARKET */}
        <View style={[md.sourceRow, { backgroundColor: isDark ? "#1A1F2E" : "#FFF4EC", borderColor: ACCENT + "30" }]}>
          <DkdLogo size={30} />
          <View>
            <Text style={[md.sourceName, { color: ACCENT }]}>DKD-MARKET</Text>
            <Text style={[md.sourceDesc, { color: dynSub }]}>Paiement effectué via la plateforme</Text>
          </View>
        </View>

        {/* Liste produits */}
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          <Text style={[md.sectionLabel, { color: dynSub }]}>Produits commandés</Text>
          {payment.products.map((prod, i) => (
            <View
              key={i}
              style={[md.productRow, { borderBottomColor: dynBorder, backgroundColor: dynBG }]}
            >
              <View style={[md.productIcon, { backgroundColor: ACCENT + "18" }]}>
                <Ionicons name="cube-outline" size={16} color={ACCENT} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[md.productName, { color: dynText }]} numberOfLines={2}>{prod.name}</Text>
                <Text style={[md.productQty,  { color: dynSub }]}>Qté : {prod.qty}</Text>
              </View>
              <Text style={[md.productPrice, { color: dynText }]}>
                {(prod.qty * prod.unitPrice).toLocaleString("fr-FR")} FCFA
              </Text>
            </View>
          ))}

          {/* Total */}
          <View style={[md.totalRow, { borderTopColor: dynBorder }]}>
            <Text style={[md.totalLabel, { color: dynSub }]}>Total versé</Text>
            <Text style={[md.totalValue, { color: ACCENT }]}>{total.toLocaleString("fr-FR")} FCFA</Text>
          </View>

          {/* Date */}
          <View style={[md.dateRow, { borderTopColor: dynBorder }]}>
            <Ionicons name="calendar-outline" size={14} color={dynSub} />
            <Text style={[md.dateText, { color: dynSub }]}>{payment.date} · Mode {payment.mode}</Text>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const md = StyleSheet.create({
  overlay:     { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.55)" },
  sheet:       { position: "absolute", bottom: 0, left: 0, right: 0, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: "80%", paddingBottom: 30 },
  handle:      { width: 40, height: 4, borderRadius: 2, backgroundColor: "#555", alignSelf: "center", marginTop: 10, marginBottom: 4 },
  header:      { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 18, paddingVertical: 14, borderBottomWidth: 1 },
  title:       { fontFamily: "Poppins_700Bold", fontSize: 16 },
  ref:         { fontFamily: "Poppins_600SemiBold", fontSize: 11, marginTop: 1 },
  closeBtn:    { padding: 4 },
  sourceRow:   { flexDirection: "row", alignItems: "center", gap: 12, marginHorizontal: 16, marginVertical: 12, borderRadius: 12, padding: 12, borderWidth: 1 },
  sourceName:  { fontFamily: "Poppins_700Bold", fontSize: 13 },
  sourceDesc:  { fontFamily: "Poppins_400Regular", fontSize: 11 },
  sectionLabel:{ fontFamily: "Poppins_600SemiBold", fontSize: 12, paddingHorizontal: 16, marginTop: 4, marginBottom: 6 },
  productRow:  { flexDirection: "row", alignItems: "center", gap: 10, marginHorizontal: 16, marginBottom: 8, borderRadius: 12, padding: 12, borderBottomWidth: 0 },
  productIcon: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  productName: { fontFamily: "Poppins_600SemiBold", fontSize: 13 },
  productQty:  { fontFamily: "Poppins_400Regular", fontSize: 11, marginTop: 2 },
  productPrice:{ fontFamily: "Poppins_700Bold", fontSize: 13 },
  totalRow:    { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginHorizontal: 16, paddingTop: 12, marginTop: 4, borderTopWidth: 1 },
  totalLabel:  { fontFamily: "Poppins_400Regular", fontSize: 13 },
  totalValue:  { fontFamily: "Poppins_700Bold", fontSize: 18 },
  dateRow:     { flexDirection: "row", alignItems: "center", gap: 6, marginHorizontal: 16, paddingTop: 10, marginTop: 8, borderTopWidth: 1, marginBottom: 10 },
  dateText:    { fontFamily: "Poppins_400Regular", fontSize: 12 },
});

/* ── Page principale ─────────────────────────────────────────── */
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

  const [tab,            setTab]           = useState<Tab>("attente");
  const [detailPayment,  setDetailPayment] = useState<Payment | null>(null);
  const [detailVisible,  setDetailVisible] = useState(false);

  const attente = PAYMENTS.filter((p) => p.status === "attente");
  const payes   = PAYMENTS.filter((p) => p.status === "paye");

  const totalAttente = attente.reduce((acc, p) => acc + p.amount, 0);
  const totalPaye    = payes.reduce((acc, p) => acc + p.amount, 0);

  const displayed = tab === "attente" ? attente : payes;
  const isPaidTab = tab === "paye";

  function openDetail(payment: Payment) {
    Haptics.selectionAsync();
    setDetailPayment(payment);
    setDetailVisible(true);
  }

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

                {/* Ligne principale : logo DKD + infos + statut */}
                <View style={s.cardRow}>
                  <DkdLogo size={42} />
                  <View style={{ flex: 1 }}>
                    <Text style={[s.cardName, { color: dynText }]}>DKD-MARKET</Text>
                    <Text style={[s.cardClient, { color: dynSub }]} numberOfLines={1}>{item.clientName}</Text>
                  </View>
                  <View style={[s.statusPill, { backgroundColor: isPaidTab ? "#22C55E18" : ACCENT + "18" }]}>
                    <Ionicons name={isPaidTab ? "checkmark-circle" : "time-outline"} size={11} color={isPaidTab ? "#22C55E" : ACCENT} />
                    <Text style={[s.statusText, { color: isPaidTab ? "#22C55E" : ACCENT }]}>
                      {isPaidTab ? "Payé" : "En cours"}
                    </Text>
                  </View>
                </View>

                {/* Ligne bas : mode + date + montant + bouton détails */}
                <View style={[s.amountRow, { borderTopColor: dynBorder }]}>
                  <View style={s.modeRow}>
                    <View style={[s.modeBadge, { backgroundColor: ACCENT + "14" }]}>
                      <Text style={[s.modeText, { color: ACCENT }]}>{item.mode}</Text>
                    </View>
                    <Text style={[s.amountLabel, { color: dynSub }]}>{item.date}</Text>
                  </View>
                  <View style={s.rightCol}>
                    <Text style={[s.amountValue, { color: dynText }]}>{item.amount.toLocaleString("fr-FR")} FCFA</Text>
                    <TouchableOpacity
                      style={[s.detailBtn, { backgroundColor: ACCENT + "15", borderColor: ACCENT + "40" }]}
                      onPress={() => openDetail(item)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="list-outline" size={12} color={ACCENT} />
                      <Text style={[s.detailBtnText, { color: ACCENT }]}>Détails</Text>
                    </TouchableOpacity>
                  </View>
                </View>

              </View>
            </View>
          )}
        />
      )}

      {/* Modal détails */}
      <DetailsModal
        payment={detailPayment}
        visible={detailVisible}
        onClose={() => setDetailVisible(false)}
        isDark={isDark}
      />
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
  tabBtnText:  { fontFamily: "Poppins_700Bold", fontSize: 14 },
  tabBadge:    { borderRadius: 10, minWidth: 20, height: 20, alignItems: "center", justifyContent: "center", paddingHorizontal: 6 },
  tabBadgeText:{ fontFamily: "Poppins_700Bold", fontSize: 11 },

  totalBanner: { paddingHorizontal: 16, paddingVertical: 10, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomWidth: 1 },
  totalLabel:  { fontFamily: "Poppins_400Regular", fontSize: 12 },
  totalValue:  { fontFamily: "Poppins_700Bold", fontSize: 17 },

  empty:     { flex: 1, alignItems: "center", justifyContent: "center", gap: 10 },
  emptyText: { fontFamily: "Poppins_400Regular", fontSize: 14 },

  card:       { flexDirection: "row", borderRadius: 14, borderWidth: 1, overflow: "hidden" },
  cardStripe: { width: 4 },
  cardInner:  { flex: 1, padding: 12 },
  cardRow:    { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
  cardName:   { fontFamily: "Poppins_700Bold", fontSize: 14 },
  cardClient: { fontFamily: "Poppins_400Regular", fontSize: 12, marginTop: 1 },
  cardService:{ fontFamily: "Poppins_400Regular", fontSize: 12 },
  statusPill: { flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  statusText: { fontFamily: "Poppins_600SemiBold", fontSize: 10 },

  amountRow:  { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderTopWidth: 1, paddingTop: 10 },
  modeRow:    { flexDirection: "column", gap: 2 },
  modeBadge:  { borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2, alignSelf: "flex-start" },
  modeText:   { fontFamily: "Poppins_600SemiBold", fontSize: 10 },
  amountLabel:{ fontFamily: "Poppins_400Regular", fontSize: 11 },

  rightCol:   { alignItems: "flex-end", gap: 6 },
  amountValue:{ fontFamily: "Poppins_700Bold", fontSize: 15 },
  detailBtn:  { flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1 },
  detailBtnText: { fontFamily: "Poppins_600SemiBold", fontSize: 11 },
});
