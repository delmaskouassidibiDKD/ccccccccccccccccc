import React, { useState, useRef } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, Pressable, Animated, Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/contexts/ThemeContext";
import * as Haptics from "expo-haptics";

const ACCENT   = "#A855F7";
const DRAWER_W = 260;

type Section = "chef-ia";

/* ═══════════════════════════════════════════════
   COMPOSANT ROBOT CHEF IA — dessiné avec des Views
   ═══════════════════════════════════════════════ */
function CuteChefRobot({ size = 100 }: { size?: number }) {
  const k = size / 100;

  return (
    <View style={{ width: 110 * k, alignItems: "center" }}>

      {/* ── TOQUE DE CHEF ── */}
      <View style={{ alignItems: "center", zIndex: 2 }}>
        {/* Puff supérieur */}
        <View style={{
          width: 46 * k, height: 38 * k,
          borderRadius: 23 * k,
          backgroundColor: "#FFFFFF",
          shadowColor: "#000", shadowOpacity: 0.12, shadowRadius: 6, elevation: 3,
          marginBottom: -10 * k,
        }} />
        {/* Strie horizontales de la toque */}
        <View style={{ position: "absolute", top: 8 * k, left: "50%", marginLeft: -16 * k }}>
          <View style={{ width: 32 * k, height: 1.5 * k, backgroundColor: "rgba(200,200,200,0.5)", marginBottom: 5 * k }} />
          <View style={{ width: 32 * k, height: 1.5 * k, backgroundColor: "rgba(200,200,200,0.5)", marginBottom: 5 * k }} />
          <View style={{ width: 32 * k, height: 1.5 * k, backgroundColor: "rgba(200,200,200,0.5)" }} />
        </View>
        {/* Bande de la toque */}
        <View style={{
          width: 58 * k, height: 16 * k,
          backgroundColor: "#F5F5F5",
          borderRadius: 5 * k,
          borderWidth: 1, borderColor: "#E0E0E0",
          shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 3, elevation: 2,
        }} />
      </View>

      {/* ── TÊTE ── */}
      <View style={{
        width: 62 * k, height: 56 * k,
        borderRadius: 18 * k,
        backgroundColor: "#60C5E4",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        zIndex: 1,
        shadowColor: "#3AA0C0",
        shadowOpacity: 0.35, shadowRadius: 10, elevation: 5,
        marginTop: -2 * k,
      }}>
        {/* Reflet de la tête */}
        <View style={{
          position: "absolute", top: 8 * k, left: 10 * k,
          width: 20 * k, height: 10 * k,
          borderRadius: 10 * k,
          backgroundColor: "rgba(255,255,255,0.18)",
        }} />

        {/* Oreille gauche */}
        <View style={{
          position: "absolute", left: -8 * k, top: 16 * k,
          width: 12 * k, height: 18 * k,
          borderRadius: 6 * k,
          backgroundColor: "#4EB5D8",
          shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 3, elevation: 2,
        }}>
          <View style={{
            width: 5 * k, height: 8 * k, borderRadius: 3 * k,
            backgroundColor: "#7CD0E8", alignSelf: "center", marginTop: 5 * k,
          }} />
        </View>

        {/* Oreille droite */}
        <View style={{
          position: "absolute", right: -8 * k, top: 16 * k,
          width: 12 * k, height: 18 * k,
          borderRadius: 6 * k,
          backgroundColor: "#4EB5D8",
          shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 3, elevation: 2,
        }}>
          <View style={{
            width: 5 * k, height: 8 * k, borderRadius: 3 * k,
            backgroundColor: "#7CD0E8", alignSelf: "center", marginTop: 5 * k,
          }} />
        </View>

        {/* Yeux */}
        <View style={{ flexDirection: "row", gap: 11 * k, marginTop: 6 * k }}>
          {[0, 1].map((i) => (
            <View key={i} style={{
              width: 18 * k, height: 18 * k, borderRadius: 9 * k,
              backgroundColor: "#FFFFFF",
              alignItems: "center", justifyContent: "center",
              shadowColor: "#000", shadowOpacity: 0.18, shadowRadius: 4, elevation: 3,
            }}>
              {/* Iris */}
              <View style={{
                width: 11 * k, height: 11 * k, borderRadius: 6 * k,
                backgroundColor: ACCENT,
                alignItems: "center", justifyContent: "center",
              }}>
                {/* Pupille */}
                <View style={{
                  width: 5 * k, height: 5 * k, borderRadius: 3 * k,
                  backgroundColor: "#1A0030",
                }} />
                {/* Reflet brillant */}
                <View style={{
                  position: "absolute", top: 1.5 * k, left: 1.5 * k,
                  width: 3 * k, height: 3 * k, borderRadius: 2 * k,
                  backgroundColor: "rgba(255,255,255,0.85)",
                }} />
              </View>
            </View>
          ))}
        </View>

        {/* Joues roses */}
        <View style={{
          position: "absolute",
          left: 7 * k, bottom: 11 * k,
          width: 12 * k, height: 7 * k,
          borderRadius: 6 * k,
          backgroundColor: "rgba(255,160,170,0.45)",
        }} />
        <View style={{
          position: "absolute",
          right: 7 * k, bottom: 11 * k,
          width: 12 * k, height: 7 * k,
          borderRadius: 6 * k,
          backgroundColor: "rgba(255,160,170,0.45)",
        }} />

        {/* Sourire en arc */}
        <View style={{
          width: 24 * k, height: 11 * k,
          borderBottomLeftRadius: 12 * k,
          borderBottomRightRadius: 12 * k,
          borderWidth: 2.5 * k,
          borderTopWidth: 0,
          borderColor: "#1A6080",
          marginTop: 5 * k,
        }} />
      </View>

      {/* ── CORPS ── */}
      <View style={{
        width: 54 * k, height: 30 * k,
        backgroundColor: "#4EB5D8",
        borderRadius: 9 * k,
        marginTop: 3 * k,
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        shadowColor: "#2A90B0", shadowOpacity: 0.25, shadowRadius: 6, elevation: 3,
      }}>
        {/* Bras gauche */}
        <View style={{
          position: "absolute", left: -10 * k, top: 4 * k,
          width: 11 * k, height: 20 * k,
          borderRadius: 6 * k,
          backgroundColor: "#3EA8C8",
        }}>
          {/* Main gauche */}
          <View style={{
            width: 11 * k, height: 9 * k, borderRadius: 5 * k,
            backgroundColor: "#60C5E4", position: "absolute", bottom: -3 * k,
          }} />
        </View>

        {/* Bras droit */}
        <View style={{
          position: "absolute", right: -10 * k, top: 4 * k,
          width: 11 * k, height: 20 * k,
          borderRadius: 6 * k,
          backgroundColor: "#3EA8C8",
        }}>
          {/* Main droite */}
          <View style={{
            width: 11 * k, height: 9 * k, borderRadius: 5 * k,
            backgroundColor: "#60C5E4", position: "absolute", bottom: -3 * k,
          }} />
        </View>

        {/* Tablier blanc sur la poitrine */}
        <View style={{
          width: 28 * k, height: 22 * k,
          backgroundColor: "rgba(255,255,255,0.28)",
          borderRadius: 6 * k,
          alignItems: "center",
          justifyContent: "space-evenly",
          paddingVertical: 3 * k,
        }}>
          {/* Petits boutons */}
          <View style={{ width: 4 * k, height: 4 * k, borderRadius: 2 * k, backgroundColor: "rgba(255,255,255,0.65)" }} />
          <View style={{ width: 4 * k, height: 4 * k, borderRadius: 2 * k, backgroundColor: "rgba(255,255,255,0.65)" }} />
        </View>
      </View>

    </View>
  );
}

