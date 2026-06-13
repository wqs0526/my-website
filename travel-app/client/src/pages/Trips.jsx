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

  return (
    <AppShell user={user}>
      <section className="app-header">
        <p className="eyebrow">Trip board</p>
        <h1>Plan the family trips day by day.</h1>
        <p>Create trip boards, keep dates visible, and open each itinerary when the details matter.</p>
      </section>

      <div className="workspace-grid">
        <form className="panel form-grid" onSubmit={saveTrip}>
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

        <section className="panel list-panel">
          <h2>Family trips</h2>
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
          {!isLoading ? <div className="trip-grid">
            {trips.map((trip) => {
              const status = getTripStatus(trip);

              return (
                <article className="list-item ts-card destination-card trip-card" key={trip.id}>
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
          </div> : null}
        </section>
      </div>
    </AppShell>
  );
}

export default Trips;
