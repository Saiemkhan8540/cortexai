import "dotenv/config";
import express from "express";

import connectDb from "./config/db.js";
import router from "./routes/billing.routes.js";
import { razorpayWebhook } from "./controllers/billing.controller.js";


const port = process.env.PORT;

const app = express();

// Webhook signature is computed over the raw bytes, so this must be
// registered before express.json().
app.post(
    "/webhook",
    express.raw({ type: "application/json" }),
    razorpayWebhook
);

app.use(express.json());

// Billing routes
app.use("/", router);

// Health check
app.get("/", (req, res) => {
    res.json({
        message: "hello from billing",
    });
});

app.listen(port, () => {
    console.log(
        `billing started at ${port}`
    );

    connectDb();
});