import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { apiRequest } from "../api";
import AppShell from "../components/AppShell";
import useCurrentUser from "../hooks/useCurrentUser";

const blankMemory = {
  tripId: "",
  title: "",
  story: "",
  mediaUrl: "",
  mediaReference: "",
  mediaType: "photo",
  memoryDate: "",
  memberIds: [],
};

const reactions = [
  { key: "love", label: "Love", icon: "L", countKey: "love_count", reactedKey: "reacted_love" },
  { key: "funny", label: "Funny", icon: "Ha", countKey: "funny_count", reactedKey: "reacted_funny" },
  { key: "beautiful", label: "Beautiful", icon: "B", countKey: "beautiful_count", reactedKey: "reacted_beautiful" },
  { key: "emotional", label: "Moved", icon: "M", countKey: "emotional_count", reactedKey: "reacted_emotional" },
];

function formatMemoryDate(value) {
  if (!value) return "Undated memory";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Undated memory";
  return date.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });
}

function getMemoryDateKey(memory) {
  return memory.memory_date ? memory.memory_date.slice(0, 10) : "undated";
}

function MediaPreview({ memory }) {
  if (!memory.media_url) {
    return (
      <div className="media-placeholder memory-photo-placeholder">
        <span className="pill">{memory.media_type}</span>
        <strong>{memory.media_reference || "Family memory"}</strong>
      </div>
    );
  }

  if (memory.media_type === "photo") {
    return (
      <a className="memory-media-link" href={memory.media_url} target="_blank" rel="noreferrer">
        <img src={memory.media_url} alt={memory.title} />
        <span className="memory-overlay-caption">{memory.title}</span>
      </a>
    );
  }

  if (memory.media_type === "video") {
    return (
      <video className="memory-media-video" src={memory.media_url} controls>
        <a href={memory.media_url}>Open video</a>
      </video>
    );
  }

  return (
    <a className="media-placeholder memory-photo-placeholder" href={memory.media_url} target="_blank" rel="noreferrer">
      <span className="pill">{memory.media_type}</span>
      <strong>Open media link</strong>
    </a>
  );
}

