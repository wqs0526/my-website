import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiRequest } from "../api";
import AppShell from "../components/AppShell";
import useCurrentUser from "../hooks/useCurrentUser";

function Dashboard() {
  const { user } = useCurrentUser();
  const [stats, setStats] = useState({ trips: 0, memories: 0, plans: 0 });

  useEffect(() => {
    apiRequest("/api/dashboard").then((data) => setStats(data.stats));
  }, []);

  return (
    <AppShell user={user}>
      <section className="app-header">
        <p className="eyebrow">Family dashboard</p>
        <h1>Welcome{user?.fullName ? `, ${user.fullName}` : ""}.</h1>
        <p>Plan upcoming trips, keep day-by-day details clear, and save memories in one shared family space.</p>
      </section>

      <section className="dashboard-stats">
        <article className="stat-card">
          <span className="stat-label">Trips</span>
          <h3>{stats.trips}</h3>
          <p>Family trip boards created.</p>
        </article>
        <article className="stat-card">
          <span className="stat-label">Plans</span>
          <h3>{stats.plans}</h3>
          <p>Day-by-day places, reminders, and notes.</p>
        </article>
        <article className="stat-card">
          <span className="stat-label">Memories</span>
          <h3>{stats.memories}</h3>
          <p>Stories, photo links, and video references.</p>
        </article>
      </section>

      <section className="quick-actions">
        <Link to="/trips" className="feature-card">
          <div className="feature-badge">T</div>
          <h3>Open trip board</h3>
          <p>Create trips, add days, and break plans down into easy-to-read items.</p>
        </Link>
        <Link to="/memories" className="feature-card">
          <div className="feature-badge">M</div>
          <h3>Open memory wall</h3>
          <p>Save stories with media URLs or filename notes until real upload storage is ready.</p>
        </Link>
        {user?.role === "admin" ? (
          <Link to="/admin" className="feature-card">
            <div className="feature-badge">A</div>
            <h3>Open admin panel</h3>
            <p>Manage users, invite codes, settings, and audit logs.</p>
          </Link>
        ) : null}
      </section>
    </AppShell>
  );
}

export default Dashboard;
