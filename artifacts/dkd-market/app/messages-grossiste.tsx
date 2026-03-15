import React, { useState, useCallback } from "react";
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/contexts/ThemeContext";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";

const DM_EXTRA_KEY = "@dkd:gros_dm_extra_convs";
const ACTIVITY_KEY = "@dkd:gros_dm_activity";
const ACCENT = "#3B82F6";

type Conv = {
  id: string;
  name: string;
  initials: string;
  color: string;
  preview: string;
  time: string;
  unread: number;
  online: boolean;
  role: string;
};

const CONVERSATIONS: Conv[] = [
  { id:"gc1", name:"Diallo Marchandises",   initials:"DM", color:"#3B82F6", preview:"Bonjour, avez-vous du riz 50kg en stock ?",    time:"09:14", unread:2,  online:true,  role:"Revendeur" },
  { id:"gc2", name:"Koné Distribution SA",  initials:"KD", color:"#34D399", preview:"Votre devis est approuvé, on peut procéder.",   time:"Hier",  unread:0,  online:false, role:"Grossiste" },
  { id:"gc3", name:"Fatou Commerce",        initials:"FC", color:"#F59E0B", preview:"Quand livrez-vous les 200 cartons ?",            time:"Mar.",  unread:1,  online:true,  role:"Détaillant" },
  { id:"gc4", name:"Ibrahim Import-Export", initials:"II", color:"#EC4899", preview:"Merci pour la commande, c'est parfait.",        time:"Lun.",  unread:0,  online:false, role:"Importateur" },
];

export default function MessagesGrossistePage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();

  const dynBG     = isDark ? "#0D1117" : "#F0F4FA";
  const dynCARD   = isDark ? "#161B25" : "#FFFFFF";
  const dynText   = isDark ? "#F0F6FF" : "#1A1A1A";
  const dynSub    = isDark ? "#64748B" : "#6B7280";
  const dynBorder = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.08)";
  const dynHeader = isDark ? "#111827" : "#FFFFFF";

  const [tab,              setTab]              = useState<"tous" | "non_lu">("tous");
  const [search,           setSearch]           = useState("");
  const [allConversations, setAllConversations] = useState<Conv[]>(CONVERSATIONS);

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
          const existingIds = new Set(CONVERSATIONS.map((c) => c.id));
          const extras: Conv[] = extraRaw
            ? (JSON.parse(extraRaw) as Conv[]).filter((c) => !existingIds.has(c.id))
            : [];
          const merged: Conv[] = [
            ...CONVERSATIONS.map((c) => activity[c.id] ? { ...c, preview: activity[c.id].preview, time: activity[c.id].time } : c),
            ...extras.map((c) => activity[c.id] ? { ...c, preview: activity[c.id].preview, time: activity[c.id].time } : c),
          ];
          const BASE = 1_000_000_000_000;
          const sorted = merged
            .map((c, i) => ({ conv: c, sortKey: activity[c.id]?.timestamp ?? (BASE - i) }))
            .sort((a, b) => b.sortKey - a.sortKey)
            .map((x) => x.conv);
          setAllConversations(sorted);
        } catch {}
      };
      load();
    }, [])
  );

  const filtered = allConversations.filter((c) => {
    const matchTab    = tab === "tous" || c.unread > 0;
    const matchSearch = !search || c.name.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  const totalUnread = allConversations.reduce((acc, c) => acc + c.unread, 0);

  return (
    <View style={[s.root, { backgroundColor: dynBG }]}>

      {/* HEADER */}
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
          <Text style={[s.emptyTitle, { color: dynText }]}>Aucune conversation</Text>
          <Text style={[s.emptyDesc, { color: dynSub }]}>
            Vos échanges avec les revendeurs et clients apparaîtront ici.
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(c) => c.id}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[s.convRow, {
                backgroundColor: item.unread > 0 ? (isDark ? "#161B25" : "#EFF6FF") : dynCARD,
                borderBottomColor: dynBorder,
              }]}
              onPress={() => {
                Haptics.selectionAsync();
                router.push(`/dm-importe?id=${item.id}&name=${encodeURIComponent(item.name)}&initials=${item.initials}&color=${encodeURIComponent(item.color)}` as any);
              }}
              activeOpacity={0.75}
            >
              <View style={{ position: "relative" }}>
                <View style={[s.avatar, { backgroundColor: item.color + "28" }]}>
                  <Text style={[s.avatarText, { color: item.color }]}>{item.initials}</Text>
                </View>
                {item.online && <View style={s.onlineDot} />}
              </View>
              <View style={s.convContent}>
                <View style={s.convTop}>
                  <View style={{ flex: 1, gap: 1 }}>
                    <Text style={[s.convName, { color: dynText, fontFamily: item.unread > 0 ? "Poppins_700Bold" : "Poppins_600SemiBold" }]} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <View style={[s.rolePill, { backgroundColor: item.color + "14" }]}>
                      <Text style={[s.roleText, { color: item.color }]}>{item.role}</Text>
                    </View>
                  </View>
                  <Text style={[s.convTime, { color: item.unread > 0 ? ACCENT : dynSub }]}>{item.time}</Text>
                </View>
                <View style={s.convBot}>
                  <Text style={[s.convPreview, { color: item.unread > 0 ? dynText : dynSub, fontFamily: item.unread > 0 ? "Poppins_500Medium" : "Poppins_400Regular" }]} numberOfLines={1}>
                    {item.preview}
                  </Text>
                  {item.unread > 0 && (
                    <View style={[s.badge, { backgroundColor: ACCENT }]}>
                      <Text style={s.badgeText}>{item.unread}</Text>
                    </View>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
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

  convRow:      { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 13, gap: 12, borderBottomWidth: 1 },
  avatar:       { width: 46, height: 46, borderRadius: 23, alignItems: "center", justifyContent: "center" },
  avatarText:   { fontFamily: "Poppins_700Bold", fontSize: 16 },
  onlineDot:    { position: "absolute", bottom: 1, right: 1, width: 11, height: 11, borderRadius: 6, backgroundColor: "#34D399", borderWidth: 2, borderColor: "#fff" },
  convContent:  { flex: 1, gap: 3 },
  convTop:      { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  convName:     { flex: 1, fontSize: 14 },
  convTime:     { fontFamily: "Poppins_400Regular", fontSize: 11, marginLeft: 6 },
  rolePill:     { borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1, alignSelf: "flex-start" },
  roleText:     { fontFamily: "Poppins_500Medium", fontSize: 9 },
  convBot:      { flexDirection: "row", alignItems: "center", gap: 6 },
  convPreview:  { flex: 1, fontSize: 12, lineHeight: 17 },
  badge:        { borderRadius: 10, minWidth: 20, height: 20, alignItems: "center", justifyContent: "center", paddingHorizontal: 5 },
  badgeText:    { color: "#fff", fontFamily: "Poppins_700Bold", fontSize: 10 },

  empty:      { flex: 1, alignItems: "center", justifyContent: "center", gap: 10, paddingHorizontal: 32 },
  emptyTitle: { fontFamily: "Poppins_700Bold", fontSize: 16 },
  emptyDesc:  { fontFamily: "Poppins_400Regular", fontSize: 13, textAlign: "center" },
});
