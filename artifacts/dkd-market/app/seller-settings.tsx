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
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { fs, ms } from "@/lib/responsive";

const SELLER_SHOP_TYPES_KEY   = "@dkd:seller_shop_types";
const PROFILE_PHOTO_KEY       = "@dkd:seller_profile_photo";

const BG         = "#0D1117";
const CARD       = "#161B25";
const CARD2      = "#1C2230";
const BORDER     = "rgba(255,255,255,0.08)";
const ORANGE     = "#FF6B00";
const TEXT       = "#FFFFFF";
const TEXT_MUTED = "rgba(255,255,255,0.45)";
const TEXT_SUB   = "rgba(255,255,255,0.7)";

const SHOP_TYPES = [
  { id: "marche",          label: "Marché",          icon: "basket-outline",      color: "#22C55E", desc: "Vendez des produits locaux, fruits, légumes et articles ménagers du marché traditionnel." },
  { id: "grossiste",       label: "Grossiste",        icon: "cube-outline",        color: "#3B82F6", desc: "Proposez vos articles en grande quantité avec des tarifs dégressifs pour les revendeurs." },
  { id: "supermarche",     label: "Super Marché",     icon: "storefront-outline",  color: "#8B5CF6", desc: "Tous types de produits en libre-service, épicerie complète et grande distribution." },
  { id: "importe",         label: "Importés",         icon: "airplane-outline",    color: "#F59E0B", desc: "Articles importés de l'étranger, produits internationaux disponibles en Afrique." },
  { id: "mon_plat",        label: "Gastronomie",      icon: "restaurant-outline",  color: "#EC4899", desc: "Proposez vos plats cuisinés, restauration et livraison de repas à domicile." },
  { id: "personnalisation",label: "Personnalisation", icon: "color-palette-outline",color: "#06B6D4",desc: "Proposez vos créations personnalisées, services sur-mesure et articles artisanaux." },
];

const TOGGLE_W   = 70;
const TOGGLE_H   = 36;
const THUMB_SIZE = 28;

function AnimatedToggle({ value, onToggle, color }: { value: boolean; onToggle: () => void; color: string }) {
  const anim = useRef(new Animated.Value(value ? 1 : 0)).current;
  useEffect(() => {
    Animated.spring(anim, { toValue: value ? 1 : 0, useNativeDriver: false, tension: 80, friction: 8 }).start();
  }, [value]);
  const translateX = anim.interpolate({ inputRange: [0, 1], outputRange: [4, TOGGLE_W - THUMB_SIZE - 4] });
  const bgColor    = anim.interpolate({ inputRange: [0, 1], outputRange: ["#2a2f3a", color] });
  return (
    <TouchableOpacity onPress={onToggle} activeOpacity={0.85}>
      <Animated.View style={{ width: TOGGLE_W, height: TOGGLE_H, borderRadius: TOGGLE_H / 2, backgroundColor: bgColor, justifyContent: "center" }}>
        <Animated.View style={{ width: THUMB_SIZE, height: THUMB_SIZE, borderRadius: THUMB_SIZE / 2, backgroundColor: "#fff", transform: [{ translateX }], shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 3, elevation: 4 }} />
      </Animated.View>
    </TouchableOpacity>
  );
}

function SectionHeader({ title, icon }: { title: string; icon: string }) {
  const { isDark } = useTheme();
  return (
    <View style={s.sectionHeader}>
      <Ionicons name={icon as any} size={16} color={ORANGE} />
      <Text style={[s.sectionTitle, { color: isDark ? TEXT : "#111827" }]}>{title}</Text>
    </View>
  );
}

