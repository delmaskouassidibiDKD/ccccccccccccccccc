import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useTheme } from "../contexts/ThemeContext";
import { SellerProductCard, SellerProduct } from "@/components/SellerProductCard";

const ORANGE = "#FF6B00";
type Tab = "articles" | "engros" | "video";

/* ─── Données démo ─────────────────────────────────────────────── */

const DEMO_ARTICLES: SellerProduct[] = [
  { id: "1", shopName: "Savons Ouaga",  shopFlag: "🇧🇫", title: "Savon Karité Naturel",      price: "1 500 FCFA",  rating: 4.7, reviewCount: 430, status: "active",   icon: "sparkles-outline",  color: "#4A7C59" },
  { id: "2", shopName: "Cuir Cotonou",  shopFlag: "🇧🇯", title: "Chaussures Cuir Homme",     price: "18 500 FCFA", rating: 4.4, reviewCount: 203, status: "active",   icon: "footsteps-outline", color: "#7B4226" },
  { id: "3", shopName: "Mode Dakar",    shopFlag: "🇸🇳", title: "Pagne Wax Java 6 yards",    price: "12 500 FCFA", rating: 4.9, reviewCount: 178, status: "active",   icon: "shirt-outline",     color: "#1B4D9E" },
];

const DEMO_ENGROS: SellerProduct[] = [
  { id: "1", shopName: "Grossiste ABJ",   shopFlag: "🇨🇮", title: "Carton pagnes wax 50 pièces",      price: "180 000 FCFA", rating: 4.6, reviewCount: 34, status: "active",   icon: "cube-outline",   color: "#3B5998", minQty: "50 pcs"   },
  { id: "2", shopName: "Palm Conakry",    shopFlag: "🇬🇳", title: "Palette huile de palme 24 bidons", price: "72 000 FCFA",  rating: 4.3, reviewCount: 19, status: "active",   icon: "leaf-outline",   color: "#3B7A43", minQty: "24 bidons"},
  { id: "3", shopName: "Beauté Pro Lomé", shopFlag: "🇹🇬", title: "Carton savon karité 100 pcs",      price: "45 000 FCFA",  rating: 4.1, reviewCount: 11, status: "inactive", icon: "flower-outline", color: "#9B2B6B", minQty: "100 pcs" },
];

type VideoPublication = {
  id: string;
  title: string;
  shopName: string;
  shopFlag: string;
  duration: string;
  views: number;
  price: string;
  color: string;
  icon: string;
  status: "published" | "draft";
  videoUrl?: string;
};

const DEMO_VIDEOS: VideoPublication[] = [
  { id: "v1", shopName: "Savons Ouaga",  shopFlag: "🇧🇫", title: "Présentation savon karité naturel",  duration: "1:24", views: 1240, price: "1 500 FCFA",  color: "#4A7C59", icon: "sparkles-outline",  status: "published" },
  { id: "v2", shopName: "Mode Dakar",    shopFlag: "🇸🇳", title: "Collection pagne wax printemps 2025", duration: "2:08", views: 876,  price: "12 500 FCFA", color: "#1B4D9E", icon: "shirt-outline",     status: "published" },
  { id: "v3", shopName: "Cuir Cotonou",  shopFlag: "🇧🇯", title: "Nouveau modèle chaussures cuir",     duration: "0:58", views: 322,  price: "18 500 FCFA", color: "#7B4226", icon: "footsteps-outline", status: "draft"     },
];

/* ─── Card vidéo ────────────────────────────────────────────────── */

