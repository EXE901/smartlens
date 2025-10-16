import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../firebase/config';
import "../Login/Login.css"; 

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email) {
      setError("Please enter your email address");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      setSuccess("✅ Password reset email sent! Check your inbox.");
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        setError("❌ No account found with this email.");
      } else if (error.code === 'auth/invalid-email') {
        setError("❌ Invalid email address.");
      } else {
        setError("❌ Failed to send reset email: " + error.message);
      }
    }
  };

  return (
    <div className="login-page">
      <form className="login-form" onSubmit={handleSubmit}>
        <h3>Reset Password</h3>

        {error ? (
          <div className="error-message">{error}</div>
        ) : success ? (
          <div className="success-message">{success}</div>
        ) : (
          <div className="error-placeholder"></div>
        )}

        <label htmlFor="email">Email</label>
        <input
          type="email"
          placeholder="Enter your email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <button type="submit">Send Reset Link</button>

        <div className="register-link" style={{ marginTop: "20px", textAlign: "center" }}>
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
            Back to Login
          </button>
        </div>
      </form>
    </div>
  );
};

export default ForgotPassword;
