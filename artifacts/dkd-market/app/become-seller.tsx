import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Alert,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import ProfilePhotoAvatar from "@/components/ProfilePhotoAvatar";
import { useQuery, useMutation } from "@tanstack/react-query";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { api } from "@/lib/api";
import { AUTH_STORAGE_KEYS } from "@/lib/auth-storage";
import * as Haptics from "expo-haptics";

const IS_WEB = Platform.OS === "web";

const SELLER_SHOP_TYPES_KEY = "@dkd:seller_shop_types";

const SHOP_TYPE_ACTIONS: Record<string, { icon: string; label: string; color: string; route?: string }> = {
  marche:      { icon: "basket-outline",     label: "Mon Marché",    color: "#22C55E",  route: "/marche" },
  grossiste:   { icon: "cube-outline",        label: "Grossiste",     color: "#3B82F6",  route: "/grossiste" },
  supermarche: { icon: "storefront-outline",  label: "Super Marché",  color: "#8B5CF6",  route: "/supermarche" },
  importe:     { icon: "airplane-outline",    label: "Importés",      color: "#F59E0B",  route: "/importe" },
  mon_plat:        { icon: "restaurant-outline",   label: "Gastronomie",      color: "#EC4899",  route: "/mon-plat" },
  personnalisation: { icon: "color-palette-outline", label: "Personnalisation", color: "#06B6D4",  route: "/personnalisation" },
};

function fmtNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toString();
}

function fmtCurrency(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M FCFA`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}k FCFA`;
  return `${n} FCFA`;
}

const BENEFITS = [
  { icon: "storefront-outline", color: "#FF6B00", title: "Boutique gratuite", desc: "Ouvrez votre boutique en ligne sans frais d'inscription, accessible dans 15 pays africains." },
  { icon: "videocam-outline", color: "#3B82F6", title: "Vente par vidéo", desc: "Présentez vos produits en vidéo et en live pour augmenter vos ventes." },
  { icon: "people-outline", color: "#22C55E", title: "Achat groupé", desc: "Proposez vos produits en gros et en groupe pour vendre plus vite." },
  { icon: "shield-checkmark-outline", color: "#8B5CF6", title: "Paiements sécurisés", desc: "Recevez vos paiements en toute sécurité avec nos partenaires financiers locaux." },
];

const STEPS = [
  { num: "01", title: "Créez votre compte", desc: "Renseignez vos informations de base et téléchargez une pièce d'identité." },
  { num: "02", title: "Configurez votre boutique", desc: "Ajoutez votre logo, description et choisissez vos catégories de produits." },
  { num: "03", title: "Publiez vos articles", desc: "Ajoutez vos produits avec photos, prix et stock disponible." },
  { num: "04", title: "Commencez à vendre", desc: "Recevez des commandes et des paiements directement sur votre compte." },
];

