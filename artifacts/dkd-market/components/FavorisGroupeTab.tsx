import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/contexts/ThemeContext";
import { useCart } from "@/contexts/CartContext";

export default function FavorisGroupeTab() {
  const { groupMessages } = useCart();
  const { colors } = useTheme();
  const router = useRouter();

  if (!groupMessages || groupMessages.length === 0) {
    return (
      <View style={[styles.tabContent, styles.emptyState]}>
        <Ionicons name="people-outline" size={56} color={colors.textMuted} />
        <Text style={[styles.emptyTitle, { color: colors.text }]}>Aucun groupe favori</Text>
        <Text style={[styles.emptyText, { color: colors.textMuted }]}>Rejoignez des groupes d'achats pour les retrouver ici</Text>
        <TouchableOpacity style={[styles.emptyBtn, { backgroundColor: "#6366F1" }]} onPress={() => router.push("/(tabs)/groupe" as any)}>
          <Text style={styles.emptyBtnText}>Voir les groupes</Text>
        </TouchableOpacity>
      </View>
    );
  }
  return (
    <FlatList
      data={groupMessages}
      keyExtractor={(item: any) => item.id?.toString()}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.tabContent}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={[styles.favoriteCard, { backgroundColor: colors.backgroundCard, borderColor: colors.border }]}
          onPress={() => router.push("/(tabs)/groupe" as any)}
        >
          <View style={[styles.favoriteThumb, { backgroundColor: "#6366F118" }]}>
            <Ionicons name="people-outline" size={22} color="#6366F1" />
          </View>
          <View style={styles.favoriteInfo}>
            <Text style={[styles.favoriteTitle, { color: colors.text }]} numberOfLines={1}>{item.groupName}</Text>
            <Text style={[styles.favoriteSeller, { color: colors.textMuted }]} numberOfLines={1}>{item.lastMessage}</Text>
          </View>
          <Ionicons name="heart" size={20} color="#FF3B5C" />
        </TouchableOpacity>
      )}
    />
  );
}

const styles = StyleSheet.create({
  tabContent: { padding: 16, gap: 10 },
  emptyState: { alignItems: "center", paddingTop: 60, gap: 12, paddingHorizontal: 32 },
  emptyTitle: { fontFamily: "Poppins_700Bold", fontSize: 18, textAlign: "center" },
  emptyText: { fontFamily: "Poppins_400Regular", fontSize: 13, textAlign: "center", lineHeight: 20 },
  emptyBtn: { paddingHorizontal: 28, paddingVertical: 14, borderRadius: 12, marginTop: 8 },
  emptyBtnText: { color: "#fff", fontFamily: "Poppins_700Bold", fontSize: 14 },
  favoriteCard: { flexDirection: "row", alignItems: "center", borderRadius: 12, overflow: "hidden", borderWidth: 1 },
  favoriteThumb: { width: 80, height: 70, alignItems: "center", justifyContent: "center" },
  favoriteInfo: { flex: 1, padding: 10 },
  favoriteSeller: { fontFamily: "Poppins_600SemiBold", fontSize: 11, marginBottom: 2 },
  favoriteTitle: { fontFamily: "Poppins_500Medium", fontSize: 13, marginBottom: 4 },
});
