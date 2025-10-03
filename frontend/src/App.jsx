// import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
// import Signup from "./Signup";
// import Login from "./Login";
// import Profile from "./Profile";

// export default function App() {
//   return (
//     <Router>
//       <nav style={{ padding: "10px", background: "#eee" }}>
//         <Link to="/signup" style={{ margin: "0 10px" }}>Signup</Link>
//         <Link to="/login" style={{ margin: "0 10px" }}>Login</Link>
//         <Link to="/profile" style={{ margin: "0 10px" }}>Profile</Link>
//       </nav>

//       <Routes>
//         <Route path="/signup" element={<Signup />} />
//         <Route path="/login" element={<Login />} />
//         <Route path="/profile" element={<Profile />} />
//       </Routes>
//     </Router>
//   );
// }

import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import MediaGallery from "./components/MediaGallery";
import Signup from "./Signup";
import Login from "./Login";
import Profile from "./Profile";
import Header from "./components/Header";
import Home from "./pages/Home";
import Footer from "./components/Footer";
import Messenger from "./pages/Messenger";
import Groups from "./pages/Groups";
import Watch from "./pages/Watch";
import Marketplace from "./pages/Marketplace";
import { ToastProvider } from "./components/ToastProvider";

export default function App() {
  const [loggedInUsername, setLoggedInUsername] = useState("");
  useEffect(() => {
    const u = localStorage.getItem('username') || '';
    setLoggedInUsername(u);
  }, []);

  return (
    <Router>
      <ToastProvider>
        <Header />

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/messenger" element={<Messenger />} />
          <Route path="/groups" element={<Groups />} />
          <Route path="/watch" element={<Watch />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/gallery" element={<MediaGallery />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login setLoggedInUsername={setLoggedInUsername} />} />
          <Route path="/profile" element={<Profile username={loggedInUsername} />} />
        </Routes>

        <Footer />
      </ToastProvider>
    </Router>
  );
}
