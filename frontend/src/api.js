const API_URL = "http://localhost:3000";

// Authentication APIs
export async function login(email, password, role) {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, role }),
  });
  return res.json();
}

export async function signup(name, email, password, role) {
  const res = await fetch(`${API_URL}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, username: name, email, password, role }),
  });
  return res.json();
}

// User Profile APIs
export async function getUserProfile() {
  const token = getToken();
  const res = await fetch(`${API_URL}/auth/profile`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  return res.json();
}

export async function updateUserProfile(userData) {
  const token = getToken();
  const res = await fetch(`${API_URL}/auth/profile`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(userData),
  });
  return res.json();
}

// File Upload APIs
export async function uploadFile(file, chartType, xAxis, yAxis) {
  const token = getToken();
  const formData = new FormData();
  formData.append("file", file);
  formData.append("chartType", chartType);
  formData.append("xAxis", xAxis);
  formData.append("yAxis", yAxis);

  const res = await fetch(`${API_URL}/upload`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });
  return res.json();
}

export async function getUserFiles() {
  const token = getToken();
  const res = await fetch(`${API_URL}/upload/files`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  return res.json();
}

export async function getFileData(fileId) {
  const token = getToken();
  const res = await fetch(`${API_URL}/upload/files/${fileId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  return res.json();
}

export async function deleteFile(fileId) {
  const token = getToken();
  const res = await fetch(`${API_URL}/upload/files/${fileId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  return res.json();
}

// Dashboard Statistics APIs
export async function getDashboardStats() {
  const token = getToken();
  const res = await fetch(`${API_URL}/dashboard/stats`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  return res.json();
}

export async function getChartData(
  fileId,
  chartType,
  xAxis = null,
  yAxis = null
) {
  const token = getToken();
  const res = await fetch(`${API_URL}/dashboard/chart/${fileId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ chartType, xAxis, yAxis }),
  });
  return res.json();
}

// Admin APIs
export async function getAllUsers() {
  const token = getToken();
  const res = await fetch(`${API_URL}/admin/users`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  return res.json();
}

export async function updateUserStatus(userId, status) {
  const token = getToken();
  const res = await fetch(`${API_URL}/admin/users/${userId}/status`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ status }),
  });
  return res.json();
}

export async function deleteUser(userId) {
  const token = getToken();
  const res = await fetch(`${API_URL}/admin/users/${userId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  return res.json();
}

export async function getAdminStats() {
  const token = getToken();
  const res = await fetch(`${API_URL}/admin/stats`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  return res.json();
}

// Token Management
export function saveToken(token) {
  localStorage.setItem("token", token);
}

export function getToken() {
  return localStorage.getItem("token");
}

export function logout() {
  localStorage.removeItem("token");
}

// Function to verify token with backend
export async function verifyToken() {
  const token = getToken();
  if (!token) return false;

  try {
    const response = await fetch(`${API_URL}/auth/profile`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.ok) {
      return true;
    } else if (response.status === 401 || response.status === 403) {
      // Only logout for authentication errors, not other errors
      console.log("Token is invalid, logging out user");
      logout();
      return false;
    } else {
      // For other errors (500, 404, etc.), don't logout - just return false
      console.log(
        "Server error during token verification, keeping user logged in"
      );
      return false;
    }
  } catch (error) {
    // Network error - don't logout immediately, just return false
    // This allows the user to stay logged in if the backend is temporarily unavailable
    console.log(
      "Network error during token verification, keeping user logged in:",
      error.message
    );
    return false;
  }
}

// Utility function to check if user is authenticated
export function isAuthenticated() {
  const token = getToken();
  if (!token) return false;

  try {
    // Decode the token to check if it's valid
    const decoded = decodeToken();
    if (!decoded) {
      console.log(
        "Could not decode token, but keeping it for backend verification"
      );
      return true; // Let the backend decide if the token is valid
    }

    // Check if token is expired
    const currentTime = Date.now() / 1000;
    if (decoded.exp && decoded.exp < currentTime) {
      // Token is expired, remove it
      console.log("Token is expired, logging out user");
      logout();
      return false;
    }

    return true;
  } catch (error) {
    // If there's any error decoding the token, don't logout immediately
    // Let the backend verification handle it
    console.log(
      "Error decoding token, but keeping it for backend verification:",
      error.message
    );
    return true; // Let the backend decide if the token is valid
  }
}

// Function to decode JWT token and get user info
export function decodeToken() {
  const token = getToken();
  if (!token) return null;

  try {
    // JWT tokens have 3 parts separated by dots
    const payload = token.split(".")[1];
    // Decode base64
    const decoded = JSON.parse(atob(payload));
    return decoded;
  } catch (error) {
    console.error("Error decoding token:", error);
    return null;
  }
}

// Function to get user role from token
export function getUserRole() {
  const decoded = decodeToken();
  return decoded?.role || "user";
}

// Function to get user name from token
export function getUserName() {
  const decoded = decodeToken();
  return decoded?.name || decoded?.username || "User";
}

// Utility function to handle API errors and authentication failures
export function handleApiError(error, response) {
  if (response?.status === 401 || response?.status === 403) {
    // Authentication error - logout user
    console.log("Authentication error, logging out user");
    logout();
    // You can add a redirect to login here if needed
    return { error: "Authentication failed. Please log in again." };
  } else if (response?.status >= 500) {
    // Server error - don't logout, just show error
    return { error: "Server error. Please try again later." };
  } else if (error) {
    // Network error - don't logout, just show error
    return { error: "Network error. Please check your connection." };
  }
  return { error: "An unexpected error occurred." };
}

// Enhanced fetch wrapper with error handling
export async function apiFetch(url, options = {}) {
  const token = getToken();

  const config = {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      const error = handleApiError(null, response);
      if (error.error.includes("Authentication failed")) {
        // Force logout on auth errors
        logout();
      }
      throw new Error(error.error);
    }

    return response;
  } catch (error) {
    if (error.name === "TypeError" && error.message.includes("fetch")) {
      // Network error
      const networkError = handleApiError(error, null);
      throw new Error(networkError.error);
    }
    throw error;
  }
}

// Health check function to verify backend connectivity
export async function checkBackendHealth() {
  try {
    const response = await fetch(`${API_URL}/health`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    return response.ok;
  } catch (error) {
    console.log("Backend health check failed:", error.message);
    return false;
  }
}

// Function to periodically check backend health and re-verify token
export function startHealthCheck() {
  const interval = setInterval(async () => {
    const isHealthy = await checkBackendHealth();
    if (isHealthy) {
      console.log("✅ Backend is healthy");
      // If backend is back online, re-verify token
      const token = getToken();
      if (token) {
        const isValid = await verifyToken();
        if (isValid) {
          console.log("✅ Token re-verified successfully");
        }
      }
    } else {
      console.log("⚠️ Backend health check failed");
    }
  }, 30000); // Check every 30 seconds

  return () => clearInterval(interval);
}
