import React, { useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Modal,
  ScrollView,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api, Video } from "@/lib/api";
import { useTheme } from "@/contexts/ThemeContext";
import { useLanguage } from "@/contexts/LanguageContext";
import VideoFeed from "@/components/VideoFeed";
import { ms, fs } from "@/lib/responsive";

const IS_WEB = Platform.OS === "web";
const TAB_BAR_WEB = 84;
const TAB_BAR_NATIVE = 52;

const VIDEO_BG_COLORS = [
  "#0d0400", "#00080f", "#000f06", "#0f0009", "#0f0c00", "#000a1f", "#0f0700",
];
const VIDEO_ACCENTS = [
  "#FF6B00", "#3B82F6", "#22C55E", "#EC4899", "#F59E0B", "#8B5CF6", "#06B6D4",
];

const VIDEO_COUNTRIES = [
  { code: "ALL", flag: "🌍", name: "Tout" },
  { code: "CI", flag: "🇨🇮", name: "Côte d'Ivoire" },
  { code: "SN", flag: "🇸🇳", name: "Sénégal" },
  { code: "BJ", flag: "🇧🇯", name: "Bénin" },
  { code: "TG", flag: "🇹🇬", name: "Togo" },
  { code: "CM", flag: "🇨🇲", name: "Cameroun" },
  { code: "ML", flag: "🇲🇱", name: "Mali" },
  { code: "BF", flag: "🇧🇫", name: "Burkina Faso" },
  { code: "GN", flag: "🇬🇳", name: "Guinée" },
  { code: "CG", flag: "🇨🇬", name: "Congo" },
  { code: "GA", flag: "🇬🇦", name: "Gabon" },
  { code: "NE", flag: "🇳🇪", name: "Niger" },
  { code: "TD", flag: "🇹🇩", name: "Tchad" },
  { code: "MR", flag: "🇲🇷", name: "Mauritanie" },
  { code: "CD", flag: "🇨🇩", name: "RD Congo" },
];

const DEMO_VIDEOS: Video[] = [
  { id: 1, title: "Trench Coat Classic", shop_name: "Global Garments", views: 84200, likes: 12500, seller_id: 1, product_id: 1, video_url: "", thumbnail_url: null, country_code: "CI" },
  { id: 2, title: "Boubou Sénégalais Premium", shop_name: "Dakar Fashion", views: 52300, likes: 8900, seller_id: 2, product_id: 2, video_url: "", thumbnail_url: null, country_code: "SN" },
  { id: 3, title: "Robe Wax Abidjan", shop_name: "CI Style", views: 31000, likes: 5400, seller_id: 3, product_id: 3, video_url: "", thumbnail_url: null, country_code: "CI" },
  { id: 4, title: "Tissu Kente Ghana", shop_name: "Africa Textiles", views: 47800, likes: 9100, seller_id: 4, product_id: 4, video_url: "", thumbnail_url: null, country_code: "GN" },
  { id: 5, title: "Sneakers Edition Limitée", shop_name: "Urban Africa", views: 120000, likes: 24300, seller_id: 5, product_id: 5, video_url: "", thumbnail_url: null, country_code: "CM" },
  { id: 6, title: "Sac Cuir Artisanal", shop_name: "Maroquinerie Bamako", views: 19500, likes: 3700, seller_id: 6, product_id: 6, video_url: "", thumbnail_url: null, country_code: "ML" },
  { id: 7, title: "Parfum Oud Africain", shop_name: "Luxe Afrique", views: 63400, likes: 14800, seller_id: 7, product_id: 7, video_url: "", thumbnail_url: null, country_code: "SN" },
];

