import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  headers: { "Content-Type": "application/json" },
});

// ── HCPs ──────────────────────────────────────────────────────────────────────
export const hcpApi = {
  list: (params) => api.get("/hcps/", { params }),
  get: (id) => api.get(`/hcps/${id}`),
  create: (data) => api.post("/hcps/", data),
  update: (id, data) => api.patch(`/hcps/${id}`, data),
  deactivate: (id) => api.delete(`/hcps/${id}`),
};

// ── Interactions ───────────────────────────────────────────────────────────────
export const interactionApi = {
  list: (params) => api.get("/interactions/", { params }),
  get: (id) => api.get(`/interactions/${id}`),
  create: (data) => api.post("/interactions/", data),
  update: (id, data) => api.patch(`/interactions/${id}`, data),
  delete: (id) => api.delete(`/interactions/${id}`),
};

// ── Chat ───────────────────────────────────────────────────────────────────────
export const chatApi = {
  send: (data) => api.post("/chat/", data),
  getSession: (sessionId) => api.get(`/chat/${sessionId}`),
  clearSession: (sessionId) => api.delete(`/chat/${sessionId}`),
};

export default api;
