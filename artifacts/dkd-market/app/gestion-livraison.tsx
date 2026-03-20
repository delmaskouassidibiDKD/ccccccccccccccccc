import React, { useState, useCallback } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useTheme } from "../contexts/ThemeContext";

type DeliveryStatus = "en_cours" | "livre";
type Delivery = {
  id: string; name: string; initials: string; colorHex: string;
  company: string;
  vehicle: string; vehicleColor: string; vehiclePlate?: string;
  stars: number;
  code: string; price: string; status: DeliveryStatus;
  pickupDate: string; pickupTime: string; pickupLocation: string;
  products: string[];
};

const INIT_DELIVERIES: Delivery[] = [
  {
    id: "d1", name: "Ibrahim Touré", initials: "IT", colorHex: "#3B82F6",
    company: "DKD Express",
    vehicle: "Moto", vehicleColor: "Rouge",
    stars: 4.8, code: "", price: "12 500 FCFA", status: "en_cours",
    pickupDate: "20 mars 2026", pickupTime: "10h30", pickupLocation: "Cocody Angré, Rue des Jardins, Abidjan",
    products: ["Sac Louis Vuitton × 2", "Ceinture en cuir noir", "Portefeuille marron"],
  },
  {
    id: "d2", name: "Seydou Bamba", initials: "SB", colorHex: "#22C55E",
    company: "Flash Livraison",
    vehicle: "Voiture", vehicleColor: "Blanc", vehiclePlate: "AB 1234 CI",
    stars: 4.5, code: "", price: "8 200 FCFA", status: "en_cours",
    pickupDate: "20 mars 2026", pickupTime: "14h00", pickupLocation: "Plateau Centre, Avenue Delafosse, Abidjan",
    products: ["Chaussures Nike Air × 1", "T-shirt Lacoste blanc × 3"],
  },
  {
    id: "d3", name: "Fatoumata Sy", initials: "FS", colorHex: "#EC4899",
    company: "Rapid Courses",
    vehicle: "Moto", vehicleColor: "Noir",
    stars: 4.9, code: "LIV-2841", price: "25 000 FCFA", status: "livre",
    pickupDate: "19 mars 2026", pickupTime: "09h00", pickupLocation: "Yopougon Marché, Avenue 18, Abidjan",
    products: ["Veste en cuir marron × 3", "Écharpe soie beige × 2", "Lunettes de soleil Gucci"],
  },
];

function StarRow({ stars, numColor }: { stars: number; numColor: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <Ionicons
          key={s}
          name={s <= Math.floor(stars) ? "star" : s - 0.5 <= stars ? "star-half" : "star-outline"}
          size={12}
          color="#F59E0B"
        />
      ))}
      <Text style={{ color: numColor, fontFamily: "Poppins_600SemiBold", fontSize: 11, marginLeft: 4 }}>{stars.toFixed(1)}</Text>
    </View>
  );
}

