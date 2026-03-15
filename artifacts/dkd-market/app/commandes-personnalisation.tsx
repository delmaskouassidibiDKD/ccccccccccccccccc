import React, { useState } from "react";
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Modal, KeyboardAvoidingView, Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/contexts/ThemeContext";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ORDERS } from "@/lib/orders-data";

const ACCENT        = "#06B6D4";
const DM_EXTRA_KEY  = "@dkd:gros_dm_extra_convs";
const REGLEE_STATUSES = ["confirmee", "livraison", "livree"];

const TABS = [
  { key: "en_attente", label: "Commandes en attente" },
  { key: "reglee",     label: "Commandes réglées" },
] as const;
type Tab = typeof TABS[number]["key"];

export default function CommandesPersonnalisationPage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();

  const dynBG     = isDark ? "#0D1117" : "#F0F4FA";
  const dynCARD   = isDark ? "#161B25" : "#FFFFFF";
  const dynText   = isDark ? "#F0F6FF" : "#1A1A1A";
  const dynSub    = isDark ? "#64748B" : "#6B7280";
  const dynBorder = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.08)";
  const dynHeader = isDark ? "#111827" : "#FFFFFF";
  const dynSheet  = isDark ? "#1E293B" : "#FFFFFF";

  const [tab,           setTab]           = useState<Tab>("en_attente");
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

  const toggleProcessing = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setProcessingIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  const [search,       setSearch]       = useState("");
  const [invoiceModal, setInvoiceModal] = useState(false);
  const [invoiceId,    setInvoiceId]    = useState<string | null>(null);
  const [invoicePrice, setInvoicePrice] = useState("");
  const [appliedPrices, setAppliedPrices] = useState<Record<string, string>>({});

  const filtered = ORDERS.filter((o) => {
    const matchTab = tab === "en_attente"
      ? o.status === "en_attente"
      : REGLEE_STATUSES.includes(o.status);
    const matchSearch = !search || o.name.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  const pendingCount = ORDERS.filter((o) => o.status === "en_attente").length;

  const statusConfig = (status: string) => {
    switch (status) {
      case "en_attente": return { label: "En attente",   color: "#F59E0B", bg: "#F59E0B18" };
      case "confirmee":  return { label: "Confirmée",    color: "#22C55E", bg: "#22C55E18" };
      case "livraison":  return { label: "En livraison", color: "#3B82F6", bg: "#3B82F618" };
      case "livree":     return { label: "Livrée",       color: ACCENT,    bg: ACCENT + "18" };
      default:           return { label: status,         color: "#6B7280", bg: "#6B728018" };
    }
  };

  const openChat = async (item: typeof ORDERS[0]) => {
    Haptics.selectionAsync();
    const dmId = `perso_${item.id}`;
    try {
      const raw = await AsyncStorage.getItem(DM_EXTRA_KEY);
      const existing: any[] = raw ? JSON.parse(raw) : [];
      if (!existing.some((c) => c.id === dmId)) {
        await AsyncStorage.setItem(DM_EXTRA_KEY, JSON.stringify([...existing, {
          id: dmId, name: item.name, initials: item.initials, color: item.color,
          preview: "Demande de personnalisation", time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
          unread: 0, online: true,
        }]));
      }
    } catch {}
    router.push(`/dm-personnalisation?id=${encodeURIComponent(dmId)}&name=${encodeURIComponent(item.name)}&initials=${encodeURIComponent(item.initials)}&color=${encodeURIComponent(item.color)}` as any);
  };

  const openInvoice = (id: string) => {
    Haptics.selectionAsync();
    setInvoiceId(id);
    setInvoicePrice(appliedPrices[id] ?? "");
    setInvoiceModal(true);
  };

  const confirmInvoice = () => {
    const price = invoicePrice.trim();
    if (!price || !invoiceId) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setAppliedPrices((prev) => ({ ...prev, [invoiceId]: price }));
    setInvoiceModal(false);
    setInvoiceId(null);
    setInvoicePrice("");
  };

  return (
    <View style={[s.root, { backgroundColor: dynBG }]}>

      {/* HEADER */}
      <View style={[s.header, { paddingTop: insets.top + 10, backgroundColor: dynHeader, borderBottomColor: dynBorder }]}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color={dynText} />
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <Text style={[s.headerTitle, { color: dynText }]}>Mes commandes</Text>
          {pendingCount > 0 && (
            <View style={[s.badge, { backgroundColor: ACCENT }]}>
              <Text style={s.badgeText}>{pendingCount}</Text>
            </View>
          )}
        </View>
      </View>

      {/* SEARCH */}
      <View style={[s.searchWrap, { backgroundColor: dynHeader, borderBottomColor: dynBorder }]}>
        <View style={[s.searchBar, { backgroundColor: isDark ? "#1E293B" : "#F0F4FA", borderColor: dynBorder }]}>
          <Ionicons name="search-outline" size={16} color={dynSub} />
          <TextInput
            style={[s.searchInput, { color: dynText }]}
            placeholder="Rechercher par nom..."
            placeholderTextColor={dynSub}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Ionicons name="close-circle" size={16} color={dynSub} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* TABS */}
      <View style={[s.tabsWrap, { backgroundColor: dynHeader, borderBottomColor: dynBorder }]}>
        {TABS.map((t) => {
          const active = tab === t.key;
          const count  = t.key === "en_attente"
            ? ORDERS.filter((o) => o.status === "en_attente").length
            : ORDERS.filter((o) => REGLEE_STATUSES.includes(o.status)).length;
          return (
            <TouchableOpacity
              key={t.key}
              style={[s.tab, active && [s.tabActive, { borderBottomColor: ACCENT }]]}
              onPress={() => { Haptics.selectionAsync(); setTab(t.key); }}
              activeOpacity={0.7}
            >
              <Text style={[s.tabText, { color: active ? ACCENT : dynSub }]} numberOfLines={1}>{t.label}</Text>
              {count > 0 && (
                <View style={[s.tabCount, { backgroundColor: active ? ACCENT : (isDark ? "#1E293B" : "#E5E7EB") }]}>
                  <Text style={[s.tabCountText, { color: active ? "#fff" : dynSub }]}>{count}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* LIST */}
      {filtered.length === 0 ? (
        <View style={s.empty}>
          <Ionicons name="receipt-outline" size={48} color={dynSub} />
          <Text style={[s.emptyText, { color: dynSub }]}>Aucune commande</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(o) => o.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 14, gap: 12, paddingBottom: insets.bottom + 20 }}
          renderItem={({ item }) => {
            const stCfg  = statusConfig(item.status);
            const applied = appliedPrices[item.id];
            const processing = processingIds.has(item.id);
            return (
              <View style={[s.card, { backgroundColor: dynCARD, borderColor: processing ? "#F59E0B44" : dynBorder }]}>

                {/* Client info */}
                <View style={s.cardRow}>
                  <View style={[s.avatar, { backgroundColor: item.color + "22" }]}>
                    <Text style={[s.avatarText, { color: item.color }]}>{item.initials}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={s.cardTop}>
                      <Text style={[s.cardName, { color: dynText }]} numberOfLines={1}>{item.name}</Text>
                      <View style={[s.statusPill, { backgroundColor: stCfg.bg }]}>
                        <Text style={[s.statusText, { color: stCfg.color }]}>{stCfg.label}</Text>
                      </View>
                    </View>
                    <Text style={[s.cardDate, { color: dynSub }]}>{item.date} · {item.time}</Text>
                  </View>
                </View>

                {/* Applied price badge */}
                {applied && (
                  <View style={[s.priceBadge, { backgroundColor: "#22C55E12", borderColor: "#22C55E33" }]}>
                    <Ionicons name="receipt-outline" size={14} color="#22C55E" />
                    <Text style={[s.priceBadgeLabel, { color: dynSub }]}>Facture appliquée :</Text>
                    <Text style={[s.priceBadgeAmt, { color: "#22C55E" }]}>
                      {Number(applied).toLocaleString("fr-FR")} FCFA
                    </Text>
                  </View>
                )}

                {/* Actions */}
                <View style={s.actionsRow}>
                  <TouchableOpacity
                    style={[s.btnSecondary, { borderColor: ACCENT }]}
                    onPress={() => {
                      Haptics.selectionAsync();
                      router.push(`/detail-commande-personnalisation?id=${item.id}` as any);
                    }}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="eye-outline" size={13} color={ACCENT} />
                    <Text style={[s.btnSecondaryText, { color: ACCENT }]}>Détails</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[s.btnSecondary, { borderColor: "#34D399" }]}
                    onPress={() => openChat(item)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="chatbubble-ellipses-outline" size={13} color="#34D399" />
                    <Text style={[s.btnSecondaryText, { color: "#34D399" }]}>Discuter</Text>
                  </TouchableOpacity>

                  {item.status === "en_attente" && (
                    <TouchableOpacity
                      style={[s.btnPrimary, { backgroundColor: applied ? "#22C55E" : ACCENT }]}
                      onPress={() => openInvoice(item.id)}
                      activeOpacity={0.85}
                    >
                      <Ionicons name="document-text-outline" size={13} color="#fff" />
                      <Text style={s.btnPrimaryText}>{applied ? "Modifier" : "Facturer"}</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* En cours de traitement */}
                <TouchableOpacity
                  style={[
                    s.processingToggle,
                    {
                      backgroundColor: processing ? "#F59E0B14" : (isDark ? "#1E293B" : "#F4F6FB"),
                      borderColor:     processing ? "#F59E0B55" : dynBorder,
                    },
                  ]}
                  onPress={() => toggleProcessing(item.id)}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={processing ? "sync-circle" : "sync-circle-outline"}
                    size={14}
                    color={processing ? "#F59E0B" : dynSub}
                  />
                  <Text style={[s.processingToggleText, { color: processing ? "#F59E0B" : dynSub }]}>
                    {processing ? "En cours de traitement" : "Marquer comme en cours de traitement"}
                  </Text>
                  {processing && (
                    <Ionicons name="checkmark-circle" size={14} color="#F59E0B" style={{ marginLeft: "auto" }} />
                  )}
                </TouchableOpacity>
              </View>
            );
          }}
        />
      )}

      {/* INVOICE MODAL */}
      <Modal visible={invoiceModal} animationType="slide" transparent onRequestClose={() => setInvoiceModal(false)}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <View style={s.modalOverlay}>
            <View style={[s.modalSheet, { backgroundColor: dynSheet }]}>
              <View style={[s.modalHeader, { borderBottomColor: dynBorder }]}>
                <View style={[s.modalIcon, { backgroundColor: ACCENT + "18" }]}>
                  <Ionicons name="document-text-outline" size={20} color={ACCENT} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.modalTitle, { color: dynText }]}>Appliquer la facture</Text>
                  <Text style={[s.modalSub, { color: dynSub }]}>Saisissez le montant du service</Text>
                </View>
                <TouchableOpacity onPress={() => setInvoiceModal(false)}>
                  <Ionicons name="close-circle" size={24} color={dynSub} />
                </TouchableOpacity>
              </View>

              <View style={{ padding: 16, gap: 14 }}>
                <Text style={[s.inputLabel, { color: dynSub }]}>Montant (FCFA)</Text>
                <View style={[s.invoiceInputWrap, { backgroundColor: isDark ? "#0D1117" : "#F0F4FA", borderColor: ACCENT + "55" }]}>
                  <Ionicons name="cash-outline" size={20} color={ACCENT} />
                  <TextInput
                    style={[s.invoiceInput, { color: dynText }]}
                    placeholder="Ex : 45 000"
                    placeholderTextColor={dynSub}
                    value={invoicePrice}
                    onChangeText={(t) => setInvoicePrice(t.replace(/[^0-9]/g, ""))}
                    keyboardType="numeric"
                    autoFocus
                  />
                  {invoicePrice.length > 0 && (
                    <Text style={[s.invoiceCurrency, { color: ACCENT }]}>FCFA</Text>
                  )}
                </View>

                {invoicePrice.length > 0 && (
                  <View style={[s.invoicePreview, { backgroundColor: ACCENT + "10", borderColor: ACCENT + "30" }]}>
                    <Ionicons name="checkmark-circle-outline" size={16} color={ACCENT} />
                    <Text style={[s.invoicePreviewText, { color: ACCENT }]}>
                      Montant : {Number(invoicePrice).toLocaleString("fr-FR")} FCFA
                    </Text>
                  </View>
                )}

                <TouchableOpacity
                  style={[s.confirmBtn, { backgroundColor: invoicePrice.trim() ? ACCENT : (isDark ? "#1E293B" : "#E2E8F0") }]}
                  onPress={confirmInvoice}
                  disabled={!invoicePrice.trim()}
                  activeOpacity={0.85}
                >
                  <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
                  <Text style={s.confirmBtnText}>Confirmer la facture</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  root:   { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingBottom: 12, gap: 10, borderBottomWidth: 1 },
  backBtn:      { padding: 4 },
  headerCenter: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8 },
  headerTitle:  { fontFamily: "Poppins_700Bold", fontSize: 18 },
  badge:        { borderRadius: 10, minWidth: 20, height: 20, alignItems: "center", justifyContent: "center", paddingHorizontal: 6 },
  badgeText:    { color: "#fff", fontFamily: "Poppins_700Bold", fontSize: 11 },

  searchWrap: { paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1 },
  searchBar:  { flexDirection: "row", alignItems: "center", borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 8, gap: 8 },
  searchInput:{ flex: 1, fontFamily: "Poppins_400Regular", fontSize: 13, padding: 0 },

  tabsWrap: { flexDirection: "row", borderBottomWidth: 1 },
  tab:      { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 12, gap: 5, paddingHorizontal: 4 },
  tabActive:{ borderBottomWidth: 2 },
  tabText:  { fontFamily: "Poppins_600SemiBold", fontSize: 12 },
  tabCount: { borderRadius: 10, minWidth: 18, height: 18, alignItems: "center", justifyContent: "center", paddingHorizontal: 5 },
  tabCountText: { fontFamily: "Poppins_700Bold", fontSize: 10 },

  empty:     { flex: 1, alignItems: "center", justifyContent: "center", gap: 10 },
  emptyText: { fontFamily: "Poppins_400Regular", fontSize: 14 },

  card:    { borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  cardRow: { flexDirection: "row", alignItems: "center", padding: 14, gap: 12 },
  avatar:  { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  avatarText: { fontFamily: "Poppins_700Bold", fontSize: 15 },
  cardTop: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 2 },
  cardName:{ fontFamily: "Poppins_700Bold", fontSize: 14, flex: 1 },
  cardDate:{ fontFamily: "Poppins_400Regular", fontSize: 11 },
  statusPill: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 },
  statusText: { fontFamily: "Poppins_600SemiBold", fontSize: 10 },

  priceBadge:     { flexDirection: "row", alignItems: "center", gap: 6, marginHorizontal: 14, marginBottom: 10, borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 8 },
  priceBadgeLabel:{ fontFamily: "Poppins_400Regular", fontSize: 12 },
  priceBadgeAmt:  { fontFamily: "Poppins_700Bold", fontSize: 13 },

  processingToggle:    { flexDirection: "row", alignItems: "center", gap: 8, marginHorizontal: 14, marginBottom: 12, borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 9 },
  processingToggleText:{ fontFamily: "Poppins_600SemiBold", fontSize: 12, flex: 1 },

  actionsRow:      { flexDirection: "row", gap: 8, paddingHorizontal: 14, paddingBottom: 10 },
  btnSecondary:    { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, borderRadius: 10, borderWidth: 1, paddingVertical: 9 },
  btnSecondaryText:{ fontFamily: "Poppins_600SemiBold", fontSize: 12 },
  btnPrimary:      { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, borderRadius: 10, paddingVertical: 9 },
  btnPrimaryText:  { fontFamily: "Poppins_700Bold", fontSize: 12, color: "#fff" },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalSheet:   { borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 32 },
  modalHeader:  { flexDirection: "row", alignItems: "center", gap: 12, padding: 16, borderBottomWidth: 1 },
  modalIcon:    { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  modalTitle:   { fontFamily: "Poppins_700Bold", fontSize: 16 },
  modalSub:     { fontFamily: "Poppins_400Regular", fontSize: 12, marginTop: -2 },

  inputLabel:      { fontFamily: "Poppins_600SemiBold", fontSize: 12 },
  invoiceInputWrap:{ flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 14, borderWidth: 2, paddingHorizontal: 14, paddingVertical: 12 },
  invoiceInput:    { flex: 1, fontFamily: "Poppins_700Bold", fontSize: 20, padding: 0 },
  invoiceCurrency: { fontFamily: "Poppins_600SemiBold", fontSize: 14 },
  invoicePreview:  { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 10, borderWidth: 1, padding: 10 },
  invoicePreviewText:{ fontFamily: "Poppins_600SemiBold", fontSize: 13 },

  confirmBtn:    { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 14, paddingVertical: 14 },
  confirmBtnText:{ fontFamily: "Poppins_700Bold", fontSize: 14, color: "#fff" },
});
