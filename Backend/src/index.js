import express from "express";
import cors from "cors";
import verifyToken from "./middleware.js";
import authRouter from "./Routes/authrouter.js";
import mongoose from "mongoose";
import dotenv from "dotenv";
import uploadRouter from "./Routes/uploadRouter.js";
import dashboardRouter from "./Routes/dashboardRouter.js";
import adminRouter from "./Routes/adminRouter.js";
dotenv.config();
const app = express();
app.use(express.json());
app.use(cors());

// Health check endpoint (no authentication required)
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "Server is running",
    timestamp: new Date().toISOString(),
  });
});

app.use("/auth", authRouter);
// this middleware will be user for all other routes
app.use(verifyToken);

app.use("/upload", uploadRouter);
app.use("/dashboard", dashboardRouter);
app.use("/admin", adminRouter);

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("Connected to MongoDB");
    app.listen(3000, () => {
      console.log("Server is running on port 3000");
    });
  })
  .catch((err) => {
    console.error("Failed to connect to Database", err);
    process.exit(1);
  });
