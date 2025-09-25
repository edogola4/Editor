import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { 
  FiCode, 
  FiFileText, 
  FiGitBranch, 
  FiGitPullRequest, 
  FiStar, 
  FiClock
} from 'react-icons/fi';
import { DashboardLayout } from '../components/dashboard/DashboardLayout';
import styles from './Dashboard.module.css';

// Type definitions

interface Project {
  id: number;
  name: string;
  description: string;
  language: string;
  lastUpdated: string;
  stars: number;
  forks: number;
  collaborators: string[];
}

interface Activity {
  id: number;
  user: string;
  action: string;
  target: string;
  time: string;
  avatar: string;
}

const Dashboard = () => {
  const { user } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Sample data
  const recentProjects: Project[] = [
    {
      id: 1,
      name: 'ecommerce-platform',
      description: 'A modern e-commerce platform with real-time inventory',
      language: 'TypeScript',
      lastUpdated: '2 hours ago',
      stars: 42,
      forks: 12,
      collaborators: ['JD', 'AS', 'MP']
    },
    {
      id: 2,
      name: 'task-manager',
      description: 'Project management tool with real-time collaboration',
      language: 'JavaScript',
      lastUpdated: '1 day ago',
      stars: 28,
      forks: 5,
      collaborators: ['JD', 'TP', 'RK']
    },
    {
      id: 3,
      name: 'design-system',
      description: 'Reusable UI components for our applications',
      language: 'TypeScript',
      lastUpdated: '3 days ago',
      stars: 15,
      forks: 3,
      collaborators: ['AS', 'MP']
    },
  ];

  const recentActivity: Activity[] = [
    {
      id: 1,
      user: 'John Doe',
      action: 'pushed to',
      target: 'main',
      time: '5 minutes ago',
      avatar: 'JD'
    },
    {
      id: 2,
      user: 'Alex Smith',
      action: 'created branch',
      target: 'feature/user-authentication',
      time: '1 hour ago',
      avatar: 'AS'
    },
    {
      id: 3,
      user: 'Maria Perez',
      action: 'opened pull request',
      target: '#42 Add dark mode support',
      time: '3 hours ago',
      avatar: 'MP'
    },
  ];

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);
    
    return () => clearTimeout(timer);
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className="text-center">
          <div className={styles.loadingSpinner}></div>
          <p className={styles.loadingText}>Loading your workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout sidebarOpen={sidebarOpen} onToggleSidebar={toggleSidebar}>
      <div className={styles.dashboardContainer}>
        {/* Welcome Header */}
        <div className={styles.welcomeHeader}>
          <h1 className={styles.welcomeTitle}>Welcome back, {user?.username || 'Developer'}</h1>
          <p className={styles.welcomeSubtitle}>Here's what's happening with your projects today.</p>
        </div>

        {/* Quick Actions */}
        <div className={styles.quickActions}>
          <button
            onClick={() => navigate('/projects/new')}
            className={`${styles.actionCard} ${styles.newProjectCard}`}
          >
            <div className={styles.actionCardContent}>
              <div className={`${styles.iconContainer} ${styles.newProjectIcon}`}>
                <FiCode className="h-6 w-6" />
              </div>
              <h3 className={styles.actionTitle}>New Project</h3>
              <p className={styles.actionDescription}>Start coding from scratch</p>
            </div>
          </button>

          <button 
            className={styles.actionCard}
            onClick={() => navigate('/clone')}
          >
            <div className={styles.actionCardContent}>
              <div className={`${styles.iconContainer} ${styles.cloneIcon}`}>
                <FiGitBranch className="h-6 w-6" />
              </div>
              <h3 className={styles.actionTitle}>Clone Repository</h3>
              <p className={styles.actionDescription}>Start from an existing repo</p>
            </div>
          </button>

          <button 
            className={styles.actionCard}
            onClick={() => document.getElementById('file-upload')?.click()}
          >
            <input type="file" id="file-upload" className="hidden" />
            <div className={styles.actionCardContent}>
              <div className={`${styles.iconContainer} ${styles.openFileIcon}`}>
                <FiFileText className="h-6 w-6" />
              </div>
              <h3 className={styles.actionTitle}>Open File</h3>
              <p className={styles.actionDescription}>Work on an existing file</p>
            </div>
          </button>

          <button 
            className={styles.actionCard}
            onClick={() => navigate('/pull-requests')}
          >
            <div className={styles.actionCardContent}>
              <div className={`${styles.iconContainer} ${styles.codeReviewIcon}`}>
                <FiGitPullRequest className="h-6 w-6" />
              </div>
              <h3 className={styles.actionTitle}>Code Review</h3>
              <p className={styles.actionDescription}>Review open pull requests</p>
            </div>
          </button>
        </div>

        {/* Recent Projects */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Recent Projects</h2>
            <button 
              onClick={() => navigate('/projects')}
              className={styles.viewAllLink}
            >
              View all projects
            </button>
          </div>

          <div className={styles.projectsGrid}>
            {recentProjects.map((project) => (
              <div 
                key={project.id} 
                className={styles.projectCard}
                onClick={() => navigate(`/projects/${project.id}`)}
              >
                <div className={styles.projectCardContent}>
                  <div className={styles.projectHeader}>
                    <div className={styles.projectIcon}>
                      <FiCode className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className={styles.projectTitle}>{project.name}</h3>
                      <p className={styles.projectDescription}>{project.description}</p>
                    </div>
                  </div>
                  <div className={styles.projectMeta}>
                    <div className={styles.metaItems}>
                      <span className={styles.metaItem}>
                        <span className={styles.languageDot}></span>
                        {project.language}
                      </span>
                      <span className={styles.dotSeparator}>•</span>
                      <span className={styles.metaItem}>
                        <FiStar className="h-4 w-4" />
                        {project.stars}
                      </span>
                      <span className={styles.dotSeparator}>•</span>
                      <span className={styles.metaItem}>
                        <FiGitBranch className="h-4 w-4" />
                        {project.forks}
                      </span>
                    </div>
                    <div className={styles.avatarGroup}>
                      {project.collaborators.map((initial, idx) => (
                        <div 
                          key={idx}
                          className={styles.avatar}
                        >
                          {initial}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className={styles.projectFooter}>
                    <div className={styles.metaItem}>
                      <FiClock className="h-4 w-4" />
                      Updated {project.lastUpdated}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Recent Activity</h2>
          <div className={styles.activityList}>
            <ul>
              {recentActivity.map((activity) => (
                <li key={activity.id} className={styles.activityItem}>
                  <div className={styles.activityAvatar}>
                    {activity.avatar}
                  </div>
                  <div className={styles.activityContent}>
                    <p className={styles.activityText}>
                      <span className={styles.activityUser}>{activity.user} </span>
                      <span className={styles.activityAction}>{activity.action} </span>
                      <span className={styles.activityTarget}>{activity.target}</span>
                    </p>
                    <p className={styles.activityTime}>
                      {activity.time}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
            <div className={styles.activityFooter}>
              <button 
                className={styles.viewAllLink}
                onClick={() => navigate('/activity')}
              >
                View all activity
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
