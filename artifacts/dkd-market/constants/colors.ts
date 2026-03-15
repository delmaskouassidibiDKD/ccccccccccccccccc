import { LightColors, DarkColors } from "@/constants/theme-colors";

export const Colors = LightColors;

export default {
  light: {
    text: LightColors.text,
    background: LightColors.background,
    tint: LightColors.primary,
    tabIconDefault: LightColors.textMuted,
    tabIconSelected: LightColors.primary,
  },
  dark: {
    text: DarkColors.text,
    background: DarkColors.background,
    tint: DarkColors.primary,
    tabIconDefault: DarkColors.textMuted,
    tabIconSelected: DarkColors.primary,
  },
};
