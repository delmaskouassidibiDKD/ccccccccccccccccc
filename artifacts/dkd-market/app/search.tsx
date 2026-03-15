import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Dimensions,
  ActivityIndicator,
  Platform,
  Modal,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { Colors } from "@/constants/colors";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQuery } from "@tanstack/react-query";
import { api, Product, Category } from "@/lib/api";
import Animated, {
  FadeIn,
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/contexts/ThemeContext";
import { useLanguage } from "@/contexts/LanguageContext";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const RECENT_SEARCHES_KEY = "dkd_recent_searches";
const MAX_RECENT = 10;

function getFirstImage(images: string): string | null {
  try {
    const parsed = JSON.parse(images);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed[0];
  } catch {}
  if (images && images.startsWith("http")) return images;
  return null;
}

function formatPrice(price: number, currency?: string): string {
  const formatted = Math.round(price).toLocaleString("fr-FR");
  return `${formatted} ${currency || "FCFA"}`;
}

function ProductCard({ item }: { item: Product }) {
  const { colors } = useTheme();
  const imageUrl = getFirstImage(item.images);
  const hasDiscount = item.original_price && item.original_price > item.price;
  const discountPercent = hasDiscount
    ? Math.round(((item.original_price! - item.price) / item.original_price!) * 100)
    : 0;

  return (
    <TouchableOpacity
      style={[styles.productCard, { backgroundColor: colors.backgroundCard, borderColor: colors.border }]}
      activeOpacity={0.7}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push(`/product/${item.id}`);
      }}
    >
      <View style={[styles.productImageContainer, { backgroundColor: colors.surface }]}>
        {imageUrl ? (
          <Animated.Image
            source={{ uri: imageUrl }}
            style={styles.productImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.productImagePlaceholder}>
            <Ionicons name="image-outline" size={32} color={colors.textMuted} />
          </View>
        )}
        {hasDiscount && (
          <View style={[styles.discountBadge, { backgroundColor: colors.error }]}>
            <Text style={styles.discountText}>-{discountPercent}%</Text>
          </View>
        )}
      </View>
      <View style={styles.productInfo}>
        <Text style={[styles.productName, { color: colors.text }]} numberOfLines={2}>
          {item.name}
        </Text>
        <Text style={[styles.productSeller, { color: colors.textMuted }]} numberOfLines={1}>
          {item.shop_name}
        </Text>
        <View style={styles.priceRow}>
          <Text style={[styles.productPrice, { color: colors.primary }]}>{formatPrice(item.price)}</Text>
          {hasDiscount && (
            <Text style={[styles.originalPrice, { color: colors.textMuted }]}>
              {formatPrice(item.original_price!)}
            </Text>
          )}
        </View>
        {item.rating > 0 && (
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={12} color={colors.warning} />
            <Text style={[styles.ratingText, { color: colors.warning }]}>{item.rating.toFixed(1)}</Text>
            <Text style={[styles.reviewCount, { color: colors.textMuted }]}>({item.review_count})</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { t } = useLanguage();
  const inputRef = useRef<TextInput>(null);
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [selectedSort, setSelectedSort] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("");

  const [appliedFilters, setAppliedFilters] = useState({
    category: null as number | null,
    minPrice: "",
    maxPrice: "",
    sort: "",
    country: "",
  });

  const SORT_OPTIONS = useMemo(() => [
    { label: t.search.relevance, value: "" },
    { label: t.search.priceAsc, value: "price_asc" },
    { label: t.search.priceDesc, value: "price_desc" },
    { label: t.search.newest, value: "newest" },
    { label: t.search.topRated, value: "top_rated" },
  ], [t]);

  useEffect(() => {
    loadRecentSearches();
    const focusTimer = setTimeout(() => inputRef.current?.focus(), 300);
    return () => clearTimeout(focusTimer);
  }, []);

  const loadRecentSearches = async () => {
    try {
      const stored = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
      if (stored) setRecentSearches(JSON.parse(stored));
    } catch {}
  };

  const saveRecentSearch = async (term: string) => {
    const trimmed = term.trim();
    if (!trimmed) return;
    const updated = [trimmed, ...recentSearches.filter((s) => s !== trimmed)].slice(0, MAX_RECENT);
    setRecentSearches(updated);
    try {
      await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    } catch {}
  };

  const clearRecentSearches = async () => {
    setRecentSearches([]);
    try {
      await AsyncStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch {}
  };

  const removeRecentSearch = async (term: string) => {
    const updated = recentSearches.filter((s) => s !== term);
    setRecentSearches(updated);
    try {
      await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    } catch {}
  };

  const buildSearchParams = useCallback(() => {
    const params = new URLSearchParams();
    if (submittedQuery) params.set("q", submittedQuery);
    if (appliedFilters.category) params.set("category", String(appliedFilters.category));
    if (appliedFilters.minPrice) params.set("min_price", appliedFilters.minPrice);
    if (appliedFilters.maxPrice) params.set("max_price", appliedFilters.maxPrice);
    if (appliedFilters.sort) params.set("sort", appliedFilters.sort);
    if (appliedFilters.country) params.set("country", appliedFilters.country);
    return params.toString();
  }, [submittedQuery, appliedFilters]);

  const {
    data: searchResults,
    isLoading,
    isFetching,
    error,
  } = useQuery({
    queryKey: ["/api/products/search", buildSearchParams()],
    queryFn: () => api.products.search(buildSearchParams()),
    enabled: !!submittedQuery || !!appliedFilters.category,
  });

  const { data: categories } = useQuery({
    queryKey: ["/api/categories"],
    queryFn: () => api.categories.list(),
  });

  const { data: configData } = useQuery({
    queryKey: ["/api/config/public"],
    queryFn: () => api.config.public(),
  });

  const handleSearch = () => {
    const trimmed = query.trim();
    if (trimmed) {
      saveRecentSearch(trimmed);
    }
    setSubmittedQuery(trimmed);
    setAppliedFilters({
      category: selectedCategory,
      minPrice,
      maxPrice,
      sort: selectedSort,
      country: selectedCountry,
    });
  };

  const handleRecentPress = (term: string) => {
    setQuery(term);
    setSubmittedQuery(term);
    saveRecentSearch(term);
    setAppliedFilters({
      category: selectedCategory,
      minPrice,
      maxPrice,
      sort: selectedSort,
      country: selectedCountry,
    });
  };

  const applyFilters = () => {
    setShowFilters(false);
    setAppliedFilters({
      category: selectedCategory,
      minPrice,
      maxPrice,
      sort: selectedSort,
      country: selectedCountry,
    });
    if (submittedQuery || selectedCategory) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const clearFilters = () => {
    setSelectedCategory(null);
    setMinPrice("");
    setMaxPrice("");
    setSelectedSort("");
    setSelectedCountry("");
  };

  const activeFilterCount = [
    appliedFilters.category,
    appliedFilters.minPrice,
    appliedFilters.maxPrice,
    appliedFilters.sort,
    appliedFilters.country,
  ].filter(Boolean).length;

  const hasSearched = !!submittedQuery || !!appliedFilters.category;
  const results = searchResults || [];
  const countries = configData?.countries || [];

  const topPadding = Platform.OS === "web" ? 0 : insets.top;

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: topPadding }]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={[styles.searchBarContainer, { backgroundColor: colors.backgroundCard, borderColor: colors.border }]}>
          <Ionicons name="search" size={18} color={colors.textMuted} style={styles.searchIcon} />
          <TextInput
            ref={inputRef}
            style={[styles.searchInput, { color: colors.text }]}
            placeholder={t.search.placeholder}
            placeholderTextColor={colors.textMuted}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => { setQuery(""); setSubmittedQuery(""); }}>
              <Ionicons name="close-circle" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          onPress={() => setShowFilters(true)}
          style={styles.filterButton}
        >
          <Ionicons name="options-outline" size={22} color={activeFilterCount > 0 ? colors.primary : colors.text} />
          {activeFilterCount > 0 && (
            <View style={[styles.filterBadge, { backgroundColor: colors.primary }]}>
              <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {!hasSearched ? (
        <ScrollView style={styles.suggestionsContainer} keyboardShouldPersistTaps="handled">
          {recentSearches.length > 0 && (
            <View style={styles.recentSection}>
              <View style={styles.recentHeader}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>{t.search.recent}</Text>
                <TouchableOpacity onPress={clearRecentSearches}>
                  <Text style={[styles.clearText, { color: colors.primary }]}>{t.search.clear}</Text>
                </TouchableOpacity>
              </View>
              {recentSearches.map((term, idx) => (
                <TouchableOpacity
                  key={`${term}-${idx}`}
                  style={[styles.recentItem, { borderBottomColor: colors.border }]}
                  onPress={() => handleRecentPress(term)}
                >
                  <Ionicons name="time-outline" size={18} color={colors.textMuted} />
                  <Text style={[styles.recentText, { color: colors.textSecondary }]} numberOfLines={1}>{term}</Text>
                  <TouchableOpacity
                    onPress={() => removeRecentSearch(term)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons name="close" size={16} color={colors.textMuted} />
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {categories && categories.length > 0 && (
            <View style={styles.categoriesSection}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>{t.search.browseByCategory}</Text>
              <View style={styles.categoryGrid}>
                {categories.slice(0, 12).map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[styles.categoryChip, { backgroundColor: colors.backgroundCard, borderColor: colors.border }]}
                    onPress={() => {
                      setSelectedCategory(cat.id);
                      setAppliedFilters((prev) => ({ ...prev, category: cat.id }));
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                  >
                    <Text style={[styles.categoryChipText, { color: colors.textSecondary }]} numberOfLines={1}>{cat.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </ScrollView>
      ) : (
        <View style={styles.resultsContainer}>
          {appliedFilters.sort || appliedFilters.category || appliedFilters.minPrice || appliedFilters.maxPrice || appliedFilters.country ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.activeFiltersRow} contentContainerStyle={styles.activeFiltersContent}>
              {appliedFilters.category && categories && (
                <View style={[styles.activeFilterChip, { backgroundColor: colors.primary + "1F", borderColor: colors.primary + "4D" }]}>
                  <Text style={[styles.activeFilterText, { color: colors.primary }]}>
                    {categories.find((c) => c.id === appliedFilters.category)?.name || t.search.category}
                  </Text>
                  <TouchableOpacity onPress={() => {
                    setSelectedCategory(null);
                    setAppliedFilters((prev) => ({ ...prev, category: null }));
                  }}>
                    <Ionicons name="close" size={14} color={colors.primary} />
                  </TouchableOpacity>
                </View>
              )}
              {appliedFilters.sort && (
                <View style={[styles.activeFilterChip, { backgroundColor: colors.primary + "1F", borderColor: colors.primary + "4D" }]}>
                  <Text style={[styles.activeFilterText, { color: colors.primary }]}>
                    {SORT_OPTIONS.find((s) => s.value === appliedFilters.sort)?.label}
                  </Text>
                  <TouchableOpacity onPress={() => {
                    setSelectedSort("");
                    setAppliedFilters((prev) => ({ ...prev, sort: "" }));
                  }}>
                    <Ionicons name="close" size={14} color={colors.primary} />
                  </TouchableOpacity>
                </View>
              )}
              {(appliedFilters.minPrice || appliedFilters.maxPrice) && (
                <View style={[styles.activeFilterChip, { backgroundColor: colors.primary + "1F", borderColor: colors.primary + "4D" }]}>
                  <Text style={[styles.activeFilterText, { color: colors.primary }]}>
                    {appliedFilters.minPrice || "0"} - {appliedFilters.maxPrice || "Max"} FCFA
                  </Text>
                  <TouchableOpacity onPress={() => {
                    setMinPrice("");
                    setMaxPrice("");
                    setAppliedFilters((prev) => ({ ...prev, minPrice: "", maxPrice: "" }));
                  }}>
                    <Ionicons name="close" size={14} color={colors.primary} />
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          ) : null}

          {isLoading ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.textSecondary }]}>{t.search.searching}</Text>
            </View>
          ) : error ? (
            <View style={styles.centerContainer}>
              <Ionicons name="cloud-offline-outline" size={48} color={colors.textMuted} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>{t.search.searchError}</Text>
              <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                {t.search.connectionError}
              </Text>
              <TouchableOpacity style={[styles.retryButton, { backgroundColor: colors.primary }]} onPress={handleSearch}>
                <Text style={styles.retryButtonText}>{t.common.retry}</Text>
              </TouchableOpacity>
            </View>
          ) : results.length === 0 ? (
            <View style={styles.centerContainer}>
              <Ionicons name="search-outline" size={48} color={colors.textMuted} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>{t.search.noResults}</Text>
              <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                {t.search.tryDifferent}
              </Text>
            </View>
          ) : (
            <FlatList
              data={results}
              keyExtractor={(item) => String(item.id)}
              numColumns={2}
              columnWrapperStyle={styles.productRow}
              contentContainerStyle={styles.productList}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => <ProductCard item={item} />}
              ListHeaderComponent={
                <Text style={[styles.resultCount, { color: colors.textSecondary }]}>
                  {results.length} {t.search.results}
                  {submittedQuery ? ` ${t.search.resultFor} "${submittedQuery}"` : ""}
                </Text>
              }
              ListFooterComponent={
                isFetching ? (
                  <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 16 }} />
                ) : null
              }
            />
          )}
        </View>
      )}

      <Modal
        visible={showFilters}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowFilters(false)}
      >
        <View style={[styles.filterModal, { backgroundColor: colors.background, paddingTop: Platform.OS === "web" ? 20 : insets.top }]}>
          <View style={[styles.filterHeader, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => setShowFilters(false)}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.filterTitle, { color: colors.text }]}>{t.search.filters}</Text>
            <TouchableOpacity onPress={clearFilters}>
              <Text style={[styles.clearFiltersText, { color: colors.primary }]}>{t.search.reset}</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.filterContent} showsVerticalScrollIndicator={false}>
            <Text style={[styles.filterSectionTitle, { color: colors.text }]}>{t.search.sortBy}</Text>
            <View style={styles.sortOptions}>
              {SORT_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={[
                    styles.sortChip,
                    { backgroundColor: colors.backgroundCard, borderColor: colors.border },
                    selectedSort === opt.value && { backgroundColor: colors.primary + "26", borderColor: colors.primary },
                  ]}
                  onPress={() => setSelectedSort(opt.value)}
                >
                  <Text
                    style={[
                      styles.sortChipText,
                      { color: colors.textSecondary },
                      selectedSort === opt.value && { color: colors.primary },
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.filterSectionTitle, { color: colors.text }]}>{t.search.category}</Text>
            <View style={styles.categoryFilterGrid}>
              {(categories || []).map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.categoryFilterChip,
                    { backgroundColor: colors.backgroundCard, borderColor: colors.border },
                    selectedCategory === cat.id && { backgroundColor: colors.primary + "26", borderColor: colors.primary },
                  ]}
                  onPress={() =>
                    setSelectedCategory(selectedCategory === cat.id ? null : cat.id)
                  }
                >
                  <Text
                    style={[
                      styles.categoryFilterText,
                      { color: colors.textSecondary },
                      selectedCategory === cat.id && { color: colors.primary },
                    ]}
                    numberOfLines={1}
                  >
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.filterSectionTitle, { color: colors.text }]}>{t.search.priceRange} (FCFA)</Text>
            <View style={styles.priceRange}>
              <View style={styles.priceInputContainer}>
                <Text style={[styles.priceLabel, { color: colors.textMuted }]}>{t.search.minPrice}</Text>
                <TextInput
                  style={[styles.priceInput, { backgroundColor: colors.backgroundCard, color: colors.text, borderColor: colors.border }]}
                  placeholder="0"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numeric"
                  value={minPrice}
                  onChangeText={setMinPrice}
                />
              </View>
              <View style={styles.priceSeparator}>
                <Text style={[styles.priceSeparatorText, { color: colors.textMuted }]}>-</Text>
              </View>
              <View style={styles.priceInputContainer}>
                <Text style={[styles.priceLabel, { color: colors.textMuted }]}>{t.search.maxPrice}</Text>
                <TextInput
                  style={[styles.priceInput, { backgroundColor: colors.backgroundCard, color: colors.text, borderColor: colors.border }]}
                  placeholder="Max"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numeric"
                  value={maxPrice}
                  onChangeText={setMaxPrice}
                />
              </View>
            </View>

            {countries.length > 0 && (
              <>
                <Text style={[styles.filterSectionTitle, { color: colors.text }]}>{t.search.country}</Text>
                <View style={styles.countryGrid}>
                  {countries.map((c) => (
                    <TouchableOpacity
                      key={c.id}
                      style={[
                        styles.countryChip,
                        { backgroundColor: colors.backgroundCard, borderColor: colors.border },
                        selectedCountry === c.country_code && { backgroundColor: colors.primary + "26", borderColor: colors.primary },
                      ]}
                      onPress={() =>
                        setSelectedCountry(
                          selectedCountry === c.country_code ? "" : c.country_code
                        )
                      }
                    >
                      <Text
                        style={[
                          styles.countryChipText,
                          { color: colors.textSecondary },
                          selectedCountry === c.country_code && { color: colors.primary },
                        ]}
                      >
                        {c.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}
          </ScrollView>

          <View style={[styles.filterFooter, { borderTopColor: colors.border, paddingBottom: Platform.OS === "web" ? 34 : Math.max(insets.bottom, 16) }]}>
            <TouchableOpacity style={[styles.applyButton, { backgroundColor: colors.primary }]} onPress={applyFilters}>
              <Text style={styles.applyButtonText}>{t.search.applyFilters}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  backButton: {
    padding: 4,
  },
  searchBarContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.backgroundCard,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: Colors.text,
    fontFamily: "Poppins_400Regular",
    fontSize: 15,
    height: 44,
  },
  filterButton: {
    padding: 4,
    position: "relative" as const,
  },
  filterBadge: {
    position: "absolute" as const,
    top: -2,
    right: -2,
    backgroundColor: Colors.primary,
    borderRadius: 8,
    width: 16,
    height: 16,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  filterBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontFamily: "Poppins_700Bold",
  },
  suggestionsContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  recentSection: {
    marginTop: 12,
  },
  recentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    color: Colors.text,
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
  },
  clearText: {
    color: Colors.primary,
    fontFamily: "Poppins_500Medium",
    fontSize: 13,
  },
  recentItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 12,
  },
  recentText: {
    flex: 1,
    color: Colors.textSecondary,
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
  },
  categoriesSection: {
    marginTop: 28,
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  categoryChip: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoryChipText: {
    color: Colors.textSecondary,
    fontFamily: "Poppins_500Medium",
    fontSize: 13,
  },
  resultsContainer: {
    flex: 1,
  },
  activeFiltersRow: {
    maxHeight: 44,
    paddingHorizontal: 16,
    marginBottom: 4,
  },
  activeFiltersContent: {
    gap: 8,
    alignItems: "center",
    paddingVertical: 4,
  },
  activeFilterChip: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
    borderWidth: 1,
  },
  activeFilterText: {
    color: Colors.primary,
    fontFamily: "Poppins_500Medium",
    fontSize: 12,
  },
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  loadingText: {
    color: Colors.textSecondary,
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    marginTop: 12,
  },
  emptyTitle: {
    color: Colors.text,
    fontFamily: "Poppins_600SemiBold",
    fontSize: 18,
    marginTop: 16,
  },
  emptySubtitle: {
    color: Colors.textSecondary,
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    textAlign: "center" as const,
    marginTop: 8,
    lineHeight: 20,
  },
  retryButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
    marginTop: 20,
  },
  retryButtonText: {
    color: "#fff",
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
  },
  resultCount: {
    color: Colors.textSecondary,
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  productList: {
    paddingHorizontal: 12,
    paddingBottom: 32,
  },
  productRow: {
    justifyContent: "space-between",
    gap: 10,
  },
  productCard: {
    width: (SCREEN_WIDTH - 34) / 2,
    backgroundColor: Colors.backgroundCard,
    borderRadius: 14,
    overflow: "hidden",
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  productImageContainer: {
    width: "100%",
    aspectRatio: 1,
    backgroundColor: Colors.surface,
  },
  productImage: {
    width: "100%",
    height: "100%",
  },
  productImagePlaceholder: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  discountBadge: {
    position: "absolute" as const,
    top: 8,
    left: 8,
    backgroundColor: Colors.error,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  discountText: {
    color: "#fff",
    fontFamily: "Poppins_700Bold",
    fontSize: 11,
  },
  productInfo: {
    padding: 10,
  },
  productName: {
    color: Colors.text,
    fontFamily: "Poppins_500Medium",
    fontSize: 13,
    lineHeight: 18,
  },
  productSeller: {
    color: Colors.textMuted,
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    marginTop: 2,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 6,
  },
  productPrice: {
    color: Colors.primary,
    fontFamily: "Poppins_700Bold",
    fontSize: 14,
  },
  originalPrice: {
    color: Colors.textMuted,
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    textDecorationLine: "line-through" as const,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginTop: 4,
  },
  ratingText: {
    color: Colors.warning,
    fontFamily: "Poppins_600SemiBold",
    fontSize: 11,
  },
  reviewCount: {
    color: Colors.textMuted,
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
  },
  filterModal: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  filterHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  filterTitle: {
    color: Colors.text,
    fontFamily: "Poppins_600SemiBold",
    fontSize: 18,
  },
  clearFiltersText: {
    color: Colors.primary,
    fontFamily: "Poppins_500Medium",
    fontSize: 14,
  },
  filterContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  filterSectionTitle: {
    color: Colors.text,
    fontFamily: "Poppins_600SemiBold",
    fontSize: 15,
    marginBottom: 12,
    marginTop: 20,
  },
  sortOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  sortChip: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sortChipText: {
    color: Colors.textSecondary,
    fontFamily: "Poppins_500Medium",
    fontSize: 13,
  },
  categoryFilterGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  categoryFilterChip: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoryFilterText: {
    color: Colors.textSecondary,
    fontFamily: "Poppins_500Medium",
    fontSize: 13,
  },
  priceRange: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  priceInputContainer: {
    flex: 1,
  },
  priceLabel: {
    color: Colors.textMuted,
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    marginBottom: 4,
  },
  priceInput: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: 10,
    paddingHorizontal: 14,
    height: 44,
    color: Colors.text,
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  priceSeparator: {
    paddingTop: 20,
  },
  priceSeparatorText: {
    color: Colors.textMuted,
    fontSize: 18,
  },
  countryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  countryChip: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  countryChipText: {
    color: Colors.textSecondary,
    fontFamily: "Poppins_500Medium",
    fontSize: 13,
  },
  filterFooter: {
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  applyButton: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  applyButtonText: {
    color: "#fff",
    fontFamily: "Poppins_700Bold",
    fontSize: 16,
  },
});
