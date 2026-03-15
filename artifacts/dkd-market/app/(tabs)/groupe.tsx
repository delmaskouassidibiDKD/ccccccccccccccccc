import React, { useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Dimensions,
  Platform,
  Alert,
  RefreshControl,
  Image,
  TextInput,
  LayoutAnimation,
  UIManager,
} from "react-native";

import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

import { AppHeader } from "@/components/AppHeader";
import { SideDrawer } from "@/components/SideDrawer";
import { useTheme } from "@/contexts/ThemeContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { Group } from "@/lib/api";

import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const ACCENT_COLORS = ["#FF6B00", "#3B82F6", "#22C55E", "#EC4899", "#8B5CF6", "#F59E0B"];
const BG_COLORS = ["#3D1A00", "#001A3D", "#0D2D0D", "#2D0D2D", "#1A0D3D", "#2D2D0D"];

function getAccent(index: number) {
  return ACCENT_COLORS[index % ACCENT_COLORS.length];
}

function getBg(index: number) {
  return BG_COLORS[index % BG_COLORS.length];
}

const COUNTRY_FLAGS: Record<number, { code: string; flag: string; name: string }> = {
  16: { code: "CI", flag: "🇨🇮", name: "Côte d'Ivoire" },
  17: { code: "CD", flag: "🇨🇩", name: "Congo RDC" },
  18: { code: "CM", flag: "🇨🇲", name: "Cameroun" },
  19: { code: "ML", flag: "🇲🇱", name: "Mali" },
  20: { code: "BJ", flag: "🇧🇯", name: "Bénin" },
  21: { code: "SN", flag: "🇸🇳", name: "Sénégal" },
  22: { code: "TG", flag: "🇹🇬", name: "Togo" },
  23: { code: "GN", flag: "🇬🇳", name: "Guinée" },
  24: { code: "BF", flag: "🇧🇫", name: "Burkina Faso" },
  25: { code: "GA", flag: "🇬🇦", name: "Gabon" },
  26: { code: "CG", flag: "🇨🇬", name: "Congo" },
  27: { code: "TD", flag: "🇹🇩", name: "Tchad" },
  28: { code: "GW", flag: "🇬🇼", name: "Guinée Bissau" },
  29: { code: "NE", flag: "🇳🇪", name: "Niger" },
  30: { code: "CF", flag: "🇨🇫", name: "Centrafrique" },
};

function formatPrice(price: number): string {
  return price.toLocaleString("fr-FR") + " FCFA";
}

const DEMO_GROUPS: Group[] = [
  {
    id: 1,
    group_code: "GRP001",
    group_name: "Pagnes Wax Holland",
    product_id: 1,
    creator_id: 1,
    target_quantity: 50,
    current_quantity: 32,
    target_participants: 20,
    current_participants: 14,
    unit_price: 18500,
    discounted_price: 13000,
    icon_url: null,
    description: "Wax hollandais authentique, 6 yards. Livraison groupée Abidjan & Dakar.",
    country_id: 16,
    expiry_date: new Date(Date.now() + 2 * 24 * 3600 * 1000).toISOString(),
    status: "active",
    created_at: new Date().toISOString(),
    product_name: "Pagne Wax Holland 6Y",
    image_url: "https://images.unsplash.com/photo-1612198188060-c7c2a3b66eae?w=600&q=80",
    creator_name: "Aminata Koné",
  },
  {
    id: 2,
    group_code: "GRP002",
    group_name: "Café Robusta Cameroun",
    product_id: 2,
    creator_id: 2,
    target_quantity: 100,
    current_quantity: 78,
    target_participants: 25,
    current_participants: 20,
    unit_price: 9500,
    discounted_price: 6800,
    icon_url: null,
    description: "Café 100% robusta des hauts plateaux de l'Ouest, torréfaction artisanale.",
    country_id: 18,
    expiry_date: new Date(Date.now() + 5 * 3600 * 1000).toISOString(),
    status: "active",
    created_at: new Date().toISOString(),
    product_name: "Café Robusta 1kg",
    image_url: "https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=600&q=80",
    creator_name: "Jean Fotso",
  },
  {
    id: 3,
    group_code: "GRP003",
    group_name: "Huile de Karité Mali",
    product_id: 3,
    creator_id: 3,
    target_quantity: 200,
    current_quantity: 200,
    target_participants: 30,
    current_participants: 30,
    unit_price: 7200,
    discounted_price: 4900,
    icon_url: null,
    description: "Karité pur grade A, extraction traditionnelle femmes de Ségou.",
    country_id: 19,
    expiry_date: new Date(Date.now() + 1 * 3600 * 1000).toISOString(),
    status: "filled",
    created_at: new Date().toISOString(),
    product_name: "Beurre de Karité 500g",
    image_url: "https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=600&q=80",
    creator_name: "Fatoumata Diallo",
  },
];

