import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/contexts/ThemeContext";
import { useLanguage } from "@/contexts/LanguageContext";
import * as Haptics from "expo-haptics";

export type SortOption = "featured" | "price_asc" | "price_desc" | "popular";

const ALL_COUNTRIES = [
  { flag: "🇨🇮", code: "CI", name: "Côte d'Ivoire" },
  { flag: "🇸🇳", code: "SN", name: "Sénégal" },
  { flag: "🇧🇯", code: "BJ", name: "Bénin" },
  { flag: "🇹🇬", code: "TG", name: "Togo" },
  { flag: "🇨🇲", code: "CM", name: "Cameroun" },
  { flag: "🇲🇱", code: "ML", name: "Mali" },
  { flag: "🇧🇫", code: "BF", name: "Burkina Faso" },
  { flag: "🇬🇳", code: "GN", name: "Guinée" },
  { flag: "🇨🇬", code: "CG", name: "Congo" },
  { flag: "🇬🇦", code: "GA", name: "Gabon" },
  { flag: "🇳🇪", code: "NE", name: "Niger" },
  { flag: "🇨🇩", code: "CD", name: "RD Congo" },
  { flag: "🇲🇬", code: "MG", name: "Madagascar" },
  { flag: "🇨🇫", code: "CF", name: "Centrafrique" },
  { flag: "🇹🇩", code: "TD", name: "Tchad" },
];

type Props = {
  visible: boolean;
  onClose: () => void;
  selectedCountry: string;
  onSelectCountry: (code: string) => void;
  sortBy: SortOption;
  onSelectSort: (sort: SortOption) => void;
};

export function CountryFilterModal({
  visible,
  onClose,
  selectedCountry,
  onSelectCountry,
  sortBy,
  onSelectSort,
}: Props) {
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();

  const SORT_OPTIONS: { key: SortOption; label: string; icon: string }[] = [
    { key: "featured", label: t.search.relevance, icon: "star-outline" },
    { key: "price_asc", label: t.search.priceAsc, icon: "trending-down-outline" },
    { key: "price_desc", label: t.search.priceDesc, icon: "trending-up-outline" },
    { key: "popular", label: t.search.topRated, icon: "flame-outline" },
  ];

  const cardBg = isDark ? "#1A1A1A" : "#fff";

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose} />

      <View
        style={[
          styles.sheet,
          {
            backgroundColor: cardBg,
            paddingBottom: Platform.OS === "web" ? 24 : insets.bottom + 16,
          },
        ]}
      >
        <View style={[styles.handle, { backgroundColor: colors.border }]} />

        <View style={styles.sheetHeader}>
          <Text style={[styles.sheetTitle, { color: colors.text }]}>
            🌍 {t.home.allCountries}
          </Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={22} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
          <View style={styles.countriesGrid}>
            {ALL_COUNTRIES.map((c) => {
              const active = selectedCountry === c.code;
              return (
                <TouchableOpacity
                  key={c.code}
                  style={[
                    styles.countryCard,
                    {
                      backgroundColor: active ? colors.primary + "18" : colors.backgroundCard,
                      borderColor: active ? colors.primary : colors.border,
                    },
                  ]}
                  activeOpacity={0.7}
                  onPress={() => {
                    Haptics.selectionAsync();
                    onSelectCountry(c.code);
                  }}
                >
                  <Text style={styles.countryFlag}>{c.flag}</Text>
                  <Text
                    style={[
                      styles.countryName,
                      { color: active ? colors.primary : colors.text },
                    ]}
                    numberOfLines={1}
                  >
                    {c.name}
                  </Text>
                  {active && (
                    <Ionicons
                      name="checkmark-circle"
                      size={16}
                      color={colors.primary}
                      style={{ marginLeft: "auto" }}
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>
            {t.search.sortBy.toUpperCase()}
          </Text>

          <View style={styles.sortList}>
            {SORT_OPTIONS.map((opt) => {
              const active = sortBy === opt.key;
              return (
                <TouchableOpacity
                  key={opt.key}
                  style={[
                    styles.sortRow,
                    {
                      backgroundColor: active ? colors.primary + "14" : colors.backgroundCard,
                      borderColor: active ? colors.primary : colors.border,
                    },
                  ]}
                  activeOpacity={0.7}
                  onPress={() => {
                    Haptics.selectionAsync();
                    onSelectSort(opt.key);
                  }}
                >
                  <View style={[styles.sortIcon, { backgroundColor: active ? colors.primary : colors.surface }]}>
                    <Ionicons name={opt.icon as any} size={18} color={active ? "#fff" : colors.textSecondary} />
                  </View>
                  <Text style={[styles.sortLabel, { color: active ? colors.primary : colors.text, fontFamily: active ? "Poppins_700Bold" : "Poppins_500Medium" }]}>
                    {opt.label}
                  </Text>
                  {active && (
                    <Ionicons name="checkmark-circle" size={20} color={colors.primary} style={{ marginLeft: "auto" }} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

        <TouchableOpacity
          style={[styles.applyBtn, { backgroundColor: colors.primary }]}
          activeOpacity={0.85}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onClose();
          }}
        >
          <Ionicons name="checkmark" size={20} color="#fff" />
          <Text style={styles.applyBtnText}>{t.search.applyFilters}</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  sheet: {
    maxHeight: "82%",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 20,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  sheetTitle: {
    flex: 1,
    fontFamily: "Poppins_700Bold",
    fontSize: 17,
  },
  closeBtn: {
    padding: 4,
  },
  countriesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 8,
  },
  countryCard: {
    flexDirection: "row",
    alignItems: "center",
    width: "47%",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    gap: 8,
  },
  countryFlag: {
    fontSize: 22,
  },
  countryName: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12,
    flex: 1,
  },
  divider: {
    height: 1,
    marginVertical: 16,
    borderRadius: 1,
  },
  sectionLabel: {
    fontFamily: "Poppins_700Bold",
    fontSize: 11,
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  sortList: {
    gap: 8,
    marginBottom: 20,
  },
  sortRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    gap: 12,
  },
  sortIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  sortLabel: {
    fontSize: 14,
  },
  applyBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 16,
    gap: 8,
    marginTop: 4,
  },
  applyBtnText: {
    color: "#fff",
    fontFamily: "Poppins_700Bold",
    fontSize: 15,
  },
});
