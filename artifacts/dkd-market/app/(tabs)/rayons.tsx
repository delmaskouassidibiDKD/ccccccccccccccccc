import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { AppHeader } from "@/components/AppHeader";
import { SideDrawer } from "@/components/SideDrawer";
import { useQuery } from "@tanstack/react-query";
import { api, Category } from "@/lib/api";
import { useTheme } from "@/contexts/ThemeContext";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  CategoryCard,
  CategoryProductsView,
} from "@/components/CategoryProductsView";

export const STATIC_CATEGORIES: Category[] = [
  { id: 1,   name: "Alimentation & Consommation",      parent_id: null, icon_url: null, image_url: null },
  { id: 2,   name: "Épicerie Sèche",                   parent_id: null, icon_url: null, image_url: null },
  { id: 3,   name: "Produits Frais & Laitiers",        parent_id: null, icon_url: null, image_url: null },
  { id: 4,   name: "Boucherie & Poissonnerie",         parent_id: null, icon_url: null, image_url: null },
  { id: 5,   name: "Boissons",                         parent_id: null, icon_url: null, image_url: null },
  { id: 6,   name: "Petit-déjeuner",                   parent_id: null, icon_url: null, image_url: null },
  { id: 7,   name: "Snacks & Plaisirs",                parent_id: null, icon_url: null, image_url: null },
  { id: 8,   name: "Mode & Habillement",               parent_id: null, icon_url: null, image_url: null },
  { id: 9,   name: "Prêt-à-porter Homme",              parent_id: null, icon_url: null, image_url: null },
  { id: 10,  name: "Prêt-à-porter Femme",              parent_id: null, icon_url: null, image_url: null },
  { id: 11,  name: "Vêtements de sport",               parent_id: null, icon_url: null, image_url: null },
  { id: 12,  name: "Sous-vêtements & Lingerie",        parent_id: null, icon_url: null, image_url: null },
  { id: 13,  name: "Tenues traditionnelles",           parent_id: null, icon_url: null, image_url: null },
  { id: 14,  name: "Chaussures",                       parent_id: null, icon_url: null, image_url: null },
  { id: 15,  name: "Accessoires de mode",              parent_id: null, icon_url: null, image_url: null },
  { id: 16,  name: "Santé, Beauté & Hygiène",          parent_id: null, icon_url: null, image_url: null },
  { id: 17,  name: "Soins du Corps",                   parent_id: null, icon_url: null, image_url: null },
  { id: 18,  name: "Soins Capillaires",                parent_id: null, icon_url: null, image_url: null },
  { id: 19,  name: "Cosmétique & Maquillage",          parent_id: null, icon_url: null, image_url: null },
  { id: 20,  name: "Hygiène Maison",                   parent_id: null, icon_url: null, image_url: null },
  { id: 21,  name: "Para-médical & Pharmacie",         parent_id: null, icon_url: null, image_url: null },
  { id: 22,  name: "Enfants & Puériculture",           parent_id: null, icon_url: null, image_url: null },
  { id: 23,  name: "Alimentation Bébé",                parent_id: null, icon_url: null, image_url: null },
  { id: 24,  name: "Soins & Hygiène Bébé",             parent_id: null, icon_url: null, image_url: null },
  { id: 25,  name: "Équipement & Éveil",               parent_id: null, icon_url: null, image_url: null },
  { id: 26,  name: "Papeterie & Scolaire",             parent_id: null, icon_url: null, image_url: null },
  { id: 27,  name: "Maison, Cuisine & Mobilier",       parent_id: null, icon_url: null, image_url: null },
  { id: 28,  name: "Gros Électroménager",              parent_id: null, icon_url: null, image_url: null },
  { id: 29,  name: "Petit Électroménager",             parent_id: null, icon_url: null, image_url: null },
  { id: 30,  name: "Ustensiles de Cuisine",            parent_id: null, icon_url: null, image_url: null },
  { id: 31,  name: "Mobilier",                         parent_id: null, icon_url: null, image_url: null },
  { id: 32,  name: "Linge de maison",                  parent_id: null, icon_url: null, image_url: null },
  { id: 33,  name: "Électronique & High-Tech",         parent_id: null, icon_url: null, image_url: null },
  { id: 34,  name: "Téléphones & Tablettes",           parent_id: null, icon_url: null, image_url: null },
  { id: 35,  name: "Ordinateurs",                      parent_id: null, icon_url: null, image_url: null },
  { id: 36,  name: "Accessoires & Périphériques",      parent_id: null, icon_url: null, image_url: null },
  { id: 37,  name: "Audio & Stockage",                 parent_id: null, icon_url: null, image_url: null },
  { id: 38,  name: "Câblage",                          parent_id: null, icon_url: null, image_url: null },
  { id: 39,  name: "Électricité & Énergie",            parent_id: null, icon_url: null, image_url: null },
  { id: 40,  name: "Solaire & Renouvelable",           parent_id: null, icon_url: null, image_url: null },
  { id: 41,  name: "Bâtiment & Industrie",             parent_id: null, icon_url: null, image_url: null },
  { id: 42,  name: "Câblage & Puissance",              parent_id: null, icon_url: null, image_url: null },
  { id: 43,  name: "Machines & Outillage Industriel",  parent_id: null, icon_url: null, image_url: null },
  { id: 44,  name: "Outillage",                        parent_id: null, icon_url: null, image_url: null },
  { id: 45,  name: "Équipement Pro",                   parent_id: null, icon_url: null, image_url: null },
  { id: 46,  name: "Manutention",                      parent_id: null, icon_url: null, image_url: null },
  { id: 47,  name: "Construction & BTP",               parent_id: null, icon_url: null, image_url: null },
  { id: 48,  name: "Matériaux",                        parent_id: null, icon_url: null, image_url: null },
  { id: 49,  name: "Isolation",                        parent_id: null, icon_url: null, image_url: null },
  { id: 50,  name: "Second Œuvre",                     parent_id: null, icon_url: null, image_url: null },
  { id: 51,  name: "Automobile & Transport",           parent_id: null, icon_url: null, image_url: null },
  { id: 52,  name: "Maintenance Auto",                 parent_id: null, icon_url: null, image_url: null },
  { id: 53,  name: "Lubrifiants",                      parent_id: null, icon_url: null, image_url: null },
  { id: 54,  name: "Accessoires Auto",                 parent_id: null, icon_url: null, image_url: null },
  { id: 55,  name: "Moto",                             parent_id: null, icon_url: null, image_url: null },
  { id: 56,  name: "Sécurité & Protection",            parent_id: null, icon_url: null, image_url: null },
  { id: 57,  name: "Équipement Personnel",             parent_id: null, icon_url: null, image_url: null },
  { id: 58,  name: "Sécurité Site",                    parent_id: null, icon_url: null, image_url: null },
  { id: 59,  name: "Chimie & Laboratoire",             parent_id: null, icon_url: null, image_url: null },
  { id: 60,  name: "Maintenance Industrielle",         parent_id: null, icon_url: null, image_url: null },
  { id: 61,  name: "Équipement Labo",                  parent_id: null, icon_url: null, image_url: null },
  { id: 62,  name: "Agriculture & Élevage",            parent_id: null, icon_url: null, image_url: null },
  { id: 63,  name: "Culture",                          parent_id: null, icon_url: null, image_url: null },
  { id: 64,  name: "Élevage",                          parent_id: null, icon_url: null, image_url: null },
  { id: 65,  name: "Logistique & Emballage",           parent_id: null, icon_url: null, image_url: null },
  { id: 66,  name: "Emballage",                        parent_id: null, icon_url: null, image_url: null },
  { id: 67,  name: "Stockage",                         parent_id: null, icon_url: null, image_url: null },
  { id: 68,  name: "Animaux & Animalerie",             parent_id: null, icon_url: null, image_url: null },
  { id: 69,  name: "Alimentation animale",             parent_id: null, icon_url: null, image_url: null },
  { id: 70,  name: "Accessoires pour animaux",         parent_id: null, icon_url: null, image_url: null },
  { id: 71,  name: "Soins vétérinaires",               parent_id: null, icon_url: null, image_url: null },
  { id: 72,  name: "Aquariophilie",                    parent_id: null, icon_url: null, image_url: null },
  { id: 73,  name: "Sports & Loisirs",                 parent_id: null, icon_url: null, image_url: null },
  { id: 74,  name: "Fitness & Musculation",            parent_id: null, icon_url: null, image_url: null },
  { id: 75,  name: "Sports d'équipe",                  parent_id: null, icon_url: null, image_url: null },
  { id: 76,  name: "Sports de combat",                 parent_id: null, icon_url: null, image_url: null },
  { id: 77,  name: "Camping & Randonnée",              parent_id: null, icon_url: null, image_url: null },
  { id: 78,  name: "Pêche & Chasse",                   parent_id: null, icon_url: null, image_url: null },
  { id: 79,  name: "Cyclisme",                         parent_id: null, icon_url: null, image_url: null },
  { id: 80,  name: "Jeux & Jouets",                    parent_id: null, icon_url: null, image_url: null },
  { id: 81,  name: "Jeux de société",                  parent_id: null, icon_url: null, image_url: null },
  { id: 82,  name: "Jeux vidéo",                       parent_id: null, icon_url: null, image_url: null },
  { id: 83,  name: "Jouets éducatifs",                 parent_id: null, icon_url: null, image_url: null },
  { id: 84,  name: "Peluches & Figurines",             parent_id: null, icon_url: null, image_url: null },
  { id: 85,  name: "Jeux outdoor",                     parent_id: null, icon_url: null, image_url: null },
  { id: 86,  name: "Art, Culture & Musique",           parent_id: null, icon_url: null, image_url: null },
  { id: 87,  name: "Instruments de musique",           parent_id: null, icon_url: null, image_url: null },
  { id: 88,  name: "Livres & BD",                      parent_id: null, icon_url: null, image_url: null },
  { id: 89,  name: "Tableaux & Sculptures",            parent_id: null, icon_url: null, image_url: null },
  { id: 90,  name: "Artisanat d'art",                  parent_id: null, icon_url: null, image_url: null },
  { id: 91,  name: "Bureau & Entreprise",              parent_id: null, icon_url: null, image_url: null },
  { id: 92,  name: "Mobilier de bureau",               parent_id: null, icon_url: null, image_url: null },
  { id: 93,  name: "Fournitures de bureau",            parent_id: null, icon_url: null, image_url: null },
  { id: 94,  name: "Équipement de bureau",             parent_id: null, icon_url: null, image_url: null },
  { id: 95,  name: "Services aux entreprises",         parent_id: null, icon_url: null, image_url: null },
  { id: 96,  name: "Voyage & Tourisme",                parent_id: null, icon_url: null, image_url: null },
  { id: 97,  name: "Bagagerie",                        parent_id: null, icon_url: null, image_url: null },
  { id: 98,  name: "Accessoires de voyage",            parent_id: null, icon_url: null, image_url: null },
  { id: 99,  name: "Hébergement",                      parent_id: null, icon_url: null, image_url: null },
  { id: 100, name: "Circuits & Excursions",            parent_id: null, icon_url: null, image_url: null },
  { id: 101, name: "Transport",                        parent_id: null, icon_url: null, image_url: null },
  { id: 102, name: "Mariage & Événements",             parent_id: null, icon_url: null, image_url: null },
  { id: 103, name: "Robes & Costumes",                 parent_id: null, icon_url: null, image_url: null },
  { id: 104, name: "Décoration événementielle",        parent_id: null, icon_url: null, image_url: null },
  { id: 105, name: "Traiteur & Réception",             parent_id: null, icon_url: null, image_url: null },
  { id: 106, name: "Animation & DJ",                   parent_id: null, icon_url: null, image_url: null },
  { id: 107, name: "Faire-part & Cadeaux",             parent_id: null, icon_url: null, image_url: null },
  { id: 108, name: "Bien-être & Spiritualité",         parent_id: null, icon_url: null, image_url: null },
  { id: 109, name: "Aromathérapie",                    parent_id: null, icon_url: null, image_url: null },
  { id: 110, name: "Lithothérapie",                    parent_id: null, icon_url: null, image_url: null },
  { id: 111, name: "Méditation & Yoga",                parent_id: null, icon_url: null, image_url: null },
  { id: 112, name: "Livres spirituels",                parent_id: null, icon_url: null, image_url: null },
  { id: 113, name: "Technologies Émergentes",          parent_id: null, icon_url: null, image_url: null },
  { id: 114, name: "Objets connectés",                 parent_id: null, icon_url: null, image_url: null },
  { id: 115, name: "Drones",                           parent_id: null, icon_url: null, image_url: null },
  { id: 116, name: "Impression 3D",                    parent_id: null, icon_url: null, image_url: null },
  { id: 117, name: "Réalité virtuelle",                parent_id: null, icon_url: null, image_url: null },
  { id: 118, name: "Collection & Passions",            parent_id: null, icon_url: null, image_url: null },
  { id: 119, name: "Numismatique",                     parent_id: null, icon_url: null, image_url: null },
  { id: 120, name: "Philatélie",                       parent_id: null, icon_url: null, image_url: null },
  { id: 121, name: "Cartes & TCG",                     parent_id: null, icon_url: null, image_url: null },
  { id: 122, name: "Modélisme",                        parent_id: null, icon_url: null, image_url: null },
  { id: 123, name: "Militaria",                        parent_id: null, icon_url: null, image_url: null },
  { id: 124, name: "Services Professionnels",          parent_id: null, icon_url: null, image_url: null },
  { id: 125, name: "Services informatiques",           parent_id: null, icon_url: null, image_url: null },
  { id: 126, name: "Services à la personne",           parent_id: null, icon_url: null, image_url: null },
  { id: 127, name: "Formation & Cours",                parent_id: null, icon_url: null, image_url: null },
  { id: 128, name: "Conseil & Expertise",              parent_id: null, icon_url: null, image_url: null },
  { id: 129, name: "Réparation & Maintenance",         parent_id: null, icon_url: null, image_url: null },
  { id: 130, name: "Location",                         parent_id: null, icon_url: null, image_url: null },
  { id: 131, name: "Location véhicules",               parent_id: null, icon_url: null, image_url: null },
  { id: 132, name: "Location équipement",              parent_id: null, icon_url: null, image_url: null },
  { id: 133, name: "Location espace",                  parent_id: null, icon_url: null, image_url: null },
  { id: 134, name: "Location tenues",                  parent_id: null, icon_url: null, image_url: null },
  { id: 135, name: "Immobilier",                       parent_id: null, icon_url: null, image_url: null },
  { id: 136, name: "Vente immobilière",                parent_id: null, icon_url: null, image_url: null },
  { id: 137, name: "Location immobilière",             parent_id: null, icon_url: null, image_url: null },
  { id: 138, name: "Investissement",                   parent_id: null, icon_url: null, image_url: null },
  { id: 139, name: "Gestion immobilière",              parent_id: null, icon_url: null, image_url: null },
  { id: 140, name: "Emploi & Carrière",                parent_id: null, icon_url: null, image_url: null },
  { id: 141, name: "Offres d'emploi",                  parent_id: null, icon_url: null, image_url: null },
  { id: 142, name: "CV & Entretien",                   parent_id: null, icon_url: null, image_url: null },
  { id: 143, name: "Coaching carrière",                parent_id: null, icon_url: null, image_url: null },
  { id: 144, name: "Stage & Alternance",               parent_id: null, icon_url: null, image_url: null },
  { id: 145, name: "Alimentation Spécifique",          parent_id: null, icon_url: null, image_url: null },
  { id: 146, name: "Bio & Naturel",                    parent_id: null, icon_url: null, image_url: null },
  { id: 147, name: "Sans Gluten",                      parent_id: null, icon_url: null, image_url: null },
  { id: 148, name: "Végétalien & Vegan",               parent_id: null, icon_url: null, image_url: null },
  { id: 149, name: "Halal",                            parent_id: null, icon_url: null, image_url: null },
  { id: 150, name: "Casher",                           parent_id: null, icon_url: null, image_url: null },
  { id: 151, name: "Écologie & Développement Durable", parent_id: null, icon_url: null, image_url: null },
  { id: 152, name: "Énergies renouvelables",           parent_id: null, icon_url: null, image_url: null },
  { id: 153, name: "Recyclage",                        parent_id: null, icon_url: null, image_url: null },
  { id: 154, name: "Zéro déchet",                      parent_id: null, icon_url: null, image_url: null },
  { id: 155, name: "Agriculture durable",              parent_id: null, icon_url: null, image_url: null },
  { id: 156, name: "Autres",                           parent_id: null, icon_url: null, image_url: null },
  { id: 157, name: "Articles divers",                  parent_id: null, icon_url: null, image_url: null },
  { id: 158, name: "Créations uniques",                parent_id: null, icon_url: null, image_url: null },
  { id: 159, name: "Collections & Vintage",            parent_id: null, icon_url: null, image_url: null },
  { id: 160, name: "Services divers",                  parent_id: null, icon_url: null, image_url: null },
  { id: 161, name: "Demandes spéciales",               parent_id: null, icon_url: null, image_url: null },
  { id: 162, name: "Divers",                           parent_id: null, icon_url: null, image_url: null },
];