const DEMO_MY_GROUPS: Group[] = [
  {
    id: 10,
    group_code: "MY001",
    group_name: "Thiébou Dieune Sénégal",
    product_id: 10,
    creator_id: 5,
    target_quantity: 80,
    current_quantity: 55,
    target_participants: 15,
    current_participants: 9,
    unit_price: 4500,
    discounted_price: 3100,
    icon_url: null,
    description: "Riz brisé spécial thiébou dieune, importé directement de Saint-Louis.",
    country_id: 21,
    expiry_date: new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString(),
    status: "active",
    created_at: new Date().toISOString(),
    product_name: "Riz Saint-Louis 25kg",
    image_url: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&q=80",
    creator_name: "Ousmane Diop",
  },
  {
    id: 11,
    group_code: "MY002",
    group_name: "Huile de Palme Bénin",
    product_id: 11,
    creator_id: 6,
    target_quantity: 120,
    current_quantity: 96,
    target_participants: 12,
    current_participants: 10,
    unit_price: 5800,
    discounted_price: 3950,
    icon_url: null,
    description: "Huile rouge non raffinée, pressée à froid, saveur authentique.",
    country_id: 20,
    expiry_date: new Date(Date.now() + 18 * 3600 * 1000).toISOString(),
    status: "active",
    created_at: new Date().toISOString(),
    product_name: "Huile Palme Rouge 5L",
    image_url: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&q=80",
    creator_name: "Béatrice Aïkpé",
  },
];

const DEMO_EXTRA_IMAGES: Record<number, string[]> = {
  1:  ["https://images.unsplash.com/photo-1612198188060-c7c2a3b66eae?w=400&q=80", "https://images.unsplash.com/photo-1558171813-1f6e7789c224?w=400&q=80"],
  2:  ["https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=400&q=80", "https://images.unsplash.com/photo-1511537190424-bbbab87ac5eb?w=400&q=80"],
  3:  ["https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400&q=80", "https://images.unsplash.com/photo-1607305387299-a3d9611cd469?w=400&q=80"],
  10: ["https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&q=80", "https://images.unsplash.com/photo-1516714819001-8ee7a13b71d7?w=400&q=80"],
  11: ["https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&q=80", "https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?w=400&q=80"],
};

