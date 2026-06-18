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
  const upcomingSpotlight = recentTrips.find((trip) => getTripStatus(trip).tone !== "completed") || recentTrips[0];
  const dashboardMapQuery = encodeURIComponent(upcomingSpotlight?.destination || "Singapore");
  const dashboardMapUrl = `https://www.google.com/maps?q=${dashboardMapQuery}&output=embed`;
  const dashboardMapLink = `https://www.google.com/maps/search/?api=1&query=${dashboardMapQuery}`;
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
      <section className="dashboard-hero travel-hero reveal">
        <div className="travel-hero__copy">
          <p className="eyebrow">Family dashboard</p>
          <h1>{upcomingSpotlight ? upcomingSpotlight.title : `Welcome${user?.fullName ? `, ${user.fullName}` : ""}.`}</h1>
          <p>
            {upcomingSpotlight
              ? `${upcomingSpotlight.destination} is ready for the next round of planning.`
              : "Plan the next route, keep every day visible, and turn the best moments into a shared family journal."}
          </p>
          <div className="hero-metrics">
            <span><strong>{isLoading ? "..." : stats.upcomingTrips}</strong> upcoming</span>
            <span><strong>{isLoading ? "..." : stats.memories}</strong> memories</span>
            <span><strong>{isLoading ? "..." : stats.plans}</strong> plans</span>
          </div>
        </div>
        <div className="spotlight-card dashboard-next-trip">
          <span className="map-pin">Next up</span>
          {isLoading ? (
            <div className="skeleton"></div>
          ) : upcomingSpotlight ? (
            <>
              <h2>{upcomingSpotlight.title}</h2>
              <p>{upcomingSpotlight.destination}</p>
              <small>{formatTripDateRange(upcomingSpotlight.start_date, upcomingSpotlight.end_date)}</small>
              <div className="command-actions">
                <Link to={`/trips/${upcomingSpotlight.id}`} className="btn btn--primary">Continue planning</Link>
                <Link to="/memories" className="btn btn--secondary">Add memory</Link>
              </div>
            </>
          ) : (
            <>
              <h2>No trip on the horizon yet.</h2>
              <p>Create a trip board and this panel becomes your upcoming spotlight.</p>
              <Link to="/trips" className="btn btn--primary">Create trip</Link>
            </>
          )}
        </div>
      </section>

      <section className="dashboard-widget-strip reveal">
        {[
          ["Trips", stats.trips, "Family boards"],
          ["Plans", stats.plans, "Timeline stops"],
          ["Memories", stats.memories, "Journal entries"],
          ["Done", stats.completedTrips, "Finished trips"],
          ["Next", stats.upcomingTrips, "Upcoming trips"],
        ].map(([label, value, text]) => (
          <div className="travel-widget" key={label}>
            <span>{label}</span>
            <strong>{isLoading ? "..." : value}</strong>
            <div className="widget-track"><i style={{ width: `${Math.min(100, Number(value || 0) * 18 + 18)}%` }}></i></div>
            <small>{text}</small>
          </div>
        ))}
      </section>

      <section className="dashboard-command-grid reveal">
        <article className="command-panel dashboard-map-panel">
          <p className="eyebrow">Planning map</p>
          <h2>{upcomingSpotlight?.destination || "Where the family is headed."}</h2>
          <div className="live-map-frame live-map-frame--dashboard">
            <iframe
              title="Dashboard planning map"
              src={dashboardMapUrl}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            ></iframe>
          </div>
          <a className="btn btn--secondary" href={dashboardMapLink} target="_blank" rel="noreferrer">Open map</a>
        </article>
        <article className="command-panel">
          <p className="eyebrow">Quick actions</p>
          <h2>Jump back into planning.</h2>
          <div className="quick-link-list">
            <Link to={upcomingSpotlight ? `/trips/${upcomingSpotlight.id}` : "/trips"}>Continue planning <span>Open board</span></Link>
            <Link to="/memories">Add memory <span>Open journal</span></Link>
            <Link to="/trips">Create trip <span>New route</span></Link>
            <Link to="/profile">View profile <span>Travel stats</span></Link>
            {user?.role === "admin" ? <Link to="/admin">Admin controls <span>Manage access</span></Link> : null}
          </div>
        </article>
      </section>

      <section className="command-panel reveal">
        <div className="memory-panel-heading">
          <div>
            <p className="eyebrow">Trip spotlight</p>
            <h2>Recent travel boards</h2>
          </div>
          <Link to="/trips" className="btn btn--secondary">View all trips</Link>
        </div>
        <div className="featured-trip-row">
          {isLoading ? (
            <>
              <div className="skeleton"></div>
              <div className="skeleton"></div>
            </>
          ) : recentTrips.length ? (
            recentTrips.map((trip, index) => {
              const status = getTripStatus(trip);

              return (
                <Link to={`/trips/${trip.id}`} className={`summary-card trip-summary-card image-card image-card--${index % 4}`} key={trip.id}>
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

      <section className="memory-dashboard dashboard-memory-strip reveal">
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
            <div className="photo-memory-strip">
              {recentMemories.map((memory) => (
                <Link to="/memories" className="photo-memory" key={memory.id}>
                  <span>{memory.trip_title || "Travel memory"}</span>
                  <strong>{memory.title}</strong>
                  <small>{memory.story}</small>
                </Link>
              ))}
              <Link to="/memories" className="photo-memory photo-memory--feature">
                <span>Favourite</span>
                <strong>{favouriteMemory?.title || latestMemory?.title}</strong>
                <small>{favouriteMemory?.story || latestMemory?.story}</small>
              </Link>
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
        <Link to="/trips" className="feature-card travel-action-card">
          <div className="feature-badge">01</div>
          <h3>Add or browse trips</h3>
          <p>Create trips, review countdowns, and open each itinerary.</p>
        </Link>
        <Link to="/memories" className="feature-card travel-action-card">
          <div className="feature-badge">02</div>
          <h3>Open memory wall</h3>
          <p>Save stories with media URLs or filename notes until real upload storage is ready.</p>
        </Link>
        {user?.role === "admin" ? (
          <Link to="/admin" className="feature-card travel-action-card">
            <div className="feature-badge">03</div>
            <h3>Open admin panel</h3>
            <p>Manage users, invite codes, settings, and audit logs.</p>
          </Link>
        ) : null}
      </section>
    </AppShell>
  );
}

export default Dashboard;
