import "dotenv/config"
import express from "express"
import connectDb from "./config/db.js";
import router from "./routes/chat.routes.js";


const port = process.env.PORT

const app = express()
app.use(express.json())
app.use("/", router)
app.get("/", (req, res) => {
    res.json({message: "hello from chat"})
})

// HOST=127.0.0.1 when run behind the gateway (see start-all.js)
app.listen(port, process.env.HOST, () => {
    console.log(`chat started at ${port}`)
    connectDb()
})