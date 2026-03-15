import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/contexts/ThemeContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

interface Address {
  id: number;
  address_name: string | null;
  recipient_name: string;
  phone: string;
  address_line1: string;
  address_line2: string | null;
  city: string;
  region: string | null;
  postal_code: string | null;
  country_id: number;
  is_default: number;
}

const EMPTY_FORM = {
  address_name: "",
  recipient_name: "",
  phone: "",
  address_line1: "",
  address_line2: "",
  city: "",
  region: "",
  postal_code: "",
  country_id: 1,
  is_default: false,
};

export default function AddressesScreen() {
  const qc = useQueryClient();
  const { colors } = useTheme();
  const { t } = useLanguage();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["/api/users/me/addresses"],
  });

  const addresses: Address[] = Array.isArray(data) ? data : [];

  const addMutation = useMutation({
    mutationFn: (data: typeof EMPTY_FORM) =>
      api.users.addAddress({
        ...data,
        is_default: data.is_default ? 1 : 0,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/users/me/addresses"] });
      resetForm();
    },
    onError: (e: any) => showAlert(t.common.error, e?.message || t.common.error),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: typeof EMPTY_FORM }) =>
      api.users.updateAddress(id, {
        ...data,
        is_default: data.is_default ? 1 : 0,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/users/me/addresses"] });
      resetForm();
    },
    onError: (e: any) => showAlert(t.common.error, e?.message || t.common.error),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.users.deleteAddress(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/users/me/addresses"] });
    },
    onError: (e: any) => showAlert(t.common.error, e?.message || t.common.error),
  });

  function showAlert(title: string, msg: string) {
    if (Platform.OS === "web") {
      alert(`${title}: ${msg}`);
    } else {
      Alert.alert(title, msg);
    }
  }

  function resetForm() {
    setForm(EMPTY_FORM);
    setShowForm(false);
    setEditingId(null);
  }

  function startEdit(addr: Address) {
    setForm({
      address_name: addr.address_name || "",
      recipient_name: addr.recipient_name,
      phone: addr.phone,
      address_line1: addr.address_line1,
      address_line2: addr.address_line2 || "",
      city: addr.city,
      region: addr.region || "",
      postal_code: addr.postal_code || "",
      country_id: addr.country_id,
      is_default: !!addr.is_default,
    });
    setEditingId(addr.id);
    setShowForm(true);
  }

  function handleDelete(id: number) {
    if (Platform.OS === "web") {
      if (confirm(t.addresses.deleteAddress + "?")) deleteMutation.mutate(id);
    } else {
      Alert.alert(t.common.delete, t.addresses.deleteAddress + "?", [
        { text: t.common.cancel, style: "cancel" },
        { text: t.common.delete, style: "destructive", onPress: () => deleteMutation.mutate(id) },
      ]);
    }
  }

  function handleSubmit() {
    if (!form.recipient_name.trim() || !form.phone.trim() || !form.address_line1.trim() || !form.city.trim()) {
      showAlert(t.common.error, t.common.error);
      return;
    }
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: form });
    } else {
      addMutation.mutate(form);
    }
  }

  const isSaving = addMutation.isPending || updateMutation.isPending;

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      {!showForm && (
        <TouchableOpacity style={[styles.addBtn, { backgroundColor: colors.backgroundCard, borderColor: colors.border }]} onPress={() => { resetForm(); setShowForm(true); }}>
          <Ionicons name="add-circle" size={22} color={colors.primary} />
          <Text style={[styles.addBtnText, { color: colors.primary }]}>{t.addresses.addAddress}</Text>
        </TouchableOpacity>
      )}

      {showForm && (
        <View style={[styles.formCard, { backgroundColor: colors.backgroundCard }]}>
          <Text style={[styles.formTitle, { color: colors.text }]}>{editingId ? t.addresses.editAddress : t.addresses.addAddress}</Text>

          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>{t.addresses.label}</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
            value={form.address_name}
            onChangeText={(txt) => setForm((p) => ({ ...p, address_name: txt }))}
            placeholder={`${t.addresses.home}, ${t.addresses.work}`}
            placeholderTextColor={colors.textMuted}
          />

          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>{t.auth.fullName} *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
            value={form.recipient_name}
            onChangeText={(txt) => setForm((p) => ({ ...p, recipient_name: txt }))}
            placeholder={t.auth.namePlaceholder}
            placeholderTextColor={colors.textMuted}
          />

          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>{t.addresses.phone} *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
            value={form.phone}
            onChangeText={(txt) => setForm((p) => ({ ...p, phone: txt }))}
            placeholder={t.auth.phonePlaceholder}
            placeholderTextColor={colors.textMuted}
            keyboardType="phone-pad"
          />

          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>{t.addresses.street} *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
            value={form.address_line1}
            onChangeText={(txt) => setForm((p) => ({ ...p, address_line1: txt }))}
            placeholder={t.addresses.street}
            placeholderTextColor={colors.textMuted}
          />

          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>{t.addresses.street}</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
            value={form.address_line2}
            onChangeText={(txt) => setForm((p) => ({ ...p, address_line2: txt }))}
            placeholder={t.addresses.other}
            placeholderTextColor={colors.textMuted}
          />

          <View style={styles.row}>
            <View style={styles.halfField}>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>{t.addresses.city} *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                value={form.city}
                onChangeText={(txt) => setForm((p) => ({ ...p, city: txt }))}
                placeholder={t.addresses.city}
                placeholderTextColor={colors.textMuted}
              />
            </View>
            <View style={styles.halfField}>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>{t.addresses.state}</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                value={form.region}
                onChangeText={(txt) => setForm((p) => ({ ...p, region: txt }))}
                placeholder={t.addresses.state}
                placeholderTextColor={colors.textMuted}
              />
            </View>
          </View>

          <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>{t.addresses.zipCode}</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
            value={form.postal_code}
            onChangeText={(txt) => setForm((p) => ({ ...p, postal_code: txt }))}
            placeholder={t.addresses.zipCode}
            placeholderTextColor={colors.textMuted}
            keyboardType="number-pad"
          />

          <TouchableOpacity
            style={styles.defaultRow}
            onPress={() => setForm((p) => ({ ...p, is_default: !p.is_default }))}
          >
            <Ionicons
              name={form.is_default ? "checkbox" : "square-outline"}
              size={22}
              color={form.is_default ? colors.primary : colors.textMuted}
            />
            <Text style={[styles.defaultText, { color: colors.text }]}>{t.addresses.defaultAddress}</Text>
          </TouchableOpacity>

          <View style={styles.formActions}>
            <TouchableOpacity style={[styles.cancelBtn, { borderColor: colors.border }]} onPress={resetForm}>
              <Text style={[styles.cancelBtnText, { color: colors.textSecondary }]}>{t.common.cancel}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: colors.primary }, isSaving && { opacity: 0.7 }]}
              onPress={handleSubmit}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.saveBtnText}>{editingId ? t.common.edit : t.common.add}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}

      {addresses.length === 0 && !showForm && (
        <View style={styles.emptyState}>
          <Ionicons name="location-outline" size={48} color={colors.textMuted} />
          <Text style={[styles.emptyText, { color: colors.text }]}>{t.addresses.noAddresses}</Text>
          <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>{t.addresses.addAddress}</Text>
        </View>
      )}

      {addresses.map((addr) => (
        <View key={addr.id} style={[styles.addressCard, { backgroundColor: colors.backgroundCard }]}>
          <View style={styles.addressHeader}>
            <View style={styles.addressTitleRow}>
              <Ionicons name="location" size={18} color={colors.primary} />
              <Text style={[styles.addressName, { color: colors.text }]}>
                {addr.address_name || addr.city}
              </Text>
              {!!addr.is_default && (
                <View style={styles.defaultBadge}>
                  <Text style={[styles.defaultBadgeText, { color: colors.primary }]}>{t.addresses.defaultAddress}</Text>
                </View>
              )}
            </View>
            <View style={styles.addressActions}>
              <TouchableOpacity onPress={() => startEdit(addr)}>
                <Ionicons name="create-outline" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDelete(addr.id)}>
                <Ionicons name="trash-outline" size={20} color={colors.error} />
              </TouchableOpacity>
            </View>
          </View>
          <Text style={[styles.addressDetail, { color: colors.textSecondary }]}>{addr.recipient_name}</Text>
          <Text style={[styles.addressDetail, { color: colors.textSecondary }]}>{addr.phone}</Text>
          <Text style={[styles.addressDetail, { color: colors.textSecondary }]}>
            {addr.address_line1}
            {addr.address_line2 ? `, ${addr.address_line2}` : ""}
          </Text>
          <Text style={[styles.addressDetail, { color: colors.textSecondary }]}>
            {addr.city}
            {addr.region ? `, ${addr.region}` : ""}
            {addr.postal_code ? ` ${addr.postal_code}` : ""}
          </Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderStyle: "dashed",
  },
  addBtnText: {
    fontSize: 15,
    fontFamily: "Poppins_500Medium",
  },
  formCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  formTitle: {
    fontSize: 17,
    fontFamily: "Poppins_600SemiBold",
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 13,
    fontFamily: "Poppins_500Medium",
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    height: 46,
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  halfField: {
    flex: 1,
  },
  defaultRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 16,
  },
  defaultText: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
  },
  formActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 20,
  },
  cancelBtn: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelBtnText: {
    fontSize: 14,
    fontFamily: "Poppins_500Medium",
  },
  saveBtn: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  saveBtnText: {
    fontSize: 14,
    fontFamily: "Poppins_600SemiBold",
    color: "#fff",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 13,
    fontFamily: "Poppins_400Regular",
    marginTop: 6,
  },
  addressCard: {
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
  },
  addressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  addressTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
  },
  addressName: {
    fontSize: 15,
    fontFamily: "Poppins_600SemiBold",
  },
  defaultBadge: {
    backgroundColor: "rgba(255,107,0,0.15)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 6,
  },
  defaultBadgeText: {
    fontSize: 10,
    fontFamily: "Poppins_500Medium",
  },
  addressActions: {
    flexDirection: "row",
    gap: 14,
  },
  addressDetail: {
    fontSize: 13,
    fontFamily: "Poppins_400Regular",
    lineHeight: 20,
  },
});