/* ═══════════════════════════════════════════════
   VERSION MINIATURE pour le drawer (44px)
   ═══════════════════════════════════════════════ */
function MiniChefRobot({ active }: { active: boolean }) {
  const headColor = active ? "#60C5E4" : "#90BAC8";
  const irisColor = active ? ACCENT : "#6B9FAD";

  return (
    <View style={{ width: 44, height: 44, overflow: "hidden", position: "relative", backgroundColor: headColor }}>

      {/* ── TOQUE DE CHEF ── forme emblématique : puff + bande */}
      {/* Puff arrondi (dome) — plus étroit que la bande */}
      <View style={{
        position: "absolute", top: 0,
        left: 11, width: 22, height: 13,
        borderTopLeftRadius: 11, borderTopRightRadius: 11,
        borderBottomLeftRadius: 2, borderBottomRightRadius: 2,
        backgroundColor: "#FFFFFF",
      }} />
      {/* Bande (band) — plus large que le puff, caractéristique de la toque */}
      <View style={{
        position: "absolute", top: 11,
        left: 4, right: 4, height: 10,
        backgroundColor: "#F0F0EE",
        borderTopLeftRadius: 1, borderTopRightRadius: 1,
        borderBottomLeftRadius: 3, borderBottomRightRadius: 3,
        borderWidth: 1, borderColor: "#DDDBD6",
      }}>
        {/* Fine ligne de couture au milieu de la bande */}
        <View style={{ position: "absolute", top: 4, left: 4, right: 4, height: 1, backgroundColor: "rgba(180,175,165,0.45)" }} />
      </View>
      {/* Ligne séparatrice entre toque et visage */}
      <View style={{ position: "absolute", top: 21, left: 0, right: 0, height: 1, backgroundColor: "rgba(0,0,0,0.08)" }} />

      {/* ── VISAGE ── */}
      <View style={{ position: "absolute", top: 22, left: 0, right: 0, bottom: 0, alignItems: "center" }}>

        {/* Yeux */}
        <View style={{ flexDirection: "row", gap: 8, marginTop: 3 }}>
          {[0, 1].map((i) => (
            <View key={i} style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center" }}>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: irisColor, alignItems: "center", justifyContent: "center" }}>
                <View style={{ position: "absolute", top: 1, left: 1, width: 2, height: 2, borderRadius: 1, backgroundColor: "rgba(255,255,255,0.9)" }} />
              </View>
            </View>
          ))}
        </View>

        {/* Joues */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", width: 32, marginTop: 1 }}>
          <View style={{ width: 7, height: 4, borderRadius: 4, backgroundColor: "rgba(255,145,155,0.42)" }} />
          <View style={{ width: 7, height: 4, borderRadius: 4, backgroundColor: "rgba(255,145,155,0.42)" }} />
        </View>

        {/* Sourire */}
        <View style={{ width: 14, height: 6, borderBottomLeftRadius: 7, borderBottomRightRadius: 7, borderWidth: 2, borderTopWidth: 0, borderColor: "#1A6080", marginTop: 1 }} />
      </View>

    </View>
  );
}

/* ═══════════════════════════════════════════════
   PAGE PRINCIPALE
   ═══════════════════════════════════════════════ */
export default function ServicesPlatsPersonnalisesPage() {
  const router  = useRouter();
  const insets  = useSafeAreaInsets();
  const { isDark } = useTheme();

  const [drawerOpen,    setDrawerOpen]    = useState(false);
  const [activeSection, setActiveSection] = useState<Section>("chef-ia");
  const drawerAnim  = useRef(new Animated.Value(-DRAWER_W)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;

  const dynBG     = isDark ? "#0D1117" : "#F0F4FA";
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
        <TouchableOpacity
          style={[s.iconBtn, { backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)" }]}
          onPress={openDrawer} activeOpacity={0.7}
        >
          <View style={s.hamburger}>
            <View style={[s.hLine, { backgroundColor: dynText }]} />
            <View style={[s.hLine, { backgroundColor: dynText, width: 14 }]} />
            <View style={[s.hLine, { backgroundColor: dynText }]} />
          </View>
        </TouchableOpacity>

        <View style={s.headerCenter}>
          <View style={[s.headerIconBg, { backgroundColor: ACCENT + "22" }]}>
            <Ionicons name="color-wand-outline" size={15} color={ACCENT} />
          </View>
          <Text style={[s.headerTitle, { color: dynText }]} numberOfLines={1}>
            Services Plats Personnalisés
          </Text>
        </View>

        <TouchableOpacity
          style={[s.iconBtn, { backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)" }]}
          onPress={() => router.back()} activeOpacity={0.7}
        >
          <Ionicons name="close-outline" size={20} color={dynText} />
        </TouchableOpacity>
      </View>

      {/* ── CONTENU ── */}
      <View style={{ flex: 1 }}>
        {activeSection === "chef-ia" && (
          <ChefIAView isDark={isDark} dynBG={dynBG} dynText={dynText} dynSub={dynSub} />
        )}
      </View>

      {/* ── OVERLAY ── */}
      {drawerOpen && (
        <Animated.View style={[s.overlay, { opacity: overlayAnim }]} pointerEvents="auto">
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
        {/* En-tête drawer */}
        <View style={[s.drawerHeader, { borderBottomColor: dynBorder }]}>
          <View style={[s.drawerLogoCircle, { backgroundColor: ACCENT + "22" }]}>
            <Ionicons name="color-wand-outline" size={18} color={ACCENT} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[s.drawerTitle, { color: dynText }]}>Services</Text>
            <Text style={[s.drawerSub, { color: dynSub }]}>Plats personnalisés</Text>
          </View>
          <TouchableOpacity onPress={closeDrawer} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={20} color={dynSub} />
          </TouchableOpacity>
        </View>

        <Text style={[s.drawerSectionLabel, { color: dynSub }]}>OUTILS</Text>

        {/* Bouton Chef IA DKD */}
        {(() => {
          const isActive = activeSection === "chef-ia";
          return (
            <TouchableOpacity
              style={[
                s.drawerItem,
                { borderBottomColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.05)" },
                isActive
                  ? { backgroundColor: ACCENT + "14", borderLeftColor: ACCENT }
                  : { borderLeftColor: "transparent" },
              ]}
              onPress={() => selectSection("chef-ia")}
              activeOpacity={0.75}
            >
              {/* Icône robot miniature */}
              <View style={[s.drawerItemIcon, {
                backgroundColor: isActive
                  ? ACCENT + "18"
                  : isDark ? "#1E293B" : "#F1F5F9",
              }]}>
                <MiniChefRobot active={isActive} />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={[s.drawerItemLabel, { color: isActive ? ACCENT : dynText }]}>
                  Chef IA DKD
                </Text>
                <Text style={[s.drawerItemDesc, { color: dynSub }]}>
                  Intelligence culinaire
                </Text>
              </View>

              {isActive && <Ionicons name="chevron-forward" size={14} color={ACCENT} />}
            </TouchableOpacity>
          );
        })()}
      </Animated.View>

    </View>
  );
}

/* ═══════════════════════════════════════════════
   PAGE CHEF IA DKD (vide — contenu à venir)
   ═══════════════════════════════════════════════ */
function ChefIAView({ isDark, dynBG, dynText, dynSub }: {
  isDark: boolean; dynBG: string; dynText: string; dynSub: string;
}) {
  return (
    <View style={[cv.container, { backgroundColor: dynBG }]}>
      <View style={cv.emptyState}>
        <View style={[cv.robotWrap, { backgroundColor: isDark ? "#161B25" : "#EEF4FA" }]}>
          <CuteChefRobot size={100} />
        </View>
        <Text style={[cv.title, { color: dynText }]}>Chef IA DKD</Text>
        <Text style={[cv.sub, { color: dynSub }]}>
          Votre assistant culinaire intelligent arrive bientôt.
        </Text>
      </View>
    </View>
  );
}

/* ═══════════════════════════════════════════════
   STYLES
   ═══════════════════════════════════════════════ */
const s = StyleSheet.create({
  root:         { flex: 1 },
  header:       { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 12, borderBottomWidth: 1, gap: 10 },
  iconBtn:      { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  hamburger:    { gap: 4, alignItems: "flex-start" },
  hLine:        { height: 2, width: 18, borderRadius: 2 },
  headerCenter: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8 },
  headerIconBg: { width: 28, height: 28, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  headerTitle:  { fontFamily: "Poppins_700Bold", fontSize: 14, flex: 1 },

  overlay:      { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.45)", zIndex: 10 },

  drawer: {
    position: "absolute", top: 0, left: 0, bottom: 0,
    width: DRAWER_W, borderRightWidth: 1, zIndex: 20,
    shadowColor: "#000", shadowOpacity: 0.28, shadowRadius: 18, shadowOffset: { width: 6, height: 0 }, elevation: 18,
  },
  drawerHeader:     { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16, paddingVertical: 16, borderBottomWidth: 1 },
  drawerLogoCircle: { width: 38, height: 38, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  drawerTitle:      { fontFamily: "Poppins_700Bold", fontSize: 14 },
  drawerSub:        { fontFamily: "Poppins_400Regular", fontSize: 11 },
  drawerSectionLabel: { fontFamily: "Poppins_600SemiBold", fontSize: 10, letterSpacing: 1.2, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 6 },
  drawerItem:       { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 14, paddingVertical: 12, borderLeftWidth: 3, borderBottomWidth: 1 },
  drawerItemIcon:   { width: 44, height: 44, borderRadius: 12, overflow: "hidden" },
  drawerItemLabel:  { fontFamily: "Poppins_700Bold", fontSize: 13 },
  drawerItemDesc:   { fontFamily: "Poppins_400Regular", fontSize: 11 },
});

const cv = StyleSheet.create({
  container:  { flex: 1, alignItems: "center", justifyContent: "center" },
  emptyState: { alignItems: "center", gap: 18, paddingHorizontal: 36 },
  robotWrap:  { width: 160, height: 160, borderRadius: 36, alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 16, elevation: 4 },
  title:      { fontFamily: "Poppins_700Bold", fontSize: 20 },
  sub:        { fontFamily: "Poppins_400Regular", fontSize: 13, textAlign: "center", lineHeight: 20, opacity: 0.72 },
});
