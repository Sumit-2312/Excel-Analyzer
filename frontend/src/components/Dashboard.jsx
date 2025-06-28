import { motion } from 'framer-motion';
import { useState, useRef, useEffect } from 'react';
import { 
  Upload, 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  ScatterChart,
  Box,
  Download,
  FileText,
  Calendar,
  Brain,
  Trash2
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Bar, Pie, Doughnut } from 'react-chartjs-2';
import { uploadFile, getUserFiles, deleteFile, getChartData } from '../api';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const Dashboard = () => {
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedChartType, setSelectedChartType] = useState('line');
  const [xAxis, setXAxis] = useState('');
  const [yAxis, setYAxis] = useState('');
  const [recentUploads, setRecentUploads] = useState([]);
  const [chartData, setChartData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [error, setError] = useState('');
  const [availableColumns, setAvailableColumns] = useState([]);
  const [fileProcessingInfo, setFileProcessingInfo] = useState(null);
  const [uploadedFileId, setUploadedFileId] = useState(null);
  const [showColumnSelection, setShowColumnSelection] = useState(false);
  const fileInputRef = useRef();

  // Reset Y-axis when X-axis changes to prevent conflicts
  useEffect(() => {
    if (xAxis === yAxis && yAxis !== '') {
      setYAxis('');
    }
  }, [xAxis, yAxis]);

  // Update chart type in database when it changes
  const updateChartTypeInDatabase = async (fileId, newChartType) => {
    try {
      console.log('🔄 Updating chart type in database:', { fileId, newChartType });
      const response = await fetch(`http://localhost:3000/upload/files/${fileId}/chart-type`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ chartType: newChartType }),
      });
      
      const result = await response.json();
      if (result.success) {
        console.log('✅ Chart type updated in database');
      } else {
        console.error('❌ Failed to update chart type:', result.message);
      }
    } catch (err) {
      console.error('❌ Error updating chart type:', err);
    }
  };

  // Load chart data when chart type changes
  useEffect(() => {
    if (uploadedFile && uploadedFile._id && selectedChartType && xAxis && yAxis) {
      console.log('🔄 Chart type changed to:', selectedChartType, 'reloading chart data...');
      // Update chart type in database first
      updateChartTypeInDatabase(uploadedFile._id, selectedChartType);
      // Then reload chart data
      loadChartData(uploadedFile._id, selectedChartType, xAxis, yAxis);
    }
  }, [selectedChartType, uploadedFile?._id, xAxis, yAxis]);

  // Load user files on component mount
  useEffect(() => {
    loadUserFiles();
  }, []);

  const loadUserFiles = async () => {
    try {
      const response = await getUserFiles();
      if (response.success) {
        setRecentUploads(response.files || []);
        
        // If there are files and no chart data is loaded, load the first file's chart data
        if (response.files && response.files.length > 0 && !chartData) {
          const firstFile = response.files[0];
          await loadChartData(firstFile._id, firstFile.chartType || 'line', firstFile.xAxis, firstFile.yAxis);
        }
      }
    } catch (err) {
      console.error('Error loading files:', err);
    }
  };

  const handleFileUpload = async (files) => {
    const file = files[0];
    if (file && file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
      setUploadedFile(file);
      setUploadLoading(true);
      setError('');
      setFileProcessingInfo(null);
      setShowColumnSelection(false);
      
      try {
        console.log('📁 Uploading file:', file.name);
        // First upload without chart data to get headers
        const response = await uploadFile(file, selectedChartType, '', '');
        console.log('📊 Upload response:', response);
        
        if (response.success) {
          setUploadedFileId(response.fileId);
          
          // Show file processing info
          setFileProcessingInfo({
            totalRows: response.file.totalRows,
            totalColumns: response.file.totalColumns,
            headers: response.file.headers,
            chartDataPoints: 0,
            dataSource: 'pending',
            message: 'File uploaded successfully! Select X and Y axis columns to generate chart.'
          });
          
          // Update available columns and show column selection
          if (response.file.headers) {
            setAvailableColumns(response.file.headers);
            setShowColumnSelection(true);
          }
          
          // Reload user files after successful upload
          await loadUserFiles();
        } else {
          setError(response.message || 'Upload failed');
        }
      } catch (err) {
        setError('Network error. Please try again.');
        console.error('Upload error:', err);
      } finally {
        setUploadLoading(false);
      }
    } else {
      setError('Please select a valid Excel file (.xlsx)');
    }
  };

  const handleGenerateChart = async () => {
    if (!xAxis || !yAxis) {
      setError('Please select both X and Y axis columns');
      return;
    }

    if (xAxis === yAxis) {
      setError('X and Y axis columns must be different');
      return;
    }

    const fileId = uploadedFileId || (recentUploads.length > 0 ? recentUploads[0]._id : null);
    if (!fileId) {
      setError('No file available');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      console.log('📊 Generating chart with columns:', { xAxis, yAxis, fileId });
      
      // Update the file with chart data
      const response = await fetch(`http://localhost:3000/upload/files/${fileId}/chart`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          xAxis: xAxis,
          yAxis: yAxis,
          chartType: selectedChartType
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        // Load chart data with current column selections
        await loadChartData(fileId, selectedChartType, xAxis, yAxis);
        
        // Update file processing info
        setFileProcessingInfo(prev => ({
          ...prev,
          dataSource: 'real_data',
          chartDataPoints: result.dataPoints || 0,
          xAxis: xAxis,
          yAxis: yAxis,
          message: 'Chart generated successfully with real Excel data!'
        }));
        
        setShowColumnSelection(false);
      } else {
        setError(result.message || 'Failed to generate chart');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Chart generation error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadChartData = async (fileId, chartType, currentXAxis = null, currentYAxis = null) => {
    try {
      console.log('📊 Loading chart data for file:', fileId, 'chart type:', chartType, 'columns:', { xAxis: currentXAxis, yAxis: currentYAxis });
      const response = await getChartData(fileId, chartType, currentXAxis, currentYAxis);
      console.log('📈 Chart data response:', response);
      console.log('📊 Response data structure:', {
        success: response.success,
        source: response.source,
        dataPoints: response.dataPoints,
        xAxis: response.xAxis,
        yAxis: response.yAxis,
        dataKeys: response.data ? Object.keys(response.data) : 'No data',
        labelsLength: response.data?.labels?.length,
        datasetsLength: response.data?.datasets?.length,
        firstDatasetData: response.data?.datasets?.[0]?.data?.slice(0, 3)
      });
      
      if (response.success) {
        console.log('✅ Setting chart data:', response.data);
        setChartData(response.data);
        if (response.source === 'real_data') {
          console.log('✅ Using real Excel data for chart');
          // Show success message for real data
          setFileProcessingInfo(prev => ({
            ...prev,
            dataSource: 'real_data',
            dataPoints: response.dataPoints,
            xAxis: response.xAxis,
            yAxis: response.yAxis
          }));
        } else {
          console.log('⚠️ Using sample data - no real Excel data available');
          // Show warning for sample data
          setFileProcessingInfo(prev => ({
            ...prev,
            dataSource: 'sample_data',
            message: 'Using sample data - select X and Y axis columns for real data'
          }));
        }
      } else {
        console.error('❌ Chart data request failed:', response.message);
      }
    } catch (err) {
      console.error('❌ Error loading chart data:', err);
    }
  };

  const handleDeleteFile = async (fileId) => {
    try {
      const response = await deleteFile(fileId);
      if (response.success) {
        await loadUserFiles();
      }
    } catch (err) {
      console.error('Error deleting file:', err);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileUpload(e.dataTransfer.files);
  };

  const chartTypes = [
    { id: 'line', name: 'Line Chart', icon: TrendingUp },
    { id: 'bar', name: 'Bar Chart', icon: BarChart3 },
    { id: 'pie', name: 'Pie Chart', icon: PieChart },
    { id: 'doughnut', name: 'Doughnut Chart', icon: PieChart },
    { id: '3d', name: '3D Chart', icon: Box },
  ];

  // Sample chart data (fallback)
  const sampleChartData = {
    line: {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      datasets: [
        {
          label: 'Sales',
          data: [12, 19, 3, 5, 2, 3],
          borderColor: '#928DAB',
          backgroundColor: 'rgba(146, 141, 171, 0.1)',
          tension: 0.4,
        },
      ],
    },
    bar: {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      datasets: [
        {
          label: 'Revenue',
          data: [65, 59, 80, 81, 56, 55],
          backgroundColor: 'rgba(146, 141, 171, 0.8)',
        },
      ],
    },
    pie: {
      labels: ['Red', 'Blue', 'Yellow', 'Green', 'Purple'],
      datasets: [
        {
          data: [12, 19, 3, 5, 2],
          backgroundColor: [
            '#928DAB',
            '#1F1C2C',
            '#FF6384',
            '#36A2EB',
            '#FFCE56',
          ],
        },
      ],
    },
    doughnut: {
      labels: ['Desktop', 'Mobile', 'Tablet'],
      datasets: [
        {
          data: [300, 50, 100],
          backgroundColor: [
            '#928DAB',
            '#1F1C2C',
            '#FF6384',
          ],
        },
      ],
    },
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: 'white',
          usePointStyle: true,
        },
      },
      title: {
        display: true,
        text: 'Data Visualization',
        color: 'white',
      },
    },
    ...(selectedChartType === 'pie' || selectedChartType === 'doughnut' ? {
      // No scales for pie/doughnut charts
    } : {
      scales: {
        x: {
          ticks: { color: 'white' },
          grid: { color: 'rgba(255, 255, 255, 0.1)' },
        },
        y: {
          ticks: { color: 'white' },
          grid: { color: 'rgba(255, 255, 255, 0.1)' },
        },
      },
    }),
  };

  const renderChart = () => {
    const data = chartData || sampleChartData[selectedChartType] || sampleChartData.line;
    
    console.log('🎨 Rendering chart with data:', {
      hasChartData: !!chartData,
      chartType: selectedChartType,
      dataKeys: Object.keys(data),
      labelsLength: data.labels?.length,
      datasetsLength: data.datasets?.length,
      firstDatasetData: data.datasets?.[0]?.data?.slice(0, 3),
      backgroundColor: data.datasets?.[0]?.backgroundColor,
      borderColor: data.datasets?.[0]?.borderColor,
      isArray: Array.isArray(data.datasets?.[0]?.backgroundColor)
    });
    
    switch (selectedChartType) {
      case 'line':
        return <Line data={data} options={chartOptions} />;
      case 'bar':
        return <Bar data={data} options={chartOptions} />;
      case 'pie':
        return <Pie data={data} options={chartOptions} />;
      case 'doughnut':
        return <Doughnut data={data} options={chartOptions} />;
      default:
        return <Line data={data} options={chartOptions} />;
    }
  };

  const regenerateChartWithNewColumns = async (fileId, newXAxis, newYAxis) => {
    if (!newXAxis || !newYAxis) {
      setError('Please select both X and Y axis columns');
      return;
    }

    if (newXAxis === newYAxis) {
      setError('X and Y axis columns must be different');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      console.log('📊 Regenerating chart with new columns:', { fileId, newXAxis, newYAxis });
      
      // Use the dashboard router to get chart data with new columns
      await loadChartData(fileId, selectedChartType, newXAxis, newYAxis);
      
      // Update file processing info
      setFileProcessingInfo(prev => ({
        ...prev,
        dataSource: 'real_data',
        xAxis: newXAxis,
        yAxis: newYAxis,
        message: 'Chart regenerated successfully with new columns!'
      }));
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Chart regeneration error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 ml-64 p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-8"
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold gradient-text">Dashboard</h1>
            <p className="text-white/70">Upload and analyze your Excel files</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Upload Section */}
          <div className="lg:col-span-1">
            <motion.div
              className="glass-card p-6"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h2 className="text-xl font-semibold mb-4 text-white">Upload Excel File</h2>
              
              {/* Error Message */}
              {error && (
                <motion.div
                  className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {error}
                </motion.div>
              )}
              
              {/* Drag & Drop Area */}
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-300 ${
                  isDragOver 
                    ? 'border-gray-custom bg-gray-custom/10' 
                    : 'border-white/20 hover:border-white/40'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-12 h-12 mx-auto mb-4 text-white/50" />
                <p className="text-white/70 mb-2">Drag & drop your Excel file here</p>
                <p className="text-white/50 text-sm">or click to browse</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={(e) => handleFileUpload(e.target.files)}
                  className="hidden"
                />
              </div>

              {uploadedFile && (
                <motion.div
                  className="mt-4 p-4 bg-green-500/10 border border-green-500/20 rounded-lg"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <div className="flex items-center gap-2 text-green-400">
                    <FileText className="w-4 h-4" />
                    <span className="text-sm font-medium">{uploadedFile.name}</span>
                  </div>
                </motion.div>
              )}

              {/* Chart Type Selector */}
              <div className="mt-6">
                <label className="block text-white/90 text-sm font-medium mb-3">
                  Chart Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {chartTypes.map((type) => (
                    <motion.button
                      key={type.id}
                      className={`p-3 rounded-lg border transition-all duration-200 flex items-center gap-2 text-sm ${
                        selectedChartType === type.id
                          ? 'border-gray-custom bg-gray-custom/20 text-white'
                          : 'border-white/20 text-white/70 hover:border-white/40'
                      }`}
                      onClick={() => setSelectedChartType(type.id)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <type.icon className="w-4 h-4" />
                      {type.name}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Column Selectors */}
              {showColumnSelection && (
                <div className="mt-6 space-y-4">
                  <div>
                    <label className="block text-white/90 text-sm font-medium mb-2">
                      X-Axis Column
                    </label>
                    <select
                      value={xAxis}
                      onChange={(e) => setXAxis(e.target.value)}
                      className="input-field w-full"
                    >
                      <option value="">Select column</option>
                      {availableColumns.length > 0 ? (
                        availableColumns.map((column, index) => (
                          <option key={index} value={column}>{column}</option>
                        ))
                      ) : (
                        <>
                          <option value="date">Date</option>
                          <option value="category">Category</option>
                          <option value="product">Product</option>
                        </>
                      )}
                    </select>
                  </div>
                  <div>
                    <label className="block text-white/90 text-sm font-medium mb-2">
                      Y-Axis Column
                    </label>
                    <select
                      value={yAxis}
                      onChange={(e) => setYAxis(e.target.value)}
                      className="input-field w-full"
                    >
                      <option value="">Select column</option>
                      {availableColumns.length > 0 ? (
                        availableColumns
                          .filter(column => column !== xAxis)
                          .map((column, index) => (
                            <option key={index} value={column}>{column}</option>
                          ))
                      ) : (
                        <>
                          <option value="sales">Sales</option>
                          <option value="revenue">Revenue</option>
                          <option value="quantity">Quantity</option>
                        </>
                      )}
                    </select>
                  </div>
                  
                  {/* Generate Chart Button */}
                  <motion.button
                    className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
                      xAxis && yAxis && !isLoading
                        ? 'bg-gradient-to-r from-gray-custom to-purple-600 text-white hover:from-purple-600 hover:to-gray-custom'
                        : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    }`}
                    onClick={handleGenerateChart}
                    disabled={!xAxis || !yAxis || isLoading}
                    whileHover={xAxis && yAxis && !isLoading ? { scale: 1.02 } : {}}
                    whileTap={xAxis && yAxis && !isLoading ? { scale: 0.98 } : {}}
                  >
                    {isLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Generating Chart...
                      </>
                    ) : (
                      <>
                        <BarChart3 className="w-4 h-4" />
                        Generate Chart
                      </>
                    )}
                  </motion.button>
                </div>
              )}

              {/* File Processing Info */}
              {fileProcessingInfo && (
                <motion.div
                  className={`mt-4 p-4 border rounded-lg ${
                    fileProcessingInfo.dataSource === 'real_data' 
                      ? 'bg-green-500/10 border-green-500/20' 
                      : fileProcessingInfo.dataSource === 'pending'
                      ? 'bg-blue-500/10 border-blue-500/20'
                      : 'bg-yellow-500/10 border-yellow-500/20'
                  }`}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <div className={`text-sm ${
                    fileProcessingInfo.dataSource === 'real_data' ? 'text-green-400' 
                    : fileProcessingInfo.dataSource === 'pending' ? 'text-blue-400'
                    : 'text-yellow-400'
                  }`}>
                    <div className="font-medium mb-2">
                      {fileProcessingInfo.dataSource === 'real_data' ? '✅ Chart Generated Successfully' 
                       : fileProcessingInfo.dataSource === 'pending' ? '📁 File Uploaded Successfully'
                       : '⚠️ File Processed (Sample Data)'}
                    </div>
                    <div className="space-y-1 text-xs">
                      <div>📊 Total Rows: {fileProcessingInfo.totalRows}</div>
                      <div>📋 Total Columns: {fileProcessingInfo.totalColumns}</div>
                      <div>📈 Chart Data Points: {fileProcessingInfo.chartDataPoints || fileProcessingInfo.dataPoints || 0}</div>
                      <div>🏷️ Available Columns: {fileProcessingInfo.headers?.join(', ')}</div>
                      {fileProcessingInfo.dataSource === 'real_data' && fileProcessingInfo.xAxis && fileProcessingInfo.yAxis && (
                        <div>📊 Using: {fileProcessingInfo.xAxis} vs {fileProcessingInfo.yAxis}</div>
                      )}
                      {fileProcessingInfo.dataSource === 'pending' && (
                        <div className="text-blue-300 mt-2">
                          💡 Select X and Y axis columns above to generate a chart with your Excel data
                        </div>
                      )}
                      {fileProcessingInfo.dataSource === 'sample_data' && (
                        <div className="text-yellow-300 mt-2">
                          💡 Select X and Y axis columns above to see real data from your Excel file
                        </div>
                      )}
                      {fileProcessingInfo.message && (
                        <div className="text-blue-300 mt-2">{fileProcessingInfo.message}</div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>

            {/* Recent Uploads */}
            <motion.div
              className="glass-card p-6 mt-6"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <h3 className="text-lg font-semibold mb-4 text-white">Recent Uploads</h3>
              <div className="space-y-3">
                {recentUploads.length === 0 ? (
                  <p className="text-white/50 text-sm text-center py-4">No files uploaded yet</p>
                ) : (
                  recentUploads.map((upload, index) => (
                    <motion.div
                      key={upload._id || index}
                      className="flex items-center justify-between p-3 bg-white/5 rounded-lg cursor-pointer hover:bg-white/10 transition-colors"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * index }}
                      onClick={() => loadChartData(upload._id, upload.chartType || 'line', upload.xAxis, upload.yAxis)}
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="w-4 h-4 text-white/50" />
                        <div>
                          <p className="text-white/90 text-sm font-medium">{upload.filename}</p>
                          <p className="text-white/50 text-xs">
                            {upload.chartType || 'Unknown'} • {upload.totalRows || 0} rows
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-white/50 text-xs">
                          {new Date(upload.uploadDate).toLocaleDateString()}
                        </span>
                        <button 
                          className="text-red-400 hover:text-red-300"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteFile(upload._id);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          </div>

          {/* Chart Viewer */}
          <div className="lg:col-span-2">
            <motion.div
              className="glass-card p-6"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-white">Chart Visualization</h2>
                <div className="flex gap-2">
                  {chartData && fileProcessingInfo?.dataSource === 'real_data' && (
                    <button 
                      className="btn-secondary flex items-center gap-2 text-sm"
                      onClick={() => setShowColumnSelection(true)}
                    >
                      <BarChart3 className="w-4 h-4" />
                      Change Columns
                    </button>
                  )}
                  <button className="btn-secondary flex items-center gap-2 text-sm">
                    <Download className="w-4 h-4" />
                    PNG
                  </button>
                  <button className="btn-secondary flex items-center gap-2 text-sm">
                    <Download className="w-4 h-4" />
                    PDF
                  </button>
                </div>
              </div>
              
              <div className="h-96 flex items-center justify-center">
                {uploadedFile || chartData ? (
                  <div className="w-full h-full">
                    {renderChart()}
                  </div>
                ) : (
                  <div className="text-center text-white/50">
                    <BarChart3 className="w-16 h-16 mx-auto mb-4" />
                    <p>Upload an Excel file to see your chart</p>
                  </div>
                )}
              </div>
            </motion.div>

            {/* AI Insights */}
            <motion.div
              className="glass-card p-6 mt-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <Brain className="w-6 h-6 text-gray-custom" />
                <h3 className="text-lg font-semibold text-white">AI Insights</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-white/5 rounded-lg">
                  <h4 className="text-white/90 font-medium mb-2">Trend Analysis</h4>
                  <p className="text-white/70 text-sm">
                    Your sales data shows a 15% increase over the last quarter, with peak performance in March.
                  </p>
                </div>
                <div className="p-4 bg-white/5 rounded-lg">
                  <h4 className="text-white/90 font-medium mb-2">Recommendations</h4>
                  <p className="text-white/70 text-sm">
                    Consider focusing marketing efforts on your top-performing product categories.
                  </p>
                </div>
                <div className="p-4 bg-white/5 rounded-lg">
                  <h4 className="text-white/90 font-medium mb-2">Anomaly Detection</h4>
                  <p className="text-white/70 text-sm">
                    No significant anomalies detected in your dataset. Data quality is excellent.
                  </p>
                </div>
                <div className="p-4 bg-white/5 rounded-lg">
                  <h4 className="text-white/90 font-medium mb-2">Forecast</h4>
                  <p className="text-white/70 text-sm">
                    Based on current trends, expect a 12% growth in the next quarter.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Dashboard; 