function FieldRow({ label, value, onChangeText, placeholder, keyboardType, multiline, icon }: {
  label: string; value: string; onChangeText: (t: string) => void;
  placeholder?: string; keyboardType?: any; multiline?: boolean; icon?: string;
}) {
  const { isDark } = useTheme();
  const dynCARD2  = isDark ? CARD2 : "#F3F4F6";
  const dynText   = isDark ? TEXT : "#111827";
  const dynMuted  = isDark ? TEXT_MUTED : "#9CA3AF";
  const dynBorder = isDark ? BORDER : "rgba(0,0,0,0.07)";
  return (
    <View style={s.fieldRow}>
      <Text style={[s.fieldLabel, { color: dynMuted }]}>{label}</Text>
      <View style={[s.fieldInputWrap, { backgroundColor: dynCARD2, borderColor: dynBorder }, multiline && { height: 80, alignItems: "flex-start" }]}>
        {icon && <Ionicons name={icon as any} size={18} color={dynMuted} style={{ marginRight: 8 }} />}
        <TextInput
          style={[s.fieldInput, { color: dynText }, multiline && { flex: 1, textAlignVertical: "top", paddingTop: 4 }]}
          value={value} onChangeText={onChangeText}
          placeholder={placeholder || label} placeholderTextColor={dynMuted}
          keyboardType={keyboardType || "default"} multiline={multiline} numberOfLines={multiline ? 3 : 1}
        />
      </View>
    </View>
  );
}

const REGLEMENTS = [
  {
    icon: "bicycle-outline", color: "#3B82F6", title: "Livraison",
    items: [
      "Les délais de livraison varient selon la zone géographique et le vendeur.",
      "Le vendeur doit préciser le délai estimé lors de la publication d'un article.",
      "Toute commande validée engage le vendeur à expédier dans les 24h ouvrées.",
      "En cas de retard, le client doit être informé immédiatement via la messagerie.",
    ],
  },
  {
    icon: "return-up-back-outline", color: "#8B5CF6", title: "Retours & Remboursements",
    items: [
      "Les retours sont acceptés dans les 48h suivant la réception si le produit est défectueux.",
      "Le produit doit être retourné dans son état d'origine, avec l'emballage intact.",
      "Le remboursement est effectué sous 5 jours ouvrés après validation du retour.",
      "Les articles périssables (alimentation, fleurs) ne sont pas éligibles au retour.",
    ],
  },
  {
    icon: "shield-checkmark-outline", color: "#22C55E", title: "Qualité & Conformité",
    items: [
      "Les photos publiées doivent correspondre exactement au produit réel.",
      "Toute tromperie sur la qualité ou l'origine entraîne la suspension du compte.",
      "Les produits importés doivent être conformes aux normes du pays de destination.",
      "DKD Market se réserve le droit de retirer tout article non conforme.",
    ],
  },
  {
    icon: "cash-outline", color: "#F59E0B", title: "Paiements",
    items: [
      "Les paiements sont sécurisés et traités par les partenaires financiers de DKD.",
      "Le vendeur reçoit le paiement après confirmation de la livraison par l'acheteur.",
      "Des frais de service de 5% sont prélevés sur chaque transaction réalisée.",
      "En cas de litige, DKD Market joue le rôle d'arbitre entre acheteur et vendeur.",
    ],
  },
  {
    icon: "people-outline", color: "#EC4899", title: "Comportement & Éthique",
    items: [
      "Tout contenu offensant, trompeur ou illégal est strictement interdit.",
      "Les vendeurs doivent répondre aux messages clients dans les 24h.",
      "La vente de produits contrefaits ou dangereux entraîne un bannissement immédiat.",
      "DKD Market encourage la courtoisie et le professionnalisme dans tous les échanges.",
    ],
  },
];

