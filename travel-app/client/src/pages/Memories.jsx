import { useCallback, useEffect, useRef, useState } from "react";
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

const MAX_MEDIA_FILES = 10;
const MAX_IMAGE_SIZE = 20 * 1024 * 1024;
const MAX_VIDEO_SIZE = 100 * 1024 * 1024;

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

function getMemoryMedia(memory) {
  if (memory.mediaItems?.length) return memory.mediaItems;
  if (!memory.media_url) return [];
  return [{
    id: `legacy-${memory.id}`,
    mediaUrl: memory.media_url,
    mediaReference: memory.media_reference,
    mediaType: memory.media_type || "photo",
    sortOrder: 0,
  }];
}

function MemoryMediaGallery({ memory }) {
  const mediaItems = getMemoryMedia(memory);
  if (!mediaItems.length) return null;

  const visibleItems = mediaItems.slice(0, 4);
  const remainingCount = mediaItems.length - visibleItems.length;

  return (
    <div className={`memory-post-media-grid memory-post-media-grid--${Math.min(mediaItems.length, 4)}`}>
      {visibleItems.map((item, index) => (
        <div className="memory-post-media-item" key={item.id || item.mediaReference || `${item.mediaUrl}-${index}`}>
          {item.mediaType === "video" ? (
            <video src={item.mediaUrl} controls preload="metadata">Video preview unavailable.</video>
          ) : (
            <a href={item.mediaUrl} target="_blank" rel="noreferrer">
              <img src={item.mediaUrl} alt={`${memory.title || "Travel memory"} ${index + 1}`} />
            </a>
          )}
          {index === visibleItems.length - 1 && remainingCount > 0 ? (
            <span className="memory-media-more" aria-label={`${remainingCount} more media items`}>+{remainingCount}</span>
          ) : null}
        </div>
      ))}
    </div>
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
  const [selectedMediaFiles, setSelectedMediaFiles] = useState([]);
  const [existingMediaItems, setExistingMediaItems] = useState([]);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [messageType, setMessageType] = useState("error");
  const [postingStage, setPostingStage] = useState("idle");
  const [reactingKey, setReactingKey] = useState("");
  const selectedMediaFilesRef = useRef([]);

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
    selectedMediaFilesRef.current = selectedMediaFiles;
  }, [selectedMediaFiles]);

  useEffect(() => () => {
    selectedMediaFilesRef.current.forEach((item) => URL.revokeObjectURL(item.previewUrl));
  }, []);

  const resetMemoryForm = () => {
    selectedMediaFiles.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    setForm(blankMemory);
    setEditingId(null);
    setSelectedMediaFiles([]);
    setExistingMediaItems([]);
    setFileInputKey((key) => key + 1);
  };

  const removeSelectedMedia = (key) => {
    setSelectedMediaFiles((current) => {
      const removedItem = current.find((item) => item.key === key);
      if (removedItem) URL.revokeObjectURL(removedItem.previewUrl);
      return current.filter((item) => item.key !== key);
    });
  };

  const removeExistingMedia = (itemToRemove) => {
    setExistingMediaItems((current) => current.filter((item) => item !== itemToRemove));
  };

  const handleMediaFiles = (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = "";
    if (!files.length) return;

    if (existingMediaItems.length + selectedMediaFiles.length + files.length > MAX_MEDIA_FILES) {
      setMessageType("error");
      setMessage(`You can attach up to ${MAX_MEDIA_FILES} photos or videos to one memory.`);
      return;
    }

    const unsupportedFile = files.find(
      (file) => !file.type.startsWith("image/") && !file.type.startsWith("video/")
    );
    if (unsupportedFile) {
      setMessageType("error");
      setMessage(`${unsupportedFile.name} is not a supported photo or video.`);
      return;
    }

    const oversizedImage = files.find(
      (file) => file.type.startsWith("image/") && file.size > MAX_IMAGE_SIZE
    );
    if (oversizedImage) {
      setMessageType("error");
      setMessage(`${oversizedImage.name} is larger than the 20MB image limit.`);
      return;
    }

    const oversizedVideo = files.find(
      (file) => file.type.startsWith("video/") && file.size > MAX_VIDEO_SIZE
    );
    if (oversizedVideo) {
      setMessageType("error");
      setMessage(`${oversizedVideo.name} is larger than the 100MB video limit.`);
      return;
    }

    const timestamp = Date.now();
    const newItems = files.map((file, index) => ({
      key: `${timestamp}-${index}-${file.name}`,
      file,
      name: file.name,
      mediaType: file.type.startsWith("video/") ? "video" : "photo",
      previewUrl: URL.createObjectURL(file),
    }));
    setMessage("");
    setSelectedMediaFiles((current) => [...current, ...newItems]);
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
    setPostingStage(selectedMediaFiles.length ? "uploading" : "posting");

    try {
      let memoryPayload = {
        ...form,
        title: form.title.trim() || getFallbackTitle(form.story),
        story: form.story.trim(),
      };

      let uploadedMediaItems = [];
      if (selectedMediaFiles.length) {
        const uploadedMedia = await uploadMemoryMedia(selectedMediaFiles.map((item) => item.file));
        uploadedMediaItems = uploadedMedia.mediaItems || [];
        if (uploadedMediaItems.length !== selectedMediaFiles.length) {
          throw new Error("Not all media files finished uploading. Nothing was posted, so please try again.");
        }
        setPostingStage("posting");
      }

      memoryPayload.mediaItems = [...existingMediaItems, ...uploadedMediaItems].map((item, index) => ({
        mediaUrl: item.mediaUrl,
        mediaReference: item.mediaReference,
        mediaType: item.mediaType,
        sortOrder: index,
      }));

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
    selectedMediaFiles.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    setSelectedMediaFiles([]);
    setExistingMediaItems(getMemoryMedia(memory));
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

  const totalMediaCount = existingMediaItems.length + selectedMediaFiles.length;
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

          {totalMediaCount ? (
            <section className="memory-selected-media" aria-label="Selected media previews">
              <div className="memory-selected-media__heading">
                <strong>{totalMediaCount} of {MAX_MEDIA_FILES} selected</strong>
                <span>Photos and videos will appear in this order</span>
              </div>
              <div className="memory-selected-media__grid">
                {existingMediaItems.map((item, index) => (
                  <div className="memory-selected-media__item" key={item.id || item.mediaReference || `${item.mediaUrl}-${index}`}>
                    {item.mediaType === "video" ? (
                      <video src={item.mediaUrl} controls preload="metadata">Preview unavailable.</video>
                    ) : (
                      <img src={item.mediaUrl} alt={`Existing memory media ${index + 1}`} />
                    )}
                    <button type="button" onClick={() => removeExistingMedia(item)} aria-label={`Remove existing media ${index + 1}`}>Remove</button>
                  </div>
                ))}
                {selectedMediaFiles.map((item, index) => (
                  <div className="memory-selected-media__item" key={item.key}>
                    {item.mediaType === "video" ? (
                      <video src={item.previewUrl} controls preload="metadata">Preview unavailable.</video>
                    ) : (
                      <img src={item.previewUrl} alt={`Selected ${item.name}`} />
                    )}
                    <span title={item.name}>{item.name}</span>
                    <button type="button" onClick={() => removeSelectedMedia(item.key)} aria-label={`Remove ${item.name}`}>Remove</button>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {isSaving ? (
            <div className="memory-post-progress" role="status" aria-live="polite">
              <div className="memory-post-progress__label">
                <strong>{postingStage === "uploading" ? `Uploading ${selectedMediaFiles.length} media file${selectedMediaFiles.length === 1 ? "" : "s"}` : "Posting your memory"}</strong>
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
            <label className={`memory-media-button ${isSaving || totalMediaCount >= MAX_MEDIA_FILES ? "is-disabled" : ""}`}>
              <input key={fileInputKey} type="file" name="media" accept="image/*,video/*" multiple onChange={handleMediaFiles} disabled={isSaving || totalMediaCount >= MAX_MEDIA_FILES} />
              <span aria-hidden="true">＋</span> Photo / video
            </label>
            <small>Up to 10 files · photos 20MB each · videos 100MB each</small>
            <button type="submit" className="btn btn--primary memory-post-button" disabled={isSaving}>
              {isSaving ? (selectedMediaFiles.length ? "Uploading media…" : "Posting…") : (editingId ? "Save changes" : "Post memory")}
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

                  <MemoryMediaGallery memory={memory} />

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
