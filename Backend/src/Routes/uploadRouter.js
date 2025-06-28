import express from "express";
import multer from "multer";
import storage from "../utils/diskStorage.js";
import fileFilter from "../utils/filefilter.js";
import { Uploads, Users } from "../db.js";
import fs from "fs";
import cloudinary from "../utils/cloudinary.js";
import {
  validateExcelFile,
  parseExcelFile,
  extractChartData,
} from "../utils/excelParser.js";

const uploadRouter = express.Router();

// Multer configuration
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 1024 * 1024 * 10, // 10 MB file size limit
  },
});

// All these request will be handled by the middleware before reaching to this point
// so we will assume that the user is authenticated and userId is available in req.userId
// to upload the file in the expre ss server , we need the multer package

const singleUpload = (req, res) =>
  new Promise((resolve, reject) => {
    upload.single("file")(req, res, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });

uploadRouter.post("/", async (req, res) => {
  try {
    await singleUpload(req, res); // this will throw an error if the file has an issue

    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "Please upload a file" });
    }

    const data = req.file;
    const { chartType, xAxis, yAxis } = req.body;

    console.log("📁 File uploaded:", {
      filename: data.filename,
      originalname: data.originalname,
      size: data.size,
      mimetype: data.mimetype,
    });

    // Validate Excel file
    const validation = validateExcelFile(data.path);
    if (!validation.success) {
      // Clean up the uploaded file
      fs.unlinkSync(data.path);
      return res.status(400).json({
        success: false,
        message: `Excel file validation failed: ${validation.error}`,
      });
    }

    console.log("✅ Excel file validated:", {
      totalRows: validation.totalRows,
      totalColumns: validation.totalColumns,
      headers: validation.headers,
    });

    // Check for duplicate file - allow re-uploads by updating existing file
    const existingFile = await Uploads.findOne({
      originalname: data.originalname,
      userId: req.userId,
    });

    if (existingFile) {
      console.log("📝 File already exists, updating existing record:", {
        fileId: existingFile._id,
        originalname: data.originalname,
      });

      // Upload the new file to cloudinary
      const result = await cloudinary.uploader.upload(data.path, {
        resource_type: "raw",
      });

      // Update the existing file with new data
      const updatedFile = await Uploads.findByIdAndUpdate(
        existingFile._id,
        {
          filename: data.filename,
          fileUrl: result.secure_url, // Use new file URL
          size: data.size,
          chartType: chartType,
          xAxis: xAxis,
          yAxis: yAxis,
          totalRows: validation.totalRows,
          totalColumns: validation.totalColumns,
          headers: validation.headers,
          chartData: null, // Reset chart data for new upload
          uploadDate: new Date(),
        },
        { new: true }
      );

      // Clean up local file after successful update
      fs.unlinkSync(data.path);

      console.log("✅ File updated successfully:", {
        fileId: updatedFile._id,
        totalRows: validation.totalRows,
        chartDataPoints: 0,
      });

      return res.status(200).json({
        success: true,
        message: "File updated successfully",
        fileId: updatedFile._id,
        file: {
          filename: data.filename,
          originalname: data.originalname,
          userId: req.userId,
          fileId: updatedFile._id,
          size: data.size,
          totalRows: validation.totalRows,
          totalColumns: validation.totalColumns,
          headers: validation.headers,
          chartDataPoints: 0,
        },
      });
    }

    // Upload to cloudinary
    const result = await cloudinary.uploader.upload(data.path, {
      resource_type: "raw",
    });

    // Parse Excel data for chart generation
    const parsedData = parseExcelFile(data.path);
    let chartData = null;

    if (parsedData.success && xAxis && yAxis) {
      const extractedData = extractChartData(parsedData, xAxis, yAxis);
      if (extractedData.success) {
        chartData = extractedData.data;
        console.log("📊 Chart data extracted:", {
          dataPoints: extractedData.dataPoints,
          xAxis: xAxis,
          yAxis: yAxis,
        });
      } else {
        console.log("⚠️ Chart data extraction failed:", extractedData.error);
      }
    }

    // Save to database
    const newFile = await Uploads.create({
      userId: req.userId,
      filename: data.filename,
      originalname: data.originalname,
      fileUrl: result.secure_url,
      size: data.size,
      chartType: chartType,
      xAxis: xAxis,
      yAxis: yAxis,
      totalRows: validation.totalRows,
      totalColumns: validation.totalColumns,
      headers: validation.headers,
      chartData: chartData,
    });

    // Clean up local file
    fs.unlinkSync(data.path);

    console.log("✅ File processing completed:", {
      fileId: newFile._id,
      totalRows: validation.totalRows,
      chartDataPoints: chartData ? chartData.length : 0,
    });

    return res.status(200).json({
      success: true,
      message: "File uploaded and processed successfully",
      fileId: newFile._id,
      file: {
        filename: req.file.filename,
        originalname: req.file.originalname,
        userId: req.userId,
        fileId: newFile._id,
        size: req.file.size,
        totalRows: validation.totalRows,
        totalColumns: validation.totalColumns,
        headers: validation.headers,
        chartDataPoints: chartData ? chartData.length : 0,
      },
    });
  } catch (err) {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_UNEXPECTED_FILE") {
        return res
          .status(400)
          .json({ success: false, message: "Only one file is allowed!" });
      }
      return res.status(400).json({ success: false, message: err.message });
    }

    console.error("❌ Upload error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Server error", error: err });
  }
});

