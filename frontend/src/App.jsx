import { Routes, Route } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import LandingPage from './components/LandingPage';
import Login from './components/Login';
import Signup from './components/Signup';
import Dashboard from './components/Dashboard';
import AdminPanel from './components/AdminPanel';
import Navbar from './components/Navbar';
import { useState, useEffect } from 'react';
import { getToken, isAuthenticated, getUserRole, verifyToken, startHealthCheck, getUserName } from './api';

function App() {
  const [authState, setAuthState] = useState(false);
  const [userRole, setUserRole] = useState('user');
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing authentication on app load
  useEffect(() => {
    const checkAuth = async () => {
      console.log('🔍 Checking authentication...');
      const token = getToken();
      console.log('Token exists:', !!token);
      
      if (token && isAuthenticated()) {
        console.log('✅ Token is valid locally, verifying with backend...');
        // Verify token with backend
        const isValid = await verifyToken();
        console.log('Backend verification result:', isValid);
        
        if (isValid) {
          // Extract user role from JWT token
          const role = getUserRole();
          console.log('Setting auth state to true with role:', role);
          setAuthState(true);
          setUserRole(role);
        } else {
          // Backend verification failed, but we have a token
          // This could be due to network issues or backend being down
          // Let's keep the user logged in and let individual API calls handle auth
          console.log('⚠️ Backend verification failed, but keeping user logged in with token');
          const role = getUserRole();
          setAuthState(true);
          setUserRole(role);
        }
      } else {
        // No token or invalid token
        console.log('❌ No token or invalid token, setting auth state to false');
        setAuthState(false);
        setUserRole('user');
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  // Start health check for authenticated users
  useEffect(() => {
    if (authState) {
      console.log('🏥 Starting health check for authenticated user');
      const stopHealthCheck = startHealthCheck();
      
      return () => {
        console.log('🏥 Stopping health check');
        stopHealthCheck();
      };
    }
  }, [authState]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-steel-custom via-steel-custom to-gray-custom/20 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-gray-custom border-t-white rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white/70">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-steel-custom via-steel-custom to-gray-custom/20">
      <AnimatePresence mode="wait">
        <Routes>
          <Route path="/" element={
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              <LandingPage />
            </motion.div>
          } />
          
          <Route path="/login" element={
            authState ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
              >
                <div className="flex">
                  <Navbar userRole={userRole} userName={getUserName()} setAuthState={setAuthState} />
                  <Dashboard />
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
              >
                <Login setIsAuthenticated={setAuthState} setUserRole={setUserRole} />
              </motion.div>
            )
          } />
          
          <Route path="/signup" element={
            authState ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
              >
                <div className="flex">
                  <Navbar userRole={userRole} userName={getUserName()} setAuthState={setAuthState} />
                  <Dashboard />
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
              >
                <Signup setIsAuthenticated={setAuthState} setUserRole={setUserRole} />
              </motion.div>
            )
          } />
          
          <Route path="/dashboard" element={
            authState ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
              >
                <div className="flex">
                  <Navbar userRole={userRole} userName={getUserName()} setAuthState={setAuthState} />
                  <Dashboard />
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Login setIsAuthenticated={setAuthState} setUserRole={setUserRole} />
              </motion.div>
            )
          } />
          
          <Route path="/admin" element={
            authState && userRole === 'admin' ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
              >
                <div className="flex">
                  <Navbar userRole={userRole} userName={getUserName()} setAuthState={setAuthState} />
                  <AdminPanel />
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Login setIsAuthenticated={setAuthState} setUserRole={setUserRole} />
              </motion.div>
            )
          } />
        </Routes>
      </AnimatePresence>
    </div>
  );
}

export default App;
