import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  FlatList,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { STATIC_CATEGORIES } from "./(tabs)/rayons";

const VISIBILITY_OPTIONS = [
  { value: "public",    label: "Public",    icon: "globe-outline",  desc: "Visible par tous" },
  { value: "followers", label: "Abonnés",   icon: "people-outline", desc: "Visible par vos abonnés" },
];

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

const DEMO_ARTICLES = [
  { id: "1", title: "Pagne wax Java 6 yards", category: "Mode & Textile", price: "12 500 FCFA" },
  { id: "2", title: "Sac à main cuir marron", category: "Mode & Textile", price: "8 000 FCFA" },
  { id: "3", title: "Huile de palme rouge 5L", category: "Alimentation", price: "3 200 FCFA" },
  { id: "4", title: "Téléphone Samsung A05", category: "Électronique", price: "65 000 FCFA" },
  { id: "5", title: "Savon karité naturel", category: "Beauté & Hygiène", price: "1 500 FCFA" },
  { id: "6", title: "Table basse en bois", category: "Maison & Déco", price: "22 000 FCFA" },
  { id: "7", title: "Sac de riz local 25kg", category: "Alimentation", price: "18 000 FCFA" },
  { id: "8", title: "Casque audio Bluetooth", category: "Électronique", price: "15 000 FCFA" },
];

type Article = { id: string; title: string; category: string; price: string };

