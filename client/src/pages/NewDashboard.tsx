import React, { useState } from 'react';
import { 
  FiCode, 
  FiGitBranch, 
  FiStar, 
  FiClock, 
  FiUsers, 
  FiGitPullRequest, 
  FiAlertCircle, 
  FiTrendingUp, 
  FiActivity,
  FiLayers,
  FiZap,
  FiMoreHorizontal,
  FiSearch,
  FiPlus,
  FiMessageSquare,
  FiSettings,
  FiBell
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './DashboardPage.module.css';

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
  unreadMessages: number;
  isPinned: boolean;
  progress: number;
}

interface Activity {
  id: number;
  user: string;
  action: string;
  target: string;
  time: string;
  avatar: string;
  project: string;
  type: 'push' | 'branch' | 'pr' | 'comment';
}

interface TeamMember {
  id: number;
  name: string;
  role: string;
  avatar: string;
  status: 'online' | 'coding' | 'away' | 'offline';
}

interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  trend: string;
  trendType: 'positive' | 'negative' | 'neutral';
}

// Sample data
const projects: Project[] = [
  {
    id: 1,
    name: 'E-commerce Platform',
    description: 'Modern e-commerce platform with real-time inventory',
    language: 'TypeScript',
    lastUpdated: '2 hours ago',
    stars: 42,
    forks: 12,
    collaborators: ['JD', 'AS', 'MP'],
    unreadMessages: 3,
    isPinned: true,
    progress: 75
  },
  {
    id: 2,
    name: 'Task Manager',
    description: 'Project management tool with real-time collaboration',
    language: 'JavaScript',
    lastUpdated: '1 day ago',
    stars: 28,
    forks: 5,
    collaborators: ['JD', 'TP', 'RK'],
    unreadMessages: 0,
    isPinned: true,
    progress: 90
  },
  {
    id: 3,
    name: 'Design System',
    description: 'Reusable UI components for our applications',
    language: 'TypeScript',
    lastUpdated: '3 days ago',
    stars: 15,
    forks: 3,
    collaborators: ['AS', 'MP'],
    unreadMessages: 1,
    isPinned: false,
    progress: 45
  },
];

const recentActivity: Activity[] = [
  {
    id: 1,
    user: 'John Doe',
    action: 'pushed to',
    target: 'main',
    time: '5 minutes ago',
    avatar: 'JD',
    project: 'E-commerce Platform',
    type: 'push'
  },
  {
    id: 2,
    user: 'Alex Smith',
    action: 'created branch',
    target: 'feature/user-authentication',
    time: '1 hour ago',
    avatar: 'AS',
    project: 'Task Manager',
    type: 'branch'
  },
  {
    id: 3,
    user: 'Maria Perez',
    action: 'opened pull request',
    target: '#42 Add dark mode support',
    time: '3 hours ago',
    avatar: 'MP',
    project: 'Design System',
    type: 'pr'
  },
];

const teamMembers: TeamMember[] = [
  { id: 1, name: 'John Doe', role: 'Frontend Lead', avatar: 'JD', status: 'online' },
  { id: 2, name: 'Alex Smith', role: 'Backend Developer', avatar: 'AS', status: 'coding' },
  { id: 3, name: 'Maria Perez', role: 'UI/UX Designer', avatar: 'MP', status: 'away' },
  { id: 4, name: 'Taylor Reed', role: 'DevOps Engineer', avatar: 'TR', status: 'offline' },
];

// Component for statistic cards
const StatCard: React.FC<StatCardProps> = ({ icon, title, value, trend, trendType }) => {
  return (
    <motion.div 
      className={`${styles.statCard} ${styles[`trend-${trendType}`]}`}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <div className={styles.statIcon}>{icon}</div>
      <div className={styles.statContent}>
        <h3>{title}</h3>
        <div className={styles.statValue}>{value}</div>
        <div className={styles.statTrend}>
          {trendType === 'positive' && '↑'}
          {trendType === 'negative' && '↓'} {trend}
        </div>
      </div>
    </motion.div>
  );
};

