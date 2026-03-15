import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput,
  KeyboardAvoidingView, Platform, Dimensions, Modal, Animated, PanResponder, Alert, Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { Video, ResizeMode } from "expo-av";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width: SCREEN_W } = Dimensions.get("window");
const ACCENT = "#A855F7";

const DM_EXTRA_KEY   = "@dkd:dm_extra_convs";
const ACTIVITY_KEY   = "@dkd:dm_activity";
const DM_BLOCK_KEY   = "@dkd:groupe_importe_blocked";

const MEMBERS = [
  { id: "m1", name: "Mamadou Diallo",   initials: "MD", color: "#F59E0B", role: "Grossiste" },
  { id: "m2", name: "Fatou Konaté",     initials: "FK", color: "#34D399", role: "Importatrice" },
  { id: "m3", name: "Ibrahim Traoré",   initials: "IT", color: "#60A5FA", role: "Exportateur" },
  { id: "m4", name: "Awa Balde",        initials: "AB", color: "#F472B6", role: "Revendeuse" },
  { id: "m5", name: "Oumar Sow",        initials: "OS", color: "#FB923C", role: "Transitaire" },
];

const INITIAL_MESSAGES = [
  { id: "1", memberId: "m1", text: "Bonjour à tous ! Nouvelle livraison prévue vendredi.", time: "09:14" },
  { id: "2", memberId: "m3", text: "Parfait, j'ai besoin de 3 cartons de plus cette semaine.", time: "09:16" },
  { id: "3", memberId: "m2", text: "Les prix ont changé depuis la dernière commande ?", time: "09:22" },
  { id: "4", memberId: "m1", text: "Oui, légère hausse de 2% sur les électroniques. Les autres catégories restent stables.", time: "09:24" },
  { id: "5", memberId: "m5", text: "Ok merci pour l'info. Je vais adapter ma commande.", time: "09:31" },
  { id: "6", memberId: "m4", text: "Est-ce qu'on peut faire une commande groupée cette semaine pour réduire les frais ?", time: "09:45" },
  { id: "7", memberId: "m3", text: "Bonne idée ! Je suis partant 👍", time: "09:47" },
];

type ReplyRef = { id: string; text: string; isMe: boolean };
type Message  = { id: string; memberId: string; text: string; time: string; isMe?: boolean; replyTo?: ReplyRef; mediaUri?: string; mediaType?: "image" | "video" };
type Member   = typeof MEMBERS[0];