function OpportunityCard({ item, index }: { item: Group; index: number }) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const accent = getAccent(index);
  const bg = getBg(index);
  const progress = item.target_participants > 0 ? item.current_participants / item.target_participants : 0;
  const { colors } = useTheme();
  const { t } = useLanguage();

  const getTimeLeft = (expiryDate: string): string => {
    const diff = new Date(expiryDate).getTime() - Date.now();
    if (diff <= 0) return t.groups.finished;
    const hours = Math.floor(diff / 3600000);
    if (hours > 24) return `${Math.floor(hours / 24)}j`;
    if (hours > 0) return `${hours}h`;
    return `${Math.floor(diff / 60000)}min`;
  };

  const handleJoin = () => {
    Haptics.selectionAsync();
  };

  return (
    <Animated.View style={[styles.opportunityCard, animStyle, { backgroundColor: colors.backgroundCard, borderColor: colors.border }]}>
      <TouchableOpacity
        activeOpacity={1}
        onPressIn={() => { scale.value = withSpring(0.97); Haptics.selectionAsync(); }}
        onPressOut={() => { scale.value = withSpring(1); }}
        onPress={() => router.push({ pathname: "/product/[id]", params: { id: String(item.product_id) } })}
      >
        <View style={[styles.oppImageWrap, { backgroundColor: bg }]}>
          {item.image_url ? (
            <Image source={{ uri: item.image_url }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
          ) : (
            <Ionicons name="bag-handle" size={44} color={accent} />
          )}
          {/* Dégradé sombre en bas */}
          <View style={styles.oppGradient} pointerEvents="none" />
          {/* Badge GROUPE */}
          <View style={[styles.flashSaleBadge, { backgroundColor: colors.primary }]}>
            <Text style={styles.flashSaleText}>{t.groups.group}</Text>
          </View>
          {/* Drapeau pays */}
          {COUNTRY_FLAGS[item.country_id] && (
            <View style={styles.oppFlagBadge}>
              <Text style={{ fontSize: 12 }}>{COUNTRY_FLAGS[item.country_id].flag}</Text>
            </View>
          )}
          {/* Participants */}
          <View style={[styles.oppRatingBadge, { backgroundColor: "rgba(0,0,0,0.55)" }]}>
            <Ionicons name="people" size={10} color="#fff" />
            <Text style={[styles.oppRatingText, { color: "#fff" }]}>{item.current_participants}/{item.target_participants}</Text>
          </View>
          <View style={styles.timerBadge}>
            <Ionicons name="time-outline" size={10} color="#fff" />
            <Text style={styles.timerText}>{getTimeLeft(item.expiry_date)}</Text>
          </View>
        </View>
        <View style={styles.oppInfo}>
          <Text style={[styles.oppName, { color: colors.text }]} numberOfLines={1}>{item.product_name || item.group_name}</Text>
          <Text style={[styles.oppPriceNew, { color: accent, marginBottom: 4 }]} numberOfLines={1}>
            {formatPrice(item.discounted_price || item.unit_price)}
            <Text style={{ fontFamily: "Poppins_400Regular", fontSize: 9, color: colors.textMuted }}> /pers.</Text>
          </Text>
          <View style={styles.oppProgress}>
            <View style={[styles.oppProgressBar, { backgroundColor: accent + "30" }]}>
              <View style={[styles.oppProgressFill, { width: `${progress * 100}%` as any, backgroundColor: accent }]} />
            </View>
            <Text style={[styles.oppMembers, { color: colors.textMuted }]}>{item.current_participants}/{item.target_participants}</Text>
          </View>
          <View style={styles.oppBtnRow}>
            <TouchableOpacity
              style={[styles.joinBtn, { backgroundColor: accent, flex: 1 }]}
              onPress={handleJoin}
            >
              <Ionicons name="people-outline" size={13} color="#fff" />
              <Text style={styles.joinBtnText}>{t.groups.joinGroup.toUpperCase()}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.oppCartBtn, { borderColor: accent + "70", backgroundColor: accent + "12" }]}
              onPress={() => Haptics.selectionAsync()}
              activeOpacity={0.75}
            >
              <Ionicons name="cart-outline" size={16} color={accent} />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

