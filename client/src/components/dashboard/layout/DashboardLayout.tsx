import { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuthStore } from '../../../store/authStore';
import { 
  FiMenu, 
  FiX, 
  FiBell, 
  FiSettings, 
  FiSearch, 
  FiPlus, 
  FiMessageSquare, 
  FiFolder,
  FiFile,
  FiGitBranch,
  FiUsers,
  FiClock,
  FiStar,
  FiCode,
  FiTerminal,
  FiGlobe,
  FiChevronDown,
  FiChevronRight,
  FiUser,
  FiLogOut
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { ErrorBoundary } from '../../common/ErrorBoundary';
import { LoadingSpinner } from '../../common/LoadingSpinner';
import { toast } from 'react-toastify';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import styles from './DashboardLayout.module.css';

interface DashboardLayoutProps {
  children?: React.ReactNode;
}

interface Project {
  id: string;
  name: string;
  type: 'web' | 'mobile' | 'desktop' | 'library';
  lastModified: string;
  collaborators: number;
  isPrivate: boolean;
  status: 'active' | 'archived' | 'shared';
}

interface Collaborator {
  id: string;
  name: string;
  avatar: string;
  status: 'online' | 'away' | 'offline';
  isTyping?: boolean;
  currentFile?: string;
}

// Memoized sidebar item component to prevent unnecessary re-renders
const SidebarItem = memo(({ 
  icon: Icon, 
  text, 
  to, 
  isActive,
  badge 
}: { 
  icon: React.ElementType; 
  text: string; 
  to: string; 
  isActive: boolean;
  badge?: number;
}) => (
  <Link 
    to={to}
    className={`flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${
      isActive 
        ? 'bg-gray-100 text-gray-900' 
        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
    }`}
  >
    <Icon className="mr-3 h-5 w-5 flex-shrink-0" />
    <span className="truncate">{text}</span>
    {badge && (
      <span className="ml-auto inline-flex items-center justify-center px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
        {badge}
      </span>
    )}
  </Link>
));

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const queryClient = useQueryClient();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [activeView, setActiveView] = useState<'projects' | 'recent' | 'shared' | 'templates'>('projects');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    workspace: true,
    projects: true,
    collaborators: true
  });

  const searchInputRef = useRef<HTMLInputElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Mock data - replace with actual data from your store
  const recentProjects: Project[] = [
    {
      id: '1',
      name: 'E-commerce Platform',
      type: 'web',
      lastModified: '2 hours ago',
      collaborators: 3,
      isPrivate: false,
      status: 'active'
    },
    {
      id: '2',
      name: 'Task Manager',
      type: 'web',
      lastModified: '1 day ago',
      collaborators: 1,
      isPrivate: true,
      status: 'active'
    },
    {
      id: '3',
      name: 'Design System',
      type: 'library',
      lastModified: '3 days ago',
      collaborators: 5,
      isPrivate: false,
      status: 'shared'
    }
  ];

  const collaborators: Collaborator[] = [
    {
      id: '1',
      name: 'Bran Don',
      avatar: 'SC',
      status: 'online',
      isTyping: true,
      currentFile: 'components/Header.tsx'
    },
    {
      id: '2',
      name: 'Bran Don',
      avatar: 'MJ',
      status: 'away',
      currentFile: 'styles/main.css'
    },
    {
      id: '3',
      name: 'Bran Don',
      avatar: 'ER',
      status: 'online',
      currentFile: 'utils/helpers.js'
    }
  ];

  const notifications = [
    {
      id: '1',
      type: 'mention',
      message: 'Bran Don mentioned you in E-commerce Platform',
      time: '2 min ago',
      unread: true
    },
    {
      id: '2',
      type: 'collaboration',
      message: 'Bran Don joined Task Manager',
      time: '1 hour ago',
      unread: true
    },
    {
      id: '3',
      type: 'comment',
      message: 'New comment on Header component',
      time: '3 hours ago',
      unread: false
    }
  ];

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyboard = (e: KeyboardEvent) => {
      // Command/Ctrl + K for search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      
      // Command/Ctrl + B for sidebar toggle
      if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
        e.preventDefault();
        setSidebarOpen(!sidebarOpen);
      }

      // Escape to close dropdowns
      if (e.key === 'Escape') {
        setNotificationsOpen(false);
        setUserMenuOpen(false);
        setSearchFocused(false);
      }
    };

    document.addEventListener('keydown', handleKeyboard);
    return () => document.removeEventListener('keydown', handleKeyboard);
  }, [sidebarOpen]);

  // Click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Toggle sidebar
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  // Handle logout with loading state and toast notification
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  const handleLogout = useCallback(async () => {
    try {
      setIsLoggingOut(true);
      await logout();
      // Invalidate all queries to clear the cache
      await queryClient.invalidateQueries();
      navigate('/login');
      toast.success('Successfully logged out');
    } catch (error) {
      console.error('Logout failed:', error);
      toast.error('Failed to log out. Please try again.');
    } finally {
      setIsLoggingOut(false);
    }
  }, [logout, navigate, queryClient]);
  
  // Memoize the user menu to prevent unnecessary re-renders
  const userMenu = useMemo(() => (
    <div className="py-1">
      <Link
        to="/profile"
        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
      >
        Your Profile
      </Link>
      <Link
        to="/settings"
        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
      >
        Settings
      </Link>
      <button
        onClick={handleLogout}
        disabled={isLoggingOut}
        className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50 flex items-center"
      >
        {isLoggingOut ? (
          <>
            <LoadingSpinner size="sm" className="mr-2" />
            Signing out...
          </>
        ) : (
          'Sign out'
        )}
      </button>
    </div>
  ), [handleLogout, isLoggingOut]);

  const toggleMobileSidebar = () => setMobileSidebarOpen(!mobileSidebarOpen);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const getProjectIcon = (type: Project['type']) => {
    switch (type) {
      case 'web': return <FiGlobe size={16} />;
      case 'mobile': return <FiCode size={16} />;
      case 'desktop': return <FiTerminal size={16} />;
      case 'library': return <FiFolder size={16} />;
      default: return <FiFile size={16} />;
    }
  };

  const getStatusColor = (status: Collaborator['status']) => {
    switch (status) {
      case 'online': return '#10b981';
      case 'away': return '#f59e0b';
      case 'offline': return '#6b7280';
      default: return '#6b7280';
    }
  };

  return (
    <div className={styles.dashboardContainer}>
      {/* Mobile header */}
      <header className={styles.mobileHeader}>
        <button 
          onClick={toggleMobileSidebar}
          className={styles.mobileMenuButton}
          aria-label="Toggle menu"
        >
          {mobileSidebarOpen ? <FiX size={24} /> : <FiMenu size={24} />}
        </button>
        <div className={styles.logo}>CodeCollab</div>
        <div className={styles.mobileActions}>
          <button className={styles.iconButton} onClick={() => searchInputRef.current?.focus()}>
            <FiSearch size={20} />
          </button>
        </div>
      </header>

      {/* Desktop sidebar */}
      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : styles.sidebarCollapsed}`}>
        <div className={styles.sidebarHeader}>
          <div className={styles.logo}>
            <span className={styles.logoIcon}>CC</span>
            {sidebarOpen && <span>CodeCollab</span>}
          </div>
          <button 
            onClick={toggleSidebar}
            className={styles.sidebarToggle}
            aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            title={sidebarOpen ? 'Collapse sidebar (⌘B)' : 'Expand sidebar (⌘B)'}
          >
            {sidebarOpen ? '«' : '»'}
          </button>
        </div>

        <nav className={styles.sidebarNav}>
          {/* Workspace Section */}
          <div className={styles.navSection}>
            <button 
              className={styles.navSectionHeader}
              onClick={() => toggleSection('workspace')}
            >
              <h3 className={styles.navSectionTitle}>
                {expandedSections.workspace ? <FiChevronDown size={14} /> : <FiChevronRight size={14} />}
                Workspace
              </h3>
            </button>
            
            <AnimatePresence>
              {expandedSections.workspace && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className={styles.navItems}
                >
                  <NavItem 
                    icon={<FiPlus />} 
                    text="New Project" 
                    active={true} 
                    collapsed={!sidebarOpen}
                    onClick={() => navigate('/new-project')}
                  />
                  <NavItem 
                    icon={<FiMessageSquare />} 
                    text="Team Chat" 
                    collapsed={!sidebarOpen}
                    badge={5}
                    onClick={() => navigate('/chat')}
                  />
                  <NavItem 
                    icon={<FiGitBranch />} 
                    text="Repositories" 
                    collapsed={!sidebarOpen}
                    onClick={() => navigate('/repositories')}
                  />
                  <NavItem 
                    icon={<FiSettings />} 
                    text="Settings" 
                    collapsed={!sidebarOpen}
                    onClick={() => navigate('/settings')}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Recent Projects Section */}
          <div className={styles.navSection}>
            <button 
              className={styles.navSectionHeader}
              onClick={() => toggleSection('projects')}
            >
              <h3 className={styles.navSectionTitle}>
                {expandedSections.projects ? <FiChevronDown size={14} /> : <FiChevronRight size={14} />}
                Recent Projects
              </h3>
            </button>
            
            <AnimatePresence>
              {expandedSections.projects && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className={styles.navItems}
                >
                  {recentProjects.map((project) => (
                    <NavItem
                      key={project.id}
                      icon={getProjectIcon(project.type)}
                      text={project.name}
                      collapsed={!sidebarOpen}
                      subtitle={sidebarOpen ? project.lastModified : undefined}
                      badge={project.collaborators > 1 ? project.collaborators : undefined}
                      onClick={() => navigate(`/project/${project.id}`)}
                      rightIcon={project.isPrivate ? '🔒' : undefined}
                    />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Collaborators Section */}
          <div className={styles.navSection}>
            <button 
              className={styles.navSectionHeader}
              onClick={() => toggleSection('collaborators')}
            >
              <h3 className={styles.navSectionTitle}>
                {expandedSections.collaborators ? <FiChevronDown size={14} /> : <FiChevronRight size={14} />}
                Team ({collaborators.filter(c => c.status === 'online').length} online)
              </h3>
            </button>
            
            <AnimatePresence>
              {expandedSections.collaborators && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className={styles.navItems}
                >
                  {collaborators.map((collaborator) => (
                    <div key={collaborator.id} className={styles.collaboratorItem}>
                      <div className={styles.collaboratorAvatar}>
                        <span>{collaborator.avatar}</span>
                        <div 
                          className={styles.statusIndicator}
                          style={{ backgroundColor: getStatusColor(collaborator.status) }}
                        />
                      </div>
                      {sidebarOpen && (
                        <div className={styles.collaboratorInfo}>
                          <div className={styles.collaboratorName}>
                            {collaborator.name}
                            {collaborator.isTyping && (
                              <span className={styles.typingIndicator}>typing...</span>
                            )}
                          </div>
                          {collaborator.currentFile && (
                            <div className={styles.collaboratorFile}>
                              {collaborator.currentFile}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.userProfile}>
            <div className={styles.avatar}>
              {user?.username?.charAt(0).toUpperCase() || 'U'}
            </div>
            {sidebarOpen && user && (
              <div className={styles.userInfo}>
                <div className={styles.userName}>{user.username}</div>
                <div className={styles.userEmail}>{user.email}</div>
                <div className={styles.userStatus}>
                  <div className={styles.statusDot} />
                  Online
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={styles.mobileOverlay}
            onClick={toggleMobileSidebar}
          />
        )}
      </AnimatePresence>

      {/* Main content */}
      <main className={styles.mainContent}>
        <header className={styles.topBar}>
          <div className={styles.searchBar}>
            <FiSearch className={styles.searchIcon} />
            <input 
              ref={searchInputRef}
              type="text" 
              placeholder="Search files, projects, or commands..."
              className={styles.searchInput}
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              data-focused={searchFocused}
            />
            <div className={styles.searchShortcut}>⌘K</div>
            
            {/* Search suggestions */}
            <AnimatePresence>
              {searchFocused && searchValue && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={styles.searchSuggestions}
                >
                  <div className={styles.suggestionCategory}>
                    <h4>Files</h4>
                    <div className={styles.suggestionItem}>
                      <FiFile size={16} />
                      <span>Header.tsx</span>
                    </div>
                  </div>
                  <div className={styles.suggestionCategory}>
                    <h4>Projects</h4>
                    <div className={styles.suggestionItem}>
                      <FiFolder size={16} />
                      <span>E-commerce Platform</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className={styles.actions}>
            {/* Notifications */}
            <div className={styles.notificationContainer} ref={notificationsRef}>
              <button 
                className={`${styles.iconButton} ${notificationsOpen ? styles.active : ''}`}
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                title="Notifications"
              >
                <FiBell size={20} />
                {notifications.filter(n => n.unread).length > 0 && (
                  <span className={styles.badge}>
                    {notifications.filter(n => n.unread).length}
                  </span>
                )}
              </button>
              
              <AnimatePresence>
                {notificationsOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={styles.notificationsDropdown}
                  >
                    <div className={styles.dropdownHeader}>
                      <h3>Notifications</h3>
                      <button className={styles.markAllRead}>Mark all read</button>
                    </div>
                    <div className={styles.notificationsList}>
                      {notifications.map((notification) => (
                        <div 
                          key={notification.id}
                          className={`${styles.notificationItem} ${notification.unread ? styles.unread : ''}`}
                        >
                          <div className={styles.notificationContent}>
                            <p>{notification.message}</p>
                            <span className={styles.notificationTime}>{notification.time}</span>
                          </div>
                          {notification.unread && <div className={styles.unreadDot} />}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            {/* User Menu */}
            <div className={styles.userMenu} ref={userMenuRef}>
              <button 
                className={styles.userButton}
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                aria-label="User menu"
              >
                <div className={styles.avatar}>
                  {user?.username?.charAt(0).toUpperCase() || 'U'}
                </div>
                <span>{user?.username || 'User'}</span>
                <FiChevronDown size={16} className={userMenuOpen ? styles.rotated : ''} />
              </button>
              
              <AnimatePresence>
                {userMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={styles.userDropdown}
                  >
                    <div className={styles.dropdownHeader}>
                      <div className={styles.avatar}>
                        {user?.username?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div>
                        <div className={styles.userName}>{user?.username || 'User'}</div>
                        <div className={styles.userEmail}>{user?.email || ''}</div>
                      </div>
                    </div>
                    <div className={styles.dropdownDivider}></div>
                    <button 
                      className={styles.dropdownItem}
                      onClick={() => {
                        setUserMenuOpen(false);
                        navigate('/profile');
                      }}
                    >
                      <FiUsers size={16} />
                      Your Profile
                    </button>
                    <button 
                      className={styles.dropdownItem}
                      onClick={() => {
                        setUserMenuOpen(false);
                        navigate('/settings');
                      }}
                    >
                      <FiSettings size={16} />
                      Settings
                    </button>
                    <button 
                      className={styles.dropdownItem}
                      onClick={() => {
                        setUserMenuOpen(false);
                        navigate('/starred');
                      }}
                    >
                      <FiStar size={16} />
                      Starred Projects
                    </button>
                    <div className={styles.dropdownDivider}></div>
                    <button 
                      className={styles.dropdownItem}
                      onClick={handleLogout}
                    >
                      Sign out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        <div className={styles.contentWrapper}>
          {children || <Outlet />}
        </div>
      </main>
    </div>
  );
};

interface NavItemProps {
  icon?: React.ReactNode;
  text: string;
  active?: boolean;
  collapsed?: boolean;
  subtitle?: string;
  badge?: number;
  rightIcon?: string;
  onClick?: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ 
  icon, 
  text, 
  active = false, 
  collapsed = false,
  subtitle,
  badge,
  rightIcon,
  onClick 
}) => {
  return (
    <button
      onClick={onClick}
      className={`${styles.navItem} ${active ? styles.active : ''}`}
      title={collapsed ? text : undefined}
    >
      {icon && <span className={styles.navIcon}>{icon}</span>}
      {!collapsed && (
        <>
          <div className={styles.navContent}>
            <span className={styles.navText}>{text}</span>
            {subtitle && <span className={styles.navSubtitle}>{subtitle}</span>}
          </div>
          <div className={styles.navActions}>
            {badge && <span className={styles.navBadge}>{badge}</span>}
            {rightIcon && <span className={styles.navRightIcon}>{rightIcon}</span>}
          </div>
        </>
      )}
    </button>
  );
};

// Memoize the main component to prevent unnecessary re-renders
export default memo(DashboardLayout);