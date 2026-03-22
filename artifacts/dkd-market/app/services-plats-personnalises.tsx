import React, { useState, useRef, useEffect } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, Pressable,
  Animated, Dimensions, ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/contexts/ThemeContext";
import * as Haptics from "expo-haptics";

const ACCENT     = "#A855F7";
const DRAWER_W   = 260;
const { width: SCREEN_W } = Dimensions.get("window");

type Section = "chef-ia";

const MENU_ITEMS: { id: Section; label: string; emoji: string; desc: string }[] = [
  { id: "chef-ia", label: "Chef IA DKD", emoji: "🤖", desc: "Intelligence culinaire artificielle" },
];

export default function ServicesPlatsPersonnalisesPage() {
  const router   = useRouter();
  const insets   = useSafeAreaInsets();
  const { isDark } = useTheme();

  const [drawerOpen,     setDrawerOpen]     = useState(false);
  const [activeSection,  setActiveSection]  = useState<Section>("chef-ia");
  const drawerAnim = useRef(new Animated.Value(-DRAWER_W)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;

  const dynBG     = isDark ? "#0D1117" : "#F0F4FA";
  const dynCARD   = isDark ? "#161B25" : "#FFFFFF";
  const dynText   = isDark ? "#F0F6FF" : "#1A1A1A";
  const dynSub    = isDark ? "#64748B" : "#6B7280";
  const dynBorder = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.08)";
  const dynHeader = isDark ? "#111827" : "#FFFFFF";
  const dynDrawer = isDark ? "#0F172A" : "#FFFFFF";

  const openDrawer = () => {
    Haptics.selectionAsync();
    setDrawerOpen(true);
    Animated.parallel([
      Animated.spring(drawerAnim, { toValue: 0, useNativeDriver: true, damping: 20, stiffness: 200 }),
      Animated.timing(overlayAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
    ]).start();
  };

  const closeDrawer = () => {
    Animated.parallel([
      Animated.spring(drawerAnim, { toValue: -DRAWER_W, useNativeDriver: true, damping: 20, stiffness: 200 }),
      Animated.timing(overlayAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => setDrawerOpen(false));
  };

  const selectSection = (id: Section) => {
    Haptics.selectionAsync();
    setActiveSection(id);
    closeDrawer();
  };

  return (
    <View style={[s.root, { backgroundColor: dynBG, paddingTop: insets.top }]}>

      {/* ── HEADER ── */}
      <View style={[s.header, { backgroundColor: dynHeader, borderBottomColor: dynBorder }]}>

        {/* Hamburger — coin gauche */}
        <TouchableOpacity
          style={[s.iconBtn, { backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)" }]}
          onPress={openDrawer}
          activeOpacity={0.7}
        >
          <View style={s.hamburger}>
            <View style={[s.hLine, { backgroundColor: dynText }]} />
            <View style={[s.hLine, { backgroundColor: dynText, width: 14 }]} />
            <View style={[s.hLine, { backgroundColor: dynText }]} />
          </View>
        </TouchableOpacity>

        {/* Titre */}
        <View style={s.headerCenter}>
          <View style={[s.headerIconBg, { backgroundColor: ACCENT + "22" }]}>
            <Ionicons name="color-wand-outline" size={15} color={ACCENT} />
          </View>
          <Text style={[s.headerTitle, { color: dynText }]} numberOfLines={1}>Services Plats Personnalisés</Text>
        </View>

        {/* Retour — coin droit */}
        <TouchableOpacity
          style={[s.iconBtn, { backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)" }]}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="close-outline" size={20} color={dynText} />
        </TouchableOpacity>
      </View>

      {/* ── CONTENU PRINCIPAL ── */}
      <View style={{ flex: 1 }}>
        {activeSection === "chef-ia" && <ChefIAView isDark={isDark} dynBG={dynBG} dynCARD={dynCARD} dynText={dynText} dynSub={dynSub} dynBorder={dynBorder} />}
      </View>

      {/* ── DRAWER OVERLAY ── */}
      {drawerOpen && (
        <Animated.View
          style={[s.overlay, { opacity: overlayAnim }]}
          pointerEvents="auto"
        >
          <Pressable style={{ flex: 1 }} onPress={closeDrawer} />
        </Animated.View>
      )}

      {/* ── DRAWER ── */}
      <Animated.View
        style={[s.drawer, {
          backgroundColor: dynDrawer,
          borderRightColor: dynBorder,
          transform: [{ translateX: drawerAnim }],
          paddingTop: insets.top,
        }]}
        pointerEvents={drawerOpen ? "auto" : "none"}
      >
        {/* En-tête du drawer */}
        <View style={[s.drawerHeader, { borderBottomColor: dynBorder }]}>
          <View style={[s.drawerLogoCircle, { backgroundColor: ACCENT + "22" }]}>
            <Ionicons name="color-wand-outline" size={18} color={ACCENT} />
          </View>
          <View>
            <Text style={[s.drawerTitle, { color: dynText }]}>Services</Text>
            <Text style={[s.drawerSub, { color: dynSub }]}>Plats personnalisés</Text>
          </View>
          <TouchableOpacity style={{ marginLeft: "auto" }} onPress={closeDrawer} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={20} color={dynSub} />
          </TouchableOpacity>
        </View>

        {/* Séparateur label */}
        <Text style={[s.drawerSectionLabel, { color: dynSub }]}>OUTILS</Text>

        {/* Liste des menus */}
        {MENU_ITEMS.map((item) => {
          const isActive = activeSection === item.id;
          return (
            <TouchableOpacity
              key={item.id}
              style={[
                s.drawerItem,
                isActive && { backgroundColor: ACCENT + "18", borderLeftColor: ACCENT },
                !isActive && { borderLeftColor: "transparent" },
                { borderBottomColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.05)" },
              ]}
              onPress={() => selectSection(item.id)}
              activeOpacity={0.75}
            >
              {/* Icône robot + toque chef */}
              <View style={[s.drawerItemIcon, { backgroundColor: isActive ? ACCENT + "22" : (isDark ? "#1E293B" : "#F1F5F9") }]}>
                <Text style={s.drawerItemEmoji}>{item.emoji}</Text>
                <View style={[s.chefHat, { backgroundColor: isActive ? ACCENT : (isDark ? "#334155" : "#CBD5E1") }]}>
                  <Text style={s.chefHatText}>👨‍🍳</Text>
                </View>
              </View>

              <View style={{ flex: 1 }}>
                <Text style={[s.drawerItemLabel, { color: isActive ? ACCENT : dynText }]}>{item.label}</Text>
                <Text style={[s.drawerItemDesc, { color: dynSub }]}>{item.desc}</Text>
              </View>

              {isActive && <Ionicons name="chevron-forward" size={14} color={ACCENT} />}
            </TouchableOpacity>
          );
        })}
      </Animated.View>

    </View>
  );
}

/* ── Contenu Chef IA DKD (vide pour l'instant) ── */
function ChefIAView({ isDark, dynBG, dynCARD, dynText, dynSub, dynBorder }: {
  isDark: boolean; dynBG: string; dynCARD: string;
  dynText: string; dynSub: string; dynBorder: string;
}) {
  return (
    <View style={[cv.container, { backgroundColor: dynBG }]}>
      {/* Zone vide — contenu à venir */}
      <View style={cv.emptyState}>
        <View style={[cv.emptyIconWrap, { backgroundColor: isDark ? "#1E293B" : "#F1F5F9" }]}>
          <Text style={cv.emptyEmoji}>🤖</Text>
          <View style={[cv.emptyHat, { backgroundColor: isDark ? "#334155" : "#E2E8F0" }]}>
            <Text style={cv.emptyHatText}>👨‍🍳</Text>
          </View>
        </View>
        <Text style={[cv.emptyTitle, { color: dynText }]}>Chef IA DKD</Text>
        <Text style={[cv.emptySub, { color: dynSub }]}>
          Votre assistant culinaire intelligent arrive bientôt.
        </Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root:   { flex: 1 },

  header: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 12, paddingVertical: 12,
    borderBottomWidth: 1, gap: 10,
  },
  iconBtn: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  hamburger: { gap: 4, alignItems: "flex-start" },
  hLine:    { height: 2, width: 18, borderRadius: 2 },
  headerCenter: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8 },
  headerIconBg: { width: 28, height: 28, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  headerTitle:  { fontFamily: "Poppins_700Bold", fontSize: 14, flex: 1 },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
    zIndex: 10,
  },

  drawer: {
    position: "absolute", top: 0, left: 0, bottom: 0,
    width: DRAWER_W,
    borderRightWidth: 1,
    zIndex: 20,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 16,
    shadowOffset: { width: 4, height: 0 },
    elevation: 16,
  },
  drawerHeader: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingHorizontal: 16, paddingVertical: 16,
    borderBottomWidth: 1,
  },
  drawerLogoCircle: { width: 38, height: 38, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  drawerTitle: { fontFamily: "Poppins_700Bold", fontSize: 14 },
  drawerSub:   { fontFamily: "Poppins_400Regular", fontSize: 11 },

  drawerSectionLabel: {
    fontFamily: "Poppins_600SemiBold", fontSize: 10,
    letterSpacing: 1.2, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 6,
  },

  drawerItem: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: 14, paddingVertical: 13,
    borderLeftWidth: 3,
    borderBottomWidth: 1,
  },
  drawerItemIcon: {
    width: 44, height: 44, borderRadius: 12,
    alignItems: "center", justifyContent: "center",
    position: "relative",
  },
  drawerItemEmoji:  { fontSize: 20 },
  chefHat:          { position: "absolute", bottom: -4, right: -4, width: 20, height: 20, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  chefHatText:      { fontSize: 10 },
  drawerItemLabel:  { fontFamily: "Poppins_700Bold", fontSize: 13 },
  drawerItemDesc:   { fontFamily: "Poppins_400Regular", fontSize: 11 },
});

const cv = StyleSheet.create({
  container:      { flex: 1, alignItems: "center", justifyContent: "center" },
  emptyState:     { alignItems: "center", gap: 14, paddingHorizontal: 40 },
  emptyIconWrap:  { width: 90, height: 90, borderRadius: 24, alignItems: "center", justifyContent: "center", position: "relative" },
  emptyEmoji:     { fontSize: 38 },
  emptyHat:       { position: "absolute", bottom: -6, right: -6, width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  emptyHatText:   { fontSize: 16 },
  emptyTitle:     { fontFamily: "Poppins_700Bold", fontSize: 18 },
  emptySub:       { fontFamily: "Poppins_400Regular", fontSize: 13, textAlign: "center", lineHeight: 20, opacity: 0.75 },
});
