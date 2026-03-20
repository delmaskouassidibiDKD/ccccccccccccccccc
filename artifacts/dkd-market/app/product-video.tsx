import React, { useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Video, ResizeMode } from "expo-av";

export default function ProductVideoScreen() {
  const { videoUrl, productTitle } = useLocalSearchParams<{
    videoUrl: string;
    productTitle: string;
  }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const videoRef = useRef<Video>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const hasVideo = !!videoUrl && videoUrl.length > 0;

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* Bouton fermer */}
      <TouchableOpacity
        style={[s.closeBtn, { top: insets.top + 12 }]}
        onPress={() => router.back()}
        activeOpacity={0.8}
      >
        <Ionicons name="close" size={22} color="#fff" />
      </TouchableOpacity>

      {/* Titre du produit */}
      <View style={[s.titleBar, { top: insets.top + 10 }]}>
        <Text style={s.titleText} numberOfLines={1}>
          {productTitle ?? "Vidéo produit"}
        </Text>
      </View>

      {hasVideo ? (
        <View style={s.videoContainer}>
          {isLoading && !hasError && (
            <ActivityIndicator
              style={StyleSheet.absoluteFill}
              color="#FF6B00"
              size="large"
            />
          )}
          {hasError ? (
            <View style={s.noVideo}>
              <Ionicons name="alert-circle-outline" size={52} color="#EF4444" />
              <Text style={s.noVideoTitle}>Erreur de chargement</Text>
              <Text style={s.noVideoSub}>
                Impossible de lire cette vidéo.
              </Text>
            </View>
          ) : (
            <Video
              ref={videoRef}
              source={{ uri: videoUrl }}
              style={s.video}
              resizeMode={ResizeMode.CONTAIN}
              shouldPlay
              useNativeControls
              onLoad={() => setIsLoading(false)}
              onError={() => {
                setIsLoading(false);
                setHasError(true);
              }}
            />
          )}
        </View>
      ) : (
        /* Pas de vidéo */
        <View style={s.noVideo}>
          <View style={s.noVideoIcon}>
            <Ionicons name="videocam-off-outline" size={52} color="#64748B" />
          </View>
          <Text style={s.noVideoTitle}>Pas de vidéo</Text>
          <Text style={s.noVideoSub}>
            Aucune vidéo n'est associée à ce produit.
          </Text>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#000",
  },
  closeBtn: {
    position: "absolute",
    left: 16,
    zIndex: 10,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  titleBar: {
    position: "absolute",
    left: 66,
    right: 16,
    zIndex: 10,
    height: 38,
    justifyContent: "center",
  },
  titleText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 15,
    color: "#fff",
  },
  videoContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  video: {
    width: "100%",
    height: "100%",
  },
  noVideo: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingHorizontal: 40,
  },
  noVideoIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "rgba(255,255,255,0.07)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  noVideoTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 20,
    color: "#fff",
  },
  noVideoSub: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
  },
});