// Get available columns for a file
uploadRouter.get("/files/:fileId/columns", async (req, res) => {
  try {
    const { fileId } = req.params;
    const file = await Uploads.findOne({ _id: fileId, userId: req.userId });

    if (!file) {
      return res
        .status(404)
        .json({ success: false, message: "File not found" });
    }

    res.status(200).json({
      success: true,
      columns: file.headers || [],
      totalRows: file.totalRows || 0,
      totalColumns: file.totalColumns || 0,
    });
  } catch (err) {
    console.error("Error getting file columns:", err);
    return res
      .status(500)
      .json({ success: false, message: "Server error", error: err });
  }
});

// Get all files for a user
uploadRouter.get("/files", async (req, res) => {
  try {
    const user = await Users.findById(req.userId);
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    const files = await Uploads.find({ userId: req.userId }).sort({
      uploadDate: -1,
    }); // -1 for descending order means the newest file will be first

    res.status(200).json({
      success: true,
      message: "Files fetched successfully",
      files: files,
    });
  } catch (err) {
    console.error("Error fetching files:", err);
    return res
      .status(500)
      .json({ success: false, message: "Server error", error: err });
  }
});

// Get specific file by ID
uploadRouter.get("/files/:fileId", async (req, res) => {
  try {
    const { fileId } = req.params;
    const file = await Uploads.findOne({ _id: fileId, userId: req.userId });

    if (!file) {
      return res
        .status(404)
        .json({ success: false, message: "File not found" });
    }

    res.status(200).json({
      success: true,
      message: "File fetched successfully",
      file: file,
    });
  } catch (err) {
    console.error("Error fetching file:", err);
    return res
      .status(500)
      .json({ success: false, message: "Server error", error: err });
  }
});

// Delete file
uploadRouter.delete("/files/:fileId", async (req, res) => {
  try {
    const { fileId } = req.params;
    const file = await Uploads.findOneAndDelete({
      _id: fileId,
      userId: req.userId,
    });

    if (!file) {
      return res
        .status(404)
        .json({ success: false, message: "File not found" });
    }

    // Delete from cloudinary if needed
    // await cloudinary.uploader.destroy(file.publicId);

    res.status(200).json({
      success: true,
      message: "File deleted successfully",
    });
  } catch (err) {
    console.error("Error deleting file:", err);
    return res
      .status(500)
      .json({ success: false, message: "Server error", error: err });
  }
});

