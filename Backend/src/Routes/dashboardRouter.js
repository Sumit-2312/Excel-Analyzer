import express from "express";
import { Uploads, Users } from "../db.js";

const dashboardRouter = express.Router();

// Get dashboard statistics
dashboardRouter.get("/stats", async (req, res) => {
  try {
    const userId = req.userId;

    // Get user's file count
    const fileCount = await Uploads.countDocuments({ userId });

    // Get total file size
    const files = await Uploads.find({ userId });
    const totalSize = files.reduce((sum, file) => sum + (file.size || 0), 0);

    // Get most used chart type
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

    const stats = [
      {
        title: "Total Files",
        value: fileCount.toString(),
        change: "+12%",
        trend: "up",
        icon: "FileSpreadsheet",
        color: "from-blue-500 to-cyan-500",
      },
      {
        title: "Total Size",
        value: `${(totalSize / (1024 * 1024)).toFixed(1)} MB`,
        change: "+8%",
        trend: "up",
        icon: "BarChart3",
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
        title: "Active Sessions",
        value: "1",
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
    console.error("Error fetching dashboard stats:", err);
    return res.status(500).json({ message: "Server error", error: err });
  }
});

// Get chart data for a specific file
dashboardRouter.post("/chart/:fileId", async (req, res) => {
  try {
    const { fileId } = req.params;
    const { chartType, xAxis, yAxis } = req.body;
    const userId = req.userId;

    const file = await Uploads.findOne({ _id: fileId, userId });
    if (!file) {
      return res
        .status(404)
        .json({ success: false, message: "File not found" });
    }

    // If new column selections are provided, regenerate chart data
    if (xAxis && yAxis && (xAxis !== file.xAxis || yAxis !== file.yAxis)) {
      console.log("📊 Regenerating chart data with new columns:", {
        fileId: fileId,
        oldXAxis: file.xAxis,
        oldYAxis: file.yAxis,
        newXAxis: xAxis,
        newYAxis: yAxis,
      });

      // Import the chart generation function directly
      const { generateChartDataForFile } = await import(
        "../utils/chartGenerator.js"
      );

      try {
        const chartResult = await generateChartDataForFile(
          fileId,
          xAxis,
          yAxis,
          chartType,
          userId
        );

        if (chartResult.success) {
          console.log("✅ Chart data regenerated successfully:", {
            dataPoints: chartResult.data.length,
            xAxis: xAxis,
            yAxis: yAxis,
            storedChartType: file.chartType,
            requestedChartType: chartType,
          });

          // Use the stored chart type from the database, fallback to requested chart type
          const effectiveChartType = file.chartType || chartType || "line";

          // Convert the chart data to Chart.js format
          const labels = chartResult.data.map((item) => item.x);
          const data = chartResult.data.map((item) => item.y);

          // Define colors for different chart types
          const colors = [
            "#928DAB",
            "#1F1C2C",
            "#FF6384",
            "#36A2EB",
            "#FFCE56",
            "#4BC0C0",
            "#9966FF",
            "#FF9F40",
          ];

          console.log("🎨 Creating chart data for regenerated data:", {
            chartType: effectiveChartType,
            isPieOrDoughnut:
              effectiveChartType === "pie" || effectiveChartType === "doughnut",
            dataLength: data.length,
            labelsLength: labels.length,
            colorsAvailable: colors.length,
          });

          let chartData;
          if (
            effectiveChartType === "pie" ||
            effectiveChartType === "doughnut"
          ) {
            // For pie and doughnut charts, use color arrays
            chartData = {
              labels: labels,
              datasets: [
                {
                  label: `${yAxis} vs ${xAxis}`,
                  data: data,
                  backgroundColor: colors.slice(0, data.length),
                  borderColor: colors.slice(0, data.length),
                },
              ],
            };
            console.log("🎨 Pie/Doughnut chart data created (regenerated):", {
              backgroundColor: chartData.datasets[0].backgroundColor,
              borderColor: chartData.datasets[0].borderColor,
              isArray: Array.isArray(chartData.datasets[0].backgroundColor),
            });
          } else {
            // For other chart types, use single colors
            chartData = {
              labels: labels,
              datasets: [
                {
                  label: `${yAxis} vs ${xAxis}`,
                  data: data,
                  borderColor: "#928DAB",
                  backgroundColor: "rgba(146, 141, 171, 0.1)",
                  tension: 0.4,
                },
              ],
            };
          }

          return res.status(200).json({
            success: true,
            data: chartData,
            source: "real_data",
            dataPoints: chartResult.data.length,
            xAxis: xAxis,
            yAxis: yAxis,
          });
        } else {
          console.error(
            "❌ Failed to regenerate chart data:",
            chartResult.error
          );
        }
      } catch (error) {
        console.error("❌ Error regenerating chart data:", error);
      }
    }

    // Check if we have chart data from the uploaded file
    if (file.chartData && file.chartData.length > 0) {
      console.log("📊 Using stored chart data from file:", {
        fileId: fileId,
        dataPoints: file.chartData.length,
        xAxis: file.xAxis,
        yAxis: file.yAxis,
        storedChartType: file.chartType,
        requestedChartType: chartType,
      });

      // Use the stored chart type from the database, fallback to requested chart type
      const effectiveChartType = file.chartType || chartType || "line";

      // Convert the stored chart data to Chart.js format
      const labels = file.chartData.map((item) => item.x);
      const data = file.chartData.map((item) => item.y);

      // Define colors for different chart types
      const colors = [
        "#928DAB",
        "#1F1C2C",
        "#FF6384",
        "#36A2EB",
        "#FFCE56",
        "#4BC0C0",
        "#9966FF",
        "#FF9F40",
      ];

      console.log("🎨 Creating chart data for stored data:", {
        chartType: effectiveChartType,
        isPieOrDoughnut:
          effectiveChartType === "pie" || effectiveChartType === "doughnut",
        dataLength: data.length,
        labelsLength: labels.length,
        colorsAvailable: colors.length,
      });

      let chartData;
      if (effectiveChartType === "pie" || effectiveChartType === "doughnut") {
        // For pie and doughnut charts, use color arrays
        chartData = {
          labels: labels,
          datasets: [
            {
              label: `${file.yAxis} vs ${file.xAxis}`,
              data: data,
              backgroundColor: colors.slice(0, data.length),
              borderColor: colors.slice(0, data.length),
            },
          ],
        };
        console.log("🎨 Pie/Doughnut chart data created:", {
          backgroundColor: chartData.datasets[0].backgroundColor,
          borderColor: chartData.datasets[0].borderColor,
          isArray: Array.isArray(chartData.datasets[0].backgroundColor),
        });
      } else {
        // For other chart types, use single colors
        chartData = {
          labels: labels,
          datasets: [
            {
              label: `${file.yAxis} vs ${file.xAxis}`,
              data: data,
              borderColor: "#928DAB",
              backgroundColor: "rgba(146, 141, 171, 0.1)",
              tension: 0.4,
            },
          ],
        };
      }

      return res.status(200).json({
        success: true,
        data: chartData,
        source: "real_data",
        dataPoints: file.chartData.length,
        xAxis: file.xAxis,
        yAxis: file.yAxis,
      });
    }

    // Fallback to sample data if no real data available
    console.log(
      "⚠️ No real chart data available, using sample data for file:",
      fileId
    );

    const sampleData = {
      line: {
        labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
        datasets: [
          {
            label: "Sales",
            data: [12, 19, 3, 5, 2, 3],
            borderColor: "#928DAB",
            backgroundColor: "rgba(146, 141, 171, 0.1)",
            tension: 0.4,
          },
        ],
      },
      bar: {
        labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
        datasets: [
          {
            label: "Revenue",
            data: [65, 59, 80, 81, 56, 55],
            backgroundColor: "rgba(146, 141, 171, 0.8)",
          },
        ],
      },
      pie: {
        labels: ["Red", "Blue", "Yellow", "Green", "Purple"],
        datasets: [
          {
            data: [12, 19, 3, 5, 2],
            backgroundColor: [
              "#928DAB",
              "#1F1C2C",
              "#FF6384",
              "#36A2EB",
              "#FFCE56",
            ],
          },
        ],
      },
      doughnut: {
        labels: ["Desktop", "Mobile", "Tablet"],
        datasets: [
          {
            data: [300, 50, 100],
            backgroundColor: ["#928DAB", "#1F1C2C", "#FF6384"],
          },
        ],
      },
    };

    const chartData = sampleData[chartType] || sampleData.line;

    res.status(200).json({
      success: true,
      data: chartData,
      source: "sample_data",
      message:
        "Using sample data - upload an Excel file with X and Y axis columns for real data",
    });
  } catch (err) {
    console.error("Error generating chart data:", err);
    return res
      .status(500)
      .json({ success: false, message: "Server error", error: err });
  }
});

export default dashboardRouter;
