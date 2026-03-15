import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as MediaLibrary from "expo-media-library";
import * as DocumentPicker from "expo-document-picker";
import * as Haptics from "expo-haptics";
import { soundPickerStore } from "@/lib/soundPickerStore";

type AudioAsset = {
  id: string;
  filename: string;
  title: string;
  artist: string;
  duration: number;
  uri: string;
};

type PermStatus = "loading" | "granted" | "denied" | "unavailable";

function formatDuration(secs: number): string {
  if (!secs || isNaN(secs)) return "--:--";
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function AudioRow({
  item,
  onSelect,
}: {
  item: AudioAsset;
  onSelect: (a: AudioAsset) => void;
}) {
  return (
    <TouchableOpacity
      style={styles.row}
      onPress={() => onSelect(item)}
      activeOpacity={0.7}
    >
      <View style={styles.rowIcon}>
        <Ionicons name="musical-note" size={18} color="#FF6B00" />
      </View>
      <View style={styles.rowInfo}>
        <Text style={styles.rowTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.rowArtist} numberOfLines={1}>
          {item.artist || "Artiste inconnu"}
        </Text>
      </View>
      <Text style={styles.rowDuration}>{formatDuration(item.duration)}</Text>
    </TouchableOpacity>
  );
}

export default function SoundPickerPage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const paddingTop = Platform.OS === "web" ? 0 : insets.top;
  const paddingBottom = Platform.OS === "web" ? 34 : insets.bottom;

  const [permStatus, setPermStatus] = useState<PermStatus>("loading");
  const [allTracks, setAllTracks] = useState<AudioAsset[]>([]);
  const [query, setQuery] = useState("");
  const [loadingTracks, setLoadingTracks] = useState(false);
  const [pickerBusy, setPickerBusy] = useState(false);
  const hasLoaded = useRef(false);

  const filtered = query.trim()
    ? allTracks.filter(
        (t) =>
          t.title.toLowerCase().includes(query.toLowerCase()) ||
          t.artist.toLowerCase().includes(query.toLowerCase())
      )
    : allTracks;

  const selectTrack = useCallback(
    (asset: AudioAsset) => {
      soundPickerStore.setSelected({
        id: asset.id,
        title: asset.title,
        artist: asset.artist || "Artiste inconnu",
        duration: formatDuration(asset.duration),
        uri: asset.uri,
      });
      Haptics.selectionAsync();
      router.back();
    },
    [router]
  );

  const openSystemPicker = useCallback(async () => {
    setPickerBusy(true);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["audio/*"],
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets?.[0]) {
        const asset = result.assets[0];
        soundPickerStore.setSelected({
          id: asset.uri,
          title: asset.name.replace(/\.[^/.]+$/, ""),
          artist: "Mon téléphone",
          duration: "--:--",
          uri: asset.uri,
        });
        Haptics.selectionAsync();
        router.back();
      }
    } catch {
    } finally {
      setPickerBusy(false);
    }
  }, [router]);

  const loadTracks = useCallback(async () => {
    setLoadingTracks(true);
    try {
      let page = await MediaLibrary.getAssetsAsync({
        mediaType: MediaLibrary.MediaType.audio,
        sortBy: MediaLibrary.SortBy.modificationTime,
        first: 200,
      });
      const assets: AudioAsset[] = page.assets.map((a) => ({
        id: a.id,
        filename: a.filename,
        title: a.filename.replace(/\.[^/.]+$/, ""),
        artist: "",
        duration: a.duration,
        uri: a.uri,
      }));
      while (page.hasNextPage) {
        page = await MediaLibrary.getAssetsAsync({
          mediaType: MediaLibrary.MediaType.audio,
          sortBy: MediaLibrary.SortBy.modificationTime,
          first: 200,
          after: page.endCursor,
        });
        page.assets.forEach((a) =>
          assets.push({
            id: a.id,
            filename: a.filename,
            title: a.filename.replace(/\.[^/.]+$/, ""),
            artist: "",
            duration: a.duration,
            uri: a.uri,
          })
        );
      }
      setAllTracks(assets);
    } catch {
      setPermStatus("unavailable");
    } finally {
      setLoadingTracks(false);
    }
  }, []);

  useEffect(() => {
    if (hasLoaded.current) return;
    hasLoaded.current = true;

    (async () => {
      try {
        const { status, canAskAgain } =
          await MediaLibrary.requestPermissionsAsync(false);

        if (status === "granted") {
          setPermStatus("granted");
          loadTracks();
        } else if (!canAskAgain || status === "denied") {
          setPermStatus("denied");
        } else {
          setPermStatus("denied");
        }
      } catch {
        setPermStatus("unavailable");
      }
    })();
  }, [loadTracks]);

  return (
    <View style={[styles.container, { paddingBottom }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: paddingTop + 12 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sons du téléphone</Text>
        <TouchableOpacity
          style={styles.browseBtn}
          onPress={openSystemPicker}
          disabled={pickerBusy}
          activeOpacity={0.8}
        >
          {pickerBusy ? (
            <ActivityIndicator size="small" color="#FF6B00" />
          ) : (
            <>
              <Ionicons name="folder-open-outline" size={16} color="#FF6B00" />
              <Text style={styles.browseBtnText}>Parcourir</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Content */}
      {permStatus === "loading" && (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#FF6B00" />
          <Text style={styles.statusLabel}>Vérification des accès…</Text>
        </View>
      )}

      {permStatus === "granted" && (
        <>
          {/* Search */}
          <View style={styles.searchRow}>
            <Ionicons
              name="search"
              size={16}
              color="#6B7280"
              style={{ marginRight: 8 }}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Rechercher un son…"
              placeholderTextColor="#4B5563"
              value={query}
              onChangeText={setQuery}
              returnKeyType="search"
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => setQuery("")}>
                <Ionicons name="close-circle" size={16} color="#6B7280" />
              </TouchableOpacity>
            )}
          </View>

          {loadingTracks ? (
            <View style={styles.centerBox}>
              <ActivityIndicator size="large" color="#FF6B00" />
              <Text style={styles.statusLabel}>
                Chargement de votre bibliothèque…
              </Text>
            </View>
          ) : filtered.length === 0 ? (
            <View style={styles.centerBox}>
              <Ionicons
                name="musical-notes-outline"
                size={48}
                color="#374151"
              />
              <Text style={styles.emptyTitle}>
                {query ? "Aucun résultat" : "Aucun son trouvé"}
              </Text>
              <Text style={styles.emptyDesc}>
                {query
                  ? "Essayez un autre mot-clé."
                  : "Votre bibliothèque musicale est vide."}
              </Text>
            </View>
          ) : (
            <FlatList
              data={filtered}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <AudioRow item={item} onSelect={selectTrack} />
              )}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            />
          )}
        </>
      )}

      {(permStatus === "denied" || permStatus === "unavailable") && (
        <View style={styles.centerBox}>
          <View style={styles.unavailIcon}>
            <Ionicons name="lock-closed-outline" size={36} color="#FF6B00" />
          </View>
          <Text style={styles.unavailTitle}>Bibliothèque non accessible</Text>
          <Text style={styles.unavailDesc}>
            {permStatus === "denied"
              ? "L'accès à vos fichiers audio a été refusé. Autorisez-le dans les paramètres de votre téléphone, ou utilisez le bouton ci-dessous pour parcourir vos fichiers manuellement."
              : "L'accès direct à la bibliothèque musicale n'est pas disponible dans cet environnement. Utilisez le bouton ci-dessous pour sélectionner un fichier audio depuis votre téléphone."}
          </Text>
          <TouchableOpacity
            style={styles.bigPickerBtn}
            onPress={openSystemPicker}
            disabled={pickerBusy}
            activeOpacity={0.85}
          >
            {pickerBusy ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="folder-open-outline" size={20} color="#fff" />
                <Text style={styles.bigPickerBtnText}>
                  Parcourir mes fichiers
                </Text>
              </>
            )}
          </TouchableOpacity>
          <Text style={styles.unavailHint}>
            Formats acceptés : MP3, AAC, WAV, FLAC, OGG
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0F0F0F" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 14,
    backgroundColor: "#1A1A1A",
    borderBottomWidth: 1,
    borderBottomColor: "#2D2D2D",
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FF6B00",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  headerTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 17,
    color: "#fff",
    flex: 1,
  },
  browseBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#1F1F1F",
    borderWidth: 1,
    borderColor: "#FF6B00",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  browseBtnText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12,
    color: "#FF6B00",
  },

  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1A1A1A",
    borderRadius: 12,
    margin: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#2D2D2D",
  },
  searchInput: {
    flex: 1,
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: "#fff",
  },

  listContent: { paddingBottom: 24 },

  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#1E1E1E",
  },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#2D1A00",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  rowInfo: { flex: 1 },
  rowTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: "#F9FAFB",
  },
  rowArtist: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    color: "#6B7280",
    marginTop: 1,
  },
  rowDuration: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: "#4B5563",
    marginLeft: 8,
  },

  centerBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  statusLabel: {
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    color: "#6B7280",
    marginTop: 14,
  },

  emptyTitle: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 16,
    color: "#9CA3AF",
    marginTop: 16,
  },
  emptyDesc: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: "#4B5563",
    textAlign: "center",
    marginTop: 6,
  },

  unavailIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#1A1A00",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#2D2D00",
  },
  unavailTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: 18,
    color: "#F9FAFB",
    marginBottom: 12,
    textAlign: "center",
  },
  unavailDesc: {
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: "#9CA3AF",
    textAlign: "center",
    lineHeight: 21,
    marginBottom: 28,
  },
  bigPickerBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#FF6B00",
    borderRadius: 14,
    paddingVertical: 15,
    paddingHorizontal: 28,
    width: "100%",
    justifyContent: "center",
    marginBottom: 16,
  },
  bigPickerBtnText: {
    fontFamily: "Poppins_700Bold",
    fontSize: 15,
    color: "#fff",
  },
  unavailHint: {
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
    color: "#4B5563",
    textAlign: "center",
  },
});
