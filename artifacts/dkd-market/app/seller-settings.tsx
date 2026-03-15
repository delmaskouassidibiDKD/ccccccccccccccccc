import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  Switch,
  Alert,
  Modal,
  Animated,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { fs, ms } from "@/lib/responsive";

const SELLER_SHOP_TYPES_KEY = "@dkd:seller_shop_types";

const BG = "#0D1117";
const CARD = "#161B25";
const CARD2 = "#1C2230";
const BORDER = "rgba(255,255,255,0.08)";
const ORANGE = "#FF6B00";
const TEXT = "#FFFFFF";
const TEXT_MUTED = "rgba(255,255,255,0.45)";
const TEXT_SUB = "rgba(255,255,255,0.7)";

const SHOP_TYPES = [
  { id: "marche", label: "Marché", icon: "basket-outline", color: "#22C55E", desc: "Vendez des produits locaux, fruits, légumes et articles ménagers du marché traditionnel." },
  { id: "grossiste", label: "Grossiste", icon: "cube-outline", color: "#3B82F6", desc: "Proposez vos articles en grande quantité avec des tarifs dégressifs pour les revendeurs." },
  { id: "supermarche", label: "Super Marché", icon: "storefront-outline", color: "#8B5CF6", desc: "Tous types de produits en libre-service, épicerie complète et grande distribution." },
  { id: "importe", label: "Importés", icon: "airplane-outline", color: "#F59E0B", desc: "Articles importés de l'étranger, produits internationaux disponibles en Afrique." },
  { id: "mon_plat", label: "Gastronomie", icon: "restaurant-outline", color: "#EC4899", desc: "Proposez vos plats cuisinés, restauration et livraison de repas à domicile." },
  { id: "personnalisation", label: "Personnalisation", icon: "color-palette-outline", color: "#06B6D4", desc: "Proposez vos créations personnalisées, services sur-mesure et articles artisanaux." },
];

const TOGGLE_W = 70;
const TOGGLE_H = 36;
const THUMB_SIZE = 28;

function AnimatedToggle({ value, onToggle, color }: { value: boolean; onToggle: () => void; color: string }) {
  const anim = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(anim, {
      toValue: value ? 1 : 0,
      useNativeDriver: false,
      tension: 80,
      friction: 8,
    }).start();
  }, [value]);

  const translateX = anim.interpolate({ inputRange: [0, 1], outputRange: [4, TOGGLE_W - THUMB_SIZE - 4] });
  const bgColor = anim.interpolate({ inputRange: [0, 1], outputRange: ["#2a2f3a", color] });

  return (
    <TouchableOpacity onPress={onToggle} activeOpacity={0.85}>
      <Animated.View style={{ width: TOGGLE_W, height: TOGGLE_H, borderRadius: TOGGLE_H / 2, backgroundColor: bgColor, justifyContent: "center" }}>
        <Animated.View style={{
          width: THUMB_SIZE, height: THUMB_SIZE, borderRadius: THUMB_SIZE / 2,
          backgroundColor: "#fff", transform: [{ translateX }],
          shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 3, elevation: 4,
        }} />
      </Animated.View>
    </TouchableOpacity>
  );
}

const PAYMENT_METHODS = [
  { id: "wave", label: "Wave", icon: "wifi-outline", color: "#00C9FF" },
  { id: "orange_money", label: "Orange Money", icon: "phone-portrait-outline", color: "#FF6B00" },
  { id: "mtn", label: "MTN Mobile Money", icon: "phone-portrait-outline", color: "#FFCC00" },
  { id: "moov", label: "Moov Money", icon: "phone-portrait-outline", color: "#0082C8" },
  { id: "bank", label: "Virement bancaire", icon: "card-outline", color: "#22C55E" },
  { id: "cash", label: "Paiement à la livraison", icon: "cash-outline", color: "#8B5CF6" },
];

