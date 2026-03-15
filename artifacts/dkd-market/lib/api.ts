import { getStoredAccessToken, refreshAuthToken, getApiBase } from "@/lib/auth-storage";

async function getAuthHeaders(): Promise<Record<string, string>> {
  const token = await getStoredAccessToken();
  if (token) {
    return { Authorization: `Bearer ${token}` };
  }
  return {};
}

async function handleResponse<T>(res: Response): Promise<T> {
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || `Erreur ${res.status}`);
  }
  return json.data as T;
}

async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const authHeaders = await getAuthHeaders();
  let res = await fetch(url, {
    ...options,
    headers: { ...authHeaders, ...options.headers },
  });

  if (res.status === 401) {
    const newToken = await refreshAuthToken();
    if (newToken) {
      res = await fetch(url, {
        ...options,
        headers: { Authorization: `Bearer ${newToken}`, ...options.headers },
      });
    }
  }

  return res;
}

export async function apiGet<T>(path: string): Promise<T> {
  const res = await authFetch(`${getApiBase()}${path}`);
  return handleResponse<T>(res);
}

export async function apiPost<T>(path: string, data?: unknown): Promise<T> {
  const res = await authFetch(`${getApiBase()}${path}`, {
    method: "POST",
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
  });
  return handleResponse<T>(res);
}

export async function apiPostFormData<T>(path: string, formData: FormData): Promise<T> {
  const res = await authFetch(`${getApiBase()}${path}`, {
    method: "POST",
    body: formData,
  });
  return handleResponse<T>(res);
}

export async function apiPut<T>(path: string, data?: unknown): Promise<T> {
  const res = await authFetch(`${getApiBase()}${path}`, {
    method: "PUT",
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
  });
  return handleResponse<T>(res);
}