export default function SellerSettingsScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const topPad    = Platform.OS === "web" ? 0 : insets.top;
  const dynBG     = isDark ? BG : "#F0F4F8";
  const dynCARD   = isDark ? "#161B25" : "#FFFFFF";
  const dynText   = isDark ? TEXT : "#111827";
  const dynSub    = isDark ? TEXT_SUB : "#374151";
  const dynMuted  = isDark ? TEXT_MUTED : "#9CA3AF";
  const dynBorder = isDark ? BORDER : "rgba(0,0,0,0.07)";

  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [shopName,    setShopName]    = useState((user as any)?.shop_name || user?.full_name || "Ma Boutique");
  const [description, setDescription] = useState("");
  const [phone,       setPhone]       = useState(user?.phone_number || "");
  const [whatsapp,    setWhatsapp]    = useState("");
  const [address,     setAddress]     = useState("");
  const [city,        setCity]        = useState("");
  const [country,     setCountry]     = useState("Côte d'Ivoire");
  const [shopTypes,   setShopTypes]   = useState<string[]>([]);
  const [selectedTypeId, setSelectedTypeId] = useState<string | null>(null);
  const [shopActive,  setShopActive]  = useState(true);
  const [showReglements, setShowReglements] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    AsyncStorage.multiGet([PROFILE_PHOTO_KEY, SELLER_SHOP_TYPES_KEY]).then(([photo, types]) => {
      if (photo[1]) setProfilePhoto(photo[1]);
      if (types[1]) setShopTypes(JSON.parse(types[1]));
    }).catch(() => {});
  }, []);

  const toggleShopType = (id: string) => {
    setShopTypes((prev) => {
      const next = prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id];
      AsyncStorage.setItem(SELLER_SHOP_TYPES_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  };

  const pickProfilePhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission requise", "Veuillez autoriser l'accès à votre galerie photo.", [{ text: "OK" }]);
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]?.uri) {
      const uri = result.assets[0].uri;
      setProfilePhoto(uri);
      await AsyncStorage.setItem(PROFILE_PHOTO_KEY, uri);
    }
  };

  const handleDeleteActivities = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    setShowDeleteConfirm(false);
    Alert.alert("Activités supprimées", "Toutes vos activités sur DKD-MARKET ont été supprimées.", [{ text: "OK" }]);
  };

  const initials = shopName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <View style={[s.container, { paddingTop: topPad, backgroundColor: dynBG }]}>

      {/* ── HEADER ── */}
      <View style={[s.header, { backgroundColor: isDark ? "#111827" : "#1a1f2e" }]}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Paramètres boutique</Text>
        <TouchableOpacity style={s.reglementsBtn} onPress={() => setShowReglements(true)} activeOpacity={0.8}>
          <Ionicons name="document-text-outline" size={15} color="#fff" />
          <Text style={s.reglementsBtnText}>Règlements</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Mode d'affichage */}
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

        {/* Avatar / Photo de profil */}
        <View style={s.avatarSection}>
          <TouchableOpacity style={s.avatarWrap} onPress={pickProfilePhoto} activeOpacity={0.85}>
            {profilePhoto ? (
              <Image source={{ uri: profilePhoto }} style={[s.avatar, { borderColor: ORANGE }]} />
            ) : (
              <View style={[s.avatar, { backgroundColor: isDark ? CARD2 : "#E5E7EB", borderColor: ORANGE }]}>
                <Text style={[s.avatarInitials, { color: isDark ? "#fff" : "#111827" }]}>{initials}</Text>
              </View>
            )}
            <View style={s.avatarEditBtn}>
              <Ionicons name="camera" size={16} color="#fff" />
            </View>
          </TouchableOpacity>
          <Text style={[s.avatarHint, { color: dynMuted }]}>Touchez pour changer la photo de profil</Text>
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
                  style={[s.shopTypeBtn, { borderColor: active ? t.color : dynBorder, backgroundColor: active ? t.color + "18" : (isDark ? CARD2 : "#F3F4F6") }]}
                  onPress={() => {
                    if (t.id === "importe")    router.push("/importer-registration" as any);
                    else if (t.id === "grossiste") router.push("/wholesaler-registration" as any);
                    else setSelectedTypeId(t.id);
                  }}
                  activeOpacity={0.75}
                >
                  <View style={[s.shopTypeIcon, { backgroundColor: active ? t.color + "30" : (isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)") }]}>
                    <Ionicons name={t.icon as any} size={22} color={active ? t.color : dynMuted} />
                  </View>
                  <Text style={[s.shopTypeLabel, { color: active ? t.color : dynSub, fontFamily: active ? "Poppins_700Bold" : "Poppins_500Medium" }]}>{t.label}</Text>
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

        {/* Moyens de paiement — bouton unique */}
        <View style={[s.card, { backgroundColor: dynCARD, borderColor: dynBorder }]}>
          <SectionHeader title="Moyens de paiement" icon="card-outline" />
          <TouchableOpacity
            style={[s.singleActionBtn, { backgroundColor: isDark ? CARD2 : "#F3F4F6", borderColor: dynBorder }]}
            activeOpacity={0.8}
            onPress={() => Alert.alert("Moyens de paiement", "Cette section sera bientôt disponible.", [{ text: "OK" }])}
          >
            <View style={[s.singleActionIcon, { backgroundColor: "#F59E0B22" }]}>
              <Ionicons name="card-outline" size={22} color="#F59E0B" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.singleActionTitle, { color: dynText }]}>Moyens de paiement</Text>
              <Text style={[s.singleActionSub, { color: dynMuted }]}>Configurer vos options de paiement</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={dynMuted} />
          </TouchableOpacity>
        </View>

        {/* Booster mes ventes — bouton unique */}
        <View style={[s.card, { backgroundColor: dynCARD, borderColor: dynBorder }]}>
          <SectionHeader title="Booster mes ventes" icon="rocket-outline" />
          <TouchableOpacity
            style={[s.boostSingleBtn, { backgroundColor: isDark ? CARD2 : "#FFF7ED", borderColor: ORANGE + "40" }]}
            activeOpacity={0.85}
            onPress={() => Alert.alert("Booster mes ventes", "Les offres de boost seront bientôt disponibles.", [{ text: "OK" }])}
          >
            <View style={[s.boostSingleIcon, { backgroundColor: ORANGE + "20" }]}>
              <Ionicons name="rocket-outline" size={26} color={ORANGE} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.boostSingleTitle, { color: dynText }]}>Booster mes ventes</Text>
              <Text style={[s.boostSingleSub, { color: dynMuted }]}>Augmenter votre visibilité et vendre plus vite</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={dynMuted} />
          </TouchableOpacity>
        </View>

        {/* Paramètres avancés — simplifié */}
        <View style={[s.card, { backgroundColor: dynCARD, borderColor: dynBorder }]}>
          <SectionHeader title="Paramètres avancés" icon="settings-outline" />
          <View style={s.toggleRow}>
            <View style={s.settingLeft}>
              <Ionicons name="storefront-outline" size={20} color="#22C55E" />
              <View>
                <Text style={[s.settingLabel, { color: dynText }]}>Boutique active</Text>
                <Text style={[s.settingHint, { color: dynMuted }]}>
                  {shopActive ? "Les clients peuvent voir et commander" : "Boutique masquée des clients"}
                </Text>
              </View>
            </View>
            <Switch
              value={shopActive}
              onValueChange={setShopActive}
              trackColor={{ false: isDark ? CARD2 : "#D1D5DB", true: "#22C55E60" }}
              thumbColor={shopActive ? "#22C55E" : (isDark ? "#555" : "#9CA3AF")}
            />
          </View>
        </View>

        {/* Zone sensible */}
        <View style={[s.card, s.dangerCard, { backgroundColor: dynCARD }]}>
          <SectionHeader title="Zone sensible" icon="warning-outline" />

          <TouchableOpacity style={s.dangerBtn} onPress={handleDeleteActivities} activeOpacity={0.8}>
            <Ionicons name="trash-outline" size={20} color="#E53935" />
            <Text style={[s.dangerBtnText, { color: "#E53935" }]}>Supprimer mes activités sur DKD-MARKET</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[s.dangerBtn, { borderBottomWidth: 0 }]} activeOpacity={0.8}>
            <Ionicons name="close-circle-outline" size={20} color="#F59E0B" />
            <Text style={[s.dangerBtnText, { color: "#F59E0B" }]}>Désactiver la boutique</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>

      {/* ── MODAL : Type de boutique ── */}
      {selectedTypeId && (() => {
        const type     = SHOP_TYPES.find((t) => t.id === selectedTypeId)!;
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
                      <Text style={s.typeToggleLabel}>{isActive ? "✓ Activé" : "Désactivé"}</Text>
                      <Text style={s.typeToggleHint}>{isActive ? "Ce mode apparaît dans votre tableau de bord" : "Activez pour ajouter ce mode à votre boutique"}</Text>
                    </View>
                    <AnimatedToggle value={isActive} onToggle={() => toggleShopType(selectedTypeId)} color={type.color} />
                  </View>
                  <TouchableOpacity style={[s.typeCloseBtn, { backgroundColor: isActive ? type.color : CARD2 }]} onPress={() => setSelectedTypeId(null)} activeOpacity={0.85}>
                    <Text style={s.typeCloseBtnText}>{isActive ? "C'est activé ✓" : "Fermer"}</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            </TouchableOpacity>
          </Modal>
        );
      })()}

      {/* ── MODAL : Règlements ── */}
      <Modal visible={showReglements} transparent animationType="slide" onRequestClose={() => setShowReglements(false)}>
        <View style={s.regModal}>
          <View style={[s.regSheet, { backgroundColor: isDark ? "#0D1117" : "#F8FAFC" }]}>
            <View style={[s.regSheetHeader, { backgroundColor: isDark ? "#111827" : "#1a1f2e" }]}>
              <View style={s.regHandle} />
              <View style={s.regHeaderRow}>
                <View style={s.regHeaderLeft}>
                  <Ionicons name="document-text" size={22} color={ORANGE} />
                  <View>
                    <Text style={s.regTitle}>Règlements DKD Market</Text>
                    <Text style={s.regSubtitle}>Conditions & règles à respecter</Text>
                  </View>
                </View>
                <TouchableOpacity onPress={() => setShowReglements(false)} style={s.regCloseBtn}>
                  <Ionicons name="close" size={20} color="rgba(255,255,255,0.7)" />
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView contentContainerStyle={s.regContent} showsVerticalScrollIndicator={false}>
              {REGLEMENTS.map((section) => (
                <View key={section.title} style={[s.regSection, { backgroundColor: isDark ? CARD : "#FFFFFF", borderColor: isDark ? BORDER : "rgba(0,0,0,0.06)" }]}>
                  <View style={s.regSectionHeader}>
                    <View style={[s.regSectionIcon, { backgroundColor: section.color + "20" }]}>
                      <Ionicons name={section.icon as any} size={20} color={section.color} />
                    </View>
                    <Text style={[s.regSectionTitle, { color: isDark ? TEXT : "#111827" }]}>{section.title}</Text>
                  </View>
                  {section.items.map((item, i) => (
                    <View key={i} style={s.regItem}>
                      <View style={[s.regItemDot, { backgroundColor: section.color }]} />
                      <Text style={[s.regItemText, { color: isDark ? TEXT_SUB : "#374151" }]}>{item}</Text>
                    </View>
                  ))}
                </View>
              ))}

              <View style={[s.regFooter, { backgroundColor: isDark ? CARD2 : "#FFF7ED", borderColor: ORANGE + "30" }]}>
                <Ionicons name="information-circle-outline" size={18} color={ORANGE} />
                <Text style={[s.regFooterText, { color: isDark ? TEXT_MUTED : "#92400E" }]}>
                  En utilisant DKD Market, vous acceptez l'ensemble de ces règlements. Tout manquement peut entraîner la suspension ou la suppression du compte.
                </Text>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── MODAL : Confirmation suppression ── */}
      <Modal visible={showDeleteConfirm} transparent animationType="fade" onRequestClose={() => setShowDeleteConfirm(false)}>
        <View style={s.confirmOverlay}>
          <View style={[s.confirmSheet, { backgroundColor: isDark ? CARD : "#FFFFFF" }]}>
            <View style={[s.confirmIconWrap, { backgroundColor: "#E5393520" }]}>
              <Ionicons name="trash-outline" size={36} color="#E53935" />
            </View>
            <Text style={[s.confirmTitle, { color: isDark ? TEXT : "#111827" }]}>Supprimer mes activités</Text>
            <Text style={[s.confirmDesc, { color: dynMuted }]}>
              Cette action supprimera définitivement toutes vos activités, publications et données sur DKD-MARKET. Cette action est irréversible.
            </Text>
            <View style={s.confirmBtns}>
              <TouchableOpacity
                style={[s.confirmBtn, { backgroundColor: isDark ? CARD2 : "#F3F4F6", borderColor: dynBorder }]}
                onPress={() => setShowDeleteConfirm(false)}
                activeOpacity={0.8}
              >
                <Text style={[s.confirmBtnText, { color: dynText }]}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.confirmBtn, { backgroundColor: "#E53935", borderColor: "#E53935" }]}
                onPress={confirmDelete}
                activeOpacity={0.8}
              >
                <Text style={[s.confirmBtnText, { color: "#fff" }]}>Supprimer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
  headerTitle: { flex: 1, color: TEXT, fontFamily: "Poppins_700Bold", fontSize: fs(16), marginLeft: 4 },
  reglementsBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(255,107,0,0.2)",
    borderWidth: 1,
    borderColor: ORANGE + "50",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  reglementsBtnText: { color: "#fff", fontFamily: "Poppins_600SemiBold", fontSize: fs(11) },

  avatarSection: { alignItems: "center", paddingVertical: 24, gap: 8 },
  avatarWrap: { position: "relative" },
  avatar: {
    width: 96, height: 96, borderRadius: 48,
    alignItems: "center", justifyContent: "center",
    borderWidth: 3, borderColor: ORANGE,
  },
  avatarInitials: { color: "#fff", fontFamily: "Poppins_700Bold", fontSize: fs(32) },
  avatarEditBtn: {
    position: "absolute", bottom: 0, right: 0,
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: ORANGE, alignItems: "center", justifyContent: "center",
    borderWidth: 2, borderColor: BG,
  },
  avatarHint: { color: TEXT_MUTED, fontFamily: "Poppins_400Regular", fontSize: fs(12) },
  bannerBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    borderWidth: 1, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 8,
  },
  bannerBtnText: { color: TEXT_SUB, fontFamily: "Poppins_600SemiBold", fontSize: fs(13) },

  card: {
    marginHorizontal: 16, marginBottom: 16,
    borderRadius: 16, padding: 16,
    borderWidth: 1,
  },
  dangerCard: { borderColor: "rgba(229,57,53,0.2)" },

  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 },
  sectionTitle: { color: TEXT, fontFamily: "Poppins_700Bold", fontSize: fs(14) },

  fieldRow: { marginBottom: 12 },
  fieldLabel: { color: TEXT_MUTED, fontFamily: "Poppins_600SemiBold", fontSize: fs(11), marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 },
  fieldInputWrap: {
    flexDirection: "row", alignItems: "center",
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1,
  },
  fieldInput: { flex: 1, fontFamily: "Poppins_500Medium", fontSize: fs(14) },

  singleActionBtn: {
    flexDirection: "row", alignItems: "center", gap: 12,
    borderRadius: 12, padding: 14, borderWidth: 1,
  },
  singleActionIcon: { width: 46, height: 46, borderRadius: 12, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  singleActionTitle: { fontFamily: "Poppins_700Bold", fontSize: fs(14) },
  singleActionSub: { fontFamily: "Poppins_400Regular", fontSize: fs(12), marginTop: 2 },

  boostSingleBtn: {
    flexDirection: "row", alignItems: "center", gap: 14,
    borderRadius: 14, padding: 16, borderWidth: 1.5,
  },
  boostSingleIcon: { width: 52, height: 52, borderRadius: 14, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  boostSingleTitle: { fontFamily: "Poppins_700Bold", fontSize: fs(15) },
  boostSingleSub: { fontFamily: "Poppins_400Regular", fontSize: fs(12), marginTop: 2, lineHeight: fs(17) },

  toggleRow: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
  },
  settingLeft: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  settingLabel: { fontFamily: "Poppins_600SemiBold", fontSize: fs(13) },
  settingHint: { fontFamily: "Poppins_400Regular", fontSize: fs(11) },

  shopTypeHint: { color: TEXT_MUTED, fontFamily: "Poppins_400Regular", fontSize: fs(12), marginBottom: 14, marginTop: -6 },
  shopTypeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  shopTypeBtn: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, borderWidth: 1.5, position: "relative", minWidth: "45%", flex: 1 },
  shopTypeIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  shopTypeLabel: { fontSize: fs(13), flex: 1 },
  shopTypeCheck: { position: "absolute", top: -6, right: -6, width: 18, height: 18, borderRadius: 9, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: BG },

  dangerBtn: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: BORDER },
  dangerBtnText: { fontFamily: "Poppins_600SemiBold", fontSize: fs(14), flex: 1 },

  typeOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.72)", justifyContent: "flex-end", alignItems: "center" },
  typeSheet: { width: 340, backgroundColor: CARD, borderRadius: 24, padding: 24, alignItems: "center", gap: 12, marginBottom: 32 },
  typeSheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.15)", marginBottom: 8 },
  typeIconWrap: { width: 80, height: 80, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  typeModalTitle: { fontFamily: "Poppins_700Bold", fontSize: fs(20) },
  typeModalDesc: { color: TEXT_MUTED, fontFamily: "Poppins_400Regular", fontSize: fs(13), textAlign: "center", lineHeight: fs(19) },
  typeToggleRow: { flexDirection: "row", alignItems: "center", gap: 12, width: "100%", backgroundColor: CARD2, borderRadius: 14, padding: 14 },
  typeToggleLabel: { color: TEXT, fontFamily: "Poppins_700Bold", fontSize: fs(14) },
  typeToggleHint: { color: TEXT_MUTED, fontFamily: "Poppins_400Regular", fontSize: fs(12) },
  typeCloseBtn: { width: "100%", borderRadius: 14, paddingVertical: ms(14), alignItems: "center" },
  typeCloseBtnText: { color: "#fff", fontFamily: "Poppins_700Bold", fontSize: fs(15) },

  regModal: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
  regSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: "92%", overflow: "hidden" },
  regSheetHeader: { paddingHorizontal: 20, paddingBottom: 16, paddingTop: 12 },
  regHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.2)", alignSelf: "center", marginBottom: 14 },
  regHeaderRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  regHeaderLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  regTitle: { color: "#fff", fontFamily: "Poppins_700Bold", fontSize: fs(16) },
  regSubtitle: { color: "rgba(255,255,255,0.5)", fontFamily: "Poppins_400Regular", fontSize: fs(12) },
  regCloseBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.1)", alignItems: "center", justifyContent: "center" },
  regContent: { padding: 16, gap: 12 },
  regSection: { borderRadius: 14, padding: 14, borderWidth: 1, gap: 10 },
  regSectionHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  regSectionIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  regSectionTitle: { fontFamily: "Poppins_700Bold", fontSize: fs(14) },
  regItem: { flexDirection: "row", gap: 8, alignItems: "flex-start" },
  regItemDot: { width: 6, height: 6, borderRadius: 3, marginTop: 6, flexShrink: 0 },
  regItemText: { fontFamily: "Poppins_400Regular", fontSize: fs(12), lineHeight: fs(18), flex: 1 },
  regFooter: { flexDirection: "row", gap: 10, alignItems: "flex-start", borderRadius: 12, padding: 14, borderWidth: 1 },
  regFooterText: { fontFamily: "Poppins_400Regular", fontSize: fs(12), lineHeight: fs(18), flex: 1 },

  confirmOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "center", alignItems: "center", padding: 24 },
  confirmSheet: { width: "100%", borderRadius: 20, padding: 24, alignItems: "center", gap: 12 },
  confirmIconWrap: { width: 72, height: 72, borderRadius: 36, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  confirmTitle: { fontFamily: "Poppins_700Bold", fontSize: fs(18), textAlign: "center" },
  confirmDesc: { fontFamily: "Poppins_400Regular", fontSize: fs(13), textAlign: "center", lineHeight: fs(20) },
  confirmBtns: { flexDirection: "row", gap: 12, marginTop: 8, width: "100%" },
  confirmBtn: { flex: 1, borderRadius: 12, paddingVertical: 13, alignItems: "center", borderWidth: 1 },
  confirmBtnText: { fontFamily: "Poppins_700Bold", fontSize: fs(14) },
});
