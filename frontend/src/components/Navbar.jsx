import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileSpreadsheet, 
  Home, 
  BarChart3, 
  Users, 
  LogOut, 
  ChevronDown,
  User
} from 'lucide-react';
import { getUserProfile, logout as logoutUser, getUserName } from '../api';

const Navbar = ({ userRole, userName, setAuthState }) => {
  const navigate = useNavigate();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const navigationItems = [
    { name: 'Home', icon: Home, path: '/', show: true },
    { name: 'Dashboard', icon: BarChart3, path: '/dashboard', show: true },
    { name: 'Admin', icon: Users, path: '/admin', show: userRole === 'admin' }
  ];

  // Load user profile on component mount
  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      const response = await getUserProfile();
      if (response.success) {
        setUserProfile(response.user);
      }
    } catch (err) {
      console.error('Error loading user profile:', err);
    }
  };

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      logoutUser(); // Clear token from localStorage
      setAuthState(false); // Update authentication state in App component
      setUserProfile(null); // Clear user profile data
      setIsProfileOpen(false); // Close profile dropdown
      navigate('/');
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.nav 
      className="w-64 h-screen bg-glass-light backdrop-blur-md border-r border-white/10 fixed left-0 top-0 z-50"
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="p-6 border-b border-white/10">
          <motion.div 
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => navigate('/')}
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.2 }}
          >
            <div className="w-10 h-10 bg-gradient-to-r from-gray-custom to-white rounded-xl flex items-center justify-center">
              <FileSpreadsheet className="w-6 h-6 text-steel-custom" />
            </div>
            <div>
              <div className="text-lg font-bold gradient-text">ExcelAnalyzer</div>
              <div className="text-xs text-white/60">Analytics Platform</div>
            </div>
          </motion.div>
        </div>

        {/* Navigation */}
        <div className="flex-1 p-4">
          <div className="space-y-2">
            {navigationItems.filter(item => item.show).map((item, index) => (
              <motion.div
                key={index}
                className="sidebar-item"
                onClick={() => navigate(item.path)}
                whileHover={{ x: 5 }}
                transition={{ duration: 0.2 }}
              >
                <item.icon className="w-5 h-5 text-white/70" />
                <span className="text-white/90 font-medium">{item.name}</span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Bottom Section */}
        <div className="p-4 border-t border-white/10 space-y-4">
          {/* Profile Section */}
          <div className="relative">
            <motion.button
              className="sidebar-item w-full justify-between"
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-gray-custom to-white rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-steel-custom" />
                </div>
                <div className="text-left">
                  <div className="text-white/90 font-medium text-sm">
                    {userProfile ? (userProfile.name || userProfile.username) : userName}
                  </div>
                  <div className="text-white/60 text-xs capitalize">{userRole}</div>
                </div>
              </div>
              <ChevronDown className={`w-4 h-4 text-white/70 transition-transform duration-200 ${
                isProfileOpen ? 'rotate-180' : ''
              }`} />
            </motion.button>

            {/* Profile Dropdown */}
            {isProfileOpen && (
              <motion.div
                className="absolute bottom-full left-0 right-0 mb-2 glass-card p-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.2 }}
              >
                <button 
                  className="sidebar-item w-full text-sm text-red-400 hover:text-red-300"
                  onClick={handleLogout}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <LogOut className="w-4 h-4" />
                  )}
                  <span>{isLoading ? 'Logging out...' : 'Logout'}</span>
                </button>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar; 