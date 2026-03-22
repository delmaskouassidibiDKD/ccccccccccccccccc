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

const DM_EXTRA_KEY  = "@dkd:dm_extra_convs";
const ACTIVITY_KEY  = "@dkd:dm_activity";

type Conv = {
  id: string;
  name: string;
  initials: string;
  color: string;
  preview: string;
  time: string;
  unread: number;
  online: boolean;
};

const CONVERSATIONS: Conv[] = [];

function ConvItem({ conv, onPress, onLongPress, isDark, dynCARD, dynText, dynSub, dynBorder }: {
  conv: Conv;
  onPress: () => void;
  onLongPress: () => void;
  isDark: boolean;
  dynCARD: string;
  dynText: string;
  dynSub: string;
  dynBorder: string;
}) {
  return (
    <TouchableOpacity
      style={[s.convRow, { backgroundColor: conv.unread > 0 ? (isDark ? "#161B25" : "#F8F4FF") : dynCARD, borderBottomColor: dynBorder }]}
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
          <Text style={[s.convName, { color: dynText, fontFamily: conv.unread > 0 ? "Poppins_700Bold" : "Poppins_600SemiBold" }]} numberOfLines={1}>
            {conv.name}
          </Text>
          <Text style={[s.convTime, { color: conv.unread > 0 ? "#A855F7" : dynSub }]}>{conv.time}</Text>
        </View>
        <View style={s.convBot}>
          <Text style={[s.convPreview, { color: conv.unread > 0 ? dynText : dynSub, fontFamily: conv.unread > 0 ? "Poppins_500Medium" : "Poppins_400Regular" }]} numberOfLines={1}>
            {conv.preview}
          </Text>
          {conv.unread > 0 && (
            <View style={s.badge}>
              <Text style={s.badgeText}>{conv.unread}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function MessagesImportePage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();

  const dynBG     = isDark ? "#0D1117" : "#F0F4FA";
  const dynCARD   = isDark ? "#161B25" : "#FFFFFF";
  const dynText   = isDark ? "#F0F6FF" : "#1A1A1A";
  const dynSub    = isDark ? "#64748B" : "#6B7280";
  const dynBorder = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.08)";
  const dynHeader = isDark ? "#111827" : "#FFFFFF";
  const ACCENT    = "#A855F7";

  const [tab,              setTab]              = useState<"tous" | "non_lu">("tous");
  const [search,           setSearch]           = useState("");
  const [allConversations, setAllConversations] = useState<Conv[]>(CONVERSATIONS);
  const [convToDelete,     setConvToDelete]     = useState<Conv | null>(null);

  useFocusEffect(
    useCallback(() => {
      const load = async () => {
        try {
          const [extraRaw, activityRaw] = await Promise.all([
            AsyncStorage.getItem(DM_EXTRA_KEY),
            AsyncStorage.getItem(ACTIVITY_KEY),
          ]);

          const activity: Record<string, { timestamp: number; preview: string; time: string }> =
            activityRaw ? JSON.parse(activityRaw) : {};

          // Merge extra (from Discuter) with static, avoiding duplicates
          const existingIds = new Set(CONVERSATIONS.map((c) => c.id));
          const extras: Conv[] = extraRaw
            ? (JSON.parse(extraRaw) as Conv[]).filter((c) => !existingIds.has(c.id))
            : [];

          const merged: Conv[] = [
            ...CONVERSATIONS.map((c) =>
              activity[c.id]
                ? { ...c, preview: activity[c.id].preview, time: activity[c.id].time }
                : c
            ),
            ...extras.map((c) =>
              activity[c.id]
                ? { ...c, preview: activity[c.id].preview, time: activity[c.id].time }
                : c
            ),
          ];

          // Sort: conversations with recent activity first (highest timestamp).
          // Static ones without activity keep their original order via a stable fallback.
          const BASE = 1_000_000_000_000; // smaller than any real Date.now()
          const withOrder = merged.map((c, i) => ({
            conv: c,
            sortKey: activity[c.id]?.timestamp ?? (BASE - i),
          }));
          withOrder.sort((a, b) => b.sortKey - a.sortKey);
          const sorted = withOrder.map((x) => x.conv);

          setAllConversations(sorted);
        } catch {}
      };
      load();
    }, [])
  );

  const deleteConv = async () => {
    if (!convToDelete) return;
    try {
      const raw = await AsyncStorage.getItem(DM_EXTRA_KEY);
      const convs: Conv[] = raw ? JSON.parse(raw) : [];
      const updated = convs.filter((c) => c.id !== convToDelete.id);
      await AsyncStorage.setItem(DM_EXTRA_KEY, JSON.stringify(updated));
      setAllConversations((prev) => prev.filter((c) => c.id !== convToDelete.id));
    } catch {}
    setConvToDelete(null);
  };

  const filtered = allConversations.filter((c) => {
    const matchTab = tab === "tous" || c.unread > 0;
    const matchSearch = !search || c.name.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  const totalUnread = allConversations.reduce((acc, c) => acc + c.unread, 0);

  return (
    <View style={[s.root, { backgroundColor: dynBG }]}>

      {/* ── HEADER ── */}
      <View style={[s.header, { paddingTop: insets.top + 10, backgroundColor: dynHeader, borderBottomColor: dynBorder }]}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color={dynText} />
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <Text style={[s.headerTitle, { color: dynText }]}>Messages</Text>
          {totalUnread > 0 && (
            <View style={[s.headerBadge, { backgroundColor: ACCENT }]}>
              <Text style={s.headerBadgeText}>{totalUnread}</Text>
            </View>
          )}
        </View>
        <TouchableOpacity style={[s.newBtn, { backgroundColor: ACCENT + "18" }]} activeOpacity={0.7}>
          <Ionicons name="create-outline" size={20} color={ACCENT} />
        </TouchableOpacity>
      </View>

      {/* ── SEARCH ── */}
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

      {/* ── TABS ── */}
      <View style={[s.tabs, { backgroundColor: dynHeader, borderBottomColor: dynBorder }]}>
        {(["tous", "non_lu"] as const).map((t) => {
          const active = tab === t;
          const label  = t === "tous" ? "Tous" : "Non lu";
          const count  = t === "non_lu" ? totalUnread : CONVERSATIONS.length;
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

      {/* ── LIST ── */}
      {filtered.length === 0 ? (
        <View style={s.empty}>
          <Ionicons name="chatbubbles-outline" size={52} color={dynSub} />
          <Text style={[s.emptyTitle, { color: dynText }]}>Aucune conversation</Text>
          <Text style={[s.emptyDesc, { color: dynSub }]}>
            Allez dans vos commandes et appuyez sur{"\n"}"Discuter" pour contacter un client.
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
              onPress={() => {
                Haptics.selectionAsync();
                router.push(`/dm-importe?id=${item.id}&name=${encodeURIComponent(item.name)}&initials=${item.initials}&color=${encodeURIComponent(item.color)}` as any);
              }}
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
  newBtn:          { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },

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
  badge:       { backgroundColor: "#A855F7", borderRadius: 10, minWidth: 20, height: 20, alignItems: "center", justifyContent: "center", paddingHorizontal: 5 },
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
