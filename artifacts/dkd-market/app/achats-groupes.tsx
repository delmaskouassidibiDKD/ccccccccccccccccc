import React, { useCallback, useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Platform,
  TextInput,
  Animated as RNAnimated,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/contexts/ThemeContext";
import { STATIC_CATEGORIES } from "@/app/(tabs)/rayons";
import { CategoryCard } from "@/components/CategoryProductsView";
import Animated, {
  useSharedValue,
  useAnimatedRef,
  useAnimatedReaction,
  scrollTo,
  withRepeat,
  withTiming,
  cancelAnimation,
  Easing,
} from "react-native-reanimated";

type Category = {
  id: number;
  name: string;
  parent_id: number | null;
  icon_url: string | null;
  image_url: string | null;
  product_count?: number;
};

type WholesalerItem = { id: number; name: string; icon: string; color: string };

const WHOLESALERS: WholesalerItem[] = [
  { id: 1,  name: "Huilerie Kossam",   icon: "water-outline",           color: "#22C55E" },
  { id: 2,  name: "Textiles Abidjan",  icon: "shirt-outline",           color: "#FF6B00" },
  { id: 3,  name: "AgriCôte Plus",     icon: "leaf-outline",            color: "#84CC16" },
  { id: 4,  name: "ElecPro CI",        icon: "flash-outline",           color: "#3B82F6" },
  { id: 5,  name: "Savons Beauté",     icon: "color-palette-outline",   color: "#EC4899" },
  { id: 6,  name: "AgroCI Grains",     icon: "restaurant-outline",      color: "#F59E0B" },
  { id: 7,  name: "Dakar Textile",     icon: "shirt-outline",           color: "#8B5CF6" },
  { id: 8,  name: "SénéFruits",        icon: "nutrition-outline",       color: "#EF4444" },
  { id: 9,  name: "CamAgro",           icon: "leaf-outline",            color: "#06B6D4" },
  { id: 10, name: "Lomé Mode",         icon: "bag-handle-outline",      color: "#F59E0B" },
];

const CONTINUOUS_PX_PER_SEC = 40;
const RESUME_DELAY_MS = 3500;

function LogoBanner() {
  const gap = 12;
  const itemWidth = 72;
  const step = itemWidth + gap;
  const loopData = [...WHOLESALERS, ...WHOLESALERS, ...WHOLESALERS];
  const oneLength = WHOLESALERS.length * step;
  const loopDuration = Math.round((oneLength / CONTINUOUS_PX_PER_SEC) * 1000);

  const animScrollRef = useAnimatedRef<Animated.ScrollView>();
  const scrollX = useSharedValue(0);
  const resumeRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useAnimatedReaction(
    () => scrollX.value,
    (x) => { scrollTo(animScrollRef, x, 0, false); },
  );

  const startScroll = useCallback(() => {
    scrollX.value = 0;
    scrollX.value = withRepeat(
      withTiming(oneLength, { duration: loopDuration, easing: Easing.linear }),
      -1,
      false,
    );
  }, [scrollX, oneLength, loopDuration]);

  useEffect(() => {
    startScroll();
    return () => cancelAnimation(scrollX);
  }, [startScroll, scrollX]);

  const onTouchStart = useCallback(() => {
    if (resumeRef.current) clearTimeout(resumeRef.current);
    cancelAnimation(scrollX);
  }, [scrollX]);

  const onScrollEnd = useCallback(() => {
    if (resumeRef.current) clearTimeout(resumeRef.current);
    resumeRef.current = setTimeout(startScroll, RESUME_DELAY_MS);
  }, [startScroll]);

  return (
    <View style={bannerStyles.wrap}>
      <View style={bannerStyles.headerRow}>
        <Text style={bannerStyles.label}>Grossistes partenaires</Text>
        <TouchableOpacity>
          <Text style={bannerStyles.seeAll}>Voir tout →</Text>
        </TouchableOpacity>
      </View>
      <Animated.ScrollView
        ref={animScrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingLeft: 16, gap, paddingBottom: 8 }}
        onTouchStart={onTouchStart}
        onScrollEndDrag={onScrollEnd}
        onMomentumScrollEnd={onScrollEnd}
        onTouchEnd={onScrollEnd}
      >
        {loopData.map((item, index) => (
          <View key={index} style={{ width: itemWidth }}>
            <TouchableOpacity activeOpacity={0.8} style={bannerStyles.card}>
              <View style={[bannerStyles.iconBox, { backgroundColor: item.color + "18", borderColor: item.color + "40" }]}>
                <Ionicons name={item.icon as any} size={22} color={item.color} />
              </View>
              <Text style={bannerStyles.name} numberOfLines={2}>{item.name}</Text>
            </TouchableOpacity>
          </View>
        ))}
      </Animated.ScrollView>
    </View>
  );
}

