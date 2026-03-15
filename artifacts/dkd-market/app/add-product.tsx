import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  KeyboardAvoidingView,
  Modal,
  FlatList,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import { useMutation } from "@tanstack/react-query";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { fs, ms } from "@/lib/responsive";

const CURRENCIES = [
  { code: "XOF", label: "FCFA", symbol: "₣" },
  { code: "USD", label: "Dollar US", symbol: "$" },
  { code: "EUR", label: "Euro", symbol: "€" },
  { code: "GHS", label: "Cedi GH", symbol: "₵" },
  { code: "NGN", label: "Naira NG", symbol: "₦" },
  { code: "MAD", label: "Dirham MA", symbol: "DH" },
];

type UnitDef = { id: string; name: string; abbr: string; examples: string };
type UnitItem = UnitDef & { isCustom?: boolean };

const UNITS: UnitDef[] = [
  { id: "piece",    name: "Pièce",              abbr: "pce",    examples: "ex: téléphone, vêtement, chaussure" },
  { id: "kg",       name: "Kilogramme",          abbr: "kg",     examples: "ex: viande, farine, sucre en vrac" },
  { id: "g",        name: "Gramme",              abbr: "g",      examples: "ex: épices, or, médicaments" },
  { id: "litre",    name: "Litre",               abbr: "L",      examples: "ex: huile, eau, carburant" },
  { id: "ml",       name: "Millilitre",          abbr: "ml",     examples: "ex: parfum, médicaments liquides" },
  { id: "metre",    name: "Mètre",               abbr: "m",      examples: "ex: câble, tuyau, tissu au mètre" },
  { id: "carton",   name: "Carton",              abbr: "ctn",    examples: "ex: savon, boissons, conserves" },
  { id: "sac",      name: "Sac",                 abbr: "sac",    examples: "ex: ciment, riz, farine en gros" },
  { id: "lot",      name: "Lot",                 abbr: "lot",    examples: "ex: vêtements assortis, jouets" },
  { id: "boite",    name: "Boîte",               abbr: "boîte",  examples: "ex: médicaments, conserves, chaussures" },
  { id: "palette",  name: "Palette",             abbr: "pal",    examples: "ex: grandes commandes usine" },
  { id: "paire",    name: "Paire",               abbr: "paire",  examples: "ex: chaussures, gants, chaussettes" },
  { id: "douzaine", name: "Douzaine",            abbr: "doz",    examples: "ex: vêtements, vaisselle, papeterie" },
  { id: "rouleau",  name: "Rouleau",             abbr: "roul",   examples: "ex: tissu, papier peint, câble, film" },
  { id: "tonne",    name: "Tonne",               abbr: "t",      examples: "ex: engrais, ciment, métal en vrac" },
  { id: "m2",       name: "Mètre carré",         abbr: "m²",     examples: "ex: revêtements de sol, cuir, tissu" },
  { id: "m3",       name: "Mètre cube",          abbr: "m³",     examples: "ex: bois de construction, béton, gaz" },
  { id: "ctn20",    name: "Conteneur 20 pieds",  abbr: "20ft",   examples: "ex: import/export grandes quantités" },
  { id: "ctn40",    name: "Conteneur 40 pieds",  abbr: "40ft",   examples: "ex: import/export très grands volumes" },
  { id: "caisse",   name: "Caisse",              abbr: "caisse", examples: "ex: bois, matériaux, emballage" },
  { id: "fut",      name: "Fût / Baril",         abbr: "fût",    examples: "ex: huile industrielle, peinture, chimique" },
  { id: "bouteille",name: "Bouteille",           abbr: "btl",    examples: "ex: boissons, huiles conditionnées" },
  { id: "sachet",   name: "Sachet",              abbr: "scht",   examples: "ex: épices, échantillons, conditionnements" },
  { id: "feuille",  name: "Feuille",             abbr: "flle",   examples: "ex: verre, métal, contreplaqué" },
  { id: "paquet",   name: "Paquet",              abbr: "pqt",    examples: "ex: emballage générique, cigarettes" },
  { id: "jeu",      name: "Jeu / Set",           abbr: "jeu",    examples: "ex: ensemble de pièces, kit complet" },
  { id: "botte",    name: "Botte",               abbr: "botte",  examples: "ex: asperges, oignons verts, herbes aromatiques" },
  { id: "regime",   name: "Régime",              abbr: "régime", examples: "ex: régime de bananes, noix de palme" },
  { id: "tige",     name: "Tige / Barre",        abbr: "tige",   examples: "ex: fer à béton, barres aluminium, plastiques profilés" },
  { id: "bande",    name: "Bande",               abbr: "bande",  examples: "ex: joints d'étanchéité, rubans adhésifs industriels" },
  { id: "licence",  name: "Licence",             abbr: "lic",    examples: "ex: logiciels, antivirus, systèmes de gestion" },
  { id: "user",     name: "Utilisateur",         abbr: "user",   examples: "ex: abonnements SaaS, comptes logiciels" },
  { id: "heure",    name: "Heure",               abbr: "h",      examples: "ex: conseil, réparation, location d'équipement" },
  { id: "jour",     name: "Jour",                abbr: "j",      examples: "ex: location, prestation de service journalière" },
];

const COLORS: { name: string; hex: string }[] = [
  { name: "Blanc", hex: "#FFFFFF" }, { name: "Noir", hex: "#1a1a1a" }, { name: "Gris", hex: "#808080" },
  { name: "Gris clair", hex: "#C0C0C0" }, { name: "Gris foncé", hex: "#404040" },
  { name: "Rouge", hex: "#E53935" }, { name: "Rouge foncé", hex: "#B71C1C" }, { name: "Bordeaux", hex: "#7B1C2E" },
  { name: "Rose", hex: "#EC407A" }, { name: "Rose clair", hex: "#F8BBD0" }, { name: "Fuchsia", hex: "#E91E8C" },
  { name: "Saumon", hex: "#FA8072" }, { name: "Corail", hex: "#FF6B4A" }, { name: "Pêche", hex: "#FFDAB9" },
  { name: "Orange", hex: "#FF6B00" }, { name: "Orange clair", hex: "#FFA726" },
  { name: "Jaune", hex: "#FDD835" }, { name: "Jaune or", hex: "#F9A825" }, { name: "Champagne", hex: "#F7E7CE" },
  { name: "Crème", hex: "#FFFDD0" }, { name: "Ivoire", hex: "#FFFFF0" }, { name: "Écru", hex: "#F5F0DC" },
  { name: "Beige", hex: "#F5F5DC" }, { name: "Caramel", hex: "#C68642" }, { name: "Brun", hex: "#7B4B2A" },
  { name: "Marron", hex: "#795548" }, { name: "Chocolat", hex: "#3E1C00" }, { name: "Taupe", hex: "#8B7355" },
  { name: "Kaki", hex: "#8B864E" }, { name: "Vert olive", hex: "#6B8E23" }, { name: "Vert forêt", hex: "#228B22" },
  { name: "Vert", hex: "#43A047" }, { name: "Vert clair", hex: "#81C784" }, { name: "Menthe", hex: "#98FF98" },
  { name: "Turquoise", hex: "#40E0D0" }, { name: "Cyan", hex: "#00BCD4" }, { name: "Bleu ciel", hex: "#64B5F6" },
  { name: "Bleu", hex: "#1E88E5" }, { name: "Bleu roi", hex: "#1565C0" }, { name: "Marine", hex: "#003087" },
  { name: "Bleu nuit", hex: "#1a237e" }, { name: "Indigo", hex: "#3949AB" }, { name: "Violet", hex: "#8E24AA" },
  { name: "Lavande", hex: "#B39DDB" }, { name: "Mauve", hex: "#DDA0DD" }, { name: "Lilas", hex: "#C8A2C8" },
  { name: "Or", hex: "#CFB53B" }, { name: "Argent", hex: "#A8A9AD" }, { name: "Bronze", hex: "#CD7F32" },
  { name: "Terracotta", hex: "#C25B3F" }, { name: "Rouille", hex: "#B7410E" },
  { name: "Multicolore", hex: "#FF6B00" },
];

const CLOTHING_SIZES = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "3XL", "4XL", "5XL", "Unique", "Enfant", "Bébé"];
const SHOE_SIZES = ["35", "36", "37", "38", "39", "40", "41", "42", "43", "44", "45", "46", "47", "48"];
const OTHER_SIZES = ["36/38", "38/40", "40/42", "42/44", "44/46", "Petite", "Grande", "Standard"];

const LABELS = ["Nouveau", "Promo", "Bio", "Top Vente", "Exclusif", "Importé", "Local", "Artisanal"];

const CATEGORIES = [
  { id: 1, name: "Vêtements Femme" }, { id: 2, name: "Vêtements Homme" },
  { id: 3, name: "Vêtements Enfant" }, { id: 4, name: "Chaussures Femme" },
  { id: 5, name: "Chaussures Homme" }, { id: 6, name: "Chaussures Enfant" },
  { id: 7, name: "Sacs & Maroquinerie" }, { id: 8, name: "Bijoux & Accessoires" },
  { id: 9, name: "Pagnes & Tissus" }, { id: 10, name: "Boubous & Tenues Traditionnelles" },
  { id: 11, name: "Sous-vêtements Femme" }, { id: 12, name: "Sous-vêtements Homme" },
  { id: 13, name: "Vêtements de Sport" }, { id: 14, name: "Lunettes de Soleil" },
  { id: 15, name: "Casquettes & Chapeaux" }, { id: 16, name: "Foulards & Écharpes" },
  { id: 17, name: "Vêtements de Travail" }, { id: 18, name: "Montres" },
  { id: 19, name: "Lingerie" }, { id: 20, name: "Ceintures & Bretelles" },
  { id: 21, name: "Smartphones & Téléphones" }, { id: 22, name: "Ordinateurs & Laptops" },
  { id: 23, name: "Tablettes" }, { id: 24, name: "Accessoires Téléphone" },
  { id: 25, name: "Audio & Casques" }, { id: 26, name: "Télévisions" },
  { id: 27, name: "Appareils Photo & Caméras" }, { id: 28, name: "Consoles de Jeux Vidéo" },
  { id: 29, name: "Câbles & Chargeurs" }, { id: 30, name: "Clés USB & Disques Durs" },
  { id: 31, name: "Imprimantes & Scanners" }, { id: 32, name: "GPS & Navigation" },
  { id: 33, name: "Montres Connectées" }, { id: 34, name: "Équipements Réseau" },
  { id: 35, name: "Drones" }, { id: 36, name: "Meubles & Mobilier" },
  { id: 37, name: "Literie & Linge de Maison" }, { id: 38, name: "Vaisselle & Art de la Table" },
  { id: 39, name: "Décoration Intérieure" }, { id: 40, name: "Électroménager Grand Format" },
  { id: 41, name: "Petit Électroménager" }, { id: 42, name: "Éclairage" },
  { id: 43, name: "Tapis & Rideaux" }, { id: 44, name: "Rangement & Organisation" },
  { id: 45, name: "Outils & Bricolage" }, { id: 46, name: "Jardinage & Plantes" },
  { id: 47, name: "Peintures & Revêtements" }, { id: 48, name: "Sécurité Maison" },
  { id: 49, name: "Cuisine & Ustensiles" }, { id: 50, name: "Plomberie & Sanitaires" },
  { id: 51, name: "Soins Visage" }, { id: 52, name: "Soins Corps" },
  { id: 53, name: "Soins Cheveux" }, { id: 54, name: "Maquillage" },
  { id: 55, name: "Parfums & Déodorants" }, { id: 56, name: "Rasage & Épilation" },
  { id: 57, name: "Soins Bébé" }, { id: 58, name: "Hygiène Bucco-Dentaire" },
  { id: 59, name: "Produits Naturels & Bio Beauté" }, { id: 60, name: "Manucure & Pédicure" },
  { id: 61, name: "Bien-être & Relaxation" }, { id: 62, name: "Savons Artisanaux" },
  { id: 63, name: "Riz & Céréales" }, { id: 64, name: "Huiles & Graisses" },
  { id: 65, name: "Condiments & Épices" }, { id: 66, name: "Boissons Sucrées" },
  { id: 67, name: "Eaux & Boissons" }, { id: 68, name: "Produits Laitiers" },
  { id: 69, name: "Conserves & Bocaux" }, { id: 70, name: "Café & Thé" },
  { id: 71, name: "Farine & Pâtisserie" }, { id: 72, name: "Sucre & Confiserie" },
  { id: 73, name: "Poissons & Fruits de Mer" }, { id: 74, name: "Viandes & Volailles" },
  { id: 75, name: "Légumes & Fruits Frais" }, { id: 76, name: "Produits Bio Alimentaires" },
  { id: 77, name: "Snacks & Grignotines" }, { id: 78, name: "Semences & Plants" },
  { id: 79, name: "Engrais & Pesticides" }, { id: 80, name: "Matériel Agricole" },
  { id: 81, name: "Irrigation & Arrosage" }, { id: 82, name: "Élevage Bovins" },
  { id: 83, name: "Élevage Volailles" }, { id: 84, name: "Pisciculture" },
  { id: 85, name: "Apiculture" }, { id: 86, name: "Produits Fermiers" },
  { id: 87, name: "Stockage Agricole" }, { id: 88, name: "Transformation Agricole" },
  { id: 89, name: "Intrants Agricoles" }, { id: 90, name: "Voitures" },
  { id: 91, name: "Motos & Scooters" }, { id: 92, name: "Pièces Détachées Auto" },
  { id: 93, name: "Pièces Détachées Moto" }, { id: 94, name: "Accessoires Auto" },
  { id: 95, name: "Pneus & Jantes" }, { id: 96, name: "Entretien & Huiles Moteur" },
  { id: 97, name: "Audio & GPS Auto" }, { id: 98, name: "Équipements Moto" },
  { id: 99, name: "Vélos & Trottinettes" }, { id: 100, name: "Médicaments & Compléments" },
  { id: 101, name: "Matériel Médical" }, { id: 102, name: "Optique & Lunettes" },
  { id: 103, name: "Orthopédie" }, { id: 104, name: "Diabète & Monitoring" },
  { id: 105, name: "Vitamines & Suppléments" }, { id: 106, name: "Premiers Secours" },
  { id: 107, name: "Hygiène Médicale" }, { id: 108, name: "Produits Naturels Santé" },
  { id: 109, name: "Football & Sports Collectifs" }, { id: 110, name: "Fitness & Musculation" },
  { id: 111, name: "Course & Athlétisme" }, { id: 112, name: "Arts Martiaux" },
  { id: 113, name: "Natation & Aquatique" }, { id: 114, name: "Camping & Randonnée" },
  { id: 115, name: "Pêche" }, { id: 116, name: "Cyclisme" },
  { id: 117, name: "Tennis & Raquettes" }, { id: 118, name: "Sports Traditionnels Africains" },
  { id: 119, name: "Jouets & Jeux Enfants" }, { id: 120, name: "Jeux Vidéo" },
  { id: 121, name: "Jeux de Société" }, { id: 122, name: "Jeux Outdoor" },
  { id: 123, name: "Jeux & Jouets Éducatifs" }, { id: 124, name: "Investissement" },
  { id: 125, name: "Isolation" }, { id: 126, name: "Puériculture" },
  { id: 127, name: "Poussettes & Sièges Auto Bébé" }, { id: 128, name: "Vêtements Bébé" },
  { id: 129, name: "Alimentation Bébé" }, { id: 130, name: "Livres & Éducation Enfant" },
  { id: 131, name: "Fêtes & Anniversaires" }, { id: 132, name: "Fournitures Bureau" },
  { id: 133, name: "Mobilier Bureau" }, { id: 134, name: "Papeterie & Cahiers" },
  { id: 135, name: "Impression & Cartouches" }, { id: 136, name: "Classement & Archivage" },
  { id: 137, name: "Fournitures Scolaires" }, { id: 138, name: "Arts & Dessin" },
  { id: 139, name: "Matériaux de Construction" }, { id: 140, name: "Ciment & Béton" },
  { id: 141, name: "Fer & Acier" }, { id: 142, name: "Bois & Menuiserie" },
  { id: 143, name: "Carrelage & Faïence" }, { id: 144, name: "Toiture & Couverture" },
  { id: 145, name: "Électricité Bâtiment" }, { id: 146, name: "Climatisation & Ventilation" },
  { id: 147, name: "Panneaux Solaires" }, { id: 148, name: "Batteries & Stockage Énergie" },
  { id: 149, name: "Groupes Électrogènes" }, { id: 150, name: "Éclairage Solaire" },
  { id: 151, name: "Pompes à Eau Solaires" }, { id: 152, name: "Systèmes d'Eau & Filtration" },
  { id: 153, name: "Traitement des Déchets" }, { id: 154, name: "Bioénergie" },
  { id: 155, name: "Services Informatiques" }, { id: 156, name: "Livraison & Transport" },
  { id: 157, name: "Formation & Éducation" }, { id: 158, name: "Tourisme & Voyage" },
  { id: 159, name: "Services Financiers" }, { id: 160, name: "Immobilier" },
  { id: 161, name: "Services Artisanaux" }, { id: 162, name: "Artisanat Africain" },
];

function generateDescription(name: string, price: string, unit: string, label: string): string {
  const parts: string[] = [];
  if (name) parts.push(`${name} disponible dans notre boutique.`);
  if (label) parts.push(`Article ${label.toLowerCase()}.`);
  if (price && unit) parts.push(`Vendu à l'unité (${unit}) au prix de ${price} ${""}.`);
  parts.push("Produit de qualité, livraison rapide disponible dans toute la zone.");
  return parts.join(" ");
}

interface WholesaleTier {
  from: string;
  to: string;
  price: string;
}

