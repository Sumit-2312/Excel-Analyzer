import mongoose from "mongoose";
import { Schema } from "mongoose";

const userSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      min: [3, "Minimum length of name should be 3"],
      max: [20, "Max length of name should be 20"],
    },
    name: { type: String, required: false },
    password: {
      type: String,
      required: true,
      min: [6, "Minimum length of password should be 6"],
      max: [20, "Max length of password should be 20"],
    },
    email: { type: String, required: true, unique: true },
    role: {
      type: String,
      required: true,
      enum: ["admin", "user"],
      default: "user",
    },
    status: {
      type: String,
      enum: ["active", "inactive", "blocked"],
      default: "active",
    },
    blocked: { type: Boolean, default: false },
    lastActive: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

export const Users = mongoose.model("Users", userSchema);

const UploadSchema = new Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
      required: true,
    },
    filename: { type: String, required: true },
    originalname: { type: String, required: true },
    fileUrl: { type: String, required: true },
    uploadDate: { type: Date, default: Date.now },
    size: { type: Number },
    chartType: { type: String, required: false },
    xAxis: { type: String, required: false },
    yAxis: { type: String, required: false },
    totalRows: { type: Number, required: false },
    totalColumns: { type: Number, required: false },
    headers: [{ type: String }],
    chartData: [
      {
        x: { type: mongoose.Schema.Types.Mixed },
        y: { type: mongoose.Schema.Types.Mixed },
      },
    ],
  },
  {
    timestamps: true,
  }
);

export const Uploads = mongoose.model("Uploads", UploadSchema);