function nowTime() {
  return new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

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

/* ── Bubble ── */
function Bubble({ msg, member, isDark, dynCARD, dynText, dynSub, dynBorder, onLongPress, onSwipe, onVideoPress, onImagePress }: {
  msg: Message; member: Member | undefined; isDark: boolean;
  dynCARD: string; dynText: string; dynSub: string; dynBorder: string;
  onLongPress: () => void; onSwipe: () => void; onVideoPress: (uri: string) => void; onImagePress: (uri: string) => void;
}) {
  const color    = member?.color ?? "#94A3B8";
  const initials = member?.initials ?? "?";

  const replyBlock = msg.replyTo ? (
    <View style={[s.replySnippet, { backgroundColor: msg.isMe ? "rgba(0,0,0,0.18)" : (isDark ? "#0D1117" : "#F0F4FA") }]}>
      <View style={[s.replyBar, { backgroundColor: msg.isMe ? "rgba(255,255,255,0.5)" : ACCENT }]} />
      <Text style={[s.replySnippetText, { color: msg.isMe ? "rgba(255,255,255,0.8)" : dynSub }]} numberOfLines={1}>{msg.replyTo.text}</Text>
    </View>
  ) : null;

  const mediaBlock = msg.mediaUri ? (
    msg.mediaType === "video" ? (
      <TouchableOpacity activeOpacity={0.85} onPress={() => onVideoPress(msg.mediaUri!)}>
        <View style={[s.videoBubble, { backgroundColor: msg.isMe ? "rgba(0,0,0,0.3)" : "#0F172A" }]}>
          <Ionicons name="play-circle" size={44} color="rgba(255,255,255,0.9)" />
          <Text style={s.videoLabel}>Appuyer pour regarder</Text>
        </View>
      </TouchableOpacity>
    ) : (
      <TouchableOpacity activeOpacity={0.9} onPress={() => onImagePress(msg.mediaUri!)}>
        <Image source={{ uri: msg.mediaUri }} style={s.mediaBubble} resizeMode="contain" />
      </TouchableOpacity>
    )
  ) : null;

  return (
    <SwipeRow onSwipe={onSwipe}>
      <TouchableOpacity activeOpacity={0.9} onLongPress={onLongPress} delayLongPress={400}>
        {msg.isMe ? (
          <View style={s.rowMe}>
            <View style={[s.bubbleMe, { backgroundColor: ACCENT, padding: msg.mediaUri && !msg.text ? 4 : undefined }]}>
              {replyBlock}
              {mediaBlock}
              {!!msg.text && <Text style={s.textMe}>{msg.text}</Text>}
              <View style={s.timeRow}>
                <Text style={s.timeMe}>{msg.time}</Text>
                <Ionicons name="checkmark-done-outline" size={12} color="rgba(255,255,255,0.7)" />
              </View>
            </View>
          </View>
        ) : (
          <View style={s.rowOther}>
            <View style={[s.avatar, { backgroundColor: color + "28" }]}>
              <Text style={[s.avatarText, { color }]}>{initials}</Text>
            </View>
            <View style={{ flex: 1, maxWidth: SCREEN_W * 0.67 }}>
              <Text style={[s.senderName, { color }]}>{member?.name ?? "Membre"}</Text>
              <View style={[s.bubbleOther, { backgroundColor: dynCARD, borderColor: dynBorder, padding: msg.mediaUri && !msg.text ? 4 : undefined }]}>
                {replyBlock}
                {mediaBlock}
                {!!msg.text && <Text style={[s.textOther, { color: dynText }]}>{msg.text}</Text>}
                <Text style={[s.timeOther, { color: dynSub }]}>{msg.time}</Text>
              </View>
            </View>
          </View>
        )}
      </TouchableOpacity>
    </SwipeRow>
  );
}

export default function GroupeImportePage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const { user } = useAuth();

  const dynBG     = isDark ? "#0D1117" : "#F0F4FA";
  const dynCARD   = isDark ? "#161B25" : "#FFFFFF";
  const dynText   = isDark ? "#F0F6FF" : "#1A1A1A";
  const dynSub    = isDark ? "#64748B" : "#6B7280";
  const dynBorder = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.08)";
  const dynHeader = isDark ? "#111827" : "#FFFFFF";
  const dynSheet  = isDark ? "#161B25" : "#FFFFFF";

  const [messages,      setMessages]     = useState<Message[]>(INITIAL_MESSAGES);
  const [input,         setInput]        = useState("");
  const [replyTo,       setReplyTo]      = useState<Message | null>(null);
  const [editingMsg,    setEditingMsg]   = useState<Message | null>(null);
  const [contextMsg,    setContextMsg]   = useState<Message | null>(null);
  const [showSettings,  setShowSettings] = useState(false);
  const [search,        setSearch]       = useState("");
  const [blockedIds,    setBlockedIds]   = useState<string[]>([]);
  const [contextMember, setContextMember] = useState<Member | null>(null);
  const [playingVideo,  setPlayingVideo]  = useState<string | null>(null);
  const [playingImage,  setPlayingImage]  = useState<string | null>(null);

  const inputRef = useRef<TextInput>(null);
  const listRef  = useRef<FlatList>(null);

  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem("@dkd:groupe_importe_msgs"),
      AsyncStorage.getItem(DM_BLOCK_KEY),
    ]).then(([msgRaw, blockRaw]) => {
      if (msgRaw) {
        try { setMessages(JSON.parse(msgRaw)); } catch {}
      }
      if (blockRaw) { try { setBlockedIds(JSON.parse(blockRaw)); } catch {} }
    });
  }, []);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 80);
  }, []);
  useEffect(() => { scrollToBottom(); }, [messages.length]);

  const saveExtra = (msgs: Message[]) => {
    AsyncStorage.setItem("@dkd:groupe_importe_msgs", JSON.stringify(msgs));
  };

  const send = useCallback(() => {
    const text = input.trim();
    if (!text) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (editingMsg) {
      setMessages((prev) => {
        const updated = prev.map((m) => m.id === editingMsg.id ? { ...m, text } : m);
        saveExtra(updated);
        return updated;
      });
      setEditingMsg(null);
    } else {
      const newMsg: Message = {
        id: Date.now().toString(), memberId: "me", text, time: nowTime(), isMe: true,
        ...(replyTo ? { replyTo: { id: replyTo.id, text: replyTo.text, isMe: !!replyTo.isMe } } : {}),
      };
      setMessages((prev) => {
        const updated = [...prev, newMsg];
        saveExtra(updated);
        return updated;
      });
    }
    setInput(""); setReplyTo(null);
  }, [input, replyTo, editingMsg]);

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
        const newMsgs: Message[] = result.assets.map((asset, i) => ({
          id: (base + i).toString(), memberId: "me", text: "", time: nowTime(), isMe: true,
          mediaUri: asset.uri, mediaType: asset.type === "video" ? "video" : "image",
        }));
        setMessages((prev) => { const u = [...prev, ...newMsgs]; saveExtra(u); return u; });
      }, 200);
    }
  }, []);

  const handleDeleteMsg = (msg: Message) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setMessages((prev) => { const u = prev.filter((m) => m.id !== msg.id); saveExtra(u); return u; });
    setContextMsg(null);
  };

  const handleEditMsg = (msg: Message) => {
    setEditingMsg(msg); setInput(msg.text); setContextMsg(null);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleReplyTo = (msg: Message) => {
    setReplyTo(msg); setContextMsg(null);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleBlock = async (member: Member) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    const next = blockedIds.includes(member.id) ? blockedIds.filter((id) => id !== member.id) : [...blockedIds, member.id];
    setBlockedIds(next);
    await AsyncStorage.setItem(DM_BLOCK_KEY, JSON.stringify(next));
    setContextMember(null);
    Alert.alert(
      blockedIds.includes(member.id) ? "Utilisateur débloqué" : "Utilisateur bloqué",
      `${member.name} a été ${blockedIds.includes(member.id) ? "débloqué" : "bloqué"}.`,
      [{ text: "OK" }]
    );
  };

  const handleDM = async (member: Member) => {
    Haptics.selectionAsync();
    setContextMember(null); setShowSettings(false);

    const convId = `groupe_${member.id}`;
    const timeStr = nowTime();
    const conv = { id: convId, name: member.name, initials: member.initials, color: member.color, preview: "Conversation privée démarrée depuis le groupe", time: timeStr };

    try {
      const [rawExtra, rawActivity] = await Promise.all([AsyncStorage.getItem(DM_EXTRA_KEY), AsyncStorage.getItem(ACTIVITY_KEY)]);
      const existing: typeof conv[] = rawExtra ? JSON.parse(rawExtra) : [];
      await AsyncStorage.setItem(DM_EXTRA_KEY, JSON.stringify([conv, ...existing.filter((c) => c.id !== convId)]));
      const activity: Record<string, any> = rawActivity ? JSON.parse(rawActivity) : {};
      activity[convId] = { timestamp: Date.now() + 9_999_999_999, preview: conv.preview, time: timeStr };
      await AsyncStorage.setItem(ACTIVITY_KEY, JSON.stringify(activity));
    } catch {}

    router.push(`/dm-importe?id=${convId}&name=${encodeURIComponent(member.name)}&initials=${member.initials}&color=${encodeURIComponent(member.color)}` as any);
  };

  const displayName = user?.full_name || user?.email?.split("@")[0] || "Moi";
  const filteredMembers = MEMBERS.filter((m) => m.name.toLowerCase().includes(search.toLowerCase()));

  const visibleMessages = messages.filter((m) => m.isMe || !blockedIds.includes(m.memberId));

  return (
    <View style={[s.root, { backgroundColor: dynBG }]}>

      {/* HEADER */}
      <View style={[s.header, { paddingTop: insets.top + 10, backgroundColor: dynHeader, borderBottomColor: dynBorder }]}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color={dynText} />
        </TouchableOpacity>
        <View style={[s.groupIcon, { backgroundColor: ACCENT + "20" }]}>
          <Ionicons name="people-outline" size={18} color={ACCENT} />
        </View>
        <View style={s.headerInfo}>
          <Text style={[s.headerTitle, { color: dynText }]}>Groupe Importateurs</Text>
          <Text style={[s.headerSub, { color: dynSub }]}>{MEMBERS.length + 1} membres</Text>
        </View>
        <TouchableOpacity style={[s.settingsBtn, { backgroundColor: ACCENT + "18" }]} onPress={() => { Haptics.selectionAsync(); setShowSettings(true); }} activeOpacity={0.7}>
          <Ionicons name="settings-outline" size={20} color={ACCENT} />
        </TouchableOpacity>
      </View>

      {/* MESSAGES + INPUT — keyboard-aware wrapper (WhatsApp style) */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <FlatList
          ref={listRef}
          data={visibleMessages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={[s.list, { paddingBottom: insets.bottom + 12 }]}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={scrollToBottom}
          renderItem={({ item }) => {
            const member = MEMBERS.find((m) => m.id === item.memberId);
            return (
              <Bubble
                msg={item} member={member} isDark={isDark}
                dynCARD={dynCARD} dynText={dynText} dynSub={dynSub} dynBorder={dynBorder}
                onLongPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setContextMsg(item); }}
                onSwipe={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setReplyTo(item); setTimeout(() => inputRef.current?.focus(), 100); }}
                onVideoPress={(uri) => setPlayingVideo(uri)}
                onImagePress={(uri) => setPlayingImage(uri)}
              />
            );
          }}
        />

        {/* INPUT */}
        <View style={{ backgroundColor: dynHeader, borderTopWidth: 1, borderTopColor: dynBorder }}>
          {editingMsg && (
            <View style={[s.replyBanner, { backgroundColor: isDark ? "#1E293B" : "#F0F4FA", borderLeftColor: "#F59E0B" }]}>
              <Ionicons name="pencil-outline" size={14} color="#F59E0B" />
              <View style={{ flex: 1 }}>
                <Text style={[s.replyBannerLabel, { color: "#F59E0B" }]}>Modifier le message</Text>
                <Text style={[s.replyBannerText, { color: dynSub }]} numberOfLines={1}>{editingMsg.text}</Text>
              </View>
              <TouchableOpacity onPress={() => { setEditingMsg(null); setInput(""); }}><Ionicons name="close" size={18} color={dynSub} /></TouchableOpacity>
            </View>
          )}
          {replyTo && !editingMsg && (
            <View style={[s.replyBanner, { backgroundColor: isDark ? "#1E293B" : "#F0F4FA", borderLeftColor: ACCENT }]}>
              <Ionicons name="return-down-forward-outline" size={14} color={ACCENT} />
              <View style={{ flex: 1 }}>
                <Text style={[s.replyBannerLabel, { color: ACCENT }]}>Réponse à {replyTo.isMe ? displayName : (MEMBERS.find((m) => m.id === replyTo.memberId)?.name ?? "membre")}</Text>
                <Text style={[s.replyBannerText, { color: dynSub }]} numberOfLines={1}>{replyTo.text}</Text>
              </View>
              <TouchableOpacity onPress={() => setReplyTo(null)}><Ionicons name="close" size={18} color={dynSub} /></TouchableOpacity>
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
                placeholder={editingMsg ? "Modifier..." : "Écrire un message..."}
                placeholderTextColor={dynSub}
                value={input} onChangeText={setInput}
                multiline maxLength={500}
                returnKeyType="send" onSubmitEditing={send}
              />
            </View>
            <TouchableOpacity
              style={[s.sendBtn, { backgroundColor: input.trim() ? ACCENT : (isDark ? "#1E293B" : "#E5E7EB") }]}
              onPress={send} activeOpacity={0.75}
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

      {/* MESSAGE CONTEXT MENU */}
      <Modal visible={!!contextMsg} animationType="fade" transparent onRequestClose={() => setContextMsg(null)}>
        {contextMsg && (
          <TouchableOpacity style={s.contextOverlay} onPress={() => setContextMsg(null)} activeOpacity={1}>
            <View style={[s.contextMenu, { backgroundColor: dynSheet }]}>
              <View style={[s.contextPreview, { backgroundColor: isDark ? "#0D1117" : "#F8FAFC", borderBottomColor: dynBorder }]}>
                <Text style={[s.contextPreviewText, { color: dynSub }]} numberOfLines={2}>{contextMsg.text}</Text>
              </View>

              {/* Reply — other's messages only */}
              {!contextMsg.isMe && (
                <TouchableOpacity style={[s.contextAction, { borderBottomColor: dynBorder }]} onPress={() => handleReplyTo(contextMsg)} activeOpacity={0.8}>
                  <View style={[s.contextActionIcon, { backgroundColor: "#3B82F618" }]}>
                    <Ionicons name="return-down-forward-outline" size={18} color="#3B82F6" />
                  </View>
                  <Text style={[s.contextActionTitle, { color: dynText }]}>Répondre</Text>
                </TouchableOpacity>
              )}

              {/* Edit — own only */}
              {contextMsg.isMe && (
                <TouchableOpacity style={[s.contextAction, { borderBottomColor: dynBorder }]} onPress={() => handleEditMsg(contextMsg)} activeOpacity={0.8}>
                  <View style={[s.contextActionIcon, { backgroundColor: "#F59E0B18" }]}>
                    <Ionicons name="pencil-outline" size={18} color="#F59E0B" />
                  </View>
                  <Text style={[s.contextActionTitle, { color: dynText }]}>Modifier</Text>
                </TouchableOpacity>
              )}

              {/* Discuter en privé — other only */}
              {!contextMsg.isMe && contextMsg.memberId !== "me" && (() => {
                const m = MEMBERS.find((mb) => mb.id === contextMsg.memberId);
                if (!m) return null;
                return (
                  <TouchableOpacity style={[s.contextAction, { borderBottomColor: dynBorder }]} onPress={() => { setContextMsg(null); handleDM(m); }} activeOpacity={0.8}>
                    <View style={[s.contextActionIcon, { backgroundColor: "#34D39918" }]}>
                      <Ionicons name="chatbubble-ellipses-outline" size={18} color="#34D399" />
                    </View>
                    <Text style={[s.contextActionTitle, { color: dynText }]}>Discuter en privé</Text>
                  </TouchableOpacity>
                );
              })()}

              {/* Delete — always */}
              <TouchableOpacity style={s.contextAction} onPress={() => handleDeleteMsg(contextMsg)} activeOpacity={0.8}>
                <View style={[s.contextActionIcon, { backgroundColor: "#EF444418" }]}>
                  <Ionicons name="trash-outline" size={18} color="#EF4444" />
                </View>
                <Text style={[s.contextActionTitle, { color: "#EF4444" }]}>Supprimer</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[s.contextCancel, { backgroundColor: isDark ? "#1E293B" : "#F0F4FA" }]} onPress={() => setContextMsg(null)} activeOpacity={0.8}>
                <Text style={[s.contextCancelText, { color: dynSub }]}>Annuler</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}
      </Modal>

      {/* SETTINGS PANEL */}
      <Modal visible={showSettings} animationType="slide" transparent onRequestClose={() => setShowSettings(false)}>
        <View style={s.modalOverlay}>
          <View style={[s.settingsSheet, { backgroundColor: dynSheet }]}>
            <View style={[s.sheetHandle, { backgroundColor: isDark ? "#334155" : "#E2E8F0" }]} />
            <View style={[s.sheetHeader, { borderBottomColor: dynBorder }]}>
              <View style={[s.sheetIcon, { backgroundColor: ACCENT + "20" }]}>
                <Ionicons name="people-outline" size={16} color={ACCENT} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.sheetTitle, { color: dynText }]}>Membres du groupe</Text>
                <Text style={[s.sheetSub, { color: dynSub }]}>{MEMBERS.length + 1} participants</Text>
              </View>
              <TouchableOpacity onPress={() => setShowSettings(false)} activeOpacity={0.7}>
                <Ionicons name="close" size={22} color={dynSub} />
              </TouchableOpacity>
            </View>
            <View style={[s.searchWrap, { backgroundColor: isDark ? "#1E293B" : "#F0F4FA", borderColor: dynBorder }]}>
              <Ionicons name="search-outline" size={16} color={dynSub} />
              <TextInput style={[s.searchInput, { color: dynText }]} placeholder="Rechercher un membre..." placeholderTextColor={dynSub} value={search} onChangeText={setSearch} />
              {search.length > 0 && <TouchableOpacity onPress={() => setSearch("")}><Ionicons name="close-circle" size={16} color={dynSub} /></TouchableOpacity>}
            </View>
            <FlatList
              data={filteredMembers} keyExtractor={(m) => m.id}
              contentContainerStyle={{ paddingHorizontal: 14, paddingBottom: 30, gap: 8 }}
              showsVerticalScrollIndicator={false}
              ListHeaderComponent={
                <View style={[s.meMember, { backgroundColor: isDark ? "#1E293B" : "#F8FAFC", borderColor: ACCENT + "44" }]}>
                  <View style={[s.memberAvatar, { backgroundColor: ACCENT + "22" }]}>
                    <Text style={[s.memberAvatarText, { color: ACCENT }]}>{displayName.charAt(0).toUpperCase()}</Text>
                  </View>
                  <View style={s.memberInfo}>
                    <Text style={[s.memberName, { color: dynText }]}>{displayName}</Text>
                    <Text style={[s.memberRole, { color: ACCENT }]}>Vous (admin)</Text>
                  </View>
                  <View style={[s.onlineTag, { backgroundColor: "#22C55E18" }]}>
                    <View style={[s.onlineDot, { backgroundColor: "#22C55E" }]} />
                    <Text style={[s.onlineText, { color: "#22C55E" }]}>En ligne</Text>
                  </View>
                </View>
              }
              renderItem={({ item }) => {
                const isBlocked = blockedIds.includes(item.id);
                return (
                  <TouchableOpacity style={[s.memberRow, { backgroundColor: dynCARD, borderColor: dynBorder }, isBlocked && { opacity: 0.5 }]}
                    onLongPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setContextMember(item); }}
                    activeOpacity={0.8} delayLongPress={400}
                  >
                    <View style={[s.memberAvatar, { backgroundColor: item.color + "22" }]}>
                      <Text style={[s.memberAvatarText, { color: item.color }]}>{item.initials}</Text>
                    </View>
                    <View style={s.memberInfo}>
                      <Text style={[s.memberName, { color: dynText }]}>{item.name}</Text>
                      <Text style={[s.memberRole, { color: dynSub }]}>{isBlocked ? "🚫 Bloqué" : item.role}</Text>
                    </View>
                    <Ionicons name="ellipsis-vertical" size={16} color={dynSub} />
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
      </Modal>

      {/* MEMBER CONTEXT MENU */}
      <Modal visible={!!contextMember} animationType="fade" transparent onRequestClose={() => setContextMember(null)}>
        {contextMember && (
          <TouchableOpacity style={s.contextOverlay} onPress={() => setContextMember(null)} activeOpacity={1}>
            <View style={[s.contextMenu, { backgroundColor: dynSheet }]}>
              <View style={[s.contextHeader, { borderBottomColor: dynBorder }]}>
                <View style={[s.memberAvatar, { backgroundColor: contextMember.color + "22" }]}>
                  <Text style={[s.memberAvatarText, { color: contextMember.color }]}>{contextMember.initials}</Text>
                </View>
                <View>
                  <Text style={[s.memberName, { color: dynText }]}>{contextMember.name}</Text>
                  <Text style={[s.memberRole, { color: dynSub }]}>{contextMember.role}</Text>
                </View>
              </View>
              <TouchableOpacity style={[s.contextAction, { borderBottomColor: dynBorder }]} onPress={() => handleDM(contextMember)} activeOpacity={0.8}>
                <View style={[s.contextActionIcon, { backgroundColor: "#3B82F618" }]}>
                  <Ionicons name="chatbubble-ellipses-outline" size={18} color="#3B82F6" />
                </View>
                <Text style={[s.contextActionTitle, { color: dynText }]}>Discuter en privé</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.contextAction} onPress={() => handleBlock(contextMember)} activeOpacity={0.8}>
                <View style={[s.contextActionIcon, { backgroundColor: "#EF444418" }]}>
                  <Ionicons name={blockedIds.includes(contextMember.id) ? "lock-open-outline" : "ban-outline"} size={18} color="#EF4444" />
                </View>
                <Text style={[s.contextActionTitle, { color: "#EF4444" }]}>
                  {blockedIds.includes(contextMember.id) ? "Débloquer" : "Bloquer"} l'utilisateur
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.contextCancel, { backgroundColor: isDark ? "#1E293B" : "#F0F4FA" }]} onPress={() => setContextMember(null)} activeOpacity={0.8}>
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
  root:       { flex: 1 },
  header:     { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingBottom: 12, gap: 10, borderBottomWidth: 1 },
  backBtn:    { padding: 4 },
  groupIcon:  { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  headerInfo: { flex: 1 },
  headerTitle:{ fontFamily: "Poppins_700Bold", fontSize: 15, lineHeight: 19 },
  headerSub:  { fontFamily: "Poppins_400Regular", fontSize: 11 },
  settingsBtn:{ width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center" },

  list:       { paddingHorizontal: 12, paddingTop: 14, gap: 12 },

  rowMe:      { alignItems: "flex-end" },
  rowOther:   { flexDirection: "row", alignItems: "flex-end", gap: 8 },
  avatar:     { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  avatarText: { fontFamily: "Poppins_700Bold", fontSize: 12 },
  senderName: { fontFamily: "Poppins_600SemiBold", fontSize: 11, marginBottom: 2, marginLeft: 2 },
  bubbleMe:   { borderRadius: 18, borderBottomRightRadius: 4, paddingHorizontal: 14, paddingTop: 8, paddingBottom: 8, maxWidth: SCREEN_W * 0.72 },
  bubbleOther:{ borderRadius: 18, borderBottomLeftRadius: 4, paddingHorizontal: 14, paddingTop: 8, paddingBottom: 8, borderWidth: 1 },
  textMe:     { color: "#fff", fontFamily: "Poppins_400Regular", fontSize: 14, lineHeight: 20 },
  textOther:  { fontFamily: "Poppins_400Regular", fontSize: 14, lineHeight: 20 },
  timeRow:    { flexDirection: "row", alignItems: "center", justifyContent: "flex-end", gap: 3, marginTop: 3 },
  timeMe:     { color: "rgba(255,255,255,0.7)", fontFamily: "Poppins_400Regular", fontSize: 10 },
  timeOther:  { fontFamily: "Poppins_400Regular", fontSize: 10, marginTop: 3, textAlign: "right" },

  replySnippet:    { flexDirection: "row", borderRadius: 8, marginBottom: 6, overflow: "hidden", alignItems: "center" },
  replyBar:        { width: 3, alignSelf: "stretch", marginRight: 8 },
  replySnippetText:{ fontFamily: "Poppins_400Regular", fontSize: 12, flex: 1, paddingVertical: 4 },

  replyBanner:     { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 14, paddingVertical: 8, borderLeftWidth: 3 },
  replyBannerLabel:{ fontFamily: "Poppins_700Bold", fontSize: 11 },
  replyBannerText: { fontFamily: "Poppins_400Regular", fontSize: 12 },

  inputBar:   { flexDirection: "row", alignItems: "flex-end", paddingHorizontal: 10, paddingTop: 10, gap: 8 },
  attachBtn:  { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  inputWrap:  { flex: 1, borderRadius: 22, borderWidth: 1, paddingHorizontal: 14, paddingVertical: Platform.OS === "ios" ? 10 : 6, maxHeight: 120 },
  input:      { fontFamily: "Poppins_400Regular", fontSize: 14, lineHeight: 20 },
  sendBtn:    { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },

  contextOverlay:   { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  contextMenu:      { borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: "hidden", paddingBottom: 30 },
  contextPreview:   { padding: 16, borderBottomWidth: 1 },
  contextPreviewText:{ fontFamily: "Poppins_400Regular", fontSize: 13, fontStyle: "italic" },
  contextHeader:    { flexDirection: "row", alignItems: "center", gap: 12, padding: 16, borderBottomWidth: 1 },
  contextAction:    { flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  contextActionIcon:{ width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  contextActionTitle:{ fontFamily: "Poppins_700Bold", fontSize: 14 },
  contextCancel:    { margin: 14, borderRadius: 14, paddingVertical: 13, alignItems: "center" },
  contextCancelText:{ fontFamily: "Poppins_700Bold", fontSize: 14 },

  modalOverlay:  { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  settingsSheet: { borderTopLeftRadius: 26, borderTopRightRadius: 26, maxHeight: "80%", overflow: "hidden" },
  sheetHandle:   { width: 36, height: 4, borderRadius: 2, alignSelf: "center", marginTop: 10, marginBottom: 6 },
  sheetHeader:   { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1 },
  sheetIcon:     { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  sheetTitle:    { fontFamily: "Poppins_700Bold", fontSize: 16 },
  sheetSub:      { fontFamily: "Poppins_400Regular", fontSize: 11 },
  searchWrap:    { flexDirection: "row", alignItems: "center", gap: 8, margin: 14, borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 9 },
  searchInput:   { flex: 1, fontFamily: "Poppins_400Regular", fontSize: 14 },

  meMember:    { flexDirection: "row", alignItems: "center", borderRadius: 14, borderWidth: 1, padding: 12, gap: 12, marginBottom: 4 },
  memberRow:   { flexDirection: "row", alignItems: "center", borderRadius: 14, borderWidth: 1, padding: 12, gap: 12 },
  memberAvatar:    { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center" },
  memberAvatarText:{ fontFamily: "Poppins_700Bold", fontSize: 15 },
  memberInfo:  { flex: 1, gap: 2 },
  memberName:  { fontFamily: "Poppins_700Bold", fontSize: 14 },
  memberRole:  { fontFamily: "Poppins_400Regular", fontSize: 12 },
  onlineTag:   { flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  onlineDot:   { width: 7, height: 7, borderRadius: 4 },
  onlineText:  { fontFamily: "Poppins_600SemiBold", fontSize: 10 },

  mediaBubble: { width: SCREEN_W * 0.58, aspectRatio: 4 / 3, borderRadius: 12, marginBottom: 4, backgroundColor: "#111" },
  videoBubble: { width: SCREEN_W * 0.58, aspectRatio: 16 / 9, borderRadius: 12, alignItems: "center", justifyContent: "center", marginBottom: 4, backgroundColor: "#0F172A", overflow: "hidden" },
  videoLabel:  { color: "rgba(255,255,255,0.75)", fontFamily: "Poppins_400Regular", fontSize: 11, marginTop: 6 },
  videoModal:  { flex: 1, backgroundColor: "#000" },
  videoCloseBtn: { position: "absolute", right: 16, zIndex: 20 },
  videoPlayer: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
});
