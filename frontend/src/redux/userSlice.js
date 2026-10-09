import { createSlice } from "@reduxjs/toolkit";

const userSlice = createSlice({
    name: "user",

    initialState: {
        userData: null,
        // true until the first /api/me check finishes, so the login modal
        // doesn't flash (or reappear) while the session is still being verified
        authLoading: true,
    },

    reducers: {
        setUserdata: (
            state,
            action
        ) => {
            state.userData =
                action.payload;
            state.authLoading = false;
        },
        // agent responses carry the post-charge balance
        setCredits: (state, action) => {
            if (state.userData) {
                state.userData.credits = action.payload;
            }
        },
    },
});

export const {
    setUserdata,
    setCredits,
} = userSlice.actions;

export default userSlice.reducer;