import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  FlatList,
  Platform,
  ActivityIndicator,
  Image,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from "react-native-reanimated";
import { useQuery } from "@tanstack/react-query";
import { api, Category, Product } from "@/lib/api";
import { useTheme } from "@/contexts/ThemeContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { AppHeader } from "@/components/AppHeader";
import { SideDrawer } from "@/components/SideDrawer";
import { ms, fs } from "@/lib/responsive";

export const CATEGORY_VISUALS: Record<number, { icon: string; color: string }> = {
  1:  { icon: "basket-outline",             color: "#22C55E" },
  2:  { icon: "nutrition-outline",          color: "#F59E0B" },
  3:  { icon: "snow-outline",               color: "#3B82F6" },
  4:  { icon: "fish-outline",               color: "#EF4444" },
  5:  { icon: "wine-outline",               color: "#8B5CF6" },
  6:  { icon: "cafe-outline",               color: "#F59E0B" },
  7:  { icon: "fast-food-outline",          color: "#FF6B00" },
  8:  { icon: "shirt-outline",              color: "#FF6B00" },
  9:  { icon: "man-outline",                color: "#3B82F6" },
  10: { icon: "woman-outline",              color: "#EC4899" },
  11: { icon: "bicycle-outline",            color: "#EF4444" },
  12: { icon: "heart-outline",              color: "#EC4899" },
  13: { icon: "ribbon-outline",             color: "#FF6B00" },
  14: { icon: "footsteps-outline",          color: "#8B5CF6" },
  15: { icon: "glasses-outline",            color: "#A78BFA" },
  16: { icon: "sparkles-outline",           color: "#EC4899" },
  17: { icon: "body-outline",               color: "#EC4899" },
  18: { icon: "cut-outline",                color: "#A78BFA" },
  19: { icon: "color-palette-outline",      color: "#EC4899" },
  20: { icon: "home-outline",               color: "#22C55E" },
  21: { icon: "medkit-outline",             color: "#10B981" },
  22: { icon: "happy-outline",              color: "#A78BFA" },
  23: { icon: "nutrition-outline",          color: "#F59E0B" },
  24: { icon: "water-outline",              color: "#3B82F6" },
  25: { icon: "game-controller-outline",    color: "#A78BFA" },
  26: { icon: "school-outline",             color: "#3B82F6" },
  27: { icon: "home-outline",               color: "#22C55E" },
  28: { icon: "tv-outline",                 color: "#64748B" },
  29: { icon: "cafe-outline",               color: "#F59E0B" },
  30: { icon: "restaurant-outline",         color: "#FF6B00" },
  31: { icon: "bed-outline",                color: "#8B5CF6" },
  32: { icon: "layers-outline",             color: "#3B82F6" },
  33: { icon: "hardware-chip-outline",      color: "#3B82F6" },
  34: { icon: "phone-portrait-outline",     color: "#3B82F6" },
  35: { icon: "laptop-outline",             color: "#64748B" },
  36: { icon: "keypad-outline",             color: "#8B5CF6" },
  37: { icon: "headset-outline",            color: "#8B5CF6" },
  38: { icon: "git-network-outline",        color: "#64748B" },
  39: { icon: "flash-outline",              color: "#F59E0B" },
  40: { icon: "sunny-outline",              color: "#22C55E" },
  41: { icon: "business-outline",           color: "#64748B" },
  42: { icon: "flash-outline",              color: "#EF4444" },
  43: { icon: "settings-outline",           color: "#64748B" },
  44: { icon: "hammer-outline",             color: "#F59E0B" },
  45: { icon: "briefcase-outline",          color: "#64748B" },
  46: { icon: "move-outline",               color: "#8B5CF6" },
  47: { icon: "construct-outline",          color: "#F59E0B" },
  48: { icon: "layers-outline",             color: "#64748B" },
  49: { icon: "shield-outline",             color: "#10B981" },
  50: { icon: "build-outline",              color: "#F59E0B" },
  51: { icon: "car-outline",                color: "#64748B" },
  52: { icon: "construct-outline",          color: "#EF4444" },
  53: { icon: "flask-outline",              color: "#F59E0B" },
  54: { icon: "car-sport-outline",          color: "#64748B" },
  55: { icon: "speedometer-outline",        color: "#EF4444" },
  56: { icon: "shield-checkmark-outline",   color: "#10B981" },
  57: { icon: "body-outline",               color: "#64748B" },
  58: { icon: "lock-closed-outline",        color: "#EF4444" },
  59: { icon: "flask-outline",              color: "#8B5CF6" },
  60: { icon: "build-outline",              color: "#64748B" },
  61: { icon: "flask-outline",              color: "#A78BFA" },
  62: { icon: "leaf-outline",               color: "#22C55E" },
  63: { icon: "flower-outline",             color: "#22C55E" },
  64: { icon: "paw-outline",                color: "#F59E0B" },
  65: { icon: "cube-outline",               color: "#64748B" },
  66: { icon: "cube-outline",               color: "#F59E0B" },
  67: { icon: "archive-outline",            color: "#64748B" },
  68: { icon: "paw-outline",                color: "#F59E0B" },
  69: { icon: "nutrition-outline",          color: "#22C55E" },
  70: { icon: "paw-outline",                color: "#A78BFA" },
  71: { icon: "medkit-outline",             color: "#10B981" },
  72: { icon: "water-outline",              color: "#3B82F6" },
  73: { icon: "football-outline",           color: "#EF4444" },
  74: { icon: "fitness-outline",            color: "#EF4444" },
  75: { icon: "people-outline",             color: "#3B82F6" },
  76: { icon: "hand-left-outline",          color: "#EF4444" },
  77: { icon: "map-outline",                color: "#22C55E" },
  78: { icon: "fish-outline",               color: "#3B82F6" },
  79: { icon: "bicycle-outline",            color: "#22C55E" },
  80: { icon: "game-controller-outline",    color: "#A78BFA" },
  81: { icon: "grid-outline",               color: "#F59E0B" },
  82: { icon: "game-controller-outline",    color: "#8B5CF6" },
  83: { icon: "school-outline",             color: "#A78BFA" },
  84: { icon: "heart-outline",              color: "#EC4899" },
  85: { icon: "football-outline",           color: "#22C55E" },
  86: { icon: "musical-notes-outline",      color: "#A78BFA" },
  87: { icon: "musical-note-outline",       color: "#A78BFA" },
  88: { icon: "book-outline",               color: "#3B82F6" },
  89: { icon: "color-palette-outline",      color: "#A78BFA" },
  90: { icon: "brush-outline",              color: "#EC4899" },
  91: { icon: "briefcase-outline",          color: "#64748B" },
  92: { icon: "desktop-outline",            color: "#64748B" },
  93: { icon: "clipboard-outline",          color: "#3B82F6" },
  94: { icon: "print-outline",              color: "#64748B" },
  95: { icon: "people-outline",             color: "#3B82F6" },
  96: { icon: "airplane-outline",           color: "#3B82F6" },
  97: { icon: "bag-outline",                color: "#8B5CF6" },
  98: { icon: "compass-outline",            color: "#F59E0B" },
  99: { icon: "bed-outline",                color: "#22C55E" },
  100: { icon: "compass-outline",           color: "#3B82F6" },
  101: { icon: "bus-outline",               color: "#64748B" },
  102: { icon: "rose-outline",              color: "#EC4899" },
  103: { icon: "shirt-outline",             color: "#EC4899" },
  104: { icon: "balloon-outline",           color: "#A78BFA" },
  105: { icon: "restaurant-outline",        color: "#FF6B00" },
  106: { icon: "musical-notes-outline",     color: "#8B5CF6" },
  107: { icon: "gift-outline",              color: "#EC4899" },
  108: { icon: "heart-outline",             color: "#A78BFA" },
  109: { icon: "flower-outline",            color: "#22C55E" },
  110: { icon: "diamond-outline",           color: "#8B5CF6" },
  111: { icon: "moon-outline",              color: "#A78BFA" },
  112: { icon: "book-outline",              color: "#A78BFA" },
  113: { icon: "rocket-outline",            color: "#3B82F6" },
  114: { icon: "wifi-outline",              color: "#3B82F6" },
  115: { icon: "airplane-outline",          color: "#64748B" },
  116: { icon: "print-outline",             color: "#8B5CF6" },
  117: { icon: "glasses-outline",           color: "#8B5CF6" },
  118: { icon: "star-outline",              color: "#F59E0B" },
  119: { icon: "cash-outline",              color: "#F59E0B" },
  120: { icon: "mail-outline",              color: "#3B82F6" },
  121: { icon: "albums-outline",            color: "#A78BFA" },
  122: { icon: "construct-outline",         color: "#64748B" },
  123: { icon: "shield-outline",            color: "#64748B" },
  124: { icon: "briefcase-outline",         color: "#3B82F6" },
  125: { icon: "code-slash-outline",        color: "#3B82F6" },
  126: { icon: "people-circle-outline",     color: "#22C55E" },
  127: { icon: "school-outline",            color: "#F59E0B" },
  128: { icon: "chatbubble-outline",        color: "#3B82F6" },
  129: { icon: "hammer-outline",            color: "#EF4444" },
  130: { icon: "key-outline",               color: "#F59E0B" },
  131: { icon: "car-outline",               color: "#3B82F6" },
  132: { icon: "cube-outline",              color: "#8B5CF6" },
  133: { icon: "business-outline",          color: "#64748B" },
  134: { icon: "shirt-outline",             color: "#A78BFA" },
  135: { icon: "home-outline",              color: "#22C55E" },
  136: { icon: "home-outline",              color: "#FF6B00" },
  137: { icon: "key-outline",               color: "#3B82F6" },
  138: { icon: "trending-up-outline",       color: "#10B981" },
  139: { icon: "document-outline",          color: "#64748B" },
  140: { icon: "briefcase-outline",         color: "#3B82F6" },
  141: { icon: "search-outline",            color: "#3B82F6" },
  142: { icon: "document-text-outline",     color: "#64748B" },
  143: { icon: "trophy-outline",            color: "#F59E0B" },
  144: { icon: "school-outline",            color: "#22C55E" },
  145: { icon: "nutrition-outline",         color: "#10B981" },
  146: { icon: "leaf-outline",              color: "#22C55E" },
  147: { icon: "checkmark-circle-outline",  color: "#10B981" },
  148: { icon: "flower-outline",            color: "#22C55E" },
  149: { icon: "moon-outline",              color: "#10B981" },
  150: { icon: "star-outline",              color: "#3B82F6" },
  151: { icon: "earth-outline",             color: "#22C55E" },
  152: { icon: "sunny-outline",             color: "#F59E0B" },
  153: { icon: "refresh-outline",           color: "#22C55E" },
  154: { icon: "trash-outline",             color: "#10B981" },
  155: { icon: "leaf-outline",              color: "#22C55E" },
  156: { icon: "apps-outline",              color: "#64748B" },
  157: { icon: "ellipsis-horizontal-outline", color: "#64748B" },
  158: { icon: "sparkles-outline",          color: "#A78BFA" },
  159: { icon: "time-outline",              color: "#F59E0B" },
  160: { icon: "cog-outline",               color: "#64748B" },
  161: { icon: "help-circle-outline",       color: "#8B5CF6" },
  162: { icon: "apps-outline",              color: "#64748B" },
};