export default function GestionLivraisonPage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();

  const dBG     = isDark ? "#0D1117" : "#F0F4F8";
  const dHEAD   = isDark ? "#111827" : "#1a1f2e";
  const dCARD   = isDark ? "#161B22" : "#FFFFFF";
  const dCARD2  = isDark ? "#1C2230" : "#F3F4F6";
  const dTEXT   = isDark ? "#FFFFFF" : "#111827";
  const dSUB    = isDark ? "rgba(255,255,255,0.75)" : "#374151";
  const dMUTED  = isDark ? "rgba(255,255,255,0.45)" : "#9CA3AF";
  const dBORDER = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.08)";

  const [tab,        setTab]        = useState<DeliveryStatus>("en_cours");
  const [deliveries, setDeliveries] = useState<Delivery[]>(INIT_DELIVERIES);
  const [codes,      setCodes]      = useState<Record<string, string>>({});
  const [showTrack,  setShowTrack]  = useState<string | null>(null);
  const [showDate,   setShowDate]   = useState<Delivery | null>(null);
  const [showVehicle, setShowVehicle] = useState<Delivery | null>(null);
  const [showAvatar,  setShowAvatar]  = useState<Delivery | null>(null);
  const [showDetail,  setShowDetail]  = useState<Delivery | null>(null);
  const [confirmedPickup, setConfirmedPickup] = useState<Set<string>>(new Set());

  const enCoursCount = deliveries.filter((d) => d.status === "en_cours").length;
  const livreCount   = deliveries.filter((d) => d.status === "livre").length;
  const filtered     = deliveries.filter((d) => d.status === tab);

  const vehicleIcon = (v: string) =>
    v === "Moto" ? "bicycle-outline" : v === "Voiture" ? "car-outline" : v === "Camion" ? "bus-outline" : "walk-outline";

  return (
    <View style={[s.root, { paddingTop: insets.top, backgroundColor: dBG }]}>

      {/* HEADER */}
      <View style={[s.header, { backgroundColor: dHEAD, borderBottomColor: "rgba(255,255,255,0.08)" }]}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Gestion de la livraison</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* TABS */}
      <View style={[s.tabsRow, { backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)" }]}>
        <TouchableOpacity
          style={[s.tabBtn, tab === "en_cours" && [s.tabBtnActive, { backgroundColor: dCARD2 }]]}
          onPress={() => { Haptics.selectionAsync(); setTab("en_cours"); }}
          activeOpacity={0.8}
        >
          <Text style={[s.tabBtnText, { color: tab === "en_cours" ? dTEXT : dMUTED }]}>En cours</Text>
          {enCoursCount > 0 && (
            <View style={[s.tabBadge, { backgroundColor: "#3B82F6" }]}>
              <Text style={s.tabBadgeText}>{enCoursCount}</Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.tabBtn, tab === "livre" && [s.tabBtnActive, { backgroundColor: dCARD2 }]]}
          onPress={() => { Haptics.selectionAsync(); setTab("livre"); }}
          activeOpacity={0.8}
        >
          <Text style={[s.tabBtnText, { color: tab === "livre" ? dTEXT : dMUTED }]}>Déjà livré</Text>
          {livreCount > 0 && (
            <View style={[s.tabBadge, { backgroundColor: "#22C55E" }]}>
              <Text style={s.tabBadgeText}>{livreCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* LIST */}
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24 }}>

        {filtered.length === 0 && (
          <View style={s.emptyState}>
            <Ionicons name="bicycle-outline" size={52} color={dMUTED} />
            <Text style={[s.emptyText, { color: dMUTED }]}>
              {tab === "en_cours" ? "Aucune livraison en cours" : "Aucune livraison effectuée"}
            </Text>
          </View>
        )}

        {filtered.map((dl) => (
          <View key={dl.id} style={[s.card, { backgroundColor: dCARD, borderColor: dBORDER }]}>

            {/* LIVREUR ROW */}
            <View style={s.livreurRow}>
              {/* Avatar → tap pour agrandir */}
              <TouchableOpacity
                style={[s.avatar, { backgroundColor: dl.colorHex + "28" }]}
                onPress={() => { Haptics.selectionAsync(); setShowAvatar(dl); }}
                activeOpacity={0.75}
              >
                <Text style={[s.avatarText, { color: dl.colorHex }]}>{dl.initials}</Text>
              </TouchableOpacity>

              <View style={s.livreurInfo}>
                <Text style={[s.livreurName, { color: dTEXT }]}>{dl.name}</Text>
                <StarRow stars={dl.stars} numColor="#F59E0B" />
                {/* Société de livraison — bien visible */}
                <View style={s.companyRow}>
                  <Ionicons name="business-outline" size={12} color={dl.colorHex} />
                  <Text style={[s.companyText, { color: dl.colorHex }]}>{dl.company}</Text>
                </View>
              </View>

              {/* Bouton véhicule → tap pour infos */}
              <TouchableOpacity
                style={[s.vehicleTag, { backgroundColor: dl.colorHex + "18", borderColor: dl.colorHex + "55" }]}
                onPress={() => { Haptics.selectionAsync(); setShowVehicle(dl); }}
                activeOpacity={0.75}
              >
                <Ionicons name={vehicleIcon(dl.vehicle) as any} size={15} color={dl.colorHex} />
                <Text style={[s.vehicleText, { color: dl.colorHex }]}>{dl.vehicle}</Text>
              </TouchableOpacity>
            </View>

            {/* CODE */}
            {tab === "en_cours" && (
              confirmedPickup.has(dl.id) ? (
                <View style={[s.codeRow, { backgroundColor: isDark ? "#FF6B0012" : "#FFF4EC", borderColor: "#FF6B0030" }]}>
                  <Ionicons name="checkmark-circle" size={17} color="#FF6B00" />
                  <Text style={{ color: "#FF6B00", fontFamily: "Poppins_700Bold", fontSize: 13 }}>Colis récupéré</Text>
                </View>
              ) : (
                <View style={[s.codeRow, { backgroundColor: isDark ? "#0D1117" : "#F9FAFB" }]}>
                  <Ionicons name="key-outline" size={15} color="#F59E0B" />
                  <TextInput
                    style={[s.codeInput, { color: dTEXT }]}
                    placeholder="Code de livraison du livreur..."
                    placeholderTextColor={dMUTED}
                    value={codes[dl.id] ?? dl.code}
                    onChangeText={(v) => setCodes((prev) => ({ ...prev, [dl.id]: v }))}
                    maxLength={12}
                  />
                </View>
              )
            )}

            {/* ACTIONS */}
            <View style={s.actionsRow}>
              <TouchableOpacity
                style={[s.actionGhost, { backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)", borderColor: dBORDER }]}
                onPress={() => { Haptics.selectionAsync(); setShowDetail(dl); }}
                activeOpacity={0.75}
              >
                <Ionicons name="eye-outline" size={15} color={dSUB} />
                <Text style={[s.actionGhostText, { color: dSUB }]}>Voir</Text>
              </TouchableOpacity>

              {tab === "en_cours" && (
                <>
                  <TouchableOpacity
                    style={[s.actionColor, { backgroundColor: "#3B82F618", borderColor: "#3B82F640" }]}
                    onPress={() => { Haptics.selectionAsync(); setShowTrack(dl.name); }}
                    activeOpacity={0.75}
                  >
                    <Ionicons name="navigate-outline" size={15} color="#3B82F6" />
                    <Text style={[s.actionColorText, { color: "#3B82F6" }]}>Suivre</Text>
                  </TouchableOpacity>

                  {/* Bouton Date */}
                  <TouchableOpacity
                    style={[s.actionColor, { backgroundColor: "#8B5CF618", borderColor: "#8B5CF640" }]}
                    onPress={() => { Haptics.selectionAsync(); setShowDate(dl); }}
                    activeOpacity={0.75}
                  >
                    <Ionicons name="calendar-outline" size={15} color="#8B5CF6" />
                    <Text style={[s.actionColorText, { color: "#8B5CF6" }]}>Date</Text>
                  </TouchableOpacity>

                  {/* Bouton Confirmer — actif dès 8 caractères dans le code */}
                  {!confirmedPickup.has(dl.id) && (() => {
                    const codeVal = codes[dl.id] ?? dl.code;
                    const isActive = codeVal.length >= 8;
                    return (
                      <TouchableOpacity
                        style={[s.actionColor, isActive
                          ? { backgroundColor: "#FF6B00", borderColor: "#FF6B00" }
                          : { backgroundColor: isDark ? "rgba(255,107,0,0.08)" : "rgba(255,107,0,0.06)", borderColor: "rgba(255,107,0,0.2)" }
                        ]}
                        onPress={() => {
                          if (!isActive) return;
                          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                          setConfirmedPickup((prev) => new Set([...prev, dl.id]));
                        }}
                        activeOpacity={isActive ? 0.8 : 1}
                      >
                        <Ionicons name="checkmark-circle-outline" size={15} color={isActive ? "#fff" : "rgba(255,107,0,0.35)"} />
                        <Text style={[s.actionColorText, { color: isActive ? "#fff" : "rgba(255,107,0,0.35)" }]}>Confirmer</Text>
                      </TouchableOpacity>
                    );
                  })()}
                </>
              )}

              {tab === "livre" && (
                <View style={s.livreBadge}>
                  <Ionicons name="checkmark-circle" size={15} color="#22C55E" />
                  <Text style={s.livreBadgeText}>Livraison effectuée</Text>
                </View>
              )}
            </View>
          </View>
        ))}
      </ScrollView>

      {/* ── MODAL SUIVI ── */}
      <Modal visible={!!showTrack} animationType="fade" transparent statusBarTranslucent onRequestClose={() => setShowTrack(null)}>
        <View style={m.overlay}>
          <View style={[m.box, { backgroundColor: isDark ? "#161B22" : "#FFFFFF" }]}>
            <View style={m.mHeader}>
              <Ionicons name="navigate-circle-outline" size={28} color="#3B82F6" />
              <Text style={[m.mTitle, { color: dTEXT }]}>Suivi — {showTrack}</Text>
              <TouchableOpacity onPress={() => setShowTrack(null)} activeOpacity={0.7}>
                <Ionicons name="close" size={20} color={dMUTED} />
              </TouchableOpacity>
            </View>
            <View style={[m.mapZone, { backgroundColor: isDark ? "#0D1117" : "#F3F4F6" }]}>
              <Ionicons name="location" size={40} color="#3B82F6" />
              <Text style={[m.mapText, { color: dMUTED }]}>Position en cours de localisation...</Text>
            </View>
            <View style={m.statusRow}>
              <View style={m.statusDot} />
              <Text style={m.statusText}>En route · Estimée dans 12 min</Text>
            </View>
            <TouchableOpacity style={[m.closeBtn, { backgroundColor: isDark ? "#1C2230" : "#F3F4F6" }]} onPress={() => setShowTrack(null)} activeOpacity={0.85}>
              <Text style={[m.closeBtnText, { color: dTEXT }]}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── MODAL DATE DE RÉCUPÉRATION ── */}
      <Modal visible={!!showDate} animationType="slide" transparent statusBarTranslucent onRequestClose={() => setShowDate(null)}>
        <Pressable style={m.overlay} onPress={() => setShowDate(null)}>
          <Pressable style={[m.sheet, { backgroundColor: isDark ? "#161B22" : "#FFFFFF" }]} onPress={(e) => e.stopPropagation()}>
            {/* Handle */}
            <View style={m.handle} />

            <View style={m.mHeader}>
              <View style={[m.iconCircle, { backgroundColor: "#8B5CF622" }]}>
                <Ionicons name="calendar-outline" size={22} color="#8B5CF6" />
              </View>
              <Text style={[m.mTitle, { color: dTEXT }]}>Détails de récupération</Text>
              <TouchableOpacity onPress={() => setShowDate(null)} activeOpacity={0.7}>
                <Ionicons name="close" size={20} color={dMUTED} />
              </TouchableOpacity>
            </View>

            <Text style={[m.subtitle, { color: dMUTED }]}>Récupération du colis par le livreur</Text>

            {showDate && (
              <View style={{ gap: 12, marginTop: 4 }}>
                <View style={[m.infoRow, { backgroundColor: isDark ? "#1C2230" : "#F8FAFF" }]}>
                  <View style={[m.infoIcon, { backgroundColor: "#8B5CF622" }]}>
                    <Ionicons name="person-outline" size={16} color="#8B5CF6" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[m.infoLabel, { color: dMUTED }]}>Livreur</Text>
                    <Text style={[m.infoValue, { color: dTEXT }]}>{showDate.name}</Text>
                  </View>
                </View>

                <View style={[m.infoRow, { backgroundColor: isDark ? "#1C2230" : "#F8FAFF" }]}>
                  <View style={[m.infoIcon, { backgroundColor: "#3B82F622" }]}>
                    <Ionicons name="calendar-outline" size={16} color="#3B82F6" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[m.infoLabel, { color: dMUTED }]}>Date de récupération</Text>
                    <Text style={[m.infoValue, { color: dTEXT }]}>{showDate.pickupDate}</Text>
                  </View>
                </View>

                <View style={[m.infoRow, { backgroundColor: isDark ? "#1C2230" : "#F8FAFF" }]}>
                  <View style={[m.infoIcon, { backgroundColor: "#F59E0B22" }]}>
                    <Ionicons name="time-outline" size={16} color="#F59E0B" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[m.infoLabel, { color: dMUTED }]}>Heure prévue</Text>
                    <Text style={[m.infoValue, { color: dTEXT }]}>{showDate.pickupTime}</Text>
                  </View>
                </View>

                <View style={[m.infoRow, { backgroundColor: isDark ? "#1C2230" : "#F8FAFF" }]}>
                  <View style={[m.infoIcon, { backgroundColor: "#22C55E22" }]}>
                    <Ionicons name="location-outline" size={16} color="#22C55E" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[m.infoLabel, { color: dMUTED }]}>Lieu de récupération</Text>
                    <Text style={[m.infoValue, { color: dTEXT }]}>{showDate.pickupLocation}</Text>
                  </View>
                </View>
              </View>
            )}

            <TouchableOpacity style={[m.closeBtn, { backgroundColor: "#8B5CF6", marginTop: 8 }]} onPress={() => setShowDate(null)} activeOpacity={0.85}>
              <Text style={[m.closeBtnText, { color: "#fff" }]}>Fermer</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ── MODAL VÉHICULE ── */}
      <Modal visible={!!showVehicle} animationType="slide" transparent statusBarTranslucent onRequestClose={() => setShowVehicle(null)}>
        <Pressable style={m.overlay} onPress={() => setShowVehicle(null)}>
          <Pressable style={[m.sheet, { backgroundColor: isDark ? "#161B22" : "#FFFFFF" }]} onPress={(e) => e.stopPropagation()}>
            <View style={m.handle} />

            {showVehicle && (
              <>
                <View style={m.mHeader}>
                  <View style={[m.iconCircle, { backgroundColor: showVehicle.colorHex + "22" }]}>
                    <Ionicons name={vehicleIcon(showVehicle.vehicle) as any} size={22} color={showVehicle.colorHex} />
                  </View>
                  <Text style={[m.mTitle, { color: dTEXT }]}>Véhicule de livraison</Text>
                  <TouchableOpacity onPress={() => setShowVehicle(null)} activeOpacity={0.7}>
                    <Ionicons name="close" size={20} color={dMUTED} />
                  </TouchableOpacity>
                </View>

                <Text style={[m.subtitle, { color: dMUTED }]}>Informations sur le véhicule utilisé</Text>

                <View style={{ gap: 12, marginTop: 4 }}>
                  <View style={[m.infoRow, { backgroundColor: isDark ? "#1C2230" : "#F8FAFF" }]}>
                    <View style={[m.infoIcon, { backgroundColor: showVehicle.colorHex + "22" }]}>
                      <Ionicons name={vehicleIcon(showVehicle.vehicle) as any} size={16} color={showVehicle.colorHex} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[m.infoLabel, { color: dMUTED }]}>Type de véhicule</Text>
                      <Text style={[m.infoValue, { color: dTEXT }]}>{showVehicle.vehicle}</Text>
                    </View>
                  </View>

                  <View style={[m.infoRow, { backgroundColor: isDark ? "#1C2230" : "#F8FAFF" }]}>
                    <View style={[m.infoIcon, { backgroundColor: "#EC489922" }]}>
                      <Ionicons name="color-palette-outline" size={16} color="#EC4899" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[m.infoLabel, { color: dMUTED }]}>Couleur</Text>
                      <Text style={[m.infoValue, { color: dTEXT }]}>{showVehicle.vehicleColor}</Text>
                    </View>
                  </View>

                  {showVehicle.vehiclePlate && (
                    <View style={[m.infoRow, { backgroundColor: isDark ? "#1C2230" : "#F8FAFF" }]}>
                      <View style={[m.infoIcon, { backgroundColor: "#F59E0B22" }]}>
                        <Ionicons name="document-text-outline" size={16} color="#F59E0B" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[m.infoLabel, { color: dMUTED }]}>Numéro d'immatriculation</Text>
                        <Text style={[m.infoValue, { color: dTEXT, fontFamily: "Poppins_700Bold", letterSpacing: 1.5 }]}>{showVehicle.vehiclePlate}</Text>
                      </View>
                    </View>
                  )}

                  <View style={[m.infoRow, { backgroundColor: isDark ? "#1C2230" : "#F8FAFF" }]}>
                    <View style={[m.infoIcon, { backgroundColor: "#3B82F622" }]}>
                      <Ionicons name="person-outline" size={16} color="#3B82F6" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[m.infoLabel, { color: dMUTED }]}>Conducteur</Text>
                      <Text style={[m.infoValue, { color: dTEXT }]}>{showVehicle.name}</Text>
                    </View>
                  </View>
                </View>

                <TouchableOpacity style={[m.closeBtn, { backgroundColor: showVehicle.colorHex, marginTop: 8 }]} onPress={() => setShowVehicle(null)} activeOpacity={0.85}>
                  <Text style={[m.closeBtnText, { color: "#fff" }]}>Fermer</Text>
                </TouchableOpacity>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      {/* ── MODAL VOIR — LISTE DES PRODUITS ── */}
      <Modal visible={!!showDetail} animationType="slide" transparent statusBarTranslucent onRequestClose={() => setShowDetail(null)}>
        <Pressable style={m.overlay} onPress={() => setShowDetail(null)}>
          <Pressable style={[m.sheet, { backgroundColor: isDark ? "#161B22" : "#FFFFFF" }]} onPress={(e) => e.stopPropagation()}>
            <View style={m.handle} />

            {showDetail && (
              <>
                {/* En-tête */}
                <View style={m.mHeader}>
                  <View style={[m.iconCircle, { backgroundColor: showDetail.colorHex + "22" }]}>
                    <Ionicons name="bag-handle-outline" size={22} color={showDetail.colorHex} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[m.mTitle, { color: dTEXT }]}>Produits à récupérer</Text>
                    <Text style={[m.subtitle, { color: dMUTED, marginTop: 0 }]}>Livreur : {showDetail.name}</Text>
                  </View>
                  <TouchableOpacity onPress={() => setShowDetail(null)} activeOpacity={0.7}>
                    <Ionicons name="close" size={20} color={dMUTED} />
                  </TouchableOpacity>
                </View>

                {/* Compteur */}
                <View style={[m.productCountBadge, { backgroundColor: showDetail.colorHex + "18", borderColor: showDetail.colorHex + "33" }]}>
                  <Ionicons name="cube-outline" size={14} color={showDetail.colorHex} />
                  <Text style={[m.productCountText, { color: showDetail.colorHex }]}>
                    {showDetail.products.length} article{showDetail.products.length > 1 ? "s" : ""} dans ce colis
                  </Text>
                </View>

                {/* Liste des produits */}
                <View style={{ gap: 8 }}>
                  {showDetail.products.map((prod, idx) => (
                    <View key={idx} style={[m.productRow, { backgroundColor: isDark ? "#1C2230" : "#F8FAFF" }]}>
                      <View style={[m.productNumCircle, { backgroundColor: showDetail.colorHex + "22" }]}>
                        <Text style={[m.productNum, { color: showDetail.colorHex }]}>{idx + 1}</Text>
                      </View>
                      <Text style={[m.productName, { color: dTEXT }]}>{prod}</Text>
                      <Ionicons name="checkmark-circle-outline" size={18} color={showDetail.colorHex + "80"} />
                    </View>
                  ))}
                </View>

                <TouchableOpacity style={[m.closeBtn, { backgroundColor: showDetail.colorHex, marginTop: 8 }]} onPress={() => setShowDetail(null)} activeOpacity={0.85}>
                  <Text style={[m.closeBtnText, { color: "#fff" }]}>Fermer</Text>
                </TouchableOpacity>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      {/* ── MODAL AVATAR PLEIN ÉCRAN ── */}
      <Modal visible={!!showAvatar} animationType="fade" transparent statusBarTranslucent onRequestClose={() => setShowAvatar(null)}>
        <Pressable style={m.avatarFullOverlay} onPress={() => setShowAvatar(null)}>
          {showAvatar && (
            <View style={[m.avatarFullCircle, { backgroundColor: showAvatar.colorHex + "30" }]}>
              <Text style={[m.avatarFullText, { color: showAvatar.colorHex }]}>{showAvatar.initials}</Text>
            </View>
          )}
        </Pressable>
      </Modal>

    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 12, paddingVertical: 12, borderBottomWidth: 1 },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { color: "#fff", fontFamily: "Poppins_700Bold", fontSize: 17 },
  tabsRow: { flexDirection: "row", margin: 16, marginBottom: 8, borderRadius: 14, padding: 4, gap: 4 },
  tabBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10, borderRadius: 11 },
  tabBtnActive: {},
  tabBtnText: { fontFamily: "Poppins_600SemiBold", fontSize: 13 },
  tabBadge: { borderRadius: 9, paddingHorizontal: 6, paddingVertical: 1 },
  tabBadgeText: { color: "#fff", fontFamily: "Poppins_700Bold", fontSize: 10 },
  emptyState: { alignItems: "center", paddingTop: 80, gap: 14 },
  emptyText: { fontFamily: "Poppins_400Regular", fontSize: 14 },
  card: { borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 1, gap: 12 },
  livreurRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  avatar: { width: 52, height: 52, borderRadius: 26, alignItems: "center", justifyContent: "center" },
  avatarText: { fontFamily: "Poppins_700Bold", fontSize: 18 },
  livreurInfo: { flex: 1, gap: 4 },
  livreurName: { fontFamily: "Poppins_700Bold", fontSize: 15 },
  companyRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  companyText: { fontFamily: "Poppins_600SemiBold", fontSize: 12 },
  vehicleTag: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, borderWidth: 1.5 },
  vehicleText: { fontFamily: "Poppins_600SemiBold", fontSize: 12 },
  codeRow: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1, borderColor: "rgba(245,158,11,0.25)" },
  codeInput: { flex: 1, fontFamily: "Poppins_400Regular", fontSize: 13 },
  codeUsedRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  codeUsedText: { fontFamily: "Poppins_400Regular", fontSize: 12 },
  actionsRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  actionGhost: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10, borderWidth: 1 },
  actionGhostText: { fontFamily: "Poppins_600SemiBold", fontSize: 12 },
  actionColor: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10, borderWidth: 1 },
  actionColorText: { fontFamily: "Poppins_600SemiBold", fontSize: 12 },
  livreBadge: { flexDirection: "row", alignItems: "center", gap: 6 },
  livreBadgeText: { color: "#22C55E", fontFamily: "Poppins_600SemiBold", fontSize: 12 },
});

