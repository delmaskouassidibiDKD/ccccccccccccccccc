import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  TextInput,
  Animated,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/contexts/ThemeContext";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

const FOOD_CATEGORIES = [
  { id: 0,   name: "Perfectionner mon plat", icon: "sparkles-outline",     color: "#FF6B00", special: true },
  { id: 1,   name: "Alimentation",            icon: "basket-outline",       color: "#22C55E" },
  { id: 2,   name: "Épicerie Sèche",          icon: "nutrition-outline",    color: "#F59E0B" },
  { id: 3,   name: "Produits Frais",          icon: "snow-outline",         color: "#3B82F6" },
  { id: 4,   name: "Boucherie & Poisson",     icon: "fish-outline",         color: "#EF4444" },
  { id: 5,   name: "Boissons",                icon: "wine-outline",         color: "#8B5CF6" },
  { id: 6,   name: "Petit-déjeuner",          icon: "cafe-outline",         color: "#F59E0B" },
  { id: 7,   name: "Snacks & Plaisirs",       icon: "fast-food-outline",    color: "#FF6B00" },
  { id: 23,  name: "Alimentation Bébé",       icon: "happy-outline",        color: "#A78BFA" },
  { id: 145, name: "Bio & Naturel",           icon: "leaf-outline",         color: "#10B981" },
  { id: 149, name: "Halal",                   icon: "moon-outline",         color: "#10B981" },
];

