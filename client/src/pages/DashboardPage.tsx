import React, { useState } from 'react';
import { DashboardLayout } from '../components/dashboard/layout/DashboardLayout';
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
  FiMoreHorizontal
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
}

interface Activity {
  id: number;
  user: string;
  action: string;
  target: string;
  time: string;
  avatar: string;
  project: string;
  type: string;
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
    type: 'push',
  },
  {
    id: 2,
    user: 'Alex Smith',
    action: 'created branch',
    target: 'feature/user-authentication',
    time: '1 hour ago',
    avatar: 'AS',
    project: 'Task Manager',
    type: 'branch',
  },
  {
    id: 3,
    user: 'Maria Perez',
    action: 'opened pull request',
    target: '#42 Add dark mode support',
    time: '3 hours ago',
    avatar: 'MP',
    project: 'Design System',
    type: 'pr',
  },
];

const teamMembers: TeamMember[] = [
  { id: 1, name: 'John Doe', role: 'Frontend Lead', avatar: 'JD', status: 'online' },
  { id: 2, name: 'Alex Smith', role: 'Backend Developer', avatar: 'AS', status: 'coding' },
  { id: 3, name: 'Maria Perez', role: 'UI/UX Designer', avatar: 'MP', status: 'away' },
  { id: 4, name: 'Taylor Reed', role: 'DevOps Engineer', avatar: 'TR', status: 'offline' },
];

const DashboardPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'projects' | 'activity'>('projects');
  
  return (
    <DashboardLayout>
      <div className={styles.dashboardContent}>
        {/* Welcome Section */}
        <section className={styles.welcomeSection}>
          <div className={styles.welcomeHeader}>
            <div>
              <h1>Welcome back, John</h1>
              <p className={styles.welcomeSubtitle}>Here's what's happening with your projects today</p>
            </div>
            <div className={styles.quickActions}>
              <button className={`${styles.actionButton} ${styles.primary}`}>
                <FiZap size={16} />
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
                trendType="warning"
              />
              <StatCard 
                icon={<FiUsers />} 
                title="Team Members" 
                value="8" 
                trend="2 online" 
                trendType="neutral"
              />
              <StatCard 
                icon={<FiAlertCircle />} 
                title="Issues" 
                value="5" 
                trend="2 high priority" 
                trendType="negative"
              />
            </div>
          </div>
        </section>

        {/* Main Content Grid */}
        <div className={styles.mainGrid}>
          {/* Projects Section */}
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2>Recent Projects</h2>
              <button className={styles.viewAllButton}>View All</button>
            </div>
            <div className={styles.projectsGrid}>
              {projects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          </section>

          {/* Activity & Team Sidebar */}
          <aside className={styles.sidebar}>
            {/* Recent Activity */}
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <h3>Recent Activity</h3>
                <button className={styles.viewAllButton}>View All</button>
              </div>
              <div className={styles.activityList}>
                {recentActivity.map((activity) => (
                  <ActivityItem key={activity.id} activity={activity} />
                ))}
              </div>
            </div>

            {/* Team Members */}
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <h3>Team Members</h3>
                <button className={styles.viewAllButton}>View All</button>
              </div>
              <div className={styles.teamList}>
                {teamMembers.map((member) => (
                  <TeamMember key={member.id} member={member} />
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </DashboardLayout>
  );
};

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
        <div className={styles.projectTitleWrapper}>
          <h3 className={styles.projectTitle}>{project.name}</h3>
          <p className={styles.projectDescription}>{project.description}</p>
        </div>
        {project.isPinned && <div className={styles.pinnedBadge}>Pinned</div>}
      </div>
      
      <div className={styles.projectMeta}>
        <div className={styles.metaItem}>
          <span className={styles.languageDot}></span>
          {project.language}
        </div>
        <div className={styles.metaItem}>
          <FiStar className={styles.metaIcon} />
          {project.stars}
        </div>
        <div className={styles.metaItem}>
          <FiGitBranch className={styles.metaIcon} />
          {project.forks}
        </div>
      </div>
      
      <div className={styles.projectFooter}>
        <div className={styles.collaborators}>
          {project.collaborators.map((initial: string, idx: number) => (
            <div key={idx} className={styles.avatar}>
              {initial}
            </div>
          ))}
        </div>
        <div className={styles.projectActions}>
          <span className={styles.lastUpdated}>
            <FiClock className={styles.timeIcon} />
            {project.lastUpdated}
          </span>
          {project.unreadMessages > 0 && (
            <span className={styles.unreadBadge}>
              {project.unreadMessages}
            </span>
          )}
        </div>
      </div>
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
      default:
        return <FiCode className={styles.activityIcon} />;
    }
  };

  return (
    <div className={styles.activityItem}>
      <div className={styles.activityIconWrapper}>
        {getActivityIcon()}
      </div>
      <div className={styles.activityContent}>
        <div className={styles.activityHeader}>
          <span className={styles.activityUser}>{activity.user}</span>
          <span className={styles.activityAction}>{activity.action}</span>
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
      <div className={styles.memberAvatar}>
        <span className={styles.avatarInitials}>{member.avatar}</span>
        <span className={`${styles.statusIndicator} ${getStatusClass()}`}></span>
      </div>
      <div className={styles.memberInfo}>
        <div className={styles.memberName}>{member.name}</div>
        <div className={styles.memberRole}>{member.role}</div>
      </div>
      <div className={styles.memberStatus}>
        <span className={`${styles.statusText} ${getStatusClass()}`}>
          {member.status.charAt(0).toUpperCase() + member.status.slice(1)}
        </span>
      </div>
    </div>
  );
};

export default DashboardPage;