function ActiveGroupCard({ item, index }: { item: Group; index: number }) {
  const { colors } = useTheme();
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const progress = item.target_participants > 0 ? item.current_participants / item.target_participants : 0;
  const spotsLeft = Math.max(0, item.target_participants - item.current_participants);
  const savings = item.unit_price && item.discounted_price && item.unit_price > item.discounted_price
    ? Math.round(((item.unit_price - item.discounted_price) / item.unit_price) * 100)
    : 0;
  const countryInfo = COUNTRY_FLAGS[item.country_id];
  const images: string[] = DEMO_EXTRA_IMAGES[item.id] ?? (item.image_url ? [item.image_url] : []);
  const IMG_W = (SCREEN_WIDTH - 32) / 2;

  const getTimeLeft = (expiry: string): string => {
    const diff = new Date(expiry).getTime() - Date.now();
    if (diff <= 0) return "Expiré";
    const h = Math.floor(diff / 3600000);
    if (h > 48) return `${Math.floor(h / 24)}j`;
    if (h > 0) return `${h}h`;
    return `${Math.floor(diff / 60000)}min`;
  };

  const isFull = item.status === "filled";
  const isCancelled = item.status === "cancelled";

  return (
    <Animated.View
      style={[
        styles.agCard,
        animStyle,
        {
          backgroundColor: colors.backgroundCard,
          borderColor: "#FF6B00" + "30",
          ...(Platform.OS === "web"
            ? { boxShadow: "0px 8px 24px rgba(255,107,0,0.12), 0px 2px 6px rgba(0,0,0,0.08)" }
            : { elevation: 6, shadowColor: "#FF6B00", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12 }),
        },
      ]}
    >
      <TouchableOpacity
        activeOpacity={1}
        onPressIn={() => { scale.value = withSpring(0.985); }}
        onPressOut={() => { scale.value = withSpring(1); }}
        onPress={() => router.push({ pathname: "/product/[id]", params: { id: String(item.product_id) } })}
      >
        {/* ── PHOTO CAROUSEL ── */}
        <View style={styles.agPhotoArea}>
          {images.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              decelerationRate="fast"
              snapToInterval={IMG_W + 2}
              snapToAlignment="start"
              style={{ flex: 1 }}
              contentContainerStyle={{ flexDirection: "row" }}
            >
              {images.map((uri, i) => (
                <View key={i} style={{ width: IMG_W, height: 110, marginRight: i < images.length - 1 ? 2 : 0 }}>
                  <Image
                    source={{ uri }}
                    style={{ width: IMG_W, height: 110 }}
                    resizeMode="cover"
                  />
                </View>
              ))}
            </ScrollView>
          ) : (
            <View style={[styles.agPhotoPlaceholder, { backgroundColor: colors.surface }]}>
              <View style={styles.agPhotoPlaceholderInner}>
                <Ionicons name="bag-handle" size={36} color="#FF6B00" style={{ opacity: 0.7 }} />
              </View>
            </View>
          )}

          {/* Dark gradient overlay */}
          <View style={styles.agPhotoGradient} pointerEvents="none" />

          {/* Country flag — top left */}
          {countryInfo && (
            <View style={styles.agFlagBadge}>
              <Text style={styles.agFlagEmoji}>{countryInfo.flag}</Text>
              <Text style={styles.agFlagCode}>{countryInfo.code}</Text>
            </View>
          )}

          {/* Savings badge — top right */}
          {savings > 0 && (
            <View style={styles.agSavingsBadge}>
              <Text style={styles.agSavingsText}>-{savings}%</Text>
            </View>
          )}

          {/* Timer — bottom left */}
          <View style={styles.agTimerBadge}>
            <Ionicons name="time-outline" size={9} color="#fff" />
            <Text style={styles.agTimerText}>{getTimeLeft(item.expiry_date)}</Text>
          </View>

          {/* Status badge — bottom right */}
          {(isFull || isCancelled) && (
            <View style={[styles.agStatusBadge, { backgroundColor: isFull ? "#22C55E" : "#e74c3c" }]}>
              <Text style={styles.agStatusBadgeText}>{isFull ? "COMPLET" : "ANNULÉ"}</Text>
            </View>
          )}

          {/* Image count dots */}
          {images.length > 1 && (
            <View style={styles.agDots}>
              {images.map((_, i) => (
                <View key={i} style={[styles.agDot, { opacity: i === 0 ? 1 : 0.4 }]} />
              ))}
            </View>
          )}
        </View>

        {/* ── CARD BODY ── */}
        <View style={styles.agBody}>
          {/* Ligne 1 : avatar + nom + boutons */}
          <View style={styles.agTopRow}>
            <View style={[styles.agAvatar, { backgroundColor: "#FF6B00" + "15", borderColor: "#FF6B00" + "40" }]}>
              {item.icon_url
                ? <Image source={{ uri: item.icon_url }} style={styles.agAvatarImg} />
                : <Ionicons name="people" size={14} color="#FF6B00" />}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.agGroupName, { color: colors.text }]} numberOfLines={1}>{item.group_name}</Text>
              {item.product_name && (
                <Text style={[styles.agDetailText, { color: colors.textMuted }]} numberOfLines={1}>
                  {item.product_name}
                </Text>
              )}
            </View>
            {/* Boutons en ligne */}
            <View style={styles.agActionRow}>
              <TouchableOpacity
                style={[styles.agJoinBtn, isFull && { backgroundColor: "#22C55E" }, isCancelled && { backgroundColor: colors.surface }]}
                onPress={() => {}} activeOpacity={0.85}
              >
                <Text style={[styles.agJoinText, isCancelled && { color: colors.textMuted }]}>
                  {isFull ? "Complet" : isCancelled ? "Annulé" : "Rejoindre"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.agIconBtn, { borderColor: "#FF6B00" + "60" }]}
                onPress={() => router.push({ pathname: "/videos" })} activeOpacity={0.8}
              >
                <Ionicons name="play-circle-outline" size={15} color="#FF6B00" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.agIconBtn, { borderColor: colors.border }]}
                onPress={() => Haptics.selectionAsync()} activeOpacity={0.8}
              >
                <Ionicons name="cart-outline" size={15} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Ligne 2 : objectif + articles par personne */}
          {(() => {
            const artPerPerson = item.target_participants > 0
              ? Math.floor(item.target_quantity / item.target_participants)
              : 0;
            return (
              <View style={styles.agDetailRow}>
                <Ionicons name="people-outline" size={10} color={colors.textMuted} />
                <Text style={[styles.agDetailText, { color: colors.textMuted }]}>
                  {item.target_participants} pers.
                </Text>
                <Text style={[styles.agDetailSep, { color: colors.border }]}>·</Text>
                <Ionicons name="cube-outline" size={10} color={colors.textMuted} />
                <Text style={[styles.agDetailText, { color: colors.textMuted }]}>
                  {item.target_quantity} art. au total
                </Text>
                {artPerPerson > 0 && (
                  <>
                    <Text style={[styles.agDetailSep, { color: colors.border }]}>·</Text>
                    <Text style={[styles.agDetailText, { color: "#FF6B00", fontFamily: "Poppins_600SemiBold" }]}>
                      {artPerPerson} art./pers.
                    </Text>
                  </>
                )}
              </View>
            );
          })()}

          {/* Ligne 3 : prix */}
          <View style={styles.agDetailRow}>
            <Ionicons name="wallet-outline" size={10} color="#FF6B00" />
            <Text style={styles.agPriceValue} numberOfLines={1}>
              {formatPrice(item.discounted_price || item.unit_price)} / pers.
            </Text>
          </View>

          {/* Ligne 4 : description */}
          {!!item.description && (
            <Text style={[styles.agDesc, { marginBottom: 5 }]} numberOfLines={1}>
              "{item.description}"
            </Text>
          )}

          {/* Ligne 5 : progression */}
          <View style={styles.agProgressRow}>
            <Text style={styles.agSpotsLeft}>
              {spotsLeft > 0 ? `${spotsLeft} place${spotsLeft > 1 ? "s" : ""} restante${spotsLeft > 1 ? "s" : ""}` : "Complet"}
            </Text>
            <Text style={[styles.agProgressCount, { color: colors.textMuted }]}>
              {item.current_participants}/{item.target_participants}
            </Text>
          </View>
          <View style={[styles.agProgressBg, { backgroundColor: "#FF6B00" + "18" }]}>
            <View style={[styles.agProgressFill, { width: `${Math.min(progress * 100, 100)}%` as any }]} />
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

