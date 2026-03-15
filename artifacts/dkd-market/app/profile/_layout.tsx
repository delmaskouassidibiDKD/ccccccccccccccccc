import { Stack } from "expo-router";
import { Colors } from "@/constants/colors";

export default function ProfileLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: Colors.background },
        headerTintColor: Colors.text,
        headerBackTitle: "Retour",
        headerTitleStyle: { fontFamily: "Poppins_600SemiBold", fontSize: 17 },
        contentStyle: { backgroundColor: Colors.background },
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="settings" options={{ headerTitle: "Paramètres" }} />
      <Stack.Screen name="addresses" options={{ headerTitle: "Mes adresses" }} />
    </Stack>
  );
}
