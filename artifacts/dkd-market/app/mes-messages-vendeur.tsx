import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/contexts/ThemeContext";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";

const ACCENT = "#FF6200";
const SELLER_CONVS_KEY = "@dkd:seller_convs";

/* ─── Static grossiste conversations (mirrored from messages-grossiste) ── */
const GRO_STATIC_IDS = new Set(["gc1", "gc2", "gc3", "gc4"]);
const GRO_STATIC_BASE = [
  { id:"gc1", name:"Diallo Marchandises",   initials:"DM", color:"#3B82F6", preview:"Bonjour, avez-vous du riz 50kg en stock ?",    time:"09:14", unread:2,  online:true  },
  { id:"gc2", name:"Koné Distribution SA",  initials:"KD", color:"#34D399", preview:"Votre devis est approuvé, on peut procéder.",   time:"Hier",  unread:0,  online:false },
  { id:"gc3", name:"Fatou Commerce",        initials:"FC", color:"#F59E0B", preview:"Quand livrez-vous les 200 cartons ?",            time:"Mar.",  unread:1,  online:true  },
  { id:"gc4", name:"Ibrahim Import-Export", initials:"II", color:"#EC4899", preview:"Merci pour la commande, c'est parfait.",        time:"Lun.",  unread:0,  online:false },
];

/* ─── Source config — 6 menus + boutique ─────────────── */
type Source = "importe" | "grossiste" | "gastronomie" | "marche" | "supermarche" | "perfectionnement" | "boutique";

type PoolSource = Exclude<Source, "boutique">;
const SOURCE_META: Record<PoolSource, { label: string; color: string; extraKey: string; activityKey: string; deletedKey?: string; chatScreen: "dm-importe" | "dm-personnalisation" }> = {
  importe:          { label: "Importé",          color: "#3B82F6", extraKey: "@dkd:dm_extra_convs",      activityKey: "@dkd:dm_activity",         chatScreen: "dm-importe"         },
  grossiste:        { label: "Grossiste",         color: "#22C55E", extraKey: "@dkd:gros_dm_extra_convs", activityKey: "@dkd:gros_dm_activity",     deletedKey: "@dkd:gros_deleted_conv_ids", chatScreen: "dm-personnalisation" },
  gastronomie:      { label: "Gastronomie",       color: "#EC4899", extraKey: "@dkd:gastro_extra",        activityKey: "@dkd:gastro_activity",      deletedKey: "@dkd:gastro_deleted", chatScreen: "dm-personnalisation" },
  marche:           { label: "Marché",            color: "#34D399", extraKey: "@dkd:marche_extra",        activityKey: "@dkd:marche_activity",      deletedKey: "@dkd:marche_deleted", chatScreen: "dm-personnalisation" },
  supermarche:      { label: "Supermarché",       color: "#06B6D4", extraKey: "@dkd:super_extra",         activityKey: "@dkd:super_activity",       deletedKey: "@dkd:super_deleted",  chatScreen: "dm-personnalisation" },
  perfectionnement: { label: "Perfectionnement",  color: "#F59E0B", extraKey: "@dkd:perf_extra",          activityKey: "@dkd:perf_activity",        deletedKey: "@dkd:perf_deleted",   chatScreen: "dm-personnalisation" },
};

const ALL_SOURCES: PoolSource[] = ["importe", "grossiste", "gastronomie", "marche", "supermarche", "perfectionnement"];

/* ─── Types ─────────────────────────────────────────── */
type ConvEntry = {
  id: string;
  name: string;
  initials: string;
  color: string;
  preview: string;
  time: string;
  unread: number;
  online: boolean;
  source: Source;
  sourceLabel: string;
  sourceSortKey: number;
};

/* ─── Source label pill ──────────────────────────────── */
const SOURCE_COLORS: Record<Source, string> = {
  importe:          "#3B82F6",
  grossiste:        "#22C55E",
  gastronomie:      "#EC4899",
  marche:           "#34D399",
  supermarche:      "#06B6D4",
  perfectionnement: "#F59E0B",
  boutique:         "#FF6200",
};

