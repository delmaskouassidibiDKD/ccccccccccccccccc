import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  TouchableOpacity,
  TouchableWithoutFeedback,
  TextInput,
  Animated,
  Platform,
  Dimensions,
  ActivityIndicator,
  Image,
  Share,
  RefreshControl,
  Modal,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/colors";
import { useTheme } from "@/contexts/ThemeContext";
import { useLocalSearchParams, router } from "expo-router";
import * as Haptics from "expo-haptics";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, Seller, Product } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { VideoPublication, DEMO_VIDEOS } from "@/data/videos";
import { DEMO_ARTICLES as ALL_ARTICLES, DELETED_ARTICLES_KEY } from "@/data/articles";
import { DEMO_ENGROS as ALL_ENGROS, DELETED_ENGROS_KEY } from "@/data/engros";
import { SellerProductCard } from "@/components/SellerProductCard";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const VIDEO_CELL = (SCREEN_WIDTH - 4) / 3;
const SELLER_CONVS_KEY = "@dkd:seller_convs";

type ChatMsg  = { id: string; text: string; sender: "me" | "seller"; time: string };
type SellerConv = { sellerId: string; shopName: string; initials: string; lastMessage: string; lastTime: string; unread: number; messages: ChatMsg[] };
const SELLER_TABS = ["Vidéos", "Articles", "En gros"];
const SELLER_SHOP_TYPES_KEY = "@dkd:seller_shop_types";
const PROFILE_PHOTO_KEY     = "@dkd:seller_profile_photo";

type PubType = "video" | "photo" | "article";
type PubSection = "marche" | "supermarche" | "importe" | "mon_plat" | "personnalisation" | "grossiste" | "vendeur";
interface PubItem { id: string; type: PubType; section?: PubSection; title: string; status: "pending" | "published"; progress?: number; }

const SECTION_LABELS: Record<PubSection, string> = {
  marche: "Marché", supermarche: "Super Marché", importe: "Importés",
  mon_plat: "Gastronomie", personnalisation: "Personnalisation", grossiste: "Grossiste", vendeur: "Vendeur",
};
const SECTION_COLORS: Record<PubSection, string> = {
  marche: "#22C55E", supermarche: "#F97316", importe: "#A855F7",
  mon_plat: "#EC4899", personnalisation: "#06B6D4", grossiste: "#3B82F6", vendeur: "#FF6B00",
};

const DEMO_PUBLICATIONS: PubItem[] = [
  { id: "p1", type: "video",   title: "Présentation boutique 🎬",    status: "pending",   progress: 65 },
  { id: "p2", type: "photo",   title: "Nouvelle collection robes",   status: "pending",   progress: 30 },
  { id: "p3", type: "article", section: "marche",     title: "Tomates fraîches 1kg",     status: "pending",   progress: 85 },
  { id: "p4", type: "video",   title: "Promo du jour 🔥",            status: "published" },
  { id: "p5", type: "article", section: "vendeur",    title: "Pagne wax Java 6 yards",   status: "published" },
  { id: "p6", type: "photo",   title: "Lookbook été 2025",           status: "published" },
  { id: "p7", type: "article", section: "grossiste",  title: "Sac de riz local 25kg",    status: "published" },
  { id: "p8", type: "article", section: "mon_plat",   title: "Poulet braisé sauce araignée", status: "published" },
];

const SHOP_TYPE_CFG: Record<string, { icon: string; label: string; color: string }> = {
  marche:           { icon: "basket-outline",        label: "Mon Marché",       color: "#22C55E" },
  grossiste:        { icon: "cube-outline",           label: "Grossiste",        color: "#3B82F6" },
  supermarche:      { icon: "storefront-outline",     label: "Super Marché",     color: "#F97316" },
  importe:          { icon: "airplane-outline",       label: "Importés",         color: "#A855F7" },
  mon_plat:         { icon: "restaurant-outline",     label: "Gastronomie",      color: "#EC4899" },
  personnalisation: { icon: "color-palette-outline",  label: "Personnalisation", color: "#06B6D4" },
};

function formatPrice(price: number, currency?: string): string {
  const formatted = Math.round(price).toLocaleString("fr-FR");
  return `${formatted} ${currency || "FCFA"}`;
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toString();
}

function getImageUri(images: string | null | undefined): string | null {
  if (!images) return null;
  try {
    const parsed = JSON.parse(images);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed[0];
  } catch {}
  if (typeof images === "string" && images.startsWith("http")) return images;
  return null;
}