function GrosCard({ item, index }: { item: Category; index: number }) {
  return (
    <View style={styles.cardWrap}>
      <CategoryCard item={item} index={index} onPress={() => {}} />
      <View style={styles.grosBanner} pointerEvents="none">
        <Text style={styles.grosText}>EN GROS</Text>
      </View>
    </View>
  );
}

export default function AchatsGroupesPage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const paddingTop = Platform.OS === "web" ? 0 : insets.top;

  const [searchVisible, setSearchVisible] = useState(false);
  const [searchText, setSearchText] = useState("");
  const searchAnim = useRef(new RNAnimated.Value(0)).current;
  const inputRef = useRef<TextInput>(null);

  const toggleSearch = () => {
    if (!searchVisible) {
      setSearchVisible(true);
      RNAnimated.timing(searchAnim, { toValue: 1, duration: 220, useNativeDriver: false }).start(() => {
        inputRef.current?.focus();
      });
    } else {
      RNAnimated.timing(searchAnim, { toValue: 0, duration: 180, useNativeDriver: false }).start(() => {
        setSearchVisible(false);
        setSearchText("");
      });
    }
  };

  const searchHeight = searchAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 48] });
  const searchOpacity = searchAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });

  const filtered = searchText.trim()
    ? STATIC_CATEGORIES.filter((c) =>
        c.name.toLowerCase().includes(searchText.toLowerCase())
      )
    : STATIC_CATEGORIES;

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <View style={[styles.iconWrap, { backgroundColor: "#6366F120" }]}>
          <Ionicons name="people-outline" size={20} color="#6366F1" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.text }]}>Achats groupés / En gros</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            {filtered.length} catégorie{filtered.length !== 1 ? "s" : ""} • Produits en gros
          </Text>
        </View>
        <TouchableOpacity
          onPress={toggleSearch}
          style={[styles.searchBtn, searchVisible && { backgroundColor: "#FF6B0015" }]}
          activeOpacity={0.75}
        >
          <Ionicons
            name={searchVisible ? "close" : "search"}
            size={20}
            color={searchVisible ? "#FF6B00" : colors.text}
          />
        </TouchableOpacity>
      </View>

      <RNAnimated.View
        style={[
          styles.searchBar,
          { height: searchHeight, opacity: searchOpacity, borderBottomColor: colors.border },
        ]}
      >
        <View style={[styles.searchInput, { backgroundColor: colors.backgroundCard, borderColor: colors.border }]}>
          <Ionicons name="search" size={16} color={colors.textMuted} style={{ marginRight: 6 }} />
          <TextInput
            ref={inputRef}
            value={searchText}
            onChangeText={setSearchText}
            placeholder="Rechercher une catégorie..."
            placeholderTextColor={colors.textMuted}
            style={[styles.searchInputText, { color: colors.text }]}
            returnKeyType="search"
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => setSearchText("")}>
              <Ionicons name="close-circle" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </RNAnimated.View>

      <LogoBanner />

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        key="gros-grid"
        renderItem={({ item, index }) => <GrosCard item={item} index={index} />}
        contentContainerStyle={[
          styles.grid,
          { paddingBottom: (Platform.OS === "web" ? 34 : insets.bottom) + 16 },
        ]}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const bannerStyles = StyleSheet.create({
  wrap: { paddingBottom: 8, paddingTop: 4, borderBottomWidth: 1, borderBottomColor: "#F3F4F6" },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 8,
    paddingTop: 8,
  },
  label: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: "#374151",
  },
  seeAll: {
    fontFamily: "Poppins_500Medium",
    fontSize: 12,
    color: "#FF6B00",
  },
  card: { alignItems: "center", gap: 4 },
  iconBox: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  name: {
    fontFamily: "Poppins_400Regular",
    fontSize: 9,
    textAlign: "center",
    color: "#555",
    lineHeight: 12,
  },
});

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
    fontSize: 15,
  },
  subtitle: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    marginTop: -2,
  },
  searchBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  searchBar: {
    overflow: "hidden",
    paddingHorizontal: 14,
    justifyContent: "center",
    borderBottomWidth: 1,
  },
  searchInput: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    height: 36,
  },
  searchInputText: {
    flex: 1,
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    paddingVertical: 0,
  },
  grid: {
    paddingHorizontal: 8,
    paddingTop: 4,
  },
  cardWrap: {
    flex: 1,
    margin: 5,
  },
  grosBanner: {
    backgroundColor: "#DC2626",
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    paddingVertical: 4,
    alignItems: "center",
    marginTop: -2,
  },
  grosText: {
    fontFamily: "Poppins_700Bold",
    fontSize: 11,
    color: "#FFFFFF",
    letterSpacing: 1,
  },
});
