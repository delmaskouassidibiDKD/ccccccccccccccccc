import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/contexts/ThemeContext";

const ACCENT = "#06B6D4";

export default function RayonsPersonnalisationPage() {
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
        <View style={s.headerCenter}>
          <View style={[s.headerIcon, { backgroundColor: ACCENT + "22" }]}>
            <Ionicons name="color-palette-outline" size={16} color={ACCENT} />
          </View>
          <Text style={[s.headerTitle, { color: dynText }]}>Personnalisation</Text>
        </View>
        <View style={{ width: 32 }} />
      </View>

      <View style={s.center}>
        <View style={[s.emptyIcon, { backgroundColor: ACCENT + "18" }]}>
          <Ionicons name="color-palette-outline" size={40} color={ACCENT} />
        </View>
        <Text style={[s.emptyTitle, { color: dynText }]}>Bientôt disponible</Text>
        <Text style={[s.emptySub, { color: dynSub }]}>
          La section Personnalisation est en cours de préparation.
        </Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root:         { flex: 1 },
  header:       { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, gap: 10 },
  backBtn:      { width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  headerCenter: { flex: 1, flexDirection: "row", alignItems: "center", gap: 10 },
  headerIcon:   { width: 30, height: 30, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  headerTitle:  { fontFamily: "Poppins_700Bold", fontSize: 17 },
  center:       { flex: 1, alignItems: "center", justifyContent: "center", gap: 14 },
  emptyIcon:    { width: 80, height: 80, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  emptyTitle:   { fontFamily: "Poppins_700Bold", fontSize: 18 },
  emptySub:     { fontFamily: "Poppins_400Regular", fontSize: 13, textAlign: "center", paddingHorizontal: 40 },
});
