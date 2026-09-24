import { createSlice } from "@reduxjs/toolkit";

const userSlice = createSlice({
    name: "user",

    initialState: {
        userData: null,
    },

    reducers: {
        setUserdata: (
            state,
            action
        ) => {
            state.userData =
                action.payload;
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