import { useEffect, useState, useMemo, memo, useRef } from "react";
import Particles from "@tsparticles/react";
import { loadFull } from "tsparticles";
import { FaGoogle, FaFacebook } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword, sendEmailVerification, signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../../firebase/config';
import Footer from '../Footer/Footer';
import "./Register.css";

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
    fullScreen: { enable: true, zIndex: 0 },
    background: { color: "transparent" },
    particles: {
      number: { value: 10 },
      shape: { type: "circle" },
      color: { value: ["rgba(2,0,36,0.3)", "rgba(9,9,121,0.3)", "rgba(0,212,255,0.3)"] },
      opacity: { value: 0.4 },
      size: { value: 500, random: { enable: true, minimumValue: 150 } },
      move: { enable: true, speed: 0.3, direction: "top", outModes: { default: "out" } },
    },
    detectRetina: true,
    style: { filter: "blur(20px)" },
  }), []);

  return init ? (
    <Particles 
      id="tsparticles" 
      options={options}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        filter: "blur(10px)",
        WebkitFilter: "blur(10px)",
        zIndex: -1,
        pointerEvents: "none"
      }}
    />
  ) : null;
});

const Register = ({ onRegister }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [passwordStrength, setPasswordStrength] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false
  });
  const navigate = useNavigate();

  const validatePassword = (pass) => {
    setPasswordStrength({
      length: pass.length >= 8,
      uppercase: /[A-Z]/.test(pass),
      lowercase: /[a-z]/.test(pass),
      number: /[0-9]/.test(pass),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(pass)
    });
  };

  const isPasswordStrong = () => {
    return Object.values(passwordStrength).every(v => v === true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!name || !email || !password || !confirmPassword) {
      setError("❌ Please fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
      setError("❌ Passwords do not match!");
      return;
    }

    if (!isPasswordStrong()) {
      setError("❌ Password does not meet security requirements");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await sendEmailVerification(userCredential.user);

      const response = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, password })
      });

      const user = await response.json();

      if (response.ok) {
        setSuccess("✅ Registration successful! Please check your email (including spam folder) to verify your account.");
        setTimeout(() => navigate("/login"), 4000);
      } else {
        setError("❌ Registration failed: " + user);
      }
    } catch (error) {
      console.error("Registration error:", error);
      if (error.code === 'auth/email-already-in-use') {
        setError("❌ Email already registered. Try logging in instead!");
      } else if (error.code === 'auth/weak-password') {
        setError("❌ Password is too weak.");
      } else {
        setError("❌ Registration failed: " + error.message);
      }
    }
  };

  const handleGoogleRegister = async () => {
    try {
      setError("");
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      const response = await fetch(`${API_URL}/oauth-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          name: user.displayName,
          provider: 'google'
        })
      });

      const userData = await response.json();
      
      if (response.ok) {
        if (onRegister) onRegister(userData);
        navigate("/main");
      } else {
        setError("❌ Failed to save user data");
      }
    } catch (error) {
      console.error("Google register error:", error);
      setError("❌ Google registration failed: " + error.message);
    }
  };

  const handleFacebookRegister = () => {
    setError("⚠️ Facebook registration requires deployment. Use Google or email/password for now!");
  };

  return (
    <div className="register-page">
      <ParticlesBackground />
      <form className="register-form" onSubmit={handleSubmit}>
        <h3>Register Here</h3>

        {error ? (
          <div className="error-message">{error}</div>
        ) : success ? (
          <div className="success-message">{success}</div>
        ) : (
          <div className="error-placeholder"></div>
        )}

        <label htmlFor="name">Full Name</label>
        <input
          type="text"
          placeholder="Full Name"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <label htmlFor="email">Email</label>
        <input
          type="email"
          placeholder="Email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <label htmlFor="password">Password</label>
        <input
          type="password"
          placeholder="Password"
          id="password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            validatePassword(e.target.value);
          }}
        />

        {password && (
          <div className="password-strength">
            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)', marginTop: '0', marginBottom: '8px' }}>
              Password must contain:
            </p>
            <div className={`strength-item ${passwordStrength.length ? 'valid' : ''}`}>
              {passwordStrength.length ? '✓' : '×'} At least 8 characters
            </div>
            <div className={`strength-item ${passwordStrength.uppercase ? 'valid' : ''}`}>
              {passwordStrength.uppercase ? '✓' : '×'} One uppercase letter (A-Z)
            </div>
            <div className={`strength-item ${passwordStrength.lowercase ? 'valid' : ''}`}>
              {passwordStrength.lowercase ? '✓' : '×'} One lowercase letter (a-z)
            </div>
            <div className={`strength-item ${passwordStrength.number ? 'valid' : ''}`}>
              {passwordStrength.number ? '✓' : '×'} One number (0-9)
            </div>
            <div className={`strength-item ${passwordStrength.special ? 'valid' : ''}`}>
              {passwordStrength.special ? '✓' : '×'} One special character (!@#$%...)
            </div>
          </div>
        )}

        <label htmlFor="confirmPassword">Confirm Password</label>
        <input
          type="password"
          placeholder="Confirm Password"
          id="confirmPassword"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />

        <button type="submit">Register</button>

        <div className="social">
          <div className="go" onClick={handleGoogleRegister} style={{ cursor: 'pointer' }}>
            <FaGoogle /> Google
          </div>
          <div 
            className="fb" 
            onClick={handleFacebookRegister} 
            style={{ cursor: 'pointer', opacity: 0.5, filter: 'grayscale(30%)' }}
          >
            <FaFacebook /> Facebook
          </div>
        </div>

        <div className="login-link" style={{ marginTop: "20px", textAlign: "center" }}>
          <button
            type="button"
            onClick={() => navigate("/login")}
            style={{ 
              background: "transparent", 
              border: "none", 
              color: "#fff", 
              cursor: "pointer", 
              textDecoration: "underline" 
            }}
          >
            Already have an account? Login here
          </button>
        </div>
      </form>
      
      <Footer />
    </div>
  );
};

export default memo(Register);
