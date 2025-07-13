import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, 
  Upload, 
  BarChart3, 
  Brain, 
  ArrowRight,
  TrendingUp,
  FileSpreadsheet,
  Zap
} from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Shield,
      title: 'Secure Login',
      description: 'Enterprise-grade security with JWT authentication'
    },
    {
      icon: Upload,
      title: 'Excel Upload',
      description: 'Drag & drop interface for seamless file uploads'
    },
    {
      icon: BarChart3,
      title: 'Custom Charts',
      description: 'Multiple chart types with real-time visualization'
    },
    {
      icon: Brain,
      title: 'AI Insights',
      description: 'Intelligent data analysis and recommendations'
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5
      }
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-steel-custom via-steel-custom to-gray-custom/20" />
      
      {/* Floating elements */}
      <div className="absolute top-20 left-20 w-72 h-72 bg-gray-custom/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
      
      {/* Navigation */}
      <nav className="relative z-10 flex justify-between items-center px-8 py-6">
        <motion.div 
          className="flex items-center gap-2"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="w-8 h-8 bg-gradient-to-r from-gray-custom to-white rounded-lg flex items-center justify-center">
            <FileSpreadsheet className="w-5 h-5 text-steel-custom" />
          </div>
          <span className="text-xl font-bold gradient-text">ExcelAnalyzer</span>
        </motion.div>
        
        <motion.div 
          className="flex gap-4"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <button 
            onClick={() => navigate('/login')}
            className="btn-secondary"
          >
            Login
          </button>
          <button 
            onClick={() => navigate('/signup')}
            className="btn-primary"
          >
            Sign Up
          </button>
        </motion.div>
      </nav>

      {/* Hero Section */}
      <motion.div 
        className="relative z-10 flex flex-col items-center justify-center min-h-[80vh] px-8 text-center"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.h1 
          className="text-6xl md:text-7xl font-bold mb-6 gradient-text"
          variants={itemVariants}
        >
          Upload. Visualize. Analyze.
        </motion.h1>
        
        <motion.p 
          className="text-xl md:text-2xl text-white/80 mb-12 max-w-3xl leading-relaxed"
          variants={itemVariants}
        >
          Transform your Excel data into powerful insights with our advanced analytics platform. 
          Secure, fast, and intelligent data visualization for modern businesses.
        </motion.p>

        <motion.div 
          className="flex flex-col sm:flex-row gap-4 mb-16"
          variants={itemVariants}
        >
          <button 
            onClick={() => navigate('/signup')}
            className="btn-primary text-lg px-8 py-4 flex items-center gap-2"
          >
            Get Started
            <ArrowRight className="w-5 h-5" />
          </button>
          <button className="btn-secondary text-lg px-8 py-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            View Demo
          </button>
        </motion.div>
      </motion.div>

      {/* Features Section */}
      <motion.div 
        className="relative z-10 px-8 pb-20"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.h2 
          className="text-4xl font-bold text-center mb-16 gradient-text"
          variants={itemVariants}
        >
          Powerful Features
        </motion.h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              className="glass-card p-8 text-center hover:transform hover:scale-105 transition-all duration-300"
              variants={itemVariants}
              whileHover={{ y: -10 }}
            >
              <div className="w-16 h-16 bg-gradient-to-r from-gray-custom to-white/80 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <feature.icon className="w-8 h-8 text-steel-custom" />
              </div>
              <h3 className="text-xl font-semibold mb-4 text-white">{feature.title}</h3>
              <p className="text-white/70 leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Stats Section */}
      <motion.div 
        className="relative z-10 px-8 pb-20"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.5 }}
      >
        <div className="glass-card p-12 max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold gradient-text mb-2">10K+</div>
              <div className="text-white/70">Files Analyzed</div>
            </div>
            <div>
              <div className="text-4xl font-bold gradient-text mb-2">50+</div>
              <div className="text-white/70">Chart Types</div>
            </div>
            <div>
              <div className="text-4xl font-bold gradient-text mb-2">99.9%</div>
              <div className="text-white/70">Uptime</div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default LandingPage; 