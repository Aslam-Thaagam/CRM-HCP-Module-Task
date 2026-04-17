import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { chatApi } from "../../services/api";
import { v4 as uuidv4 } from "uuid";

export const sendChatMessage = createAsyncThunk(
  "chat/sendMessage",
  async ({ message, repId }, { getState, rejectWithValue }) => {
    try {
      const { sessionId } = getState().chat;
      const res = await chatApi.send({
        session_id: sessionId,
        message,
        rep_id: repId || "rep-001",
      });
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || "Chat error");
    }
  }
);

const chatSlice = createSlice({
  name: "chat",
  initialState: {
    sessionId: uuidv4(),
    messages: [],          // { role, content, timestamp }
    stage: "greeting",
    extractedData: {},
    interactionSaved: false,
    savedInteractionId: null,
    typing: false,
    error: null,
  },
  reducers: {
    resetChat(state) {
      state.sessionId = uuidv4();
      state.messages = [];
      state.stage = "greeting";
      state.extractedData = {};
      state.interactionSaved = false;
      state.savedInteractionId = null;
      state.error = null;
    },
    addUserMessage(state, action) {
      state.messages.push({
        role: "user",
        content: action.payload,
        timestamp: new Date().toISOString(),
      });
    },
    clearChatError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(sendChatMessage.pending, (state) => {
        state.typing = true;
        state.error = null;
      })
      .addCase(sendChatMessage.fulfilled, (state, action) => {
        state.typing = false;
        state.stage = action.payload.stage;
        state.extractedData = action.payload.extracted_data || {};
        state.interactionSaved = action.payload.interaction_saved;
        state.savedInteractionId = action.payload.interaction_id;

        // Add assistant reply to local messages
        if (action.payload.reply) {
          state.messages.push({
            role: "assistant",
            content: action.payload.reply,
            timestamp: new Date().toISOString(),
          });
        }
      })
      .addCase(sendChatMessage.rejected, (state, action) => {
        state.typing = false;
        state.error = action.payload;
        state.messages.push({
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again.",
          timestamp: new Date().toISOString(),
        });
      });
  },
});

export const { resetChat, addUserMessage, clearChatError } = chatSlice.actions;
export default chatSlice.reducer;
