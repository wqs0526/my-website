import { useEffect, useState } from "react";
import { apiRequest } from "../api";
import AppShell from "../components/AppShell";
import useCurrentUser from "../hooks/useCurrentUser";

function Profile() {
  const { user } = useCurrentUser();
  const [stats, setStats] = useState({
    trips: 0,
    memories: 0,
    activities: 0,
    completedTrips: 0,
    upcomingTrips: 0,
  });

  useEffect(() => {
    apiRequest("/api/profile/stats")
      .then((data) => setStats(data.stats))
      .catch(() => {});
  }, []);

  return (
    <AppShell user={user}>
      <section className="app-header">
        <p className="eyebrow">Profile</p>
        <h1>{user?.fullName || "Your profile"}</h1>
        <p>Your personal TravelSync overview, family access details, and travel story so far.</p>
      </section>

      <section className="profile-hero profile-hero--premium reveal">
        <div>
          <p className="eyebrow">Family traveller</p>
          <h2>{user?.fullName || "TravelSync member"}</h2>
          <p>
            You have planned {stats.trips} trips, saved {stats.memories} memories,
            and added {stats.activities} itinerary moments.
          </p>
        </div>
        <div className="profile-summary-pill">
          <strong>{stats.upcomingTrips}</strong>
          <span>Upcoming</span>
        </div>
      </section>

      <section className="profile-stat-grid reveal">
        <article className="metric-card">
          <span className="stat-label">Trip Count</span>
          <strong className="metric-value">{stats.trips}</strong>
          <p>Trips you created.</p>
        </article>
        <article className="metric-card">
          <span className="stat-label">Memory Count</span>
          <strong className="metric-value">{stats.memories}</strong>
          <p>Stories you preserved.</p>
        </article>
        <article className="metric-card">
          <span className="stat-label">Completed</span>
          <strong className="metric-value">{stats.completedTrips}</strong>
          <p>Your finished adventures.</p>
        </article>
        <article className="metric-card">
          <span className="stat-label">Activities</span>
          <strong className="metric-value">{stats.activities}</strong>
          <p>Plans and notes you added.</p>
        </article>
      </section>

      <section className="panel profile-panel reveal">
        <div className="profile-grid">
          <div className="profile-item">
            <strong>Email</strong>
            <p>{user?.email}</p>
          </div>
          <div className="profile-item">
            <strong>Phone</strong>
            <p>+65 {user?.phone}</p>
          </div>
          <div className="profile-item">
            <strong>Role</strong>
            <p>{user?.role}</p>
          </div>
          <div className="profile-item">
            <strong>Invitation code used</strong>
            <p>{user?.inviteCode}</p>
          </div>
        </div>
      </section>
    </AppShell>
  );
}

export default Profile;
