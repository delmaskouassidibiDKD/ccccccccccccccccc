import React, { useState, useMemo } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Platform, TextInput, Alert, ActivityIndicator,
  KeyboardAvoidingView, Modal, FlatList, Switch,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { STATIC_CATEGORIES } from "./(tabs)/rayons";

/* ── Pays ── */
const COUNTRIES = [
  { code: "ALL", flag: "🌍", name: "Tous les pays" },
  { code: "CI",  flag: "🇨🇮", name: "Côte d'Ivoire" },
  { code: "SN",  flag: "🇸🇳", name: "Sénégal" },
  { code: "BJ",  flag: "🇧🇯", name: "Bénin" },
  { code: "TG",  flag: "🇹🇬", name: "Togo" },
  { code: "CM",  flag: "🇨🇲", name: "Cameroun" },
  { code: "ML",  flag: "🇲🇱", name: "Mali" },
  { code: "BF",  flag: "🇧🇫", name: "Burkina Faso" },
  { code: "GN",  flag: "🇬🇳", name: "Guinée" },
  { code: "CD",  flag: "🇨🇩", name: "Congo RDC" },
  { code: "CG",  flag: "🇨🇬", name: "Congo Brazzaville" },
  { code: "NE",  flag: "🇳🇪", name: "Niger" },
  { code: "TD",  flag: "🇹🇩", name: "Tchad" },
  { code: "GA",  flag: "🇬🇦", name: "Gabon" },
  { code: "MG",  flag: "🇲🇬", name: "Madagascar" },
  { code: "MR",  flag: "🇲🇷", name: "Mauritanie" },
];

/* ── Sections de menus vendeur ── */
type MenuKey = "vendeur" | "gastro" | "marche" | "supermarche" | "grossiste" | "importe" | "perso" | "svc-gastro";
const MENU_SECTIONS: { key: MenuKey; label: string; icon: string; color: string; always?: boolean }[] = [
  { key: "vendeur",     label: "Vendeur",              icon: "storefront-outline",    color: "#FF6B00", always: true },
  { key: "gastro",      label: "Gastronomie",           icon: "restaurant-outline",    color: "#EC4899" },
  { key: "marche",      label: "Marché",                icon: "basket-outline",        color: "#22C55E" },
  { key: "supermarche", label: "Super Marché",          icon: "cart-outline",          color: "#3B82F6" },
  { key: "grossiste",   label: "Grossiste",             icon: "cube-outline",          color: "#F59E0B" },
  { key: "importe",     label: "Importé",               icon: "airplane-outline",      color: "#8B5CF6" },
  { key: "perso",       label: "Personnalisation",      icon: "color-wand-outline",    color: "#06B6D4" },
  { key: "svc-gastro",  label: "Service Gastronomie",   icon: "sparkles-outline",      color: "#EF4444" },
];

/* ── Articles démo organisés par section ── */
type Article = { id: string; title: string; price: string; section: MenuKey };
const DEMO_ARTICLES: Article[] = [
  { id: "v1", title: "Pagne wax Java 6 yards",        price: "12 500 FCFA", section: "vendeur" },
  { id: "v2", title: "Sac à main cuir marron",        price: "8 000 FCFA",  section: "vendeur" },
  { id: "v3", title: "Casque audio Bluetooth",        price: "15 000 FCFA", section: "vendeur" },
  { id: "g1", title: "Poulet braisé sauce arachide",  price: "3 500 FCFA",  section: "gastro" },
  { id: "g2", title: "Attiéké poisson grillé",        price: "2 500 FCFA",  section: "gastro" },
  { id: "g3", title: "Thiéboudienne royal",           price: "4 000 FCFA",  section: "gastro" },
  { id: "m1", title: "Huile de palme rouge 5L",       price: "3 200 FCFA",  section: "marche" },
  { id: "m2", title: "Sac de riz local 25kg",         price: "18 000 FCFA", section: "marche" },
  { id: "m3", title: "Tomates fraîches 1kg",          price: "700 FCFA",    section: "marche" },
  { id: "sm1", title: "Lait concentré sucré x6",      price: "5 400 FCFA",  section: "supermarche" },
  { id: "sm2", title: "Jus de fruit tropicaux 1L",    price: "1 200 FCFA",  section: "supermarche" },
  { id: "gr1", title: "Carton de savon Omo 24u",      price: "28 000 FCFA", section: "grossiste" },
  { id: "gr2", title: "Carton biscuits Prince 12u",   price: "14 000 FCFA", section: "grossiste" },
  { id: "im1", title: "iPhone 15 Pro Max 256Go",      price: "850 000 FCFA", section: "importe" },
  { id: "im2", title: "Montre connectée Samsung",     price: "95 000 FCFA",  section: "importe" },
  { id: "p1",  title: "Broderie personnalisée boubou", price: "12 000 FCFA", section: "perso" },
  { id: "p2",  title: "Couture robe sur mesure",      price: "25 000 FCFA", section: "perso" },
  { id: "sg1", title: "Chef privé pour événement",    price: "75 000 FCFA", section: "svc-gastro" },
  { id: "sg2", title: "Traiteur mariage 100 pers.",   price: "250 000 FCFA", section: "svc-gastro" },
];

