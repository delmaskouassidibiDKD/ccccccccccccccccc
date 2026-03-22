import React, { useState, useCallback } from "react";
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput,
  Modal, Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/contexts/ThemeContext";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";

/* ─── Source config ──────────────────────────────────── */
type SourceKey = "gastronomie" | "marche" | "supermarche" | "perfectionnement";

const SOURCE_CONFIG: Record<SourceKey, {
  label: string; accent: string;
  extraKey: string; activityKey: string; deletedKey: string;
}> = {
  gastronomie:     { label: "Gastronomie",     accent: "#EC4899", extraKey: "@dkd:gastro_extra",  activityKey: "@dkd:gastro_activity",  deletedKey: "@dkd:gastro_deleted"  },
  marche:          { label: "Marché",           accent: "#34D399", extraKey: "@dkd:marche_extra",  activityKey: "@dkd:marche_activity",  deletedKey: "@dkd:marche_deleted"  },
  supermarche:     { label: "Supermarché",      accent: "#3B82F6", extraKey: "@dkd:super_extra",   activityKey: "@dkd:super_activity",   deletedKey: "@dkd:super_deleted"   },
  perfectionnement:{ label: "Perfectionnement", accent: "#F59E0B", extraKey: "@dkd:perf_extra",    activityKey: "@dkd:perf_activity",    deletedKey: "@dkd:perf_deleted"    },
};

/* ─── Types ─────────────────────────────────────────── */
type Conv = {
  id: string; name: string; initials: string; color: string;
  preview: string; time: string; unread: number; online: boolean;
};

