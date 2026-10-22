import { NavLink, useLocation } from 'react-router-dom';
import { Home, Mic, Heart, BarChart2, Smile, Info, Brain, User, Settings } from 'lucide-react';
import styles from './Sidebar.module.css';

const navItems = [
  { to: '/',        icon: Home,       label: 'Home',      id: 'nav-home' },
  { to: '/reflect', icon: Mic,        label: 'Reflect',   id: 'nav-reflect' },
  { to: '/support', icon: Heart,      label: 'Support',   id: 'nav-support' },
  { to: '/insights',icon: BarChart2,  label: 'Progress',  id: 'nav-insights' },
  { to: '/funzone', icon: Smile,      label: 'Fun Zone',  id: 'nav-funzone' },
  { to: '/profile', icon: User,       label: 'Profile',   id: 'nav-profile' },
  { to: '/about',   icon: Info,       label: 'About',     id: 'nav-about' },
];

export default function Sidebar({ userName }) {
  return (
    <aside className={`${styles.sidebar} hide-mobile`}>
      <div className={styles.logo}>
        <div className={styles.logoIcon}>
          <Brain size={22} />
        </div>
        <div>
          <span className={`${styles.logoText} gradient-text font-display`}>MindCare</span>
          {userName && (
            <p className={styles.userGreet}>Hey, {userName.split(' ')[0]} 👋</p>
          )}
        </div>
      </div>

      <nav className={styles.nav}>
        {navItems.map(({ to, icon: Icon, label, id }) => (
          <NavLink
            key={to}
            to={to}
            id={id}
            end={to === '/'}
            className={({ isActive }) =>
              `${styles.navItem} ${isActive ? styles.active : ''}`
            }
          >
            <Icon size={18} strokeWidth={2} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <NavLink to="/support" className={styles.calmCard}>
        <span className={styles.calmCardImg} aria-hidden="true" />
        <strong>Need a pause?</strong>
        <span>Try a 1-minute breathing break</span>
      </NavLink>

      <div className={styles.sidebarFooter}>
        <p className={styles.footerText}>🔒 Your data stays private</p>
        <p className={styles.footerSub}>No diagnosis. Patterns only.</p>
      </div>
    </aside>
  );
}
