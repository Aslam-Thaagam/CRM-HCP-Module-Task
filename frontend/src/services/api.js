import axios from "axios";

const api = axios.create({ baseURL: "/api" });

export const hcpApi = {
  list: () => api.get("/hcps/"),
  create: (data) => api.post("/hcps/", data),
};

export const interactionApi = {
  list: () => api.get("/interactions/"),
  create: (data) => api.post("/interactions/", data),
  delete: (id) => api.delete(`/interactions/${id}`),
};

export const chatApi = {
  send: (messages, currentState) =>
    api.post("/chat/", { messages, current_state: currentState }),
};
