import { useState, useEffect } from 'react';
import { Outlet } from 'react-router';
import { motion } from 'framer-motion';
import { cn } from '~/lib/utils';
import { useUIStore } from '~/stores/ui.store';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

// Media query breakpoint for lg (1024px)
const DESKTOP_BREAKPOINT = 1024;

export function AppLayout() {
  const { sidebarCollapsed, setMobileSidebarOpen } = useUIStore();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Close mobile sidebar when viewport changes to desktop
  useEffect(() => {
    // SSR safety check
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia(`(min-width: ${DESKTOP_BREAKPOINT}px)`);

    const handleChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        // Switched to desktop viewport - close mobile sidebar overlay
        setMobileSidebarOpen(false);
      }
    };

    // Add listener for viewport changes
    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [setMobileSidebarOpen]);

  // Calculate content margin based on desktop sidebar state
  const contentMarginLeft = sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-[280px]';

  return (
    <div className="flex h-screen overflow-hidden bg-neutral-50 dark:bg-neutral-950">
      {/* Sidebar - handles both desktop (CSS) and mobile (state) internally */}
      <Sidebar />

      {/* Main content area */}
      <div
        className={cn(
          'flex flex-1 flex-col overflow-hidden transition-all duration-300',
          contentMarginLeft
        )}
      >
        {/* Header */}
        <Header />

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <motion.div
            initial={isMounted ? { opacity: 0, y: 10 } : false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="container mx-auto px-4 py-6 lg:px-8"
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  );
}