function ProductCard({ item, colors }: { item: any; colors: any }) {
  const router = useRouter();
  const images = item.images ? item.images.split(",") : [];
  const imageUri = images[0] || null;
  const discount = item.original_price
    ? Math.round(((item.original_price - item.price) / item.original_price) * 100)
    : 0;

  return (
    <TouchableOpacity
      style={[styles.productCard, { backgroundColor: colors.backgroundCard, borderColor: colors.border }]}
      activeOpacity={0.8}
      onPress={() => router.push(`/product/${item.id}` as any)}
    >
      {imageUri ? (
        <Image source={{ uri: imageUri }} style={[styles.productImage, { backgroundColor: colors.surface }] as any} />
      ) : (
        <View style={[styles.productImage, styles.productImageEmpty, { backgroundColor: colors.surface }]}>
          <Ionicons name="fast-food-outline" size={28} color={colors.textMuted} />
        </View>
      )}
      {discount > 0 && (
        <View style={[styles.badge, { backgroundColor: "#EF4444" }]}>
          <Text style={styles.badgeText}>-{discount}%</Text>
        </View>
      )}
      <View style={styles.productInfo}>
        <Text style={[styles.productName, { color: colors.text }]} numberOfLines={2}>{item.name}</Text>
        <Text style={[styles.productPrice, { color: colors.primary }]}>
          {item.price?.toLocaleString()} {item.currency_code || "XOF"}
        </Text>
        {item.shop_name && (
          <Text style={[styles.shopName, { color: colors.textMuted }]} numberOfLines={1}>{item.shop_name}</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

function BlinkingChip({ cat, selected, onPress, colors }: { cat: typeof FOOD_CATEGORIES[0]; selected: boolean; onPress: () => void; colors: any }) {
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.5, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.75}>
      <Animated.View
        style={[
          styles.chip,
          selected
            ? { backgroundColor: cat.color, borderColor: cat.color }
            : { backgroundColor: cat.color + "25", borderColor: cat.color + "80" },
          { opacity },
        ]}
      >
        <Ionicons name={cat.icon as any} size={12} color={selected ? "#fff" : cat.color} />
        <Text style={[styles.chipText, { color: selected ? "#fff" : cat.color }]}>{cat.name}</Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

function NormalChip({ cat, selected, onPress, colors }: { cat: typeof FOOD_CATEGORIES[0]; selected: boolean; onPress: () => void; colors: any }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={[
        styles.chip,
        selected
          ? { backgroundColor: cat.color, borderColor: cat.color }
          : { backgroundColor: cat.color + "18", borderColor: cat.color + "50" },
      ]}
    >
      <Ionicons name={cat.icon as any} size={12} color={selected ? "#fff" : cat.color} />
      <Text style={[styles.chipText, { color: selected ? "#fff" : cat.color }]}>{cat.name}</Text>
    </TouchableOpacity>
  );
}

export default function MesPlatsPage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const [selectedCat, setSelectedCat] = useState(FOOD_CATEGORIES[1]);
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const searchAnim = useRef(new Animated.Value(0)).current;
  const bottomPadding = Platform.OS === "web" ? 34 : 90;

  const toggleSearch = () => {
    if (searchOpen) {
      setSearch("");
      Animated.timing(searchAnim, { toValue: 0, duration: 200, useNativeDriver: false }).start(() => setSearchOpen(false));
    } else {
      setSearchOpen(true);
      Animated.timing(searchAnim, { toValue: 1, duration: 200, useNativeDriver: false }).start();
    }
  };

  const searchHeight = searchAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 52] });
  const searchOpacity = searchAnim;

  const { data: products, isLoading, isError, refetch } = useQuery({
    queryKey: ["/api/categories", selectedCat.id, "products"],
    queryFn: () => selectedCat.id === 0 ? Promise.resolve([]) : api.categories.getProducts(selectedCat.id),
    enabled: selectedCat.id !== 0,
    staleTime: 1000 * 60 * 5,
  });

  const filtered = search.trim()
    ? (products || []).filter((p: any) => p.name.toLowerCase().includes(search.toLowerCase()))
    : (products || []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top + (Platform.OS === "web" ? 0 : 0) }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <View style={[styles.headerIcon, { backgroundColor: "#F9731620" }]}>
          <Ionicons name="restaurant-outline" size={18} color="#F97316" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Mes plats</Text>
          <Text style={[styles.headerSub, { color: colors.textMuted }]}>{selectedCat.name}</Text>
        </View>
        <TouchableOpacity onPress={toggleSearch} style={styles.loupeBtn}>
          <Ionicons name={searchOpen ? "close-circle" : "search"} size={22} color={searchOpen ? colors.primary : colors.text} />
        </TouchableOpacity>
      </View>

      <Animated.View style={[styles.searchBarWrap, { height: searchHeight, opacity: searchOpacity, borderBottomColor: colors.border }]}>
        <View style={[styles.searchBar, { backgroundColor: colors.backgroundCard, borderColor: colors.primary + "60" }]}>
          <Ionicons name="search" size={16} color={colors.primary} />
          <TextInput
            autoFocus={searchOpen}
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Rechercher un plat..."
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>

      <FlatList
        data={FOOD_CATEGORIES}
        keyExtractor={(c) => c.id.toString()}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipsList}
        contentContainerStyle={styles.chips}
        renderItem={({ item }) =>
          item.special ? (
            <BlinkingChip
              cat={item}
              selected={selectedCat.id === item.id}
              onPress={() => setSelectedCat(item)}
              colors={colors}
            />
          ) : (
            <NormalChip
              cat={item}
              selected={selectedCat.id === item.id}
              onPress={() => setSelectedCat(item)}
              colors={colors}
            />
          )
        }
      />

      {selectedCat.id === 0 ? (
        <View style={styles.center}>
          <Ionicons name="sparkles-outline" size={52} color="#FF6B00" />
          <Text style={[styles.emptyText, { color: colors.text }]}>Perfectionner mon plat</Text>
          <Text style={[styles.emptySub, { color: colors.textMuted }]}>Fonctionnalité bientôt disponible</Text>
        </View>
      ) : isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : isError ? (
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
          <Text style={[styles.emptyText, { color: colors.text }]}>Erreur de chargement</Text>
          <TouchableOpacity style={[styles.retryBtn, { backgroundColor: colors.primary }]} onPress={() => refetch()}>
            <Text style={styles.retryText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="fast-food-outline" size={52} color={colors.textMuted} />
          <Text style={[styles.emptyText, { color: colors.text }]}>Aucun plat disponible</Text>
          <Text style={[styles.emptySub, { color: colors.textMuted }]}>
            {search ? "Aucun résultat" : "Soyez le premier à publier ici"}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item: any) => item.id.toString()}
          numColumns={2}
          columnWrapperStyle={styles.productRow}
          contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: bottomPadding, paddingTop: 8 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => <ProductCard item={item} colors={colors} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    gap: 8,
  },
  back: { padding: 4 },
  headerIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontFamily: "Poppins_700Bold", fontSize: 15 },
  headerSub: { fontFamily: "Poppins_400Regular", fontSize: 10 },
  loupeBtn: { padding: 6 },
  searchBarWrap: {
    overflow: "hidden",
    borderBottomWidth: 1,
    paddingHorizontal: 14,
    justifyContent: "center",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginVertical: 6,
  },
  searchInput: { fontFamily: "Poppins_400Regular", fontSize: 13, flex: 1 },
  chipsList: {
    flexGrow: 0,
    flexShrink: 0,
  },
  chips: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
    alignItems: "flex-start",
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: { fontFamily: "Poppins_600SemiBold", fontSize: 11 },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingTop: 40,
  },
  emptyText: { fontFamily: "Poppins_600SemiBold", fontSize: 16 },
  emptySub: { fontFamily: "Poppins_400Regular", fontSize: 13 },
  retryBtn: { marginTop: 8, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 10 },
  retryText: { color: "#fff", fontFamily: "Poppins_600SemiBold", fontSize: 14 },
  productRow: { gap: 10, marginBottom: 10 },
  productCard: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
  },
  productImage: { width: "100%", height: 110 },
  productImageEmpty: { alignItems: "center", justifyContent: "center" },
  badge: {
    position: "absolute",
    top: 7,
    left: 7,
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  badgeText: { color: "#fff", fontFamily: "Poppins_700Bold", fontSize: 9 },
  productInfo: { padding: 8, gap: 2 },
  productName: { fontFamily: "Poppins_600SemiBold", fontSize: 11, lineHeight: 15 },
  productPrice: { fontFamily: "Poppins_700Bold", fontSize: 12 },
  shopName: { fontFamily: "Poppins_400Regular", fontSize: 9 },
});
