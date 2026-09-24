import "dotenv/config";

import express from "express";
import connectDb from "./config/db.js";
import router from "./routes/agent.route.js";

const port = process.env.PORT || 8003;

const app = express();

app.use(express.json());

app.use("/", router);

app.get("/", (req, res) => {
  res.json({
    message: "hello from agent",
  });
});

// Must be registered after routes so it catches their errors (e.g. multer).
app.use((err,req,res,next)=>{
  console.error(err)

  if (res.headersSent) {
    return next(err)
  }

  const status =
    err.status || (err.name === "MulterError" ? 400 : 500)

  return res.status(status).json(
    err.data || { message: err.message || "agent error" }
  )
})

app.listen(port, () => {
  console.log(`agent started at ${port}`);
  connectDb();
});