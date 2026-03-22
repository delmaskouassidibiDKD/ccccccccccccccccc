import React, { useState, useEffect, useCallback, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import FavorisArticlesTab from "@/components/FavorisArticlesTab";
import FavorisGroupeTab from "@/components/FavorisGroupeTab";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Platform,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Modal,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { AppHeader } from "@/components/AppHeader";
import { SideDrawer } from "@/components/SideDrawer";
import { useTheme } from "@/contexts/ThemeContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, CartItem as ApiCartItem, CartData, Order, Chat } from "@/lib/api";
import { Colors } from "@/constants/colors";

function getFirstImage(images: string): string | null {
  try {
    const parsed = JSON.parse(images);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed[0];
  } catch {}
  if (images && images.startsWith("http")) return images;
  return null;
}

function formatPrice(amount: number): string {
  return Math.round(amount).toLocaleString("fr-FR");
}

function FavorisTab() {
  const { favoriteVideos } = useCart();
  const { colors } = useTheme();
  const { t } = useLanguage();
  return (
    <View style={styles.tabContent}>
      {favoriteVideos.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="heart-outline" size={56} color={colors.textMuted} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>{t.cart.noFavoriteVideos}</Text>
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>{t.cart.likeVideosDesc}</Text>
          <TouchableOpacity style={[styles.emptyBtn, { backgroundColor: colors.primary }]} onPress={() => router.push("/(tabs)/videos")}>
            <Text style={styles.emptyBtnText}>{t.cart.discoverVideos}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={favoriteVideos}
          keyExtractor={(v) => v.id}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.favoriteCard, { backgroundColor: colors.backgroundCard, borderColor: colors.border }]}
              onPress={() => router.push("/(tabs)/videos")}
            >
              <View style={[styles.favoriteThumb, { backgroundColor: item.thumbnail === "brown" ? "#3D1A00" : "#001A3D" }]}>
                <Ionicons name="play-circle" size={24} color="rgba(255,255,255,0.7)" />
              </View>
              <View style={styles.favoriteInfo}>
                <Text style={[styles.favoriteSeller, { color: colors.primary }]}>{item.seller}</Text>
                <Text style={[styles.favoriteTitle, { color: colors.text }]}>{item.title}</Text>
                <View style={styles.favoriteViews}>
                  <Ionicons name="eye-outline" size={12} color={colors.textMuted} />
                  <Text style={[styles.favoriteViewsText, { color: colors.textMuted }]}>
                    {(item.views / 1000).toFixed(1)}k {t.cart.views}
                  </Text>
                </View>
              </View>
              <Ionicons name="heart" size={20} color="#FF3B5C" />
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

function ArticlesTab() {
  const { isAuthenticated } = useAuth();
  const qc = useQueryClient();
  const { colors } = useTheme();
  const { t } = useLanguage();

  const { data: cartData, isLoading, refetch } = useQuery<CartData>({
    queryKey: ["/api/cart"],
    enabled: isAuthenticated,
    queryFn: () => api.cart.get(),
  });

  const updateMutation = useMutation({
    mutationFn: ({ productId, quantity }: { productId: number; quantity: number }) =>
      api.cart.updateItem(productId, quantity),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/cart"] }); },
  });

  const removeMutation = useMutation({
    mutationFn: (productId: number) => api.cart.removeItem(productId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/cart"] }); },
  });

  if (!isAuthenticated) {
    return (
      <ScrollView
        contentContainerStyle={[styles.tabContent, styles.emptyState, { paddingBottom: 120 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.emptyCartIcon, { backgroundColor: colors.backgroundCard, borderColor: colors.border }]}>
          <Ionicons name="log-in-outline" size={44} color={colors.textMuted} />
        </View>
        <Text style={[styles.emptyTitle, { color: colors.text }]}>{t.cart.loginRequired}</Text>
        <Text style={[styles.emptyText, { color: colors.textMuted }]}>{t.cart.loginToSeeCart}</Text>
        <TouchableOpacity style={[styles.emptyBtn, { backgroundColor: colors.primary }]} onPress={() => router.push("/auth/login")}>
          <Text style={styles.emptyBtnText}>{t.cart.loginBtn}</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  if (isLoading) {
    return (
      <View style={[styles.tabContent, styles.emptyState]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.emptyText, { color: colors.textMuted }]}>{t.cart.loadingCart}</Text>
      </View>
    );
  }

  const items = cartData?.items || [];
  const totalAmount = cartData?.total_amount || 0;

  if (items.length === 0) {
    return (
      <View style={[styles.tabContent, styles.emptyState]}>
        <View style={[styles.emptyCartIcon, { backgroundColor: colors.backgroundCard, borderColor: colors.border }]}>
          <Ionicons name="cart-outline" size={44} color={colors.textMuted} />
        </View>
        <Text style={[styles.emptyTitle, { color: colors.text }]}>{t.cart.empty}</Text>
        <Text style={[styles.emptyText, { color: colors.textMuted }]}>
          {t.cart.emptyCartFull}
        </Text>
        <TouchableOpacity
          style={[styles.emptyBtn, { backgroundColor: colors.primary }]}
          onPress={() => router.push("/")}
        >
          <Text style={styles.emptyBtnText}>{t.cart.continueShopping}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleUpdateQty = (item: ApiCartItem, delta: number) => {
    const newQty = item.quantity + delta;
    Haptics.selectionAsync();
    if (newQty <= 0) {
      removeMutation.mutate(item.product_id);
    } else {
      updateMutation.mutate({ productId: item.product_id, quantity: newQty });
    }
  };

  return (
    <View style={[styles.tabContent, { flex: 1 }]}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.product_id.toString()}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ gap: 10, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={false} onRefresh={() => refetch()} tintColor={colors.primary} />}
        renderItem={({ item }) => {
          const imageUrl = getFirstImage(item.images);
          return (
            <TouchableOpacity
              style={[styles.cartItem, { backgroundColor: colors.backgroundCard, borderColor: colors.border }]}
              onPress={() => router.push(`/product/${item.product_id}`)}
              activeOpacity={0.7}
            >
              <View style={[styles.cartItemImage, { backgroundColor: colors.primary + "20" }]}>
                {imageUrl ? (
                  <Image source={{ uri: imageUrl }} style={{ width: 60, height: 60, borderRadius: 10 }} contentFit="cover" />
                ) : (
                  <Ionicons name="bag-handle" size={28} color={colors.primary} />
                )}
              </View>
              <View style={styles.cartItemInfo}>
                <Text style={[styles.cartItemName, { color: colors.text }]} numberOfLines={2}>{item.product_name}</Text>
                <Text style={[styles.cartItemSeller, { color: colors.textMuted }]}>{item.seller_name}</Text>
                {!item.in_stock && (
                  <Text style={[styles.outOfStock, { color: colors.error }]}>{t.product.outOfStock}</Text>
                )}
                <Text style={[styles.cartItemPrice, { color: colors.primary }]}>
                  {formatPrice(item.price * item.quantity)} {t.common.currency}
                </Text>
              </View>
              <View style={styles.cartItemControls}>
                <TouchableOpacity
                  style={[styles.qtyBtn, { backgroundColor: colors.surface }]}
                  onPress={() => handleUpdateQty(item, -1)}
                  disabled={updateMutation.isPending || removeMutation.isPending}
                >
                  <Ionicons name="remove" size={14} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.qtyText, { color: colors.text }]}>{item.quantity}</Text>
                <TouchableOpacity
                  style={[styles.qtyBtn, { backgroundColor: colors.surface }]}
                  onPress={() => handleUpdateQty(item, 1)}
                  disabled={updateMutation.isPending || item.quantity >= item.stock_quantity}
                >
                  <Ionicons name="add" size={14} color={item.quantity >= item.stock_quantity ? colors.textMuted : colors.text} />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          );
        }}
      />
      <View style={[styles.checkoutBar, { backgroundColor: colors.backgroundCard, borderTopColor: colors.border }]}>
        <View>
          <Text style={[styles.checkoutTotal, { color: colors.textMuted }]}>{t.cart.total}</Text>
          <Text style={[styles.checkoutAmount, { color: colors.text }]}>{formatPrice(totalAmount)} {t.common.currency}</Text>
        </View>
        <TouchableOpacity
          style={[styles.checkoutBtn, { backgroundColor: colors.primary }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push("/checkout");
          }}
        >
          <Text style={styles.checkoutBtnText}>{t.cart.orderBtn}</Text>
          <Ionicons name="arrow-forward" size={16} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function SuiviTab() {
  const { isAuthenticated } = useAuth();
  const { colors } = useTheme();
  const { t } = useLanguage();

  const getStatusInfo = (status: string): { label: string; color: string; progress: number } => {
    switch (status) {
      case "pending": return { label: t.orderStatus.pending, color: "#F59E0B", progress: 0.15 };
      case "confirmed": return { label: t.orderStatus.confirmed, color: "#3B82F6", progress: 0.35 };
      case "preparing": return { label: t.orderStatus.processing, color: "#8B5CF6", progress: 0.5 };
      case "shipping": return { label: t.orderStatus.shipped, color: colors.primary, progress: 0.7 };
      case "delivered": return { label: t.orderStatus.delivered, color: "#22C55E", progress: 1.0 };
      case "cancelled": return { label: t.orderStatus.cancelled, color: "#EF4444", progress: 0 };
      case "rejected": return { label: t.orderStatus.cancelled, color: "#EF4444", progress: 0 };
      case "expired": return { label: t.orderStatus.cancelled, color: "#6B7280", progress: 0 };
      default: return { label: status, color: colors.textMuted, progress: 0 };
    }
  };

  const { data: ordersData, isLoading, refetch } = useQuery({
    queryKey: ["/api/orders"],
    enabled: isAuthenticated,
    queryFn: () => api.orders.list(),
  });

  if (!isAuthenticated) {
    return (
      <ScrollView
        contentContainerStyle={[styles.tabContent, styles.emptyState, { paddingBottom: 120 }]}
        showsVerticalScrollIndicator={false}
      >
        <Ionicons name="log-in-outline" size={56} color={colors.textMuted} />
        <Text style={[styles.emptyTitle, { color: colors.text }]}>{t.cart.loginRequired}</Text>
        <Text style={[styles.emptyText, { color: colors.textMuted }]}>{t.cart.loginToTrack}</Text>
        <TouchableOpacity style={[styles.emptyBtn, { backgroundColor: colors.primary }]} onPress={() => router.push("/auth/login")}>
          <Text style={styles.emptyBtnText}>{t.cart.loginBtn}</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  if (isLoading) {
    return (
      <View style={[styles.tabContent, styles.emptyState]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.emptyText, { color: colors.textMuted }]}>{t.cart.loadingOrders}</Text>
      </View>
    );
  }

  const orders: Order[] = ordersData?.data || [];

  if (orders.length === 0) {
    return (
      <View style={[styles.tabContent, styles.emptyState]}>
        <Ionicons name="bicycle-outline" size={56} color={colors.textMuted} />
        <Text style={[styles.emptyTitle, { color: colors.text }]}>{t.cart.noOrders}</Text>
        <Text style={[styles.emptyText, { color: colors.textMuted }]}>{t.cart.noOrdersDesc}</Text>
        <TouchableOpacity style={[styles.emptyBtn, { backgroundColor: colors.primary }]} onPress={() => router.push("/")}>
          <Text style={styles.emptyBtnText}>{t.cart.startShopping}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const STEPS = [t.cart.confirmed, t.cart.prepared, t.cart.enRoute, t.cart.delivered];

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={[styles.tabContent]}
      refreshControl={<RefreshControl refreshing={false} onRefresh={() => refetch()} tintColor={colors.primary} />}
    >
      {orders.map((order) => {
        const statusInfo = getStatusInfo(order.status);
        const orderDate = new Date(order.created_at);
        const dateStr = orderDate.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });

        return (
          <View key={order.id} style={[styles.orderCard, { backgroundColor: colors.backgroundCard, borderColor: colors.border }]}>
            <View style={styles.orderHeader}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.orderProduct, { color: colors.text }]} numberOfLines={1}>
                  {order.seller_name || t.cart.orders}
                </Text>
                <Text style={[styles.orderSeller, { color: colors.textMuted }]}>
                  {order.item_count ? `${order.item_count} ${t.cart.items}` : ""}
                </Text>
              </View>
              <View style={[styles.orderStatusBadge, { backgroundColor: statusInfo.color + "20" }]}>
                <Text style={[styles.orderStatusText, { color: statusInfo.color }]}>
                  {statusInfo.label}
                </Text>
              </View>
            </View>
            {statusInfo.progress > 0 && (
              <>
                <View style={styles.orderProgress}>
                  <View style={[styles.orderProgressBg, { backgroundColor: colors.border }]}>
                    <View style={[styles.orderProgressFill, { width: `${statusInfo.progress * 100}%` as any, backgroundColor: colors.primary }]} />
                  </View>
                </View>
                <View style={styles.orderSteps}>
                  {STEPS.map((step, i) => (
                    <View key={step} style={styles.orderStep}>
                      <View
                        style={[
                          styles.orderStepDot,
                          { backgroundColor: colors.border },
                          i / 3 <= statusInfo.progress && { backgroundColor: colors.primary },
                        ]}
                      />
                      <Text style={[
                        styles.orderStepText,
                        { color: colors.textMuted },
                        i / 3 <= statusInfo.progress && { color: colors.primary },
                      ]}>
                        {step}
                      </Text>
                    </View>
                  ))}
                </View>
              </>
            )}
            <View style={styles.orderFooter}>
              <Text style={[styles.orderCode, { color: colors.textMuted }]}>{t.cart.orderCode}: {order.order_code}</Text>
              <Text style={[styles.orderDate, { color: colors.textMuted }]}>{dateStr}</Text>
              <Text style={[styles.orderPrice, { color: colors.primary }]}>{formatPrice(order.total_amount)} {t.common.currency}</Text>
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}

const MOCK_CONVERSATIONS = [
  { id: "c1", name: "Moussa Diop",       initials: "MD", preview: "Bonjour, est-ce que cet article est e...", time: "10:30", unread: 2, online: true,  read: false },
  { id: "c2", name: "Fatou Sow",         initials: "FS", preview: "Merci beaucoup pour la livraison rapi...",  time: "Hier",  unread: 0, online: false, read: true  },
  { id: "c3", name: "Abdoulaye Ndiaye",  initials: "AN", preview: "Je voudrais commander 10 pièces d...",      time: "Hier",  unread: 5, online: true,  read: false },
  { id: "c4", name: "Awa Fall",          initials: "AF", preview: "Quel est votre dernier prix pour cet a...", time: "Lun",   unread: 0, online: false, read: true  },
  { id: "c5", name: "Oumar Sy",          initials: "OS", preview: "D'accord, je passe à la boutique dem...",  time: "Dim",   unread: 0, online: false, read: true  },
  { id: "c6", name: "Aïssatou Ba",       initials: "AB", preview: "Est-ce que vous livrez à Dakar ?",          time: "Dim",   unread: 3, online: true,  read: false },
  { id: "c7", name: "Kofi Mensah",       initials: "KM", preview: "Je confirme ma commande de 5 unités.", time: "Sam",   unread: 0, online: false, read: true  },
];

type SellerConv = {
  sellerId: string;
  shopName: string;
  initials: string;
  lastMessage: string;
  lastTime: string;
  unread: number;
  messages: { id: string; text: string; sender: "me" | "seller"; time: string }[];
};

const SELLER_CONVS_KEY = "@dkd:seller_convs";

type ActiveConv = { sellerId: string; shopName: string; initials: string };

function MessagesTab() {
  const { groupMessages } = useCart();
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();
  const [messageFilter, setMessageFilter] = useState(t.cart.all);
  const MESSAGE_FILTERS = [t.cart.all, t.cart.unread, t.cart.groupsCreated, t.cart.groupsJoined];
  const [sellerConvs, setSellerConvs] = useState<SellerConv[]>([]);
  const [activeConv,   setActiveConv]  = useState<ActiveConv | null>(null);
  const [chatMsgs,     setChatMsgs]    = useState<SellerConv["messages"]>([]);
  const [chatInput,    setChatInput]   = useState("");
  const [chatImages,   setChatImages]  = useState<string[]>([]);
  const chatRef = useRef<FlatList<any>>(null);

  const dBG     = isDark ? "#0D1117" : "#F0F4F8";
  const dCARD   = isDark ? "#161B22" : "#FFFFFF";
  const dTEXT   = isDark ? "#E6EDF3" : "#111827";
  const dMUTED  = isDark ? "rgba(255,255,255,0.4)"  : "rgba(0,0,0,0.45)";
  const dBORDER = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.08)";

  const loadSellerConvs = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(SELLER_CONVS_KEY);
      if (raw) setSellerConvs(JSON.parse(raw));
    } catch {}
  }, []);

  useEffect(() => { loadSellerConvs(); }, []);

  const openConv = useCallback(async (conv: ActiveConv) => {
    setActiveConv(conv);
    try {
      const raw = await AsyncStorage.getItem(SELLER_CONVS_KEY);
      const convs: SellerConv[] = raw ? JSON.parse(raw) : [];
      const found = convs.find(c => c.sellerId === conv.sellerId);
      setChatMsgs(found?.messages ?? []);
    } catch { setChatMsgs([]); }
  }, []);

  const closeConv = useCallback(() => {
    setActiveConv(null);
    setChatMsgs([]);
    setChatInput("");
    setChatImages([]);
    loadSellerConvs();
  }, [loadSellerConvs]);

  const sendMsg = useCallback(async () => {
    const text = chatInput.trim();
    if (!text && chatImages.length === 0) return;
    if (!activeConv) return;
    setChatInput("");
    const imgs = [...chatImages];
    setChatImages([]);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const now = new Date();
    const time = `${now.getHours().toString().padStart(2,"0")}:${now.getMinutes().toString().padStart(2,"0")}`;
    const newMsg = { id: `m_${Date.now()}`, text, sender: "me" as const, time, images: imgs.length > 0 ? imgs : undefined };
    const updated = [...chatMsgs, newMsg];
    setChatMsgs(updated);
    setTimeout(() => chatRef.current?.scrollToEnd({ animated: true }), 80);
    try {
      const raw = await AsyncStorage.getItem(SELLER_CONVS_KEY);
      const convs: SellerConv[] = raw ? JSON.parse(raw) : [];
      const idx = convs.findIndex(c => c.sellerId === activeConv.sellerId);
      const conv: SellerConv = idx >= 0 ? convs[idx] : {
        sellerId: activeConv.sellerId, shopName: activeConv.shopName,
        initials: activeConv.initials, lastMessage: "", lastTime: "", unread: 0, messages: [],
      };
      conv.messages = updated; conv.lastMessage = text || "📷 Photo"; conv.lastTime = time;
      if (idx >= 0) convs[idx] = conv; else convs.unshift(conv);
      await AsyncStorage.setItem(SELLER_CONVS_KEY, JSON.stringify(convs));
    } catch {}
  }, [chatInput, chatImages, chatMsgs, activeConv]);

  const pickImage = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: 4,
    });
    if (!result.canceled) {
      setChatImages(prev => [...prev, ...result.assets.map(a => a.uri)].slice(0, 4));
    }
  }, []);

  const getCountryFlag = (code: string) => {
    const flags: Record<string, string> = { CI: "🇨🇮", SN: "🇸🇳", BJ: "🇧🇯" };
    return flags[code] || "🌍";
  };

  const allConvsMixed = [
    ...sellerConvs.map((sc) => ({
      id: `seller_${sc.sellerId}`,
      name: sc.shopName,
      initials: sc.initials,
      preview: sc.lastMessage || "…",
      time: sc.lastTime || "",
      unread: sc.unread,
      online: false,
      read: true,
      sellerId: sc.sellerId,
    })),
    ...MOCK_CONVERSATIONS.map((c) => ({ ...c, sellerId: undefined as string | undefined })),
  ];

  const conversations = messageFilter === t.cart.unread
    ? allConvsMixed.filter((c) => c.unread > 0)
    : allConvsMixed;

  return (
    <View style={styles.tabContent}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.messageFilters}
        style={{ flexGrow: 0 }}
      >
        {MESSAGE_FILTERS.map((f) => (
          <TouchableOpacity
            key={f}
            style={[
              styles.messageFilter,
              { backgroundColor: colors.backgroundCard, borderColor: colors.border },
              messageFilter === f && { backgroundColor: colors.primary + "20", borderColor: colors.primary },
            ]}
            onPress={() => { setMessageFilter(f); Haptics.selectionAsync(); }}
          >
            <Text style={[
              styles.messageFilterText,
              { color: colors.textMuted },
              messageFilter === f && { color: colors.primary },
            ]}>
              {f}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {(messageFilter === t.cart.groupsCreated || messageFilter === t.cart.groupsJoined) && groupMessages.map((msg) => (
        <TouchableOpacity key={msg.id} style={[styles.messageCard, { backgroundColor: colors.backgroundCard, borderColor: colors.border }]}>
          {msg.unread > 0 && (
            <View style={[styles.messageBadge, { backgroundColor: colors.primary }]}>
              <Text style={styles.messageBadgeText}>{msg.unread}</Text>
            </View>
          )}
          <View style={styles.messageAvatarWrap}>
            <View style={[styles.messageAvatar, { backgroundColor: msg.id === "g1" ? "#3D1A00" : msg.id === "g2" ? "#001A3D" : "#0D2D0D" }]}>
              <Ionicons name="people" size={26} color="rgba(255,255,255,0.5)" />
            </View>
            <Text style={styles.avatarFlag}>{getCountryFlag(msg.country)}</Text>
          </View>
          <View style={styles.messageInfo}>
            {messageFilter === t.cart.groupsCreated && (
              <Text style={[styles.adminLabel, { color: "#FF6B00" }]}>Administrateur</Text>
            )}
            <Text style={[styles.messageName, { color: colors.text }]}>
              {msg.groupName}
            </Text>
            <View style={[styles.messageStatusRow, { backgroundColor: colors.primary + "20" }]}>
              <Text style={[styles.messageStatus, { color: colors.primary }]}>
                {t.groups.objective} .. {t.groups.discuss}
              </Text>
            </View>
            <View style={styles.messageProgressRow}>
              <Text style={[styles.messageMembers, { color: colors.textMuted }]}>{msg.members} {t.groups.places} · {msg.members}/{msg.target}</Text>
              <View style={[styles.messageProgressBg, { backgroundColor: colors.border }]}>
                <View style={[styles.messageProgressFill, { width: `${(msg.members / msg.target) * 100}%` as any }]} />
              </View>
            </View>
          </View>
          <View style={styles.discussCardWrap}>
            <TouchableOpacity style={[styles.discussCardBtn, { backgroundColor: colors.surface }]}>
              <Ionicons name="chatbubble-outline" size={14} color={colors.text} />
              <Text style={[styles.discussCardText, { color: colors.text }]}>{t.groups.discuss}</Text>
            </TouchableOpacity>
            <Text style={[styles.shareLabel, { color: "#0EA5E9" }]}>{msg.members} part / pers.</Text>
          </View>
        </TouchableOpacity>
      ))}
      {(messageFilter === t.cart.all || messageFilter === t.cart.unread) && (
        conversations.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="chatbubble-ellipses-outline" size={48} color={colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>Aucun message non lu</Text>
          </View>
        ) : (
          conversations.map((conv) => (
            <TouchableOpacity
              key={conv.id}
              style={[styles.convRow, { backgroundColor: dCARD, borderBottomColor: dBORDER }]}
              activeOpacity={0.75}
              onPress={() => {
                Haptics.selectionAsync();
                if (conv.sellerId) {
                  openConv({ sellerId: conv.sellerId, shopName: conv.name, initials: conv.initials });
                }
              }}
            >
              <View style={styles.convAvatarWrap}>
                <View style={styles.convAvatar}>
                  <Text style={styles.convInitials}>{conv.initials}</Text>
                </View>
                {conv.online && <View style={[styles.convOnline, { borderColor: dCARD }]} />}
              </View>
              <View style={styles.convBody}>
                <View style={styles.convTop}>
                  <Text style={[styles.convName, { color: dTEXT }, conv.unread > 0 && styles.convNameBold]}>{conv.name}</Text>
                  <Text style={[styles.convTime, conv.unread > 0 ? styles.convTimeUnread : { color: dMUTED }]}>{conv.time}</Text>
                </View>
                <View style={styles.convBottom}>
                  {conv.read && <Text style={styles.convTick}>✓✓ </Text>}
                  <Text style={[styles.convPreview, { color: conv.unread === 0 ? dMUTED : dTEXT }]} numberOfLines={1}>{conv.preview}</Text>
                  {conv.unread > 0 && (
                    <View style={styles.convBadge}>
                      <Text style={styles.convBadgeText}>{conv.unread}</Text>
                    </View>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          ))
        )
      )}
      {/* ── Modal chat vendeur (inline, sans navigation) ── */}
      <Modal visible={!!activeConv} animationType="slide" presentationStyle="pageSheet" onRequestClose={closeConv}>
        <View style={{ flex: 1, backgroundColor: dBG }}>
          {/* En-tête */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 12, paddingTop: 52, paddingBottom: 12, backgroundColor: dCARD, borderBottomWidth: 1, borderBottomColor: dBORDER }}>
            <TouchableOpacity onPress={closeConv} style={{ padding: 4 }}>
              <Ionicons name="arrow-back" size={22} color={dTEXT} />
            </TouchableOpacity>
            <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 10 }}>
              <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: Colors.primary + "20", alignItems: "center", justifyContent: "center" }}>
                <Text style={{ fontFamily: "Poppins_700Bold", fontSize: 14, color: Colors.primary }}>{activeConv?.initials ?? "?"}</Text>
              </View>
              <View>
                <Text style={{ fontFamily: "Poppins_700Bold", fontSize: 15, color: dTEXT }}>{activeConv?.shopName}</Text>
                <Text style={{ fontFamily: "Poppins_400Regular", fontSize: 11, color: "#10B981" }}>En ligne</Text>
              </View>
            </View>
          </View>

          {/* Messages */}
          <FlatList
            ref={chatRef}
            data={chatMsgs}
            keyExtractor={(m) => m.id}
            contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 12, gap: 6 }}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => chatMsgs.length > 0 && chatRef.current?.scrollToEnd({ animated: false })}
            ListEmptyComponent={
              <View style={{ alignItems: "center", paddingTop: 60, gap: 10 }}>
                <Ionicons name="chatbubbles-outline" size={48} color={isDark ? "#2D2D2D" : "#D1D5DB"} />
                <Text style={{ fontFamily: "Poppins_400Regular", fontSize: 13, color: dMUTED, textAlign: "center" }}>Envoyez un message à {activeConv?.shopName}</Text>
              </View>
            }
            renderItem={({ item }) => {
              const isMe = item.sender === "me";
              return (
                <View style={{ flexDirection: isMe ? "row-reverse" : "row", alignItems: "flex-end", gap: 8, marginVertical: 2 }}>
                  {!isMe && (
                    <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: Colors.primary + "20", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Text style={{ fontFamily: "Poppins_700Bold", fontSize: 11, color: Colors.primary }}>{activeConv?.initials ?? "?"}</Text>
                    </View>
                  )}
                  <View style={{ maxWidth: "75%", gap: 2 }}>
                    {item.images && item.images.length > 0 && (
                      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 4, marginBottom: 2 }}>
                        {item.images.map((uri: string, i: number) => (
                          <Image key={i} source={{ uri }} style={{ width: 110, height: 110, borderRadius: 10 }} contentFit="cover" />
                        ))}
                      </View>
                    )}
                    {item.text.length > 0 && (
                      <View style={[{ borderRadius: 16, paddingHorizontal: 12, paddingVertical: 8 }, isMe ? { backgroundColor: Colors.primary, borderBottomRightRadius: 4 } : { backgroundColor: dCARD, borderWidth: 1, borderColor: dBORDER, borderBottomLeftRadius: 4 }]}>
                        <Text style={{ fontFamily: "Poppins_400Regular", fontSize: 14, lineHeight: 20, color: isMe ? "#fff" : dTEXT }}>{item.text}</Text>
                      </View>
                    )}
                    <Text style={{ fontFamily: "Poppins_400Regular", fontSize: 10, color: dMUTED, textAlign: isMe ? "right" : "left" }}>{item.time}{isMe ? " ✓✓" : ""}</Text>
                  </View>
                </View>
              );
            }}
          />

          {/* Aperçu images */}
          {chatImages.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ backgroundColor: dCARD, borderTopWidth: 1, borderTopColor: dBORDER }} contentContainerStyle={{ padding: 8, gap: 8, flexDirection: "row" }}>
              {chatImages.map((uri, i) => (
                <View key={i} style={{ position: "relative" }}>
                  <Image source={{ uri }} style={{ width: 60, height: 60, borderRadius: 8 }} contentFit="cover" />
                  <TouchableOpacity
                    style={{ position: "absolute", top: -4, right: -4, backgroundColor: "#EF4444", borderRadius: 9, width: 18, height: 18, alignItems: "center", justifyContent: "center" }}
                    onPress={() => setChatImages(prev => prev.filter((_, idx) => idx !== i))}
                  >
                    <Ionicons name="close" size={11} color="#fff" />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          )}

          {/* Barre de saisie */}
          <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 8, paddingHorizontal: 12, paddingVertical: 10, paddingBottom: 28, backgroundColor: dCARD, borderTopWidth: 1, borderTopColor: dBORDER }}>
            <TouchableOpacity onPress={pickImage} style={{ width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" }} activeOpacity={0.75}>
              <Ionicons name="image-outline" size={22} color={Colors.primary} />
            </TouchableOpacity>
            <TextInput
              style={{ flex: 1, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 10, fontFamily: "Poppins_400Regular", fontSize: 14, maxHeight: 100, backgroundColor: isDark ? "#1A1A1A" : "#F3F4F6", color: dTEXT }}
              placeholder="Message…"
              placeholderTextColor={dMUTED}
              value={chatInput}
              onChangeText={setChatInput}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={{ width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center", flexShrink: 0, backgroundColor: (chatInput.trim() || chatImages.length > 0) ? Colors.primary : (isDark ? "#2D2D2D" : "#E5E7EB") }}
              onPress={sendMsg}
              activeOpacity={0.8}
              disabled={!chatInput.trim() && chatImages.length === 0}
            >
              <Ionicons name="send" size={18} color={(chatInput.trim() || chatImages.length > 0) ? "#fff" : dMUTED} />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

export default function PanierScreen() {
  const [activeTab, setActiveTab] = useState("favoris_articles");
  const bottomPadding = Platform.OS === "web" ? 34 : 90;
  const { colors } = useTheme();
  const { t } = useLanguage();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const TABS = [
    { key: "favoris_articles", label: "Fav. Articles", icon: "bookmark-outline" },
    { key: "favoris", label: t.cart.favoriteVideos, icon: "heart-outline" },
    { key: "favoris_groupe", label: "Fav. Groupe", icon: "people-outline" },
    { key: "suivi", label: t.cart.tracking, icon: "bicycle-outline" },
    { key: "messages", label: t.cart.messages, icon: "chatbubble-outline" },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader onMenuPress={() => setDrawerOpen(true)} />
      <View style={[styles.tabBarScroll, { borderBottomColor: colors.border }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabBar}
        >
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tabBarItem, activeTab === tab.key && { borderBottomColor: colors.primary }]}
              onPress={() => { setActiveTab(tab.key); Haptics.selectionAsync(); }}
            >
              <Ionicons
                name={tab.icon as any}
                size={16}
                color={activeTab === tab.key ? colors.primary : colors.textMuted}
              />
              <Text style={[
                styles.tabBarLabel,
                { color: colors.textMuted },
                activeTab === tab.key && { color: colors.primary },
              ]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={{ flex: 1 }}>
        {activeTab === "favoris_articles" && (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: bottomPadding, flexGrow: 1 }}>
            <FavorisArticlesTab />
          </ScrollView>
        )}
        {activeTab === "favoris" && (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: bottomPadding, flexGrow: 1 }}>
            <FavorisTab />
          </ScrollView>
        )}
        {activeTab === "favoris_groupe" && (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: bottomPadding, flexGrow: 1 }}>
            <FavorisGroupeTab />
          </ScrollView>
        )}
        {activeTab === "suivi" && <SuiviTab />}
        {activeTab === "messages" && (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: bottomPadding }}>
            <MessagesTab />
          </ScrollView>
        )}
      </View>
      <SideDrawer visible={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  tabBarScroll: { borderBottomWidth: 1, flexShrink: 0 },
  tabBar: { flexDirection: "row", paddingHorizontal: 8 },
  tabBarItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabBarLabel: { fontFamily: "Poppins_600SemiBold", fontSize: 10, letterSpacing: 0.5 },
  tabUnderline: { height: 0 },
  tabContent: { padding: 16, gap: 10 },
  emptyState: { alignItems: "center", paddingTop: 60, gap: 12, paddingHorizontal: 32 },
  emptyCartIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  emptyTitle: { fontFamily: "Poppins_700Bold", fontSize: 18, textAlign: "center" },
  emptyText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 20,
  },
  emptyBtn: {
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 8,
  },
  emptyBtnText: { color: "#fff", fontFamily: "Poppins_700Bold", fontSize: 14 },
  favoriteCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
  },
  favoriteThumb: {
    width: 80,
    height: 70,
    alignItems: "center",
    justifyContent: "center",
  },
  favoriteInfo: { flex: 1, padding: 10 },
  favoriteSeller: { fontFamily: "Poppins_600SemiBold", fontSize: 11, marginBottom: 2 },
  favoriteTitle: { fontFamily: "Poppins_500Medium", fontSize: 13, marginBottom: 4 },
  favoriteViews: { flexDirection: "row", alignItems: "center", gap: 4 },
  favoriteViewsText: { fontFamily: "Poppins_400Regular", fontSize: 11 },
  cartItem: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    padding: 12,
    gap: 12,
    borderWidth: 1,
  },
  cartItemImage: {
    width: 60,
    height: 60,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  cartItemInfo: { flex: 1 },
  cartItemName: { fontFamily: "Poppins_600SemiBold", fontSize: 13, marginBottom: 2 },
  cartItemSeller: { fontFamily: "Poppins_400Regular", fontSize: 11, marginBottom: 2 },
  cartItemVariant: { fontFamily: "Poppins_400Regular", fontSize: 11, marginBottom: 2 },
  cartItemPrice: { fontFamily: "Poppins_700Bold", fontSize: 13 },
  outOfStock: { fontFamily: "Poppins_600SemiBold", fontSize: 10, marginBottom: 2 },
  cartItemControls: { alignItems: "center", gap: 8 },
  qtyBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  qtyText: { fontFamily: "Poppins_700Bold", fontSize: 14 },
  checkoutBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderTopWidth: 1,
  },
  checkoutTotal: { fontFamily: "Poppins_400Regular", fontSize: 12 },
  checkoutAmount: { fontFamily: "Poppins_700Bold", fontSize: 18 },
  checkoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  checkoutBtnText: { color: "#fff", fontFamily: "Poppins_700Bold", fontSize: 14 },
  orderCard: {
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    gap: 10,
  },
  orderHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  orderProduct: { fontFamily: "Poppins_600SemiBold", fontSize: 13, maxWidth: 200 },
  orderSeller: { fontFamily: "Poppins_400Regular", fontSize: 11, marginTop: 2 },
  orderStatusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  orderStatusText: { fontFamily: "Poppins_600SemiBold", fontSize: 11 },
  orderProgress: {},
  orderProgressBg: { height: 4, borderRadius: 2, overflow: "hidden" },
  orderProgressFill: { height: "100%", borderRadius: 2 },
  orderSteps: { flexDirection: "row", justifyContent: "space-between" },
  orderStep: { alignItems: "center", gap: 4 },
  orderStepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  orderStepText: { fontFamily: "Poppins_400Regular", fontSize: 9 },
  orderFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  orderCode: { fontFamily: "Poppins_500Medium", fontSize: 10 },
  orderDate: { fontFamily: "Poppins_400Regular", fontSize: 10 },
  orderPrice: { fontFamily: "Poppins_700Bold", fontSize: 13 },
  messageFilters: { paddingHorizontal: 16, gap: 8, marginBottom: 12, alignItems: "center" },
  messageFilter: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  messageFilterText: { fontFamily: "Poppins_600SemiBold", fontSize: 11 },
  messageCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    overflow: "visible",
    marginHorizontal: 16,
    marginBottom: 14,
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
  messageAvatarWrap: {
    position: "relative",
    width: 64,
    height: 64,
  },
  messageAvatar: {
    width: 64,
    height: 64,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarFlag: {
    position: "absolute",
    bottom: -4,
    right: -4,
    fontSize: 16,
  },
  messageInfo: { flex: 1, gap: 4 },
  messageHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  messageName: { fontFamily: "Poppins_700Bold", fontSize: 14 },
  messageBadge: {
    position: "absolute",
    top: -8,
    right: -8,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  messageBadgeText: { color: "#fff", fontFamily: "Poppins_700Bold", fontSize: 11 },
  messageTime: { fontFamily: "Poppins_400Regular", fontSize: 11 },
  lastMessage: { fontFamily: "Poppins_400Regular", fontSize: 12 },
  messageStatusRow: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  messageStatus: { fontFamily: "Poppins_600SemiBold", fontSize: 10 },
  messageProgressRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  messageMembers: { fontFamily: "Poppins_500Medium", fontSize: 9 },
  messageProgressBg: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    overflow: "hidden",
  },
  messageProgressFill: { height: "100%", backgroundColor: "#3B82F6", borderRadius: 2 },
  discussCardBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
  },
  discussCardText: { fontFamily: "Poppins_700Bold", fontSize: 10 },
  discussCardWrap: {
    alignItems: "center",
    gap: 2,
  },
  adminLabel: {
    fontFamily: "Poppins_400Regular",
    fontSize: 8,
    letterSpacing: 0.2,
  },
  shareLabel: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 9,
    textAlign: "center",
  },
  convRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  convAvatarWrap: { position: "relative", width: 52, height: 52 },
  convAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#FF6B00",
    alignItems: "center",
    justifyContent: "center",
  },
  convInitials: { color: "#fff", fontFamily: "Poppins_700Bold", fontSize: 16 },
  convOnline: {
    position: "absolute",
    bottom: 1,
    right: 1,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#22C55E",
    borderWidth: 2,
    borderColor: "#fff",
  },
  convBody: { flex: 1, gap: 3 },
  convTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  convName: { fontFamily: "Poppins_500Medium", fontSize: 14, color: "#111827" },
  convNameBold: { fontFamily: "Poppins_700Bold" },
  convTime: { fontFamily: "Poppins_400Regular", fontSize: 11, color: "#9CA3AF" },
  convTimeUnread: { color: "#22C55E", fontFamily: "Poppins_600SemiBold" },
  convBottom: { flexDirection: "row", alignItems: "center", flex: 1 },
  convTick: { color: "#3B82F6", fontSize: 12, marginRight: 2 },
  convPreview: { fontFamily: "Poppins_400Regular", fontSize: 12, color: "#374151", flex: 1 },
  convBadge: {
    backgroundColor: "#22C55E",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
    marginLeft: 6,
  },
  convBadgeText: { color: "#fff", fontFamily: "Poppins_700Bold", fontSize: 10 },
});
