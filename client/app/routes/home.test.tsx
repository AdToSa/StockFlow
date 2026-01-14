import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import Home, { meta } from './home';

// Mock ThemeToggle
vi.mock('~/components/ui/ThemeToggle', () => ({
  ThemeToggle: () => <button data-testid="theme-toggle">Theme Toggle</button>,
}));

describe('Home route', () => {
  function renderHome() {
    const routes = [
      {
        path: '/',
        element: <Home />,
      },
    ];

    const router = createMemoryRouter(routes, {
      initialEntries: ['/'],
    });

    return render(<RouterProvider router={router} />);
  }

  describe('meta function', () => {
    it('returns correct title', () => {
      const result = meta({} as Parameters<typeof meta>[0]);
      expect(result).toContainEqual({
        title: 'StockFlow - Inventory & Billing System',
      });
    });

    it('returns correct description', () => {
      const result = meta({} as Parameters<typeof meta>[0]);
      expect(result).toContainEqual({
        name: 'description',
        content: 'Multi-tenant SaaS inventory and billing system',
      });
    });

    it('returns exactly 2 meta entries', () => {
      const result = meta({} as Parameters<typeof meta>[0]);
      expect(result).toHaveLength(2);
    });
  });

  describe('component rendering', () => {
    it('renders the StockFlow heading', () => {
      renderHome();
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('StockFlow');
    });

    it('renders the description text', () => {
      renderHome();
      expect(
        screen.getByText(/Multi-tenant SaaS inventory and billing system/i)
      ).toBeInTheDocument();
    });

    it('renders technology stack text', () => {
      renderHome();
      expect(
        screen.getByText(/React Router 7 \+ TypeScript \+ Tailwind CSS/i)
      ).toBeInTheDocument();
    });

    it('renders Get Started link', () => {
      renderHome();
      const link = screen.getByRole('link', { name: /get started/i });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', '/login');
    });

    it('renders Dashboard link', () => {
      renderHome();
      const link = screen.getByRole('link', { name: /dashboard/i });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', '/dashboard');
    });

    it('renders the ThemeToggle component', () => {
      renderHome();
      expect(screen.getByTestId('theme-toggle')).toBeInTheDocument();
    });

    it('displays phase information', () => {
      renderHome();
      expect(screen.getByText(/Phase 1: Foundations Setup Complete/i)).toBeInTheDocument();
    });
  });

  describe('layout and structure', () => {
    it('renders main container with flex layout', () => {
      renderHome();
      const container = screen.getByRole('heading', { level: 1 }).closest('div');
      expect(container?.parentElement).toHaveClass('flex');
    });

    it('renders two navigation links', () => {
      renderHome();
      const links = screen.getAllByRole('link');
      expect(links).toHaveLength(2);
    });

    it('renders SVG icon', () => {
      renderHome();
      const svg = document.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('has proper heading hierarchy', () => {
      renderHome();
      const h1 = screen.getByRole('heading', { level: 1 });
      expect(h1).toBeInTheDocument();
    });

    it('links have descriptive text', () => {
      renderHome();
      const getStartedLink = screen.getByRole('link', { name: /get started/i });
      const dashboardLink = screen.getByRole('link', { name: /dashboard/i });

      expect(getStartedLink).toHaveAccessibleName();
      expect(dashboardLink).toHaveAccessibleName();
    });
  });
});