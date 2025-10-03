// import React, { useState } from "react";
// import "./Login.css";

// export default function Login({ setLoggedInUsername }) {
//   const [username, setUsername] = useState("");
//   const [password, setPassword] = useState("");
//   const [message, setMessage] = useState("");

//   const handleLogin = async () => {
//     try {
//       const res = await fetch("/api/login", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ username, password }),
//       });
//       const data = await res.json();
//       if (res.ok) {
//         setMessage(data.message);
//         setLoggedInUsername && setLoggedInUsername(username);
//       } else {
//         setMessage(data.message || "Login failed");
//       }
//     } catch (err) {
//       setMessage("Network error");
//     }
//   };

//   return (
//     <div className="login-page">
//       <div className="login-box">
//         <div className="fb-logo">facebook</div>
//         <h2>Login to Mini Facebook</h2>
//         <input
//           type="text"
//           placeholder="Username"
//           value={username}
//           onChange={e => setUsername(e.target.value)}
//         />
//         <input
//           type="password"
//           placeholder="Password"
//           value={password}
//           onChange={e => setPassword(e.target.value)}
//         />
//         <button onClick={handleLogin}>Login</button>
//         {message && <div className="message">{message}</div>}
//       </div>
//     </div>
//   );
// }

import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";  // ✅ Added import
import { useToast } from "./components/ToastProvider";
import { t } from './components/i18n';
import "./Login.css";

export default function Login({ setLoggedInUsername }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();
  const { notify } = useToast();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage(data.message || t('login.failed'));
        notify('error', data.message || t('login.failed'));
      } else {
        // Save token & username for authenticated requests
        if (data.token) localStorage.setItem('token', data.token);
        if (data.username) localStorage.setItem('username', data.username);
        if (data.username && typeof setLoggedInUsername === 'function') {
          setLoggedInUsername(data.username);
        }
        setMessage(t('login.success'));
        notify('success', t('login.success'));
        // Redirect to home after a short delay
        setTimeout(() => navigate('/'), 300);
      }
    } catch (err) {
      setMessage(t('errors.network'));
      notify('error', t('errors.network'));
    }
  };

  return (
    <div className="container flex">
      <div className="facebook-page flex">
        <div className="text">
          <h1>{t('login.hero_title')}</h1>
          <p>{t('login.hero_line1')}</p>
          <p>{t('login.hero_line2')}</p>
        </div>
        <form onSubmit={handleLogin}>
          <h2 style={{marginTop: 0, marginBottom: 12, fontSize: '1.5rem'}}>{t('login.title')}</h2>
          <input
            type="email"
            placeholder={t('login.email_placeholder')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder={t('login.password_placeholder')}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <div className="link">
            <button type="submit" className="login">{t('login.submit')}</button>
            <a href="#" className="forgot">{t('login.forgot')}</a>
          </div>
          <hr />
          <div className="button">
            {/* ✅ Changed to Link */}
            <Link to="/signup">{t('login.create_account')}</Link>
          </div>
          <div style={{textAlign: 'center', color: '#65676B', fontSize: '.9rem'}}>{t('login.footer_note')}</div>
          {message && <p className="message">{message}</p>}
        </form>
      </div>
    </div>
  );
}
