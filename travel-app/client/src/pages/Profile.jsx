import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest, clearToken } from "../api";
import AppShell from "../components/AppShell";
import useCurrentUser from "../hooks/useCurrentUser";

function Profile() {
  const navigate = useNavigate();
  const { user, setUser } = useCurrentUser();
  const [stats, setStats] = useState({
    trips: 0,
    memories: 0,
    activities: 0,
    completedTrips: 0,
    upcomingTrips: 0,
  });
  const [form, setForm] = useState({ fullName: "", email: "", phone: "" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    apiRequest("/api/profile/stats")
      .then((data) => setStats(data.stats))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (user) {
      setForm({
        fullName: user.fullName || "",
        email: user.email || "",
        phone: user.phone || "",
      });
    }
  }, [user]);

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setIsSaving(true);

    try {
      const data = await apiRequest("/api/profile", {
        method: "PUT",
        body: JSON.stringify(form),
      });
      setUser(data.user);
      setMessage(data.message || "Profile updated.");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsSaving(false);
    }
  };

  const deleteAccount = async () => {
    const confirmed = window.confirm(
      "Delete your account? This cannot be undone, and you will be signed out."
    );

    if (!confirmed) return;

    setError("");
    setMessage("");
    setIsDeleting(true);

    try {
      await apiRequest("/api/profile", { method: "DELETE" });
      clearToken();
      navigate("/", { replace: true });
    } catch (requestError) {
      setError(requestError.message);
      setIsDeleting(false);
    }
  };

  return (
    <AppShell user={user}>
      <section className="profile-hero profile-hero--premium travel-hero reveal">
        <div>
          <p className="eyebrow">Family traveller</p>
          <h1>{user?.fullName || "TravelSync member"}</h1>
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

      <section className="passport-stamp-strip reveal">
        <article className="passport-stamp">
          <span className="stat-label">Trip Count</span>
          <strong className="metric-value">{stats.trips}</strong>
          <p>Trips you created.</p>
        </article>
        <article className="passport-stamp">
          <span className="stat-label">Memory Count</span>
          <strong className="metric-value">{stats.memories}</strong>
          <p>Stories you preserved.</p>
        </article>
        <article className="passport-stamp">
          <span className="stat-label">Cities Visited</span>
          <strong className="metric-value">{stats.completedTrips}</strong>
          <p>Completed trip destinations.</p>
        </article>
        <article className="passport-stamp">
          <span className="stat-label">Favourite Trip</span>
          <strong className="metric-value">{stats.activities}</strong>
          <p>Plans and notes saved.</p>
        </article>
      </section>

      <section className="panel profile-panel passport-panel reveal">
        <div className="memory-panel-heading">
          <div>
            <p className="eyebrow">Travel passport</p>
            <h2>Account and family access</h2>
          </div>
          <span className="countdown-pill">{user?.role || "member"}</span>
        </div>

        {message ? <p className="auth-alert auth-alert--success">{message}</p> : null}
        {error ? <p className="auth-alert">{error}</p> : null}

        <form className="profile-edit-form" onSubmit={saveProfile}>
          <label className="auth-field">
            <span>Full name</span>
            <input
              value={form.fullName}
              onChange={(event) => updateField("fullName", event.target.value)}
              required
            />
          </label>
          <label className="auth-field">
            <span>Email</span>
            <input
              type="email"
              value={form.email}
              onChange={(event) => updateField("email", event.target.value)}
              required
            />
          </label>
          <label className="auth-field">
            <span>Phone</span>
            <input
              value={form.phone}
              onChange={(event) => updateField("phone", event.target.value)}
              required
            />
          </label>
          <div className="profile-edit-actions">
            <button type="submit" className="btn btn--primary" disabled={isSaving}>
              {isSaving ? "Saving..." : "Save details"}
            </button>
          </div>
        </form>

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

      <section className="panel profile-panel account-danger-panel reveal">
        <div>
          <p className="eyebrow">Account control</p>
          <h2>Delete account</h2>
          <p>
            This removes your sign-in account. Trips and memories that should remain
            in the family space will keep their records without your user profile attached.
          </p>
        </div>
        <button
          type="button"
          className="btn btn--danger"
          onClick={deleteAccount}
          disabled={isDeleting}
        >
          {isDeleting ? "Deleting..." : "Delete my account"}
        </button>
      </section>

      <section className="achievement-grid passport-achievements reveal">
        <article className="achievement-card">
          <span>Badge 01</span>
          <strong>Route Builder</strong>
          <p>Created and shaped family trip boards.</p>
        </article>
        <article className="achievement-card">
          <span>Badge 02</span>
          <strong>Memory Keeper</strong>
          <p>Saved moments so the trip still has a place to live.</p>
        </article>
        <article className="achievement-card">
          <span>Badge 03</span>
          <strong>Day Planner</strong>
          <p>Added activities, notes, reminders, and itinerary details.</p>
        </article>
      </section>

      <section className="travel-history-timeline reveal">
        <div>
          <p className="eyebrow">Travel history</p>
          <h2>Passport timeline</h2>
        </div>
        <div className="history-line">
          <span><strong>{stats.completedTrips}</strong> completed adventures</span>
          <span><strong>{stats.upcomingTrips}</strong> upcoming plans</span>
          <span><strong>{stats.memories}</strong> saved memories</span>
        </div>
      </section>
    </AppShell>
  );
}

export default Profile;