export default function BecomeSellerScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { user, isAuthenticated, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState<"articles" | "gros" | "videos">("articles");
  const [showForm, setShowForm] = useState(false);
  const [isSeller, setIsSeller] = useState(
    !!(isAuthenticated && user?.role &&
      (user.role.toLowerCase().includes("seller") ||
        user.role.toLowerCase().includes("vendor") ||
        user.role.toLowerCase().includes("company")))
  );

  const [form, setForm] = useState({
    shop_name: "",
    company_name: "",
    phone_number: user?.phone_number || "",
    description: "",
  });
  const [formError, setFormError] = useState("");

  const { data: stats } = useQuery({
    queryKey: ["/api/orders/seller/stats"],
    queryFn: async () => { try { return await api.orders.sellerStats(); } catch { return null; } },
    enabled: isSeller,
    retry: false,
  });

  const { data: pendingOrders } = useQuery({
    queryKey: ["/api/orders/seller/pending"],
    queryFn: async () => { try { return await api.orders.sellerPending(); } catch { return []; } },
    enabled: isSeller,
    retry: false,
  });

  const pendingCount = Array.isArray(pendingOrders) ? pendingOrders.length : 0;

  const becomeMutation = useMutation({
    mutationFn: () => api.sellers.become({
      shop_name: form.shop_name.trim(),
      company_name: form.company_name.trim() || undefined,
      phone_number: form.phone_number.trim() || undefined,
      description: form.description.trim() || undefined,
    }),
    onSuccess: async (data: any) => {
      if (data?.user) updateUser(data.user);
      if (data?.accessToken) {
        await AsyncStorage.setItem(AUTH_STORAGE_KEYS.ACCESS_TOKEN, data.accessToken);
      }
      if (data?.refreshToken) {
        await AsyncStorage.setItem(AUTH_STORAGE_KEYS.REFRESH_TOKEN, data.refreshToken);
      }
      setShowForm(false);
      setIsSeller(true);
    },
    onError: (err: any) => {
      setFormError(err?.message || "Erreur lors de la création de la boutique");
    },
  });

  const handleSubmit = () => {
    setFormError("");
    if (!form.shop_name.trim() || form.shop_name.trim().length < 2) {
      setFormError("Le nom de la boutique est requis (minimum 2 caractères)");
      return;
    }
    if (!isAuthenticated) {
      router.push("/auth/login" as any);
      return;
    }
    becomeMutation.mutate();
  };

  const initials = user?.full_name
    ? user.full_name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
    : "V";

  const shopName = (user as any)?.shop_name || user?.full_name || "Ma Boutique";
  const topPad = IS_WEB ? 0 : insets.top;
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);

  useFocusEffect(useCallback(() => {
    AsyncStorage.getItem("@dkd:seller_profile_photo").then((uri) => {
      if (uri) setProfilePhoto(uri);
    }).catch(() => {});
  }, []));

  if (isSeller) {
    return (
      <SellerDashboard
        initials={initials}
        profilePhoto={profilePhoto}
        onPhotoChanged={setProfilePhoto}
        shopName={shopName}
        stats={stats}
        pendingCount={pendingCount}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        topPad={topPad}
        insets={insets}
      />
    );
  }

  return (
    <>
      <SellerLanding
        topPad={topPad}
        insets={insets}
        isAuthenticated={!!isAuthenticated}
        onApply={() => {
          if (!isAuthenticated) {
            router.push("/auth/login" as any);
          } else {
            setShowForm(true);
          }
        }}
      />

      <Modal
        visible={showForm}
        transparent
        animationType="slide"
        onRequestClose={() => setShowForm(false)}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <TouchableOpacity style={formStyles.overlay} activeOpacity={1} onPress={() => setShowForm(false)} />
          <View style={[formStyles.sheet, { paddingBottom: IS_WEB ? 24 : insets.bottom + 16 }]}>
            <View style={formStyles.handle} />
            <View style={formStyles.sheetHeader}>
              <Text style={formStyles.sheetTitle}>Ouvrir ma boutique</Text>
              <TouchableOpacity onPress={() => setShowForm(false)}>
                <Ionicons name="close" size={24} color="rgba(255,255,255,0.6)" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={formStyles.fieldGroup}>
                <Text style={formStyles.label}>Nom de la boutique <Text style={formStyles.required}>*</Text></Text>
                <TextInput
                  style={formStyles.input}
                  placeholder="Ex: Dakar Fashion, Boutique Wax..."
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  value={form.shop_name}
                  onChangeText={(v) => setForm((f) => ({ ...f, shop_name: v }))}
                  autoFocus
                />
              </View>

              <View style={formStyles.fieldGroup}>
                <Text style={formStyles.label}>Nom de l'entreprise <Text style={formStyles.optional}>(optionnel)</Text></Text>
                <TextInput
                  style={formStyles.input}
                  placeholder="Ex: DKD Sarl, Fashion Group..."
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  value={form.company_name}
                  onChangeText={(v) => setForm((f) => ({ ...f, company_name: v }))}
                />
              </View>

              <View style={formStyles.fieldGroup}>
                <Text style={formStyles.label}>Numéro de téléphone <Text style={formStyles.optional}>(optionnel)</Text></Text>
                <TextInput
                  style={formStyles.input}
                  placeholder="+225 07 00 00 00 00"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  value={form.phone_number}
                  onChangeText={(v) => setForm((f) => ({ ...f, phone_number: v }))}
                  keyboardType="phone-pad"
                />
              </View>

              <View style={formStyles.fieldGroup}>
                <Text style={formStyles.label}>Description de la boutique <Text style={formStyles.optional}>(optionnel)</Text></Text>
                <TextInput
                  style={[formStyles.input, formStyles.textArea]}
                  placeholder="Décrivez vos produits et votre activité..."
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  value={form.description}
                  onChangeText={(v) => setForm((f) => ({ ...f, description: v }))}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>

              {formError ? (
                <View style={formStyles.errorBox}>
                  <Ionicons name="alert-circle" size={16} color="#EF4444" />
                  <Text style={formStyles.errorText}>{formError}</Text>
                </View>
              ) : null}

              <TouchableOpacity
                style={[formStyles.submitBtn, becomeMutation.isPending && { opacity: 0.7 }]}
                onPress={handleSubmit}
                disabled={becomeMutation.isPending}
                activeOpacity={0.85}
              >
                {becomeMutation.isPending ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Ionicons name="storefront" size={20} color="#fff" />
                    <Text style={formStyles.submitText}>Créer ma boutique</Text>
                  </>
                )}
              </TouchableOpacity>

              <Text style={formStyles.formNote}>Votre boutique sera active immédiatement après la création.</Text>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