// Generate chart data for an existing file
uploadRouter.post("/files/:fileId/chart", async (req, res) => {
  try {
    const { fileId } = req.params;
    const { xAxis, yAxis, chartType } = req.body;
    const userId = req.userId;

    if (!xAxis || !yAxis) {
      return res.status(400).json({
        success: false,
        message: "X and Y axis columns are required",
      });
    }

    const file = await Uploads.findOne({ _id: fileId, userId });
    if (!file) {
      return res
        .status(404)
        .json({ success: false, message: "File not found" });
    }

    console.log("📊 Generating chart data for file:", {
      fileId: fileId,
      xAxis: xAxis,
      yAxis: yAxis,
      chartType: chartType,
      headers: file.headers,
    });

    // Create uploads directory if it doesn't exist
    const uploadsDir = "./uploads";
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Download file from Cloudinary to temporary location
    const tempFilePath = `${uploadsDir}/temp-${Date.now()}-${file.filename}`;

    try {
      // Download the file from Cloudinary
      const response = await fetch(file.fileUrl);
      if (!response.ok) {
        throw new Error(
          `Failed to download file from Cloudinary: ${response.statusText}`
        );
      }

      const buffer = await response.arrayBuffer();
      fs.writeFileSync(tempFilePath, Buffer.from(buffer));

      console.log("📥 File downloaded from Cloudinary:", tempFilePath);
    } catch (downloadError) {
      console.error(
        "❌ Error downloading file from Cloudinary:",
        downloadError
      );
      return res.status(500).json({
        success: false,
        message: "Failed to download file from cloud storage",
      });
    }

    // Parse the Excel file
    const parsedData = parseExcelFile(tempFilePath);
    if (!parsedData.success) {
      // Clean up temp file
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
      return res.status(400).json({
        success: false,
        message: `Failed to parse Excel file: ${parsedData.error}`,
      });
    }

    // Extract chart data
    const extractedData = extractChartData(parsedData, xAxis, yAxis);
    if (!extractedData.success) {
      // Clean up temp file
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
      return res.status(400).json({
        success: false,
        message: `Failed to extract chart data: ${extractedData.error}`,
      });
    }

    // Clean up temp file
    if (fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }

    // Update the file with chart data
    const updatedFile = await Uploads.findByIdAndUpdate(
      fileId,
      {
        chartData: extractedData.data,
        xAxis: xAxis,
        yAxis: yAxis,
        chartType: chartType,
      },
      { new: true }
    );

    console.log("✅ Chart data generated successfully:", {
      dataPoints: extractedData.dataPoints,
      xAxis: xAxis,
      yAxis: yAxis,
    });

    return res.status(200).json({
      success: true,
      message: "Chart data generated successfully",
      data: extractedData.data,
      dataPoints: extractedData.dataPoints,
      xAxis: xAxis,
      yAxis: yAxis,
      chartType: chartType,
    });
  } catch (err) {
    console.error("❌ Chart generation error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Server error", error: err.message });
  }
});

// Update chart type for a file
uploadRouter.put("/files/:fileId/chart-type", async (req, res) => {
  try {
    const { fileId } = req.params;
    const { chartType } = req.body;

    if (!chartType) {
      return res.status(400).json({
        success: false,
        message: "Chart type is required",
      });
    }

    console.log("🔄 Updating chart type for file:", { fileId, chartType });

    const updatedFile = await Uploads.findOneAndUpdate(
      { _id: fileId, userId: req.userId },
      { chartType: chartType },
      { new: true }
    );

    if (!updatedFile) {
      return res.status(404).json({
        success: false,
        message: "File not found",
      });
    }

    console.log("✅ Chart type updated successfully:", {
      fileId: fileId,
      newChartType: chartType,
    });

    return res.status(200).json({
      success: true,
      message: "Chart type updated successfully",
      chartType: chartType,
    });
  } catch (err) {
    console.error("❌ Error updating chart type:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
});

export default uploadRouter;

// To work with multer we need to know few things,
// 1. It adds a body parse to the request object, so we can access the file in req.file
// 2. all the text fields in the form will be available in req.body else will be availabe in req.file
// 3. we need to specify the storage location and the file name format
// 4. we can use the diskStorage to specify the storage location and the file name format
// 5. we need to specify the file filter function to filter the files based on the file type
