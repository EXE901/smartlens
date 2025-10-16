import { useEffect, useState, useMemo, memo, useRef } from "react";
import Particles from "@tsparticles/react";
import { loadFull } from "tsparticles";
import { FaGoogle, FaFacebook } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { signInWithPopup, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth, googleProvider } from '../../firebase/config';
import Footer from '../Footer/Footer';
import "./Login.css";

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
      number: { value: 20 },
      shape: { type: "circle" },
      color: { value: ["rgba(2,0,36,0.3)", "rgba(9,9,121,0.3)", "rgba(0,212,255,0.3)"] },
      opacity: { value: 0.4 },
      size: { value: 300, random: { enable: true, minimumValue: 150 } },
      move: { enable: true, speed: 0.8, direction: "top", outModes: { default: "out" } },
    },
    detectRetina: true,
    style: { filter: "blur(10px)" },
  }), []);

  return init ? <Particles id="tsparticles" options={options} /> : null;
});

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      if (!firebaseUser.emailVerified) {
        setError("❌ Please verify your email before logging in. Check your inbox!");
        await signOut(auth);
        return;
      }

      const response = await fetch(`${API_URL}/signin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const user = await response.json();

      if (response.ok) {
        if (onLogin) onLogin(user);
        navigate("/main");
      } else {
        if (user === 'wrong credentials') {
          setError("❌ Incorrect email or password. Don't have an account? Register below!");
        } else {
          setError("❌ Login failed: " + user);
        }
      }
    } catch (error) {
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        setError("❌ Incorrect email or password.");
      } else if (error.code === 'auth/too-many-requests') {
        setError("❌ Too many failed attempts. Try again later or reset your password.");
      } else {
        setError("❌ Login failed: " + error.message);
      }
    }
  };

  const handleGoogleLogin = async () => {
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
        if (onLogin) onLogin(userData);
        navigate("/main");
      } else {
        setError("❌ Failed to save user data");
      }
    } catch (error) {
      console.error("Google login error:", error);
      setError("❌ Google login failed: " + error.message);
    }
  };

  const handleFacebookLogin = () => {
    setError("⚠️ Facebook login requires deployment. Use Google or email/password for now!");
  };

  return (
    <div className="login-page">
      <ParticlesBackground />
      <form className="login-form" onSubmit={handleSubmit}>
        <h3>Login Here</h3>

        {error ? (
          <div className="error-message">{error}</div>
        ) : (
          <div className="error-placeholder"></div>
        )}

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
          onChange={(e) => setPassword(e.target.value)}
        />

        <div style={{ textAlign: "right", marginTop: "5px" }}>
          <button
            type="button"
            onClick={() => navigate("/forgot-password")}
            style={{
              background: "transparent",
              border: "none",
              color: "#fff",
              cursor: "pointer",
              textDecoration: "underline",
              fontSize: "13px",
              opacity: 0.8
            }}
          >
            Forgot password?
          </button>
        </div>

        <button type="submit">Log In</button>

        <div className="social">
          <div className="go" onClick={handleGoogleLogin} style={{ cursor: 'pointer' }}>
            <FaGoogle /> Google
          </div>
          <div 
            className="fb" 
            onClick={handleFacebookLogin} 
            style={{ cursor: 'pointer', opacity: 0.5, filter: 'grayscale(30%)' }}
          >
            <FaFacebook /> Facebook
          </div>
        </div>

        <div className="register-link" style={{ marginTop: "20px", textAlign: "center" }}>
          <button
            type="button"
            onClick={() => navigate("/register")}
            style={{ 
              background: "transparent", 
              border: "none", 
              color: "#fff", 
              cursor: "pointer", 
              textDecoration: "underline" 
            }}
          >
            New user? Register here
          </button>
        </div>
      </form>
      
      <Footer />
    </div>
  );
};

export default memo(Login);
