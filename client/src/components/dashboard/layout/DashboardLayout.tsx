import { useState, useEffect, useRef } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
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
  FiChevronRight
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
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

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
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

  const navigate = useNavigate();
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

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
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
            <div className={styles.avatar}>JD</div>
            {sidebarOpen && (
              <div className={styles.userInfo}>
                <div className={styles.userName}>John Doe</div>
                <div className={styles.userEmail}>john@example.com</div>
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
              >
                <div className={styles.avatar}>JD</div>
                <span>John Doe</span>
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
                      <div className={styles.avatar}>JD</div>
                      <div>
                        <div className={styles.userName}>John Doe</div>
                        <div className={styles.userEmail}>john@example.com</div>
                      </div>
                    </div>
                    <div className={styles.dropdownDivider}></div>
                    <a href="#" className={styles.dropdownItem}>
                      <FiUsers size={16} />
                      Your Profile
                    </a>
                    <a href="#" className={styles.dropdownItem}>
                      <FiSettings size={16} />
                      Settings
                    </a>
                    <a href="#" className={styles.dropdownItem}>
                      <FiStar size={16} />
                      Starred Projects
                    </a>
                    <div className={styles.dropdownDivider}></div>
                    <a href="#" className={styles.dropdownItem}>Sign out</a>
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

export default DashboardLayout;