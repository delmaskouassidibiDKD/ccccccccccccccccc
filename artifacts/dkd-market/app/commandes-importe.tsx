import React, { useState } from "react";
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/contexts/ThemeContext";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ORDERS } from "@/lib/orders-data";
import CommandeDetailModal, { SOURCE_CONFIG, type ProductSlide } from "@/components/CommandeDetailModal";
import DevisBuilderModal from "@/components/DevisBuilderModal";
import type { Order } from "@/lib/orders-data";

const TABS = [
  { key: "toutes",     label: "Toutes"     },
  { key: "en_attente", label: "En attente" },
  { key: "confirmee",  label: "Confirmées" },
] as const;

type Tab = typeof TABS[number]["key"];

const DM_EXTRA_KEY = "@dkd:dm_extra_convs";

function orderToSlides(order: Order): ProductSlide[] {
  return order.items.map((item) => ({
    id: item.id,
    name: item.name,
    price: `${item.unitPrice.toLocaleString("fr-FR")} FCFA`,
    qty: item.qty,
    unit: item.unit,
    isGros: item.isGros,
    details: item.details,
  }));
}

export default function CommandesImportePage() {
  const router  = useRouter();
  const insets  = useSafeAreaInsets();
  const { isDark } = useTheme();

  const dynBG     = isDark ? "#0D1117" : "#F0F4FA";
  const dynCARD   = isDark ? "#161B25" : "#FFFFFF";
  const dynText   = isDark ? "#F0F6FF" : "#1A1A1A";
  const dynSub    = isDark ? "#64748B" : "#6B7280";
  const dynBorder = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.08)";
  const dynHeader = isDark ? "#111827" : "#FFFFFF";
  const ACCENT    = "#3B82F6";

  const [tab,            setTab]            = useState<Tab>("toutes");
  const [search,         setSearch]         = useState("");
  const [processingIds,  setProcessingIds]  = useState<Set<string>>(new Set());
  const [cancelledIds,   setCancelledIds]   = useState<Set<string>>(new Set());

  const [detailOpen,     setDetailOpen]     = useState(false);
  const [detailOrder,    setDetailOrder]    = useState<Order | null>(null);

  const [devisOpen,      setDevisOpen]      = useState(false);
  const [devisOrder,     setDevisOrder]     = useState<Order | null>(null);
  const [devisedIds,     setDevisedIds]     = useState<Set<string>>(new Set());

  const activeOrders = ORDERS.filter((o) => !cancelledIds.has(o.id));

  const filtered = activeOrders.filter((o) => {
    const matchTab    = tab === "toutes" || o.status === tab;
    const matchSearch = !search || o.name.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  const pendingCount = activeOrders.filter((o) => o.status === "en_attente").length;
  const orderTotal   = (o: Order) => o.items.reduce((acc, i) => acc + i.total, 0);

  const toggleProcessing = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setProcessingIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const openDetail = (order: Order) => {
    Haptics.selectionAsync();
    setDetailOrder(order);
    setDetailOpen(true);
  };

  const cancelOrder = (id: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    setCancelledIds((prev) => new Set([...prev, id]));
  };

  const openDevisBuilder = (order: Order) => {
    Haptics.selectionAsync();
    setDevisOrder(order);
    setDevisOpen(true);
  };

  const openChat = async (item: Order) => {
    Haptics.selectionAsync();
    const dmId = `order_${item.id}`;
    try {
      const raw = await AsyncStorage.getItem(DM_EXTRA_KEY);
      const existing: any[] = raw ? JSON.parse(raw) : [];
      const alreadyExists = existing.some((c) => c.id === dmId);
      if (!alreadyExists) {
        const newConv = {
          id: dmId, name: item.name, initials: item.initials, color: item.color,
          preview: "Conversation liée à une commande",
          time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
          unread: 0, online: false,
        };
        await AsyncStorage.setItem(DM_EXTRA_KEY, JSON.stringify([...existing, newConv]));
      }
    } catch {}
    router.push(`/dm-importe?id=${encodeURIComponent(dmId)}&name=${encodeURIComponent(item.name)}&initials=${encodeURIComponent(item.initials)}&color=${encodeURIComponent(item.color)}` as any);
  };


  return (
    <View style={[s.root, { backgroundColor: dynBG }]}>

      <View style={[s.header, { paddingTop: insets.top + 10, backgroundColor: dynHeader, borderBottomColor: dynBorder }]}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color={dynText} />
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <Text style={[s.headerTitle, { color: dynText }]}>Mes commandes</Text>
          {pendingCount > 0 && (
            <View style={[s.badge, { backgroundColor: "#F59E0B" }]}>
              <Text style={s.badgeText}>{pendingCount}</Text>
            </View>
          )}
        </View>
        <TouchableOpacity style={[s.filterBtn, { backgroundColor: ACCENT + "18" }]} activeOpacity={0.7}>
          <Ionicons name="filter-outline" size={18} color={ACCENT} />
        </TouchableOpacity>
      </View>

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

      <View style={[s.tabsWrap, { backgroundColor: dynHeader, borderBottomColor: dynBorder }]}>
        {TABS.map((t) => {
          const active = tab === t.key;
          const count  = t.key === "toutes" ? activeOrders.length : activeOrders.filter((o) => o.status === t.key).length;
          return (
            <TouchableOpacity
              key={t.key}
              style={[s.tab, active && [s.tabActive, { borderBottomColor: ACCENT }]]}
              onPress={() => { Haptics.selectionAsync(); setTab(t.key); }}
              activeOpacity={0.7}
            >
              <Text style={[s.tabText, { color: active ? ACCENT : dynSub }]}>{t.label}</Text>
              {count > 0 && (
                <View style={[s.tabCount, { backgroundColor: active ? ACCENT : (isDark ? "#1E293B" : "#E5E7EB") }]}>
                  <Text style={[s.tabCountText, { color: active ? "#fff" : dynSub }]}>{count}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {filtered.length === 0 ? (
        <View style={s.empty}>
          <Ionicons name="receipt-outline" size={48} color={dynSub} />
          <Text style={[s.emptyText, { color: dynSub }]}>Aucune commande trouvée</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(o) => o.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
          renderItem={({ item }) => {
            const total      = orderTotal(item);
            const processing = processingIds.has(item.id);
            const src        = item.source ? SOURCE_CONFIG[item.source] : null;
            const isConfirmed = item.status === "confirmee";
            const hasGros    = item.items.some((i) => i.isGros);
            return (
              <View style={[s.card, { backgroundColor: dynCARD, borderColor: processing ? "#F59E0B44" : dynBorder }]}>

                {(src || hasGros) && (
                  <View style={s.badgesRow}>
                    {src && (
                      <View style={[s.sourceBadge, { backgroundColor: src.color + "16", borderColor: src.color + "35" }]}>
                        <Ionicons name={src.icon as any} size={11} color={src.color} />
                        <Text style={[s.sourceBadgeText, { color: src.color }]}>{src.label}</Text>
                      </View>
                    )}
                    {hasGros && (
                      <View style={[s.sourceBadge, { backgroundColor: "#EF444416", borderColor: "#EF444435" }]}>
                        <Ionicons name="people-outline" size={11} color="#EF4444" />
                        <Text style={[s.sourceBadgeText, { color: "#EF4444" }]}>Achats groupés</Text>
                      </View>
                    )}
                  </View>
                )}

                <View style={s.cardRow}>
                  <View style={[s.avatar, { backgroundColor: item.color + "22" }]}>
                    <Text style={[s.avatarText, { color: item.color }]}>{item.initials}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={s.cardTop}>
                      <Text style={[s.cardName, { color: dynText }]} numberOfLines={1}>{item.name}</Text>
                      <Text style={[s.cardTime, { color: dynSub }]}>{item.time}</Text>
                    </View>
                    <Text style={[s.cardDate, { color: dynSub }]}>
                      {item.date} · {item.items.length} article{item.items.length > 1 ? "s" : ""}
                    </Text>
                  </View>
                </View>

                <View style={[s.totalRow, { borderColor: dynBorder }]}>
                  <Text style={[s.totalLabel, { color: dynSub }]}>Total commande</Text>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    {processing && (
                      <View style={[s.processingBadge, { backgroundColor: "#F59E0B18", borderColor: "#F59E0B44" }]}>
                        <View style={s.processingDot} />
                        <Text style={[s.processingBadgeText, { color: "#F59E0B" }]}>En cours</Text>
                      </View>
                    )}
                    <Text style={[s.totalAmt, { color: dynText }]}>{total.toLocaleString("fr-FR")} FCFA</Text>
                  </View>
                </View>

                <View style={s.actionsRow}>
                  <TouchableOpacity
                    style={[s.btnArticles, { borderColor: ACCENT }]}
                    onPress={() => openDetail(item)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="eye-outline" size={13} color={ACCENT} />
                    <Text style={[s.btnArticlesText, { color: ACCENT }]}>Voir les articles</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[s.btnChat, { borderColor: "#34D399" }]}
                    onPress={() => openChat(item)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="chatbubble-ellipses-outline" size={13} color="#34D399" />
                    <Text style={[s.btnChatText, { color: "#34D399" }]}>Discuter</Text>
                  </TouchableOpacity>

                  {(() => {
                    const done = devisedIds.has(item.id);
                    return (
                      <TouchableOpacity
                        style={done
                          ? [s.btnDevis, { backgroundColor: ACCENT }]
                          : [s.btnDevis, { backgroundColor: "transparent", borderWidth: 1.5, borderColor: ACCENT }]
                        }
                        onPress={() => openDevisBuilder(item)}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="document-text-outline" size={13} color={done ? "#fff" : ACCENT} />
                        <Text style={[s.btnDevisText, { color: done ? "#fff" : ACCENT }]}>Devis</Text>
                      </TouchableOpacity>
                    );
                  })()}
                </View>

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
                  <Ionicons name={processing ? "sync-circle" : "sync-circle-outline"} size={14} color={processing ? "#F59E0B" : dynSub} />
                  <Text style={[s.processingToggleText, { color: processing ? "#F59E0B" : dynSub }]}>
                    {processing ? "En cours de traitement" : "Marquer comme en cours de traitement"}
                  </Text>
                  {processing && <Ionicons name="checkmark-circle" size={14} color="#F59E0B" style={{ marginLeft: "auto" }} />}
                </TouchableOpacity>
              </View>
            );
          }}
        />
      )}

      {detailOrder && (
        <CommandeDetailModal
          visible={detailOpen}
          onClose={() => { setDetailOpen(false); setDetailOrder(null); }}
          products={orderToSlides(detailOrder)}
          isConfirmed={detailOrder.status === "confirmee" && !cancelledIds.has(detailOrder.id)}
          onCancel={() => cancelOrder(detailOrder.id)}
          isDark={isDark}
        />
      )}

      {devisOrder && (
        <DevisBuilderModal
          visible={devisOpen}
          onClose={() => { setDevisOpen(false); setDevisOrder(null); }}
          clientName={devisOrder.name}
          isDark={isDark}
          onConfirm={() => {
            if (devisOrder) {
              setDevisedIds((prev) => new Set([...prev, devisOrder.id]));
            }
          }}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root:         { flex: 1 },
  header:       { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingBottom: 12, gap: 10, borderBottomWidth: 1 },
  backBtn:      { padding: 4 },
  headerCenter: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8 },
  headerTitle:  { fontFamily: "Poppins_700Bold", fontSize: 18 },
  badge:        { borderRadius: 10, minWidth: 20, height: 20, alignItems: "center", justifyContent: "center", paddingHorizontal: 6 },
  badgeText:    { color: "#fff", fontFamily: "Poppins_700Bold", fontSize: 11 },
  filterBtn:    { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  searchWrap:   { paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1 },
  searchBar:    { flexDirection: "row", alignItems: "center", borderRadius: 22, borderWidth: 1, paddingHorizontal: 12, height: 38, gap: 8 },
  searchInput:  { flex: 1, fontFamily: "Poppins_400Regular", fontSize: 13 },
  tabsWrap:     { flexDirection: "row", borderBottomWidth: 1 },
  tab:          { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 10, gap: 5, borderBottomWidth: 2, borderBottomColor: "transparent" },
  tabActive:    {},
  tabText:      { fontFamily: "Poppins_600SemiBold", fontSize: 12 },
  tabCount:     { borderRadius: 9, paddingHorizontal: 6, paddingVertical: 1 },
  tabCountText: { fontFamily: "Poppins_700Bold", fontSize: 10 },
  card:         { marginHorizontal: 14, marginTop: 12, borderRadius: 14, borderWidth: 1, padding: 13, gap: 10 },
  badgesRow:    { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  sourceBadge:  { flexDirection: "row", alignItems: "center", gap: 5, alignSelf: "flex-start", borderRadius: 8, paddingHorizontal: 9, paddingVertical: 4, borderWidth: 1 },
  sourceBadgeText: { fontFamily: "Poppins_600SemiBold", fontSize: 10 },
  cardRow:      { flexDirection: "row", alignItems: "center", gap: 10 },
  avatar:       { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  avatarText:   { fontFamily: "Poppins_700Bold", fontSize: 15 },
  cardTop:      { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cardName:     { flex: 1, fontFamily: "Poppins_700Bold", fontSize: 14 },
  cardTime:     { fontFamily: "Poppins_400Regular", fontSize: 11 },
  cardDate:     { fontFamily: "Poppins_400Regular", fontSize: 11, marginTop: 1 },
  totalRow:       { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderTopWidth: 1, paddingTop: 8 },
  totalLabel:     { fontFamily: "Poppins_400Regular", fontSize: 12 },
  totalAmt:       { fontFamily: "Poppins_700Bold", fontSize: 15 },
  processingBadge: { flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 8, borderWidth: 1, paddingHorizontal: 7, paddingVertical: 3 },
  processingDot:   { width: 6, height: 6, borderRadius: 3, backgroundColor: "#F59E0B" },
  processingBadgeText: { fontFamily: "Poppins_600SemiBold", fontSize: 10 },
  actionsRow:      { flexDirection: "row", gap: 6 },
  btnArticles:     { flex: 1.1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, borderWidth: 1.5, borderRadius: 10, paddingVertical: 8 },
  btnArticlesText: { fontFamily: "Poppins_600SemiBold", fontSize: 11 },
  btnChat:         { flex: 0.9, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, borderWidth: 1.5, borderRadius: 10, paddingVertical: 8 },
  btnChatText:     { fontFamily: "Poppins_600SemiBold", fontSize: 11 },
  btnDevis:        { flex: 0.8, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, borderRadius: 10, paddingVertical: 8 },
  btnDevisText:        { fontFamily: "Poppins_600SemiBold", fontSize: 11 },
  processingToggle:     { flexDirection: "row", alignItems: "center", gap: 7, borderRadius: 10, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 8 },
  processingToggleText: { fontFamily: "Poppins_500Medium", fontSize: 11, flex: 1 },
  empty:        { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  emptyText:    { fontFamily: "Poppins_500Medium", fontSize: 14 },
});
