import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";

export default function FavorisArticlesTab() {
  const { isAuthenticated } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();

  const { data: wishlist, isLoading } = useQuery<any[]>({
    queryKey: ["/api/users/me/wishlist"],
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 5,
  });

  const items = wishlist ?? [];

  return (
    <View style={{ flex: 1 }}>
      {!isAuthenticated && (
        <View style={[styles.emptyState]}>
          <Ionicons name="log-in-outline" size={56} color={colors.textMuted} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>Connectez-vous</Text>
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>Connectez-vous pour voir vos articles favoris</Text>
          <TouchableOpacity style={[styles.emptyBtn, { backgroundColor: colors.primary }]} onPress={() => router.push("/auth/login" as any)}>
            <Text style={styles.emptyBtnText}>Se connecter</Text>
          </TouchableOpacity>
        </View>
      )}
      {isAuthenticated && isLoading && (
        <View style={styles.emptyState}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}
      {isAuthenticated && !isLoading && items.length === 0 && (
        <View style={styles.emptyState}>
          <Ionicons name="bookmark-outline" size={56} color={colors.textMuted} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>Aucun article favori</Text>
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>Sauvegardez des articles pour les retrouver ici</Text>
          <TouchableOpacity style={[styles.emptyBtn, { backgroundColor: colors.primary }]} onPress={() => router.push("/(tabs)/rayons" as any)}>
            <Text style={styles.emptyBtnText}>Explorer les rayons</Text>
          </TouchableOpacity>
        </View>
      )}
      {isAuthenticated && !isLoading && items.length > 0 && (
        <FlatList
          data={items}
          keyExtractor={(item: any) => item.id?.toString()}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.card, { backgroundColor: colors.backgroundCard, borderColor: colors.border }]}
              onPress={() => router.push(`/product/${item.product_id ?? item.id}` as any)}
            >
              <View style={[styles.thumb, { backgroundColor: colors.surface }]}>
                <Ionicons name="bag-outline" size={22} color={colors.primary} />
              </View>
              <View style={styles.info}>
                <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>{item.product_name ?? item.name ?? "Article"}</Text>
                <Text style={[styles.price, { color: colors.primary }]}>{item.price?.toLocaleString()} {item.currency_code ?? "XOF"}</Text>
              </View>
              <Ionicons name="heart" size={20} color="#FF3B5C" />
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  emptyState: { alignItems: "center", paddingTop: 60, gap: 12, paddingHorizontal: 32 },
  emptyTitle: { fontFamily: "Poppins_700Bold", fontSize: 18, textAlign: "center" },
  emptyText: { fontFamily: "Poppins_400Regular", fontSize: 13, textAlign: "center", lineHeight: 20 },
  emptyBtn: { paddingHorizontal: 28, paddingVertical: 14, borderRadius: 12, marginTop: 8 },
  emptyBtnText: { color: "#fff", fontFamily: "Poppins_700Bold", fontSize: 14 },
  list: { padding: 16, gap: 10 },
  card: { flexDirection: "row", alignItems: "center", borderRadius: 12, overflow: "hidden", borderWidth: 1 },
  thumb: { width: 80, height: 70, alignItems: "center", justifyContent: "center" },
  info: { flex: 1, padding: 10 },
  price: { fontFamily: "Poppins_600SemiBold", fontSize: 11, marginBottom: 2 },
  name: { fontFamily: "Poppins_500Medium", fontSize: 13, marginBottom: 4 },
});
