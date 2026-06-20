import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiRequest, uploadMemoryMedia } from "../api";
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

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const MAX_VIDEO_SIZE = 50 * 1024 * 1024;

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

function getInitials(name) {
  return (name || "Family member")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
}

function getFallbackTitle(story) {
  const firstLine = story.trim().split(/\n|[.!?]/)[0].trim();
  return firstLine.slice(0, 80) || "A family travel memory";
}

function MediaPreview({ memory }) {
  if (!memory.media_url) {
    return null;
  }

  if (memory.media_type === "photo") {
    return (
      <a className="memory-media-link" href={memory.media_url} target="_blank" rel="noreferrer">
        <img src={memory.media_url} alt={memory.title} />
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
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreviewUrl, setMediaPreviewUrl] = useState("");
  const [fileInputKey, setFileInputKey] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [messageType, setMessageType] = useState("error");
  const [postingStage, setPostingStage] = useState("idle");
  const [reactingKey, setReactingKey] = useState("");

  const loadData = useCallback(async () => {
    try {
      const [memoryData, tripData, userData] = await Promise.all([
        apiRequest("/api/memories"),
        apiRequest("/api/trips"),
        apiRequest("/api/users").catch(() => ({ users: [] })),
      ]);
      setMemories(memoryData.memories);
      setTrips(tripData.trips);
      setUsers(userData.users || []);
      setMessage("");
    } catch (error) {
      setMessageType("error");
      setMessage(error.message);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    return () => {
      if (mediaPreviewUrl) URL.revokeObjectURL(mediaPreviewUrl);
    };
  }, [mediaPreviewUrl]);

  const resetMemoryForm = () => {
    setForm(blankMemory);
    setEditingId(null);
    setMediaFile(null);
    setMediaPreviewUrl("");
    setFileInputKey((key) => key + 1);
  };

  const clearSelectedMedia = () => {
    setMediaFile(null);
    setMediaPreviewUrl("");
    setFileInputKey((key) => key + 1);
    setForm((current) => ({
      ...current,
      mediaUrl: "",
      mediaReference: "",
      mediaType: "photo",
    }));
  };

  const handleMediaFile = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      setMediaFile(null);
      setMediaPreviewUrl("");
      return;
    }

    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");

    if (!isImage && !isVideo) {
      setMessageType("error");
      setMessage("Choose an image or video file.");
      setMediaFile(null);
      setMediaPreviewUrl("");
      event.target.value = "";
      return;
    }

    if (isImage && file.size > MAX_IMAGE_SIZE) {
      setMessageType("error");
      setMessage("Images must be 10MB or smaller.");
      setMediaFile(null);
      setMediaPreviewUrl("");
      event.target.value = "";
      return;
    }

    if (isVideo && file.size > MAX_VIDEO_SIZE) {
      setMessageType("error");
      setMessage("Videos must be 50MB or smaller.");
      setMediaFile(null);
      setMediaPreviewUrl("");
      event.target.value = "";
      return;
    }

    setMessage("");
    setMediaFile(file);
    setMediaPreviewUrl(URL.createObjectURL(file));
    setForm((current) => ({ ...current, mediaType: isVideo ? "video" : "photo" }));
  };

  const saveMemory = async (event) => {
    event.preventDefault();
    setMessage("");

    if (!form.story.trim()) {
      setMessageType("error");
      setMessage("Tell us a little about what happened on this trip.");
      return;
    }

    setIsSaving(true);
    setPostingStage(mediaFile ? "uploading" : "posting");

    try {
      let memoryPayload = {
        ...form,
        title: form.title.trim() || getFallbackTitle(form.story),
        story: form.story.trim(),
      };

      if (mediaFile) {
        const uploadedMedia = await uploadMemoryMedia(mediaFile);
        memoryPayload = { ...memoryPayload, ...uploadedMedia };
        setPostingStage("posting");
      }

      const path = editingId ? `/api/memories/${editingId}` : "/api/memories";
      await apiRequest(path, {
        method: editingId ? "PUT" : "POST",
        body: JSON.stringify(memoryPayload),
      });
      resetMemoryForm();
      await loadData();
      setMessageType("success");
      setMessage(editingId ? "Your memory was updated." : "Your memory is now part of the family feed.");
    } catch (error) {
      setMessageType("error");
      setMessage(error.message);
    } finally {
      setIsSaving(false);
      setPostingStage("idle");
    }
  };

  const editMemory = (memory) => {
    setMediaFile(null);
    setMediaPreviewUrl("");
    setFileInputKey((key) => key + 1);
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
    const pendingKey = `${memory.id}-${reaction}`;
    setReactingKey(pendingKey);
    try {
      await apiRequest(`/api/memories/${memory.id}/reactions`, {
        method: "POST",
        body: JSON.stringify({ reaction }),
      });
      await loadData();
    } catch (error) {
      setMessageType("error");
      setMessage(`We couldn't save that reaction. ${error.message}`);
    } finally {
      setReactingKey("");
    }
  };

  const selectedMediaType = mediaFile
    ? mediaFile.type.startsWith("video/") ? "video" : "photo"
    : form.mediaType;
  const selectedMediaPreview = mediaPreviewUrl || form.mediaUrl;
  const displayName = user?.full_name || user?.name || user?.email?.split("@")[0] || "Family member";

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
        <form className="panel memory-form memory-composer" onSubmit={saveMemory}>
          <header className="memory-composer__header">
            <span className="memory-composer__avatar" aria-hidden="true">{getInitials(displayName)}</span>
            <div>
              <h2>{editingId ? "Edit your memory" : "Share a memory"}</h2>
              <p>Posting as {displayName}</p>
            </div>
          </header>
          {message ? (
            <div className={`composer-message composer-message--${messageType}`} role="status">
              <span>{message}</span>
              <button type="button" aria-label="Dismiss message" onClick={() => setMessage("")}>Close</button>
            </div>
          ) : null}

          <label className="memory-story-field">
            <span className="sr-only">Memory story</span>
            <textarea
              placeholder="What happened on this trip?"
              value={form.story}
              onChange={(e) => setForm({ ...form, story: e.target.value })}
              aria-describedby="memory-story-help"
            ></textarea>
            <small id="memory-story-help">Share the little details your family will want to remember.</small>
          </label>

          <label className="memory-title-field">
            <span>Give this moment a title <small>Optional</small></span>
            <input placeholder="e.g. Sunset in Santorini" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </label>

          {selectedMediaPreview ? (
            <div className="memory-upload-preview">
              {selectedMediaType === "video" ? (
                <video src={selectedMediaPreview} controls preload="metadata">Preview unavailable.</video>
              ) : (
                <img src={selectedMediaPreview} alt="Selected memory preview" />
              )}
              <div>
                <strong>{mediaFile?.name || form.mediaReference || "Media preview"}</strong>
                <button type="button" className="memory-remove-media" onClick={clearSelectedMedia}>Remove</button>
              </div>
            </div>
          ) : null}

          {isSaving ? (
            <div className="memory-post-progress" role="status" aria-live="polite">
              <div className="memory-post-progress__label">
                <strong>{postingStage === "uploading" ? "Uploading your media" : "Posting your memory"}</strong>
                <span>Please keep this page open</span>
              </div>
              <div className="memory-post-progress__track" aria-hidden="true"><span></span></div>
            </div>
          ) : null}

          <div className="memory-composer__details">
            <label>
              <span>Tag a trip</span>
              <select value={form.tripId} onChange={(e) => setForm({ ...form, tripId: e.target.value })}>
                <option value="">Choose a trip (optional)</option>
                {trips.map((trip) => <option value={trip.id} key={trip.id}>{trip.title}</option>)}
              </select>
            </label>
            <label>
              <span>When did this happen?</span>
              <input type="date" value={form.memoryDate} onChange={(e) => setForm({ ...form, memoryDate: e.target.value })} />
            </label>
          </div>

          <details className="memory-family-picker">
            <summary>Tag family members <span>Optional</span></summary>
            <select
              multiple
              value={form.memberIds}
              onChange={(e) => setForm({ ...form, memberIds: Array.from(e.target.selectedOptions, (option) => option.value) })}
            >
              {users.map((person) => (
                <option value={person.id} key={person.id}>{person.full_name} ({person.email})</option>
              ))}
            </select>
          </details>

          <div className="memory-composer__footer">
            <label className={`memory-media-button ${isSaving ? "is-disabled" : ""}`}>
              <input key={fileInputKey} type="file" name="media" accept="image/*,video/*" onChange={handleMediaFile} disabled={isSaving} />
              <span aria-hidden="true">＋</span> Photo / video
            </label>
            <small>Photos up to 10MB · videos up to 50MB</small>
            <button type="submit" className="btn btn--primary memory-post-button" disabled={isSaving}>
              {isSaving ? (mediaFile ? "Uploading media…" : "Posting…") : (editingId ? "Save changes" : "Post memory")}
            </button>
            {editingId ? <button type="button" className="btn btn--secondary" disabled={isSaving} onClick={resetMemoryForm}>Cancel</button> : null}
          </div>
        </form>

        <section className="memory-album-panel memory-feed-panel">
          <div className="memory-panel-heading memory-feed-heading">
            <div>
              <p className="eyebrow">Family feed</p>
              <h2>Moments we shared</h2>
            </div>
            <Link to="/trips" className="btn btn--secondary">View trips</Link>
          </div>
          {!memories.length && !message ? (
            <div className="empty-state">
              <strong>No memories yet — share the first moment from your trip.</strong>
              <p>Write a story, add a favourite photo or video, and begin your private family feed.</p>
            </div>
          ) : null}

          <div className="memory-feed">
            {memories.map((memory) => {
              const authorName = memory.creator_name || "Family member";
              const reactionTotal = reactions.reduce(
                (total, reaction) => total + Number(memory[reaction.countKey] || 0),
                0
              );

              return (
                <article className="memory-feed-post" key={memory.id}>
                  <header className="memory-feed-post__header">
                    <span className="memory-feed-post__avatar" aria-hidden="true">{getInitials(authorName)}</span>
                    <div className="memory-feed-post__author">
                      <strong>{authorName}</strong>
                      <p>
                        {memory.trip_title ? <span className="memory-trip-tag">◇ {memory.trip_title}</span> : "Shared a travel memory"}
                        <span aria-hidden="true"> · </span>
                        <time dateTime={(memory.memory_date || memory.created_at || "").slice(0, 10)}>
                          {formatMemoryDate(memory.memory_date || memory.created_at)}
                        </time>
                      </p>
                    </div>
                    {(user?.role === "admin" || user?.id === memory.created_by) ? (
                      <div className="memory-post-actions">
                        <button type="button" onClick={() => editMemory(memory)}>Edit</button>
                        <button type="button" onClick={() => deleteMemory(memory)}>Delete</button>
                      </div>
                    ) : null}
                  </header>

                  <div className="memory-feed-post__copy">
                    {memory.title ? <h3>{memory.title}</h3> : null}
                    <p>{memory.story}</p>
                  </div>

                  <MediaPreview memory={memory} />

                  {(memory.members || []).length ? (
                    <div className="memory-feed-post__people">
                      <span>With</span>
                      {memory.members.map((member) => <strong key={member.id}>{member.full_name}</strong>)}
                    </div>
                  ) : null}

                  <div className="memory-feed-post__engagement">
                    <span>{reactionTotal} {reactionTotal === 1 ? "reaction" : "reactions"}</span>
                  </div>
                  <div className="reaction-row memory-feed-reactions">
                    {reactions.map((reaction) => (
                      <button
                        type="button"
                        className={`reaction-button ${memory[reaction.reactedKey] ? "is-reacted" : ""}`}
                        key={reaction.key}
                        aria-pressed={Boolean(memory[reaction.reactedKey])}
                        aria-label={`${reaction.label}: ${Number(memory[reaction.countKey] || 0)} reactions${memory[reaction.reactedKey] ? ", selected" : ""}`}
                        disabled={reactingKey === `${memory.id}-${reaction.key}`}
                        onClick={() => reactToMemory(memory, reaction.key)}
                      >
                        <span>{reaction.icon}</span>
                        <small>{reaction.label}</small>
                        <strong>{Number(memory[reaction.countKey] || 0)}</strong>
                      </button>
                    ))}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </div>
    </AppShell>
  );
}

export default Memories;