type SaleMode = "normal_with_wholesale" | "normal_only" | "wholesale_only" | null;

interface ColorEntry { value: string; linkedSize: string; }
interface SizeEntry  { value: string; linkedColor: string; }

interface NormalTier {
  qty: string;
  price: string;
  colorEnabled: boolean;
  sizeEnabled: boolean;
  colorEntries: ColorEntry[];
  sizeEntries: SizeEntry[];
  promoApplied: boolean;
}

interface NormalParam {
  unit: UnitItem;
  normal_tiers: NormalTier[];
}

interface WholesaleParam {
  unit: UnitItem;
  min_order: string;
  tiers: WholesaleTier[];
  colorEnabled: boolean;
  sizeEnabled: boolean;
  colorEntries: ColorEntry[];
  sizeEntries: SizeEntry[];
}

interface FormState {
  saleMode: SaleMode;
  name: string;
  description: string;
  price: string;
  currency: string;
  promo_price: string;
  stock_quantity: string;
  normalUnits: UnitItem[];
  normalParams: NormalParam[];
  units: UnitItem[];
  category_id: number | null;
  label: string;
  wholesale_params: WholesaleParam[];
  diffPrices: boolean;
  images: string[];
  videoUri: string | null;
  videoMime: string;
}

function SectionHeader({ title, icon }: { title: string; icon: string }) {
  const { colors } = useTheme();
  return (
    <View style={s.sectionHeader}>
      <Ionicons name={icon as any} size={16} color="#FF6B00" />
      <Text style={[s.sectionTitle, { color: "#FF6B00" }]}>{title}</Text>
    </View>
  );
}

function Field({ label, required, error, children }: { label: string; required?: boolean; error?: boolean; children: React.ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={s.field}>
      <Text style={[s.fieldLabel, { color: error ? "#e74c3c" : "#FF6B00" }]}>
        {label}{required && <Text style={{ color: "#FF6B00", fontFamily: "Poppins_700Bold" }}> *</Text>}
      </Text>
      {children}
    </View>
  );
}

