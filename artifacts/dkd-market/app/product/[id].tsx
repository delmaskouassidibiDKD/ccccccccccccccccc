import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Platform,
  ActivityIndicator,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/colors";
import { useLocalSearchParams, router } from "expo-router";
import * as Haptics from "expo-haptics";
import { useCart } from "@/contexts/CartContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, Product, Review } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

function parseImages(images: string | null | undefined): string[] {
  if (!images) return [];
  try {
    const parsed = JSON.parse(images);
    if (Array.isArray(parsed)) return parsed;
    return [String(parsed)];
  } catch {
    return images.split(",").map((s: string) => s.trim()).filter(Boolean);
  }
}

function formatPrice(price: number, currency?: string): string {
  return `${price.toLocaleString()} ${currency || "FCFA"}`;
}

export default function ProductScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const queryClientHook = useQueryClient();

  const { data: product, isLoading, error } = useQuery<Product>({
    queryKey: ["/api/products", id],
    queryFn: () => api.products.getById(id!),
    enabled: !!id,
  });

  const { data: reviews } = useQuery<Review[]>({
    queryKey: ["/api/products", id, "reviews"],
    queryFn: () => api.products.getReviews(id!),
    enabled: !!id,
  });

  const addToCartMutation = useMutation({
    mutationFn: () => api.cart.addItem(Number(id), quantity),
    onSuccess: () => {
      queryClientHook.invalidateQueries({ queryKey: ["/api/cart"] });
    },
  });

  const wishlistMutation = useMutation({
    mutationFn: () => api.users.addToWishlist(Number(id)),
    onSuccess: () => {
      setLiked(true);
      queryClientHook.invalidateQueries({ queryKey: ["/api/users/me/wishlist"] });
    },
  });

  const [selectedColor, setSelectedColor] = useState(0);
  const [selectedSize, setSelectedSize] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [liked, setLiked] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const bottomPadding = Platform.OS === "web" ? 34 : insets.bottom + 16;

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  if (error || !product) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Ionicons name="alert-circle-outline" size={48} color={Colors.error} />
        <Text style={styles.errorText}>Produit introuvable</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => router.back()}>
          <Text style={styles.retryBtnText}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const images = parseImages(product.images);
  const minQty = product.min_order || 1;
  const effectiveQty = Math.max(quantity, minQty);
  const totalPrice = product.price * effectiveQty;

  const wholesalePrices = product.wholesale_price
    ? [
        { qty: `1-${minQty > 1 ? minQty - 1 : 4}`, price: formatPrice(product.original_price || product.price, product.currency_code) },
        { qty: `${minQty}+`, price: formatPrice(product.wholesale_price, product.currency_code) },
      ]
    : product.original_price && product.original_price > product.price
      ? [
          { qty: "Prix original", price: formatPrice(product.original_price, product.currency_code) },
          { qty: "Prix promo", price: formatPrice(product.price, product.currency_code) },
        ]
      : [];

  const handleAddToCart = () => {
    if (isAuthenticated) {
      addToCartMutation.mutate();
    }
    addToCart({
      id: String(product.id),
      name: product.name,
      price: product.price,
      currency: product.currency_code || "FCFA",
      quantity: effectiveQty,
      image: images[0] || "",
      seller: product.shop_name || "",
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.push("/(tabs)/panier");
  };

  const handleWishlist = () => {
    if (isAuthenticated) {
      if (!liked) {
        wishlistMutation.mutate();
      }
    }
    setLiked(!liked);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const reviewList = reviews || [];
  const hasMultipleImages = images.length > 1;

  return (
    <View style={[styles.container]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={[styles.heroSection, { backgroundColor: "#1A0D00" }]}>
          {images.length > 0 ? (
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(e) => {
                const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
                setActiveImageIndex(idx);
              }}
            >
              {images.map((img, i) => (
                <Image
                  key={i}
                  source={{ uri: img }}
                  style={{ width: SCREEN_WIDTH, height: 300 }}
                  resizeMode="cover"
                />
              ))}
            </ScrollView>
          ) : (
            <View style={styles.heroContent}>
              <Ionicons name="bag-handle" size={80} color={Colors.primary} />
            </View>
          )}
          <TouchableOpacity style={styles.likeBtn} onPress={handleWishlist}>
            <Ionicons name={liked ? "heart" : "heart-outline"} size={22} color={liked ? "#FF3B5C" : "#fff"} />
          </TouchableOpacity>
          {product.country_code && (
            <View style={styles.countryTag}>
              <Text style={styles.countryTagText}>{product.country_code}</Text>
            </View>
          )}
          {hasMultipleImages && (
            <View style={styles.imageDots}>
              {images.map((_, i) => (
                <View
                  key={i}
                  style={[styles.dot, activeImageIndex === i && styles.dotActive]}
                />
              ))}
            </View>
          )}
        </View>

        <View style={styles.content}>
          <View style={styles.titleRow}>
            <View style={styles.titleLeft}>
              {product.category_name && (
                <Text style={styles.categoryTag}>{product.category_name}</Text>
              )}
              <Text style={styles.productName}>{product.name}</Text>
              <Text style={styles.priceMain}>{formatPrice(product.price, product.currency_code)}</Text>
              {product.original_price && product.original_price > product.price && (
                <Text style={styles.originalPrice}>{formatPrice(product.original_price, product.currency_code)}</Text>
              )}
            </View>
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={14} color="#F59E0B" />
              <Text style={styles.ratingText}>{product.rating?.toFixed(1) || "0.0"}</Text>
              <Text style={styles.reviewCount}>({product.review_count || 0})</Text>
            </View>
          </View>

          {product.stock_quantity <= 0 && (
            <View style={styles.outOfStockBadge}>
              <Ionicons name="alert-circle" size={14} color={Colors.error} />
              <Text style={styles.outOfStockText}>Rupture de stock</Text>
            </View>
          )}

          {product.label && (
            <View style={styles.labelBadge}>
              <Text style={styles.labelText}>{product.label}</Text>
            </View>
          )}

          <TouchableOpacity
            style={styles.sellerRow}
            onPress={() => router.push({ pathname: "/seller/[id]", params: { id: String(product.seller_id) } })}
          >
            <View style={styles.sellerAvatar}>
              <Ionicons name="person" size={16} color={Colors.primary} />
            </View>
            <Text style={styles.sellerName}>{product.shop_name || "Vendeur"}</Text>
            <Ionicons name="chevron-forward" size={14} color={Colors.textMuted} />
          </TouchableOpacity>

          {wholesalePrices.length > 0 && (
            <View style={styles.priceSection}>
              <Text style={styles.sectionTitle}>Prix dégressif</Text>
              <View style={styles.priceTable}>
                {wholesalePrices.map((wp, i) => (
                  <View
                    key={i}
                    style={[
                      styles.priceRow,
                      i === wholesalePrices.length - 1 && styles.priceRowBest,
                    ]}
                  >
                    <Text style={styles.priceQty}>{wp.qty}</Text>
                    <Text style={[
                      styles.priceValue,
                      i === wholesalePrices.length - 1 && { color: Colors.primary },
                    ]}>
                      {wp.price}
                    </Text>
                    {i === wholesalePrices.length - 1 && (
                      <View style={styles.bestPriceBadge}>
                        <Text style={styles.bestPriceText}>MEILLEUR</Text>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            </View>
          )}

          <View style={styles.qtySection}>
            <Text style={styles.sectionTitle}>Quantité{minQty > 1 ? ` (Min. ${minQty})` : ""}</Text>
            <View style={styles.qtyRow}>
              <TouchableOpacity
                style={styles.qtyBtn}
                onPress={() => { if (effectiveQty > minQty) setQuantity(effectiveQty - 1); Haptics.selectionAsync(); }}
              >
                <Ionicons name="remove" size={18} color={Colors.text} />
              </TouchableOpacity>
              <Text style={styles.qtyValue}>{effectiveQty}</Text>
              <TouchableOpacity
                style={styles.qtyBtn}
                onPress={() => { setQuantity(effectiveQty + 1); Haptics.selectionAsync(); }}
              >
                <Ionicons name="add" size={18} color={Colors.text} />
              </TouchableOpacity>
              <View style={styles.totalSimulator}>
                <Text style={styles.totalLabel}>Total estimé</Text>
                <Text style={styles.totalValue}>{formatPrice(totalPrice, product.currency_code)}</Text>
              </View>
            </View>
          </View>

          {product.description && (
            <View style={styles.descSection}>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.descText}>{product.description}</Text>
            </View>
          )}

          <View style={styles.reviewsSection}>
            <View style={styles.reviewsHeader}>
              <Text style={styles.sectionTitle}>Avis clients</Text>
              <View style={styles.overallRating}>
                <Ionicons name="star" size={14} color="#F59E0B" />
                <Text style={styles.overallRatingText}>{product.rating?.toFixed(1) || "0.0"} ({product.review_count || 0})</Text>
              </View>
            </View>
            {reviewList.length === 0 ? (
              <View style={styles.emptyReviews}>
                <Ionicons name="chatbubble-outline" size={24} color={Colors.textMuted} />
                <Text style={styles.emptyReviewsText}>Aucun avis pour le moment</Text>
              </View>
            ) : (
              reviewList.map((review) => (
                <View key={review.id} style={styles.reviewCard}>
                  <View style={styles.reviewHeader}>
                    {review.avatar_url ? (
                      <Image source={{ uri: review.avatar_url }} style={styles.reviewAvatarImg} />
                    ) : (
                      <View style={styles.reviewAvatar}>
                        <Ionicons name="person" size={14} color={Colors.textSecondary} />
                      </View>
                    )}
                    <Text style={styles.reviewName}>{review.full_name || "Utilisateur"}</Text>
                    <View style={styles.reviewStars}>
                      {Array.from({ length: review.rating }).map((_, i) => (
                        <Ionicons key={i} name="star" size={10} color="#F59E0B" />
                      ))}
                    </View>
                    <Text style={styles.reviewDate}>
                      {new Date(review.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                    </Text>
                  </View>
                  <Text style={styles.reviewText}>{review.comment}</Text>
                </View>
              ))
            )}
          </View>
        </View>
      </ScrollView>

      <View style={[styles.bottomActions, { paddingBottom: bottomPadding }]}>
        <TouchableOpacity
          style={styles.groupBuyBtn}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.push("/(tabs)/groupe"); }}
        >
          <Ionicons name="people-outline" size={18} color={Colors.primary} />
          <Text style={styles.groupBuyText}>Groupe</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.buyNowBtn, product.stock_quantity <= 0 && styles.buyNowBtnDisabled]}
          onPress={handleAddToCart}
          disabled={product.stock_quantity <= 0 || addToCartMutation.isPending}
        >
          {addToCartMutation.isPending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="bag-handle" size={18} color="#fff" />
              <Text style={styles.buyNowText}>Acheter</Text>
            </>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.chatBtn}
          onPress={() => Haptics.selectionAsync()}
        >
          <Ionicons name="chatbubble-outline" size={18} color={Colors.text} />
          <Text style={styles.chatBtnText}>Discuter</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { alignItems: "center", justifyContent: "center" },
  loadingText: { color: Colors.textSecondary, fontFamily: "Poppins_400Regular", fontSize: 14, marginTop: 12 },
  errorText: { color: Colors.text, fontFamily: "Poppins_600SemiBold", fontSize: 16, marginTop: 12 },
  retryBtn: {
    marginTop: 16,
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryBtnText: { color: "#fff", fontFamily: "Poppins_600SemiBold", fontSize: 14 },
  heroSection: {
    height: 300,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  heroContent: { alignItems: "center", justifyContent: "center" },
  likeBtn: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 40,
    height: 40,
    backgroundColor: "rgba(0,0,0,0.4)",
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  countryTag: {
    position: "absolute",
    bottom: 16,
    left: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  countryTagText: { color: "#fff", fontFamily: "Poppins_600SemiBold", fontSize: 12 },
  imageDots: {
    position: "absolute",
    bottom: 16,
    right: 16,
    flexDirection: "row",
    gap: 5,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.4)",
  },
  dotActive: { backgroundColor: "#fff", width: 16 },
  content: { padding: 16 },
  titleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 },
  titleLeft: { flex: 1, gap: 4 },
  categoryTag: { color: Colors.primary, fontFamily: "Poppins_600SemiBold", fontSize: 11 },
  productName: { color: Colors.text, fontFamily: "Poppins_700Bold", fontSize: 20, lineHeight: 26 },
  priceMain: { color: Colors.primary, fontFamily: "Poppins_700Bold", fontSize: 18, marginTop: 2 },
  originalPrice: { color: Colors.textMuted, fontFamily: "Poppins_400Regular", fontSize: 13, textDecorationLine: "line-through" as const },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: Colors.backgroundCard,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  ratingText: { color: Colors.text, fontFamily: "Poppins_700Bold", fontSize: 13 },
  reviewCount: { color: Colors.textMuted, fontFamily: "Poppins_400Regular", fontSize: 11 },
  outOfStockBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.error + "15",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.error + "30",
  },
  outOfStockText: { color: Colors.error, fontFamily: "Poppins_600SemiBold", fontSize: 12 },
  labelBadge: {
    alignSelf: "flex-start" as const,
    backgroundColor: Colors.primary + "20",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 12,
  },
  labelText: { color: Colors.primary, fontFamily: "Poppins_600SemiBold", fontSize: 11 },
  sellerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.backgroundCard,
    borderRadius: 12,
    padding: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sellerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary + "20",
    alignItems: "center",
    justifyContent: "center",
  },
  sellerName: { flex: 1, color: Colors.text, fontFamily: "Poppins_600SemiBold", fontSize: 13 },
  priceSection: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sectionTitle: { color: Colors.text, fontFamily: "Poppins_600SemiBold", fontSize: 14, marginBottom: 10 },
  priceTable: { gap: 6 },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: Colors.surface,
  },
  priceRowBest: { backgroundColor: Colors.primary + "15", borderWidth: 1, borderColor: Colors.primary + "30" },
  priceQty: { color: Colors.textSecondary, fontFamily: "Poppins_500Medium", fontSize: 13 },
  priceValue: { color: Colors.text, fontFamily: "Poppins_700Bold", fontSize: 13 },
  bestPriceBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  bestPriceText: { color: "#fff", fontFamily: "Poppins_700Bold", fontSize: 8 },
  qtySection: { marginBottom: 16 },
  qtyRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  qtyBtn: {
    width: 36,
    height: 36,
    backgroundColor: Colors.backgroundCard,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  qtyValue: { color: Colors.text, fontFamily: "Poppins_700Bold", fontSize: 20, minWidth: 36, textAlign: "center" as const },
  totalSimulator: {
    flex: 1,
    backgroundColor: Colors.backgroundCard,
    borderRadius: 10,
    padding: 10,
    alignItems: "flex-end" as const,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  totalLabel: { color: Colors.textMuted, fontFamily: "Poppins_400Regular", fontSize: 10 },
  totalValue: { color: Colors.primary, fontFamily: "Poppins_700Bold", fontSize: 15 },
  descSection: { marginBottom: 16 },
  descText: { color: Colors.textSecondary, fontFamily: "Poppins_400Regular", fontSize: 13, lineHeight: 20 },
  reviewsSection: { gap: 10 },
  reviewsHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  overallRating: { flexDirection: "row", alignItems: "center", gap: 4 },
  overallRatingText: { color: Colors.text, fontFamily: "Poppins_600SemiBold", fontSize: 12 },
  emptyReviews: {
    alignItems: "center",
    paddingVertical: 24,
    gap: 8,
  },
  emptyReviewsText: { color: Colors.textMuted, fontFamily: "Poppins_400Regular", fontSize: 13 },
  reviewCard: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: 12,
    padding: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  reviewHeader: { flexDirection: "row", alignItems: "center", gap: 6 },
  reviewAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  reviewAvatarImg: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  reviewName: { color: Colors.text, fontFamily: "Poppins_600SemiBold", fontSize: 12, flex: 1 },
  reviewStars: { flexDirection: "row", gap: 1 },
  reviewDate: { color: Colors.textMuted, fontFamily: "Poppins_400Regular", fontSize: 10 },
  reviewText: { color: Colors.textSecondary, fontFamily: "Poppins_400Regular", fontSize: 13, lineHeight: 18 },
  bottomActions: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    gap: 10,
    padding: 14,
    backgroundColor: Colors.backgroundCard,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  groupBuyBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: Colors.primary + "15",
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  groupBuyText: { color: Colors.primary, fontFamily: "Poppins_700Bold", fontSize: 13 },
  buyNowBtn: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: 12,
  },
  buyNowBtnDisabled: { opacity: 0.5 },
  buyNowText: { color: "#fff", fontFamily: "Poppins_700Bold", fontSize: 14 },
  chatBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: Colors.backgroundCard,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chatBtnText: { color: Colors.text, fontFamily: "Poppins_700Bold", fontSize: 13 },
});
