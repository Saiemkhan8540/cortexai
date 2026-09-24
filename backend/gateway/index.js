import "dotenv/config"
import express from "express"
import proxy from "express-http-proxy"
import cors from "cors"
import cookieParser from "cookie-parser"
import { getCurrentUser } from "./controllers/user.controller.js"
import protect from "./middleware/auth.middleware.js";
import { proxyWithHeader } from "./utils/proxyWithHeader.js";
import morgan from "morgan"

const port = process.env.PORT

const app = express()
app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true
}))

app.use(morgan("dev"))
app.use(cookieParser())

// Identity and internal headers are set only by the gateway, never by clients.
app.use((req, res, next) => {
    delete req.headers["x-user-id"]
    delete req.headers["x-internal-key"]
    next()
})

// Only the public auth routes are exposed; update-plan etc. stay internal.
const authRouter = express.Router()
authRouter.post(["/login", "/logout"], proxy(process.env.AUTH_SERVICE))
authRouter.use((req, res) => res.status(404).json({message: "not found"}))

app.use("/api/auth", authRouter);
app.use("/api/chat", protect, proxyWithHeader(process.env.CHAT_SERVICE));
app.use("/api/agent", protect, proxyWithHeader(process.env.AGENT_SERVICE));
// Razorpay calls this server-to-server (no cookie); the billing service
// verifies the webhook signature itself.
app.post("/api/billing/webhook", proxy(process.env.BILLING_SERVICE, {
    parseReqBody: false,
    proxyReqPathResolver: () => "/webhook",
}));
app.use("/api/billing", protect, proxyWithHeader(process.env.BILLING_SERVICE));
app.get("/api/me",protect, getCurrentUser)
app.get("/", (req, res) => {
    res.json({message: "hello from getway"})
})

app.listen(port, () => {
    console.log(`gateway started at ${port}`)
})


