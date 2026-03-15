import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Colors } from "@/constants/colors";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, CartData, ShippingAddress } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/contexts/ThemeContext";
import { useLanguage } from "@/contexts/LanguageContext";

type CheckoutStep = "address" | "payment" | "confirm" | "success";

function getFirstImage(images: string): string | null {
  try {
    const parsed = JSON.parse(images);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed[0];
  } catch {}
  if (images && images.startsWith("http")) return images;
  return null;
}

function formatPrice(amount: number): string {
  return Math.round(amount).toLocaleString("fr-FR");
}

function AddressForm({
  onSave,
  saving,
}: {
  onSave: (data: Partial<ShippingAddress>) => void;
  saving: boolean;
}) {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const [recipientName, setRecipientName] = useState("");
  const [phone, setPhone] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [city, setCity] = useState("");
  const [region, setRegion] = useState("");

  const { user } = useAuth();

  const handleSubmit = () => {
    if (!recipientName.trim() || !phone.trim() || !addressLine1.trim() || !city.trim()) {
      Alert.alert(t.common.error, t.checkout.fillRequired);
      return;
    }
    onSave({
      recipient_name: recipientName.trim(),
      phone: phone.trim(),
      address_line1: addressLine1.trim(),
      city: city.trim(),
      region: region.trim(),
      country_id: user?.country_id || 1,
      is_default: 1,
    });
  };

  return (
    <View style={styles.formContainer}>
      <Text style={[styles.formLabel, { color: colors.textSecondary }]}>{t.checkout.recipientName} *</Text>
      <TextInput
        style={[styles.formInput, { backgroundColor: colors.backgroundCard, borderColor: colors.border, color: colors.text }]}
        value={recipientName}
        onChangeText={setRecipientName}
        placeholder={t.checkout.fullNamePlaceholder}
        placeholderTextColor={colors.textMuted}
      />
      <Text style={[styles.formLabel, { color: colors.textSecondary }]}>{t.checkout.phone} *</Text>
      <TextInput
        style={[styles.formInput, { backgroundColor: colors.backgroundCard, borderColor: colors.border, color: colors.text }]}
        value={phone}
        onChangeText={setPhone}
        placeholder={t.checkout.phonePlaceholder}
        placeholderTextColor={colors.textMuted}
        keyboardType="phone-pad"
      />
      <Text style={[styles.formLabel, { color: colors.textSecondary }]}>{t.checkout.address} *</Text>
      <TextInput
        style={[styles.formInput, { backgroundColor: colors.backgroundCard, borderColor: colors.border, color: colors.text }]}
        value={addressLine1}
        onChangeText={setAddressLine1}
        placeholder={t.checkout.addressPlaceholder}
        placeholderTextColor={colors.textMuted}
      />
      <Text style={[styles.formLabel, { color: colors.textSecondary }]}>{t.checkout.city} *</Text>
      <TextInput
        style={[styles.formInput, { backgroundColor: colors.backgroundCard, borderColor: colors.border, color: colors.text }]}
        value={city}
        onChangeText={setCity}
        placeholder={t.checkout.cityPlaceholder}
        placeholderTextColor={colors.textMuted}
      />
      <Text style={[styles.formLabel, { color: colors.textSecondary }]}>{t.checkout.region}</Text>
      <TextInput
        style={[styles.formInput, { backgroundColor: colors.backgroundCard, borderColor: colors.border, color: colors.text }]}
        value={region}
        onChangeText={setRegion}
        placeholder={t.checkout.regionPlaceholder}
        placeholderTextColor={colors.textMuted}
      />
      <TouchableOpacity
        style={[styles.primaryBtn, { backgroundColor: colors.primary }, saving && { opacity: 0.6 }]}
        onPress={handleSubmit}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={styles.primaryBtnText}>{t.checkout.saveAddress}</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

export default function CheckoutScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { t } = useLanguage();
  const qc = useQueryClient();
  const { isAuthenticated } = useAuth();
  const [step, setStep] = useState<CheckoutStep>("address");
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<string>("mobile_money");

  const { data: cartData, isLoading: cartLoading } = useQuery<CartData>({
    queryKey: ["/api/cart"],
    enabled: isAuthenticated,
    queryFn: () => api.cart.get(),
  });

  const { data: addresses, isLoading: addressesLoading, refetch: refetchAddresses } = useQuery<ShippingAddress[]>({
    queryKey: ["/api/shipping-addresses"],
    enabled: isAuthenticated,
    queryFn: () => api.shippingAddresses.list(),
  });

  const createAddressMutation = useMutation({
    mutationFn: (data: Partial<ShippingAddress>) => api.shippingAddresses.create(data),
    onSuccess: (newAddr) => {
      refetchAddresses();
      setShowAddForm(false);
      if (newAddr && typeof newAddr === "object" && "id" in newAddr) {
        setSelectedAddressId((newAddr as ShippingAddress).id);
      }
    },
    onError: (err: Error) => {
      Alert.alert(t.common.error, err.message);
    },
  });

  const checkoutMutation = useMutation({
    mutationFn: (addressId: number) => api.checkout.process(addressId),
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      qc.invalidateQueries({ queryKey: ["/api/cart"] });
      qc.invalidateQueries({ queryKey: ["/api/orders"] });
      setStep("success");
    },
    onError: (err: Error) => {
      Alert.alert(t.common.error, err.message || t.checkout.processing);
    },
  });

  const items = cartData?.items || [];
  const totalAmount = cartData?.total_amount || 0;
  const sellerAmount = totalAmount * 0.80;
  const platformFee = totalAmount * 0.10;
  const deliveryFee = totalAmount * 0.10;

  const selectedAddress = addresses?.find((a) => a.id === selectedAddressId) || null;

  React.useEffect(() => {
    if (addresses && addresses.length > 0 && !selectedAddressId) {
      const defaultAddr = addresses.find((a) => a.is_default === 1);
      setSelectedAddressId(defaultAddr ? defaultAddr.id : addresses[0].id);
    }
  }, [addresses]);

  const PAYMENT_METHODS = [
    { key: "mobile_money", label: t.checkout.mobileMoney, icon: "phone-portrait-outline" as const },
    { key: "card", label: t.checkout.card, icon: "card-outline" as const },
    { key: "cash", label: t.checkout.cashOnDelivery, icon: "cash-outline" as const },
  ];

  if (cartLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  if (items.length === 0 && step !== "success") {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>{t.checkout.emptyCart}</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.centered}>
          <Ionicons name="cart-outline" size={64} color={colors.textMuted} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>{t.checkout.cartEmpty}</Text>
          <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: colors.primary }]} onPress={() => router.replace("/(tabs)")}>
            <Text style={styles.primaryBtnText}>{t.cart.continueShopping}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (step === "success") {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <View style={styles.centered}>
          <View style={styles.successCircle}>
            <Ionicons name="checkmark" size={48} color="#fff" />
          </View>
          <Text style={[styles.successTitle, { color: colors.text }]}>{t.checkout.orderPlaced}</Text>
          <Text style={[styles.successSubtitle, { color: colors.textSecondary }]}>
            {t.checkout.orderPlacedDesc}
          </Text>
          <View style={[styles.splitSummary, { backgroundColor: colors.backgroundCard, borderColor: colors.border }]}>
            <View style={styles.splitRow}>
              <Text style={[styles.splitLabel, { color: colors.textMuted }]}>{t.checkout.sellerFee}</Text>
              <Text style={[styles.splitValue, { color: colors.textSecondary }]}>{formatPrice(sellerAmount)} FCFA</Text>
            </View>
            <View style={styles.splitRow}>
              <Text style={[styles.splitLabel, { color: colors.textMuted }]}>{t.checkout.platformFee}</Text>
              <Text style={[styles.splitValue, { color: colors.textSecondary }]}>{formatPrice(platformFee)} FCFA</Text>
            </View>
            <View style={styles.splitRow}>
              <Text style={[styles.splitLabel, { color: colors.textMuted }]}>{t.checkout.deliveryFee}</Text>
              <Text style={[styles.splitValue, { color: colors.textSecondary }]}>{formatPrice(deliveryFee)} FCFA</Text>
            </View>
            <View style={[styles.splitRow, styles.splitTotal, { borderTopColor: colors.border }]}>
              <Text style={[styles.splitTotalLabel, { color: colors.text }]}>{t.checkout.total}</Text>
              <Text style={[styles.splitTotalValue, { color: colors.primary }]}>{formatPrice(totalAmount)} FCFA</Text>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
            onPress={() => {
              router.replace("/(tabs)/panier");
            }}
          >
            <Text style={styles.primaryBtnText}>{t.checkout.trackOrders}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.secondaryBtn, { borderColor: colors.border }]}
            onPress={() => router.replace("/(tabs)")}
          >
            <Text style={[styles.secondaryBtnText, { color: colors.textSecondary }]}>{t.cart.continueShopping}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => {
          if (step === "confirm") setStep("payment");
          else if (step === "payment") setStep("address");
          else router.back();
        }}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {step === "address" ? t.checkout.shippingAddress : step === "payment" ? t.checkout.payment : t.checkout.confirmation}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.stepsIndicator}>
        {["address", "payment", "confirm"].map((s, i) => (
          <React.Fragment key={s}>
            <View style={[
              styles.stepDot,
              { backgroundColor: colors.surface, borderColor: colors.border },
              (step === s || ["address", "payment", "confirm"].indexOf(step) >= i) && { backgroundColor: colors.primary, borderColor: colors.primary },
            ]}>
              <Text style={[
                styles.stepDotText,
                { color: colors.textMuted },
                (step === s || ["address", "payment", "confirm"].indexOf(step) >= i) && styles.stepDotTextActive,
              ]}>
                {i + 1}
              </Text>
            </View>
            {i < 2 && (
              <View style={[
                styles.stepLine,
                { backgroundColor: colors.border },
                ["address", "payment", "confirm"].indexOf(step) > i && { backgroundColor: colors.primary },
              ]} />
            )}
          </React.Fragment>
        ))}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {step === "address" && (
          <View style={styles.stepContent}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t.checkout.chooseAddress}</Text>

            {addressesLoading ? (
              <ActivityIndicator color={colors.primary} style={{ marginTop: 20 }} />
            ) : (
              <>
                {(addresses || []).map((addr) => (
                  <TouchableOpacity
                    key={addr.id}
                    style={[
                      styles.addressCard,
                      { backgroundColor: colors.backgroundCard, borderColor: colors.border },
                      selectedAddressId === addr.id && { borderColor: colors.primary },
                    ]}
                    onPress={() => {
                      setSelectedAddressId(addr.id);
                      Haptics.selectionAsync();
                    }}
                  >
                    <View style={styles.addressRadio}>
                      <View style={[styles.radioOuter, { borderColor: colors.border }, selectedAddressId === addr.id && { borderColor: colors.primary }]}>
                        {selectedAddressId === addr.id && <View style={[styles.radioInner, { backgroundColor: colors.primary }]} />}
                      </View>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.addressName, { color: colors.text }]}>{addr.recipient_name}</Text>
                      <Text style={[styles.addressDetail, { color: colors.textSecondary }]}>{addr.address_line1}</Text>
                      <Text style={[styles.addressDetail, { color: colors.textSecondary }]}>{addr.city}{addr.region ? `, ${addr.region}` : ""}</Text>
                      <Text style={[styles.addressPhone, { color: colors.textMuted }]}>{addr.phone}</Text>
                    </View>
                    {addr.is_default === 1 && (
                      <View style={[styles.defaultBadge, { backgroundColor: colors.primary + "20" }]}>
                        <Text style={[styles.defaultBadgeText, { color: colors.primary }]}>{t.checkout.defaultLabel}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}

                {!showAddForm ? (
                  <TouchableOpacity
                    style={[styles.addAddressBtn, { borderColor: colors.border }]}
                    onPress={() => setShowAddForm(true)}
                  >
                    <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
                    <Text style={[styles.addAddressBtnText, { color: colors.primary }]}>{t.checkout.addNewAddress}</Text>
                  </TouchableOpacity>
                ) : (
                  <AddressForm
                    onSave={(data) => createAddressMutation.mutate(data)}
                    saving={createAddressMutation.isPending}
                  />
                )}
              </>
            )}
          </View>
        )}

        {step === "payment" && (
          <View style={styles.stepContent}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t.checkout.paymentMethod}</Text>
            {PAYMENT_METHODS.map((pm) => (
              <TouchableOpacity
                key={pm.key}
                style={[
                  styles.paymentCard,
                  { backgroundColor: colors.backgroundCard, borderColor: colors.border },
                  paymentMethod === pm.key && { borderColor: colors.primary },
                ]}
                onPress={() => {
                  setPaymentMethod(pm.key);
                  Haptics.selectionAsync();
                }}
              >
                <View style={[styles.paymentIcon, { backgroundColor: colors.surface }]}>
                  <Ionicons name={pm.icon} size={22} color={paymentMethod === pm.key ? colors.primary : colors.textMuted} />
                </View>
                <Text style={[styles.paymentLabel, { color: colors.textSecondary }, paymentMethod === pm.key && { color: colors.text }]}>
                  {pm.label}
                </Text>
                <View style={[styles.radioOuter, { borderColor: colors.border }, paymentMethod === pm.key && { borderColor: colors.primary }]}>
                  {paymentMethod === pm.key && <View style={[styles.radioInner, { backgroundColor: colors.primary }]} />}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {step === "confirm" && (
          <View style={styles.stepContent}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t.checkout.orderSummary}</Text>

            {selectedAddress && (
              <View style={[styles.confirmSection, { backgroundColor: colors.backgroundCard, borderColor: colors.border }]}>
                <View style={styles.confirmSectionHeader}>
                  <Ionicons name="location-outline" size={16} color={colors.primary} />
                  <Text style={[styles.confirmSectionTitle, { color: colors.text }]}>{t.checkout.delivery}</Text>
                </View>
                <Text style={[styles.confirmDetail, { color: colors.textSecondary }]}>{selectedAddress.recipient_name}</Text>
                <Text style={[styles.confirmDetail, { color: colors.textSecondary }]}>{selectedAddress.address_line1}</Text>
                <Text style={[styles.confirmDetail, { color: colors.textSecondary }]}>{selectedAddress.city}</Text>
                <Text style={[styles.confirmDetail, { color: colors.textSecondary }]}>{selectedAddress.phone}</Text>
              </View>
            )}

            <View style={[styles.confirmSection, { backgroundColor: colors.backgroundCard, borderColor: colors.border }]}>
              <View style={styles.confirmSectionHeader}>
                <Ionicons name="card-outline" size={16} color={colors.primary} />
                <Text style={[styles.confirmSectionTitle, { color: colors.text }]}>{t.checkout.payment}</Text>
              </View>
              <Text style={[styles.confirmDetail, { color: colors.textSecondary }]}>
                {PAYMENT_METHODS.find((p) => p.key === paymentMethod)?.label}
              </Text>
            </View>

            <View style={[styles.confirmSection, { backgroundColor: colors.backgroundCard, borderColor: colors.border }]}>
              <View style={styles.confirmSectionHeader}>
                <Ionicons name="bag-outline" size={16} color={colors.primary} />
                <Text style={[styles.confirmSectionTitle, { color: colors.text }]}>{t.checkout.items} ({items.length})</Text>
              </View>
              {items.map((item) => {
                const imageUrl = getFirstImage(item.images);
                return (
                  <View key={item.product_id} style={[styles.confirmItem, { borderTopColor: colors.border }]}>
                    <View style={[styles.confirmItemImage, { backgroundColor: colors.surface }]}>
                      {imageUrl ? (
                        <Image source={{ uri: imageUrl }} style={{ width: 40, height: 40, borderRadius: 8 }} contentFit="cover" />
                      ) : (
                        <Ionicons name="bag-handle" size={18} color={colors.primary} />
                      )}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.confirmItemName, { color: colors.text }]} numberOfLines={1}>{item.product_name}</Text>
                      <Text style={[styles.confirmItemQty, { color: colors.textMuted }]}>x{item.quantity}</Text>
                    </View>
                    <Text style={[styles.confirmItemPrice, { color: colors.primary }]}>{formatPrice(item.price * item.quantity)} FCFA</Text>
                  </View>
                );
              })}
            </View>

            <View style={[styles.splitSummary, { backgroundColor: colors.backgroundCard, borderColor: colors.border }]}>
              <View style={styles.splitRow}>
                <Text style={[styles.splitLabel, { color: colors.textMuted }]}>{t.checkout.subtotal}</Text>
                <Text style={[styles.splitValue, { color: colors.textSecondary }]}>{formatPrice(totalAmount)} FCFA</Text>
              </View>
              <View style={styles.splitRow}>
                <Text style={[styles.splitLabel, { color: colors.textMuted }]}>{t.checkout.sellerFee}</Text>
                <Text style={[styles.splitValue, { color: colors.textSecondary }]}>{formatPrice(sellerAmount)} FCFA</Text>
              </View>
              <View style={styles.splitRow}>
                <Text style={[styles.splitLabel, { color: colors.textMuted }]}>{t.checkout.platformFee}</Text>
                <Text style={[styles.splitValue, { color: colors.textSecondary }]}>{formatPrice(platformFee)} FCFA</Text>
              </View>
              <View style={styles.splitRow}>
                <Text style={[styles.splitLabel, { color: colors.textMuted }]}>{t.checkout.deliveryFee}</Text>
                <Text style={[styles.splitValue, { color: colors.textSecondary }]}>{formatPrice(deliveryFee)} FCFA</Text>
              </View>
              <View style={[styles.splitRow, styles.splitTotal, { borderTopColor: colors.border }]}>
                <Text style={[styles.splitTotalLabel, { color: colors.text }]}>{t.checkout.total}</Text>
                <Text style={[styles.splitTotalValue, { color: colors.primary }]}>{formatPrice(totalAmount)} FCFA</Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      <View style={[styles.bottomBar, { backgroundColor: colors.backgroundCard, borderTopColor: colors.border, paddingBottom: Math.max(insets.bottom, Platform.OS === "web" ? 34 : 16) }]}>
        {step === "address" && (
          <TouchableOpacity
            style={[styles.primaryBtn, styles.fullWidthBtn, { backgroundColor: colors.primary }, !selectedAddressId && { opacity: 0.5 }]}
            disabled={!selectedAddressId}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setStep("payment");
            }}
          >
            <Text style={styles.primaryBtnText}>{t.checkout.continueToPayment}</Text>
            <Ionicons name="arrow-forward" size={16} color="#fff" />
          </TouchableOpacity>
        )}
        {step === "payment" && (
          <TouchableOpacity
            style={[styles.primaryBtn, styles.fullWidthBtn, { backgroundColor: colors.primary }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setStep("confirm");
            }}
          >
            <Text style={styles.primaryBtnText}>{t.checkout.reviewOrder}</Text>
            <Ionicons name="arrow-forward" size={16} color="#fff" />
          </TouchableOpacity>
        )}
        {step === "confirm" && (
          <TouchableOpacity
            style={[styles.primaryBtn, styles.fullWidthBtn, { backgroundColor: colors.primary }, checkoutMutation.isPending && { opacity: 0.6 }]}
            disabled={checkoutMutation.isPending}
            onPress={() => {
              if (!selectedAddressId) return;
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
              checkoutMutation.mutate(selectedAddressId);
            }}
          >
            {checkoutMutation.isPending ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Text style={styles.primaryBtnText}>{t.common.confirm} - {formatPrice(totalAmount)} FCFA</Text>
                <Ionicons name="checkmark-circle" size={18} color="#fff" />
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 16 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: { color: Colors.text, fontFamily: "Poppins_700Bold", fontSize: 16 },
  stepsIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 40,
  },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: Colors.border,
  },
  stepDotText: { color: Colors.textMuted, fontFamily: "Poppins_700Bold", fontSize: 12 },
  stepDotTextActive: { color: "#fff" },
  stepLine: { flex: 1, height: 2, backgroundColor: Colors.border, marginHorizontal: 8 },
  stepContent: { padding: 16 },
  sectionTitle: { color: Colors.text, fontFamily: "Poppins_700Bold", fontSize: 16, marginBottom: 16 },
  addressCard: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: Colors.border,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  addressRadio: { justifyContent: "center" },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.primary },
  addressName: { color: Colors.text, fontFamily: "Poppins_600SemiBold", fontSize: 14, marginBottom: 2 },
  addressDetail: { color: Colors.textSecondary, fontFamily: "Poppins_400Regular", fontSize: 12 },
  addressPhone: { color: Colors.textMuted, fontFamily: "Poppins_400Regular", fontSize: 11, marginTop: 4 },
  defaultBadge: {
    backgroundColor: Colors.primary + "20",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  defaultBadgeText: { color: Colors.primary, fontFamily: "Poppins_600SemiBold", fontSize: 9 },
  addAddressBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 14,
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: "dashed",
    borderRadius: 14,
    marginTop: 4,
  },
  addAddressBtnText: { color: Colors.primary, fontFamily: "Poppins_600SemiBold", fontSize: 13 },
  formContainer: { marginTop: 12, gap: 8 },
  formLabel: { color: Colors.textSecondary, fontFamily: "Poppins_500Medium", fontSize: 12, marginTop: 4 },
  formInput: {
    backgroundColor: Colors.backgroundCard,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: Colors.text,
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
  },
  paymentCard: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: Colors.border,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  paymentIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  paymentLabel: { flex: 1, color: Colors.textSecondary, fontFamily: "Poppins_600SemiBold", fontSize: 14 },
  confirmSection: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  confirmSectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 },
  confirmSectionTitle: { color: Colors.text, fontFamily: "Poppins_600SemiBold", fontSize: 13 },
  confirmDetail: { color: Colors.textSecondary, fontFamily: "Poppins_400Regular", fontSize: 12, lineHeight: 18 },
  confirmItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  confirmItemImage: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  confirmItemName: { color: Colors.text, fontFamily: "Poppins_500Medium", fontSize: 12 },
  confirmItemQty: { color: Colors.textMuted, fontFamily: "Poppins_400Regular", fontSize: 11 },
  confirmItemPrice: { color: Colors.primary, fontFamily: "Poppins_700Bold", fontSize: 12 },
  splitSummary: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: 4,
  },
  splitRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
  },
  splitLabel: { color: Colors.textMuted, fontFamily: "Poppins_400Regular", fontSize: 12 },
  splitValue: { color: Colors.textSecondary, fontFamily: "Poppins_500Medium", fontSize: 12 },
  splitTotal: { borderTopWidth: 1, borderTopColor: Colors.border, marginTop: 4, paddingTop: 10 },
  splitTotalLabel: { color: Colors.text, fontFamily: "Poppins_700Bold", fontSize: 14 },
  splitTotalValue: { color: Colors.primary, fontFamily: "Poppins_700Bold", fontSize: 16 },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.backgroundCard,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  primaryBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  fullWidthBtn: { width: "100%" },
  primaryBtnText: { color: "#fff", fontFamily: "Poppins_700Bold", fontSize: 14 },
  secondaryBtn: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  secondaryBtnText: { color: Colors.textSecondary, fontFamily: "Poppins_600SemiBold", fontSize: 14, textAlign: "center" as const },
  emptyTitle: { color: Colors.text, fontFamily: "Poppins_700Bold", fontSize: 18, textAlign: "center" as const },
  successCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#22C55E",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  successTitle: { color: Colors.text, fontFamily: "Poppins_700Bold", fontSize: 22 },
  successSubtitle: { color: Colors.textSecondary, fontFamily: "Poppins_400Regular", fontSize: 13, textAlign: "center" as const, lineHeight: 20 },
});
