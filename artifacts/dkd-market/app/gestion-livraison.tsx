import React, { useState, useCallback } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useTheme } from "../contexts/ThemeContext";

type DeliveryStatus = "en_cours" | "livre";
type Delivery = {
  id: string; name: string; initials: string; colorHex: string;
  company: string; vehicle: string; stars: number;
  code: string; article: string; price: string; status: DeliveryStatus;
};

const INIT_DELIVERIES: Delivery[] = [
  { id: "d1", name: "Ibrahim Touré",  initials: "IT", colorHex: "#3B82F6", company: "DKD Express",     vehicle: "Moto",    stars: 4.8, code: "",         article: "Sac Louis Vuitton × 2", price: "12 500 FCFA", status: "en_cours" },
  { id: "d2", name: "Seydou Bamba",   initials: "SB", colorHex: "#22C55E", company: "Flash Livraison", vehicle: "Voiture", stars: 4.5, code: "",         article: "Chaussures Nike Air",   price: "8 200 FCFA",  status: "en_cours" },
  { id: "d3", name: "Fatoumata Sy",   initials: "FS", colorHex: "#EC4899", company: "Rapid Courses",   vehicle: "Moto",    stars: 4.9, code: "LIV-2841", article: "Veste en cuir × 3",    price: "25 000 FCFA", status: "livre"    },
];

function StarRow({ stars, numColor }: { stars: number; numColor: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <Ionicons
          key={s}
          name={s <= Math.floor(stars) ? "star" : s - 0.5 <= stars ? "star-half" : "star-outline"}
          size={12}
          color="#F59E0B"
        />
      ))}
      <Text style={{ color: numColor, fontFamily: "Poppins_600SemiBold", fontSize: 11, marginLeft: 4 }}>{stars.toFixed(1)}</Text>
    </View>
  );
}

