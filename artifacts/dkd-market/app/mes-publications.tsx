import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  FlatList,
  Platform,
  TextInput,
  Animated,
  Modal,
  Pressable,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useTheme } from "../contexts/ThemeContext";
import { SellerProductCard, SellerProduct } from "@/components/SellerProductCard";
import { VideoPublication, DEMO_VIDEOS } from "@/data/videos";

const ORANGE = "#FF6B00";
const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");
const CELL_SIZE = (SCREEN_W - 4) / 3;

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

/* ─── Miniature grille vidéo (style TikTok) ────────────────────── */

function VideoThumb({
  item,
  isDark,
  onPress,
  onLongPress,
}: {
  item: VideoPublication;
  isDark: boolean;
  onPress: () => void;
  onLongPress: () => void;
}) {
  return (
    <TouchableWithoutFeedback onPress={onPress} onLongPress={onLongPress} delayLongPress={400}>
      <View style={[th.cell, { backgroundColor: item.color }]}>
        <Ionicons name={item.icon as any} size={32} color="rgba(255,255,255,0.35)" style={th.icon} />
        <View style={th.playIcon}>
          <Ionicons name="play" size={18} color="rgba(255,255,255,0.85)" />
        </View>
        <View style={th.viewsRow}>
          <Ionicons name="play-outline" size={11} color="#fff" />
          <Text style={th.viewsText}>{item.views >= 1000 ? (item.views / 1000).toFixed(1) + "k" : item.views}</Text>
        </View>
        {item.status === "draft" && (
          <View style={th.draftBadge}>
            <Text style={th.draftText}>Brouillon</Text>
          </View>
        )}
      </View>
    </TouchableWithoutFeedback>
  );
}

