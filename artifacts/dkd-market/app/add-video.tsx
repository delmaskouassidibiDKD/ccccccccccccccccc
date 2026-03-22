import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
  Image,
  Modal,
  TextInput,
  KeyboardAvoidingView,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { Video, ResizeMode } from "expo-av";
import * as Haptics from "expo-haptics";
import { soundPickerStore, SoundItem } from "@/lib/soundPickerStore";
import SoundTrimPlayer, { SoundTrimPlayerRef } from "@/components/SoundTrimPlayer";
import { useTheme } from "../contexts/ThemeContext";

type Mode = null | "video" | "photo";

type PhotoPrice = { name: string; price: string; currency: string };

const CURRENCIES = [
  { code: "FCFA", symbol: "FCFA" },
  { code: "EUR",  symbol: "€"    },
  { code: "USD",  symbol: "$"    },
  { code: "GBP",  symbol: "£"    },
  { code: "NGN",  symbol: "₦"    },
  { code: "GHS",  symbol: "₵"    },
  { code: "MAD",  symbol: "MAD"  },
  { code: "KES",  symbol: "KSh"  },
  { code: "XAF",  symbol: "XAF"  },
  { code: "MGA",  symbol: "Ar"   },
];

export default function AddVideoPage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const paddingTop = Platform.OS === "web" ? 0 : insets.top;
  const paddingBottom = Platform.OS === "web" ? 34 : insets.bottom;
  const { isDark } = useTheme();

  const dBG     = isDark ? "#0F0F0F" : "#F0F4F8";
  const dHEAD   = isDark ? "#1A1A1A" : "#FFFFFF";
  const dCARD   = isDark ? "#1E1E1E" : "#FFFFFF";
  const dBORDER = isDark ? "#2D2D2D" : "rgba(0,0,0,0.1)";
  const dTEXT   = isDark ? "#FFFFFF" : "#111827";
  const dSUB    = isDark ? "#E5E7EB" : "#374151";
  const dMUTED  = isDark ? "#9CA3AF" : "#6B7280";
  const dBAR    = isDark ? "#111" : "#FFFFFF";

  const [mode, setMode] = useState<Mode>(null);
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [selectedSound, setSelectedSound] = useState<SoundItem | null>(null);
  const [trimStartMs, setTrimStartMs] = useState(0);
  const [trimEndMs, setTrimEndMs] = useState(60000);
  const videoRef    = useRef<Video>(null);
  const webVideoRef = useRef<any>(null);
  const soundTrimRef = useRef<SoundTrimPlayerRef>(null);

  const [photoPrices, setPhotoPrices] = useState<Record<number, PhotoPrice>>({});
  const [pricingIdx, setPricingIdx] = useState<number | null>(null);
  const [priceModalName, setPriceModalName] = useState("");
  const [priceModalPrice, setPriceModalPrice] = useState("");
  const [priceModalCurrency, setPriceModalCurrency] = useState("FCFA");
  const [showCurrencyDrop, setShowCurrencyDrop] = useState(false);

  const pauseAllMedia = () => {
    try { videoRef.current?.pauseAsync(); } catch (_) {}
    try { webVideoRef.current?.pause(); }  catch (_) {}
  };

  useEffect(() => {
    const unsub = soundPickerStore.onSelected((sound) => {
      setSelectedSound(sound);
      setTrimStartMs(0);
      setTrimEndMs(60000);
    });
    return unsub;
  }, []);

  /* Pause la vidéo dès que cette page perd le focus (navigation vers une autre page) */
  useFocusEffect(
    useCallback(() => {
      return () => { pauseAllMedia(); };
    }, [])
  );

  const pickVideo = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission requise", "Accès à la médiathèque nécessaire.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "videos",
      quality: 1,
      videoMaxDuration: 60,
    });
    if (!result.canceled && result.assets.length > 0) {
      const asset = result.assets[0];
      const durationSec = asset.duration ? asset.duration / 1000 : 0;
      if (durationSec > 60) {
        Alert.alert(
          "Vidéo trop longue",
          `Votre vidéo dure ${Math.round(durationSec)}s. La limite est de 60 secondes (1 minute).`,
          [{ text: "OK" }]
        );
        return;
      }
      setVideoUri(asset.uri);
      setMode("video");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const pickPhotos = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission requise", "Accès à la médiathèque nécessaire.");
      return;
    }
    const remaining = 15 - photos.length;
    if (remaining <= 0) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsMultipleSelection: true,
      selectionLimit: remaining,
      quality: 0.85,
    });
    if (!result.canceled && result.assets.length > 0) {
      setPhotos(prev => [...prev, ...result.assets.map((a) => a.uri)].slice(0, 15));
      setMode("photo");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const canPublish = mode === "video"
    ? !!videoUri
    : mode === "photo"
    ? photos.length > 0 && !!selectedSound
    : false;

  const handleNext = async () => {
    if (mode === "photo" && !selectedSound) {
      Alert.alert("Son requis", "Veuillez choisir un son avant de continuer.");
      return;
    }
    /* Arrêt explicite de la vidéo avant de quitter la page */
    pauseAllMedia();
    await soundTrimRef.current?.stop();
    Haptics.selectionAsync();
    router.push({
      pathname: "/video-publish-settings" as any,
      params: {
        mode: mode ?? "",
        videoUri: videoUri ?? "",
        photos: JSON.stringify(photos),
        soundTitle: selectedSound?.title ?? "",
        soundArtist: selectedSound?.artist ?? "",
        soundUri: selectedSound?.uri ?? "",
        soundTrimStartMs: trimStartMs.toString(),
        soundTrimEndMs: trimEndMs.toString(),
      },
    });
  };

  const pickSound = () => {
    router.push("/sound-picker" as any);
  };

  const removePhoto = (idx: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== idx));
    setPhotoPrices((prev) => {
      const next: Record<number, PhotoPrice> = {};
      Object.entries(prev).forEach(([k, v]) => {
        const i = Number(k);
        if (i < idx) next[i] = v;
        else if (i > idx) next[i - 1] = v;
      });
      return next;
    });
  };

  return (
    <View style={[styles.container, { paddingTop, backgroundColor: dBG }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: dHEAD, borderBottomColor: dBORDER }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={isDark ? "#fff" : "#111827"} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: dTEXT }]}>Ajouter une vidéo</Text>
        <View style={{ width: 70 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: canPublish ? paddingBottom + 90 : paddingBottom + 24 }]}
      >
        {/* Mode selection */}
        <Text style={[styles.sectionLabel, { color: dSUB }]}>Choisissez un type</Text>
        <View style={styles.modeRow}>
          {/* Vidéo card */}
          <TouchableOpacity
            style={[
              styles.modeCard,
              { backgroundColor: dCARD, borderColor: dBORDER },
              mode === "video" && styles.modeCardActive,
              mode === "photo" && styles.modeCardDisabled,
            ]}
            onPress={mode === "photo" ? undefined : pickVideo}
            activeOpacity={mode === "photo" ? 1 : 0.8}
          >
            <View style={[styles.modeIconWrap, { backgroundColor: mode === "video" ? "#FF6B00" : "#1B7A4E" }]}>
              <Ionicons name="videocam" size={18} color="#fff" />
            </View>
            <Text style={[styles.modeTitle, { color: dTEXT }, mode === "photo" && styles.modeDisabledText]}>Vidéo</Text>
            <Text style={[styles.modeDesc, { color: dMUTED }, mode === "photo" && styles.modeDisabledText]}>
              {videoUri ? "Vidéo sélectionnée ✓" : "Depuis votre galerie"}
            </Text>
            {mode === "photo" && (
              <View style={styles.lockedOverlay}>
                <Ionicons name="lock-closed" size={20} color="rgba(255,255,255,0.6)" />
              </View>
            )}
          </TouchableOpacity>

          {/* Photo Vidéo card */}
          <TouchableOpacity
            style={[
              styles.modeCard,
              { backgroundColor: dCARD, borderColor: dBORDER },
              mode === "photo" && styles.modeCardActive,
              mode === "video" && styles.modeCardDisabled,
            ]}
            onPress={mode === "video" ? undefined : pickPhotos}
            activeOpacity={mode === "video" ? 1 : 0.8}
          >
            <View style={[styles.modeIconWrap, { backgroundColor: mode === "photo" ? "#FF6B00" : "#6366F1" }]}>
              <Ionicons name="images" size={18} color="#fff" />
            </View>
            <Text style={[styles.modeTitle, { color: dTEXT }, mode === "video" && styles.modeDisabledText]}>Photo Vidéo</Text>
            <Text style={[styles.modeDesc, { color: dMUTED }, mode === "video" && styles.modeDisabledText]}>
              {photos.length > 0 ? `${photos.length}/15 photos` : "Jusqu'à 15 photos + son"}
            </Text>
            {mode === "video" && (
              <View style={styles.lockedOverlay}>
                <Ionicons name="lock-closed" size={20} color="rgba(255,255,255,0.6)" />
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Reset */}
        {mode !== null && (
          <TouchableOpacity
            onPress={() => { setMode(null); setVideoUri(null); setPhotos([]); setSelectedSound(null); setTrimStartMs(0); setTrimEndMs(60000); setPhotoPrices({}); }}
            style={styles.resetBtn}
          >
            <Ionicons name="refresh-outline" size={14} color="#9CA3AF" />
            <Text style={styles.resetText}>Recommencer</Text>
          </TouchableOpacity>
        )}

        {/* VIDEO preview */}
        {mode === "video" && videoUri && (
          <View style={styles.videoSection}>
            <Text style={[styles.sectionLabel, { color: dSUB }]}>Aperçu</Text>
            <View style={styles.videoWrap}>
              {Platform.OS === "web"
                ? React.createElement("video", {
                    ref: webVideoRef,
                    src: videoUri,
                    controls: true,
                    style: {
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      width: "100%",
                      height: "100%",
                      objectFit: "contain",
                      backgroundColor: "#000",
                    },
                  })
                : (
                  <Video
                    ref={videoRef}
                    source={{ uri: videoUri }}
                    style={styles.videoPlayer}
                    resizeMode={ResizeMode.CONTAIN}
                    useNativeControls
                    isLooping={false}
                  />
                )
              }
            </View>
          </View>
        )}

        {/* PHOTO VIDEO: sound picker + photo grid */}
        {mode === "photo" && (
          <>
            {/* Sound picker (required) */}
            <View style={styles.soundSection}>
              <View style={styles.soundHeader}>
                <Ionicons name="musical-notes-outline" size={18} color="#FF6B00" />
                <Text style={[styles.sectionLabel, { color: dSUB }]}>Son <Text style={styles.required}>* obligatoire</Text></Text>
              </View>
              <TouchableOpacity
                style={[styles.soundPicker, { backgroundColor: isDark ? "#1A1A1A" : "#F3F4F6", borderColor: isDark ? "#2D2D2D" : "rgba(0,0,0,0.1)" }, selectedSound && styles.soundPickerActive]}
                onPress={pickSound}
              >
                {selectedSound ? (
                  <View style={styles.soundSelected}>
                    <View style={styles.soundIconWrap}>
                      <Ionicons name="musical-notes-outline" size={20} color="#FF6B00" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.soundTitle, { color: dTEXT }]} numberOfLines={1}>{selectedSound.title}</Text>
                      <Text style={styles.soundArtist}>{selectedSound.artist}</Text>
                    </View>
                    <TouchableOpacity onPress={() => { setSelectedSound(null); setTrimStartMs(0); setTrimEndMs(60000); }} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                      <Ionicons name="close-circle" size={22} color="#6B7280" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.soundEmpty}>
                    <Ionicons name="musical-notes-outline" size={22} color="#6B7280" />
                    <Text style={styles.soundEmptyText}>Choisir depuis ma galerie</Text>
                    <Ionicons name="chevron-forward" size={18} color="#6B7280" />
                  </View>
                )}
              </TouchableOpacity>

              {/* Audio trim player — shown when a sound is selected */}
              {selectedSound?.uri ? (
                <SoundTrimPlayer
                  ref={soundTrimRef}
                  key={selectedSound.uri}
                  uri={selectedSound.uri}
                  title={selectedSound.title}
                  onTrimChange={(start, end) => { setTrimStartMs(start); setTrimEndMs(end); }}
                />
              ) : null}
            </View>

            {/* Photos grid */}
            {photos.length > 0 && (
              <View style={styles.photosSection}>
                <View style={styles.photosHeader}>
                  <Text style={[styles.sectionLabel, { color: dSUB }]}>Photos ({photos.length}/15)</Text>
                  <TouchableOpacity onPress={pickPhotos}>
                    <Text style={styles.addMoreText}>+ Ajouter</Text>
                  </TouchableOpacity>
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.photoScroll}
                >
                  {photos.map((uri, idx) => (
                    <View key={idx} style={styles.photoThumbWrap}>
                      <Image source={{ uri }} style={styles.photoThumb} resizeMode="cover" />
                      <TouchableOpacity style={styles.removePhotoBtn} onPress={() => removePhoto(idx)}>
                        <Ionicons name="close-circle" size={20} color="#EF4444" />
                      </TouchableOpacity>
                      <View style={styles.photoIndex}>
                        <Text style={styles.photoIndexText}>{idx + 1}</Text>
                      </View>
                      <TouchableOpacity
                        style={[styles.priceTag, photoPrices[idx] ? styles.priceTagFilled : {}]}
                        onPress={() => {
                          const existing = photoPrices[idx];
                          setPriceModalName(existing?.name ?? "");
                          setPriceModalPrice(existing?.price ?? "");
                          setPriceModalCurrency(existing?.currency ?? "FCFA");
                          setShowCurrencyDrop(false);
                          setPricingIdx(idx);
                          Haptics.selectionAsync();
                        }}
                      >
                        <Ionicons name="pricetag-outline" size={9} color="#fff" />
                        <Text style={styles.priceTagText} numberOfLines={1}>
                          {photoPrices[idx] ? `${photoPrices[idx].price} ${photoPrices[idx].currency}` : "Prix"}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                  {photos.length < 15 && (
                    <TouchableOpacity style={[styles.addPhotoBtn, { backgroundColor: isDark ? "#1A1A1A" : "#F3F4F6", borderColor: isDark ? "#2D2D2D" : "rgba(0,0,0,0.1)" }]} onPress={pickPhotos}>
                      <Ionicons name="add" size={28} color="#6B7280" />
                      <Text style={styles.addPhotoText}>{15 - photos.length} restantes</Text>
                    </TouchableOpacity>
                  )}
                </ScrollView>
              </View>
            )}

            {/* Publish hint */}
            {!selectedSound && photos.length > 0 && (
              <View style={styles.hint}>
                <Ionicons name="information-circle-outline" size={16} color="#F59E0B" />
                <Text style={styles.hintText}>Choisissez un son pour pouvoir publier</Text>
              </View>
            )}
          </>
        )}

        {/* Empty state */}
        {mode === null && (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconBg}>
              <Ionicons name="videocam-outline" size={48} color="#FF6B00" />
            </View>
            <Text style={[styles.emptyTitle, { color: dTEXT }]}>Partagez votre contenu</Text>
            <Text style={[styles.emptyDesc, { color: dMUTED }]}>
              Choisissez entre une vidéo classique ou un diaporama photo animé avec musique.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Bottom "Suivant" bar — visible only when content is ready */}
      {canPublish && (
        <View style={[styles.bottomBar, { paddingBottom: paddingBottom + 12, backgroundColor: dBAR, borderTopColor: dBORDER }]}>
          <TouchableOpacity style={styles.nextBtn} onPress={handleNext} activeOpacity={0.85}>
            <Ionicons name="arrow-forward-circle-outline" size={20} color="#fff" />
            <Text style={styles.nextBtnText}>Suivant</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Modal Prix Photo ── */}
      <Modal
        visible={pricingIdx !== null}
        animationType="slide"
        transparent
        onRequestClose={() => setPricingIdx(null)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.priceOverlay}
        >
          <TouchableOpacity style={styles.priceBackdrop} activeOpacity={1} onPress={() => setPricingIdx(null)} />
          <View style={styles.priceSheet}>
            {/* En-tête */}
            <View style={styles.priceSheetHeader}>
              <Text style={styles.priceSheetTitle}>Détails du produit</Text>
              <TouchableOpacity onPress={() => setPricingIdx(null)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="close" size={22} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            {/* Sélecteur monnaie */}
            <View style={styles.currencySection}>
              <Text style={styles.priceLabel}>Monnaie</Text>
              <TouchableOpacity
                style={styles.currencyBtn}
                onPress={() => setShowCurrencyDrop(!showCurrencyDrop)}
              >
                <Text style={styles.currencyBtnText}>{priceModalCurrency}</Text>
                <Ionicons name={showCurrencyDrop ? "chevron-up" : "chevron-down"} size={16} color="#FF6B00" />
              </TouchableOpacity>
              {showCurrencyDrop && (
                <View style={styles.currencyDrop}>
                  <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 180 }}>
                    {CURRENCIES.map(c => (
                      <TouchableOpacity
                        key={c.code}
                        style={[styles.currencyItem, priceModalCurrency === c.code && styles.currencyItemActive]}
                        onPress={() => { setPriceModalCurrency(c.code); setShowCurrencyDrop(false); }}
                      >
                        <Text style={[styles.currencyItemText, priceModalCurrency === c.code && { color: "#FF6B00" }]}>
                          {c.code} • {c.symbol}
                        </Text>
                        {priceModalCurrency === c.code && <Ionicons name="checkmark" size={15} color="#FF6B00" />}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>

            {/* Nom du produit */}
            <View style={styles.priceField}>
              <Text style={styles.priceLabel}>Nom du produit</Text>
              <TextInput
                style={styles.priceInput}
                placeholder="Ex : Pagne wax 6 yards…"
                placeholderTextColor="#4B5563"
                value={priceModalName}
                onChangeText={setPriceModalName}
                onFocus={() => setShowCurrencyDrop(false)}
              />
            </View>

            {/* Prix */}
            <View style={styles.priceField}>
              <Text style={styles.priceLabel}>Prix</Text>
              <TextInput
                style={styles.priceInput}
                placeholder="Ex : 12 500"
                placeholderTextColor="#4B5563"
                value={priceModalPrice}
                onChangeText={setPriceModalPrice}
                keyboardType="numeric"
                onFocus={() => setShowCurrencyDrop(false)}
              />
            </View>

            {/* Bouton Appliquer */}
            {priceModalName.trim().length > 0 && priceModalPrice.trim().length > 0 && (
              <TouchableOpacity
                style={styles.applyBtn}
                onPress={() => {
                  setPhotoPrices(prev => ({
                    ...prev,
                    [pricingIdx!]: {
                      name: priceModalName.trim(),
                      price: priceModalPrice.trim(),
                      currency: priceModalCurrency,
                    },
                  }));
                  setPricingIdx(null);
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                }}
              >
                <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                <Text style={styles.applyBtnText}>Appliquer</Text>
              </TouchableOpacity>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>

    </View>
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
  backBtn: { padding: 4, marginRight: 4 },
  headerTitle: { flex: 1, fontFamily: "Poppins_700Bold", fontSize: 17, color: "#fff", marginLeft: 4 },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: "#111",
    borderTopWidth: 1,
    borderTopColor: "#2D2D2D",
  },
  nextBtn: {
    backgroundColor: "#FF6B00",
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  nextBtnText: { fontFamily: "Poppins_700Bold", fontSize: 16, color: "#fff" },

  scroll: { paddingHorizontal: 16, paddingTop: 20, gap: 16 },

  sectionLabel: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: "#E5E7EB",
    marginBottom: 10,
  },
  required: { color: "#EF4444", fontFamily: "Poppins_400Regular", fontSize: 12 },

  modeRow: { flexDirection: "row", gap: 12 },
  modeCard: {
    flex: 1,
    backgroundColor: "#1E1E1E",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#2D2D2D",
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: "center",
    gap: 5,
    position: "relative",
    overflow: "hidden",
  },
  modeCardActive: { borderColor: "#FF6B00", backgroundColor: "#1E1A15" },
  modeCardDisabled: { borderColor: "#1A1A1A", opacity: 0.4 },
  modeIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  modeTitle: { fontFamily: "Poppins_700Bold", fontSize: 12, color: "#fff", textAlign: "center" },
  modeDesc: { fontFamily: "Poppins_400Regular", fontSize: 10, color: "#9CA3AF", textAlign: "center" },
  modeDisabledText: { color: "#444" },
  lockedOverlay: {
    position: "absolute",
    top: 8,
    right: 8,
  },

  resetBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-end",
    paddingVertical: 4,
  },
  resetText: { fontFamily: "Poppins_400Regular", fontSize: 12, color: "#9CA3AF" },

  videoSection: { gap: 4 },
  videoWrap: {
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#000",
    width: "65%",
    aspectRatio: 9 / 16,
    alignSelf: "center",
    position: "relative",
  },
  videoPlayer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  soundSection: { gap: 4 },
  soundHeader: { flexDirection: "row", alignItems: "center", gap: 6 },
  soundPicker: {
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#2D2D2D",
    borderStyle: "dashed",
    backgroundColor: "#1A1A1A",
    overflow: "hidden",
  },
  soundPickerActive: { borderColor: "#22C55E", borderStyle: "solid" },
  soundEmpty: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 10,
  },
  soundEmptyText: { flex: 1, fontFamily: "Poppins_500Medium", fontSize: 14, color: "#6B7280" },
  soundSelected: { flexDirection: "row", alignItems: "center", padding: 14, gap: 12 },
  soundIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FF6B0020",
    alignItems: "center",
    justifyContent: "center",
  },
  soundTitle: { fontFamily: "Poppins_600SemiBold", fontSize: 13, color: "#fff" },
  soundArtist: { fontFamily: "Poppins_400Regular", fontSize: 11, color: "#9CA3AF", marginTop: 2 },

  photosSection: { gap: 8 },
  photosHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  addMoreText: { fontFamily: "Poppins_600SemiBold", fontSize: 13, color: "#FF6B00" },
  photoScroll: { paddingBottom: 4, gap: 10 },
  photoThumbWrap: { position: "relative" },
  photoThumb: { width: 110, height: 140, borderRadius: 10 },
  removePhotoBtn: { position: "absolute", top: -6, right: -6 },
  photoIndex: {
    position: "absolute",
    bottom: 6,
    left: 6,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  photoIndexText: { fontFamily: "Poppins_700Bold", fontSize: 10, color: "#fff" },
  addPhotoBtn: {
    width: 110,
    height: 140,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#2D2D2D",
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    backgroundColor: "#1A1A1A",
  },
  addPhotoText: { fontFamily: "Poppins_400Regular", fontSize: 10, color: "#6B7280", textAlign: "center" },

  hint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#2A2000",
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: "#F59E0B40",
  },
  hintText: { fontFamily: "Poppins_400Regular", fontSize: 12, color: "#F59E0B", flex: 1 },

  emptyState: { alignItems: "center", paddingVertical: 40, gap: 14 },
  emptyIconBg: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#FF6B0015",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#FF6B0030",
  },
  emptyTitle: { fontFamily: "Poppins_700Bold", fontSize: 18, color: "#fff" },
  emptyDesc: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: "#9CA3AF",
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 20,
  },

  priceTag: {
    position: "absolute",
    bottom: 6,
    right: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#EF4444",
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 3,
  },
  priceTagFilled: { backgroundColor: "#22C55E" },
  priceTagText: { fontFamily: "Poppins_700Bold", fontSize: 9, color: "#fff", maxWidth: 60 },

  priceOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  priceBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  priceSheet: {
    backgroundColor: "#1A1A1A",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
    gap: 14,
  },
  priceSheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  priceSheetTitle: { fontFamily: "Poppins_700Bold", fontSize: 16, color: "#fff" },

  currencySection: { gap: 6 },
  currencyBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#252525",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#3D3D3D",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  currencyBtnText: { fontFamily: "Poppins_600SemiBold", fontSize: 14, color: "#fff" },
  currencyDrop: {
    backgroundColor: "#252525",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#3D3D3D",
    overflow: "hidden",
  },
  currencyItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#333",
  },
  currencyItemActive: { backgroundColor: "#FF6B0015" },
  currencyItemText: { flex: 1, fontFamily: "Poppins_500Medium", fontSize: 13, color: "#E5E7EB" },

  priceField: { gap: 6 },
  priceLabel: { fontFamily: "Poppins_600SemiBold", fontSize: 12, color: "#9CA3AF" },
  priceInput: {
    backgroundColor: "#252525",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#3D3D3D",
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: "#fff",
  },
  applyBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#22C55E",
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 4,
  },
  applyBtnText: { fontFamily: "Poppins_700Bold", fontSize: 15, color: "#fff" },

});
