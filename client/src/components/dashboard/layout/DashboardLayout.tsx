import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { FiMenu, FiX, FiBell, FiSettings, FiSearch, FiPlus, FiMessageSquare } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './DashboardLayout.module.css';

interface DashboardLayoutProps {
  children?: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [notificationsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const toggleMobileSidebar = () => setMobileSidebarOpen(!mobileSidebarOpen);

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
          <button className={styles.iconButton}>
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
          >
            {sidebarOpen ? '«' : '»'}
          </button>
        </div>

        <nav className={styles.sidebarNav}>
          <div className={styles.navSection}>
            <h3 className={styles.navSectionTitle}>Workspace</h3>
            <NavItem icon={<FiPlus />} text="New Project" active={true} />
            <NavItem icon={<FiMessageSquare />} text="Team Chat" />
            <NavItem icon={<FiSettings />} text="Settings" />
          </div>

          <div className={styles.navSection}>
            <h3 className={styles.navSectionTitle}>Recent Projects</h3>
            <NavItem text="E-commerce Platform" />
            <NavItem text="Task Manager" />
            <NavItem text="Design System" />
          </div>
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.userProfile}>
            <div className={styles.avatar}>JD</div>
            {sidebarOpen && (
              <div className={styles.userInfo}>
                <div className={styles.userName}>John Doe</div>
                <div className={styles.userEmail}>john@example.com</div>
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
              type="text" 
              placeholder="Search files, projects, or commands..."
              className={styles.searchInput}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              data-focused={searchFocused}
            />
            <div className={styles.searchShortcut}>⌘K</div>
          </div>

          <div className={styles.actions}>
            <button className={`${styles.iconButton} ${notificationsOpen ? styles.active : ''}`}>
              <FiBell size={20} />
              <span className={styles.badge}>3</span>
            </button>
            
            <div className={styles.userMenu}>
              <button 
                className={styles.userButton}
                onClick={() => setUserMenuOpen(!userMenuOpen)}
              >
                <div className={styles.avatar}>JD</div>
                <span>John Doe</span>
              </button>
              
              {userMenuOpen && (
                <div className={styles.userDropdown}>
                  <div className={styles.dropdownHeader}>
                    <div className={styles.avatar}>JD</div>
                    <div>
                      <div className={styles.userName}>John Doe</div>
                      <div className={styles.userEmail}>john@example.com</div>
                    </div>
                  </div>
                  <div className={styles.dropdownDivider}></div>
                  <a href="#" className={styles.dropdownItem}>Your Profile</a>
                  <a href="#" className={styles.dropdownItem}>Settings</a>
                  <a href="#" className={styles.dropdownItem}>Help & Support</a>
                  <div className={styles.dropdownDivider}></div>
                  <a href="#" className={styles.dropdownItem}>Sign out</a>
                </div>
              )}
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
}

// NavItem component is used in the JSX but marked as unused by TypeScript
// This is a false positive, so we'll keep it as is
