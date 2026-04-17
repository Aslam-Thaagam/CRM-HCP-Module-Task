import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { hcpApi } from "../../services/api";

export const fetchHCPs = createAsyncThunk(
  "hcps/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const res = await hcpApi.list();
      return res.data;
    } catch (e) {
      return rejectWithValue(e.response?.data?.detail || "Failed to fetch HCPs");
    }
  }
);

export const createHCP = createAsyncThunk(
  "hcps/create",
  async (data, { rejectWithValue }) => {
    try {
      const res = await hcpApi.create(data);
      return res.data;
    } catch (e) {
      return rejectWithValue(e.response?.data?.detail || "Failed to create HCP");
    }
  }
);

const hcpSlice = createSlice({
  name: "hcps",
  initialState: {
    list: [],
    loading: false,
    saving: false,
    error: null,
    saveSuccess: false,
  },
  reducers: {
    clearHCPError(state) { state.error = null; },
    clearSaveSuccess(state) { state.saveSuccess = false; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchHCPs.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(fetchHCPs.fulfilled, (s, a) => { s.loading = false; s.list = a.payload; })
      .addCase(fetchHCPs.rejected, (s, a) => { s.loading = false; s.error = a.payload; })
      .addCase(createHCP.pending, (s) => { s.saving = true; s.error = null; s.saveSuccess = false; })
      .addCase(createHCP.fulfilled, (s, a) => {
        s.saving = false;
        s.saveSuccess = true;
        s.list.unshift(a.payload);
      })
      .addCase(createHCP.rejected, (s, a) => { s.saving = false; s.error = a.payload; });
  },
});

export const { clearHCPError, clearSaveSuccess } = hcpSlice.actions;
export default hcpSlice.reducer;
