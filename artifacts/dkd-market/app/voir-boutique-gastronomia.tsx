import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import ProfilePhotoAvatar from "@/components/ProfilePhotoAvatar";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import * as Haptics from "expo-haptics";

const ACCENT = "#EC4899";

const DEMO_STATS = [
  { label: "Produits",  value: "0",  icon: "fast-food-outline",   color: "#EC4899" },
  { label: "Vues",      value: "0",  icon: "eye-outline",          color: "#3B82F6" },
  { label: "Commandes", value: "0",  icon: "bag-outline",          color: "#22C55E" },
  { label: "Avis",      value: "0",  icon: "star-outline",         color: "#F59E0B" },
];

export default function VoirBoutiqueGastronomiaPage() {
  const router  = useRouter();
  const insets  = useSafeAreaInsets();
  const { isDark } = useTheme();
  const { user } = useAuth();

  const dynBG     = isDark ? "#0D1117" : "#F0F4FA";
  const dynCARD   = isDark ? "#161B25" : "#FFFFFF";
  const dynText   = isDark ? "#F0F6FF" : "#1A1A1A";
  const dynSub    = isDark ? "#64748B" : "#6B7280";
  const dynBorder = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.08)";
  const dynHeader = isDark ? "#111827" : "#FFFFFF";

  const displayName = user?.full_name || user?.email?.split("@")[0] || "Gastronomie";
  const initial     = displayName.charAt(0).toUpperCase();
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);

  useEffect(() => {
    AsyncStorage.getItem("@dkd:seller_profile_photo").then((uri) => {
      if (uri) setProfilePhoto(uri);
    }).catch(() => {});
  }, []);

  return (
    <View style={[s.root, { backgroundColor: dynBG, paddingTop: insets.top }]}>

      {/* HEADER */}
      <View style={[s.header, { backgroundColor: dynHeader, borderBottomColor: dynBorder }]}>
        <TouchableOpacity
          style={[s.backBtn, { backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)" }]}
          onPress={() => router.back()} activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={20} color={dynText} />
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <View style={[s.headerIcon, { backgroundColor: ACCENT + "22" }]}>
            <Ionicons name="storefront-outline" size={16} color={ACCENT} />
          </View>
          <Text style={[s.headerTitle, { color: dynText }]}>Ma Boutique</Text>
        </View>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 30 }]} showsVerticalScrollIndicator={false}>

        {/* BANNER */}
        <View style={[s.banner, { backgroundColor: ACCENT + "18", borderColor: ACCENT + "33" }]}>
          <View style={[s.bannerGlow, { backgroundColor: ACCENT + "22" }]} />
          <ProfilePhotoAvatar
            photoUri={profilePhoto}
            initials={initial}
            onPhotoChanged={setProfilePhoto}
            size={72}
            fontSize={30}
            borderColor={ACCENT + "88"}
            bgColor={ACCENT + "33"}
            initialsColor={ACCENT}
          />
          <Text style={[s.bannerName, { color: dynText }]}>{displayName}</Text>
          <View style={[s.bannerBadge, { backgroundColor: ACCENT + "22" }]}>
            <Ionicons name="restaurant-outline" size={12} color={ACCENT} />
            <Text style={[s.bannerBadgeText, { color: ACCENT }]}>Gastronomie</Text>
          </View>
          <TouchableOpacity
            style={[s.shareBtn, { borderColor: ACCENT + "55" }]}
            onPress={() => Haptics.selectionAsync()}
            activeOpacity={0.8}
          >
            <Ionicons name="share-social-outline" size={15} color={ACCENT} />
            <Text style={[s.shareBtnText, { color: ACCENT }]}>Partager ma boutique</Text>
          </TouchableOpacity>
        </View>

        {/* STATS */}
        <View style={[s.statsCard, { backgroundColor: dynCARD, borderColor: dynBorder }]}>
          {DEMO_STATS.map((stat, i) => (
            <View key={stat.label} style={[s.statItem, i < DEMO_STATS.length - 1 && { borderRightWidth: 1, borderRightColor: dynBorder }]}>
              <View style={[s.statIcon, { backgroundColor: stat.color + "18" }]}>
                <Ionicons name={stat.icon as any} size={16} color={stat.color} />
              </View>
              <Text style={[s.statValue, { color: dynText }]}>{stat.value}</Text>
              <Text style={[s.statLabel, { color: dynSub }]}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* EMPTY STATE — produits */}
        <Text style={[s.sectionTitle, { color: dynSub }]}>MES PLATS & PRODUITS</Text>
        <View style={[s.emptyCard, { backgroundColor: dynCARD, borderColor: dynBorder }]}>
          <View style={[s.emptyIcon, { backgroundColor: ACCENT + "18" }]}>
            <Ionicons name="fast-food-outline" size={32} color={ACCENT} />
          </View>
          <Text style={[s.emptyTitle, { color: dynText }]}>Boutique vide pour l'instant</Text>
          <Text style={[s.emptySub, { color: dynSub }]}>Ajoutez vos premiers délices pour que vos clients puissent les découvrir.</Text>
          <TouchableOpacity
            style={[s.addBtn, { backgroundColor: ACCENT }]}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.push("/publication-gastronomia" as any); }}
            activeOpacity={0.85}
          >
            <Ionicons name="add-circle-outline" size={18} color="#fff" />
            <Text style={s.addBtnText}>Ajouter un délice</Text>
          </TouchableOpacity>
        </View>

        {/* INFOS */}
        <Text style={[s.sectionTitle, { color: dynSub }]}>INFORMATIONS BOUTIQUE</Text>
        <View style={[s.infoCard, { backgroundColor: dynCARD, borderColor: dynBorder }]}>
          {[
            { icon: "restaurant-outline", label: "Type",        value: "Gastronomie" },
            { icon: "location-outline",   label: "Zone",        value: "Non définie" },
            { icon: "call-outline",       label: "Contact",     value: user?.email || "Non défini" },
            { icon: "time-outline",       label: "Membre depuis", value: "2025" },
          ].map((info) => (
            <View key={info.label} style={[s.infoRow, { borderBottomColor: dynBorder }]}>
              <View style={[s.infoIconWrap, { backgroundColor: ACCENT + "18" }]}>
                <Ionicons name={info.icon as any} size={15} color={ACCENT} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.infoLabel, { color: dynSub }]}>{info.label}</Text>
                <Text style={[s.infoValue, { color: dynText }]}>{info.value}</Text>
              </View>
            </View>
          ))}
        </View>

      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root:   { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, gap: 10 },
  backBtn:      { width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  headerCenter: { flex: 1, flexDirection: "row", alignItems: "center", gap: 10 },
  headerIcon:   { width: 30, height: 30, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  headerTitle:  { fontFamily: "Poppins_700Bold", fontSize: 17 },

  scroll: { padding: 14, gap: 14 },

  banner:       { borderRadius: 20, borderWidth: 1, alignItems: "center", padding: 24, gap: 10, overflow: "hidden" },
  bannerGlow:   { position: "absolute", top: -50, width: 200, height: 200, borderRadius: 100 },
  bannerAvatar: { width: 72, height: 72, borderRadius: 36, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  bannerAvatarText: { fontFamily: "Poppins_700Bold", fontSize: 30 },
  bannerName:   { fontFamily: "Poppins_700Bold", fontSize: 18 },
  bannerBadge:  { flexDirection: "row", alignItems: "center", gap: 5, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 },
  bannerBadgeText: { fontFamily: "Poppins_600SemiBold", fontSize: 12 },
  shareBtn:     { flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 20, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 7, marginTop: 4 },
  shareBtnText: { fontFamily: "Poppins_600SemiBold", fontSize: 12 },

  statsCard:  { flexDirection: "row", borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  statItem:   { flex: 1, alignItems: "center", paddingVertical: 14, gap: 4 },
  statIcon:   { width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  statValue:  { fontFamily: "Poppins_700Bold", fontSize: 16 },
  statLabel:  { fontFamily: "Poppins_400Regular", fontSize: 10 },

  sectionTitle: { fontFamily: "Poppins_600SemiBold", fontSize: 11, letterSpacing: 1, marginLeft: 2 },

  emptyCard:  { borderRadius: 16, borderWidth: 1, alignItems: "center", padding: 24, gap: 10 },
  emptyIcon:  { width: 64, height: 64, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  emptyTitle: { fontFamily: "Poppins_700Bold", fontSize: 15 },
  emptySub:   { fontFamily: "Poppins_400Regular", fontSize: 12, textAlign: "center", lineHeight: 18 },
  addBtn:     { flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 11, marginTop: 4 },
  addBtnText: { color: "#fff", fontFamily: "Poppins_700Bold", fontSize: 13 },

  infoCard:   { borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  infoRow:    { flexDirection: "row", alignItems: "center", padding: 12, gap: 12, borderBottomWidth: 1 },
  infoIconWrap:{ width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  infoLabel:  { fontFamily: "Poppins_400Regular", fontSize: 10, marginBottom: 1 },
  infoValue:  { fontFamily: "Poppins_600SemiBold", fontSize: 13 },
});
