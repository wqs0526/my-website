const API_BASE_URL = (process.env.REACT_APP_API_URL || "").replace(/\/$/, "");
const TOKEN_KEY = "travelSyncToken";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function saveToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export async function apiRequest(path, options = {}) {
  const token = getToken();
  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;
  const headers = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const requestUrl = /^https?:\/\//i.test(path) ? path : `${API_BASE_URL}${path}`;
  const response = await fetch(requestUrl, {
    ...options,
    cache: "no-store",
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || `Request failed with status ${response.status}.`);
  }

  return data;
}

export function uploadMemoryMedia(files) {
  const uploadBody = new FormData();
  files.forEach((file) => uploadBody.append("media", file));

  return apiRequest(`${API_BASE_URL}/api/uploads/memory-media`, {
    method: "POST",
    body: uploadBody,
  });
}
