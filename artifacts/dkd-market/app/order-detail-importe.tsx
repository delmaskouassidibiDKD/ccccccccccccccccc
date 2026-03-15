import React, { useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput, Modal, KeyboardAvoidingView, Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/contexts/ThemeContext";
import * as Haptics from "expo-haptics";
import { ORDERS } from "@/lib/orders-data";
import type { OrderItem } from "@/lib/orders-data";

export default function OrderDetailImportePage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();

  const dynBG     = isDark ? "#0D1117" : "#F0F4FA";
  const dynCARD   = isDark ? "#161B25" : "#FFFFFF";
  const dynText   = isDark ? "#F0F6FF" : "#1A1A1A";
  const dynSub    = isDark ? "#64748B" : "#6B7280";
  const dynBorder = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.08)";
  const ACCENT    = "#3B82F6";

  const order = ORDERS.find((o) => o.id === id);

  // Articles state — starts empty
  const [articles, setArticles] = useState<OrderItem[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState({ name: "", qty: "", unit: "", unitPrice: "" });
  const [formError, setFormError] = useState("");

  if (!order) {
    return (
      <View style={[d.root, { backgroundColor: dynBG, paddingTop: insets.top }]}>
        <TouchableOpacity style={[d.backBtn, { marginTop: 10, marginLeft: 14 }]} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={dynText} />
        </TouchableOpacity>
        <View style={d.notFound}>
          <Ionicons name="alert-circle-outline" size={48} color={dynSub} />
          <Text style={[d.notFoundText, { color: dynSub }]}>Commande introuvable</Text>
        </View>
      </View>
    );
  }

  const total = articles.reduce((acc, i) => acc + i.total, 0);

  const addArticle = () => {
    if (!form.name.trim()) { setFormError("Le nom de l'article est requis"); return; }
    const qty = parseInt(form.qty, 10);
    const price = parseInt(form.unitPrice.replace(/\s/g, ""), 10);
    if (!qty || qty <= 0) { setFormError("Quantité invalide"); return; }
    if (!price || price <= 0) { setFormError("Prix unitaire invalide"); return; }
    const newItem: OrderItem = {
      id: `item-${Date.now()}`,
      name: form.name.trim(),
      qty,
      unit: form.unit.trim() || "pièce",
      unitPrice: price,
      total: qty * price,
    };
    setArticles((prev) => [...prev, newItem]);
    setForm({ name: "", qty: "", unit: "", unitPrice: "" });
    setFormError("");
    setShowAddModal(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const removeArticle = (itemId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setArticles((prev) => prev.filter((a) => a.id !== itemId));
  };

  const applyDevis = () => {
    if (articles.length === 0) {
      Alert.alert("Aucun article", "Ajoutez au moins un article avant d'appliquer le devis.");
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert(
      "Devis appliqué",
      `Le devis de ${total.toLocaleString("fr-FR")} FCFA a été appliqué pour ${order.name}.`,
      [{ text: "OK", onPress: () => router.back() }]
    );
  };

  return (
    <View style={[d.root, { backgroundColor: dynBG }]}>

      {/* ── HEADER ── */}
      <View style={[d.header, { paddingTop: insets.top + 10, backgroundColor: isDark ? "#111827" : "#fff", borderBottomColor: dynBorder }]}>
        <TouchableOpacity style={d.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color={dynText} />
        </TouchableOpacity>
        <Text style={[d.headerTitle, { color: dynText }]}>Articles sélectionnés</Text>
        <TouchableOpacity
          style={[d.addHeaderBtn, { backgroundColor: ACCENT + "18", borderColor: ACCENT + "44" }]}
          onPress={() => setShowAddModal(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={18} color={ACCENT} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 110 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Client card ── */}
        <View style={[d.clientCard, { backgroundColor: dynCARD, borderColor: dynBorder }]}>
          <View style={[d.avatar, { backgroundColor: order.color + "22" }]}>
            <Text style={[d.avatarText, { color: order.color }]}>{order.initials}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[d.clientName, { color: dynText }]}>{order.name}</Text>
            <Text style={[d.clientMeta, { color: dynSub }]}>{order.date} · {order.time}</Text>
          </View>
          <View style={[d.orderIdBadge, { backgroundColor: ACCENT + "18", borderColor: ACCENT + "33" }]}>
            <Text style={[d.orderIdText, { color: ACCENT }]}>#{order.id.toUpperCase()}</Text>
          </View>
        </View>

        {/* ── Section label ── */}
        <View style={d.sectionRow}>
          <Text style={[d.sectionLabel, { color: dynSub }]}>
            ARTICLES — {articles.length} article{articles.length !== 1 ? "s" : ""}
          </Text>
          <TouchableOpacity
            style={[d.addSmallBtn, { backgroundColor: ACCENT }]}
            onPress={() => setShowAddModal(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={13} color="#fff" />
            <Text style={d.addSmallBtnText}>Ajouter</Text>
          </TouchableOpacity>
        </View>

        {/* ── Empty state ── */}
        {articles.length === 0 ? (
          <View style={[d.emptyBox, { backgroundColor: dynCARD, borderColor: dynBorder }]}>
            <Ionicons name="cube-outline" size={44} color={dynSub} />
            <Text style={[d.emptyTitle, { color: dynText }]}>Aucun article ajouté</Text>
            <Text style={[d.emptyDesc, { color: dynSub }]}>
              Appuyez sur "Ajouter" pour saisir les articles choisis par le client.
            </Text>
            <TouchableOpacity
              style={[d.emptyAddBtn, { backgroundColor: ACCENT }]}
              onPress={() => setShowAddModal(true)}
              activeOpacity={0.85}
            >
              <Ionicons name="add-circle-outline" size={16} color="#fff" />
              <Text style={d.emptyAddBtnText}>Ajouter un article</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* ── Table header ── */}
            <View style={[d.tableHead, { backgroundColor: isDark ? "#0F172A" : "#EFF6FF", borderColor: ACCENT + "22" }]}>
              <Text style={[d.colH, { flex: 2.6, color: dynSub }]}>ARTICLE</Text>
              <Text style={[d.colH, { flex: 0.7, textAlign: "center", color: dynSub }]}>QTÉ</Text>
              <Text style={[d.colH, { flex: 1.3, textAlign: "right", color: dynSub }]}>P.U</Text>
              <Text style={[d.colH, { flex: 1.4, textAlign: "right", color: dynSub }]}>TOTAL</Text>
              <View style={{ width: 28 }} />
            </View>

            {/* ── Article rows ── */}
            {articles.map((item, idx) => (
              <View
                key={item.id}
                style={[
                  d.tableRow,
                  { borderBottomColor: dynBorder, backgroundColor: idx % 2 === 0 ? dynCARD : (isDark ? "#1E293B14" : "#F8FBFF") },
                ]}
              >
                <View style={{ flex: 2.6 }}>
                  <Text style={[d.itemName, { color: dynText }]} numberOfLines={2}>{item.name}</Text>
                  <View style={[d.unitTag, { backgroundColor: isDark ? "#1E293B" : "#EFF6FF" }]}>
                    <Text style={[d.unitText, { color: dynSub }]}>{item.unit}</Text>
                  </View>
                </View>
                <View style={{ flex: 0.7, alignItems: "center" }}>
                  <Text style={[d.itemQty, { color: dynText }]}>{item.qty}</Text>
                </View>
                <Text style={[d.itemPrice, { flex: 1.3, color: dynSub }]}>
                  {item.unitPrice.toLocaleString("fr-FR")}
                </Text>
                <Text style={[d.itemTotal, { flex: 1.4, color: ACCENT }]}>
                  {item.total.toLocaleString("fr-FR")}
                </Text>
                <TouchableOpacity
                  style={d.deleteBtn}
                  onPress={() => removeArticle(item.id)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="trash-outline" size={15} color="#EF4444" />
                </TouchableOpacity>
              </View>
            ))}

            {/* ── Total card ── */}
            <View style={[d.summaryCard, { backgroundColor: dynCARD, borderColor: dynBorder }]}>
              <View style={d.summaryRow}>
                <Text style={[d.summaryLabel, { color: dynSub }]}>Nombre d'articles</Text>
                <Text style={[d.summaryValue, { color: dynText }]}>{articles.length}</Text>
              </View>
              <View style={[d.totalDivider, { backgroundColor: ACCENT + "33" }]} />
              <View style={d.summaryRow}>
                <Text style={[d.totalLabel, { color: dynText }]}>Total général</Text>
                <Text style={[d.totalAmt, { color: ACCENT }]}>{total.toLocaleString("fr-FR")} FCFA</Text>
              </View>
            </View>
          </>
        )}
      </ScrollView>

      {/* ── Sticky footer ── */}
      <View style={[d.stickyFooter, { backgroundColor: dynBG, borderTopColor: dynBorder, paddingBottom: insets.bottom + 12 }]}>
        <TouchableOpacity
          style={[d.applyBtn, { backgroundColor: articles.length === 0 ? (isDark ? "#1E293B" : "#E5E7EB") : ACCENT }]}
          onPress={applyDevis}
          activeOpacity={0.85}
        >
          <Ionicons name="document-text-outline" size={18} color={articles.length === 0 ? dynSub : "#fff"} />
          <Text style={[d.applyBtnText, { color: articles.length === 0 ? dynSub : "#fff" }]}>
            {articles.length === 0 ? "Appliquer le devis" : `Appliquer le devis — ${total.toLocaleString("fr-FR")} FCFA`}
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── ADD ARTICLE MODAL ── */}
      <Modal visible={showAddModal} animationType="slide" transparent onRequestClose={() => setShowAddModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
          <View style={d.modalOverlay}>
            <View style={[d.modalSheet, { backgroundColor: dynCARD }]}>
              <View style={[d.modalHeader, { borderBottomColor: dynBorder }]}>
                <Text style={[d.modalTitle, { color: dynText }]}>Ajouter un article</Text>
                <TouchableOpacity onPress={() => { setShowAddModal(false); setFormError(""); }} activeOpacity={0.7}>
                  <Ionicons name="close" size={22} color={dynSub} />
                </TouchableOpacity>
              </View>

              <ScrollView contentContainerStyle={d.modalBody} showsVerticalScrollIndicator={false}>
                {formError ? (
                  <View style={[d.errorBanner, { backgroundColor: "#EF444418" }]}>
                    <Ionicons name="alert-circle-outline" size={14} color="#EF4444" />
                    <Text style={d.errorText}>{formError}</Text>
                  </View>
                ) : null}

                <Text style={[d.fieldLabel, { color: dynSub }]}>Nom de l'article *</Text>
                <TextInput
                  style={[d.input, { color: dynText, backgroundColor: isDark ? "#0D1117" : "#F0F4FA", borderColor: dynBorder }]}
                  placeholder="ex: Tissu wax, Téléphone..."
                  placeholderTextColor={dynSub}
                  value={form.name}
                  onChangeText={(v) => setForm((f) => ({ ...f, name: v }))}
                />

                <View style={d.fieldRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={[d.fieldLabel, { color: dynSub }]}>Quantité *</Text>
                    <TextInput
                      style={[d.input, { color: dynText, backgroundColor: isDark ? "#0D1117" : "#F0F4FA", borderColor: dynBorder }]}
                      placeholder="10"
                      placeholderTextColor={dynSub}
                      keyboardType="numeric"
                      value={form.qty}
                      onChangeText={(v) => setForm((f) => ({ ...f, qty: v }))}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[d.fieldLabel, { color: dynSub }]}>Unité</Text>
                    <TextInput
                      style={[d.input, { color: dynText, backgroundColor: isDark ? "#0D1117" : "#F0F4FA", borderColor: dynBorder }]}
                      placeholder="carton, pièce..."
                      placeholderTextColor={dynSub}
                      value={form.unit}
                      onChangeText={(v) => setForm((f) => ({ ...f, unit: v }))}
                    />
                  </View>
                </View>

                <Text style={[d.fieldLabel, { color: dynSub }]}>Prix unitaire (FCFA) *</Text>
                <TextInput
                  style={[d.input, { color: dynText, backgroundColor: isDark ? "#0D1117" : "#F0F4FA", borderColor: dynBorder }]}
                  placeholder="15 000"
                  placeholderTextColor={dynSub}
                  keyboardType="numeric"
                  value={form.unitPrice}
                  onChangeText={(v) => setForm((f) => ({ ...f, unitPrice: v }))}
                />

                {form.qty && form.unitPrice ? (
                  <View style={[d.previewTotal, { backgroundColor: ACCENT + "14", borderColor: ACCENT + "33" }]}>
                    <Text style={[d.previewLabel, { color: dynSub }]}>Total prévu</Text>
                    <Text style={[d.previewAmt, { color: ACCENT }]}>
                      {((parseInt(form.qty, 10) || 0) * (parseInt(form.unitPrice.replace(/\s/g, ""), 10) || 0)).toLocaleString("fr-FR")} FCFA
                    </Text>
                  </View>
                ) : null}

                <TouchableOpacity style={[d.confirmBtn, { backgroundColor: ACCENT }]} onPress={addArticle} activeOpacity={0.85}>
                  <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
                  <Text style={d.confirmBtnText}>Confirmer l'article</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const d = StyleSheet.create({
  root:        { flex: 1 },

  header:      { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingBottom: 12, borderBottomWidth: 1, gap: 12 },
  backBtn:     { padding: 4 },
  headerTitle: { flex: 1, fontFamily: "Poppins_700Bold", fontSize: 17, textAlign: "center" },
  addHeaderBtn:{ width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center", borderWidth: 1 },

  notFound:    { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  notFoundText:{ fontFamily: "Poppins_500Medium", fontSize: 15 },

  clientCard:  { flexDirection: "row", alignItems: "center", gap: 12, margin: 14, borderRadius: 14, borderWidth: 1, padding: 14 },
  avatar:      { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  avatarText:  { fontFamily: "Poppins_700Bold", fontSize: 16 },
  clientName:  { fontFamily: "Poppins_700Bold", fontSize: 15 },
  clientMeta:  { fontFamily: "Poppins_400Regular", fontSize: 11, marginTop: 2 },
  orderIdBadge:{ borderRadius: 8, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 4 },
  orderIdText: { fontFamily: "Poppins_700Bold", fontSize: 11 },

  sectionRow:  { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginHorizontal: 14, marginBottom: 8 },
  sectionLabel:{ fontFamily: "Poppins_700Bold", fontSize: 10, letterSpacing: 0.8 },
  addSmallBtn: { flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  addSmallBtnText: { fontFamily: "Poppins_600SemiBold", fontSize: 11, color: "#fff" },

  emptyBox:    { margin: 14, borderRadius: 16, borderWidth: 1, borderStyle: "dashed", padding: 36, alignItems: "center", gap: 10 },
  emptyTitle:  { fontFamily: "Poppins_700Bold", fontSize: 15, marginTop: 4 },
  emptyDesc:   { fontFamily: "Poppins_400Regular", fontSize: 12, textAlign: "center", lineHeight: 18 },
  emptyAddBtn: { flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 10, marginTop: 6 },
  emptyAddBtnText: { fontFamily: "Poppins_600SemiBold", fontSize: 13, color: "#fff" },

  tableHead:   { flexDirection: "row", marginHorizontal: 14, borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 2, alignItems: "center" },
  colH:        { fontFamily: "Poppins_700Bold", fontSize: 9, letterSpacing: 0.6 },

  tableRow:    { flexDirection: "row", marginHorizontal: 14, paddingHorizontal: 12, paddingVertical: 12, borderBottomWidth: 1, alignItems: "center" },
  itemName:    { fontFamily: "Poppins_600SemiBold", fontSize: 12, marginBottom: 3 },
  unitTag:     { alignSelf: "flex-start", borderRadius: 5, paddingHorizontal: 6, paddingVertical: 2 },
  unitText:    { fontFamily: "Poppins_400Regular", fontSize: 9 },
  itemQty:     { fontFamily: "Poppins_700Bold", fontSize: 14 },
  itemPrice:   { fontFamily: "Poppins_400Regular", fontSize: 11, textAlign: "right" },
  itemTotal:   { fontFamily: "Poppins_700Bold", fontSize: 13, textAlign: "right" },
  deleteBtn:   { width: 28, alignItems: "center" },

  summaryCard: { margin: 14, borderRadius: 14, borderWidth: 1, padding: 14, gap: 8, marginTop: 16 },
  summaryRow:  { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  summaryLabel:{ fontFamily: "Poppins_400Regular", fontSize: 12 },
  summaryValue:{ fontFamily: "Poppins_600SemiBold", fontSize: 13 },
  totalDivider:{ height: 1, marginVertical: 4 },
  totalLabel:  { fontFamily: "Poppins_700Bold", fontSize: 14 },
  totalAmt:    { fontFamily: "Poppins_700Bold", fontSize: 18 },

  stickyFooter:{ paddingHorizontal: 14, paddingTop: 12, borderTopWidth: 1 },
  applyBtn:    { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 14, paddingVertical: 16 },
  applyBtnText:{ fontFamily: "Poppins_700Bold", fontSize: 14 },

  modalOverlay:{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalSheet:  { borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 18, borderBottomWidth: 1 },
  modalTitle:  { fontFamily: "Poppins_700Bold", fontSize: 16 },
  modalBody:   { padding: 18, gap: 4, paddingBottom: 30 },

  errorBanner: { flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 8, padding: 10, marginBottom: 8 },
  errorText:   { fontFamily: "Poppins_500Medium", fontSize: 12, color: "#EF4444", flex: 1 },

  fieldLabel:  { fontFamily: "Poppins_600SemiBold", fontSize: 12, marginBottom: 4, marginTop: 10 },
  fieldRow:    { flexDirection: "row", gap: 10 },
  input:       { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontFamily: "Poppins_400Regular", fontSize: 13 },

  previewTotal:{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderRadius: 10, borderWidth: 1, padding: 12, marginTop: 12 },
  previewLabel:{ fontFamily: "Poppins_400Regular", fontSize: 12 },
  previewAmt:  { fontFamily: "Poppins_700Bold", fontSize: 15 },

  confirmBtn:  { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 12, paddingVertical: 14, marginTop: 16 },
  confirmBtnText: { fontFamily: "Poppins_700Bold", fontSize: 14, color: "#fff" },
});
