import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiMenu, FiX, FiSearch, FiSettings, FiBell, FiMessageSquare, FiUsers, FiCode } from 'react-icons/fi';

interface DashboardLayoutProps {
  children: ReactNode;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export const DashboardLayout = ({ children, sidebarOpen, onToggleSidebar }: DashboardLayoutProps) => {
  return (
    <div className="flex h-screen bg-gray-50 text-gray-800 overflow-hidden">
      {/* Sidebar */}
      <motion.div 
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-white shadow-lg transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                   md:relative md:translate-x-0 transition-transform duration-200 ease-in-out`}
        initial={false}
        animate={{ x: sidebarOpen ? 0 : -256 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-md bg-indigo-600 flex items-center justify-center text-white font-bold">
                CE
              </div>
              <span className="ml-2 text-lg font-semibold">CodeCollab</span>
            </div>
            <button 
              onClick={onToggleSidebar}
              className="md:hidden p-1 rounded-md hover:bg-gray-100"
            >
              <FiX className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          {/* Sidebar Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-1">
            <div className="space-y-1">
              <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Workspace
              </h3>
              <button className="w-full flex items-center px-3 py-2 text-sm font-medium rounded-md bg-indigo-50 text-indigo-700">
                <FiCode className="mr-3 h-5 w-5" />
                My Projects
              </button>
              <button className="w-full flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-100">
                <FiUsers className="mr-3 h-5 w-5" />
                Team Projects
              </button>
            </div>

            <div className="pt-4">
              <div className="px-3 flex items-center justify-between mb-2">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Recent Files
                </h3>
                <button className="text-xs text-indigo-600 hover:text-indigo-800">
                  View All
                </button>
              </div>
              <div className="space-y-1">
                {['index.js', 'styles.css', 'package.json', 'README.md'].map((file) => (
                  <button
                    key={file}
                    className="w-full flex items-center px-3 py-2 text-sm rounded-md text-gray-700 hover:bg-gray-100 text-left"
                  >
                    <span className="truncate">{file}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar Footer */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center">
              <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-medium">
                U
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium">User Name</p>
                <p className="text-xs text-gray-500">user@example.com</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navigation */}
        <header className="bg-white shadow-sm z-10">
          <div className="flex items-center justify-between h-16 px-4">
            <div className="flex items-center">
              <button 
                onClick={onToggleSidebar}
                className="mr-2 p-1 rounded-md text-gray-500 hover:bg-gray-100 md:hidden"
              >
                <FiMenu className="h-6 w-6" />
              </button>
              <div className="relative max-w-md w-full">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiSearch className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search files, projects..."
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button className="p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                <FiMessageSquare className="h-6 w-6" />
              </button>
              <button className="p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                <FiBell className="h-6 w-6" />
              </button>
              <button className="p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                <FiSettings className="h-6 w-6" />
              </button>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto bg-white p-6">
          {children}
        </main>

        {/* Status Bar */}
        <footer className="bg-gray-800 text-gray-300 px-4 py-2 text-xs flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span>main</span>
            <span>UTF-8</span>
            <span>Spaces: 2</span>
          </div>
          <div className="flex items-center space-x-4">
            <span>Ln 1, Col 1</span>
            <span>JavaScript</span>
            <div className="flex -space-x-1">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-5 w-5 rounded-full bg-indigo-500 border-2 border-gray-800"></div>
              ))}
              <div className="h-5 w-5 rounded-full bg-gray-600 border-2 border-gray-800 flex items-center justify-center text-xs">+2</div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};