/* ─── Row component ──────────────────────────────────── */
function ConvItem({ conv, accent, onPress, onLongPress, isDark, dynCARD, dynText, dynSub, dynBorder }: {
  conv: Conv; accent: string;
  onPress: () => void; onLongPress: () => void;
  isDark: boolean; dynCARD: string; dynText: string; dynSub: string; dynBorder: string;
}) {
  return (
    <TouchableOpacity
      style={[s.convRow, { backgroundColor: conv.unread > 0 ? (isDark ? "#161B25" : "#F5F0FF") : dynCARD, borderBottomColor: dynBorder }]}
      onPress={onPress} onLongPress={onLongPress} delayLongPress={400} activeOpacity={0.75}
    >
      <View style={{ position: "relative" }}>
        <View style={[s.avatar, { backgroundColor: conv.color + "28" }]}>
          <Text style={[s.avatarText, { color: conv.color }]}>{conv.initials}</Text>
        </View>
        {conv.online && <View style={s.onlineDot} />}
      </View>
      <View style={s.convContent}>
        <View style={s.convTop}>
          <Text style={[s.convName, { color: dynText, fontFamily: conv.unread > 0 ? "Poppins_700Bold" : "Poppins_600SemiBold" }]} numberOfLines={1}>
            {conv.name}
          </Text>
          <Text style={[s.convTime, { color: conv.unread > 0 ? accent : dynSub }]}>{conv.time}</Text>
        </View>
        <View style={s.convBot}>
          <Text style={[s.convPreview, { color: conv.unread > 0 ? dynText : dynSub, fontFamily: conv.unread > 0 ? "Poppins_500Medium" : "Poppins_400Regular" }]} numberOfLines={1}>
            {conv.preview}
          </Text>
          {conv.unread > 0 && (
            <View style={[s.badge, { backgroundColor: accent }]}>
              <Text style={s.badgeText}>{conv.unread}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

/* ─── Main page ──────────────────────────────────────── */
export default function MessagesListPage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const { source } = useLocalSearchParams<{ source: string }>();

  const cfg = SOURCE_CONFIG[(source as SourceKey) ?? "gastronomie"] ?? SOURCE_CONFIG.gastronomie;
  const { label, accent, extraKey, activityKey, deletedKey } = cfg;

  const dynBG     = isDark ? "#0D1117" : "#F0F4FA";
  const dynCARD   = isDark ? "#161B25" : "#FFFFFF";
  const dynText   = isDark ? "#F0F6FF" : "#1A1A1A";
  const dynSub    = isDark ? "#64748B" : "#6B7280";
  const dynBorder = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.08)";
  const dynHeader = isDark ? "#111827" : "#FFFFFF";

  const [tab,              setTab]              = useState<"tous" | "non_lu">("tous");
  const [search,           setSearch]           = useState("");
  const [allConversations, setAllConversations] = useState<Conv[]>([]);
  const [convToDelete,     setConvToDelete]     = useState<Conv | null>(null);

  useFocusEffect(
    useCallback(() => {
      const load = async () => {
        try {
          const [extraRaw, activityRaw] = await Promise.all([
            AsyncStorage.getItem(extraKey),
            AsyncStorage.getItem(activityKey),
          ]);
          const activity: Record<string, { timestamp: number; preview: string; time: string }> =
            activityRaw ? JSON.parse(activityRaw) : {};
          const convs: Conv[] = extraRaw ? JSON.parse(extraRaw) : [];
          const merged = convs.map((c) =>
            activity[c.id] ? { ...c, preview: activity[c.id].preview, time: activity[c.id].time } : c
          );
          const BASE = 1_000_000_000_000;
          const sorted = merged
            .map((c, i) => ({ conv: c, sortKey: activity[c.id]?.timestamp ?? (BASE - i) }))
            .sort((a, b) => b.sortKey - a.sortKey)
            .map((x) => x.conv);
          setAllConversations(sorted);
        } catch {}
      };
      load();
    }, [extraKey, activityKey])
  );

  const deleteConv = async () => {
    if (!convToDelete) return;
    try {
      const raw = await AsyncStorage.getItem(extraKey);
      const convs: Conv[] = raw ? JSON.parse(raw) : [];
      await AsyncStorage.setItem(extraKey, JSON.stringify(convs.filter((c) => c.id !== convToDelete.id)));
      setAllConversations((prev) => prev.filter((c) => c.id !== convToDelete.id));
    } catch {}
    setConvToDelete(null);
  };

  const filtered = allConversations.filter((c) => {
    const matchTab    = tab === "tous" || c.unread > 0;
    const matchSearch = !search || c.name.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  const totalUnread = allConversations.reduce((acc, c) => acc + c.unread, 0);

  const openConv = (item: Conv) => {
    Haptics.selectionAsync();
    const base = `id=${item.id}&name=${encodeURIComponent(item.name)}&initials=${encodeURIComponent(item.initials)}&color=${encodeURIComponent(item.color)}`;
    const keys = `&xKey=${encodeURIComponent(extraKey)}&aKey=${encodeURIComponent(activityKey)}`;
    router.push(`/dm-personnalisation?${base}${keys}` as any);
  };

  return (
    <View style={[s.root, { backgroundColor: dynBG }]}>

      {/* HEADER */}
      <View style={[s.header, { paddingTop: insets.top + 10, backgroundColor: dynHeader, borderBottomColor: dynBorder }]}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color={dynText} />
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <Text style={[s.headerTitle, { color: dynText }]}>Messages</Text>
          <View style={[s.srcPill, { backgroundColor: accent + "18" }]}>
            <Text style={[s.srcText, { color: accent }]}>{label}</Text>
          </View>
          {totalUnread > 0 && (
            <View style={[s.headerBadge, { backgroundColor: accent }]}>
              <Text style={s.headerBadgeText}>{totalUnread}</Text>
            </View>
          )}
        </View>
        <View style={[s.accentDot, { backgroundColor: accent + "18" }]}>
          <Ionicons name="chatbubbles-outline" size={18} color={accent} />
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
          const label2  = t === "tous" ? "Tous" : "Non lus";
          const count  = t === "non_lu" ? totalUnread : allConversations.length;
          return (
            <TouchableOpacity
              key={t}
              style={[s.tab, active && [s.tabActive, { borderBottomColor: accent }]]}
              onPress={() => { Haptics.selectionAsync(); setTab(t); }}
              activeOpacity={0.7}
            >
              <Text style={[s.tabText, { color: active ? accent : dynSub }]}>{label2}</Text>
              <View style={[s.tabCount, { backgroundColor: active ? accent : (isDark ? "#1E293B" : "#E5E7EB") }]}>
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
          <Text style={[s.emptyTitle, { color: dynText }]}>Aucune conversation</Text>
          <Text style={[s.emptyDesc, { color: dynSub }]}>
            Les conversations {label} apparaîtront ici.
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(c) => c.id}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <ConvItem
              conv={item}
              accent={accent}
              onPress={() => openConv(item)}
              onLongPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setConvToDelete(item); }}
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
  headerCenter:    { flex: 1, flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  headerTitle:     { fontFamily: "Poppins_700Bold", fontSize: 18 },
  headerBadge:     { borderRadius: 10, paddingHorizontal: 7, paddingVertical: 1 },
  headerBadgeText: { color: "#fff", fontFamily: "Poppins_700Bold", fontSize: 11 },
  srcPill:         { borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  srcText:         { fontFamily: "Poppins_600SemiBold", fontSize: 10 },
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

  convRow:     { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 13, gap: 12, borderBottomWidth: 1 },
  avatar:      { width: 46, height: 46, borderRadius: 23, alignItems: "center", justifyContent: "center" },
  avatarText:  { fontFamily: "Poppins_700Bold", fontSize: 16 },
  onlineDot:   { position: "absolute", bottom: 1, right: 1, width: 11, height: 11, borderRadius: 6, backgroundColor: "#34D399", borderWidth: 2, borderColor: "#fff" },
  convContent: { flex: 1, gap: 2 },
  convTop:     { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  convName:    { flex: 1, fontSize: 14 },
  convTime:    { fontFamily: "Poppins_400Regular", fontSize: 11, marginLeft: 6 },
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
