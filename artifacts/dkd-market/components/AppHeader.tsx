import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Platform, Image } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import Svg, { Path, Line, G, Defs, LinearGradient, Stop } from "react-native-svg";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import { ms, fs } from "@/lib/responsive";

function countryCodeToFlag(code: string): string {
  if (!code || code.length < 2) return "";
  const offset = 0x1F1E6 - 65;
  const upper = code.toUpperCase();
  return String.fromCodePoint(
    upper.charCodeAt(0) + offset,
    upper.charCodeAt(1) + offset
  );
}

function DnaLogo({ size = 28 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Defs>
        <LinearGradient id="dnaGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="white" />
          <Stop offset="0.5" stopColor="#F38020" />
          <Stop offset="1" stopColor="white" />
        </LinearGradient>
      </Defs>
      <G>
        <Path
          d="M8 3C8 3 8 10 12 12C16 14 16 21 16 21"
          strokeWidth="2.5"
          strokeLinecap="round"
          stroke="url(#dnaGrad)"
          fill="none"
        />
        <Path
          d="M16 3C16 3 16 10 12 12C8 14 8 21 8 21"
          strokeWidth="2.5"
          strokeLinecap="round"
          stroke="url(#dnaGrad)"
          fill="none"
        />
        <Line x1="10" y1="6" x2="14" y2="6" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity={0.8} />
        <Line x1="10.5" y1="9" x2="13.5" y2="9" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity={0.9} />
        <Line x1="11" y1="12" x2="13" y2="12" stroke="#F38020" strokeWidth="3" strokeLinecap="round" />
        <Line x1="10.5" y1="15" x2="13.5" y2="15" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity={0.9} />
        <Line x1="10" y1="18" x2="14" y2="18" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity={0.8} />
      </G>
    </Svg>
  );
}

type AppHeaderProps = {
  onMenuPress?: () => void;
  showNotif?: boolean;
  notifCount?: number;
  onGlobePress?: () => void;
  globeActive?: boolean;
  countryFlag?: string;
};

export function AppHeader({ onMenuPress, showNotif = true, notifCount = 1, onGlobePress, globeActive = false, countryFlag }: AppHeaderProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { user } = useAuth();
  const topPadding = Platform.OS === "web" ? 0 : insets.top;
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);

  useEffect(() => {
    AsyncStorage.getItem("@dkd:seller_profile_photo").then((uri) => {
      if (uri) setProfilePhoto(uri);
    }).catch(() => {});
  }, []);

  const displayFlag = countryFlag ?? (user?.country_code ? countryCodeToFlag(user.country_code) : undefined);

  const handleGlobe = onGlobePress ?? (() => router.push("/international" as any));

  return (
    <View style={[styles.wrapper, { paddingTop: topPadding, backgroundColor: colors.primary }]}>
      <View style={styles.header}>
        <View style={styles.leftSection}>
          <TouchableOpacity style={styles.menuBtn} onPress={onMenuPress} activeOpacity={0.7}>
            <Ionicons name="menu" size={26} color="#fff" />
          </TouchableOpacity>
          <DnaLogo key={user?.id ?? "guest"} size={30} />
          <Text style={styles.logoText}>DKD-MARKET</Text>
        </View>

        <View style={styles.rightIcons}>
          {displayFlag && (
            <View style={styles.iconBtn} pointerEvents="none">
              <Text style={styles.flagText}>{displayFlag}</Text>
            </View>
          )}
          <TouchableOpacity style={styles.iconBtn} activeOpacity={0.7} onPress={handleGlobe}>
            <Ionicons name="globe-outline" size={22} color="#fff" />
            {globeActive && (
              <View style={[styles.notifBadge, { borderColor: colors.primary, backgroundColor: "#FFF176" }]} />
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} activeOpacity={0.7} onPress={() => router.push("/notifications")}>
            <Ionicons name="notifications-outline" size={22} color="#fff" />
            {showNotif && notifCount > 0 && (
              <View style={[styles.notifBadge, { borderColor: colors.primary }]} />
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} activeOpacity={0.7} onPress={() => router.push("/profile")}>
            <Ionicons name="settings-outline" size={21} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexShrink: 1,
  },
  menuBtn: {
    padding: 2,
    marginRight: 2,
  },
  logoText: {
    color: "#fff",
    fontFamily: "Poppins_800ExtraBold",
    fontSize: fs(17),
    fontStyle: "italic",
    letterSpacing: 0.5,
  },
  rightIcons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    justifyContent: "flex-end",
    minWidth: 36,
  },
  iconBtn: {
    padding: 5,
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  notifBadge: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#fff",
    borderWidth: 1.5,
  },
  flagText: {
    fontSize: 15,
    lineHeight: 18,
  },
  profilePhotoThumb: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.6)",
  },
});
