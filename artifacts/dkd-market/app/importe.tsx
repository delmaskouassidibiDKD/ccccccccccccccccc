import React, { useState, useRef, useCallback, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  TextInput,
  Switch,
  Animated,
  ScrollView,
  Dimensions,
  Image,
} from "react-native";
import { useRouter, useLocalSearchParams, useFocusEffect } from "expo-router";
import ProfilePhotoAvatar from "@/components/ProfilePhotoAvatar";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import * as Haptics from "expo-haptics";

const { width: SCREEN_W } = Dimensions.get("window");
const DRAWER_W = Math.min(SCREEN_W * 0.72, 280);

const BG = "#0D1117";
const CARD = "#161B25";
const CARD2 = "#1C2230";
const ACCENT = "#A855F7";
const ACCENT2 = "#7C3AED";

type Section =
  | "accueil"
  | "commandes_en_cours"
  | "gestion_produits"
  | "gestion_des_produits"
  | "collaborateur"
  | "parametres";

type UserRoute = { id:string; origin:{flag:string;name:string}|null; dest:{flag:string;name:string}|null; transport:"airplane"|"boat" };

const MENU_ITEMS: {
  id: Section;
  icon: string;
  label: string;
  badge?: string;
  color?: string;
}[] = [
  { id: "accueil",              icon: "home-outline",          label: "Accueil",                color: ACCENT },
  { id: "commandes_en_cours",  icon: "time-outline",          label: "Commandes en cours",     badge: "3", color: "#F59E0B" },
  { id: "gestion_produits",    icon: "map-outline",           label: "Gestion du parcours",    badge: "3", color: "#22D3EE" },
  { id: "gestion_des_produits",icon: "bag-handle-outline",   label: "Gestion des produits",   color: "#34D399" },
  { id: "collaborateur",       icon: "person-add-outline",   label: "Ajouter collaborateur",  color: "#FBBF24" },
  { id: "parametres",          icon: "settings-outline",     label: "Paramètres avancés",     color: "#94A3B8" },
];

