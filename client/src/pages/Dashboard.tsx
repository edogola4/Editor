import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import AuthenticatedLayout from '../layouts/AuthenticatedLayout';
import { 
  FiUser, FiSettings, FiLogOut, FiActivity, 
  FiUsers, FiSearch, FiStar, FiTrash2, FiPlus, FiUpload 
} from 'react-icons/fi';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Type definitions
interface Project {
  id: number;
  name: string;
  type: string;
  lastModified: string;
  collaborators: any[];
}

interface Activity {
  id: number;
  action: string;
  type: string;
  name: string;
  time: string;
  user: string;
}

interface File {
  id: number;
  name: string;
  type: string;
  size: string;
  modified: string;
}

interface StatItem {
  name: string;
  value: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: React.ReactNode;
  color: string;
  action: () => void;
  unit?: string;
}

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      when: "beforeChildren",
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3
    }
  }
};

// Project Card Component
const ProjectCard = ({ project }: { project: Project }) => (
  <motion.div 
    variants={itemVariants}
    className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden border border-gray-100"
  >
    <div className="p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">{project.name}</h3>
        <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
          {project.type}
        </span>
      </div>
      <p className="mt-2 text-sm text-gray-500">
        Last modified: {project.lastModified}
      </p>
      <div className="mt-3 flex items-center justify-between">
        <div className="flex -space-x-2">
          {project.collaborators.map((_, idx) => (
            <div key={idx} className="h-8 w-8 rounded-full bg-gray-200 border-2 border-white"></div>
          ))}
        </div>
      </div>
    </div>
  </motion.div>
);

const Dashboard = () => {
  const { user, logout } = useAuthStore();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      toast.error('Failed to log out. Please try again.');
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Sample stats data
  const stats = [
    {
      name: 'Active Projects',
      value: '12',
      change: '+2',
      changeType: 'positive' as const,
      icon: <FiActivity className="h-6 w-6 text-white" />,
      color: 'bg-indigo-500',
      action: () => navigate('/projects')
    },
    {
      name: 'Team Members',
      value: '8',
      change: '+1',
      changeType: 'positive' as const,
      icon: <FiUsers className="h-6 w-6 text-white" />,
      color: 'bg-green-500',
      action: () => navigate('/team')
    },
    {
      name: 'Storage Used',
      value: '2.4',
      change: '+0.5',
      changeType: 'neutral' as const,
      unit: 'GB',
      icon: <FiActivity className="h-6 w-6 text-white" />,
      color: 'bg-purple-500',
      action: () => navigate('/settings/storage')
    },
  ];

  return (
    <AuthenticatedLayout>
      <motion.div 
        className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <div className="max-w-7xl mx-auto">
          {/* Welcome Section with Search */}
          <motion.div variants={itemVariants} className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Welcome back, {user?.username}!</h1>
              <p className="mt-1 text-gray-600">Here's what's happening with your projects today.</p>
            </div>
            <div className="relative w-full md:w-auto">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiSearch className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm"
                placeholder="Search projects, files..."
              />
            </div>
          </motion.div>

          {/* Stats Grid */}
          <motion.div 
            variants={itemVariants}
            className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 mb-8"
          >
            {stats.map((stat, index) => (
              <motion.div 
                key={index}
                className="bg-white overflow-hidden shadow rounded-xl hover:shadow-lg transition-all duration-300 cursor-pointer"
                whileHover={{ y: -5 }}
                onClick={stat.action}
              >
                <div className="p-5">
                  <div className="flex items-center">
                    <div className={`p-3 rounded-lg ${stat.color}`}>
                      {stat.icon}
                    </div>
                    <div className="ml-5">
                      <p className="text-sm font-medium text-gray-500">{stat.name}</p>
                      <div className="flex items-baseline">
                        <p className="text-2xl font-semibold text-gray-900">
                          {stat.value} {stat.unit}
                        </p>
                        {stat.change && (
                          <span className="ml-2 text-sm font-medium text-green-600">
                            {stat.change}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Projects */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-100">
                  <h3 className="text-lg font-medium text-gray-900">Recent Projects</h3>
                  <p className="mt-1 text-sm text-gray-500">Your most recently updated workspaces</p>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                      <ProjectCard 
                        key={i}
                        project={{
                          id: i,
                          name: `Project ${i}`,
                          type: i % 2 === 0 ? 'Design' : 'Development',
                          lastModified: new Date().toLocaleDateString(),
                          collaborators: Array(3).fill({})
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Profile & Quick Actions */}
            <div className="space-y-6">
              {/* User Profile Card */}
              <motion.div 
                variants={itemVariants}
                className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
              >
                <div className="p-6 text-center">
                  <div className="h-20 w-20 rounded-full bg-gray-200 mx-auto mb-4 overflow-hidden">
                    <FiUser className="h-full w-full text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900">{user?.username || 'User'}</h3>
                  <p className="text-sm text-gray-500">{user?.email || 'user@example.com'}</p>
                  
                  <div className="mt-6 pt-6 border-t border-gray-100">
                    <button
                      onClick={handleLogout}
                      disabled={isLoggingOut}
                      className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <FiLogOut className="mr-2 h-4 w-4" />
                      {isLoggingOut ? 'Signing out...' : 'Sign out'}
                    </button>
                  </div>
                </div>
              </motion.div>

              {/* Quick Actions */}
              <motion.div 
                variants={itemVariants}
                className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
              >
                <div className="px-6 py-5 border-b border-gray-100">
                  <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
                  <p className="mt-1 text-sm text-gray-500">Frequently used actions</p>
                </div>
                <div className="p-4">
                  <button className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors">
                    <span className="text-sm font-medium text-gray-900">New Project</span>
                    <FiPlus className="h-5 w-5 text-gray-400" />
                  </button>
                  <button className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors">
                    <span className="text-sm font-medium text-gray-900">Upload Files</span>
                    <FiUpload className="h-5 w-5 text-gray-400" />
                  </button>
                  <button className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors">
                    <span className="text-sm font-medium text-gray-900">Invite Team</span>
                    <FiUser className="h-5 w-5 text-gray-400" />
                  </button>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Help Section */}
          <motion.div 
            variants={itemVariants}
            className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-8 text-center mt-8"
          >
            <h3 className="text-xl font-bold text-white">Need help getting started?</h3>
            <p className="mt-2 text-blue-100 max-w-2xl mx-auto">
              Check out our documentation or contact our support team for assistance with any questions.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => window.open('https://docs.your-app.com', '_blank')}
                className="px-6 py-3 bg-white text-blue-700 font-medium rounded-lg hover:bg-blue-50 transition-colors"
              >
                View Documentation
              </button>
              <button
                onClick={() => navigate('/support')}
                className="px-6 py-3 border-2 border-white text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                Contact Support
              </button>
            </div>
          </motion.div>

          {/* Footer */}
          <motion.div 
            variants={itemVariants}
            className="flex flex-wrap gap-4 justify-between items-center mt-8 pt-6 border-t border-gray-200"
          >
            <p className="text-sm text-gray-500">
              Last login: {new Date().toLocaleString()}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => navigate('/settings')}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Settings
              </button>
              <button
                onClick={() => window.open('https://status.your-app.com', '_blank')}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Status
              </button>
              <button
                onClick={() => window.open('https://docs.your-app.com', '_blank')}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Help
              </button>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </AuthenticatedLayout>
  );
};

export default Dashboard;
