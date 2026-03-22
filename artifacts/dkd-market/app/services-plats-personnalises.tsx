import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, Pressable,
  Animated, Dimensions, TextInput, FlatList, Image,
  KeyboardAvoidingView, Platform, Modal, ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/contexts/ThemeContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";

const ACCENT       = "#A855F7";
const DRAWER_W     = 260;
const STORAGE_KEY  = "@dkd:chef_ia_conversations";

/* ── Types ── */
interface Message {
  id: string;
  role: "user" | "ai";
  text?: string;
  mediaUri?: string;
  mediaType?: "image" | "video";
  timestamp: number;
}
interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
}

const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
const fmtTime = (ts: number) => new Date(ts).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
const fmtDate = (ts: number) => new Date(ts).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });

/* ═══════════════════════════════════════════════
   COMPOSANT ROBOT CHEF IA
   ═══════════════════════════════════════════════ */
function CuteChefRobot({ size = 100 }: { size?: number }) {
  const k = size / 100;
  return (
    <View style={{ width: 110 * k, alignItems: "center" }}>
      <View style={{ alignItems: "center", zIndex: 2 }}>
        <View style={{ width: 46 * k, height: 38 * k, borderRadius: 23 * k, backgroundColor: "#FFFFFF", shadowColor: "#000", shadowOpacity: 0.12, shadowRadius: 6, elevation: 3, marginBottom: -10 * k }} />
        <View style={{ position: "absolute", top: 8 * k, left: "50%", marginLeft: -16 * k }}>
          <View style={{ width: 32 * k, height: 1.5 * k, backgroundColor: "rgba(200,200,200,0.5)", marginBottom: 5 * k }} />
          <View style={{ width: 32 * k, height: 1.5 * k, backgroundColor: "rgba(200,200,200,0.5)", marginBottom: 5 * k }} />
          <View style={{ width: 32 * k, height: 1.5 * k, backgroundColor: "rgba(200,200,200,0.5)" }} />
        </View>
        <View style={{ width: 58 * k, height: 16 * k, backgroundColor: "#F5F5F5", borderRadius: 5 * k, borderWidth: 1, borderColor: "#E0E0E0", shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 3, elevation: 2 }} />
      </View>
      <View style={{ width: 62 * k, height: 56 * k, borderRadius: 18 * k, backgroundColor: "#60C5E4", alignItems: "center", justifyContent: "center", position: "relative", zIndex: 1, shadowColor: "#3AA0C0", shadowOpacity: 0.35, shadowRadius: 10, elevation: 5, marginTop: -2 * k }}>
        <View style={{ position: "absolute", top: 8 * k, left: 10 * k, width: 20 * k, height: 10 * k, borderRadius: 10 * k, backgroundColor: "rgba(255,255,255,0.18)" }} />
        <View style={{ position: "absolute", left: -8 * k, top: 16 * k, width: 12 * k, height: 18 * k, borderRadius: 6 * k, backgroundColor: "#4EB5D8" }}>
          <View style={{ width: 5 * k, height: 8 * k, borderRadius: 3 * k, backgroundColor: "#7CD0E8", alignSelf: "center", marginTop: 5 * k }} />
        </View>
        <View style={{ position: "absolute", right: -8 * k, top: 16 * k, width: 12 * k, height: 18 * k, borderRadius: 6 * k, backgroundColor: "#4EB5D8" }}>
          <View style={{ width: 5 * k, height: 8 * k, borderRadius: 3 * k, backgroundColor: "#7CD0E8", alignSelf: "center", marginTop: 5 * k }} />
        </View>
        <View style={{ flexDirection: "row", gap: 11 * k, marginTop: 6 * k }}>
          {[0, 1].map((i) => (
            <View key={i} style={{ width: 18 * k, height: 18 * k, borderRadius: 9 * k, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center" }}>
              <View style={{ width: 11 * k, height: 11 * k, borderRadius: 6 * k, backgroundColor: ACCENT, alignItems: "center", justifyContent: "center" }}>
                <View style={{ width: 5 * k, height: 5 * k, borderRadius: 3 * k, backgroundColor: "#1A0030" }} />
                <View style={{ position: "absolute", top: 1.5 * k, left: 1.5 * k, width: 3 * k, height: 3 * k, borderRadius: 2 * k, backgroundColor: "rgba(255,255,255,0.85)" }} />
              </View>
            </View>
          ))}
        </View>
        <View style={{ position: "absolute", left: 7 * k, bottom: 11 * k, width: 12 * k, height: 7 * k, borderRadius: 6 * k, backgroundColor: "rgba(255,160,170,0.45)" }} />
        <View style={{ position: "absolute", right: 7 * k, bottom: 11 * k, width: 12 * k, height: 7 * k, borderRadius: 6 * k, backgroundColor: "rgba(255,160,170,0.45)" }} />
        <View style={{ width: 24 * k, height: 11 * k, borderBottomLeftRadius: 12 * k, borderBottomRightRadius: 12 * k, borderWidth: 2.5 * k, borderTopWidth: 0, borderColor: "#1A6080", marginTop: 5 * k }} />
      </View>
      <View style={{ width: 54 * k, height: 30 * k, backgroundColor: "#4EB5D8", borderRadius: 9 * k, marginTop: 3 * k, alignItems: "center", justifyContent: "center", position: "relative", shadowColor: "#2A90B0", shadowOpacity: 0.25, shadowRadius: 6, elevation: 3 }}>
        <View style={{ position: "absolute", left: -10 * k, top: 4 * k, width: 11 * k, height: 20 * k, borderRadius: 6 * k, backgroundColor: "#3EA8C8" }}>
          <View style={{ width: 11 * k, height: 9 * k, borderRadius: 5 * k, backgroundColor: "#60C5E4", position: "absolute", bottom: -3 * k }} />
        </View>
        <View style={{ position: "absolute", right: -10 * k, top: 4 * k, width: 11 * k, height: 20 * k, borderRadius: 6 * k, backgroundColor: "#3EA8C8" }}>
          <View style={{ width: 11 * k, height: 9 * k, borderRadius: 5 * k, backgroundColor: "#60C5E4", position: "absolute", bottom: -3 * k }} />
        </View>
        <View style={{ width: 28 * k, height: 22 * k, backgroundColor: "rgba(255,255,255,0.28)", borderRadius: 6 * k, alignItems: "center", justifyContent: "space-evenly", paddingVertical: 3 * k }}>
          <View style={{ width: 4 * k, height: 4 * k, borderRadius: 2 * k, backgroundColor: "rgba(255,255,255,0.65)" }} />
          <View style={{ width: 4 * k, height: 4 * k, borderRadius: 2 * k, backgroundColor: "rgba(255,255,255,0.65)" }} />
        </View>
      </View>
    </View>
  );
}

/* ── Indicateur de frappe IA ── */
function TypingDots({ isDark }: { isDark: boolean }) {
  const d1 = useRef(new Animated.Value(0)).current;
  const d2 = useRef(new Animated.Value(0)).current;
  const d3 = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const anim = (dot: Animated.Value, delay: number) =>
      Animated.loop(Animated.sequence([
        Animated.delay(delay),
        Animated.timing(dot, { toValue: -5, duration: 300, useNativeDriver: true }),
        Animated.timing(dot, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.delay(600),
      ]));
    Animated.parallel([anim(d1, 0), anim(d2, 150), anim(d3, 300)]).start();
  }, []);
  return (
    <View style={td.wrap}>
      <View style={[td.avatar, { backgroundColor: ACCENT + "22" }]}>
        <CuteChefRobot size={28} />
      </View>
      <View style={[td.bubble, { backgroundColor: isDark ? "#1E293B" : "#FFFFFF" }]}>
        {[d1, d2, d3].map((d, i) => (
          <Animated.View key={i} style={[td.dot, { backgroundColor: isDark ? "#64748B" : "#9CA3AF", transform: [{ translateY: d }] }]} />
        ))}
      </View>
    </View>
  );
}
const td = StyleSheet.create({
  wrap:   { flexDirection: "row", alignItems: "flex-end", gap: 8, paddingHorizontal: 16, paddingVertical: 6 },
  avatar: { width: 32, height: 32, borderRadius: 10, overflow: "hidden", alignItems: "center", justifyContent: "center" },
  bubble: { flexDirection: "row", gap: 5, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 18, borderBottomLeftRadius: 4 },
  dot:    { width: 7, height: 7, borderRadius: 4 },
});

/* ── Bulle de message ── */
function MessageBubble({ msg, isDark, dynText, dynSub }: { msg: Message; isDark: boolean; dynText: string; dynSub: string }) {
  const isUser = msg.role === "user";
  return (
    <View style={[mb.row, isUser ? mb.rowUser : mb.rowAI]}>
      {!isUser && (
        <View style={[mb.aiAvatar, { backgroundColor: ACCENT + "22" }]}>
          <CuteChefRobot size={28} />
        </View>
      )}
      <View style={[mb.bubble, isUser ? [mb.bubbleUser, { backgroundColor: ACCENT }] : [mb.bubbleAI, { backgroundColor: isDark ? "#1E293B" : "#FFFFFF" }]]}>
        {msg.mediaUri && msg.mediaType === "image" && (
          <Image source={{ uri: msg.mediaUri }} style={mb.mediaImg} resizeMode="cover" />
        )}
        {msg.mediaUri && msg.mediaType === "video" && (
          <View style={mb.videoThumb}>
            <Image source={{ uri: msg.mediaUri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
            <View style={mb.videoOverlay}>
              <Ionicons name="play-circle" size={36} color="rgba(255,255,255,0.9)" />
            </View>
          </View>
        )}
        {msg.text ? <Text style={[mb.text, { color: isUser ? "#FFFFFF" : dynText }]}>{msg.text}</Text> : null}
        <Text style={[mb.time, { color: isUser ? "rgba(255,255,255,0.65)" : dynSub }]}>{fmtTime(msg.timestamp)}</Text>
      </View>
    </View>
  );
}
const mb = StyleSheet.create({
  row:       { flexDirection: "row", alignItems: "flex-end", gap: 8, paddingHorizontal: 16, marginVertical: 3 },
  rowUser:   { justifyContent: "flex-end" },
  rowAI:     { justifyContent: "flex-start" },
  aiAvatar:  { width: 32, height: 32, borderRadius: 10, overflow: "hidden", alignItems: "center", justifyContent: "center", marginBottom: 2 },
  bubble:    { maxWidth: "75%", borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10, gap: 6 },
  bubbleUser:{ borderBottomRightRadius: 4 },
  bubbleAI:  { borderBottomLeftRadius: 4, shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  text:      { fontFamily: "Poppins_400Regular", fontSize: 14, lineHeight: 21 },
  time:      { fontFamily: "Poppins_400Regular", fontSize: 10, alignSelf: "flex-end" },
  mediaImg:  { width: 200, height: 150, borderRadius: 12 },
  videoThumb:{ width: 200, height: 150, borderRadius: 12, overflow: "hidden", backgroundColor: "#000", alignItems: "center", justifyContent: "center" },
  videoOverlay: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.3)" },
});

/* ═══════════════════════════════════════════════
   PAGE PRINCIPALE
   ═══════════════════════════════════════════════ */
export default function ServicesPlatsPersonnalisesPage() {
  const router  = useRouter();
  const insets  = useSafeAreaInsets();
  const { isDark } = useTheme();

  /* ── Drawer ── */
  const [drawerOpen,    setDrawerOpen]    = useState(false);
  const [activeSection, setActiveSection] = useState<"chef-ia">("chef-ia");
  const drawerAnim  = useRef(new Animated.Value(-DRAWER_W)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;

  /* ── Conversations ── */
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId,  setActiveConvId]  = useState<string | null>(null);
  const [showConvList,  setShowConvList]  = useState(false);
  const [convToDelete,  setConvToDelete]  = useState<string | null>(null);
  const [menuConvId,    setMenuConvId]    = useState<string | null>(null);

  /* ── Chat ── */
  const [inputText,  setInputText]  = useState("");
  const [isTyping,   setIsTyping]   = useState(false);
  const [showMedia,  setShowMedia]  = useState(false);
  const flatRef = useRef<FlatList>(null);

  /* ── Theme ── */
  const dynBG     = isDark ? "#0D1117" : "#F0F4FA";
  const dynCARD   = isDark ? "#161B25" : "#FFFFFF";
  const dynText   = isDark ? "#F0F6FF" : "#1A1A1A";
  const dynSub    = isDark ? "#64748B" : "#6B7280";
  const dynBorder = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.08)";
  const dynHeader = isDark ? "#111827" : "#FFFFFF";
  const dynDrawer = isDark ? "#0F172A" : "#FFFFFF";
  const dynInput  = isDark ? "#1E293B" : "#FFFFFF";

  /* ── Chargement conversations ── */
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (!raw) return;
      const convs: Conversation[] = JSON.parse(raw);
      setConversations(convs);
      if (convs.length > 0) setActiveConvId(convs[0].id);
    }).catch(() => {});
  }, []);

  const saveConversations = useCallback(async (convs: Conversation[]) => {
    setConversations(convs);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(convs));
  }, []);

  const activeConv = conversations.find((c) => c.id === activeConvId) ?? null;
  const messages   = activeConv?.messages ?? [];
  const hasMessages = messages.length > 0;

  /* ── Nouvelle conversation ── */
  const createNewConversation = useCallback(() => {
    const newConv: Conversation = { id: uid(), title: "Nouvelle discussion", messages: [], createdAt: Date.now() };
    const updated = [newConv, ...conversations];
    saveConversations(updated);
    setActiveConvId(newConv.id);
    setShowConvList(false);
    Haptics.selectionAsync();
  }, [conversations, saveConversations]);

  /* ── Envoi de message ── */
  const sendMessage = useCallback(async (text?: string, mediaUri?: string, mediaType?: "image" | "video") => {
    if (!text?.trim() && !mediaUri) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    let convId = activeConvId;
    let convs  = [...conversations];

    if (!convId) {
      const newConv: Conversation = { id: uid(), title: text?.slice(0, 40) || "Discussion média", messages: [], createdAt: Date.now() };
      convs = [newConv, ...convs];
      convId = newConv.id;
      setActiveConvId(convId);
    }

    const userMsg: Message = { id: uid(), role: "user", text: text?.trim(), mediaUri, mediaType, timestamp: Date.now() };
    convs = convs.map((c) => c.id === convId ? { ...c, title: c.messages.length === 0 ? (text?.slice(0, 40) || "Discussion média") : c.title, messages: [...c.messages, userMsg] } : c);
    await saveConversations(convs);
    setInputText("");
    setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);

    /* Indicateur frappe IA */
    setIsTyping(true);
    setTimeout(async () => {
      const aiMsg: Message = {
        id: uid(), role: "ai",
        text: "Je suis le Chef IA DKD 🍽️ Je suis en cours de développement et serai bientôt capable de vous aider à créer et personnaliser vos plats avec expertise.",
        timestamp: Date.now(),
      };
      const final = convs.map((c) => c.id === convId ? { ...c, messages: [...c.messages, aiMsg] } : c);
      await saveConversations(final);
      setIsTyping(false);
      setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
    }, 1800);
  }, [activeConvId, conversations, saveConversations]);

  /* ── Supprimer conversation ── */
  const deleteConversation = useCallback(async (id: string) => {
    const updated = conversations.filter((c) => c.id !== id);
    await saveConversations(updated);
    if (activeConvId === id) {
      setActiveConvId(updated.length > 0 ? updated[0].id : null);
    }
    setConvToDelete(null);
    setMenuConvId(null);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  }, [conversations, activeConvId, saveConversations]);

  /* ── Media picker ── */
  const pickFromGallery = async () => {
    setShowMedia(false);
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return;
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.All, quality: 0.8 });
    if (!res.canceled && res.assets?.[0]) {
      const asset = res.assets[0];
      sendMessage(undefined, asset.uri, asset.type === "video" ? "video" : "image");
    }
  };
  const pickFromCamera = async () => {
    setShowMedia(false);
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") return;
    const res = await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
    if (!res.canceled && res.assets?.[0]) sendMessage(undefined, res.assets[0].uri, "image");
  };
  const recordVideo = async () => {
    setShowMedia(false);
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") return;
    const res = await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Videos, quality: 0.8, videoMaxDuration: 60 });
    if (!res.canceled && res.assets?.[0]) sendMessage(undefined, res.assets[0].uri, "video");
  };

  /* ── Drawer ── */
  const openDrawer = () => {
    Haptics.selectionAsync();
    setDrawerOpen(true);
    Animated.parallel([
      Animated.spring(drawerAnim, { toValue: 0, useNativeDriver: true, damping: 20, stiffness: 200 }),
      Animated.timing(overlayAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
    ]).start();
  };
  const closeDrawer = () => {
    Animated.parallel([
      Animated.spring(drawerAnim, { toValue: -DRAWER_W, useNativeDriver: true, damping: 20, stiffness: 200 }),
      Animated.timing(overlayAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => setDrawerOpen(false));
  };

  return (
    <View style={[s.root, { backgroundColor: dynBG, paddingTop: insets.top }]}>

      {/* ── HEADER ── */}
      <View style={[s.header, { backgroundColor: dynHeader, borderBottomColor: dynBorder }]}>
        <TouchableOpacity style={[s.iconBtn, { backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)" }]} onPress={openDrawer} activeOpacity={0.7}>
          <View style={s.hamburger}>
            <View style={[s.hLine, { backgroundColor: dynText }]} />
            <View style={[s.hLine, { backgroundColor: dynText, width: 14 }]} />
            <View style={[s.hLine, { backgroundColor: dynText }]} />
          </View>
        </TouchableOpacity>

        <View style={s.headerCenter}>
          <View style={[s.headerIconBg, { backgroundColor: ACCENT + "22" }]}>
            <Ionicons name="color-wand-outline" size={15} color={ACCENT} />
          </View>
          <Text style={[s.headerTitle, { color: dynText }]} numberOfLines={1}>Chef IA DKD</Text>
        </View>

        <View style={s.headerRight}>
          {/* Bouton liste conversations — apparaît dès qu'il y a des messages */}
          {hasMessages && (
            <TouchableOpacity
              style={[s.convListBtn, { backgroundColor: ACCENT + "18", borderColor: ACCENT + "44" }]}
              onPress={() => { Haptics.selectionAsync(); setShowConvList(true); }}
              activeOpacity={0.8}
            >
              <Ionicons name="chatbubbles-outline" size={15} color={ACCENT} />
            </TouchableOpacity>
          )}

          {/* Mini robot — apparaît après le premier message */}
          {hasMessages && (
            <View style={[s.miniRobotWrap, { backgroundColor: ACCENT + "15", borderColor: ACCENT + "33" }]}>
              <CuteChefRobot size={26} />
            </View>
          )}

          {/* Bouton fermer */}
          <TouchableOpacity style={[s.iconBtn, { backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)" }]} onPress={() => router.back()} activeOpacity={0.7}>
            <Ionicons name="close-outline" size={20} color={dynText} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── CONTENU CHAT ── */}
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={0}>

        {/* État vide — robot centré */}
        {!hasMessages && !isTyping && (
          <View style={s.emptyState}>
            <View style={[s.robotWrap, { backgroundColor: isDark ? "#161B25" : "#EEF4FA" }]}>
              <CuteChefRobot size={100} />
            </View>
            <Text style={[s.emptyTitle, { color: dynText }]}>Chef IA DKD</Text>
            <Text style={[s.emptySub, { color: dynSub }]}>Posez vos questions culinaires, partagez des photos de plats et créez des recettes personnalisées avec votre assistant IA.</Text>
          </View>
        )}

        {/* Liste messages */}
        {(hasMessages || isTyping) && (
          <FlatList
            ref={flatRef}
            data={messages}
            keyExtractor={(m) => m.id}
            contentContainerStyle={s.messagesList}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: false })}
            renderItem={({ item }) => (
              <MessageBubble msg={item} isDark={isDark} dynText={dynText} dynSub={dynSub} />
            )}
            ListFooterComponent={isTyping ? <TypingDots isDark={isDark} /> : null}
          />
        )}

        {/* ── BARRE D'INPUT ── */}
        <View style={[s.inputBar, { backgroundColor: dynHeader, borderTopColor: dynBorder }]}>
          {/* Bouton média */}
          <TouchableOpacity style={[s.mediaBtn, { backgroundColor: isDark ? "#1E293B" : "#F1F5F9" }]} onPress={() => setShowMedia(true)} activeOpacity={0.8}>
            <Ionicons name="image-outline" size={20} color={ACCENT} />
          </TouchableOpacity>

          {/* Champ texte */}
          <TextInput
            style={[s.textInput, { backgroundColor: dynInput, color: dynText, borderColor: dynBorder }]}
            placeholder="Écrivez votre message…"
            placeholderTextColor={dynSub}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={2000}
            returnKeyType="send"
          />

          {/* Bouton envoyer */}
          <TouchableOpacity
            style={[s.sendBtn, { backgroundColor: inputText.trim() ? ACCENT : (isDark ? "#1E293B" : "#E2E8F0") }]}
            onPress={() => sendMessage(inputText)}
            disabled={!inputText.trim()}
            activeOpacity={0.8}
          >
            <Ionicons name="send" size={16} color={inputText.trim() ? "#FFFFFF" : dynSub} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* ── OVERLAY DRAWER ── */}
      {drawerOpen && (
        <Animated.View style={[s.overlay, { opacity: overlayAnim }]} pointerEvents="auto">
          <Pressable style={{ flex: 1 }} onPress={closeDrawer} />
        </Animated.View>
      )}

      {/* ── DRAWER ── */}
      <Animated.View style={[s.drawer, { backgroundColor: dynDrawer, borderRightColor: dynBorder, transform: [{ translateX: drawerAnim }], paddingTop: insets.top }]} pointerEvents={drawerOpen ? "auto" : "none"}>
        <View style={[s.drawerHeader, { borderBottomColor: dynBorder }]}>
          <View style={[s.drawerLogoCircle, { backgroundColor: ACCENT + "22" }]}>
            <Ionicons name="color-wand-outline" size={18} color={ACCENT} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[s.drawerTitle, { color: dynText }]}>Services</Text>
            <Text style={[s.drawerSub, { color: dynSub }]}>Plats personnalisés</Text>
          </View>
          <TouchableOpacity onPress={closeDrawer} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={20} color={dynSub} />
          </TouchableOpacity>
        </View>
        <Text style={[s.drawerSectionLabel, { color: dynSub }]}>OUTILS</Text>
        <TouchableOpacity
          style={[s.drawerItem, { backgroundColor: ACCENT + "14", borderLeftColor: ACCENT, borderBottomColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.05)" }]}
          onPress={() => { setActiveSection("chef-ia"); closeDrawer(); }} activeOpacity={0.75}
        >
          <View style={[s.drawerItemIcon, { backgroundColor: ACCENT + "18", alignItems: "center", justifyContent: "center" }]}>
            <CuteChefRobot size={34} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[s.drawerItemLabel, { color: ACCENT }]}>Chef IA DKD</Text>
            <Text style={[s.drawerItemDesc, { color: dynSub }]}>Intelligence culinaire</Text>
          </View>
          <Ionicons name="chevron-forward" size={14} color={ACCENT} />
        </TouchableOpacity>
      </Animated.View>

      {/* ── MODAL : LISTE DES CONVERSATIONS ── */}
      <Modal visible={showConvList} animationType="slide" transparent onRequestClose={() => setShowConvList(false)}>
        <Pressable style={s.convOverlay} onPress={() => setShowConvList(false)}>
          <Pressable style={[s.convSheet, { backgroundColor: isDark ? "#0F172A" : "#FFFFFF" }]} onPress={() => {}}>

            <View style={s.convSheetHandle} />

            {/* En-tête */}
            <View style={[s.convSheetHeader, { borderBottomColor: dynBorder }]}>
              <Text style={[s.convSheetTitle, { color: dynText }]}>Mes conversations</Text>
              <View style={{ flexDirection: "row", gap: 10 }}>
                {/* Nouvelle discussion */}
                <TouchableOpacity style={[s.newConvBtn, { backgroundColor: ACCENT }]} onPress={createNewConversation} activeOpacity={0.85}>
                  <Ionicons name="add" size={18} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setShowConvList(false)}>
                  <Ionicons name="close-circle" size={26} color={dynSub} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Liste */}
            <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
              {conversations.length === 0 ? (
                <View style={{ padding: 40, alignItems: "center" }}>
                  <Text style={[{ fontFamily: "Poppins_400Regular", fontSize: 13, color: dynSub }]}>Aucune conversation</Text>
                </View>
              ) : conversations.map((conv) => (
                <View key={conv.id} style={[s.convItem, { borderBottomColor: dynBorder, backgroundColor: conv.id === activeConvId ? ACCENT + "10" : "transparent" }]}>
                  <TouchableOpacity style={{ flex: 1 }} onPress={() => { setActiveConvId(conv.id); setShowConvList(false); Haptics.selectionAsync(); }} activeOpacity={0.8}>
                    <Text style={[s.convItemTitle, { color: dynText }]} numberOfLines={1}>{conv.title}</Text>
                    <Text style={[s.convItemDate, { color: dynSub }]}>
                      {conv.messages.length} message{conv.messages.length > 1 ? "s" : ""} · {fmtDate(conv.createdAt)}
                    </Text>
                  </TouchableOpacity>
                  {/* 3 points */}
                  <TouchableOpacity style={s.convMenuBtn} onPress={() => { Haptics.selectionAsync(); setMenuConvId(conv.id === menuConvId ? null : conv.id); }}>
                    <Ionicons name="ellipsis-vertical" size={18} color={dynSub} />
                  </TouchableOpacity>
                  {/* Menu contextuel */}
                  {menuConvId === conv.id && (
                    <View style={[s.convContextMenu, { backgroundColor: isDark ? "#1E293B" : "#FFFFFF", borderColor: dynBorder }]}>
                      <TouchableOpacity style={s.convContextItem} onPress={() => { setMenuConvId(null); setConvToDelete(conv.id); }}>
                        <Ionicons name="trash-outline" size={15} color="#EF4444" />
                        <Text style={[s.convContextText, { color: "#EF4444" }]}>Supprimer</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ── MODAL : CONFIRMATION SUPPRESSION ── */}
      <Modal visible={!!convToDelete} animationType="fade" transparent onRequestClose={() => setConvToDelete(null)}>
        <Pressable style={s.deleteOverlay} onPress={() => setConvToDelete(null)}>
          <Pressable style={[s.deleteCard, { backgroundColor: isDark ? "#161B25" : "#FFFFFF" }]} onPress={() => {}}>
            <View style={[s.deleteIconCircle, { backgroundColor: "#EF444422" }]}>
              <Ionicons name="trash-outline" size={28} color="#EF4444" />
            </View>
            <Text style={[s.deleteTitle, { color: dynText }]}>Supprimer cette conversation ?</Text>
            <Text style={[s.deleteDesc, { color: dynSub }]}>Cette action est irréversible. Tous les messages seront définitivement supprimés.</Text>
            <View style={s.deleteBtnRow}>
              <TouchableOpacity style={[s.deleteCancelBtn, { backgroundColor: isDark ? "#2D3748" : "#F1F5F9" }]} onPress={() => setConvToDelete(null)}>
                <Text style={[s.deleteCancelText, { color: dynText }]}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.deleteConfirmBtn} onPress={() => convToDelete && deleteConversation(convToDelete)}>
                <Ionicons name="trash-outline" size={15} color="#fff" />
                <Text style={s.deleteConfirmText}>Supprimer</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ── MODAL : CHOISIR MEDIA ── */}
      <Modal visible={showMedia} animationType="slide" transparent onRequestClose={() => setShowMedia(false)}>
        <Pressable style={s.mediaOverlay} onPress={() => setShowMedia(false)}>
          <Pressable style={[s.mediaSheet, { backgroundColor: isDark ? "#0F172A" : "#FFFFFF" }]} onPress={() => {}}>
            <View style={s.convSheetHandle} />
            <Text style={[s.mediaSheetTitle, { color: dynText }]}>Ajouter un média</Text>
            {[
              { icon: "camera-outline" as const,  label: "Prendre une photo",        color: ACCENT,    action: pickFromCamera },
              { icon: "videocam-outline" as const, label: "Enregistrer une vidéo",    color: "#3B82F6", action: recordVideo },
              { icon: "images-outline" as const,   label: "Choisir depuis la galerie", color: "#22C55E", action: pickFromGallery },
            ].map((item) => (
              <TouchableOpacity key={item.label} style={[s.mediaOption, { borderColor: dynBorder }]} onPress={item.action} activeOpacity={0.8}>
                <View style={[s.mediaOptionIcon, { backgroundColor: item.color + "22" }]}>
                  <Ionicons name={item.icon} size={22} color={item.color} />
                </View>
                <Text style={[s.mediaOptionText, { color: dynText }]}>{item.label}</Text>
                <Ionicons name="chevron-forward" size={16} color={dynSub} />
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={[s.mediaCancelBtn, { backgroundColor: isDark ? "#1E293B" : "#F1F5F9" }]} onPress={() => setShowMedia(false)}>
              <Text style={[s.mediaCancelText, { color: dynSub }]}>Annuler</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

    </View>
  );
}

/* ── Styles ── */
const s = StyleSheet.create({
  root:         { flex: 1 },
  header:       { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, gap: 10 },
  iconBtn:      { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  hamburger:    { gap: 4, alignItems: "flex-start" },
  hLine:        { height: 2, width: 18, borderRadius: 2 },
  headerCenter: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8 },
  headerIconBg: { width: 28, height: 28, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  headerTitle:  { fontFamily: "Poppins_700Bold", fontSize: 15, flex: 1 },
  headerRight:  { flexDirection: "row", alignItems: "center", gap: 8 },
  convListBtn:  { width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  miniRobotWrap:{ width: 34, height: 34, borderRadius: 10, overflow: "hidden", alignItems: "center", justifyContent: "center", borderWidth: 1 },

  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16, paddingHorizontal: 36 },
  robotWrap:  { width: 160, height: 160, borderRadius: 36, alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 16, elevation: 4 },
  emptyTitle: { fontFamily: "Poppins_700Bold", fontSize: 20, textAlign: "center" },
  emptySub:   { fontFamily: "Poppins_400Regular", fontSize: 13, textAlign: "center", lineHeight: 20, opacity: 0.72 },

  messagesList: { paddingTop: 12, paddingBottom: 8 },

  inputBar:   { flexDirection: "row", alignItems: "flex-end", paddingHorizontal: 12, paddingVertical: 10, borderTopWidth: 1, gap: 10 },
  mediaBtn:   { width: 42, height: 42, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  textInput:  { flex: 1, borderRadius: 18, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 10, fontFamily: "Poppins_400Regular", fontSize: 14, maxHeight: 120 },
  sendBtn:    { width: 42, height: 42, borderRadius: 13, alignItems: "center", justifyContent: "center" },

  overlay:    { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.45)", zIndex: 10 },
  drawer:     { position: "absolute", top: 0, left: 0, bottom: 0, width: DRAWER_W, borderRightWidth: 1, zIndex: 20, shadowColor: "#000", shadowOpacity: 0.28, shadowRadius: 18, shadowOffset: { width: 6, height: 0 }, elevation: 18 },
  drawerHeader:     { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16, paddingVertical: 16, borderBottomWidth: 1 },
  drawerLogoCircle: { width: 38, height: 38, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  drawerTitle:      { fontFamily: "Poppins_700Bold", fontSize: 14 },
  drawerSub:        { fontFamily: "Poppins_400Regular", fontSize: 11 },
  drawerSectionLabel: { fontFamily: "Poppins_600SemiBold", fontSize: 10, letterSpacing: 1.2, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 6 },
  drawerItem:         { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 14, paddingVertical: 12, borderLeftWidth: 3, borderBottomWidth: 1 },
  drawerItemIcon:     { width: 44, height: 44, borderRadius: 12, overflow: "hidden" },
  drawerItemLabel:    { fontFamily: "Poppins_700Bold", fontSize: 13 },
  drawerItemDesc:     { fontFamily: "Poppins_400Regular", fontSize: 11 },

  convOverlay:      { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  convSheet:        { borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 32 },
  convSheetHandle:  { width: 40, height: 4, borderRadius: 2, backgroundColor: "#CBD5E1", alignSelf: "center", marginTop: 12, marginBottom: 4 },
  convSheetHeader:  { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 18, paddingVertical: 14, borderBottomWidth: 1 },
  convSheetTitle:   { fontFamily: "Poppins_700Bold", fontSize: 17 },
  newConvBtn:       { width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  convItem:         { flexDirection: "row", alignItems: "center", paddingHorizontal: 18, paddingVertical: 14, borderBottomWidth: 1 },
  convItemTitle:    { fontFamily: "Poppins_600SemiBold", fontSize: 14 },
  convItemDate:     { fontFamily: "Poppins_400Regular", fontSize: 11, marginTop: 2 },
  convMenuBtn:      { padding: 8 },
  convContextMenu:  { position: "absolute", right: 12, top: 36, borderRadius: 12, borderWidth: 1, paddingVertical: 4, zIndex: 100, shadowColor: "#000", shadowOpacity: 0.12, shadowRadius: 8, elevation: 10 },
  convContextItem:  { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 14, paddingVertical: 10 },
  convContextText:  { fontFamily: "Poppins_600SemiBold", fontSize: 13 },

  deleteOverlay:     { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", alignItems: "center", justifyContent: "center", padding: 24 },
  deleteCard:        { width: "100%", borderRadius: 22, padding: 24, alignItems: "center", gap: 12, shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 20, elevation: 10 },
  deleteIconCircle:  { width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center" },
  deleteTitle:       { fontFamily: "Poppins_700Bold", fontSize: 17, textAlign: "center" },
  deleteDesc:        { fontFamily: "Poppins_400Regular", fontSize: 13, textAlign: "center", lineHeight: 20 },
  deleteBtnRow:      { flexDirection: "row", gap: 12, marginTop: 6, width: "100%" },
  deleteCancelBtn:   { flex: 1, paddingVertical: 13, borderRadius: 14, alignItems: "center" },
  deleteCancelText:  { fontFamily: "Poppins_600SemiBold", fontSize: 14 },
  deleteConfirmBtn:  { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 13, borderRadius: 14, backgroundColor: "#EF4444" },
  deleteConfirmText: { fontFamily: "Poppins_700Bold", fontSize: 14, color: "#fff" },

  mediaOverlay:      { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  mediaSheet:        { borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 32, paddingTop: 4 },
  mediaSheetTitle:   { fontFamily: "Poppins_700Bold", fontSize: 16, paddingHorizontal: 20, paddingVertical: 14 },
  mediaOption:       { flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1 },
  mediaOptionIcon:   { width: 42, height: 42, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  mediaOptionText:   { fontFamily: "Poppins_600SemiBold", fontSize: 14, flex: 1 },
  mediaCancelBtn:    { marginHorizontal: 20, marginTop: 12, paddingVertical: 14, borderRadius: 14, alignItems: "center" },
  mediaCancelText:   { fontFamily: "Poppins_600SemiBold", fontSize: 14 },
});
