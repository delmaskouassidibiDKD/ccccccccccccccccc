import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export type SellerProduct = {
  id: string;
  shopName: string;
  shopFlag: string;
  title: string;
  price: string;
  rating: number;
  reviewCount: number;
  status: "active" | "inactive";
  icon: string;
  color: string;
  minQty?: string;
  origine?: string;
};

type Props = {
  item: SellerProduct;
  isDark: boolean;
  isEngros?: boolean;
  accentColor: string;
  onEdit?: () => void;
  onVideo?: () => void;
};

function StarRow({ rating, reviewCount, isDark }: { rating: number; reviewCount: number; isDark: boolean }) {
  const filled = Math.floor(rating);
  const half = rating - filled >= 0.5;
  return (
    <View style={sr.row}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Ionicons
          key={i}
          name={i <= filled ? "star" : i === filled + 1 && half ? "star-half" : "star-outline"}
          size={11}
          color="#F59E0B"
        />
      ))}
      <Text style={sr.rating}>{rating.toFixed(1)}</Text>
      <Text style={[sr.count, { color: isDark ? "#6B7280" : "#9CA3AF" }]}>({reviewCount})</Text>
    </View>
  );
}

const sr = StyleSheet.create({
  row:    { flexDirection: "row", alignItems: "center", gap: 2, marginTop: 2 },
  rating: { fontFamily: "Poppins_600SemiBold", fontSize: 10, color: "#F59E0B", marginLeft: 2 },
  count:  { fontFamily: "Poppins_400Regular", fontSize: 10 },
});

export function SellerProductCard({ item, isDark, isEngros = false, accentColor, onEdit, onVideo }: Props) {
  const dCARD   = isDark ? "#161B25" : "#FFFFFF";
  const dBORDER = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.07)";
  const dTEXT   = isDark ? "#F0F0F0" : "#111827";
  const dSUB    = isDark ? "#8B9AB0" : "#6B7280";
  const dMOD    = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)";
  const active  = item.status === "active";

  return (
    <View style={[c.card, { backgroundColor: dCARD, borderColor: dBORDER }]}>

      {/* ── LEFT CONTENT ── */}
      <View style={c.content}>
        {/* Shop name */}
        <Text style={[c.shopName, { color: dSUB }]} numberOfLines={1}>
          {item.shopName} {item.shopFlag}
        </Text>

        {/* Title */}
        <Text style={[c.title, { color: dTEXT }]} numberOfLines={2}>
          {item.title}
        </Text>

        {/* Stars */}
        <StarRow rating={item.rating} reviewCount={item.reviewCount} isDark={isDark} />

        {/* Origine (importés) */}
        {item.origine ? (
          <View style={c.originRow}>
            <Ionicons name="arrow-forward-outline" size={10} color={dSUB} />
            <Text style={[c.originText, { color: dSUB }]}>{item.origine}</Text>
          </View>
        ) : null}

        {/* Min qty (en gros) */}
        {item.minQty ? (
          <Text style={[c.minQty, { color: dSUB }]}>Min. {item.minQty}</Text>
        ) : null}

        {/* Price + Video btn */}
        <View style={c.priceRow}>
          <Text style={c.price}>{item.price}</Text>
          <TouchableOpacity
            style={[c.videoBtn, { backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)" }]}
            onPress={onVideo}
            activeOpacity={0.8}
          >
            <Ionicons name="play-circle-outline" size={18} color={isDark ? "#CBD5E1" : "#475569"} />
          </TouchableOpacity>
        </View>

        {/* Modifier button */}
        <TouchableOpacity style={[c.modifyBtn, { backgroundColor: dMOD }]} onPress={onEdit} activeOpacity={0.8}>
          <Ionicons name="create-outline" size={13} color={accentColor} />
          <Text style={[c.modifyText, { color: accentColor }]}>Modifier</Text>
        </TouchableOpacity>
      </View>

      {/* ── RIGHT IMAGE BOX ── */}
      <View style={[c.imageBox, { backgroundColor: item.color }]}>
        <Ionicons name={item.icon as any} size={36} color="rgba(255,255,255,0.88)" />

        {/* Status dot */}
        <View style={[c.statusDot, { backgroundColor: active ? "#22C55E" : "#94A3B8" }]} />

        {/* EN GROS badge */}
        {isEngros && (
          <View style={c.grossBadge}>
            <Text style={c.grossText}>EN GROS</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const c = StyleSheet.create({
  card: {
    borderRadius: 16,
    overflow: "hidden",
    flexDirection: "row",
    alignItems: "stretch",
    borderWidth: 1,
    marginBottom: 14,
    minHeight: 130,
  },

  content: {
    flex: 1,
    paddingLeft: 14,
    paddingRight: 6,
    gap: 2,
  },

  shopName: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    marginTop: 13,
  },
  title: {
    fontFamily: "Poppins_700Bold",
    fontSize: 13,
    lineHeight: 18,
    marginTop: 1,
  },

  originRow: { flexDirection: "row", alignItems: "center", gap: 3, marginTop: 1 },
  originText: { fontFamily: "Poppins_400Regular", fontSize: 10 },

  minQty: { fontFamily: "Poppins_400Regular", fontSize: 10, marginTop: 1 },

  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: 10,
    marginTop: 5,
    marginRight: 4,
  },
  price: {
    fontFamily: "Poppins_700Bold",
    fontSize: 15,
    color: "#FF6B00",
  },
  videoBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },

  modifyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 8,
    paddingVertical: 5,
    paddingHorizontal: 9,
    alignSelf: "flex-start",
    marginTop: 4,
    marginBottom: 12,
  },
  modifyText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 11,
  },

  imageBox: {
    width: 88,
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
    borderTopRightRadius: 16,
    borderBottomRightRadius: 16,
    position: "relative",
  },
  statusDot: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.45)",
  },

  grossBadge: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#DC2626",
    paddingVertical: 4,
    alignItems: "center",
  },
  grossText: {
    fontFamily: "Poppins_700Bold",
    fontSize: 9,
    color: "#fff",
    letterSpacing: 0.8,
  },
});