export async function apiDelete<T>(path: string): Promise<T> {
  const res = await authFetch(`${getApiBase()}${path}`, { method: "DELETE" });
  return handleResponse<T>(res);
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface Product {
  id: number;
  product_id: string;
  name: string;
  description: string;
  price: number;
  original_price: number | null;
  wholesale_price: number | null;
  wholesale_prices: string | null;
  currency_code: string;
  category_id: number;
  category_name: string;
  seller_id: number;
  shop_name: string;
  country_id: number;
  country_code: string;
  images: string;
  video_url: string | null;
  stock_quantity: number;
  min_order: number;
  unit: string | null;
  label: string | null;
  is_featured: number;
  is_active: number;
  is_wholesale_only: number;
  sale_mode: string;
  units: string | null;
  unit_pricing: string | null;
  wholesale_params: string | null;
  rating: number;
  review_count: number;
  sales_count?: number;
  created_at: string;
}

export interface Category {
  id: number;
  name: string;
  parent_id: number | null;
  icon_url: string | null;
  image_url: string | null;
  product_count?: number;
}

export interface Country {
  id: number;
  country_code: string;
  name: string;
  currency_code: string;
  currency_symbol: string;
  flag_url: string | null;
}

export interface Seller {
  id: number;
  shop_name: string;
  company_name: string | null;
  description: string | null;
  logo_url: string | null;
  banner_url: string | null;
  phone_number: string | null;
  country_code: string | null;
  rating: number;
  total_sales: number;
  total_products: number;
  is_verified: number;
  is_active: number;
  full_name: string;
  member_since: string | null;
  followers_count: number;
  created_at?: string;
}

export interface Review {
  id: number;
  user_id: number;
  product_id: number;
  rating: number;
  comment: string;
  created_at: string;
  full_name: string;
  avatar_url: string | null;
}

export interface CartItem {
  product_id: number;
  quantity: number;
  product_name: string;
  price: number;
  original_price: number | null;
  wholesale_price: number | null;
  images: string;
  seller_name: string;
  seller_id: number;
  stock_quantity: number;
  in_stock: boolean;
}

export interface CartData {
  items: CartItem[];
  item_count: number;
  total_amount: number;
  updated_at: string | null;
}

export interface Order {
  id: number;
  order_code: string;
  user_id: number;
  seller_id: number;
  total_amount: number;
  status: string;
  payment_status: string;
  shipping_address_id: number | null;
  created_at: string;
  updated_at: string;
  seller_name?: string;
  item_count?: number;
}

export interface ShippingAddress {
  id: number;
  user_id: number;
  address_name: string;
  recipient_name: string;
  phone: string;
  address_line1: string;
  address_line2: string;
  city: string;
  region: string;
  postal_code: string;
  country_id: number;
  is_default: number;
  created_at: string;
}

export interface Video {
  id: number;
  title: string;
  video_url: string;
  thumbnail_url: string | null;
  seller_id: number;
  shop_name: string;
  views: number;
  likes: number;
  product_id: number | null;
  country_code?: string | null;
}

export interface Group {
  id: number;
  group_code: string;
  group_name: string;
  product_id: number;
  creator_id: number;
  target_quantity: number;
  current_quantity: number;
  target_participants: number;
  current_participants: number;
  unit_price: number;
  discounted_price: number | null;
  icon_url: string | null;
  description: string | null;
  country_id: number;
  expiry_date: string;
  status: string;
  created_at: string;
  product_name: string | null;
  image_url: string | null;
  creator_name: string | null;
}

export interface AppNotification {
  id: number;
  user_id: number;
  type: string;
  title: string;
  message: string;
  data: string | null;
  is_read: number;
  is_clicked: number;
  created_at: string;
}

export interface Chat {
  id: number;
  chat_code: string;
  last_message: string | null;
  last_message_at: string | null;
  unread_count: number;
  created_at: string;
}

export interface ChatMessage {
  id: number;
  chat_id: number;
  sender_id: number;
  message: string;
  is_read: number;
  first_name: string | null;
  last_name: string | null;
  created_at: string;
}

export interface PublicConfig {
  app_name: string;
  version: string;
  countries: Country[];
  total_categories: number;
  support_email: string;
}

export const api = {
  auth: {
    login: (email: string, password: string) =>
      apiPost<{ user: import("@/contexts/AuthContext").User; accessToken: string; refreshToken: string }>("/api/auth/login", { email, password }),
    register: (data: import("@/contexts/AuthContext").RegisterData) =>
      apiPost<{ user: import("@/contexts/AuthContext").User; accessToken: string; refreshToken: string }>("/api/auth/register", data),
    me: () => apiGet<{ user: import("@/contexts/AuthContext").User; seller: Seller | null }>("/api/auth/me"),
    forgotPassword: (email: string) => apiPost("/api/auth/forgot-password", { email }),
    changePassword: (current_password: string, new_password: string) =>
      apiPost("/api/auth/change-password", { current_password, new_password }),
  },

  products: {
    list: (params?: string) => apiGet<Product[]>(`/api/products${params ? `?${params}` : ""}`),
    featured: (params?: string) => apiGet<Product[]>(`/api/products/featured${params ? `?${params}` : ""}`),
    trending: (params?: string) => apiGet<Product[]>(`/api/products/trending${params ? `?${params}` : ""}`),
    promos: (params?: string) => apiGet<Product[]>(`/api/products/promos${params ? `?${params}` : ""}`),
    search: (params: string) => apiGet<Product[]>(`/api/products/search?${params}`),
    getById: (id: number | string) => apiGet<Product>(`/api/products/${id}`),
    getReviews: (id: number | string) => apiGet<Review[]>(`/api/products/${id}/reviews`),
    create: (data: Partial<Product> & {
      currency_code?: string; country_code?: string; country_id?: number;
      sale_mode?: string; units?: string[]; unit_pricing?: unknown; wholesale_params?: unknown;
      min_order?: number; wholesale_prices?: unknown; wholesale_price?: number;
    }) => apiPost<Product>("/api/products", data),
    uploadImages: (productId: number | string, imageUris: string[]) => {
      const fd = new FormData();
      imageUris.forEach((uri, idx) => {
        const ext = uri.split(".").pop()?.split("?")[0] || "jpg";
        fd.append(`image_${idx}`, { uri, type: `image/${ext}`, name: `img_${productId}_${idx}.${ext}` } as any);
      });
      return apiPostFormData<{ images: string[] }>(`/api/products/${productId}/images`, fd);
    },
    uploadVideo: (productId: number | string, videoUri: string, mimeType: string) => {
      const fd = new FormData();
      fd.append("video", { uri: videoUri, type: mimeType, name: `video_${productId}.mp4` } as any);
      return apiPostFormData<{ video_url: string }>(`/api/products/${productId}/video`, fd);
    },
  },

  categories: {
    list: () => apiGet<Category[]>("/api/categories"),
    tree: () => apiGet<Category[]>("/api/categories/tree"),
    featured: () => apiGet<Category[]>("/api/categories/featured"),
    getById: (id: number | string) => apiGet<Category>(`/api/categories/${id}`),
    getProducts: (id: number | string, params?: string) =>
      apiGet<Product[]>(`/api/categories/${id}/products${params ? `?${params}` : ""}`),
  },

  sellers: {
    getById: (id: number | string) => apiGet<Seller>(`/api/sellers/${id}`),
    getProducts: (id: number | string, params?: string) =>
      apiGet<Product[]>(`/api/sellers/${id}/products${params ? `?${params}` : ""}`),
    follow: (id: number | string) => apiPost(`/api/users/me/follow/${id}`),
    unfollow: (id: number | string) => apiDelete(`/api/users/me/follow/${id}`),
    become: (data: { shop_name: string; company_name?: string; phone_number?: string; description?: string; country_code?: string }) =>
      apiPost<any>("/api/sellers/become", data),
  },

  cart: {
    get: () => apiGet<CartData>("/api/cart"),
    addItem: (product_id: number, quantity: number) =>
      apiPost("/api/cart/items", { product_id, quantity }),
    updateItem: (itemId: number | string, quantity: number) =>
      apiPut(`/api/cart/items/${itemId}`, { quantity }),
    removeItem: (itemId: number | string) => apiDelete(`/api/cart/items/${itemId}`),
  },

  users: {
    getWishlist: () => apiGet<Product[]>("/api/users/me/wishlist"),
    addToWishlist: (product_id: number) => apiPost("/api/users/me/wishlist", { product_id }),
    removeFromWishlist: (productId: number | string) =>
      apiDelete(`/api/users/me/wishlist/${productId}`),
    getAddresses: () => apiGet("/api/users/me/addresses"),
    addAddress: (data: unknown) => apiPost("/api/users/me/addresses", data),
    updateAddress: (id: number | string, data: unknown) =>
      apiPut(`/api/users/me/addresses/${id}`, data),
    deleteAddress: (id: number | string) => apiDelete(`/api/users/me/addresses/${id}`),
  },

  videos: {
    forYou: (params?: string) => apiGet<Video[]>(`/api/videos/for-you${params ? `?${params}` : ""}`),
    like: (id: number | string) => apiPost(`/api/videos/${id}/like`),
    view: (id: number | string) => apiPost(`/api/videos/${id}/view`),
  },

  groups: {
    list: (params?: string) => apiGet<{ data: Group[]; total: number; page: number; limit: number; totalPages: number }>(`/api/groups${params ? `?${params}` : ""}`),
    featured: (params?: string) => apiGet<{ data: Group[]; total: number }>(`/api/groups/featured${params ? `?${params}` : ""}`),
    myList: (params?: string) => apiGet<{ data: Group[]; total: number }>(`/api/groups/my/list${params ? `?${params}` : ""}`),
    getById: (id: number | string) => apiGet<Group & { participants: Array<{ id: number; user_id: number; user_name: string; quantity: number; payment_status: string }> }>(`/api/groups/${id}`),
    join: (id: number | string, quantity?: number) => apiPost<{ joined: boolean; current_participants: number }>(`/api/groups/${id}/join`, { quantity: quantity || 1 }),
  },

  config: {
    public: () => apiGet<PublicConfig>("/api/config/public"),
    currencies: () => apiGet("/api/config/currencies"),
    paymentMethods: () => apiGet("/api/config/payment-methods"),
  },

  notifications: {
    list: (params?: string) => apiGet<PaginatedResponse<AppNotification>>(`/api/notifications${params ? `?${params}` : ""}`),
    unreadCount: () => apiGet<{ count: number }>("/api/notifications/unread-count"),
    markRead: (id: number | string) => apiPut(`/api/notifications/${id}/read`),
    markAllRead: () => apiPut("/api/notifications/read-all"),
  },

  messages: {
    chats: (params?: string) => apiGet<Chat[]>(`/api/messages/chats${params ? `?${params}` : ""}`),
    createChat: (recipient_id: number) => apiPost<Chat>("/api/messages/chats", { recipient_id }),
    getChat: (id: number | string) => apiGet<Chat>(`/api/messages/chats/${id}`),
    getMessages: (chatId: number | string, params?: string) =>
      apiGet<PaginatedResponse<ChatMessage>>(`/api/messages/chats/${chatId}/messages${params ? `?${params}` : ""}`),
    sendMessage: (chatId: number | string, message: string) =>
      apiPost<ChatMessage>(`/api/messages/chats/${chatId}/messages`, { message }),
    markRead: (chatId: number | string) => apiPut(`/api/messages/chats/${chatId}/read`),
    unreadCount: () => apiGet<{ count: number }>("/api/messages/unread-count"),
  },

  orders: {
    create: (data: unknown) => apiPost("/api/orders", data),
    list: (params?: string) => apiGet<{ data: Order[]; total: number; page: number; limit: number; totalPages: number }>(`/api/orders${params ? `?${params}` : ""}`),
    getById: (id: number | string) => apiGet(`/api/orders/${id}`),
    cancel: (id: number | string) => apiPost(`/api/orders/${id}/cancel`),
    recent: () => apiGet<Order[]>("/api/orders/recent"),
    sellerStats: () => apiGet<any>("/api/orders/seller/stats"),
    sellerPending: () => apiGet<any[]>("/api/orders/seller/pending"),
    sellerList: (params?: string) => apiGet<any>(`/api/orders/seller${params ? `?${params}` : ""}`),
  },

  shippingAddresses: {
    list: () => apiGet<ShippingAddress[]>("/api/shipping-addresses"),
    create: (data: Partial<ShippingAddress>) => apiPost<ShippingAddress>("/api/shipping-addresses", data),
    update: (id: number | string, data: Partial<ShippingAddress>) => apiPut<ShippingAddress>(`/api/shipping-addresses/${id}`, data),
    delete: (id: number | string) => apiDelete(`/api/shipping-addresses/${id}`),
  },

  checkout: {
    validate: () => apiPost<{ valid: boolean; issues: Array<{ product_id: number; issue: string }>; valid_items: number; total_items: number }>("/api/cart/validate"),
    process: (shipping_address_id: number) => apiPost<Order[]>("/api/cart/checkout", { shipping_address_id }),
  },
};
