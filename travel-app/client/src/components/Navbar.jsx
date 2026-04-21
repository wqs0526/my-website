import { Link } from "react-router-dom";

function Navbar() {
  return (
    <header className="navbar">
      <div className="navbar__logo">
        <span className="logo-mark">✈</span>
        <span className="logo-text">TravelSync</span>
      </div>

      <nav className="navbar__links">
        <a href="#features">Features</a>
        <a href="#collaboration">Collaboration</a>
        <a href="#plan">Plan</a>
      </nav>

      <div className="navbar__actions">
        <Link to="/login" className="btn btn--ghost">
          Login
        </Link>
        <Link to="/register" className="btn btn--primary">
          Get Started
        </Link>
      </div>
    </header>
  );
}

export default Navbar;