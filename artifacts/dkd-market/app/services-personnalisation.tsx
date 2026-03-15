import React, { useState, useEffect } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  FlatList, KeyboardAvoidingView, Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/contexts/ThemeContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";

const ACCENT = "#06B6D4";
const SERVICES_KEY = "@dkd:personnalisation_services";

type Service = {
  id: string;
  label: string;
  active: boolean;
  createdAt: string;
};

export default function ServicesPersonnalisationPage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();

  const dynBG     = isDark ? "#0D1117" : "#F0F4FA";
  const dynCARD   = isDark ? "#161B25" : "#FFFFFF";
  const dynText   = isDark ? "#F0F6FF" : "#1A1A1A";
  const dynSub    = isDark ? "#64748B" : "#6B7280";
  const dynBorder = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.08)";
  const dynHeader = isDark ? "#111827" : "#FFFFFF";
  const dynInput  = isDark ? "#1E293B" : "#F8FAFC";

  const [services,    setServices]    = useState<Service[]>([]);
  const [showInput,   setShowInput]   = useState(false);
  const [inputValue,  setInputValue]  = useState("");

  useEffect(() => {
    AsyncStorage.getItem(SERVICES_KEY).then((raw) => {
      if (raw) setServices(JSON.parse(raw));
    });
  }, []);

  const persist = (list: Service[]) => {
    AsyncStorage.setItem(SERVICES_KEY, JSON.stringify(list));
  };

  const handleAdd = () => {
    const label = inputValue.trim();
    if (!label) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const newService: Service = {
      id: `svc_${Date.now()}`,
      label,
      active: true,
      createdAt: new Date().toLocaleDateString("fr-FR"),
    };
    const updated = [...services, newService];
    setServices(updated);
    persist(updated);
    setInputValue("");
    setShowInput(false);
  };

  const handleDelete = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const updated = services.filter((s) => s.id !== id);
    setServices(updated);
    persist(updated);
  };

  const handleToggleActive = (id: string) => {
    Haptics.selectionAsync();
    const updated = services.map((s) =>
      s.id === id ? { ...s, active: !s.active } : s
    );
    setServices(updated);
    persist(updated);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={[s.root, { backgroundColor: dynBG }]}>

        {/* HEADER */}
        <View style={[s.header, { paddingTop: insets.top + 10, backgroundColor: dynHeader, borderBottomColor: dynBorder }]}>
          <TouchableOpacity style={s.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={22} color={dynText} />
          </TouchableOpacity>
          <View style={s.headerCenter}>
            <View style={[s.headerIcon, { backgroundColor: ACCENT + "20" }]}>
              <Ionicons name="grid-outline" size={16} color={ACCENT} />
            </View>
            <View>
              <Text style={[s.headerTitle, { color: dynText }]}>Mes services</Text>
              <Text style={[s.headerSub, { color: dynSub }]}>{services.length} service{services.length > 1 ? "s" : ""} enregistré{services.length > 1 ? "s" : ""}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={[s.addBtn, { backgroundColor: ACCENT }]}
            onPress={() => { Haptics.selectionAsync(); setShowInput(true); setInputValue(""); }}
            activeOpacity={0.85}
          >
            <Ionicons name="add" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* INPUT ZONE */}
        {showInput && (
          <View style={[s.inputZone, { backgroundColor: dynCARD, borderColor: ACCENT + "44" }]}>
            <View style={[s.inputRow, { backgroundColor: dynInput, borderColor: ACCENT + "66" }]}>
              <Ionicons name="construct-outline" size={16} color={ACCENT} />
              <TextInput
                style={[s.textInput, { color: dynText }]}
                placeholder="Ex: Broderie personnalisée, Retouche robe..."
                placeholderTextColor={dynSub}
                value={inputValue}
                onChangeText={setInputValue}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={handleAdd}
              />
              <TouchableOpacity onPress={() => setShowInput(false)}>
                <Ionicons name="close-circle" size={18} color={dynSub} />
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={[s.validateBtn, { backgroundColor: inputValue.trim() ? ACCENT : dynBorder }]}
              onPress={handleAdd}
              disabled={!inputValue.trim()}
              activeOpacity={0.85}
            >
              <Ionicons name="checkmark-circle-outline" size={17} color="#fff" />
              <Text style={s.validateBtnText}>Valider</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* EMPTY STATE */}
        {services.length === 0 && !showInput ? (
          <View style={s.empty}>
            <View style={[s.emptyIcon, { backgroundColor: ACCENT + "18" }]}>
              <Ionicons name="grid-outline" size={36} color={ACCENT} />
            </View>
            <Text style={[s.emptyTitle, { color: dynText }]}>Aucun service listé</Text>
            <Text style={[s.emptySub, { color: dynSub }]}>
              Appuyez sur le bouton "+" pour ajouter votre premier service.
            </Text>
            <TouchableOpacity
              style={[s.emptyBtn, { backgroundColor: ACCENT }]}
              onPress={() => { Haptics.selectionAsync(); setShowInput(true); }}
              activeOpacity={0.85}
            >
              <Ionicons name="add-circle-outline" size={17} color="#fff" />
              <Text style={s.emptyBtnText}>Lister votre service</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={services}
            keyExtractor={(s) => s.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ padding: 14, gap: 10, paddingBottom: insets.bottom + 30 }}
            ListHeaderComponent={
              services.length > 0 ? (
                <TouchableOpacity
                  style={[s.addServiceBtn, { borderColor: ACCENT + "55", backgroundColor: ACCENT + "10" }]}
                  onPress={() => { Haptics.selectionAsync(); setShowInput(true); setInputValue(""); }}
                  activeOpacity={0.8}
                >
                  <Ionicons name="add-circle-outline" size={18} color={ACCENT} />
                  <Text style={[s.addServiceBtnText, { color: ACCENT }]}>Lister un autre service</Text>
                </TouchableOpacity>
              ) : null
            }
            renderItem={({ item }) => (
              <View style={[s.serviceCard, { backgroundColor: dynCARD, borderColor: item.active ? ACCENT + "55" : dynBorder }]}>
                <View style={[s.serviceStatus, { backgroundColor: item.active ? "#22C55E" : "#94A3B8" }]} />
                <View style={[s.serviceIconWrap, { backgroundColor: item.active ? ACCENT + "18" : (isDark ? "#1E293B" : "#F1F5F9") }]}>
                  <Ionicons name="construct-outline" size={20} color={item.active ? ACCENT : dynSub} />
                </View>
                <View style={s.serviceInfo}>
                  <Text style={[s.serviceLabel, { color: dynText }]}>{item.label}</Text>
                  <View style={s.serviceMetaRow}>
                    <View style={[s.activePill, { backgroundColor: item.active ? "#22C55E18" : (isDark ? "#1E293B" : "#F1F5F9") }]}>
                      <View style={[s.activeDot, { backgroundColor: item.active ? "#22C55E" : "#94A3B8" }]} />
                      <Text style={[s.activeText, { color: item.active ? "#22C55E" : dynSub }]}>
                        {item.active ? "Actif" : "Inactif"}
                      </Text>
                    </View>
                    <Text style={[s.serviceDate, { color: dynSub }]}>Ajouté le {item.createdAt}</Text>
                  </View>
                </View>
                <View style={s.serviceActions}>
                  <TouchableOpacity
                    style={[s.toggleBtn, { backgroundColor: item.active ? "#22C55E18" : (isDark ? "#1E293B" : "#F1F5F9") }]}
                    onPress={() => handleToggleActive(item.id)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name={item.active ? "pause-circle-outline" : "play-circle-outline"} size={18} color={item.active ? "#22C55E" : dynSub} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[s.deleteBtn, { backgroundColor: "#EF444418" }]}
                    onPress={() => handleDelete(item.id)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="trash-outline" size={18} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          />
        )}
      </View>
    </KeyboardAvoidingView>
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
  addBtn:       { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },

  inputZone:    { margin: 14, borderRadius: 16, borderWidth: 1.5, padding: 14, gap: 10 },
  inputRow:     { flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 12, borderWidth: 1.5, paddingHorizontal: 12, paddingVertical: 10 },
  textInput:    { flex: 1, fontFamily: "Poppins_400Regular", fontSize: 13, padding: 0 },
  validateBtn:  { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, borderRadius: 12, paddingVertical: 12 },
  validateBtnText: { fontFamily: "Poppins_700Bold", fontSize: 14, color: "#fff" },

  empty:      { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, paddingHorizontal: 40 },
  emptyIcon:  { width: 80, height: 80, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  emptyTitle: { fontFamily: "Poppins_700Bold", fontSize: 17 },
  emptySub:   { fontFamily: "Poppins_400Regular", fontSize: 13, textAlign: "center", lineHeight: 20 },
  emptyBtn:   { flexDirection: "row", alignItems: "center", gap: 7, borderRadius: 14, paddingHorizontal: 20, paddingVertical: 12, marginTop: 4 },
  emptyBtnText: { fontFamily: "Poppins_700Bold", fontSize: 14, color: "#fff" },

  addServiceBtn:     { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 12, borderWidth: 1.5, paddingVertical: 12, marginBottom: 4 },
  addServiceBtnText: { fontFamily: "Poppins_600SemiBold", fontSize: 13 },

  serviceCard:    { flexDirection: "row", alignItems: "center", borderRadius: 14, borderWidth: 1, overflow: "hidden", padding: 12, gap: 10 },
  serviceStatus:  { position: "absolute", left: 0, top: 0, bottom: 0, width: 4 },
  serviceIconWrap:{ width: 42, height: 42, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  serviceInfo:    { flex: 1, gap: 4 },
  serviceLabel:   { fontFamily: "Poppins_700Bold", fontSize: 14 },
  serviceMetaRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  activePill:     { flexDirection: "row", alignItems: "center", gap: 5, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  activeDot:      { width: 6, height: 6, borderRadius: 3 },
  activeText:     { fontFamily: "Poppins_600SemiBold", fontSize: 11 },
  serviceDate:    { fontFamily: "Poppins_400Regular", fontSize: 11 },
  serviceActions: { flexDirection: "row", gap: 6 },
  toggleBtn:      { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  deleteBtn:      { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },
});
