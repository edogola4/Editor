import * as React from 'react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useMediaQuery } from '@/hooks/use-media-query';
import { Button } from '../ui/button/Button';
import { PanelLeft, PanelRight, Menu } from 'lucide-react';

interface AppShellProps {
  sidebarLeft?: React.ReactNode;
  sidebarRight?: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  sidebarLeftWidth?: string;
  sidebarRightWidth?: string;
  headerHeight?: string;
  footerHeight?: string;
}

export function AppShell({
  sidebarLeft,
  sidebarRight,
  header,
  footer,
  children,
  className,
  sidebarLeftWidth = '250px',
  sidebarRightWidth = '300px',
  headerHeight = '60px',
  footerHeight = '40px',
}: AppShellProps) {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = React.useState(!isMobile);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = React.useState(!isMobile);

  // Close sidebars on mobile when route changes
  React.useEffect(() => {
    if (isMobile) {
      setIsLeftSidebarOpen(false);
      setIsRightSidebarOpen(false);
    } else {
      setIsLeftSidebarOpen(true);
      setIsRightSidebarOpen(true);
    }
  }, [isMobile]);

  const toggleLeftSidebar = () => {
    setIsLeftSidebarOpen(!isLeftSidebarOpen);
  };

  const toggleRightSidebar = () => {
    setIsRightSidebarOpen(!isRightSidebarOpen);
  };

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      {/* Header */}
      {header && (
        <header 
          className="border-b border-border bg-card z-10"
          style={{ height: headerHeight }}
        >
          <div className="h-full flex items-center px-4">
            <div className="flex items-center space-x-2">
              {sidebarLeft && isMobile && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleLeftSidebar}
                  className="md:hidden"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              )}
              {header}
            </div>
            <div className="ml-auto flex items-center space-x-2">
              {sidebarRight && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleRightSidebar}
                  className="md:hidden"
                >
                  <PanelRight className="h-5 w-5" />
                </Button>
              )}
            </div>
          </div>
        </header>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        {sidebarLeft && (
          <>
            <AnimatePresence>
              {(isLeftSidebarOpen || !isMobile) && (
                <motion.aside
                  initial={{ x: isMobile ? '-100%' : 0, width: sidebarLeftWidth }}
                  animate={{ 
                    x: isLeftSidebarOpen ? 0 : `-${sidebarLeftWidth}`,
                    width: isLeftSidebarOpen ? sidebarLeftWidth : 0,
                  }}
                  exit={{ x: '-100%', width: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  className={cn(
                    'h-full flex-shrink-0 border-r border-border bg-card overflow-hidden',
                    'fixed md:static z-20',
                    isMobile ? 'shadow-lg' : ''
                  )}
                  style={{ width: isLeftSidebarOpen ? sidebarLeftWidth : 0 }}
                >
                  <div className="h-full overflow-y-auto">
                    {sidebarLeft}
                  </div>
                </motion.aside>
              )}
            </AnimatePresence>

            {/* Overlay for mobile */}
            {isMobile && isLeftSidebarOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                exit={{ opacity: 0 }}
                onClick={toggleLeftSidebar}
                className="fixed inset-0 z-10 bg-black md:hidden"
              />
            )}
          </>
        )}

        {/* Main Content */}
        <main
          className={cn(
            'flex-1 overflow-auto',
            'transition-all duration-300',
            className
          )}
          style={{
            marginLeft: sidebarLeft ? (isLeftSidebarOpen ? 0 : `-${sidebarLeftWidth}`) : 0,
            marginRight: sidebarRight ? (isRightSidebarOpen ? 0 : `-${sidebarRightWidth}`) : 0,
          }}
        >
          <div className="h-full">{children}</div>
        </main>

        {/* Right Sidebar */}
        {sidebarRight && (
          <>
            <AnimatePresence>
              {(isRightSidebarOpen || !isMobile) && (
                <motion.aside
                  initial={{ x: isMobile ? '100%' : 0, width: sidebarRightWidth }}
                  animate={{ 
                    x: isRightSidebarOpen ? 0 : sidebarRightWidth,
                    width: isRightSidebarOpen ? sidebarRightWidth : 0,
                  }}
                  exit={{ x: '100%', width: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  className={cn(
                    'h-full flex-shrink-0 border-l border-border bg-card overflow-hidden',
                    'fixed right-0 md:static z-20',
                    isMobile ? 'shadow-lg' : ''
                  )}
                  style={{ width: isRightSidebarOpen ? sidebarRightWidth : 0 }}
                >
                  <div className="h-full overflow-y-auto">
                    {sidebarRight}
                  </div>
                </motion.aside>
              )}
            </AnimatePresence>

            {/* Overlay for mobile */}
            {isMobile && isRightSidebarOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                exit={{ opacity: 0 }}
                onClick={toggleRightSidebar}
                className="fixed inset-0 z-10 bg-black md:hidden"
              />
            )}
          </>
        )}
      </div>

      {/* Footer */}
      {footer && (
        <footer 
          className="border-t border-border bg-card z-10"
          style={{ height: footerHeight }}
        >
          {footer}
        </footer>
      )}
    </div>
  );
}
