import { configureStore } from "@reduxjs/toolkit";
import interactionReducer from "./slices/interactionSlice";
import chatReducer from "./slices/chatSlice";
import authReducer from "./slices/authSlice";
import hcpReducer from "./slices/hcpSlice";

export const store = configureStore({
  reducer: {
    interactions: interactionReducer,
    chat: chatReducer,
    auth: authReducer,
    hcps: hcpReducer,
  },
});