function SellerDashboard({ initials, profilePhoto, onPhotoChanged, shopName, stats, pendingCount, activeTab, setActiveTab, topPad, insets }: any) {
  const [activeShopTypes, setActiveShopTypes] = useState<string[]>([]);
  const { isDark } = useTheme();
  const dBG      = isDark ? "#0D1117" : "#F0F4F8";
  const dHEAD    = isDark ? "#0D1117" : "#FFFFFF";
  const dCARD    = isDark ? "#1C2230" : "#FFFFFF";
  const dTEXT    = isDark ? "#FFFFFF" : "#111827";
  const dSUB     = isDark ? "rgba(255,255,255,0.5)"  : "#6B7280";
  const dMUTED   = isDark ? "rgba(255,255,255,0.4)"  : "rgba(0,0,0,0.45)";
  const dBORDER  = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.08)";
  const dICON    = isDark ? "#fff" : "#374151";

  const loadShopTypes = useCallback(async () => {
    try {
      const saved = await AsyncStorage.getItem(SELLER_SHOP_TYPES_KEY);
      const types: string[] = saved ? JSON.parse(saved) : [];
      if (__DEV__) {
        const devTypes = [...new Set([...types, "importe", "grossiste"])];
        setActiveShopTypes(devTypes);
      } else {
        setActiveShopTypes(types);
      }
    } catch {}
  }, []);

  useEffect(() => { loadShopTypes(); }, [loadShopTypes]);
  useFocusEffect(useCallback(() => { loadShopTypes(); }, [loadShopTypes]));

  const revenue = stats?.revenue ?? 0;
  const totalOrders = stats?.total_orders ?? 0;
  const followers = stats?.followers ?? 0;
  const views = stats?.views ?? 0;
  const rating = stats?.avg_rating ?? 0;
  const likes = stats?.likes ?? 0;

  const STAT_ROWS = [
    [
      { icon: "cash-outline", iconColor: "#22C55E", label: "Revenus", value: fmtCurrency(revenue) },
      { icon: "bag-handle-outline", iconColor: "#3B82F6", label: "Commandes", value: fmtNum(totalOrders) },
    ],
    [
      { icon: "people-outline", iconColor: "#8B5CF6", label: "Abonnés", value: fmtNum(followers) },
      { icon: "eye-outline", iconColor: "#06B6D4", label: "Vues", value: fmtNum(views) },
    ],
    [
      { icon: "star", iconColor: "#F59E0B", label: "Note", value: rating > 0 ? rating.toFixed(1) : "—" },
      { icon: "heart", iconColor: "#EC4899", label: "J'aime", value: fmtNum(likes) },
    ],
  ];

  return (
    <View style={[dashStyles.container, { paddingTop: topPad, backgroundColor: dBG }]}>
      <View style={[dashStyles.header, { backgroundColor: dHEAD, borderBottomWidth: 1, borderBottomColor: dBORDER }]}>
        <TouchableOpacity style={dashStyles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={dICON} />
        </TouchableOpacity>
        <Text style={[dashStyles.headerTitle, { color: dTEXT }]}>Votre boutique</Text>
        <View style={dashStyles.headerRight}>
          <TouchableOpacity style={dashStyles.liveBtn} onPress={() => router.push("/go-live" as any)}>
            <Ionicons name="videocam" size={14} color="#fff" />
            <Text style={dashStyles.liveBtnText}>Live</Text>
          </TouchableOpacity>
          <TouchableOpacity style={dashStyles.menuBtn} onPress={() => router.push("/seller-settings" as any)}>
            <Ionicons name="menu" size={22} color={dICON} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}>
        <View style={[dashStyles.profileSection, { backgroundColor: dBG }]}>
          <ProfilePhotoAvatar
            photoUri={profilePhoto}
            initials={initials}
            onPhotoChanged={onPhotoChanged}
            size={90}
            fontSize={34}
            borderColor="rgba(255,107,0,0.5)"
            bgColor={dCARD}
            initialsColor={dTEXT}
            style={{ marginBottom: 12 }}
          />
          <Text style={[dashStyles.shopName, { color: dTEXT }]}>{shopName}</Text>
          <Text style={[dashStyles.shopRole, { color: dSUB }]}>Entrepreneur & Vendeur DKD</Text>
        </View>

        {/* Primary actions — 2 big cards */}
        <View style={dashStyles.primaryRow}>
          <TouchableOpacity style={[dashStyles.primaryCard, { backgroundColor: "#C0392B" }]} onPress={() => router.push("/add-product")} activeOpacity={0.8}>
            <View style={dashStyles.primaryIconWrap}>
              <Ionicons name="cloud-upload-outline" size={26} color="#fff" />
            </View>
            <Text style={dashStyles.primaryLabel}>Ajouter{"\n"}un article</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[dashStyles.primaryCard, { backgroundColor: "#1B7A4E" }]} onPress={() => router.push("/add-video" as any)} activeOpacity={0.8}>
            <View style={dashStyles.primaryIconWrap}>
              <Ionicons name="videocam-outline" size={26} color="#fff" />
            </View>
            <Text style={dashStyles.primaryLabel}>Ajouter{"\n"}une vidéo</Text>
          </TouchableOpacity>
        </View>

        {/* MES COMMANDES */}
        <TouchableOpacity
          style={[dashStyles.wideBtn, { backgroundColor: "#7E22CE" }]}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.push("/mes-commandes" as any); }}
          activeOpacity={0.85}
        >
          <View style={dashStyles.wideBtnLeft}>
            <View style={[dashStyles.wideBtnIcon, { backgroundColor: "rgba(255,255,255,0.18)" }]}>
              <Ionicons name="receipt-outline" size={22} color="#fff" />
            </View>
            <View>
              <Text style={dashStyles.wideBtnTitle}>Mes commandes</Text>
              <Text style={dashStyles.wideBtnSub}>Suivre et gérer vos commandes</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.5)" />
        </TouchableOpacity>

        {/* GESTION LIVRAISON */}
        <TouchableOpacity
          style={[dashStyles.wideBtn, { backgroundColor: "#1D4ED8" }]}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.push("/gestion-livraison" as any); }}
          activeOpacity={0.85}
        >
          <View style={dashStyles.wideBtnLeft}>
            <View style={[dashStyles.wideBtnIcon, { backgroundColor: "rgba(255,255,255,0.18)" }]}>
              <Ionicons name="bicycle-outline" size={22} color="#fff" />
            </View>
            <View>
              <Text style={dashStyles.wideBtnTitle}>Gestion de la livraison</Text>
              <Text style={dashStyles.wideBtnSub}>Gérer les livreurs et suivre les colis</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.5)" />
        </TouchableOpacity>

        {/* Secondary actions — small utility row */}
        <View style={[dashStyles.secondaryRow, { backgroundColor: dCARD, borderColor: dBORDER }]}>
          <TouchableOpacity style={dashStyles.secondaryBtn} activeOpacity={0.75}>
            <Ionicons name="share-social-outline" size={17} color={dSUB} />
            <Text style={[dashStyles.secondaryBtnText, { color: isDark ? "#A0AEC0" : "#374151" }]}>Partager</Text>
          </TouchableOpacity>
          <View style={[dashStyles.secondaryDivider, { backgroundColor: dBORDER }]} />
          <TouchableOpacity style={dashStyles.secondaryBtn} onPress={() => router.push("/mes-messages-vendeur" as any)} activeOpacity={0.75}>
            <Ionicons name="chatbubble-ellipses-outline" size={17} color={dSUB} />
            <Text style={[dashStyles.secondaryBtnText, { color: isDark ? "#A0AEC0" : "#374151" }]}>Messages</Text>
          </TouchableOpacity>
        </View>

        {/* Shop type mode pills */}
        {activeShopTypes.length > 0 && (
          <View style={dashStyles.modesSection}>
            <Text style={[dashStyles.modesSectionTitle, { color: dMUTED }]}>Mes modes de vente</Text>
            <View style={dashStyles.pillsWrap}>
              {activeShopTypes.map((typeId) => {
                const action = SHOP_TYPE_ACTIONS[typeId];
                if (!action) return null;
                return (
                  <TouchableOpacity
                    key={typeId}
                    style={[dashStyles.modePill, { borderColor: action.color + "66", backgroundColor: action.color + "18" }]}
                    activeOpacity={0.75}
                    onPress={() => {
                      if (action.route) router.push(action.route as any);
                    }}
                  >
                    <Ionicons name={action.icon as any} size={15} color={action.color} />
                    <Text style={[dashStyles.modePillText, { color: action.color }]}>{action.label}</Text>
                    {action.route && (
                      <Ionicons name="chevron-forward" size={12} color={action.color + "99"} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {pendingCount > 0 && (
          <TouchableOpacity style={[dashStyles.ordersRow, { backgroundColor: dCARD }]}>
            <View style={dashStyles.ordersLeft}>
              <Ionicons name="archive-outline" size={20} color={dICON} />
              <Text style={[dashStyles.ordersText, { color: dTEXT }]}>Commandes en cours</Text>
            </View>
            <View style={dashStyles.ordersRight}>
              <View style={dashStyles.ordersBadge}>
                <Text style={dashStyles.ordersBadgeText}>{pendingCount}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={dSUB} />
            </View>
          </TouchableOpacity>
        )}

        <Text style={[dashStyles.sectionTitle, { color: dTEXT }]}>Statistiques</Text>

        <View style={[dashStyles.statsCard, { backgroundColor: dCARD }]}>
          {STAT_ROWS.map((row, ri) => (
            <View key={ri} style={dashStyles.statsRow}>
              {row.map((s) => (
                <View key={s.label} style={dashStyles.statCell}>
                  <View style={dashStyles.statTop}>
                    <Ionicons name={s.icon as any} size={18} color={s.iconColor} />
                    <Text style={[dashStyles.statValue, { color: dTEXT }]}>{s.value}</Text>
                  </View>
                  <Text style={[dashStyles.statLabel, { color: dSUB }]}>{s.label}</Text>
                </View>
              ))}
            </View>
          ))}
        </View>

        <Text style={[dashStyles.sectionTitle, { color: dTEXT }]}>Gestion</Text>

        <TouchableOpacity style={dashStyles.mgmtBtn} onPress={() => router.push("/mes-publications" as any)}>
          <MaterialCommunityIcons name="format-list-bulleted" size={20} color="#06B6D4" />
          <Text style={[dashStyles.mgmtBtnText, { color: "#06B6D4" }]}>Gérer mes publications</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[dashStyles.mgmtBtn, dashStyles.mgmtBtnDark, { backgroundColor: dCARD, borderColor: dBORDER }]} onPress={() => router.push({ pathname: "/seller/[id]" as any, params: { id: "own", preview: "true" } })}>
          <Ionicons name="eye-outline" size={20} color={dICON} />
          <Text style={[dashStyles.mgmtBtnText, { color: dTEXT }]}>Aperçu public de la boutique</Text>
        </TouchableOpacity>

      </ScrollView>

    </View>
  );
}

function SellerLanding({ topPad, insets, isAuthenticated, onApply }: any) {
  return (
    <View style={[landStyles.container, { paddingTop: topPad }]}>
      <View style={landStyles.header}>
        <TouchableOpacity style={landStyles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={landStyles.headerTitle}>Devenir Vendeur</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}>
        <View style={landStyles.hero}>
          <View style={landStyles.heroIconCircle}>
            <Ionicons name="storefront" size={48} color="#FF6B00" />
          </View>
          <Text style={landStyles.heroTitle}>Vendez dans toute l'Afrique</Text>
          <Text style={landStyles.heroSub}>Rejoignez des milliers de vendeurs actifs sur DKD Market et développez votre business dans 15 pays.</Text>
          <View style={landStyles.heroStats}>
            <View style={landStyles.heroStat}>
              <Text style={landStyles.heroStatNum}>15</Text>
              <Text style={landStyles.heroStatLabel}>Pays</Text>
            </View>
            <View style={landStyles.heroStatDivider} />
            <View style={landStyles.heroStat}>
              <Text style={landStyles.heroStatNum}>12k+</Text>
              <Text style={landStyles.heroStatLabel}>Vendeurs</Text>
            </View>
            <View style={landStyles.heroStatDivider} />
            <View style={landStyles.heroStat}>
              <Text style={landStyles.heroStatNum}>500k+</Text>
              <Text style={landStyles.heroStatLabel}>Clients</Text>
            </View>
          </View>
        </View>

        <Text style={landStyles.sectionTitle}>Pourquoi vendre sur DKD ?</Text>

        {BENEFITS.map((b) => (
          <View key={b.title} style={landStyles.benefitCard}>
            <View style={[landStyles.benefitIcon, { backgroundColor: b.color + "20" }]}>
              <Ionicons name={b.icon as any} size={24} color={b.color} />
            </View>
            <View style={landStyles.benefitText}>
              <Text style={landStyles.benefitTitle}>{b.title}</Text>
              <Text style={landStyles.benefitDesc}>{b.desc}</Text>
            </View>
          </View>
        ))}

        <Text style={landStyles.sectionTitle}>Comment ça marche ?</Text>

        {STEPS.map((s, i) => (
          <View key={s.num} style={landStyles.stepRow}>
            <View style={landStyles.stepNumCol}>
              <View style={[landStyles.stepCircle, i === 0 && { backgroundColor: "#FF6B00" }]}>
                <Text style={landStyles.stepNum}>{s.num}</Text>
              </View>
              {i < STEPS.length - 1 && <View style={landStyles.stepLine} />}
            </View>
            <View style={landStyles.stepContent}>
              <Text style={landStyles.stepTitle}>{s.title}</Text>
              <Text style={landStyles.stepDesc}>{s.desc}</Text>
            </View>
          </View>
        ))}

        <TouchableOpacity style={landStyles.ctaBtn} onPress={onApply} activeOpacity={0.85}>
          <Ionicons name="rocket-outline" size={20} color="#fff" />
          <Text style={landStyles.ctaBtnText}>Ouvrir ma boutique gratuitement</Text>
        </TouchableOpacity>

        <Text style={landStyles.ctaNote}>Votre boutique sera active immédiatement après la création.</Text>
      </ScrollView>
    </View>
  );
}

const BG = "#0D1117";
const CARD2 = "#1C2230";

const dashStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  headerTitle: { color: "#fff", fontFamily: "Poppins_700Bold", fontSize: 17 },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  liveBtn: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "#E53935", borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6 },
  liveBtnText: { color: "#fff", fontFamily: "Poppins_700Bold", fontSize: 12 },
  menuBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  profileSection: { alignItems: "center", paddingVertical: 24 },
  avatarCircle: { width: 90, height: 90, borderRadius: 45, backgroundColor: CARD2, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  avatarText: { color: "#fff", fontFamily: "Poppins_700Bold", fontSize: 32 },
  shopName: { color: "#fff", fontFamily: "Poppins_700Bold", fontSize: 20, marginBottom: 4 },
  shopRole: { color: "rgba(255,255,255,0.5)", fontFamily: "Poppins_400Regular", fontSize: 13 },
  primaryRow: { flexDirection: "row", gap: 10, paddingHorizontal: 16, marginBottom: 10 },
  primaryCard: {
    flex: 1, borderRadius: 16, padding: 16, gap: 12,
    alignItems: "flex-start", justifyContent: "space-between",
    minHeight: 100,
  },
  primaryIconWrap: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.18)", alignItems: "center", justifyContent: "center",
  },
  primaryLabel: { color: "#fff", fontFamily: "Poppins_700Bold", fontSize: 13, lineHeight: 18 },

  secondaryRow: {
    flexDirection: "row", alignItems: "center",
    marginHorizontal: 16, marginBottom: 10,
    backgroundColor: CARD2, borderRadius: 14,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.07)",
    overflow: "hidden",
  },
  secondaryBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 13 },
  secondaryBtnText: { color: "#A0AEC0", fontFamily: "Poppins_600SemiBold", fontSize: 13 },
  secondaryDivider: { width: 1, height: 24, backgroundColor: "rgba(255,255,255,0.08)" },

  modesSection: { paddingHorizontal: 16, marginBottom: 10, gap: 8 },
  modesSectionTitle: { fontFamily: "Poppins_600SemiBold", fontSize: 12, color: "rgba(255,255,255,0.4)", letterSpacing: 0.5, textTransform: "uppercase" },
  pillsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  modePill: {
    flexDirection: "row", alignItems: "center", gap: 6,
    borderWidth: 1.5, borderRadius: 22,
    paddingHorizontal: 12, paddingVertical: 8,
  },
  modePillText: { fontFamily: "Poppins_600SemiBold", fontSize: 13 },
  ordersRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginHorizontal: 16, marginBottom: 24, backgroundColor: CARD2, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14 },
  ordersLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  ordersText: { color: "#fff", fontFamily: "Poppins_600SemiBold", fontSize: 14 },
  ordersRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  ordersBadge: { backgroundColor: "#E53935", borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  ordersBadgeText: { color: "#fff", fontFamily: "Poppins_700Bold", fontSize: 12 },
  sectionTitle: { color: "#fff", fontFamily: "Poppins_700Bold", fontSize: 16, paddingHorizontal: 16, marginBottom: 12, marginTop: 8 },
  statsCard: { marginHorizontal: 16, marginBottom: 24, backgroundColor: CARD2, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 12, gap: 4 },
  statsRow: { flexDirection: "row" },
  statCell: { flex: 1, paddingVertical: 12, paddingHorizontal: 4 },
  statTop: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  statValue: { color: "#fff", fontFamily: "Poppins_700Bold", fontSize: 18 },
  statLabel: { color: "rgba(255,255,255,0.45)", fontFamily: "Poppins_400Regular", fontSize: 12 },
  mgmtBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, marginHorizontal: 16, marginBottom: 10, borderRadius: 14, paddingVertical: 16, backgroundColor: "rgba(6,182,212,0.12)", borderWidth: 1, borderColor: "rgba(6,182,212,0.3)" },
  mgmtBtnDark: { backgroundColor: CARD2, borderColor: "transparent" },
  mgmtBtnText: { color: "#fff", fontFamily: "Poppins_600SemiBold", fontSize: 14 },
  tabRow: { flexDirection: "row", paddingHorizontal: 16, marginBottom: 12, gap: 24 },
  tabItem: { alignItems: "center", paddingBottom: 8 },
  tabText: { color: "rgba(255,255,255,0.4)", fontFamily: "Poppins_600SemiBold", fontSize: 14 },
  tabTextActive: { color: "#fff" },
  tabLine: { height: 2, width: "100%", backgroundColor: "#06B6D4", borderRadius: 1, marginTop: 4 },
  emptyGrid: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 16, gap: 4 },
  emptyGridItem: { width: "31.5%", aspectRatio: 1, backgroundColor: CARD2, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  wideBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    marginHorizontal: 16, marginBottom: 10, borderRadius: 16,
    paddingHorizontal: 16, paddingVertical: 14,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.1)",
  },
  wideBtnLeft: { flexDirection: "row", alignItems: "center", gap: 14, flex: 1 },
  wideBtnIcon: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  wideBtnTitle: { color: "#fff", fontFamily: "Poppins_700Bold", fontSize: 14 },
  wideBtnSub: { color: "rgba(255,255,255,0.55)", fontFamily: "Poppins_400Regular", fontSize: 11, marginTop: 2 },
});

