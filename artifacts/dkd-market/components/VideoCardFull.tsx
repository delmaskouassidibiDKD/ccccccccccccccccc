import React, { useState, useRef } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, Platform, useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { VideoPublication } from "@/data/videos";
import { ms, fs } from "@/lib/responsive";

const IS_WEB = Platform.OS === "web";

const VIDEO_BG_COLORS = [
  "#0d0400", "#00080f", "#000f06", "#0f0009", "#0f0c00", "#000a1f", "#0f0700",
];
const VIDEO_ACCENTS = [
  "#FF6B00", "#3B82F6", "#22C55E", "#EC4899", "#F59E0B", "#8B5CF6", "#06B6D4",
];

function fmtCount(n: number): string {
  if (!n) return "0";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

interface Props {
  item: VideoPublication;
  index: number;
  bottomOffset?: number;
  onClose?: () => void;
}

export default function VideoCardFull({ item, index, bottomOffset = 80, onClose }: Props) {
  const { width: W, height: H } = useWindowDimensions();
  const [liked, setLiked]       = useState(false);
  const [likeCount, setLikeCount] = useState(item.likes ?? 0);
  const [showHeart, setShowHeart] = useState(false);
  const lastTap = useRef(0);

  const bg     = item.color || VIDEO_BG_COLORS[index % VIDEO_BG_COLORS.length];
  const accent = VIDEO_ACCENTS[index % VIDEO_ACCENTS.length];

  const handleTap = () => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      if (!liked) { setLiked(true); setLikeCount(p => p + 1); }
      setShowHeart(true);
      if (!IS_WEB) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setTimeout(() => setShowHeart(false), 800);
    }
    lastTap.current = now;
  };

  return (
    <View style={[styles.page, { backgroundColor: bg, width: W, height: H }]} collapsable={false}>
      {/* Fond icône décoratif */}
      <View style={[StyleSheet.absoluteFill, styles.placeholderContainer]}>
        <View style={[styles.glowCircle,      { backgroundColor: `${accent}18` }]} />
        <View style={[styles.glowCircleInner, { backgroundColor: `${accent}28` }]} />
        <Ionicons name={item.icon as any} size={88} color={`${accent}55`} />
        {/* Bouton play centré */}
        <View style={styles.playCenterBtn}>
          <Ionicons name="play" size={38} color="rgba(255,255,255,0.9)" />
        </View>
      </View>

      {/* Gradient bas */}
      <View style={styles.bottomGradient} pointerEvents="none">
        <View style={styles.gradientLayer1} />
        <View style={styles.gradientLayer2} />
        <View style={styles.gradientLayer3} />
      </View>

      {/* Double-tap zone */}
      <TouchableOpacity activeOpacity={1} style={StyleSheet.absoluteFill} onPress={handleTap} />

      {/* Cœur double-tap */}
      {showHeart && (
        <View style={styles.heartOverlay} pointerEvents="none">
          <Ionicons name="heart" size={100} color="rgba(255,255,255,0.85)" />
        </View>
      )}

      {/* Bouton fermer (coin haut gauche) */}
      {onClose && (
        <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.8}>
          <Ionicons name="close" size={22} color="#fff" />
        </TouchableOpacity>
      )}

      {/* Durée */}
      <View style={styles.durationPill}>
        <Ionicons name="time-outline" size={11} color="#fff" />
        <Text style={styles.durationText}>{item.duration}</Text>
      </View>

      {/* Boutons droite */}
      <View style={[styles.rightActions, { bottom: bottomOffset + 50 }]}>
        {/* Avatar vendeur */}
        <View style={styles.avatarWrap}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarFlag}>{item.shopFlag}</Text>
          </View>
          <View style={styles.plusBadge}>
            <Ionicons name="add" size={12} color="#fff" />
          </View>
        </View>

        {/* Like */}
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => {
            const next = !liked;
            setLiked(next);
            setLikeCount(p => next ? p + 1 : Math.max(0, p - 1));
            if (!IS_WEB) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
        >
          <Ionicons
            name={liked ? "shirt" : "shirt-outline"}
            size={28}
            color={liked ? "#FF3B5C" : "#fff"}
          />
          <Text style={styles.actionCount}>{fmtCount(likeCount)}</Text>
        </TouchableOpacity>

        {/* Commentaires */}
        <TouchableOpacity style={styles.actionBtn}>
          <Ionicons name="chatbubble-ellipses-outline" size={26} color="#fff" />
          <Text style={styles.actionCount}>{fmtCount(item.comments)}</Text>
        </TouchableOpacity>

        {/* Panier (prix) */}
        <TouchableOpacity style={styles.actionBtn}>
          <View style={styles.basketBtn}>
            <Ionicons name="basket" size={20} color="#fff" />
          </View>
          <Text style={styles.actionCount}>Panier</Text>
        </TouchableOpacity>

        {/* Partager */}
        <TouchableOpacity style={styles.actionBtn}>
          <Ionicons name="arrow-redo-outline" size={26} color="#fff" />
          <Text style={styles.actionCount}>Partager</Text>
        </TouchableOpacity>
      </View>

      {/* Infos bas */}
      <View style={[styles.bottomInfo, { bottom: bottomOffset + 4 }]}>
        <Text style={styles.sellerName}>@{item.shopName} {item.shopFlag}</Text>
        <View style={[styles.titleTag, { backgroundColor: accent }]}>
          <Text style={styles.titleTagText}>{(item.title || "").toUpperCase()}</Text>
        </View>
        <View style={styles.ctaRow}>
          <View style={styles.pricePill}>
            <Ionicons name="pricetag-outline" size={12} color="#fff" />
            <Text style={styles.priceText}>{item.price}</Text>
          </View>
          <View style={styles.viewsPill}>
            <Ionicons name="eye-outline" size={12} color="rgba(255,255,255,0.7)" />
            <Text style={styles.viewsText}>{fmtCount(item.views)} vues</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  placeholderContainer: { alignItems: "center", justifyContent: "center" },
  glowCircle:      { position: "absolute", width: ms(280), height: ms(280), borderRadius: ms(140) },
  glowCircleInner: { position: "absolute", width: ms(160), height: ms(160), borderRadius: ms(80) },
  playCenterBtn: {
    position: "absolute",
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center", justifyContent: "center",
    borderWidth: 2, borderColor: "rgba(255,255,255,0.6)",
  },
  bottomGradient: { position: "absolute", bottom: 0, left: 0, right: 0, height: 360, zIndex: 1, overflow: "hidden" },
  gradientLayer1: { position: "absolute", bottom: 0, left: 0, right: 0, height: 360, backgroundColor: "rgba(0,0,0,0.55)" },
  gradientLayer2: { position: "absolute", bottom: 0, left: 0, right: 0, height: 200, backgroundColor: "rgba(0,0,0,0.35)" },
  gradientLayer3: { position: "absolute", bottom: 0, left: 0, right: 0, height: 80,  backgroundColor: "rgba(0,0,0,0.2)" },
  heartOverlay: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center", zIndex: 50 },
  closeBtn: {
    position: "absolute", top: 52, left: 14, zIndex: 200,
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center", justifyContent: "center",
  },
  durationPill: {
    position: "absolute", top: 56, right: 14, zIndex: 200,
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4,
  },
  durationText: { color: "#fff", fontFamily: "Poppins_700Bold", fontSize: fs(11) },
  rightActions: { position: "absolute", right: 12, alignItems: "center", gap: 16, zIndex: 10 },
  avatarWrap: { alignItems: "center", marginBottom: 4 },
  avatarCircle: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.9)",
    alignItems: "center", justifyContent: "center",
  },
  avatarFlag: { fontSize: 24 },
  plusBadge: {
    position: "absolute", bottom: -8, width: 20, height: 20,
    borderRadius: 10, alignItems: "center", justifyContent: "center",
    borderWidth: 2, borderColor: "#000", backgroundColor: "#FF3B30",
  },
  actionBtn: { alignItems: "center", gap: 4 },
  actionCount: { color: "#fff", fontFamily: "Poppins_700Bold", fontSize: 11 },
  basketBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: "#E53935",
    alignItems: "center", justifyContent: "center",
  },
  bottomInfo: { position: "absolute", left: ms(14), right: ms(76), gap: 6, zIndex: 10 },
  sellerName: { color: "#fff", fontFamily: "Poppins_700Bold", fontSize: fs(15) },
  titleTag: { alignSelf: "flex-start", paddingHorizontal: ms(10), paddingVertical: 4, borderRadius: 20 },
  titleTagText: { color: "#fff", fontFamily: "Poppins_700Bold", fontSize: fs(10), letterSpacing: 0.8 },
  ctaRow: { flexDirection: "row", gap: 8, marginTop: 4 },
  pricePill: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: "rgba(255,255,255,0.18)",
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10,
  },
  priceText: { color: "#fff", fontFamily: "Poppins_700Bold", fontSize: fs(11) },
  viewsPill: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: "rgba(0,0,0,0.3)",
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10,
  },
  viewsText: { color: "rgba(255,255,255,0.75)", fontFamily: "Poppins_400Regular", fontSize: fs(11) },
});
