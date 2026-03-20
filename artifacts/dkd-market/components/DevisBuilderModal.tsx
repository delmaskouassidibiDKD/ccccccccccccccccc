import React, { useState, useRef, useCallback } from "react";
import {
  View, Text, StyleSheet, Modal, Pressable, TouchableOpacity,
  TextInput, ScrollView, Alert, KeyboardAvoidingView, Platform,
  Switch,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

type Row = { id: string; description: string; prix: string };

const makeRow = (): Row => ({ id: Date.now().toString() + Math.random(), description: "", prix: "" });

function parseNum(s: string): number {
  const n = parseFloat(s.replace(/\s/g, "").replace(",", "."));
  return isNaN(n) ? 0 : n;
}

function fmtNum(n: number): string {
  return n.toLocaleString("fr-FR");
}

type Props = {
  visible: boolean;
  onClose: () => void;
  clientName: string;
  isDark: boolean;
  onConfirm: (devis: { rows: Row[]; total: string; autoCalc: boolean }) => void;
};

export default function DevisBuilderModal({ visible, onClose, clientName, isDark, onConfirm }: Props) {
  const [rows,      setRows]      = useState<Row[]>([makeRow()]);
  const [totalManuel, setTotalManuel] = useState("");
  const [autoCalc,  setAutoCalc]  = useState(true);
  const scrollRef = useRef<ScrollView>(null);

  const dynSheet   = isDark ? "#111827" : "#F8FAFC";
  const dynCARD    = isDark ? "#1C2333" : "#FFFFFF";
  const dynText    = isDark ? "#F0F6FF" : "#111827";
  const dynSub     = isDark ? "#94A3B8" : "#6B7280";
  const dynBorder  = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)";
  const dynInput   = isDark ? "#0D1117" : "#F1F5F9";
  const dynHandle  = isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.12)";

  const totalAuto = rows.reduce((acc, r) => acc + parseNum(r.prix), 0);
  const totalStr  = autoCalc ? (totalAuto > 0 ? fmtNum(totalAuto) : "") : totalManuel;
  const hasTotal  = autoCalc ? totalAuto > 0 : totalManuel.trim().length > 0;

  const updateRow = useCallback((id: string, field: keyof Row, value: string) => {
    setRows((prev) => prev.map((r) => r.id === id ? { ...r, [field]: value } : r));
  }, []);

  const addRow = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRows((prev) => [...prev, makeRow()]);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 120);
  };

  const removeRow = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (rows.length === 1) { setRows([makeRow()]); return; }
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  const handleToggle = (val: boolean) => {
    Haptics.selectionAsync();
    setAutoCalc(val);
    if (val) setTotalManuel("");
  };

  const handleConfirm = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const total = autoCalc ? `${fmtNum(totalAuto)} FCFA` : `${totalManuel} FCFA`;
    Alert.alert(
      "Devis appliqué",
      `Le devis de ${total} a été appliqué pour ${clientName}.`,
      [{ text: "OK", onPress: () => { handleClose(); onConfirm({ rows, total, autoCalc }); } }]
    );
  };

  const handleClose = useCallback(() => {
    setRows([makeRow()]);
    setTotalManuel("");
    setAutoCalc(true);
    onClose();
  }, [onClose]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Pressable style={m.overlay} onPress={handleClose}>
          <Pressable style={[m.sheet, { backgroundColor: dynSheet }]} onPress={(e) => e.stopPropagation()}>

            <View style={[m.handle, { backgroundColor: dynHandle }]} />

            {/* ── Header ── */}
            <View style={m.header}>
              <Text style={[m.title, { color: dynText }]}>Devis personnalisé</Text>
              <View style={m.headerRight}>

                <View style={[m.toggleRow, { backgroundColor: isDark ? "#1E293B" : "#E5E7EB", borderColor: dynBorder }]}>
                  <Text style={[m.toggleLabel, { color: autoCalc ? "#FF6B00" : dynSub }]}>Auto</Text>
                  <Switch
                    value={autoCalc}
                    onValueChange={handleToggle}
                    trackColor={{ false: isDark ? "#374151" : "#D1D5DB", true: "#FF6B0044" }}
                    thumbColor={autoCalc ? "#FF6B00" : (isDark ? "#64748B" : "#9CA3AF")}
                    style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
                  />
                </View>

                <TouchableOpacity style={[m.addBtn, { backgroundColor: "#3B82F618", borderColor: "#3B82F640" }]} onPress={addRow} activeOpacity={0.8}>
                  <Ionicons name="add" size={18} color="#3B82F6" />
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView
              ref={scrollRef}
              style={{ maxHeight: 300 }}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ padding: 14, gap: 8 }}
              keyboardShouldPersistTaps="handled"
            >
              {rows.map((row, idx) => (
                <View key={row.id} style={[m.rowWrap, { backgroundColor: dynCARD, borderColor: dynBorder }]}>
                  <View style={m.rowLeft}>
                    <Text style={[m.rowNum, { color: dynSub }]}>{idx + 1}</Text>
                  </View>

                  <View style={m.rowFields}>
                    <TextInput
                      style={[m.descInput, { backgroundColor: dynInput, color: dynText, borderColor: dynBorder }]}
                      placeholder="Description de l'article..."
                      placeholderTextColor={dynSub}
                      value={row.description}
                      onChangeText={(v) => updateRow(row.id, "description", v)}
                    />
                    {autoCalc && (
                      <View style={[m.prixWrap, { backgroundColor: dynInput, borderColor: dynBorder }]}>
                        <TextInput
                          style={[m.prixInput, { color: dynText }]}
                          placeholder="0"
                          placeholderTextColor={dynSub}
                          keyboardType="numeric"
                          value={row.prix}
                          onChangeText={(v) => updateRow(row.id, "prix", v)}
                        />
                        <Text style={[m.prixUnit, { color: dynSub }]}>FCFA</Text>
                      </View>
                    )}
                  </View>

                  <TouchableOpacity style={m.removeBtn} onPress={() => removeRow(row.id)} activeOpacity={0.7}>
                    <Ionicons name="trash-outline" size={14} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>

            {/* ── Total ── */}
            <View style={[m.totalSection, { borderColor: dynBorder, backgroundColor: dynCARD }]}>
              <Text style={[m.totalLabel, { color: dynSub }]}>Total</Text>
              {autoCalc ? (
                <View style={m.totalAutoVal}>
                  <Text style={[m.totalAutoText, { color: totalAuto > 0 ? "#FF6B00" : dynSub }]}>
                    {totalAuto > 0 ? `${fmtNum(totalAuto)} FCFA` : "—"}
                  </Text>
                  <View style={[m.autoPill, { backgroundColor: "#FF6B0018" }]}>
                    <Ionicons name="flash" size={10} color="#FF6B00" />
                    <Text style={m.autoPillText}>Auto</Text>
                  </View>
                </View>
              ) : (
                <View style={[m.manualTotalWrap, { backgroundColor: dynInput, borderColor: dynBorder }]}>
                  <TextInput
                    style={[m.manualTotalInput, { color: dynText }]}
                    placeholder="Saisir le total..."
                    placeholderTextColor={dynSub}
                    keyboardType="numeric"
                    value={totalManuel}
                    onChangeText={setTotalManuel}
                  />
                  <Text style={[m.prixUnit, { color: dynSub }]}>FCFA</Text>
                </View>
              )}
            </View>

            {/* ── Confirmer ── */}
            {hasTotal && (
              <TouchableOpacity style={m.confirmBtn} onPress={handleConfirm} activeOpacity={0.85}>
                <Ionicons name="checkmark-circle-outline" size={16} color="#fff" />
                <Text style={m.confirmBtnText}>Confirmer et appliquer</Text>
              </TouchableOpacity>
            )}

            <View style={{ height: 8 }} />
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const m = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    alignSelf: "center", marginTop: 10, marginBottom: 6,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  title: {
    fontFamily: "Poppins_700Bold",
    fontSize: 15,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    gap: 2,
  },
  toggleLabel: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 11,
  },
  addBtn: {
    width: 34, height: 34, borderRadius: 17,
    alignItems: "center", justifyContent: "center",
    borderWidth: 1,
  },
  rowWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    padding: 10,
  },
  rowLeft: {
    width: 20,
    alignItems: "center",
  },
  rowNum: {
    fontFamily: "Poppins_700Bold",
    fontSize: 11,
  },
  rowFields: {
    flex: 1,
    gap: 6,
  },
  descInput: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 7,
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
  },
  prixWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 7,
    gap: 6,
  },
  prixInput: {
    flex: 1,
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12,
    padding: 0,
  },
  prixUnit: {
    fontFamily: "Poppins_500Medium",
    fontSize: 11,
  },
  removeBtn: {
    width: 28, height: 28, borderRadius: 14,
    alignItems: "center", justifyContent: "center",
  },
  totalSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: 14,
    marginTop: 4,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  totalLabel: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
  },
  totalAutoVal: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  totalAutoText: {
    fontFamily: "Poppins_700Bold",
    fontSize: 16,
  },
  autoPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  autoPillText: {
    color: "#FF6B00",
    fontFamily: "Poppins_600SemiBold",
    fontSize: 9,
  },
  manualTotalWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 6,
    flex: 1,
  },
  manualTotalInput: {
    flex: 1,
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
    padding: 0,
  },
  confirmBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginHorizontal: 14,
    marginTop: 12,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: "#22C55E",
  },
  confirmBtnText: {
    color: "#fff",
    fontFamily: "Poppins_700Bold",
    fontSize: 14,
  },
});
