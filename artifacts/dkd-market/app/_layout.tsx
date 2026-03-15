import { QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState } from "react";
import { Platform, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { queryClient } from "@/lib/query-client";
import { StatusBar } from "expo-status-bar";
import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
  Poppins_800ExtraBold,
} from "@expo-google-fonts/poppins";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { CartProvider } from "@/contexts/CartContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider, useTheme } from "@/contexts/ThemeContext";
import { LanguageProvider, useLanguage } from "@/contexts/LanguageContext";

SplashScreen.preventAutoHideAsync();

const PROTECTED_ROUTES = ["checkout", "notifications", "chat"];

function useProtectedRoute() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === "auth";
    const inProtectedRoute = PROTECTED_ROUTES.includes(segments[0] as string);
    const emailVerified = user?.email_verified === 1;

    if (isAuthenticated && !emailVerified) {
      if (segments[1] !== "verify-email") {
        router.replace("/auth/verify-email");
      }
    } else if (isAuthenticated && emailVerified && inAuthGroup) {
      router.replace("/(tabs)");
    } else if (!isAuthenticated && inProtectedRoute) {
      router.replace("/auth/login");
    }
  }, [isAuthenticated, isLoading, segments, user]);
}

function RootLayoutNav() {
  useProtectedRoute();
  const { colors, isDark } = useTheme();

  return (
    <>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Stack screenOptions={{ headerBackTitle: "Retour", headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="auth" options={{ headerShown: false }} />
        <Stack.Screen
          name="product/[id]"
          options={{
            headerShown: true,
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.text,
            headerTitle: "",
            presentation: "card",
          }}
        />
        <Stack.Screen
          name="seller/[id]"
          options={{
            headerShown: false,
            presentation: "card",
          }}
        />
        <Stack.Screen
          name="checkout"
          options={{
            headerShown: false,
            presentation: "card",
          }}
        />
        <Stack.Screen
          name="search"
          options={{
            headerShown: false,
            presentation: "card",
            animation: "fade",
          }}
        />
        <Stack.Screen
          name="notifications"
          options={{
            headerShown: false,
            presentation: "card",
          }}
        />
        <Stack.Screen
          name="chat/[id]"
          options={{
            headerShown: false,
            presentation: "card",
          }}
        />
        <Stack.Screen
          name="profile"
          options={{
            headerShown: false,
            presentation: "card",
          }}
        />
      </Stack>
    </>
  );
}

function AppBootstrap({ fontsLoaded }: { fontsLoaded: boolean }) {
  const { colors, isLoaded: themeLoaded } = useTheme();
  const { isLoaded: langLoaded } = useLanguage();

  // Wait for icon fonts (Ionicons, MaterialCommunityIcons) and Poppins before showing
  // content — prevents icons/text popping in on both web and Expo Go.
  // Safety timeout: 12s on web (Replit CDN proxy can be slow), 8s on native.
  const [fontTimeout, setFontTimeout] = useState(false);
  useEffect(() => {
    const limit = Platform.OS === "web" ? 12000 : 8000;
    const t = setTimeout(() => setFontTimeout(true), limit);
    return () => clearTimeout(t);
  }, []);

  const fontsEffectivelyReady = fontsLoaded || fontTimeout;
  const coreReady = themeLoaded && langLoaded && fontsEffectivelyReady;

  useEffect(() => {
    if (coreReady) {
      SplashScreen.hideAsync();
    }
  }, [coreReady]);

  if (!coreReady) {
    return <View style={{ flex: 1, backgroundColor: colors.background }} />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardProvider>
        <RootLayoutNav />
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    // Icon fonts — only needed on web; Expo Go bundles them natively already
    // Loading them on native causes X marks conflict with Expo Go's bundled fonts
    ...(Platform.OS === "web" ? { ...Ionicons.font, ...MaterialCommunityIcons.font } : {}),
    // Text fonts
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Poppins_800ExtraBold,
  });
  const fontsReady = !!fontsLoaded || !!fontError;

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <LanguageProvider>
            <AuthProvider>
              <CartProvider>
                <AppBootstrap fontsLoaded={fontsReady} />
              </CartProvider>
            </AuthProvider>
          </LanguageProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
