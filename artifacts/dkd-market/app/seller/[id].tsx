import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Dimensions,
  ActivityIndicator,
  Image,
  Share,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/colors";
import { useLocalSearchParams, router } from "expo-router";
import * as Haptics from "expo-haptics";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, Seller, Product } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const SELLER_TABS = ["Vidéos", "Articles", "En gros"];
const SELLER_SHOP_TYPES_KEY = "@dkd:seller_shop_types";
const PROFILE_PHOTO_KEY     = "@dkd:seller_profile_photo";

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
  const { id, preview } = useLocalSearchParams<{ id: string; preview?: string }>();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState(0);
  const [subscribed, setSubscribed] = useState(false);
  const [shopTypes, setShopTypes] = useState<string[]>([]);
  const [logoError,    setLogoError]    = useState(false);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    AsyncStorage.multiGet([SELLER_SHOP_TYPES_KEY, PROFILE_PHOTO_KEY]).then(([types, photo]) => {
      const parsed: string[] = types[1] ? JSON.parse(types[1]) : [];
      if (__DEV__) {
        setShopTypes([...new Set([...parsed, "importe", "grossiste"])]);
      } else {
        setShopTypes(parsed);
      }
      if (photo[1]) setProfilePhoto(photo[1]);
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
      <View style={[styles.container, styles.centered, { paddingTop: topPadding }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (sellerQuery.isError && id !== "own") {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: topPadding }]}>
        <Ionicons name="alert-circle-outline" size={48} color={Colors.textMuted} />
        <Text style={styles.errorText}>Impossible de charger le profil</Text>
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
    <View style={styles.container}>

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
        <View style={styles.coverSection}>
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
              <Text style={styles.shopName}>{shopName}</Text>
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
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{rating.toFixed(1)}</Text>
                <View style={styles.statLabelRow}>
                  <Ionicons name="star" size={11} color="#F59E0B" />
                  <Text style={styles.statLabel}>Note</Text>
                </View>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{formatCount(totalSales)}</Text>
                <View style={styles.statLabelRow}>
                  <Ionicons name="cube-outline" size={11} color="#3B82F6" />
                  <Text style={styles.statLabel}>Livraisons</Text>
                </View>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{formatCount(followers)}</Text>
                <View style={styles.statLabelRow}>
                  <Ionicons name="heart" size={11} color="#EC4899" />
                  <Text style={styles.statLabel}>Abonnés</Text>
                </View>
              </View>
            </View>
          )}

          {/* Public view action row */}
          {showPublicView && (
            <View style={styles.actionRow}>
              {/* S'abonner */}
              <TouchableOpacity
                style={[styles.subscribeBtn, subscribed && styles.subscribedBtn]}
                onPress={handleSubscribe}
                activeOpacity={0.8}
                disabled={followMutation.isPending || unfollowMutation.isPending}
              >
                {(followMutation.isPending || unfollowMutation.isPending) ? (
                  <ActivityIndicator size="small" color={subscribed ? Colors.text : "#fff"} />
                ) : (
                  <>
                    <Ionicons
                      name={subscribed ? "checkmark" : "person-add-outline"}
                      size={16}
                      color={subscribed ? Colors.text : "#fff"}
                    />
                    <Text style={[styles.subscribeBtnText, subscribed && { color: Colors.text }]}>
                      {subscribed ? "Abonné" : "S'abonner"}
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Partager — petit, fond noir */}
              <TouchableOpacity style={styles.iconActionBtn} onPress={handleShare} activeOpacity={0.8}>
                <Ionicons name="share-social-outline" size={13} color="#fff" />
                <Text style={styles.iconActionLabel}>Partager</Text>
              </TouchableOpacity>

              {/* Discuter — compact */}
              <TouchableOpacity
                style={styles.chatBtn}
                onPress={() => router.push("/chat/1" as any)}
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
              <TouchableOpacity style={styles.ownerIconBtn} onPress={handleShare}>
                <Ionicons name="share-social-outline" size={18} color={Colors.text} />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.ownerActionBtn, { flex: 1 }]} onPress={() => router.push("/add-product")}>
                <Ionicons name="add" size={16} color="#fff" />
                <Text style={styles.ownerActionBtnText}>Article</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.ownerActionBtn, { flex: 1 }]} onPress={() => router.push("/add-video" as any)}>
                <Ionicons name="videocam-outline" size={16} color="#fff" />
                <Text style={styles.ownerActionBtnText}>Vidéo</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.ownerIconBtn}>
                <Ionicons name="chatbubble-outline" size={18} color={Colors.text} />
              </TouchableOpacity>
            </View>
          )}

          {/* Description */}
          {description ? (
            <Text style={styles.description} numberOfLines={3}>{description}</Text>
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
          </View>
        )}

        {/* Tabs */}
        <View style={styles.tabsRow}>
          {SELLER_TABS.map((tab, i) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === i && styles.tabActive]}
              onPress={() => { setActiveTab(i); Haptics.selectionAsync(); }}
            >
              <Text style={[styles.tabText, activeTab === i && styles.tabTextActive]}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Vidéos */}
        {activeTab === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="videocam-outline" size={40} color={Colors.textMuted} />
            <Text style={styles.emptyText}>Aucune vidéo pour le moment</Text>
          </View>
        )}

        {/* Articles */}
        {activeTab === 1 && (
          <>
            {productsQuery.isLoading ? (
              <View style={styles.loadingSection}>
                <ActivityIndicator size="small" color={Colors.primary} />
              </View>
            ) : products.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="bag-outline" size={40} color={Colors.textMuted} />
                <Text style={styles.emptyText}>Aucun article pour le moment</Text>
              </View>
            ) : (
              <View style={styles.productsGrid}>
                {products.map((product) => {
                  const imageUri = getImageUri(product.images);
                  return (
                    <TouchableOpacity
                      key={product.id}
                      style={styles.productCard}
                      onPress={() => router.push({ pathname: "/product/[id]", params: { id: product.id.toString() } })}
                    >
                      <View style={styles.productImage}>
                        {imageUri ? (
                          <Image source={{ uri: imageUri }} style={styles.productImageFill} resizeMode="cover" />
                        ) : (
                          <Ionicons name="bag-handle" size={32} color={Colors.primary} />
                        )}
                      </View>
                      <View style={styles.productInfo}>
                        <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
                        <View style={styles.productRating}>
                          <Ionicons name="star" size={10} color="#F59E0B" />
                          <Text style={styles.productRatingText}>{product.rating?.toFixed(1) ?? "0.0"}</Text>
                        </View>
                        <Text style={styles.productPrice}>{formatPrice(product.price, product.currency_code)}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </>
        )}

        {/* En gros */}
        {activeTab === 2 && (
          <View style={styles.wholesaleInfo}>
            <View style={styles.wholesaleCard}>
              <Ionicons name="cube-outline" size={32} color={Colors.primary} />
              <Text style={styles.wholesaleTitle}>Vente en Gros disponible</Text>
              <Text style={styles.wholesaleText}>
                Ce vendeur propose des tarifs dégressifs pour les commandes en grande quantité.
              </Text>
              <TouchableOpacity style={styles.wholesaleBtn}>
                <Text style={styles.wholesaleBtnText}>Voir les tarifs gros</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
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
  errorText: { color: Colors.textMuted, fontFamily: "Poppins_500Medium", fontSize: 14, marginTop: 12 },
  retryBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 16,
  },
  retryBtnText: { color: "#fff", fontFamily: "Poppins_700Bold", fontSize: 13 },
});
