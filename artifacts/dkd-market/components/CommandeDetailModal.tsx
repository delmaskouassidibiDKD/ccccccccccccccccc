import React, { useState, useRef, useCallback } from "react";
import {
  View, Text, StyleSheet, Modal, Pressable, FlatList,
  TouchableOpacity, Dimensions, Alert, ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import type { Source } from "@/lib/orders-data";

const { width: SW } = Dimensions.get("window");
const CARD_W   = Math.min(Math.round(SW * 0.62), 250);
const CARD_GAP = 12;
const SNAP     = CARD_W + CARD_GAP;

export const SOURCE_CONFIG: Record<Source, { label: string; color: string; icon: string }> = {
  gastronomie:      { label: "Gastronomia",      color: "#F59E0B", icon: "restaurant-outline"    },
  marche:           { label: "Marché",            color: "#22C55E", icon: "storefront-outline"    },
  supermarche:      { label: "Super Marché",      color: "#3B82F6", icon: "cart-outline"          },
  grossiste:        { label: "Grossiste",         color: "#8B5CF6", icon: "cube-outline"          },
  personnalisation: { label: "Personnalisation",  color: "#EC4899", icon: "color-palette-outline" },
};

const PALETTE = [
  "#FF6B00", "#3B82F6", "#8B5CF6", "#22C55E",
  "#EC4899", "#F59E0B", "#06B6D4", "#EF4444",
];

export type ProductSlide = {
  id: string;
  name: string;
  price: string;
  qty: number;
  unit?: string;
  isGros?: boolean;
  details?: string;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  products: ProductSlide[];
  isConfirmed?: boolean;
  onCancel?: () => void;
  isDark: boolean;
};

export default function CommandeDetailModal({
  visible, onClose, products, isConfirmed, onCancel, isDark,
}: Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const flatRef = useRef<FlatList>(null);

  const dynSheet  = isDark ? "#111827" : "#F8FAFC";
  const dynCARD   = isDark ? "#1C2333" : "#FFFFFF";
  const dynText   = isDark ? "#F0F6FF" : "#111827";
  const dynSub    = isDark ? "#64748B" : "#9CA3AF";
  const dynBorder = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
  const dynHandle = isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.12)";
  const dynDetailBG = isDark ? "#0D1117" : "#F1F5F9";

  const current = products[activeIndex];

  const onViewRef = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setActiveIndex(viewableItems[0].index ?? 0);
      setDetailsOpen(false);
    }
  });
  const viewCfg = useRef({ viewAreaCoveragePercentThreshold: 51 });

  const handleClose = useCallback(() => {
    setActiveIndex(0);
    setDetailsOpen(false);
    onClose();
  }, [onClose]);

  const handleCancel = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(
      "Annuler la commande",
      "Voulez-vous vraiment annuler cette commande ? Cette action est irréversible.",
      [
        { text: "Non, garder", style: "cancel" },
        { text: "Oui, annuler", style: "destructive", onPress: () => { handleClose(); onCancel?.(); } },
      ]
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <Pressable style={m.overlay} onPress={handleClose}>
        <Pressable style={[m.sheet, { backgroundColor: dynSheet }]} onPress={(e) => e.stopPropagation()}>

          <View style={[m.handle, { backgroundColor: dynHandle }]} />

          <View style={m.sheetHeader}>
            <Text style={[m.sheetTitle, { color: dynText }]}>
              {products.length > 1 ? `${products.length} articles` : "Article commandé"}
            </Text>
            <TouchableOpacity style={m.closeBtn} onPress={handleClose} activeOpacity={0.7}>
              <Ionicons name="close" size={18} color={dynSub} />
            </TouchableOpacity>
          </View>

          <FlatList
            ref={flatRef}
            data={products}
            keyExtractor={(p) => p.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={SNAP}
            decelerationRate="fast"
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 4, gap: CARD_GAP }}
            onViewableItemsChanged={onViewRef.current}
            viewabilityConfig={viewCfg.current}
            renderItem={({ item, index }) => {
              const accent = PALETTE[index % PALETTE.length];
              const isActive = index === activeIndex;
              return (
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => {
                    flatRef.current?.scrollToIndex({ index, animated: true });
                    setActiveIndex(index);
                    setDetailsOpen(false);
                  }}
                  style={[
                    pc.card,
                    { width: CARD_W, backgroundColor: dynCARD, borderColor: isActive ? accent + "88" : dynBorder, borderWidth: isActive ? 1.5 : 1 },
                  ]}
                >
                  <View style={[pc.photo, { backgroundColor: accent + "1A" }]}>
                    <View style={[pc.photoCircle, { backgroundColor: accent + "22" }]}>
                      <Ionicons name="image-outline" size={26} color={accent} />
                    </View>
                    {item.isGros && (
                      <View style={pc.grosTag}>
                        <Text style={pc.grosTagText}>GROS</Text>
                      </View>
                    )}
                  </View>

                  <View style={pc.cardBottom}>
                    <Text style={[pc.cardName, { color: dynText }]} numberOfLines={2}>{item.name}</Text>
                    <Text style={[pc.cardPrice, { color: accent }]}>{item.price}</Text>
                    <Text style={[pc.cardQty, { color: dynSub }]}>× {item.qty}{item.unit ? ` ${item.unit}` : ""}</Text>
                  </View>
                </TouchableOpacity>
              );
            }}
          />

          {products.length > 1 && (
            <View style={m.dots}>
              {products.map((_, i) => (
                <View
                  key={i}
                  style={[
                    m.dot,
                    { backgroundColor: i === activeIndex ? "#FF6B00" : dynHandle },
                    i === activeIndex && m.dotActive,
                  ]}
                />
              ))}
            </View>
          )}

          {current?.details && (
            <View style={[m.detailsBox, { backgroundColor: dynDetailBG, borderColor: dynBorder }]}>
              <TouchableOpacity
                style={m.detailsRow}
                onPress={() => { Haptics.selectionAsync(); setDetailsOpen((v) => !v); }}
                activeOpacity={0.7}
              >
                <View style={m.detailsLeft}>
                  <Ionicons name="list-outline" size={14} color="#FF6B00" />
                  <Text style={[m.detailsLabel, { color: isDark ? "#CBD5E1" : "#374151" }]}>Détails</Text>
                </View>
                <Ionicons name={detailsOpen ? "chevron-up" : "chevron-down"} size={14} color={dynSub} />
              </TouchableOpacity>
              {detailsOpen && (
                <Text style={[m.detailsText, { color: dynSub }]}>{current.details}</Text>
              )}
            </View>
          )}

          {isConfirmed && onCancel && (
            <TouchableOpacity style={m.cancelBtn} onPress={handleCancel} activeOpacity={0.8}>
              <Ionicons name="close-circle-outline" size={15} color="#EF4444" />
              <Text style={m.cancelBtnText}>Annuler la commande</Text>
            </TouchableOpacity>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const pc = StyleSheet.create({
  card: {
    borderRadius: 16,
    overflow: "hidden",
    width: CARD_W,
    height: CARD_W,
  },
  photo: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  photoCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  grosTag: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: "#EF4444",
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  grosTagText: {
    color: "#fff",
    fontFamily: "Poppins_700Bold",
    fontSize: 8,
    letterSpacing: 0.5,
  },
  cardBottom: {
    padding: 10,
    gap: 3,
  },
  cardName: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12,
    lineHeight: 17,
  },
  cardPrice: {
    fontFamily: "Poppins_700Bold",
    fontSize: 13,
  },
  cardQty: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
  },
});

const m = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 28,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 4,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  sheetTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 14,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 5,
    marginTop: 10,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotActive: {
    width: 18,
    borderRadius: 3,
  },
  detailsBox: {
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  detailsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  detailsLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  detailsLabel: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12,
  },
  detailsText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    lineHeight: 19,
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  cancelBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    marginHorizontal: 16,
    marginTop: 12,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#EF444414",
    borderWidth: 1,
    borderColor: "#EF444430",
  },
  cancelBtnText: {
    color: "#EF4444",
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
  },
});
