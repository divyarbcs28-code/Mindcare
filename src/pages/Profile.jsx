import { useState, useEffect } from 'react';
import { User, Shield, LogOut, Check, ArrowLeft, Phone } from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';

export default function Profile() {
  const [user, setUser] = useLocalStorage('mindcare_user_data', null);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  
  // Local form state so we can edit before saving
  const [formData, setFormData] = useState({
    firstName: '',
    email: '',
    emergencyName: '',
    emergencyPhone: '',
    analytics: false,
    personalization: false,
    emergencyAccess: false
  });

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        email: user.email || '',
        emergencyName: user.emergencyContact?.name || '',
        emergencyPhone: user.emergencyContact?.phone || '',
        analytics: user.privacyPreferences?.analytics || false,
        personalization: user.privacyPreferences?.personalization || false,
        emergencyAccess: user.privacyPreferences?.emergencyAccess || false,
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSave = (e) => {
    e.preventDefault();
    setLoading(true);
    
    // In a real app, send this to the backend API via PUT /api/users/profile
    
    setTimeout(() => {
      setUser(prev => ({
        ...prev,
        firstName: formData.firstName,
        emergencyContact: formData.emergencyName ? {
          name: formData.emergencyName,
          phone: formData.emergencyPhone,
          relation: prev.emergencyContact?.relation || 'Contact'
        } : null,
        privacyPreferences: {
          analytics: formData.analytics,
          personalization: formData.personalization,
          emergencyAccess: formData.emergencyAccess
        }
      }));
      setLoading(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }, 800);
  };

  const handleLogout = () => {
    setUser(null); // Clears local storage auth state
    window.location.reload();
  };

  if (!user) return null;

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title gradient-text">Profile & Settings</h1>
        <p className="page-subtitle">Manage your account, privacy preferences, and emergency contacts.</p>
      </div>

      <div className="grid-2">
        {/* Account Details */}
        <div className="glass-card" style={{ padding: 28, alignSelf: 'start' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(124,92,191,0.15)', border: '1px solid rgba(124,92,191,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <User size={20} color="var(--color-primary-light)" />
            </div>
            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Account</h3>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: 6 }}>First Name</label>
            <input className="input" type="text" name="firstName" value={formData.firstName} onChange={handleChange} />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: 6 }}>Email (Read Only)</label>
            <input className="input" type="email" value={formData.email} readOnly style={{ opacity: 0.6, cursor: 'not-allowed' }} />
          </div>

          <button className="btn btn-secondary w-full" onClick={handleLogout} style={{ color: 'var(--color-danger)', borderColor: 'rgba(231,111,81,0.3)' }}>
            <LogOut size={16} /> Sign Out
          </button>
        </div>

        <div>
          {/* Emergency Contact */}
          <div className="glass-card" style={{ padding: 28, marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(231,111,81,0.15)', border: '1px solid rgba(231,111,81,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Phone size={20} color="var(--color-danger)" />
              </div>
              <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Emergency Contact</h3>
            </div>
            <div className="grid-2" style={{ marginBottom: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: 6 }}>Contact Name</label>
                <input className="input" type="text" name="emergencyName" value={formData.emergencyName} onChange={handleChange} placeholder="e.g. Jane Doe" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: 6 }}>Phone Number</label>
                <input className="input" type="tel" name="emergencyPhone" value={formData.emergencyPhone} onChange={handleChange} placeholder="+1 234..." />
              </div>
            </div>
          </div>

          {/* Privacy */}
          <div className="glass-card" style={{ padding: 28, marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(94,207,177,0.15)', border: '1px solid rgba(94,207,177,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Shield size={20} color="var(--color-accent)" />
              </div>
              <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Privacy</h3>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer' }}>
                <input type="checkbox" name="analytics" checked={formData.analytics} onChange={handleChange} style={{ marginTop: 4 }} />
                <div>
                  <p style={{ margin: '0 0 2px', fontSize: '0.9rem', color: 'var(--color-text-primary)' }}>Data Analytics</p>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Allow anonymised data to be used to improve the ML models.</p>
                </div>
              </label>

              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer' }}>
                <input type="checkbox" name="personalization" checked={formData.personalization} onChange={handleChange} style={{ marginTop: 4 }} />
                <div>
                  <p style={{ margin: '0 0 2px', fontSize: '0.9rem', color: 'var(--color-text-primary)' }}>Personalized Recommendations</p>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Allow the system to suggest activities based on your patterns.</p>
                </div>
              </label>

              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer' }}>
                <input type="checkbox" name="emergencyAccess" checked={formData.emergencyAccess} onChange={handleChange} style={{ marginTop: 4 }} />
                <div>
                  <p style={{ margin: '0 0 2px', fontSize: '0.9rem', color: 'var(--color-text-primary)' }}>Emergency Access</p>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Allow the system to prompt your emergency contact on severe safety flags.</p>
                </div>
              </label>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            {saved && <span style={{ color: 'var(--color-accent)', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem' }}><Check size={16} /> Saved Successfully</span>}
            <button className="btn btn-primary" onClick={handleSave} disabled={loading} style={{ minWidth: 140 }}>
              {loading ? <span className="spinner" style={{ width: 16, height: 16 }} /> : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
