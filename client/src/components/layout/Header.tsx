import * as React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '../ui/button/Button';
import { Avatar } from '../ui/avatar/Avatar';
import { useTheme } from '@/design-system/ThemeProvider';
import { Moon, Sun, Bell, Search, Plus, Settings, LogOut } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '../ui/dropdown/DropdownMenu';
import { useAuth } from '@/hooks/use-auth';

interface HeaderProps extends React.HTMLAttributes<HTMLElement> {
  title?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function Header({ title, actions, className, ...props }: HeaderProps) {
  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuth();

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <header
      className={cn(
        'flex items-center justify-between w-full h-full px-4 border-b border-border bg-card',
        className
      )}
      {...props}
    >
      <div className="flex items-center space-x-4">
        <h1 className="text-xl font-semibold">{title || 'CodeCollab'}</h1>
      </div>

      <div className="flex-1 flex justify-center">
        <div className="relative w-full max-w-2xl">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-muted-foreground" />
          </div>
          <input
            type="text"
            placeholder="Search files, projects, or users..."
            className="block w-full pl-10 pr-3 py-2 border border-border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <kbd className="inline-flex items-center px-2 py-1 border border-border rounded text-xs font-mono bg-muted text-muted-foreground">
              ⌘K
            </kbd>
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Button variant="ghost" size="icon" onClick={toggleTheme}>
          {theme === 'dark' ? (
            <Sun className="h-5 w-5" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
          <span className="sr-only">Toggle theme</span>
        </Button>

        <Button variant="ghost" size="icon">
          <Bell className="h-5 w-5" />
          <span className="sr-only">Notifications</span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar 
                src={user?.avatar} 
                alt={user?.name || 'User'} 
                fallback={user?.name || 'U'}
                status="online"
                size="sm"
              />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <div className="flex items-center p-2">
              <div className="flex-shrink-0">
                <Avatar 
                  src={user?.avatar} 
                  alt={user?.name || 'User'} 
                  fallback={user?.name || 'U'}
                  size="sm"
                />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium">{user?.name || 'Anonymous'}</p>
                <p className="text-xs text-muted-foreground">{user?.email || 'No email'}</p>
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => logout()}>
              <LogOut className="w-4 h-4 mr-2" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
