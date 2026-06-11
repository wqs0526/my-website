import { useEffect, useState } from "react";
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
};

function Memories() {
  const { user } = useCurrentUser();
  const [memories, setMemories] = useState([]);
  const [trips, setTrips] = useState([]);
  const [form, setForm] = useState(blankMemory);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState("");

  const loadData = () => {
    Promise.all([apiRequest("/api/memories"), apiRequest("/api/trips")])
      .then(([memoryData, tripData]) => {
        setMemories(memoryData.memories);
        setTrips(tripData.trips);
        setMessage("");
      })
      .catch((error) => setMessage(error.message));
  };

  useEffect(loadData, []);

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
    });
  };

  const deleteMemory = async (memory) => {
    if (!window.confirm(`Delete ${memory.title}?`)) return;
    await apiRequest(`/api/memories/${memory.id}`, { method: "DELETE" });
    loadData();
  };

  return (
    <AppShell user={user}>
      <section className="app-header">
        <p className="eyebrow">Memory wall</p>
        <h1>Save stories, photo links, and video references.</h1>
      </section>

      <div className="workspace-grid">
        <form className="panel form-grid" onSubmit={saveMemory}>
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
          <div className="upload-placeholder">Future photo/video upload space</div>
          <div className="inline-actions">
            <button type="submit" className="btn btn--primary">{editingId ? "Save memory" : "Add memory"}</button>
            {editingId ? <button type="button" className="btn btn--secondary" onClick={() => { setEditingId(null); setForm(blankMemory); }}>Cancel</button> : null}
          </div>
        </form>

        <section className="panel memory-grid">
          {message ? <p className="auth-alert">{message}</p> : null}
          {memories.map((memory) => (
            <article className="memory-card" key={memory.id}>
              <span className="pill">{memory.media_type}</span>
              <h3>{memory.title}</h3>
              <p>{memory.story}</p>
              <small>{memory.trip_title || "General memory"} · by {memory.creator_name || "Unknown"}</small>
              {memory.media_url ? <a href={memory.media_url} target="_blank" rel="noreferrer">Open media link</a> : null}
              {memory.media_reference ? <p className="media-reference">{memory.media_reference}</p> : null}
              {(user?.role === "admin" || user?.id === memory.created_by) ? (
                <div className="inline-actions">
                  <button type="button" className="btn btn--secondary" onClick={() => editMemory(memory)}>Edit</button>
                  <button type="button" className="btn btn--secondary" onClick={() => deleteMemory(memory)}>Delete</button>
                </div>
              ) : null}
            </article>
          ))}
        </section>
      </div>
    </AppShell>
  );
}

export default Memories;
