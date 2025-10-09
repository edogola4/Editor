import * as React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '../ui/button/Button';
import { ScrollArea } from '../ui/scroll-area/ScrollArea';
import { File, Settings, Users, GitBranch, Zap, Plus, ChevronDown } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useTheme } from '@/design-system/ThemeProvider';
import { useAuth } from '@/hooks/use-auth';

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  collapsed?: boolean;
  onCollapse?: () => void;
}

export function Sidebar({ className, collapsed = false, onCollapse, ...props }: SidebarProps) {
  const { theme } = useTheme();
  const { user } = useAuth();

  const navItems = [
    {
      title: 'Projects',
      icon: File,
      href: '/projects',
      count: 0,
    },
    {
      title: 'Team',
      icon: Users,
      href: '/team',
      count: 0,
    },
    {
      title: 'Repositories',
      icon: GitBranch,
      href: '/repos',
      count: 0,
    },
    {
      title: 'Activity',
      icon: Zap,
      href: '/activity',
      count: 0,
    },
  ];

  return (
    <div
      className={cn(
        'h-full flex flex-col border-r border-border bg-card',
        className
      )}
      {...props}
    >
      <div className="p-4">
        <Button className="w-full justify-start gap-2" variant="outline">
          <Plus className="h-4 w-4" />
          <span>New Project</span>
        </Button>
      </div>

      <ScrollArea className="flex-1 px-3">
        <nav className="space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              className={({ isActive }) =>
                cn(
                  'group flex items-center px-3 py-2 text-sm font-medium rounded-md',
                  isActive
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:bg-accent/50',
                  'transition-colors duration-200'
                )
              }
            >
              <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
              <span className="truncate">{item.title}</span>
              {item.count > 0 && (
                <span className="ml-auto inline-flex items-center justify-center h-5 min-w-[1.25rem] px-1.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                  {item.count}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="mt-6 pt-6 border-t border-border">
          <h3 className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Recent Projects
          </h3>
          <div className="space-y-1">
            {[1, 2, 3].map((i) => (
              <button
                key={i}
                className="group flex items-center w-full px-3 py-2 text-sm font-medium rounded-md text-muted-foreground hover:bg-accent/50 transition-colors duration-200"
              >
                <div className="h-2 w-2 rounded-full bg-green-500 mr-3" />
                <span className="truncate">Project {i}</span>
              </button>
            ))}
          </div>
        </div>
      </ScrollArea>

      <div className="p-4 border-t border-border">
        <div className="flex items-center">
          <Avatar 
            src={user?.avatar} 
            alt={user?.name || 'User'} 
            fallback={user?.name || 'U'}
            size="sm"
            status="online"
            className="mr-2"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.name || 'Anonymous'}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email || 'No email'}</p>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Settings className="h-4 w-4" />
            <span className="sr-only">Settings</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
