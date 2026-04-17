import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { hcpApi } from "../../services/api";

export const fetchHcps = createAsyncThunk(
  "hcps/fetchAll",
  async (params = {}, { rejectWithValue }) => {
    try {
      const res = await hcpApi.list(params);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || "Failed to fetch HCPs");
    }
  }
);

export const fetchHcp = createAsyncThunk(
  "hcps/fetchOne",
  async (id, { rejectWithValue }) => {
    try {
      const res = await hcpApi.get(id);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || "HCP not found");
    }
  }
);

export const createHcp = createAsyncThunk(
  "hcps/create",
  async (data, { rejectWithValue }) => {
    try {
      const res = await hcpApi.create(data);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || "Failed to create HCP");
    }
  }
);

const hcpSlice = createSlice({
  name: "hcps",
  initialState: {
    list: [],
    selected: null,
    loading: false,
    error: null,
    searchQuery: "",
  },
  reducers: {
    setSearchQuery(state, action) {
      state.searchQuery = action.payload;
    },
    clearSelected(state) {
      state.selected = null;
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchHcps.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchHcps.fulfilled, (state, action) => { state.loading = false; state.list = action.payload; })
      .addCase(fetchHcps.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      .addCase(fetchHcp.pending, (state) => { state.loading = true; })
      .addCase(fetchHcp.fulfilled, (state, action) => { state.loading = false; state.selected = action.payload; })
      .addCase(fetchHcp.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      .addCase(createHcp.fulfilled, (state, action) => { state.list.unshift(action.payload); });
  },
});

export const { setSearchQuery, clearSelected, clearError } = hcpSlice.actions;
export default hcpSlice.reducer;
