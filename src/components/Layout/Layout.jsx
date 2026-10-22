import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import { useReveal } from '../../hooks/useReveal';

export default function Layout({ children, userName }) {
  const { pathname } = useLocation();
  useReveal(pathname);
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [pathname]);

  return (
    <div className="app-layout">
      <Sidebar userName={userName} />
      <main className="main-content">
        {/* Keyed by route so each page plays the enter transition */}
        <div className="page-wrapper page-enter" key={pathname}>
          {children}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