/* Sections "actives" simulées — en production, vient du profil vendeur */
const ACTIVE_SECTIONS: MenuKey[] = ["vendeur", "gastro", "marche", "supermarche"];

export default function VideoPublishSettings() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const paddingTop    = Platform.OS === "web" ? 0 : insets.top;
  const paddingBottom = Platform.OS === "web" ? 34 : insets.bottom;
  const params = useLocalSearchParams<{
    mode: string; videoUri: string; photos: string;
    soundTitle: string; soundArtist: string;
  }>();

  const [title,           setTitle]           = useState("");
  const [description,     setDescription]     = useState("");
  const [category,        setCategory]        = useState("");
  const [selectedCountry, setSelectedCountry] = useState("ALL");
  const [showCountries,   setShowCountries]   = useState(false);
  const [publishing,      setPublishing]      = useState(false);

  /* Article */
  const [articleEnabled,    setArticleEnabled]    = useState(true);
  const [showArticleModal,  setShowArticleModal]  = useState(false);
  const [selectedArticle,   setSelectedArticle]   = useState<Article | null>(null);
  const [articleSearch,     setArticleSearch]     = useState("");
  const [activeMenuFilter,  setActiveMenuFilter]  = useState<MenuKey | "all">("all");

  /* Catégorie */
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categorySearch,    setCategorySearch]    = useState("");

  const isVideo    = params.mode === "video";
  const photoCount = (() => { try { return JSON.parse(params.photos || "[]").length; } catch { return 0; } })();

  /* Sections visibles = toujours + celles actives */
  const visibleSections = MENU_SECTIONS.filter((s) => s.always || ACTIVE_SECTIONS.includes(s.key));

  /* Articles filtrés */
  const filteredArticles = useMemo(() => {
    const bySection = activeMenuFilter === "all"
      ? DEMO_ARTICLES.filter((a) => ACTIVE_SECTIONS.includes(a.section))
      : DEMO_ARTICLES.filter((a) => a.section === activeMenuFilter);
    if (!articleSearch.trim()) return bySection;
    const q = articleSearch.toLowerCase();
    return bySection.filter((a) => a.title.toLowerCase().includes(q));
  }, [activeMenuFilter, articleSearch]);

  const filteredCategoryItems = useMemo(() =>
    STATIC_CATEGORIES.filter((c) => c.name.toLowerCase().includes(categorySearch.toLowerCase())),
    [categorySearch]
  );

  const isReady = title.trim().length > 0 && (!articleEnabled || selectedArticle !== null);

  const handlePublish = async () => {
    const missing: string[] = [];
    if (!title.trim()) missing.push("• Ajouter un titre");
    if (articleEnabled && !selectedArticle) missing.push("• Associer un article");
    if (missing.length > 0) {
      Alert.alert("Champs requis", "Veuillez remplir :\n\n" + missing.join("\n"));
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setPublishing(true);
    await new Promise((r) => setTimeout(r, 1800));
    setPublishing(false);
    Alert.alert(
      "Publication réussie !",
      "Votre contenu a été envoyé et sera disponible dans quelques instants.",
      [{ text: "OK", onPress: () => router.push("/(tabs)" as any) }]
    );
  };

  const sectionMeta = (key: MenuKey) => MENU_SECTIONS.find((s) => s.key === key);

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={[s.container, { paddingTop }]}>

        {/* ── HEADER ── */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Paramètres</Text>
          <View style={s.stepBadge}>
            <Text style={s.stepText}>Étape 2/2</Text>
          </View>
        </View>

        {/* ── RÉSUMÉ CONTENU ── */}
        <View style={s.summary}>
          <View style={s.summaryIcon}>
            <Ionicons name={isVideo ? "videocam" : "images"} size={18} color="#FF6B00" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.summaryTitle}>
              {isVideo ? "Vidéo • 1 fichier" : `Photo Vidéo • ${photoCount} photos`}
            </Text>
            {!isVideo && params.soundTitle ? (
              <Text style={s.summarySound}>🎵 {params.soundTitle}</Text>
            ) : null}
          </View>
          <Ionicons name="checkmark-circle" size={20} color="#22C55E" />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[s.scroll, { paddingBottom: paddingBottom + 100 }]}
        >
          {/* ── ASSOCIER DES ARTICLES ── */}
          <View style={s.field}>
            {/* Toggle en-tête */}
            <View style={s.toggleRow}>
              <View style={{ flex: 1 }}>
                <Text style={s.label}>Associer des articles</Text>
                <Text style={s.toggleDesc}>{articleEnabled ? "Liez ce contenu à vos produits" : "Désactivé"}</Text>
              </View>
              <Switch
                value={articleEnabled}
                onValueChange={(v) => {
                  setArticleEnabled(v);
                  if (!v) setSelectedArticle(null);
                  Haptics.selectionAsync();
                }}
                trackColor={{ false: "#2D2D2D", true: "#FF6B0055" }}
                thumbColor={articleEnabled ? "#FF6B00" : "#4B5563"}
              />
            </View>

            {/* Picker article — visible uniquement si toggle ON */}
            {articleEnabled && (
              <TouchableOpacity
                style={[s.articleBtn, selectedArticle && s.articleBtnFilled]}
                onPress={() => { setShowArticleModal(true); setArticleSearch(""); setActiveMenuFilter("all"); Haptics.selectionAsync(); }}
                activeOpacity={0.8}
              >
                {selectedArticle ? (
                  <View style={s.articleSelected}>
                    <View style={[s.articleSelectedIcon, { backgroundColor: (sectionMeta(selectedArticle.section)?.color ?? "#FF6B00") + "20" }]}>
                      <Ionicons name={sectionMeta(selectedArticle.section)?.icon as any ?? "bag-handle"} size={20} color={sectionMeta(selectedArticle.section)?.color ?? "#FF6B00"} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.articleSelectedTitle} numberOfLines={1}>{selectedArticle.title}</Text>
                      <Text style={[s.articleSelectedMeta, { color: sectionMeta(selectedArticle.section)?.color ?? "#FF6B00" }]}>
                        {sectionMeta(selectedArticle.section)?.label} • {selectedArticle.price}
                      </Text>
                    </View>
                    <TouchableOpacity onPress={(e) => { e.stopPropagation(); setSelectedArticle(null); Haptics.selectionAsync(); }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      <Ionicons name="close-circle" size={20} color="#4B5563" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={s.articleEmpty}>
                    <View style={s.articleEmptyIcon}>
                      <Ionicons name="bag-add-outline" size={24} color="#FF6B00" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.articleEmptyTitle}>Choisir un article</Text>
                      <Text style={s.articleEmptyDesc}>Vendeur · Gastronomie · Marché · Super Marché…</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color="#4B5563" />
                  </View>
                )}
              </TouchableOpacity>
            )}
          </View>

          {/* ── TITRE ── */}
          <View style={s.field}>
            <Text style={s.label}>Titre <Text style={s.required}>*</Text></Text>
            <TextInput
              style={[s.input, title.length > 0 && s.inputFilled]}
              placeholder="Ex: Nouveaux pagnes wax arrivés..."
              placeholderTextColor="#4B5563"
              value={title}
              onChangeText={setTitle}
              maxLength={80}
            />
            <Text style={s.charCount}>{title.length}/80</Text>
          </View>

          {/* ── DESCRIPTION ── */}
          <View style={s.field}>
            <Text style={s.label}>Description</Text>
            <TextInput
              style={[s.input, s.inputMulti, description.length > 0 && s.inputFilled]}
              placeholder="Décrivez votre produit ou votre vidéo..."
              placeholderTextColor="#4B5563"
              value={description}
              onChangeText={setDescription}
              multiline numberOfLines={4}
              maxLength={500}
              textAlignVertical="top"
            />
            <Text style={s.charCount}>{description.length}/500</Text>
          </View>

          {/* ── CATÉGORIE ── */}
          <View style={s.field}>
            <Text style={s.label}>Catégorie <Text style={s.optionalTag}>(optionnel)</Text></Text>
            <View style={[s.categoryRow, category.length > 0 && s.inputFilled]}>
              <TextInput
                style={s.categoryInput}
                placeholder="Ex: Mode, Alimentation..."
                placeholderTextColor="#4B5563"
                value={category}
                onChangeText={setCategory}
                maxLength={60}
              />
              <TouchableOpacity
                style={s.categoryPickerBtn}
                onPress={() => { setShowCategoryModal(true); setCategorySearch(""); Haptics.selectionAsync(); }}
              >
                <Ionicons name="list" size={18} color="#FF6B00" />
              </TouchableOpacity>
            </View>
          </View>

          {/* ── DIFFUSION ── */}
          <View style={s.field}>
            <Text style={s.label}>Diffusion</Text>
            <TouchableOpacity
              style={[s.selector, s.selectorFilled]}
              onPress={() => { setShowCountries((v) => !v); Haptics.selectionAsync(); }}
              activeOpacity={0.85}
            >
              <Text style={s.selectorText}>
                {COUNTRIES.find((c) => c.code === selectedCountry)?.flag}{" "}
                {COUNTRIES.find((c) => c.code === selectedCountry)?.name}
              </Text>
              <Ionicons name={showCountries ? "chevron-up" : "chevron-down"} size={18} color="#9CA3AF" />
            </TouchableOpacity>
            {showCountries && (
              <View style={s.dropdown}>
                {COUNTRIES.map((c) => (
                  <TouchableOpacity
                    key={c.code}
                    style={[s.dropdownItem, selectedCountry === c.code && s.dropdownItemActive]}
                    onPress={() => { setSelectedCountry(c.code); setShowCountries(false); Haptics.selectionAsync(); }}
                  >
                    <Text style={s.dropdownText}>{c.flag} {c.name}</Text>
                    {selectedCountry === c.code && <Ionicons name="checkmark" size={16} color="#FF6B00" />}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </ScrollView>

        {/* ── BOUTON PUBLIER ── */}
        <View style={[s.bottomBar, { paddingBottom: paddingBottom + 12 }]}>
          <TouchableOpacity
            style={[s.publishBtn, !isReady && s.publishBtnDisabled]}
            onPress={handlePublish}
            disabled={publishing}
            activeOpacity={0.85}
          >
            {publishing
              ? <ActivityIndicator color="#fff" size="small" />
              : <>
                  <Ionicons name="cloud-upload-outline" size={20} color="#fff" />
                  <Text style={s.publishBtnText}>Publier maintenant</Text>
                </>
            }
          </TouchableOpacity>
        </View>
      </View>

      {/* ══ MODAL ARTICLES ══ */}
      <Modal visible={showArticleModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowArticleModal(false)}>
        <View style={[s.modalContainer, { paddingTop: insets.top > 0 ? 16 : 32 }]}>
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>Associer un article</Text>
            <TouchableOpacity onPress={() => setShowArticleModal(false)} style={s.modalClose}>
              <Ionicons name="close" size={22} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Barre de recherche */}
          <View style={s.modalSearch}>
            <Ionicons name="search-outline" size={18} color="#4B5563" />
            <TextInput
              style={s.modalSearchInput}
              placeholder="Rechercher un article..."
              placeholderTextColor="#4B5563"
              value={articleSearch}
              onChangeText={setArticleSearch}
            />
            {articleSearch.length > 0 && (
              <TouchableOpacity onPress={() => setArticleSearch("")}>
                <Ionicons name="close-circle" size={16} color="#4B5563" />
              </TouchableOpacity>
            )}
          </View>

          {/* Filtres par menu */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.sectionTabs}>
            <TouchableOpacity
              style={[s.sectionTab, activeMenuFilter === "all" && s.sectionTabActive]}
              onPress={() => { setActiveMenuFilter("all"); Haptics.selectionAsync(); }}
            >
              <Text style={[s.sectionTabText, activeMenuFilter === "all" && { color: "#FF6B00" }]}>Tous</Text>
            </TouchableOpacity>
            {visibleSections.map((sec) => (
              <TouchableOpacity
                key={sec.key}
                style={[s.sectionTab, activeMenuFilter === sec.key && [s.sectionTabActive, { borderColor: sec.color }]]}
                onPress={() => { setActiveMenuFilter(sec.key); Haptics.selectionAsync(); }}
              >
                <Ionicons name={sec.icon as any} size={13} color={activeMenuFilter === sec.key ? sec.color : "#6B7280"} />
                <Text style={[s.sectionTabText, activeMenuFilter === sec.key && { color: sec.color }]}>{sec.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Liste articles */}
          <FlatList
            data={filteredArticles}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 20 }}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={{ paddingVertical: 40, alignItems: "center" }}>
                <Ionicons name="bag-outline" size={36} color="#2D2D2D" />
                <Text style={{ fontFamily: "Poppins_400Regular", fontSize: 13, color: "#4B5563", marginTop: 10, textAlign: "center" }}>
                  Aucun article dans cette section
                </Text>
              </View>
            }
            renderItem={({ item }) => {
              const meta = sectionMeta(item.section);
              return (
                <TouchableOpacity
                  style={[s.articleRow, selectedArticle?.id === item.id && s.articleRowActive]}
                  onPress={() => { setSelectedArticle(item); setShowArticleModal(false); Haptics.selectionAsync(); }}
                  activeOpacity={0.8}
                >
                  <View style={[s.articleRowIcon, { backgroundColor: (meta?.color ?? "#FF6B00") + "18" }]}>
                    <Ionicons name={meta?.icon as any ?? "bag-handle-outline"} size={20} color={meta?.color ?? "#FF6B00"} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.articleRowTitle} numberOfLines={1}>{item.title}</Text>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 }}>
                      <View style={[s.sectionPill, { backgroundColor: (meta?.color ?? "#FF6B00") + "18" }]}>
                        <Text style={[s.sectionPillText, { color: meta?.color ?? "#FF6B00" }]}>{meta?.label}</Text>
                      </View>
                      <Text style={s.articleRowMeta}>{item.price}</Text>
                    </View>
                  </View>
                  {selectedArticle?.id === item.id && <Ionicons name="checkmark-circle" size={20} color="#FF6B00" />}
                </TouchableOpacity>
              );
            }}
            ItemSeparatorComponent={() => <View style={s.articleSep} />}
          />
        </View>
      </Modal>

      {/* ══ MODAL CATÉGORIE ══ */}
      <Modal visible={showCategoryModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowCategoryModal(false)}>
        <View style={[s.modalContainer, { paddingTop: insets.top > 0 ? 16 : 32 }]}>
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>Choisir une catégorie</Text>
            <TouchableOpacity onPress={() => setShowCategoryModal(false)} style={s.modalClose}>
              <Ionicons name="close" size={22} color="#fff" />
            </TouchableOpacity>
          </View>
          <View style={s.modalSearch}>
            <Ionicons name="search-outline" size={18} color="#4B5563" />
            <TextInput
              style={s.modalSearchInput}
              placeholder="Rechercher parmi 162 catégories..."
              placeholderTextColor="#4B5563"
              value={categorySearch}
              onChangeText={setCategorySearch}
              autoFocus
            />
            {categorySearch.length > 0 && (
              <TouchableOpacity onPress={() => setCategorySearch("")} style={{ paddingRight: 4 }}>
                <Ionicons name="close-circle" size={16} color="#4B5563" />
              </TouchableOpacity>
            )}
          </View>
          <FlatList
            data={filteredCategoryItems}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 20 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[s.articleRow, category === item.name && s.articleRowActive]}
                onPress={() => { setCategory(item.name); setShowCategoryModal(false); Haptics.selectionAsync(); }}
                activeOpacity={0.75}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[s.articleRowTitle, category === item.name && { color: "#FF6B00" }]}>{item.name}</Text>
                </View>
                {category === item.name && <Ionicons name="checkmark-circle" size={20} color="#FF6B00" />}
              </TouchableOpacity>
            )}
            ItemSeparatorComponent={() => <View style={s.articleSep} />}
          />
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0F0F0F" },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, backgroundColor: "#1A1A1A", borderBottomWidth: 1, borderBottomColor: "#2D2D2D" },
  backBtn: { padding: 4, marginRight: 8 },
  headerTitle: { flex: 1, fontFamily: "Poppins_700Bold", fontSize: 17, color: "#fff" },
  stepBadge: { backgroundColor: "#2D2D2D", borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  stepText: { fontFamily: "Poppins_600SemiBold", fontSize: 11, color: "#FF6B00" },

  summary: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: "#161616", borderBottomWidth: 1, borderBottomColor: "#2D2D2D" },
  summaryIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: "#FF6B0020", alignItems: "center", justifyContent: "center" },
  summaryTitle: { fontFamily: "Poppins_600SemiBold", fontSize: 13, color: "#E5E7EB" },
  summarySound: { fontFamily: "Poppins_400Regular", fontSize: 11, color: "#9CA3AF", marginTop: 1 },

  scroll: { paddingHorizontal: 16, paddingTop: 20, gap: 20 },
  field: { gap: 8 },
  label: { fontFamily: "Poppins_600SemiBold", fontSize: 13, color: "#E5E7EB" },
  required: { color: "#EF4444", fontFamily: "Poppins_400Regular", fontSize: 11 },
  charCount: { fontFamily: "Poppins_400Regular", fontSize: 10, color: "#4B5563", textAlign: "right" },
  optionalTag: { fontFamily: "Poppins_400Regular", fontSize: 11, color: "#4B5563" },

  /* Toggle article */
  toggleRow: { flexDirection: "row", alignItems: "center", backgroundColor: "#1A1A1A", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1, borderColor: "#2D2D2D" },
  toggleDesc: { fontFamily: "Poppins_400Regular", fontSize: 11, color: "#4B5563", marginTop: 2 },

  /* Article picker */
  articleBtn: { backgroundColor: "#1A1A1A", borderRadius: 12, borderWidth: 2, borderColor: "#FF6B0050", borderStyle: "dashed", overflow: "hidden" },
  articleBtnFilled: { borderStyle: "solid", borderColor: "#FF6B00" },
  articleEmpty: { flexDirection: "row", alignItems: "center", padding: 14, gap: 12 },
  articleEmptyIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: "#FF6B0015", alignItems: "center", justifyContent: "center" },
  articleEmptyTitle: { fontFamily: "Poppins_600SemiBold", fontSize: 14, color: "#E5E7EB" },
  articleEmptyDesc: { fontFamily: "Poppins_400Regular", fontSize: 11, color: "#4B5563", marginTop: 2 },
  articleSelected: { flexDirection: "row", alignItems: "center", padding: 14, gap: 12 },
  articleSelectedIcon: { width: 40, height: 40, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  articleSelectedTitle: { fontFamily: "Poppins_600SemiBold", fontSize: 13, color: "#fff" },
  articleSelectedMeta: { fontFamily: "Poppins_400Regular", fontSize: 11, marginTop: 2 },

  /* Inputs */
  input: { backgroundColor: "#1A1A1A", borderRadius: 10, borderWidth: 1.5, borderColor: "#2D2D2D", paddingHorizontal: 14, paddingVertical: 12, fontFamily: "Poppins_400Regular", fontSize: 14, color: "#fff" },
  inputMulti: { height: 100, paddingTop: 12 },
  inputFilled: { borderColor: "#FF6B0060" },

  /* Catégorie */
  categoryRow: { flexDirection: "row", alignItems: "center", backgroundColor: "#1A1A1A", borderRadius: 10, borderWidth: 1.5, borderColor: "#2D2D2D", overflow: "hidden" },
  categoryInput: { flex: 1, paddingHorizontal: 14, paddingVertical: 12, fontFamily: "Poppins_400Regular", fontSize: 14, color: "#fff" },
  categoryPickerBtn: { paddingHorizontal: 14, paddingVertical: 14, backgroundColor: "#2D2D2D", alignItems: "center", justifyContent: "center", borderLeftWidth: 1, borderLeftColor: "#3D3D3D" },

  /* Diffusion */
  selector: { backgroundColor: "#1A1A1A", borderRadius: 10, borderWidth: 1.5, borderColor: "#2D2D2D", paddingHorizontal: 14, paddingVertical: 13, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  selectorFilled: { borderColor: "#FF6B0060" },
  selectorText: { fontFamily: "Poppins_400Regular", fontSize: 14, color: "#fff" },
  dropdown: { backgroundColor: "#1E1E1E", borderRadius: 10, borderWidth: 1, borderColor: "#2D2D2D", overflow: "hidden", marginTop: 4 },
  dropdownItem: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#2A2A2A" },
  dropdownItemActive: { backgroundColor: "#FF6B0010" },
  dropdownText: { fontFamily: "Poppins_400Regular", fontSize: 14, color: "#E5E7EB" },

  /* Bottom bar */
  bottomBar: { position: "absolute", bottom: 0, left: 0, right: 0, paddingHorizontal: 16, paddingTop: 12, backgroundColor: "#111", borderTopWidth: 1, borderTopColor: "#2D2D2D" },
  publishBtn: { backgroundColor: "#FF6B00", borderRadius: 14, paddingVertical: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  publishBtnDisabled: { backgroundColor: "#2D2D2D" },
  publishBtnText: { fontFamily: "Poppins_700Bold", fontSize: 16, color: "#fff" },

  /* Modals */
  modalContainer: { flex: 1, backgroundColor: "#0F0F0F" },
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: "#2D2D2D" },
  modalTitle: { fontFamily: "Poppins_700Bold", fontSize: 17, color: "#fff" },
  modalClose: { padding: 4 },
  modalSearch: { flexDirection: "row", alignItems: "center", gap: 10, margin: 16, backgroundColor: "#1A1A1A", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: "#2D2D2D" },
  modalSearchInput: { flex: 1, fontFamily: "Poppins_400Regular", fontSize: 14, color: "#fff" },

  /* Tabs sections */
  sectionTabs: { paddingHorizontal: 16, paddingBottom: 12, gap: 8 },
  sectionTab: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: "#2D2D2D", backgroundColor: "#1A1A1A" },
  sectionTabActive: { borderColor: "#FF6B00", backgroundColor: "#FF6B0010" },
  sectionTabText: { fontFamily: "Poppins_600SemiBold", fontSize: 12, color: "#6B7280" },

  /* Articles liste */
  articleRow: { flexDirection: "row", alignItems: "center", paddingVertical: 13, gap: 12 },
  articleRowActive: { opacity: 0.9 },
  articleRowIcon: { width: 42, height: 42, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  articleRowTitle: { fontFamily: "Poppins_600SemiBold", fontSize: 14, color: "#E5E7EB" },
  articleRowMeta: { fontFamily: "Poppins_400Regular", fontSize: 12, color: "#4B5563" },
  articleSep: { height: 1, backgroundColor: "#1E1E1E" },
  sectionPill: { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  sectionPillText: { fontFamily: "Poppins_600SemiBold", fontSize: 10 },
});
