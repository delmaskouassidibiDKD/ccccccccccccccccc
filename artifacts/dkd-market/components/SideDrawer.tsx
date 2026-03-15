import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  ScrollView,
  Modal,
  Platform,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/contexts/ThemeContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useRouter } from "expo-router";
import Svg, { Path, Line, G, Defs, LinearGradient, Stop } from "react-native-svg";
import type { Language } from "@/lib/translations";

const DRAWER_WIDTH = 310;
const { width: SCREEN_WIDTH } = Dimensions.get("window");

function DnaLogoDrawer({ size = 32 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Defs>
        <LinearGradient id="dnaGradD" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="white" />
          <Stop offset="0.5" stopColor="#F38020" />
          <Stop offset="1" stopColor="white" />
        </LinearGradient>
      </Defs>
      <G>
        <Path d="M8 3C8 3 8 10 12 12C16 14 16 21 16 21" strokeWidth="2.5" strokeLinecap="round" stroke="url(#dnaGradD)" fill="none" />
        <Path d="M16 3C16 3 16 10 12 12C8 14 8 21 8 21" strokeWidth="2.5" strokeLinecap="round" stroke="url(#dnaGradD)" fill="none" />
        <Line x1="10" y1="6" x2="14" y2="6" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity={0.8} />
        <Line x1="10.5" y1="9" x2="13.5" y2="9" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity={0.9} />
        <Line x1="11" y1="12" x2="13" y2="12" stroke="#F38020" strokeWidth="3" strokeLinecap="round" />
        <Line x1="10.5" y1="15" x2="13.5" y2="15" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity={0.9} />
        <Line x1="10" y1="18" x2="14" y2="18" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity={0.8} />
      </G>
    </Svg>
  );
}

type DrawerMenuItem = {
  icon: string;
  iconFamily?: "ionicons" | "material";
  label: string;
  emoji?: string;
  badge?: string;
  highlight?: boolean;
  route?: string;
};

type SideDrawerProps = {
  visible: boolean;
  onClose: () => void;
};