export default function ImportePage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark, toggleTheme } = useTheme();
  const { user } = useAuth();
  const { browse } = useLocalSearchParams<{ browse?: string }>();

  const dynBG   = isDark ? "#0D1117" : "#F0F4FA";
  const dynCARD = isDark ? "#161B25" : "#FFFFFF";
  const dynDRAWER = isDark ? "#111827" : "#FFFFFF";
  const dynText = isDark ? "#F0F6FF" : "#1A1A1A";
  const dynSub  = isDark ? "#64748B" : "#6B7280";
  const dynBorder = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.08)";

  const [activeSection, setActiveSection] = useState<Section>("accueil");
  const [drawerOpen, setDrawerOpen] = useState(false);

  /* ── Pays sélectionnés dans Accueil (partagés avec Gestion) ── */
  const [originCountries, setOriginCountries] = useState<string[]>([]);
  const [expoCountries,   setExpoCountries]   = useState<string[]>([]);

  /* ── Flux créés dynamiquement par l'utilisateur dans Gestion ── */
  const [userRoutes, setUserRoutes] = useState<UserRoute[]>([]);

  const addUserRoute = React.useCallback(() => {
    const id = `ur-${Date.now()}`;
    setUserRoutes(prev => [...prev, { id, origin:null, dest:null, transport:"airplane" }]);
    setCheckedMap(prev => ({ ...prev, [id]: [false,false,false,false,false] }));
  }, []);

  const removeUserRoute = React.useCallback((id:string) => {
    setUserRoutes(prev => prev.filter(r => r.id !== id));
  }, []);

  const updateUserRoute = React.useCallback((id:string, patch: Partial<UserRoute>) => {
    setUserRoutes(prev => prev.map(r => r.id === id ? { ...r, ...patch } : r));
  }, []);

  /* ── Shared shipment step state (Gestion ↔ Commandes) ── */
  const [checkedMap, setCheckedMap] = useState<Record<string,boolean[]>>(INIT_CHECKED_MAP);
  const toggleRouteStep = React.useCallback((routeId: string, stepIdx: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCheckedMap(prev => {
      const checked = [...(prev[routeId] ?? [false,false,false,false,false])];
      if (checked[stepIdx]) {
        for (let i = stepIdx; i < checked.length; i++) checked[i] = false;
      } else {
        for (let i = 0; i <= stepIdx; i++) checked[i] = true;
      }
      return { ...prev, [routeId]: checked };
    });
  }, []);

  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);

  const [phone,         setPhone]         = useState("");
  const [whatsapp,      setWhatsapp]      = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");

  const PAYMENT_OPTIONS = ["Mobile Money", "Virement", "Espèces", "Carte"];

  useEffect(() => {
    AsyncStorage.multiGet(["@dkd:imp_phone", "@dkd:imp_whatsapp", "@dkd:imp_payment", "@dkd:seller_profile_photo"]).then((pairs) => {
      if (pairs[0][1]) setPhone(pairs[0][1]);
      if (pairs[1][1]) setWhatsapp(pairs[1][1]);
      if (pairs[2][1]) setPaymentMethod(pairs[2][1]);
      if (pairs[3][1]) setProfilePhoto(pairs[3][1]);
    });
  }, []);

  useFocusEffect(useCallback(() => {
    AsyncStorage.getItem("@dkd:seller_profile_photo").then((uri) => {
      if (uri) setProfilePhoto(uri);
    }).catch(() => {});
  }, []));

  const saveField = (key: string, val: string) => AsyncStorage.setItem(key, val);

  const drawerX = useRef(new Animated.Value(-DRAWER_W)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  const openDrawer = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setDrawerOpen(true);
    Animated.parallel([
      Animated.spring(drawerX, {
        toValue: 0,
        useNativeDriver: true,
        damping: 20,
        stiffness: 200,
      }),
      Animated.timing(overlayOpacity, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const closeDrawer = useCallback(() => {
    Animated.parallel([
      Animated.spring(drawerX, {
        toValue: -DRAWER_W,
        useNativeDriver: true,
        damping: 20,
        stiffness: 200,
      }),
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(() => setDrawerOpen(false));
  }, []);

  // Simple browse mode (from Rayons): no drawer, just a listing page
  if (browse === "1") {
    return <ImporteBrowsePage router={router} insets={insets} />;
  }

  const navigateTo = (section: Section) => {
    Haptics.selectionAsync();
    closeDrawer();
    if (section === "gestion_des_produits") {
      router.push("/produits-importe" as any);
    } else {
      setActiveSection(section);
    }
  };

  const currentMenu = MENU_ITEMS.find((m) => m.id === activeSection);
  const displayName = user?.full_name || user?.email?.split("@")[0] || "Boss";
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <View style={[styles.root, { paddingTop: insets.top, backgroundColor: dynBG }]}>

      {/* ── HEADER ── */}
      <View style={[styles.header, { backgroundColor: dynBG, borderBottomColor: dynBorder }]}>
        <TouchableOpacity style={styles.menuBtn} onPress={openDrawer} activeOpacity={0.7}>
          <View style={styles.hamburger}>
            <View style={[styles.bar, styles.barTop, { backgroundColor: isDark ? "#fff" : "#1A1A1A" }]} />
            <View style={[styles.bar, styles.barMid, { backgroundColor: isDark ? "#fff" : "#1A1A1A" }]} />
            <View style={[styles.bar, styles.barBot, { backgroundColor: isDark ? "#fff" : "#1A1A1A" }]} />
          </View>
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <View style={styles.headerIconWrap}>
            <Ionicons name="airplane-outline" size={16} color={ACCENT} />
          </View>
          <Text style={[styles.headerTitle, { color: dynText }]}>
            {currentMenu?.label ?? "Importés"}
          </Text>
        </View>

        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="close" size={20} color="#94A3B8" />
        </TouchableOpacity>
      </View>

      {/* ── MAIN CONTENT ── */}
      <View style={{ flex: 1 }}>
        {activeSection === "accueil"            && <AccueilView displayName={displayName} initial={initial} profilePhoto={profilePhoto} onPhotoChanged={setProfilePhoto} isDark={isDark} dynCARD={dynCARD} dynText={dynText} dynSub={dynSub} dynBG={dynBG} dynBorder={dynBorder}
          originCountries={originCountries} setOriginCountries={setOriginCountries}
          expoCountries={expoCountries}     setExpoCountries={setExpoCountries} />}
        {activeSection === "commandes_en_cours" && <CommandesEnCoursView isDark={isDark} dynCARD={dynCARD} dynText={dynText} dynSub={dynSub} dynBG={dynBG} dynBorder={dynBorder} checkedMap={checkedMap} userRoutes={userRoutes} />}
        {activeSection === "gestion_produits"  && <GestionProduitsView  isDark={isDark} dynCARD={dynCARD} dynText={dynText} dynSub={dynSub} dynBG={dynBG} dynBorder={dynBorder}
          checkedMap={checkedMap} onToggleStep={toggleRouteStep}
          originCountries={originCountries} expoCountries={expoCountries}
          userRoutes={userRoutes} onAddRoute={addUserRoute} onRemoveRoute={removeUserRoute} onUpdateRoute={updateUserRoute} />}
        {activeSection === "collaborateur"      && <CollaborateurView isDark={isDark} dynCARD={dynCARD} dynText={dynText} dynSub={dynSub} dynBG={dynBG} dynBorder={dynBorder} />}
        {activeSection === "parametres"         && <GenericView icon="settings-outline"   color="#94A3B8" title="Paramètres avancés"    sub="Configuration de votre espace importateur" />}
      </View>

      {/* ── OVERLAY ── */}
      {drawerOpen && (
        <TouchableWithoutFeedback onPress={closeDrawer}>
          <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]} />
        </TouchableWithoutFeedback>
      )}

      {/* ── DRAWER ── */}
      <Animated.View
        style={[styles.drawer, { width: DRAWER_W, transform: [{ translateX: drawerX }], backgroundColor: dynDRAWER }]}
        pointerEvents={drawerOpen ? "auto" : "none"}
      >
        {/* Drawer header */}
        <View style={[styles.drawerHeader, { paddingTop: insets.top + 12 }]}>
          <ProfilePhotoAvatar
            photoUri={profilePhoto}
            initials={initial}
            onPhotoChanged={setProfilePhoto}
            size={56}
            fontSize={22}
            borderColor={ACCENT + "88"}
            bgColor={ACCENT + "33"}
            initialsColor={ACCENT}
          />
          <Text style={[styles.drawerName, { color: dynText }]}>{displayName}</Text>
          <View style={styles.drawerBadge}>
            <Ionicons name="airplane-outline" size={10} color="#fff" />
            <Text style={styles.drawerBadgeText}>Importateur</Text>
          </View>
        </View>

        {/* Menu items */}
        <ScrollView style={styles.drawerScroll} showsVerticalScrollIndicator={false}>
          {MENU_ITEMS.map((item, idx) => {
            const isActive = activeSection === item.id;
            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.drawerItem, isActive && styles.drawerItemActive]}
                onPress={() => navigateTo(item.id)}
                activeOpacity={0.75}
              >
                <View style={[styles.drawerItemIcon, { backgroundColor: (item.color ?? ACCENT) + "22" }]}>
                  <Ionicons name={item.icon as any} size={18} color={item.color ?? ACCENT} />
                </View>
                <Text style={[styles.drawerItemLabel, { color: dynText }, isActive && { color: "#fff" }]}>
                  {item.label}
                </Text>
                {item.badge && (
                  <View style={[styles.drawerBadgeDot, { backgroundColor: item.color ?? ACCENT }]}>
                    <Text style={styles.drawerBadgeDotText}>{item.badge}</Text>
                  </View>
                )}
                {isActive && <View style={[styles.drawerActiveBar, { backgroundColor: item.color ?? ACCENT }]} />}
              </TouchableOpacity>
            );
          })}

          <View style={styles.drawerDivider} />

          {/* Theme toggle */}
          <View style={styles.drawerThemeRow}>
            <View style={[styles.drawerItemIcon, { backgroundColor: isDark ? "#FBBF2422" : "#60A5FA22" }]}>
              <Ionicons
                name={isDark ? "moon-outline" : "sunny-outline"}
                size={18}
                color={isDark ? "#FBBF24" : "#60A5FA"}
              />
            </View>
            <Text style={[styles.drawerThemeLabel, { color: dynText }]}>
              {isDark ? "Thème sombre" : "Thème clair"}
            </Text>
            <Switch
              value={!isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: "#1E293B", true: "#60A5FA66" }}
              thumbColor={!isDark ? "#60A5FA" : "#475569"}
            />
          </View>

          <View style={styles.drawerDivider} />

          {/* ── Coordonnées ── */}
          <View style={styles.drawerFieldGroup}>
            <Text style={[styles.drawerFieldGroupLabel, { color: dynSub }]}>MES COORDONNÉES</Text>

            {/* Numéro de téléphone */}
            <View style={[styles.drawerFieldWrap, { backgroundColor: isDark ? "#0D1117" : "#F0F4FA", borderColor: dynBorder }]}>
              <View style={[styles.drawerFieldIcon, { backgroundColor: "#60A5FA22" }]}>
                <Ionicons name="call-outline" size={15} color="#60A5FA" />
              </View>
              <TextInput
                style={[styles.drawerFieldInput, { color: dynText }]}
                placeholder="Numéro de téléphone"
                placeholderTextColor={dynSub}
                keyboardType="phone-pad"
                value={phone}
                onChangeText={(v) => { setPhone(v); saveField("@dkd:imp_phone", v); }}
                returnKeyType="done"
              />
            </View>

            {/* Numéro WhatsApp */}
            <View style={[styles.drawerFieldWrap, { backgroundColor: isDark ? "#0D1117" : "#F0F4FA", borderColor: dynBorder }]}>
              <View style={[styles.drawerFieldIcon, { backgroundColor: "#25D36622" }]}>
                <Ionicons name="logo-whatsapp" size={15} color="#25D366" />
              </View>
              <TextInput
                style={[styles.drawerFieldInput, { color: dynText }]}
                placeholder="Numéro WhatsApp"
                placeholderTextColor={dynSub}
                keyboardType="phone-pad"
                value={whatsapp}
                onChangeText={(v) => { setWhatsapp(v); saveField("@dkd:imp_whatsapp", v); }}
                returnKeyType="done"
              />
            </View>

            {/* Moyen de paiement */}
            <Text style={[styles.drawerFieldGroupLabel, { color: dynSub, marginTop: 8 }]}>MOYEN DE PAIEMENT</Text>
            <View style={styles.drawerPaymentChips}>
              {PAYMENT_OPTIONS.map((opt) => {
                const active = paymentMethod === opt;
                return (
                  <TouchableOpacity
                    key={opt}
                    style={[styles.drawerPayChip, { borderColor: active ? ACCENT : dynBorder, backgroundColor: active ? ACCENT + "18" : (isDark ? "#0D1117" : "#F0F4FA") }]}
                    onPress={() => { setPaymentMethod(opt); saveField("@dkd:imp_payment", opt); }}
                    activeOpacity={0.75}
                  >
                    <Text style={[styles.drawerPayChipText, { color: active ? ACCENT : dynSub }]}>{opt}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.drawerDivider} />

          <TouchableOpacity
            style={styles.drawerItem}
            onPress={() => { closeDrawer(); setTimeout(() => router.back(), 300); }}
            activeOpacity={0.75}
          >
            <View style={[styles.drawerItemIcon, { backgroundColor: "#EF444422" }]}>
              <Ionicons name="exit-outline" size={18} color="#EF4444" />
            </View>
            <Text style={[styles.drawerItemLabel, { color: "#EF4444" }]}>Quitter</Text>
          </TouchableOpacity>

          <View style={{ height: insets.bottom + 24 }} />
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const WESTERN_COUNTRIES = [
  { flag: "🇫🇷", name: "France" },
  { flag: "🇧🇪", name: "Belgique" },
  { flag: "🇨🇭", name: "Suisse" },
  { flag: "🇩🇪", name: "Allemagne" },
  { flag: "🇮🇹", name: "Italie" },
  { flag: "🇪🇸", name: "Espagne" },
  { flag: "🇵🇹", name: "Portugal" },
  { flag: "🇳🇱", name: "Pays-Bas" },
  { flag: "🇬🇧", name: "Royaume-Uni" },
  { flag: "🇺🇸", name: "États-Unis" },
  { flag: "🇨🇦", name: "Canada" },
  { flag: "🇦🇺", name: "Australie" },
  { flag: "🇦🇹", name: "Autriche" },
  { flag: "🇱🇺", name: "Luxembourg" },
  { flag: "🇸🇪", name: "Suède" },
  { flag: "🇳🇴", name: "Norvège" },
  { flag: "🇩🇰", name: "Danemark" },
  { flag: "🇫🇮", name: "Finlande" },
  { flag: "🇨🇳", name: "Chine" },
  { flag: "🇯🇵", name: "Japon" },
  { flag: "🇰🇷", name: "Corée du Sud" },
];

const SOURCE_COUNTRIES = [
  { flag: "🇨🇬", name: "Congo" },
  { flag: "🇨🇩", name: "RD Congo" },
  { flag: "🇨🇲", name: "Cameroun" },
  { flag: "🇨🇮", name: "Côte d'Ivoire" },
  { flag: "🇸🇳", name: "Sénégal" },
  { flag: "🇲🇱", name: "Mali" },
  { flag: "🇧🇫", name: "Burkina Faso" },
  { flag: "🇬🇳", name: "Guinée" },
  { flag: "🇬🇦", name: "Gabon" },
  { flag: "🇹🇬", name: "Togo" },
  { flag: "🇧🇯", name: "Bénin" },
  { flag: "🇳🇪", name: "Niger" },
  { flag: "🇳🇬", name: "Nigeria" },
  { flag: "🇬🇭", name: "Ghana" },
  { flag: "🇲🇦", name: "Maroc" },
];

/* ─────── Accueil View ─────── */
function AccueilView({ displayName, initial, profilePhoto, onPhotoChanged, isDark, dynCARD, dynText, dynSub, dynBG, dynBorder,
  originCountries, setOriginCountries, expoCountries, setExpoCountries }: {
  displayName: string; initial: string; profilePhoto: string | null; onPhotoChanged: (uri: string) => void;
  isDark: boolean; dynCARD: string; dynText: string; dynSub: string; dynBG: string; dynBorder: string;
  originCountries: string[]; setOriginCountries: (fn: (p:string[])=>string[]) => void;
  expoCountries:   string[]; setExpoCountries:   (fn: (p:string[])=>string[]) => void;
}) {
  const router = useRouter();
  const [originInput, setOriginInput]       = useState("");
  const [showOriginList, setShowOriginList] = useState(false);
  const [showExpoList, setShowExpoList]     = useState(false);

  const filteredWestern = WESTERN_COUNTRIES.filter(
    (c) =>
      c.name.toLowerCase().includes(originInput.toLowerCase()) &&
      !originCountries.includes(c.name)
  );

  const addOriginCountry = (name: string) => {
    if (!originCountries.includes(name)) setOriginCountries((p) => [...p, name]);
    setOriginInput("");
  };
  const removeOriginCountry = (name: string) =>
    setOriginCountries((p) => p.filter((c) => c !== name));

  const toggleExpoCountry = (name: string) =>
    setExpoCountries((p) =>
      p.includes(name) ? p.filter((c) => c !== name) : [...p, name]
    );

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={styles.accueilScroll}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* Welcome card */}
      <View style={[styles.welcomeCard, { backgroundColor: dynCARD, borderColor: dynBorder }]}>
        <ProfilePhotoAvatar
          photoUri={profilePhoto}
          initials={initial}
          onPhotoChanged={onPhotoChanged}
          size={64}
          fontSize={26}
          borderColor={ACCENT + "88"}
          bgColor={ACCENT + "33"}
          initialsColor={ACCENT}
        />
        <Text style={[styles.welcomeTitle, { color: dynText }]}>
          Bienvenue,{"\n"}
          <Text style={styles.welcomeName}>{displayName}</Text>
        </Text>
        <Text style={[styles.welcomeSub, { color: dynSub }]}>
          Gérez vos importations et développez votre réseau depuis ce tableau de bord.
        </Text>
      </View>

      {/* Quick stats */}
      <Text style={[styles.sectionLabel, { color: isDark ? "#475569" : "#9CA3AF" }]}>VUE D'ENSEMBLE</Text>
      <View style={styles.statsRow}>
        <StatCard icon="receipt-outline" color="#F59E0B" value="3"      label="Cmd. en cours" dynCARD={dynCARD} dynSub={dynSub} />
        <StatCard icon="cube-outline"    color="#60A5FA" value="0"      label="Produits"       dynCARD={dynCARD} dynSub={dynSub} />
        <StatCard icon="cash-outline"    color="#34D399" value="0 FCFA" label="Revenus"        dynCARD={dynCARD} dynSub={dynSub} />
      </View>

      {/* Quick actions */}
      <Text style={[styles.sectionLabel, { color: isDark ? "#475569" : "#9CA3AF" }]}>ACTIONS RAPIDES</Text>
      <View style={styles.actionsGrid}>
        <QuickAction icon="add-circle-outline"    color="#A855F7" label="Ajouter produit"       dynCARD={dynCARD} dynSub={dynSub} onPress={() => router.push("/add-product?context=importe" as any)} />
        <QuickAction icon="people-circle-outline" color="#F472B6" label="Groupe"               dynCARD={dynCARD} dynSub={dynSub} onPress={() => router.push("/groupe-importe" as any)} />
        <QuickAction icon="chatbubble-outline"    color="#60A5FA" label="Message privé"        dynCARD={dynCARD} dynSub={dynSub} onPress={() => router.push("/messages-importe" as any)} />
        <QuickAction icon="receipt-outline"       color="#FBBF24" label="Mes commandes"        dynCARD={dynCARD} dynSub={dynSub} onPress={() => router.push("/commandes-importe" as any)} />
        <QuickAction icon="card-outline"          color="#34D399" label="Paiements en cours"   dynCARD={dynCARD} dynSub={dynSub} onPress={() => router.push("/paiements-importe" as any)} />
        <QuickAction icon="megaphone-outline"     color="#F97316" label="Campagnes de publicité" dynCARD={dynCARD} dynSub={dynSub} />
      </View>

      {/* ── MES MARCHÉS ── */}
      <Text style={[styles.sectionLabel, { color: isDark ? "#475569" : "#9CA3AF" }]}>MES MARCHÉS</Text>

      {/* ── PAYS D'ORIGINE (fournisseurs occidentaux) ── */}
      <View style={[styles.marketsCard, { backgroundColor: dynCARD, borderColor: dynBorder }]}>
        {/* Header row with toggle button */}
        <TouchableOpacity
          style={styles.marketToggleRow}
          onPress={() => setShowOriginList((v) => !v)}
          activeOpacity={0.75}
        >
          <View style={[styles.marketSectionIcon, { backgroundColor: "#60A5FA22" }]}>
            <Ionicons name="business-outline" size={16} color="#60A5FA" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.marketSectionTitle, { color: dynText }]}>Pays d'origine</Text>
            <Text style={[styles.marketSectionSub, { color: dynSub }]}>D'où viennent les produits du fournisseur</Text>
          </View>
          <View style={styles.marketToggleBtn}>
            <Ionicons name={showOriginList ? "chevron-up" : "add"} size={16} color="#60A5FA" />
          </View>
        </TouchableOpacity>

        {/* Selected origin chips (always visible) */}
        {originCountries.length > 0 && (
          <View style={styles.selectedExpoWrap}>
            {originCountries.map((name) => {
              const found = WESTERN_COUNTRIES.find((c) => c.name === name);
              return (
                <View key={name} style={styles.selectedExpoChip}>
                  <Text style={styles.selectedExpoFlag}>{found?.flag ?? "🌍"}</Text>
                  <Text style={styles.selectedExpoName}>{name}</Text>
                  <TouchableOpacity onPress={() => removeOriginCountry(name)}>
                    <Ionicons name="close-circle" size={14} color="#64748B" />
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}

        {/* Expanded list */}
        {showOriginList && (
          <>
            {/* Search input */}
            <View style={[styles.expoInputWrap, { backgroundColor: dynBG, borderColor: dynBorder }]}>
              <Ionicons name="search-outline" size={16} color={dynSub} />
              <TextInput
                style={[styles.expoInput, { color: dynText }]}
                placeholder="Rechercher un pays..."
                placeholderTextColor={dynSub}
                value={originInput}
                onChangeText={setOriginInput}
                returnKeyType="done"
              />
              {originInput.length > 0 && (
                <TouchableOpacity onPress={() => setOriginInput("")}>
                  <Ionicons name="close-circle" size={16} color={dynSub} />
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.westernChips}>
              {filteredWestern.map((c) => (
                <TouchableOpacity
                  key={c.name}
                  style={[styles.westernChip, { backgroundColor: dynBG, borderColor: dynBorder }]}
                  onPress={() => addOriginCountry(c.name)}
                  activeOpacity={0.75}
                >
                  <Text style={styles.westernChipFlag}>{c.flag}</Text>
                  <Text style={[styles.westernChipName, { color: dynText }]}>{c.name}</Text>
                  <Ionicons name="add-circle-outline" size={13} color={ACCENT} />
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}
      </View>

      {/* ── PAYS D'EXPOSITION (15 pays qui reçoivent les produits) ── */}
      <View style={[styles.marketsCard, { backgroundColor: dynCARD, borderColor: dynBorder }]}>
        {/* Header row with toggle button */}
        <TouchableOpacity
          style={styles.marketToggleRow}
          onPress={() => setShowExpoList((v) => !v)}
          activeOpacity={0.75}
        >
          <View style={[styles.marketSectionIcon, { backgroundColor: ACCENT + "22" }]}>
            <Ionicons name="earth-outline" size={16} color={ACCENT} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.marketSectionTitle, { color: dynText }]}>Pays d'exposition</Text>
            <Text style={[styles.marketSectionSub, { color: dynSub }]}>Pays qui reçoivent vos produits</Text>
          </View>
          <View style={[styles.marketToggleBtn, { borderColor: ACCENT + "66" }]}>
            <Ionicons name={showExpoList ? "chevron-up" : "add"} size={16} color={ACCENT} />
          </View>
        </TouchableOpacity>

        {/* Selected expo chips (always visible) */}
        {expoCountries.length > 0 && (
          <View style={styles.selectedExpoWrap}>
            {expoCountries.map((name) => {
              const found = SOURCE_COUNTRIES.find((c) => c.name === name);
              return (
                <View key={name} style={[styles.selectedExpoChip, { borderColor: ACCENT + "44", backgroundColor: ACCENT + "12" }]}>
                  <Text style={styles.selectedExpoFlag}>{found?.flag ?? "🌍"}</Text>
                  <Text style={[styles.selectedExpoName, { color: ACCENT }]}>{name}</Text>
                  <TouchableOpacity onPress={() => toggleExpoCountry(name)}>
                    <Ionicons name="close-circle" size={14} color="#64748B" />
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}

        {/* Expanded list of 15 countries */}
        {showExpoList && (
          <View style={styles.sourceGrid}>
            {SOURCE_COUNTRIES.map((c) => {
              const added = expoCountries.includes(c.name);
              return (
                <TouchableOpacity
                  key={c.name}
                  style={[styles.sourceChip, { backgroundColor: dynBG, borderColor: dynBorder }, added && styles.sourceChipActive]}
                  onPress={() => toggleExpoCountry(c.name)}
                  activeOpacity={0.75}
                >
                  <Text style={styles.sourceChipFlag}>{c.flag}</Text>
                  <Text style={[styles.sourceChipName, { color: dynText }, added && { color: ACCENT }]}>{c.name}</Text>
                  <View style={[styles.sourceChipBtn, added && styles.sourceChipBtnActive]}>
                    <Ionicons
                      name={added ? "checkmark" : "add"}
                      size={12}
                      color={added ? "#fff" : ACCENT}
                    />
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

/* ─────── Gestion Produits En Cours View ─────── */
const GP_STEPS = ["Préparation", "Expédié", "En transit", "Dédouanement", "Livré"];
const GP_ICONS: Record<string, string> = {
  "Préparation": "construct-outline",
  "Expédié":     "airplane-outline",
  "En transit":  "navigate-outline",
  "Dédouanement":"document-text-outline",
  "Livré":       "checkmark-circle-outline",
};
const GP_STATUS_COLORS: Record<string, string> = {
  "Préparation": "#94A3B8",
  "Expédié":     "#60A5FA",
  "En transit":  "#A855F7",
  "Dédouanement":"#FBBF24",
  "Livré":       "#34D399",
};

/* ── Route flux data (Gestion view — country-to-country, no person names) ── */
const SHARED_ROUTES = [
  { id:"r1", origin:{flag:"🇨🇳",name:"Chine"},   dest:{flag:"🇨🇮",name:"Côte d'Ivoire"}, transport:"airplane", initChecked:[true,true,false,false,false] },
  { id:"r2", origin:{flag:"🇫🇷",name:"France"},  dest:{flag:"🇸🇳",name:"Sénégal"},        transport:"boat",     initChecked:[true,true,true,false,false] },
  { id:"r3", origin:{flag:"🇹🇷",name:"Turquie"}, dest:{flag:"🇬🇭",name:"Ghana"},           transport:"airplane", initChecked:[true,false,false,false,false] },
];

/* ── Client shipments (Commandes view — each person linked to a route) ── */
const COMMANDES_CLIENTS = [
  { id:"c1", originName:"Chine",   destName:"Côte d'Ivoire", name:"Ibrahim Traoré", initials:"IT", color:"#60A5FA" },
  { id:"c2", originName:"Chine",   destName:"Côte d'Ivoire", name:"Mamadou Diallo", initials:"MD", color:"#F59E0B" },
  { id:"c3", originName:"France",  destName:"Sénégal",       name:"Aïssatou Ba",    initials:"AB", color:"#A855F7" },
  { id:"c4", originName:"Turquie", destName:"Ghana",         name:"Kofi Mensah",    initials:"KM", color:"#22D3EE" },
  { id:"c5", originName:"Turquie", destName:"Ghana",         name:"Fatou Konaté",   initials:"FK", color:"#34D399" },
];

const INIT_CHECKED_MAP: Record<string,boolean[]> = Object.fromEntries(
  SHARED_ROUTES.map(r => [r.id, [...r.initChecked]])
);

function GestionProduitsView({ isDark, dynCARD, dynText, dynSub, dynBG, dynBorder, checkedMap, onToggleStep,
  originCountries, expoCountries, userRoutes, onAddRoute, onRemoveRoute, onUpdateRoute }: {
  isDark:boolean; dynCARD:string; dynText:string; dynSub:string; dynBG:string; dynBorder:string;
  checkedMap: Record<string,boolean[]>; onToggleStep: (routeId:string, stepIdx:number) => void;
  originCountries: string[]; expoCountries: string[];
  userRoutes: UserRoute[];
  onAddRoute: () => void;
  onRemoveRoute: (id:string) => void;
  onUpdateRoute: (id:string, patch:Partial<UserRoute>) => void;
}) {
  const TEAL = "#22D3EE";
  type DropKey = { routeId:string; side:"origin"|"dest" };
  const [activeDrop, setActiveDrop] = React.useState<DropKey|null>(null);
  const [dupError,   setDupError]   = React.useState<string|null>(null); // routeId with duplicate error

  const toggleDrop = (routeId:string, side:"origin"|"dest") => {
    setActiveDrop(prev =>
      prev && prev.routeId === routeId && prev.side === side ? null : { routeId, side }
    );
  };
  const closeDrop = () => setActiveDrop(null);

  /* Check for duplicate before applying country selection */
  const trySelectCountry = (routeId:string, side:"origin"|"dest", country:{flag:string;name:string}) => {
    const current = userRoutes.find(r => r.id === routeId);
    const newOrigin = side === "origin" ? country : current?.origin;
    const newDest   = side === "dest"   ? country : current?.dest;
    if (newOrigin && newDest) {
      const isDup = userRoutes.some(r =>
        r.id !== routeId &&
        r.origin?.name === newOrigin.name &&
        r.dest?.name   === newDest.name
      );
      if (isDup) {
        setDupError(routeId);
        setTimeout(() => setDupError(null), 3500);
        closeDrop();
        return;
      }
    }
    onUpdateRoute(routeId, side === "origin" ? { origin: country } : { dest: country });
    closeDrop();
  };

  /* origin list = pays d'origine sélectionnés dans Accueil */
  const originList = WESTERN_COUNTRIES.filter(c => originCountries.includes(c.name));
  /* dest list = pays d'exposition sélectionnés dans Accueil */
  const destList   = SOURCE_COUNTRIES.filter(c => expoCountries.includes(c.name));

  return (
    <ScrollView
      style={{ flex:1 }}
      contentContainerStyle={{ padding:10, gap:10, paddingBottom:30 }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* ── Header + bouton "+" ── */}
      <View style={{ flexDirection:"row", alignItems:"center", gap:8 }}>
        <View style={[gp.header, { flex:1, backgroundColor: isDark?"#0A1F22":"#F0FDFF", borderColor: TEAL+"33" }]}>
          <View style={[gp.headerIcon, { backgroundColor: TEAL+"20" }]}>
            <Ionicons name="cube-outline" size={18} color={TEAL} />
          </View>
          <View style={{ flex:1 }}>
            <Text style={[gp.headerTitle, { color: dynText }]}>Gestion des flux</Text>
            <Text style={[gp.headerSub, { color: dynSub }]}>
              {userRoutes.length === 0 ? "Créez votre premier flux" : `${userRoutes.length} flux actif${userRoutes.length>1?"s":""}`}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={[gp.addBtn, { backgroundColor: TEAL }]}
          onPress={onAddRoute}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* ── Aide si vide ── */}
      {userRoutes.length === 0 && (
        <View style={[gp.emptyBox, { backgroundColor: dynCARD, borderColor: dynBorder }]}>
          <Ionicons name="git-compare-outline" size={32} color={TEAL} />
          <Text style={[gp.emptyTitle, { color: dynText }]}>Aucun flux créé</Text>
          <Text style={[gp.emptySub, { color: dynSub }]}>
            Appuyez sur{" "}<Text style={{ color: TEAL, fontFamily:"Poppins_600SemiBold" }}>+</Text>{" "}pour créer un flux d'importation
          </Text>
          {originCountries.length === 0 && (
            <Text style={[gp.emptyHint, { color: "#F59E0B" }]}>
              ⚠️ Sélectionnez d'abord vos pays d'origine dans l'Accueil
            </Text>
          )}
          {expoCountries.length === 0 && (
            <Text style={[gp.emptyHint, { color: "#F59E0B" }]}>
              ⚠️ Sélectionnez vos pays d'exposition dans l'Accueil
            </Text>
          )}
        </View>
      )}

      {/* ── Cards ── */}
      {userRoutes.map((prod) => {
        const checked = checkedMap[prod.id] ?? [false,false,false,false,false];
        const lastChecked = checked.lastIndexOf(true);
        const progress = lastChecked < 0 ? 0 : (lastChecked + 1) / GP_STEPS.length;
        const currentStatus = lastChecked >= 0 ? GP_STEPS[lastChecked] : "En attente";
        const statusColor = GP_STATUS_COLORS[currentStatus] ?? "#94A3B8";
        const transportIcon = prod.transport === "airplane" ? "airplane-outline" : "boat-outline";
        const isComplete = prod.origin !== null && prod.dest !== null;
        const showOriginDrop = activeDrop?.routeId === prod.id && activeDrop?.side === "origin";
        const showDestDrop   = activeDrop?.routeId === prod.id && activeDrop?.side === "dest";

        return (
          <View key={prod.id} style={[gp.card, { backgroundColor: dynCARD, borderColor: dynBorder }]}>

            {/* ── Titre + statut + supprimer ── */}
            <View style={gp.clientRow}>
              <View style={[gp.routeBadge, { backgroundColor: TEAL+"18", borderColor: TEAL+"33" }]}>
                <Ionicons name={transportIcon as any} size={13} color={TEAL} />
              </View>
              <View style={{ flex:1 }}>
                <Text style={[gp.clientName, { color: dynText }]}>
                  {isComplete ? `${prod.origin!.name} → ${prod.dest!.name}` : "Nouveau flux"}
                </Text>
                <Text style={[gp.routeSub, { color: dynSub }]}>
                  {isComplete ? `Avion · ${Math.round(progress*100)}% complété` : "Choisissez les pays de départ et d'arrivée"}
                </Text>
              </View>
              {isComplete && (
                <View style={[gp.statusChip, { backgroundColor: statusColor+"18", borderColor: statusColor+"44" }]}>
                  <Ionicons name={GP_ICONS[currentStatus] as any} size={10} color={statusColor} />
                  <Text style={[gp.statusText, { color: statusColor }]}>{currentStatus}</Text>
                </View>
              )}
              <TouchableOpacity onPress={() => onRemoveRoute(prod.id)} style={gp.deleteBtn} activeOpacity={0.7}>
                <Ionicons name="trash-outline" size={14} color="#F87171" />
              </TouchableOpacity>
            </View>

            {/* ── Transport toggle ── */}
            <View style={gp.transportRow}>
              <Text style={[gp.colLabel, { color: dynSub }]}>TRANSPORT</Text>
              <View style={{ flexDirection:"row", gap:6 }}>
                {(["airplane","boat"] as const).map(t => (
                  <TouchableOpacity
                    key={t}
                    style={[gp.transportBtn, { borderColor: prod.transport===t ? TEAL : dynBorder, backgroundColor: prod.transport===t ? TEAL+"18" : "transparent" }]}
                    onPress={() => onUpdateRoute(prod.id, { transport:t })}
                    activeOpacity={0.75}
                  >
                    <Ionicons name={t==="airplane" ? "airplane-outline" : "boat-outline"} size={12} color={prod.transport===t ? TEAL : dynSub} />
                    <Text style={[gp.transportLabel, { color: prod.transport===t ? TEAL : dynSub }]}>{t==="airplane" ? "Avion" : "Bateau"}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* ── Sélecteur pays (origine + dest) ── */}
            <View style={gp.routeRow}>
              {/* Origine */}
              <View style={{ flex:1 }}>
                <TouchableOpacity
                  style={[gp.countryPicker, { backgroundColor: dynBG, borderColor: showOriginDrop ? TEAL : dynBorder }]}
                  onPress={() => toggleDrop(prod.id, "origin")}
                  activeOpacity={0.8}
                >
                  {prod.origin
                    ? <><Text style={{ fontSize:14 }}>{prod.origin.flag}</Text>
                        <Text style={[gp.pickerText, { color: dynText }]}>{prod.origin.name}</Text></>
                    : <><Ionicons name="add-circle-outline" size={14} color={TEAL} />
                        <Text style={[gp.pickerPlaceholder, { color: TEAL }]}>Départ</Text></>
                  }
                  <Ionicons name={showOriginDrop ? "chevron-up" : "chevron-down"} size={12} color={dynSub} />
                </TouchableOpacity>
                {showOriginDrop && (
                  <View style={[gp.dropdown, { backgroundColor: dynCARD, borderColor: TEAL+"44" }]}>
                    {originList.length === 0
                      ? <Text style={[gp.dropEmpty, { color: dynSub }]}>Aucun pays sélectionné dans l'Accueil</Text>
                      : originList.map(c => (
                          <TouchableOpacity key={c.name} style={gp.dropItem}
                            onPress={() => trySelectCountry(prod.id, "origin", { flag:c.flag, name:c.name })}
                            activeOpacity={0.75}
                          >
                            <Text style={{ fontSize:14 }}>{c.flag}</Text>
                            <Text style={[gp.dropItemText, { color: dynText }]}>{c.name}</Text>
                            {prod.origin?.name === c.name && <Ionicons name="checkmark" size={12} color={TEAL} />}
                          </TouchableOpacity>
                        ))
                    }
                  </View>
                )}
              </View>

              {/* Flèche centre */}
              <View style={{ paddingTop:8 }}>
                <Ionicons name="arrow-forward" size={14} color={dynSub} />
              </View>

              {/* Destination */}
              <View style={{ flex:1 }}>
                <TouchableOpacity
                  style={[gp.countryPicker, { backgroundColor: dynBG, borderColor: showDestDrop ? "#A855F7" : dynBorder }]}
                  onPress={() => toggleDrop(prod.id, "dest")}
                  activeOpacity={0.8}
                >
                  {prod.dest
                    ? <><Text style={{ fontSize:14 }}>{prod.dest.flag}</Text>
                        <Text style={[gp.pickerText, { color: dynText }]}>{prod.dest.name}</Text></>
                    : <><Ionicons name="add-circle-outline" size={14} color="#A855F7" />
                        <Text style={[gp.pickerPlaceholder, { color: "#A855F7" }]}>Arrivée</Text></>
                  }
                  <Ionicons name={showDestDrop ? "chevron-up" : "chevron-down"} size={12} color={dynSub} />
                </TouchableOpacity>
                {showDestDrop && (
                  <View style={[gp.dropdown, { backgroundColor: dynCARD, borderColor: "#A855F744" }]}>
                    {destList.length === 0
                      ? <Text style={[gp.dropEmpty, { color: dynSub }]}>Aucun pays sélectionné dans l'Accueil</Text>
                      : destList.map(c => (
                          <TouchableOpacity key={c.name} style={gp.dropItem}
                            onPress={() => trySelectCountry(prod.id, "dest", { flag:c.flag, name:c.name })}
                            activeOpacity={0.75}
                          >
                            <Text style={{ fontSize:14 }}>{c.flag}</Text>
                            <Text style={[gp.dropItemText, { color: dynText }]}>{c.name}</Text>
                            {prod.dest?.name === c.name && <Ionicons name="checkmark" size={12} color="#A855F7" />}
                          </TouchableOpacity>
                        ))
                    }
                  </View>
                )}
              </View>
            </View>

            {/* ── Erreur doublon ── */}
            {dupError === prod.id && (
              <View style={[gp.dupBanner, { backgroundColor:"#FEF2F2", borderColor:"#FECACA" }]}>
                <Ionicons name="alert-circle" size={14} color="#EF4444" />
                <Text style={[gp.dupText, { color:"#EF4444" }]}>Flux déjà créé — ce trajet existe déjà</Text>
              </View>
            )}

            {/* ── Tracker + étapes (seulement si flux complet) ── */}
            {isComplete && (
              <>
                {/* Route bar */}
                <View style={gp.routeRow}>
                  <View style={gp.routeEnd}>
                    <Text style={gp.routeFlag}>{prod.origin!.flag}</Text>
                    <Text style={[gp.routeCountry, { color: dynSub }]}>{prod.origin!.name}</Text>
                  </View>
                  <View style={gp.routeTrack}>
                    <View style={[gp.routeLine, { backgroundColor: isDark?"rgba(255,255,255,0.1)":"rgba(0,0,0,0.09)" }]}>
                      <View style={[gp.routeFill, { width:`${progress*100}%` as any, backgroundColor: TEAL }]} />
                      <View style={[gp.routeIconWrap, { left:`${Math.max(2, Math.min(progress*100-8, 84))}%` as any }]}>
                        <View style={[gp.routeIconBg, { backgroundColor: TEAL }]}>
                          <Ionicons name={transportIcon as any} size={8} color="#fff" />
                        </View>
                      </View>
                    </View>
                    <Text style={[gp.routePct, { color: TEAL }]}>{Math.round(progress*100)}%</Text>
                  </View>
                  <View style={gp.routeEnd}>
                    <Text style={gp.routeFlag}>{prod.dest!.flag}</Text>
                    <Text style={[gp.routeCountry, { color: dynSub }]}>{prod.dest!.name}</Text>
                  </View>
                </View>

                {/* Steps + live */}
                <View style={gp.body}>
                  <View style={gp.stepsCol}>
                    <Text style={[gp.colLabel, { color: dynSub }]}>ÉTAPES</Text>
                    {GP_STEPS.map((step, i) => {
                      const done = checked[i];
                      const current = i === lastChecked;
                      return (
                        <TouchableOpacity key={step} style={gp.stepRow} onPress={() => onToggleStep(prod.id, i)} activeOpacity={0.7}>
                          {i > 0 && <View style={[gp.connector, { backgroundColor: checked[i-1] ? TEAL : (isDark?"#1E293B":"#E2E8F0") }]} />}
                          <View style={[gp.stepCheck,
                            done ? { backgroundColor: TEAL, borderColor: TEAL } : { backgroundColor:"transparent", borderColor: isDark?"#334155":"#CBD5E1" },
                            current && { shadowColor: TEAL, shadowOpacity:0.5, shadowRadius:4, shadowOffset:{width:0,height:0}, elevation:3 }
                          ]}>
                            {done && <Ionicons name="checkmark" size={9} color="#fff" />}
                          </View>
                          <Text style={[gp.stepLabel, { color: done ? dynText : dynSub, fontFamily: current?"Poppins_600SemiBold":"Poppins_400Regular" }]}>{step}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                  <View style={[gp.colDivider, { backgroundColor: dynBorder }]} />
                  <View style={gp.liveCol}>
                    <Text style={[gp.colLabel, { color: dynSub }]}>EN TEMPS RÉEL</Text>
                    <View style={[gp.liveCard, { backgroundColor: statusColor+"12", borderColor: statusColor+"33" }]}>
                      <View style={[gp.liveDot, { backgroundColor: statusColor }]} />
                      <Text style={[gp.liveStatus, { color: statusColor }]}>{currentStatus}</Text>
                    </View>
                    <View style={gp.liveDetails}>
                      <Text style={[gp.liveLoc, { color: dynSub }]}>📍 {
                        lastChecked < 0 ? prod.origin!.name :
                        lastChecked >= GP_STEPS.length-1 ? prod.dest!.name :
                        `Entre ${prod.origin!.name} et ${prod.dest!.name}`
                      }</Text>
                      <View style={[gp.progressPill, { backgroundColor: isDark?"#1E293B":"#F1F5F9" }]}>
                        <View style={[gp.progressFillPill, { width:`${progress*100}%` as any, backgroundColor: statusColor }]} />
                      </View>
                      <Text style={[gp.liveStep, { color: dynSub }]}>{lastChecked+1}/{GP_STEPS.length} étapes</Text>
                    </View>
                  </View>
                </View>
              </>
            )}
          </View>
        );
      })}
    </ScrollView>
  );
}

const gp = StyleSheet.create({
  header:      { flexDirection:"row", alignItems:"center", gap:10, borderRadius:12, borderWidth:1, padding:10 },
  headerIcon:  { width:32, height:32, borderRadius:16, alignItems:"center", justifyContent:"center" },
  headerTitle: { fontFamily:"Poppins_700Bold", fontSize:12 },
  headerSub:   { fontFamily:"Poppins_400Regular", fontSize:9 },

  card:        { borderRadius:14, borderWidth:1, padding:10, gap:8 },
  clientRow:   { flexDirection:"row", alignItems:"center", gap:8 },
  avatar:      { width:28, height:28, borderRadius:14, alignItems:"center", justifyContent:"center" },
  avatarText:  { fontFamily:"Poppins_700Bold", fontSize:10 },
  clientName:  { flex:1, fontFamily:"Poppins_700Bold", fontSize:12 },
  statusChip:  { flexDirection:"row", alignItems:"center", gap:4, borderRadius:20, borderWidth:1, paddingHorizontal:7, paddingVertical:3 },
  statusText:  { fontFamily:"Poppins_600SemiBold", fontSize:9 },

  routeRow:    { flexDirection:"row", alignItems:"center", gap:6 },
  routeEnd:    { alignItems:"center", gap:1 },
  routeFlag:   { fontSize:16 },
  routeCountry:{ fontFamily:"Poppins_500Medium", fontSize:8 },
  routeTrack:  { flex:1, gap:3 },
  routeLine:   { height:3, borderRadius:2, overflow:"visible", position:"relative" },
  routeFill:   { height:"100%", borderRadius:2 },
  routeIconWrap:{ position:"absolute", top:-7 },
  routeIconBg: { width:17, height:17, borderRadius:9, alignItems:"center", justifyContent:"center" },
  routePct:    { fontFamily:"Poppins_600SemiBold", fontSize:8, textAlign:"center" },
  routeBadge:  { width:30, height:30, borderRadius:15, borderWidth:1, alignItems:"center", justifyContent:"center" },
  routeSub:    { fontFamily:"Poppins_400Regular", fontSize:9 },

  body:        { flexDirection:"row", gap:10 },
  stepsCol:    { flex:1.1, gap:0 },
  colLabel:    { fontFamily:"Poppins_700Bold", fontSize:8, letterSpacing:0.8, marginBottom:4 },
  stepRow:     { flexDirection:"row", alignItems:"center", gap:6, paddingVertical:3, position:"relative" },
  connector:   { position:"absolute", left:7, bottom:"100%", width:2, height:6 },
  stepCheck:   { width:16, height:16, borderRadius:8, borderWidth:1.5, alignItems:"center", justifyContent:"center" },
  stepLabel:   { fontSize:10, flex:1 },

  colDivider:  { width:1, marginVertical:4 },
  liveCol:     { flex:1, gap:6 },
  liveCard:    { flexDirection:"row", alignItems:"center", gap:6, borderRadius:8, borderWidth:1, padding:7 },
  liveDot:     { width:6, height:6, borderRadius:3 },
  liveStatus:  { fontFamily:"Poppins_700Bold", fontSize:11 },
  liveDetails: { gap:4 },
  liveLoc:     { fontFamily:"Poppins_400Regular", fontSize:9 },
  progressPill:{ height:3, borderRadius:2, overflow:"hidden" },
  progressFillPill:{ height:"100%", borderRadius:2 },
  liveStep:    { fontFamily:"Poppins_400Regular", fontSize:9 },

  addBtn:      { width:40, height:40, borderRadius:20, alignItems:"center", justifyContent:"center" },
  deleteBtn:   { width:26, height:26, borderRadius:13, alignItems:"center", justifyContent:"center", marginLeft:2 },
  emptyBox:    { borderRadius:14, borderWidth:1, padding:24, alignItems:"center", gap:8 },
  emptyTitle:  { fontFamily:"Poppins_700Bold", fontSize:13 },
  emptySub:    { fontFamily:"Poppins_400Regular", fontSize:11, textAlign:"center" },
  emptyHint:   { fontFamily:"Poppins_400Regular", fontSize:10, textAlign:"center" },

  transportRow:  { flexDirection:"row", alignItems:"center", justifyContent:"space-between" },
  transportBtn:  { flexDirection:"row", alignItems:"center", gap:4, borderRadius:8, borderWidth:1, paddingHorizontal:8, paddingVertical:4 },
  transportLabel:{ fontFamily:"Poppins_500Medium", fontSize:10 },

  countryPicker: { flexDirection:"row", alignItems:"center", gap:5, borderRadius:10, borderWidth:1, paddingHorizontal:8, paddingVertical:7, minHeight:34 },
  pickerText:    { fontFamily:"Poppins_600SemiBold", fontSize:10, flex:1 },
  pickerPlaceholder:{ fontFamily:"Poppins_500Medium", fontSize:10, flex:1 },

  dropdown:      { borderRadius:10, borderWidth:1, marginTop:4, overflow:"hidden", maxHeight:180 },
  dropEmpty:     { fontFamily:"Poppins_400Regular", fontSize:10, padding:10, textAlign:"center" },
  dropItem:      { flexDirection:"row", alignItems:"center", gap:7, paddingHorizontal:10, paddingVertical:8, borderBottomWidth:0 },
  dropItemText:  { fontFamily:"Poppins_500Medium", fontSize:11, flex:1 },

  dupBanner:     { flexDirection:"row", alignItems:"center", gap:6, borderRadius:8, borderWidth:1, padding:8 },
  dupText:       { fontFamily:"Poppins_600SemiBold", fontSize:11, flex:1 },
});

/* ─────── Collaborateur View ─────── */
const GROUP_MEMBERS = [
  { id: "m1", name: "Mamadou Diallo",   initials: "MD", color: "#F59E0B", role: "Acheteur"    },
  { id: "m2", name: "Fatou Konaté",     initials: "FK", color: "#34D399", role: "Revendeur"   },
  { id: "m3", name: "Ibrahim Traoré",   initials: "IT", color: "#60A5FA", role: "Importateur" },
  { id: "m4", name: "Awa Balde",        initials: "AB", color: "#F472B6", role: "Logistique"  },
  { id: "m5", name: "Oumar Sow",        initials: "OS", color: "#FB923C", role: "Commercial"  },
];

const COLLAB_ROLES = ["Gestionnaire", "Comptable", "Livreur", "Assistant", "Commercial"];

function CollaborateurView({ isDark, dynCARD, dynText, dynSub, dynBG, dynBorder }: {
  isDark:boolean; dynCARD:string; dynText:string; dynSub:string; dynBG:string; dynBorder:string;
}) {
  const GOLD = "#FBBF24";
  const [query,   setQuery]   = React.useState("");
  const [collabs, setCollabs] = React.useState<string[]>([]);
  const [roleMap, setRoleMap] = React.useState<Record<string, string>>({});
  const [rolePickId, setRolePickId] = React.useState<string | null>(null);

  const filtered = GROUP_MEMBERS.filter(m =>
    m.name.toLowerCase().includes(query.toLowerCase())
  );

  const addCollab = (id: string) => {
    if (!collabs.includes(id)) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setCollabs(prev => [...prev, id]);
      setRoleMap(prev => ({ ...prev, [id]: "Gestionnaire" }));
    }
  };

  const removeCollab = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCollabs(prev => prev.filter(c => c !== id));
    setRolePickId(null);
  };

  const activeCollabs = GROUP_MEMBERS.filter(m => collabs.includes(m.id));

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ padding: 12, gap: 12, paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* ── Header ── */}
      <View style={[col.header, { backgroundColor: isDark?"#1C1A08":"#FFFBEB", borderColor: GOLD+"33" }]}>
        <View style={[col.headerIcon, { backgroundColor: GOLD+"22" }]}>
          <Ionicons name="people-outline" size={18} color={GOLD} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[col.headerTitle, { color: dynText }]}>Ajouter un collaborateur</Text>
          <Text style={[col.headerSub, { color: dynSub }]}>Sélectionnez des membres du groupe</Text>
        </View>
        <View style={[col.badge, { backgroundColor: GOLD+"22" }]}>
          <Text style={[col.badgeText, { color: GOLD }]}>{collabs.length} actif{collabs.length > 1 ? "s" : ""}</Text>
        </View>
      </View>

      {/* ── Collaborateurs actifs ── */}
      {activeCollabs.length > 0 && (
        <View style={[col.section, { backgroundColor: dynCARD, borderColor: dynBorder }]}>
          <View style={col.sectionTop}>
            <Ionicons name="checkmark-circle" size={14} color="#34D399" />
            <Text style={[col.sectionTitle, { color: dynText }]}>Collaborateurs actifs</Text>
          </View>
          {activeCollabs.map(m => (
            <View key={m.id} style={[col.activeRow, { borderBottomColor: dynBorder }]}>
              <View style={[col.avatar, { backgroundColor: m.color+"22" }]}>
                <Text style={[col.avatarText, { color: m.color }]}>{m.initials}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[col.memberName, { color: dynText }]}>{m.name}</Text>
                <TouchableOpacity
                  onPress={() => setRolePickId(rolePickId === m.id ? null : m.id)}
                  activeOpacity={0.7}
                  style={col.roleBtn}
                >
                  <Text style={[col.roleBtnText, { color: GOLD }]}>{roleMap[m.id] ?? "Gestionnaire"}</Text>
                  <Ionicons name="chevron-down" size={10} color={GOLD} />
                </TouchableOpacity>
                {/* Role picker dropdown */}
                {rolePickId === m.id && (
                  <View style={[col.rolePicker, { backgroundColor: dynCARD, borderColor: dynBorder }]}>
                    {COLLAB_ROLES.map(r => (
                      <TouchableOpacity
                        key={r}
                        style={[col.roleOption, { borderBottomColor: dynBorder }]}
                        onPress={() => {
                          Haptics.selectionAsync();
                          setRoleMap(prev => ({ ...prev, [m.id]: r }));
                          setRolePickId(null);
                        }}
                        activeOpacity={0.7}
                      >
                        <Text style={[col.roleOptionText, { color: roleMap[m.id] === r ? GOLD : dynText }]}>{r}</Text>
                        {roleMap[m.id] === r && <Ionicons name="checkmark" size={12} color={GOLD} />}
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
              <TouchableOpacity onPress={() => removeCollab(m.id)} activeOpacity={0.7} style={col.removeBtn}>
                <Ionicons name="close-circle" size={18} color="#EF4444" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {/* ── Search ── */}
      <View style={[col.searchWrap, { backgroundColor: dynCARD, borderColor: isDark?"rgba(255,255,255,0.08)":"rgba(0,0,0,0.08)" }]}>
        <Ionicons name="search-outline" size={15} color={dynSub} />
        <TextInput
          style={[col.searchInput, { color: dynText }]}
          placeholder="Rechercher dans le groupe…"
          placeholderTextColor={dynSub}
          value={query}
          onChangeText={setQuery}
          clearButtonMode="while-editing"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery("")} activeOpacity={0.7}>
            <Ionicons name="close-circle" size={15} color={dynSub} />
          </TouchableOpacity>
        )}
      </View>

      {/* ── Member list ── */}
      <View style={[col.section, { backgroundColor: dynCARD, borderColor: dynBorder }]}>
        <View style={col.sectionTop}>
          <Ionicons name="people-outline" size={14} color={dynSub} />
          <Text style={[col.sectionTitle, { color: dynText }]}>Membres du groupe ({filtered.length})</Text>
        </View>

        {filtered.length === 0 && (
          <View style={col.empty}>
            <Ionicons name="person-outline" size={28} color={dynSub} />
            <Text style={[col.emptyText, { color: dynSub }]}>Aucun résultat</Text>
          </View>
        )}

        {filtered.map((m, idx) => {
          const isCollab = collabs.includes(m.id);
          return (
            <View
              key={m.id}
              style={[col.memberRow,
                idx < filtered.length - 1 && { borderBottomWidth: 1, borderBottomColor: dynBorder }
              ]}
            >
              {/* Avatar */}
              <View style={[col.avatar, { backgroundColor: m.color+"22" }]}>
                <Text style={[col.avatarText, { color: m.color }]}>{m.initials}</Text>
              </View>

              {/* Info */}
              <View style={{ flex: 1 }}>
                <Text style={[col.memberName, { color: dynText }]}>{m.name}</Text>
                <Text style={[col.memberRole, { color: dynSub }]}>{m.role}</Text>
              </View>

              {/* Add / Added button */}
              {isCollab ? (
                <View style={[col.addedChip, { backgroundColor: "#34D39918", borderColor: "#34D39944" }]}>
                  <Ionicons name="checkmark" size={12} color="#34D399" />
                  <Text style={[col.addedText, { color: "#34D399" }]}>Ajouté</Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={[col.addBtn, { backgroundColor: GOLD+"18", borderColor: GOLD+"44" }]}
                  onPress={() => addCollab(m.id)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="person-add-outline" size={12} color={GOLD} />
                  <Text style={[col.addBtnText, { color: GOLD }]}>Ajouter</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

const col = StyleSheet.create({
  header:       { flexDirection:"row", alignItems:"center", gap:10, borderRadius:12, borderWidth:1, padding:10 },
  headerIcon:   { width:32, height:32, borderRadius:16, alignItems:"center", justifyContent:"center" },
  headerTitle:  { fontFamily:"Poppins_700Bold", fontSize:13 },
  headerSub:    { fontFamily:"Poppins_400Regular", fontSize:10 },
  badge:        { borderRadius:20, paddingHorizontal:8, paddingVertical:4 },
  badgeText:    { fontFamily:"Poppins_700Bold", fontSize:11 },

  section:      { borderRadius:14, borderWidth:1, overflow:"hidden" },
  sectionTop:   { flexDirection:"row", alignItems:"center", gap:7, padding:10, paddingBottom:6 },
  sectionTitle: { fontFamily:"Poppins_700Bold", fontSize:12 },

  activeRow:    { flexDirection:"row", alignItems:"center", gap:10, padding:10, borderBottomWidth:1 },
  roleBtn:      { flexDirection:"row", alignItems:"center", gap:3 },
  roleBtnText:  { fontFamily:"Poppins_600SemiBold", fontSize:10 },
  rolePicker:   { position:"absolute", top:22, left:0, zIndex:99, borderRadius:10, borderWidth:1, minWidth:130, overflow:"hidden", shadowColor:"#000", shadowOpacity:0.15, shadowRadius:8, shadowOffset:{width:0,height:4}, elevation:8 },
  roleOption:   { flexDirection:"row", alignItems:"center", justifyContent:"space-between", paddingHorizontal:12, paddingVertical:9, borderBottomWidth:1 },
  roleOptionText:{ fontFamily:"Poppins_500Medium", fontSize:12 },
  removeBtn:    { padding:2 },

  searchWrap:   { flexDirection:"row", alignItems:"center", gap:8, borderRadius:10, borderWidth:1, paddingHorizontal:10, paddingVertical:8 },
  searchInput:  { flex:1, fontFamily:"Poppins_400Regular", fontSize:12, padding:0 },

  memberRow:    { flexDirection:"row", alignItems:"center", gap:10, paddingHorizontal:10, paddingVertical:11 },
  avatar:       { width:36, height:36, borderRadius:18, alignItems:"center", justifyContent:"center" },
  avatarText:   { fontFamily:"Poppins_700Bold", fontSize:13 },
  memberName:   { fontFamily:"Poppins_700Bold", fontSize:13 },
  memberRole:   { fontFamily:"Poppins_400Regular", fontSize:10 },

  addBtn:       { flexDirection:"row", alignItems:"center", gap:4, borderRadius:20, borderWidth:1, paddingHorizontal:10, paddingVertical:5 },
  addBtnText:   { fontFamily:"Poppins_600SemiBold", fontSize:11 },
  addedChip:    { flexDirection:"row", alignItems:"center", gap:4, borderRadius:20, borderWidth:1, paddingHorizontal:10, paddingVertical:5 },
  addedText:    { fontFamily:"Poppins_600SemiBold", fontSize:11 },

  empty:        { alignItems:"center", paddingVertical:24, gap:8 },
  emptyText:    { fontFamily:"Poppins_500Medium", fontSize:12 },
});

/* ─────── Commandes en cours View ─────── */
/* Uses SHARED_ROUTES + checkedMap from ImportePage — no local data needed */

function ShipmentTracker({
  progress, transport, origin, dest, isDark, dynBorder,
}: {
  progress: number;
  transport: "airplane" | "boat";
  origin: { flag: string; name: string };
  dest: { flag: string; name: string };
  isDark: boolean;
  dynBorder: string;
}) {
  const trackColor = isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.1)";
  const fillColor  = "#A855F7";
  const iconName   = transport === "airplane" ? "airplane-outline" : "boat-outline";

  return (
    <View style={tr.wrap}>
      {/* Flags + labels */}
      <View style={tr.endpoints}>
        <View style={tr.endpoint}>
          <Text style={tr.flag}>{origin.flag}</Text>
          <Text style={tr.countryName}>{origin.name}</Text>
        </View>
        <View style={tr.endpoint}>
          <Text style={tr.flag}>{dest.flag}</Text>
          <Text style={tr.countryName}>{dest.name}</Text>
        </View>
      </View>

      {/* Track */}
      <View style={tr.trackRow}>
        {/* Dot origin */}
        <View style={[tr.dot, { backgroundColor: fillColor }]} />

        {/* Line container */}
        <View style={[tr.lineContainer, { backgroundColor: trackColor }]}>
          {/* Filled portion */}
          <View style={[tr.lineFill, { width: `${progress * 100}%` as any, backgroundColor: fillColor }]} />
          {/* Transport icon — float at progress position */}
          <View style={[tr.iconWrap, { left: `${Math.max(3, Math.min(progress * 100 - 6, 88))}%` as any }]}>
            <View style={[tr.iconBg, { backgroundColor: fillColor }]}>
              <Ionicons name={iconName as any} size={8} color="#fff" />
            </View>
          </View>
        </View>

        {/* Dot dest */}
        <View style={[tr.dot, { backgroundColor: progress >= 1 ? fillColor : trackColor, borderColor: progress >= 1 ? fillColor : (isDark ? "#334155" : "#CBD5E1"), borderWidth: 2 }]} />
      </View>

      {/* Progress % */}
      <Text style={[tr.pct, { color: fillColor }]}>{Math.round(progress * 100)}% en route</Text>
    </View>
  );
}

const tr = StyleSheet.create({
  wrap:        { gap: 4 },
  endpoints:   { flexDirection: "row", justifyContent: "space-between" },
  endpoint:    { alignItems: "center", gap: 2 },
  flag:        { fontSize: 15 },
  countryName: { fontFamily: "Poppins_500Medium", fontSize: 8, color: "#94A3B8" },
  trackRow:    { flexDirection: "row", alignItems: "center", gap: 3 },
  dot:         { width: 7, height: 7, borderRadius: 4 },
  lineContainer:{ flex: 1, height: 3, borderRadius: 2, overflow: "visible", position: "relative" },
  lineFill:    { height: "100%", borderRadius: 2 },
  iconWrap:    { position: "absolute", top: -9, },
  iconBg:      { width: 18, height: 18, borderRadius: 9, alignItems: "center", justifyContent: "center", shadowColor: "#A855F7", shadowOpacity: 0.3, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 2 },
  pct:         { fontFamily: "Poppins_600SemiBold", fontSize: 9, textAlign: "center" },
});

function CommandesEnCoursView({ isDark, dynCARD, dynText, dynSub, dynBG, dynBorder, checkedMap, userRoutes }: {
  isDark: boolean; dynCARD: string; dynText: string; dynSub: string; dynBG: string; dynBorder: string;
  checkedMap: Record<string,boolean[]>;
  userRoutes: UserRoute[];
}) {
  const ACCENT = "#A855F7";
  const [query, setQuery] = React.useState("");
  const filtered = COMMANDES_CLIENTS.filter((s) =>
    s.name.toLowerCase().includes(query.toLowerCase())
  );

  /* Find the user-created route matching a client's origin/dest */
  const findRoute = (originName: string, destName: string): UserRoute | null =>
    userRoutes.find(r => r.origin?.name === originName && r.dest?.name === destName) ?? null;

  /* Count active (complete) routes */
  const activeRoutes = userRoutes.filter(r => r.origin && r.dest).length;

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ padding: 10, gap: 8, paddingBottom: 30 }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* Header summary */}
      <View style={[cv.summaryBar, { backgroundColor: isDark ? "#1C1530" : "#F8F4FF", borderColor: ACCENT + "33" }]}>
        <View style={[cv.summaryIcon, { backgroundColor: ACCENT + "20" }]}>
          <Ionicons name="cube-outline" size={20} color={ACCENT} />
        </View>
        <View style={{ flex:1 }}>
          <Text style={[cv.summaryTitle, { color: dynText }]}>{COMMANDES_CLIENTS.length} colis en transit</Text>
          <Text style={[cv.summarySub, { color: dynSub }]}>
            {activeRoutes === 0
              ? "Créez un flux dans Gestion pour activer le suivi"
              : `${activeRoutes} flux actif${activeRoutes > 1 ? "s" : ""} · suivi en temps réel`}
          </Text>
        </View>
      </View>

      {/* Search bar */}
      <View style={[cv.searchWrap, { backgroundColor: dynCARD, borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)" }]}>
        <Ionicons name="search-outline" size={15} color={dynSub} />
        <TextInput
          style={[cv.searchInput, { color: dynText }]}
          placeholder="Rechercher un client…"
          placeholderTextColor={dynSub}
          value={query}
          onChangeText={setQuery}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery("")} activeOpacity={0.7}>
            <Ionicons name="close-circle" size={15} color={dynSub} />
          </TouchableOpacity>
        )}
      </View>

      {filtered.length === 0 && (
        <View style={cv.emptyWrap}>
          <Ionicons name="person-outline" size={32} color={dynSub} />
          <Text style={[cv.emptyText, { color: dynSub }]}>Aucun résultat pour « {query} »</Text>
        </View>
      )}

      {filtered.map((ship) => {
        const route = findRoute(ship.originName, ship.destName);
        const hasRoute = route !== null;
        const shipChecked = hasRoute ? (checkedMap[route!.id] ?? [false,false,false,false,false]) : [false,false,false,false,false];
        const lastChecked = shipChecked.lastIndexOf(true);
        const progress = lastChecked < 0 ? 0 : (lastChecked + 1) / GP_STEPS.length;
        return (
        <View key={ship.id} style={[cv.card, { backgroundColor: dynCARD, borderColor: hasRoute ? dynBorder : "#F59E0B33" }]}>
          {/* Client row */}
          <View style={cv.clientRow}>
            <View style={[cv.avatar, { backgroundColor: ship.color + "22" }]}>
              <Text style={[cv.avatarText, { color: ship.color }]}>{ship.initials}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[cv.clientName, { color: dynText }]}>{ship.name}</Text>
            </View>
            {/* Live status chip */}
            {lastChecked >= 0 && (
              <View style={[cv.liveChip, { backgroundColor: (GP_STATUS_COLORS[GP_STEPS[lastChecked]] ?? ACCENT)+"18", borderColor: (GP_STATUS_COLORS[GP_STEPS[lastChecked]] ?? ACCENT)+"44" }]}>
                <Text style={[cv.liveChipText, { color: GP_STATUS_COLORS[GP_STEPS[lastChecked]] ?? ACCENT }]}>
                  {GP_STEPS[lastChecked]}
                </Text>
              </View>
            )}
          </View>

          {/* Flux tag (origin → dest) */}
          <View style={[cv.fluxTag, { backgroundColor: hasRoute ? "#22D3EE18" : "#F59E0B18", borderColor: hasRoute ? "#22D3EE33" : "#F59E0B44" }]}>
            <Ionicons name={hasRoute ? "git-compare-outline" : "time-outline"} size={10} color={hasRoute ? "#22D3EE" : "#F59E0B"} />
            <Text style={[cv.fluxTagText, { color: hasRoute ? "#22D3EE" : "#F59E0B" }]}>
              {hasRoute ? `${ship.originName} → ${ship.destName}` : `En attente du flux ${ship.originName} → ${ship.destName}`}
            </Text>
          </View>

          {/* Divider */}
          <View style={[cv.divider, { backgroundColor: dynBorder }]} />

          {/* Tracker — only if route active */}
          {hasRoute && (
            <ShipmentTracker
              progress={progress}
              transport={route!.transport as any}
              origin={route!.origin!}
              dest={route!.dest!}
              isDark={isDark}
              dynBorder={dynBorder}
            />
          )}
          {!hasRoute && (
            <View style={[cv.noRouteBox, { backgroundColor: isDark ? "#1C1200" : "#FFFBEB", borderColor: "#F59E0B33" }]}>
              <Text style={[cv.noRouteText, { color: "#F59E0B" }]}>
                Créez le flux «{ship.originName} → {ship.destName}» dans Gestion pour activer le suivi de ce colis.
              </Text>
            </View>
          )}

          {/* Steps — only if route active */}
          {hasRoute && (
            <View style={cv.stepsRow}>
              {GP_STEPS.map((step, i) => {
                const done    = shipChecked[i];
                const current = i === lastChecked;
                return (
                  <View key={step} style={cv.stepItem}>
                    <View style={[cv.stepDot, {
                      backgroundColor: done ? ACCENT : (isDark ? "#1E293B" : "#E5E7EB"),
                      borderColor: current ? ACCENT : "transparent",
                      borderWidth: current ? 2 : 0,
                    }]}>
                      {done && i < lastChecked && <Ionicons name="checkmark" size={8} color="#fff" />}
                      {current && <View style={[cv.stepDotInner, { backgroundColor: "#fff" }]} />}
                    </View>
                    <Text style={[cv.stepLabel, { color: done ? ACCENT : dynSub, fontFamily: current ? "Poppins_600SemiBold" : "Poppins_400Regular" }]}>
                      {step}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>
        );
      })}
    </ScrollView>
  );
}

const cv = StyleSheet.create({
  summaryBar:   { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 10, borderWidth: 1, padding: 8 },
  summaryIcon:  { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  summaryTitle: { fontFamily: "Poppins_700Bold", fontSize: 12 },
  summarySub:   { fontFamily: "Poppins_400Regular", fontSize: 9 },

  card:         { borderRadius: 12, borderWidth: 1, padding: 8, gap: 6 },
  clientRow:    { flexDirection: "row", alignItems: "center", gap: 7 },
  avatar:       { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  avatarText:   { fontFamily: "Poppins_700Bold", fontSize: 10 },
  clientName:   { fontFamily: "Poppins_700Bold", fontSize: 11 },
  productName:  { fontFamily: "Poppins_400Regular", fontSize: 9 },
  amountChip:   { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  amountText:   { fontFamily: "Poppins_700Bold", fontSize: 10 },
  divider:      { height: 1 },

  stepsRow:     { flexDirection: "row", justifyContent: "space-between" },
  stepItem:     { alignItems: "center", gap: 2, flex: 1 },
  stepDot:      { width: 11, height: 11, borderRadius: 6, alignItems: "center", justifyContent: "center" },
  stepDotInner: { width: 4, height: 4, borderRadius: 2 },
  stepLabel:    { fontSize: 7, textAlign: "center" },

  searchWrap:   { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 10, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 7 },
  searchInput:  { flex: 1, fontFamily: "Poppins_400Regular", fontSize: 12, padding: 0 },
  emptyWrap:    { alignItems: "center", paddingTop: 40, gap: 10 },
  emptyText:    { fontFamily: "Poppins_500Medium", fontSize: 12 },

  fluxTag:      { flexDirection:"row", alignItems:"center", gap:5, borderRadius:8, borderWidth:1, paddingHorizontal:8, paddingVertical:4 },
  fluxTagText:  { fontFamily:"Poppins_500Medium", fontSize:9, flex:1 },
  noRouteBox:   { borderRadius:8, borderWidth:1, padding:8 },
  noRouteText:  { fontFamily:"Poppins_400Regular", fontSize:10, lineHeight:15 },

  liveChip:     { borderRadius: 20, borderWidth: 1, paddingHorizontal: 7, paddingVertical: 2 },
  liveChipText: { fontFamily: "Poppins_600SemiBold", fontSize: 9 },
});

function StatCard({ icon, color, value, label, dynCARD, dynSub }: { icon: string; color: string; value: string; label: string; dynCARD?: string; dynSub?: string }) {
  return (
    <View style={[styles.statCard, { borderColor: color + "33", backgroundColor: dynCARD ?? CARD }]}>
      <Ionicons name={icon as any} size={18} color={color} />
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: dynSub ?? "#64748B" }]}>{label}</Text>
    </View>
  );
}

function QuickAction({ icon, color, label, dynCARD, dynSub, onPress }: { icon: string; color: string; label: string; dynCARD?: string; dynSub?: string; onPress?: () => void }) {
  return (
    <TouchableOpacity style={[styles.qaBtn, { borderColor: color + "33", backgroundColor: dynCARD ?? CARD }]} activeOpacity={0.75} onPress={onPress}>
      <View style={[styles.qaIcon, { backgroundColor: color + "22" }]}>
        <Ionicons name={icon as any} size={22} color={color} />
      </View>
      <Text style={[styles.qaLabel, { color: dynSub ?? "#94A3B8" }]}>{label}</Text>
    </TouchableOpacity>
  );
}

/* ─────── Generic placeholder ─────── */
function GenericView({ icon, color, title, sub }: { icon: string; color: string; title: string; sub: string }) {
  return (
    <View style={styles.genericCenter}>
      <View style={[styles.genericIcon, { backgroundColor: color + "22" }]}>
        <Ionicons name={icon as any} size={40} color={color} />
      </View>
      <Text style={styles.genericTitle}>{title}</Text>
      <Text style={styles.genericSub}>{sub}</Text>
      <View style={[styles.genericPill, { borderColor: color + "55" }]}>
        <Text style={[styles.genericPillText, { color }]}>En cours de développement</Text>
      </View>
    </View>
  );
}

/* ─────── Browse page (from Rayons) — contenu à venir ─────── */
function ImporteBrowsePage({ router, insets }: { router: any; insets: any }) {
  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <View style={styles.headerIconWrap}>
            <Ionicons name="airplane-outline" size={16} color={ACCENT} />
          </View>
          <Text style={styles.headerTitle}>Importés</Text>
        </View>
        <View style={{ width: 32 }} />
      </View>
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 14 }}>
        <View style={{ width: 72, height: 72, borderRadius: 22, backgroundColor: ACCENT + "22", alignItems: "center", justifyContent: "center" }}>
          <Ionicons name="airplane-outline" size={36} color={ACCENT} />
        </View>
        <Text style={{ fontFamily: "Poppins_700Bold", fontSize: 18, color: "#E2E8F0" }}>Importés</Text>
        <Text style={{ fontFamily: "Poppins_400Regular", fontSize: 14, color: "#64748B", textAlign: "center", paddingHorizontal: 40 }}>
          Cette section est en cours de développement.{"\n"}Bientôt disponible !
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },

  /* Header */
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.07)",
  },
  menuBtn: { padding: 6 },
  hamburger: { gap: 4.5, width: 22 },
  bar: { height: 2, borderRadius: 2 },
  barTop: { width: 22 },
  barMid: { width: 16 },
  barBot: { width: 22 },
  headerCenter: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 12,
  },
  headerIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: ACCENT + "22",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 16,
    color: "#F0F6FF",
    flex: 1,
  },
  backBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
  },

  /* Overlay */
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.55)",
    zIndex: 10,
  },

  /* Drawer */
  drawer: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    backgroundColor: "#111827",
    zIndex: 20,
    shadowColor: "#000",
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 20,
    borderRightWidth: 1,
    borderRightColor: "rgba(168,85,247,0.15)",
  },
  drawerHeader: {
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.07)",
    backgroundColor: ACCENT2 + "18",
  },
  drawerAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: ACCENT + "33",
    borderWidth: 2,
    borderColor: ACCENT + "88",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  drawerAvatarText: {
    fontFamily: "Poppins_700Bold",
    fontSize: 22,
    color: ACCENT,
  },
  drawerName: {
    fontFamily: "Poppins_700Bold",
    fontSize: 15,
    color: "#F0F6FF",
    marginBottom: 6,
    textAlign: "center",
  },
  drawerBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: ACCENT + "33",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  drawerBadgeText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 11,
    color: ACCENT,
  },
  drawerScroll: { flex: 1, paddingTop: 8 },
  drawerItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 13,
    marginHorizontal: 8,
    marginVertical: 1,
    borderRadius: 12,
    position: "relative",
  },
  drawerItemActive: { backgroundColor: "rgba(168,85,247,0.12)" },
  drawerItemIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  drawerItemLabel: {
    fontFamily: "Poppins_500Medium",
    fontSize: 14,
    color: "#94A3B8",
    flex: 1,
  },
  drawerBadgeDot: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
  },
  drawerBadgeDotText: {
    fontFamily: "Poppins_700Bold",
    fontSize: 10,
    color: "#fff",
  },
  drawerActiveBar: {
    position: "absolute",
    left: 8,
    top: "25%",
    bottom: "25%",
    width: 3,
    borderRadius: 2,
  },
  drawerDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.06)",
    marginHorizontal: 16,
    marginVertical: 8,
  },
  drawerFieldGroup: {
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 4,
    gap: 8,
  },
  drawerFieldGroupLabel: {
    fontSize: 10,
    fontFamily: "Poppins_600SemiBold",
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  drawerFieldWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    height: 40,
    gap: 8,
  },
  drawerFieldIcon: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  drawerFieldInput: {
    flex: 1,
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
  },
  drawerPaymentChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  drawerPayChip: {
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 11,
    paddingVertical: 5,
  },
  drawerPayChipText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 11,
  },
  drawerThemeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginHorizontal: 8,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  drawerThemeLabel: {
    fontFamily: "Poppins_500Medium",
    fontSize: 14,
    color: "#94A3B8",
    flex: 1,
  },

  /* Accueil */
  accueilScroll: { padding: 16, gap: 16 },
  welcomeCard: {
    backgroundColor: CARD,
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: ACCENT + "33",
    overflow: "hidden",
    gap: 10,
  },
  welcomeGlow: {
    position: "absolute",
    top: -40,
    left: "30%",
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: ACCENT + "25",
  },
  welcomeAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: ACCENT + "33",
    borderWidth: 2,
    borderColor: ACCENT + "88",
    alignItems: "center",
    justifyContent: "center",
  },
  welcomeAvatarText: {
    fontFamily: "Poppins_700Bold",
    fontSize: 26,
    color: ACCENT,
  },
  crownRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#F59E0B22",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  crownText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12,
    color: "#F59E0B",
  },
  welcomeTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 22,
    color: "#E2E8F0",
    textAlign: "center",
    lineHeight: 32,
  },
  welcomeName: {
    color: ACCENT,
    fontFamily: "Poppins_700Bold",
  },
  welcomeSub: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 20,
  },

  sectionLabel: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 11,
    color: "#475569",
    letterSpacing: 1.2,
  },

  /* Stats */
  statsRow: { flexDirection: "row", gap: 10 },
  statCard: {
    flex: 1,
    backgroundColor: CARD,
    borderRadius: 14,
    padding: 12,
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
  },
  statValue: {
    fontFamily: "Poppins_700Bold",
    fontSize: 16,
  },
  statLabel: {
    fontFamily: "Poppins_400Regular",
    fontSize: 10,
    color: "#64748B",
    textAlign: "center",
  },

  /* Quick actions */
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  qaBtn: {
    width: "47%",
    backgroundColor: CARD,
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
  },
  qaIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  qaLabel: {
    fontFamily: "Poppins_500Medium",
    fontSize: 12,
    color: "#94A3B8",
    textAlign: "center",
  },

  /* Markets */
  marketsCard: {
    backgroundColor: CARD,
    borderRadius: 16,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  marketRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  marketFlag: { fontSize: 22 },
  marketName: {
    fontFamily: "Poppins_500Medium",
    fontSize: 14,
    color: "#CBD5E1",
    flex: 1,
  },
  marketBadge: {
    backgroundColor: "#34D39922",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  marketBadgeText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 11,
    color: "#34D399",
  },
  addMarketBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingTop: 4,
  },
  addMarketText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 13,
    color: ACCENT,
  },

  /* Market section headers */
  marketToggleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  marketToggleBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1.5,
    borderColor: "#60A5FA66",
    alignItems: "center",
    justifyContent: "center",
  },
  marketSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  marketSectionIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  marketSectionTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 14,
    color: "#E2E8F0",
    flex: 1,
  },
  marketSectionSub: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    color: "#475569",
    width: "100%",
  },

  /* Expo input */
  expoInputWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#0D1117",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  expoInput: {
    flex: 1,
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: "#E2E8F0",
  },
  suggestionsBox: {
    backgroundColor: "#111827",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    overflow: "hidden",
  },
  suggestionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
  },
  suggestionFlag: { fontSize: 18 },
  suggestionName: {
    fontFamily: "Poppins_500Medium",
    fontSize: 14,
    color: "#CBD5E1",
    flex: 1,
  },

  /* Western quick chips */
  westernChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
  },
  westernChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#0D1117",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  westernChipFlag: { fontSize: 14 },
  westernChipName: {
    fontFamily: "Poppins_500Medium",
    fontSize: 12,
    color: "#94A3B8",
  },

  /* Selected expo countries */
  selectedExpoWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
  },
  selectedExpoChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#60A5FA18",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#60A5FA44",
  },
  selectedExpoFlag: { fontSize: 14 },
  selectedExpoName: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12,
    color: "#60A5FA",
  },

  /* Source countries */
  sourceGrid: {
    gap: 8,
  },
  sourceChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#0D1117",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  sourceChipActive: {
    borderColor: ACCENT + "55",
    backgroundColor: ACCENT + "10",
  },
  sourceChipFlag: { fontSize: 20 },
  sourceChipName: {
    fontFamily: "Poppins_500Medium",
    fontSize: 14,
    color: "#94A3B8",
    flex: 1,
  },
  sourceChipBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: ACCENT,
    alignItems: "center",
    justifyContent: "center",
  },
  sourceChipBtnActive: {
    backgroundColor: ACCENT,
    borderColor: ACCENT,
  },

  /* Generic placeholder */
  genericCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    gap: 14,
  },
  genericIcon: {
    width: 84,
    height: 84,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  genericTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 20,
    color: "#E2E8F0",
    textAlign: "center",
  },
  genericSub: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 22,
  },
  genericPill: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  genericPillText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 12,
  },
});
