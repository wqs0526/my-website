import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { apiRequest } from "../api";
import AppShell from "../components/AppShell";
import useCurrentUser from "../hooks/useCurrentUser";

const blankActivity = { dayNumber: 1, type: "plan", title: "", plannedTime: "", notes: "" };

function TripDetail() {
  const { id } = useParams();
  const { user } = useCurrentUser();
  const [trip, setTrip] = useState(null);
  const [days, setDays] = useState([]);
  const [activities, setActivities] = useState([]);
  const [activityForm, setActivityForm] = useState(blankActivity);
  const [dayForm, setDayForm] = useState({ dayNumber: 1, date: "", title: "" });
  const [editingActivityId, setEditingActivityId] = useState(null);

  const loadTrip = () => {
    apiRequest(`/api/trips/${id}`).then((data) => {
      setTrip(data.trip);
      setDays(data.days);
      setActivities(data.activities);
    });
  };

  useEffect(loadTrip, [id]);

  const groupedActivities = useMemo(() => {
    return activities.reduce((groups, activity) => {
      const key = activity.day_number;
      groups[key] = groups[key] || [];
      groups[key].push(activity);
      return groups;
    }, {});
  }, [activities]);

  const saveDay = async (event) => {
    event.preventDefault();
    await apiRequest(`/api/trips/${id}/days`, { method: "POST", body: JSON.stringify(dayForm) });
    setDayForm({ dayNumber: Number(dayForm.dayNumber) + 1, date: "", title: "" });
    loadTrip();
  };

  const saveActivity = async (event) => {
    event.preventDefault();
    const path = editingActivityId ? `/api/activities/${editingActivityId}` : `/api/trips/${id}/activities`;
    await apiRequest(path, { method: editingActivityId ? "PUT" : "POST", body: JSON.stringify(activityForm) });
    setActivityForm(blankActivity);
    setEditingActivityId(null);
    loadTrip();
  };

  const editActivity = (activity) => {
    setEditingActivityId(activity.id);
    setActivityForm({
      dayNumber: activity.day_number,
      type: activity.type,
      title: activity.title,
      plannedTime: activity.planned_time || "",
      notes: activity.notes || "",
    });
  };

  const deleteActivity = async (activity) => {
    if (!window.confirm(`Delete ${activity.title}?`)) return;
    await apiRequest(`/api/activities/${activity.id}`, { method: "DELETE" });
    loadTrip();
  };

  const canEditTrip = user?.role === "admin" || user?.id === trip?.created_by;

  return (
    <AppShell user={user}>
      <section className="app-header">
        <p className="eyebrow">Day-by-day plan</p>
        <h1>{trip?.title || "Loading trip..."}</h1>
        <p>{trip?.destination}</p>
      </section>

      <div className="workspace-grid">
        <div className="panel form-grid">
          <h2>Add trip day</h2>
          <form className="form-grid" onSubmit={saveDay}>
            <input type="number" min="1" value={dayForm.dayNumber} onChange={(e) => setDayForm({ ...dayForm, dayNumber: e.target.value })} />
            <input type="date" value={dayForm.date} onChange={(e) => setDayForm({ ...dayForm, date: e.target.value })} />
            <input placeholder="Day title" value={dayForm.title} onChange={(e) => setDayForm({ ...dayForm, title: e.target.value })} />
            <button type="submit" className="btn btn--primary" disabled={!canEditTrip}>Save day</button>
          </form>

          <h2>{editingActivityId ? "Edit plan item" : "Add plan item"}</h2>
          <form className="form-grid" onSubmit={saveActivity}>
            <input type="number" min="1" value={activityForm.dayNumber} onChange={(e) => setActivityForm({ ...activityForm, dayNumber: e.target.value })} />
            <select value={activityForm.type} onChange={(e) => setActivityForm({ ...activityForm, type: e.target.value })}>
              <option value="plan">Plan</option>
              <option value="place">Place</option>
              <option value="reminder">Reminder</option>
              <option value="note">Note</option>
            </select>
            <input placeholder="Title" value={activityForm.title} onChange={(e) => setActivityForm({ ...activityForm, title: e.target.value })} />
            <input type="time" value={activityForm.plannedTime} onChange={(e) => setActivityForm({ ...activityForm, plannedTime: e.target.value })} />
            <textarea placeholder="Notes" value={activityForm.notes} onChange={(e) => setActivityForm({ ...activityForm, notes: e.target.value })}></textarea>
            <button type="submit" className="btn btn--primary">{editingActivityId ? "Save item" : "Add item"}</button>
          </form>
        </div>

        <section className="panel day-board">
          {(days.length ? days : [{ day_number: 1, title: "Day 1" }]).map((day) => (
            <article className="day-card" key={day.id || day.day_number}>
              <h2>{day.title || `Day ${day.day_number}`}</h2>
              <p>{day.trip_date ? day.trip_date.slice(0, 10) : "Date not set"}</p>
              {(groupedActivities[day.day_number] || []).map((activity) => (
                <div className="activity-line" key={activity.id}>
                  <span>{activity.type}</span>
                  <strong>{activity.planned_time ? `${activity.planned_time.slice(0, 5)} · ` : ""}{activity.title}</strong>
                  <p>{activity.notes}</p>
                  {(user?.role === "admin" || user?.id === activity.created_by) ? (
                    <div className="inline-actions">
                      <button type="button" className="link-button" onClick={() => editActivity(activity)}>Edit</button>
                      <button type="button" className="link-button" onClick={() => deleteActivity(activity)}>Delete</button>
                    </div>
                  ) : null}
                </div>
              ))}
            </article>
          ))}
        </section>
      </div>
    </AppShell>
  );
}

export default TripDetail;
