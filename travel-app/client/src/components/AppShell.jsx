import { NavLink, useNavigate } from "react-router-dom";
import { clearToken } from "../api";

function AppShell({ children, user }) {
  const navigate = useNavigate();

  const signOut = () => {
    clearToken();
    navigate("/login");
  };

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <NavLink to="/" className="navbar__logo">
          <span className="logo-mark">TS</span>
          <span className="logo-text">TravelSync</span>
        </NavLink>

        <nav className="app-nav">
          <NavLink to="/dashboard">Dashboard</NavLink>
          <NavLink to="/trips">Trips</NavLink>
          <NavLink to="/memories">Memories</NavLink>
          <NavLink to="/profile">Profile</NavLink>
          {user?.role === "admin" ? <NavLink to="/admin">Admin</NavLink> : null}
        </nav>

        <div className="app-user">
          <strong>{user?.fullName || "Family member"}</strong>
          <span>{user?.role || "member"}</span>
          <button type="button" className="btn btn--secondary" onClick={signOut}>
            Sign out
          </button>
        </div>
      </aside>

      <main className="app-content">{children}</main>
    </div>
  );
}

export default AppShell;
