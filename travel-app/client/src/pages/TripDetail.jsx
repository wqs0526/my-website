import { useCallback, useEffect, useMemo, useState } from "react";
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
const activityTypeMeta = {
  plan: { icon: "P", label: "Plan" },
  place: { icon: "@", label: "Place" },
  reminder: { icon: "!", label: "Reminder" },
  note: { icon: "N", label: "Note" },
};

function formatTimelineDate(value) {
  if (!value) return "Date not set";
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "Date not set";
  return date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

function TripDetail() {
  const { id } = useParams();
  const { user } = useCurrentUser();
  const [trip, setTrip] = useState(null);
  const [days, setDays] = useState([]);
  const [activities, setActivities] = useState([]);
  const [packingItems, setPackingItems] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [tripMemoryCount, setTripMemoryCount] = useState(0);
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
  const [messageType, setMessageType] = useState("error");
  const [isLoading, setIsLoading] = useState(true);
  const [busyAction, setBusyAction] = useState("");
  const [activeDay, setActiveDay] = useState(null);

  const notify = useCallback((text, type = "success") => {
    setMessage(text);
    setMessageType(type);
  }, []);

  const loadTrip = useCallback(async (showLoading = false) => {
    if (showLoading) setIsLoading(true);
    try {
      const [data, memoryData] = await Promise.all([
        apiRequest(`/api/trips/${id}`),
        apiRequest("/api/memories").catch(() => ({ memories: [] })),
      ]);
      setTrip(data.trip);
      setDays(data.days);
      setActivities(data.activities);
      setPackingItems(data.packingItems || []);
      setExpenses(data.expenses || []);
      setMembers(data.members || []);
      setAvailableUsers(data.availableUsers || []);
      setTripMemoryCount((memoryData.memories || []).filter((memory) => Number(memory.trip_id) === Number(id)).length);
    } catch (error) {
      notify(error.message, "error");
    } finally {
      setIsLoading(false);
    }
  }, [id, notify]);

  useEffect(() => {
    loadTrip(true);
  }, [loadTrip]);

  useEffect(() => {
    if (!message || messageType !== "success") return undefined;
    const timer = window.setTimeout(() => setMessage(""), 4000);
    return () => window.clearTimeout(timer);
  }, [message, messageType]);

  const groupedActivities = useMemo(() => {
    return activities.reduce((groups, activity) => {
      const key = activity.day_number;
      groups[key] = groups[key] || [];
      groups[key].push(activity);
      return groups;
    }, {});
  }, [activities]);

  const budgetByCategory = useMemo(() => {
    const totals = expenses.reduce((groups, expense) => {
      const category = expense.category || "Other";
      groups[category] = groups[category] || { category, estimated: 0, actual: 0, count: 0 };
      groups[category].estimated += Number(expense.estimated_amount || 0);
      groups[category].actual += Number(expense.actual_amount || 0);
      groups[category].count += 1;
      return groups;
    }, {});

    return Object.values(totals).sort((a, b) => {
      const firstIndex = expenseCategories.indexOf(a.category);
      const secondIndex = expenseCategories.indexOf(b.category);
      return (firstIndex === -1 ? expenseCategories.length : firstIndex)
        - (secondIndex === -1 ? expenseCategories.length : secondIndex);
    });
  }, [expenses]);

  const checkedPackingCount = packingItems.filter((item) => item.is_checked).length;
  const unpackedItems = packingItems.filter((item) => !item.is_checked);
  const packedItems = packingItems.filter((item) => item.is_checked);
  const packingProgress = packingItems.length
    ? Math.round((checkedPackingCount / packingItems.length) * 100)
    : 0;
  const totalBudget = expenses.reduce((sum, expense) => sum + Number(expense.estimated_amount || 0), 0);
  const totalSpent = expenses.reduce((sum, expense) => sum + Number(expense.actual_amount || 0), 0);
  const remainingBudget = totalBudget - totalSpent;
  const budgetUsage = totalBudget ? Math.min(100, Math.round((totalSpent / totalBudget) * 100)) : 0;
  const plannedDayCount = new Set(activities.map((activity) => Number(activity.day_number))).size;
  const itineraryProgress = days.length
    ? Math.min(100, Math.round((plannedDayCount / days.length) * 100))
    : activities.length ? 100 : 0;
  const planningSteps = [
    {
      label: "Itinerary planned",
      detail: activities.length ? `${activities.length} ${activities.length === 1 ? "activity" : "activities"}` : "Add your first activity",
      progress: itineraryProgress,
      complete: itineraryProgress === 100,
    },
    {
      label: "Packing started",
      detail: packingItems.length ? `${checkedPackingCount} of ${packingItems.length} packed` : "Start your packing list",
      progress: packingProgress,
      complete: packingItems.length > 0,
    },
    {
      label: "Budget added",
      detail: expenses.length ? `${expenses.length} ${expenses.length === 1 ? "expense" : "expenses"}` : "Add an estimated cost",
      progress: expenses.length ? 100 : 0,
      complete: expenses.length > 0,
    },
    {
      label: "Memories added",
      detail: tripMemoryCount ? `${tripMemoryCount} ${tripMemoryCount === 1 ? "memory" : "memories"}` : "Capture a trip memory",
      progress: tripMemoryCount ? 100 : 0,
      complete: tripMemoryCount > 0,
    },
  ];
  const completedPlanningSteps = planningSteps.filter((step) => step.complete).length;
  const overallPlanningProgress = Math.round((completedPlanningSteps / planningSteps.length) * 100);

  const getTripDayCount = () => {
    if (!trip?.start_date || !trip?.end_date) return days.length;
    const start = new Date(`${trip.start_date.slice(0, 10)}T00:00:00`);
    const end = new Date(`${trip.end_date.slice(0, 10)}T00:00:00`);
    const difference = Math.round((end - start) / (24 * 60 * 60 * 1000));
    return Number.isFinite(difference) && difference >= 0 ? difference + 1 : days.length;
  };
  const tripDayCount = getTripDayCount();

  const saveDay = async (event) => {
    event.preventDefault();
    setMessage("");
    setBusyAction("day");

    try {
      const path = editingDayId ? `/api/trip-days/${editingDayId}` : `/api/trips/${id}/days`;
      await apiRequest(path, { method: editingDayId ? "PUT" : "POST", body: JSON.stringify(dayForm) });
      const wasEditing = Boolean(editingDayId);
      setDayForm({ dayNumber: Number(dayForm.dayNumber) + 1, date: "", title: "" });
      setEditingDayId(null);
      await loadTrip();
      notify(wasEditing ? "Trip day updated." : "Trip day added.");
    } catch (error) {
      notify(error.message, "error");
    } finally {
      setBusyAction("");
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
    setBusyAction(`delete-day-${day.id}`);

    try {
      await apiRequest(`/api/trip-days/${day.id}`, { method: "DELETE" });
      if (editingDayId === day.id) {
        setEditingDayId(null);
        setDayForm({ dayNumber: 1, date: "", title: "" });
      }
      await loadTrip();
      notify("Trip day deleted.");
    } catch (error) {
      notify(
        error.message.includes("404")
          ? "Trip day delete is not available on the running server yet. Restart the Express server and try again."
          : error.message,
        "error"
      );
    } finally {
      setBusyAction("");
    }
  };

  const saveActivity = async (event) => {
    event.preventDefault();
    setMessage("");
    setBusyAction("activity");

    try {
      const path = editingActivityId ? `/api/activities/${editingActivityId}` : `/api/trips/${id}/activities`;
      await apiRequest(path, { method: editingActivityId ? "PUT" : "POST", body: JSON.stringify(activityForm) });
      const wasEditing = Boolean(editingActivityId);
      setActivityForm(blankActivity);
      setEditingActivityId(null);
      await loadTrip();
      notify(wasEditing ? "Activity updated." : "Activity added to the itinerary.");
    } catch (error) {
      notify(error.message, "error");
    } finally {
      setBusyAction("");
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
    window.requestAnimationFrame(() => document.getElementById("add-activity")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

  const addActivityToDay = (dayNumber) => {
    setEditingActivityId(null);
    setActivityForm({ ...blankActivity, dayNumber });
    window.requestAnimationFrame(() => document.getElementById("add-activity")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

  const deleteActivity = async (activity) => {
    if (!window.confirm(`Delete ${activity.title}?`)) return;
    setMessage("");
    setBusyAction(`delete-activity-${activity.id}`);

    try {
      await apiRequest(`/api/activities/${activity.id}`, { method: "DELETE" });
      await loadTrip();
      notify("Activity deleted.");
    } catch (error) {
      notify(error.message, "error");
    } finally {
      setBusyAction("");
    }
  };

  const savePackingItem = async (event) => {
    event.preventDefault();
    setMessage("");
    setBusyAction("packing-add");

    try {
      await apiRequest(`/api/trips/${id}/packing-items`, {
        method: "POST",
        body: JSON.stringify({ itemText: packingItem }),
      });
      setPackingItem("");
      await loadTrip();
      notify("Packing item added.");
    } catch (error) {
      notify(error.message, "error");
    } finally {
      setBusyAction("");
    }
  };

  const togglePackingItem = async (item) => {
    setMessage("");
    setBusyAction(`packing-${item.id}`);

    try {
      await apiRequest(`/api/packing-items/${item.id}`, {
        method: "PUT",
        body: JSON.stringify({ itemText: item.item_text, isChecked: !item.is_checked }),
      });
      await loadTrip();
      notify(item.is_checked ? "Item moved back to your packing list." : "Item marked as packed.");
    } catch (error) {
      notify(error.message, "error");
    } finally {
      setBusyAction("");
    }
  };

  const deletePackingItem = async (item) => {
    setMessage("");
    setBusyAction(`delete-packing-${item.id}`);

    try {
      await apiRequest(`/api/packing-items/${item.id}`, { method: "DELETE" });
      await loadTrip();
      notify("Packing item deleted.");
    } catch (error) {
      notify(error.message, "error");
    } finally {
      setBusyAction("");
    }
  };

  const saveExpense = async (event) => {
    event.preventDefault();
    setMessage("");
    setBusyAction("expense-add");

    try {
      await apiRequest(`/api/trips/${id}/expenses`, {
        method: "POST",
        body: JSON.stringify(expenseForm),
      });
      setExpenseForm(blankExpense);
      await loadTrip();
      notify("Expense added to the trip budget.");
    } catch (error) {
      notify(error.message, "error");
    } finally {
      setBusyAction("");
    }
  };

  const deleteExpense = async (expense) => {
    setMessage("");
    setBusyAction(`delete-expense-${expense.id}`);

    try {
      await apiRequest(`/api/expenses/${expense.id}`, { method: "DELETE" });
      await loadTrip();
      notify("Expense deleted.");
    } catch (error) {
      notify(error.message, "error");
    } finally {
      setBusyAction("");
    }
  };

  const addTripMember = async (event) => {
    event.preventDefault();
    if (!memberToAdd) return;
    setMessage("");
    setBusyAction("member-add");

    try {
      await apiRequest(`/api/trips/${id}/members`, {
        method: "POST",
        body: JSON.stringify({ userId: memberToAdd }),
      });
      setMemberToAdd("");
      await loadTrip();
      notify("Trip member added.");
    } catch (error) {
      notify(error.message, "error");
    } finally {
      setBusyAction("");
    }
  };

  const removeTripMember = async (member) => {
    setMessage("");
    setBusyAction(`remove-member-${member.id}`);

    try {
      await apiRequest(`/api/trips/${id}/members/${member.id}`, { method: "DELETE" });
      await loadTrip();
      notify(`${member.full_name} was removed from the trip.`);
    } catch (error) {
      notify(error.message, "error");
    } finally {
      setBusyAction("");
    }
  };

  const canEditTrip = user?.role === "admin" || user?.id === trip?.created_by;
  const tripStatus = getTripStatus(trip);
  const visibleDays = activeDay ? days.filter((day) => day.day_number === activeDay) : days;
  const addableMembers = availableUsers.filter((person) => !members.some((member) => Number(member.id) === Number(person.id)));
  const mapQuery = encodeURIComponent(trip?.destination || trip?.title || "Singapore");
  const mapUrl = `https://www.google.com/maps?q=${mapQuery}&output=embed`;
  const mapLink = `https://www.google.com/maps/search/?api=1&query=${mapQuery}`;

  if (isLoading && !trip) {
    return (
      <AppShell user={user}>
        <section className="trip-loading" aria-label="Loading trip details" aria-busy="true">
          <div className="trip-loading__hero skeleton"></div>
          <div className="trip-loading__grid">
            <div className="skeleton"></div>
            <div className="skeleton"></div>
            <div className="skeleton"></div>
          </div>
          <p>Preparing your trip workspace...</p>
        </section>
      </AppShell>
    );
  }

  if (!trip) {
    return (
      <AppShell user={user}>
        <section className="panel trip-load-error">
          <span aria-hidden="true">!</span>
          <h1>We could not open this trip</h1>
          <p>{message || "Please check your connection and try again."}</p>
          <div className="inline-actions">
            <button type="button" className="btn btn--primary" onClick={() => { setMessage(""); loadTrip(true); }}>Try again</button>
            <Link to="/trips" className="btn btn--secondary">Back to trips</Link>
          </div>
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell user={user}>
      <section className="app-header trip-detail-hero reveal">
        <div className="trip-overview-main">
          <Link to="/trips" className="trip-back-link" aria-label="Back to trips">← All trips</Link>
          <div className="trip-overview-title-row">
            <div className="trip-overview-copy">
              <p className="eyebrow">Trip planning workspace</p>
              <h1>{trip?.title || "Loading trip..."}</h1>
              <p className="trip-destination"><span aria-hidden="true">⌖</span>{trip?.destination || "Destination not set"}</p>
            </div>
            <div className="trip-overview-status">
              <span className={`trip-status trip-status--${tripStatus.tone}`}>{tripStatus.label}</span>
              <span className="countdown-pill">{tripStatus.countdown}</span>
            </div>
          </div>

          <div className="trip-facts" aria-label="Trip overview">
            <div><span>Dates</span><strong>{formatTripDateRange(trip?.start_date, trip?.end_date)}</strong></div>
            <div><span>Duration</span><strong>{tripDayCount ? `${tripDayCount} ${tripDayCount === 1 ? "day" : "days"}` : "Not set"}</strong></div>
            <div><span>Travellers</span><strong>{members.length ? `${members.length} ${members.length === 1 ? "member" : "members"}` : "Just you for now"}</strong></div>
          </div>

          <div className="trip-brief-row">
            <div className="trip-notes-preview">
              <span>Trip notes</span>
              <p>{trip?.notes || "No notes yet — add the key details from the Trips page."}</p>
            </div>
            <div className="trip-member-avatars" aria-label="Trip members">
              {members.slice(0, 5).map((member) => (
                <span key={member.id} title={member.full_name}>{member.full_name?.charAt(0).toUpperCase() || "?"}</span>
              ))}
              {members.length > 5 ? <span title={`${members.length - 5} more members`}>+{members.length - 5}</span> : null}
            </div>
          </div>

          <nav className="quick-action-bar" aria-label="Trip quick actions">
            <a href="#add-activity" className="trip-quick-action"><span aria-hidden="true">＋</span>Add Activity</a>
            <a href="#packing-list" className="trip-quick-action"><span aria-hidden="true">✓</span>Add Packing Item</a>
            <a href="#expense-planner" className="trip-quick-action"><span aria-hidden="true">$</span>Add Expense</a>
            <Link to="/memories" className="trip-quick-action"><span aria-hidden="true">◇</span>Add Memory</Link>
          </nav>
        </div>

        <aside className="trip-progress-panel" aria-label="Trip planning progress">
          <div className="trip-progress-heading">
            <div>
              <p className="eyebrow">Planning progress</p>
              <h2>{overallPlanningProgress}% ready</h2>
            </div>
            <span>{completedPlanningSteps}/{planningSteps.length}</span>
          </div>
          <div className="trip-progress-overall" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow={overallPlanningProgress}>
            <span style={{ width: `${overallPlanningProgress}%` }}></span>
          </div>
          <div className="planning-checklist">
            {planningSteps.map((step) => (
              <div className={`planning-check ${step.complete ? "is-complete" : ""}`} key={step.label}>
                <span className="planning-check__icon" aria-hidden="true">{step.complete ? "✓" : ""}</span>
                <div>
                  <strong>{step.label}</strong>
                  <small>{step.detail}</small>
                </div>
                <span className="planning-check__value">{step.progress}%</span>
              </div>
            ))}
          </div>
        </aside>
      </section>

      {message ? (
        <div className={`trip-feedback ${messageType === "success" ? "is-success" : "is-error"}`} role={messageType === "error" ? "alert" : "status"}>
          <span aria-hidden="true">{messageType === "success" ? "✓" : "!"}</span>
          <p>{message}</p>
          <button type="button" aria-label="Dismiss message" onClick={() => setMessage("")}>×</button>
        </div>
      ) : null}

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
          <div className="itinerary-timeline">
            {!days.length ? (
              <div className="empty-state itinerary-empty-state">
                <strong>No itinerary yet. Add your first day.</strong>
                <p>Start with a day, then add places, reminders, and family notes.</p>
                {canEditTrip ? <a className="btn btn--primary" href="#add-day">Add first day</a> : null}
              </div>
            ) : null}
            {(visibleDays.length ? visibleDays : []).map((day) => (
              <section className="itinerary-day" key={day.id || day.day_number}>
                <div className="itinerary-day__rail" aria-hidden="true">
                  <span>{day.day_number}</span>
                </div>
                <div className="itinerary-day__content">
                  <header className="itinerary-day__header">
                    <div>
                      <p className="itinerary-day__date">Day {day.day_number} <span>&bull;</span> {formatTimelineDate(day.trip_date)}</p>
                      <h3>{day.title || `Day ${day.day_number}`}</h3>
                    </div>
                    {canEditTrip ? (
                      <div className="itinerary-day__actions">
                        <button type="button" className="link-button" onClick={() => addActivityToDay(day.day_number)}>+ Add activity</button>
                        <button type="button" className="link-button" onClick={() => editDay(day)}>Edit day</button>
                        <button type="button" className="link-button link-button--danger" disabled={busyAction === `delete-day-${day.id}`} onClick={() => deleteDay(day)}>{busyAction === `delete-day-${day.id}` ? "Deleting..." : "Delete"}</button>
                      </div>
                    ) : null}
                  </header>

                  {!(groupedActivities[day.day_number] || []).length ? (
                    <div className="timeline-empty">
                      <span className="timeline-empty__marker" aria-hidden="true">+</span>
                      <div>
                        <strong>No plans yet for Day {day.day_number}</strong>
                        <p>Add your first activity and start shaping the day.</p>
                      </div>
                      {canEditTrip ? <button type="button" className="link-button" onClick={() => addActivityToDay(day.day_number)}>Add first activity</button> : null}
                    </div>
                  ) : (
                    <div className="timeline-stops">
                      {(groupedActivities[day.day_number] || []).map((activity) => {
                        const typeMeta = activityTypeMeta[activity.type] || activityTypeMeta.plan;
                        return (
                          <article className={`timeline-stop timeline-stop--${activity.type || "plan"}`} key={activity.id}>
                            <time>{activity.planned_time ? activity.planned_time.slice(0, 5) : "Anytime"}</time>
                            <span className="timeline-stop__icon" aria-hidden="true">{typeMeta.icon}</span>
                            <div className="timeline-stop__body">
                              <span className="timeline-stop__type">{typeMeta.label}</span>
                              <strong>{activity.title}</strong>
                              {activity.notes ? <p>{activity.notes}</p> : null}
                            </div>
                            {(user?.role === "admin" || user?.id === activity.created_by) ? (
                              <div className="timeline-stop__actions">
                                <button type="button" className="link-button" onClick={() => editActivity(activity)}>Edit</button>
                                <button type="button" className="link-button link-button--danger" disabled={busyAction === `delete-activity-${activity.id}`} onClick={() => deleteActivity(activity)}>{busyAction === `delete-activity-${activity.id}` ? "Deleting..." : "Delete"}</button>
                              </div>
                            ) : null}
                          </article>
                        );
                      })}
                      {canEditTrip ? (
                        <button type="button" className="timeline-add-stop" onClick={() => addActivityToDay(day.day_number)}>
                          <span aria-hidden="true">+</span> Add another activity
                        </button>
                      ) : null}
                    </div>
                  )}
                </div>
              </section>
            ))}
          </div>

          <section className="itinerary-editor" aria-label="Itinerary editing tools">
              <form className="itinerary-editor__form" onSubmit={saveDay}>
                <div className="itinerary-editor__heading">
                  <span>Trip structure</span>
                  <h3 id="add-day">{editingDayId ? "Edit trip day" : "Add a trip day"}</h3>
                </div>
                <div className="itinerary-editor__fields itinerary-editor__fields--day">
                  <label><span>Day</span><input aria-label="Day number" type="number" min="1" value={dayForm.dayNumber} onChange={(e) => setDayForm({ ...dayForm, dayNumber: e.target.value })} /></label>
                  <label><span>Date</span><input type="date" value={dayForm.date} onChange={(e) => setDayForm({ ...dayForm, date: e.target.value })} /></label>
                  <label><span>Title</span><input placeholder="Day title" value={dayForm.title} onChange={(e) => setDayForm({ ...dayForm, title: e.target.value })} /></label>
                  <div className="inline-actions">
                    <button type="submit" className="btn btn--primary" disabled={!canEditTrip || busyAction === "day"}>{busyAction === "day" ? "Saving..." : editingDayId ? "Save day" : "Add day"}</button>
                    {editingDayId ? <button type="button" className="btn btn--secondary" onClick={() => { setEditingDayId(null); setDayForm({ dayNumber: 1, date: "", title: "" }); }}>Cancel</button> : null}
                  </div>
                </div>
              </form>

              <form className="itinerary-editor__form" onSubmit={saveActivity}>
                <div className="itinerary-editor__heading">
                  <span>Itinerary stop</span>
                  <h3 id="add-activity">{editingActivityId ? "Edit activity" : "Add an activity"}</h3>
                </div>
                <div className="itinerary-editor__fields itinerary-editor__fields--activity">
                  <label><span>Day</span><input aria-label="Activity day number" type="number" min="1" value={activityForm.dayNumber} onChange={(e) => setActivityForm({ ...activityForm, dayNumber: e.target.value })} /></label>
                  <label><span>Type</span><select value={activityForm.type} onChange={(e) => setActivityForm({ ...activityForm, type: e.target.value })}>
                    <option value="plan">Plan</option><option value="place">Place</option><option value="reminder">Reminder</option><option value="note">Note</option>
                  </select></label>
                  <label className="itinerary-editor__title"><span>Title</span><input placeholder="Activity title" value={activityForm.title} onChange={(e) => setActivityForm({ ...activityForm, title: e.target.value })} /></label>
                  <label><span>Time</span><input type="time" value={activityForm.plannedTime} onChange={(e) => setActivityForm({ ...activityForm, plannedTime: e.target.value })} /></label>
                  <label className="itinerary-editor__notes"><span>Notes</span><textarea placeholder="Helpful details" value={activityForm.notes} onChange={(e) => setActivityForm({ ...activityForm, notes: e.target.value })}></textarea></label>
                  <button type="submit" className="btn btn--primary" disabled={busyAction === "activity"}>{busyAction === "activity" ? "Saving..." : editingActivityId ? "Save activity" : "Add activity"}</button>
                </div>
              </form>
          </section>
        </section>

        <aside className="trip-map-sidebar">
          <section className="panel planning-rail sticky-map">
            <header className="planning-rail__header">
              <div>
                <p className="eyebrow">Planning panel</p>
                <h2>Trip at a glance</h2>
              </div>
              <span>{overallPlanningProgress}%</span>
            </header>

            <section className="planning-rail__section planning-rail__map">
              <div className="planning-rail__section-heading">
                <div>
                  <span>Route map</span>
                  <strong>{trip?.destination || "Destination map"}</strong>
                </div>
                <a href={mapLink} target="_blank" rel="noreferrer" aria-label="Open full map">Open map</a>
              </div>
              <div className="planning-map-preview">
                <div className="live-map-frame live-map-frame--planner">
                  <iframe
                    title={`${trip?.destination || "Trip destination"} map`}
                    src={mapUrl}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    allowFullScreen
                  ></iframe>
                </div>
                <div className="map-route-overlay" aria-hidden="true">
                  <span className="map-route-pin map-route-pin--start">1</span>
                  <span className="map-route-line"></span>
                  <span className="map-route-pin map-route-pin--end">{Math.max(2, days.length)}</span>
                </div>
              </div>
              <div className="planning-route-list">
                {(days.length ? days.slice(0, 3) : [{ day_number: 1, title: "Add your first stop" }]).map((day) => (
                  <span key={day.id || day.day_number}><b>Day {day.day_number}</b>{day.title || "Open plan"}</span>
                ))}
              </div>
            </section>

            <section className="planning-rail__section" id="expense-planner">
              <div className="planning-rail__section-heading">
                <div>
                  <span>Budget</span>
                  <strong>${totalSpent.toFixed(2)} spent</strong>
                </div>
                <small className={remainingBudget < 0 ? "is-over" : ""}>{remainingBudget < 0 ? `$${Math.abs(remainingBudget).toFixed(2)} over` : `$${remainingBudget.toFixed(2)} left`}</small>
              </div>
              <div className="rail-progress" role="progressbar" aria-label="Budget used" aria-valuemin="0" aria-valuemax="100" aria-valuenow={budgetUsage}>
                <span style={{ width: `${budgetUsage}%` }}></span>
              </div>
              <div className="planning-rail__metrics">
                <span><small>Estimated</small><b>${totalBudget.toFixed(2)}</b></span>
                <span><small>Difference</small><b className={remainingBudget < 0 ? "is-over" : ""}>${remainingBudget.toFixed(2)}</b></span>
              </div>
              {budgetByCategory.length ? (
                <div className="rail-budget-categories">
                  {budgetByCategory.map((category) => {
                    const usage = category.estimated ? Math.min(100, Math.round((category.actual / category.estimated) * 100)) : category.actual ? 100 : 0;
                    return (
                      <div key={category.category}>
                        <span><b>{category.category}</b><small>${category.actual.toFixed(2)} / ${category.estimated.toFixed(2)}</small></span>
                        <div><span className={category.actual > category.estimated ? "is-over" : ""} style={{ width: `${usage}%` }}></span></div>
                      </div>
                    );
                  })}
                </div>
              ) : <p className="planning-rail__hint">No expenses added yet.</p>}
              <form className="rail-tool-form rail-expense-form" onSubmit={saveExpense}>
                <select aria-label="Expense category" value={expenseForm.category} onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}>
                  {expenseCategories.map((category) => <option key={category} value={category}>{category}</option>)}
                </select>
                <input aria-label="Estimated amount" type="number" min="0" step="0.01" placeholder="Estimated" value={expenseForm.estimatedAmount} onChange={(e) => setExpenseForm({ ...expenseForm, estimatedAmount: e.target.value })} />
                <input aria-label="Actual amount" type="number" min="0" step="0.01" placeholder="Actual" value={expenseForm.actualAmount} onChange={(e) => setExpenseForm({ ...expenseForm, actualAmount: e.target.value })} />
                <input aria-label="Paid by" placeholder="Paid by" value={expenseForm.paidBy} onChange={(e) => setExpenseForm({ ...expenseForm, paidBy: e.target.value })} />
                <input className="rail-tool-form__wide" aria-label="Expense notes" placeholder="Expense notes" value={expenseForm.notes} onChange={(e) => setExpenseForm({ ...expenseForm, notes: e.target.value })} />
                <button type="submit" className="btn btn--primary rail-tool-form__wide" disabled={busyAction === "expense-add"}>{busyAction === "expense-add" ? "Adding..." : "Add expense"}</button>
              </form>
              {expenses.length ? (
                <div className="rail-expense-list">
                  {expenses.map((expense) => (
                    <div key={expense.id}>
                      <span><b>{expense.category}</b><small>{expense.notes || expense.paid_by || "Trip expense"}</small></span>
                      <strong>${Number(expense.actual_amount || 0).toFixed(2)}</strong>
                      <button type="button" className="link-button link-button--danger" disabled={busyAction === `delete-expense-${expense.id}`} onClick={() => deleteExpense(expense)}>{busyAction === `delete-expense-${expense.id}` ? "..." : "Delete"}</button>
                    </div>
                  ))}
                </div>
              ) : null}
            </section>

            <section className="planning-rail__section" id="packing-list">
              <div className="planning-rail__section-heading">
                <div>
                  <span>Packing</span>
                  <strong>{packingProgress}% ready</strong>
                </div>
                <small>{checkedPackingCount}/{packingItems.length}</small>
              </div>
              <div className="rail-progress rail-progress--packing" role="progressbar" aria-label="Packing completed" aria-valuemin="0" aria-valuemax="100" aria-valuenow={packingProgress}>
                <span style={{ width: `${packingProgress}%` }}></span>
              </div>
              <p className="planning-rail__hint">{packingItems.length ? `${checkedPackingCount} of ${packingItems.length} items packed` : "Your packing list is ready to start."}</p>
              <form className="rail-tool-form rail-packing-form" onSubmit={savePackingItem}>
                <input aria-label="New packing item" placeholder="Add packing item" value={packingItem} onChange={(e) => setPackingItem(e.target.value)} />
                <button type="submit" className="btn btn--primary" disabled={busyAction === "packing-add" || !packingItem.trim()}>{busyAction === "packing-add" ? "Adding..." : "Add"}</button>
              </form>
              {packingItems.length ? (
                <div className="rail-packing-list">
                  {[...unpackedItems, ...packedItems].map((item) => (
                    <div className={item.is_checked ? "is-checked" : ""} key={item.id}>
                      <label>
                        <input type="checkbox" checked={Boolean(item.is_checked)} disabled={busyAction === `packing-${item.id}`} onChange={() => togglePackingItem(item)} />
                        <span>{item.item_text}</span>
                      </label>
                      <button type="button" className="link-button link-button--danger" aria-label={`Delete ${item.item_text}`} disabled={busyAction === `delete-packing-${item.id}`} onClick={() => deletePackingItem(item)}>{busyAction === `delete-packing-${item.id}` ? "..." : "Delete"}</button>
                    </div>
                  ))}
                </div>
              ) : null}
            </section>

            <section className="planning-rail__section planning-rail__members">
              <div className="planning-rail__section-heading">
                <div>
                  <span>Trip members</span>
                  <strong>{members.length ? `${members.length} travelling` : "Just you for now"}</strong>
                </div>
              </div>
              {members.length ? (
                <div className="rail-member-list">
                  {members.map((member) => (
                    <span key={member.id}>
                      <b aria-hidden="true">{member.full_name?.charAt(0).toUpperCase() || "?"}</b>
                      <span>{member.full_name}<small>{member.role}</small></span>
                      {canEditTrip ? <button type="button" className="link-button link-button--danger" disabled={busyAction === `remove-member-${member.id}`} onClick={() => removeTripMember(member)}>{busyAction === `remove-member-${member.id}` ? "..." : "Remove"}</button> : null}
                    </span>
                  ))}
                </div>
              ) : <p className="planning-rail__hint">No trip members added yet.</p>}
              {canEditTrip ? (
                <form className="rail-tool-form rail-member-form" onSubmit={addTripMember}>
                  <select aria-label="Add trip member" value={memberToAdd} onChange={(event) => setMemberToAdd(event.target.value)}>
                    <option value="">Add family member</option>
                    {addableMembers.map((person) => <option value={person.id} key={person.id}>{person.full_name}</option>)}
                  </select>
                  <button type="submit" className="btn btn--primary" disabled={!memberToAdd || busyAction === "member-add"}>{busyAction === "member-add" ? "Adding..." : "Add"}</button>
                </form>
              ) : null}
            </section>

            <section className="planning-rail__section planning-rail__memories">
              <div className="planning-rail__section-heading">
                <div><span>Memories</span><strong>{tripMemoryCount ? `${tripMemoryCount} saved` : "No memories yet"}</strong></div>
                <Link to="/memories">Open</Link>
              </div>
            </section>
          </section>
        </aside>
      </div>

    </AppShell>
  );
}

export default TripDetail;
