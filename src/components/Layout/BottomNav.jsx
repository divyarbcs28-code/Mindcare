import { NavLink } from 'react-router-dom';
import { Home, Mic, Heart, BarChart2, User } from 'lucide-react';
import styles from './BottomNav.module.css';

const navItems = [
  { to: '/',        icon: Home,      label: 'Home',    id: 'bnav-home' },
  { to: '/reflect', icon: Mic,       label: 'Reflect', id: 'bnav-reflect' },
  { to: '/support', icon: Heart,     label: 'Support', id: 'bnav-support' },
  { to: '/insights',icon: BarChart2, label: 'Progress',id: 'bnav-insights' },
  { to: '/profile', icon: User,      label: 'Profile', id: 'bnav-profile' },
];

export default function BottomNav() {
  return (
    <nav className={`${styles.bottomNav} show-mobile`}>
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
          <Icon size={20} strokeWidth={2} />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
