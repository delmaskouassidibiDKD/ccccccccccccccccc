import React, { useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Platform, Alert, Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { fs, ms } from "@/lib/responsive";

const BG = "#0D1117";
const CARD = "#161B25";
const CARD2 = "#1C2230";
const BLUE = "#3B82F6";
const BORDER = "rgba(255,255,255,0.08)";
const TEXT = "#FFFFFF";
const TEXT_MUTED = "rgba(255,255,255,0.45)";
const TEXT_SUB = "rgba(255,255,255,0.7)";
const ERROR_C = "#EF4444";
const SUCCESS = "#22C55E";

const SELLER_SHOP_TYPES_KEY = "@dkd:seller_shop_types";

const SUPPLY_COUNTRIES = [
  { code: "CI", name: "Côte d'Ivoire", flag: "🇨🇮" },
  { code: "SN", name: "Sénégal",        flag: "🇸🇳" },
  { code: "ML", name: "Mali",           flag: "🇲🇱" },
  { code: "BF", name: "Burkina Faso",   flag: "🇧🇫" },
  { code: "GH", name: "Ghana",          flag: "🇬🇭" },
  { code: "NG", name: "Nigeria",        flag: "🇳🇬" },
  { code: "GN", name: "Guinée",         flag: "🇬🇳" },
  { code: "TG", name: "Togo",           flag: "🇹🇬" },
  { code: "BJ", name: "Bénin",          flag: "🇧🇯" },
  { code: "NE", name: "Niger",          flag: "🇳🇪" },
  { code: "CM", name: "Cameroun",       flag: "🇨🇲" },
  { code: "GA", name: "Gabon",          flag: "🇬🇦" },
  { code: "CG", name: "Congo",          flag: "🇨🇬" },
  { code: "MR", name: "Mauritanie",     flag: "🇲🇷" },
  { code: "SL", name: "Sierra Leone",   flag: "🇸🇱" },
];

export default function WholesalerRegistrationScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 0 : insets.top;

  const [companyName, setCompanyName] = useState("");
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);
  const [commerceReg, setCommerceReg] = useState("");
  const [companyNumber, setCompanyNumber] = useState("");
  const [wholesalerName, setWholesalerName] = useState("");
  const [supplyCountries, setSupplyCountries] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const toggleSupplyCountry = (code: string) =>
    setSupplyCountries((p) => p.includes(code) ? p.filter((x) => x !== code) : [...p, code]);

  const pickLogo = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission requise", "Veuillez autoriser l'accès à la galerie photo.");
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });
      if (!result.canceled && result.assets[0]) {
        setCompanyLogo(result.assets[0].uri);
      }
    } catch {
      Alert.alert("Erreur", "Impossible d'accéder à la galerie.");
    }
  };

  const handleSubmit = async () => {
    if (!companyName.trim()) return Alert.alert("Champ requis", "Veuillez entrer le nom de la société.");
    if (!wholesalerName.trim()) return Alert.alert("Champ requis", "Veuillez entrer le nom du grossiste.");
    if (!commerceReg.trim()) return Alert.alert("Champ requis", "Veuillez entrer le numéro de registre de commerce.");
    if (!companyNumber.trim()) return Alert.alert("Champ requis", "Veuillez entrer le numéro de la société.");
    if (supplyCountries.length === 0) return Alert.alert("Champ requis", "Veuillez sélectionner au moins un pays de fourniture.");

    setSubmitting(true);
    try {
      const saved = await AsyncStorage.getItem(SELLER_SHOP_TYPES_KEY);
      const types: string[] = saved ? JSON.parse(saved) : [];
      if (!types.includes("grossiste")) {
        await AsyncStorage.setItem(SELLER_SHOP_TYPES_KEY, JSON.stringify([...types, "grossiste"]));
      }
      Alert.alert(
        "Dossier soumis ✓",
        "Votre inscription en tant que grossiste a été envoyée. Notre équipe validera votre dossier sous 24–48h.",
        [{ text: "Compris", onPress: () => router.back() }]
      );
    } catch {
      Alert.alert("Erreur", "Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={[s.container, { paddingTop: topPad }]}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>Inscription Grossiste</Text>
          <Text style={s.headerSub}>Ventes en volume sur DKD-MARKET</Text>
        </View>
        <View style={s.headerBadge}>
          <Ionicons name="cube-outline" size={14} color={BLUE} />
          <Text style={s.headerBadgeText}>Pro</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}>
        {/* Banner */}
        <View style={s.infoBanner}>
          <Ionicons name="information-circle" size={20} color={BLUE} />
          <Text style={s.infoBannerText}>
            En tant que grossiste DKD, vous pourrez proposer vos produits en grande quantité avec des tarifs dégressifs pour les revendeurs de la plateforme.
          </Text>
        </View>

        {/* Logo de la société */}
        <View style={s.card}>
          <View style={s.sectionHeader}>
            <View style={[s.sectionDot, { backgroundColor: BLUE }]} />
            <Text style={s.sectionTitle}>Logo de la société</Text>
          </View>

          <TouchableOpacity style={s.logoArea} onPress={pickLogo} activeOpacity={0.8}>
            {companyLogo ? (
              <Image source={{ uri: companyLogo }} style={s.logoPreview} />
            ) : (
              <View style={s.logoPlaceholder}>
                <Ionicons name="business-outline" size={36} color={BLUE} />
              </View>
            )}
            <View style={s.logoInfo}>
              <Text style={s.logoTitle}>
                {companyLogo ? "Logo ajouté" : "Logo de votre société"}
              </Text>
              <Text style={s.logoHint}>
                {companyLogo
                  ? "Appuyer pour modifier"
                  : "Format carré recommandé (PNG, JPG)"}
              </Text>
            </View>
            <View style={[s.logoBtn, { backgroundColor: companyLogo ? SUCCESS + "22" : BLUE + "22", borderColor: companyLogo ? SUCCESS + "55" : BLUE + "55" }]}>
              <Ionicons name={companyLogo ? "checkmark" : "camera-outline"} size={18} color={companyLogo ? SUCCESS : BLUE} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Informations */}
        <View style={s.card}>
          <View style={s.sectionHeader}>
            <View style={[s.sectionDot, { backgroundColor: BLUE }]} />
            <Text style={s.sectionTitle}>Informations de la société</Text>
          </View>

          <View style={s.fieldRow}>
            <Text style={s.fieldLabel}>Nom de la société <Text style={{ color: ERROR_C }}>*</Text></Text>
            <View style={s.inputWrap}>
              <Ionicons name="business-outline" size={18} color={TEXT_MUTED} />
              <TextInput
                style={s.input}
                value={companyName}
                onChangeText={setCompanyName}
                placeholder="Ex: DKD Commerce SARL"
                placeholderTextColor={TEXT_MUTED}
              />
            </View>
          </View>

          <View style={s.fieldRow}>
            <Text style={s.fieldLabel}>Nom du grossiste <Text style={{ color: ERROR_C }}>*</Text></Text>
            <View style={s.inputWrap}>
              <Ionicons name="person-outline" size={18} color={TEXT_MUTED} />
              <TextInput
                style={s.input}
                value={wholesalerName}
                onChangeText={setWholesalerName}
                placeholder="Prénom et Nom du responsable"
                placeholderTextColor={TEXT_MUTED}
              />
            </View>
          </View>

          <View style={s.fieldRow}>
            <Text style={s.fieldLabel}>Registre de commerce <Text style={{ color: ERROR_C }}>*</Text></Text>
            <View style={s.inputWrap}>
              <Ionicons name="document-text-outline" size={18} color={TEXT_MUTED} />
              <TextInput
                style={s.input}
                value={commerceReg}
                onChangeText={setCommerceReg}
                placeholder="RC n° XXXXXXX"
                placeholderTextColor={TEXT_MUTED}
              />
            </View>
          </View>

          <View style={s.fieldRow}>
            <Text style={s.fieldLabel}>Numéro de la société <Text style={{ color: ERROR_C }}>*</Text></Text>
            <View style={s.inputWrap}>
              <Ionicons name="call-outline" size={18} color={TEXT_MUTED} />
              <TextInput
                style={s.input}
                value={companyNumber}
                onChangeText={setCompanyNumber}
                placeholder="+225 XX XX XX XX"
                placeholderTextColor={TEXT_MUTED}
                keyboardType="phone-pad"
              />
            </View>
          </View>
        </View>

        {/* Pays de fourniture */}
        <View style={s.card}>
          <View style={s.sectionHeader}>
            <View style={[s.sectionDot, { backgroundColor: BLUE }]} />
            <Text style={s.sectionTitle}>Pays de fourniture</Text>
          </View>
          <Text style={s.fieldLabel}>
            Où pouvez-vous fournir ? <Text style={{ color: ERROR_C }}>*</Text>
          </Text>
          <Text style={[s.fieldLabel, { fontFamily: "Poppins_400Regular", fontSize: fs(11), color: TEXT_MUTED, marginTop: -6 }]}>
            {supplyCountries.length} pays sélectionné{supplyCountries.length > 1 ? "s" : ""}
          </Text>

          <TouchableOpacity
            style={s.selectAllBtn}
            onPress={() => setSupplyCountries(
              supplyCountries.length === SUPPLY_COUNTRIES.length
                ? []
                : SUPPLY_COUNTRIES.map((c) => c.code)
            )}
          >
            <Ionicons name={supplyCountries.length === SUPPLY_COUNTRIES.length ? "close-circle-outline" : "checkmark-circle-outline"} size={14} color={BLUE} />
            <Text style={s.selectAllText}>
              {supplyCountries.length === SUPPLY_COUNTRIES.length ? "Tout désélectionner" : "Sélectionner les 15 pays"}
            </Text>
          </TouchableOpacity>

          <View style={s.countriesGrid}>
            {SUPPLY_COUNTRIES.map((c) => {
              const active = supplyCountries.includes(c.code);
              return (
                <TouchableOpacity
                  key={c.code}
                  style={[s.countryBtn, active && { backgroundColor: BLUE + "22", borderColor: BLUE + "77" }]}
                  onPress={() => toggleSupplyCountry(c.code)}
                  activeOpacity={0.75}
                >
                  <Text style={s.countryFlag}>{c.flag}</Text>
                  <Text style={[s.countryName, active && { color: BLUE }]}>{c.name}</Text>
                  {active && <Ionicons name="checkmark-circle" size={14} color={BLUE} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Avantages */}
        <View style={s.card}>
          <View style={s.sectionHeader}>
            <View style={[s.sectionDot, { backgroundColor: BLUE }]} />
            <Text style={s.sectionTitle}>Avantages grossiste DKD</Text>
          </View>
          {[
            { icon: "trending-up-outline", text: "Ventes en volume avec tarifs dégressifs" },
            { icon: "people-outline", text: "Accès direct aux revendeurs de la plateforme" },
            { icon: "analytics-outline", text: "Tableau de bord dédié avec statistiques avancées" },
            { icon: "shield-checkmark-outline", text: "Badge « Grossiste Vérifié » sur votre boutique" },
          ].map((item, i) => (
            <View key={i} style={s.advantageRow}>
              <View style={s.advantageIcon}>
                <Ionicons name={item.icon as any} size={18} color={BLUE} />
              </View>
              <Text style={s.advantageText}>{item.text}</Text>
            </View>
          ))}
        </View>

        {/* Submit */}
        <TouchableOpacity
          style={[s.submitBtn, submitting && { opacity: 0.6 }]}
          onPress={handleSubmit}
          activeOpacity={0.85}
          disabled={submitting}
        >
          <Ionicons name="send" size={20} color="#fff" />
          <Text style={s.submitBtnText}>
            {submitting ? "Envoi en cours..." : "Soumettre ma candidature"}
          </Text>
        </TouchableOpacity>

        <Text style={s.submitNote}>
          Dossier examiné sous 24–48 heures. Vous serez notifié dès la validation.
        </Text>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },

  header: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: 16, paddingBottom: 12, paddingTop: 8,
    borderBottomWidth: 1, borderBottomColor: BORDER,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: CARD2,
    alignItems: "center", justifyContent: "center",
  },
  headerTitle: { fontFamily: "Poppins_700Bold", fontSize: fs(16), color: TEXT },
  headerSub: { fontFamily: "Poppins_400Regular", fontSize: fs(11), color: TEXT_MUTED },
  headerBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: BLUE + "18", borderWidth: 1, borderColor: BLUE + "44",
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4,
  },
  headerBadgeText: { fontFamily: "Poppins_600SemiBold", fontSize: fs(11), color: BLUE },

  infoBanner: {
    flexDirection: "row", gap: 10, alignItems: "flex-start",
    margin: 16, backgroundColor: BLUE + "14", borderWidth: 1, borderColor: BLUE + "40",
    borderRadius: 12, padding: 14,
  },
  infoBannerText: { flex: 1, fontFamily: "Poppins_400Regular", fontSize: fs(12), color: TEXT_SUB, lineHeight: 18 },

  card: {
    marginHorizontal: 16, marginBottom: 12, backgroundColor: CARD,
    borderRadius: 16, padding: 16, borderWidth: 1, borderColor: BORDER, gap: 14,
  },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  sectionDot: { width: 8, height: 8, borderRadius: 4 },
  sectionTitle: { fontFamily: "Poppins_700Bold", fontSize: fs(15), color: TEXT },

  logoArea: {
    flexDirection: "row", alignItems: "center", gap: 14,
    backgroundColor: CARD2, borderWidth: 1.5, borderColor: BORDER,
    borderRadius: 14, padding: 14, borderStyle: "dashed",
  },
  logoPlaceholder: {
    width: 64, height: 64, borderRadius: 14, backgroundColor: BLUE + "18",
    alignItems: "center", justifyContent: "center",
  },
  logoPreview: { width: 64, height: 64, borderRadius: 14 },
  logoInfo: { flex: 1, gap: 4 },
  logoTitle: { fontFamily: "Poppins_600SemiBold", fontSize: fs(14), color: TEXT },
  logoHint: { fontFamily: "Poppins_400Regular", fontSize: fs(12), color: TEXT_MUTED },
  logoBtn: {
    width: 36, height: 36, borderRadius: 10, borderWidth: 1,
    alignItems: "center", justifyContent: "center",
  },

  fieldRow: { gap: 6 },
  fieldLabel: { fontFamily: "Poppins_500Medium", fontSize: fs(13), color: TEXT_SUB },
  inputWrap: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: CARD2, borderWidth: 1, borderColor: BORDER,
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 11,
  },
  input: { flex: 1, color: TEXT, fontFamily: "Poppins_400Regular", fontSize: fs(14) },

  advantageRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  advantageIcon: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: BLUE + "18",
    alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  advantageText: { flex: 1, fontFamily: "Poppins_400Regular", fontSize: fs(13), color: TEXT_SUB, lineHeight: 20 },

  submitBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10,
    backgroundColor: BLUE, marginHorizontal: 16, borderRadius: 14,
    paddingVertical: ms(15), marginTop: 8,
  },
  submitBtnText: { fontFamily: "Poppins_700Bold", fontSize: fs(16), color: "#fff" },
  submitNote: {
    textAlign: "center", fontFamily: "Poppins_400Regular", fontSize: fs(12),
    color: TEXT_MUTED, marginHorizontal: 24, marginTop: 12, lineHeight: 18,
  },

  selectAllBtn: {
    flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start",
    backgroundColor: CARD2, borderWidth: 1, borderColor: BLUE + "44",
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7,
  },
  selectAllText: { fontFamily: "Poppins_500Medium", fontSize: fs(12), color: BLUE },

  countriesGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  countryBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    borderWidth: 1, borderColor: BORDER, borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 8, backgroundColor: CARD2,
  },
  countryFlag: { fontSize: fs(16) },
  countryName: { fontFamily: "Poppins_500Medium", fontSize: fs(12), color: TEXT_SUB },
});