const BOOST_PACKS = [
  {
    id: "featured",
    icon: "flame-outline",
    color: "#FF6B00",
    title: "Produit en vedette",
    desc: "Votre produit apparaît en tête de liste pendant 24h",
    price: "2 500 FCFA",
    tag: "Populaire",
    tagColor: "#FF6B00",
  },
  {
    id: "visibility",
    icon: "trending-up-outline",
    color: "#3B82F6",
    title: "Pack Visibilité 3 jours",
    desc: "Bannière promotionnelle sur l'accueil + notifications push",
    price: "7 500 FCFA",
    tag: "Recommandé",
    tagColor: "#3B82F6",
  },
  {
    id: "premium",
    icon: "star-outline",
    color: "#F59E0B",
    title: "Premium Vendeur",
    desc: "Badge vérifié + priorité dans les résultats de recherche",
    price: "15 000 FCFA / mois",
    tag: "Pro",
    tagColor: "#F59E0B",
  },
  {
    id: "gold",
    icon: "trophy-outline",
    color: "#EC4899",
    title: "Boutique Or",
    desc: "Top des ventes + accès statistiques avancées + support dédié",
    price: "35 000 FCFA / mois",
    tag: "Exclusif",
    tagColor: "#EC4899",
  },
];

const DELIVERY_OPTIONS = ["Même jour", "24h", "2-3 jours", "1 semaine", "À négocier"];
const RETURN_POLICIES = ["Pas de retour", "7 jours", "14 jours", "30 jours"];

function SectionHeader({ title, icon }: { title: string; icon: string }) {
  const { isDark } = useTheme();
  const dynText = isDark ? TEXT : "#111827";
  return (
    <View style={s.sectionHeader}>
      <Ionicons name={icon as any} size={16} color={ORANGE} />
      <Text style={[s.sectionTitle, { color: dynText }]}>{title}</Text>
    </View>
  );
}

function FieldRow({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  multiline,
  icon,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  keyboardType?: any;
  multiline?: boolean;
  icon?: string;
}) {
  const { isDark } = useTheme();
  const dynCARD2 = isDark ? CARD2 : "#F3F4F6";
  const dynText  = isDark ? TEXT : "#111827";
  const dynMuted = isDark ? TEXT_MUTED : "#9CA3AF";
  const dynBorder = isDark ? BORDER : "rgba(0,0,0,0.07)";
  return (
    <View style={s.fieldRow}>
      <Text style={[s.fieldLabel, { color: dynMuted }]}>{label}</Text>
      <View style={[s.fieldInputWrap, { backgroundColor: dynCARD2, borderColor: dynBorder }, multiline && { height: 80, alignItems: "flex-start" }]}>
        {icon && (
          <Ionicons name={icon as any} size={18} color={dynMuted} style={{ marginRight: 8 }} />
        )}
        <TextInput
          style={[s.fieldInput, { color: dynText }, multiline && { flex: 1, textAlignVertical: "top", paddingTop: 4 }]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder || label}
          placeholderTextColor={dynMuted}
          keyboardType={keyboardType || "default"}
          multiline={multiline}
          numberOfLines={multiline ? 3 : 1}
        />
      </View>
    </View>
  );
}

