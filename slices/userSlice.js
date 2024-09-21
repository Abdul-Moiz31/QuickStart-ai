import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import baseurl from "../store/baseurl";

const initialState = {
  error: "",
  loading: false,
  isUserRegistered: false,
  isUserLogged: false,
  user: null,


};

// signup user
export const signUp = createAsyncThunk(
  "user/signUp",
  async (payload, { rejectWithValue, fulfillWithValue }) => {
    try {
      const { data } = await axios.post(`${baseurl}/user/register`, payload, {
        withCredentials: true,
      });
      return fulfillWithValue(data);
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

// login user
export const login = createAsyncThunk(
  "user/login",
  async (payload, { rejectWithValue, fulfillWithValue }) => {
    try {
      const { data } = await axios.post(`${baseurl}/user/login`, payload, {
        withCredentials: true,
      });
      return fulfillWithValue(data);
    } catch (error) {
      console.log(error.response.data);
      return rejectWithValue(error.response.data);
    }
  }
);
// load user
export const loadUser = createAsyncThunk(
  "user/loadUser",
  async (_, { rejectWithValue, fulfillWithValue }) => {
    try {
      const { data } = await axios.get(`${baseurl}/user/me`, {
        withCredentials: true,
      });
      return fulfillWithValue(data);
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);



const userReducer = createSlice({
  name: "user",
  initialState,
  reducers: {
    clearState: (state) => {
      state.error = "";
      state.isUserRegistered = false;
      state.isUserLogged = false;
      state.user = null;

    },
    addNewMessageToMessages: (state, action) => {
      state.messages.push(action.payload);
    },
  },
  extraReducers: (builder) => {
    // user signup
    builder.addCase(signUp.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(signUp.fulfilled, (state) => {
      state.loading = false;
      state.isUserRegistered = true;
    });
    builder.addCase(signUp.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload.message;
    });
    // user login
    builder.addCase(login.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(login.fulfilled, (state) => {
      state.loading = false;
      state.isUserLogged = true;
    });
    builder.addCase(login.rejected, (state, action) => {
      state.loading = false;
      state.error = action?.payload?.message;
    });

   
  },
});

export default userReducer.reducer;
export const { clearState , addNewMessageToMessages } = userReducer.actions;
