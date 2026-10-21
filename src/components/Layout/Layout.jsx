import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import styles from './Layout.module.css';

export default function Layout({ children, userName }) {
  return (
    <div className="app-layout">
      <Sidebar userName={userName} />
      <main className="main-content">
        <div className="page-wrapper">
          {children}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