function VideoCard({
  item,
  isDark,
  onPlay,
  onEdit,
}: {
  item: VideoPublication;
  isDark: boolean;
  onPlay: () => void;
  onEdit: () => void;
}) {
  const dCARD   = isDark ? "#161B25" : "#FFFFFF";
  const dBORDER = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.07)";
  const dTEXT   = isDark ? "#F0F0F0" : "#111827";
  const dSUB    = isDark ? "#8B9AB0" : "#6B7280";
  const dMOD    = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)";
  const published = item.status === "published";

  return (
    <View style={[vc.card, { backgroundColor: dCARD, borderColor: dBORDER }]}>

      {/* Miniature colorée */}
      <View style={[vc.thumb, { backgroundColor: item.color }]}>
        <Ionicons name={item.icon as any} size={28} color="rgba(255,255,255,0.6)" />

        {/* Overlay lecture */}
        <TouchableOpacity style={vc.playOverlay} onPress={onPlay} activeOpacity={0.85}>
          <Ionicons name="play-circle" size={38} color="#fff" />
        </TouchableOpacity>

        {/* Durée */}
        <View style={vc.durationBadge}>
          <Text style={vc.durationText}>{item.duration}</Text>
        </View>

        {/* Statut */}
        <View style={[vc.statusBadge, { backgroundColor: published ? "#22C55E" : "#F59E0B" }]}>
          <Text style={vc.statusText}>{published ? "Publié" : "Brouillon"}</Text>
        </View>
      </View>

      {/* Infos */}
      <View style={vc.info}>
        <Text style={[vc.shopName, { color: dSUB }]} numberOfLines={1}>
          {item.shopName} {item.shopFlag}
        </Text>
        <Text style={[vc.title, { color: dTEXT }]} numberOfLines={2}>
          {item.title}
        </Text>

        <View style={vc.statsRow}>
          <Ionicons name="eye-outline" size={12} color={dSUB} />
          <Text style={[vc.statsText, { color: dSUB }]}>{item.views.toLocaleString()} vues</Text>
          <View style={vc.dot} />
          <Text style={[vc.price, { color: ORANGE }]}>{item.price}</Text>
        </View>

        {/* Boutons */}
        <View style={vc.actions}>
          <TouchableOpacity
            style={[vc.btn, { backgroundColor: ORANGE + "18", borderColor: ORANGE + "40" }]}
            onPress={onPlay}
            activeOpacity={0.8}
          >
            <Ionicons name="play-circle-outline" size={14} color={ORANGE} />
            <Text style={[vc.btnText, { color: ORANGE }]}>Regarder</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[vc.btn, { backgroundColor: dMOD }]}
            onPress={onEdit}
            activeOpacity={0.8}
          >
            <Ionicons name="create-outline" size={14} color={dSUB} />
            <Text style={[vc.btnText, { color: dSUB }]}>Modifier</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const vc = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: 14,
  },
  thumb: {
    height: 150,
    alignItems: "center",
    justifyContent: "center",
  },
  playOverlay: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  durationBadge: {
    position: "absolute",
    bottom: 8,
    right: 10,
    backgroundColor: "rgba(0,0,0,0.65)",
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  durationText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 11,
    color: "#fff",
  },
  statusBadge: {
    position: "absolute",
    top: 8,
    left: 10,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  statusText: {
    fontFamily: "Poppins_700Bold",
    fontSize: 10,
    color: "#fff",
  },
  info: {
    padding: 14,
    gap: 4,
  },
  shopName: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
  },
  title: {
    fontFamily: "Poppins_700Bold",
    fontSize: 13,
    lineHeight: 18,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 2,
  },
  statsText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: "#94A3B8",
  },
  price: {
    fontFamily: "Poppins_700Bold",
    fontSize: 12,
  },
  actions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  btn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "transparent",
  },
  btnText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12,
  },
});

/* ─── Écran principal ───────────────────────────────────────────── */