export default function VideoPublishSettings() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const paddingTop = Platform.OS === "web" ? 0 : insets.top;
  const paddingBottom = Platform.OS === "web" ? 34 : insets.bottom;
  const params = useLocalSearchParams<{
    mode: string; videoUri: string; photos: string;
    soundTitle: string; soundArtist: string;
  }>();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [link, setLink] = useState("");
  const [category, setCategory] = useState("");
  const [visibility, setVisibility] = useState("public");
  const [selectedCountry, setSelectedCountry] = useState("ALL");
  const [showCountries, setShowCountries] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [showArticleModal, setShowArticleModal] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [articleSearch, setArticleSearch] = useState("");
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categorySearch, setCategorySearch] = useState("");

  const isVideo = params.mode === "video";
  const photoCount = (() => {
    try { return JSON.parse(params.photos || "[]").length; }
    catch { return 0; }
  })();

  const filteredArticles = DEMO_ARTICLES.filter((a) =>
    a.title.toLowerCase().includes(articleSearch.toLowerCase()) ||
    a.category.toLowerCase().includes(articleSearch.toLowerCase())
  );

  const filteredCategoryItems = useMemo(() =>
    STATIC_CATEGORIES.filter((c) =>
      c.name.toLowerCase().includes(categorySearch.toLowerCase())
    ), [categorySearch]
  );

  const isReady = title.trim().length > 0 && selectedArticle !== null;

  const handlePublish = async () => {
    const missing: string[] = [];
    if (!selectedArticle) missing.push("• Associer un article");
    if (!title.trim()) missing.push("• Ajouter un titre");
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

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={[styles.container, { paddingTop }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Paramètres</Text>
          <View style={styles.stepBadge}>
            <Text style={styles.stepText}>Étape 2/2</Text>
          </View>
        </View>

        {/* Content summary */}
        <View style={styles.summary}>
          <View style={styles.summaryIcon}>
            <Ionicons name={isVideo ? "videocam" : "images"} size={18} color="#FF6B00" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.summaryTitle}>
              {isVideo ? "Vidéo • 1 fichier" : `Photo Vidéo • ${photoCount} photos`}
            </Text>
            {!isVideo && params.soundTitle ? (
              <Text style={styles.summarySound}>🎵 {params.soundTitle}</Text>
            ) : null}
          </View>
          <View style={styles.summaryCheck}>
            <Ionicons name="checkmark-circle" size={20} color="#22C55E" />
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[styles.scroll, { paddingBottom: paddingBottom + 100 }]}
        >
          {/* Associer un article — obligatoire */}
          <View style={styles.field}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>Article associé</Text>
              <Text style={styles.required}> * obligatoire</Text>
            </View>
            <TouchableOpacity
              style={[styles.articleBtn, selectedArticle && styles.articleBtnFilled]}
              onPress={() => { setShowArticleModal(true); Haptics.selectionAsync(); }}
              activeOpacity={0.8}
            >
              {selectedArticle ? (
                <View style={styles.articleSelected}>
                  <View style={styles.articleSelectedIcon}>
                    <Ionicons name="bag-handle" size={20} color="#FF6B00" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.articleSelectedTitle} numberOfLines={1}>{selectedArticle.title}</Text>
                    <Text style={styles.articleSelectedMeta}>{selectedArticle.category} • {selectedArticle.price}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={(e) => { e.stopPropagation(); setSelectedArticle(null); Haptics.selectionAsync(); }}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="close-circle" size={20} color="#4B5563" />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.articleEmpty}>
                  <View style={styles.articleEmptyIcon}>
                    <Ionicons name="bag-add-outline" size={24} color="#FF6B00" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.articleEmptyTitle}>Associer un article</Text>
                    <Text style={styles.articleEmptyDesc}>Liez ce contenu à un de vos produits</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#4B5563" />
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Titre */}
          <View style={styles.field}>
            <Text style={styles.label}>Titre <Text style={styles.required}>*</Text></Text>
            <TextInput
              style={[styles.input, title.length > 0 && styles.inputFilled]}
              placeholder="Ex: Nouveaux pagnes wax arrivés..."
              placeholderTextColor="#4B5563"
              value={title}
              onChangeText={setTitle}
              maxLength={80}
            />
            <Text style={styles.charCount}>{title.length}/80</Text>
          </View>

          {/* Description */}
          <View style={styles.field}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.inputMulti, description.length > 0 && styles.inputFilled]}
              placeholder="Décrivez votre produit ou votre vidéo..."
              placeholderTextColor="#4B5563"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              maxLength={500}
              textAlignVertical="top"
            />
            <Text style={styles.charCount}>{description.length}/500</Text>
          </View>

          {/* Lien externe */}
          <View style={styles.field}>
            <Text style={styles.label}>Lien</Text>
            <View style={[styles.linkInputRow, link.length > 0 && styles.inputFilled]}>
              <Ionicons name="link-outline" size={18} color="#4B5563" style={{ marginLeft: 12 }} />
              <TextInput
                style={styles.linkInput}
                placeholder="https://..."
                placeholderTextColor="#4B5563"
                value={link}
                onChangeText={setLink}
                keyboardType="url"
                autoCapitalize="none"
                autoCorrect={false}
              />
              {link.length > 0 && (
                <TouchableOpacity onPress={() => setLink("")} style={{ paddingRight: 12 }}>
                  <Ionicons name="close-circle" size={16} color="#4B5563" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Catégorie — libre + picker 162 catégories */}
          <View style={styles.field}>
            <Text style={styles.label}>Catégorie <Text style={styles.optionalTag}>(optionnel)</Text></Text>
            <View style={[styles.categoryRow, category.length > 0 && styles.inputFilled]}>
              <TextInput
                style={styles.categoryInput}
                placeholder="Ex: Mode, Alimentation..."
                placeholderTextColor="#4B5563"
                value={category}
                onChangeText={setCategory}
                maxLength={60}
              />
              <TouchableOpacity
                style={styles.categoryPickerBtn}
                onPress={() => { setShowCategoryModal(true); setCategorySearch(""); Haptics.selectionAsync(); }}
              >
                <Ionicons name="list" size={18} color="#FF6B00" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Visibilité — 2 cartes seulement */}
          <View style={styles.field}>
            <Text style={styles.label}>Visibilité</Text>
            <View style={styles.visibilityRow}>
              {VISIBILITY_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.visibilityCard, visibility === opt.value && styles.visibilityCardActive]}
                  onPress={() => { setVisibility(opt.value); Haptics.selectionAsync(); }}
                >
                  <Ionicons
                    name={opt.icon as any}
                    size={22}
                    color={visibility === opt.value ? "#FF6B00" : "#6B7280"}
                  />
                  <Text style={[styles.visibilityLabel, visibility === opt.value && { color: "#FF6B00" }]}>
                    {opt.label}
                  </Text>
                  <Text style={styles.visibilityDesc}>{opt.desc}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Diffusion */}
          <View style={styles.field}>
            <Text style={styles.label}>Diffusion</Text>
            <TouchableOpacity
              style={[styles.selector, styles.selectorFilled]}
              onPress={() => { setShowCountries(!showCountries); setShowCategories(false); }}
            >
              <Text style={styles.selectorText}>
                {COUNTRIES.find((c) => c.code === selectedCountry)?.flag}{" "}
                {COUNTRIES.find((c) => c.code === selectedCountry)?.name}
              </Text>
              <Ionicons name={showCountries ? "chevron-up" : "chevron-down"} size={18} color="#9CA3AF" />
            </TouchableOpacity>
            {showCountries && (
              <View style={styles.dropdown}>
                {COUNTRIES.map((c) => (
                  <TouchableOpacity
                    key={c.code}
                    style={[styles.dropdownItem, selectedCountry === c.code && styles.dropdownItemActive]}
                    onPress={() => { setSelectedCountry(c.code); setShowCountries(false); Haptics.selectionAsync(); }}
                  >
                    <Text style={styles.dropdownText}>{c.flag} {c.name}</Text>
                    {selectedCountry === c.code && <Ionicons name="checkmark" size={16} color="#FF6B00" />}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </ScrollView>

        {/* Publish button */}
        <View style={[styles.bottomBar, { paddingBottom: paddingBottom + 12 }]}>
          <TouchableOpacity
            style={[styles.publishBtn, !isReady && styles.publishBtnDisabled]}
            onPress={handlePublish}
            disabled={publishing}
            activeOpacity={0.85}
          >
            {publishing ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="cloud-upload-outline" size={20} color="#fff" />
                <Text style={styles.publishBtnText}>Publier maintenant</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Category picker modal */}
      <Modal
        visible={showCategoryModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <View style={[styles.modalContainer, { paddingTop: insets.top > 0 ? 16 : 32 }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Choisir une catégorie</Text>
            <TouchableOpacity onPress={() => setShowCategoryModal(false)} style={styles.modalClose}>
              <Ionicons name="close" size={22} color="#fff" />
            </TouchableOpacity>
          </View>
          <View style={styles.modalSearch}>
            <Ionicons name="search-outline" size={18} color="#4B5563" />
            <TextInput
              style={styles.modalSearchInput}
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
                style={[styles.articleRow, category === item.name && styles.dropdownItemActive]}
                onPress={() => {
                  setCategory(item.name);
                  setShowCategoryModal(false);
                  Haptics.selectionAsync();
                }}
                activeOpacity={0.75}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.articleRowTitle, category === item.name && { color: "#FF6B00" }]}>
                    {item.name}
                  </Text>
                </View>
                {category === item.name && <Ionicons name="checkmark-circle" size={20} color="#FF6B00" />}
              </TouchableOpacity>
            )}
            ItemSeparatorComponent={() => <View style={styles.articleSep} />}
          />
        </View>
      </Modal>

      {/* Article picker modal */}
      <Modal
        visible={showArticleModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowArticleModal(false)}
      >
        <View style={[styles.modalContainer, { paddingTop: insets.top > 0 ? 16 : 32 }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Choisir un article</Text>
            <TouchableOpacity onPress={() => setShowArticleModal(false)} style={styles.modalClose}>
              <Ionicons name="close" size={22} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={styles.modalSearch}>
            <Ionicons name="search-outline" size={18} color="#4B5563" />
            <TextInput
              style={styles.modalSearchInput}
              placeholder="Rechercher un article..."
              placeholderTextColor="#4B5563"
              value={articleSearch}
              onChangeText={setArticleSearch}
            />
          </View>

          <FlatList
            data={filteredArticles}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 20 }}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.articleRow, selectedArticle?.id === item.id && styles.articleRowActive]}
                onPress={() => {
                  setSelectedArticle(item);
                  setShowArticleModal(false);
                  Haptics.selectionAsync();
                }}
                activeOpacity={0.8}
              >
                <View style={styles.articleRowIcon}>
                  <Ionicons name="bag-handle-outline" size={20} color="#FF6B00" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.articleRowTitle} numberOfLines={1}>{item.title}</Text>
                  <Text style={styles.articleRowMeta}>{item.category} • {item.price}</Text>
                </View>
                {selectedArticle?.id === item.id && (
                  <Ionicons name="checkmark-circle" size={20} color="#FF6B00" />
                )}
              </TouchableOpacity>
            )}
            ItemSeparatorComponent={() => <View style={styles.articleSep} />}
          />
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0F0F0F" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#1A1A1A",
    borderBottomWidth: 1,
    borderBottomColor: "#2D2D2D",
  },
  backBtn: { padding: 4, marginRight: 8 },
  headerTitle: { flex: 1, fontFamily: "Poppins_700Bold", fontSize: 17, color: "#fff" },
  stepBadge: {
    backgroundColor: "#2D2D2D",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  stepText: { fontFamily: "Poppins_600SemiBold", fontSize: 11, color: "#FF6B00" },

  summary: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#161616",
    borderBottomWidth: 1,
    borderBottomColor: "#2D2D2D",
  },
  summaryIcon: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: "#FF6B0020",
    alignItems: "center", justifyContent: "center",
  },
  summaryTitle: { fontFamily: "Poppins_600SemiBold", fontSize: 13, color: "#E5E7EB" },
  summarySound: { fontFamily: "Poppins_400Regular", fontSize: 11, color: "#9CA3AF", marginTop: 1 },
  summaryCheck: { marginLeft: "auto" },

  scroll: { paddingHorizontal: 16, paddingTop: 20, gap: 20 },

  field: { gap: 6 },
  labelRow: { flexDirection: "row", alignItems: "center" },
  label: { fontFamily: "Poppins_600SemiBold", fontSize: 13, color: "#E5E7EB" },
  required: { color: "#EF4444", fontFamily: "Poppins_400Regular", fontSize: 11 },
  charCount: { fontFamily: "Poppins_400Regular", fontSize: 10, color: "#4B5563", textAlign: "right" },

  articleBtn: {
    backgroundColor: "#1A1A1A",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#FF6B0050",
    borderStyle: "dashed",
    overflow: "hidden",
  },
  articleBtnFilled: { borderStyle: "solid", borderColor: "#FF6B00" },
  articleEmpty: { flexDirection: "row", alignItems: "center", padding: 14, gap: 12 },
  articleEmptyIcon: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: "#FF6B0015",
    alignItems: "center", justifyContent: "center",
  },
  articleEmptyTitle: { fontFamily: "Poppins_600SemiBold", fontSize: 14, color: "#E5E7EB" },
  articleEmptyDesc: { fontFamily: "Poppins_400Regular", fontSize: 11, color: "#4B5563", marginTop: 2 },
  articleSelected: { flexDirection: "row", alignItems: "center", padding: 14, gap: 12 },
  articleSelectedIcon: {
    width: 40, height: 40, borderRadius: 10,
    backgroundColor: "#FF6B0020",
    alignItems: "center", justifyContent: "center",
  },
  articleSelectedTitle: { fontFamily: "Poppins_600SemiBold", fontSize: 13, color: "#fff" },
  articleSelectedMeta: { fontFamily: "Poppins_400Regular", fontSize: 11, color: "#FF6B00", marginTop: 2 },

  input: {
    backgroundColor: "#1A1A1A",
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#2D2D2D",
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: "#fff",
  },
  inputMulti: { height: 100, paddingTop: 12 },
  inputFilled: { borderColor: "#FF6B0060" },

  optionalTag: { fontFamily: "Poppins_400Regular", fontSize: 11, color: "#4B5563" },

  categoryRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1A1A1A",
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#2D2D2D",
    overflow: "hidden",
  },
  categoryInput: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: "#fff",
  },
  categoryPickerBtn: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: "#2D2D2D",
    alignItems: "center",
    justifyContent: "center",
    borderLeftWidth: 1,
    borderLeftColor: "#3D3D3D",
  },

  linkInputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1A1A1A",
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#2D2D2D",
    gap: 8,
  },
  linkInput: {
    flex: 1,
    paddingVertical: 12,
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: "#fff",
  },

  selector: {
    backgroundColor: "#1A1A1A",
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#2D2D2D",
    paddingHorizontal: 14,
    paddingVertical: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  selectorFilled: { borderColor: "#FF6B0060" },
  selectorText: { fontFamily: "Poppins_400Regular", fontSize: 14, color: "#fff" },

  dropdown: {
    backgroundColor: "#1E1E1E",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#2D2D2D",
    overflow: "hidden",
    marginTop: 4,
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#2A2A2A",
  },
  dropdownItemActive: { backgroundColor: "#FF6B0010" },
  dropdownText: { fontFamily: "Poppins_400Regular", fontSize: 14, color: "#E5E7EB" },

  visibilityRow: { flexDirection: "row", gap: 10 },
  visibilityCard: {
    flex: 1,
    backgroundColor: "#1A1A1A",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#2D2D2D",
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: "center",
    gap: 6,
  },
  visibilityCardActive: { borderColor: "#FF6B00", backgroundColor: "#1E1A15" },
  visibilityLabel: { fontFamily: "Poppins_600SemiBold", fontSize: 13, color: "#9CA3AF", textAlign: "center" },
  visibilityDesc: { fontFamily: "Poppins_400Regular", fontSize: 10, color: "#4B5563", textAlign: "center" },

  bottomBar: {
    position: "absolute",
    bottom: 0, left: 0, right: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: "#111",
    borderTopWidth: 1,
    borderTopColor: "#2D2D2D",
  },
  publishBtn: {
    backgroundColor: "#FF6B00",
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  publishBtnDisabled: { backgroundColor: "#3D2D1A" },
  publishBtnText: { fontFamily: "Poppins_700Bold", fontSize: 16, color: "#fff" },

  modalContainer: { flex: 1, backgroundColor: "#0F0F0F" },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#2D2D2D",
  },
  modalTitle: { flex: 1, fontFamily: "Poppins_700Bold", fontSize: 17, color: "#fff" },
  modalClose: { padding: 4 },
  modalSearch: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    margin: 16,
    backgroundColor: "#1A1A1A",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#2D2D2D",
    paddingHorizontal: 12,
  },
  modalSearchInput: {
    flex: 1,
    paddingVertical: 11,
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: "#fff",
  },

  articleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
  },
  articleRowActive: { opacity: 1 },
  articleRowIcon: {
    width: 40, height: 40, borderRadius: 10,
    backgroundColor: "#FF6B0015",
    alignItems: "center", justifyContent: "center",
  },
  articleRowTitle: { fontFamily: "Poppins_600SemiBold", fontSize: 14, color: "#E5E7EB" },
  articleRowMeta: { fontFamily: "Poppins_400Regular", fontSize: 11, color: "#9CA3AF", marginTop: 2 },
  articleSep: { height: 1, backgroundColor: "#1E1E1E" },
});
