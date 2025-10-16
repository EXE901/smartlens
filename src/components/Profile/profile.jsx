import { useEffect, useState, useMemo, memo, useRef } from "react";
import Particles from "@tsparticles/react";
import { loadFull } from "tsparticles";
import { useNavigate } from "react-router-dom";
import { updateEmail, updatePassword, reauthenticateWithCredential, EmailAuthProvider, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../firebase/config';
import Navigation from '../Navigation/Navigation';
import "./Profile.css";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const ParticlesBackground = memo(() => {
  const [init, setInit] = useState(false);
  const engineLoaded = useRef(false);

  useEffect(() => {
    const initParticles = async (engine) => {
      if (!engineLoaded.current) {
        await loadFull(engine);
        engineLoaded.current = true;
        setInit(true);
      }
    };
    initParticles(window.tsParticles || {});
  }, []);

  const options = useMemo(() => ({
    fpsLimit: 15,
    fullScreen: { enable: false },
    background: { color: "transparent" },
    particles: {
      number: { value: 20 },
      shape: { type: "circle" },
      color: { value: ["rgba(2,0,36,0.3)", "rgba(9,9,121,0.3)", "rgba(0,212,255,0.3)"] },
      opacity: { value: 0.4 },
      size: { value: 300, random: { enable: true, minimumValue: 150 } },
      move: { enable: true, speed: 0.8, direction: "top", outModes: { default: "out" } },
    },
    detectRetina: true,
    style: {
      position: "absolute",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      filter: "blur(10px)",
      zIndex: -1
    },
  }), []);

  return init ? <Particles id="tsparticles" options={options} /> : null;
});

const Profile = ({ user, onLogout, onUpdateUser }) => {
  const [activeTab, setActiveTab] = useState('account');
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [isOAuthUser, setIsOAuthUser] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const navigate = useNavigate();
  const contentRef = useRef(null);

  useEffect(() => {
    const checkAuthType = async () => {
      if (!user?.email) return;

      try {
        const response = await fetch(`${API_URL}/check-auth/${user.email}`);
        const data = await response.json();
        setIsOAuthUser(data.isOAuthOnly);
      } catch (error) {
        console.error('Error checking auth:', error);
        setIsOAuthUser(user?.provider && user.provider !== 'email');
      }
    };

    checkAuthType();
  }, [user]);

  const handleUpdateName = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/profile/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      });

      const data = await response.json();

      if (response.ok) {
        onUpdateUser({ ...user, name });
        setSuccess('✅ Name updated successfully!');
        contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setError('❌ Failed to update name: ' + data);
        contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch {
      setError('❌ Server error. Please try again.');
      contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateEmail = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (isOAuthUser) {
      setError('❌ Cannot change email for OAuth accounts (Google/Facebook)');
      contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      setLoading(false);
      return;
    }

    try {
      const firebaseUser = auth.currentUser;
      if (firebaseUser) {
        await updateEmail(firebaseUser, email);
      }

      const response = await fetch(`${API_URL}/profile/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (response.ok) {
        onUpdateUser({ ...user, email });
        setSuccess('✅ Email updated successfully! Please verify your new email.');
        contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setError('❌ Failed to update email: ' + data);
        contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (error) {
      if (error.code === 'auth/requires-recent-login') {
        setError('❌ Please log out and log back in to change your email.');
      } else {
        setError('❌ Failed to update email: ' + error.message);
      }
      contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (isOAuthUser) {
      setError('❌ Cannot change password for OAuth accounts (Google/Facebook)');
      contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      setLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('❌ New passwords do not match!');
      contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      setLoading(false);
      return;
    }

    if (newPassword.length < 8) {
      setError('❌ Password must be at least 8 characters!');
      contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      setLoading(false);
      return;
    }

    if (!/[A-Z]/.test(newPassword)) {
      setError('❌ Password must contain at least one uppercase letter!');
      contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      setLoading(false);
      return;
    }

    if (!/[a-z]/.test(newPassword)) {
      setError('❌ Password must contain at least one lowercase letter!');
      contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      setLoading(false);
      return;
    }

    if (!/[0-9]/.test(newPassword)) {
      setError('❌ Password must contain at least one number!');
      contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      setLoading(false);
      return;
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(newPassword)) {
      setError('❌ Password must contain at least one special character (!@#$%...)!');
      contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      setLoading(false);
      return;
    }

    try {
      const firebaseUser = auth.currentUser;
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(firebaseUser, credential);
      await updatePassword(firebaseUser, newPassword);

      const response = await fetch(`${API_URL}/profile/${user.id}/password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPassword })
      });

      if (response.ok) {
        setSuccess('✅ Password updated successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setError('❌ Failed to update password in database');
        contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (error) {
      if (error.code === 'auth/wrong-password') {
        setError('❌ Current password is incorrect');
      } else {
        setError('❌ Failed to update password: ' + error.message);
      }
      contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    setError('');
    setSuccess('');
    setLoading(true);

    contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });

    if (isOAuthUser) {
      setError('❌ OAuth accounts (Google/Facebook) don\'t have passwords. Manage through your provider.');
      setLoading(false);
      return;
    }

    try {
      await sendPasswordResetEmail(auth, user.email);
      setSuccess(`✅ Password reset email sent to ${user.email}! Check your inbox.`);
    } catch (error) {
      setError('❌ Failed to send reset email: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setShowDeleteModal(false);
    setLoading(true);

    try {
      const firebaseUser = auth.currentUser;
      if (firebaseUser) {
        await firebaseUser.delete();
      }

      const response = await fetch(`${API_URL}/profile/${user.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        localStorage.removeItem('user');
        onLogout();
        navigate('/login');
      } else {
        setError('❌ Failed to delete account from database');
        contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (error) {
      if (error.code === 'auth/requires-recent-login') {
        setError('❌ Please log out and log back in, then try deleting again.');
      } else {
        setError('❌ Failed to delete account: ' + error.message);
      }
      contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-page">
      <ParticlesBackground />
      <Navigation onSignOut={onLogout} />
      
      <div className="profile-container">
        <div className="profile-sidebar">
          <h2>Settings</h2>
          <button 
            className={activeTab === 'account' ? 'active' : ''} 
            onClick={() => setActiveTab('account')}
          >
            Account Info
          </button>
          <button 
            className={activeTab === 'security' ? 'active' : ''} 
            onClick={() => setActiveTab('security')}
          >
            Security
          </button>
          <button 
            className={activeTab === 'privacy' ? 'active' : ''} 
            onClick={() => setActiveTab('privacy')}
          >
            Privacy
          </button>
          <button onClick={() => navigate('/main')} style={{ marginTop: '20px', opacity: 0.7 }}>
            ← Back to App
          </button>
        </div>

        <div className="profile-content" ref={contentRef}>
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          {activeTab === 'account' && (
            <div className="tab-content">
              <h2>Account Information</h2>
              
              <div className="info-card">
                <label>Login Method</label>
                <p>{isOAuthUser ? `OAuth (${user.provider || 'Google/Facebook'})` : 'Email/Password'}</p>
              </div>

              <div className="info-card">
                <label>Email</label>
                <p>{user.email}</p>
              </div>

              <div className="info-card">
                <label>Member Since</label>
                <p>{new Date(user.joined).toLocaleDateString()}</p>
              </div>

              <div className="info-card">
                <label>Face Detections</label>
                <p>{user.entries || 0} images analyzed</p>
              </div>

              <form onSubmit={handleUpdateName} className="form-section">
                <h3>Update Name</h3>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Full Name"
                  required
                />
                <button type="submit" disabled={loading}>
                  {loading ? 'Updating...' : 'Update Name'}
                </button>
              </form>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="tab-content">
              <h2>Security Settings</h2>

              <form onSubmit={handleUpdateEmail} className="form-section">
                <h3>Update Email</h3>
                {isOAuthUser && (
                  <p className="warning">⚠️ Email cannot be changed for OAuth accounts</p>
                )}
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="New Email"
                  disabled={isOAuthUser}
                  required
                />
                <button type="submit" disabled={loading || isOAuthUser}>
                  {loading ? 'Updating...' : 'Update Email'}
                </button>
              </form>

              <form onSubmit={handleUpdatePassword} className="form-section">
                <h3>Update Password</h3>
                {isOAuthUser && (
                  <p className="warning">⚠️ Password cannot be changed for OAuth accounts</p>
                )}
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Current Password"
                  disabled={isOAuthUser}
                  required
                />
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="New Password"
                  disabled={isOAuthUser}
                  required
                />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm New Password"
                  disabled={isOAuthUser}
                  required
                />
                <button type="submit" disabled={loading || isOAuthUser}>
                  {loading ? 'Updating...' : 'Update Password'}
                </button>
                
                {!isOAuthUser && (
                  <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                    <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px', marginBottom: '10px' }}>
                      Don't remember your current password?
                    </p>
                    <button
                      type="button"
                      onClick={handlePasswordReset}
                      disabled={loading}
                      style={{
                        background: 'transparent',
                        border: '1px solid rgba(0, 212, 255, 0.5)',
                        color: '#00d4ff',
                        padding: '10px 20px',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        transition: 'all 0.3s',
                        width: '100%'
                      }}
                      onMouseOver={(e) => e.target.style.background = 'rgba(0, 212, 255, 0.1)'}
                      onMouseOut={(e) => e.target.style.background = 'transparent'}
                    >
                      Send Password Reset Email
                    </button>
                  </div>
                )}
              </form>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="tab-content">
              <h2>Privacy & Data</h2>
              
              <div className="danger-zone">
                <h3>Danger Zone</h3>
                <p>Once you delete your account, there is no going back. Please be certain.</p>
                <button onClick={() => setShowDeleteModal(true)} className="delete-btn">
                  Delete My Account
                </button>
              </div>

              {showDeleteModal && (
                <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
                  <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                    <div className="modal-header">
                      <h3>⚠️ Delete Account</h3>
                    </div>
                    <div className="modal-body">
                      <p>Are you absolutely sure you want to delete your account?</p>
                      <p><strong>This action cannot be undone.</strong></p>
                      <p className="modal-warning">All your data will be permanently deleted:</p>
                      <ul className="modal-list">
                        <li>Your profile information</li>
                        <li>Face detection history ({user.entries || 0} images)</li>
                        <li>All account settings</li>
                      </ul>
                    </div>
                    <div className="modal-footer">
                      <button 
                        onClick={() => setShowDeleteModal(false)} 
                        className="modal-cancel-btn"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={handleDeleteAccount} 
                        className="modal-delete-btn"
                        disabled={loading}
                      >
                        {loading ? 'Deleting...' : 'Yes, Delete My Account'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