function LoadingSkeleton() {
  const { colors } = useTheme();
  return (
    <View style={styles.skeletonContainer}>
      <View style={[styles.skeletonCard, { backgroundColor: colors.backgroundCard, borderColor: colors.border }]} />
      <View style={[styles.skeletonCard, { backgroundColor: colors.backgroundCard, borderColor: colors.border }]} />
      <View style={[styles.skeletonCard, { backgroundColor: colors.backgroundCard, borderColor: colors.border }]} />
    </View>
  );
}

function EmptyState({ message }: { message: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.emptyState}>
      <Ionicons name="people-outline" size={40} color={colors.textMuted} />
      <Text style={[styles.emptyStateText, { color: colors.textMuted }]}>{message}</Text>
    </View>
  );
}

type SortMode = "expensive" | "cheap" | "almost_full" | null;

const SORT_OPTIONS: { key: SortMode; label: string; icon: string }[] = [
  { key: "expensive", label: "Plus chère", icon: "arrow-up" },
  { key: "cheap",     label: "Moins chère", icon: "arrow-down" },
  { key: "almost_full", label: "Presque complet", icon: "people" },
];

export default function GroupeScreen() {
  const bottomPadding = Platform.OS === "web" ? 34 : 90;
  const { colors } = useTheme();
  const { t } = useLanguage();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<number | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<TextInput>(null);

  const groups: Group[] = DEMO_GROUPS;
  const allMyGroups: Group[] = DEMO_MY_GROUPS;

  const filteredMyGroups = (() => {
    let list = selectedCountry !== null
      ? allMyGroups.filter(g => g.country_id === selectedCountry)
      : allMyGroups;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(g =>
        g.group_name.toLowerCase().includes(q) ||
        (g.product_name || "").toLowerCase().includes(q) ||
        String(g.discounted_price || g.unit_price).includes(q)
      );
    }
    if (sortMode === "expensive") list = [...list].sort((a, b) => (b.discounted_price || b.unit_price) - (a.discounted_price || a.unit_price));
    if (sortMode === "cheap")     list = [...list].sort((a, b) => (a.discounted_price || a.unit_price) - (b.discounted_price || b.unit_price));
    if (sortMode === "almost_full") list = [...list].sort((a, b) => {
      const pa = a.target_participants > 0 ? a.current_participants / a.target_participants : 0;
      const pb = b.target_participants > 0 ? b.current_participants / b.target_participants : 0;
      return pb - pa;
    });
    return list;
  })();

  const toggleSearch = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (searchOpen) {
      setSearchQuery("");
      setSearchOpen(false);
    } else {
      setSearchOpen(true);
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await new Promise(r => setTimeout(r, 800));
    setRefreshing(false);
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader onMenuPress={() => setDrawerOpen(true)} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: bottomPadding }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        <View style={styles.heroBanner}>
          <View style={[styles.heroIcon, { backgroundColor: colors.backgroundCard, borderColor: colors.border }]}>
            <MaterialCommunityIcons name="account-group" size={28} color={colors.text} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.heroTitle, { color: colors.text }]}>{t.groups.title.toUpperCase()}</Text>
            <Text style={[styles.heroSubtitle, { color: colors.textMuted }]}>{t.groups.collaborativeSavings}</Text>
          </View>
          {/* Bouton loupe */}
          <TouchableOpacity
            style={[styles.heroActionBtn, { backgroundColor: searchOpen ? colors.primary : colors.backgroundCard, borderColor: searchOpen ? colors.primary : colors.border }]}
            onPress={toggleSearch}
            activeOpacity={0.8}
          >
            <Ionicons name={searchOpen ? "close" : "search"} size={16} color={searchOpen ? "#fff" : colors.text} />
          </TouchableOpacity>
        </View>

        {/* Champ de recherche animé */}
        {searchOpen && (
          <View style={[styles.searchBar, { backgroundColor: colors.backgroundCard, borderColor: colors.border }]}>
            <Ionicons name="search" size={14} color={colors.textMuted} />
            <TextInput
              ref={searchInputRef}
              style={[styles.searchInput, { color: colors.text }]}
              placeholder={selectedCountry !== null ? `Rechercher en ${COUNTRY_FLAGS[selectedCountry]?.name}…` : "Nom du groupe, article, prix…"}
              placeholderTextColor={colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
              onSubmitEditing={() => {}}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Ionicons name="close-circle" size={16} color={colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>
        )}

        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="trending-up" size={16} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t.groups.topOpportunities}</Text>
          </View>
          <TouchableOpacity
            style={[styles.createGroupBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.push("/achats-groupes" as any)}
            activeOpacity={0.85}
          >
            <Ionicons name="add" size={13} color="#fff" />
            <Text style={styles.createGroupBtnText}>Créer un groupe</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={groups}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listPadding}
          renderItem={({ item, index }) => <OpportunityCard item={item} index={index} />}
          scrollEnabled={groups.length > 1}
        />

        {/* Header MES GROUPES ACTIFS */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t.groups.myActiveGroups}</Text>
        </View>

        {/* Filtre tri */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sortRow}>
          {SORT_OPTIONS.map(opt => {
            const active = sortMode === opt.key;
            return (
              <TouchableOpacity
                key={opt.key}
                style={[styles.sortChip, active && { backgroundColor: colors.primary, borderColor: colors.primary }]}
                onPress={() => setSortMode(active ? null : opt.key)}
                activeOpacity={0.8}
              >
                <Ionicons name={opt.icon as any} size={11} color={active ? "#fff" : colors.textMuted} />
                <Text style={[styles.sortChipText, { color: active ? "#fff" : colors.textMuted }]}>{opt.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Filtre pays */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.countryRow}>
          {/* Bouton "Tous" = reset */}
          <TouchableOpacity
            style={[styles.countryChip, selectedCountry === null && { borderColor: colors.primary, backgroundColor: colors.primary + "18" }]}
            onPress={() => setSelectedCountry(null)}
            activeOpacity={0.8}
          >
            <Text style={[styles.countryChipFlag]}>🌍</Text>
            <Text style={[styles.countryChipName, { color: selectedCountry === null ? colors.primary : colors.textMuted }]}>Tous</Text>
          </TouchableOpacity>
          {Object.entries(COUNTRY_FLAGS).map(([id, c]) => {
            const cid = Number(id);
            const active = selectedCountry === cid;
            return (
              <TouchableOpacity
                key={id}
                style={[styles.countryChip, active && { borderColor: colors.primary, backgroundColor: colors.primary + "18" }]}
                onPress={() => setSelectedCountry(active ? null : cid)}
                activeOpacity={0.8}
              >
                <Text style={styles.countryChipFlag}>{c.flag}</Text>
                <Text style={[styles.countryChipName, { color: active ? colors.primary : colors.textMuted }]}>{c.code}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Liste filtrée */}
        {filteredMyGroups.length === 0 ? (
          <View style={styles.emptyCountry}>
            <Text style={{ fontSize: 28 }}>
              {selectedCountry !== null ? COUNTRY_FLAGS[selectedCountry]?.flag : "🌍"}
            </Text>
            <Text style={[styles.emptyCountryText, { color: colors.textMuted }]}>
              Aucun groupe disponible
              {selectedCountry !== null ? `\nen ${COUNTRY_FLAGS[selectedCountry]?.name}` : ""}
            </Text>
          </View>
        ) : (
          <View style={styles.activeGroupsList}>
            {filteredMyGroups.map((group, index) => (
              <ActiveGroupCard key={group.id} item={group} index={index} />
            ))}
          </View>
        )}

      </ScrollView>
      <SideDrawer visible={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  heroBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
  },
  heroIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  heroTitle: { fontFamily: "Poppins_800ExtraBold", fontSize: 18, letterSpacing: 1 },
  heroSubtitle: {
    fontFamily: "Poppins_500Medium",
    fontSize: 10,
    letterSpacing: 2,
  },
  cooperationCard: {
    marginHorizontal: 16,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    overflow: "hidden",
  },
  cooperationBadge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.25)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 10,
  },
  cooperationBadgeText: { color: "#fff", fontFamily: "Poppins_700Bold", fontSize: 10, letterSpacing: 1 },
  cooperationSlogan: { color: "#fff", fontFamily: "Poppins_800ExtraBold", fontSize: 22, lineHeight: 30, marginBottom: 16 },
  cooperationStats: { flexDirection: "row", alignItems: "center", gap: 20 },
  cooperationStat: { gap: 2 },
  cooperationStatValue: { color: "#fff", fontFamily: "Poppins_800ExtraBold", fontSize: 28 },
  cooperationStatLabel: { color: "rgba(255,255,255,0.7)", fontFamily: "Poppins_500Medium", fontSize: 11 },
  cooperationDivider: { width: 1, height: 40, backgroundColor: "rgba(255,255,255,0.3)" },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  sectionTitle: { fontFamily: "Poppins_700Bold", fontSize: 13, letterSpacing: 1 },
  sectionCount: { fontFamily: "Poppins_700Bold", fontSize: 18 },
  heroActionBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginBottom: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    paddingVertical: 0,
  },
  createGroupBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  createGroupBtnText: { color: "#fff", fontFamily: "Poppins_700Bold", fontSize: 11 },
  sortRow: {
    paddingHorizontal: 16,
    gap: 8,
    paddingBottom: 10,
  },
  sortChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "transparent",
    backgroundColor: "transparent",
  },
  sortChipText: { fontFamily: "Poppins_600SemiBold", fontSize: 11 },
  countryRow: {
    paddingHorizontal: 16,
    gap: 6,
    paddingBottom: 12,
  },
  countryChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "transparent",
    backgroundColor: "transparent",
  },
  countryChipFlag: { fontSize: 14 },
  countryChipName: { fontFamily: "Poppins_700Bold", fontSize: 10 },
  emptyCountry: {
    alignItems: "center",
    paddingVertical: 32,
    gap: 10,
  },
  emptyCountryText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 20,
  },
  listPadding: { paddingHorizontal: 16, gap: 12, paddingBottom: 16 },
  opportunityCard: {
    width: 160,
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
  },
  oppImageWrap: {
    height: 110,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  oppGradient: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.15)",
  },
  oppFlagBadge: {
    position: "absolute",
    bottom: 8,
    right: 8,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  flashSaleBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  flashSaleText: { color: "#fff", fontFamily: "Poppins_700Bold", fontSize: 8 },
  oppRatingBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
  },
  oppRatingText: { fontFamily: "Poppins_600SemiBold", fontSize: 10 },
  timerBadge: {
    position: "absolute",
    bottom: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  timerText: { color: "#fff", fontFamily: "Poppins_600SemiBold", fontSize: 10 },
  oppInfo: { padding: 8 },
  oppFlag: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 3 },
  oppCountry: { fontFamily: "Poppins_500Medium", fontSize: 10 },
  oppName: { fontFamily: "Poppins_500Medium", fontSize: 11, marginBottom: 3, lineHeight: 15 },
  oppPriceOld: {
    fontFamily: "Poppins_400Regular",
    fontSize: 9,
    textDecorationLine: "line-through",
  },
  oppPriceNew: { fontFamily: "Poppins_700Bold", fontSize: 12 },
  oppProgress: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 6 },
  oppProgressBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
  },
  oppProgressFill: { height: "100%", borderRadius: 2 },
  oppMembers: { fontFamily: "Poppins_500Medium", fontSize: 10 },
  oppBtnRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  joinBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 6,
    borderRadius: 8,
  },
  joinBtnText: { color: "#fff", fontFamily: "Poppins_700Bold", fontSize: 10 },
  oppCartBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  createGroupCta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: 16,
    marginBottom: 20,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  createGroupText: { flex: 1 },
  createGroupTitle: { fontFamily: "Poppins_600SemiBold", fontSize: 14 },
  createGroupSub: { fontFamily: "Poppins_400Regular", fontSize: 11, marginTop: 2 },
  createGroupBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  createGroupBtnText: { color: "#fff", fontFamily: "Poppins_700Bold", fontSize: 12 },
  activeGroupsList: { paddingHorizontal: 16, gap: 14, marginBottom: 20 },
  agCard: {
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1.5,
  },
  agPhotoArea: {
    height: 110,
    overflow: "hidden",
    position: "relative",
  },
  agPhoto: {
    width: SCREEN_WIDTH - 32,
    height: 110,
  },
  agPhotoPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  agPhotoPlaceholderInner: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(255,107,0,0.1)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255,107,0,0.25)",
  },
  agPhotoGradient: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "transparent",
  },
  agFlagBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(0,0,0,0.45)",
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 7,
  },
  agFlagEmoji: { fontSize: 11 },
  agFlagCode: { color: "#fff", fontFamily: "Poppins_700Bold", fontSize: 8, letterSpacing: 0.5 },
  agSavingsBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(255,107,0,0.22)",
    borderWidth: 1,
    borderColor: "#FF6B00",
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 6,
  },
  agSavingsText: { color: "#FF6B00", fontFamily: "Poppins_700Bold", fontSize: 10 },
  agTimerBadge: {
    position: "absolute",
    bottom: 8,
    left: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 6,
  },
  agTimerText: { color: "#fff", fontFamily: "Poppins_600SemiBold", fontSize: 9 },
  agStatusBadge: {
    position: "absolute",
    bottom: 10,
    right: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  agStatusBadgeText: { color: "#fff", fontFamily: "Poppins_800ExtraBold", fontSize: 10, letterSpacing: 1 },
  agDots: {
    position: "absolute",
    bottom: 10,
    alignSelf: "center",
    flexDirection: "row",
    gap: 4,
  },
  agDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#fff" },
  agBody: { paddingHorizontal: 10, paddingVertical: 8 },
  agTopRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 },
  agAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
  },
  agAvatarImg: { width: 38, height: 38, borderRadius: 19 },
  agGroupName: { fontFamily: "Poppins_700Bold", fontSize: 12 },
  agObjective: { fontFamily: "Poppins_400Regular", fontSize: 10, marginTop: 1 },
  agActionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  agActionCol: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  agJoinBtn: {
    backgroundColor: "#FF6B00",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  agJoinText: { color: "#fff", fontFamily: "Poppins_700Bold", fontSize: 10 },
  agIconBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  agVideoBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1.5,
    minWidth: 80,
  },
  agVideoText: { color: "#FF6B00", fontFamily: "Poppins_600SemiBold", fontSize: 10 },
  agDetailRow: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 3, flexWrap: "nowrap" },
  agDetailText: { fontFamily: "Poppins_400Regular", fontSize: 10, flexShrink: 1 },
  agDetailSep: { fontFamily: "Poppins_400Regular", fontSize: 10 },
  agPriceRow: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
  agPriceLabel: { fontFamily: "Poppins_500Medium", fontSize: 10 },
  agPriceValue: { fontFamily: "Poppins_700Bold", fontSize: 11, color: "#FF6B00" },
  agDesc: { fontFamily: "Poppins_400Regular", fontSize: 10, color: "#FF6B00", fontStyle: "italic", marginBottom: 4, lineHeight: 14 },
  agProgressRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4, marginTop: 0 },
  agSpotsLeft: { fontFamily: "Poppins_600SemiBold", fontSize: 10, color: "#FF6B00" },
  agProgressCount: { fontFamily: "Poppins_500Medium", fontSize: 10 },
  agProgressBg: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  agProgressFill: { height: "100%", backgroundColor: "#FF6B00", borderRadius: 3 },
  howItWorks: {
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    gap: 12,
  },
  howTitle: { fontFamily: "Poppins_700Bold", fontSize: 14, marginBottom: 4 },
  howStep: { flexDirection: "row", alignItems: "center", gap: 10 },
  howStepNum: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  howStepNumText: { color: "#fff", fontFamily: "Poppins_700Bold", fontSize: 12 },
  howStepText: { flex: 1, fontFamily: "Poppins_400Regular", fontSize: 13 },
  skeletonContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 16,
  },
  skeletonCard: {
    width: 180,
    height: 260,
    borderRadius: 16,
    borderWidth: 1,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 30,
    paddingHorizontal: 16,
    gap: 8,
  },
  emptyStateText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 13,
    textAlign: "center",
  },
  errorContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
    paddingHorizontal: 16,
    gap: 8,
  },
  errorText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 13,
  },
  retryBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 4,
  },
  retryText: {
    color: "#fff",
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12,
  },
});