export default function GestionLivraisonPage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();

  const dBG     = isDark ? "#0D1117" : "#F0F4F8";
  const dHEAD   = isDark ? "#111827" : "#1a1f2e";
  const dCARD   = isDark ? "#161B22" : "#FFFFFF";
  const dCARD2  = isDark ? "#1C2230" : "#F3F4F6";
  const dTEXT   = isDark ? "#FFFFFF" : "#111827";
  const dSUB    = isDark ? "rgba(255,255,255,0.6)"  : "#374151";
  const dMUTED  = isDark ? "rgba(255,255,255,0.38)" : "#9CA3AF";
  const dBORDER = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.08)";

  const [tab,        setTab]        = useState<DeliveryStatus>("en_cours");
  const [deliveries, setDeliveries] = useState<Delivery[]>(INIT_DELIVERIES);
  const [codes,      setCodes]      = useState<Record<string, string>>({});
  const [showTrack,  setShowTrack]  = useState<string | null>(null);

  const enCoursCount = deliveries.filter((d) => d.status === "en_cours").length;
  const livreCount   = deliveries.filter((d) => d.status === "livre").length;
  const filtered     = deliveries.filter((d) => d.status === tab);

  const markDelivered = useCallback((dlId: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setDeliveries((prev) =>
      prev.map((d) => d.id === dlId ? { ...d, status: "livre" as const, code: codes[dlId] || d.code } : d)
    );
  }, [codes]);

  const vehicleIcon = (v: string) =>
    v === "Moto" ? "bicycle-outline" : v === "Voiture" ? "car-outline" : "walk-outline";

  return (
    <View style={[s.root, { paddingTop: insets.top, backgroundColor: dBG }]}>

      {/* HEADER */}
      <View style={[s.header, { backgroundColor: dHEAD, borderBottomColor: "rgba(255,255,255,0.08)" }]}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Gestion de la livraison</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* TABS */}
      <View style={[s.tabsRow, { backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)" }]}>
        <TouchableOpacity
          style={[s.tabBtn, tab === "en_cours" && [s.tabBtnActive, { backgroundColor: dCARD2 }]]}
          onPress={() => { Haptics.selectionAsync(); setTab("en_cours"); }}
          activeOpacity={0.8}
        >
          <Text style={[s.tabBtnText, { color: tab === "en_cours" ? dTEXT : dMUTED }]}>En cours</Text>
          {enCoursCount > 0 && (
            <View style={[s.tabBadge, { backgroundColor: "#3B82F6" }]}>
              <Text style={s.tabBadgeText}>{enCoursCount}</Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.tabBtn, tab === "livre" && [s.tabBtnActive, { backgroundColor: dCARD2 }]]}
          onPress={() => { Haptics.selectionAsync(); setTab("livre"); }}
          activeOpacity={0.8}
        >
          <Text style={[s.tabBtnText, { color: tab === "livre" ? dTEXT : dMUTED }]}>Déjà livré</Text>
          {livreCount > 0 && (
            <View style={[s.tabBadge, { backgroundColor: "#22C55E" }]}>
              <Text style={s.tabBadgeText}>{livreCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* LIST */}
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24 }}>

        {filtered.length === 0 && (
          <View style={s.emptyState}>
            <Ionicons name="bicycle-outline" size={52} color={dMUTED} />
            <Text style={[s.emptyText, { color: dMUTED }]}>
              {tab === "en_cours" ? "Aucune livraison en cours" : "Aucune livraison effectuée"}
            </Text>
          </View>
        )}

        {filtered.map((dl) => (
          <View key={dl.id} style={[s.card, { backgroundColor: dCARD, borderColor: dBORDER }]}>

            {/* LIVREUR ROW */}
            <View style={s.livreurRow}>
              <View style={[s.avatar, { backgroundColor: dl.colorHex + "28" }]}>
                <Text style={[s.avatarText, { color: dl.colorHex }]}>{dl.initials}</Text>
              </View>
              <View style={s.livreurInfo}>
                <Text style={[s.livreurName, { color: dTEXT }]}>{dl.name}</Text>
                <StarRow stars={dl.stars} numColor="#F59E0B" />
                <View style={s.companyRow}>
                  <Ionicons name="business-outline" size={11} color={dMUTED} />
                  <Text style={[s.companyText, { color: dMUTED }]}>{dl.company}</Text>
                </View>
              </View>
              <View style={[s.vehicleTag, { backgroundColor: dl.colorHex + "18", borderColor: dl.colorHex + "33" }]}>
                <Ionicons name={vehicleIcon(dl.vehicle) as any} size={15} color={dl.colorHex} />
                <Text style={[s.vehicleText, { color: dl.colorHex }]}>{dl.vehicle}</Text>
              </View>
            </View>

            {/* ARTICLE ROW */}
            <View style={[s.articleRow, { backgroundColor: dCARD2 }]}>
              <Ionicons name="cube-outline" size={14} color={dMUTED} />
              <Text style={[s.articleText, { color: dSUB }]} numberOfLines={1}>{dl.article}</Text>
              <Text style={s.articlePrice}>{dl.price}</Text>
            </View>

            {/* CODE */}
            {tab === "en_cours" && (
              <View style={[s.codeRow, { backgroundColor: isDark ? "#0D1117" : "#F9FAFB" }]}>
                <Ionicons name="key-outline" size={15} color="#F59E0B" />
                <TextInput
                  style={[s.codeInput, { color: dTEXT }]}
                  placeholder="Code de livraison du livreur..."
                  placeholderTextColor={dMUTED}
                  value={codes[dl.id] ?? dl.code}
                  onChangeText={(v) => setCodes((prev) => ({ ...prev, [dl.id]: v }))}
                />
              </View>
            )}
            {tab === "livre" && dl.code !== "" && (
              <View style={s.codeUsedRow}>
                <Ionicons name="checkmark-circle" size={14} color="#22C55E" />
                <Text style={[s.codeUsedText, { color: dMUTED }]}>Code utilisé : {dl.code}</Text>
              </View>
            )}

            {/* ACTIONS */}
            <View style={s.actionsRow}>
              <TouchableOpacity
                style={[s.actionGhost, { backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)", borderColor: dBORDER }]}
                activeOpacity={0.75}
              >
                <Ionicons name="eye-outline" size={15} color={dSUB} />
                <Text style={[s.actionGhostText, { color: dSUB }]}>Voir</Text>
              </TouchableOpacity>
              {tab === "en_cours" && (
                <>
                  <TouchableOpacity
                    style={[s.actionColor, { backgroundColor: "#3B82F618", borderColor: "#3B82F640" }]}
                    onPress={() => { Haptics.selectionAsync(); setShowTrack(dl.name); }}
                    activeOpacity={0.75}
                  >
                    <Ionicons name="navigate-outline" size={15} color="#3B82F6" />
                    <Text style={[s.actionColorText, { color: "#3B82F6" }]}>Suivre</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[s.actionColor, { backgroundColor: "#22C55E18", borderColor: "#22C55E40" }]}
                    onPress={() => markDelivered(dl.id)}
                    activeOpacity={0.75}
                  >
                    <Ionicons name="checkmark-done-outline" size={15} color="#22C55E" />
                    <Text style={[s.actionColorText, { color: "#22C55E" }]}>Livré</Text>
                  </TouchableOpacity>
                </>
              )}
              {tab === "livre" && (
                <View style={s.livreBadge}>
                  <Ionicons name="checkmark-circle" size={15} color="#22C55E" />
                  <Text style={s.livreBadgeText}>Livraison effectuée</Text>
                </View>
              )}
            </View>
          </View>
        ))}
      </ScrollView>

      {/* TRACKING MODAL */}
      <Modal visible={!!showTrack} animationType="fade" transparent statusBarTranslucent onRequestClose={() => setShowTrack(null)}>
        <View style={tm.overlay}>
          <View style={[tm.box, { backgroundColor: isDark ? "#161B22" : "#FFFFFF" }]}>
            <View style={tm.header}>
              <Ionicons name="navigate-circle-outline" size={28} color="#3B82F6" />
              <Text style={[tm.title, { color: dTEXT }]}>Suivi — {showTrack}</Text>
              <TouchableOpacity onPress={() => setShowTrack(null)} activeOpacity={0.7}>
                <Ionicons name="close" size={20} color={dMUTED} />
              </TouchableOpacity>
            </View>
            <View style={[tm.mapZone, { backgroundColor: isDark ? "#0D1117" : "#F3F4F6" }]}>
              <Ionicons name="location" size={40} color="#3B82F6" />
              <Text style={[tm.mapText, { color: dMUTED }]}>Position en cours de localisation...</Text>
              <View style={tm.pulse} />
            </View>
            <View style={tm.statusRow}>
              <View style={tm.statusDot} />
              <Text style={tm.statusText}>En route · Estimée dans 12 min</Text>
            </View>
            <TouchableOpacity style={[tm.closeBtn, { backgroundColor: isDark ? "#1C2230" : "#F3F4F6" }]} onPress={() => setShowTrack(null)} activeOpacity={0.85}>
              <Text style={[tm.closeBtnText, { color: dTEXT }]}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 12, paddingVertical: 12, borderBottomWidth: 1 },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { color: "#fff", fontFamily: "Poppins_700Bold", fontSize: 17 },
  tabsRow: { flexDirection: "row", margin: 16, marginBottom: 8, borderRadius: 14, padding: 4, gap: 4 },
  tabBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10, borderRadius: 11 },
  tabBtnActive: {},
  tabBtnText: { fontFamily: "Poppins_600SemiBold", fontSize: 13 },
  tabBadge: { borderRadius: 9, paddingHorizontal: 6, paddingVertical: 1 },
  tabBadgeText: { color: "#fff", fontFamily: "Poppins_700Bold", fontSize: 10 },
  emptyState: { alignItems: "center", paddingTop: 80, gap: 14 },
  emptyText: { fontFamily: "Poppins_400Regular", fontSize: 14 },
  card: { borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 1, gap: 12 },
  livreurRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  avatar: { width: 52, height: 52, borderRadius: 26, alignItems: "center", justifyContent: "center" },
  avatarText: { fontFamily: "Poppins_700Bold", fontSize: 18 },
  livreurInfo: { flex: 1, gap: 4 },
  livreurName: { fontFamily: "Poppins_700Bold", fontSize: 15 },
  companyRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  companyText: { fontFamily: "Poppins_400Regular", fontSize: 11 },
  vehicleTag: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, borderWidth: 1 },
  vehicleText: { fontFamily: "Poppins_600SemiBold", fontSize: 12 },
  articleRow: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10 },
  articleText: { flex: 1, fontFamily: "Poppins_400Regular", fontSize: 13 },
  articlePrice: { color: "#FF6B00", fontFamily: "Poppins_700Bold", fontSize: 14 },
  codeRow: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1, borderColor: "rgba(245,158,11,0.25)" },
  codeInput: { flex: 1, fontFamily: "Poppins_400Regular", fontSize: 13 },
  codeUsedRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  codeUsedText: { fontFamily: "Poppins_400Regular", fontSize: 12 },
  actionsRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  actionGhost: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10, borderWidth: 1 },
  actionGhostText: { fontFamily: "Poppins_600SemiBold", fontSize: 12 },
  actionColor: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10, borderWidth: 1 },
  actionColorText: { fontFamily: "Poppins_600SemiBold", fontSize: 12 },
  livreBadge: { flexDirection: "row", alignItems: "center", gap: 6 },
  livreBadgeText: { color: "#22C55E", fontFamily: "Poppins_600SemiBold", fontSize: 12 },
});

const tm = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.75)", alignItems: "center", justifyContent: "center", padding: 24 },
  box: { borderRadius: 22, padding: 22, width: "100%", gap: 16 },
  header: { flexDirection: "row", alignItems: "center", gap: 10 },
  title: { flex: 1, fontFamily: "Poppins_700Bold", fontSize: 15 },
  mapZone: { height: 170, borderRadius: 16, alignItems: "center", justifyContent: "center", gap: 10 },
  mapText: { fontFamily: "Poppins_400Regular", fontSize: 12 },
  pulse: { width: 18, height: 18, borderRadius: 9, backgroundColor: "rgba(59,130,246,0.3)" },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#22C55E" },
  statusText: { color: "#22C55E", fontFamily: "Poppins_600SemiBold", fontSize: 13 },
  closeBtn: { borderRadius: 12, paddingVertical: 13, alignItems: "center" },
  closeBtnText: { fontFamily: "Poppins_700Bold", fontSize: 14 },
});
