import { fetch } from "expo/fetch";
import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { getStoredAccessToken, refreshAuthToken, getApiBase } from "@/lib/auth-storage";

export function getApiUrl(): string {
  return getApiBase();
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const token = await getStoredAccessToken();
  if (token) {
    return { Authorization: `Bearer ${token}` };
  }
  return {};
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  route: string,
  data?: unknown | undefined,
): Promise<Response> {
  const url = new URL(route, getApiBase());
  const authHeaders = await getAuthHeaders();

  let res = await fetch(url.toString(), {
    method,
    headers: {
      ...authHeaders,
      ...(data ? { "Content-Type": "application/json" } : {}),
    },
    body: data ? JSON.stringify(data) : undefined,
  });

  if (res.status === 401) {
    const newToken = await refreshAuthToken();
    if (newToken) {
      res = await fetch(url.toString(), {
        method,
        headers: {
          Authorization: `Bearer ${newToken}`,
          ...(data ? { "Content-Type": "application/json" } : {}),
        },
        body: data ? JSON.stringify(data) : undefined,
      });
    }
  }

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const url = new URL(queryKey.join("/") as string, getApiBase());
    const authHeaders = await getAuthHeaders();

    let res = await fetch(url.toString(), {
      headers: authHeaders,
    });

    if (res.status === 401) {
      if (unauthorizedBehavior === "returnNull") {
        return null;
      }
      const newToken = await refreshAuthToken();
      if (newToken) {
        res = await fetch(url.toString(), {
          headers: { Authorization: `Bearer ${newToken}` },
        });
        if (res.status === 401) {
          throw new Error("401: Non autorisé");
        }
      } else {
        throw new Error("401: Non autorisé");
      }
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
