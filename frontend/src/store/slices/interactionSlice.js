import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { interactionApi } from "../../services/api";

export const fetchInteractions = createAsyncThunk(
  "interactions/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const res = await interactionApi.list();
      return res.data;
    } catch (e) {
      return rejectWithValue(e.response?.data?.detail || "Failed to fetch");
    }
  }
);

export const saveInteraction = createAsyncThunk(
  "interactions/save",
  async (data, { rejectWithValue }) => {
    try {
      const res = await interactionApi.create(data);
      return res.data;
    } catch (e) {
      return rejectWithValue(e.response?.data?.detail || "Failed to save");
    }
  }
);

const today = new Date().toISOString().split("T")[0];
const nowTime = new Date().toTimeString().slice(0, 5);

export const EMPTY_FORM = {
  hcp_name: "",
  interaction_type: "Meeting",
  interaction_date: today,
  interaction_time: nowTime,
  contact_detail: "",
  attendees: "",
  topics_discussed: "",
  materials_shared: [],
  samples_distributed: [],
  sentiment: "Neutral",
  outcomes: "",
  follow_up_actions: "",
  ai_suggested_followups: [],
};

const interactionSlice = createSlice({
  name: "interactions",
  initialState: {
    list: [],
    formData: { ...EMPTY_FORM },
    loading: false,
    saving: false,
    error: null,
    saveSuccess: false,
  },
  reducers: {
    updateField(state, action) {
      const { field, value } = action.payload;
      state.formData[field] = value;
      state.saveSuccess = false;
      state.error = null;
    },
    mergeExtracted(state, action) {
      const data = action.payload;
      Object.entries(data).forEach(([key, val]) => {
        if (val !== null && val !== undefined && key in state.formData) {
          state.formData[key] = val;
        }
      });
    },
    resetForm(state) {
      state.formData = { ...EMPTY_FORM };
      state.saveSuccess = false;
      state.error = null;
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchInteractions.pending, (s) => { s.loading = true; })
      .addCase(fetchInteractions.fulfilled, (s, a) => { s.loading = false; s.list = a.payload; })
      .addCase(fetchInteractions.rejected, (s, a) => { s.loading = false; s.error = a.payload; })
      .addCase(saveInteraction.pending, (s) => { s.saving = true; s.error = null; s.saveSuccess = false; })
      .addCase(saveInteraction.fulfilled, (s, a) => {
        s.saving = false;
        s.saveSuccess = true;
        s.list.unshift(a.payload);   // immediately show in logs
        s.formData = { ...EMPTY_FORM };
      })
      .addCase(saveInteraction.rejected, (s, a) => { s.saving = false; s.error = a.payload; });
  },
});

export const { updateField, mergeExtracted, resetForm, clearError } = interactionSlice.actions;
export default interactionSlice.reducer;
