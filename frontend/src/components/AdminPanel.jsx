import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { 
  Users, 
  FileSpreadsheet, 
  BarChart3, 
  TrendingUp,
  TrendingDown,
  Search,
  MoreVertical,
  UserCheck,
  UserX,
  Trash2,
  Eye,
  Calendar,
  Activity
} from 'lucide-react';
import { getAllUsers, updateUserStatus, deleteUser, getAdminStats } from '../api';

const AdminPanel = () => {
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState([]);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Load admin data on component mount
  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    setIsLoading(true);
    try {
      // Load admin statistics
      const statsResponse = await getAdminStats();
      if (statsResponse.success) {
        setStats(statsResponse.stats || []);
      }

      // Load all users
      const usersResponse = await getAllUsers();
      if (usersResponse.success) {
        setUsers(usersResponse.users || []);
      }
    } catch (err) {
      setError('Failed to load admin data');
      console.error('Admin data error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateUserStatus = async (userId, newStatus) => {
    try {
      const response = await updateUserStatus(userId, newStatus);
      if (response.success) {
        // Reload users after status update
        await loadAdminData();
      }
    } catch (err) {
      console.error('Error updating user status:', err);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        const response = await deleteUser(userId);
        if (response.success) {
          // Reload users after deletion
          await loadAdminData();
        }
      } catch (err) {
        console.error('Error deleting user:', err);
      }
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesFilter = selectedFilter === 'all' || user.role === selectedFilter || user.status === selectedFilter;
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'text-green-400 bg-green-400/10';
      case 'inactive': return 'text-yellow-400 bg-yellow-400/10';
      case 'blocked': return 'text-red-400 bg-red-400/10';
      default: return 'text-white/60 bg-white/10';
    }
  };

  const getRoleColor = (role) => {
    return role === 'admin' ? 'text-purple-400 bg-purple-400/10' : 'text-blue-400 bg-blue-400/10';
  };

  // Default stats if API doesn't return data
  const defaultStats = [
    {
      title: 'Total Users',
      value: '1,234',
      change: '+12%',
      trend: 'up',
      icon: Users,
      color: 'from-blue-500 to-cyan-500'
    },
    {
      title: 'Files Uploaded',
      value: '5,678',
      change: '+8%',
      trend: 'up',
      icon: FileSpreadsheet,
      color: 'from-green-500 to-emerald-500'
    },
    {
      title: 'Most Used Chart',
      value: 'Bar Chart',
      change: '45%',
      trend: 'up',
      icon: BarChart3,
      color: 'from-purple-500 to-pink-500'
    },
    {
      title: 'Active Sessions',
      value: '89',
      change: '-3%',
      trend: 'down',
      icon: Activity,
      color: 'from-orange-500 to-red-500'
    }
  ];

  const displayStats = stats.length > 0 ? stats : defaultStats;

  if (isLoading) {
    return (
      <div className="flex-1 ml-64 p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-gray-custom border-t-white rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white/70">Loading admin data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 ml-64 p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-8"
      >
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold gradient-text">Admin Panel</h1>
            <p className="text-white/70">Manage users and monitor platform activity</p>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <motion.div
            className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {error}
          </motion.div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {displayStats.map((stat, index) => (
            <motion.div
              key={index}
              className="glass-card p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 bg-gradient-to-r ${stat.color} rounded-xl flex items-center justify-center`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
                <div className={`flex items-center gap-1 text-sm ${
                  stat.trend === 'up' ? 'text-green-400' : 'text-red-400'
                }`}>
                  {stat.trend === 'up' ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                  {stat.change}
                </div>
              </div>
              <h3 className="text-2xl font-bold text-white mb-1">{stat.value}</h3>
              <p className="text-white/70 text-sm">{stat.title}</p>
            </motion.div>
          ))}
        </div>

        {/* Users Table Section */}
        <motion.div
          className="glass-card p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-white">User Management</h2>
            <div className="flex gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/50" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input-field pl-10 pr-4 w-64"
                />
              </div>
              
              {/* Filter */}
              <select
                value={selectedFilter}
                onChange={(e) => setSelectedFilter(e.target.value)}
                className="input-field"
              >
                <option value="all">All Users</option>
                <option value="user">Users</option>
                <option value="admin">Admins</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="blocked">Blocked</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-3 px-4 text-white/70 font-medium">User</th>
                  <th className="text-left py-3 px-4 text-white/70 font-medium">Role</th>
                  <th className="text-left py-3 px-4 text-white/70 font-medium">Status</th>
                  <th className="text-left py-3 px-4 text-white/70 font-medium">Files</th>
                  <th className="text-left py-3 px-4 text-white/70 font-medium">Last Active</th>
                  <th className="text-left py-3 px-4 text-white/70 font-medium">Joined</th>
                  <th className="text-left py-3 px-4 text-white/70 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-8 text-white/50">
                      No users found
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user, index) => (
                    <motion.tr
                      key={user._id || index}
                      className="border-b border-white/5 hover:bg-white/5 transition-colors duration-200"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-gray-custom to-white rounded-full flex items-center justify-center">
                            <span className="text-steel-custom font-semibold text-sm">
                              {user.name ? user.name.split(' ').map(n => n[0]).join('') : 'U'}
                            </span>
                          </div>
                          <div>
                            <p className="text-white font-medium">{user.name || user.username}</p>
                            <p className="text-white/60 text-sm">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(user.status)}`}>
                          {user.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-white/90">{user.filesUploaded || 0}</td>
                      <td className="py-4 px-4 text-white/70 text-sm">
                        {user.lastActive ? new Date(user.lastActive).toLocaleDateString() : 'Never'}
                      </td>
                      <td className="py-4 px-4 text-white/70 text-sm">
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <button className="p-2 text-white/60 hover:text-white transition-colors duration-200">
                            <Eye className="w-4 h-4" />
                          </button>
                          {user.status === 'active' ? (
                            <button 
                              className="p-2 text-yellow-400 hover:text-yellow-300 transition-colors duration-200"
                              onClick={() => handleUpdateUserStatus(user._id, 'inactive')}
                            >
                              <UserX className="w-4 h-4" />
                            </button>
                          ) : (
                            <button 
                              className="p-2 text-green-400 hover:text-green-300 transition-colors duration-200"
                              onClick={() => handleUpdateUserStatus(user._id, 'active')}
                            >
                              <UserCheck className="w-4 h-4" />
                            </button>
                          )}
                          <button 
                            className="p-2 text-red-400 hover:text-red-300 transition-colors duration-200"
                            onClick={() => handleDeleteUser(user._id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <button className="p-2 text-white/60 hover:text-white transition-colors duration-200">
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex justify-between items-center mt-6 pt-6 border-t border-white/10">
            <p className="text-white/60 text-sm">
              Showing {filteredUsers.length} of {users.length} users
            </p>
            <div className="flex gap-2">
              <button className="btn-secondary text-sm px-3 py-1">Previous</button>
              <button className="btn-primary text-sm px-3 py-1">1</button>
              <button className="btn-secondary text-sm px-3 py-1">2</button>
              <button className="btn-secondary text-sm px-3 py-1">3</button>
              <button className="btn-secondary text-sm px-3 py-1">Next</button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default AdminPanel; 