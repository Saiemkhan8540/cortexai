import "dotenv/config";

import express from "express";
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

// HOST=127.0.0.1 when run behind the gateway (see start-all.js)
app.listen(port, process.env.HOST, () => {
  console.log(`agent started at ${port}`);
});