// Component for project cards
const ProjectCard: React.FC<{ project: Project }> = ({ project }) => {
  return (
    <motion.div 
      className={styles.projectCard}
      whileHover={{ y: -2, boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)' }}
      transition={{ duration: 0.2 }}
    >
      <div className={styles.projectHeader}>
        <div className={styles.projectIcon}>
          <FiCode className={styles.projectIconSvg} />
        </div>
        <div className={styles.projectTitleContainer}>
          <h3 className={styles.projectTitle}>{project.name}</h3>
          <span className={styles.projectLanguage}>{project.language}</span>
        </div>
        <button className={styles.projectMenu}>
          <FiMoreHorizontal />
        </button>
      </div>
      
      <p className={styles.projectDescription}>{project.description}</p>
      
      <div className={styles.progressContainer}>
        <div className={styles.progressLabel}>
          <span>Progress</span>
          <span>{project.progress}%</span>
        </div>
        <div className={styles.progressBar}>
          <div 
            className={styles.progressFill} 
            style={{ width: `${project.progress}%` }}
          />
        </div>
      </div>
      
      <div className={styles.projectMeta}>
        <div className={styles.metaItem}>
          <FiStar className={styles.metaIcon} />
          {project.stars}
        </div>
        <div className={styles.metaItem}>
          <FiGitBranch className={styles.metaIcon} />
          {project.forks}
        </div>
        
        <div className={styles.collaborators}>
          {project.collaborators.map((initial, idx) => (
            <div key={idx} className={styles.avatar}>
              {initial}
            </div>
          ))}
        </div>
        
        <div className={styles.lastUpdated}>
          <FiClock className={styles.timeIcon} />
          {project.lastUpdated}
        </div>
      </div>
      
      {project.unreadMessages > 0 && (
        <div className={styles.unreadBadge}>
          {project.unreadMessages} unread
        </div>
      )}
    </motion.div>
  );
};

// Component for activity items
const ActivityItem: React.FC<{ activity: Activity }> = ({ activity }) => {
  const getActivityIcon = () => {
    switch (activity.type) {
      case 'push':
        return <FiGitBranch className={styles.activityIcon} />;
      case 'branch':
        return <FiGitBranch className={styles.activityIcon} />;
      case 'pr':
        return <FiGitPullRequest className={styles.activityIcon} />;
      case 'comment':
        return <FiMessageSquare className={styles.activityIcon} />;
      default:
        return <FiCode className={styles.activityIcon} />;
    }
  };

  return (
    <div className={styles.activityItem}>
      <div className={styles.activityIconContainer}>
        {getActivityIcon()}
      </div>
      <div className={styles.activityContent}>
        <div className={styles.activityText}>
          <span className={styles.activityUser}>{activity.user}</span>
          <span> {activity.action} </span>
          <span className={styles.activityTarget}>{activity.target}</span>
        </div>
        <div className={styles.activityMeta}>
          <span className={styles.activityProject}>{activity.project}</span>
          <span className={styles.activityTime}>{activity.time}</span>
        </div>
      </div>
    </div>
  );
};

// Component for team members
const TeamMember: React.FC<{ member: TeamMember }> = ({ member }) => {
  const getStatusClass = () => {
    switch (member.status) {
      case 'online':
        return styles.statusOnline;
      case 'coding':
        return styles.statusCoding;
      case 'away':
        return styles.statusAway;
      default:
        return styles.statusOffline;
    }
  };

  return (
    <div className={styles.teamMember}>
      <div className={styles.memberAvatarContainer}>
        <div className={styles.memberAvatar}>{member.avatar}</div>
        <div className={`${styles.memberStatus} ${getStatusClass()}`} />
      </div>
      <div className={styles.memberInfo}>
        <div className={styles.memberName}>{member.name}</div>
        <div className={styles.memberRole}>{member.role}</div>
      </div>
      <button className={styles.messageButton}>
        <FiMessageSquare size={16} />
      </button>
    </div>
  );
};

const NewDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'projects' | 'activity'>('projects');
  
  return (
    <div className={styles.dashboardContainer}>
      {/* Top Navigation */}
      <header className={styles.topNav}>
        <div className={styles.searchBar}>
          <FiSearch className={styles.searchIcon} />
          <input 
            type="text" 
            placeholder="Search projects, files, or team members..."
            className={styles.searchInput}
          />
        </div>
        
        <div className={styles.navActions}>
          <button className={styles.navButton}>
            <FiBell size={20} />
            <span className={styles.notificationBadge}>3</span>
          </button>
          <button className={styles.userButton}>
            <div className={styles.userAvatar}>JD</div>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className={styles.mainContent}>
        {/* Welcome Section */}
        <section className={styles.welcomeSection}>
          <div className={styles.welcomeHeader}>
            <div>
              <h1>Welcome back, John</h1>
              <p className={styles.welcomeSubtitle}>Here's what's happening with your projects today</p>
            </div>
            <div className={styles.quickActions}>
              <button className={`${styles.actionButton} ${styles.primary}`}>
                <FiPlus size={16} />
                <span>New Project</span>
              </button>
              <button className={styles.actionButton}>
                <FiLayers size={16} />
                <span>Import</span>
              </button>
            </div>
          </div>
          
          <div className={styles.statsGrid}>
            <StatCard 
              icon={<FiCode />} 
              title="Active Projects" 
              value="12" 
              trend="+2 this week" 
              trendType="positive"
            />
            <StatCard 
              icon={<FiGitBranch />} 
              title="Open PRs" 
              value="7" 
              trend="3 to review" 
              trendType="neutral"
            />
            <StatCard 
              icon={<FiUsers />} 
              title="Team Online" 
              value="8/12" 
              trend="2 in meeting" 
              trendType="positive"
            />
            <StatCard 
              icon={<FiActivity />} 
              title="Activity" 
              value="24" 
              trend="+8% this week" 
              trendType="positive"
            />
          </div>
        </section>

        {/* Tabs */}
        <div className={styles.tabs}>
          <button 
            className={`${styles.tab} ${activeTab === 'projects' ? styles.active : ''}`}
            onClick={() => setActiveTab('projects')}
          >
            <FiLayers size={18} />
            <span>My Projects</span>
          </button>
          <button 
            className={`${styles.tab} ${activeTab === 'activity' ? styles.active : ''}`}
            onClick={() => setActiveTab('activity')}
          >
            <FiActivity size={18} />
            <span>Activity Feed</span>
          </button>
        </div>

        <div className={styles.contentWrapper}>
          {/* Projects Section */}
          <section className={styles.projectsSection}>
            <div className={styles.sectionHeader}>
              <h2>Recent Projects</h2>
              <div className={styles.viewOptions}>
                <button className={styles.viewOption}>
                  <FiTrendingUp size={16} />
                  <span>Sort by: Recent</span>
                </button>
                <button className={styles.viewOption}>
                  <FiMoreHorizontal size={20} />
                </button>
              </div>
            </div>
            
            <div className={styles.projectsGrid}>
              {projects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
            
            <div className={styles.viewAllContainer}>
              <button className={styles.viewAllButton}>
                View all projects
              </button>
            </div>
          </section>

          {/* Sidebar */}
          <aside className={styles.sidebar}>
            {/* Activity Section */}
            <section className={styles.activitySection}>
              <div className={styles.sectionHeader}>
                <h2>Recent Activity</h2>
                <button className={styles.viewOption}>
                  <FiMoreHorizontal size={20} />
                </button>
              </div>
              <div className={styles.activityList}>
                {recentActivity.map((activity) => (
                  <ActivityItem key={activity.id} activity={activity} />
                ))}
              </div>
              <div className={styles.viewAllContainer}>
                <button className={styles.viewAllButton}>
                  View all activity
                </button>
              </div>
            </section>

            {/* Team Section */}
            <section className={styles.teamSection}>
              <div className={styles.sectionHeader}>
                <h2>Team Members</h2>
                <button className={styles.viewOption}>
                  <FiMoreHorizontal size={20} />
                </button>
              </div>
              <div className={styles.teamList}>
                {teamMembers.map((member) => (
                  <TeamMember key={member.id} member={member} />
                ))}
              </div>
              <div className={styles.viewAllContainer}>
                <button className={styles.viewAllButton}>
                  View all members
                </button>
              </div>
            </section>
          </aside>
        </div>
      </main>
    </div>
  );
};

export default NewDashboard;