/* ─── Conversation row ───────────────────────────────── */
function ConvItem({ conv, onPress, onLongPress, isDark, dynCARD, dynText, dynSub, dynBorder }: {
  conv: ConvEntry;
  onPress: () => void;
  onLongPress: () => void;
  isDark: boolean;
  dynCARD: string;
  dynText: string;
  dynSub: string;
  dynBorder: string;
}) {
  const srcColor = SOURCE_COLORS[conv.source];
  return (
    <TouchableOpacity
      style={[s.convRow, { backgroundColor: conv.unread > 0 ? (isDark ? "#161B25" : "#F5F0FF") : dynCARD, borderBottomColor: dynBorder }]}
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={400}
      activeOpacity={0.75}
    >
      <View style={{ position: "relative" }}>
        <View style={[s.avatar, { backgroundColor: conv.color + "28" }]}>
          <Text style={[s.avatarText, { color: conv.color }]}>{conv.initials}</Text>
        </View>
        {conv.online && <View style={s.onlineDot} />}
      </View>

      <View style={s.convContent}>
        <View style={s.convTop}>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={[s.convName, { color: dynText, fontFamily: conv.unread > 0 ? "Poppins_700Bold" : "Poppins_600SemiBold" }]} numberOfLines={1}>
              {conv.name}
            </Text>
            <View style={[s.srcPill, { backgroundColor: srcColor + "18" }]}>
              <Text style={[s.srcText, { color: srcColor }]}>{conv.sourceLabel}</Text>
            </View>
          </View>
          <Text style={[s.convTime, { color: conv.unread > 0 ? ACCENT : dynSub }]}>{conv.time}</Text>
        </View>
        <View style={s.convBot}>
          <Text style={[s.convPreview, { color: conv.unread > 0 ? dynText : dynSub, fontFamily: conv.unread > 0 ? "Poppins_500Medium" : "Poppins_400Regular" }]} numberOfLines={1}>
            {conv.preview}
          </Text>
          {conv.unread > 0 && (
            <View style={[s.badge, { backgroundColor: ACCENT }]}>
              <Text style={s.badgeText}>{conv.unread}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

/* ─── Main page ──────────────────────────────────────── */
export default function MesMessagesVendeurPage() {
  const router   = useRouter();
  const insets   = useSafeAreaInsets();
  const { isDark } = useTheme();

  const dynBG     = isDark ? "#0D1117" : "#F0F4FA";
  const dynCARD   = isDark ? "#161B25" : "#FFFFFF";
  const dynText   = isDark ? "#F0F6FF" : "#1A1A1A";
  const dynSub    = isDark ? "#64748B" : "#6B7280";
  const dynBorder = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.08)";
  const dynHeader = isDark ? "#111827" : "#FFFFFF";

  const [tab,              setTab]              = useState<"tous" | "non_lu">("tous");
  const [search,           setSearch]           = useState("");
  const [allConversations, setAllConversations] = useState<ConvEntry[]>([]);
  const [convToDelete,     setConvToDelete]     = useState<ConvEntry | null>(null);

  useFocusEffect(
    useCallback(() => {
      const load = async () => {
        try {
          /* Charger toutes les 6 pools en parallèle */
          const keys = ALL_SOURCES.map((s) => [SOURCE_META[s].extraKey, SOURCE_META[s].activityKey, SOURCE_META[s].deletedKey ?? null]).flat().filter(Boolean) as string[];
          const values = await Promise.all(keys.map((k) => AsyncStorage.getItem(k)));
          const store: Record<string, string | null> = {};
          keys.forEach((k, i) => { store[k] = values[i]; });

          const BASE = 1_000_000_000_000;
          const all: ConvEntry[] = [];

          for (const src of ALL_SOURCES) {
            const meta     = SOURCE_META[src];
            const extraRaw = store[meta.extraKey];
            const actRaw   = store[meta.activityKey];
            const delRaw   = meta.deletedKey ? store[meta.deletedKey] : null;

            const activity: Record<string, { timestamp: number; preview: string; time: string }> =
              actRaw ? JSON.parse(actRaw) : {};
            const deleted = new Set<string>(delRaw ? JSON.parse(delRaw) : []);

            /* Dynamic extras from AsyncStorage */
            const extras: any[] = extraRaw ? JSON.parse(extraRaw) : [];
            const extrasFiltered = src === "grossiste" ? extras.filter((c) => !GRO_STATIC_IDS.has(c.id)) : extras;

            for (const c of extrasFiltered) {
              if (deleted.has(c.id)) continue;
              all.push({
                ...c,
                source: src,
                sourceLabel: meta.label,
                preview: activity[c.id]?.preview ?? c.preview ?? "",
                time:    activity[c.id]?.time    ?? c.time    ?? "",
                sourceSortKey: activity[c.id]?.timestamp ?? 0,
              });
            }

            /* Static conversations (Grossiste seulement) */
            if (src === "grossiste") {
              for (const c of GRO_STATIC_BASE) {
                if (deleted.has(c.id)) continue;
                all.push({
                  ...c,
                  source: "grossiste",
                  sourceLabel: "Grossiste",
                  preview: activity[c.id]?.preview ?? c.preview,
                  time:    activity[c.id]?.time    ?? c.time,
                  sourceSortKey: activity[c.id]?.timestamp ?? 0,
                });
              }
            }
          }

          /* ── Pool Boutique — messages depuis aperçu public ── */
          const boutiqueRaw = await AsyncStorage.getItem(SELLER_CONVS_KEY);
          const boutiqueConvs: Array<{ sellerId: string; shopName: string; initials: string; lastMessage: string; lastTime: string; unread: number; messages: any[] }> =
            boutiqueRaw ? JSON.parse(boutiqueRaw) : [];
          for (const c of boutiqueConvs) {
            if (!c.sellerId) continue;
            const initials = c.initials || (c.shopName || "?").slice(0, 2).toUpperCase();
            const color = "#FF6200";
            all.push({
              id:           c.sellerId,
              name:         c.shopName || "Acheteur",
              initials,
              color,
              preview:      c.lastMessage || "",
              time:         c.lastTime    || "",
              unread:       c.unread      || 0,
              online:       false,
              source:       "boutique",
              sourceLabel:  "Boutique",
              sourceSortKey: 0,
            });
          }

          all.sort((a, b) => (b.sourceSortKey || BASE) - (a.sourceSortKey || BASE));
          setAllConversations(all);
        } catch {}
      };
      load();
    }, [])
  );

  /* ─── Delete ─── */
  const deleteConv = async () => {
    if (!convToDelete) return;
    try {
      if (convToDelete.source === "boutique") {
        /* Supprimer depuis @dkd:seller_convs */
        const raw = await AsyncStorage.getItem(SELLER_CONVS_KEY);
        const convs = raw ? JSON.parse(raw) : [];
        await AsyncStorage.setItem(SELLER_CONVS_KEY, JSON.stringify(convs.filter((c: any) => c.sellerId !== convToDelete.id)));
      } else {
        const meta = SOURCE_META[convToDelete.source as PoolSource];
        const isGroStatic = convToDelete.source === "grossiste" && GRO_STATIC_IDS.has(convToDelete.id);
        if (isGroStatic && meta.deletedKey) {
          const raw = await AsyncStorage.getItem(meta.deletedKey);
          const existing: string[] = raw ? JSON.parse(raw) : [];
          if (!existing.includes(convToDelete.id)) {
            await AsyncStorage.setItem(meta.deletedKey, JSON.stringify([...existing, convToDelete.id]));
          }
        } else {
          const raw = await AsyncStorage.getItem(meta.extraKey);
          const convs = raw ? JSON.parse(raw) : [];
          await AsyncStorage.setItem(meta.extraKey, JSON.stringify(convs.filter((c: any) => c.id !== convToDelete.id)));
        }
      }
      setAllConversations((prev) => prev.filter((c) => !(c.id === convToDelete.id && c.source === convToDelete.source)));
    } catch {}
    setConvToDelete(null);
  };

  /* ─── Filter ─── */
  const filtered = allConversations.filter((c) => {
    const matchTab    = tab === "tous" || c.unread > 0;
    const matchSearch = !search || c.name.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  const totalUnread = allConversations.reduce((acc, c) => acc + c.unread, 0);

  /* ─── Navigate to correct chat screen ─── */
  const openConv = (item: ConvEntry) => {
    Haptics.selectionAsync();
    /* Marquer comme lu */
    setAllConversations(prev => prev.map(c =>
      c.id === item.id && c.source === item.source ? { ...c, unread: 0 } : c
    ));
    if (item.source === "boutique") {
      router.push(`/dm-boutique?sellerId=${encodeURIComponent(item.id)}&shopName=${encodeURIComponent(item.name)}&initials=${encodeURIComponent(item.initials)}&color=${encodeURIComponent(item.color)}` as any);
      return;
    }
    const meta = SOURCE_META[item.source as PoolSource];
    const base = `id=${item.id}&name=${encodeURIComponent(item.name)}&initials=${encodeURIComponent(item.initials)}&color=${encodeURIComponent(item.color)}`;
    if (meta.chatScreen === "dm-importe") {
      router.push(`/dm-importe?${base}` as any);
    } else {
      const keys = `&xKey=${encodeURIComponent(meta.extraKey)}&aKey=${encodeURIComponent(meta.activityKey)}`;
      router.push(`/dm-personnalisation?${base}${keys}` as any);
    }
  };

  /* ─── Render ─── */
  return (
    <View style={[s.root, { backgroundColor: dynBG }]}>

      {/* HEADER */}
      <View style={[s.header, { paddingTop: insets.top + 10, backgroundColor: dynHeader, borderBottomColor: dynBorder }]}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color={dynText} />
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <Text style={[s.headerTitle, { color: dynText }]}>Boîte de réception</Text>
          {totalUnread > 0 && (
            <View style={[s.headerBadge, { backgroundColor: ACCENT }]}>
              <Text style={s.headerBadgeText}>{totalUnread}</Text>
            </View>
          )}
        </View>
        <View style={[s.accentDot, { backgroundColor: ACCENT + "18" }]}>
          <Ionicons name="storefront-outline" size={18} color={ACCENT} />
        </View>
      </View>

      {/* SEARCH */}
      <View style={[s.searchWrap, { backgroundColor: dynHeader, borderBottomColor: dynBorder }]}>
        <View style={[s.searchBar, { backgroundColor: isDark ? "#1E293B" : "#F0F4FA", borderColor: dynBorder }]}>
          <Ionicons name="search-outline" size={16} color={dynSub} />
          <TextInput
            style={[s.searchInput, { color: dynText }]}
            placeholder="Rechercher une conversation..."
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
      <View style={[s.tabs, { backgroundColor: dynHeader, borderBottomColor: dynBorder }]}>
        {(["tous", "non_lu"] as const).map((t) => {
          const active = tab === t;
          const label  = t === "tous" ? "Tous" : "Non lus";
          const count  = t === "non_lu" ? totalUnread : allConversations.length;
          return (
            <TouchableOpacity
              key={t}
              style={[s.tab, active && [s.tabActive, { borderBottomColor: ACCENT }]]}
              onPress={() => { Haptics.selectionAsync(); setTab(t); }}
              activeOpacity={0.7}
            >
              <Text style={[s.tabText, { color: active ? ACCENT : dynSub }]}>{label}</Text>
              <View style={[s.tabCount, { backgroundColor: active ? ACCENT : (isDark ? "#1E293B" : "#E5E7EB") }]}>
                <Text style={[s.tabCountText, { color: active ? "#fff" : dynSub }]}>{count}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* LIST */}
      {filtered.length === 0 ? (
        <View style={s.empty}>
          <Ionicons name="chatbubbles-outline" size={52} color={dynSub} />
          <Text style={[s.emptyTitle, { color: dynText }]}>Aucun message</Text>
          <Text style={[s.emptyDesc, { color: dynSub }]}>
            Tous vos messages (boutique, importé, grossiste, marché…) apparaîtront ici.
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(c) => `${c.source}_${c.id}`}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <ConvItem
              conv={item}
              onPress={() => openConv(item)}
              onLongPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setConvToDelete(item);
              }}
              isDark={isDark}
              dynCARD={dynCARD}
              dynText={dynText}
              dynSub={dynSub}
              dynBorder={dynBorder}
            />
          )}
        />
      )}

      {/* DELETE MODAL */}
      <Modal visible={!!convToDelete} transparent animationType="fade" onRequestClose={() => setConvToDelete(null)}>
        <Pressable style={s.delOverlay} onPress={() => setConvToDelete(null)}>
          <Pressable style={[s.delSheet, { backgroundColor: dynCARD, borderColor: dynBorder }]} onPress={() => {}}>
            <Text style={[s.delName, { color: dynText }]}>{convToDelete?.name}</Text>
            <Text style={[s.delMsg, { color: dynSub }]}>Supprimer cette conversation ?</Text>
            <View style={s.delBtns}>
              <TouchableOpacity style={[s.delCancel, { borderColor: dynBorder }]} onPress={() => setConvToDelete(null)} activeOpacity={0.75}>
                <Text style={[s.delCancelText, { color: dynText }]}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.delConfirm} onPress={deleteConv} activeOpacity={0.75}>
                <Text style={s.delConfirmText}>Supprimer</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  root:            { flex: 1 },
  header:          { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingBottom: 12, gap: 10, borderBottomWidth: 1 },
  backBtn:         { padding: 4 },
  headerCenter:    { flex: 1, flexDirection: "row", alignItems: "center", gap: 8 },
  headerTitle:     { fontFamily: "Poppins_700Bold", fontSize: 18 },
  headerBadge:     { borderRadius: 10, paddingHorizontal: 7, paddingVertical: 1 },
  headerBadgeText: { color: "#fff", fontFamily: "Poppins_700Bold", fontSize: 11 },
  accentDot:       { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },

  searchWrap:  { paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1 },
  searchBar:   { flexDirection: "row", alignItems: "center", borderRadius: 22, borderWidth: 1, paddingHorizontal: 12, height: 38, gap: 8 },
  searchInput: { flex: 1, fontFamily: "Poppins_400Regular", fontSize: 13 },

  tabs:          { flexDirection: "row", borderBottomWidth: 1 },
  tab:           { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 12, gap: 6, borderBottomWidth: 2, borderBottomColor: "transparent" },
  tabActive:     {},
  tabText:       { fontFamily: "Poppins_600SemiBold", fontSize: 14 },
  tabCount:      { borderRadius: 10, paddingHorizontal: 7, paddingVertical: 1 },
  tabCountText:  { fontFamily: "Poppins_700Bold", fontSize: 11 },

  convRow:     { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 12, gap: 12, borderBottomWidth: 1 },
  avatar:      { width: 46, height: 46, borderRadius: 23, alignItems: "center", justifyContent: "center" },
  avatarText:  { fontFamily: "Poppins_700Bold", fontSize: 16 },
  onlineDot:   { position: "absolute", bottom: 1, right: 1, width: 11, height: 11, borderRadius: 6, backgroundColor: "#34D399", borderWidth: 2, borderColor: "#fff" },
  convContent: { flex: 1, gap: 2 },
  convTop:     { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  convName:    { flex: 1, fontSize: 14 },
  convTime:    { fontFamily: "Poppins_400Regular", fontSize: 11, marginLeft: 6 },
  srcPill:     { borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1, alignSelf: "flex-start" },
  srcText:     { fontFamily: "Poppins_500Medium", fontSize: 9 },
  convBot:     { flexDirection: "row", alignItems: "center", gap: 6 },
  convPreview: { flex: 1, fontSize: 12, lineHeight: 17 },
  badge:       { borderRadius: 10, minWidth: 20, height: 20, alignItems: "center", justifyContent: "center", paddingHorizontal: 5 },
  badgeText:   { color: "#fff", fontFamily: "Poppins_700Bold", fontSize: 10 },

  empty:      { flex: 1, alignItems: "center", justifyContent: "center", gap: 10, paddingHorizontal: 32 },
  emptyTitle: { fontFamily: "Poppins_700Bold", fontSize: 16 },
  emptyDesc:  { fontFamily: "Poppins_400Regular", fontSize: 13, textAlign: "center", lineHeight: 20 },

  delOverlay:     { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", alignItems: "center", justifyContent: "center", padding: 32 },
  delSheet:       { width: "100%", borderRadius: 16, padding: 20, gap: 12, borderWidth: 1 },
  delName:        { fontFamily: "Poppins_700Bold", fontSize: 15, textAlign: "center" },
  delMsg:         { fontFamily: "Poppins_400Regular", fontSize: 13, textAlign: "center" },
  delBtns:        { flexDirection: "row", gap: 10, marginTop: 4 },
  delCancel:      { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: "center", borderWidth: 1 },
  delCancelText:  { fontFamily: "Poppins_600SemiBold", fontSize: 13 },
  delConfirm:     { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: "center", backgroundColor: "#EF4444" },
  delConfirmText: { fontFamily: "Poppins_700Bold", fontSize: 13, color: "#fff" },
});
