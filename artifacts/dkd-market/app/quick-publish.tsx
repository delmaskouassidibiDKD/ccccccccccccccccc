import React, { useState, useMemo } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, Image, ActivityIndicator, Alert,
  KeyboardAvoidingView, Platform, Modal, Dimensions, FlatList,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/contexts/ThemeContext";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import { api } from "@/lib/api";

const MAX_IMAGES = 15;
const SCREEN_W   = Dimensions.get("window").width;
const CELL_SIZE  = (SCREEN_W - 32 - 8) / 3;

type ImageItem = {
  uri:        string;
  name:       string;
  price:      string;
  stock:      string;
  videoUri?:  string;
  videoMime?: string;
  videoName?: string;
};

type Context = "marche" | "supermarche" | "monplat" | "personnalisation";
const CFG: Record<Context, { accent: string; label: string }> = {
  marche:           { accent: "#22C55E", label: "Mon Marché" },
  supermarche:      { accent: "#F97316", label: "Super Marché" },
  monplat:          { accent: "#EC4899", label: "Gastronomie" },
  personnalisation: { accent: "#06B6D4", label: "Personnalisation" },
};

export default function QuickPublishPage() {
  const router  = useRouter();
  const insets  = useSafeAreaInsets();
  const { isDark } = useTheme();
  const params  = useLocalSearchParams<{ context?: string }>();
  const ctx     = (
    params.context === "supermarche"      ? "supermarche"      :
    params.context === "monplat"          ? "monplat"          :
    params.context === "personnalisation" ? "personnalisation"  :
    "marche"
  ) as Context;
  const { accent, label } = CFG[ctx];

  const [images,  setImages]  = useState<ImageItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Modal state
  const [editIdx,       setEditIdx]       = useState<number | null>(null);
  const [editName,      setEditName]      = useState("");
  const [editPrice,     setEditPrice]     = useState("");
  const [editStock,     setEditStock]     = useState("");
  const [editVideoUri,  setEditVideoUri]  = useState<string | undefined>(undefined);
  const [editVideoMime, setEditVideoMime] = useState<string>("video/mp4");
  const [editVideoName, setEditVideoName] = useState<string | undefined>(undefined);
  const [editErrors,    setEditErrors]    = useState<Record<string, string>>({});

  const dynBG          = isDark ? "#0D1117" : "#F0F4FA";
  const dynCARD        = isDark ? "#161B25" : "#FFFFFF";
  const dynText        = isDark ? "#F0F6FF" : "#1A1A1A";
  const dynSub         = isDark ? "#64748B" : "#6B7280";
  const dynBorder      = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.08)";
  const dynHeader      = isDark ? "#111827" : "#FFFFFF";
  const dynSheet       = isDark ? "#1E293B" : "#FFFFFF";
  const dynInput       = isDark ? "#0D1117" : "#F8FAFC";
  const dynInputBorder = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)";

  const allFilled = useMemo(
    () => images.length > 0 && images.every((img) => img.name.trim() && img.price.trim() && Number(img.price) > 0),
    [images],
  );
  const filledCount = images.filter((img) => img.name.trim() && img.price.trim() && Number(img.price) > 0).length;

  // ── Helpers ────────────────────────────────────────────────
  const pickImages = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { Alert.alert("Permission refusée", "Autorisez l'accès à la galerie."); return; }
    const remaining = MAX_IMAGES - images.length;
    if (remaining <= 0) { Alert.alert("Maximum atteint", `Vous avez déjà ${MAX_IMAGES} photos.`); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.85,
      selectionLimit: remaining,
    });
    if (!result.canceled && result.assets.length > 0) {
      Haptics.selectionAsync();
      setImages((prev) => [...prev, ...result.assets.map((a) => ({ uri: a.uri, name: "", price: "", stock: "" }))]);
    }
  };

  const removeImage = (idx: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setImages((prev) => prev.filter((_, i) => i !== idx));
  };

  // Open modal for a given index
  const openModal = (idx: number) => {
    Haptics.selectionAsync();
    const img = images[idx];
    setEditIdx(idx);
    setEditName(img.name);
    setEditPrice(img.price);
    setEditStock(img.stock ?? "");
    setEditVideoUri(img.videoUri);
    setEditVideoMime(img.videoMime ?? "video/mp4");
    setEditVideoName(img.videoName);
    setEditErrors({});
  };

  // Navigate inside modal — saves current before moving
  const navigateModal = (nextIdx: number) => {
    // Save current silently (even if not validated, keep partial)
    setImages((prev) =>
      prev.map((img, i) =>
        i === editIdx
          ? { ...img, name: editName, price: editPrice, stock: editStock, videoUri: editVideoUri, videoMime: editVideoMime, videoName: editVideoName }
          : img,
      ),
    );
    const next = images[nextIdx];
    setEditIdx(nextIdx);
    setEditName(next.name);
    setEditPrice(next.price);
    setEditStock(next.stock ?? "");
    setEditVideoUri(next.videoUri);
    setEditVideoMime(next.videoMime ?? "video/mp4");
    setEditVideoName(next.videoName);
    setEditErrors({});
    Haptics.selectionAsync();
  };

  const saveEdit = () => {
    const errs: Record<string, string> = {};
    if (!editName.trim()) errs.name = "Nom obligatoire";
    if (!editPrice.trim() || isNaN(Number(editPrice)) || Number(editPrice) <= 0) errs.price = "Prix invalide";
    if (Object.keys(errs).length > 0) { setEditErrors(errs); return; }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setImages((prev) =>
      prev.map((img, i) =>
        i === editIdx
          ? { ...img, name: editName.trim(), price: editPrice.trim(), stock: editStock.trim(), videoUri: editVideoUri, videoMime: editVideoMime, videoName: editVideoName }
          : img,
      ),
    );
    // Auto-advance to next if possible
    if (editIdx !== null && editIdx < images.length - 1) {
      navigateModal(editIdx + 1);
    } else {
      setEditIdx(null);
    }
  };

  // Pick video inside the modal
  const pickVideoForEdit = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { Alert.alert("Permission refusée", "Autorisez l'accès à la galerie."); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      Haptics.selectionAsync();
      const parts = result.assets[0].uri.split("/");
      setEditVideoUri(result.assets[0].uri);
      setEditVideoMime(result.assets[0].mimeType ?? "video/mp4");
      setEditVideoName(parts[parts.length - 1]);
    }
  };

  const removeVideoFromEdit = () => {
    Haptics.selectionAsync();
    setEditVideoUri(undefined);
    setEditVideoName(undefined);
  };

  // Submit
  const handleSubmit = async () => {
    if (!allFilled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setLoading(true);
    try {
      for (const img of images) {
        const product = await api.products.create({
          name: img.name, price: Number(img.price),
          sale_mode: "normal_only", description: "",
          category_id: 1, stock_quantity: img.stock.trim() ? Number(img.stock) : 0, currency_code: "XOF",
        });
        await api.products.uploadImages(product.id, [img.uri]);
        if (img.videoUri) {
          await api.products.uploadVideo(product.id, img.videoUri, img.videoMime ?? "video/mp4");
        }
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        "Publié !",
        `${images.length} produit${images.length > 1 ? "s ont" : " a"} été publié${images.length > 1 ? "s" : ""} avec succès.`,
        [{ text: "OK", onPress: () => router.back() }],
      );
    } catch (e: any) {
      Alert.alert("Erreur", e?.message || "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  };

  // ── Cell renderer ──────────────────────────────────────────
  const renderCell = ({ item, index }: { item: ImageItem; index: number }) => {
    const filled = item.name.trim() && item.price.trim() && Number(item.price) > 0;
    return (
      <View style={[s.cell, { width: CELL_SIZE, height: CELL_SIZE }]}>
        <Image source={{ uri: item.uri }} style={s.cellImage} resizeMode="cover" />

        {filled ? (
          <View style={s.cellOverlayFilled}>
            <View style={s.cellTopRow}>
              <View style={[s.cellCheck, { backgroundColor: accent }]}>
                <Ionicons name="checkmark" size={10} color="#fff" />
              </View>
              {item.videoUri && (
                <View style={s.cellVideoIcon}>
                  <Ionicons name="videocam" size={9} color="#fff" />
                </View>
              )}
            </View>
            <Text style={s.cellName} numberOfLines={1}>{item.name}</Text>
            <Text style={s.cellPrice}>{Number(item.price).toLocaleString()} F</Text>
          </View>
        ) : (
          <View style={s.cellOverlayEmpty}>
            <Ionicons name="pencil-outline" size={16} color="rgba(255,255,255,0.9)" />
            <Text style={s.cellTapHint}>Renseigner</Text>
          </View>
        )}

        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => openModal(index)} activeOpacity={0.7} />
        <TouchableOpacity style={s.cellRemove} onPress={() => removeImage(index)} activeOpacity={0.8}>
          <Ionicons name="close-circle" size={18} color="#EF4444" />
        </TouchableOpacity>
      </View>
    );
  };

  // ── Render ─────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={[s.root, { backgroundColor: dynBG, paddingTop: insets.top }]}>

        {/* HEADER */}
        <View style={[s.header, { backgroundColor: dynHeader, borderBottomColor: dynBorder }]}>
          <TouchableOpacity
            style={[s.backBtn, { backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)" }]}
            onPress={() => router.back()} activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={20} color={dynText} />
          </TouchableOpacity>
          <View style={s.headerCenter}>
            <View style={[s.headerIcon, { backgroundColor: accent + "22" }]}>
              <Ionicons name="flash-outline" size={16} color={accent} />
            </View>
            <View>
              <Text style={[s.headerTitle, { color: dynText }]}>Publication rapide</Text>
              <Text style={[s.headerSub, { color: dynSub }]}>{label}</Text>
            </View>
          </View>
          {images.length > 0 && (
            <View style={[s.counterBadge, { backgroundColor: allFilled ? accent : isDark ? "#1E293B" : "#F1F5F9", borderColor: allFilled ? accent : dynBorder }]}>
              <Text style={[s.counterText, { color: allFilled ? "#fff" : dynText }]}>{filledCount}/{images.length}</Text>
            </View>
          )}
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 110 }]} showsVerticalScrollIndicator={false}>

          {/* Pick images */}
          <TouchableOpacity
            style={[s.pickBtn, { backgroundColor: dynCARD, borderColor: images.length === 0 ? accent : dynBorder }]}
            onPress={pickImages}
            disabled={images.length >= MAX_IMAGES}
            activeOpacity={0.8}
          >
            <View style={[s.pickBtnIcon, { backgroundColor: accent + "18" }]}>
              <Ionicons name="images-outline" size={24} color={accent} />
            </View>
            <View style={s.pickBtnText}>
              <Text style={[s.pickBtnTitle, { color: dynText }]}>
                {images.length === 0 ? "Choisir des photos" : "Ajouter d'autres photos"}
              </Text>
              <Text style={[s.pickBtnSub, { color: dynSub }]}>
                {images.length}/{MAX_IMAGES} — Chaque photo devient un produit
              </Text>
            </View>
            <Ionicons name="add-circle-outline" size={22} color={images.length >= MAX_IMAGES ? dynSub : accent} />
          </TouchableOpacity>

          {/* Grid */}
          {images.length > 0 && (
            <>
              <View style={s.gridHeader}>
                <Text style={[s.gridLabel, { color: dynText }]}>
                  {images.length} photo{images.length > 1 ? "s" : ""} — appuyez pour renseigner
                </Text>
                <Text style={[s.gridSub, { color: dynSub }]}>
                  Nom, prix et vidéo (facultatif) pour chaque produit
                </Text>
              </View>
              <FlatList
                data={images}
                keyExtractor={(_, i) => String(i)}
                renderItem={renderCell}
                numColumns={3}
                scrollEnabled={false}
                columnWrapperStyle={s.gridRow}
                contentContainerStyle={s.grid}
              />
            </>
          )}

          {/* Empty hint */}
          {images.length === 0 && (
            <View style={[s.emptyHint, { backgroundColor: dynCARD, borderColor: dynBorder }]}>
              <Ionicons name="flash-outline" size={36} color={accent} style={{ opacity: 0.5 }} />
              <Text style={[s.emptyTitle, { color: dynText }]}>Sélectionnez jusqu'à 15 photos</Text>
              <Text style={[s.emptySub, { color: dynSub }]}>
                Chaque photo devient un produit distinct avec son nom, prix et vidéo optionnelle.
              </Text>
            </View>
          )}
        </ScrollView>

        {/* FOOTER */}
        <View style={[s.footer, { paddingBottom: insets.bottom + 12, backgroundColor: dynHeader, borderTopColor: dynBorder }]}>
          {images.length > 0 && !allFilled && (
            <View style={[s.progressRow, { marginBottom: 8 }]}>
              <View style={[s.progressTrack, { backgroundColor: isDark ? "#1E293B" : "#E2E8F0" }]}>
                <View style={[s.progressFill, { backgroundColor: accent, width: `${(filledCount / images.length) * 100}%` as any }]} />
              </View>
              <Text style={[s.progressLabel, { color: dynSub }]}>{filledCount}/{images.length} complété{filledCount > 1 ? "s" : ""}</Text>
            </View>
          )}
          <TouchableOpacity
            style={[s.submitBtn, { backgroundColor: allFilled ? accent : isDark ? "#1E293B" : "#E2E8F0", opacity: loading ? 0.8 : 1 }]}
            onPress={handleSubmit}
            disabled={!allFilled || loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color={allFilled ? "#fff" : dynSub} size="small" />
            ) : (
              <>
                <Ionicons name={allFilled ? "flash-outline" : "lock-closed-outline"} size={20} color={allFilled ? "#fff" : isDark ? "#475569" : "#94A3B8"} />
                <Text style={[s.submitBtnText, { color: allFilled ? "#fff" : isDark ? "#475569" : "#94A3B8" }]}>
                  {images.length === 0 ? "Choisissez des photos d'abord"
                    : allFilled ? `Publier ${images.length} produit${images.length > 1 ? "s" : ""}`
                    : `Remplissez tous les champs (${filledCount}/${images.length})`}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* PER-IMAGE MODAL */}
      <Modal visible={editIdx !== null} transparent animationType="slide" onRequestClose={() => setEditIdx(null)}>
        <View style={s.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ width: "100%" }}>
            <View style={[s.modalSheet, { backgroundColor: dynSheet }]}>

              {/* Image preview */}
              {editIdx !== null && images[editIdx] && (
                <Image source={{ uri: images[editIdx].uri }} style={s.modalPreview} resizeMode="cover" />
              )}

              <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                {/* Modal header */}
                <View style={[s.modalHeader, { borderBottomColor: dynBorder }]}>
                  <View>
                    <Text style={[s.modalTitle, { color: dynText }]}>
                      Photo {editIdx !== null ? editIdx + 1 : ""}/{images.length}
                    </Text>
                    <Text style={[s.modalSub, { color: dynSub }]}>Renseignez ce produit</Text>
                  </View>
                  <TouchableOpacity onPress={() => setEditIdx(null)} activeOpacity={0.7}>
                    <Ionicons name="close" size={22} color={dynSub} />
                  </TouchableOpacity>
                </View>

                <View style={s.modalFields}>
                  {/* Name */}
                  <View style={[s.inputWrap, { backgroundColor: dynInput, borderColor: editErrors.name ? "#EF4444" : dynInputBorder }]}>
                    <Ionicons name="cube-outline" size={17} color={editErrors.name ? "#EF4444" : dynSub} style={s.inputIcon} />
                    <TextInput
                      style={[s.input, { color: dynText }]}
                      placeholder="Nom du produit"
                      placeholderTextColor={isDark ? "#475569" : "#9CA3AF"}
                      value={editName}
                      onChangeText={(t) => { setEditName(t); if (editErrors.name) setEditErrors((e) => ({ ...e, name: "" })); }}
                    />
                  </View>
                  {editErrors.name ? <Text style={s.errText}>{editErrors.name}</Text> : null}

                  {/* Price */}
                  <View style={[s.inputWrap, { backgroundColor: dynInput, borderColor: editErrors.price ? "#EF4444" : dynInputBorder }]}>
                    <Ionicons name="pricetag-outline" size={17} color={editErrors.price ? "#EF4444" : dynSub} style={s.inputIcon} />
                    <TextInput
                      style={[s.input, { color: dynText }]}
                      placeholder="Prix"
                      placeholderTextColor={isDark ? "#475569" : "#9CA3AF"}
                      value={editPrice}
                      onChangeText={(t) => { setEditPrice(t); if (editErrors.price) setEditErrors((e) => ({ ...e, price: "" })); }}
                      keyboardType="numeric"
                    />
                    <Text style={[s.inputSuffix, { color: dynSub }]}>FCFA</Text>
                  </View>
                  {editErrors.price ? <Text style={s.errText}>{editErrors.price}</Text> : null}

                  {/* Stock — facultatif */}
                  <Text style={[s.fieldLabel, { color: dynSub }]}>Stock disponible <Text style={{ color: isDark ? "#475569" : "#94A3B8", fontSize: 11 }}>(facultatif)</Text></Text>
                  <View style={[s.inputWrap, { backgroundColor: dynInput, borderColor: dynInputBorder }]}>
                    <Ionicons name="layers-outline" size={17} color={dynSub} style={s.inputIcon} />
                    <TextInput
                      style={[s.input, { color: dynText }]}
                      placeholder="Quantité en stock"
                      placeholderTextColor={isDark ? "#475569" : "#9CA3AF"}
                      value={editStock}
                      onChangeText={setEditStock}
                      keyboardType="numeric"
                    />
                  </View>


                  {/* Video per image */}
                  <View style={[s.videoSection, { borderTopColor: dynBorder }]}>
                    <View style={s.videoSectionLabel}>
                      <Ionicons name="videocam-outline" size={13} color={dynSub} />
                      <Text style={[s.videoSectionText, { color: dynSub }]}>VIDÉO ASSOCIÉE</Text>
                      <Text style={[s.videoOptText, { color: isDark ? "#334155" : "#CBD5E1" }]}>Facultatif</Text>
                    </View>

                    {editVideoUri && editVideoName ? (
                      <View style={[s.videoBadge, { backgroundColor: isDark ? "#0D1117" : "#F1F5F9", borderColor: "#EC489944" }]}>
                        <View style={[s.videoIconWrap, { backgroundColor: "#EC489918" }]}>
                          <Ionicons name="videocam-outline" size={18} color="#EC4899" />
                        </View>
                        <Text style={[s.videoFileName, { color: dynText }]} numberOfLines={1}>{editVideoName}</Text>
                        <TouchableOpacity onPress={removeVideoFromEdit} activeOpacity={0.7}>
                          <Ionicons name="close-circle" size={18} color="#EF4444" />
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={[s.videoPickBtn, { backgroundColor: isDark ? "#0D1117" : "#F8FAFC", borderColor: dynInputBorder }]}
                        onPress={pickVideoForEdit}
                        activeOpacity={0.8}
                      >
                        <View style={[s.videoPickIcon, { backgroundColor: "#EC489918" }]}>
                          <Ionicons name="videocam-outline" size={18} color="#EC4899" />
                        </View>
                        <Text style={[s.videoPickText, { color: dynSub }]}>Ajouter une vidéo pour ce produit</Text>
                        <Ionicons name="add-circle-outline" size={18} color="#EC4899" />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                {/* Actions */}
                <View style={[s.modalActions, { paddingBottom: 24 }]}>
                  <TouchableOpacity
                    style={[s.navBtn, { backgroundColor: isDark ? "#0D1117" : "#F1F5F9", opacity: editIdx === 0 ? 0.35 : 1 }]}
                    onPress={() => editIdx !== null && editIdx > 0 && navigateModal(editIdx - 1)}
                    disabled={editIdx === 0}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="chevron-back" size={18} color={dynText} />
                  </TouchableOpacity>

                  {(() => {
                    const canSave = editName.trim().length > 0 && editPrice.trim().length > 0 && Number(editPrice) > 0;
                    return (
                      <TouchableOpacity
                        style={[s.saveBtn, { flex: 1, backgroundColor: canSave ? accent : isDark ? "#1E293B" : "#E2E8F0" }]}
                        onPress={saveEdit}
                        disabled={!canSave}
                        activeOpacity={0.85}
                      >
                        <Ionicons
                          name="checkmark-circle-outline"
                          size={18}
                          color={canSave ? "#fff" : isDark ? "#475569" : "#94A3B8"}
                        />
                        <Text style={[s.saveBtnText, { color: canSave ? "#fff" : isDark ? "#475569" : "#94A3B8" }]}>
                          {editIdx !== null && editIdx < images.length - 1 ? "Confirmer & Suivant" : "Confirmer"}
                        </Text>
                      </TouchableOpacity>
                    );
                  })()}

                  <TouchableOpacity
                    style={[s.navBtn, { backgroundColor: isDark ? "#0D1117" : "#F1F5F9", opacity: editIdx === images.length - 1 ? 0.35 : 1 }]}
                    onPress={() => editIdx !== null && editIdx < images.length - 1 && navigateModal(editIdx + 1)}
                    disabled={editIdx === images.length - 1}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="chevron-forward" size={18} color={dynText} />
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root:   { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, gap: 10 },
  backBtn:      { width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  headerCenter: { flex: 1, flexDirection: "row", alignItems: "center", gap: 10 },
  headerIcon:   { width: 30, height: 30, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  headerTitle:  { fontFamily: "Poppins_700Bold", fontSize: 16 },
  headerSub:    { fontFamily: "Poppins_400Regular", fontSize: 11, marginTop: -1 },
  counterBadge: { borderRadius: 14, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4 },
  counterText:  { fontFamily: "Poppins_700Bold", fontSize: 13 },

  scroll: { padding: 14, gap: 14 },

  pickBtn:      { flexDirection: "row", alignItems: "center", borderRadius: 14, borderWidth: 1.5, borderStyle: "dashed", padding: 14, gap: 12 },
  pickBtnIcon:  { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  pickBtnText:  { flex: 1 },
  pickBtnTitle: { fontFamily: "Poppins_700Bold", fontSize: 14 },
  pickBtnSub:   { fontFamily: "Poppins_400Regular", fontSize: 11, marginTop: 2 },

  gridHeader: { gap: 3 },
  gridLabel:  { fontFamily: "Poppins_700Bold", fontSize: 14 },
  gridSub:    { fontFamily: "Poppins_400Regular", fontSize: 11 },
  grid:       { gap: 4 },
  gridRow:    { gap: 4 },

  cell:      { borderRadius: 10, overflow: "hidden", position: "relative" },
  cellImage: { width: "100%", height: "100%" },
  cellOverlayFilled: { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: "rgba(0,0,0,0.58)", padding: 5, gap: 1 },
  cellTopRow:  { flexDirection: "row", justifyContent: "flex-end", gap: 3, marginBottom: 2 },
  cellCheck:   { width: 16, height: 16, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  cellVideoIcon: { width: 16, height: 16, borderRadius: 8, backgroundColor: "#EC4899", alignItems: "center", justifyContent: "center" },
  cellName:    { fontFamily: "Poppins_600SemiBold", fontSize: 9, color: "#fff" },
  cellPrice:   { fontFamily: "Poppins_700Bold", fontSize: 9, color: "#FCD34D" },
  cellOverlayEmpty: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.38)", alignItems: "center", justifyContent: "center", gap: 3 },
  cellTapHint: { fontFamily: "Poppins_600SemiBold", fontSize: 9, color: "rgba(255,255,255,0.9)" },
  cellRemove:  { position: "absolute", top: 4, right: 4, width: 20, height: 20, borderRadius: 10, overflow: "hidden" },

  emptyHint:  { borderRadius: 16, borderWidth: 1, borderStyle: "dashed", padding: 30, alignItems: "center", gap: 10 },
  emptyTitle: { fontFamily: "Poppins_700Bold", fontSize: 15, textAlign: "center" },
  emptySub:   { fontFamily: "Poppins_400Regular", fontSize: 12, textAlign: "center", lineHeight: 18 },

  footer:        { paddingHorizontal: 16, paddingTop: 12, borderTopWidth: 1 },
  progressRow:   { flexDirection: "row", alignItems: "center", gap: 8 },
  progressTrack: { flex: 1, height: 4, borderRadius: 2, overflow: "hidden" },
  progressFill:  { height: "100%", borderRadius: 2 },
  progressLabel: { fontFamily: "Poppins_600SemiBold", fontSize: 11, minWidth: 70, textAlign: "right" },
  submitBtn:     { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 14, paddingVertical: 15 },
  submitBtnText: { fontFamily: "Poppins_700Bold", fontSize: 14 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
  modalSheet:   { borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: "hidden" },
  modalPreview: { width: "100%", height: 180 },
  modalHeader:  { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", paddingHorizontal: 16, paddingTop: 14, paddingBottom: 12, borderBottomWidth: 1 },
  modalTitle:   { fontFamily: "Poppins_700Bold", fontSize: 15 },
  modalSub:     { fontFamily: "Poppins_400Regular", fontSize: 11, marginTop: 1 },
  modalFields:  { padding: 16, gap: 10 },
  modalActions: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16, paddingTop: 4 },

  inputWrap:   { flexDirection: "row", alignItems: "center", borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, height: 48 },
  inputIcon:   { marginRight: 8 },
  input:       { flex: 1, fontFamily: "Poppins_400Regular", fontSize: 14 },
  inputSuffix: { fontFamily: "Poppins_600SemiBold", fontSize: 12, marginLeft: 4 },
  errText:     { fontFamily: "Poppins_400Regular", fontSize: 11, color: "#EF4444", marginTop: -4 },

  videoSection:      { borderTopWidth: 1, paddingTop: 12, gap: 8 },
  videoSectionLabel: { flexDirection: "row", alignItems: "center", gap: 6 },
  videoSectionText:  { fontFamily: "Poppins_600SemiBold", fontSize: 11, letterSpacing: 0.8 },
  videoOptText:      { fontFamily: "Poppins_400Regular", fontSize: 11, marginLeft: "auto" },
  videoBadge:        { flexDirection: "row", alignItems: "center", borderRadius: 10, borderWidth: 1, padding: 10, gap: 8 },
  videoIconWrap:     { width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  videoFileName:     { flex: 1, fontFamily: "Poppins_500Medium", fontSize: 11 },
  videoPickBtn:      { flexDirection: "row", alignItems: "center", borderRadius: 10, borderWidth: 1, padding: 11, gap: 10 },
  videoPickIcon:     { width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  videoPickText:     { flex: 1, fontFamily: "Poppins_500Medium", fontSize: 12 },

  navBtn:     { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  saveBtn:    { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 12, paddingVertical: 12 },
  saveBtnText:{ fontFamily: "Poppins_700Bold", fontSize: 14, color: "#fff" },
});
