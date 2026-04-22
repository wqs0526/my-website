import { useState } from "react";
import { Link } from "react-router-dom";

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  const closeMenu = () => {
    setIsOpen(false);
  };

  return (
    <header className="navbar sticky-top">
      <div className="container-xxl">
        <div className="navbar__bar">
          <Link to="/" className="navbar__logo" onClick={closeMenu}>
            <span className="logo-mark">TS</span>
            <span className="logo-text">TravelSync</span>
          </Link>

          <nav className="navbar__links navbar__links--desktop d-none d-lg-flex align-items-center">
            <a href="#home">Home</a>
            <a href="#memories">Memories</a>
            <a href="#trip-board">Trip Board</a>
          </nav>

          <div className="navbar__actions navbar__actions--desktop d-none d-lg-flex align-items-center gap-2">
            <Link to="/login" className="btn btn--ghost">
              Sign in
            </Link>
            <Link to="/register" className="btn btn--primary">
              Family access
            </Link>
          </div>

          <button
            type="button"
            className="navbar__toggle d-lg-none"
            onClick={() => setIsOpen((open) => !open)}
            aria-expanded={isOpen}
            aria-controls="mobile-navigation"
            aria-label="Toggle navigation"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>

        <div
          id="mobile-navigation"
          className={`navbar__mobile-menu d-lg-none ${isOpen ? "is-open" : ""}`}
        >
          <nav className="navbar__mobile-links">
            <a href="#home" onClick={closeMenu}>
              Home
            </a>
            <a href="#memories" onClick={closeMenu}>
              Memories
            </a>
            <a href="#trip-board" onClick={closeMenu}>
              Trip Board
            </a>
          </nav>

          <div className="navbar__mobile-actions">
            <Link to="/login" className="btn btn--ghost" onClick={closeMenu}>
              Sign in
            </Link>
            <Link to="/register" className="btn btn--primary" onClick={closeMenu}>
              Family access
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
