import React, { useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Platform, Alert, Image, Modal,
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
const AMBER = "#F59E0B";
const BORDER = "rgba(255,255,255,0.08)";
const TEXT = "#FFFFFF";
const TEXT_MUTED = "rgba(255,255,255,0.45)";
const TEXT_SUB = "rgba(255,255,255,0.7)";
const ERROR_C = "#EF4444";
const SUCCESS = "#22C55E";

const SELLER_SHOP_TYPES_KEY = "@dkd:seller_shop_types";

const TARGET_COUNTRIES = [
  { code: "CI", name: "Côte d'Ivoire", flag: "🇨🇮" },
  { code: "SN", name: "Sénégal", flag: "🇸🇳" },
  { code: "ML", name: "Mali", flag: "🇲🇱" },
  { code: "BF", name: "Burkina Faso", flag: "🇧🇫" },
  { code: "GH", name: "Ghana", flag: "🇬🇭" },
  { code: "NG", name: "Nigeria", flag: "🇳🇬" },
  { code: "GN", name: "Guinée", flag: "🇬🇳" },
  { code: "TG", name: "Togo", flag: "🇹🇬" },
  { code: "BJ", name: "Bénin", flag: "🇧🇯" },
  { code: "NE", name: "Niger", flag: "🇳🇪" },
  { code: "CM", name: "Cameroun", flag: "🇨🇲" },
  { code: "GA", name: "Gabon", flag: "🇬🇦" },
  { code: "CG", name: "Congo", flag: "🇨🇬" },
  { code: "MR", name: "Mauritanie", flag: "🇲🇷" },
  { code: "SL", name: "Sierra Leone", flag: "🇸🇱" },
];

const PRODUCT_TYPES = [
  { id: "food", label: "Alimentation & Boissons", icon: "fast-food-outline" },
  { id: "tech", label: "Électronique", icon: "phone-portrait-outline" },
  { id: "fashion", label: "Vêtements & Mode", icon: "shirt-outline" },
  { id: "beauty", label: "Cosmétiques & Beauté", icon: "color-palette-outline" },
  { id: "furniture", label: "Mobilier & Déco", icon: "home-outline" },
  { id: "construction", label: "Construction", icon: "construct-outline" },
  { id: "health", label: "Santé & Pharma", icon: "medkit-outline" },
  { id: "kids", label: "Jouets & Enfants", icon: "game-controller-outline" },
  { id: "agriculture", label: "Agriculture", icon: "leaf-outline" },
  { id: "auto", label: "Auto & Pièces", icon: "car-outline" },
];

const EXPORT_COUNTRIES = [
  "Chine", "France", "Turquie", "Inde", "Émirats Arabes Unis",
  "Allemagne", "Italie", "Espagne", "États-Unis", "Royaume-Uni",
  "Maroc", "Algérie", "Tunisie", "Égypte", "Afrique du Sud",
  "Kenya", "Éthiopie", "Belgique", "Portugal", "Pays-Bas",
  "Brésil", "Canada", "Japon", "Corée du Sud", "Malaisie",
  "Indonésie", "Pakistan", "Bangladesh", "Vietnam", "Thaïlande",
];

function SectionHeader({ step, title, icon }: { step: number; title: string; icon: string }) {
  return (
    <View style={s.sectionHeader}>
      <View style={s.sectionStepCircle}>
        <Text style={s.sectionStep}>{step}</Text>
      </View>
      <Ionicons name={icon as any} size={18} color={AMBER} />
      <Text style={s.sectionTitle}>{title}</Text>
    </View>
  );
}

function FieldRow({
  label, value, onChangeText, placeholder, keyboardType, multiline, required,
}: {
  label: string; value: string; onChangeText: (t: string) => void;
  placeholder?: string; keyboardType?: any; multiline?: boolean; required?: boolean;
}) {
  return (
    <View style={s.fieldRow}>
      <Text style={s.fieldLabel}>
        {label}{required && <Text style={{ color: ERROR_C }}> *</Text>}
      </Text>
      <TextInput
        style={[s.fieldInput, multiline && { height: 80, textAlignVertical: "top", paddingTop: 10 }]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder || label}
        placeholderTextColor={TEXT_MUTED}
        keyboardType={keyboardType || "default"}
        multiline={multiline}
        numberOfLines={multiline ? 4 : 1}
      />
    </View>
  );
}

function PhotoUpload({
  label, uri, onPick, icon, required,
}: {
  label: string; uri: string | null; onPick: () => void; icon: string; required?: boolean;
}) {
  return (
    <TouchableOpacity style={s.photoBtn} onPress={onPick} activeOpacity={0.75}>
      {uri ? (
        <Image source={{ uri }} style={s.photoPreview} />
      ) : (
        <View style={s.photoPlaceholder}>
          <Ionicons name={icon as any} size={30} color={AMBER} />
        </View>
      )}
      <View style={s.photoInfo}>
        <Text style={s.photoLabel}>
          {label}{required && <Text style={{ color: ERROR_C }}> *</Text>}
        </Text>
        <Text style={s.photoHint}>{uri ? "✓ Photo ajoutée — Appuyer pour changer" : "Appuyer pour ajouter une photo"}</Text>
        {uri && (
          <View style={s.photoBadge}>
            <Ionicons name="checkmark-circle" size={14} color={SUCCESS} />
            <Text style={[s.photoHint, { color: SUCCESS, marginTop: 0 }]}>Prêt</Text>
          </View>
        )}
      </View>
      <Ionicons name={uri ? "camera" : "add-circle-outline"} size={22} color={uri ? SUCCESS : AMBER} />
    </TouchableOpacity>
  );
}

export default function ImporterRegistrationScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 0 : insets.top;

  const [companyName, setCompanyName] = useState("");
  const [supplierName, setSupplierName] = useState("");
  const [representantName, setRepresentantName] = useState("");
  const [commerceReg, setCommerceReg] = useState("");
  const [exportCountry, setExportCountry] = useState("");
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");

  const [idRecto, setIdRecto] = useState<string | null>(null);
  const [idVerso, setIdVerso] = useState<string | null>(null);
  const [selfie, setSelfie] = useState<string | null>(null);

  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");

  const [productTypes, setProductTypes] = useState<string[]>([]);
  const [productDesc, setProductDesc] = useState("");

  const [targetCountries, setTargetCountries] = useState<string[]>([]);

  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptAntiFraud, setAcceptAntiFraud] = useState(false);
  const [acceptVerification, setAcceptVerification] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  const pickImage = async (setter: (uri: string) => void) => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission requise", "Veuillez autoriser l'accès à la galerie photo.");
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]) {
        setter(result.assets[0].uri);
      }
    } catch {
      Alert.alert("Erreur", "Impossible d'accéder à la galerie.");
    }
  };

  const toggleProductType = (id: string) =>
    setProductTypes((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);

  const toggleTargetCountry = (code: string) =>
    setTargetCountries((p) => p.includes(code) ? p.filter((x) => x !== code) : [...p, code]);

  const filteredExportCountries = EXPORT_COUNTRIES.filter((c) =>
    c.toLowerCase().includes(countrySearch.toLowerCase())
  );

  const handleSubmit = async () => {
    if (!companyName.trim()) return Alert.alert("Champ requis", "Veuillez entrer le nom de l'entreprise.");
    if (!supplierName.trim()) return Alert.alert("Champ requis", "Veuillez entrer le nom du fournisseur.");
    if (!representantName.trim()) return Alert.alert("Champ requis", "Veuillez entrer le nom du représentant.");
    if (!exportCountry) return Alert.alert("Champ requis", "Veuillez sélectionner le pays d'exportation.");
    if (!idRecto) return Alert.alert("Document requis", "Veuillez ajouter la photo recto de votre pièce d'identité.");
    if (!idVerso) return Alert.alert("Document requis", "Veuillez ajouter la photo verso de votre pièce d'identité.");
    if (!selfie) return Alert.alert("Photo requise", "Veuillez ajouter une photo directe de vous.");
    if (!phone.trim()) return Alert.alert("Champ requis", "Veuillez entrer votre numéro de téléphone.");
    if (!email.trim()) return Alert.alert("Champ requis", "Veuillez entrer votre adresse e-mail professionnelle.");
    if (productTypes.length === 0) return Alert.alert("Champ requis", "Veuillez sélectionner au moins un type de produit.");
    if (!productDesc.trim()) return Alert.alert("Champ requis", "Veuillez décrire vos produits.");
    if (targetCountries.length === 0) return Alert.alert("Champ requis", "Veuillez sélectionner au moins un pays cible.");
    if (!acceptTerms) return Alert.alert("Conditions requises", "Vous devez accepter les conditions d'utilisation.");
    if (!acceptAntiFraud) return Alert.alert("Déclaration requise", "Vous devez accepter la charte anti-fraude.");
    if (!acceptVerification) return Alert.alert("Vérification requise", "Vous devez autoriser la vérification de vos informations.");

    setSubmitting(true);
    try {
      const saved = await AsyncStorage.getItem(SELLER_SHOP_TYPES_KEY);
      const types: string[] = saved ? JSON.parse(saved) : [];
      if (!types.includes("importe")) {
        await AsyncStorage.setItem(SELLER_SHOP_TYPES_KEY, JSON.stringify([...types, "importe"]));
      }
      Alert.alert(
        "Demande envoyée ✓",
        "Votre dossier importateur a été soumis pour vérification. Notre équipe examinera vos documents sous 48–72h. Vous recevrez une notification dès la validation.",
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
          <Text style={s.headerTitle}>Vérification Importateur</Text>
          <Text style={s.headerSub}>Dossier de candidature</Text>
        </View>
        <View style={s.headerBadge}>
          <Ionicons name="shield-checkmark" size={14} color={AMBER} />
          <Text style={s.headerBadgeText}>Sécurisé</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}>
        {/* Banner */}
        <View style={s.infoBanner}>
          <Ionicons name="information-circle" size={20} color={AMBER} />
          <Text style={s.infoBannerText}>
            Pour activer le mode Importés et vendre des produits internationaux sur DKD-MARKET, votre dossier sera examiné par notre équipe. Les informations sont protégées et utilisées uniquement pour la vérification.
          </Text>
        </View>

        {/* Section 1 - Entreprise */}
        <View style={s.card}>
          <SectionHeader step={1} title="Informations sur l'entreprise" icon="business-outline" />
          <FieldRow label="Nom de l'entreprise" value={companyName} onChangeText={setCompanyName} placeholder="Ex: DKD Import SARL" required />
          <FieldRow label="Nom du fournisseur" value={supplierName} onChangeText={setSupplierName} placeholder="Ex: Guangzhou Trade Co." required />
          <FieldRow label="Nom complet du représentant" value={representantName} onChangeText={setRepresentantName} placeholder="Prénom et Nom" required />
          <FieldRow label="Numéro Registre de Commerce" value={commerceReg} onChangeText={setCommerceReg} placeholder="RC n° (si disponible)" />

          <Text style={s.fieldLabel}>
            Pays d'exportation <Text style={{ color: ERROR_C }}>*</Text>
          </Text>
          <TouchableOpacity style={s.pickerBtn} onPress={() => setShowCountryPicker(true)}>
            <Ionicons name="earth-outline" size={18} color={exportCountry ? AMBER : TEXT_MUTED} />
            <Text style={[s.pickerBtnText, { color: exportCountry ? TEXT : TEXT_MUTED }]}>
              {exportCountry || "Sélectionner le pays d'exportation"}
            </Text>
            <Ionicons name="chevron-down" size={16} color={TEXT_MUTED} />
          </TouchableOpacity>
        </View>

        {/* Section 2 - Identité */}
        <View style={s.card}>
          <SectionHeader step={2} title="Pièces d'identité & Documents" icon="id-card-outline" />
          <View style={s.securityNote}>
            <Ionicons name="lock-closed" size={14} color="#3B82F6" />
            <Text style={s.securityNoteText}>
              Vos documents sont chiffrés et ne seront accessibles qu'à l'équipe de vérification DKD.
            </Text>
          </View>
          <PhotoUpload
            label="Carte d'identité — Recto"
            uri={idRecto}
            onPick={() => pickImage((uri) => setIdRecto(uri))}
            icon="card-outline"
            required
          />
          <PhotoUpload
            label="Carte d'identité — Verso"
            uri={idVerso}
            onPick={() => pickImage((uri) => setIdVerso(uri))}
            icon="card-outline"
            required
          />
          <PhotoUpload
            label="Votre photo (selfie direct)"
            uri={selfie}
            onPick={() => pickImage((uri) => setSelfie(uri))}
            icon="person-circle-outline"
            required
          />
          <View style={s.photoNote}>
            <Ionicons name="alert-circle-outline" size={14} color={AMBER} />
            <Text style={s.photoNoteText}>
              Le selfie doit montrer clairement votre visage. Les documents doivent être lisibles et non expirés.
            </Text>
          </View>
        </View>

        {/* Section 3 - Contact */}
        <View style={s.card}>
          <SectionHeader step={3} title="Coordonnées professionnelles" icon="call-outline" />
          <FieldRow label="Téléphone principal" value={phone} onChangeText={setPhone} placeholder="+225 XX XX XX XX" keyboardType="phone-pad" required />
          <FieldRow label="WhatsApp" value={whatsapp} onChangeText={setWhatsapp} placeholder="+225 XX XX XX XX (optionnel)" keyboardType="phone-pad" />
          <FieldRow label="E-mail professionnel" value={email} onChangeText={setEmail} placeholder="contact@entreprise.com" keyboardType="email-address" required />
        </View>

        {/* Section 4 - Produits */}
        <View style={s.card}>
          <SectionHeader step={4} title="Produits & Services" icon="cube-outline" />
          <Text style={s.fieldLabel}>
            Type de produits exportés <Text style={{ color: ERROR_C }}>*</Text>
          </Text>
          <Text style={s.fieldHint}>Sélectionnez tous les types applicables</Text>
          <View style={s.chipGrid}>
            {PRODUCT_TYPES.map((pt) => {
              const active = productTypes.includes(pt.id);
              return (
                <TouchableOpacity
                  key={pt.id}
                  style={[s.chip, active && { backgroundColor: AMBER + "22", borderColor: AMBER + "88" }]}
                  onPress={() => toggleProductType(pt.id)}
                  activeOpacity={0.75}
                >
                  <Ionicons name={pt.icon as any} size={14} color={active ? AMBER : TEXT_MUTED} />
                  <Text style={[s.chipText, active && { color: AMBER }]}>{pt.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <FieldRow
            label="Description détaillée des produits"
            value={productDesc}
            onChangeText={setProductDesc}
            placeholder="Décrivez les produits que vous importez, leur origine, leur qualité..."
            multiline
            required
          />
        </View>

        {/* Section 5 - Pays cibles */}
        <View style={s.card}>
          <SectionHeader step={5} title="Marchés cibles" icon="globe-outline" />
          <Text style={s.fieldLabel}>
            Pays d'importation <Text style={{ color: ERROR_C }}>*</Text>
          </Text>
          <Text style={s.fieldHint}>
            Sélectionnez les pays où vous souhaitez vendre ({targetCountries.length}/15)
          </Text>
          <TouchableOpacity style={s.selectAllBtn} onPress={() => setTargetCountries(targetCountries.length === TARGET_COUNTRIES.length ? [] : TARGET_COUNTRIES.map((c) => c.code))}>
            <Text style={s.selectAllText}>
              {targetCountries.length === TARGET_COUNTRIES.length ? "Tout désélectionner" : "Sélectionner les 15 pays"}
            </Text>
          </TouchableOpacity>
          <View style={s.countriesGrid}>
            {TARGET_COUNTRIES.map((c) => {
              const active = targetCountries.includes(c.code);
              return (
                <TouchableOpacity
                  key={c.code}
                  style={[s.countryBtn, active && { backgroundColor: "#22C55E22", borderColor: "#22C55E77" }]}
                  onPress={() => toggleTargetCountry(c.code)}
                  activeOpacity={0.75}
                >
                  <Text style={s.countryFlag}>{c.flag}</Text>
                  <Text style={[s.countryName, active && { color: SUCCESS }]}>{c.name}</Text>
                  {active && <Ionicons name="checkmark-circle" size={14} color={SUCCESS} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Section 6 - Sécurité & Anti-fraude */}
        <View style={s.card}>
          <SectionHeader step={6} title="Sécurité & Vérification" icon="shield-outline" />

          <View style={s.fraudWarning}>
            <Ionicons name="warning-outline" size={18} color={ERROR_C} />
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={[s.fraudTitle, { color: ERROR_C }]}>Politique anti-fraude DKD</Text>
              <Text style={s.fraudText}>
                Toute fausse déclaration, document falsifié ou activité frauduleuse entraînera la suspension immédiate et définitive du compte, ainsi qu'un signalement aux autorités compétentes.
              </Text>
            </View>
          </View>

          <View style={s.checkRow}>
            <TouchableOpacity style={[s.checkbox, acceptTerms && s.checkboxActive]} onPress={() => setAcceptTerms((v) => !v)}>
              {acceptTerms && <Ionicons name="checkmark" size={14} color="#fff" />}
            </TouchableOpacity>
            <Text style={s.checkText}>
              J'accepte les{" "}
              <Text style={s.checkLink}>Conditions Générales d'Utilisation</Text>
              {" "}et la{" "}
              <Text style={s.checkLink}>Politique de vente DKD-MARKET</Text>
              {" "}
              <Text style={{ color: ERROR_C }}>*</Text>
            </Text>
          </View>

          <View style={s.checkRow}>
            <TouchableOpacity style={[s.checkbox, acceptAntiFraud && s.checkboxActive]} onPress={() => setAcceptAntiFraud((v) => !v)}>
              {acceptAntiFraud && <Ionicons name="checkmark" size={14} color="#fff" />}
            </TouchableOpacity>
            <Text style={s.checkText}>
              Je certifie que tous les documents et informations fournis sont authentiques et exacts. Je m'engage à respecter la charte anti-fraude DKD.
              {" "}<Text style={{ color: ERROR_C }}>*</Text>
            </Text>
          </View>

          <View style={s.checkRow}>
            <TouchableOpacity style={[s.checkbox, acceptVerification && s.checkboxActive]} onPress={() => setAcceptVerification((v) => !v)}>
              {acceptVerification && <Ionicons name="checkmark" size={14} color="#fff" />}
            </TouchableOpacity>
            <Text style={s.checkText}>
              J'autorise DKD-MARKET à vérifier et conserver mes informations d'identité conformément à la réglementation en vigueur.
              {" "}<Text style={{ color: ERROR_C }}>*</Text>
            </Text>
          </View>
        </View>

        {/* Submit */}
        <TouchableOpacity
          style={[s.submitBtn, submitting && { opacity: 0.6 }]}
          onPress={handleSubmit}
          activeOpacity={0.85}
          disabled={submitting}
        >
          <Ionicons name="send" size={20} color="#000" />
          <Text style={s.submitBtnText}>
            {submitting ? "Envoi en cours..." : "Soumettre mon dossier"}
          </Text>
        </TouchableOpacity>

        <Text style={s.submitNote}>
          Votre dossier sera examiné sous 48–72 heures ouvrables. Vous recevrez une notification à l'adresse e-mail fournie.
        </Text>
      </ScrollView>

      {/* Country Picker Modal */}
      <Modal visible={showCountryPicker} transparent animationType="slide" onRequestClose={() => setShowCountryPicker(false)}>
        <TouchableOpacity style={s.modalOverlay} activeOpacity={1} onPress={() => setShowCountryPicker(false)}>
          <TouchableOpacity activeOpacity={1} onPress={() => {}}>
            <View style={s.pickerModal}>
              <View style={s.pickerModalHandle} />
              <Text style={s.pickerModalTitle}>Pays d'exportation</Text>
              <View style={s.searchWrap}>
                <Ionicons name="search" size={16} color={TEXT_MUTED} />
                <TextInput
                  style={s.searchInput}
                  value={countrySearch}
                  onChangeText={setCountrySearch}
                  placeholder="Rechercher un pays..."
                  placeholderTextColor={TEXT_MUTED}
                />
              </View>
              <ScrollView style={{ maxHeight: 300 }} showsVerticalScrollIndicator={false}>
                {filteredExportCountries.map((c) => (
                  <TouchableOpacity
                    key={c}
                    style={[s.pickerItem, exportCountry === c && { backgroundColor: AMBER + "22" }]}
                    onPress={() => { setExportCountry(c); setShowCountryPicker(false); setCountrySearch(""); }}
                  >
                    <Text style={[s.pickerItemText, exportCountry === c && { color: AMBER }]}>{c}</Text>
                    {exportCountry === c && <Ionicons name="checkmark" size={16} color={AMBER} />}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
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
  backBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: CARD2, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontFamily: "Poppins_700Bold", fontSize: fs(16), color: TEXT },
  headerSub: { fontFamily: "Poppins_400Regular", fontSize: fs(11), color: TEXT_MUTED },
  headerBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: AMBER + "18", borderWidth: 1, borderColor: AMBER + "44",
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4,
  },
  headerBadgeText: { fontFamily: "Poppins_600SemiBold", fontSize: fs(11), color: AMBER },

  infoBanner: {
    flexDirection: "row", gap: 10, alignItems: "flex-start",
    margin: 16, backgroundColor: AMBER + "14", borderWidth: 1, borderColor: AMBER + "40",
    borderRadius: 12, padding: 14,
  },
  infoBannerText: { flex: 1, fontFamily: "Poppins_400Regular", fontSize: fs(12), color: TEXT_SUB, lineHeight: 18 },

  card: {
    marginHorizontal: 16, marginBottom: 12, backgroundColor: CARD,
    borderRadius: 16, padding: 16, borderWidth: 1, borderColor: BORDER, gap: 12,
  },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  sectionStepCircle: {
    width: 22, height: 22, borderRadius: 11, backgroundColor: AMBER + "25",
    alignItems: "center", justifyContent: "center",
  },
  sectionStep: { fontFamily: "Poppins_700Bold", fontSize: fs(11), color: AMBER },
  sectionTitle: { fontFamily: "Poppins_700Bold", fontSize: fs(15), color: TEXT },

  fieldRow: { gap: 6 },
  fieldLabel: { fontFamily: "Poppins_500Medium", fontSize: fs(13), color: TEXT_SUB },
  fieldHint: { fontFamily: "Poppins_400Regular", fontSize: fs(11), color: TEXT_MUTED, marginTop: -6 },
  fieldInput: {
    backgroundColor: CARD2, borderWidth: 1, borderColor: BORDER,
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10,
    color: TEXT, fontFamily: "Poppins_400Regular", fontSize: fs(14),
  },

  pickerBtn: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: CARD2, borderWidth: 1, borderColor: BORDER,
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 12,
  },
  pickerBtnText: { flex: 1, fontFamily: "Poppins_400Regular", fontSize: fs(14) },

  securityNote: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "#3B82F614", borderRadius: 8, padding: 10, borderWidth: 1, borderColor: "#3B82F630",
  },
  securityNoteText: { flex: 1, fontFamily: "Poppins_400Regular", fontSize: fs(11), color: TEXT_MUTED },

  photoBtn: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: CARD2, borderWidth: 1, borderColor: BORDER,
    borderRadius: 12, padding: 12, borderStyle: "dashed",
  },
  photoPlaceholder: {
    width: 56, height: 56, borderRadius: 10,
    backgroundColor: AMBER + "18", alignItems: "center", justifyContent: "center",
  },
  photoPreview: { width: 56, height: 56, borderRadius: 10 },
  photoInfo: { flex: 1, gap: 3 },
  photoLabel: { fontFamily: "Poppins_600SemiBold", fontSize: fs(13), color: TEXT },
  photoHint: { fontFamily: "Poppins_400Regular", fontSize: fs(11), color: TEXT_MUTED, marginTop: 2 },
  photoBadge: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  photoNote: {
    flexDirection: "row", alignItems: "flex-start", gap: 8,
    backgroundColor: AMBER + "10", borderRadius: 8, padding: 10,
  },
  photoNoteText: { flex: 1, fontFamily: "Poppins_400Regular", fontSize: fs(11), color: TEXT_MUTED },

  chipGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    flexDirection: "row", alignItems: "center", gap: 6,
    borderWidth: 1, borderColor: BORDER, borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 6, backgroundColor: CARD2,
  },
  chipText: { fontFamily: "Poppins_500Medium", fontSize: fs(12), color: TEXT_MUTED },

  selectAllBtn: {
    alignSelf: "flex-start", backgroundColor: CARD2, borderWidth: 1, borderColor: BORDER,
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6,
  },
  selectAllText: { fontFamily: "Poppins_500Medium", fontSize: fs(12), color: AMBER },

  countriesGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  countryBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    borderWidth: 1, borderColor: BORDER, borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 8, backgroundColor: CARD2,
  },
  countryFlag: { fontSize: fs(16) },
  countryName: { fontFamily: "Poppins_500Medium", fontSize: fs(12), color: TEXT_SUB },

  fraudWarning: {
    flexDirection: "row", alignItems: "flex-start", gap: 10,
    backgroundColor: "#EF444415", borderWidth: 1, borderColor: "#EF444440",
    borderRadius: 10, padding: 12,
  },
  fraudTitle: { fontFamily: "Poppins_700Bold", fontSize: fs(13) },
  fraudText: { fontFamily: "Poppins_400Regular", fontSize: fs(12), color: TEXT_MUTED, lineHeight: 18 },

  checkRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  checkbox: {
    width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: BORDER,
    backgroundColor: CARD2, alignItems: "center", justifyContent: "center", marginTop: 1, flexShrink: 0,
  },
  checkboxActive: { backgroundColor: AMBER, borderColor: AMBER },
  checkText: { flex: 1, fontFamily: "Poppins_400Regular", fontSize: fs(12), color: TEXT_MUTED, lineHeight: 18 },
  checkLink: { color: AMBER, fontFamily: "Poppins_500Medium" },

  submitBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10,
    backgroundColor: AMBER, marginHorizontal: 16, borderRadius: 14,
    paddingVertical: ms(15), marginTop: 8,
  },
  submitBtnText: { fontFamily: "Poppins_700Bold", fontSize: fs(16), color: "#000" },
  submitNote: {
    textAlign: "center", fontFamily: "Poppins_400Regular", fontSize: fs(12),
    color: TEXT_MUTED, marginHorizontal: 24, marginTop: 12, lineHeight: 18,
  },

  modalOverlay: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "flex-end", alignItems: "center",
  },
  pickerModal: {
    width: 360, backgroundColor: CARD, borderRadius: 24,
    padding: 20, marginBottom: 32, gap: 12,
    borderWidth: 1, borderColor: BORDER,
  },
  pickerModalHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.15)", alignSelf: "center", marginBottom: 4,
  },
  pickerModalTitle: { fontFamily: "Poppins_700Bold", fontSize: fs(17), color: TEXT, textAlign: "center" },
  searchWrap: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: CARD2, borderWidth: 1, borderColor: BORDER,
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8,
  },
  searchInput: { flex: 1, color: TEXT, fontFamily: "Poppins_400Regular", fontSize: fs(14) },
  pickerItem: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingVertical: 12, paddingHorizontal: 4, borderBottomWidth: 1, borderBottomColor: BORDER,
  },
  pickerItemText: { fontFamily: "Poppins_500Medium", fontSize: fs(14), color: TEXT_SUB },
});
