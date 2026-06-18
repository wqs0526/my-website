import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiRequest } from "../api";
import AppShell from "../components/AppShell";
import useCurrentUser from "../hooks/useCurrentUser";
import { formatTripDateRange, getTripStatus } from "../utils/tripStatus";

const blankTrip = { title: "", destination: "", startDate: "", endDate: "", notes: "" };

function Trips() {
  const { user } = useCurrentUser();
  const [trips, setTrips] = useState([]);
  const [form, setForm] = useState(blankTrip);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [filter, setFilter] = useState("all");

  const loadTrips = async () => {
    setIsLoading(true);

    try {
      const data = await apiRequest("/api/trips");
      setTrips(data.trips || []);
      setMessage("");
      return data.trips || [];
    } catch (error) {
      setMessage(error.message);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTrips();
  }, []);

  const saveTrip = async (event) => {
    event.preventDefault();
    setMessage("");
    setIsSaving(true);
    const body = JSON.stringify(form);

    try {
      if (editingId) {
        await apiRequest(`/api/trips/${editingId}`, { method: "PUT", body });
      } else {
        await apiRequest("/api/trips", { method: "POST", body });
      }
      setForm(blankTrip);
      setEditingId(null);
      await loadTrips();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const startEdit = (trip) => {
    setEditingId(trip.id);
    setForm({
      title: trip.title || "",
      destination: trip.destination || "",
      startDate: trip.start_date?.slice(0, 10) || "",
      endDate: trip.end_date?.slice(0, 10) || "",
      notes: trip.notes || "",
    });
  };

  const deleteTrip = async (trip) => {
    if (!window.confirm(`Delete ${trip.title}?`)) return;
    await apiRequest(`/api/trips/${trip.id}`, { method: "DELETE" });
    await loadTrips();
  };

  const featuredTrips = trips.slice(0, 3);
  const filteredTrips = trips.filter((trip) => {
    const status = getTripStatus(trip);
    if (filter === "upcoming") return status.tone === "upcoming" || status.tone === "active";
    if (filter === "past") return status.tone === "completed";
    if (filter === "draft") return status.tone === "planning";
    if (filter === "shared") return true;
    return true;
  });
  const featuredTrip = featuredTrips[0];
  const upcomingTrips = trips.filter((trip) => getTripStatus(trip).tone !== "completed");
  const tripsMapQuery = encodeURIComponent(featuredTrip?.destination || trips[0]?.destination || "Singapore");
  const tripsMapUrl = `https://www.google.com/maps?q=${tripsMapQuery}&output=embed`;
  const tripsMapLink = `https://www.google.com/maps/search/?api=1&query=${tripsMapQuery}`;

  return (
    <AppShell user={user}>
      <section className="travel-hero trips-hero reveal">
        <div className="travel-hero__copy">
          <p className="eyebrow">Trip board</p>
          <h1>{featuredTrip ? featuredTrip.title : "Plan the family trips day by day."}</h1>
          <p>{featuredTrip ? `${featuredTrip.destination} anchors your trip library. Open it, adjust the route, or add another destination.` : "Create trip boards, keep dates visible, and open each itinerary when the details matter."}</p>
          {featuredTrip ? <Link to={`/trips/${featuredTrip.id}`} className="btn btn--primary">Open featured trip</Link> : null}
        </div>
        <div className="map-preview-card">
          <span className="map-pin">Map preview</span>
          <div className="live-map-frame live-map-frame--hero">
            <iframe
              title="Trips map preview"
              src={tripsMapUrl}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            ></iframe>
          </div>
          <a className="btn btn--secondary" href={tripsMapLink} target="_blank" rel="noreferrer">Open map</a>
        </div>
      </section>

      {featuredTrips.length ? (
        <section className="featured-carousel destination-rail reveal">
          <div className="memory-panel-heading">
            <div>
              <p className="eyebrow">Destination rail</p>
              <h2>Browse like a trip library</h2>
            </div>
          </div>
          <div className="featured-trip-row">
            {featuredTrips.map((trip, index) => {
              const status = getTripStatus(trip);

              return (
                <Link to={`/trips/${trip.id}`} className={`feature-destination image-card image-card--${index % 4}`} key={trip.id}>
                  <span className={`trip-status trip-status--${status.tone}`}>{status.label}</span>
                  <h3>{trip.title}</h3>
                  <p>{trip.destination}</p>
                  <small>{formatTripDateRange(trip.start_date, trip.end_date)}</small>
                </Link>
              );
            })}
          </div>
        </section>
      ) : null}

      <div className="workspace-grid trips-workspace">
        <form className="panel form-grid sticky-planner" onSubmit={saveTrip}>
          <h2>{editingId ? "Edit trip" : "Create trip"}</h2>
          {message ? <p className="auth-alert">{message}</p> : null}
          <input placeholder="Trip title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <input placeholder="Destination" value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} />
          <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
          <input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
          <textarea placeholder="Trip notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}></textarea>
          <div className="inline-actions">
            <button type="submit" className="btn btn--primary" disabled={isSaving}>
              {isSaving ? "Saving..." : editingId ? "Save changes" : "Add trip"}
            </button>
            {editingId ? <button type="button" className="btn btn--secondary" onClick={() => { setEditingId(null); setForm(blankTrip); }}>Cancel</button> : null}
          </div>
        </form>

        <section className="panel list-panel trip-board-panel">
          <div className="memory-panel-heading">
            <div>
              <p className="eyebrow">Library</p>
              <h2>Trips by status</h2>
            </div>
            <div className="filter-chips" aria-label="Trip filters">
              {["upcoming", "past", "shared", "draft"].map((item) => (
                <button
                  type="button"
                  className={filter === item ? "is-active" : ""}
                  key={item}
                  onClick={() => setFilter(item)}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
          {message ? <p className="auth-alert">{message}</p> : null}
          {isLoading ? (
            <div className="trip-grid">
              <div className="skeleton"></div>
              <div className="skeleton"></div>
            </div>
          ) : null}
          {!isLoading && !trips.length && !message ? (
            <div className="empty-state">
              <strong>Start planning your first adventure.</strong>
              <p>Add a destination on the left and turn it into a family itinerary.</p>
            </div>
          ) : null}
          {!isLoading && trips.length && !filteredTrips.length ? (
            <div className="empty-state">
              <strong>No trips match this filter.</strong>
              <p>Try a different status chip or create a new trip.</p>
            </div>
          ) : null}
          {!isLoading ? <div className="trip-library-layout">
            <div className="trip-timeline-list">
              <p className="eyebrow">Upcoming timeline</p>
              {(upcomingTrips.length ? upcomingTrips : filteredTrips).slice(0, 5).map((trip) => {
                const status = getTripStatus(trip);

                return (
                  <Link to={`/trips/${trip.id}`} className="trip-timeline-row" key={trip.id}>
                    <span></span>
                    <div>
                      <strong>{trip.title}</strong>
                      <p>{trip.destination}</p>
                    </div>
                    <small>{status.countdown}</small>
                  </Link>
                );
              })}
            </div>
            <div className="trip-destination-list">
            {filteredTrips.map((trip, index) => {
              const status = getTripStatus(trip);

              return (
                <article className={`destination-poster image-card image-card--${index % 4}`} key={trip.id}>
                  <div className="trip-card__top">
                    <span className={`trip-status trip-status--${status.tone}`}>{status.label}</span>
                    <span className="countdown-pill">{status.countdown}</span>
                  </div>
                  <div className="trip-card__body">
                    <span className="stat-label">Destination</span>
                    <h3>{trip.title}</h3>
                    <p className="trip-card__destination">{trip.destination}</p>
                    <p className="trip-card__dates">{formatTripDateRange(trip.start_date, trip.end_date)}</p>
                  </div>
                  <div className="trip-card__meta">
                    <span>{trip.activity_count} plan items</span>
                    <span>Created by {trip.creator_name || "Unknown"}</span>
                  </div>
                  <div className="trip-card-footer">
                    <Link to={`/trips/${trip.id}`} className="btn btn--primary">Open itinerary</Link>
                    {(user?.role === "admin" || user?.id === trip.created_by) ? (
                      <div className="inline-actions">
                        <button type="button" className="btn btn--secondary" onClick={() => startEdit(trip)}>Edit</button>
                        <button type="button" className="btn btn--secondary" onClick={() => deleteTrip(trip)}>Delete</button>
                      </div>
                    ) : null}
                  </div>
                </article>
              );
            })}
            </div>
          </div> : null}
        </section>
      </div>
    </AppShell>
  );
}

export default Trips;
