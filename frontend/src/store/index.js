import { configureStore } from "@reduxjs/toolkit";
import hcpReducer from "./slices/hcpSlice";
import interactionReducer from "./slices/interactionSlice";
import chatReducer from "./slices/chatSlice";

const store = configureStore({
  reducer: {
    hcps: hcpReducer,
    interactions: interactionReducer,
    chat: chatReducer,
  },
});

export default store;