const FALLBACK_COLORS = [
  "#FF6B00", "#3B82F6", "#22C55E", "#EC4899", "#F59E0B",
  "#A78BFA", "#EF4444", "#8B5CF6", "#64748B", "#10B981",
];

export function getCategoryVisuals(category: Category, index: number) {
  const v = CATEGORY_VISUALS[category.id];
  if (v) return v;
  return {
    icon: "grid-outline",
    color: FALLBACK_COLORS[index % FALLBACK_COLORS.length],
  };
}

export function CategoryCard({ item, index, onPress }: { item: Category; index: number; onPress: () => void }) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const visuals = getCategoryVisuals(item, index);
  const { colors } = useTheme();
  const { t } = useLanguage();

  return (
    <Animated.View style={[styles.categoryCard, { backgroundColor: colors.backgroundCard, borderColor: colors.border }, animStyle]}>
      <TouchableOpacity
        activeOpacity={1}
        onPressIn={() => { scale.value = withSpring(0.96); Haptics.selectionAsync(); }}
        onPressOut={() => { scale.value = withSpring(1); }}
        onPress={onPress}
        style={styles.categoryCardInner}
      >
        {item.image_url ? (
          <Image source={{ uri: item.image_url }} style={[styles.categoryIconWrap, { backgroundColor: visuals.color + "18" }]} />
        ) : (
          <View style={[styles.categoryIconWrap, { backgroundColor: visuals.color + "18" }]}>
            <Ionicons name={visuals.icon as any} size={18} color={visuals.color} />
          </View>
        )}
        <Text style={[styles.categoryName, { color: colors.text }]} numberOfLines={2}>{item.name}</Text>
        {item.product_count != null && item.product_count > 0 && (
          <Text style={[styles.categoryCount, { color: colors.textMuted }]}>
            {item.product_count} {t.categories.products}
          </Text>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

export function ProductCard({ item }: { item: Product }) {
  const { colors } = useTheme();
  const images = item.images ? item.images.split(",") : [];
  const imageUri = images[0] || null;
  const discount = item.original_price
    ? Math.round(((item.original_price - item.price) / item.original_price) * 100)
    : 0;

  return (
    <TouchableOpacity
      style={[styles.productCard, { backgroundColor: colors.backgroundCard, borderColor: colors.border }]}
      activeOpacity={0.8}
      onPress={() => router.push(`/product/${item.id}`)}
    >
      {imageUri ? (
        <Image source={{ uri: imageUri }} style={[styles.productImage, { backgroundColor: colors.surface }]} />
      ) : (
        <View style={[styles.productImage, styles.productImagePlaceholder, { backgroundColor: colors.surface }]}>
          <Ionicons name="image-outline" size={28} color={colors.textMuted} />
        </View>
      )}
      {discount > 0 && (
        <View style={[styles.discountBadge, { backgroundColor: colors.error }]}>
          <Text style={styles.discountText}>-{discount}%</Text>
        </View>
      )}
      <View style={styles.productInfo}>
        <Text style={[styles.productName, { color: colors.text }]} numberOfLines={2}>{item.name}</Text>
        <View style={styles.priceRow}>
          <Text style={[styles.productPrice, { color: colors.primary }]}>
            {item.price?.toLocaleString()} {item.currency_code || "XOF"}
          </Text>
          {item.original_price && (
            <Text style={[styles.productOriginalPrice, { color: colors.textMuted }]}>
              {item.original_price.toLocaleString()}
            </Text>
          )}
        </View>
        {item.shop_name && (
          <Text style={[styles.productSeller, { color: colors.textSecondary }]} numberOfLines={1}>{item.shop_name}</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

export function CategoryProductsView({ category, onBack }: { category: Category; onBack: () => void }) {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const bottomPadding = Platform.OS === "web" ? 34 : 90;
  const { data: products, isLoading, isError, refetch } = useQuery({
    queryKey: ["/api/categories", category.id, "products"],
    queryFn: () => api.categories.getProducts(category.id),
    staleTime: 1000 * 60 * 5,
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader onMenuPress={() => setDrawerOpen(true)} />
      <View style={styles.subHeader}>
        <View style={styles.backRow}>
          <Pressable
            onPress={onBack}
            style={({ pressed }) => [styles.backBtn, { opacity: pressed ? 0.6 : 1 }]}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text
              style={[styles.headerTitle, { color: colors.text }]}
              numberOfLines={2}
              adjustsFontSizeToFit
              minimumFontScale={0.7}
            >
              {category.name}
            </Text>
            {products && products.length > 0 && (
              <Text style={[styles.headerSub, { color: colors.textMuted }]}>
                {`${products.length} ${t.categories.products}`}
              </Text>
            )}
          </View>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textMuted }]}>{t.common.loading}</Text>
        </View>
      ) : isError ? (
        <View style={styles.emptyState}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
          <Text style={[styles.emptyText, { color: colors.text }]}>{t.common.error}</Text>
          <Text style={[styles.emptySubText, { color: colors.textMuted }]}>{t.categories.noProducts}</Text>
          <TouchableOpacity style={[styles.retryBtn, { backgroundColor: colors.primary }]} onPress={() => refetch()}>
            <Text style={styles.retryText}>{t.common.retry}</Text>
          </TouchableOpacity>
        </View>
      ) : !products || products.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="cube-outline" size={56} color={colors.textMuted} />
          <Text style={[styles.emptyText, { color: colors.text }]}>{t.categories.noProducts}</Text>
          <Text style={[styles.emptySubText, { color: colors.textMuted }]}>
            {t.categories.noProductsSub}
          </Text>
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          columnWrapperStyle={styles.productRow}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: bottomPadding, paddingTop: 8 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => <ProductCard item={item} />}
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={() => refetch()}
              tintColor={colors.primary}
            />
          }
        />
      )}
      <SideDrawer visible={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  subHeader: {
    flexDirection: "column",
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 8,
    gap: 8,
  },
  backRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 18,
    marginBottom: 2,
  },
  headerSub: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
  },
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  loadingText: { fontFamily: "Poppins_400Regular", fontSize: 13 },
  emptyState: { alignItems: "center", paddingTop: 60, gap: 8 },
  emptyText: { fontFamily: "Poppins_600SemiBold", fontSize: 16 },
  emptySubText: { fontFamily: "Poppins_400Regular", fontSize: 13 },
  retryBtn: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryText: { color: "#FFFFFF", fontFamily: "Poppins_600SemiBold", fontSize: 14 },
  productRow: { gap: 12, marginBottom: 12 },
  productCard: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
  },
  productImage: {
    width: "100%",
    height: 130,
    resizeMode: "cover",
  } as any,
  productImagePlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  discountBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  discountText: {
    color: "#FFFFFF",
    fontFamily: "Poppins_700Bold",
    fontSize: 10,
  },
  productInfo: { padding: 10, gap: 3 },
  productName: { fontFamily: "Poppins_600SemiBold", fontSize: 12, lineHeight: 16 },
  priceRow: { flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" },
  productPrice: { fontFamily: "Poppins_700Bold", fontSize: 13 },
  productOriginalPrice: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    textDecorationLine: "line-through",
  },
  productSeller: { fontFamily: "Poppins_400Regular", fontSize: 10 },
  categoryCard: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
  },
  categoryCardInner: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 6,
    gap: 6,
  },
  categoryIconWrap: {
    width: ms(36),
    height: ms(36),
    borderRadius: ms(9),
    alignItems: "center",
    justifyContent: "center",
  },
  categoryName: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: fs(10),
    textAlign: "center",
    lineHeight: 13,
  },
  categoryCount: {
    fontFamily: "Poppins_400Regular",
    fontSize: fs(9),
    textAlign: "center",
  },
});
