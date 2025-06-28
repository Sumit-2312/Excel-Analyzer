import fs from "fs";
import { parseExcelFile, extractChartData } from "./excelParser.js";
import Uploads from "../db.js";

export const generateChartDataForFile = async (
  fileId,
  xAxis,
  yAxis,
  chartType,
  userId
) => {
  try {
    if (!xAxis || !yAxis) {
      return { success: false, error: "X and Y axis columns are required" };
    }

    const file = await Uploads.findOne({ _id: fileId, userId });
    if (!file) {
      return { success: false, error: "File not found" };
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
      return {
        success: false,
        error: "Failed to download file from cloud storage",
      };
    }

    // Parse the Excel file
    const parsedData = parseExcelFile(tempFilePath);
    if (!parsedData.success) {
      // Clean up temp file
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
      return {
        success: false,
        error: `Failed to parse Excel file: ${parsedData.error}`,
      };
    }

    // Extract chart data
    const extractedData = extractChartData(parsedData, xAxis, yAxis);
    if (!extractedData.success) {
      // Clean up temp file
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
      return {
        success: false,
        error: `Failed to extract chart data: ${extractedData.error}`,
      };
    }

    // Add detailed logging for debugging
    console.log("🔍 Extracted chart data details:", {
      xAxis: xAxis,
      yAxis: yAxis,
      dataPoints: extractedData.dataPoints,
      sampleData: extractedData.data.slice(0, 3),
      allData: extractedData.data,
    });

    // Validate that we have valid data
    if (extractedData.data.length === 0) {
      console.error("❌ No valid data points extracted");
      return {
        success: false,
        error: "No valid data points found for the selected columns",
      };
    }

    // Check for invalid data types
    const invalidData = extractedData.data.filter(
      (item) =>
        item.x === null ||
        item.x === undefined ||
        item.y === null ||
        item.y === undefined ||
        (typeof item.x === "string" && item.x.trim() === "") ||
        (typeof item.y === "string" && item.y.trim() === "")
    );

    if (invalidData.length > 0) {
      console.warn("⚠️ Found invalid data points:", invalidData);
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

    return {
      success: true,
      data: extractedData.data,
      dataPoints: extractedData.dataPoints,
      xAxis: xAxis,
      yAxis: yAxis,
      chartType: chartType,
    };
  } catch (err) {
    console.error("❌ Chart generation error:", err);
    return { success: false, error: err.message };
  }
};