export default function AddProductScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { user } = useAuth();
  const { context, saleMode: saleModeParam } = useLocalSearchParams<{ context?: string; saleMode?: string }>();
  const pageTitle = context === "importe" ? "Produits Exportés" : context === "grossiste" ? "Publication grossiste" : "Ajouter un article";

  const emptyNormalTier = (price = ""): NormalTier => ({
    qty: "", price, colorEnabled: false, sizeEnabled: false, colorEntries: [], sizeEntries: [], promoApplied: false,
  });

  const emptyNormalParam = (u: UnitItem, price = ""): NormalParam => ({
    unit: u,
    normal_tiers: [{ ...emptyNormalTier(price), promoApplied: true }],
  });

  const emptyWholesaleParam = (u: UnitItem): WholesaleParam => ({
    unit: u, min_order: "", tiers: [{ from: "", to: "", price: "" }],
    colorEnabled: false, sizeEnabled: false, colorEntries: [], sizeEntries: [],
  });

  const mountedRef = useRef(true);
  useEffect(() => { mountedRef.current = true; return () => { mountedRef.current = false; }; }, []);
  const scrollRef = useRef<any>(null);
  const priceFieldY = useRef<number>(0);

  const validModes = ["normal_with_wholesale", "normal_only", "wholesale_only"] as const;
  const initSaleMode = validModes.includes(saleModeParam as any) ? (saleModeParam as SaleMode) : null;

  const [form, setForm] = useState<FormState>({
    saleMode: initSaleMode,
    name: "",
    description: "",
    price: "",
    currency: "XOF",
    promo_price: "",
    stock_quantity: "",
    normalUnits: [],
    normalParams: [],
    units: [],
    category_id: null,
    label: "",
    wholesale_params: [],
    diffPrices: false,
    images: [],
    videoUri: null,
    videoMime: "video/mp4",
  });
  const [aiLoading, setAiLoading] = useState(false);
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [showUnitModal, setShowUnitModal] = useState(false);
  const [unitModalView, setUnitModalView] = useState<"list" | "custom">("list");
  const [unitSearch, setUnitSearch] = useState("");
  const [customUnits, setCustomUnits] = useState<UnitItem[]>([]);
  const [tempSelected, setTempSelected] = useState<UnitItem[]>([]);
  const [customForms, setCustomForms] = useState<{ name: string; abbr: string; description: string }[]>([
    { name: "", abbr: "", description: "" },
  ]);
  const [showVariantPicker, setShowVariantPicker] = useState<"color" | "size" | null>(null);
  const [variantTarget, setVariantTarget] = useState<{ scope: "wholesale" | "normal"; pi: number; ti?: number; entryType: "color" | "size"; ei: number } | null>(null);
  const [variantSearch, setVariantSearch] = useState("");
  const [showCustomVariant, setShowCustomVariant] = useState(false);
  const [customVariantValue, setCustomVariantValue] = useState("");
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showLabelModal, setShowLabelModal] = useState(false);
  const [unitModalTarget, setUnitModalTarget] = useState<"normal" | "wholesale">("normal");
  const [categorySearch, setCategorySearch] = useState("");
  const [promoBlocked, setPromoBlocked] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const helpBlinkAnim = useRef(new Animated.Value(1)).current;
  const submitShakeAnim = useRef(new Animated.Value(0)).current;
  const helpBlinkRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    helpBlinkRef.current = Animated.loop(
      Animated.sequence([
        Animated.timing(helpBlinkAnim, { toValue: 0.25, duration: 600, useNativeDriver: true }),
        Animated.timing(helpBlinkAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      ])
    );
    helpBlinkRef.current.start();
    return () => helpBlinkRef.current?.stop();
  }, []);

  const shakeSubmit = () => {
    submitShakeAnim.setValue(0);
    Animated.sequence([
      Animated.timing(submitShakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(submitShakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(submitShakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(submitShakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(submitShakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const set = (key: keyof FormState, value: any) => setForm((f) => ({ ...f, [key]: value }));

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const { images: imageUris, ...productData } = data;
      const product = await api.products.create(productData);
      if (imageUris && imageUris.length > 0) {
        try {
          await api.products.uploadImages(product.id, imageUris);
        } catch {}
      }
      if (form.videoUri) {
        try {
          await api.products.uploadVideo(product.id, form.videoUri, form.videoMime);
        } catch {}
      }
      return product;
    },
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Succès ✓", "Votre article a été publié avec succès !", [
        { text: "Voir ma boutique", onPress: () => router.back() },
        { text: "Ajouter un autre", onPress: () => resetForm() },
      ]);
    },
    onError: (e: any) => {
      Alert.alert("Erreur", e?.message || "Impossible de publier l'article.");
    },
  });

  const resetForm = () => setForm({
    saleMode: null, name: "", description: "", price: "", currency: "XOF", promo_price: "",
    stock_quantity: "", normalUnits: [], normalParams: [], units: [], category_id: null, label: "",
    wholesale_params: [], diffPrices: false, images: [], videoUri: null, videoMime: "video/mp4",
  });

  const applyNormalUnits = (selectedUnits: UnitItem[]) => {
    setForm((f) => {
      const basePrice = f.promo_price || f.price;
      const newParams = selectedUnits.map((u) => {
        const existing = f.normalParams.find((p) => p.unit.id === u.id);
        if (existing) return f.diffPrices ? existing : {
          ...existing,
          normal_tiers: existing.normal_tiers.map((t, ti) => ti === 0 ? { ...t, price: basePrice } : t),
        };
        return emptyNormalParam(u, f.diffPrices ? "" : basePrice);
      });
      return { ...f, normalUnits: selectedUnits, normalParams: newParams };
    });
    setErrors((e) => ({ ...e, normalUnits: false }));
  };

  const applyUnits = (selectedUnits: UnitItem[]) => {
    setForm((f) => {
      const newParams = selectedUnits.map((u) => {
        const existing = f.wholesale_params.find((p) => p.unit.id === u.id);
        if (existing) return existing;
        return emptyWholesaleParam(u);
      });
      return { ...f, units: selectedUnits, wholesale_params: newParams };
    });
    setErrors((e) => ({ ...e, units: false }));
  };

  const toggleDiffPrices = () => {
    setForm((f) => {
      const next = !f.diffPrices;
      const basePrice = f.promo_price || f.price;
      const newNormalParams = f.normalParams.map((p) => ({
        ...p,
        normal_tiers: next
          ? p.normal_tiers.map((t) => ({ ...t, qty: t.qty || "1" }))
          : p.normal_tiers.map((t, ti) => ti === 0 ? { ...t, price: basePrice } : t),
      }));
      return { ...f, diffPrices: next, normalParams: newNormalParams };
    });
  };

  const openVariantPicker = (
    pickerType: "color" | "size",
    entryType: "color" | "size",
    scope: "wholesale" | "normal",
    pi: number, ei: number, ti?: number
  ) => {
    setVariantTarget({ scope, pi, ti, entryType, ei });
    setVariantSearch("");
    setShowCustomVariant(false);
    setCustomVariantValue("");
    setShowVariantPicker(pickerType);
  };

  const applyVariant = (value: string) => {
    if (!variantTarget) return;
    const { scope, pi, ti, entryType, ei } = variantTarget;
    const pickerType = showVariantPicker!;
    if (scope === "wholesale") {
      setForm((f) => {
        const params = f.wholesale_params.map((p, i) => {
          if (i !== pi) return p;
          if (entryType === "color") {
            const colorEntries = p.colorEntries.map((e, j) =>
              j === ei ? { ...e, [pickerType === "color" ? "value" : "linkedSize"]: value } : e
            );
            return { ...p, colorEntries };
          } else {
            const sizeEntries = p.sizeEntries.map((e, j) =>
              j === ei ? { ...e, [pickerType === "size" ? "value" : "linkedColor"]: value } : e
            );
            return { ...p, sizeEntries };
          }
        });
        return { ...f, wholesale_params: params };
      });
    } else {
      setForm((f) => {
        const normalParams = f.normalParams.map((p, i) => {
          if (i !== pi) return p;
          const normal_tiers = p.normal_tiers.map((t, j) => {
            if (j !== ti) return t;
            if (entryType === "color") {
              const colorEntries = t.colorEntries.map((e, k) =>
                k === ei ? { ...e, [pickerType === "color" ? "value" : "linkedSize"]: value } : e
              );
              return { ...t, colorEntries };
            } else {
              const sizeEntries = t.sizeEntries.map((e, k) =>
                k === ei ? { ...e, [pickerType === "size" ? "value" : "linkedColor"]: value } : e
              );
              return { ...t, sizeEntries };
            }
          });
          return { ...p, normal_tiers };
        });
        return { ...f, normalParams };
      });
    }
    setShowCustomVariant(false);
    setCustomVariantValue("");
    setShowVariantPicker(null);
  };

  const duplicateWholesaleParam = (pi: number) => {
    setForm((f) => {
      const original = f.wholesale_params[pi];
      const copy = { ...original, colorEntries: [], sizeEntries: [], tiers: [{ from: "", to: "", price: "" }], min_order: "" };
      const params = [...f.wholesale_params];
      params.splice(pi + 1, 0, copy);
      return { ...f, wholesale_params: params };
    });
  };

  const addWholesaleColorEntry = (pi: number) => {
    setForm((f) => {
      const params = f.wholesale_params.map((p, i) =>
        i !== pi ? p : { ...p, colorEnabled: true, colorEntries: [...p.colorEntries, { value: "", linkedSize: "" }] }
      );
      return { ...f, wholesale_params: params };
    });
  };
  const updateWholesaleColorEntry = (pi: number, ei: number, update: Partial<ColorEntry>) => {
    setForm((f) => {
      const params = f.wholesale_params.map((p, i) => {
        if (i !== pi) return p;
        const colorEntries = p.colorEntries.map((e, j) => j === ei ? { ...e, ...update } : e);
        return { ...p, colorEntries };
      });
      return { ...f, wholesale_params: params };
    });
  };
  const removeWholesaleColorEntry = (pi: number, ei: number) => {
    setForm((f) => {
      const params = f.wholesale_params.map((p, i) =>
        i !== pi ? p : { ...p, colorEntries: p.colorEntries.filter((_, j) => j !== ei) }
      );
      return { ...f, wholesale_params: params };
    });
  };
  const addWholesaleSizeEntry = (pi: number) => {
    setForm((f) => {
      const params = f.wholesale_params.map((p, i) =>
        i !== pi ? p : { ...p, sizeEnabled: true, sizeEntries: [...p.sizeEntries, { value: "", linkedColor: "" }] }
      );
      return { ...f, wholesale_params: params };
    });
  };
  const updateWholesaleSizeEntry = (pi: number, ei: number, update: Partial<SizeEntry>) => {
    setForm((f) => {
      const params = f.wholesale_params.map((p, i) => {
        if (i !== pi) return p;
        const sizeEntries = p.sizeEntries.map((e, j) => j === ei ? { ...e, ...update } : e);
        return { ...p, sizeEntries };
      });
      return { ...f, wholesale_params: params };
    });
  };
  const removeWholesaleSizeEntry = (pi: number, ei: number) => {
    setForm((f) => {
      const params = f.wholesale_params.map((p, i) =>
        i !== pi ? p : { ...p, sizeEntries: p.sizeEntries.filter((_, j) => j !== ei) }
      );
      return { ...f, wholesale_params: params };
    });
  };

  const removeWholesaleParam = (pi: number) => {
    setForm((f) => {
      const params = f.wholesale_params.filter((_, i) => i !== pi);
      return { ...f, wholesale_params: params };
    });
  };

  const updateParam = (pi: number, update: Partial<WholesaleParam>) => {
    setForm((f) => {
      const params = f.wholesale_params.map((p, i) => i === pi ? { ...p, ...update } : p);
      return { ...f, wholesale_params: params };
    });
  };

  const updateTier = (pi: number, ti: number, key: keyof WholesaleTier, value: string) => {
    setForm((f) => {
      const params = f.wholesale_params.map((p, i) => {
        if (i !== pi) return p;
        const tiers = p.tiers.map((t) => ({ ...t }));
        tiers[ti][key] = value;
        if (key === "to" && ti < tiers.length - 1) tiers[ti + 1].from = value;
        const min_order = ti === 0 && key === "from" ? value : p.min_order;
        return { ...p, tiers, min_order };
      });
      return { ...f, wholesale_params: params };
    });
  };

  const handleMinOrderChange = (pi: number, v: string) => {
    setForm((f) => {
      const params = f.wholesale_params.map((p, i) => {
        if (i !== pi) return p;
        const tiers = [...p.tiers];
        tiers[0] = { ...tiers[0], from: v };
        return { ...p, min_order: v, tiers };
      });
      return { ...f, wholesale_params: params };
    });
    if (errors[`min_order_${pi}`]) setErrors((e) => ({ ...e, [`min_order_${pi}`]: false }));
  };

  const addTier = (pi: number) => {
    setForm((f) => {
      const params = f.wholesale_params.map((p, i) => {
        if (i !== pi || p.tiers.length >= 5) return p;
        const last = p.tiers[p.tiers.length - 1];
        return { ...p, tiers: [...p.tiers, { from: last.to, to: "", price: "" }] };
      });
      return { ...f, wholesale_params: params };
    });
    Haptics.selectionAsync();
  };

  const removeTier = (pi: number, ti: number) => {
    setForm((f) => {
      const params = f.wholesale_params.map((p, i) => {
        if (i !== pi || p.tiers.length <= 1) return p;
        return { ...p, tiers: p.tiers.filter((_, j) => j !== ti) };
      });
      return { ...f, wholesale_params: params };
    });
  };

  const handleAiDescription = async () => {
    if (!form.name.trim()) {
      Alert.alert("Info", "Renseignez d'abord le nom du produit.");
      return;
    }
    setAiLoading(true);
    await new Promise((r) => setTimeout(r, 900));
    if (!mountedRef.current) return;
    const desc = generateDescription(form.name, form.price, form.units[0]?.name || "", form.label);
    set("description", desc);
    setAiLoading(false);
    Haptics.selectionAsync();
  };

  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission requise", "Autorisez l'accès à vos photos.");
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsMultipleSelection: true,
        quality: 0.8,
      });
      if (!result.canceled && mountedRef.current) {
        const uris = result.assets.map((a) => a.uri);
        set("images", [...form.images, ...uris].slice(0, 6));
      }
    } catch {
      Alert.alert("Erreur", "Impossible d'accéder à la galerie.");
    }
  };

  const handlePickVideo = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission requise", "Autorisez l'accès à votre galerie.");
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["videos"],
        allowsEditing: false,
        quality: 1,
      });
      if (!result.canceled && mountedRef.current) {
        const asset = result.assets[0];
        if (asset.duration && asset.duration > 30000) {
          Alert.alert("Vidéo trop longue", "La vidéo doit faire 30 secondes maximum.");
          return;
        }
        set("videoUri", asset.uri);
        set("videoMime", asset.mimeType || "video/mp4");
        Haptics.selectionAsync();
      }
    } catch {
      Alert.alert("Erreur", "Impossible d'accéder à la vidéo.");
    }
  };

  const hasWholesale = form.saleMode === "normal_with_wholesale" || form.saleMode === "wholesale_only";
  const isWholesaleOnly = form.saleMode === "wholesale_only";

  const handleSubmit = async () => {
    const newErrors: Record<string, boolean> = {};
    if (!form.saleMode) newErrors.saleMode = true;
    if (!form.name.trim()) newErrors.name = true;
    if (!form.description.trim()) newErrors.description = true;
    if (!isWholesaleOnly && (!form.price || isNaN(Number(form.price)))) newErrors.price = true;
    if (!isWholesaleOnly && form.promo_price && !isNaN(Number(form.promo_price)) && !isNaN(Number(form.price)) && Number(form.promo_price) > Number(form.price)) newErrors.promo_price = true;
    if (!form.stock_quantity.trim() || isNaN(Number(form.stock_quantity))) newErrors.stock_quantity = true;
    if (!isWholesaleOnly && form.normalUnits.length === 0) newErrors.normalUnits = true;
    if (hasWholesale && form.units.length === 0) newErrors.units = true;
    if (!form.category_id) newErrors.category_id = true;
    if (form.images.length < 3) newErrors.images = true;
    if (!isWholesaleOnly && !form.videoUri) newErrors.video = true;
    if (!isWholesaleOnly) {
      form.normalParams.forEach((p, pi) => {
        if (form.diffPrices) {
          p.normal_tiers.forEach((t, ti) => {
            if (!t.price || isNaN(Number(t.price))) newErrors[`normal_price_${pi}_${ti}`] = true;
          });
        }
        p.normal_tiers.forEach((t, ti) => {
          if (t.colorEnabled && t.colorEntries.some(e => !e.value.trim())) newErrors[`color_n_${pi}_${ti}`] = true;
          if (t.sizeEnabled && t.sizeEntries.some(e => !e.value.trim())) newErrors[`size_n_${pi}_${ti}`] = true;
        });
      });
    }
    if (hasWholesale) {
      form.wholesale_params.forEach((p, pi) => {
        if (!p.min_order) newErrors[`min_order_${pi}`] = true;
        const valid = p.tiers.filter((t) => t.from && t.price);
        if (valid.length === 0) newErrors[`tiers_${pi}`] = true;
        if (p.colorEnabled && p.colorEntries.some(e => !e.value.trim())) newErrors[`color_w_${pi}`] = true;
        if (p.sizeEnabled && p.sizeEntries.some(e => !e.value.trim())) newErrors[`size_w_${pi}`] = true;
      });
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      shakeSubmit();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    setErrors({});

    const hasPromo = !isWholesaleOnly && !!form.promo_price && !isNaN(Number(form.promo_price));
    const effectiveLabel = hasPromo && !form.label.includes("Promo") ? (form.label ? `Promo, ${form.label}` : "Promo") : form.label;
    const payload: any = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      price: isWholesaleOnly ? 0 : (hasPromo ? Number(form.promo_price) : Number(form.price)),
      original_price: hasPromo ? Number(form.price) : null,
      currency_code: form.currency,
      stock_quantity: Number(form.stock_quantity) || 0,
      unit: form.normalUnits[0]?.name || form.units[0]?.name || "",
      category_id: form.category_id,
      label: effectiveLabel || null,
      country_code: "CI",
      country_id: 1,
      images: form.images,
      is_wholesale_only: isWholesaleOnly ? 1 : 0,
      sale_mode: form.saleMode,
      units: [...form.normalUnits, ...form.units].map((u) => u.name),
    };
    if (!isWholesaleOnly && form.normalParams.length > 0) {
      payload.unit_pricing = form.normalParams.map((p) => ({
        unit: p.unit.name,
        tiers: p.normal_tiers.map((t) => ({
          qty: Number(t.qty) || 1,
          price: Number(form.diffPrices ? t.price : (t.promoApplied && form.promo_price ? form.promo_price : form.price)) || 0,
          colors: t.colorEnabled ? t.colorEntries.map(e => e.value).filter(Boolean) : undefined,
          sizes: t.sizeEnabled ? t.sizeEntries.map(e => e.value).filter(Boolean) : undefined,
        })),
      }));
    }
    if (hasWholesale && form.wholesale_params.length > 0) {
      const firstParam = form.wholesale_params[0];
      if (firstParam.min_order) payload.min_order = Number(firstParam.min_order);
      const allParams = form.wholesale_params.map((p) => ({
        unit: p.unit.name,
        min_order: Number(p.min_order) || 0,
        colors: p.colorEnabled ? p.colorEntries.map(e => e.value).filter(Boolean) : undefined,
        sizes: p.sizeEnabled ? p.sizeEntries.map(e => e.value).filter(Boolean) : undefined,
        tiers: p.tiers.filter((t) => t.from && t.price).map((t) => ({
          from: Number(t.from), to: t.to ? Number(t.to) : null, price: Number(t.price),
        })),
      }));
      payload.wholesale_params = allParams;
      const firstValidTiers = allParams[0]?.tiers || [];
      if (firstValidTiers.length > 0) {
        payload.wholesale_prices = firstValidTiers;
        payload.wholesale_price = firstValidTiers[0].price;
      }
    }

    mutation.mutate(payload);
  };

  const selectedCurrency = CURRENCIES.find((c) => c.code === form.currency) || CURRENCIES[0];
  const selectedCategory = CATEGORIES.find((c) => c.id === form.category_id);
  const promoError = !isWholesaleOnly && !!form.promo_price && !!form.price
    && !isNaN(Number(form.promo_price)) && !isNaN(Number(form.price))
    && Number(form.promo_price) > Number(form.price);
  const filteredCategories = categorySearch
    ? CATEGORIES.filter((c) => c.name.toLowerCase().includes(categorySearch.toLowerCase()))
    : CATEGORIES;

  const inputStyle = [s.input, { backgroundColor: colors.backgroundCard, borderColor: "#FF6B00" + "45", color: colors.text }];

  return (
    <View style={[s.container, { backgroundColor: colors.background }]}>
      <View style={[s.header, { paddingTop: insets.top + 8, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[s.headerTitle, { color: colors.text }]}>{pageTitle}</Text>
        <Animated.View style={{ opacity: helpBlinkAnim }}>
          <TouchableOpacity
            style={[s.helpBtn, { backgroundColor: colors.backgroundCard, borderColor: "#FF6B00" }]}
            onPress={() => {
              helpBlinkRef.current?.stop();
              helpBlinkAnim.setValue(1);
              setShowHelpModal(true);
              Haptics.selectionAsync();
            }}
          >
            <Text style={s.helpBtnText}>?</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 40 }]}
          keyboardShouldPersistTaps="handled"
        >
          {!initSaleMode && (
            <View style={[s.modeSection, { backgroundColor: colors.backgroundCard, borderColor: errors.saleMode ? "#e74c3c" : "#FF6B00" + "45" }]}>
              <Text style={[s.modeSectionTitle, { color: errors.saleMode ? "#e74c3c" : colors.text }]}>
                Type de publication <Text style={{ color: "#FF6B00" }}>*</Text>
              </Text>
              {errors.saleMode && <Text style={s.errorHint}>Choisissez un type de publication</Text>}
              <Text style={[s.modeSectionSub, { color: colors.textMuted }]}>
                Choisissez avant de remplir les champs
              </Text>
              {([
                { key: "normal_with_wholesale", icon: "layers", label: "Vente au détail + Vente en gros", sub: "Vendez à l'unité ET en grande quantité aux revendeurs" },
                { key: "normal_only", icon: "cart", label: "Vente au détail — Prix unique", sub: "Un prix public fixe pour tous, sans option gros" },
                { key: "wholesale_only", icon: "cube", label: "Vente en gros uniquement", sub: "Exclusivement aux professionnels, par paliers de quantité" },
              ] as const).map((opt) => {
                const active = form.saleMode === opt.key;
                return (
                  <TouchableOpacity
                    key={opt.key}
                    style={[s.modeCard, {
                      backgroundColor: active ? "#FF6B00" + "12" : colors.background,
                      borderColor: active ? "#FF6B00" : colors.border,
                    }]}
                    onPress={() => { set("saleMode", opt.key); Haptics.selectionAsync(); }}
                  >
                    <View style={[s.modeCardIcon, { backgroundColor: active ? "#FF6B00" + "20" : colors.surface }]}>
                      <Ionicons name={opt.icon as any} size={18} color={active ? "#FF6B00" : colors.textMuted} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[s.modeCardLabel, { color: active ? "#FF6B00" : colors.text }]}>{opt.label}</Text>
                      <Text style={[s.modeCardSub, { color: active ? "#FF6B00" : "#FF6B00" + "99" }]}>{opt.sub}</Text>
                    </View>
                    <View style={[s.modeRadio, {
                      borderColor: active ? "#FF6B00" : colors.border,
                      backgroundColor: active ? "#FF6B00" : "transparent",
                    }]}>
                      {active && <Ionicons name="checkmark" size={12} color="#fff" />}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {!!form.saleMode && <>

          <SectionHeader title="Informations principales" icon="cube-outline" />

          <Field label="Nom du produit" required error={errors.name}>
            <TextInput
              style={[inputStyle, errors.name && s.inputError]}
              placeholder='ex: Téléphone Samsung A14'
              placeholderTextColor={colors.textMuted}
              value={form.name}
              onChangeText={(v) => { set("name", v); if (errors.name) setErrors((e) => ({ ...e, name: false })); }}
            />
          </Field>

          <Field label="Description" required error={errors.description}>
            <View>
              <TextInput
                style={[inputStyle, s.textarea, errors.description && s.inputError]}
                placeholder='ex: 128GB, double SIM, état neuf, sous garantie...'
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={4}
                value={form.description}
                onChangeText={(v) => { set("description", v); if (errors.description) setErrors((e) => ({ ...e, description: false })); }}
              />
              <TouchableOpacity
                style={[s.aiBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={handleAiDescription}
                disabled={aiLoading}
              >
                {aiLoading
                  ? <ActivityIndicator size="small" color="#FF6B00" />
                  : <Ionicons name="sparkles-outline" size={14} color="#FF6B00" />
                }
                <Text style={[s.aiBtnText, { color: "#FF6B00" }]}>
                  {aiLoading ? "Génération..." : "IA — Générer la description"}
                </Text>
              </TouchableOpacity>
            </View>
          </Field>

          <View
            style={s.row}
            onLayout={(e) => { priceFieldY.current = e.nativeEvent.layout.y; }}
          >
            <View style={{ flex: 1 }}>
              <Field label="Prix de vente" required={!isWholesaleOnly} error={errors.price}>
                <TextInput
                  style={[inputStyle,
                    isWholesaleOnly || form.diffPrices ? { opacity: 0.4, backgroundColor: colors.surface } : errors.price && s.inputError
                  ]}
                  placeholder={isWholesaleOnly ? "Verrouillé (gros uniquement)" : form.diffPrices ? "Verrouillé — définissez le prix par palier" : "25 000"}
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numeric"
                  value={form.price}
                  onChangeText={(v) => {
                    set("price", v);
                    if (v) setPromoBlocked(false);
                    if (!form.diffPrices) setForm((f) => ({
                      ...f, price: v,
                      normalParams: f.normalParams.map((p) => ({
                        ...p,
                        normal_tiers: p.normal_tiers.map((t, ti) => ti === 0 ? { ...t, price: f.promo_price || v } : t),
                      })),
                    }));
                    if (errors.price) setErrors((e) => ({ ...e, price: false }));
                  }}
                  editable={!isWholesaleOnly && !form.diffPrices}
                />
              </Field>
            </View>
            <View style={{ width: 110 }}>
              <Field label="Devise">
                <TouchableOpacity
                  style={[s.selector, { backgroundColor: colors.backgroundCard, borderColor: "#FF6B00" + "45" }]}
                  onPress={() => setShowCurrencyModal(true)}
                >
                  <Text style={[s.selectorText, { color: colors.text }]}>{selectedCurrency.symbol} {selectedCurrency.label}</Text>
                  <Ionicons name="chevron-down" size={14} color={colors.textMuted} />
                </TouchableOpacity>
              </Field>
            </View>
          </View>

          {!isWholesaleOnly && <Field label="Prix promo (optionnel — clients paient ce prix)" error={errors.promo_price}>
            <View>
              <TouchableOpacity
                activeOpacity={1}
                onPress={() => {
                  if (!form.price && !form.diffPrices) {
                    setPromoBlocked(true);
                    scrollRef.current?.scrollTo({ y: priceFieldY.current - 16, animated: true });
                    Haptics.selectionAsync();
                  }
                }}
              >
                <TextInput
                  style={[inputStyle,
                    form.diffPrices
                      ? { opacity: 0.4, backgroundColor: colors.surface }
                      : !form.price
                        ? { opacity: 0.4, backgroundColor: colors.surface, borderColor: promoBlocked ? "#e74c3c" : colors.border }
                        : (promoError || errors.promo_price)
                          ? { borderColor: "#e74c3c" }
                          : form.promo_price
                            ? { borderColor: "#27ae60" }
                            : {}
                  ]}
                  placeholder={
                    form.diffPrices ? "Verrouillé — prix différents par palier" :
                    !form.price ? "Saisissez d'abord le prix de vente ↑" :
                    "ex: 22 000 (laissez vide si pas de promo)"
                  }
                  placeholderTextColor={(promoBlocked && !form.price) ? "#e74c3c" : colors.textMuted}
                  keyboardType="numeric"
                  editable={!!form.price && !form.diffPrices}
                  value={form.promo_price}
                  onChangeText={(v) => {
                    if (errors.promo_price) setErrors((e) => ({ ...e, promo_price: false }));
                    if (!form.diffPrices) setForm((f) => ({
                      ...f, promo_price: v,
                      normalParams: f.normalParams.map((p) => ({
                        ...p,
                        normal_tiers: p.normal_tiers.map((t, ti) => ti === 0 ? { ...t, price: v || f.price } : t),
                      })),
                    }));
                    else set("promo_price", v);
                  }}
                />
              </TouchableOpacity>
              {promoBlocked && !form.price && (
                <Text style={{ fontFamily: "Poppins_400Regular", fontSize: fs(11), color: "#e74c3c", marginTop: 4 }}>
                  ⚠ Saisissez d'abord le prix de vente
                </Text>
              )}
              {!!form.promo_price && !!form.price && !isNaN(Number(form.promo_price)) && !isNaN(Number(form.price)) && (
                promoError ? (
                  <Text style={{ fontFamily: "Poppins_500Medium", fontSize: fs(11), color: "#e74c3c", marginTop: 4 }}>
                    ⚠ Le prix promo ne peut pas être supérieur au prix de vente
                  </Text>
                ) : (
                  <View style={s.promoPreview}>
                    <Text style={[s.promoPreviewOld, { color: colors.textMuted }]}>
                      Prix réel : {Number(form.price).toLocaleString()} {selectedCurrency.symbol}
                    </Text>
                    <Ionicons name="arrow-forward" size={12} color="#27ae60" />
                    <Text style={s.promoPreviewNew}>
                      Promo : {Number(form.promo_price).toLocaleString()} {selectedCurrency.symbol}
                    </Text>
                  </View>
                )
              )}
            </View>
          </Field>}

          <View style={s.row}>
            <View style={{ flex: 1 }}>
              <Field label="Stock disponible" required error={errors.stock_quantity}>
                <TextInput
                  style={[inputStyle, errors.stock_quantity && s.inputError]}
                  placeholder="ex: 50"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numeric"
                  value={form.stock_quantity}
                  onChangeText={(v) => { set("stock_quantity", v); if (errors.stock_quantity) setErrors((e) => ({ ...e, stock_quantity: false })); }}
                />
              </Field>
            </View>
          </View>

          <Field label="Catégorie" required error={errors.category_id}>
            <TouchableOpacity
              style={[s.selector, s.selectorFull, { backgroundColor: colors.backgroundCard, borderColor: errors.category_id ? "#e74c3c" : form.category_id ? "#FF6B00" : colors.border }]}
              onPress={() => { setShowCategoryModal(true); if (errors.category_id) setErrors((e) => ({ ...e, category_id: false })); }}
            >
              <Ionicons name="grid-outline" size={16} color={errors.category_id ? "#e74c3c" : form.category_id ? "#FF6B00" : colors.textMuted} />
              <Text style={[s.selectorText, { color: errors.category_id ? "#e74c3c" : form.category_id ? colors.text : colors.textMuted, flex: 1 }]}>
                {selectedCategory?.name || "Choisir une catégorie..."}
              </Text>
              <Ionicons name="chevron-down" size={14} color={colors.textMuted} />
            </TouchableOpacity>
          </Field>

          <Field label="Étiquette / Label">
            <TouchableOpacity
              style={[s.selector, s.selectorFull, { backgroundColor: colors.backgroundCard, borderColor: "#FF6B00" + "45" }]}
              onPress={() => setShowLabelModal(true)}
            >
              <Ionicons name="pricetag-outline" size={16} color={form.label ? "#FF6B00" : colors.textMuted} />
              <Text style={[s.selectorText, { color: form.label ? colors.text : colors.textMuted, flex: 1 }]}>
                {form.label || "Nouveau, Promo, Bio... (optionnel)"}
              </Text>
              {form.label ? (
                <TouchableOpacity onPress={() => set("label", "")}>
                  <Ionicons name="close-circle" size={16} color={colors.textMuted} />
                </TouchableOpacity>
              ) : (
                <Ionicons name="chevron-down" size={14} color={colors.textMuted} />
              )}
            </TouchableOpacity>
          </Field>

          {!isWholesaleOnly && (
            <>
              <View style={s.separator} />
              <View style={{ paddingHorizontal: 16, paddingVertical: 12, backgroundColor: colors.backgroundCard, borderLeftWidth: 3, borderLeftColor: "#FF6B00", marginBottom: 8 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Ionicons name="storefront-outline" size={16} color="#FF6B00" />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: "Poppins_700Bold", fontSize: fs(13), color: colors.text }}>Pour la vente à l'unité</Text>
                    <Text style={{ fontFamily: "Poppins_400Regular", fontSize: fs(11), color: colors.textMuted }}>Prix pour les produits individuels</Text>
                  </View>
                </View>
              </View>

              <Field label="Unité(s) de vente" required error={errors.normalUnits}>
                <TouchableOpacity
                  style={[s.selector, s.selectorFull, { backgroundColor: colors.backgroundCard, borderColor: errors.normalUnits ? "#e74c3c" : form.normalUnits.length > 0 ? "#FF6B00" : colors.border, minHeight: 44, flexWrap: "wrap", height: "auto", paddingVertical: 8 }]}
                  onPress={() => { setTempSelected(form.normalUnits); setUnitModalTarget("normal"); setUnitModalView("list"); setUnitSearch(""); setShowUnitModal(true); if (errors.normalUnits) setErrors((e) => ({ ...e, normalUnits: false })); }}
                >
                  {form.normalUnits.length === 0 ? (
                    <>
                      <Ionicons name="cube-outline" size={16} color={errors.normalUnits ? "#e74c3c" : colors.textMuted} />
                      <Text style={[s.selectorText, { color: errors.normalUnits ? "#e74c3c" : colors.textMuted, flex: 1 }]}>Choisir les unités de vente...</Text>
                      <Ionicons name="chevron-down" size={14} color={errors.normalUnits ? "#e74c3c" : colors.textMuted} />
                    </>
                  ) : (
                    <View style={{ flexDirection: "row", flexWrap: "wrap", flex: 1, gap: 6 }}>
                      {form.normalUnits.map((u, idx) => (
                        <View key={u.id} style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#FF6B00" + "18", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, gap: 4 }}>
                          <Text style={{ fontFamily: "Poppins_700Bold", fontSize: fs(11), color: "#FF6B00" }}>{idx + 1}</Text>
                          <Text style={{ fontFamily: "Poppins_500Medium", fontSize: fs(12), color: colors.text }}>{u.name}</Text>
                          <Text style={{ fontFamily: "Poppins_400Regular", fontSize: fs(10), color: colors.textMuted }}>({u.abbr})</Text>
                        </View>
                      ))}
                      <Ionicons name="pencil-outline" size={14} color="#FF6B00" style={{ marginLeft: "auto", alignSelf: "center" }} />
                    </View>
                  )}
                </TouchableOpacity>
              </Field>

              {form.normalUnits.length > 0 && (
                <>
                  <TouchableOpacity
                    style={[s.diffPricesToggle, { backgroundColor: form.diffPrices ? "#FF6B00" + "15" : colors.backgroundCard, borderColor: form.diffPrices ? "#FF6B00" : colors.border }]}
                    onPress={toggleDiffPrices}
                  >
                    <Ionicons name={form.diffPrices ? "pricetags" : "pricetag-outline"} size={16} color={form.diffPrices ? "#FF6B00" : colors.textMuted} />
                    <Text style={[s.diffPricesText, { color: form.diffPrices ? "#FF6B00" : colors.textMuted }]}>
                      {form.diffPrices ? "Prix différents par palier (activé)" : "Appliquer des prix différents"}
                    </Text>
                    <View style={[s.diffPricesSwitch, { backgroundColor: form.diffPrices ? "#FF6B00" : colors.border }]}>
                      <View style={[s.diffPricesSwitchThumb, { left: form.diffPrices ? 14 : 2 }]} />
                    </View>
                  </TouchableOpacity>
                  {form.normalParams.map((param, pi) => {
                    const currSymbol = CURRENCIES.find((c) => c.code === form.currency)?.symbol;
                    const updateNormalTier = (ti: number, field: keyof NormalTier, val: string | boolean) => {
                      setForm((f) => {
                        const params = f.normalParams.map((p, i) => {
                          if (i !== pi) return p;
                          const tiers = p.normal_tiers.map((t, j) => j === ti ? { ...t, [field]: val } : t);
                          return { ...p, normal_tiers: tiers };
                        });
                        return { ...f, normalParams: params };
                      });
                    };
                    const addNormalTier = (afterIndex: number) => {
                      setForm((f) => {
                        const params = f.normalParams.map((p, i) => {
                          if (i !== pi) return p;
                          const tiers = [...p.normal_tiers];
                          const newTier = { ...emptyNormalTier(), qty: f.diffPrices ? "1" : "" };
                          tiers.splice(afterIndex + 1, 0, newTier);
                          return { ...p, normal_tiers: tiers };
                        });
                        return { ...f, normalParams: params };
                      });
                    };
                    const removeNormalTier = (ti: number) => {
                      setForm((f) => {
                        const params = f.normalParams.map((p, i) => {
                          if (i !== pi) return p;
                          return { ...p, normal_tiers: p.normal_tiers.filter((_, j) => j !== ti) };
                        });
                        return { ...f, normalParams: params };
                      });
                    };
                    const addNormalColorEntry = (ti: number) => {
                      setForm((f) => {
                        const params = f.normalParams.map((p, i) => {
                          if (i !== pi) return p;
                          const normal_tiers = p.normal_tiers.map((t, j) =>
                            j !== ti ? t : { ...t, colorEnabled: true, colorEntries: [...t.colorEntries, { value: "", linkedSize: "" }] }
                          );
                          return { ...p, normal_tiers };
                        });
                        return { ...f, normalParams: params };
                      });
                    };
                    const updateNormalColorEntry = (ti: number, ei: number, upd: Partial<ColorEntry>) => {
                      setForm((f) => {
                        const params = f.normalParams.map((p, i) => {
                          if (i !== pi) return p;
                          const normal_tiers = p.normal_tiers.map((t, j) => {
                            if (j !== ti) return t;
                            const colorEntries = t.colorEntries.map((e, k) => k === ei ? { ...e, ...upd } : e);
                            return { ...t, colorEntries };
                          });
                          return { ...p, normal_tiers };
                        });
                        return { ...f, normalParams: params };
                      });
                    };
                    const removeNormalColorEntry = (ti: number, ei: number) => {
                      setForm((f) => {
                        const params = f.normalParams.map((p, i) => {
                          if (i !== pi) return p;
                          const normal_tiers = p.normal_tiers.map((t, j) =>
                            j !== ti ? t : { ...t, colorEntries: t.colorEntries.filter((_, k) => k !== ei) }
                          );
                          return { ...p, normal_tiers };
                        });
                        return { ...f, normalParams: params };
                      });
                    };
                    const addNormalSizeEntry = (ti: number) => {
                      setForm((f) => {
                        const params = f.normalParams.map((p, i) => {
                          if (i !== pi) return p;
                          const normal_tiers = p.normal_tiers.map((t, j) =>
                            j !== ti ? t : { ...t, sizeEnabled: true, sizeEntries: [...t.sizeEntries, { value: "", linkedColor: "" }] }
                          );
                          return { ...p, normal_tiers };
                        });
                        return { ...f, normalParams: params };
                      });
                    };
                    const updateNormalSizeEntry = (ti: number, ei: number, upd: Partial<SizeEntry>) => {
                      setForm((f) => {
                        const params = f.normalParams.map((p, i) => {
                          if (i !== pi) return p;
                          const normal_tiers = p.normal_tiers.map((t, j) => {
                            if (j !== ti) return t;
                            const sizeEntries = t.sizeEntries.map((e, k) => k === ei ? { ...e, ...upd } : e);
                            return { ...t, sizeEntries };
                          });
                          return { ...p, normal_tiers };
                        });
                        return { ...f, normalParams: params };
                      });
                    };
                    const removeNormalSizeEntry = (ti: number, ei: number) => {
                      setForm((f) => {
                        const params = f.normalParams.map((p, i) => {
                          if (i !== pi) return p;
                          const normal_tiers = p.normal_tiers.map((t, j) =>
                            j !== ti ? t : { ...t, sizeEntries: t.sizeEntries.filter((_, k) => k !== ei) }
                          );
                          return { ...p, normal_tiers };
                        });
                        return { ...f, normalParams: params };
                      });
                    };
                    return (
                      <View key={param.unit.id} style={[s.wholesaleSection, { backgroundColor: colors.backgroundCard, borderColor: "#FF6B00" + "35" }]}>
                        <View style={s.wholesaleSectionHeader}>
                          <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center", borderWidth: 1.5, borderColor: colors.border }}>
                            <Text style={{ fontFamily: "Poppins_700Bold", fontSize: fs(11), color: colors.textMuted }}>{pi + 1}</Text>
                          </View>
                          <Text style={[s.wholesaleSectionTitle, { color: colors.text }]}>{param.unit.name}</Text>
                          <Text style={{ fontFamily: "Poppins_400Regular", fontSize: fs(11), color: colors.textMuted }}>({param.unit.abbr})</Text>
                        </View>

                        {param.normal_tiers.map((tier, ti) => {
                          const isLocked = !form.diffPrices;
                          const lockedPrice = (isLocked && tier.promoApplied && !promoError && form.promo_price)
                            ? form.promo_price
                            : form.price;
                          const showPromoTag = !form.diffPrices && !promoError && !!form.promo_price;
                          return (
                            <View key={ti}>
                              <View style={[s.normalTierRow, { borderTopColor: colors.border, borderTopWidth: ti === 0 ? 1 : 0 }]}>
                                <View style={s.normalTierQty}>
                                  <Text style={[s.tierPriceLabel, { color: colors.textMuted, marginBottom: 4 }]}>
                                    Qté ({param.unit.abbr})
                                  </Text>
                                  <View style={[s.qtyDisplayBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                                    <Text style={[s.qtyDisplayInput, { color: colors.text }]}>1 {param.unit.abbr}</Text>
                                  </View>
                                </View>
                                <View style={s.normalTierPrice}>
                                  <Text style={[s.tierPriceLabel, { color: (isLocked && !lockedPrice) ? "#e74c3c" : colors.textMuted, marginBottom: 4 }]}>
                                    Prix{isLocked && !lockedPrice ? " — Saisir le prix ↑" : ""}
                                  </Text>
                                  <TouchableOpacity
                                    activeOpacity={isLocked && !lockedPrice ? 0.6 : 1}
                                    onPress={() => {
                                      if (isLocked && !lockedPrice) {
                                        scrollRef.current?.scrollTo({ y: priceFieldY.current - 16, animated: true });
                                        Haptics.selectionAsync();
                                      }
                                    }}
                                  >
                                  {(() => {
                                    const npErr = !isLocked && !!errors[`normal_price_${pi}_${ti}`];
                                    return (
                                  <View style={s.tierPriceInputWrap}>
                                    <TextInput
                                      style={[s.tierPriceInputNew, {
                                        backgroundColor: isLocked ? (lockedPrice ? colors.surface : "#e74c3c10") : colors.backgroundCard,
                                        borderColor: npErr ? "#e74c3c" : isLocked && !lockedPrice ? "#e74c3c" : "#FF6B00" + "60",
                                        color: npErr ? "#e74c3c" : colors.text,
                                        opacity: isLocked ? 0.6 : 1,
                                      }]}
                                      placeholder={isLocked && !lockedPrice ? "Mettre le prix ↑" : "ex: 500"}
                                      placeholderTextColor={npErr ? "#e74c3c" : isLocked && !lockedPrice ? "#e74c3c" : colors.textMuted}
                                      keyboardType="numeric"
                                      value={isLocked ? lockedPrice : tier.price}
                                      editable={!isLocked}
                                      onChangeText={(v) => {
                                        updateNormalTier(ti, "price", v);
                                        if (errors[`normal_price_${pi}_${ti}`]) setErrors((e) => ({ ...e, [`normal_price_${pi}_${ti}`]: false }));
                                      }}
                                    />
                                    <Text style={[s.tierCurrencyNew, { color: npErr ? "#e74c3c" : "#FF6B00" }]} numberOfLines={1}>
                                      {currSymbol}
                                    </Text>
                                  </View>
                                    );
                                  })()}
                                  </TouchableOpacity>
                                </View>
                                {ti > 0 && (
                                  <TouchableOpacity
                                    style={s.normalTierDelete}
                                    onPress={() => removeNormalTier(ti)}
                                  >
                                    <Ionicons name="trash-outline" size={16} color="#e74c3c" />
                                  </TouchableOpacity>
                                )}
                              </View>

                              {showPromoTag && (
                                <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingTop: 6, paddingBottom: 2 }}>
                                  {ti === 0 ? (
                                    <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#27ae6015", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, gap: 4, borderWidth: 1, borderColor: "#27ae6040" }}>
                                      <Ionicons name="checkmark-circle" size={13} color="#27ae60" />
                                      <Text style={{ fontFamily: "Poppins_600SemiBold", fontSize: fs(11), color: "#27ae60" }}>
                                        Promo appliquée
                                      </Text>
                                    </View>
                                  ) : (
                                    <TouchableOpacity
                                      style={{ flexDirection: "row", alignItems: "center", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, gap: 4, borderWidth: 1,
                                        backgroundColor: tier.promoApplied ? "#27ae6015" : colors.surface,
                                        borderColor: tier.promoApplied ? "#27ae6040" : colors.border,
                                      }}
                                      onPress={() => { updateNormalTier(ti, "promoApplied", !tier.promoApplied); Haptics.selectionAsync(); }}
                                    >
                                      <Ionicons
                                        name={tier.promoApplied ? "checkmark-circle" : "radio-button-off-outline"}
                                        size={13}
                                        color={tier.promoApplied ? "#27ae60" : colors.textMuted}
                                      />
                                      <Text style={{ fontFamily: "Poppins_500Medium", fontSize: fs(11), color: tier.promoApplied ? "#27ae60" : colors.textMuted }}>
                                        {tier.promoApplied ? "Promo appliquée" : "Appliquer le promo"}
                                      </Text>
                                    </TouchableOpacity>
                                  )}
                                </View>
                              )}

                              <View style={s.variantToggleRow}>
                                <View style={{ flexDirection: "row", flex: 1, alignItems: "center", gap: 4 }}>
                                  <TouchableOpacity
                                    style={[s.variantToggleBtn, { flex: 1, backgroundColor: tier.colorEnabled ? "#FF6B00" + "15" : colors.surface, borderColor: tier.colorEnabled ? "#FF6B00" : colors.border }]}
                                    onPress={() => updateNormalTier(ti, "colorEnabled", !tier.colorEnabled)}
                                  >
                                    <View style={[s.variantToggleDot, { backgroundColor: tier.colorEnabled ? "#FF6B00" : colors.border }]} />
                                    <Text style={[s.variantToggleText, { color: tier.colorEnabled ? "#FF6B00" : colors.textMuted }]}>🎨 Couleur</Text>
                                  </TouchableOpacity>
                                  <TouchableOpacity
                                    style={[s.variantEntryPlusBtn, { borderColor: "#FF6B00" + "60", backgroundColor: "#FF6B00" + "12" }]}
                                    onPress={() => addNormalColorEntry(ti)}
                                  >
                                    <Ionicons name="add" size={14} color="#FF6B00" />
                                  </TouchableOpacity>
                                </View>
                                <View style={{ flexDirection: "row", flex: 1, alignItems: "center", gap: 4 }}>
                                  <TouchableOpacity
                                    style={[s.variantToggleBtn, { flex: 1, backgroundColor: tier.sizeEnabled ? "#1E88E5" + "15" : colors.surface, borderColor: tier.sizeEnabled ? "#1E88E5" : colors.border }]}
                                    onPress={() => updateNormalTier(ti, "sizeEnabled", !tier.sizeEnabled)}
                                  >
                                    <View style={[s.variantToggleDot, { backgroundColor: tier.sizeEnabled ? "#1E88E5" : colors.border }]} />
                                    <Text style={[s.variantToggleText, { color: tier.sizeEnabled ? "#1E88E5" : colors.textMuted }]}>📐 Taille</Text>
                                  </TouchableOpacity>
                                  <TouchableOpacity
                                    style={[s.variantEntryPlusBtn, { borderColor: "#1E88E5" + "60", backgroundColor: "#1E88E5" + "12" }]}
                                    onPress={() => addNormalSizeEntry(ti)}
                                  >
                                    <Ionicons name="add" size={14} color="#1E88E5" />
                                  </TouchableOpacity>
                                </View>
                              </View>

                              {tier.colorEnabled && tier.colorEntries.map((entry, ei) => {
                                const cnErr = !!errors[`color_n_${pi}_${ti}`] && !entry.value.trim();
                                return (
                                <View key={ei} style={[s.variantInputRow, { borderColor: cnErr ? "#e74c3c" : "#FF6B00" + "45" }]}>
                                  <View style={[s.variantColorDot, { backgroundColor: COLORS.find(c => c.name === entry.value)?.hex || colors.border }]} />
                                  <TextInput
                                    style={[s.variantInput, { color: cnErr ? "#e74c3c" : colors.text, backgroundColor: colors.backgroundCard }]}
                                    placeholder="Couleur *"
                                    placeholderTextColor={cnErr ? "#e74c3c" : colors.textMuted}
                                    value={entry.value}
                                    onChangeText={(v) => { updateNormalColorEntry(ti, ei, { value: v }); if (errors[`color_n_${pi}_${ti}`]) setErrors((e) => ({ ...e, [`color_n_${pi}_${ti}`]: false })); }}
                                  />
                                  {entry.linkedSize ? (
                                    <TouchableOpacity style={[s.variantLinkedBadge, { backgroundColor: "#1E88E5" + "15", borderColor: "#1E88E5" + "40" }]}
                                      onPress={() => openVariantPicker("size", "color", "normal", pi, ei, ti)}>
                                      <Ionicons name="options-outline" size={9} color="#1E88E5" />
                                      <Text style={{ fontSize: 10, color: "#1E88E5", fontFamily: "Poppins_700Bold" }} numberOfLines={1}>{entry.linkedSize}</Text>
                                    </TouchableOpacity>
                                  ) : null}
                                  <TouchableOpacity style={[s.variantPickBtn, { backgroundColor: "#FF6B00" + "15", borderColor: "#FF6B00" + "40" }]}
                                    onPress={() => openVariantPicker("color", "color", "normal", pi, ei, ti)}>
                                    <Ionicons name="color-palette-outline" size={14} color="#FF6B00" />
                                  </TouchableOpacity>
                                  <TouchableOpacity style={[s.variantPickBtn, { backgroundColor: "#1E88E5" + "15", borderColor: "#1E88E5" + "40" }]}
                                    onPress={() => openVariantPicker("size", "color", "normal", pi, ei, ti)}>
                                    <Ionicons name="options-outline" size={14} color="#1E88E5" />
                                  </TouchableOpacity>
                                  <TouchableOpacity onPress={() => removeNormalColorEntry(ti, ei)} style={{ paddingHorizontal: 4 }}>
                                    <Ionicons name="trash-outline" size={14} color="#e74c3c" />
                                  </TouchableOpacity>
                                </View>
                                );
                              })}

                              {tier.sizeEnabled && tier.sizeEntries.map((entry, ei) => {
                                const snErr = !!errors[`size_n_${pi}_${ti}`] && !entry.value.trim();
                                return (
                                <View key={ei} style={[s.variantInputRow, { borderColor: snErr ? "#e74c3c" : "#1E88E5" + "45" }]}>
                                  <Ionicons name="resize-outline" size={14} color={snErr ? "#e74c3c" : "#1E88E5"} />
                                  <TextInput
                                    style={[s.variantInput, { color: snErr ? "#e74c3c" : colors.text, backgroundColor: colors.backgroundCard }]}
                                    placeholder="Taille *"
                                    placeholderTextColor={snErr ? "#e74c3c" : colors.textMuted}
                                    value={entry.value}
                                    onChangeText={(v) => { updateNormalSizeEntry(ti, ei, { value: v }); if (errors[`size_n_${pi}_${ti}`]) setErrors((e) => ({ ...e, [`size_n_${pi}_${ti}`]: false })); }}
                                  />
                                  {entry.linkedColor ? (
                                    <TouchableOpacity style={[s.variantLinkedBadge, { backgroundColor: "#FF6B00" + "15", borderColor: "#FF6B00" + "40" }]}
                                      onPress={() => openVariantPicker("color", "size", "normal", pi, ei, ti)}>
                                      <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.find(c => c.name === entry.linkedColor)?.hex || "#FF6B00" }} />
                                      <Text style={{ fontSize: 10, color: "#FF6B00", fontFamily: "Poppins_700Bold" }} numberOfLines={1}>{entry.linkedColor}</Text>
                                    </TouchableOpacity>
                                  ) : null}
                                  <TouchableOpacity style={[s.variantPickBtn, { backgroundColor: "#1E88E5" + "15", borderColor: "#1E88E5" + "40" }]}
                                    onPress={() => openVariantPicker("size", "size", "normal", pi, ei, ti)}>
                                    <Ionicons name="options-outline" size={14} color="#1E88E5" />
                                  </TouchableOpacity>
                                  <TouchableOpacity style={[s.variantPickBtn, { backgroundColor: "#FF6B00" + "15", borderColor: "#FF6B00" + "40" }]}
                                    onPress={() => openVariantPicker("color", "size", "normal", pi, ei, ti)}>
                                    <Ionicons name="color-palette-outline" size={14} color="#FF6B00" />
                                  </TouchableOpacity>
                                  <TouchableOpacity onPress={() => removeNormalSizeEntry(ti, ei)} style={{ paddingHorizontal: 4 }}>
                                    <Ionicons name="trash-outline" size={14} color="#e74c3c" />
                                  </TouchableOpacity>
                                </View>
                                );
                              })}

                              <TouchableOpacity
                                style={[s.normalTierAddBtn, { borderColor: "#FF6B00" + "50", backgroundColor: "#FF6B00" + "08" }]}
                                onPress={() => addNormalTier(ti)}
                              >
                                <Ionicons name="add" size={16} color="#FF6B00" />
                                <Text style={[s.normalTierAddText, { color: "#FF6B00" }]}>Ajouter un palier</Text>
                              </TouchableOpacity>
                            </View>
                          );
                        })}
                      </View>
                    );
                  })}
                </>
              )}
            </>
          )}

          <View style={s.separator} />
          <SectionHeader title="Photos & Vidéo" icon="images-outline" />

          <View style={s.mediaRow}>
            <View style={{ flex: 1 }}>
              <View style={s.mediaSectionLabel}>
                <Text style={[s.mediaSectionTitle, { color: errors.images ? "#e74c3c" : colors.text }]}>
                  Photos <Text style={{ color: "#FF6B00" }}>*</Text>
                </Text>
                <Text style={[s.mediaSectionSub, { color: errors.images ? "#e74c3c" : form.images.length >= 3 ? "#27ae60" : colors.textMuted }]}>
                  {errors.images ? "Minimum 3 photos requises" : `${form.images.length}/6 ${form.images.length >= 3 ? "✓" : "(min 3)"}`}
                </Text>
              </View>
              <View style={s.imagesGrid}>
                {form.images.map((uri, i) => (
                  <View key={i} style={s.imageThumbWrap}>
                    <Image source={{ uri }} style={s.imageThumb} />
                    <TouchableOpacity
                      style={s.removeImageBtn}
                      onPress={() => set("images", form.images.filter((_, j) => j !== i))}
                    >
                      <Ionicons name="close" size={12} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ))}
                {form.images.length < 6 && (
                  <TouchableOpacity
                    style={[s.addImageBtn, { backgroundColor: colors.backgroundCard, borderColor: "#FF6B00" + "40" }]}
                    onPress={handlePickImage}
                  >
                    <Ionicons name="camera-outline" size={22} color={colors.textMuted} />
                    <Text style={[s.addImageText, { color: colors.textMuted }]}>Photo</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <View style={s.videoColumn}>
              <View style={s.mediaSectionLabel}>
                <Text style={[s.mediaSectionTitle, { color: colors.text }]}>
                  Vidéo{" "}
                  {isWholesaleOnly
                    ? <Text style={{ color: "#64748B", fontSize: 11 }}>(facultatif)</Text>
                    : <Text style={{ color: "#FF6B00" }}>*</Text>
                  }
                </Text>
                <Text style={[s.mediaSectionSub, { color: colors.textMuted }]}>max 30s</Text>
              </View>
              <TouchableOpacity
                style={[s.videoBox, {
                  backgroundColor: form.videoUri ? "#FF6B00" + "18" : errors.video ? "#e74c3c10" : colors.backgroundCard,
                  borderColor: form.videoUri ? "#FF6B00" : errors.video ? "#e74c3c" : colors.border,
                }]}
                onPress={() => { handlePickVideo(); if (errors.video) setErrors((e) => ({ ...e, video: false })); }}
              >
                {form.videoUri ? (
                  <>
                    <Ionicons name="videocam" size={30} color="#FF6B00" />
                    <Text style={[s.videoBoxText, { color: "#FF6B00" }]}>Vidéo{"\n"}ajoutée ✓</Text>
                    <TouchableOpacity
                      style={s.removeVideoBtn}
                      onPress={() => { set("videoUri", null); set("videoMime", "video/mp4"); }}
                    >
                      <Ionicons name="close-circle" size={18} color="#e74c3c" />
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <Ionicons name="videocam-outline" size={30} color={colors.textMuted} />
                    <Text style={[s.videoBoxText, { color: colors.textMuted }]}>Ajouter{"\n"}vidéo</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
          <Text style={[s.imageHint, { color: colors.textMuted }]}>JPG/PNG · Max 6 photos · Vidéo MP4 max 30s</Text>


          {hasWholesale && (
            <>
              <View style={s.separator} />
              <View style={{ paddingHorizontal: 16, paddingVertical: 12, backgroundColor: colors.backgroundCard, borderLeftWidth: 3, borderLeftColor: "#FF6B00", marginBottom: 8 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Ionicons name="cube-outline" size={16} color="#FF6B00" />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: "Poppins_700Bold", fontSize: fs(13), color: colors.text }}>Pour la vente en gros</Text>
                    <Text style={{ fontFamily: "Poppins_400Regular", fontSize: fs(11), color: colors.textMuted }}>Commandes en grande quantité</Text>
                  </View>
                </View>
              </View>

              <Field label="Unité(s) en gros" required error={errors.units}>
                <TouchableOpacity
                  style={[s.selector, s.selectorFull, { backgroundColor: colors.backgroundCard, borderColor: errors.units ? "#e74c3c" : form.units.length > 0 ? "#FF6B00" : colors.border, minHeight: 44, flexWrap: "wrap", height: "auto", paddingVertical: 8 }]}
                  onPress={() => { setTempSelected(form.units); setUnitModalTarget("wholesale"); setUnitModalView("list"); setUnitSearch(""); setShowUnitModal(true); if (errors.units) setErrors((e) => ({ ...e, units: false })); }}
                >
                  {form.units.length === 0 ? (
                    <>
                      <Ionicons name="cube-outline" size={16} color={errors.units ? "#e74c3c" : colors.textMuted} />
                      <Text style={[s.selectorText, { color: errors.units ? "#e74c3c" : colors.textMuted, flex: 1 }]}>Choisir les unités en gros...</Text>
                      <Ionicons name="chevron-down" size={14} color={errors.units ? "#e74c3c" : colors.textMuted} />
                    </>
                  ) : (
                    <View style={{ flexDirection: "row", flexWrap: "wrap", flex: 1, gap: 6 }}>
                      {form.units.map((u, idx) => (
                        <View key={u.id} style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#FF6B00" + "18", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, gap: 4 }}>
                          <Text style={{ fontFamily: "Poppins_700Bold", fontSize: fs(11), color: "#FF6B00" }}>{idx + 1}</Text>
                          <Text style={{ fontFamily: "Poppins_500Medium", fontSize: fs(12), color: colors.text }}>{u.name}</Text>
                          <Text style={{ fontFamily: "Poppins_400Regular", fontSize: fs(10), color: colors.textMuted }}>({u.abbr})</Text>
                        </View>
                      ))}
                      <Ionicons name="pencil-outline" size={14} color="#FF6B00" style={{ marginLeft: "auto", alignSelf: "center" }} />
                    </View>
                  )}
                </TouchableOpacity>
              </Field>
            </>
          )}

          {hasWholesale && form.wholesale_params.map((param, pi) => {
            const isSizeLocked = param.unit.name.toLowerCase().includes("taille");
            const firstIndexOfUnit = form.wholesale_params.findIndex(p => p.unit.id === param.unit.id);
            const isFirstOfUnit = pi === firstIndexOfUnit;
            return (
            <View key={pi} style={[s.wholesaleSection, { backgroundColor: colors.backgroundCard, borderColor: "#FF6B00" + "40" }]}>
              <View style={s.wholesaleSectionHeader}>
                <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: "#FF6B00", alignItems: "center", justifyContent: "center" }}>
                  <Text style={{ fontFamily: "Poppins_700Bold", fontSize: fs(11), color: "#fff" }}>{pi + 1}</Text>
                </View>
                <Text style={[s.wholesaleSectionTitle, { color: "#FF6B00" }]}>Gros — {param.unit.name}</Text>
                <Text style={[{ fontFamily: "Poppins_400Regular", fontSize: fs(11), color: colors.textMuted, flex: 1 }]}>({param.unit.abbr})</Text>
                <TouchableOpacity
                  style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#FF6B00" + "15", borderRadius: 16, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1, borderColor: "#FF6B00" + "40", gap: 3 }}
                  onPress={() => { duplicateWholesaleParam(pi); Haptics.selectionAsync(); }}
                >
                  <Ionicons name="add" size={14} color="#FF6B00" />
                  <Text style={{ fontFamily: "Poppins_600SemiBold", fontSize: fs(11), color: "#FF6B00" }}>Dupliquer</Text>
                </TouchableOpacity>
                {!isFirstOfUnit && (
                  <TouchableOpacity onPress={() => removeWholesaleParam(pi)} style={{ padding: 4, marginLeft: 4 }}>
                    <Ionicons name="trash-outline" size={16} color="#e74c3c" />
                  </TouchableOpacity>
                )}
              </View>

              <Field label={`Commande minimum (${param.unit.abbr})`} required error={errors[`min_order_${pi}`]}>
                <TextInput
                  style={[inputStyle, errors[`min_order_${pi}`] && s.inputError]}
                  placeholder={`ex: 10 ${param.unit.name}`}
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numeric"
                  value={param.min_order}
                  onChangeText={(v) => handleMinOrderChange(pi, v)}
                />
              </Field>

              <View style={s.tiersHeader}>
                <Text style={[s.tiersLabel, { color: errors[`tiers_${pi}`] ? "#e74c3c" : colors.textMuted }]}>
                  Paliers de prix ({param.tiers.length}/5){errors[`tiers_${pi}`] ? " *" : ""}
                </Text>
                {param.tiers.length < 5 && (
                  <TouchableOpacity style={[s.addTierBtn, { backgroundColor: "#FF6B00" + "18", borderColor: "#FF6B00" + "50" }]} onPress={() => addTier(pi)}>
                    <Ionicons name="add" size={14} color="#FF6B00" />
                    <Text style={[s.addTierBtnText, { color: "#FF6B00" }]}>Ajouter un palier</Text>
                  </TouchableOpacity>
                )}
              </View>

              <View style={s.variantToggleRow}>
                <View style={{ flexDirection: "row", flex: 1, alignItems: "center", gap: 4 }}>
                  <TouchableOpacity
                    style={[s.variantToggleBtn, { flex: 1, backgroundColor: param.colorEnabled ? "#FF6B00" + "15" : colors.surface, borderColor: param.colorEnabled ? "#FF6B00" : colors.border }]}
                    onPress={() => updateParam(pi, { colorEnabled: !param.colorEnabled, colorEntries: [] })}
                  >
                    <View style={[s.variantToggleDot, { backgroundColor: param.colorEnabled ? "#FF6B00" : colors.border }]} />
                    <Text style={[s.variantToggleText, { color: param.colorEnabled ? "#FF6B00" : colors.textMuted }]}>🎨 Couleur</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[s.variantEntryPlusBtn, { borderColor: "#FF6B00" + "60", backgroundColor: "#FF6B00" + "12" }]}
                    onPress={() => addWholesaleColorEntry(pi)}
                  >
                    <Ionicons name="add" size={14} color="#FF6B00" />
                  </TouchableOpacity>
                </View>
                <View style={{ flexDirection: "row", flex: 1, alignItems: "center", gap: 4 }}>
                  <TouchableOpacity
                    style={[s.variantToggleBtn, { flex: 1,
                      ...(isSizeLocked ? { opacity: 0.4, backgroundColor: colors.surface, borderColor: colors.border } :
                      { backgroundColor: param.sizeEnabled ? "#1E88E5" + "15" : colors.surface, borderColor: param.sizeEnabled ? "#1E88E5" : colors.border })
                    }]}
                    onPress={() => { if (!isSizeLocked) updateParam(pi, { sizeEnabled: !param.sizeEnabled, sizeEntries: [] }); }}
                    disabled={isSizeLocked}
                  >
                    <View style={[s.variantToggleDot, { backgroundColor: param.sizeEnabled ? "#1E88E5" : colors.border }]} />
                    <Text style={[s.variantToggleText, { color: param.sizeEnabled ? "#1E88E5" : colors.textMuted }]}>
                      📐 Taille{isSizeLocked ? " (bloqué)" : ""}
                    </Text>
                  </TouchableOpacity>
                  {!isSizeLocked && (
                    <TouchableOpacity
                      style={[s.variantEntryPlusBtn, { borderColor: "#1E88E5" + "60", backgroundColor: "#1E88E5" + "12" }]}
                      onPress={() => addWholesaleSizeEntry(pi)}
                    >
                      <Ionicons name="add" size={14} color="#1E88E5" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {param.colorEnabled && param.colorEntries.map((entry, ei) => (
                <View key={ei} style={[s.variantInputRow, { borderColor: "#FF6B00" + "45", marginHorizontal: 12, marginBottom: 6 }]}>
                  <View style={[s.variantColorDot, { backgroundColor: COLORS.find(c => c.name === entry.value)?.hex || colors.border }]} />
                  <TextInput
                    style={[s.variantInput, { color: colors.text, backgroundColor: colors.backgroundCard }]}
                    placeholder="Couleur *"
                    placeholderTextColor={colors.textMuted}
                    value={entry.value}
                    onChangeText={(v) => updateWholesaleColorEntry(pi, ei, { value: v })}
                  />
                  {entry.linkedSize ? (
                    <TouchableOpacity style={[s.variantLinkedBadge, { backgroundColor: "#1E88E5" + "15", borderColor: "#1E88E5" + "40" }]}
                      onPress={() => openVariantPicker("size", "color", "wholesale", pi, ei)}>
                      <Ionicons name="options-outline" size={9} color="#1E88E5" />
                      <Text style={{ fontSize: 10, color: "#1E88E5", fontFamily: "Poppins_700Bold" }} numberOfLines={1}>{entry.linkedSize}</Text>
                    </TouchableOpacity>
                  ) : null}
                  <TouchableOpacity style={[s.variantPickBtn, { backgroundColor: "#FF6B00" + "15", borderColor: "#FF6B00" + "40" }]}
                    onPress={() => openVariantPicker("color", "color", "wholesale", pi, ei)}>
                    <Ionicons name="color-palette-outline" size={14} color="#FF6B00" />
                  </TouchableOpacity>
                  <TouchableOpacity style={[s.variantPickBtn, { backgroundColor: "#1E88E5" + "15", borderColor: "#1E88E5" + "40" }]}
                    onPress={() => openVariantPicker("size", "color", "wholesale", pi, ei)}>
                    <Ionicons name="options-outline" size={14} color="#1E88E5" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => removeWholesaleColorEntry(pi, ei)} style={{ paddingHorizontal: 4 }}>
                    <Ionicons name="trash-outline" size={14} color="#e74c3c" />
                  </TouchableOpacity>
                </View>
              ))}

              {param.sizeEnabled && !isSizeLocked && param.sizeEntries.map((entry, ei) => (
                <View key={ei} style={[s.variantInputRow, { borderColor: "#1E88E5" + "45", marginHorizontal: 12, marginBottom: 6 }]}>
                  <Ionicons name="resize-outline" size={14} color="#1E88E5" />
                  <TextInput
                    style={[s.variantInput, { color: colors.text, backgroundColor: colors.backgroundCard }]}
                    placeholder="Taille *"
                    placeholderTextColor={colors.textMuted}
                    value={entry.value}
                    onChangeText={(v) => updateWholesaleSizeEntry(pi, ei, { value: v })}
                  />
                  {entry.linkedColor ? (
                    <TouchableOpacity style={[s.variantLinkedBadge, { backgroundColor: "#FF6B00" + "15", borderColor: "#FF6B00" + "40" }]}
                      onPress={() => openVariantPicker("color", "size", "wholesale", pi, ei)}>
                      <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.find(c => c.name === entry.linkedColor)?.hex || "#FF6B00" }} />
                      <Text style={{ fontSize: 10, color: "#FF6B00", fontFamily: "Poppins_700Bold" }} numberOfLines={1}>{entry.linkedColor}</Text>
                    </TouchableOpacity>
                  ) : null}
                  <TouchableOpacity style={[s.variantPickBtn, { backgroundColor: "#1E88E5" + "15", borderColor: "#1E88E5" + "40" }]}
                    onPress={() => openVariantPicker("size", "size", "wholesale", pi, ei)}>
                    <Ionicons name="options-outline" size={14} color="#1E88E5" />
                  </TouchableOpacity>
                  <TouchableOpacity style={[s.variantPickBtn, { backgroundColor: "#FF6B00" + "15", borderColor: "#FF6B00" + "40" }]}
                    onPress={() => openVariantPicker("color", "size", "wholesale", pi, ei)}>
                    <Ionicons name="color-palette-outline" size={14} color="#FF6B00" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => removeWholesaleSizeEntry(pi, ei)} style={{ paddingHorizontal: 4 }}>
                    <Ionicons name="trash-outline" size={14} color="#e74c3c" />
                  </TouchableOpacity>
                </View>
              ))}

              {param.tiers.map((tier, ti) => {
                const isLast = ti === param.tiers.length - 1;
                const fromLocked = ti > 0;
                const fromNum = Number(tier.from);
                const toNum = Number(tier.to);
                const prevPrice = ti > 0 ? Number(param.tiers[ti - 1].price) : null;
                const toErr = !!tier.to && !!tier.from && toNum <= fromNum;
                const priceErr = ti > 0 && !!tier.price && prevPrice !== null && !isNaN(prevPrice) && Number(tier.price) >= prevPrice;
                return (
                  <View key={ti} style={[s.tierCard, { backgroundColor: colors.background, borderColor: ti === 0 ? "#FF6B00" + "70" : "#FF6B00" + "35" }]}>
                    <View style={s.tierCardHeader}>
                      <View style={[s.tierBadge, { backgroundColor: "#FF6B00" + "18" }]}>
                        <Text style={[s.tierBadgeText, { color: "#FF6B00" }]}>Palier {ti + 1}</Text>
                      </View>
                      {param.tiers.length > 1 && isLast && (
                        <TouchableOpacity onPress={() => removeTier(pi, ti)} style={s.tierDeleteBtn}>
                          <Ionicons name="trash-outline" size={15} color="#e74c3c" />
                        </TouchableOpacity>
                      )}
                    </View>

                    <View style={s.tierQtyBlock}>
                      <View style={s.tierQtyCol}>
                        <Text style={[s.tierColLabel, { color: fromLocked ? colors.textMuted : "#FF6B00" }]}>À partir de</Text>
                        <View style={s.tierInputRow}>
                          <TextInput
                            style={[s.tierNumInput, {
                              backgroundColor: fromLocked ? colors.surface : colors.backgroundCard,
                              borderColor: fromLocked ? colors.border : "#FF6B00" + "80",
                              color: fromLocked ? colors.textMuted : "#FF6B00",
                            }]}
                            placeholder="ex: 10"
                            placeholderTextColor={colors.textMuted}
                            keyboardType="numeric"
                            value={tier.from}
                            editable={!fromLocked}
                            onChangeText={(v) => updateTier(pi, ti, "from", v)}
                          />
                          <Text style={[s.tierUnitSmall, { color: colors.textMuted }]} numberOfLines={1}>{param.unit.abbr}</Text>
                        </View>
                        <Text style={[s.tierNote, { color: fromLocked ? colors.textMuted : "#FF6B00" }]} numberOfLines={1}>
                          {fromLocked ? `= fin palier ${ti}` : "= commande min."}
                        </Text>
                      </View>

                      <View style={s.tierArrowMid}>
                        <Ionicons name="arrow-forward" size={16} color={colors.textMuted} />
                      </View>

                      <View style={s.tierQtyCol}>
                        <Text style={[s.tierColLabel, { color: toErr ? "#e74c3c" : colors.textMuted }]}>{isLast ? "Jusqu'à (∞)" : "Jusqu'à"}</Text>
                        <View style={s.tierInputRow}>
                          <TextInput
                            style={[s.tierNumInput, {
                              backgroundColor: colors.backgroundCard,
                              borderColor: toErr ? "#e74c3c" : "#FF6B00" + "45",
                              color: toErr ? "#e74c3c" : colors.text,
                            }]}
                            placeholder={isLast ? "∞ vide = illimité" : "ex: 49"}
                            placeholderTextColor={colors.textMuted}
                            keyboardType="numeric"
                            value={tier.to}
                            onChangeText={(v) => updateTier(pi, ti, "to", v)}
                          />
                          <Text style={[s.tierUnitSmall, { color: colors.textMuted }]} numberOfLines={1}>{param.unit.abbr}</Text>
                        </View>
                        {toErr
                          ? <Text style={[s.tierNote, { color: "#e74c3c" }]} numberOfLines={1}>⚠ doit être &gt; {tier.from}</Text>
                          : (!isLast && <Text style={[s.tierNote, { color: colors.textMuted }]} numberOfLines={1}>fixe le début palier {ti + 2}</Text>)
                        }
                      </View>
                    </View>

                    <View style={[s.tierPriceBlock, { borderTopColor: colors.border }]}>
                      <Text style={[s.tierPriceLabel, { color: priceErr ? "#e74c3c" : colors.textMuted }]}>
                        Prix par {param.unit.name}{priceErr ? ` — doit être < ${param.tiers[ti - 1].price}` : ""}
                      </Text>
                      <View style={s.tierPriceInputWrap}>
                        <TextInput
                          style={[s.tierPriceInputNew, { backgroundColor: colors.backgroundCard, borderColor: priceErr ? "#e74c3c" : "#FF6B00" + "60", color: priceErr ? "#e74c3c" : colors.text }]}
                          placeholder="ex: 500"
                          placeholderTextColor={colors.textMuted}
                          keyboardType="numeric"
                          value={tier.price}
                          onChangeText={(v) => updateTier(pi, ti, "price", v)}
                        />
                        <Text style={[s.tierCurrencyNew, { color: priceErr ? "#e74c3c" : "#FF6B00" }]} numberOfLines={1}>
                          {CURRENCIES.find((c) => c.code === form.currency)?.symbol}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          );
          })}

          <View style={s.separator} />

          <Animated.View style={{ transform: [{ translateX: submitShakeAnim }] }}>
            <TouchableOpacity
              style={[s.submitBtn, { backgroundColor: mutation.isPending ? colors.surface : "#FF6B00" }]}
              onPress={handleSubmit}
              disabled={mutation.isPending}
            >
              {mutation.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="cloud-upload-outline" size={20} color="#fff" />
                  <Text style={s.submitBtnText}>Publier l'article</Text>
                </>
              )}
            </TouchableOpacity>
          </Animated.View>
          </>}
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={showCurrencyModal} transparent animationType="slide">
        <TouchableOpacity style={s.modalOverlay} activeOpacity={1} onPress={() => setShowCurrencyModal(false)}>
          <View style={[s.modalSheet, { backgroundColor: colors.backgroundCard }]}>
            <Text style={[s.modalTitle, { color: colors.text }]}>Choisir la devise</Text>
            {CURRENCIES.map((c) => (
              <TouchableOpacity
                key={c.code}
                style={[s.modalOption, form.currency === c.code && { backgroundColor: "#FF6B00" + "18" }]}
                onPress={() => { set("currency", c.code); setShowCurrencyModal(false); }}
              >
                <Text style={[s.modalOptionSymbol, { color: "#FF6B00" }]}>{c.symbol}</Text>
                <View>
                  <Text style={[s.modalOptionLabel, { color: colors.text }]}>{c.label}</Text>
                  <Text style={[s.modalOptionCode, { color: colors.textMuted }]}>{c.code}</Text>
                </View>
                {form.currency === c.code && <Ionicons name="checkmark-circle" size={20} color="#FF6B00" style={{ marginLeft: "auto" }} />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={!!showVariantPicker} transparent animationType="slide">
        <TouchableOpacity style={s.modalOverlay} activeOpacity={1} onPress={() => { setShowVariantPicker(null); setShowCustomVariant(false); setCustomVariantValue(""); }}>
          <View style={[s.variantPickerSheet, { backgroundColor: colors.backgroundCard }]} onStartShouldSetResponder={() => true}>
            <View style={s.variantPickerHeader}>
              <Text style={[s.modalTitle, { color: colors.text, marginBottom: 0 }]}>
                {showVariantPicker === "color" ? "🎨 Choisir une couleur" : "📐 Choisir une taille"}
              </Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <TouchableOpacity
                  style={[s.unitCustomBtn, { backgroundColor: "#FF6B00" + "18", borderColor: "#FF6B00" + "50" }]}
                  onPress={() => { setShowCustomVariant((v) => !v); setCustomVariantValue(""); setVariantSearch(""); }}
                >
                  <Ionicons name="add" size={14} color="#FF6B00" />
                  <Text style={[s.unitCustomBtnText, { color: "#FF6B00" }]}>Personnaliser</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => { setShowVariantPicker(null); setShowCustomVariant(false); setCustomVariantValue(""); }}>
                  <Ionicons name="close" size={22} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
            </View>

            {showCustomVariant ? (
              <View style={[s.customVariantForm, { backgroundColor: colors.surface, borderColor: "#FF6B00" + "40" }]}>
                <Text style={[s.tierPriceLabel, { color: colors.textMuted, marginBottom: 6 }]}>
                  {showVariantPicker === "color" ? "Nom de la couleur personnalisée" : "Taille personnalisée"}
                </Text>
                <TextInput
                  autoFocus
                  style={[s.customVariantInput, { color: colors.text, backgroundColor: colors.backgroundCard, borderColor: "#FF6B00" + "45" }]}
                  placeholder={showVariantPicker === "color" ? "ex: Vert citron, Turquoise, Rose bonbon..." : "ex: XL+, 43.5, Sur mesure, Taille 52..."}
                  placeholderTextColor={colors.textMuted}
                  value={customVariantValue}
                  onChangeText={setCustomVariantValue}
                  returnKeyType="done"
                  onSubmitEditing={() => { if (customVariantValue.trim()) applyVariant(customVariantValue.trim()); }}
                />
                <View style={{ flexDirection: "row", gap: 8, marginTop: 10 }}>
                  <TouchableOpacity
                    style={[s.customVariantCancel, { borderColor: colors.border, backgroundColor: colors.surface }]}
                    onPress={() => { setShowCustomVariant(false); setCustomVariantValue(""); }}
                  >
                    <Text style={{ fontFamily: "Poppins_500Medium", fontSize: 13, color: colors.textMuted }}>Annuler</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[s.customVariantConfirm, { backgroundColor: customVariantValue.trim() ? "#FF6B00" : colors.border }]}
                    onPress={() => { if (customVariantValue.trim()) applyVariant(customVariantValue.trim()); }}
                    disabled={!customVariantValue.trim()}
                  >
                    <Ionicons name="checkmark" size={16} color="#fff" />
                    <Text style={{ fontFamily: "Poppins_600SemiBold", fontSize: 13, color: "#fff" }}>Confirmer</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <>
                <View style={[s.variantPickerSearch, { backgroundColor: colors.surface, borderColor: "#FF6B00" + "45" }]}>
                  <Ionicons name="search-outline" size={16} color={colors.textMuted} />
                  <TextInput
                    style={[s.variantPickerSearchInput, { color: colors.text }]}
                    placeholder={showVariantPicker === "color" ? "Rechercher une couleur..." : "Rechercher une taille..."}
                    placeholderTextColor={colors.textMuted}
                    value={variantSearch}
                    onChangeText={setVariantSearch}
                    returnKeyType="done"
                    onSubmitEditing={() => { if (variantSearch.trim()) applyVariant(variantSearch.trim()); }}
                  />
                </View>
                {variantSearch.trim() && (
                  <TouchableOpacity
                    style={[s.variantPickerCustom, { backgroundColor: "#FF6B00" + "18", borderColor: "#FF6B00" + "50" }]}
                    onPress={() => applyVariant(variantSearch.trim())}
                  >
                    <Ionicons name="add-circle-outline" size={16} color="#FF6B00" />
                    <Text style={[s.variantPickerCustomText, { color: "#FF6B00" }]}>Utiliser "{variantSearch.trim()}"</Text>
                  </TouchableOpacity>
                )}
              </>
            )}
            <ScrollView style={{ maxHeight: 320 }} showsVerticalScrollIndicator={false}>
              {showVariantPicker === "color" ? (
                <View style={s.colorGrid}>
                  {COLORS.filter(c => !variantSearch || c.name.toLowerCase().includes(variantSearch.toLowerCase())).map((c) => {
                    const wParam = variantTarget ? form.wholesale_params[variantTarget.pi] : undefined;
                    const nTier = variantTarget ? form.normalParams[variantTarget.pi]?.normal_tiers[variantTarget.ti ?? 0] : undefined;
                    const isSelected = variantTarget
                      ? (variantTarget.scope === "wholesale"
                        ? (variantTarget.entryType === "color" ? wParam?.colorEntries[variantTarget.ei]?.value === c.name : wParam?.sizeEntries[variantTarget.ei]?.linkedColor === c.name)
                        : (variantTarget.entryType === "color" ? nTier?.colorEntries[variantTarget.ei]?.value === c.name : nTier?.sizeEntries[variantTarget.ei]?.linkedColor === c.name))
                      : false;
                    return (
                      <TouchableOpacity key={c.name} style={[s.colorItem, isSelected && { borderWidth: 2.5, borderColor: "#FF6B00" }]} onPress={() => applyVariant(c.name)}>
                        <View style={[s.colorCircle, { backgroundColor: c.hex, borderColor: c.hex === "#FFFFFF" ? colors.border : c.hex }]} />
                        <Text style={[s.colorLabel, { color: colors.text }]} numberOfLines={1}>{c.name}</Text>
                        {isSelected && <Ionicons name="checkmark-circle" size={14} color="#FF6B00" style={{ position: "absolute", top: 2, right: 2 }} />}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ) : (
                <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
                  <Text style={[s.sizeGroupLabel, { color: colors.textMuted }]}>Vêtements</Text>
                  <View style={s.sizeChipRow}>
                    {CLOTHING_SIZES.filter(sz2 => !variantSearch || sz2.toLowerCase().includes(variantSearch.toLowerCase())).map((sz) => (
                      <TouchableOpacity key={sz} style={[s.sizeChip, { backgroundColor: colors.surface, borderColor: "#FF6B00" + "35" }]} onPress={() => applyVariant(sz)}>
                        <Text style={[s.sizeChipText, { color: colors.text }]}>{sz}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <Text style={[s.sizeGroupLabel, { color: colors.textMuted }]}>Pointures</Text>
                  <View style={s.sizeChipRow}>
                    {SHOE_SIZES.filter(sz2 => !variantSearch || sz2.includes(variantSearch)).map((sz) => (
                      <TouchableOpacity key={sz} style={[s.sizeChip, { backgroundColor: colors.surface, borderColor: "#FF6B00" + "35" }]} onPress={() => applyVariant(sz)}>
                        <Text style={[s.sizeChipText, { color: colors.text }]}>{sz}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <Text style={[s.sizeGroupLabel, { color: colors.textMuted }]}>Autres</Text>
                  <View style={s.sizeChipRow}>
                    {OTHER_SIZES.filter(sz2 => !variantSearch || sz2.toLowerCase().includes(variantSearch.toLowerCase())).map((sz) => (
                      <TouchableOpacity key={sz} style={[s.sizeChip, { backgroundColor: colors.surface, borderColor: "#FF6B00" + "35" }]} onPress={() => applyVariant(sz)}>
                        <Text style={[s.sizeChipText, { color: colors.text }]}>{sz}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={showUnitModal} animationType="slide">
        <View style={[s.unitPage, { backgroundColor: colors.background, paddingTop: insets.top }]}>
          {unitModalView === "list" ? (
            <>
              <View style={[s.unitPageHeader, { borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={() => setShowUnitModal(false)} style={s.unitPageBack}>
                  <Ionicons name="close" size={22} color={colors.text} />
                </TouchableOpacity>
                <Text style={[s.unitPageTitle, { color: colors.text }]}>Unité(s) de vente</Text>
                <TouchableOpacity
                  style={[s.unitCustomBtn, { backgroundColor: "#FF6B00" + "18", borderColor: "#FF6B00" + "50" }]}
                  onPress={() => { setCustomForms([{ name: "", abbr: "", description: "" }]); setUnitModalView("custom"); }}
                >
                  <Ionicons name="add" size={14} color="#FF6B00" />
                  <Text style={[s.unitCustomBtnText, { color: "#FF6B00" }]}>Personnalisé</Text>
                </TouchableOpacity>
              </View>

              <View style={[s.unitSearchWrap, { backgroundColor: colors.backgroundCard, borderColor: "#FF6B00" + "45" }]}>
                <Ionicons name="search" size={16} color={colors.textMuted} />
                <TextInput
                  style={[s.unitSearchInput, { color: colors.text }]}
                  placeholder="Rechercher une unité..."
                  placeholderTextColor={colors.textMuted}
                  value={unitSearch}
                  onChangeText={setUnitSearch}
                  autoCorrect={false}
                />
                {unitSearch.length > 0 && (
                  <TouchableOpacity onPress={() => setUnitSearch("")}>
                    <Ionicons name="close-circle" size={16} color={colors.textMuted} />
                  </TouchableOpacity>
                )}
              </View>

              {tempSelected.length > 0 && (
                <View style={[s.unitSelectedBar, { backgroundColor: "#FF6B00" + "12" }]}>
                  <Text style={[s.unitSelectedCount, { color: "#FF6B00" }]}>{tempSelected.length} sélectionnée(s)</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1, marginLeft: 8 }}>
                    {tempSelected.map((u, idx) => (
                      <View key={u.id} style={[s.unitChip, { backgroundColor: "#FF6B00" + "20" }]}>
                        <Text style={[s.unitChipNum, { color: "#FF6B00" }]}>{idx + 1}</Text>
                        <Text style={[s.unitChipText, { color: colors.text }]}>{u.name}</Text>
                      </View>
                    ))}
                  </ScrollView>
                </View>
              )}

              <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
                {customUnits.length > 0 && (
                  <>
                    <Text style={[s.unitGroupTitle, { color: colors.textMuted }]}>Personnalisées</Text>
                    {customUnits
                      .filter((u) => !unitSearch || u.name.toLowerCase().includes(unitSearch.toLowerCase()))
                      .map((u) => {
                        const selIdx = tempSelected.findIndex((s) => s.id === u.id);
                        const isSelected = selIdx >= 0;
                        return (
                          <TouchableOpacity
                            key={u.id}
                            style={[s.unitRow, { borderBottomColor: colors.border }, isSelected && { backgroundColor: "#FF6B00" + "10" }]}
                            onPress={() => {
                              setTempSelected((prev) =>
                                isSelected ? prev.filter((x) => x.id !== u.id) : [...prev, u]
                              );
                            }}
                          >
                            <View style={{ flex: 1 }}>
                              <Text style={[s.unitRowName, { color: colors.text }]}>
                                {u.name} <Text style={[s.unitRowAbbr, { color: colors.textMuted }]}>({u.abbr})</Text>
                              </Text>
                              {u.examples ? <Text style={[s.unitRowEx, { color: colors.textMuted }]}>{u.examples}</Text> : null}
                            </View>
                            <View style={[s.unitCheckBox, { borderColor: isSelected ? "#FF6B00" : colors.border, backgroundColor: isSelected ? "#FF6B00" : "transparent" }]}>
                              {isSelected && <Text style={s.unitCheckNum}>{selIdx + 1}</Text>}
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                    <Text style={[s.unitGroupTitle, { color: colors.textMuted }]}>Standard</Text>
                  </>
                )}
                {[...UNITS]
                  .filter((u) => !unitSearch || u.name.toLowerCase().includes(unitSearch.toLowerCase()) || u.abbr.toLowerCase().includes(unitSearch.toLowerCase()))
                  .map((u) => {
                    const selIdx = tempSelected.findIndex((s) => s.id === u.id);
                    const isSelected = selIdx >= 0;
                    return (
                      <TouchableOpacity
                        key={u.id}
                        style={[s.unitRow, { borderBottomColor: colors.border }, isSelected && { backgroundColor: "#FF6B00" + "10" }]}
                        onPress={() => {
                          setTempSelected((prev) =>
                            isSelected ? prev.filter((x) => x.id !== u.id) : [...prev, u]
                          );
                        }}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={[s.unitRowName, { color: colors.text }]}>
                            {u.name} <Text style={[s.unitRowAbbr, { color: colors.textMuted }]}>({u.abbr})</Text>
                          </Text>
                          <Text style={[s.unitRowEx, { color: colors.textMuted }]}>{u.examples}</Text>
                        </View>
                        <View style={[s.unitCheckBox, { borderColor: isSelected ? "#FF6B00" : colors.border, backgroundColor: isSelected ? "#FF6B00" : "transparent" }]}>
                          {isSelected && <Text style={s.unitCheckNum}>{selIdx + 1}</Text>}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
              </ScrollView>

              <View style={[s.unitApplyRow, { borderTopColor: colors.border, paddingBottom: insets.bottom + 8 }]}>
                <TouchableOpacity
                  style={[s.unitApplyBtn, { backgroundColor: tempSelected.length > 0 ? "#FF6B00" : colors.border }]}
                  onPress={() => {
                    if (tempSelected.length > 0) {
                      if (unitModalTarget === "normal") applyNormalUnits(tempSelected);
                      else applyUnits(tempSelected);
                      setShowUnitModal(false);
                    }
                  }}
                >
                  <Text style={[s.unitApplyBtnText, { color: tempSelected.length > 0 ? "#fff" : colors.textMuted }]}>
                    {tempSelected.length > 0 ? `Appliquer (${tempSelected.length} unité${tempSelected.length > 1 ? "s" : ""})` : "Sélectionnez au moins une unité"}
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <View style={[s.unitPageHeader, { borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={() => setUnitModalView("list")} style={s.unitPageBack}>
                  <Ionicons name="arrow-back" size={22} color={colors.text} />
                </TouchableOpacity>
                <Text style={[s.unitPageTitle, { color: colors.text }]}>Unités personnalisées</Text>
                <TouchableOpacity
                  style={[s.unitCustomBtn, { backgroundColor: "#FF6B00" + "18", borderColor: "#FF6B00" + "50" }]}
                  onPress={() => setCustomForms((f) => [...f, { name: "", abbr: "", description: "" }])}
                >
                  <Ionicons name="add" size={14} color="#FF6B00" />
                  <Text style={[s.unitCustomBtnText, { color: "#FF6B00" }]}>Ajouter</Text>
                </TouchableOpacity>
              </View>

              <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                {customForms.map((cf, ci) => (
                  <View key={ci} style={[s.customFormCard, { backgroundColor: colors.backgroundCard, borderColor: "#FF6B00" + "40" }]}>
                    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                      <Text style={[s.customFormTitle, { color: "#FF6B00" }]}>Unité {ci + 1}</Text>
                      {customForms.length > 1 && (
                        <TouchableOpacity onPress={() => setCustomForms((f) => f.filter((_, i) => i !== ci))}>
                          <Ionicons name="trash-outline" size={16} color="#e74c3c" />
                        </TouchableOpacity>
                      )}
                    </View>
                    <Text style={[s.customFormLabel, { color: colors.textMuted }]}>Nom <Text style={{ color: "#FF6B00" }}>*</Text></Text>
                    <TextInput
                      style={[s.customFormInput, { backgroundColor: colors.background, borderColor: "#FF6B00" + "45", color: colors.text }]}
                      placeholder="ex: Botte, Régime, Tige..."
                      placeholderTextColor={colors.textMuted}
                      value={cf.name}
                      onChangeText={(v) => setCustomForms((f) => f.map((x, i) => i === ci ? { ...x, name: v } : x))}
                    />
                    <Text style={[s.customFormLabel, { color: colors.textMuted }]}>Abréviation (optionnel)</Text>
                    <TextInput
                      style={[s.customFormInput, { backgroundColor: colors.background, borderColor: "#FF6B00" + "45", color: colors.text }]}
                      placeholder="ex: btte, rég, tige"
                      placeholderTextColor={colors.textMuted}
                      value={cf.abbr}
                      onChangeText={(v) => setCustomForms((f) => f.map((x, i) => i === ci ? { ...x, abbr: v } : x))}
                    />
                    <Text style={[s.customFormLabel, { color: colors.textMuted }]}>Description / exemples (optionnel)</Text>
                    <TextInput
                      style={[s.customFormInput, { backgroundColor: colors.background, borderColor: "#FF6B00" + "45", color: colors.text }]}
                      placeholder="ex: pour légumes-feuilles, asperges..."
                      placeholderTextColor={colors.textMuted}
                      value={cf.description}
                      onChangeText={(v) => setCustomForms((f) => f.map((x, i) => i === ci ? { ...x, description: v } : x))}
                    />
                  </View>
                ))}
                <View style={{ height: 20 }} />
              </ScrollView>

              <View style={[s.unitApplyRow, { borderTopColor: colors.border, paddingBottom: insets.bottom + 8 }]}>
                <TouchableOpacity
                  style={[s.unitApplyBtn, { backgroundColor: customForms.every((cf) => cf.name.trim()) ? "#FF6B00" : colors.border }]}
                  onPress={() => {
                    const validForms = customForms.filter((cf) => cf.name.trim());
                    if (validForms.length === 0) return;
                    const newCustom: UnitItem[] = validForms.map((cf) => ({
                      id: `custom_${Date.now()}_${Math.random()}`,
                      name: cf.name.trim(),
                      abbr: cf.abbr.trim() || cf.name.trim().slice(0, 4),
                      examples: cf.description.trim(),
                      isCustom: true,
                    }));
                    setCustomUnits((prev) => [...prev, ...newCustom]);
                    setTempSelected((prev) => [...prev, ...newCustom]);
                    setUnitModalView("list");
                  }}
                >
                  <Text style={[s.unitApplyBtnText, { color: customForms.every((cf) => cf.name.trim()) ? "#fff" : colors.textMuted }]}>
                    Appliquer et retourner à la liste
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </Modal>

      <Modal visible={showLabelModal} transparent animationType="slide">
        <TouchableOpacity style={s.modalOverlay} activeOpacity={1} onPress={() => setShowLabelModal(false)}>
          <View style={[s.modalSheet, { backgroundColor: colors.backgroundCard }]}>
            <Text style={[s.modalTitle, { color: colors.text }]}>Étiquette / Label</Text>
            {LABELS.map((l) => (
              <TouchableOpacity
                key={l}
                style={[s.modalOption, form.label === l && { backgroundColor: "#FF6B00" + "18" }]}
                onPress={() => { set("label", l); setShowLabelModal(false); }}
              >
                <Text style={[s.modalOptionLabel, { color: colors.text }]}>{l}</Text>
                {form.label === l && <Ionicons name="checkmark-circle" size={20} color="#FF6B00" style={{ marginLeft: "auto" }} />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={showCategoryModal} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={[s.modalSheetTall, { backgroundColor: colors.backgroundCard }]}>
            <View style={s.modalSearchRow}>
              <Ionicons name="search-outline" size={16} color={colors.textMuted} />
              <TextInput
                style={[s.modalSearch, { color: colors.text }]}
                placeholder="Rechercher une catégorie..."
                placeholderTextColor={colors.textMuted}
                value={categorySearch}
                onChangeText={setCategorySearch}
                autoFocus
              />
              <TouchableOpacity onPress={() => { setShowCategoryModal(false); setCategorySearch(""); }}>
                <Ionicons name="close" size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={filteredCategories}
              keyExtractor={(item) => item.id.toString()}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[s.modalOption, form.category_id === item.id && { backgroundColor: "#FF6B00" + "18" }]}
                  onPress={() => { set("category_id", item.id); setShowCategoryModal(false); setCategorySearch(""); }}
                >
                  <Text style={[s.modalOptionCode, { color: colors.textMuted, width: 30 }]}>#{item.id}</Text>
                  <Text style={[s.modalOptionLabel, { color: colors.text, flex: 1 }]}>{item.name}</Text>
                  {form.category_id === item.id && <Ionicons name="checkmark-circle" size={20} color="#FF6B00" />}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      <Modal visible={showHelpModal} transparent animationType="slide">
        <View style={s.helpOverlay}>
          <View style={[s.helpSheet, { backgroundColor: colors.backgroundCard }]}>
            <View style={s.helpHeader}>
              <View style={[s.helpIconBig, { backgroundColor: "#FF6B00" + "18" }]}>
                <Ionicons name="help-circle" size={32} color="#FF6B00" />
              </View>
              <Text style={[s.helpTitle, { color: colors.text }]}>Guide complet — Publier un article</Text>
              <TouchableOpacity onPress={() => setShowHelpModal(false)} style={s.helpClose}>
                <Ionicons name="close" size={22} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
              {[
                {
                  icon: "layers-outline",
                  color: "#FF6B00",
                  title: "1. Les 3 modes de vente",
                  body: "Choisissez le mode qui correspond à votre activité :\n\n🟠 Normal + Vente en gros\nVous vendez à la fois au détail ET en gros. Idéal pour les grossistes qui vendent aussi aux particuliers.\n→ Ex : Huile de palme 5L à 3 500 F l'unité pour les particuliers, et 2 800 F par lot de 12 pour les revendeurs.\n\n🛒 Vente au détail — Prix unique\nUn seul prix public fixe pour tout le monde. Parfait pour les boutiques, la mode, l'alimentaire de base.\n→ Ex : Robe wax à 15 000 F — tout le monde paie le même prix.\n\n📦 Gros uniquement\nVous vendez exclusivement par grandes quantités aux professionnels. Le prix au détail n'est pas affiché.\n→ Ex : Sacs de ciment, cartons de boîtes de conserve, matériaux de construction.",
                },
                {
                  icon: "pricetag-outline",
                  color: "#3498db",
                  title: "2. Prix de vente et promotions",
                  body: "Le prix de vente est le montant que le client paie normalement.\n\nSi vous faites une promotion, remplissez aussi le champ « Prix promo » — l'ancien prix sera automatiquement barré sur la fiche produit et le prix promo sera mis en avant.\n→ Ex : Prix normal 12 000 F → Prix promo 9 500 F. Le client voit : ~~12 000 F~~ 9 500 F ✓\n\nDévise : choisissez la devise de votre pays (FCFA, GNF, USD, EUR, etc.).",
                },
                {
                  icon: "bar-chart-outline",
                  color: "#9b59b6",
                  title: "3. Paliers de prix (Prix différents par quantité)",
                  body: "Vous pouvez définir des prix différents selon la quantité achetée, pour la vente normale ET/OU la vente en gros.\n\nActivez « Prix différents par palier » pour créer des tranches :\n→ Ex pour un vendeur de savons :\n  • 1 à 9 pcs → 500 F / pièce\n  • 10 à 49 pcs → 420 F / pièce\n  • 50 pcs et plus → 370 F / pièce\n\nPour la vente en gros, définissez aussi la quantité minimum de commande (ex : 20 unités minimum).",
                },
                {
                  icon: "cube-outline",
                  color: "#27ae60",
                  title: "4. Unités de vente",
                  body: "L'unité indique comment votre article est vendu et mesuré : à la pièce, au kg, au litre, au carton, par lot, à la tonne...\n\nVous pouvez ajouter plusieurs unités si votre article se vend de différentes façons.\n→ Ex : Tomates peuvent se vendre au kg ET en carton de 10 kg.\n→ Ex : Tissu vendu au mètre ET en coupon de 6 mètres.\n\nChaque unité peut avoir son propre prix et ses propres paliers.",
                },
                {
                  icon: "color-palette-outline",
                  color: "#e67e22",
                  title: "5. Variantes — Couleurs et tailles",
                  body: "Disponible uniquement en mode gros ou avec paliers. Activez les variantes pour proposer plusieurs couleurs et/ou tailles dans un seul article.\n\n→ Ex pour des chaussures en gros :\n  • Palier 1 : 10–29 paires → disponible en Rouge, Noir, Blanc\n  • Palier 2 : 30+ paires → mêmes couleurs, prix réduit\n\n→ Ex pour vêtements : Tailles S, M, L, XL, XXL avec couleurs Bleu marine, Kaki, Blanc\n\nChaque palier peut avoir ses propres couleurs et tailles activées.",
                },
                {
                  icon: "images-outline",
                  color: "#1abc9c",
                  title: "6. Photos (min. 3) et vidéo",
                  body: "Les photos et la vidéo sont les éléments qui font le plus vendre. Un article bien illustré se vend jusqu'à 5× plus vite.\n\n📸 Photos : minimum 3, maximum 6. Prenez des photos :\n  • De face, de dos, de côté\n  • Du détail (texture, couture, fermeture, étiquette)\n  • Avec contexte (porté, utilisé, sur fond propre)\n\n🎥 Vidéo : max 30 secondes. Montrez l'article en action, les détails que la photo ne montre pas, la qualité réelle du produit.\n\nEvitez les photos floues, sombres ou trop petites.",
                },
                {
                  icon: "storefront-outline",
                  color: "#8e44ad",
                  title: "7. Stock, catégorie et visibilité",
                  body: "📦 Stock (optionnel) : indiquez le nombre d'unités disponibles. Si vous ne le remplissez pas, l'article s'affiche comme « disponible » sans quantité précise.\n\n🏷️ Catégorie : classez correctement votre article pour qu'il soit trouvé facilement (Alimentation, Mode, Électronique, etc.).\n\n🌍 Visibilité : votre article sera visible dans les 15 pays francophones d'Afrique où DKD-MARKET est actif (Côte d'Ivoire, Sénégal, Cameroun, Mali, Guinée, etc.).\n\n✅ Une fois publié, l'article apparaît immédiatement dans le catalogue et les résultats de recherche.",
                },
                {
                  icon: "alert-circle-outline",
                  color: "#e74c3c",
                  title: "8. Champs obligatoires et erreurs",
                  body: "Les champs marqués d'un * orange sont obligatoires. Si vous appuyez sur « Publier » sans les avoir remplis, ils s'affichent en rouge avec un message d'erreur.\n\nLes champs les plus souvent oubliés :\n  • Type de publication (en haut, à sélectionner en premier)\n  • Nom de l'article\n  • Prix de vente\n  • Unité(s) de vente\n  • Catégorie\n  • Minimum 3 photos\n\nRemplissez tous les champs en rouge puis appuyez à nouveau sur « Publier ».",
                },
              ].map((item, i) => (
                <View key={i} style={[s.helpItem, { borderColor: "#FF6B00" + "20" }]}>
                  <View style={[s.helpItemIcon, { backgroundColor: item.color + "18" }]}>
                    <Ionicons name={item.icon as any} size={20} color={item.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.helpItemTitle, { color: colors.text }]}>{item.title}</Text>
                    <Text style={[s.helpItemBody, { color: colors.textMuted }]}>{item.body}</Text>
                  </View>
                </View>
              ))}
              <View style={{ height: 20 }} />
            </ScrollView>
            <TouchableOpacity
              style={[s.helpDoneBtn, { backgroundColor: "#FF6B00" }]}
              onPress={() => setShowHelpModal(false)}
            >
              <Text style={s.helpDoneBtnText}>J'ai compris — Commencer à remplir</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  backBtn: { padding: 4, marginRight: 12 },
  headerTitle: { flex: 1, fontFamily: "Poppins_600SemiBold", fontSize: fs(17) },
  helpBtn: {
    width: 36, height: 36, borderRadius: 18, borderWidth: 2,
    alignItems: "center", justifyContent: "center",
  },
  helpBtnText: { fontFamily: "Poppins_700Bold", fontSize: fs(16), color: "#FF6B00" },
  inputError: { borderColor: "#e74c3c", borderWidth: 2 },
  errorHint: { fontFamily: "Poppins_400Regular", fontSize: fs(11), color: "#e74c3c", marginTop: 2, marginBottom: 4 },
  helpOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "flex-end" },
  helpSheet: {
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    maxHeight: "90%", paddingBottom: 24,
  },
  helpHeader: {
    flexDirection: "row", alignItems: "center", gap: 12,
    padding: 20, paddingBottom: 12,
  },
  helpIconBig: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  helpTitle: { flex: 1, fontFamily: "Poppins_700Bold", fontSize: fs(16) },
  helpClose: { padding: 4 },
  helpItem: {
    flexDirection: "row", gap: 12, padding: 16,
    borderBottomWidth: 1, alignItems: "flex-start",
  },
  helpItemIcon: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  helpItemTitle: { fontFamily: "Poppins_600SemiBold", fontSize: fs(13), marginBottom: 6 },
  helpItemBody: { fontFamily: "Poppins_400Regular", fontSize: fs(12), lineHeight: 19 },
  helpDoneBtn: {
    marginHorizontal: 20, marginTop: 16, borderRadius: 14,
    paddingVertical: 14, alignItems: "center",
  },
  helpDoneBtnText: { fontFamily: "Poppins_700Bold", fontSize: fs(14), color: "#fff" },
  scroll: { paddingHorizontal: 16, paddingTop: 20, gap: 4 },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 7, marginBottom: 14, marginTop: 4 },
  sectionTitle: { fontFamily: "Poppins_600SemiBold", fontSize: fs(14) },
  field: { marginBottom: 14 },
  fieldLabel: { fontFamily: "Poppins_700Bold", fontSize: fs(13), marginBottom: 8 },
  input: {
    borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 14,
    paddingVertical: 12, fontFamily: "Poppins_400Regular", fontSize: fs(14),
  },
  textarea: { height: 96, textAlignVertical: "top", paddingTop: 12 },
  aiBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    alignSelf: "flex-end", borderWidth: 1, borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 6, marginTop: 8,
  },
  aiBtnText: { fontFamily: "Poppins_500Medium", fontSize: fs(12) },
  row: { flexDirection: "row", gap: 10 },
  selector: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 13,
  },
  selectorFull: { gap: 8 },
  selectorText: { fontFamily: "Poppins_400Regular", fontSize: fs(13) },
  separator: { height: 1, backgroundColor: "rgba(128,128,128,0.12)", marginVertical: 20 },
  promoPreview: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6, paddingLeft: 4 },
  promoPreviewOld: { fontFamily: "Poppins_400Regular", fontSize: fs(12), textDecorationLine: "line-through" },
  promoPreviewNew: { fontFamily: "Poppins_600SemiBold", fontSize: fs(12), color: "#27ae60" },
  mediaRow: { flexDirection: "row", gap: 14, alignItems: "flex-start" },
  mediaSectionLabel: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  mediaSectionTitle: { fontFamily: "Poppins_600SemiBold", fontSize: fs(13) },
  mediaSectionSub: { fontFamily: "Poppins_400Regular", fontSize: fs(11) },
  videoColumn: { width: ms(90), marginTop: 0 },
  videoBox: {
    width: ms(90), height: ms(90), borderRadius: 12, borderWidth: 1.5,
    borderStyle: "dashed", alignItems: "center", justifyContent: "center", gap: 4, position: "relative",
  },
  videoBoxText: { fontFamily: "Poppins_400Regular", fontSize: 10, textAlign: "center" },
  removeVideoBtn: { position: "absolute", top: 4, right: 4 },
  imagesGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  imageThumbWrap: { width: ms(68), height: ms(68), borderRadius: 10, overflow: "hidden", position: "relative" },
  imageThumb: { width: "100%", height: "100%" },
  removeImageBtn: {
    position: "absolute", top: 3, right: 3,
    backgroundColor: "rgba(0,0,0,0.6)", borderRadius: 10, padding: 2,
  },
  addImageBtn: {
    width: ms(68), height: ms(68), borderRadius: 10, borderWidth: 1.5,
    borderStyle: "dashed", alignItems: "center", justifyContent: "center", gap: 3,
  },
  addImageText: { fontFamily: "Poppins_400Regular", fontSize: 10 },
  imageHint: { fontFamily: "Poppins_400Regular", fontSize: 11, marginTop: 8 },
  modeSection: {
    borderWidth: 1, borderRadius: 16, padding: 16, marginBottom: 20, gap: 10,
  },
  modeSectionTitle: { fontFamily: "Poppins_700Bold", fontSize: fs(15) },
  modeSectionSub: { fontFamily: "Poppins_400Regular", fontSize: fs(12), marginBottom: 4 },
  modeCard: {
    flexDirection: "row", alignItems: "center", gap: 12,
    borderWidth: 1.5, borderRadius: 12, padding: 12,
  },
  modeCardIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  modeCardLabel: { fontFamily: "Poppins_600SemiBold", fontSize: fs(13) },
  modeCardSub: { fontFamily: "Poppins_400Regular", fontSize: fs(11), marginTop: 2 },
  modeRadio: {
    width: 22, height: 22, borderRadius: 11, borderWidth: 2,
    alignItems: "center", justifyContent: "center",
  },
  wholesaleSection: {
    borderWidth: 1.5, borderRadius: 14, padding: 14, marginTop: 0, gap: 4,
  },
  wholesaleSectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  wholesaleSectionTitle: { fontFamily: "Poppins_700Bold", fontSize: fs(14) },
  tiersHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8, marginTop: 4 },
  tiersLabel: { fontFamily: "Poppins_500Medium", fontSize: fs(12) },
  addTierBtn: { flexDirection: "row", alignItems: "center", gap: 4, borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  addTierBtnText: { fontFamily: "Poppins_500Medium", fontSize: fs(12) },
  tierCard: {
    borderWidth: 1.5, borderRadius: 14, marginBottom: 10,
  },
  tierCardHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 12, paddingVertical: 8,
  },
  tierBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  tierBadgeText: { fontFamily: "Poppins_700Bold", fontSize: fs(12) },
  tierDeleteBtn: { padding: 6 },
  tierQtyBlock: {
    flexDirection: "row", alignItems: "flex-start",
    paddingHorizontal: 12, paddingBottom: 12, gap: 6,
  },
  tierQtyCol: { flex: 1, gap: 4 },
  tierColLabel: { fontFamily: "Poppins_500Medium", fontSize: fs(11) },
  tierInputRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  tierNumInput: {
    flex: 1, borderWidth: 1.5, borderRadius: 10,
    paddingHorizontal: 8, paddingVertical: 8,
    fontFamily: "Poppins_700Bold", fontSize: fs(15), textAlign: "center",
    minWidth: 0,
  },
  tierUnitSmall: { fontFamily: "Poppins_400Regular", fontSize: fs(10), flexShrink: 1 },
  tierArrowMid: { paddingTop: 24, alignItems: "center", width: 20 },
  tierNote: { fontFamily: "Poppins_400Regular", fontSize: fs(10) },
  tierPriceBlock: {
    borderTopWidth: 1, flexDirection: "column",
    paddingHorizontal: 12, paddingVertical: 10, gap: 6,
  },
  tierPriceLabel: { fontFamily: "Poppins_500Medium", fontSize: fs(12) },
  tierPriceInputWrap: { flexDirection: "row", alignItems: "center", gap: 6 },
  tierPriceInputNew: {
    flex: 1, borderWidth: 1.5, borderRadius: 10, paddingHorizontal: 12,
    paddingVertical: 9, fontFamily: "Poppins_700Bold", fontSize: fs(15),
    minWidth: 0, textAlign: "center",
  },
  tierCurrencyNew: { fontFamily: "Poppins_700Bold", fontSize: fs(14), flexShrink: 1 },
  checkRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 8 },
  checkLabel: { fontFamily: "Poppins_500Medium", fontSize: fs(13) },
  checkSub: { fontFamily: "Poppins_400Regular", fontSize: fs(11), marginTop: 2 },
  submitBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10,
    borderRadius: 16, paddingVertical: 16, marginTop: 4,
  },
  submitBtnText: { color: "#fff", fontFamily: "Poppins_700Bold", fontSize: fs(16) },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "flex-end" },
  modalSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 20, paddingBottom: 40, maxHeight: "70%" },
  modalSheetTall: { borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 8, paddingBottom: 40, height: "85%" },
  modalTitle: { fontFamily: "Poppins_700Bold", fontSize: 17, paddingHorizontal: 20, marginBottom: 12 },
  modalSearchRow: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "rgba(128,128,128,0.15)",
  },
  modalSearch: { flex: 1, fontFamily: "Poppins_400Regular", fontSize: 14, paddingVertical: 0 },
  modalOption: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 20, paddingVertical: 13 },
  modalOptionSymbol: { fontFamily: "Poppins_700Bold", fontSize: 18, width: 28 },
  modalOptionLabel: { fontFamily: "Poppins_500Medium", fontSize: 14 },
  modalOptionCode: { fontFamily: "Poppins_400Regular", fontSize: 12 },
  variantToggleRow: { flexDirection: "row", gap: 8, paddingHorizontal: 12, paddingVertical: 8 },
  variantToggleBtn: { flex: 1, flexDirection: "row", alignItems: "center", gap: 6, borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7 },
  variantToggleDot: { width: 8, height: 8, borderRadius: 4 },
  variantToggleText: { fontFamily: "Poppins_500Medium", fontSize: fs(12) },
  variantInputRow: { flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1.5, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8, marginHorizontal: 12, marginBottom: 6 },
  variantColorDot: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5 },
  variantInput: { flex: 1, fontFamily: "Poppins_400Regular", fontSize: fs(13), paddingVertical: 0 },
  variantPickBtn: { width: 28, height: 28, borderRadius: 7, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  variantEntryPlusBtn: { width: 26, height: 26, borderRadius: 7, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  variantLinkedBadge: { flexDirection: "row", alignItems: "center", gap: 3, borderWidth: 1, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 3, maxWidth: 70 },
  variantPickerSheet: { marginTop: "auto", borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingTop: 16, paddingBottom: 32, maxHeight: "85%" },
  variantPickerHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, marginBottom: 12 },
  variantPickerSearch: { flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, marginHorizontal: 16, marginBottom: 8 },
  variantPickerSearchInput: { flex: 1, fontFamily: "Poppins_400Regular", fontSize: fs(14), paddingVertical: 0 },
  variantPickerCustom: { flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1, borderStyle: "dashed", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, marginHorizontal: 16, marginBottom: 8 },
  variantPickerCustomText: { fontFamily: "Poppins_500Medium", fontSize: fs(13) },
  colorGrid: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 12, paddingBottom: 16, gap: 6 },
  colorItem: { width: "22%", alignItems: "center", gap: 4, borderRadius: 8, padding: 6, borderWidth: 1.5, borderColor: "transparent" },
  colorCircle: { width: 34, height: 34, borderRadius: 17, borderWidth: 1.5 },
  colorLabel: { fontFamily: "Poppins_400Regular", fontSize: fs(10), textAlign: "center" },
  sizeGroupLabel: { fontFamily: "Poppins_600SemiBold", fontSize: fs(12), marginTop: 12, marginBottom: 6 },
  sizeChipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  sizeChip: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 },
  sizeChipText: { fontFamily: "Poppins_600SemiBold", fontSize: fs(13) },
  normalTierRow: {
    flexDirection: "row", alignItems: "flex-end", gap: 8,
    paddingTop: 12, paddingBottom: 4,
  },
  normalTierQty: { flex: 1 },
  qtyDisplayBox: {
    flexDirection: "row", alignItems: "center",
    height: 40, borderWidth: 1, borderRadius: 8, overflow: "hidden",
  },
  qtyDisplayInput: {
    flex: 1, paddingHorizontal: 10,
    fontFamily: "Poppins_700Bold", fontSize: 16, textAlign: "center",
  },
  normalTierPrice: { flex: 1.4 },
  normalTierDelete: {
    width: 36, height: 42, alignItems: "center", justifyContent: "center",
    borderRadius: 8, borderWidth: 1, borderColor: "#e74c3c" + "50",
    backgroundColor: "#e74c3c" + "08", marginBottom: 0,
  },
  normalTierAddBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, borderWidth: 1, borderRadius: 8, borderStyle: "dashed",
    paddingVertical: 8, marginTop: 8, marginBottom: 4,
  },
  normalTierAddText: { fontFamily: "Poppins_500Medium", fontSize: fs(12) },
  diffPricesToggle: {
    flexDirection: "row", alignItems: "center", gap: 8,
    borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 10,
  },
  diffPricesText: { flex: 1, fontFamily: "Poppins_500Medium", fontSize: fs(13) },
  diffPricesSwitch: { width: 34, height: 20, borderRadius: 10, justifyContent: "center" },
  diffPricesSwitchThumb: { position: "absolute", width: 16, height: 16, borderRadius: 8, backgroundColor: "#fff" },
  unitPage: { flex: 1 },
  unitPageHeader: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1,
  },
  unitPageBack: { padding: 4 },
  unitPageTitle: { fontFamily: "Poppins_700Bold", fontSize: fs(17), flex: 1 },
  unitCustomBtn: {
    flexDirection: "row", alignItems: "center", gap: 4,
    borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5,
  },
  unitCustomBtnText: { fontFamily: "Poppins_500Medium", fontSize: fs(12) },
  unitSearchWrap: {
    flexDirection: "row", alignItems: "center", gap: 8,
    margin: 12, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10,
  },
  unitSearchInput: { flex: 1, fontFamily: "Poppins_400Regular", fontSize: fs(14), paddingVertical: 0 },
  unitSelectedBar: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 12, paddingVertical: 8,
  },
  unitSelectedCount: { fontFamily: "Poppins_600SemiBold", fontSize: fs(12) },
  unitChip: {
    flexDirection: "row", alignItems: "center", gap: 4,
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, marginRight: 6,
  },
  unitChipNum: { fontFamily: "Poppins_700Bold", fontSize: fs(11) },
  unitChipText: { fontFamily: "Poppins_500Medium", fontSize: fs(12) },
  unitGroupTitle: {
    fontFamily: "Poppins_600SemiBold", fontSize: fs(11),
    paddingHorizontal: 16, paddingVertical: 6, textTransform: "uppercase", letterSpacing: 0.5,
  },
  unitRow: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 0.5, gap: 12,
  },
  unitRowName: { fontFamily: "Poppins_600SemiBold", fontSize: fs(14) },
  unitRowAbbr: { fontFamily: "Poppins_400Regular", fontSize: fs(13) },
  unitRowEx: { fontFamily: "Poppins_400Regular", fontSize: fs(12), marginTop: 2 },
  unitCheckBox: {
    width: 28, height: 28, borderRadius: 14, borderWidth: 2,
    alignItems: "center", justifyContent: "center",
  },
  unitCheckNum: { fontFamily: "Poppins_700Bold", fontSize: fs(12), color: "#fff" },
  unitApplyRow: {
    paddingHorizontal: 16, paddingTop: 12, borderTopWidth: 1,
  },
  unitApplyBtn: {
    borderRadius: 14, paddingVertical: 14, alignItems: "center", justifyContent: "center",
  },
  unitApplyBtnText: { fontFamily: "Poppins_700Bold", fontSize: fs(15) },
  customFormCard: {
    margin: 12, borderWidth: 1, borderRadius: 14, padding: 14,
  },
  customFormTitle: { fontFamily: "Poppins_700Bold", fontSize: fs(14) },
  customFormLabel: { fontFamily: "Poppins_500Medium", fontSize: fs(12), marginTop: 10, marginBottom: 4 },
  customFormInput: {
    borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10,
    fontFamily: "Poppins_400Regular", fontSize: fs(14),
  },
});
