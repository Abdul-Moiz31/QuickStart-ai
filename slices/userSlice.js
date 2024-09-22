import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import baseurl from "../store/baseurl";

const initialState = {
  error: "",
  loading: false,
  isUserRegistered: false,
  isUserLogged: false,
  user: null,
  isTokenGenerated: false,
  token: null,
  isBusinessDetailsAdded: false,
  isBusinessDetailsDeleted: false,
  isContactUsMessageSent: false,
  sessions: [],
  messages: [],
  data:[],
  isLoggedOut: false,
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
// logout user
export const logout = createAsyncThunk(
  "user/logout",
  async (_, { rejectWithValue, fulfillWithValue }) => {
    try {
      const { data } = await axios.get(`${baseurl}/user/logout`, {
        withCredentials: true,
      });
      return fulfillWithValue(data);
    } catch (error) {
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
      return fulfillWithValue(data.user);
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

// generate new token
export const generateNewToken = createAsyncThunk(
  "user/generateNewToken",
  async (payload, { rejectWithValue, fulfillWithValue }) => {
    try {
      const { data } = await axios.post(`${baseurl}/user/token`,payload, {
        withCredentials: true,
      });
      // console.log(data);
      return fulfillWithValue(data);
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

// add business details
export const addBusinessDetails = createAsyncThunk(
  "user/addBusinessDetails",
  async (payload, { rejectWithValue, fulfillWithValue }) => {
    try {
      const { data } = await axios.post(`${baseurl}/user/bussinessDetails`, payload, {
        withCredentials: true,
      });
      return fulfillWithValue(data);
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

// delete business details
export const deleteBusinessDetails = createAsyncThunk(
  "user/deleteBusinessDetails",
  async (id, { rejectWithValue, fulfillWithValue }) => {
    try {
      const { data } = await axios.delete(`${baseurl}/user/bussinessDetails/${id}`, {
        withCredentials: true,
      });
      return fulfillWithValue(data);
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

// send contact us message
export const sendContactUsMessage = createAsyncThunk(
  "user/sendContactUsMessage",
  async (payload, { rejectWithValue, fulfillWithValue }) => {
    try {
      const { data } = await axios.post(`${baseurl}/user/contact`, payload, {
        withCredentials: true,
      });
      return fulfillWithValue(data);
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);
// get all sessions
export const getAllSessions = createAsyncThunk(
  "user/getAllSessions",
  async (payload, { rejectWithValue, fulfillWithValue }) => {
    try {
      const { data } = await axios.get(`${baseurl}/session/owner`, {
        withCredentials: true,
      });
      return fulfillWithValue(data.sessions);
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);
// get sessions monthly data
export const getSessionsMonthlyData = createAsyncThunk(
  "user/getSessionsMonthlyData",
  async (payload, { rejectWithValue, fulfillWithValue }) => {
    try {
      const { data } = await axios.get(`${baseurl}/session/monthly`, {
        withCredentials: true,
      });
      return fulfillWithValue(data.data);
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);
// get all messages
export const getAllMessages = createAsyncThunk(
  "user/getAllMessages",
  async (id, { rejectWithValue, fulfillWithValue }) => {
    try {
      const { data } = await axios.get(`${baseurl}/message/session/${id}`, {
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
      state.isTokenGenerated = false;
      state.isBusinessDetailsAdded= false;
      state.isBusinessDetailsDeleted = false;
      state.isContactUsMessageSent = false;
      state.sessions = [];
      state.messages = [];
      state.data = [];
      state.isLoggedOut = false;
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
    // load user
    builder.addCase(loadUser.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(loadUser.fulfilled, (state, action) => {
      state.loading = false;
      state.user = action.payload;
    });
    builder.addCase(loadUser.rejected, (state) => {
      state.loading = false;
    });
    // generate new token
    builder.addCase(generateNewToken.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(generateNewToken.fulfilled, (state) => {
      state.loading = false;
      state.isTokenGenerated = true;
    });
    builder.addCase(generateNewToken.rejected, (state) => {
      state.loading = false;
      state.error = action?.payload?.message;
    });
    // add business details
    builder.addCase(addBusinessDetails.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(addBusinessDetails.fulfilled, (state) => {
      state.loading = false;
      state.isBusinessDetailsAdded = true;
    });
    builder.addCase(addBusinessDetails.rejected, (state) => {
      state.loading = false;
      state.error = action?.payload?.message;
    });
    // delete business details
    builder.addCase(deleteBusinessDetails.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(deleteBusinessDetails.fulfilled, (state) => {
      state.loading = false;
      state.isBusinessDetailsDeleted = true;
    });
    builder.addCase(deleteBusinessDetails.rejected, (state) => {
      state.loading = false;
      state.error = action?.payload?.message;
    });
    // send contact us message
    builder.addCase(sendContactUsMessage.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(sendContactUsMessage.fulfilled, (state) => {
      state.loading = false;
      state.isContactUsMessageSent = true;
    });
    builder.addCase(sendContactUsMessage.rejected, (state) => {
      state.loading = false;
      state.error = action?.payload?.message;
    });
    // get all sessions
    builder.addCase(getAllSessions.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(getAllSessions.fulfilled, (state, action) => {
      state.loading = false;
      state.sessions = action.payload;
    });
    builder.addCase(getAllSessions.rejected, (state) => {
      state.loading = false;
    });
    // get all messages
    builder.addCase(getAllMessages.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(getAllMessages.fulfilled, (state, action) => {
      state.loading = false;
      state.messages = action.payload;
    });
    builder.addCase(getAllMessages.rejected, (state) => {
      state.loading = false;
    });
    // get sessions monthly data
    builder.addCase(getSessionsMonthlyData.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(getSessionsMonthlyData.fulfilled, (state, action) => {
      state.loading = false;
      state.data = action.payload;
    });
    builder.addCase(getSessionsMonthlyData.rejected, (state) => {
      state.loading = false;
    });
    // logout user
    builder.addCase(logout.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(logout.fulfilled, (state) => {
      state.loading = false;
      state.isLoggedOut = true;
    });
    builder.addCase(logout.rejected, (state) => {
      state.loading = false;
    });


   
  },
});

export default userReducer.reducer;
export const { clearState , addNewMessageToMessages } = userReducer.actions;
