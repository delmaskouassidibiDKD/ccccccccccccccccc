import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput,
  KeyboardAvoidingView, Platform, Dimensions, Modal, Animated, PanResponder,
  Image, Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/contexts/ThemeContext";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { Video, ResizeMode } from "expo-av";
import AsyncStorage from "@react-native-async-storage/async-storage";

const DEFAULT_EXTRA_KEY    = "@dkd:gros_dm_extra_convs";
const DEFAULT_ACTIVITY_KEY = "@dkd:gros_dm_activity";
const ACCENT               = "#06B6D4";
const { width: SCREEN_W } = Dimensions.get("window");

function nowTime() {
  return new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

type ReplyRef = { id: string; text: string; isMe: boolean };
type Msg = { id: string; text: string; time: string; isMe: boolean; replyTo?: ReplyRef; mediaUri?: string; mediaType?: "image" | "video" };

/* ── Swipeable row ── */
function SwipeRow({ onSwipe, children }: { onSwipe: () => void; children: React.ReactNode }) {
  const tx = useRef(new Animated.Value(0)).current;
  const triggered = useRef(false);

  const pan = useRef(PanResponder.create({
    onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 8 && Math.abs(g.dx) > Math.abs(g.dy) * 1.5,
    onPanResponderGrant: () => { triggered.current = false; },
    onPanResponderMove: (_, g) => {
      const val = Math.max(g.dx, -70);
      if (val < 0) tx.setValue(val);
      if (val < -50 && !triggered.current) {
        triggered.current = true;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onSwipe();
      }
    },
    onPanResponderRelease: () => {
      Animated.spring(tx, { toValue: 0, useNativeDriver: true, tension: 100 }).start();
    },
  })).current;

  return (
    <Animated.View style={{ transform: [{ translateX: tx }] }} {...pan.panHandlers}>
      {children}
    </Animated.View>
  );
}

export default function DmPersonnalisationPage() {
  const router  = useRouter();
  const insets  = useSafeAreaInsets();
  const { isDark } = useTheme();
  const { id, name, initials, color, xKey, aKey } = useLocalSearchParams<{ id: string; name: string; initials: string; color: string; xKey?: string; aKey?: string }>();
  const DM_EXTRA_KEY = xKey || DEFAULT_EXTRA_KEY;
  const ACTIVITY_KEY = aKey || DEFAULT_ACTIVITY_KEY;

  const dynBG     = isDark ? "#0D1117" : "#F0F4FA";
  const dynCARD   = isDark ? "#161B25" : "#FFFFFF";
  const dynText   = isDark ? "#F0F6FF" : "#1A1A1A";
  const dynSub    = isDark ? "#64748B" : "#6B7280";
  const dynBorder = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.08)";
  const dynHeader = isDark ? "#111827" : "#FFFFFF";
  const dynSheet  = isDark ? "#1E293B" : "#FFFFFF";
  const contactColor = color ?? ACCENT;

  const [messages,     setMessages]    = useState<Msg[]>([]);
  const [input,        setInput]       = useState("");
  const [replyTo,      setReplyTo]     = useState<Msg | null>(null);
  const [editingMsg,   setEditingMsg]  = useState<Msg | null>(null);
  const [contextMsg,   setContextMsg]  = useState<Msg | null>(null);
  const [playingVideo, setPlayingVideo] = useState<string | null>(null);
  const [playingImage, setPlayingImage] = useState<string | null>(null);
  const inputRef = useRef<TextInput>(null);
  const listRef  = useRef<FlatList>(null);

  const storageKey = `@dkd:dm_importe_${id}`;

  useEffect(() => {
    AsyncStorage.getItem(storageKey).then((raw) => {
      if (raw) { try { setMessages(JSON.parse(raw)); } catch {} }
    });
  }, [id]);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 80);
  }, []);
  useEffect(() => { scrollToBottom(); }, [messages.length]);

  const saveMessages = (msgs: Msg[]) => AsyncStorage.setItem(storageKey, JSON.stringify(msgs));

  const updateConvPreview = useCallback(async (text: string) => {
    const timeStr = nowTime(); const ts = Date.now();
    try {
      const raw = await AsyncStorage.getItem(DM_EXTRA_KEY);
      if (raw) {
        const convs: any[] = JSON.parse(raw);
        const idx = convs.findIndex((c) => c.id === id);
        if (idx !== -1) { convs[idx] = { ...convs[idx], preview: text, time: timeStr }; await AsyncStorage.setItem(DM_EXTRA_KEY, JSON.stringify(convs)); }
      }
    } catch {}
    try {
      const actRaw = await AsyncStorage.getItem(ACTIVITY_KEY);
      const activity: Record<string, any> = actRaw ? JSON.parse(actRaw) : {};
      activity[id ?? ""] = { timestamp: ts, preview: text, time: timeStr };
      await AsyncStorage.setItem(ACTIVITY_KEY, JSON.stringify(activity));
    } catch {}
  }, [id]);

  const send = useCallback(() => {
    const text = input.trim();
    if (!text) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (editingMsg) {
      setMessages((prev) => { const u = prev.map((m) => m.id === editingMsg.id ? { ...m, text } : m); saveMessages(u); return u; });
      setEditingMsg(null);
    } else {
      const newMsg: Msg = {
        id: Date.now().toString(), text, time: nowTime(), isMe: true,
        ...(replyTo ? { replyTo: { id: replyTo.id, text: replyTo.text, isMe: replyTo.isMe } } : {}),
      };
      setMessages((prev) => { const u = [...prev, newMsg]; saveMessages(u); return u; });
      updateConvPreview(text);
    }
    setInput(""); setReplyTo(null);
  }, [input, replyTo, editingMsg, updateConvPreview]);

  const pickMedia = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission requise", "Autorisez l'accès à la galerie pour envoyer des médias.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images", "videos"],
      quality: 0.85,
      allowsEditing: false,
      allowsMultipleSelection: true,
    });
    if (!result.canceled && result.assets.length > 0) {
      setTimeout(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        const base = Date.now();
        const newMsgs: Msg[] = result.assets.map((asset, i) => ({
          id: (base + i).toString(), text: "", time: nowTime(), isMe: true,
          mediaUri: asset.uri, mediaType: asset.type === "video" ? "video" : "image",
        }));
        setMessages((prev) => { const u = [...prev, ...newMsgs]; saveMessages(u); return u; });
        updateConvPreview(newMsgs.length > 1 ? `📷 ${newMsgs.length} médias` : (newMsgs[0].mediaType === "video" ? "🎥 Vidéo" : "🖼️ Image"));
      }, 200);
    }
  }, [updateConvPreview]);

  const handleDelete = (msg: Msg) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setMessages((prev) => { const u = prev.filter((m) => m.id !== msg.id); saveMessages(u); return u; });
    setContextMsg(null);
  };
  const handleEdit = (msg: Msg) => {
    setEditingMsg(msg); setInput(msg.text); setContextMsg(null);
    setTimeout(() => inputRef.current?.focus(), 100);
  };
  const handleReply = (msg: Msg) => {
    setReplyTo(msg); setContextMsg(null);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const renderItem = ({ item }: { item: Msg }) => {
    const isMe = item.isMe;
    return (
      <SwipeRow onSwipe={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setReplyTo(item); setTimeout(() => inputRef.current?.focus(), 100); }}>
        <TouchableOpacity activeOpacity={0.9} onLongPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setContextMsg(item); }} delayLongPress={400}>
          {isMe ? (
            <View style={s.rowMe}>
              <View style={[s.bubbleMe, { backgroundColor: ACCENT, padding: item.mediaUri && !item.text ? 4 : undefined }]}>
                {item.replyTo && (
                  <View style={[s.replySnippet, { backgroundColor: "rgba(0,0,0,0.18)" }]}>
                    <View style={s.replyBar} />
                    <Text style={s.replySnippetText} numberOfLines={1}>{item.replyTo.text}</Text>
                  </View>
                )}
                {item.mediaUri && (
                  item.mediaType === "video" ? (
                    <TouchableOpacity activeOpacity={0.85} onPress={() => setPlayingVideo(item.mediaUri!)}>
                      <View style={s.videoBubble}>
                        <Ionicons name="play-circle" size={44} color="rgba(255,255,255,0.9)" />
                        <Text style={s.videoLabel}>Appuyer pour regarder</Text>
                      </View>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity activeOpacity={0.9} onPress={() => setPlayingImage(item.mediaUri!)}>
                      <Image source={{ uri: item.mediaUri }} style={s.mediaBubble} resizeMode="contain" />
                    </TouchableOpacity>
                  )
                )}
                {!!item.text && <Text style={s.textMe}>{item.text}</Text>}
                <View style={s.timeRow}>
                  <Text style={s.timeMe}>{item.time}</Text>
                  <Ionicons name="checkmark-done-outline" size={12} color="rgba(255,255,255,0.7)" />
                </View>
              </View>
            </View>
          ) : (
            <View style={s.rowOther}>
              <View style={[s.avatar, { backgroundColor: contactColor + "28" }]}>
                <Text style={[s.avatarText, { color: contactColor }]}>{initials ?? "?"}</Text>
              </View>
              <View style={[s.bubbleOther, { backgroundColor: dynCARD, borderColor: dynBorder, maxWidth: SCREEN_W * 0.67, padding: item.mediaUri && !item.text ? 4 : undefined }]}>
                {item.replyTo && (
                  <View style={[s.replySnippet, { backgroundColor: isDark ? "#0D1117" : "#F0F4FA" }]}>
                    <View style={[s.replyBar, { backgroundColor: ACCENT }]} />
                    <Text style={[s.replySnippetText, { color: dynSub }]} numberOfLines={1}>{item.replyTo.text}</Text>
                  </View>
                )}
                {item.mediaUri && (
                  item.mediaType === "video" ? (
                    <TouchableOpacity activeOpacity={0.85} onPress={() => setPlayingVideo(item.mediaUri!)}>
                      <View style={[s.videoBubble, { backgroundColor: "#0F172A" }]}>
                        <Ionicons name="play-circle" size={44} color="rgba(255,255,255,0.9)" />
                        <Text style={s.videoLabel}>Appuyer pour regarder</Text>
                      </View>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity activeOpacity={0.9} onPress={() => setPlayingImage(item.mediaUri!)}>
                      <Image source={{ uri: item.mediaUri }} style={s.mediaBubble} resizeMode="contain" />
                    </TouchableOpacity>
                  )
                )}
                {!!item.text && <Text style={[s.textOther, { color: dynText }]}>{item.text}</Text>}
                <Text style={[s.timeOther, { color: dynSub }]}>{item.time}</Text>
              </View>
            </View>
          )}
        </TouchableOpacity>
      </SwipeRow>
    );
  };

  return (
    <View style={[s.root, { backgroundColor: dynBG }]}>

      {/* HEADER */}
      <View style={[s.header, { paddingTop: insets.top + 10, backgroundColor: dynHeader, borderBottomColor: dynBorder }]}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color={dynText} />
        </TouchableOpacity>
        <View style={[s.avatar, { backgroundColor: contactColor + "28" }]}>
          <Text style={[s.avatarText, { color: contactColor }]}>{initials ?? "?"}</Text>
        </View>
        <View style={s.headerInfo}>
          <Text style={[s.headerName, { color: dynText }]} numberOfLines={1}>{name ?? "Client"}</Text>
          <Text style={[s.headerStatus, { color: "#34D399" }]}>● En ligne</Text>
        </View>
        <TouchableOpacity style={[s.iconBtn, { backgroundColor: isDark ? "#1E293B" : "#F0F4FA" }]} activeOpacity={0.7}>
          <Ionicons name="call-outline" size={18} color={dynSub} />
        </TouchableOpacity>
      </View>

      {/* MESSAGES + INPUT — keyboard-aware wrapper (WhatsApp style) */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[s.list, { paddingBottom: insets.bottom + 12 }]}
          onContentSizeChange={scrollToBottom}
          renderItem={renderItem}
          ListEmptyComponent={
            <View style={s.emptyChat}>
              <View style={[s.emptyChatIcon, { backgroundColor: ACCENT + "18" }]}>
                <Ionicons name="chatbubble-ellipses-outline" size={32} color={ACCENT} />
              </View>
              <Text style={[s.emptyChatText, { color: dynSub }]}>Démarrez la conversation</Text>
            </View>
          }
        />

        {/* INPUT AREA */}
        <View style={{ backgroundColor: dynHeader, borderTopWidth: 1, borderTopColor: dynBorder }}>

          {/* Edit banner */}
          {editingMsg && (
            <View style={[s.replyBanner, { backgroundColor: isDark ? "#1E293B" : "#F0F4FA", borderLeftColor: "#F59E0B" }]}>
              <Ionicons name="pencil-outline" size={14} color="#F59E0B" />
              <View style={{ flex: 1 }}>
                <Text style={[s.replyBannerLabel, { color: "#F59E0B" }]}>Modifier le message</Text>
                <Text style={[s.replyBannerText, { color: dynSub }]} numberOfLines={1}>{editingMsg.text}</Text>
              </View>
              <TouchableOpacity onPress={() => { setEditingMsg(null); setInput(""); }}>
                <Ionicons name="close" size={18} color={dynSub} />
              </TouchableOpacity>
            </View>
          )}

          {/* Reply banner */}
          {replyTo && !editingMsg && (
            <View style={[s.replyBanner, { backgroundColor: isDark ? "#1E293B" : "#F0F4FA", borderLeftColor: ACCENT }]}>
              <Ionicons name="return-down-forward-outline" size={14} color={ACCENT} />
              <View style={{ flex: 1 }}>
                <Text style={[s.replyBannerLabel, { color: ACCENT }]}>Réponse à {replyTo.isMe ? "vous" : (name ?? "client")}</Text>
                <Text style={[s.replyBannerText, { color: dynSub }]} numberOfLines={1}>{replyTo.text}</Text>
              </View>
              <TouchableOpacity onPress={() => setReplyTo(null)}>
                <Ionicons name="close" size={18} color={dynSub} />
              </TouchableOpacity>
            </View>
          )}

          <View style={[s.inputBar, { paddingBottom: insets.bottom + 8 }]}>
            <TouchableOpacity style={[s.attachBtn, { backgroundColor: isDark ? "#1E293B" : "#F0F4FA" }]} activeOpacity={0.7} onPress={pickMedia}>
              <Ionicons name="attach-outline" size={20} color={dynSub} />
            </TouchableOpacity>
            <View style={[s.inputWrap, { backgroundColor: isDark ? "#1E293B" : "#F0F4FA", borderColor: dynBorder }]}>
              <TextInput
                ref={inputRef}
                style={[s.input, { color: dynText }]}
                placeholder={editingMsg ? "Modifier le message..." : "Message..."}
                placeholderTextColor={dynSub}
                value={input}
                onChangeText={setInput}
                multiline maxLength={500}
                returnKeyType="send"
                onSubmitEditing={send}
              />
            </View>
            <TouchableOpacity
              style={[s.sendBtn, { backgroundColor: input.trim() ? ACCENT : (isDark ? "#1E293B" : "#E2E8F0") }]}
              onPress={send} activeOpacity={0.85}
            >
              <Ionicons name={editingMsg ? "checkmark" : "send"} size={18} color={input.trim() ? "#fff" : dynSub} />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* IMAGE VIEWER */}
      <Modal visible={!!playingImage} animationType="fade" transparent={false} onRequestClose={() => setPlayingImage(null)}>
        <View style={s.videoModal}>
          {playingImage && (
            Platform.OS === "web"
              ? React.createElement("img", {
                  src: playingImage,
                  style: {
                    position: "absolute",
                    top: 0, left: 0, right: 0, bottom: 0,
                    width: "100%", height: "100%",
                    objectFit: "contain",
                    backgroundColor: "#000",
                  },
                })
              : (
                <Image source={{ uri: playingImage }} style={s.videoPlayer} resizeMode="contain" />
              )
          )}
          <TouchableOpacity style={[s.videoCloseBtn, { top: insets.top + 12 }]} onPress={() => setPlayingImage(null)} activeOpacity={0.8}>
            <Ionicons name="close-circle" size={34} color="#fff" />
          </TouchableOpacity>
        </View>
      </Modal>

      {/* VIDEO PLAYER */}
      <Modal visible={!!playingVideo} animationType="fade" transparent={false} onRequestClose={() => setPlayingVideo(null)}>
        <View style={s.videoModal}>
          {playingVideo && (
            Platform.OS === "web"
              ? React.createElement("video", {
                  src: playingVideo,
                  controls: true,
                  autoPlay: true,
                  style: {
                    position: "absolute",
                    top: 0, left: 0, right: 0, bottom: 0,
                    width: "100%", height: "100%",
                    objectFit: "contain",
                    backgroundColor: "#000",
                  },
                })
              : (
                <Video
                  source={{ uri: playingVideo }}
                  style={s.videoPlayer}
                  useNativeControls
                  resizeMode={ResizeMode.CONTAIN}
                  shouldPlay
                />
              )
          )}
          <TouchableOpacity style={[s.videoCloseBtn, { top: insets.top + 12 }]} onPress={() => setPlayingVideo(null)} activeOpacity={0.8}>
            <Ionicons name="close-circle" size={34} color="#fff" />
          </TouchableOpacity>
        </View>
      </Modal>

      {/* CONTEXT MENU */}
      <Modal visible={!!contextMsg} animationType="fade" transparent onRequestClose={() => setContextMsg(null)}>
        {contextMsg && (
          <TouchableOpacity style={s.contextOverlay} onPress={() => setContextMsg(null)} activeOpacity={1}>
            <View style={[s.contextMenu, { backgroundColor: dynSheet }]}>
              <View style={[s.contextPreview, { backgroundColor: isDark ? "#0D1117" : "#F8FAFC", borderBottomColor: dynBorder }]}>
                <Text style={[s.contextPreviewText, { color: dynSub }]} numberOfLines={2}>{contextMsg.text}</Text>
              </View>

              {!contextMsg.isMe && (
                <TouchableOpacity style={[s.contextAction, { borderBottomColor: dynBorder }]} onPress={() => handleReply(contextMsg)} activeOpacity={0.8}>
                  <View style={[s.contextActionIcon, { backgroundColor: "#3B82F618" }]}>
                    <Ionicons name="return-down-forward-outline" size={18} color="#3B82F6" />
                  </View>
                  <Text style={[s.contextActionText, { color: dynText }]}>Répondre</Text>
                </TouchableOpacity>
              )}

              {contextMsg.isMe && (
                <TouchableOpacity style={[s.contextAction, { borderBottomColor: dynBorder }]} onPress={() => handleEdit(contextMsg)} activeOpacity={0.8}>
                  <View style={[s.contextActionIcon, { backgroundColor: "#F59E0B18" }]}>
                    <Ionicons name="pencil-outline" size={18} color="#F59E0B" />
                  </View>
                  <Text style={[s.contextActionText, { color: dynText }]}>Modifier</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity style={s.contextAction} onPress={() => handleDelete(contextMsg)} activeOpacity={0.8}>
                <View style={[s.contextActionIcon, { backgroundColor: "#EF444418" }]}>
                  <Ionicons name="trash-outline" size={18} color="#EF4444" />
                </View>
                <Text style={[s.contextActionText, { color: "#EF4444" }]}>Supprimer</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[s.contextCancel, { backgroundColor: isDark ? "#1E293B" : "#F0F4FA" }]} onPress={() => setContextMsg(null)} activeOpacity={0.8}>
                <Text style={[s.contextCancelText, { color: dynSub }]}>Annuler</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  root:   { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingBottom: 12, gap: 10, borderBottomWidth: 1 },
  backBtn:    { padding: 4 },
  headerInfo: { flex: 1 },
  headerName: { fontFamily: "Poppins_700Bold", fontSize: 15 },
  headerStatus:{ fontFamily: "Poppins_400Regular", fontSize: 11, marginTop: -1 },
  iconBtn:    { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  avatar:     { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  avatarText: { fontFamily: "Poppins_700Bold", fontSize: 13 },

  list:       { paddingHorizontal: 12, paddingTop: 14, gap: 10 },
  emptyChat:     { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 80, gap: 12 },
  emptyChatIcon: { width: 70, height: 70, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  emptyChatText: { fontFamily: "Poppins_400Regular", fontSize: 14 },

  rowMe:       { alignItems: "flex-end" },
  rowOther:    { flexDirection: "row", alignItems: "flex-end", gap: 8 },
  bubbleMe:    { borderRadius: 18, borderBottomRightRadius: 4, paddingHorizontal: 14, paddingTop: 8, paddingBottom: 8, maxWidth: SCREEN_W * 0.72 },
  bubbleOther: { borderRadius: 18, borderBottomLeftRadius: 4, paddingHorizontal: 14, paddingTop: 8, paddingBottom: 8, borderWidth: 1 },
  textMe:      { fontFamily: "Poppins_400Regular", fontSize: 14, lineHeight: 20, color: "#fff" },
  textOther:   { fontFamily: "Poppins_400Regular", fontSize: 14, lineHeight: 20 },
  timeRow:     { flexDirection: "row", alignItems: "center", justifyContent: "flex-end", gap: 3, marginTop: 3 },
  timeMe:      { color: "rgba(255,255,255,0.7)", fontFamily: "Poppins_400Regular", fontSize: 10 },
  timeOther:   { fontFamily: "Poppins_400Regular", fontSize: 10, marginTop: 3, textAlign: "right" },

  replySnippet:     { flexDirection: "row", borderRadius: 8, marginBottom: 6, overflow: "hidden", alignItems: "center" },
  replyBar:         { width: 3, alignSelf: "stretch", backgroundColor: "rgba(255,255,255,0.5)", marginRight: 8 },
  replySnippetText: { fontFamily: "Poppins_400Regular", fontSize: 12, color: "rgba(255,255,255,0.8)", flex: 1, paddingVertical: 4 },

  replyBanner:      { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 14, paddingVertical: 8, borderLeftWidth: 3 },
  replyBannerLabel: { fontFamily: "Poppins_700Bold", fontSize: 11 },
  replyBannerText:  { fontFamily: "Poppins_400Regular", fontSize: 12 },

  inputBar:   { flexDirection: "row", alignItems: "flex-end", paddingHorizontal: 12, paddingTop: 8, gap: 8 },
  inputWrap:  { flex: 1, borderRadius: 20, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 8, maxHeight: 100 },
  input:      { fontFamily: "Poppins_400Regular", fontSize: 14, padding: 0 },
  sendBtn:    { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },

  contextOverlay:  { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  contextMenu:     { borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: "hidden", paddingBottom: 30 },
  contextPreview:  { padding: 16, borderBottomWidth: 1 },
  contextPreviewText:{ fontFamily: "Poppins_400Regular", fontSize: 13, fontStyle: "italic" },
  contextAction:   { flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  contextActionIcon:{ width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  contextActionText:{ fontFamily: "Poppins_700Bold", fontSize: 14 },
  contextCancel:   { margin: 14, borderRadius: 14, paddingVertical: 13, alignItems: "center" },
  contextCancelText:{ fontFamily: "Poppins_700Bold", fontSize: 14 },

  attachBtn:   { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  mediaBubble: { width: SCREEN_W * 0.62, aspectRatio: 4 / 3, borderRadius: 12, marginBottom: 4, backgroundColor: "#111" },
  videoBubble: { width: SCREEN_W * 0.62, aspectRatio: 16 / 9, borderRadius: 12, alignItems: "center", justifyContent: "center", marginBottom: 4, backgroundColor: "#0F172A", overflow: "hidden" },
  videoLabel:  { color: "rgba(255,255,255,0.75)", fontFamily: "Poppins_400Regular", fontSize: 11, marginTop: 6 },
  videoModal:  { flex: 1, backgroundColor: "#000" },
  videoCloseBtn: { position: "absolute", right: 16, zIndex: 20 },
  videoPlayer: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
});
