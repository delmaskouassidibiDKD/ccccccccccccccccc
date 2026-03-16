import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/contexts/ThemeContext";

export default function EditProductScreen() {
  const { id, productTitle, accentColor } = useLocalSearchParams<{
    id: string;
    productTitle: string;
    accentColor: string;
  }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();

  const ACCENT = accentColor ?? "#FF6B00";
  const dynBG = isDark ? "#0D1117" : "#F0F4FA";
  const dynHeader = isDark ? "#111827" : "#FFFFFF";
  const dynBorder = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.08)";
  const dynText = isDark ? "#F0F0F0" : "#111827";
  const dynSub = isDark ? "#64748B" : "#9CA3AF";
  const paddingBottom = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <View style={[s.root, { backgroundColor: dynBG, paddingTop: insets.top }]}>

      {/* Header */}
      <View style={[s.header, { backgroundColor: dynHeader, borderBottomColor: dynBorder }]}>
        <TouchableOpacity
          style={[s.backBtn, { backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)" }]}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={20} color={isDark ? "#fff" : "#111"} />
        </TouchableOpacity>

        <View style={s.headerCenter}>
          <View style={[s.headerIcon, { backgroundColor: ACCENT + "22" }]}>
            <Ionicons name="create-outline" size={16} color={ACCENT} />
          </View>
          <Text style={[s.headerTitle, { color: dynText }]} numberOfLines={1}>
            {productTitle ?? `Produit #${id}`}
          </Text>
        </View>

        <TouchableOpacity
          style={[s.saveBtn, { backgroundColor: ACCENT }]}
          activeOpacity={0.8}
        >
          <Text style={s.saveBtnText}>Sauvegarder</Text>
        </TouchableOpacity>
      </View>

      {/* Contenu vide — à remplir */}
      <ScrollView
        contentContainerStyle={[s.content, { paddingBottom: paddingBottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[s.emptyCard, { backgroundColor: isDark ? "#161B25" : "#fff", borderColor: dynBorder }]}>
          <Ionicons name="construct-outline" size={44} color={dynSub} />
          <Text style={[s.emptyTitle, { color: dynText }]}>
            Modifier le produit
          </Text>
          <Text style={[s.emptySub, { color: dynSub }]}>
            Les champs de modification pour{"\n"}
            <Text style={{ color: ACCENT, fontFamily: "Poppins_600SemiBold" }}>
              {productTitle ?? `Produit #${id}`}
            </Text>
            {"\n"}apparaîtront ici.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 10,
  },
  backBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    overflow: "hidden",
  },
  headerIcon: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  headerTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 15,
    flexShrink: 1,
  },
  saveBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
  },
  saveBtnText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12,
    color: "#fff",
  },
  content: {
    padding: 16,
    alignItems: "center",
  },
  emptyCard: {
    width: "100%",
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 24,
    gap: 14,
    marginTop: 24,
  },
  emptyTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 18,
    textAlign: "center",
  },
  emptySub: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 22,
  },
});