const m = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.72)", justifyContent: "flex-end", alignItems: "center" },
  box: { borderRadius: 22, padding: 22, width: "100%", gap: 16, marginBottom: 20, marginHorizontal: 20 },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, width: "100%", gap: 16, paddingBottom: 32 },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: "rgba(150,150,150,0.3)", alignSelf: "center", marginBottom: 4 },
  mHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  mTitle: { flex: 1, fontFamily: "Poppins_700Bold", fontSize: 15 },
  subtitle: { fontFamily: "Poppins_400Regular", fontSize: 12, marginTop: -8 },
  iconCircle: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center" },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 14, padding: 14 },
  infoIcon: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  infoLabel: { fontFamily: "Poppins_400Regular", fontSize: 11, marginBottom: 2 },
  infoValue: { fontFamily: "Poppins_600SemiBold", fontSize: 14 },
  mapZone: { height: 140, borderRadius: 16, alignItems: "center", justifyContent: "center", gap: 10 },
  mapText: { fontFamily: "Poppins_400Regular", fontSize: 12 },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#22C55E" },
  statusText: { color: "#22C55E", fontFamily: "Poppins_600SemiBold", fontSize: 13 },
  closeBtn: { borderRadius: 14, paddingVertical: 14, alignItems: "center" },
  closeBtnText: { fontFamily: "Poppins_700Bold", fontSize: 14 },
  avatarFullOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.88)", alignItems: "center", justifyContent: "center" },
  avatarFullCircle: { width: 220, height: 220, borderRadius: 110, alignItems: "center", justifyContent: "center" },
  avatarFullText: { fontFamily: "Poppins_700Bold", fontSize: 88 },
  livreurBand: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 14, padding: 12, borderWidth: 1 },
  avatarSmall: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center" },
  avatarSmallText: { fontFamily: "Poppins_700Bold", fontSize: 16 },
  productCountBadge: { flexDirection: "row", alignItems: "center", gap: 7, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1 },
  productCountText: { fontFamily: "Poppins_600SemiBold", fontSize: 13 },
  productRow: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 12, padding: 14 },
  productNumCircle: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  productNum: { fontFamily: "Poppins_700Bold", fontSize: 12 },
  productName: { flex: 1, fontFamily: "Poppins_500Medium", fontSize: 14 },
});
