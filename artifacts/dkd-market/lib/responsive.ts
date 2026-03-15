import { Dimensions } from "react-native";

const { width: W, height: H } = Dimensions.get("window");

const BASE_W = 375;
const BASE_H = 812;

export const W_SCREEN = W;
export const H_SCREEN = H;

export const scale = (size: number) => (W / BASE_W) * size;

export const vs = (size: number) => (H / BASE_H) * size;

export const ms = (size: number, factor = 0.5) =>
  size + (scale(size) - size) * factor;

export const mvs = (size: number, factor = 0.5) =>
  size + (vs(size) - size) * factor;

export const fs = (size: number) => Math.round(ms(size, 0.3));
