import React, { useState, useRef, useCallback } from "react";
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput,
  KeyboardAvoidingView, Platform, Image, Modal, Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/contexts/ThemeContext";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";

const SELLER_CONVS_KEY = "@dkd:seller_convs";
const ACCENT = "#FF6200";

type ChatMsg = { id: string; text: string; sender: "me" | "seller"; time: string; images?: string[] };
type SellerConv = { sellerId: string; shopName: string; initials: string; lastMessage: string; lastTime: string; unread: number; messages: ChatMsg[] };

function nowTime() {
  return new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

function BubbleImage({ uri }: { uri: string }) {
  return <Image source={{ uri }} style={st.bubbleImg} resizeMode="cover" />;
}

export default function DmBoutiquePage() {
  const router  = useRouter();
  const insets  = useSafeAreaInsets();
  const { isDark } = useTheme();
  const { sellerId, shopName, initials, color } = useLocalSearchParams<{
    sellerId: string; shopName: string; initials: string; color: string;
  }>();

  const contactColor = color ?? "#FF6200";
  const displayName  = shopName ?? "Boutique";
  const displayInit  = initials ?? (displayName.slice(0, 2).toUpperCase());

  const dynBG     = isDark ? "#0D1117" : "#F0F4FA";
  const dynCARD   = isDark ? "#161B25" : "#FFFFFF";
  const dynText   = isDark ? "#F0F6FF" : "#1A1A1A";
  const dynSub    = isDark ? "#64748B" : "#6B7280";
  const dynBorder = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.08)";
  const dynHeader = isDark ? "#111827" : "#FFFFFF";
  const dynInput  = isDark ? "#1E293B" : "#F3F4F6";

  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input,    setInput]    = useState("");
  const [images,   setImages]   = useState<string[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [msgToDelete, setMsgToDelete] = useState<ChatMsg | null>(null);
  const listRef = useRef<FlatList<ChatMsg>>(null);

  const loadMessages = useCallback(async () => {
    try {
      const raw   = await AsyncStorage.getItem(SELLER_CONVS_KEY);
      const convs: SellerConv[] = raw ? JSON.parse(raw) : [];
      const idx   = convs.findIndex(c => c.sellerId === (sellerId ?? ""));
      if (idx >= 0) {
        setMessages(convs[idx].messages ?? []);
        /* Marquer comme lu */
        if (convs[idx].unread > 0) {
          convs[idx].unread = 0;
          await AsyncStorage.setItem(SELLER_CONVS_KEY, JSON.stringify(convs));
        }
      }
    } catch {}
  }, [sellerId]);

  useFocusEffect(useCallback(() => { loadMessages(); }, [loadMessages]));

  const pickImages = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: 4,
    });
    if (!result.canceled) {
      setImages(prev => [...prev, ...result.assets.map(a => a.uri)].slice(0, 4));
    }
  };

  const sendReply = async () => {
    const text = input.trim();
    if (!text && images.length === 0) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setInput("");
    const sentImages = [...images];
    setImages([]);
    const now = nowTime();
    const newMsg: ChatMsg = {
      id:      `dm_${Date.now()}`,
      text,
      sender:  "seller",
      time:    now,
      images:  sentImages.length > 0 ? sentImages : undefined,
    };
    const updatedMsgs = [...messages, newMsg];
    setMessages(updatedMsgs);
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 80);
    try {
      const raw   = await AsyncStorage.getItem(SELLER_CONVS_KEY);
      const convs: SellerConv[] = raw ? JSON.parse(raw) : [];
      const idx   = convs.findIndex(c => c.sellerId === (sellerId ?? ""));
      if (idx >= 0) {
        convs[idx].messages    = updatedMsgs;
        convs[idx].lastMessage = text || "📷 Photo";
        convs[idx].lastTime    = now;
        convs[idx].unread      = 0;
      }
      await AsyncStorage.setItem(SELLER_CONVS_KEY, JSON.stringify(convs));
    } catch {}
  };

  const confirmDelete = (msg: ChatMsg) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setMsgToDelete(msg);
    setShowDeleteConfirm(true);
  };

  const deleteMessage = async () => {
    if (!msgToDelete) return;
    const updated = messages.filter(m => m.id !== msgToDelete.id);
    setMessages(updated);
    try {
      const raw   = await AsyncStorage.getItem(SELLER_CONVS_KEY);
      const convs: SellerConv[] = raw ? JSON.parse(raw) : [];
      const idx   = convs.findIndex(c => c.sellerId === (sellerId ?? ""));
      if (idx >= 0) {
        convs[idx].messages = updated;
        if (updated.length > 0) {
          const last = updated[updated.length - 1];
          convs[idx].lastMessage = last.text || "📷 Photo";
          convs[idx].lastTime    = last.time;
        }
        await AsyncStorage.setItem(SELLER_CONVS_KEY, JSON.stringify(convs));
      }
    } catch {}
    setMsgToDelete(null);
    setShowDeleteConfirm(false);
  };

  const renderItem = ({ item }: { item: ChatMsg }) => {
    const isMe = item.sender === "seller";
    return (
      <TouchableOpacity
        onLongPress={() => confirmDelete(item)}
        delayLongPress={400}
        activeOpacity={0.85}
        style={[st.msgRow, isMe ? st.msgRowMe : st.msgRowThem]}
      >
        {!isMe && (
          <View style={[st.miniAvatar, { backgroundColor: contactColor + "28" }]}>
            <Text style={[st.miniAvatarText, { color: contactColor }]}>{displayInit}</Text>
          </View>
        )}
        <View style={[st.bubble, isMe ? [st.bubbleMe, { backgroundColor: ACCENT }] : [st.bubbleThem, { backgroundColor: isDark ? "#1E293B" : "#FFFFFF", borderColor: dynBorder }]]}>
          {!isMe && (
            <Text style={[st.bubbleSender, { color: contactColor }]}>{displayName}</Text>
          )}
          {item.images && item.images.length > 0 && (
            <View style={st.imgRow}>
              {item.images.map((uri, i) => <BubbleImage key={i} uri={uri} />)}
            </View>
          )}
          {item.text.length > 0 && (
            <Text style={[st.bubbleText, { color: isMe ? "#fff" : dynText }]}>{item.text}</Text>
          )}
          <Text style={[st.bubbleTime, { color: isMe ? "rgba(255,255,255,0.65)" : dynSub }]}>{item.time}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <KeyboardAvoidingView
      style={[st.root, { backgroundColor: dynBG }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={insets.bottom + 10}
    >
      {/* HEADER */}
      <View style={[st.header, { paddingTop: insets.top + 10, backgroundColor: dynHeader, borderBottomColor: dynBorder }]}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} style={st.backBtn}>
          <Ionicons name="arrow-back" size={22} color={dynText} />
        </TouchableOpacity>
        <View style={[st.headerAvatar, { backgroundColor: contactColor + "28" }]}>
          <Text style={[st.headerAvatarText, { color: contactColor }]}>{displayInit}</Text>
        </View>
        <View style={st.headerInfo}>
          <Text style={[st.headerName, { color: dynText }]} numberOfLines={1}>{displayName}</Text>
          <Text style={[st.headerSub, { color: dynSub }]}>Aperçu public · Acheteur</Text>
        </View>
      </View>

      {/* MESSAGE LIST */}
      {messages.length === 0 ? (
        <View style={st.empty}>
          <Ionicons name="chatbubble-ellipses-outline" size={52} color={dynSub} />
          <Text style={[st.emptyTitle, { color: dynText }]}>Aucun message</Text>
          <Text style={[st.emptyDesc, { color: dynSub }]}>
            Les messages de cet acheteur apparaîtront ici. Répondez en bas.
          </Text>
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={m => m.id}
          contentContainerStyle={st.list}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => messages.length > 0 && listRef.current?.scrollToEnd({ animated: false })}
          renderItem={renderItem}
        />
      )}

      {/* PREVIEW IMAGES */}
      {images.length > 0 && (
        <View style={[st.imgPreviewRow, { backgroundColor: dynCARD, borderTopColor: dynBorder }]}>
          {images.map((uri, i) => (
            <View key={i} style={st.imgPreviewWrap}>
              <Image source={{ uri }} style={st.imgPreview} />
              <TouchableOpacity
                style={st.imgRemove}
                onPress={() => setImages(prev => prev.filter((_, j) => j !== i))}
                activeOpacity={0.8}
              >
                <Ionicons name="close-circle" size={18} color="#EF4444" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {/* INPUT */}
      <View style={[st.inputBar, { backgroundColor: dynCARD, borderTopColor: dynBorder, paddingBottom: insets.bottom || 12 }]}>
        <TouchableOpacity onPress={pickImages} activeOpacity={0.7} style={st.attachBtn}>
          <Ionicons name="image-outline" size={22} color={dynSub} />
        </TouchableOpacity>
        <TextInput
          style={[st.input, { backgroundColor: dynInput, color: dynText, borderColor: dynBorder }]}
          placeholder="Répondre à l'acheteur…"
          placeholderTextColor={dynSub}
          value={input}
          onChangeText={setInput}
          multiline
          returnKeyType="send"
          onSubmitEditing={sendReply}
        />
        <TouchableOpacity
          onPress={sendReply}
          activeOpacity={0.8}
          style={[st.sendBtn, { opacity: input.trim().length > 0 || images.length > 0 ? 1 : 0.4 }]}
        >
          <Ionicons name="send" size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* DELETE CONFIRM */}
      <Modal visible={showDeleteConfirm} transparent animationType="fade" onRequestClose={() => setShowDeleteConfirm(false)}>
        <Pressable style={st.delOverlay} onPress={() => setShowDeleteConfirm(false)}>
          <Pressable style={[st.delSheet, { backgroundColor: dynCARD, borderColor: dynBorder }]} onPress={() => {}}>
            <Text style={[st.delTitle, { color: dynText }]}>Supprimer le message ?</Text>
            <Text style={[st.delSub, { color: dynSub }]}>Ce message sera supprimé définitivement.</Text>
            <View style={st.delBtns}>
              <TouchableOpacity style={[st.delCancel, { borderColor: dynBorder }]} onPress={() => setShowDeleteConfirm(false)} activeOpacity={0.75}>
                <Text style={[st.delCancelText, { color: dynText }]}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={st.delConfirm} onPress={deleteMessage} activeOpacity={0.75}>
                <Text style={st.delConfirmText}>Supprimer</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const st = StyleSheet.create({
  root:   { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingBottom: 12, gap: 10, borderBottomWidth: 1 },
  backBtn:        { padding: 4 },
  headerAvatar:   { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  headerAvatarText:{ fontFamily: "Poppins_700Bold", fontSize: 14 },
  headerInfo:     { flex: 1 },
  headerName:     { fontFamily: "Poppins_700Bold", fontSize: 15 },
  headerSub:      { fontFamily: "Poppins_400Regular", fontSize: 11 },

  list: { paddingHorizontal: 14, paddingVertical: 16, gap: 8 },

  msgRow:     { flexDirection: "row", alignItems: "flex-end", gap: 8, marginVertical: 2 },
  msgRowMe:   { justifyContent: "flex-end" },
  msgRowThem: { justifyContent: "flex-start" },

  miniAvatar:     { width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  miniAvatarText: { fontFamily: "Poppins_700Bold", fontSize: 11 },

  bubble:      { maxWidth: "75%", borderRadius: 16, padding: 10, gap: 4 },
  bubbleMe:    { borderBottomRightRadius: 4 },
  bubbleThem:  { borderWidth: 1, borderBottomLeftRadius: 4 },
  bubbleSender:{ fontFamily: "Poppins_600SemiBold", fontSize: 10, marginBottom: 2 },
  bubbleText:  { fontFamily: "Poppins_400Regular", fontSize: 14, lineHeight: 20 },
  bubbleTime:  { fontFamily: "Poppins_400Regular", fontSize: 10, alignSelf: "flex-end" },

  imgRow:  { flexDirection: "row", flexWrap: "wrap", gap: 4 },
  bubbleImg: { width: 80, height: 80, borderRadius: 8 },

  imgPreviewRow:  { flexDirection: "row", padding: 10, gap: 8, borderTopWidth: 1 },
  imgPreviewWrap: { position: "relative" },
  imgPreview:     { width: 56, height: 56, borderRadius: 8 },
  imgRemove:      { position: "absolute", top: -6, right: -6 },

  inputBar:  { flexDirection: "row", alignItems: "flex-end", paddingHorizontal: 12, paddingTop: 10, gap: 8, borderTopWidth: 1 },
  attachBtn: { padding: 6, marginBottom: 4 },
  input:     { flex: 1, borderRadius: 22, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10, fontFamily: "Poppins_400Regular", fontSize: 14, maxHeight: 120 },
  sendBtn:   { width: 40, height: 40, borderRadius: 20, backgroundColor: ACCENT, alignItems: "center", justifyContent: "center", marginBottom: 2 },

  empty:      { flex: 1, alignItems: "center", justifyContent: "center", gap: 10, paddingHorizontal: 32 },
  emptyTitle: { fontFamily: "Poppins_700Bold", fontSize: 16 },
  emptyDesc:  { fontFamily: "Poppins_400Regular", fontSize: 13, textAlign: "center", lineHeight: 20 },

  delOverlay:     { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", alignItems: "center", justifyContent: "center", padding: 32 },
  delSheet:       { width: "100%", borderRadius: 16, padding: 20, gap: 12, borderWidth: 1 },
  delTitle:       { fontFamily: "Poppins_700Bold", fontSize: 15, textAlign: "center" },
  delSub:         { fontFamily: "Poppins_400Regular", fontSize: 13, textAlign: "center" },
  delBtns:        { flexDirection: "row", gap: 10, marginTop: 4 },
  delCancel:      { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: "center", borderWidth: 1 },
  delCancelText:  { fontFamily: "Poppins_600SemiBold", fontSize: 13 },
  delConfirm:     { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: "center", backgroundColor: "#EF4444" },
  delConfirmText: { fontFamily: "Poppins_700Bold", fontSize: 13, color: "#fff" },
});
