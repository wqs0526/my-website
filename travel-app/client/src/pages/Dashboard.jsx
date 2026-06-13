import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiRequest } from "../api";
import AppShell from "../components/AppShell";
import useCurrentUser from "../hooks/useCurrentUser";
import { formatTripDateRange, getTripStatus } from "../utils/tripStatus";

function Dashboard() {
  const { user } = useCurrentUser();
  const [stats, setStats] = useState({
    trips: 0,
    memories: 0,
    plans: 0,
    completedTrips: 0,
    upcomingTrips: 0,
  });
  const [recentTrips, setRecentTrips] = useState([]);
  const [memories, setMemories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([apiRequest("/api/dashboard"), apiRequest("/api/trips"), apiRequest("/api/memories")])
      .then(([dashboardData, tripData, memoryData]) => {
        setStats(dashboardData.stats);
        setRecentTrips(tripData.trips.slice(0, 4));
        setMemories(memoryData.memories || []);
      })
      .catch(() => {
        setRecentTrips([]);
        setMemories([]);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const latestMemory = memories[0];
  const favouriteMemory = memories.reduce((favorite, memory) => {
    const score =
      Number(memory.love_count || 0) +
      Number(memory.funny_count || 0) +
      Number(memory.beautiful_count || 0) +
      Number(memory.emotional_count || 0);
    const favoriteScore =
      Number(favorite?.love_count || 0) +
      Number(favorite?.funny_count || 0) +
      Number(favorite?.beautiful_count || 0) +
      Number(favorite?.emotional_count || 0);

    return score > favoriteScore ? memory : favorite;
  }, null);
  const recentMemories = memories.slice(0, 3);
  const today = new Date();
  const anniversaryMemories = memories.filter((memory) => {
    if (!memory.memory_date) return false;
    const memoryDate = new Date(memory.memory_date);
    return (
      memoryDate.getMonth() === today.getMonth() &&
      memoryDate.getDate() === today.getDate() &&
      memoryDate.getFullYear() < today.getFullYear()
    );
  });

  return (
    <AppShell user={user}>
      <section className="app-header">
        <p className="eyebrow">Family dashboard</p>
        <h1>Welcome{user?.fullName ? `, ${user.fullName}` : ""}.</h1>
        <p>Plan upcoming trips, keep day-by-day details clear, and save memories in one shared family space.</p>
      </section>

      <section className="command-panel reveal">
        <p className="eyebrow">Travel command center</p>
        <h2>Everything your family is building together.</h2>
        <div className="summary-grid">
          {isLoading ? (
            <>
              <div className="skeleton"></div>
              <div className="skeleton"></div>
            </>
          ) : recentTrips.length ? (
            recentTrips.map((trip) => {
              const status = getTripStatus(trip);

              return (
                <Link to={`/trips/${trip.id}`} className="summary-card trip-summary-card" key={trip.id}>
                  <span className={`trip-status trip-status--${status.tone}`}>{status.label}</span>
                  <strong>{trip.title}</strong>
                  <p>{trip.destination}</p>
                  <small>{formatTripDateRange(trip.start_date, trip.end_date)}</small>
                  <span className="countdown-pill">{status.countdown}</span>
                </Link>
              );
            })
          ) : (
            <div className="empty-state">
              <strong>Start planning your first adventure.</strong>
              <p>Create a family trip board to bring this command center to life.</p>
            </div>
          )}
        </div>
      </section>

      <section className="dashboard-stats reveal">
        <article className="metric-card">
          <span className="stat-label">Total Trips</span>
          <strong className="metric-value">{isLoading ? "..." : stats.trips}</strong>
          <p>Family trip boards created.</p>
        </article>
        <article className="metric-card">
          <span className="stat-label">Total Activities</span>
          <strong className="metric-value">{isLoading ? "..." : stats.plans}</strong>
          <p>Day-by-day places, reminders, and notes.</p>
        </article>
        <article className="metric-card">
          <span className="stat-label">Total Memories</span>
          <strong className="metric-value">{isLoading ? "..." : stats.memories}</strong>
          <p>Stories, photo links, and video references.</p>
        </article>
        <article className="metric-card">
          <span className="stat-label">Completed Trips</span>
          <strong className="metric-value">{isLoading ? "..." : stats.completedTrips}</strong>
          <p>Adventures already added to the family story.</p>
        </article>
        <article className="metric-card">
          <span className="stat-label">Upcoming Trips</span>
          <strong className="metric-value">{isLoading ? "..." : stats.upcomingTrips}</strong>
          <p>Trips still waiting on the calendar.</p>
        </article>
      </section>

      <section className="anniversary-panel reveal">
        <div className="memory-panel-heading">
          <div>
            <p className="eyebrow">Anniversary memories</p>
            <h2>On this day in family travel</h2>
          </div>
          <Link to="/memories" className="btn btn--secondary">View all memories</Link>
        </div>
        {anniversaryMemories.length ? (
          <div className="anniversary-grid">
            {anniversaryMemories.slice(0, 3).map((memory) => (
              <Link to="/memories" className="anniversary-card" key={memory.id}>
                <span className="stat-label">On this day last year...</span>
                <strong>{memory.title}</strong>
                <p>{memory.trip_title ? `Remember your ${memory.trip_title} trip?` : memory.story}</p>
              </Link>
            ))}
          </div>
        ) : (
          <div className="empty-state anniversary-empty">
            <strong>No anniversaries today.</strong>
            <p>As your album grows, TravelSync will bring old family moments back on the right day.</p>
          </div>
        )}
      </section>

      <section className="memory-dashboard reveal">
        <div className="memory-panel-heading">
          <div>
            <p className="eyebrow">Memory highlights</p>
            <h2>Recent family moments</h2>
          </div>
          <Link to="/memories" className="btn btn--secondary">Open album</Link>
        </div>
        {isLoading ? (
          <div className="summary-grid">
            <div className="skeleton"></div>
            <div className="skeleton"></div>
          </div>
        ) : memories.length ? (
          <>
            <div className="memory-highlight-grid">
              <Link to="/memories" className="memory-highlight-card">
                <span className="stat-label">Latest memory</span>
                <strong>{latestMemory?.title}</strong>
                <p>{latestMemory?.trip_title || "General family memories"}</p>
              </Link>
              <Link to="/memories" className="memory-highlight-card">
                <span className="stat-label">Favourite memory</span>
                <strong>{favouriteMemory?.title || latestMemory?.title}</strong>
                <p>{favouriteMemory?.story || latestMemory?.story}</p>
              </Link>
            </div>
            <div className="recent-memory-row">
              {recentMemories.map((memory) => (
                <Link to="/memories" className="recent-memory-chip" key={memory.id}>
                  <strong>{memory.title}</strong>
                  <span>{memory.trip_title || "General memory"}</span>
                </Link>
              ))}
            </div>
          </>
        ) : (
          <div className="empty-state">
            <strong>Capture your first family memory.</strong>
            <p>Your travel stories will appear here.</p>
          </div>
        )}
      </section>

      <section className="quick-actions reveal">
        <Link to="/trips" className="feature-card">
          <div className="feature-badge">T</div>
          <h3>Add or browse trips</h3>
          <p>Create trips, review countdowns, and open each itinerary.</p>
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
