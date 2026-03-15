import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  ScrollView,
  Platform,
  ActivityIndicator,
  Image,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { api, Product } from "@/lib/api";
import { useTheme } from "@/contexts/ThemeContext";
import { useLanguage } from "@/contexts/LanguageContext";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = (SCREEN_WIDTH - 48) / 2;

const ALL_COUNTRIES = [
  { flag: "🇨🇮", code: "CI", name: "Côte d'Ivoire" },
  { flag: "🇸🇳", code: "SN", name: "Sénégal" },
  { flag: "🇧🇯", code: "BJ", name: "Bénin" },
  { flag: "🇹🇬", code: "TG", name: "Togo" },
  { flag: "🇨🇲", code: "CM", name: "Cameroun" },
  { flag: "🇲🇱", code: "ML", name: "Mali" },
  { flag: "🇧🇫", code: "BF", name: "Burkina Faso" },
  { flag: "🇬🇳", code: "GN", name: "Guinée" },
  { flag: "🇨🇬", code: "CG", name: "Congo" },
  { flag: "🇬🇦", code: "GA", name: "Gabon" },
  { flag: "🇳🇪", code: "NE", name: "Niger" },
  { flag: "🇨🇩", code: "CD", name: "RDC" },
  { flag: "🇲🇬", code: "MG", name: "Madagascar" },
  { flag: "🇨🇫", code: "CF", name: "Centrafrique" },
  { flag: "🇹🇩", code: "TD", name: "Tchad" },
];

type SortKey = "featured" | "price_asc" | "price_desc" | "popular";

const SORT_OPTIONS: { key: SortKey; label: string; icon: string }[] = [
  { key: "featured", label: "Pertinence", icon: "star-outline" },
  { key: "price_asc", label: "Prix ↑", icon: "trending-up-outline" },
  { key: "price_desc", label: "Prix ↓", icon: "trending-down-outline" },
  { key: "popular", label: "Populaire", icon: "flame-outline" },
];

function getFirstImage(images: string): string | null {
  try {
    const parsed = JSON.parse(images);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed[0];
  } catch {}
  if (images && images.startsWith("http")) return images;
  return null;
}

function formatPrice(price: number, currency?: string): string {
  return `${Math.round(price).toLocaleString("fr-FR")} ${currency || "FCFA"}`;
}

