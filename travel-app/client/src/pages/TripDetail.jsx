import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { apiRequest } from "../api";
import AppShell from "../components/AppShell";
import useCurrentUser from "../hooks/useCurrentUser";
import { formatTripDateRange, getTripStatus } from "../utils/tripStatus";

const blankActivity = { dayNumber: 1, type: "plan", title: "", plannedTime: "", notes: "" };
const blankExpense = {
  category: "Food",
  estimatedAmount: "",
  actualAmount: "",
  paidBy: "",
  notes: "",
};

const expenseCategories = ["Flights", "Hotel", "Food", "Transport", "Attractions", "Shopping", "Other"];

function TripDetail() {
  const { id } = useParams();
  const { user } = useCurrentUser();
  const [trip, setTrip] = useState(null);
  const [days, setDays] = useState([]);
  const [activities, setActivities] = useState([]);
  const [packingItems, setPackingItems] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [members, setMembers] = useState([]);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [activityForm, setActivityForm] = useState(blankActivity);
  const [dayForm, setDayForm] = useState({ dayNumber: 1, date: "", title: "" });
  const [packingItem, setPackingItem] = useState("");
  const [expenseForm, setExpenseForm] = useState(blankExpense);
  const [memberToAdd, setMemberToAdd] = useState("");
  const [editingActivityId, setEditingActivityId] = useState(null);
  const [editingDayId, setEditingDayId] = useState(null);
  const [message, setMessage] = useState("");
  const [activeDay, setActiveDay] = useState(null);

  const loadTrip = () => {
    apiRequest(`/api/trips/${id}`).then((data) => {
      setTrip(data.trip);
      setDays(data.days);
      setActivities(data.activities);
      setPackingItems(data.packingItems || []);
      setExpenses(data.expenses || []);
      setMembers(data.members || []);
      setAvailableUsers(data.availableUsers || []);
      setMessage("");
    }).catch((error) => {
      setMessage(error.message);
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

  const checkedPackingCount = packingItems.filter((item) => item.is_checked).length;
  const packingProgress = packingItems.length
    ? Math.round((checkedPackingCount / packingItems.length) * 100)
    : 0;
  const totalBudget = expenses.reduce((sum, expense) => sum + Number(expense.estimated_amount || 0), 0);
  const totalSpent = expenses.reduce((sum, expense) => sum + Number(expense.actual_amount || 0), 0);
  const remainingBudget = totalBudget - totalSpent;

  const saveDay = async (event) => {
    event.preventDefault();
    setMessage("");

    try {
      const path = editingDayId ? `/api/trip-days/${editingDayId}` : `/api/trips/${id}/days`;
      await apiRequest(path, { method: editingDayId ? "PUT" : "POST", body: JSON.stringify(dayForm) });
      setDayForm({ dayNumber: Number(dayForm.dayNumber) + 1, date: "", title: "" });
      setEditingDayId(null);
      loadTrip();
    } catch (error) {
      setMessage(error.message);
    }
  };

  const editDay = (day) => {
    setEditingDayId(day.id);
    setDayForm({
      dayNumber: day.day_number,
      date: day.trip_date?.slice(0, 10) || "",
      title: day.title || "",
    });
  };

  const deleteDay = async (day) => {
    if (!window.confirm(`Delete ${day.title || `Day ${day.day_number}`}?`)) return;
    setMessage("");

    try {
      await apiRequest(`/api/trip-days/${day.id}`, { method: "DELETE" });
      if (editingDayId === day.id) {
        setEditingDayId(null);
        setDayForm({ dayNumber: 1, date: "", title: "" });
      }
      loadTrip();
    } catch (error) {
      setMessage(
        error.message.includes("404")
          ? "Trip day delete is not available on the running server yet. Restart the Express server and try again."
          : error.message
      );
    }
  };

  const saveActivity = async (event) => {
    event.preventDefault();
    setMessage("");

    try {
      const path = editingActivityId ? `/api/activities/${editingActivityId}` : `/api/trips/${id}/activities`;
      await apiRequest(path, { method: editingActivityId ? "PUT" : "POST", body: JSON.stringify(activityForm) });
      setActivityForm(blankActivity);
      setEditingActivityId(null);
      loadTrip();
    } catch (error) {
      setMessage(error.message);
    }
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
    setMessage("");

    try {
      await apiRequest(`/api/activities/${activity.id}`, { method: "DELETE" });
      loadTrip();
    } catch (error) {
      setMessage(error.message);
    }
  };

  const savePackingItem = async (event) => {
    event.preventDefault();
    setMessage("");

    try {
      await apiRequest(`/api/trips/${id}/packing-items`, {
        method: "POST",
        body: JSON.stringify({ itemText: packingItem }),
      });
      setPackingItem("");
      loadTrip();
    } catch (error) {
      setMessage(error.message);
    }
  };

  const togglePackingItem = async (item) => {
    setMessage("");

    try {
      await apiRequest(`/api/packing-items/${item.id}`, {
        method: "PUT",
        body: JSON.stringify({ itemText: item.item_text, isChecked: !item.is_checked }),
      });
      loadTrip();
    } catch (error) {
      setMessage(error.message);
    }
  };

  const deletePackingItem = async (item) => {
    setMessage("");

    try {
      await apiRequest(`/api/packing-items/${item.id}`, { method: "DELETE" });
      loadTrip();
    } catch (error) {
      setMessage(error.message);
    }
  };

  const saveExpense = async (event) => {
    event.preventDefault();
    setMessage("");

    try {
      await apiRequest(`/api/trips/${id}/expenses`, {
        method: "POST",
        body: JSON.stringify(expenseForm),
      });
      setExpenseForm(blankExpense);
      loadTrip();
    } catch (error) {
      setMessage(error.message);
    }
  };

  const deleteExpense = async (expense) => {
    setMessage("");

    try {
      await apiRequest(`/api/expenses/${expense.id}`, { method: "DELETE" });
      loadTrip();
    } catch (error) {
      setMessage(error.message);
    }
  };

  const addTripMember = async (event) => {
    event.preventDefault();
    if (!memberToAdd) return;
    setMessage("");

    try {
      await apiRequest(`/api/trips/${id}/members`, {
        method: "POST",
        body: JSON.stringify({ userId: memberToAdd }),
      });
      setMemberToAdd("");
      loadTrip();
    } catch (error) {
      setMessage(error.message);
    }
  };

  const removeTripMember = async (member) => {
    setMessage("");

    try {
      await apiRequest(`/api/trips/${id}/members/${member.id}`, { method: "DELETE" });
      loadTrip();
    } catch (error) {
      setMessage(error.message);
    }
  };

  const canEditTrip = user?.role === "admin" || user?.id === trip?.created_by;
  const tripStatus = getTripStatus(trip);
  const visibleDays = activeDay ? days.filter((day) => day.day_number === activeDay) : days;
  const addableMembers = availableUsers.filter((person) => !members.some((member) => Number(member.id) === Number(person.id)));
  const mapQuery = encodeURIComponent(trip?.destination || trip?.title || "Singapore");
  const mapUrl = `https://www.google.com/maps?q=${mapQuery}&output=embed`;
  const mapLink = `https://www.google.com/maps/search/?api=1&query=${mapQuery}`;

  return (
    <AppShell user={user}>
      <section className="app-header trip-detail-hero travel-hero reveal">
        <div className="travel-hero__copy">
          <p className="eyebrow">Day-by-day plan</p>
          <h1>{trip?.title || "Loading trip..."}</h1>
          <p>{trip?.destination}</p>
        </div>
        <div className="trip-detail-meta">
          <span className={`trip-status trip-status--${tripStatus.tone}`}>{tripStatus.label}</span>
          <span className="countdown-pill">{tripStatus.countdown}</span>
          <span>{formatTripDateRange(trip?.start_date, trip?.end_date)}</span>
        </div>
        <div className="quick-action-bar">
          <a href="#add-day" className="btn btn--secondary">Add Day</a>
          <a href="#add-activity" className="btn btn--secondary">Add Activity</a>
          <Link to="/memories" className="btn btn--secondary">Add Memory</Link>
          <Link to="/memories" className="btn btn--secondary">View Memories</Link>
          <Link to="/trips" className="btn btn--primary">Back to Trips</Link>
        </div>
        {message ? <p className="auth-alert mt-3">{message}</p> : null}
      </section>

      <section className="trip-planning-overview reveal">
        <article className="planning-overview-panel planning-overview-panel--packing">
          <div className="tool-card-heading">
            <div>
              <p className="eyebrow">Packing checklist</p>
              <h2>{packingProgress}% packed</h2>
            </div>
            <span className="countdown-pill">{checkedPackingCount}/{packingItems.length} done</span>
          </div>
          <div className="progress-track">
            <span style={{ width: `${packingProgress}%` }}></span>
          </div>
          <form className="inline-form" onSubmit={savePackingItem}>
            <input placeholder="Add packing item" value={packingItem} onChange={(e) => setPackingItem(e.target.value)} />
            <button type="submit" className="btn btn--primary">Add item</button>
          </form>
          <div className="packing-list">
            {packingItems.length ? packingItems.map((item) => (
              <div className={`packing-item ${item.is_checked ? "is-checked" : ""}`} key={item.id}>
                <label>
                  <input type="checkbox" checked={Boolean(item.is_checked)} onChange={() => togglePackingItem(item)} />
                  <span>{item.item_text}</span>
                </label>
                <button type="button" className="link-button" onClick={() => deletePackingItem(item)}>Delete</button>
              </div>
            )) : (
              <div className="empty-state">
                <strong>No packing items yet.</strong>
                <p>Add passports, chargers, jackets, and little things nobody wants to forget.</p>
              </div>
            )}
          </div>
        </article>

        <article className="planning-overview-panel planning-overview-panel--expenses">
          <div className="planning-panel-top">
            <div>
              <span>Expenses</span>
              <strong>${totalSpent.toFixed(2)} spent</strong>
            </div>
            <small>${remainingBudget.toFixed(2)} remaining</small>
          </div>
          <div className="tool-card-heading">
            <div>
              <p className="eyebrow">Budget tracker</p>
              <h2>${totalSpent.toFixed(2)} spent</h2>
            </div>
            <span className="countdown-pill">${remainingBudget.toFixed(2)} remaining</span>
          </div>
          <div className="budget-summary">
            <div><span>Total Budget</span><strong>${totalBudget.toFixed(2)}</strong></div>
            <div><span>Total Spent</span><strong>${totalSpent.toFixed(2)}</strong></div>
            <div><span>Remaining</span><strong>${remainingBudget.toFixed(2)}</strong></div>
          </div>
          <form className="budget-form" onSubmit={saveExpense}>
            <select value={expenseForm.category} onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}>
              {expenseCategories.map((category) => <option key={category} value={category}>{category}</option>)}
            </select>
            <input type="number" min="0" step="0.01" placeholder="Estimated" value={expenseForm.estimatedAmount} onChange={(e) => setExpenseForm({ ...expenseForm, estimatedAmount: e.target.value })} />
            <input type="number" min="0" step="0.01" placeholder="Actual" value={expenseForm.actualAmount} onChange={(e) => setExpenseForm({ ...expenseForm, actualAmount: e.target.value })} />
            <input placeholder="Paid by" value={expenseForm.paidBy} onChange={(e) => setExpenseForm({ ...expenseForm, paidBy: e.target.value })} />
            <input placeholder="Notes" value={expenseForm.notes} onChange={(e) => setExpenseForm({ ...expenseForm, notes: e.target.value })} />
            <button type="submit" className="btn btn--primary">Add expense</button>
          </form>
          <div className="expense-list">
            {expenses.length ? expenses.map((expense) => (
              <div className="expense-row" key={expense.id}>
                <div>
                  <strong>{expense.category}</strong>
                  <p>{expense.notes || "No notes"} {expense.paid_by ? `- Paid by ${expense.paid_by}` : ""}</p>
                </div>
                <div>
                  <span>${Number(expense.estimated_amount || 0).toFixed(2)} est.</span>
                  <strong>${Number(expense.actual_amount || 0).toFixed(2)}</strong>
                </div>
                <button type="button" className="link-button" onClick={() => deleteExpense(expense)}>Delete</button>
              </div>
            )) : (
              <div className="empty-state">
                <strong>No expenses yet.</strong>
                <p>Add flights, food, hotels, and shared costs as the plan takes shape.</p>
              </div>
            )}
          </div>
        </article>

        <article className="planning-overview-panel planning-overview-panel--compact">
          <div className="planning-panel-top">
            <div>
              <span>Members</span>
              <strong>{user?.role || "member"}</strong>
            </div>
            <small>Shared board</small>
          </div>
          <div className="member-strip">
            {members.length ? members.map((member) => (
              <span className="member-chip-row" key={member.id}>
                <b>{member.full_name}</b>
                <small>{member.role}</small>
                {canEditTrip ? <button type="button" onClick={() => removeTripMember(member)}>Remove</button> : null}
              </span>
            )) : <span>No members added yet.</span>}
          </div>
          {canEditTrip ? (
            <form className="inline-form member-add-form" onSubmit={addTripMember}>
              <select value={memberToAdd} onChange={(event) => setMemberToAdd(event.target.value)}>
                <option value="">Add family member</option>
                {addableMembers.map((person) => (
                  <option value={person.id} key={person.id}>{person.full_name} ({person.email})</option>
                ))}
              </select>
              <button type="submit" className="btn btn--primary" disabled={!memberToAdd}>Add</button>
            </form>
          ) : null}
        </article>

        <article className="planning-overview-panel planning-overview-panel--compact">
          <div className="planning-panel-top">
            <div>
              <span>Notes</span>
              <strong>Trip brief</strong>
            </div>
            <small>Always visible</small>
          </div>
          <p className="drawer-note">{trip?.notes || "No trip notes yet. Add notes from the Trips page to keep context with this plan."}</p>
        </article>
      </section>

      <div className="trip-detail-layout">
        <section className="panel itinerary-panel">
          <div className="memory-panel-heading">
            <div>
              <p className="eyebrow">Timeline</p>
              <h2>Daily itinerary</h2>
            </div>
            <span className="countdown-pill">{days.length} days</span>
          </div>
          <div className="day-tabs" aria-label="Itinerary day tabs">
            <button type="button" className={!activeDay ? "is-active" : ""} onClick={() => setActiveDay(null)}>All days</button>
            {days.map((day) => (
              <button
                type="button"
                className={activeDay === day.day_number ? "is-active" : ""}
                key={day.id || day.day_number}
                onClick={() => setActiveDay(day.day_number)}
              >
                Day {day.day_number}
              </button>
            ))}
          </div>
          <div className="day-board">
            {!days.length ? (
              <div className="empty-state">
                <strong>No itinerary yet. Add your first day.</strong>
                <p>Start with a day, then add places, reminders, and family notes.</p>
              </div>
            ) : null}
            {(visibleDays.length ? visibleDays : []).map((day) => (
              <article className="day-card" key={day.id || day.day_number}>
                <div className="day-card__header">
                  <div>
                    <span className="stat-label">Day {day.day_number}</span>
                    <h2>{day.title || `Day ${day.day_number}`}</h2>
                  </div>
                  <p className="day-date">{day.trip_date ? day.trip_date.slice(0, 10) : "Date not set"}</p>
                </div>
                {canEditTrip ? (
                  <div className="inline-actions">
                    <button type="button" className="link-button" onClick={() => editDay(day)}>Edit day</button>
                    <button type="button" className="link-button" onClick={() => deleteDay(day)}>Delete day</button>
                  </div>
                ) : null}
                {!(groupedActivities[day.day_number] || []).length ? (
                  <div className="timeline-empty">
                    <strong>No plan items yet</strong>
                    <p>Add a place, reminder, note, or plan item to shape this day.</p>
                  </div>
                ) : null}
                {(groupedActivities[day.day_number] || []).map((activity) => (
                  <div className="activity-line" key={activity.id}>
                    <div className="activity-line__time">
                      {activity.planned_time ? activity.planned_time.slice(0, 5) : "Anytime"}
                    </div>
                    <div className="activity-line__content">
                      <span>{activity.type}</span>
                      <strong>{activity.title}</strong>
                      <p>{activity.notes}</p>
                      {(user?.role === "admin" || user?.id === activity.created_by) ? (
                        <div className="inline-actions">
                          <button type="button" className="link-button" onClick={() => editActivity(activity)}>Edit</button>
                          <button type="button" className="link-button" onClick={() => deleteActivity(activity)}>Delete</button>
                        </div>
                      ) : null}
                    </div>
                  </div>
                ))}
              </article>
            ))}
          </div>
        </section>

        <aside className="trip-map-sidebar">
          <section className="panel map-preview-card sticky-map">
            <p className="eyebrow">Route map</p>
            <h2>{trip?.destination || "Destination map"}</h2>
            <div className="live-map-frame">
              <iframe
                title={`${trip?.destination || "Trip destination"} map`}
                src={mapUrl}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              ></iframe>
            </div>
            <div className="route-list">
              {(days.length ? days.slice(0, 4) : [{ day_number: 1, title: "Add your first stop" }]).map((day) => (
                <span key={day.id || day.day_number}>Day {day.day_number}: {day.title || "Open plan"}</span>
              ))}
            </div>
            <a className="btn btn--primary" href={mapLink} target="_blank" rel="noreferrer">Open full map</a>
          </section>
        </aside>
      </div>

      <div className="workspace-grid planner-forms-grid">
        <div className="panel form-grid">
          <h2 id="add-day">{editingDayId ? "Edit trip day" : "Add trip day"}</h2>
          <form className="form-grid" onSubmit={saveDay}>
            <input type="number" min="1" value={dayForm.dayNumber} onChange={(e) => setDayForm({ ...dayForm, dayNumber: e.target.value })} />
            <input type="date" value={dayForm.date} onChange={(e) => setDayForm({ ...dayForm, date: e.target.value })} />
            <input placeholder="Day title" value={dayForm.title} onChange={(e) => setDayForm({ ...dayForm, title: e.target.value })} />
            <div className="inline-actions">
              <button type="submit" className="btn btn--primary" disabled={!canEditTrip}>{editingDayId ? "Save day" : "Add day"}</button>
              {editingDayId ? (
                <button type="button" className="btn btn--secondary" onClick={() => { setEditingDayId(null); setDayForm({ dayNumber: 1, date: "", title: "" }); }}>Cancel</button>
              ) : null}
            </div>
          </form>

          <h2 id="add-activity">{editingActivityId ? "Edit plan item" : "Add plan item"}</h2>
          <form className="form-grid" onSubmit={saveActivity}>
            <input placeholder="Number Of Day" type="number" min="1" value={activityForm.dayNumber} onChange={(e) => setActivityForm({ ...activityForm, dayNumber: e.target.value })} />
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

        <section className="panel planning-notes-card">
          <p className="eyebrow">Planner notes</p>
          <h2>Keep the details moving.</h2>
          <p className="text-muted">Use the forms beside this note to add days and plan items. The timeline above updates from the same saved itinerary data.</p>
          <div className="quick-link-list">
            <a href="#add-day">Add day <span>Date and title</span></a>
            <a href="#add-activity">Add activity <span>Time, type, notes</span></a>
            <Link to="/memories">Add memory <span>Trip journal</span></Link>
          </div>
        </section>
      </div>
    </AppShell>
  );
}

export default TripDetail;
