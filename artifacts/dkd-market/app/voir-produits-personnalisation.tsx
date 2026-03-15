import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/contexts/ThemeContext";

const ACCENT = "#06B6D4";

export default function VoirProduitsPersonnalisationPage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();

  const dynBG     = isDark ? "#0D1117" : "#F0F4FA";
  const dynText   = isDark ? "#F0F6FF" : "#1A1A1A";
  const dynSub    = isDark ? "#64748B" : "#6B7280";
  const dynBorder = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.08)";
  const dynHeader = isDark ? "#111827" : "#FFFFFF";

  return (
    <View style={[s.root, { backgroundColor: dynBG, paddingTop: insets.top }]}>
      <View style={[s.header, { backgroundColor: dynHeader, borderBottomColor: dynBorder }]}>
        <TouchableOpacity
          style={[s.backBtn, { backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)" }]}
          onPress={() => router.back()} activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={20} color={dynText} />
        </TouchableOpacity>
        <Text style={[s.headerTitle, { color: dynText }]}>Mes produits</Text>
        <View style={{ width: 32 }} />
      </View>
      <View style={s.center}>
        <View style={[s.icon, { backgroundColor: ACCENT + "18" }]}>
          <Ionicons name="cube-outline" size={36} color={ACCENT} />
        </View>
        <Text style={[s.title, { color: dynText }]}>Bientôt disponible</Text>
        <Text style={[s.sub, { color: dynSub }]}>Vos produits publiés s'afficheront ici.</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root:        { flex: 1 },
  header:      { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, gap: 10 },
  backBtn:     { width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  headerTitle: { flex: 1, fontFamily: "Poppins_700Bold", fontSize: 17 },
  center:      { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  icon:        { width: 72, height: 72, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  title:       { fontFamily: "Poppins_700Bold", fontSize: 17 },
  sub:         { fontFamily: "Poppins_400Regular", fontSize: 13, textAlign: "center", paddingHorizontal: 40 },
});
