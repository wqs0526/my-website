import { NavLink, useNavigate } from "react-router-dom";
import { clearToken } from "../api";

function AppShell({ children, user }) {
  const navigate = useNavigate();

  const signOut = () => {
    clearToken();
    navigate("/login");
  };

  return (
    <div className="app-shell app-layout">
      <aside className="app-sidebar sidebar">
        <NavLink to="/" className="navbar__logo">
          <span className="logo-mark">TS</span>
          <span className="logo-text">TravelSync</span>
        </NavLink>

        <nav className="app-nav">
          <NavLink to="/dashboard"><span>D</span>Dashboard</NavLink>
          <NavLink to="/trips"><span>T</span>Trips</NavLink>
          <NavLink to="/memories"><span>M</span>Memories</NavLink>
          <NavLink to="/profile"><span>P</span>Profile</NavLink>
          {user?.role === "admin" ? <NavLink to="/admin"><span>A</span>Admin</NavLink> : null}
        </nav>

        <div className="app-user">
          <strong>{user?.fullName || "Family member"}</strong>
          <span>{user?.role || "member"}</span>
          <button type="button" className="btn btn--secondary" onClick={signOut}>
            Sign out
          </button>
        </div>
      </aside>

      <main className="app-content main-content">{children}</main>
    </div>
  );
}

export default AppShell;
