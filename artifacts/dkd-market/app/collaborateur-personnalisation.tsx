import React, { useState, useCallback } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList, Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/contexts/ThemeContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";

const ACCENT      = "#06B6D4";
const DM_EXTRA_KEY = "@dkd:gros_dm_extra_convs";
const COLLAB_KEY   = "@dkd:perso_collaborateurs";

type Conv = {
  id: string;
  name: string;
  initials: string;
  color: string;
  preview?: string;
  time?: string;
  role?: string;
};

const DEFAULT_CONTACTS: Conv[] = [
  { id: "pc1", name: "Aminata Koné",      initials: "AK", color: "#06B6D4", role: "Designer" },
  { id: "pc2", name: "Jean-Marc Ouédraogo",initials: "JO", color: "#8B5CF6", role: "Artisan" },
  { id: "pc3", name: "Fatou Diallo",       initials: "FD", color: "#F59E0B", role: "Couturière" },
  { id: "pc4", name: "Koffi Mensah",       initials: "KM", color: "#22C55E", role: "Revendeur" },
];

export default function CollaborateurPersonnalisationPage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();

  const dynBG     = isDark ? "#0D1117" : "#F0F4FA";
  const dynCARD   = isDark ? "#161B25" : "#FFFFFF";
  const dynText   = isDark ? "#F0F6FF" : "#1A1A1A";
  const dynSub    = isDark ? "#64748B" : "#6B7280";
  const dynBorder = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.08)";
  const dynHeader = isDark ? "#111827" : "#FFFFFF";

  const [contacts,    setContacts]    = useState<Conv[]>([]);
  const [collabIds,   setCollabIds]   = useState<string[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useFocusEffect(
    useCallback(() => {
      const load = async () => {
        try {
          const [extraRaw, collabRaw] = await Promise.all([
            AsyncStorage.getItem(DM_EXTRA_KEY),
            AsyncStorage.getItem(COLLAB_KEY),
          ]);
          const existingIds = new Set(DEFAULT_CONTACTS.map((c) => c.id));
          const extras: Conv[] = extraRaw
            ? (JSON.parse(extraRaw) as Conv[]).filter((c) => !existingIds.has(c.id))
            : [];
          setContacts([...DEFAULT_CONTACTS, ...extras]);
          if (collabRaw) setCollabIds(JSON.parse(collabRaw));
        } catch {}
      };
      load();
    }, [])
  );

  const toggleSelect = (id: string) => {
    Haptics.selectionAsync();
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const isCollab = (id: string) => collabIds.includes(id);

  const handleAdd = async () => {
    if (selectedIds.size === 0) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const next = Array.from(new Set([...collabIds, ...Array.from(selectedIds)]));
    setCollabIds(next);
    await AsyncStorage.setItem(COLLAB_KEY, JSON.stringify(next));
    setSelectedIds(new Set());
    const names = contacts
      .filter((c) => selectedIds.has(c.id))
      .map((c) => c.name)
      .join(", ");
    Alert.alert("Collaborateurs ajoutés", `${names} ${selectedIds.size > 1 ? "ont été ajoutés" : "a été ajouté"} à votre équipe.`, [{ text: "OK" }]);
  };

  const handleRemove = async (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const next = collabIds.filter((c) => c !== id);
    setCollabIds(next);
    await AsyncStorage.setItem(COLLAB_KEY, JSON.stringify(next));
  };

  const collaborateurs = contacts.filter((c) => isCollab(c.id));
  const disponibles    = contacts.filter((c) => !isCollab(c.id));

  return (
    <View style={[s.root, { backgroundColor: dynBG }]}>

      {/* HEADER */}
      <View style={[s.header, { paddingTop: insets.top + 10, backgroundColor: dynHeader, borderBottomColor: dynBorder }]}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color={dynText} />
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <View style={[s.headerIcon, { backgroundColor: ACCENT + "20" }]}>
            <Ionicons name="people-outline" size={16} color={ACCENT} />
          </View>
          <View>
            <Text style={[s.headerTitle, { color: dynText }]}>Mes collaborateurs</Text>
            <Text style={[s.headerSub, { color: dynSub }]}>Gérez votre équipe Personnalisation</Text>
          </View>
        </View>
      </View>

      <FlatList
        data={[]}
        renderItem={() => null}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}
        ListHeaderComponent={
          <View style={{ gap: 0 }}>

            {/* EQUIPE ACTUELLE */}
            {collaborateurs.length > 0 && (
              <View style={{ padding: 14, gap: 10 }}>
                <Text style={[s.sectionLabel, { color: isDark ? "#475569" : "#9CA3AF" }]}>
                  MON ÉQUIPE ({collaborateurs.length})
                </Text>
                {collaborateurs.map((c) => (
                  <View key={c.id} style={[s.contactCard, { backgroundColor: dynCARD, borderColor: ACCENT + "44" }]}>
                    <View style={[s.avatar, { backgroundColor: c.color + "22" }]}>
                      <Text style={[s.avatarText, { color: c.color }]}>{c.initials}</Text>
                    </View>
                    <View style={s.contactInfo}>
                      <Text style={[s.contactName, { color: dynText }]}>{c.name}</Text>
                      <View style={[s.collabBadge, { backgroundColor: ACCENT + "18" }]}>
                        <Ionicons name="checkmark-circle" size={11} color={ACCENT} />
                        <Text style={[s.collabBadgeText, { color: ACCENT }]}>Collaborateur actif</Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={[s.removeBtn, { backgroundColor: "#EF444418" }]}
                      onPress={() => handleRemove(c.id)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="person-remove-outline" size={16} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {/* CONTACTS MESSAGES */}
            <View style={{ paddingHorizontal: 14, paddingBottom: 14, gap: 10 }}>
              <Text style={[s.sectionLabel, { color: isDark ? "#475569" : "#9CA3AF" }]}>
                CONTACTS MESSAGERIE ({disponibles.length})
              </Text>
              <Text style={[s.sectionHint, { color: dynSub }]}>
                Sélectionnez les personnes à ajouter comme collaborateurs
              </Text>

              {disponibles.length === 0 ? (
                <View style={[s.emptyContacts, { backgroundColor: dynCARD, borderColor: dynBorder }]}>
                  <Ionicons name="people-outline" size={30} color={dynSub} />
                  <Text style={[s.emptyContactsText, { color: dynSub }]}>
                    Tous vos contacts sont déjà collaborateurs
                  </Text>
                </View>
              ) : (
                disponibles.map((c) => {
                  const selected = selectedIds.has(c.id);
                  return (
                    <TouchableOpacity
                      key={c.id}
                      style={[
                        s.contactCard,
                        { backgroundColor: dynCARD, borderColor: selected ? ACCENT : dynBorder },
                        selected && { backgroundColor: ACCENT + "0A" },
                      ]}
                      onPress={() => toggleSelect(c.id)}
                      activeOpacity={0.8}
                    >
                      <View style={[s.avatar, { backgroundColor: c.color + "22" }]}>
                        <Text style={[s.avatarText, { color: c.color }]}>{c.initials}</Text>
                      </View>
                      <View style={s.contactInfo}>
                        <Text style={[s.contactName, { color: dynText }]}>{c.name}</Text>
                        {c.role && (
                          <Text style={[s.contactRole, { color: dynSub }]}>{c.role}</Text>
                        )}
                      </View>
                      <View style={[
                        s.checkbox,
                        {
                          borderColor: selected ? ACCENT : dynBorder,
                          backgroundColor: selected ? ACCENT : "transparent",
                        },
                      ]}>
                        {selected && <Ionicons name="checkmark" size={14} color="#fff" />}
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
            </View>
          </View>
        }
      />

      {/* FLOATING ADD BUTTON */}
      {selectedIds.size > 0 && (
        <View style={[s.fab, { bottom: insets.bottom + 16 }]}>
          <TouchableOpacity
            style={[s.fabBtn, { backgroundColor: ACCENT }]}
            onPress={handleAdd}
            activeOpacity={0.9}
          >
            <Ionicons name="person-add-outline" size={18} color="#fff" />
            <Text style={s.fabText}>Ajouter {selectedIds.size} collaborateur{selectedIds.size > 1 ? "s" : ""}</Text>
          </TouchableOpacity>
        </View>
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

  sectionLabel: { fontFamily: "Poppins_600SemiBold", fontSize: 11, letterSpacing: 1.1 },
  sectionHint:  { fontFamily: "Poppins_400Regular", fontSize: 12, marginTop: -4 },

  contactCard: { flexDirection: "row", alignItems: "center", borderRadius: 14, borderWidth: 1, padding: 12, gap: 12 },
  avatar:      { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  avatarText:  { fontFamily: "Poppins_700Bold", fontSize: 15 },
  contactInfo: { flex: 1, gap: 3 },
  contactName: { fontFamily: "Poppins_700Bold", fontSize: 14 },
  contactRole: { fontFamily: "Poppins_400Regular", fontSize: 12 },

  collabBadge:    { flexDirection: "row", alignItems: "center", gap: 4 },
  collabBadgeText:{ fontFamily: "Poppins_600SemiBold", fontSize: 11 },
  removeBtn:      { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },

  checkbox: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, alignItems: "center", justifyContent: "center" },

  emptyContacts:     { borderRadius: 14, borderWidth: 1, padding: 20, alignItems: "center", gap: 8 },
  emptyContactsText: { fontFamily: "Poppins_400Regular", fontSize: 13, textAlign: "center" },

  fab:    { position: "absolute", left: 16, right: 16 },
  fabBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, borderRadius: 16, paddingVertical: 14,
            shadowColor: "#06B6D4", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 10, elevation: 6 },
  fabText:{ fontFamily: "Poppins_700Bold", fontSize: 14, color: "#fff" },
});