function fmtCount(n: number): string {
  if (!n) return "0";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

interface VideoCardProps {
  item: Video;
  index: number;
  onLike: (id: number) => void;
  bottomOffset: number;
}

function VideoCard({ item, index, onLike, bottomOffset }: VideoCardProps) {
  const { width: W, height: H } = useWindowDimensions();
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(item.likes ?? 0);
  const [showHeart, setShowHeart] = useState(false);
  const lastTap = useRef(0);
  const { t } = useLanguage();

  const bg = VIDEO_BG_COLORS[index % VIDEO_BG_COLORS.length];
  const accent = VIDEO_ACCENTS[index % VIDEO_ACCENTS.length];
  const productId = item.product_id || item.id;

  const handleTap = () => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      if (!liked) {
        setLiked(true);
        setLikeCount((p) => p + 1);
        onLike(item.id);
      }
      setShowHeart(true);
      if (!IS_WEB) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setTimeout(() => setShowHeart(false), 800);
    }
    lastTap.current = now;
  };

  return (
    <View style={[styles.page, { backgroundColor: bg, width: W, height: H }]} collapsable={false}>
      <View style={[StyleSheet.absoluteFill, styles.placeholderContainer]}>
        <View style={[styles.glowCircle, { backgroundColor: `${accent}18` }]} />
        <View style={[styles.glowCircleInner, { backgroundColor: `${accent}28` }]} />
        <Ionicons name="videocam" size={52} color={`${accent}99`} />
      </View>

      <View style={styles.bottomGradient} pointerEvents="none">
        <View style={styles.bottomGradientLayer1} />
        <View style={styles.bottomGradientLayer2} />
        <View style={styles.bottomGradientLayer3} />
      </View>

      <TouchableOpacity
        activeOpacity={1}
        style={StyleSheet.absoluteFill}
        onPress={handleTap}
      />

      {showHeart && (
        <View style={styles.heartOverlay} pointerEvents="none">
          <Ionicons name="heart" size={100} color="rgba(255,255,255,0.85)" />
        </View>
      )}

      <View style={[styles.rightActions, { bottom: bottomOffset + 50 }]}>
        <TouchableOpacity
          style={styles.avatarWrap}
          onPress={() =>
            router.push({ pathname: "/seller/[id]", params: { id: String(item.seller_id) } })
          }
        >
          <View style={styles.avatarCircle}>
            <Ionicons name="person" size={21} color="rgba(0,0,0,0.55)" />
          </View>
          <View style={styles.plusBadge}>
            <Ionicons name="add" size={12} color="#fff" />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => {
            const next = !liked;
            setLiked(next);
            setLikeCount((p) => (next ? p + 1 : Math.max(0, p - 1)));
            if (next) onLike(item.id);
            if (!IS_WEB) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
        >
          <Ionicons
            name={liked ? "shirt" : "shirt-outline"}
            size={28}
            color={liked ? "#FF3B5C" : "#fff"}
          />
          <Text style={styles.actionCount}>{fmtCount(likeCount)}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn}>
          <Ionicons name="chatbubble-ellipses-outline" size={26} color="#fff" />
          <Text style={styles.actionCount}>{fmtCount(item.views ?? 0)}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() =>
            router.push({ pathname: "/product/[id]", params: { id: String(productId) } })
          }
        >
          <View style={styles.basketBtn}>
            <Ionicons name="basket" size={20} color="#fff" />
          </View>
          <Text style={styles.actionCount}>Panier</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => { if (!IS_WEB) Haptics.selectionAsync(); }}
        >
          <Ionicons name="arrow-redo-outline" size={26} color="#fff" />
          <Text style={styles.actionCount}>Partager</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.bottomInfo, { bottom: bottomOffset + 4 }]}>
        <Text style={styles.sellerName}>@{item.shop_name || "Vendeur"}</Text>
        <View style={[styles.titleTag, { backgroundColor: accent }]}>
          <Text style={styles.titleTagText}>{(item.title || "").toUpperCase()}</Text>
        </View>
        <View style={styles.ctaRow}>
          <TouchableOpacity
            style={styles.commandBtn}
            onPress={() =>
              router.push({ pathname: "/product/[id]", params: { id: String(productId) } })
            }
          >
            <Ionicons name="bag-handle" size={15} color="#000" />
            <Text style={styles.commandText}>{t.videos.buyNow.toUpperCase()}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.boutiqueBtn}
            onPress={() =>
              router.push({ pathname: "/seller/[id]", params: { id: String(item.seller_id) } })
            }
          >
            <Ionicons name="storefront-outline" size={15} color="#fff" />
            <Text style={styles.boutiqueText}>BOUTIQUE</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const FOLLOWED_SELLER_IDS = [2, 4, 6];

