import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/contexts/ThemeContext";

export default function ProduitsEnGrosPage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <View style={[styles.iconWrap, { backgroundColor: "#0EA5E920" }]}>
          <Ionicons name="cube-outline" size={20} color="#0EA5E9" />
        </View>
        <Text style={[styles.title, { color: colors.text }]}>Produits en gros</Text>
      </View>
      <View style={styles.body}>
        <Ionicons name="cube-outline" size={60} color={colors.textMuted} />
        <Text style={[styles.comingSoon, { color: colors.textMuted }]}>Bientôt disponible</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 10,
  },
  back: { padding: 4 },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontFamily: "Poppins_700Bold",
    fontSize: 18,
    flex: 1,
  },
  body: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  comingSoon: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
  },
});
