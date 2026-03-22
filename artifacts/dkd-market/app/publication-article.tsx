import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useTheme } from "@/contexts/ThemeContext";

export default function PublicationArticleScreen() {
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const dBG   = isDark ? "#0D1117" : "#F0F4F8";
  const dCARD = isDark ? "#1C2230" : "#FFFFFF";
  const dTEXT = isDark ? "#FFFFFF" : "#111827";
  const dMUTED = isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.45)";

  return (
    <View style={[styles.container, { backgroundColor: dBG, paddingTop: insets.top }]}>
      <View style={[styles.header, { backgroundColor: dCARD }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={dTEXT} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: dTEXT }]}>Publication article</Text>
      </View>
      <View style={styles.body}>
        <Ionicons name="bag-handle-outline" size={56} color={isDark ? "#2D2D2D" : "#D1D5DB"} />
        <Text style={[styles.emptyTitle, { color: dTEXT }]}>Page en cours de développement</Text>
        <Text style={[styles.emptyDesc, { color: dMUTED }]}>
          Le détail de votre article publié sera disponible ici prochainement.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: 16, paddingVertical: 14,
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 4, elevation: 2,
  },
  backBtn: { padding: 2 },
  title: { fontFamily: "Poppins_700Bold", fontSize: 17 },
  body: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32, gap: 12 },
  emptyTitle: { fontFamily: "Poppins_700Bold", fontSize: 16, textAlign: "center" },
  emptyDesc: { fontFamily: "Poppins_400Regular", fontSize: 13, textAlign: "center", lineHeight: 20 },
});