const odStyles = StyleSheet.create({
  tabRow: { flexDirection: "row", gap: 4, marginBottom: 14, backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 12, padding: 4 },
  tab: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 9, borderRadius: 9 },
  tabActive: { backgroundColor: "#1C2230" },
  tabText: { color: "rgba(255,255,255,0.4)", fontFamily: "Poppins_600SemiBold", fontSize: 13 },
  tabTextActive: { color: "#fff" },
  tabBadge: { backgroundColor: "#E53935", borderRadius: 8, paddingHorizontal: 6, paddingVertical: 1 },
  tabBadgeText: { color: "#fff", fontFamily: "Poppins_700Bold", fontSize: 10 },
  orderCard: { backgroundColor: "#1C2230", borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: "rgba(255,255,255,0.06)" },
  orderCardTop: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 },
  clientAvatar: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  clientInitials: { fontFamily: "Poppins_700Bold", fontSize: 15 },
  orderInfo: { flex: 1 },
  clientName: { color: "#fff", fontFamily: "Poppins_600SemiBold", fontSize: 14 },
  orderItems: { color: "rgba(255,255,255,0.45)", fontFamily: "Poppins_400Regular", fontSize: 11, marginTop: 2 },
  orderPrice: { color: "#FF6B00", fontFamily: "Poppins_700Bold", fontSize: 14 },
  orderActions: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  actionBtn: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 9, borderWidth: 1 },
  actionBtnSecondary: { backgroundColor: "rgba(255,255,255,0.06)", borderColor: "rgba(255,255,255,0.1)" },
  actionBtnSecText: { color: "rgba(255,255,255,0.7)", fontFamily: "Poppins_600SemiBold", fontSize: 12 },
  confirmedBadge: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 6 },
  confirmedText: { color: "#22C55E", fontFamily: "Poppins_600SemiBold", fontSize: 12 },
  emptyState: { alignItems: "center", paddingVertical: 48, gap: 12 },
  emptyStateText: { color: "rgba(255,255,255,0.28)", fontFamily: "Poppins_400Regular", fontSize: 13 },
  trackOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.72)", alignItems: "center", justifyContent: "center", padding: 24 },
  trackBox: { backgroundColor: "#161B22", borderRadius: 20, padding: 20, width: "100%" },
  trackHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 16 },
  trackTitle: { flex: 1, color: "#fff", fontFamily: "Poppins_700Bold", fontSize: 15 },
  trackMap: { height: 160, backgroundColor: "#0D1117", borderRadius: 14, alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 14 },
  trackMapText: { color: "rgba(255,255,255,0.38)", fontFamily: "Poppins_400Regular", fontSize: 12 },
  trackPulse: { width: 16, height: 16, borderRadius: 8, backgroundColor: "rgba(59,130,246,0.35)" },
  trackStatus: { color: "#22C55E", fontFamily: "Poppins_600SemiBold", fontSize: 13, textAlign: "center" },
});

