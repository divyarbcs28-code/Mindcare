import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import LandingPage from './pages/LandingPage';
import Home from './pages/Home';
import VoiceReflection from './pages/VoiceReflection';
import QuickSupport from './pages/QuickSupport';
import Insights from './pages/Insights';
import FunZone from './pages/FunZone';
import About from './pages/About';
import Profile from './pages/Profile';
import Register from './pages/Register';
import Login from './pages/Login';
import { useLocalStorage } from './hooks/useLocalStorage';
import CursorGlitter from './components/shared/CursorGlitter';

export default function App() {
  const [user, setUser] = useLocalStorage('mindcare_user_data', null);
  const withLayout = (page) => user
    ? <Layout userName={user.firstName}>{page}</Layout>
    : <Navigate to="/login" replace />;

  const handleLoginComplete = (userData) => setUser(userData);
  const handleRegistrationComplete = (userData) => setUser(userData);

  return (
    <BrowserRouter>
      <CursorGlitter />
      <Routes>
        <Route path="/" element={user ? withLayout(<Home userName={user.firstName} />) : <LandingPage />} />
        <Route path="/login" element={<Login onLogin={handleLoginComplete} onGoToRegister={() => window.location.assign('/register')} />} />
        <Route path="/register" element={<Register onComplete={handleRegistrationComplete} />} />
        <Route path="/signup" element={<Register onComplete={handleRegistrationComplete} />} />
        <Route path="/reflect" element={withLayout(<VoiceReflection />)} />
        <Route path="/support" element={withLayout(<QuickSupport />)} />
        <Route path="/insights" element={withLayout(<Insights />)} />
        <Route path="/funzone" element={withLayout(<FunZone />)} />
        <Route path="/profile" element={withLayout(<Profile />)} />
        <Route path="/about" element={withLayout(<About />)} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
