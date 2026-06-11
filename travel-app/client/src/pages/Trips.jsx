import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiRequest } from "../api";
import AppShell from "../components/AppShell";
import useCurrentUser from "../hooks/useCurrentUser";

const blankTrip = { title: "", destination: "", startDate: "", endDate: "", notes: "" };

function Trips() {
  const { user } = useCurrentUser();
  const [trips, setTrips] = useState([]);
  const [form, setForm] = useState(blankTrip);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState("");

  const loadTrips = () => {
    apiRequest("/api/trips")
      .then((data) => {
        setTrips(data.trips);
        setMessage("");
      })
      .catch((error) => setMessage(error.message));
  };

  useEffect(loadTrips, []);

  const saveTrip = async (event) => {
    event.preventDefault();
    setMessage("");
    const body = JSON.stringify(form);

    try {
      if (editingId) {
        await apiRequest(`/api/trips/${editingId}`, { method: "PUT", body });
      } else {
        await apiRequest("/api/trips", { method: "POST", body });
      }
      setForm(blankTrip);
      setEditingId(null);
      loadTrips();
    } catch (error) {
      setMessage(error.message);
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
    loadTrips();
  };

  return (
    <AppShell user={user}>
      <section className="app-header">
        <p className="eyebrow">Trip board</p>
        <h1>Plan the family trips day by day.</h1>
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
            <button type="submit" className="btn btn--primary">{editingId ? "Save changes" : "Add trip"}</button>
            {editingId ? <button type="button" className="btn btn--secondary" onClick={() => { setEditingId(null); setForm(blankTrip); }}>Cancel</button> : null}
          </div>
        </form>

        <section className="panel list-panel">
          <h2>Family trips</h2>
          {message ? <p className="auth-alert">{message}</p> : null}
          {trips.map((trip) => (
            <article className="list-item" key={trip.id}>
              <div>
                <h3>{trip.title}</h3>
                <p>{trip.destination} · {trip.activity_count} plan items</p>
                <small>Created by {trip.creator_name || "Unknown"}</small>
              </div>
              <div className="inline-actions">
                <Link to={`/trips/${trip.id}`} className="btn btn--secondary">Open</Link>
                {(user?.role === "admin" || user?.id === trip.created_by) ? (
                  <>
                    <button type="button" className="btn btn--secondary" onClick={() => startEdit(trip)}>Edit</button>
                    <button type="button" className="btn btn--secondary" onClick={() => deleteTrip(trip)}>Delete</button>
                  </>
                ) : null}
              </div>
            </article>
          ))}
        </section>
      </div>
    </AppShell>
  );
}

export default Trips;
