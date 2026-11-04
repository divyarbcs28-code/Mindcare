import { useState, useEffect } from 'react';
import { User, Shield, LogOut, Check, ArrowLeft, Phone, AlertCircle } from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import PageHero from '../components/shared/PageHero';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5003';

export default function Profile() {
  const [user, setUser] = useLocalStorage('mindcare_user_data', null);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Local form state so we can edit before saving
  const [formData, setFormData] = useState({
    firstName: '',
    email: '',
    emergencyName: '',
    emergencyPhone: '',
    emergencyRelation: '',
    analytics: false,
    personalization: false,
    emergencyAccess: false,
  });

  useEffect(() => {
    if (!user) return;

    // First populate from local state
    setFormData({
      firstName: user.firstName || '',
      email: user.email || '',
      emergencyName: user.emergencyContact?.contactName || user.emergencyContact?.name || '',
      emergencyPhone: user.emergencyContact?.phoneNumber || user.emergencyContact?.phone || '',
      emergencyRelation: user.emergencyContact?.relationship || user.emergencyContact?.relation || '',
      analytics: user.privacyPreferences?.analytics || false,
      personalization: user.privacyPreferences?.personalization || false,
      emergencyAccess: user.privacyPreferences?.emergencyAccess || false,
    });

    // If we have a backend user ID, fetch latest database record
    if (user._id && !String(user._id).startsWith('local-')) {
      fetch(`${API_BASE_URL}/api/users/${user._id}/profile`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.user) {
            const dbUser = data.user;
            setFormData({
              firstName: dbUser.firstName || '',
              email: dbUser.email || '',
              emergencyName: dbUser.emergencyContact?.contactName || dbUser.emergencyContact?.name || '',
              emergencyPhone: dbUser.emergencyContact?.phoneNumber || dbUser.emergencyContact?.phone || '',
              emergencyRelation: dbUser.emergencyContact?.relationship || dbUser.emergencyContact?.relation || '',
              analytics: dbUser.privacyPreferences?.analytics || false,
              personalization: dbUser.privacyPreferences?.personalization || false,
              emergencyAccess: dbUser.privacyPreferences?.emergencyAccess || false,
            });
            // Keep local state synchronized with database
            setUser((prev) => ({
              ...prev,
              firstName: dbUser.firstName,
              email: dbUser.email,
              privacyPreferences: dbUser.privacyPreferences,
              emergencyContact: dbUser.emergencyContact,
            }));
          }
        })
        .catch((err) => {
          console.warn('Could not sync profile from database:', err.message);
        });
    }
  }, [user?._id]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setErrorMsg('');
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSaved(false);

    const emergencyPayload = formData.emergencyName?.trim() ? {
      contactName: formData.emergencyName.trim(),
      phoneNumber: formData.emergencyPhone?.trim() || '',
      relationship: formData.emergencyRelation?.trim() || 'Contact',
      name: formData.emergencyName.trim(),
      phone: formData.emergencyPhone?.trim() || '',
      relation: formData.emergencyRelation?.trim() || 'Contact',
    } : null;

    const updatedUserObj = {
      ...user,
      firstName: formData.firstName,
      emergencyContact: emergencyPayload,
      privacyPreferences: {
        analytics: formData.analytics,
        personalization: formData.personalization,
        emergencyAccess: formData.emergencyAccess,
      },
    };

    try {
      if (user?._id && !String(user._id).startsWith('local-')) {
        const response = await fetch(`${API_BASE_URL}/api/users/${user._id}/profile`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            firstName: formData.firstName,
            privacyPreferences: {
              analytics: formData.analytics,
              personalization: formData.personalization,
              emergencyAccess: formData.emergencyAccess,
            },
            emergencyContact: emergencyPayload,
          }),
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Failed to update profile in database.');
        }

        setUser(data.user);
      } else {
        // Fallback for local-only account
        setUser(updatedUserObj);
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Failed to save profile:', err.message);
      setErrorMsg(err.message || 'Could not connect to database. Changes saved locally.');
      // Persist locally as fallback
      setUser(updatedUserObj);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setUser(null); // Clears local storage auth state
    window.location.reload();
  };

  if (!user) return null;

  return (
    <div className="animate-fade-in">
      <PageHero
        image="/images/profile-forest.webp"
        position="center"
        eyebrow="Your space"
        title="Profile & Settings"
        subtitle="Manage your account, privacy preferences, and emergency contacts."
      />

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
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Emergency Contact</h3>
                <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>Connected to database for crisis prompts & personal safety</p>
              </div>
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
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: 6 }}>Relationship</label>
              <input className="input" type="text" name="emergencyRelation" value={formData.emergencyRelation} onChange={handleChange} placeholder="e.g. Partner, Parent, Friend" />
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

          {errorMsg && (
            <div style={{ padding: '10px 14px', background: 'rgba(231,111,81,0.1)', border: '1px solid rgba(231,111,81,0.3)', borderRadius: 'var(--radius-md)', color: 'var(--color-danger)', fontSize: '0.85rem', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertCircle size={16} /> {errorMsg}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, alignItems: 'center' }}>
            {saved && (
              <span style={{ color: 'var(--color-accent)', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem' }}>
                <Check size={16} /> Saved to Database
              </span>
            )}
            <button className="btn btn-primary" onClick={handleSave} disabled={loading} style={{ minWidth: 140 }}>
              {loading ? <span className="spinner" style={{ width: 16, height: 16 }} /> : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