export default function SellerSettingsScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const topPad = Platform.OS === "web" ? 0 : insets.top;
  const dynBG = isDark ? BG : "#F0F4F8";
  const dynCARD = isDark ? "#161B25" : "#FFFFFF";
  const dynText = isDark ? TEXT : "#111827";
  const dynSub = isDark ? TEXT_SUB : "#374151";
  const dynMuted = isDark ? TEXT_MUTED : "#9CA3AF";
  const dynBorder = isDark ? BORDER : "rgba(0,0,0,0.07)";

  const [shopName, setShopName] = useState((user as any)?.shop_name || user?.full_name || "Ma Boutique");
  const [description, setDescription] = useState("");
  const [phone, setPhone] = useState(user?.phone_number || "");
  const [whatsapp, setWhatsapp] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("Côte d'Ivoire");

  const [shopTypes, setShopTypes] = useState<string[]>([]);
  const [selectedTypeId, setSelectedTypeId] = useState<string | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(SELLER_SHOP_TYPES_KEY).then((v) => {
      if (v) setShopTypes(JSON.parse(v));
    }).catch(() => {});
  }, []);

  const toggleShopType = (id: string) => {
    setShopTypes((prev) => {
      const next = prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id];
      AsyncStorage.setItem(SELLER_SHOP_TYPES_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  };

  const [payments, setPayments] = useState<Record<string, boolean>>({
    wave: true,
    orange_money: true,
    mtn: false,
    moov: false,
    bank: false,
    cash: true,
  });

  const [delivery, setDelivery] = useState("2-3 jours");
  const [returnPolicy, setReturnPolicy] = useState("7 jours");
  const [shopActive, setShopActive] = useState(true);
  const [showBadge, setShowBadge] = useState(true);

  const togglePayment = (id: string) => {
    setPayments((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSave = () => {
    Alert.alert("Paramètres sauvegardés", "Vos modifications ont bien été enregistrées.", [{ text: "OK" }]);
  };

  return (
    <View style={[s.container, { paddingTop: topPad, backgroundColor: dynBG }]}>
      <View style={[s.header, { backgroundColor: isDark ? "#111827" : "#1a1f2e" }]}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Paramètres boutique</Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── PREMIÈRE SECTION : Mode sombre / clair ── */}
        <View style={[s.card, { backgroundColor: dynCARD, borderColor: dynBorder, marginTop: 16 }]}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 14 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: isDark ? "#1C2230" : "#FEF3C7", alignItems: "center", justifyContent: "center" }}>
                <Ionicons name={isDark ? "moon" : "sunny"} size={19} color={isDark ? "#F59E0B" : "#D97706"} />
              </View>
              <View>
                <Text style={[s.sectionTitle, { color: dynText, fontSize: 14, marginBottom: 2 }]}>Mode d'affichage</Text>
                <Text style={{ fontFamily: "Poppins_400Regular", fontSize: 12, color: dynMuted }}>
                  {isDark ? "Mode sombre actif" : "Mode clair actif"}
                </Text>
              </View>
            </View>
            <AnimatedToggle value={isDark} onToggle={toggleTheme} color="#F59E0B" />
          </View>
        </View>

        {/* Avatar / Logo */}
        <View style={s.avatarSection}>
          <View style={s.avatarWrap}>
            <View style={[s.avatar, { backgroundColor: isDark ? CARD2 : "#E5E7EB" }]}>
              <Text style={[s.avatarInitials, { color: isDark ? "#fff" : "#111827" }]}>
                {shopName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)}
              </Text>
            </View>
            <TouchableOpacity style={s.avatarEditBtn}>
              <Ionicons name="camera" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
          <Text style={[s.avatarHint, { color: dynMuted }]}>Touchez pour changer le logo</Text>

          <TouchableOpacity style={[s.bannerBtn, { borderColor: dynBorder }]}>
            <Ionicons name="image-outline" size={18} color={dynSub} />
            <Text style={[s.bannerBtnText, { color: dynSub }]}>Modifier la bannière</Text>
          </TouchableOpacity>
        </View>

        {/* Profil boutique */}
        <View style={[s.card, { backgroundColor: dynCARD, borderColor: dynBorder }]}>
          <SectionHeader title="Profil de la boutique" icon="storefront-outline" />
          <FieldRow label="Nom de la boutique" value={shopName} onChangeText={setShopName} icon="storefront-outline" />
          <FieldRow label="Description" value={description} onChangeText={setDescription} placeholder="Décrivez votre boutique…" multiline icon="document-text-outline" />
        </View>

        {/* Contact & Localisation */}
        <View style={[s.card, { backgroundColor: dynCARD, borderColor: dynBorder }]}>
          <SectionHeader title="Contact & Localisation" icon="location-outline" />
          <FieldRow label="Téléphone boutique" value={phone} onChangeText={setPhone} keyboardType="phone-pad" icon="call-outline" placeholder="+225 07 00 00 00 00" />
          <FieldRow label="WhatsApp" value={whatsapp} onChangeText={setWhatsapp} keyboardType="phone-pad" icon="logo-whatsapp" placeholder="+225 07 00 00 00 00" />
          <FieldRow label="Adresse" value={address} onChangeText={setAddress} icon="map-outline" placeholder="Rue, quartier, commune…" />
          <FieldRow label="Ville" value={city} onChangeText={setCity} icon="business-outline" placeholder="Abidjan, Dakar, Cotonou…" />
          <FieldRow label="Pays" value={country} onChangeText={setCountry} icon="flag-outline" />
        </View>

        {/* Type de boutique */}
        <View style={[s.card, { backgroundColor: dynCARD, borderColor: dynBorder }]}>
          <SectionHeader title="Type de boutique" icon="pricetag-outline" />
          <Text style={[s.shopTypeHint, { color: dynMuted }]}>Sélectionnez le(s) type(s) qui décrivent le mieux votre boutique</Text>
          <View style={s.shopTypeGrid}>
            {SHOP_TYPES.map((t) => {
              const active = shopTypes.includes(t.id);
              return (
                <TouchableOpacity
                  key={t.id}
                  style={[
                    s.shopTypeBtn,
                    { borderColor: active ? t.color : dynBorder, backgroundColor: active ? t.color + "18" : (isDark ? CARD2 : "#F3F4F6") },
                  ]}
                  onPress={() => {
                    if (t.id === "importe") {
                      router.push("/importer-registration" as any);
                    } else if (t.id === "grossiste") {
                      router.push("/wholesaler-registration" as any);
                    } else {
                      setSelectedTypeId(t.id);
                    }
                  }}
                  activeOpacity={0.75}
                >
                  <View style={[s.shopTypeIcon, { backgroundColor: active ? t.color + "30" : (isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)") }]}>
                    <Ionicons name={t.icon as any} size={22} color={active ? t.color : dynMuted} />
                  </View>
                  <Text style={[s.shopTypeLabel, { color: active ? t.color : dynSub, fontFamily: active ? "Poppins_700Bold" : "Poppins_500Medium" }]}>
                    {t.label}
                  </Text>
                  {active && (
                    <View style={[s.shopTypeCheck, { backgroundColor: t.color }]}>
                      <Ionicons name="checkmark" size={10} color="#fff" />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Moyens de paiement */}
        <View style={[s.card, { backgroundColor: dynCARD, borderColor: dynBorder }]}>
          <SectionHeader title="Moyens de paiement acceptés" icon="card-outline" />
          {PAYMENT_METHODS.map((pm) => (
            <View key={pm.id} style={[s.payRow, { borderBottomColor: dynBorder }]}>
              <View style={[s.payIcon, { backgroundColor: pm.color + "20" }]}>
                <Ionicons name={pm.icon as any} size={20} color={pm.color} />
              </View>
              <Text style={[s.payLabel, { color: dynText }]}>{pm.label}</Text>
              <Switch
                value={!!payments[pm.id]}
                onValueChange={() => togglePayment(pm.id)}
                trackColor={{ false: isDark ? CARD2 : "#D1D5DB", true: ORANGE + "60" }}
                thumbColor={payments[pm.id] ? ORANGE : (isDark ? "#555" : "#9CA3AF")}
              />
            </View>
          ))}
        </View>

        {/* Booster mes ventes */}
        <View style={[s.card, { backgroundColor: dynCARD, borderColor: dynBorder }]}>
          <SectionHeader title="Booster mes ventes" icon="rocket-outline" />
          <Text style={[s.boostSubtitle, { color: dynMuted }]}>Augmentez votre visibilité et vendez plus vite</Text>
          {BOOST_PACKS.map((pack) => (
            <TouchableOpacity key={pack.id} style={[s.boostCard, { backgroundColor: isDark ? CARD2 : "#F3F4F6", borderColor: dynBorder }]} activeOpacity={0.8}>
              <View style={[s.boostIconWrap, { backgroundColor: pack.color + "18" }]}>
                <Ionicons name={pack.icon as any} size={26} color={pack.color} />
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <View style={s.boostTitleRow}>
                  <Text style={[s.boostTitle, { color: dynText }]}>{pack.title}</Text>
                  <View style={[s.boostTag, { backgroundColor: pack.tagColor + "22", borderColor: pack.tagColor + "50" }]}>
                    <Text style={[s.boostTagText, { color: pack.tagColor }]}>{pack.tag}</Text>
                  </View>
                </View>
                <Text style={[s.boostDesc, { color: dynMuted }]}>{pack.desc}</Text>
                <Text style={[s.boostPrice, { color: pack.color }]}>{pack.price}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={dynMuted} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Paramètres avancés */}
        <View style={[s.card, { backgroundColor: dynCARD, borderColor: dynBorder }]}>
          <SectionHeader title="Paramètres avancés" icon="settings-outline" />

          <View style={s.settingRow}>
            <View style={s.settingLeft}>
              <Ionicons name="time-outline" size={20} color="#06B6D4" />
              <Text style={[s.settingLabel, { color: dynText }]}>Délai de livraison</Text>
            </View>
            <View style={s.chipRow}>
              {DELIVERY_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={[s.chip, { backgroundColor: isDark ? CARD2 : "#F3F4F6", borderColor: dynBorder }, delivery === opt && s.chipActive]}
                  onPress={() => setDelivery(opt)}
                >
                  <Text style={[s.chipText, { color: dynMuted }, delivery === opt && s.chipTextActive]}>{opt}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={s.settingRow}>
            <View style={s.settingLeft}>
              <Ionicons name="return-up-back-outline" size={20} color="#8B5CF6" />
              <Text style={[s.settingLabel, { color: dynText }]}>Politique de retour</Text>
            </View>
            <View style={s.chipRow}>
              {RETURN_POLICIES.map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={[s.chip, { backgroundColor: isDark ? CARD2 : "#F3F4F6", borderColor: dynBorder }, returnPolicy === opt && s.chipActive]}
                  onPress={() => setReturnPolicy(opt)}
                >
                  <Text style={[s.chipText, { color: dynMuted }, returnPolicy === opt && s.chipTextActive]}>{opt}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={[s.toggleRow, { borderTopColor: dynBorder }]}>
            <View style={s.settingLeft}>
              <Ionicons name="storefront-outline" size={20} color="#22C55E" />
              <View>
                <Text style={[s.settingLabel, { color: dynText }]}>Boutique active</Text>
                <Text style={[s.settingHint, { color: dynMuted }]}>Les clients peuvent voir et commander</Text>
              </View>
            </View>
            <Switch
              value={shopActive}
              onValueChange={setShopActive}
              trackColor={{ false: isDark ? CARD2 : "#D1D5DB", true: "#22C55E60" }}
              thumbColor={shopActive ? "#22C55E" : (isDark ? "#555" : "#9CA3AF")}
            />
          </View>

          <View style={[s.toggleRow, { borderTopColor: dynBorder }]}>
            <View style={s.settingLeft}>
              <Ionicons name="shield-checkmark-outline" size={20} color="#F59E0B" />
              <View>
                <Text style={[s.settingLabel, { color: dynText }]}>Badge vendeur affiché</Text>
                <Text style={[s.settingHint, { color: dynMuted }]}>Affiche votre badge vérifié sur le profil</Text>
              </View>
            </View>
            <Switch
              value={showBadge}
              onValueChange={setShowBadge}
              trackColor={{ false: isDark ? CARD2 : "#D1D5DB", true: "#F59E0B60" }}
              thumbColor={showBadge ? "#F59E0B" : (isDark ? "#555" : "#9CA3AF")}
            />
          </View>
        </View>

        {/* Zone danger */}
        <View style={[s.card, s.dangerCard, { backgroundColor: dynCARD }]}>
          <SectionHeader title="Zone sensible" icon="warning-outline" />
          <TouchableOpacity style={s.dangerBtn}>
            <Ionicons name="pause-circle-outline" size={20} color="#F59E0B" />
            <Text style={[s.dangerBtnText, { color: "#F59E0B" }]}>Mettre la boutique en pause</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.dangerBtn}>
            <Ionicons name="close-circle-outline" size={20} color="#E53935" />
            <Text style={[s.dangerBtnText, { color: "#E53935" }]}>Désactiver la boutique</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={s.bigSaveBtn} onPress={handleSave} activeOpacity={0.85}>
          <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
          <Text style={s.bigSaveBtnText}>Enregistrer les modifications</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Type activation modal */}
      {selectedTypeId && (() => {
        const type = SHOP_TYPES.find((t) => t.id === selectedTypeId)!;
        const isActive = shopTypes.includes(selectedTypeId);
        return (
          <Modal visible transparent animationType="fade" onRequestClose={() => setSelectedTypeId(null)}>
            <TouchableOpacity style={s.typeOverlay} activeOpacity={1} onPress={() => setSelectedTypeId(null)}>
              <TouchableOpacity activeOpacity={1} onPress={() => {}}>
                <View style={s.typeSheet}>
                  <View style={s.typeSheetHandle} />

                  <View style={[s.typeIconWrap, { backgroundColor: type.color + "22" }]}>
                    <Ionicons name={type.icon as any} size={44} color={type.color} />
                  </View>

                  <Text style={[s.typeModalTitle, { color: type.color }]}>{type.label}</Text>
                  <Text style={s.typeModalDesc}>{type.desc}</Text>

                  <View style={s.typeToggleRow}>
                    <View style={{ flex: 1, gap: 3 }}>
                      <Text style={s.typeToggleLabel}>
                        {isActive ? "✓ Activé" : "Désactivé"}
                      </Text>
                      <Text style={s.typeToggleHint}>
                        {isActive
                          ? "Ce mode apparaît dans votre tableau de bord"
                          : "Activez pour ajouter ce mode à votre boutique"}
                      </Text>
                    </View>
                    <AnimatedToggle
                      value={isActive}
                      onToggle={() => toggleShopType(selectedTypeId)}
                      color={type.color}
                    />
                  </View>

                  <TouchableOpacity
                    style={[s.typeCloseBtn, { backgroundColor: isActive ? type.color : CARD2 }]}
                    onPress={() => setSelectedTypeId(null)}
                    activeOpacity={0.85}
                  >
                    <Text style={s.typeCloseBtnText}>
                      {isActive ? "C'est activé ✓" : "Fermer"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            </TouchableOpacity>
          </Modal>
        );
      })()}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  backBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  headerTitle: { color: TEXT, fontFamily: "Poppins_700Bold", fontSize: fs(16) },
  saveBtn: {
    backgroundColor: ORANGE,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  saveBtnText: { color: "#fff", fontFamily: "Poppins_700Bold", fontSize: fs(12) },

  avatarSection: {
    alignItems: "center",
    paddingVertical: 24,
    gap: 8,
  },
  avatarWrap: { position: "relative" },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: CARD2,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: ORANGE,
  },
  avatarInitials: { color: "#fff", fontFamily: "Poppins_700Bold", fontSize: fs(32) },
  avatarEditBtn: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: ORANGE,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: BG,
  },
  avatarHint: { color: TEXT_MUTED, fontFamily: "Poppins_400Regular", fontSize: fs(12) },
  bannerBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  bannerBtnText: { color: TEXT_SUB, fontFamily: "Poppins_600SemiBold", fontSize: fs(13) },

  card: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: CARD,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: BORDER,
  },
  dangerCard: { borderColor: "rgba(229,57,53,0.2)" },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
  },
  sectionTitle: { color: TEXT, fontFamily: "Poppins_700Bold", fontSize: fs(14) },

  fieldRow: { marginBottom: 12 },
  fieldLabel: { color: TEXT_MUTED, fontFamily: "Poppins_600SemiBold", fontSize: fs(11), marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 },
  fieldInputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: CARD2,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: BORDER,
  },
  fieldInput: { flex: 1, color: TEXT, fontFamily: "Poppins_500Medium", fontSize: fs(14) },

  payRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  payIcon: { width: 38, height: 38, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  payLabel: { flex: 1, color: TEXT, fontFamily: "Poppins_500Medium", fontSize: fs(14) },

  boostSubtitle: { color: TEXT_MUTED, fontFamily: "Poppins_400Regular", fontSize: fs(12), marginBottom: 12, marginTop: -6 },
  boostCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: CARD2,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: BORDER,
  },
  boostIconWrap: { width: 50, height: 50, borderRadius: 14, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  boostTitleRow: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  boostTitle: { color: TEXT, fontFamily: "Poppins_700Bold", fontSize: fs(13) },
  boostTag: {
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
  },
  boostTagText: { fontFamily: "Poppins_700Bold", fontSize: fs(9) },
  boostDesc: { color: TEXT_MUTED, fontFamily: "Poppins_400Regular", fontSize: fs(11), lineHeight: fs(16) },
  boostPrice: { fontFamily: "Poppins_700Bold", fontSize: fs(13), marginTop: 2 },

  settingRow: { marginBottom: 16 },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: BORDER,
  },
  settingLeft: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  settingLabel: { color: TEXT, fontFamily: "Poppins_600SemiBold", fontSize: fs(13) },
  settingHint: { color: TEXT_MUTED, fontFamily: "Poppins_400Regular", fontSize: fs(11) },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8, marginLeft: 30 },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: CARD2,
    borderWidth: 1,
    borderColor: BORDER,
  },
  chipActive: { backgroundColor: ORANGE + "20", borderColor: ORANGE },
  chipText: { color: TEXT_MUTED, fontFamily: "Poppins_600SemiBold", fontSize: fs(11) },
  chipTextActive: { color: ORANGE },

  shopTypeHint: {
    color: TEXT_MUTED,
    fontFamily: "Poppins_400Regular",
    fontSize: fs(12),
    marginBottom: 14,
    marginTop: -6,
  },
  shopTypeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  shopTypeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    position: "relative",
    minWidth: "45%",
    flex: 1,
  },
  shopTypeIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  shopTypeLabel: {
    fontSize: fs(13),
    flex: 1,
  },
  shopTypeCheck: {
    position: "absolute",
    top: -6,
    right: -6,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: BG,
  },

  dangerBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  dangerBtnText: { fontFamily: "Poppins_600SemiBold", fontSize: fs(14) },

  bigSaveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: ORANGE,
    marginHorizontal: 16,
    borderRadius: 14,
    paddingVertical: ms(14),
    marginBottom: 8,
  },
  bigSaveBtnText: { color: "#fff", fontFamily: "Poppins_700Bold", fontSize: fs(15) },

  typeOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.72)",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  typeSheet: {
    width: 340,
    backgroundColor: CARD,
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    gap: 12,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: BORDER,
  },
  typeSheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.15)",
    marginBottom: 4,
  },
  typeIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  typeModalTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: fs(22),
    textAlign: "center",
  },
  typeModalDesc: {
    fontFamily: "Poppins_400Regular",
    fontSize: fs(13),
    color: TEXT_MUTED,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 4,
  },
  typeToggleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    backgroundColor: CARD2,
    borderRadius: 16,
    padding: 16,
    width: "100%",
  },
  typeToggleLabel: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: fs(15),
    color: TEXT,
  },
  typeToggleHint: {
    fontFamily: "Poppins_400Regular",
    fontSize: fs(12),
    color: TEXT_MUTED,
  },
  typeCloseBtn: {
    width: "100%",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 4,
  },
  typeCloseBtnText: {
    fontFamily: "Poppins_700Bold",
    fontSize: fs(15),
    color: "#fff",
  },
});