export function SideDrawer({ visible, onClose }: SideDrawerProps) {
  const slideAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;
  const { colors, isDark, toggleTheme } = useTheme();
  const { t, language, setLanguage, languages } = useLanguage();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [showLangPicker, setShowLangPicker] = useState(false);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: 0, duration: 280, useNativeDriver: true }),
        Animated.timing(overlayAnim, { toValue: 1, duration: 280, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: -DRAWER_WIDTH, duration: 250, useNativeDriver: true }),
        Animated.timing(overlayAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const menuItems: DrawerMenuItem[] = [
    { icon: "storefront-outline", label: t.drawer.becomeSeller, emoji: "🧡", highlight: true, route: "/become-seller" },
    { icon: "chatbubble-ellipses-outline", label: t.drawer.aiAssistant, emoji: "🤖", badge: t.drawer.beta },
    { icon: "globe-outline", label: t.drawer.internationalMarket, emoji: "🌍" },
    { icon: "people-outline", label: t.drawer.groupBuying, emoji: "👥", route: "/(tabs)/groupe" },
    { icon: "car-outline", label: t.drawer.becomeDriver, emoji: "🚚" },
    { icon: "handshake-outline", iconFamily: "material", label: t.drawer.becomePartner, emoji: "🤝" },
    { icon: "videocam-outline", label: t.drawer.publishVideo, emoji: "🎬", route: "/(tabs)/videos" },
    { icon: "star-outline", label: t.drawer.rateApp, emoji: "⭐" },
    { icon: "information-circle-outline", label: t.drawer.about, emoji: "📱" },
  ];

  const handleMenuItem = (item: DrawerMenuItem) => {
    onClose();
    if (item.route) {
      setTimeout(() => router.push(item.route as any), 300);
    }
  };

  const currentLang = languages.find((l) => l.code === language);

  const topPadding = Platform.OS === "web" ? 0 : insets.top;

  if (!visible) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Animated.View
        style={[styles.overlay, { opacity: overlayAnim }]}
      >
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
      </Animated.View>

      <Animated.View
        style={[
          styles.drawer,
          {
            width: DRAWER_WIDTH,
            backgroundColor: colors.drawerBg,
            transform: [{ translateX: slideAnim }],
          },
        ]}
      >
        <View style={[styles.drawerHeader, { paddingTop: topPadding + 16 }]}>
          <DnaLogoDrawer size={36} />
          <View style={{ marginLeft: 10 }}>
            <Text style={styles.drawerTitle}>{t.drawer.title}</Text>
            <Text style={styles.drawerSubtitle}>{t.drawer.subtitle}</Text>
          </View>
        </View>

        <ScrollView
          style={styles.menuList}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: Platform.OS === "web" ? 100 : insets.bottom + 110 }}
        >
          {menuItems.map((item, idx) => (
            <TouchableOpacity
              key={idx}
              style={[
                styles.menuItem,
                {
                  backgroundColor: item.highlight
                    ? "rgba(255,107,0,0.08)"
                    : colors.drawerItemBg,
                  borderColor: item.highlight
                    ? "rgba(255,107,0,0.15)"
                    : colors.drawerItemBorder,
                },
              ]}
              activeOpacity={0.7}
              onPress={() => handleMenuItem(item)}
            >
              <View style={[styles.menuIconWrap, { backgroundColor: item.highlight ? colors.primary : colors.surface }]}>
                {item.iconFamily === "material" ? (
                  <MaterialCommunityIcons
                    name={item.icon as any}
                    size={22}
                    color={item.highlight ? "#fff" : colors.primary}
                  />
                ) : (
                  <Ionicons
                    name={item.icon as any}
                    size={22}
                    color={item.highlight ? "#fff" : colors.primary}
                  />
                )}
              </View>
              <Text
                style={[
                  styles.menuLabel,
                  {
                    color: item.highlight ? colors.primary : colors.text,
                    fontFamily: item.highlight ? "Poppins_700Bold" : "Poppins_600SemiBold",
                  },
                ]}
              >
                {item.label} {item.emoji}
              </Text>
              {item.badge && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{item.badge}</Text>
                </View>
              )}
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} style={{ marginLeft: "auto" }} />
            </TouchableOpacity>
          ))}

          <View style={[styles.bottomBar, { borderTopColor: colors.border }]}>
            <TouchableOpacity
              style={[styles.langBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
              activeOpacity={0.7}
              onPress={() => setShowLangPicker(true)}
            >
              <Ionicons name="language" size={22} color={colors.primary} />
              <Text style={[styles.langLabel, { color: colors.text }]}>
                {currentLang?.flag} {language.toUpperCase()}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.themeBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
              activeOpacity={0.7}
              onPress={toggleTheme}
            >
              <Ionicons
                name={isDark ? "sunny" : "moon"}
                size={22}
                color={isDark ? "#F59E0B" : colors.primary}
              />
            </TouchableOpacity>
          </View>
        </ScrollView>
      </Animated.View>

      <Modal visible={showLangPicker} transparent animationType="fade" onRequestClose={() => setShowLangPicker(false)}>
        <TouchableOpacity style={styles.langOverlay} activeOpacity={1} onPress={() => setShowLangPicker(false)}>
          <View style={[styles.langCard, { backgroundColor: colors.backgroundCard }]}>
            <Text style={[styles.langTitle, { color: colors.text }]}>{t.drawer.languages}</Text>
            {languages.map((lang) => (
              <TouchableOpacity
                key={lang.code}
                style={[
                  styles.langOption,
                  {
                    backgroundColor: language === lang.code ? "rgba(255,107,0,0.1)" : colors.drawerItemBg,
                    borderColor: language === lang.code ? "rgba(255,107,0,0.3)" : colors.drawerItemBorder,
                  },
                ]}
                activeOpacity={0.7}
                onPress={() => {
                  setLanguage(lang.code);
                  setShowLangPicker(false);
                }}
              >
                <Text style={styles.langFlag}>{lang.flag}</Text>
                <Text
                  style={[
                    styles.langName,
                    {
                      color: language === lang.code ? colors.primary : colors.text,
                      fontFamily: language === lang.code ? "Poppins_700Bold" : "Poppins_500Medium",
                    },
                  ]}
                >
                  {lang.label}
                </Text>
                {language === lang.code && (
                  <Ionicons name="checkmark-circle" size={22} color={colors.primary} style={{ marginLeft: "auto" }} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  drawer: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    shadowColor: "#000",
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 20,
  },
  drawerHeader: {
    backgroundColor: "#FF6B00",
    paddingHorizontal: 20,
    paddingBottom: 20,
    flexDirection: "row",
    alignItems: "center",
  },
  drawerTitle: {
    color: "#fff",
    fontFamily: "Poppins_800ExtraBold",
    fontSize: 20,
    fontStyle: "italic",
  },
  drawerSubtitle: {
    color: "rgba(255,255,255,0.85)",
    fontFamily: "Poppins_600SemiBold",
    fontSize: 10,
    letterSpacing: 2,
  },
  menuList: {
    flex: 1,
    paddingHorizontal: 14,
    paddingTop: 16,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 14,
    marginBottom: 6,
    borderWidth: 1,
  },
  menuIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  menuLabel: {
    fontSize: 13,
    flex: 1,
  },
  badge: {
    backgroundColor: "#FF6B00",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 6,
  },
  badgeText: {
    color: "#fff",
    fontSize: 9,
    fontFamily: "Poppins_700Bold",
  },
  bottomBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 0,
    paddingTop: 12,
    paddingBottom: 4,
    marginTop: 6,
    borderTopWidth: 1,
    gap: 10,
  },
  langBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  langLabel: {
    fontFamily: "Poppins_700Bold",
    fontSize: 14,
  },
  themeBtn: {
    width: 50,
    height: 50,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  langOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
  },
  langCard: {
    borderRadius: 20,
    padding: 24,
    width: "100%",
    maxWidth: 340,
  },
  langTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 16,
    marginBottom: 16,
  },
  langOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 14,
    marginBottom: 8,
    borderWidth: 1,
  },
  langFlag: {
    fontSize: 28,
    marginRight: 14,
  },
  langName: {
    fontSize: 16,
  },
});
