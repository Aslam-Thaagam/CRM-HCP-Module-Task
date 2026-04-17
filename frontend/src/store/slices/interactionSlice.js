import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { interactionApi } from "../../services/api";

export const fetchInteractions = createAsyncThunk(
  "interactions/fetchAll",
  async (params = {}, { rejectWithValue }) => {
    try {
      const res = await interactionApi.list(params);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || "Failed to fetch interactions");
    }
  }
);

export const createInteraction = createAsyncThunk(
  "interactions/create",
  async (data, { rejectWithValue }) => {
    try {
      const res = await interactionApi.create(data);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || "Failed to save interaction");
    }
  }
);

export const updateInteraction = createAsyncThunk(
  "interactions/update",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const res = await interactionApi.update(id, data);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || "Failed to update interaction");
    }
  }
);

export const deleteInteraction = createAsyncThunk(
  "interactions/delete",
  async (id, { rejectWithValue }) => {
    try {
      await interactionApi.delete(id);
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || "Failed to delete interaction");
    }
  }
);

const interactionSlice = createSlice({
  name: "interactions",
  initialState: {
    list: [],
    loading: false,
    saving: false,
    error: null,
    successMessage: null,
    // Form mode state
    formMode: "form",          // "form" | "chat"
    formData: {
      hcp_id: "",
      interaction_type: "",
      interaction_date: "",
      duration_minutes: "",
      location: "",
      products_discussed: [],
      key_points: "",
      next_steps: "",
      follow_up_date: "",
      sentiment: "",
      samples_provided: {},
      objections: "",
    },
  },
  reducers: {
    setFormMode(state, action) {
      state.formMode = action.payload;
    },
    updateFormField(state, action) {
      const { field, value } = action.payload;
      state.formData[field] = value;
    },
    resetForm(state) {
      state.formData = {
        hcp_id: "",
        interaction_type: "",
        interaction_date: "",
        duration_minutes: "",
        location: "",
        products_discussed: [],
        key_points: "",
        next_steps: "",
        follow_up_date: "",
        sentiment: "",
        samples_provided: {},
        objections: "",
      };
    },
    prefillFormFromChat(state, action) {
      state.formData = { ...state.formData, ...action.payload };
    },
    clearMessages(state) {
      state.error = null;
      state.successMessage = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchInteractions.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchInteractions.fulfilled, (state, action) => { state.loading = false; state.list = action.payload; })
      .addCase(fetchInteractions.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      .addCase(createInteraction.pending, (state) => { state.saving = true; state.error = null; state.successMessage = null; })
      .addCase(createInteraction.fulfilled, (state, action) => {
        state.saving = false;
        state.list.unshift(action.payload);
        state.successMessage = "Interaction logged successfully!";
      })
      .addCase(createInteraction.rejected, (state, action) => { state.saving = false; state.error = action.payload; })

      .addCase(updateInteraction.fulfilled, (state, action) => {
        const idx = state.list.findIndex((i) => i.id === action.payload.id);
        if (idx !== -1) state.list[idx] = action.payload;
      })

      .addCase(deleteInteraction.fulfilled, (state, action) => {
        state.list = state.list.filter((i) => i.id !== action.payload);
      });
  },
});

export const {
  setFormMode,
  updateFormField,
  resetForm,
  prefillFormFromChat,
  clearMessages,
} = interactionSlice.actions;
export default interactionSlice.reducer;