export default function VideosScreen() {
  const { width: W, height: H } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState(2);
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedCountry, setSelectedCountry] = useState("ALL");
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const { colors } = useTheme();
  const { t } = useLanguage();

  const topOffset = IS_WEB ? 0 : insets.top;
  const bottomOffset = IS_WEB
    ? TAB_BAR_WEB
    : insets.bottom + TAB_BAR_NATIVE;

  const TABS = ["Live", t.videos.following, t.videos.forYou];

  const { data, isLoading } = useQuery({
    queryKey: ["/api/videos/for-you", selectedCountry],
    queryFn: async () => {
      try {
        const countryParam = selectedCountry !== "ALL" ? `country=${selectedCountry}&` : "";
        const result = await api.videos.forYou(`${countryParam}page=1&limit=20`);
        return Array.isArray(result) && result.length > 0 ? result : DEMO_VIDEOS;
      } catch {
        return DEMO_VIDEOS;
      }
    },
    staleTime: 60_000,
  });

  const allVideos: Video[] = Array.isArray(data) && data.length > 0 ? data : DEMO_VIDEOS;
  const countryVideos = selectedCountry === "ALL"
    ? allVideos
    : allVideos.filter((v) => (v.country_code ?? "CI") === selectedCountry);
  const tribuVideos: Video[] = countryVideos.filter((v) => FOLLOWED_SELLER_IDS.includes(v.seller_id ?? 0));
  const feedVideos: Video[] = activeTab === 1 ? tribuVideos : countryVideos;

  const currentCountry = VIDEO_COUNTRIES.find((c) => c.code === selectedCountry);

  const likeMutation = useMutation({ mutationFn: (id: number) => api.videos.like(id) });
  const handleLike = useCallback((id: number) => { likeMutation.mutate(id); }, []);
  const handlePageChange = useCallback((i: number) => setCurrentPage(i), []);

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const renderFeed = () => {
    if (activeTab === 0) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="radio-outline" size={64} color="rgba(255,255,255,0.25)" />
          <Text style={styles.emptyTitle}>Aucun live en ce moment</Text>
          <Text style={styles.emptySubtitle}>Les vendeurs en direct apparaîtront ici</Text>
        </View>
      );
    }
    if (activeTab === 1 && feedVideos.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="people-outline" size={64} color="rgba(255,255,255,0.25)" />
          <Text style={styles.emptyTitle}>Aucun contenu pour le moment</Text>
          <Text style={styles.emptySubtitle}>Abonnez-vous à des vendeurs pour voir leurs vidéos ici</Text>
        </View>
      );
    }
    return (
      <VideoFeed onPageChange={handlePageChange}>
        {feedVideos.map((video, index) => (
          <VideoCard
            key={`${activeTab}-${video.id}`}
            item={video}
            index={index}
            onLike={handleLike}
            bottomOffset={bottomOffset}
          />
        ))}
      </VideoFeed>
    );
  };

  return (
    <View style={styles.container}>
      {renderFeed()}

      <View style={[styles.topBar, { paddingTop: topOffset + 10 }]}>
        <TouchableOpacity
          style={styles.topIconBtn}
          onPress={() => router.push("/search" as any)}
        >
          <Ionicons name="search" size={22} color="#fff" />
        </TouchableOpacity>

        <View style={styles.tabs}>
          {TABS.map((tab, i) => (
            <TouchableOpacity
              key={tab}
              style={styles.tabItem}
              onPress={() => {
                setActiveTab(i);
                if (!IS_WEB) Haptics.selectionAsync();
              }}
            >
              <Text style={[styles.tabText, i === activeTab && styles.tabTextActive]}>
                {tab}
              </Text>
              {i === activeTab && <View style={styles.tabBarLine} />}
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={styles.topIconBtn}
          onPress={() => setShowCountryPicker(true)}
        >
          <Text style={styles.globeFlag}>{currentCountry?.flag ?? "🌍"}</Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={showCountryPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCountryPicker(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowCountryPicker(false)}
        />
        <View style={[styles.countrySheet, { paddingBottom: IS_WEB ? 24 : insets.bottom + 16 }]}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>🌍 Choisir un pays</Text>
          <ScrollView
            horizontal={false}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.countryGrid}
          >
            {VIDEO_COUNTRIES.map((c) => (
              <TouchableOpacity
                key={c.code}
                style={[
                  styles.countryChip,
                  selectedCountry === c.code && styles.countryChipActive,
                ]}
                onPress={() => {
                  setSelectedCountry(c.code);
                  setShowCountryPicker(false);
                  if (!IS_WEB) Haptics.selectionAsync();
                }}
              >
                <Text style={styles.countryChipFlag}>{c.flag}</Text>
                <Text style={[
                  styles.countryChipName,
                  selectedCountry === c.code && styles.countryChipNameActive,
                ]}>
                  {c.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  centered: { alignItems: "center", justifyContent: "center" },

  page: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  placeholderContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  glowCircle: {
    position: "absolute",
    width: ms(280),
    height: ms(280),
    borderRadius: ms(140),
  },
  glowCircleInner: {
    position: "absolute",
    width: ms(160),
    height: ms(160),
    borderRadius: ms(80),
  },
  bottomGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 340,
    zIndex: 1,
    overflow: "hidden",
  },
  bottomGradientLayer1: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 340,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  bottomGradientLayer2: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 200,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  bottomGradientLayer3: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    backgroundColor: "rgba(0,0,0,0.2)",
  },

  heartOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 50,
  },

  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 16,
    paddingBottom: 12,
    zIndex: 100,
  },
  topIconBtn: { width: 38, height: 38, alignItems: "center", justifyContent: "center" },
  globeFlag: { fontSize: 22, lineHeight: 26 },
  tabs: { flex: 1, flexDirection: "row", justifyContent: "center", alignItems: "flex-start", gap: 0 },
  tabItem: { alignItems: "center", paddingHorizontal: ms(7), paddingVertical: 2 },
  tabText: { color: "rgba(255,255,255,0.5)", fontFamily: "Poppins_600SemiBold", fontSize: fs(13) },
  tabTextActive: { color: "#fff" },
  tabBarLine: { height: 2, width: "70%", borderRadius: 2, marginTop: 3, backgroundColor: "#fff" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)" },
  countrySheet: {
    backgroundColor: "#1a1a1a",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 12,
    paddingHorizontal: 16,
    maxHeight: "65%",
  },
  sheetHandle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignSelf: "center", marginBottom: 14,
  },
  sheetTitle: {
    color: "#fff", fontFamily: "Poppins_700Bold", fontSize: fs(16),
    marginBottom: 14, textAlign: "center",
  },
  countryGrid: {
    flexDirection: "row", flexWrap: "wrap", gap: 8, paddingBottom: 8,
  },
  countryChip: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8,
    borderWidth: 1, borderColor: "transparent",
  },
  countryChipActive: {
    backgroundColor: "rgba(255,107,0,0.15)",
    borderColor: "#FF6B00",
  },
  countryChipFlag: { fontSize: 18 },
  countryChipName: { color: "rgba(255,255,255,0.75)", fontFamily: "Poppins_600SemiBold", fontSize: fs(12) },
  countryChipNameActive: { color: "#FF6B00" },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    color: "rgba(255,255,255,0.75)",
    fontFamily: "Poppins_700Bold",
    fontSize: fs(18),
    textAlign: "center",
  },
  emptySubtitle: {
    color: "rgba(255,255,255,0.4)",
    fontFamily: "Poppins_400Regular",
    fontSize: fs(14),
    textAlign: "center",
    lineHeight: fs(20),
  },

  rightActions: { position: "absolute", right: 12, alignItems: "center", gap: 16, zIndex: 10 },
  avatarWrap: { alignItems: "center", marginBottom: 4 },
  avatarCircle: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.9)",
    alignItems: "center", justifyContent: "center",
  },
  plusBadge: {
    position: "absolute", bottom: -8, width: 20, height: 20,
    borderRadius: 10, alignItems: "center", justifyContent: "center",
    borderWidth: 2, borderColor: "#000", backgroundColor: "#FF3B30",
  },
  actionBtn: { alignItems: "center", gap: 4 },
  actionCount: { color: "#fff", fontFamily: "Poppins_700Bold", fontSize: 11 },
  basketBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: "#E53935",
    alignItems: "center", justifyContent: "center",
  },

  bottomInfo: { position: "absolute", left: ms(14), right: ms(76), gap: 6, zIndex: 10 },
  sellerName: { color: "#fff", fontFamily: "Poppins_700Bold", fontSize: fs(15) },
  titleTag: { alignSelf: "flex-start", paddingHorizontal: ms(10), paddingVertical: 4, borderRadius: 20 },
  titleTagText: { color: "#fff", fontFamily: "Poppins_700Bold", fontSize: fs(10), letterSpacing: 0.8 },
  ctaRow: { flexDirection: "row", gap: 8, marginTop: 5 },
  commandBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 5, backgroundColor: "#fff", paddingVertical: ms(7), borderRadius: 10,
  },
  commandText: { color: "#000", fontFamily: "Poppins_700Bold", fontSize: fs(11) },
  boutiqueBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 5, backgroundColor: "rgba(255,255,255,0.15)", paddingVertical: ms(7),
    borderRadius: 10, borderWidth: 1.5, borderColor: "rgba(255,255,255,0.4)",
  },
  boutiqueText: { color: "#fff", fontFamily: "Poppins_700Bold", fontSize: fs(11) },
});