const dlStyles = StyleSheet.create({
  card: { backgroundColor: "#1C2230", borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: "rgba(255,255,255,0.06)", gap: 10 },
  cardTop: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  avatar: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  avatarText: { fontFamily: "Poppins_700Bold", fontSize: 17 },
  livreurInfo: { flex: 1, gap: 3 },
  livreurName: { color: "#fff", fontFamily: "Poppins_700Bold", fontSize: 14 },
  starsRow: { flexDirection: "row", alignItems: "center", gap: 2 },
  starsText: { color: "#F59E0B", fontFamily: "Poppins_600SemiBold", fontSize: 11, marginLeft: 4 },
  companyRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  companyText: { color: "rgba(255,255,255,0.38)", fontFamily: "Poppins_400Regular", fontSize: 11 },
  vehicleTag: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 9 },
  vehicleText: { fontFamily: "Poppins_600SemiBold", fontSize: 11 },
  articleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  articleText: { flex: 1, color: "rgba(255,255,255,0.55)", fontFamily: "Poppins_400Regular", fontSize: 12 },
  articlePrice: { color: "#FF6B00", fontFamily: "Poppins_700Bold", fontSize: 13 },
  codeRow: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#0D1117", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: "rgba(245,158,11,0.22)" },
  codeInput: { flex: 1, color: "#fff", fontFamily: "Poppins_400Regular", fontSize: 13 },
  codeUsed: { flexDirection: "row", alignItems: "center", gap: 6 },
  codeUsedText: { color: "rgba(255,255,255,0.45)", fontFamily: "Poppins_400Regular", fontSize: 12 },
});

const landStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0D1117" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  headerTitle: { color: "#fff", fontFamily: "Poppins_700Bold", fontSize: 17 },
  hero: { alignItems: "center", paddingHorizontal: 24, paddingTop: 24, paddingBottom: 32, backgroundColor: "#161B22", marginHorizontal: 16, marginBottom: 24, borderRadius: 20 },
  heroIconCircle: { width: 88, height: 88, borderRadius: 44, backgroundColor: "rgba(255,107,0,0.12)", alignItems: "center", justifyContent: "center", marginBottom: 16 },
  heroTitle: { color: "#fff", fontFamily: "Poppins_700Bold", fontSize: 22, textAlign: "center", marginBottom: 8 },
  heroSub: { color: "rgba(255,255,255,0.6)", fontFamily: "Poppins_400Regular", fontSize: 13, textAlign: "center", lineHeight: 20, marginBottom: 24 },
  heroStats: { flexDirection: "row", alignItems: "center", width: "100%" },
  heroStat: { flex: 1, alignItems: "center", paddingHorizontal: 4 },
  heroStatNum: { color: "#FF6B00", fontFamily: "Poppins_700Bold", fontSize: 18, textAlign: "center" },
  heroStatLabel: { color: "rgba(255,255,255,0.5)", fontFamily: "Poppins_400Regular", fontSize: 11, textAlign: "center" },
  heroStatDivider: { width: 1, height: 36, backgroundColor: "rgba(255,255,255,0.1)" },
  sectionTitle: { color: "#fff", fontFamily: "Poppins_700Bold", fontSize: 16, paddingHorizontal: 16, marginBottom: 12 },
  benefitCard: { flexDirection: "row", alignItems: "flex-start", gap: 14, marginHorizontal: 16, marginBottom: 12, backgroundColor: "#161B22", borderRadius: 14, padding: 16 },
  benefitIcon: { width: 48, height: 48, borderRadius: 12, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  benefitText: { flex: 1 },
  benefitTitle: { color: "#fff", fontFamily: "Poppins_600SemiBold", fontSize: 14, marginBottom: 4 },
  benefitDesc: { color: "rgba(255,255,255,0.55)", fontFamily: "Poppins_400Regular", fontSize: 12, lineHeight: 18 },
  stepRow: { flexDirection: "row", paddingHorizontal: 16, marginBottom: 0 },
  stepNumCol: { alignItems: "center", marginRight: 14 },
  stepCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#1C2230", alignItems: "center", justifyContent: "center" },
  stepNum: { color: "#fff", fontFamily: "Poppins_700Bold", fontSize: 13 },
  stepLine: { width: 2, flex: 1, minHeight: 20, backgroundColor: "rgba(255,255,255,0.08)", marginVertical: 4 },
  stepContent: { flex: 1, paddingBottom: 24 },
  stepTitle: { color: "#fff", fontFamily: "Poppins_600SemiBold", fontSize: 14, marginBottom: 4 },
  stepDesc: { color: "rgba(255,255,255,0.5)", fontFamily: "Poppins_400Regular", fontSize: 12, lineHeight: 18 },
  ctaBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, marginHorizontal: 16, borderRadius: 14, paddingVertical: 18, backgroundColor: "#FF6B00", marginBottom: 12, marginTop: 8 },
  ctaBtnText: { color: "#fff", fontFamily: "Poppins_700Bold", fontSize: 15 },
  ctaNote: { color: "rgba(255,255,255,0.35)", fontFamily: "Poppins_400Regular", fontSize: 11, textAlign: "center", marginBottom: 8 },
});

const formStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)" },
  sheet: {
    backgroundColor: "#161B22",
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingTop: 12, paddingHorizontal: 20,
    maxHeight: "90%",
  },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.15)", alignSelf: "center", marginBottom: 16 },
  sheetHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 20 },
  sheetTitle: { color: "#fff", fontFamily: "Poppins_700Bold", fontSize: 18 },
  fieldGroup: { marginBottom: 16 },
  label: { color: "rgba(255,255,255,0.8)", fontFamily: "Poppins_600SemiBold", fontSize: 13, marginBottom: 8 },
  required: { color: "#FF6B00" },
  optional: { color: "rgba(255,255,255,0.35)", fontFamily: "Poppins_400Regular", fontSize: 11 },
  input: {
    backgroundColor: "#1C2230",
    borderRadius: 12, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 16, paddingVertical: 14,
    color: "#fff", fontFamily: "Poppins_400Regular", fontSize: 14,
  },
  textArea: { height: 100, paddingTop: 14 },
  errorBox: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "rgba(239,68,68,0.1)", borderRadius: 10, padding: 12, marginBottom: 12 },
  errorText: { color: "#EF4444", fontFamily: "Poppins_400Regular", fontSize: 13, flex: 1 },
  submitBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, backgroundColor: "#FF6B00", borderRadius: 14, paddingVertical: 17, marginTop: 4, marginBottom: 12 },
  submitText: { color: "#fff", fontFamily: "Poppins_700Bold", fontSize: 15 },
  formNote: { color: "rgba(255,255,255,0.35)", fontFamily: "Poppins_400Regular", fontSize: 11, textAlign: "center", marginBottom: 8 },
});
