import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/colors";
import { router } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, AppNotification } from "@/lib/api";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/contexts/ThemeContext";
import { useLanguage } from "@/contexts/LanguageContext";

const NOTIFICATION_ICONS: Record<string, { name: string; color: string }> = {
  order: { name: "cube-outline", color: "#3B82F6" },
  promotion: { name: "pricetag-outline", color: Colors.primary },
  message: { name: "chatbubble-outline", color: "#8B5CF6" },
  group: { name: "people-outline", color: "#22C55E" },
  system: { name: "information-circle-outline", color: Colors.textSecondary },
  delivery: { name: "bicycle-outline", color: "#06B6D4" },
  payment: { name: "wallet-outline", color: "#F59E0B" },
};

function getNotifIcon(type: string) {
  return NOTIFICATION_ICONS[type] || NOTIFICATION_ICONS.system;
}

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "now";
  if (diffMin < 60) return `${diffMin}min`;
  const diffHrs = Math.floor(diffMin / 60);
  if (diffHrs < 24) return `${diffHrs}h`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

function NotificationItem({ item, onMarkRead }: { item: AppNotification; onMarkRead: (id: number) => void }) {
  const { colors } = useTheme();
  const icon = getNotifIcon(item.type);
  const isUnread = item.is_read === 0;

  const handlePress = () => {
    if (isUnread) {
      onMarkRead(item.id);
    }
    Haptics.selectionAsync();
    if (item.data) {
      try {
        const data = JSON.parse(item.data);
        if (data.order_id) router.push(`/(tabs)/panier`);
        else if (data.product_id) router.push(`/product/${data.product_id}`);
        else if (data.chat_id) router.push(`/chat/${data.chat_id}`);
      } catch {}
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.notifCard,
        { backgroundColor: colors.backgroundCard, borderColor: colors.border },
        isUnread && { borderColor: colors.primary + "40", backgroundColor: colors.primary + "08" },
      ]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={[styles.notifIconWrap, { backgroundColor: icon.color + "20" }]}>
        <Ionicons name={icon.name as any} size={22} color={icon.color} />
      </View>
      <View style={styles.notifContent}>
        <View style={styles.notifHeader}>
          <Text style={[styles.notifTitle, { color: colors.text }]} numberOfLines={1}>{item.title}</Text>
          <Text style={[styles.notifTime, { color: colors.textMuted }]}>{timeAgo(item.created_at)}</Text>
        </View>
        <Text style={[styles.notifMessage, { color: colors.textSecondary }]} numberOfLines={2}>{item.message}</Text>
      </View>
      {isUnread && <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />}
    </TouchableOpacity>
  );
}

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const topPadding = Platform.OS === "web" ? 0 : insets.top;

  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ["/api/notifications", filter],
    queryFn: () => api.notifications.list(filter === "unread" ? "unread=1" : ""),
  });

  const markReadMutation = useMutation({
    mutationFn: (id: number) => api.notifications.markRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => api.notifications.markAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
  });

  const notifications = data?.items ?? (Array.isArray(data) ? data : []) as AppNotification[];
  const hasUnread = notifications.some((n: AppNotification) => n.is_read === 0);

  const handleMarkRead = useCallback((id: number) => {
    markReadMutation.mutate(id);
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: topPadding }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t.notifications.title}</Text>
        {hasUnread && (
          <TouchableOpacity
            onPress={() => {
              markAllReadMutation.mutate();
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
            style={styles.markAllBtn}
          >
            <Ionicons name="checkmark-done" size={22} color={colors.primary} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[
            styles.filterBtn,
            { backgroundColor: colors.backgroundCard, borderColor: colors.border },
            filter === "all" && { backgroundColor: colors.primary + "20", borderColor: colors.primary },
          ]}
          onPress={() => setFilter("all")}
        >
          <Text style={[styles.filterText, { color: colors.textMuted }, filter === "all" && { color: colors.primary }]}>{t.notifications.all}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterBtn,
            { backgroundColor: colors.backgroundCard, borderColor: colors.border },
            filter === "unread" && { backgroundColor: colors.primary + "20", borderColor: colors.primary },
          ]}
          onPress={() => setFilter("unread")}
        >
          <Text style={[styles.filterText, { color: colors.textMuted }, filter === "unread" && { color: colors.primary }]}>{t.notifications.unread}</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : isError ? (
        <View style={styles.centered}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.textMuted} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>{t.notifications.loadError}</Text>
          <TouchableOpacity style={[styles.retryBtn, { backgroundColor: colors.primary }]} onPress={() => refetch()}>
            <Text style={styles.retryText}>{t.common.retry}</Text>
          </TouchableOpacity>
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.centered}>
          <Ionicons name="notifications-off-outline" size={48} color={colors.textMuted} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            {filter === "unread" ? t.notifications.noUnread : t.notifications.noNotifications}
          </Text>
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>
            {t.notifications.appearHere}
          </Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item: AppNotification) => item.id.toString()}
          renderItem={({ item }: { item: AppNotification }) => (
            <NotificationItem item={item} onMarkRead={handleMarkRead} />
          )}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: Platform.OS === "web" ? 34 : 90 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
        />
      )}
    </View>
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
  headerTitle: {
    flex: 1,
    color: Colors.text,
    fontFamily: "Poppins_700Bold",
    fontSize: 20,
  },
  markAllBtn: { padding: 4 },
  filterRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  filterBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.backgroundCard,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterText: {
    color: Colors.textMuted,
    fontFamily: "Poppins_600SemiBold",
    fontSize: 12,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingHorizontal: 32,
  },
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
  retryBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 4,
  },
  retryText: { color: "#fff", fontFamily: "Poppins_700Bold", fontSize: 13 },
  notifCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.backgroundCard,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  notifIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  notifContent: { flex: 1, gap: 4 },
  notifHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  notifTitle: {
    color: Colors.text,
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    flex: 1,
    marginRight: 8,
  },
  notifTime: {
    color: Colors.textMuted,
    fontFamily: "Poppins_400Regular",
    fontSize: 11,
  },
  notifMessage: {
    color: Colors.textSecondary,
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    lineHeight: 18,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
});
