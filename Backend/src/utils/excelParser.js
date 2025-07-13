import XLSX from "xlsx";
import fs from "fs";

export const parseExcelFile = (filePath) => {
  try {
    // Read the Excel file
    const workbook = XLSX.readFile(filePath);

    // Get the first sheet
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Convert to JSON
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    // Get headers (first row) and trim whitespace
    const headers = (jsonData[0] || []).map((header) =>
      typeof header === "string" ? header.trim() : header
    );

    // Get data rows (skip header)
    const dataRows = jsonData.slice(1);

    // Create structured data
    const structuredData = dataRows.map((row) => {
      const rowData = {};
      headers.forEach((header, index) => {
        rowData[header] = row[index];
      });
      return rowData;
    });

    return {
      success: true,
      headers: headers,
      data: structuredData,
      totalRows: dataRows.length,
      totalColumns: headers.length,
      sheetName: sheetName,
    };
  } catch (error) {
    console.error("Error parsing Excel file:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

export const extractChartData = (parsedData, xAxis, yAxis) => {
  try {
    if (!parsedData.success) {
      return { success: false, error: "Invalid parsed data" };
    }

    const { data, headers } = parsedData;

    // Validate column names
    if (!headers.includes(xAxis)) {
      return {
        success: false,
        error: `X-axis column '${xAxis}' not found. Available columns: ${headers.join(
          ", "
        )}`,
      };
    }

    if (!headers.includes(yAxis)) {
      return {
        success: false,
        error: `Y-axis column '${yAxis}' not found. Available columns: ${headers.join(
          ", "
        )}`,
      };
    }

    // Extract data for chart
    const chartData = data
      .map((row) => ({
        x: row[xAxis],
        y: row[yAxis],
      }))
      .filter((item) => item.x !== undefined && item.y !== undefined);

    return {
      success: true,
      data: chartData,
      xAxis: xAxis,
      yAxis: yAxis,
      dataPoints: chartData.length,
    };
  } catch (error) {
    console.error("Error extracting chart data:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

export const getAvailableColumns = (filePath) => {
  try {
    const parsedData = parseExcelFile(filePath);
    if (parsedData.success) {
      return {
        success: true,
        columns: parsedData.headers,
        totalRows: parsedData.totalRows,
        totalColumns: parsedData.totalColumns,
      };
    } else {
      return { success: false, error: parsedData.error };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const validateExcelFile = (filePath) => {
  try {
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return { success: false, error: "File does not exist" };
    }

    // Check file size (max 10MB)
    const stats = fs.statSync(filePath);
    const fileSizeInMB = stats.size / (1024 * 1024);
    if (fileSizeInMB > 10) {
      return { success: false, error: "File size exceeds 10MB limit" };
    }

    // Try to parse the file
    const parsedData = parseExcelFile(filePath);
    if (!parsedData.success) {
      return { success: false, error: parsedData.error };
    }

    // Check if file has data
    if (parsedData.totalRows === 0) {
      return {
        success: false,
        error: "Excel file is empty or has no data rows",
      };
    }

    return {
      success: true,
      message: "Excel file is valid",
      totalRows: parsedData.totalRows,
      totalColumns: parsedData.totalColumns,
      headers: parsedData.headers,
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
