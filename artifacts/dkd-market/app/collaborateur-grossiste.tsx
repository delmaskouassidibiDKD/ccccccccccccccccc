import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/contexts/ThemeContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";

const ACCENT = "#34D399";
const DM_EXTRA_KEY = "@dkd:gros_dm_extra_convs";
const ACTIVITY_KEY = "@dkd:gros_dm_activity";
const COLLAB_KEY   = "@dkd:gros_collaborateurs";

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
  { id: "gc1", name: "Diallo Marchandises",  initials: "DM", color: "#3B82F6", preview: "", time: "", unread: 0, online: true,  role: "Revendeur" },
  { id: "gc2", name: "Koné Distribution SA", initials: "KD", color: "#34D399", preview: "", time: "", unread: 0, online: false, role: "Grossiste" },
  { id: "gc3", name: "Fatou Commerce",       initials: "FC", color: "#F59E0B", preview: "", time: "", unread: 0, online: true,  role: "Détaillant" },
  { id: "gc4", name: "Ibrahim Import-Export",initials: "II", color: "#EC4899", preview: "", time: "", unread: 0, online: false, role: "Importateur" },
];

export default function CollaborateurGrossistePage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();

  const dynBG     = isDark ? "#0D1117" : "#F0F4FA";
  const dynCARD   = isDark ? "#161B25" : "#FFFFFF";
  const dynText   = isDark ? "#F0F6FF" : "#1A1A1A";
  const dynSub    = isDark ? "#64748B" : "#6B7280";
  const dynBorder = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.08)";
  const dynHeader = isDark ? "#111827" : "#FFFFFF";

  const [contacts, setContacts]         = useState<Conv[]>([]);
  const [collabIds, setCollabIds]       = useState<string[]>([]);
  const [selectedIds, setSelectedIds]   = useState<Set<string>>(new Set());

  useFocusEffect(
    useCallback(() => {
      const load = async () => {
        try {
          const [extraRaw, activityRaw, collabRaw] = await Promise.all([
            AsyncStorage.getItem(DM_EXTRA_KEY),
            AsyncStorage.getItem(ACTIVITY_KEY),
            AsyncStorage.getItem(COLLAB_KEY),
          ]);

          const existingIds = new Set(CONVERSATIONS.map((c) => c.id));
          const extras: Conv[] = extraRaw
            ? (JSON.parse(extraRaw) as Conv[]).filter((c) => !existingIds.has(c.id))
            : [];
          const merged = [...CONVERSATIONS, ...extras];

          const activity: Record<string, { timestamp: number }> = activityRaw ? JSON.parse(activityRaw) : {};
          const BASE = 1_000_000_000_000;
          const sorted = merged
            .map((c, i) => ({ conv: c, sortKey: activity[c.id]?.timestamp ?? (BASE - i) }))
            .sort((a, b) => b.sortKey - a.sortKey)
            .map((x) => x.conv);

          setContacts(sorted);

          const savedIds: string[] = collabRaw ? JSON.parse(collabRaw) : [];
          setCollabIds(savedIds);
        } catch {}
      };
      load();
    }, [])
  );

  const toggleSelect = (id: string) => {
    Haptics.selectionAsync();
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const confirmSelection = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const newIds = Array.from(new Set([...collabIds, ...selectedIds]));
    setCollabIds(newIds);
    setSelectedIds(new Set());
    await AsyncStorage.setItem(COLLAB_KEY, JSON.stringify(newIds));
  };

  const removeCollab = async (id: string) => {
    Haptics.selectionAsync();
    const newIds = collabIds.filter((cid) => cid !== id);
    setCollabIds(newIds);
    await AsyncStorage.setItem(COLLAB_KEY, JSON.stringify(newIds));
  };

  const collabContacts    = contacts.filter((c) => collabIds.includes(c.id));
  const availableContacts = contacts.filter((c) => !collabIds.includes(c.id));
  const hasSelection      = selectedIds.size > 0;

  const renderContact = ({ item }: { item: Conv }) => {
    const isSelected = selectedIds.has(item.id);
    return (
      <TouchableOpacity
        style={[st.contactRow, { backgroundColor: isSelected ? ACCENT + "12" : dynCARD, borderColor: isSelected ? ACCENT + "55" : dynBorder }]}
        onPress={() => toggleSelect(item.id)}
        activeOpacity={0.7}
      >
        <View style={[st.avatar, { backgroundColor: item.color + "22", borderColor: item.color + "55" }]}>
          <Text style={[st.avatarText, { color: item.color }]}>{item.initials}</Text>
          {item.online && <View style={[st.onlineDot, { borderColor: dynCARD }]} />}
        </View>
        <View style={st.contactInfo}>
          <Text style={[st.contactName, { color: dynText }]}>{item.name}</Text>
          <Text style={[st.contactRole, { color: dynSub }]}>{item.role}</Text>
        </View>
        <View style={[st.checkCircle, { borderColor: isSelected ? ACCENT : dynBorder, backgroundColor: isSelected ? ACCENT : "transparent" }]}>
          {isSelected && <Ionicons name="checkmark" size={14} color="#fff" />}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[st.root, { backgroundColor: dynBG, paddingTop: insets.top }]}>

      {/* Header */}
      <View style={[st.header, { backgroundColor: dynHeader, borderBottomColor: dynBorder }]}>
        <TouchableOpacity style={[st.backBtn, { backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)" }]} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={20} color={dynText} />
        </TouchableOpacity>
        <View style={st.headerCenter}>
          <View style={[st.headerIcon, { backgroundColor: ACCENT + "22" }]}>
            <Ionicons name="person-add-outline" size={16} color={ACCENT} />
          </View>
          <Text style={[st.headerTitle, { color: dynText }]}>Collaborateurs</Text>
        </View>
        <View style={{ width: 32 }} />
      </View>

      {/* Current collaborators */}
      {collabContacts.length > 0 && (
        <View style={[st.section, { borderBottomColor: dynBorder }]}>
          <Text style={[st.sectionLabel, { color: dynSub }]}>COLLABORATEURS ACTUELS</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={st.chipsRow}>
            {collabContacts.map((c) => (
              <View key={c.id} style={[st.chip, { backgroundColor: ACCENT + "15", borderColor: ACCENT + "44" }]}>
                <View style={[st.chipAvatar, { backgroundColor: c.color + "22" }]}>
                  <Text style={[st.chipAvatarText, { color: c.color }]}>{c.initials}</Text>
                </View>
                <Text style={[st.chipName, { color: dynText }]}>{c.name}</Text>
                <TouchableOpacity onPress={() => removeCollab(c.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons name="close-circle" size={18} color="#EF4444" />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Available contacts */}
      <View style={{ flex: 1 }}>
        <Text style={[st.sectionLabel, { color: dynSub, paddingHorizontal: 16, paddingTop: 14 }]}>
          {availableContacts.length > 0 ? "SÉLECTIONNEZ VOS COLLABORATEURS" : "AUCUN CONTACT DISPONIBLE"}
        </Text>

        {availableContacts.length > 0 ? (
          <FlatList
            data={availableContacts}
            keyExtractor={(item) => item.id}
            renderItem={renderContact}
            contentContainerStyle={st.list}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={st.emptyWrap}>
            <View style={[st.emptyIcon, { backgroundColor: ACCENT + "22" }]}>
              <Ionicons name="people-outline" size={36} color={ACCENT} />
            </View>
            <Text style={[st.emptyTitle, { color: dynText }]}>Tous vos contacts sont déjà collaborateurs</Text>
            <Text style={[st.emptySub, { color: dynSub }]}>Envoyez un message à quelqu'un pour l'ajouter ici.</Text>
          </View>
        )}
      </View>

      {/* Confirm button */}
      {hasSelection && (
        <View style={[st.bottomBar, { paddingBottom: insets.bottom + 12, borderTopColor: dynBorder, backgroundColor: dynHeader }]}>
          <TouchableOpacity style={st.confirmBtn} onPress={confirmSelection} activeOpacity={0.85}>
            <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
            <Text style={st.confirmText}>Confirmer ({selectedIds.size})</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  backBtn: { width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  headerCenter: { flex: 1, flexDirection: "row", alignItems: "center", gap: 10 },
  headerIcon: { width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontFamily: "Poppins_700Bold", fontSize: 17 },

  section: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  sectionLabel: { fontFamily: "Poppins_600SemiBold", fontSize: 10, letterSpacing: 1, marginBottom: 8 },

  chipsRow: { gap: 8, paddingRight: 4 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  chipAvatar: { width: 24, height: 24, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  chipAvatarText: { fontFamily: "Poppins_700Bold", fontSize: 10 },
  chipName: { fontFamily: "Poppins_500Medium", fontSize: 12 },

  list: { padding: 16, gap: 8 },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  avatarText: { fontFamily: "Poppins_700Bold", fontSize: 15 },
  onlineDot: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#22C55E",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  contactInfo: { flex: 1, gap: 2 },
  contactName: { fontFamily: "Poppins_600SemiBold", fontSize: 14 },
  contactRole: { fontFamily: "Poppins_400Regular", fontSize: 12 },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyWrap: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 12 },
  emptyIcon: { width: 72, height: 72, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  emptyTitle: { fontFamily: "Poppins_700Bold", fontSize: 16, textAlign: "center" },
  emptySub: { fontFamily: "Poppins_400Regular", fontSize: 13, textAlign: "center", lineHeight: 20 },

  bottomBar: {
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  confirmBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: ACCENT,
    borderRadius: 14,
    paddingVertical: 14,
  },
  confirmText: { fontFamily: "Poppins_700Bold", fontSize: 15, color: "#fff" },
});