type MarketKey = "marche" | "grossiste" | "supermarche" | "importe";

const MARKET_CONFIG: Record<MarketKey, { label: string; icon: string; color: string; ids: number[] }> = {
  marche: {
    label: "Marché",
    icon: "storefront-outline",
    color: "#22C55E",
    ids: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,102,103,104,105,106,107,118,145,146,147,148,149,150,156,157,158,159],
  },
  grossiste: {
    label: "Grossiste",
    icon: "cube-outline",
    color: "#3B82F6",
    ids: [41,42,43,44,45,46,47,48,49,50,59,60,61,62,63,64,65,66,67,91,92,93,94,95,124,125,126,127,128,129,130,131,132,133,134],
  },
  supermarche: {
    label: "Super Marché",
    icon: "cart-outline",
    color: "#FF6B00",
    ids: [1,2,3,4,5,6,7,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,145,146,147,148,149,150],
  },
  importe: {
    label: "Importés",
    icon: "airplane-outline",
    color: "#8B5CF6",
    ids: [33,34,35,36,37,38,39,40,51,52,53,54,55,96,97,98,99,100,101,113,114,115,116,117],
  },
};

export default function RayonsScreen() {
  const [search, setSearch] = useState("");
  const [searchVisible, setSearchVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const searchRef = useRef<TextInput>(null);
  const bottomPadding = Platform.OS === "web" ? 34 : 90;
  const { colors } = useTheme();
  const { t } = useLanguage();

  const categories: Category[] = STATIC_CATEGORIES;

  const filtered = search.trim()
    ? categories.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()))
    : categories;

  const handleSearchToggle = () => {
    const next = !searchVisible;
    setSearchVisible(next);
    if (next) setTimeout(() => searchRef.current?.focus(), 80);
    else { setSearch(""); searchRef.current?.blur(); }
  };

  const handleSearchSubmit = () => {
    if (filtered.length > 0) setSelectedCategory(filtered[0]);
  };


  if (selectedCategory) {
    return (
      <CategoryProductsView
        category={selectedCategory}
        onBack={() => setSelectedCategory(null)}
      />
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader onMenuPress={() => setDrawerOpen(true)} />

      <View style={styles.subHeader}>
        <View style={styles.titleRow}>
          <TouchableOpacity
            onPress={handleSearchToggle}
            style={[styles.loupeBtn, { backgroundColor: searchVisible ? colors.primary + "20" : colors.backgroundCard }]}
            activeOpacity={0.7}
          >
            <Ionicons
              name={searchVisible ? "close-outline" : "search-outline"}
              size={18}
              color={searchVisible ? colors.primary : colors.textMuted}
            />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>{t.categories.title}</Text>
            <Text style={[styles.headerSub, { color: colors.textMuted }]}>
              {categories.length} {t.categories.allCategories}
            </Text>
          </View>
        </View>

        {/* Filter pills — all visible */}
        <View style={styles.filterGrid}>
          <TouchableOpacity
            style={[styles.filterPill, { backgroundColor: "#EC4899" + "18", borderColor: "#EC4899" + "55" }]}
            onPress={() => { Haptics.selectionAsync(); router.push("/rayons-gastronomie" as any); }}
            activeOpacity={0.8}
          >
            <Ionicons name="restaurant-outline" size={13} color="#EC4899" />
            <Text style={[styles.filterPillText, { color: "#EC4899" }]}>Gastronomie</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterPill, { backgroundColor: "#06B6D4" + "18", borderColor: "#06B6D4" + "55" }]}
            onPress={() => { Haptics.selectionAsync(); router.push("/rayons-personnalisation" as any); }}
            activeOpacity={0.8}
          >
            <Ionicons name="color-palette-outline" size={13} color="#06B6D4" />
            <Text style={[styles.filterPillText, { color: "#06B6D4" }]}>Personnalisation</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterPill, { backgroundColor: "#6366F1" + "18", borderColor: "#6366F1" + "55" }]}
            onPress={() => { Haptics.selectionAsync(); router.push("/achats-groupes" as any); }}
            activeOpacity={0.8}
          >
            <Ionicons name="people-outline" size={13} color="#6366F1" />
            <Text style={[styles.filterPillText, { color: "#6366F1" }]}>Achats groupés</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterPill, { backgroundColor: "#EF4444" + "18", borderColor: "#EF4444" + "55" }]}
            onPress={() => { Haptics.selectionAsync(); router.push("/promos" as any); }}
            activeOpacity={0.8}
          >
            <Ionicons name="pricetag-outline" size={13} color="#EF4444" />
            <Text style={[styles.filterPillText, { color: "#EF4444" }]}>Promos</Text>
          </TouchableOpacity>

          {(["marche", "grossiste", "supermarche", "importe"] as MarketKey[]).map((key) => {
            const cfg = MARKET_CONFIG[key];
            const routes: Record<MarketKey, string> = {
              marche: "/rayons-marche",
              grossiste: "/grossiste?browse=1",
              supermarche: "/rayons-supermarche",
              importe: "/importe?browse=1",
            };
            return (
              <TouchableOpacity
                key={key}
                onPress={() => { Haptics.selectionAsync(); router.push(routes[key] as any); }}
                style={[styles.filterPill, { backgroundColor: cfg.color + "18", borderColor: cfg.color + "55" }]}
                activeOpacity={0.75}
              >
                <Ionicons name={cfg.icon as any} size={13} color={cfg.color} />
                <Text style={[styles.filterPillText, { color: cfg.color }]}>{cfg.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {searchVisible && (
        <View style={[styles.searchContainer, { backgroundColor: colors.backgroundCard, borderColor: colors.border }]}>
          <Ionicons name="search-outline" size={14} color={colors.textMuted} />
          <TextInput
            ref={searchRef}
            style={[styles.searchInput, { color: colors.text }]}
            placeholder={t.common.search}
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={handleSearchSubmit}
            returnKeyType="search"
            autoFocus
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Ionicons name="close-circle" size={14} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      )}

      {filtered.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="search-outline" size={40} color={colors.textMuted} />
          <Text style={[styles.emptyText, { color: colors.text }]}>{t.common.noResults}</Text>
        </View>
      ) : (
        <FlatList
          key="categories-grid-2col"
          data={filtered}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          columnWrapperStyle={styles.gridRow}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.content, { paddingBottom: bottomPadding }]}
          initialNumToRender={16}
          maxToRenderPerBatch={12}
          windowSize={5}
          removeClippedSubviews
          renderItem={({ item, index }) => (
            <CategoryCard item={item} index={index} onPress={() => setSelectedCategory(item)} />
          )}
        />
      )}

      <SideDrawer visible={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  subHeader: {
    flexDirection: 'column',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 8,
    gap: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filterGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  filterPillText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12,
  },
  loupeBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 18,
    marginBottom: 2,
  },
  headerSub: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 8,
    paddingHorizontal: 10,
    gap: 6,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    paddingVertical: 7,
  },
  content: { paddingHorizontal: 12, paddingTop: 4 },
  gridRow: { gap: 8, marginBottom: 8 },
  emptyState: { alignItems: 'center', paddingTop: 60, gap: 8 },
  emptyText: { fontFamily: 'Poppins_600SemiBold', fontSize: 16 },
});
