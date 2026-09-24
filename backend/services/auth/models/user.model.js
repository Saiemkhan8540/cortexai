import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        firebaseUid: {
            type: String,
            unique: true,
            required: true,
        },

        name: {
            type: String,
            default: "",
        },

        email: {
            type: String,
            default: "",
        },

        avatar: {
            type: String,
            default: "",
        },

        plan: {
            type: String,
            default: "free",
        },

        credits: {
            type: Number,
            default: 100,
        },

        totalCredits: {
            type: Number,
            default: 100,
        },

        planExpiresAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

const User =
    mongoose.model(
        "User",
        userSchema
    );

export default User;