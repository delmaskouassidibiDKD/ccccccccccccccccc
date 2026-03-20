import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Pressable,
  Dimensions,
} from "react-native";
import { useTheme } from "@/contexts/ThemeContext";

const { width: SW } = Dimensions.get("window");

interface Props {
  photoUri: string | null;
  initials: string;
  onPhotoChanged?: (uri: string) => void;
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
  size = 68,
  fontSize = 28,
  borderColor = "rgba(255,107,0,0.5)",
  bgColor = "rgba(255,107,0,0.15)",
  initialsColor = "#FF6B00",
  style,
}: Props) {
  const { isDark } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);
  const borderRadius = size / 2;

  const cardW = Math.min(SW - 48, 320);

  return (
    <>
      <TouchableOpacity
        activeOpacity={photoUri ? 0.75 : 1}
        onPress={() => { if (photoUri) setModalVisible(true); }}
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
          <Image
            key={photoUri}
            source={{ uri: photoUri }}
            style={{ width: size, height: size }}
            resizeMode="cover"
          />
        ) : (
          <Text style={{ fontFamily: "Poppins_700Bold", fontSize, color: initialsColor }}>
            {initials}
          </Text>
        )}
      </TouchableOpacity>

      {photoUri && (
        <Modal
          visible={modalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setModalVisible(false)}
        >
          <Pressable style={styles.overlay} onPress={() => setModalVisible(false)}>
            <Pressable
              style={[styles.card, { width: cardW, backgroundColor: isDark ? "#111827" : "#FFFFFF" }]}
              onPress={(e) => e.stopPropagation()}
            >
              <Image
                source={{ uri: photoUri }}
                style={[styles.photo, { width: cardW - 16, height: cardW - 16 }]}
                resizeMode="cover"
              />
            </Pressable>
          </Pressable>
        </Modal>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    borderRadius: 16,
    padding: 8,
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 12,
    overflow: "hidden",
  },
  photo: {
    borderRadius: 10,
  },
});
