import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  AppState,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/colors";
import { router, useLocalSearchParams } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, ChatMessage } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/contexts/ThemeContext";
import { useLanguage } from "@/contexts/LanguageContext";

function MessageBubble({ item, isMe }: { item: ChatMessage; isMe: boolean }) {
  const { colors } = useTheme();

  const timeFormat = (dateStr: string): string => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <View style={[styles.bubbleRow, isMe ? styles.bubbleRowMe : styles.bubbleRowOther]}>
      {!isMe && (
        <View style={[styles.avatarSmall, { backgroundColor: colors.surface }]}>
          <Text style={[styles.avatarSmallText, { color: colors.textSecondary }]}>
            {(item.first_name?.[0] || "?").toUpperCase()}
          </Text>
        </View>
      )}
      <View style={[
        styles.bubble,
        isMe
          ? [styles.bubbleMe, { backgroundColor: colors.primary }]
          : [styles.bubbleOther, { backgroundColor: colors.backgroundCard, borderColor: colors.border }],
      ]}>
        {!isMe && item.first_name && (
          <Text style={[styles.senderName, { color: colors.primary }]}>
            {item.first_name} {item.last_name || ""}
          </Text>
        )}
        <Text style={[styles.bubbleText, isMe ? styles.bubbleTextMe : { color: colors.text }]}>{item.message}</Text>
        <Text style={[styles.bubbleTime, isMe ? styles.bubbleTimeMe : { color: colors.textMuted }]}>{timeFormat(item.created_at)}</Text>
      </View>
    </View>
  );
}

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");
  const [appActive, setAppActive] = useState(true);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (s) => setAppActive(s === "active"));
    return () => sub.remove();
  }, []);
  const inputRef = useRef<TextInput>(null);
  const topPadding = Platform.OS === "web" ? 0 : insets.top;
  const bottomPadding = Platform.OS === "web" ? 34 : insets.bottom;

  const chatQuery = useQuery({
    queryKey: ["/api/messages/chats", id],
    queryFn: () => api.messages.getChat(id!),
    enabled: !!id,
  });

  const messagesQuery = useQuery({
    queryKey: ["/api/messages/chats", id, "messages"],
    queryFn: () => api.messages.getMessages(id!, "limit=50"),
    enabled: !!id,
    refetchInterval: appActive ? 5000 : false,
  });

  const markReadMutation = useMutation({
    mutationFn: () => api.messages.markRead(id!),
  });

  const sendMutation = useMutation({
    mutationFn: (msg: string) => api.messages.sendMessage(id!, msg),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages/chats", id, "messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/messages/chats"] });
    },
  });

  React.useEffect(() => {
    if (id) markReadMutation.mutate();
  }, [id]);

  const handleSend = useCallback(() => {
    const text = message.trim();
    if (!text) return;
    setMessage("");
    sendMutation.mutate(text);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [message]);

  const rawMessages = messagesQuery.data?.items ?? (Array.isArray(messagesQuery.data) ? messagesQuery.data : []) as ChatMessage[];
  const messages = [...rawMessages].reverse();

  const dateLabel = useCallback((dateStr: string): string => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
    if (diffDays === 0) return t.chat.today;
    if (diffDays === 1) return t.chat.yesterday;
    return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
  }, [t]);

  const renderItem = useCallback(({ item, index }: { item: ChatMessage; index: number }) => {
    const isMe = item.sender_id === user?.id;
    const prevMsg = index > 0 ? messages[index - 1] : null;
    const showDateLabel = !prevMsg || dateLabel(item.created_at) !== dateLabel(prevMsg.created_at);

    return (
      <View>
        {showDateLabel && (
          <View style={styles.dateLabelWrap}>
            <Text style={[styles.dateLabelText, { color: colors.textMuted, backgroundColor: colors.surface }]}>{dateLabel(item.created_at)}</Text>
          </View>
        )}
        <MessageBubble item={item} isMe={isMe} />
      </View>
    );
  }, [user?.id, messages, colors, dateLabel]);

  const chatTitle = chatQuery.data?.chat_code || `Chat #${id}`;

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background, paddingTop: topPadding }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={0}
    >
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>{chatTitle}</Text>
        </View>
      </View>

      {messagesQuery.isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : messagesQuery.isError ? (
        <View style={styles.centered}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.textMuted} />
          <Text style={[styles.errorText, { color: colors.text }]}>{t.chat.loadError}</Text>
          <TouchableOpacity style={[styles.retryBtn, { backgroundColor: colors.primary }]} onPress={() => messagesQuery.refetch()}>
            <Text style={styles.retryText}>{t.common.retry}</Text>
          </TouchableOpacity>
        </View>
      ) : messages.length === 0 ? (
        <View style={styles.centered}>
          <Ionicons name="chatbubbles-outline" size={48} color={colors.textMuted} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>{t.chat.noMessages}</Text>
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>{t.chat.sendFirstMessage}</Text>
        </View>
      ) : (
        <FlatList
          data={messages}
          keyExtractor={(item: ChatMessage) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
        />
      )}

      <View style={[styles.inputBar, { borderTopColor: colors.border, backgroundColor: colors.backgroundCard, paddingBottom: Math.max(bottomPadding, 8) }]}>
        <TextInput
          ref={inputRef}
          style={[styles.input, { backgroundColor: colors.surface, color: colors.text }]}
          value={message}
          onChangeText={setMessage}
          placeholder={t.chat.yourMessage}
          placeholderTextColor={colors.textMuted}
          multiline
          maxLength={1000}
        />
        <TouchableOpacity
          style={[styles.sendBtn, { backgroundColor: colors.primary }, !message.trim() && styles.sendBtnDisabled]}
          onPress={handleSend}
          disabled={!message.trim() || sendMutation.isPending}
        >
          {sendMutation.isPending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="send" size={18} color="#fff" />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: { marginRight: 12 },
  headerInfo: { flex: 1 },
  headerTitle: {
    color: Colors.text,
    fontFamily: "Poppins_700Bold",
    fontSize: 16,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingHorizontal: 32,
  },
  errorText: {
    color: Colors.text,
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
  },
  retryBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  retryText: { color: "#fff", fontFamily: "Poppins_700Bold", fontSize: 13 },
  emptyTitle: {
    color: Colors.text,
    fontFamily: "Poppins_700Bold",
    fontSize: 16,
    textAlign: "center",
  },
  emptyText: {
    color: Colors.textMuted,
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    textAlign: "center",
  },
  messagesList: { padding: 16, gap: 4 },
  dateLabelWrap: {
    alignItems: "center",
    paddingVertical: 12,
  },
  dateLabelText: {
    color: Colors.textMuted,
    fontFamily: "Poppins_500Medium",
    fontSize: 11,
    backgroundColor: Colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
    overflow: "hidden",
  },
  bubbleRow: {
    flexDirection: "row",
    marginBottom: 6,
    maxWidth: "80%",
  },
  bubbleRowMe: { alignSelf: "flex-end" },
  bubbleRowOther: { alignSelf: "flex-start" },
  avatarSmall: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
    marginTop: 4,
  },
  avatarSmallText: {
    color: Colors.textSecondary,
    fontFamily: "Poppins_700Bold",
    fontSize: 11,
  },
  bubble: {
    padding: 12,
    borderRadius: 16,
    maxWidth: "100%",
  },
  bubbleMe: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: Colors.backgroundCard,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  senderName: {
    color: Colors.primary,
    fontFamily: "Poppins_600SemiBold",
    fontSize: 11,
    marginBottom: 2,
  },
  bubbleText: {
    color: Colors.text,
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    lineHeight: 20,
  },
  bubbleTextMe: { color: "#fff" },
  bubbleTime: {
    color: Colors.textMuted,
    fontFamily: "Poppins_400Regular",
    fontSize: 10,
    marginTop: 4,
    textAlign: "right",
  },
  bubbleTimeMe: { color: "rgba(255,255,255,0.7)" },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.backgroundCard,
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: Colors.text,
    fontFamily: "Poppins_400Regular",
    fontSize: 14,
    maxHeight: 100,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  sendBtnDisabled: { opacity: 0.5 },
});
