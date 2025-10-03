// import React, { useState } from "react";
// import "./Signup.css";

// export default function Signup() {
//   const [username, setUsername] = useState("");
//   const [password, setPassword] = useState("");
//   const [message, setMessage] = useState("");

//   const handleSignup = async () => {
//     try {
//       const res = await fetch("/api/signup", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ username, password }),
//       });
//       const data = await res.json().catch(() => ({}));
//       if (!res.ok) {
//         setMessage(data.message || "Signup failed");
//       } else {
//         setMessage(data.message);
//       }
//     } catch (err) {
//       setMessage("Network error");
//     }
//   };

//   return (
//     <div className="signup-page">
//       <div className="signup-box">
//         <div className="fb-logo">facebook</div>
//         <h2>Create a new account</h2>
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
//         <button onClick={handleSignup}>Sign Up</button>
//         {message && <div className="message">{message}</div>}
//       </div>
//     </div>
//   );
// }

import React, { useState } from "react";
import { useNavigate } from 'react-router-dom';
import { useToast } from './components/ToastProvider';
import "./Signup.css";

export default function Signup() {
  const [formData, setFormData] = useState({
    firstName: "",
    surname: "",
    email: "",
    password: "",
    dob: "",
    gender: ""
  });

  const navigate = useNavigate();
  const { notify } = useToast();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        notify('error', data.message || 'Signup failed');
      } else {
        // Persist auth and redirect to home
        if (data.token) localStorage.setItem('token', data.token);
        if (data.username) localStorage.setItem('username', data.username);
        notify('success', 'Account created successfully');
        navigate('/');
      }
    } catch (err) {
      notify('error', 'Network error');
    }
  };

  return (
    <div className="signup-root">
      <div className="signup-page">
        <div className="signup-box">
          <div className="fb-logo">facebook</div>
          <div className="signup-welcome">
            <h2>Create a new account</h2>
            <p>It’s quick and easy.</p>
          </div>
          <form onSubmit={handleSignup} autoComplete="off">
            <div className="name-fields">
              <div>
                <input
                  type="text"
                  name="firstName"
                  placeholder="First name"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <input
                  type="text"
                  name="surname"
                  placeholder="Surname"
                  value={formData.surname}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
          <input
            type="text"
            name="email"
            placeholder="Mobile number or email address"
            value={formData.email}
            onChange={handleChange}
            required
          />
          <input
            type="password"
            name="password"
            placeholder="New password"
            value={formData.password}
            onChange={handleChange}
            required
          />
          <label>Date of birth</label>
          <input
            type="date"
            name="dob"
            value={formData.dob}
            onChange={handleChange}
            required
          />
          <label>Gender</label>
          <div className="gender-options">
            <label>
              <input
                type="radio"
                name="gender"
                value="Female"
                checked={formData.gender === "Female"}
                onChange={handleChange}
                required
              />
              Female
            </label>
            <label>
              <input
                type="radio"
                name="gender"
                value="Male"
                checked={formData.gender === "Male"}
                onChange={handleChange}
                required
              />
              Male
            </label>
            <label>
              <input
                type="radio"
                name="gender"
                value="Custom"
                checked={formData.gender === "Custom"}
                onChange={handleChange}
                required
              />
              Custom
            </label>
          </div>
          <button type="submit" className="signup-btn">Sign Up</button>
          <div className="already-account">
            Already have an account? <a href="/login">Log in</a>
          </div>
          <div className="privacy-note">
            By clicking Sign Up, you agree to our Terms, Privacy Policy and Cookies Policy.
          </div>
          </form>
        </div>
      </div>
    </div>
  );
}