export default function MesPublications() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const paddingTop    = Platform.OS === "web" ? 0 : insets.top;
  const paddingBottom = Platform.OS === "web" ? 34 : insets.bottom;

  const dBG     = isDark ? "#0A0A0A" : "#F0F4F8";
  const dHEAD   = isDark ? "#111"    : "#1a1f2e";
  const dMUTED  = isDark ? "#6B7280" : "#9CA3AF";
  const dBORDER = isDark ? "#1E1E1E" : "rgba(0,0,0,0.08)";

  const [activeTab, setActiveTab] = useState<Tab>("articles");
  const [articles]  = useState(DEMO_ARTICLES);
  const [engros]    = useState(DEMO_ENGROS);
  const [videos]    = useState(DEMO_VIDEOS);

  const TABS = [
    { key: "articles" as Tab, label: "Articles", count: articles.length, icon: "bag-handle-outline" },
    { key: "engros"   as Tab, label: "En gros",  count: engros.length,   icon: "layers-outline"    },
    { key: "video"    as Tab, label: "Vidéo",    count: videos.length,   icon: "videocam-outline"  },
  ];

  const data     = activeTab === "articles" ? articles : activeTab === "engros" ? engros : [];
  const isEngros = activeTab === "engros";

  return (
    <View style={[s.container, { paddingTop, backgroundColor: dBG }]}>

      {/* Header */}
      <View style={[s.header, { backgroundColor: dHEAD, borderBottomColor: "rgba(255,255,255,0.08)" }]}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Mes publications</Text>
        <TouchableOpacity style={s.addBtn} onPress={() => router.push("/add-product" as any)}>
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={[s.tabBar, { backgroundColor: isDark ? "#111" : "#F8F8F8", borderBottomColor: dBORDER }]}>
        {TABS.map((tab) => {
          const active = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[
                s.tabItem,
                { backgroundColor: isDark ? "#1A1A1A" : "#EFEFEF" },
                active && s.tabItemActive,
              ]}
              onPress={() => { setActiveTab(tab.key); Haptics.selectionAsync(); }}
              activeOpacity={0.8}
            >
              <Ionicons name={tab.icon as any} size={15} color={active ? ORANGE : dMUTED} />
              <Text style={[s.tabLabel, { color: active ? ORANGE : dMUTED }]}>{tab.label}</Text>
              <View style={[s.tabCount, { backgroundColor: isDark ? "#2D2D2D" : "#E5E7EB" }, active && s.tabCountActive]}>
                <Text style={[s.tabCountText, { color: active ? ORANGE : dMUTED }]}>{tab.count}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Contenu — onglet Vidéo */}
      {activeTab === "video" ? (
        <FlatList
          key="video"
          data={videos}
          keyExtractor={(i) => i.id}
          contentContainerStyle={[s.list, { paddingBottom: paddingBottom + 24 }]}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <VideoCard
              item={item}
              isDark={isDark}
              onPlay={() => {
                Haptics.selectionAsync();
                router.push({
                  pathname: "/product-video" as any,
                  params: { videoUrl: item.videoUrl ?? "", productTitle: item.title },
                });
              }}
              onEdit={() => {
                Haptics.selectionAsync();
                router.push({
                  pathname: "/edit-product/[id]" as any,
                  params: { id: item.id, productTitle: item.title, accentColor: ORANGE },
                });
              }}
            />
          )}
          ListEmptyComponent={
            <View style={s.emptyState}>
              <Ionicons name="videocam-outline" size={52} color={dMUTED} />
              <Text style={[s.emptyTitle, { color: dMUTED }]}>Aucune vidéo</Text>
              <Text style={[s.emptyDesc, { color: dMUTED }]}>Ajoutez des vidéos à vos publications.</Text>
            </View>
          }
        />
      ) : (
        /* Contenu — onglets Articles / En gros */
        <FlatList
          key={activeTab}
          data={data}
          keyExtractor={(i) => i.id}
          contentContainerStyle={[s.list, { paddingBottom: paddingBottom + 24 }]}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <SellerProductCard
              item={item}
              isDark={isDark}
              isEngros={isEngros}
              accentColor={ORANGE}
              onEdit={() => {}}
              onVideo={() => {}}
            />
          )}
          ListEmptyComponent={
            <View style={s.emptyState}>
              <Ionicons name="bag-handle-outline" size={52} color={dMUTED} />
              <Text style={[s.emptyTitle, { color: dMUTED }]}>Aucune publication</Text>
              <Text style={[s.emptyDesc, { color: dMUTED }]}>Vos publications apparaîtront ici.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },

  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  backBtn: { padding: 4, width: 36 },
  headerTitle: { flex: 1, textAlign: "center", fontFamily: "Poppins_700Bold", fontSize: 17, color: "#fff" },
  addBtn: { width: 36, alignItems: "flex-end" },

  tabBar: { flexDirection: "row", paddingHorizontal: 14, paddingVertical: 10, gap: 8, borderBottomWidth: 1 },
  tabItem: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, paddingVertical: 10, borderRadius: 12 },
  tabItemActive: { backgroundColor: "#FF6B0012", borderWidth: 1.5, borderColor: "#FF6B0050" },
  tabLabel: { fontFamily: "Poppins_600SemiBold", fontSize: 12 },
  tabCount: { borderRadius: 10, paddingHorizontal: 6, paddingVertical: 1, minWidth: 20, alignItems: "center" },
  tabCountActive: { backgroundColor: "#FF6B0025" },
  tabCountText: { fontFamily: "Poppins_700Bold", fontSize: 10 },

  list: { paddingHorizontal: 14, paddingTop: 14 },

  emptyState: { alignItems: "center", justifyContent: "center", paddingTop: 80, gap: 12 },
  emptyTitle: { fontFamily: "Poppins_600SemiBold", fontSize: 16 },
  emptyDesc:  { fontFamily: "Poppins_400Regular", fontSize: 13, textAlign: "center" },
});
