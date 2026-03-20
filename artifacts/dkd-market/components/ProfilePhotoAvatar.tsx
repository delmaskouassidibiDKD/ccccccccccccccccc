import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Platform,
  Alert,
  Pressable,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/contexts/ThemeContext";

interface Props {
  photoUri: string | null;
  initials: string;
  onPhotoChanged: (uri: string) => void;
  size?: number;
  fontSize?: number;
  borderColor?: string;
  bgColor?: string;
  initialsColor?: string;
  style?: object;
}

export default function ProfilePhotoAvatar({
  photoUri,
  initials,
  onPhotoChanged,
  size = 68,
  fontSize = 28,
  borderColor = "rgba(255,107,0,0.5)",
  bgColor = "rgba(255,107,0,0.15)",
  initialsColor = "#FF6B00",
  style,
}: Props) {
  const { colors, isDark } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);

  const handlePickPhoto = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        const msg = "Permission refusée pour accéder à la galerie.";
        Platform.OS === "web" ? alert(msg) : Alert.alert("Permission refusée", msg);
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });
      if (!result.canceled && result.assets[0]) {
        const uri = result.assets[0].uri;
        await AsyncStorage.setItem("@dkd:seller_profile_photo", uri);
        onPhotoChanged(uri);
        setModalVisible(false);
      }
    } catch (e) {
      console.error("ProfilePhotoAvatar picker error:", e);
    }
  };

  const borderRadius = size / 2;

  return (
    <>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => setModalVisible(true)}
        style={[
          {
            width: size,
            height: size,
            borderRadius,
            borderWidth: 2,
            borderColor,
            backgroundColor: bgColor,
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
          },
          style,
        ]}
      >
        {photoUri ? (
          <Image source={{ uri: photoUri }} style={{ width: "100%", height: "100%", borderRadius }} />
        ) : (
          <Text style={{ fontFamily: "Poppins_700Bold", fontSize, color: initialsColor }}>
            {initials}
          </Text>
        )}
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setModalVisible(false)}>
          <Pressable
            style={[styles.card, { backgroundColor: isDark ? "#1C2333" : "#FFFFFF" }]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.bigAvatarWrap}>
              {photoUri ? (
                <Image source={{ uri: photoUri }} style={styles.bigAvatar} />
              ) : (
                <View style={[styles.bigAvatarPlaceholder, { backgroundColor: bgColor, borderColor }]}>
                  <Text style={[styles.bigInitials, { color: initialsColor }]}>{initials}</Text>
                </View>
              )}
            </View>

            <TouchableOpacity style={styles.changeBtn} onPress={handlePickPhoto} activeOpacity={0.8}>
              <Ionicons name="camera-outline" size={20} color="#fff" />
              <Text style={styles.changeBtnText}>Changer la photo</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.closeBtn, { borderColor: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)" }]}
              onPress={() => setModalVisible(false)}
              activeOpacity={0.7}
            >
              <Text style={[styles.closeBtnText, { color: isDark ? "#CBD5E1" : "#475569" }]}>Fermer</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  card: {
    borderRadius: 24,
    padding: 28,
    width: "100%",
    maxWidth: 320,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  bigAvatarWrap: {
    marginBottom: 24,
  },
  bigAvatar: {
    width: 160,
    height: 160,
    borderRadius: 80,
  },
  bigAvatarPlaceholder: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
  },
  bigInitials: {
    fontFamily: "Poppins_700Bold",
    fontSize: 56,
  },
  changeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FF6B00",
    borderRadius: 14,
    paddingHorizontal: 24,
    paddingVertical: 13,
    width: "100%",
    justifyContent: "center",
    marginBottom: 10,
  },
  changeBtnText: {
    color: "#fff",
    fontFamily: "Poppins_600SemiBold",
    fontSize: 15,
  },
  closeBtn: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 24,
    paddingVertical: 13,
    width: "100%",
    alignItems: "center",
  },
  closeBtnText: {
    fontFamily: "Poppins_500Medium",
    fontSize: 15,
  },
});
