import { createSlice } from "@reduxjs/toolkit";

function loadUsers() {
  try { return JSON.parse(localStorage.getItem("crm_users") || "[]"); } catch { return []; }
}

function saveUsers(users) {
  localStorage.setItem("crm_users", JSON.stringify(users));
}

function loadSession() {
  try { return JSON.parse(localStorage.getItem("crm_session") || "null"); } catch { return null; }
}

const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: loadSession(),
    error: null,
  },
  reducers: {
    signup(state, { payload: { name, email, password } }) {
      const users = loadUsers();
      if (users.find((u) => u.email === email)) {
        state.error = "An account with this email already exists.";
        return;
      }
      const user = { id: Date.now(), name, email, password, role: "Field Representative" };
      users.push(user);
      saveUsers(users);
      const session = { id: user.id, name: user.name, email: user.email, role: user.role };
      localStorage.setItem("crm_session", JSON.stringify(session));
      state.user = session;
      state.error = null;
    },
    login(state, { payload: { email, password } }) {
      const users = loadUsers();
      const match = users.find((u) => u.email === email && u.password === password);
      if (!match) {
        state.error = "Incorrect email or password.";
        return;
      }
      const session = { id: match.id, name: match.name, email: match.email, role: match.role };
      localStorage.setItem("crm_session", JSON.stringify(session));
      state.user = session;
      state.error = null;
    },
    logout(state) {
      localStorage.removeItem("crm_session");
      state.user = null;
      state.error = null;
    },
    clearAuthError(state) {
      state.error = null;
    },
  },
});

export const { signup, login, logout, clearAuthError } = authSlice.actions;
export default authSlice.reducer;