const th = StyleSheet.create({
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE * 1.35,
    alignItems: "center",
    justifyContent: "center",
    margin: 0.5,
  },
  icon: { position: "absolute" },
  playIcon: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -12 }, { translateY: -12 }],
  },
  viewsRow: {
    position: "absolute",
    bottom: 6,
    left: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  viewsText: { fontFamily: "Poppins_700Bold", fontSize: 11, color: "#fff" },
  draftBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  draftText: { fontFamily: "Poppins_600SemiBold", fontSize: 9, color: "#F59E0B" },
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
  const dCARD   = isDark ? "#161B25" : "#FFFFFF";
  const dTEXT   = isDark ? "#F0F0F0" : "#111827";
  const dSUB    = isDark ? "#8B9AB0" : "#6B7280";

  const [activeTab,    setActiveTab]    = useState<Tab>("articles");
  const [articles]                      = useState(DEMO_ARTICLES);
  const [engros]                        = useState(DEMO_ENGROS);
  const [videos,       setVideos]       = useState(DEMO_VIDEOS);
  const [searchOpen,   setSearchOpen]   = useState(false);
  const [searchQuery,  setSearchQuery]  = useState("");
  const searchAnim = useRef(new Animated.Value(0)).current;

  /* ── Modales ── */
  const [playerVideo,  setPlayerVideo]  = useState<VideoPublication | null>(null);
  const [statsVideo,   setStatsVideo]   = useState<VideoPublication | null>(null);
  const [confirmVideo, setConfirmVideo] = useState<VideoPublication | null>(null);
  const [confirmFrom,  setConfirmFrom]  = useState<"player" | "stats">("player");

  const toggleSearch = () => {
    Haptics.selectionAsync();
    const opening = !searchOpen;
    setSearchOpen(opening);
    if (!opening) setSearchQuery("");
    Animated.timing(searchAnim, {
      toValue: opening ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const q = searchQuery.toLowerCase().trim();
  const filteredArticles = q ? articles.filter((a) => a.title.toLowerCase().includes(q)) : articles;
  const filteredEngros   = q ? engros.filter((a)   => a.title.toLowerCase().includes(q)) : engros;
  const filteredVideos   = q ? videos.filter((v)   => v.title.toLowerCase().includes(q)) : videos;

  const TABS = [
    { key: "articles" as Tab, label: "Articles", count: articles.length, icon: "bag-handle-outline" },
    { key: "engros"   as Tab, label: "En gros",  count: engros.length,   icon: "layers-outline"    },
    { key: "video"    as Tab, label: "Vidéo",    count: videos.length,   icon: "videocam-outline"  },
  ];

  const isEngros = activeTab === "engros";

  const handleDeleteConfirmed = () => {
    if (!confirmVideo) return;
    setVideos((prev) => prev.filter((v) => v.id !== confirmVideo.id));
    setConfirmVideo(null);
    setPlayerVideo(null);
    setStatsVideo(null);
  };

  return (
    <View style={[s.container, { paddingTop, backgroundColor: dBG }]}>

      {/* Header */}
      <View style={[s.header, { backgroundColor: dHEAD, borderBottomColor: "rgba(255,255,255,0.08)" }]}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Mes publications</Text>
        <TouchableOpacity style={s.headerIcon} onPress={toggleSearch}>
          <Ionicons name={searchOpen ? "close" : "search"} size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Barre de recherche */}
      <Animated.View style={[
        s.searchBar,
        {
          backgroundColor: dHEAD,
          maxHeight: searchAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 54] }),
          opacity: searchAnim,
          overflow: "hidden",
          borderBottomColor: "rgba(255,255,255,0.08)",
          borderBottomWidth: searchOpen ? 1 : 0,
        },
      ]}>
        <View style={[s.searchInner, { backgroundColor: isDark ? "#1E2535" : "#2a3244" }]}>
          <Ionicons name="search-outline" size={16} color={dMUTED} />
          <TextInput
            style={[s.searchInput, { color: "#fff" }]}
            placeholder="Rechercher une publication…"
            placeholderTextColor={dMUTED}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus={searchOpen}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={16} color={dMUTED} />
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>

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

      {/* Contenu — onglet Vidéo (grille 3 colonnes) */}
      {activeTab === "video" ? (
        <FlatList
          key="video"
          data={filteredVideos}
          keyExtractor={(i) => i.id}
          numColumns={3}
          columnWrapperStyle={{ gap: 0 }}
          contentContainerStyle={{ paddingBottom: paddingBottom + 24 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <VideoThumb
              item={item}
              isDark={isDark}
              onPress={() => { Haptics.selectionAsync(); setPlayerVideo(item); }}
              onLongPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setStatsVideo(item); }}
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
          data={activeTab === "engros" ? filteredEngros : filteredArticles}
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

      {/* ── Modal player plein écran ── */}
      <Modal visible={!!playerVideo} animationType="fade" statusBarTranslucent>
        {playerVideo && (
          <View style={pm.container}>
            {/* Bouton Supprimer en haut */}
            <View style={[pm.topBar, { paddingTop: insets.top + 10 }]}>
              <TouchableOpacity style={pm.closeBtn} onPress={() => setPlayerVideo(null)} activeOpacity={0.8}>
                <Ionicons name="close" size={22} color="#fff" />
              </TouchableOpacity>
              <Text style={pm.title} numberOfLines={1}>{playerVideo.title}</Text>
              <TouchableOpacity
                style={pm.deleteBtn}
                onPress={() => { setConfirmFrom("player"); setConfirmVideo(playerVideo); }}
                activeOpacity={0.8}
              >
                <Ionicons name="trash-outline" size={16} color="#fff" />
                <Text style={pm.deleteBtnText}>Supprimer</Text>
              </TouchableOpacity>
            </View>

            {/* Zone vidéo (placeholder coloré) */}
            <View style={[pm.videoArea, { backgroundColor: playerVideo.color }]}>
              <Ionicons name={playerVideo.icon as any} size={64} color="rgba(255,255,255,0.25)" />
              <View style={pm.bigPlay}>
                <Ionicons name="play-circle" size={72} color="rgba(255,255,255,0.85)" />
              </View>
              <View style={pm.durationPill}>
                <Text style={pm.durationText}>{playerVideo.duration}</Text>
              </View>
            </View>

            {/* Infos bas */}
            <View style={pm.infoBar}>
              <Text style={pm.infoTitle} numberOfLines={2}>{playerVideo.title}</Text>
              <View style={pm.infoStats}>
                <Ionicons name="eye-outline" size={14} color="#aaa" />
                <Text style={pm.infoStatText}>{playerVideo.views.toLocaleString()} vues</Text>
                <Ionicons name="heart-outline" size={14} color="#aaa" />
                <Text style={pm.infoStatText}>{playerVideo.likes}</Text>
                <Ionicons name="chatbubble-outline" size={14} color="#aaa" />
                <Text style={pm.infoStatText}>{playerVideo.comments}</Text>
              </View>
            </View>
          </View>
        )}
      </Modal>

      {/* ── Modal stats (appui long) ── */}
      <Modal visible={!!statsVideo} animationType="fade" transparent statusBarTranslucent>
        {statsVideo && (
          <Pressable style={sm.overlay} onPress={() => setStatsVideo(null)}>
            <Pressable style={[sm.card, { backgroundColor: dCARD }]} onPress={() => {}}>
              {/* Miniature */}
              <View style={[sm.thumb, { backgroundColor: statsVideo.color }]}>
                <Ionicons name={statsVideo.icon as any} size={28} color="rgba(255,255,255,0.4)" />
              </View>

              <Text style={[sm.videoTitle, { color: dTEXT }]} numberOfLines={2}>{statsVideo.title}</Text>

              {/* Statistiques */}
              <View style={[sm.statsRow, { borderColor: isDark ? "#2A2A2A" : "#E5E7EB" }]}>
                <View style={sm.statItem}>
                  <Ionicons name="eye" size={20} color="#60A5FA" />
                  <Text style={[sm.statVal, { color: dTEXT }]}>{statsVideo.views.toLocaleString()}</Text>
                  <Text style={[sm.statLbl, { color: dSUB }]}>Vues</Text>
                </View>
                <View style={[sm.statDiv, { backgroundColor: isDark ? "#2A2A2A" : "#E5E7EB" }]} />
                <View style={sm.statItem}>
                  <Ionicons name="heart" size={20} color="#EF4444" />
                  <Text style={[sm.statVal, { color: dTEXT }]}>{statsVideo.likes}</Text>
                  <Text style={[sm.statLbl, { color: dSUB }]}>Cœurs</Text>
                </View>
                <View style={[sm.statDiv, { backgroundColor: isDark ? "#2A2A2A" : "#E5E7EB" }]} />
                <View style={sm.statItem}>
                  <Ionicons name="chatbubble" size={20} color="#A78BFA" />
                  <Text style={[sm.statVal, { color: dTEXT }]}>{statsVideo.comments}</Text>
                  <Text style={[sm.statLbl, { color: dSUB }]}>Commentaires</Text>
                </View>
              </View>

              {/* Bouton supprimer */}
              <TouchableOpacity
                style={sm.deleteBtn}
                onPress={() => { setStatsVideo(null); setConfirmFrom("stats"); setConfirmVideo(statsVideo); }}
                activeOpacity={0.8}
              >
                <Ionicons name="trash-outline" size={16} color="#fff" />
                <Text style={sm.deleteBtnText}>Supprimer cette vidéo</Text>
              </TouchableOpacity>
            </Pressable>
          </Pressable>
        )}
      </Modal>

      {/* ── Modal confirmation suppression ── */}
      <Modal visible={!!confirmVideo} animationType="fade" transparent statusBarTranslucent>
        {confirmVideo && (
          <Pressable style={sm.overlay} onPress={() => setConfirmVideo(null)}>
            <Pressable style={[sm.confirmCard, { backgroundColor: dCARD }]} onPress={() => {}}>
              <View style={sm.confirmIconWrap}>
                <Ionicons name="trash" size={32} color="#EF4444" />
              </View>
              <Text style={[sm.confirmTitle, { color: dTEXT }]}>Supprimer la vidéo ?</Text>
              <Text style={[sm.confirmDesc, { color: dSUB }]} numberOfLines={2}>
                « {confirmVideo.title} » sera définitivement supprimée.
              </Text>
              <View style={sm.confirmBtns}>
                <TouchableOpacity
                  style={[sm.confirmBtn, { backgroundColor: isDark ? "#1E2535" : "#F1F5F9", borderColor: isDark ? "#2A2A2A" : "#E2E8F0", borderWidth: 1 }]}
                  onPress={() => setConfirmVideo(null)}
                  activeOpacity={0.8}
                >
                  <Text style={[sm.confirmBtnText, { color: dSUB }]}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[sm.confirmBtn, { backgroundColor: "#EF4444" }]}
                  onPress={handleDeleteConfirmed}
                  activeOpacity={0.8}
                >
                  <Text style={[sm.confirmBtnText, { color: "#fff" }]}>Supprimer</Text>
                </TouchableOpacity>
              </View>
            </Pressable>
          </Pressable>
        )}
      </Modal>

    </View>
  );
}