function ProductCard({ item, viewMode }: { item: Product; viewMode: "grid" | "list" }) {
  const { colors } = useTheme();
  const imageUrl = getFirstImage(item.images);
  const hasDiscount = item.original_price && item.original_price > item.price;
  const discountPct = hasDiscount
    ? Math.round(((item.original_price! - item.price) / item.original_price!) * 100)
    : 0;
  const countryInfo = ALL_COUNTRIES.find((c) => c.code === item.country_code);

  if (viewMode === "list") {
    return (
      <TouchableOpacity
        style={[styles.listCard, { backgroundColor: colors.backgroundCard, borderColor: colors.border }]}
        activeOpacity={0.85}
        onPress={() => router.push({ pathname: "/product/[id]", params: { id: item.id.toString() } })}
      >
        <View style={[styles.listImage, { backgroundColor: colors.backgroundElevated }]}>
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" />
          ) : (
            <Ionicons name="bag-handle" size={32} color={colors.primary} />
          )}
          {countryInfo && (
            <Text style={styles.countryFlagOverlay}>{countryInfo.flag}</Text>
          )}
        </View>
        <View style={styles.listInfo}>
          <Text style={[styles.productName, { color: colors.text }]} numberOfLines={2}>{item.name}</Text>
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={12} color="#F59E0B" />
            <Text style={[styles.ratingText, { color: colors.textSecondary }]}>
              {item.rating?.toFixed(1) || "0.0"} ({item.review_count})
            </Text>
          </View>
          <View style={styles.priceRow}>
            {hasDiscount && (
              <Text style={[styles.originalPrice, { color: colors.textMuted }]}>
                {formatPrice(item.original_price!, item.currency_code)}
              </Text>
            )}
            <Text style={[styles.salePrice, { color: colors.primary }]}>
              {formatPrice(item.price, item.currency_code)}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: colors.primary + "18", borderColor: colors.primary }]}
          onPress={() => router.push({ pathname: "/product/[id]", params: { id: item.id.toString() } })}
        >
          <Ionicons name="cart-outline" size={20} color={colors.primary} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.gridCard, { backgroundColor: colors.backgroundCard, borderColor: colors.border }]}
      activeOpacity={0.85}
      onPress={() => router.push({ pathname: "/product/[id]", params: { id: item.id.toString() } })}
    >
      <View style={[styles.gridImage, { backgroundColor: colors.backgroundElevated }]}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        ) : (
          <View style={styles.gridImagePlaceholder}>
            <Ionicons name="bag-handle" size={36} color={colors.primary} />
          </View>
        )}
        {countryInfo && (
          <Text style={styles.countryFlagOverlay}>{countryInfo.flag}</Text>
        )}
        {hasDiscount && (
          <View style={[styles.discountBadge, { backgroundColor: colors.primary }]}>
            <Text style={styles.discountText}>-{discountPct}%</Text>
          </View>
        )}
      </View>
      <View style={styles.gridInfo}>
        <Text style={[styles.productName, { color: colors.text }]} numberOfLines={2}>{item.name}</Text>
        <View style={styles.ratingRow}>
          <Ionicons name="star" size={12} color="#F59E0B" />
          <Text style={[styles.ratingText, { color: colors.textSecondary }]}>
            {item.rating?.toFixed(1) || "0.0"} ({item.review_count})
          </Text>
        </View>
        {hasDiscount && (
          <Text style={[styles.originalPrice, { color: colors.textMuted }]}>
            {formatPrice(item.original_price!, item.currency_code)}
          </Text>
        )}
        <View style={styles.priceAddRow}>
          <Text style={[styles.salePrice, { color: colors.primary }]}>
            {formatPrice(item.price, item.currency_code)}
          </Text>
          <TouchableOpacity
            style={[styles.addBtn, { backgroundColor: colors.primary + "18", borderColor: colors.primary }]}
            onPress={() => router.push({ pathname: "/product/[id]", params: { id: item.id.toString() } })}
          >
            <Ionicons name="cart-outline" size={18} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function InternationalScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortKey>("featured");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchText, setSearchText] = useState("");

  const topPadding = Platform.OS === "web" ? 0 : insets.top;
  const bottomPadding = Platform.OS === "web" ? 84 : insets.bottom + 90;

  const countryParam = selectedCountry ? `country=${selectedCountry}` : "";

  const { data: featuredData, isLoading: featuredLoading } = useQuery({
    queryKey: ["/api/products/featured", countryParam, "international"],
    queryFn: () => api.products.featured(countryParam || undefined),
  });

  const { data: trendingData, isLoading: trendingLoading } = useQuery({
    queryKey: ["/api/products/trending", countryParam, "international"],
    queryFn: () => api.products.trending(countryParam || undefined),
  });

  const { data: searchData, isLoading: searchLoading } = useQuery({
    queryKey: ["/api/products/search", searchText, countryParam],
    queryFn: () => api.products.search(`q=${encodeURIComponent(searchText)}&${countryParam}&limit=40`),
    enabled: searchText.length > 1,
  });

  const isLoading = searchText.length > 1 ? searchLoading : (featuredLoading && trendingLoading);

  const rawProducts: Product[] = searchText.length > 1
    ? (searchData ?? [])
    : [...(featuredData ?? []), ...(trendingData ?? [])].filter(
        (p, i, arr) => arr.findIndex((x) => x.id === p.id) === i
      );

  const sortedProducts = [...rawProducts].sort((a, b) => {
    if (sortBy === "price_asc") return a.price - b.price;
    if (sortBy === "price_desc") return b.price - a.price;
    if (sortBy === "popular") return (b.sales_count ?? 0) - (a.sales_count ?? 0);
    return 0;
  });

  const renderItem = useCallback(({ item }: { item: Product }) => (
    <ProductCard item={item} viewMode={viewMode} />
  ), [viewMode, colors]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPadding + 8, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={26} color={colors.text} />
        </TouchableOpacity>
        <View style={[styles.searchBar, { backgroundColor: colors.backgroundCard, borderColor: colors.border }]}>
          <Ionicons name="search-outline" size={18} color={colors.textMuted} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder={t.home.searchPlaceholder}
            placeholderTextColor={colors.textMuted}
            value={searchText}
            onChangeText={setSearchText}
            autoCorrect={false}
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => setSearchText("")}>
              <Ionicons name="close-circle" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={[styles.countryScroll, { borderBottomColor: colors.border }]}
        contentContainerStyle={styles.countryRow}
      >
        <TouchableOpacity
          style={[
            styles.countryChip,
            { backgroundColor: colors.backgroundCard, borderColor: colors.border },
            selectedCountry === null && { borderColor: colors.primary, backgroundColor: colors.primary + "18" },
          ]}
          onPress={() => { setSelectedCountry(null); Haptics.selectionAsync(); }}
          activeOpacity={0.7}
        >
          <Text style={styles.chipFlag}>🌍</Text>
          <Text style={[styles.chipLabel, { color: selectedCountry === null ? colors.primary : colors.text }]}>
            Tous
          </Text>
        </TouchableOpacity>
        {ALL_COUNTRIES.map((c) => (
          <TouchableOpacity
            key={c.code}
            style={[
              styles.countryChip,
              { backgroundColor: colors.backgroundCard, borderColor: colors.border },
              selectedCountry === c.code && { borderColor: colors.primary, backgroundColor: colors.primary + "18" },
            ]}
            onPress={() => { setSelectedCountry(c.code); Haptics.selectionAsync(); }}
            activeOpacity={0.7}
          >
            <Text style={styles.chipFlag}>{c.flag}</Text>
            <Text style={[styles.chipLabel, { color: selectedCountry === c.code ? colors.primary : colors.text }]}>
              {c.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={[styles.toolbar, { borderBottomColor: colors.border }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sortRow}>
          {SORT_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.key}
              style={[
                styles.sortChip,
                { backgroundColor: colors.backgroundCard, borderColor: colors.border },
                sortBy === opt.key && { backgroundColor: colors.primary, borderColor: colors.primary },
              ]}
              onPress={() => { setSortBy(opt.key); Haptics.selectionAsync(); }}
              activeOpacity={0.7}
            >
              <Ionicons name={opt.icon as any} size={14} color={sortBy === opt.key ? "#fff" : colors.textSecondary} />
              <Text style={[styles.sortLabel, { color: sortBy === opt.key ? "#fff" : colors.text }]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.viewToggle}>
          <TouchableOpacity
            style={[styles.toggleBtn, viewMode === "grid" && { backgroundColor: colors.primary + "20" }]}
            onPress={() => setViewMode("grid")}
          >
            <Ionicons name="grid" size={18} color={viewMode === "grid" ? colors.primary : colors.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, viewMode === "list" && { backgroundColor: colors.primary + "20" }]}
            onPress={() => setViewMode("list")}
          >
            <Ionicons name="list" size={22} color={viewMode === "list" ? colors.primary : colors.textMuted} />
          </TouchableOpacity>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>{t.common.loading}</Text>
        </View>
      ) : sortedProducts.length === 0 ? (
        <View style={styles.centered}>
          <Ionicons name="globe-outline" size={56} color={colors.textMuted} />
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>{t.common.noResults}</Text>
        </View>
      ) : (
        <FlatList
          data={sortedProducts}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          key={viewMode}
          numColumns={viewMode === "grid" ? 2 : 1}
          columnWrapperStyle={viewMode === "grid" ? styles.columnWrapper : undefined}
          contentContainerStyle={[styles.productList, { paddingBottom: bottomPadding }]}
          showsVerticalScrollIndicator={false}
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
    paddingHorizontal: 12,
    paddingBottom: 10,
    gap: 10,
    borderBottomWidth: 1,
  },
  backBtn: { padding: 4 },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    padding: 0,
  },
  countryScroll: { maxHeight: 54, borderBottomWidth: 1 },
  countryRow: { paddingHorizontal: 12, paddingVertical: 8, gap: 8, alignItems: "center" },
  countryChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1.5,
    gap: 6,
  },
  chipFlag: { fontSize: 16 },
  chipLabel: { fontFamily: "Poppins_600SemiBold", fontSize: 12 },
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    paddingRight: 12,
    borderBottomWidth: 1,
  },
  sortRow: { paddingHorizontal: 12, paddingVertical: 8, gap: 8, alignItems: "center" },
  sortChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    gap: 4,
  },
  sortLabel: { fontFamily: "Poppins_600SemiBold", fontSize: 12 },
  viewToggle: { flexDirection: "row", gap: 4, marginLeft: 8 },
  toggleBtn: { padding: 6, borderRadius: 8 },
  productList: { paddingHorizontal: 12, paddingTop: 12 },
  columnWrapper: { gap: 12, marginBottom: 12 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  loadingText: { fontFamily: "Poppins_400Regular", fontSize: 14 },
  emptyText: { fontFamily: "Poppins_600SemiBold", fontSize: 16, textAlign: "center" },
  gridCard: {
    width: CARD_WIDTH,
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  gridImage: {
    height: 150,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  gridImagePlaceholder: { alignItems: "center", justifyContent: "center", flex: 1 },
  gridInfo: { padding: 10, gap: 4 },
  listCard: {
    flexDirection: "row",
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: 10,
    alignItems: "center",
  },
  listImage: {
    width: 100,
    height: 100,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  listInfo: { flex: 1, padding: 10, gap: 4 },
  countryFlagOverlay: {
    position: "absolute",
    top: 8,
    left: 8,
    fontSize: 20,
    backgroundColor: "rgba(255,255,255,0.85)",
    borderRadius: 10,
    paddingHorizontal: 4,
    paddingVertical: 1,
    overflow: "hidden",
  },
  discountBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  discountText: { color: "#fff", fontFamily: "Poppins_700Bold", fontSize: 10 },
  productName: { fontFamily: "Poppins_600SemiBold", fontSize: 12, lineHeight: 18 },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  ratingText: { fontFamily: "Poppins_400Regular", fontSize: 11 },
  originalPrice: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    textDecorationLine: "line-through",
  },
  salePrice: { fontFamily: "Poppins_700Bold", fontSize: 13 },
  priceRow: { flexDirection: "row", gap: 8, alignItems: "center", flexWrap: "wrap" },
  priceAddRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 4 },
  addBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
});