export default function SellerScreen() {
  const { id, preview, chat } = useLocalSearchParams<{ id: string; preview?: string; chat?: string }>();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState(0);
  const [subscribed, setSubscribed] = useState(false);
  const [shopTypes, setShopTypes] = useState<string[]>([]);
  const [playerStartIndex, setPlayerStartIndex] = useState<number | null>(null);
  const [currentPlayerIdx, setCurrentPlayerIdx] = useState(0);
  const [pubArticles,   setPubArticles]   = useState(ALL_ARTICLES);
  const [pubEngros,     setPubEngros]     = useState(ALL_ENGROS);

  /* ── Recherche Articles / En gros ── */
  const [tabSearchOpen,  setTabSearchOpen]  = useState(false);
  const [tabSearchQuery, setTabSearchQuery] = useState("");
  const tabSearchAnim = useRef(new Animated.Value(0)).current;

  const toggleTabSearch = () => {
    Haptics.selectionAsync();
    const opening = !tabSearchOpen;
    setTabSearchOpen(opening);
    if (!opening) setTabSearchQuery("");
    Animated.timing(tabSearchAnim, {
      toValue: opening ? 1 : 0,
      duration: 220,
      useNativeDriver: false,
    }).start();
  };
  const [showChatModal, setShowChatModal] = useState(chat === "true");
  const [chatMessages,  setChatMessages]  = useState<ChatMsg[]>([]);
  const [chatInput,     setChatInput]     = useState("");
  const chatListRef = useRef<FlatList<ChatMsg>>(null);
  const [showPubModal,  setShowPubModal]  = useState(false);
  const [pubTab,        setPubTab]        = useState<"pending" | "published">("pending");

  /* ── Chat helpers ── */
  const loadChat = async () => {
    try {
      const raw = await AsyncStorage.getItem(SELLER_CONVS_KEY);
      const convs: SellerConv[] = raw ? JSON.parse(raw) : [];
      const conv = convs.find(c => c.sellerId === (id ?? "unknown"));
      setChatMessages(conv?.messages ?? []);
    } catch {}
  };

  const sendChatMessage = async () => {
    const text = chatInput.trim();
    if (!text) return;
    setChatInput("");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const now = new Date();
    const time = `${now.getHours().toString().padStart(2,"0")}:${now.getMinutes().toString().padStart(2,"0")}`;
    const newMsg: ChatMsg = { id: `m_${Date.now()}`, text, sender: "me", time };
    const updatedMsgs = [...chatMessages, newMsg];
    setChatMessages(updatedMsgs);
    setTimeout(() => chatListRef.current?.scrollToEnd({ animated: true }), 80);
    try {
      const raw = await AsyncStorage.getItem(SELLER_CONVS_KEY);
      const convs: SellerConv[] = raw ? JSON.parse(raw) : [];
      const idx = convs.findIndex(c => c.sellerId === (id ?? "unknown"));
      const conv: SellerConv = idx >= 0 ? convs[idx] : {
        sellerId: id ?? "unknown",
        shopName: shopName,
        initials: (shopName || "?").slice(0,2).toUpperCase(),
        lastMessage: "", lastTime: "", unread: 0, messages: [],
      };
      conv.messages = updatedMsgs;
      conv.lastMessage = text;
      conv.lastTime = time;
      if (idx >= 0) convs[idx] = conv; else convs.unshift(conv);
      await AsyncStorage.setItem(SELLER_CONVS_KEY, JSON.stringify(convs));
    } catch {}
  };

  const [logoError,     setLogoError]     = useState(false);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const { user } = useAuth();
  const { isDark } = useTheme();
  const dBG     = isDark ? "#0D1117" : "#F0F4F8";
  const dCARD   = isDark ? "#1C2230" : "#FFFFFF";
  const dTEXT   = isDark ? "#FFFFFF" : "#111827";
  const dSUB    = isDark ? "rgba(255,255,255,0.5)"  : "#6B7280";
  const dMUTED  = isDark ? "rgba(255,255,255,0.4)"  : "rgba(0,0,0,0.45)";
  const dBORDER = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.08)";
  const dICON   = isDark ? "#fff" : "#374151";

  useEffect(() => { if (showChatModal) loadChat(); }, [showChatModal]);

  useEffect(() => {
    AsyncStorage.multiGet([SELLER_SHOP_TYPES_KEY, PROFILE_PHOTO_KEY, DELETED_ARTICLES_KEY, DELETED_ENGROS_KEY]).then(([types, photo, delA, delE]) => {
      const parsed: string[] = types[1] ? JSON.parse(types[1]) : [];
      if (__DEV__) {
        setShopTypes([...new Set([...parsed, "importe", "grossiste"])]);
      } else {
        setShopTypes(parsed);
      }
      if (photo[1]) setProfilePhoto(photo[1]);
      const deletedA: string[] = delA[1] ? JSON.parse(delA[1]) : [];
      const deletedE: string[] = delE[1] ? JSON.parse(delE[1]) : [];
      if (deletedA.length) setPubArticles(ALL_ARTICLES.filter((a) => !deletedA.includes(a.id)));
      if (deletedE.length) setPubEngros(ALL_ENGROS.filter((e) => !deletedE.includes(e.id)));
    }).catch(() => {});
  }, []);
  const queryClient = useQueryClient();
  const isOwnProfile = id === "own" && preview !== "true";
  const isPreview = preview === "true";
  const bottomPadding = Platform.OS === "web" ? 34 : insets.bottom + 16;
  const topPadding = Platform.OS === "web" ? 0 : insets.top;

  const sellerQuery = useQuery({
    queryKey: ["/api/sellers", id],
    queryFn: () => api.sellers.getById(id!),
    enabled: !!id && id !== "own",
  });

  const productsQuery = useQuery({
    queryKey: ["/api/sellers", id, "products"],
    queryFn: () => api.sellers.getProducts(id!),
    enabled: !!id,
  });

  const followMutation = useMutation({
    mutationFn: () => api.sellers.follow(id!),
    onMutate: () => {
      setSubscribed(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    },
    onError: () => setSubscribed(false),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/sellers", id] }),
  });

  const unfollowMutation = useMutation({
    mutationFn: () => api.sellers.unfollow(id!),
    onMutate: () => {
      setSubscribed(false);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    },
    onError: () => setSubscribed(true),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/sellers", id] }),
  });

  const handleSubscribe = () => {
    subscribed ? unfollowMutation.mutate() : followMutation.mutate();
  };

  const handleShare = async () => {
    Haptics.selectionAsync();
    try {
      await Share.share({
        message: `Découvrez la boutique ${shopName} sur DKD Market !`,
        title: shopName,
      });
    } catch {}
  };

  const onRefresh = () => {
    sellerQuery.refetch();
    productsQuery.refetch();
  };

  const seller = sellerQuery.data;
  const products = productsQuery.data || [];
  const isLoading = sellerQuery.isLoading && id !== "own";

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: topPadding, backgroundColor: dBG }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (sellerQuery.isError && id !== "own") {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: topPadding, backgroundColor: dBG }]}>
        <Ionicons name="alert-circle-outline" size={48} color={dMUTED} />
        <Text style={[styles.errorText, { color: dTEXT }]}>Impossible de charger le profil</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => sellerQuery.refetch()}>
          <Text style={styles.retryBtnText}>Réessayer</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const shopName = seller?.shop_name || (isOwnProfile || isPreview ? (user?.full_name || "Ma boutique") : "Vendeur");
  const rating = seller?.rating ?? 0;
  const totalSales = seller?.total_sales ?? 0;
  const isVerified = seller?.is_verified === 1 || isOwnProfile || isPreview;
  const logoUrl = seller?.logo_url;
  const displayPhoto = isOwnProfile ? profilePhoto : (logoUrl ?? null);
  const bannerUrl = seller?.banner_url;
  const description = seller?.description;
  const followers = seller?.followers_count ?? 0;

  const sellerSinceLabel = (() => {
    const dateStr = seller?.member_since || seller?.created_at;
    if (!dateStr) return null;
    const since = new Date(dateStr);
    const now = new Date();
    const totalMonths = (now.getFullYear() - since.getFullYear()) * 12 + (now.getMonth() - since.getMonth());
    if (totalMonths < 1) return "Vendeur depuis moins d'un mois";
    if (totalMonths < 12) return `Vendeur depuis ${totalMonths} mois`;
    const years = Math.floor(totalMonths / 12);
    const months = totalMonths % 12;
    if (months === 0) return `Vendeur depuis ${years} an${years > 1 ? "s" : ""}`;
    return `Vendeur depuis ${years} an${years > 1 ? "s" : ""} et ${months} mois`;
  })();

  const initials = shopName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);

  const showPublicView = !isOwnProfile;

  return (
    <View style={[styles.container, { backgroundColor: dBG }]}>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: bottomPadding }}
        refreshControl={
          <RefreshControl
            refreshing={sellerQuery.isRefetching}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
      >
        {/* Cover + profile */}
        <View style={[styles.coverSection, { backgroundColor: isDark ? "#141A24" : "#FFFFFF" }]}>
          {bannerUrl ? (
            <Image source={{ uri: bannerUrl }} style={styles.coverBg} resizeMode="cover" />
          ) : (
            <View style={styles.coverBg} />
          )}

          <View style={[styles.profileHeader, { paddingTop: topPadding + 12 }]}>
            {/* Back button — inline before avatar */}
            <TouchableOpacity onPress={() => router.back()} style={styles.inlineBackBtn}>
              <Ionicons name="arrow-back" size={20} color="#fff" />
            </TouchableOpacity>

            {/* Avatar */}
            <View style={styles.avatarWrap}>
              <View style={styles.avatar}>
                {displayPhoto && !logoError ? (
                  <Image
                    source={{ uri: displayPhoto }}
                    style={styles.avatarImage}
                    onError={() => setLogoError(true)}
                  />
                ) : (
                  <Text style={styles.avatarInitials}>{initials}</Text>
                )}
              </View>
              {isVerified && !isPreview && (
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark" size={10} color="#fff" />
                </View>
              )}
            </View>

            <View style={{ flex: 1, gap: 4 }}>
              {/* Name */}
              <Text style={[styles.shopName, { color: "#fff" }]}>{shopName}</Text>
              {/* Seller badge */}
              {sellerSinceLabel && (
                <View style={styles.sellerSinceBadge}>
                  <Text style={styles.sellerSinceText}>{sellerSinceLabel}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Stats: Note, Livraisons, Abonnés */}
          {showPublicView && (
            <View style={[styles.statsRow, { backgroundColor: isDark ? "#1C2230" : Colors.surface, borderColor: dBORDER }]}>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: dTEXT }]}>{rating.toFixed(1)}</Text>
                <View style={styles.statLabelRow}>
                  <Ionicons name="star" size={11} color="#F59E0B" />
                  <Text style={[styles.statLabel, { color: dMUTED }]}>Note</Text>
                </View>
              </View>
              <View style={[styles.statDivider, { backgroundColor: dBORDER }]} />
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: dTEXT }]}>{formatCount(totalSales)}</Text>
                <View style={styles.statLabelRow}>
                  <Ionicons name="cube-outline" size={11} color="#3B82F6" />
                  <Text style={[styles.statLabel, { color: dMUTED }]}>Livraisons</Text>
                </View>
              </View>
              <View style={[styles.statDivider, { backgroundColor: dBORDER }]} />
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: dTEXT }]}>{formatCount(followers)}</Text>
                <View style={styles.statLabelRow}>
                  <Ionicons name="heart" size={11} color="#EC4899" />
                  <Text style={[styles.statLabel, { color: dMUTED }]}>Abonnés</Text>
                </View>
              </View>
            </View>
          )}

          {/* Public view action row */}
          {showPublicView && (
            <View style={styles.actionRow}>
              {/* S'abonner — style TikTok */}
              <TouchableOpacity
                style={[
                  styles.subscribeBtn,
                  subscribed && { backgroundColor: "transparent", borderWidth: 1.5, borderColor: isDark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.18)" },
                ]}
                onPress={handleSubscribe}
                activeOpacity={0.8}
                disabled={followMutation.isPending || unfollowMutation.isPending}
              >
                {(followMutation.isPending || unfollowMutation.isPending) ? (
                  <ActivityIndicator size="small" color={subscribed ? dTEXT : "#fff"} />
                ) : (
                  <>
                    <Ionicons
                      name={subscribed ? "checkmark" : "person-add-outline"}
                      size={16}
                      color={subscribed ? dTEXT : "#fff"}
                    />
                    <Text style={[styles.subscribeBtnText, subscribed && { color: dTEXT }]}>
                      {subscribed ? "Abonné·e" : "S'abonner"}
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Partager — petit, fond noir */}
              <TouchableOpacity style={styles.iconActionBtn} onPress={handleShare} activeOpacity={0.8}>
                <Ionicons name="share-social-outline" size={13} color="#fff" />
                <Text style={styles.iconActionLabel}>Partager</Text>
              </TouchableOpacity>

              {/* Discuter — ouvre modal chat */}
              <TouchableOpacity
                style={styles.chatBtn}
                onPress={() => { Haptics.selectionAsync(); setShowChatModal(true); }}
                activeOpacity={0.8}
              >
                <Ionicons name="chatbubble-outline" size={16} color="#fff" />
                <Text style={styles.chatBtnText}>Discuter</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Owner view (dashboard link) */}
          {isOwnProfile && (
            <View style={styles.ownerActions}>
              <TouchableOpacity style={[styles.ownerIconBtn, { backgroundColor: isDark ? "#1C2230" : Colors.surface, borderColor: dBORDER }]} onPress={handleShare}>
                <Ionicons name="share-social-outline" size={18} color={dICON} />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.ownerActionBtn, { flex: 1 }]} onPress={() => router.push("/add-product")}>
                <Ionicons name="add" size={16} color="#fff" />
                <Text style={styles.ownerActionBtnText}>Article</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.ownerActionBtn, { flex: 1 }]} onPress={() => router.push("/add-video" as any)}>
                <Ionicons name="videocam-outline" size={16} color="#fff" />
                <Text style={styles.ownerActionBtnText}>Vidéo</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.ownerIconBtn, { backgroundColor: isDark ? "#1C2230" : Colors.surface, borderColor: dBORDER }]}>
                <Ionicons name="chatbubble-outline" size={18} color={dICON} />
              </TouchableOpacity>
            </View>
          )}

          {/* Description */}
          {description ? (
            <Text style={[styles.description, { color: dSUB }]} numberOfLines={3}>{description}</Text>
          ) : null}
        </View>

        {/* Shop type buttons — activated types in ordered 3+3 grid */}
        {shopTypes.length > 0 && (
          <View style={styles.shopTypesSection}>
            {shopTypes.slice(0, 6).reduce<string[][]>((rows, t, i) => {
              if (i % 3 === 0) rows.push([]);
              rows[rows.length - 1].push(t);
              return rows;
            }, []).map((row, ri) => (
              <View key={ri} style={styles.shopTypesRow}>
                {row.map((typeId) => {
                  const cfg = SHOP_TYPE_CFG[typeId];
                  if (!cfg) return null;
                  return (
                    <TouchableOpacity
                      key={typeId}
                      style={[styles.shopTypeBtn, { borderColor: cfg.color + "55", backgroundColor: cfg.color + "12" }]}
                      activeOpacity={0.75}
                      onPress={() => Haptics.selectionAsync()}
                    >
                      <Ionicons name={cfg.icon as any} size={12} color={cfg.color} />
                      <Text style={[styles.shopTypeLabel, { color: cfg.color }]} numberOfLines={1}>{cfg.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </View>
        )}

        {/* ── Section Gestion — visible uniquement sur le vrai profil own (pas aperçu) ── */}
        {isOwnProfile && (
          <View style={styles.gestionSection}>
            <View style={styles.shopTypesRow}>
              <TouchableOpacity
                style={[styles.shopTypeBtn, { borderColor: "#FF6B0055", backgroundColor: "#FF6B0012" }]}
                activeOpacity={0.75}
                onPress={() => { Haptics.selectionAsync(); router.push("/paiements-vendeur" as any); }}
              >
                <Ionicons name="cash-outline" size={16} color="#FF6B00" />
                <Text style={[styles.shopTypeLabel, { color: "#FF6B00", fontSize: 10 }]} numberOfLines={1}>Paiements en cours</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.shopTypeBtn, { borderColor: "#8B5CF655", backgroundColor: "#8B5CF612" }]}
                activeOpacity={0.75}
                onPress={() => { Haptics.selectionAsync(); router.push("/mes-publications" as any); }}
              >
                <Ionicons name="albums-outline" size={16} color="#8B5CF6" />
                <Text style={[styles.shopTypeLabel, { color: "#8B5CF6", fontSize: 10 }]} numberOfLines={1}>Gérer mes publications</Text>
              </TouchableOpacity>
            </View>
            {/* Bouton Publications en cours */}
            <TouchableOpacity
              style={[styles.pubEnCoursBtn, { borderColor: "#10B98155", backgroundColor: isDark ? "#10B98110" : "#10B98108" }]}
              activeOpacity={0.75}
              onPress={() => { Haptics.selectionAsync(); setPubTab("pending"); setShowPubModal(true); }}
            >
              <View style={[styles.pubEnCoursDot, { backgroundColor: "#10B981" }]} />
              <Ionicons name="cloud-upload-outline" size={15} color="#10B981" />
              <Text style={[styles.shopTypeLabel, { color: "#10B981", fontSize: 10 }]}>Publications en cours</Text>
              <View style={[styles.pubEnCoursBadge, { backgroundColor: "#10B981" }]}>
                <Text style={styles.pubEnCoursBadgeText}>{DEMO_PUBLICATIONS.filter(p => p.status === "pending").length}</Text>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Tabs + loupe */}
        <View style={[styles.tabsRow, { alignItems: "center", borderBottomColor: dBORDER, backgroundColor: dBG }]}>
          {SELLER_TABS.map((tab, i) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === i && styles.tabActive]}
              onPress={() => {
                setActiveTab(i);
                Haptics.selectionAsync();
                if (i === 0 && tabSearchOpen) {
                  setTabSearchOpen(false);
                  setTabSearchQuery("");
                  Animated.timing(tabSearchAnim, { toValue: 0, duration: 180, useNativeDriver: false }).start();
                }
              }}
            >
              <Text style={[styles.tabText, { color: activeTab === i ? Colors.primary : dMUTED }]}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}

          {/* Loupe — visible sur Articles (1) et En gros (2) uniquement */}
          {activeTab !== 0 && (
            <TouchableOpacity style={styles.tabLoupeBtn} onPress={toggleTabSearch} activeOpacity={0.8}>
              <Ionicons
                name={tabSearchOpen ? "close" : "search"}
                size={18}
                color={tabSearchOpen ? Colors.primary : Colors.textMuted}
              />
            </TouchableOpacity>
          )}
        </View>

        {/* Barre de recherche animée Articles / En gros */}
        {activeTab !== 0 && (
          <Animated.View style={{
            maxHeight: tabSearchAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 54] }),
            opacity: tabSearchAnim,
            overflow: "hidden",
            backgroundColor: isDark ? "#141A24" : "#F1F5F9",
            borderBottomWidth: 1,
            borderBottomColor: dBORDER,
            paddingHorizontal: 14,
            paddingVertical: 8,
          }}>
            <View style={[styles.tabSearchInner, { backgroundColor: dCARD, borderColor: dBORDER }]}>
              <Ionicons name="search-outline" size={14} color={dMUTED} />
              <TextInput
                style={[styles.tabSearchInput, { color: dTEXT }]}
                placeholder={`Rechercher ${activeTab === 2 ? "en gros" : "articles"}…`}
                placeholderTextColor={dMUTED}
                value={tabSearchQuery}
                onChangeText={setTabSearchQuery}
                autoFocus={tabSearchOpen}
                returnKeyType="search"
              />
              {tabSearchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setTabSearchQuery("")}>
                  <Ionicons name="close-circle" size={15} color={Colors.textMuted} />
                </TouchableOpacity>
              )}
            </View>
          </Animated.View>
        )}

        {/* Vidéos — grille 3 colonnes lecture seule */}
        {activeTab === 0 && (
          DEMO_VIDEOS.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="videocam-outline" size={40} color={dMUTED} />
              <Text style={[styles.emptyText, { color: dMUTED }]}>Aucune vidéo pour le moment</Text>
            </View>
          ) : (
            <View style={styles.videoGrid}>
              {DEMO_VIDEOS.map((vid) => (
                <TouchableWithoutFeedback
                  key={vid.id}
                  onPress={() => {
                    Haptics.selectionAsync();
                    const idx = DEMO_VIDEOS.findIndex((v) => v.id === vid.id);
                    const i = idx >= 0 ? idx : 0;
                    setCurrentPlayerIdx(i);
                    setPlayerStartIndex(i);
                  }}
                >
                  <View style={[styles.videoCell, { backgroundColor: vid.color }]}>
                    <Ionicons name={vid.icon as any} size={28} color="rgba(255,255,255,0.3)" style={{ position: "absolute" }} />
                    <Ionicons name="play" size={16} color="rgba(255,255,255,0.85)" style={{ position: "absolute", top: "50%", left: "50%", transform: [{ translateX: -8 }, { translateY: -8 }] }} />
                    <View style={styles.videoCellViews}>
                      <Ionicons name="play-outline" size={10} color="#fff" />
                      <Text style={styles.videoCellViewsText}>
                        {vid.views >= 1000 ? (vid.views / 1000).toFixed(1) + "k" : vid.views}
                      </Text>
                    </View>
                  </View>
                </TouchableWithoutFeedback>
              ))}
            </View>
          )
        )}

        {/* Articles */}
        {activeTab === 1 && (() => {
          const tabQ = tabSearchQuery.toLowerCase().trim();
          const displayed = tabQ ? pubArticles.filter(a => a.title.toLowerCase().includes(tabQ)) : pubArticles;
          return (
          <View style={{ paddingHorizontal: 8, paddingTop: 8 }}>
            {displayed.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="bag-outline" size={40} color={dMUTED} />
                <Text style={[styles.emptyText, { color: dMUTED }]}>{tabQ ? "Aucun résultat" : "Aucun article pour le moment"}</Text>
              </View>
            ) : (
              displayed.map((item) => (
                <SellerProductCard
                  key={item.id}
                  item={item}
                  isDark={isDark}
                  isEngros={false}
                  accentColor={Colors.primary}
                  onAddToCart={() => {}}
                  onVideo={() => {}}
                />
              ))
            )}
          </View>
          );
        })()}

        {/* En gros */}
        {activeTab === 2 && (() => {
          const tabQ = tabSearchQuery.toLowerCase().trim();
          const displayed = tabQ ? pubEngros.filter(e => e.title.toLowerCase().includes(tabQ)) : pubEngros;
          return (
          <View style={{ paddingHorizontal: 8, paddingTop: 8 }}>
            {displayed.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="cube-outline" size={40} color={dMUTED} />
                <Text style={[styles.emptyText, { color: dMUTED }]}>{tabQ ? "Aucun résultat" : "Aucun article En Gros pour le moment"}</Text>
              </View>
            ) : (
              displayed.map((item) => (
                <SellerProductCard
                  key={item.id}
                  item={item}
                  isDark={isDark}
                  isEngros={true}
                  accentColor={Colors.primary}
                  onAddToCart={() => {}}
                  onVideo={() => {}}
                />
              ))
            )}
          </View>
          );
        })()}
      </ScrollView>

      {/* ── Modal TikTok player lecture seule ── */}
      <Modal visible={playerStartIndex !== null} animationType="fade" statusBarTranslucent>
        <View style={{ flex: 1, backgroundColor: "#000" }}>
          {/* Barre flottante fermer */}
          <View style={[styles.playerTopBar, { paddingTop: insets.top + 10 }]}>
            <TouchableOpacity style={styles.playerCloseBtn} onPress={() => setPlayerStartIndex(null)} activeOpacity={0.8}>
              <Ionicons name="close" size={22} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.playerTitle} numberOfLines={1}>
              {DEMO_VIDEOS[currentPlayerIdx]?.title ?? ""}
            </Text>
          </View>

          {/* Liste TikTok */}
          {playerStartIndex !== null && (
            <FlatList
              data={DEMO_VIDEOS}
              keyExtractor={(v) => v.id}
              pagingEnabled
              showsVerticalScrollIndicator={false}
              initialScrollIndex={playerStartIndex}
              getItemLayout={(_, index) => ({ length: SCREEN_HEIGHT, offset: SCREEN_HEIGHT * index, index })}
              onMomentumScrollEnd={(e) => {
                const idx = Math.round(e.nativeEvent.contentOffset.y / SCREEN_HEIGHT);
                setCurrentPlayerIdx(idx);
              }}
              renderItem={({ item }) => (
                <View style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT, backgroundColor: item.color }}>
                  {/* Icône + play centré */}
                  <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, alignItems: "center", justifyContent: "center" }}>
                    <Ionicons name={item.icon as any} size={88} color="rgba(255,255,255,0.18)" />
                    <View style={{ position: "absolute" }}>
                      <Ionicons name="play-circle" size={82} color="rgba(255,255,255,0.85)" />
                    </View>
                  </View>
                  {/* Durée */}
                  <View style={styles.playerDurationPill}>
                    <Text style={styles.playerDurationText}>{item.duration}</Text>
                  </View>
                  {/* Infos bas */}
                  <View style={[styles.playerInfoBar, { position: "absolute", bottom: 0, left: 0, right: 0, paddingBottom: insets.bottom + 24 }]}>
                    <Text style={styles.playerInfoTitle} numberOfLines={2}>{item.title}</Text>
                    <View style={styles.playerInfoStats}>
                      <Ionicons name="eye-outline" size={14} color="#aaa" />
                      <Text style={styles.playerInfoStatText}>{item.views.toLocaleString()} vues</Text>
                      <Ionicons name="heart-outline" size={14} color="#aaa" />
                      <Text style={styles.playerInfoStatText}>{item.likes}</Text>
                      <Ionicons name="chatbubble-outline" size={14} color="#aaa" />
                      <Text style={styles.playerInfoStatText}>{item.comments}</Text>
                    </View>
                  </View>
                </View>
              )}
            />
          )}
        </View>
      </Modal>

      {/* ── Modal Chat Vendeur ── */}
      <Modal visible={showChatModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowChatModal(false)}>
        <View style={[styles.chatContainer, { backgroundColor: dBG, paddingTop: insets.top > 0 ? 16 : 32 }]}>
          {/* En-tête */}
          <View style={[styles.chatHeader, { backgroundColor: dCARD, borderBottomColor: dBORDER }]}>
            <TouchableOpacity onPress={() => setShowChatModal(false)} style={{ padding: 4 }}>
              <Ionicons name="arrow-back" size={22} color={dTEXT} />
            </TouchableOpacity>
            <View style={styles.chatHeaderInfo}>
              <View style={[styles.chatHeaderAvatar, { backgroundColor: Colors.primary + "20" }]}>
                <Text style={[styles.chatHeaderInitials, { color: Colors.primary }]}>{(shopName || "?").slice(0,2).toUpperCase()}</Text>
              </View>
              <View>
                <Text style={[styles.chatHeaderName, { color: dTEXT }]}>{shopName}</Text>
                <Text style={[styles.chatHeaderSub, { color: "#10B981" }]}>En ligne</Text>
              </View>
            </View>
            <TouchableOpacity style={{ padding: 4 }} onPress={() => Haptics.selectionAsync()}>
              <Ionicons name="ellipsis-vertical" size={20} color={dICON} />
            </TouchableOpacity>
          </View>

          {/* Messages */}
          <FlatList
            ref={chatListRef}
            data={chatMessages}
            keyExtractor={(m) => m.id}
            contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 12, gap: 6 }}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => chatMessages.length > 0 && chatListRef.current?.scrollToEnd({ animated: false })}
            ListEmptyComponent={
              <View style={{ flex: 1, alignItems: "center", paddingTop: 60, gap: 10 }}>
                <Ionicons name="chatbubbles-outline" size={48} color={isDark ? "#2D2D2D" : "#D1D5DB"} />
                <Text style={{ fontFamily: "Poppins_400Regular", fontSize: 13, color: dMUTED, textAlign: "center" }}>
                  Envoyez un message à {shopName}
                </Text>
              </View>
            }
            renderItem={({ item }) => {
              const isMe = item.sender === "me";
              return (
                <View style={[styles.chatBubbleWrap, isMe && styles.chatBubbleWrapMe]}>
                  {!isMe && (
                    <View style={[styles.chatAvatar, { backgroundColor: Colors.primary + "20" }]}>
                      <Text style={[styles.chatAvatarText, { color: Colors.primary }]}>{(shopName || "?").slice(0,2).toUpperCase()}</Text>
                    </View>
                  )}
                  <View style={{ maxWidth: "75%", gap: 2 }}>
                    <View style={[styles.chatBubble, isMe ? styles.chatBubbleMe : [styles.chatBubbleThem, { backgroundColor: dCARD, borderColor: dBORDER }]]}>
                      <Text style={[styles.chatBubbleText, { color: isMe ? "#fff" : dTEXT }]}>{item.text}</Text>
                    </View>
                    <Text style={[styles.chatBubbleTime, isMe && { textAlign: "right" }, { color: dMUTED }]}>{item.time}{isMe && " ✓✓"}</Text>
                  </View>
                </View>
              );
            }}
          />

          {/* Zone de saisie */}
          <View style={[styles.chatInputBar, { backgroundColor: dCARD, borderTopColor: dBORDER }]}>
            <TextInput
              style={[styles.chatInputField, { backgroundColor: isDark ? "#1A1A1A" : "#F3F4F6", color: dTEXT }]}
              placeholder="Message…"
              placeholderTextColor={dMUTED}
              value={chatInput}
              onChangeText={setChatInput}
              multiline
              maxLength={500}
              returnKeyType="send"
              onSubmitEditing={sendChatMessage}
            />
            <TouchableOpacity
              style={[styles.chatSendBtn, { backgroundColor: chatInput.trim() ? Colors.primary : (isDark ? "#2D2D2D" : "#E5E7EB") }]}
              onPress={sendChatMessage}
              activeOpacity={0.8}
              disabled={!chatInput.trim()}
            >
              <Ionicons name="send" size={18} color={chatInput.trim() ? "#fff" : dMUTED} />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── Modal Publications en cours ── */}
      <Modal visible={showPubModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowPubModal(false)}>
        <View style={[styles.pubModalContainer, { backgroundColor: dBG, paddingTop: insets.top > 0 ? 16 : 32 }]}>
          {/* En-tête */}
          <View style={[styles.pubModalHeader, { borderBottomColor: dBORDER }]}>
            <Text style={[styles.pubModalTitle, { color: dTEXT }]}>Mes publications</Text>
            <TouchableOpacity onPress={() => setShowPubModal(false)} style={{ padding: 4 }}>
              <Ionicons name="close" size={22} color={dTEXT} />
            </TouchableOpacity>
          </View>

          {/* Onglets En cours / Publiées */}
          <View style={[styles.pubTabRow, { borderBottomColor: dBORDER }]}>
            <TouchableOpacity
              style={[styles.pubTab, pubTab === "pending" && [styles.pubTabActive, { borderBottomColor: "#10B981" }]]}
              onPress={() => { setPubTab("pending"); Haptics.selectionAsync(); }}
            >
              <Ionicons name="cloud-upload-outline" size={14} color={pubTab === "pending" ? "#10B981" : dMUTED} />
              <Text style={[styles.pubTabText, { color: pubTab === "pending" ? "#10B981" : dMUTED }]}>En cours d'envoi</Text>
              <View style={[styles.pubTabBadge, { backgroundColor: pubTab === "pending" ? "#10B981" : (isDark ? "#2D2D2D" : "#E5E7EB") }]}>
                <Text style={[styles.pubTabBadgeText, { color: pubTab === "pending" ? "#fff" : dMUTED }]}>{DEMO_PUBLICATIONS.filter(p => p.status === "pending").length}</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.pubTab, pubTab === "published" && [styles.pubTabActive, { borderBottomColor: "#FF6B00" }]]}
              onPress={() => { setPubTab("published"); Haptics.selectionAsync(); }}
            >
              <Ionicons name="checkmark-circle-outline" size={14} color={pubTab === "published" ? "#FF6B00" : dMUTED} />
              <Text style={[styles.pubTabText, { color: pubTab === "published" ? "#FF6B00" : dMUTED }]}>Publiées</Text>
              <View style={[styles.pubTabBadge, { backgroundColor: pubTab === "published" ? "#FF6B00" : (isDark ? "#2D2D2D" : "#E5E7EB") }]}>
                <Text style={[styles.pubTabBadgeText, { color: pubTab === "published" ? "#fff" : dMUTED }]}>{DEMO_PUBLICATIONS.filter(p => p.status === "published").length}</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Liste */}
          <FlatList
            data={DEMO_PUBLICATIONS.filter(p => p.status === pubTab)}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: insets.bottom + 24 }}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={{ paddingVertical: 48, alignItems: "center" }}>
                <Ionicons name={pubTab === "pending" ? "cloud-outline" : "checkmark-done-outline"} size={40} color={isDark ? "#2D2D2D" : "#D1D5DB"} />
                <Text style={{ fontFamily: "Poppins_400Regular", fontSize: 13, color: dMUTED, marginTop: 10, textAlign: "center" }}>
                  {pubTab === "pending" ? "Aucune publication en cours" : "Aucune publication publiée"}
                </Text>
              </View>
            }
            renderItem={({ item }) => {
              const isVideo   = item.type === "video";
              const isPhoto   = item.type === "photo";
              const secColor  = item.section ? SECTION_COLORS[item.section] : "#FF6B00";
              const secLabel  = item.section ? SECTION_LABELS[item.section] : "Vendeur";
              const typeLabel = isVideo ? "Vidéo" : isPhoto ? "Vidéos photos + son" : "Article";
              const typeColor = isVideo ? "#6366F1" : isPhoto ? "#EC4899" : secColor;
              const typeIcon  = isVideo ? "videocam-outline" : isPhoto ? "images-outline" : "bag-handle-outline";
              return (
                <View style={[styles.pubItem, { backgroundColor: dCARD, borderColor: dBORDER }]}>
                  {/* Icône type */}
                  <View style={[styles.pubItemIcon, { backgroundColor: typeColor + "18" }]}>
                    <Ionicons name={typeIcon as any} size={20} color={typeColor} />
                  </View>
                  <View style={{ flex: 1, gap: 4 }}>
                    <Text style={[styles.pubItemTitle, { color: dTEXT }]} numberOfLines={1}>{item.title}</Text>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                      {/* Badge type */}
                      <View style={[styles.pubBadge, { backgroundColor: typeColor + "18" }]}>
                        <Text style={[styles.pubBadgeText, { color: typeColor }]}>{typeLabel}</Text>
                      </View>
                      {/* Badge section (articles uniquement) */}
                      {item.type === "article" && (
                        <View style={[styles.pubBadge, { backgroundColor: secColor + "18" }]}>
                          <Text style={[styles.pubBadgeText, { color: secColor }]}>{secLabel}</Text>
                        </View>
                      )}
                    </View>
                    {/* Barre de progression (en cours) */}
                    {item.status === "pending" && item.progress !== undefined && (
                      <View style={{ gap: 3, marginTop: 2 }}>
                        <View style={[styles.pubProgressTrack, { backgroundColor: isDark ? "#2D2D2D" : "#E5E7EB" }]}>
                          <View style={[styles.pubProgressFill, { width: `${item.progress}%` as any, backgroundColor: "#10B981" }]} />
                        </View>
                        <Text style={{ fontFamily: "Poppins_400Regular", fontSize: 10, color: "#10B981" }}>{item.progress}% envoyé…</Text>
                      </View>
                    )}
                  </View>
                  {/* Bouton Voir (publiées seulement) */}
                  {item.status === "published" && (
                    <TouchableOpacity
                      style={styles.pubVoirBtn}
                      activeOpacity={0.8}
                      onPress={() => {
                        setShowPubModal(false);
                        Haptics.selectionAsync();
                        if (isVideo || isPhoto) {
                          router.push("/(tabs)/videos" as any);
                        } else {
                          router.push("/publication-article" as any);
                        }
                      }}
                    >
                      <Text style={styles.pubVoirBtnText}>Voir</Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            }}
            ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { alignItems: "center", justifyContent: "center" },

  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  topBackBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  topTitle: { flex: 1, fontFamily: "Poppins_700Bold", fontSize: 16, color: Colors.text },
  previewBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#06B6D415",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "#06B6D440",
  },
  previewBadgeText: { fontFamily: "Poppins_600SemiBold", fontSize: 10, color: "#06B6D4" },

  inlineBackBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  coverSection: { backgroundColor: Colors.backgroundCard, paddingBottom: 12, marginBottom: 8 },
  coverBg: { height: 0 },

  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 10,
  },
  avatarWrap: { position: "relative" },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: Colors.surface,
    borderWidth: 3,
    borderColor: Colors.background,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImage: { width: 76, height: 76, borderRadius: 38 },
  avatarInitials: { fontFamily: "Poppins_700Bold", fontSize: 28, color: Colors.primary },
  verifiedBadge: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#3B82F6",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: Colors.background,
  },
  shopName: { fontFamily: "Poppins_700Bold", fontSize: 17, color: Colors.text },
  sellerSinceBadge: {
    alignSelf: "flex-start",
    backgroundColor: Colors.primary + "20",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: Colors.primary + "40",
  },
  sellerSinceText: { fontFamily: "Poppins_600SemiBold", fontSize: 11, color: Colors.primary },
  description: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: Colors.textMuted,
    paddingHorizontal: 16,
    marginTop: 2,
    marginBottom: 4,
  },

  /* Stats */
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: 16,
    paddingVertical: 9,
    backgroundColor: Colors.surface,
    marginHorizontal: 16,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statItem: { flex: 1, alignItems: "center", gap: 2 },
  statValue: { fontFamily: "Poppins_700Bold", fontSize: 14, color: Colors.text },
  statLabelRow: { flexDirection: "row", alignItems: "center", gap: 3 },
  statLabel: { fontFamily: "Poppins_400Regular", fontSize: 10, color: Colors.textMuted },
  statDivider: { width: 1, height: 24, backgroundColor: Colors.border },

  /* Action row — compact 3 buttons */
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 4,
  },
  chatBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#EF4444",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  chatBtnText: { fontFamily: "Poppins_700Bold", fontSize: 13, color: "#fff" },
  iconActionBtn: {
    flex: 0.42,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    paddingVertical: 6,
    backgroundColor: "#111",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#333",
  },
  iconActionLabel: { fontFamily: "Poppins_500Medium", fontSize: 8, color: "#fff" },
  subscribeBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 10,
    backgroundColor: Colors.primary,
    borderRadius: 12,
  },
  subscribedBtn: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  subscribeBtnText: { fontFamily: "Poppins_700Bold", fontSize: 13, color: "#fff" },

  /* Owner actions */
  ownerActions: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 8,
    alignItems: "center",
    marginBottom: 4,
  },
  ownerIconBtn: {
    width: 40, height: 40,
    backgroundColor: Colors.surface,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  ownerActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    backgroundColor: Colors.primary,
    paddingVertical: 10,
    borderRadius: 10,
  },
  ownerActionBtnText: { color: "#fff", fontFamily: "Poppins_700Bold", fontSize: 12 },

  /* Gestion section */
  gestionSection: {
    paddingHorizontal: 14,
    paddingTop: 6,
    paddingBottom: 4,
  },

  /* Shop type grid */
  shopTypesSection: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 4,
    gap: 7,
  },
  shopTypesRow: {
    flexDirection: "row",
    gap: 7,
  },
  shopTypeBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    paddingVertical: 5,
    borderRadius: 7,
    borderWidth: 1,
  },
  shopTypeLabel: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 8,
    textAlign: "center",
  },

  /* Tabs */
  tabsRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    marginBottom: 12,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 13,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabActive: { borderBottomColor: Colors.primary },
  tabText: { color: Colors.textMuted, fontFamily: "Poppins_600SemiBold", fontSize: 13 },
  tabTextActive: { color: Colors.primary },
  tabLoupeBtn: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  tabSearchInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  tabSearchInput: {
    flex: 1,
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: "#111827",
    padding: 0,
  },

  /* Products grid */
  productsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 12,
    gap: 10,
  },
  productCard: {
    width: (SCREEN_WIDTH - 34) / 2,
    backgroundColor: Colors.backgroundCard,
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  productImage: {
    height: 130,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.surface,
  },
  productImageFill: { width: "100%", height: "100%" },
  productInfo: { padding: 10 },
  productName: { color: Colors.text, fontFamily: "Poppins_500Medium", fontSize: 12, marginBottom: 4 },
  productRating: { flexDirection: "row", alignItems: "center", gap: 3, marginBottom: 4 },
  productRatingText: { color: Colors.textSecondary, fontFamily: "Poppins_500Medium", fontSize: 11 },
  productPrice: { color: Colors.primary, fontFamily: "Poppins_700Bold", fontSize: 13 },

  /* Wholesale */
  wholesaleInfo: { paddingHorizontal: 16 },
  wholesaleCard: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  wholesaleTitle: { color: Colors.text, fontFamily: "Poppins_700Bold", fontSize: 16 },
  wholesaleText: { color: Colors.textMuted, fontFamily: "Poppins_400Regular", fontSize: 13, textAlign: "center" },
  wholesaleBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 4,
  },
  wholesaleBtnText: { color: "#fff", fontFamily: "Poppins_700Bold", fontSize: 13 },

  loadingSection: { paddingVertical: 40, alignItems: "center" },
  emptyState: { paddingVertical: 40, alignItems: "center", gap: 10 },
  emptyText: { color: Colors.textMuted, fontFamily: "Poppins_500Medium", fontSize: 14 },

  /* Grille vidéo */
  videoGrid: { flexDirection: "row", flexWrap: "wrap" },
  videoCell: {
    width: (SCREEN_WIDTH - 4) / 3,
    height: ((SCREEN_WIDTH - 4) / 3) * 1.35,
    margin: 0.5,
    alignItems: "center",
    justifyContent: "center",
  },
  videoCellViews: {
    position: "absolute",
    bottom: 6,
    left: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  videoCellViewsText: { fontFamily: "Poppins_700Bold", fontSize: 11, color: "#fff" },

  /* Player lecture seule */
  playerTopBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingBottom: 10,
    gap: 10,
    backgroundColor: "rgba(0,0,0,0.7)",
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  playerCloseBtn: { padding: 4 },
  playerTitle: { flex: 1, fontFamily: "Poppins_600SemiBold", fontSize: 13, color: "#fff" },
  playerVideoArea: { flex: 1, alignItems: "center", justifyContent: "center" },
  playerDurationPill: {
    position: "absolute",
    bottom: 20,
    right: 20,
    backgroundColor: "rgba(0,0,0,0.65)",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  playerDurationText: { fontFamily: "Poppins_700Bold", fontSize: 13, color: "#fff" },
  playerInfoBar: {
    backgroundColor: "rgba(0,0,0,0.85)",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
    gap: 8,
  },
  playerInfoTitle: { fontFamily: "Poppins_700Bold", fontSize: 15, color: "#fff" },
  playerInfoStats: { flexDirection: "row", alignItems: "center", gap: 8 },
  playerInfoStatText: { fontFamily: "Poppins_400Regular", fontSize: 13, color: "#aaa" },
  errorText: { color: Colors.textMuted, fontFamily: "Poppins_500Medium", fontSize: 14, marginTop: 12 },
  retryBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 16,
  },
  retryBtnText: { color: "#fff", fontFamily: "Poppins_700Bold", fontSize: 13 },

  /* ── Chat ── */
  chatContainer: { flex: 1 },
  chatHeader: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: 12, paddingBottom: 12, borderBottomWidth: 1,
  },
  chatHeaderInfo: { flex: 1, flexDirection: "row", alignItems: "center", gap: 10 },
  chatHeaderAvatar: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  chatHeaderInitials: { fontFamily: "Poppins_700Bold", fontSize: 14 },
  chatHeaderName: { fontFamily: "Poppins_700Bold", fontSize: 15 },
  chatHeaderSub: { fontFamily: "Poppins_400Regular", fontSize: 11 },
  chatBubbleWrap: { flexDirection: "row", alignItems: "flex-end", gap: 8, marginVertical: 2 },
  chatBubbleWrapMe: { flexDirection: "row-reverse" },
  chatAvatar: { width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  chatAvatarText: { fontFamily: "Poppins_700Bold", fontSize: 11 },
  chatBubble: { borderRadius: 16, paddingHorizontal: 12, paddingVertical: 8 },
  chatBubbleMe: { backgroundColor: Colors.primary, borderBottomRightRadius: 4 },
  chatBubbleThem: { borderWidth: 1, borderBottomLeftRadius: 4 },
  chatBubbleText: { fontFamily: "Poppins_400Regular", fontSize: 14, lineHeight: 20 },
  chatBubbleTime: { fontFamily: "Poppins_400Regular", fontSize: 10 },
  chatInputBar: {
    flexDirection: "row", alignItems: "flex-end", gap: 8,
    paddingHorizontal: 12, paddingVertical: 10, borderTopWidth: 1,
  },
  chatInputField: {
    flex: 1, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 10,
    fontFamily: "Poppins_400Regular", fontSize: 14, maxHeight: 100,
  },
  chatSendBtn: {
    width: 42, height: 42, borderRadius: 21,
    alignItems: "center", justifyContent: "center", flexShrink: 0,
  },

  /* Bouton Publications en cours */
  pubEnCoursBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    marginTop: 7, paddingVertical: 7, paddingHorizontal: 12,
    borderRadius: 7, borderWidth: 1,
  },
  pubEnCoursDot: { width: 6, height: 6, borderRadius: 3 },
  pubEnCoursBadge: { marginLeft: "auto", borderRadius: 10, paddingHorizontal: 6, paddingVertical: 1 },
  pubEnCoursBadgeText: { fontFamily: "Poppins_700Bold", fontSize: 10, color: "#fff" },

  /* Modal Publications */
  pubModalContainer: { flex: 1 },
  pubModalHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1,
  },
  pubModalTitle: { fontFamily: "Poppins_700Bold", fontSize: 17 },
  pubTabRow: {
    flexDirection: "row", borderBottomWidth: 1,
  },
  pubTab: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: "transparent",
  },
  pubTabActive: {},
  pubTabText: { fontFamily: "Poppins_600SemiBold", fontSize: 12 },
  pubTabBadge: { borderRadius: 10, paddingHorizontal: 6, paddingVertical: 1 },
  pubTabBadgeText: { fontFamily: "Poppins_700Bold", fontSize: 10 },
  pubItem: {
    flexDirection: "row", alignItems: "flex-start", gap: 12,
    borderRadius: 12, borderWidth: 1, padding: 12,
  },
  pubItemIcon: { width: 42, height: 42, borderRadius: 11, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  pubItemTitle: { fontFamily: "Poppins_600SemiBold", fontSize: 13 },
  pubBadge: { borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  pubBadgeText: { fontFamily: "Poppins_600SemiBold", fontSize: 10 },
  pubProgressTrack: { height: 4, borderRadius: 2, width: "100%", overflow: "hidden" },
  pubProgressFill: { height: 4, borderRadius: 2 },
  pubVoirBtn: {
    backgroundColor: "#FF6B00", borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 6, alignSelf: "center", flexShrink: 0,
  },
  pubVoirBtnText: { fontFamily: "Poppins_700Bold", fontSize: 12, color: "#fff" },
});