/* ── Styles player plein écran ─────────────────────────────────── */
const pm = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingBottom: 10,
    gap: 10,
    backgroundColor: "rgba(0,0,0,0.7)",
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  closeBtn: { padding: 4 },
  title: { flex: 1, fontFamily: "Poppins_600SemiBold", fontSize: 13, color: "#fff" },
  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#EF4444",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  deleteBtnText: { fontFamily: "Poppins_700Bold", fontSize: 12, color: "#fff" },
  videoArea: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  bigPlay: { position: "absolute" },
  durationPill: {
    position: "absolute",
    bottom: 20,
    right: 20,
    backgroundColor: "rgba(0,0,0,0.65)",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  durationText: { fontFamily: "Poppins_700Bold", fontSize: 13, color: "#fff" },
  infoBar: {
    backgroundColor: "rgba(0,0,0,0.85)",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
    gap: 8,
  },
  infoTitle: { fontFamily: "Poppins_700Bold", fontSize: 15, color: "#fff" },
  infoStats: { flexDirection: "row", alignItems: "center", gap: 8 },
  infoStatText: { fontFamily: "Poppins_400Regular", fontSize: 13, color: "#aaa" },
});

/* ── Styles modal stats + confirmation ─────────────────────────── */
const sm = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    width: SCREEN_W * 0.82,
    borderRadius: 20,
    overflow: "hidden",
    alignItems: "center",
    paddingBottom: 20,
  },
  thumb: {
    width: "100%",
    height: 110,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  videoTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 13,
    textAlign: "center",
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  statsRow: {
    flexDirection: "row",
    width: "100%",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    paddingVertical: 14,
    marginBottom: 16,
  },
  statItem: { flex: 1, alignItems: "center", gap: 4 },
  statVal:  { fontFamily: "Poppins_700Bold", fontSize: 16 },
  statLbl:  { fontFamily: "Poppins_400Regular", fontSize: 10 },
  statDiv:  { width: 1, marginVertical: 4 },
  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: "#EF4444",
    paddingHorizontal: 24,
    paddingVertical: 11,
    borderRadius: 12,
    marginHorizontal: 16,
  },
  deleteBtnText: { fontFamily: "Poppins_700Bold", fontSize: 13, color: "#fff" },

  confirmCard: {
    width: SCREEN_W * 0.82,
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    gap: 10,
  },
  confirmIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#EF444420",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  confirmTitle: { fontFamily: "Poppins_700Bold", fontSize: 16 },
  confirmDesc:  { fontFamily: "Poppins_400Regular", fontSize: 13, textAlign: "center" },
  confirmBtns:  { flexDirection: "row", gap: 12, marginTop: 8, width: "100%" },
  confirmBtn:   { flex: 1, alignItems: "center", paddingVertical: 12, borderRadius: 12 },
  confirmBtnText: { fontFamily: "Poppins_700Bold", fontSize: 14 },
});

/* ── Styles écran principal ─────────────────────────────────────── */
const s = StyleSheet.create({
  container: { flex: 1 },

  header:      { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  backBtn:     { padding: 4, width: 36 },
  headerTitle: { flex: 1, textAlign: "center", fontFamily: "Poppins_700Bold", fontSize: 17, color: "#fff" },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 4 },
  headerIcon:  { padding: 6 },

  searchBar:   { paddingHorizontal: 14, paddingVertical: 8 },
  searchInner: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  searchInput: { flex: 1, fontFamily: "Poppins_400Regular", fontSize: 13, padding: 0 },

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
