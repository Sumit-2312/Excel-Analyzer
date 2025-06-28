import express from "express";
import { Users, Uploads } from "../db.js";

const adminRouter = express.Router();

// Middleware to check if user is admin
const checkAdmin = async (req, res, next) => {
  try {
    const user = await Users.findById(req.userId);
    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Admin only." });
    }
    next();
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Server error", error: err.message });
  }
};

// Apply admin check to all routes
adminRouter.use(checkAdmin);

// Get all users
adminRouter.get("/users", async (req, res) => {
  try {
    const users = await Users.find({})
      .select("-password")
      .sort({ createdAt: -1 });

    // Add file count for each user
    const usersWithFileCount = await Promise.all(
      users.map(async (user) => {
        const fileCount = await Uploads.countDocuments({ userId: user._id });
        return {
          ...user.toObject(),
          filesUploaded: fileCount,
        };
      })
    );

    res.status(200).json({
      success: true,
      users: usersWithFileCount,
    });
  } catch (err) {
    console.error("Error fetching users:", err);
    return res.status(500).json({ message: "Server error", error: err });
  }
});

// Update user status
adminRouter.put("/users/:userId/status", async (req, res) => {
  try {
    const { userId } = req.params;
    const { status } = req.body;

    if (!["active", "inactive", "blocked"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const user = await Users.findByIdAndUpdate(
      userId,
      { status },
      { new: true, runValidators: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      success: true,
      message: "User status updated successfully",
      user: user,
    });
  } catch (err) {
    console.error("Error updating user status:", err);
    return res.status(500).json({ message: "Server error", error: err });
  }
});

// Delete user
adminRouter.delete("/users/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    // Check if user exists
    const user = await Users.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Delete user's files
    await Uploads.deleteMany({ userId });

    // Delete user
    await Users.findByIdAndDelete(userId);

    res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (err) {
    console.error("Error deleting user:", err);
    return res.status(500).json({ message: "Server error", error: err });
  }
});

// Get admin statistics
adminRouter.get("/stats", async (req, res) => {
  try {
    // Total users
    const totalUsers = await Users.countDocuments();

    // Total files
    const totalFiles = await Uploads.countDocuments();

    // Total file size
    const files = await Uploads.find({});
    const totalSize = files.reduce((sum, file) => sum + (file.size || 0), 0);

    // Most used chart type
    const chartTypes = files.map((file) => file.chartType).filter(Boolean);
    const chartTypeCount = {};
    chartTypes.forEach((type) => {
      chartTypeCount[type] = (chartTypeCount[type] || 0) + 1;
    });
    const mostUsedChart =
      Object.keys(chartTypeCount).length > 0
        ? Object.keys(chartTypeCount).reduce((a, b) =>
            chartTypeCount[a] > chartTypeCount[b] ? a : b
          )
        : "Bar Chart";

    // Active users (users with files uploaded in last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const activeUsers = await Uploads.distinct("userId", {
      uploadDate: { $gte: thirtyDaysAgo },
    });

    const stats = [
      {
        title: "Total Users",
        value: totalUsers.toString(),
        change: "+12%",
        trend: "up",
        icon: "Users",
        color: "from-blue-500 to-cyan-500",
      },
      {
        title: "Files Uploaded",
        value: totalFiles.toString(),
        change: "+8%",
        trend: "up",
        icon: "FileSpreadsheet",
        color: "from-green-500 to-emerald-500",
      },
      {
        title: "Most Used Chart",
        value: mostUsedChart,
        change: "45%",
        trend: "up",
        icon: "BarChart3",
        color: "from-purple-500 to-pink-500",
      },
      {
        title: "Active Users",
        value: activeUsers.length.toString(),
        change: "-3%",
        trend: "down",
        icon: "Activity",
        color: "from-orange-500 to-red-500",
      },
    ];

    res.status(200).json({
      success: true,
      stats: stats,
    });
  } catch (err) {
    console.error("Error fetching admin stats:", err);
    return res.status(500).json({ message: "Server error", error: err });
  }
});

export default adminRouter;
