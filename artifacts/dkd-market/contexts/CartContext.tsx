import React, { createContext, useContext, useState, useMemo, ReactNode } from "react";

export type CartItem = {
  id: string;
  name: string;
  price: number;
  currency: string;
  quantity: number;
  image: string;
  seller: string;
  color?: string;
  size?: string;
};

export type FavoriteVideo = {
  id: string;
  title: string;
  seller: string;
  thumbnail: string;
  views: number;
};

export type GroupMessage = {
  id: string;
  groupName: string;
  country: string;
  lastMessage: string;
  time: string;
  unread: number;
  members: number;
  target: number;
  image: string;
};

type CartContextValue = {
  cartItems: CartItem[];
  favoriteVideos: FavoriteVideo[];
  groupMessages: GroupMessage[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, qty: number) => void;
  cartCount: number;
  cartTotal: number;
};

const CartContext = createContext<CartContextValue | null>(null);

const MOCK_GROUPS: GroupMessage[] = [
  {
    id: "g1",
    groupName: "Les Amis du Style",
    country: "CI",
    lastMessage: "Objectif.. Discuter",
    time: "15 min",
    unread: 2,
    members: 4,
    target: 10,
    image: "fashion",
  },
  {
    id: "g2",
    groupName: "Tech Africa Deals",
    country: "SN",
    lastMessage: "Bonjour à tous !",
    time: "1h",
    unread: 0,
    members: 7,
    target: 15,
    image: "tech",
  },
  {
    id: "g3",
    groupName: "Cotonou Textiles",
    country: "BJ",
    lastMessage: "Proforma envoyé",
    time: "4h",
    unread: 1,
    members: 3,
    target: 8,
    image: "textile",
  },
];

const MOCK_FAVORITES: FavoriteVideo[] = [
  {
    id: "v1",
    title: "Trench-coat Premium Hiver",
    seller: "@Global Garments",
    thumbnail: "brown",
    views: 12500,
  },
  {
    id: "v2",
    title: "Smartphone X-Pro Max",
    seller: "@TechShop Abidjan",
    thumbnail: "blue",
    views: 8300,
  },
];

export function CartProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [favoriteVideos] = useState<FavoriteVideo[]>(MOCK_FAVORITES);
  const [groupMessages] = useState<GroupMessage[]>(MOCK_GROUPS);

  const addToCart = (item: CartItem) => {
    setCartItems((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + item.quantity } : i
        );
      }
      return [...prev, item];
    });
  };

  const removeFromCart = (id: string) => {
    setCartItems((prev) => prev.filter((i) => i.id !== id));
  };

  const updateQuantity = (id: string, qty: number) => {
    if (qty <= 0) {
      removeFromCart(id);
      return;
    }
    setCartItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, quantity: qty } : i))
    );
  };

  const cartCount = cartItems.reduce((sum, i) => sum + i.quantity, 0);
  const cartTotal = cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const value = useMemo(
    () => ({
      cartItems,
      favoriteVideos,
      groupMessages,
      addToCart,
      removeFromCart,
      updateQuantity,
      cartCount,
      cartTotal,
    }),
    [cartItems, favoriteVideos, groupMessages, cartCount, cartTotal]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within CartProvider");
  return context;
}
