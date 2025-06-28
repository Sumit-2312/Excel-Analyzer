import express from "express";
import { Users } from "../db.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

const authRouter = express.Router();

authRouter.post("/signup", async (req, res) => {
  const { username, name, password, email, role } = req.body;

  console.log("📝 Signup attempt:", { username, name, email, role });

  if (!password || !email || !role) {
    return res
      .status(400)
      .json({ success: false, message: "All fields are required" });
  }

  try {
    // Check if user already exists by email
    const existingUserByEmail = await Users.findOne({ email });
    if (existingUserByEmail) {
      console.log("❌ User already exists with email:", email);
      return res.status(400).json({
        success: false,
        message: "User with this email already exists",
      });
    }

    // Check if username is provided and if it's already taken
    const finalUsername = username || name;
    if (finalUsername) {
      const existingUserByUsername = await Users.findOne({
        username: finalUsername,
      });
      if (existingUserByUsername) {
        console.log("❌ Username already taken:", finalUsername);
        return res
          .status(400)
          .json({ success: false, message: "Username already taken" });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await Users.create({
      username: finalUsername,
      name: name || finalUsername,
      password: hashedPassword,
      email,
      role,
    });

    console.log("✅ User created successfully:", {
      userId: newUser._id,
      email,
    });

    const token = jwt.sign(
      {
        id: newUser._id,
        role: newUser.role,
        name: newUser.name,
        username: newUser.username,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    return res.status(201).json({
      success: true,
      message: "User created successfully",
      user: {
        id: newUser._id,
        username: newUser.username,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
      token: token,
    });
  } catch (err) {
    console.error("❌ Signup error:", err);

    // Handle specific MongoDB errors
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `${
          field.charAt(0).toUpperCase() + field.slice(1)
        } already exists`,
      });
    }

    if (err.name === "ValidationError") {
      const errors = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: errors,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
});

authRouter.post("/login", async (req, res) => {
  const { email, password, role } = req.body;

  if (!email || !password || !role) {
    return res
      .status(400)
      .json({ success: false, message: "All fields are required" });
  }
  try {
    const user = await Users.findOne({ email });
    if (!user)
      return res
        .status(400)
        .json({ success: false, message: "User does not exist" });

    if (user.role !== role)
      return res
        .status(403)
        .json({ success: false, message: "Access denied for this role" });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res
        .status(400)
        .json({ success: false, message: "Invalid password" });

    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
        name: user.name,
        username: user.username,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    return res.status(200).json({
      success: true,
      message: "Login successful",
      user: {
        id: user._id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token: token,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
});

// Get user profile
authRouter.get("/profile", async (req, res) => {
  try {
    const user = await Users.findById(req.userId).select("-password");
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    return res.status(200).json({
      success: true,
      user: user,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
});

// Update user profile
authRouter.put("/profile", async (req, res) => {
  try {
    const { username, email, name } = req.body;
    const updateData = {};

    if (username) updateData.username = username;
    if (email) updateData.email = email;
    if (name) updateData.name = name;

    const user = await Users.findByIdAndUpdate(req.userId, updateData, {
      new: true,
      runValidators: true,
    }).select("-password");

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: user,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
});

// Test route to clear database (remove in production)
authRouter.delete("/test/clear", async (req, res) => {
  try {
    await Users.deleteMany({});
    return res.status(200).json({ success: true, message: "Database cleared" });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Error clearing database",
      error: err.message,
    });
  }
});

export default authRouter;
