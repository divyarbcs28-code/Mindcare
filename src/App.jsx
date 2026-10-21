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

export default function App() {
  const [user, setUser] = useLocalStorage('mindcare_user_data', null);

  const handleLoginComplete = (userData) => {
    setUser(userData);
  };

  const handleRegistrationComplete = (userData) => {
    setUser(userData);
  };

  return (
    <BrowserRouter>
      {!user ? (
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login onLogin={handleLoginComplete} onGoToRegister={() => window.location.href = '/register'} />} />
          <Route path="/register" element={<Register onComplete={handleRegistrationComplete} onGoToLogin={() => window.location.href = '/login'} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      ) : (
        <Layout userName={user.firstName}>
          <Routes>
            <Route path="/" element={<Home userName={user.firstName} />} />
            <Route path="/reflect" element={<VoiceReflection />} />
            <Route path="/support" element={<QuickSupport />} />
            <Route path="/insights" element={<Insights />} />
            <Route path="/funzone" element={<FunZone />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/about" element={<About />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      )}
    </BrowserRouter>
  );
}
