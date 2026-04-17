import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { chatApi } from "../../services/api";
import { mergeExtracted } from "./interactionSlice";

export const sendMessage = createAsyncThunk(
  "chat/sendMessage",
  async ({ messages, currentState }, { dispatch, rejectWithValue }) => {
    try {
      const res = await chatApi.send(messages, currentState);
      if (res.data.extracted_data) {
        dispatch(mergeExtracted(res.data.extracted_data));
      }
      return res.data;
    } catch (e) {
      return rejectWithValue(e.response?.data?.detail || "Failed to send message");
    }
  }
);

const chatSlice = createSlice({
  name: "chat",
  initialState: {
    messages: [],
    isComplete: false,
    loading: false,
    error: null,
    initialized: false,
  },
  reducers: {
    addUserMessage(state, action) {
      state.messages.push({ role: "user", content: action.payload });
    },
    resetChat(state) {
      state.messages = [];
      state.isComplete = false;
      state.error = null;
      state.initialized = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(sendMessage.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(sendMessage.fulfilled, (s, a) => {
        s.loading = false;
        s.initialized = true;
        s.messages.push({ role: "assistant", content: a.payload.message });
        s.isComplete = a.payload.is_complete || false;
      })
      .addCase(sendMessage.rejected, (s, a) => {
        s.loading = false;
        s.error = a.payload;
        s.initialized = true;
        s.messages.push({ role: "assistant", content: "Sorry, I encountered an error. Please try again." });
      });
  },
});

export const { addUserMessage, resetChat } = chatSlice.actions;
export default chatSlice.reducer;