function Memories() {
  const { user } = useCurrentUser();
  const [memories, setMemories] = useState([]);
  const [trips, setTrips] = useState([]);
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(blankMemory);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState("");

  const loadData = () => {
    Promise.all([
      apiRequest("/api/memories"),
      apiRequest("/api/trips"),
      apiRequest("/api/users").catch(() => ({ users: [] })),
    ])
      .then(([memoryData, tripData, userData]) => {
        setMemories(memoryData.memories);
        setTrips(tripData.trips);
        setUsers(userData.users || []);
        setMessage("");
      })
      .catch((error) => setMessage(error.message));
  };

  useEffect(loadData, []);

  const groupedMemories = useMemo(() => {
    const tripGroups = memories.reduce((groups, memory) => {
      const tripName = memory.trip_title || "General family memories";
      const dateKey = getMemoryDateKey(memory);

      groups[tripName] = groups[tripName] || {};
      groups[tripName][dateKey] = groups[tripName][dateKey] || [];
      groups[tripName][dateKey].push(memory);
      return groups;
    }, {});

    return Object.entries(tripGroups).map(([tripName, dateGroups]) => ({
      tripName,
      dates: Object.entries(dateGroups)
        .sort(([left], [right]) => {
          if (left === "undated") return 1;
          if (right === "undated") return -1;
          return new Date(right) - new Date(left);
        })
        .map(([dateKey, items]) => ({ dateKey, items })),
    }));
  }, [memories]);

  const saveMemory = async (event) => {
    event.preventDefault();
    const path = editingId ? `/api/memories/${editingId}` : "/api/memories";
    await apiRequest(path, { method: editingId ? "PUT" : "POST", body: JSON.stringify(form) });
    setForm(blankMemory);
    setEditingId(null);
    loadData();
  };

  const editMemory = (memory) => {
    setEditingId(memory.id);
    setForm({
      tripId: memory.trip_id || "",
      title: memory.title || "",
      story: memory.story || "",
      mediaUrl: memory.media_url || "",
      mediaReference: memory.media_reference || "",
      mediaType: memory.media_type || "photo",
      memoryDate: memory.memory_date?.slice(0, 10) || "",
      memberIds: (memory.members || []).map((member) => String(member.id)),
    });
  };

  const deleteMemory = async (memory) => {
    if (!window.confirm(`Delete ${memory.title}?`)) return;
    await apiRequest(`/api/memories/${memory.id}`, { method: "DELETE" });
    loadData();
  };

  const reactToMemory = async (memory, reaction) => {
    if (memory[`reacted_${reaction}`]) return;
    await apiRequest(`/api/memories/${memory.id}/reactions`, {
      method: "POST",
      body: JSON.stringify({ reaction }),
    });
    loadData();
  };

  return (
    <AppShell user={user}>
      <section className="app-header memory-hero travel-hero reveal">
        <div className="travel-hero__copy">
          <p className="eyebrow">Family album</p>
          <h1>Travel stories that still feel alive.</h1>
          <p>Your photos, videos, little notes, and favourite family moments gathered by trip and date.</p>
        </div>
        <div className="journal-stats">
          <span><strong>{memories.length}</strong> entries</span>
          <span><strong>{trips.length}</strong> trip links</span>
        </div>
      </section>

      <div className="workspace-grid memory-workspace">
        <form className="panel form-grid memory-form" onSubmit={saveMemory}>
          <h2>{editingId ? "Edit memory" : "Add memory"}</h2>
          <select value={form.tripId} onChange={(e) => setForm({ ...form, tripId: e.target.value })}>
            <option value="">No linked trip</option>
            {trips.map((trip) => <option value={trip.id} key={trip.id}>{trip.title}</option>)}
          </select>
          <input placeholder="Memory title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <textarea placeholder="Story or note" value={form.story} onChange={(e) => setForm({ ...form, story: e.target.value })}></textarea>
          <select value={form.mediaType} onChange={(e) => setForm({ ...form, mediaType: e.target.value })}>
            <option value="photo">Photo</option>
            <option value="video">Video</option>
            <option value="other">Other</option>
          </select>
          <input placeholder="Media URL" value={form.mediaUrl} onChange={(e) => setForm({ ...form, mediaUrl: e.target.value })} />
          <input placeholder="Filename or storage note" value={form.mediaReference} onChange={(e) => setForm({ ...form, mediaReference: e.target.value })} />
          <input type="date" value={form.memoryDate} onChange={(e) => setForm({ ...form, memoryDate: e.target.value })} />
          <label className="member-select-field">
            <span>People in this memory</span>
            <select
              multiple
              value={form.memberIds}
              onChange={(e) => setForm({ ...form, memberIds: Array.from(e.target.selectedOptions, (option) => option.value) })}
            >
              {users.map((person) => (
                <option value={person.id} key={person.id}>{person.full_name} ({person.email})</option>
              ))}
            </select>
          </label>
          <div className="upload-placeholder">Future photo/video upload space</div>
          <div className="inline-actions">
            <button type="submit" className="btn btn--primary">{editingId ? "Save memory" : "Add memory"}</button>
            {editingId ? <button type="button" className="btn btn--secondary" onClick={() => { setEditingId(null); setForm(blankMemory); }}>Cancel</button> : null}
          </div>
        </form>

        <section className="panel memory-album-panel journal-panel">
          <div className="memory-panel-heading">
            <div>
              <p className="eyebrow">Timeline</p>
              <h2>Family travel album</h2>
            </div>
            <Link to="/trips" className="btn btn--secondary">View trips</Link>
          </div>
          {message ? <p className="auth-alert">{message}</p> : null}
          {!memories.length && !message ? (
            <div className="empty-state">
              <strong>Capture your first family memory.</strong>
              <p>Your travel stories will appear here, grouped by trip and date.</p>
            </div>
          ) : null}

          <div className="memory-timeline">
            {groupedMemories.map((group) => (
              <section className="memory-trip-section" key={group.tripName}>
                <h3>{group.tripName}</h3>
                {group.dates.map(({ dateKey, items }) => (
                  <div className="memory-date-group" key={`${group.tripName}-${dateKey}`}>
                    <div className="memory-date-marker">
                      <span>{dateKey === "undated" ? "Undated" : formatMemoryDate(dateKey)}</span>
                    </div>
                    <div className="memory-grid memory-grid--album masonry-journal scrapbook-grid">
                      {items.map((memory) => (
                        <article className="memory-card album-card ts-card memory-story-card scrapbook-entry" key={memory.id}>
                          <MediaPreview memory={memory} />
                          <div className="album-card__body">
                            <div className="memory-card__meta">
                              <span className="pill">{memory.media_type}</span>
                              <small>{formatMemoryDate(memory.memory_date)}</small>
                            </div>
                            <h3>{memory.title}</h3>
                            <p>{memory.story}</p>
                            <small>
                              {memory.trip_title || "General memory"}
                              <span className="ts-separator"></span>
                              by {memory.creator_name || "Unknown"}
                            </small>
                            {(memory.members || []).length ? (
                              <div className="memory-member-row">
                                {memory.members.map((member) => (
                                  <span key={member.id}>{member.full_name}</span>
                                ))}
                              </div>
                            ) : null}
                            {memory.media_url ? <a href={memory.media_url} target="_blank" rel="noreferrer">Open media link</a> : null}
                            {memory.media_reference ? <p className="media-reference">{memory.media_reference}</p> : null}
                            <div className="reaction-row">
                              {reactions.map((reaction) => (
                                <button
                                  type="button"
                                  className={`reaction-button ${memory[reaction.reactedKey] ? "is-reacted" : ""}`}
                                  key={reaction.key}
                                  onClick={() => reactToMemory(memory, reaction.key)}
                                >
                                  <span>{reaction.icon}</span>
                                  <strong>{Number(memory[reaction.countKey] || 0)}</strong>
                                  <small>{reaction.label}</small>
                                </button>
                              ))}
                            </div>
                            {(user?.role === "admin" || user?.id === memory.created_by) ? (
                              <div className="inline-actions">
                                <button type="button" className="btn btn--secondary" onClick={() => editMemory(memory)}>Edit</button>
                                <button type="button" className="btn btn--secondary" onClick={() => deleteMemory(memory)}>Delete</button>
                              </div>
                            ) : null}
                          </div>
                        </article>
                      ))}
                    </div>
                  </div>
                ))}
              </section>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}

export default Memories;
