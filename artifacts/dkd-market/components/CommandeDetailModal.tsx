import React, { useState, useRef, useCallback } from "react";
import {
  View, Text, StyleSheet, Modal, Pressable, FlatList,
  TouchableOpacity, Dimensions, Alert, Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import type { Source } from "@/lib/orders-data";

const { width: SW } = Dimensions.get("window");

export const SOURCE_CONFIG: Record<Source, { label: string; color: string; icon: string }> = {
  gastronomie:     { label: "Gastronomia",      color: "#F59E0B", icon: "restaurant-outline" },
  marche:          { label: "Marché",            color: "#22C55E", icon: "storefront-outline" },
  supermarche:     { label: "Super Marché",      color: "#3B82F6", icon: "cart-outline" },
  grossiste:       { label: "Grossiste",         color: "#8B5CF6", icon: "cube-outline" },
  personnalisation:{ label: "Personnalisation",  color: "#EC4899", icon: "color-palette-outline" },
};

const PHOTO_COLORS = [
  ["#FF6B00", "#FF9B4E"],
  ["#3B82F6", "#60A5FA"],
  ["#8B5CF6", "#A78BFA"],
  ["#22C55E", "#4ADE80"],
  ["#EC4899", "#F472B6"],
  ["#F59E0B", "#FCD34D"],
  ["#06B6D4", "#22D3EE"],
  ["#EF4444", "#F87171"],
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

function ProductCard({
  item, index, isDark, isConfirmed, onCancel, onClose,
}: {
  item: ProductSlide;
  index: number;
  isDark: boolean;
  isConfirmed?: boolean;
  onCancel?: () => void;
  onClose: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const colors = PHOTO_COLORS[index % PHOTO_COLORS.length];

  const dynCARD   = isDark ? "#161B25" : "#FFFFFF";
  const dynText   = isDark ? "#F0F6FF" : "#111827";
  const dynSub    = isDark ? "#94A3B8" : "#6B7280";
  const dynBorder = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.09)";
  const dynDetailBG = isDark ? "#0D1117" : "#F8FAFC";

  const handleCancel = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(
      "Annuler la commande",
      "Voulez-vous vraiment annuler cette commande ? Cette action est irréversible.",
      [
        { text: "Non, garder", style: "cancel" },
        {
          text: "Oui, annuler",
          style: "destructive",
          onPress: () => {
            onClose();
            onCancel?.();
          },
        },
      ]
    );
  };

  return (
    <View style={[pc.slide, { width: SW - 32, backgroundColor: dynCARD }]}>

      <View style={[pc.photoBox, { backgroundColor: colors[0] + "22", borderColor: colors[0] + "33" }]}>
        <View style={[pc.photoInner, { backgroundColor: colors[0] + "18" }]}>
          <Ionicons name="image-outline" size={40} color={colors[0]} />
        </View>
        <View style={[pc.photoLabel, { backgroundColor: colors[0] + "dd" }]}>
          <Text style={pc.photoLabelText} numberOfLines={1}>{item.name}</Text>
        </View>
      </View>

      <View style={pc.infoSection}>
        <View style={pc.badgesRow}>
          {item.isGros && (
            <View style={[pc.grosBadge]}>
              <Ionicons name="cube-outline" size={10} color="#8B5CF6" />
              <Text style={pc.grosBadgeText}>EN GROS</Text>
            </View>
          )}
        </View>

        <Text style={[pc.productName, { color: dynText }]} numberOfLines={2}>{item.name}</Text>

        <View style={pc.priceQtyRow}>
          <Text style={pc.price}>{item.price}</Text>
          <View style={[pc.qtyPill, { backgroundColor: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)" }]}>
            <Ionicons name="layers-outline" size={12} color={dynSub} />
            <Text style={[pc.qtyText, { color: dynSub }]}>
              × {item.qty}{item.unit ? ` ${item.unit}` : ""}
            </Text>
          </View>
        </View>

        {item.details && (
          <View style={[pc.detailsBox, { backgroundColor: dynDetailBG, borderColor: dynBorder }]}>
            <TouchableOpacity
              style={pc.detailsHeader}
              onPress={() => { Haptics.selectionAsync(); setExpanded((e) => !e); }}
              activeOpacity={0.7}
            >
              <View style={pc.detailsHeaderLeft}>
                <Ionicons name="list-outline" size={13} color="#FF6B00" />
                <Text style={[pc.detailsLabel, { color: isDark ? "#CBD5E1" : "#374151" }]}>Détails</Text>
              </View>
              <Ionicons
                name={expanded ? "chevron-up" : "chevron-down"}
                size={14}
                color={dynSub}
              />
            </TouchableOpacity>
            {expanded && (
              <Text style={[pc.detailsContent, { color: dynSub }]}>{item.details}</Text>
            )}
          </View>
        )}
      </View>

      {isConfirmed && onCancel && (
        <TouchableOpacity style={pc.cancelBtn} onPress={handleCancel} activeOpacity={0.8}>
          <Ionicons name="close-circle-outline" size={15} color="#EF4444" />
          <Text style={pc.cancelBtnText}>Annuler la commande</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function CommandeDetailModal({ visible, onClose, products, isConfirmed, onCancel, isDark }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const flatRef = useRef<FlatList>(null);

  const dynSheet  = isDark ? "#111827" : "#F8FAFC";
  const dynText   = isDark ? "#F0F6FF" : "#111827";
  const dynSub    = isDark ? "#64748B" : "#9CA3AF";
  const dynHandle = isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.12)";

  const onViewRef = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) setActiveIndex(viewableItems[0].index ?? 0);
  });
  const viewCfg  = useRef({ viewAreaCoveragePercentThreshold: 50 });

  const handleClose = useCallback(() => {
    setActiveIndex(0);
    onClose();
  }, [onClose]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <Pressable style={m.overlay} onPress={handleClose}>
        <Pressable style={[m.sheet, { backgroundColor: dynSheet }]} onPress={(e) => e.stopPropagation()}>

          <View style={[m.handle, { backgroundColor: dynHandle }]} />

          <View style={m.sheetHeader}>
            <Text style={[m.sheetTitle, { color: dynText }]}>
              {products.length > 1
                ? `Article ${activeIndex + 1} / ${products.length}`
                : "Détail de l'article"}
            </Text>
            <TouchableOpacity style={m.closeBtn} onPress={handleClose} activeOpacity={0.7}>
              <Ionicons name="close" size={20} color={dynSub} />
            </TouchableOpacity>
          </View>

          <FlatList
            ref={flatRef}
            data={products}
            keyExtractor={(p) => p.id}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            bounces={false}
            onViewableItemsChanged={onViewRef.current}
            viewabilityConfig={viewCfg.current}
            renderItem={({ item, index }) => (
              <ProductCard
                item={item}
                index={index}
                isDark={isDark}
                isConfirmed={isConfirmed}
                onCancel={onCancel}
                onClose={handleClose}
              />
            )}
          />

          {products.length > 1 && (
            <View style={m.dots}>
              {products.map((_, i) => (
                <TouchableOpacity
                  key={i}
                  onPress={() => flatRef.current?.scrollToIndex({ index: i, animated: true })}
                  activeOpacity={0.7}
                >
                  <View style={[m.dot, i === activeIndex && m.dotActive, { backgroundColor: i === activeIndex ? "#FF6B00" : dynHandle }]} />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const pc = StyleSheet.create({
  slide: {
    borderRadius: 16,
    overflow: "hidden",
    marginHorizontal: 0,
  },
  photoBox: {
    height: 170,
    borderBottomWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  photoInner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  photoLabel: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  photoLabelText: {
    color: "#fff",
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
  },
  infoSection: {
    padding: 14,
    gap: 10,
  },
  badgesRow: {
    flexDirection: "row",
    gap: 8,
  },
  grosBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#8B5CF622",
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "#8B5CF644",
  },
  grosBadgeText: {
    color: "#8B5CF6",
    fontFamily: "Poppins_700Bold",
    fontSize: 9,
    letterSpacing: 0.8,
  },
  productName: {
    fontFamily: "Poppins_700Bold",
    fontSize: 16,
    lineHeight: 22,
  },
  priceQtyRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  price: {
    color: "#FF6B00",
    fontFamily: "Poppins_700Bold",
    fontSize: 20,
  },
  qtyPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  qtyText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
  },
  detailsBox: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  detailsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  detailsHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  detailsLabel: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12,
  },
  detailsContent: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    lineHeight: 20,
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  cancelBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    marginHorizontal: 14,
    marginBottom: 14,
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

const m = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 24,
    maxHeight: "88%",
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
    fontSize: 15,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    marginTop: 12,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  dotActive: {
    width: 20,
    borderRadius: 4,
  },
});
