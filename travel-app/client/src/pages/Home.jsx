import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";

function Home() {
  return (
    <div className="page">
      <Navbar />

      <main>
        <section className="hero">
          <div className="hero__content">
            <p className="eyebrow">Shared travel memories, better trip planning</p>
            <h1>Plan future adventures and relive every journey together.</h1>
            <p className="hero__text">
              TravelSync helps you organise itineraries, upload travel memories,
              and collaborate with your travel buddies in one beautiful space.
            </p>

            <div className="hero__actions">
              <Link to="/register" className="btn btn--primary btn--large">
                Start Planning
              </Link>
              <a href="#features" className="btn btn--secondary btn--large">
                Explore Features
              </a>
            </div>

            <div className="hero__stats">
              <div className="stat-card">
                <h3>Trips</h3>
                <p>Create shared journeys with your group.</p>
              </div>
              <div className="stat-card">
                <h3>Memories</h3>
                <p>Store photos, videos, and stories by location.</p>
              </div>
              <div className="stat-card">
                <h3>Realtime</h3>
                <p>Edit trip plans together without the mess.</p>
              </div>
            </div>
          </div>

          <div className="hero__visual">
            <div className="mockup-card mockup-card--main">
              <p className="mockup-label">Upcoming Trip</p>
              <h3>Japan Spring Escape</h3>
              <ul>
                <li>Day 1 — Tokyo food trail</li>
                <li>Day 2 — Mount Fuji photoshoot</li>
                <li>Day 3 — Kyoto cultural walk</li>
              </ul>
            </div>

            <div className="mockup-card mockup-card--small top">
              <p className="mockup-label">Memory Board</p>
              <span>Photos • Videos • Notes</span>
            </div>

            <div className="mockup-card mockup-card--small bottom">
              <p className="mockup-label">Shared Editing</p>
              <span>Live updates with travel buddies</span>
            </div>
          </div>
        </section>

        <section id="features" className="section">
          <div className="section-heading">
            <p className="eyebrow">Features</p>
            <h2>Everything you need for planning and preserving your trips</h2>
            <p>
              From itinerary building to memory uploads, your travel experience
              stays organised and easy to share.
            </p>
          </div>

          <div className="feature-grid">
            <article className="feature-card">
              <div className="feature-icon">📅</div>
              <h3>Smart Trip Planning</h3>
              <p>
                Organise your trip by day, manage activities, and keep everyone
                aligned on the itinerary.
              </p>
            </article>

            <article className="feature-card">
              <div className="feature-icon">📸</div>
              <h3>Memory Uploads</h3>
              <p>
                Save your favourite moments with photos, videos, captions, and
                location-based memories.
              </p>
            </article>

            <article className="feature-card">
              <div className="feature-icon">👥</div>
              <h3>Shared Access</h3>
              <p>
                Let your travel buddies view and edit trips online without
                touching your code or setup.
              </p>
            </article>

            <article className="feature-card">
              <div className="feature-icon">🗺️</div>
              <h3>Location-Based Experiences</h3>
              <p>
                Group memories by destinations so every place has its own story.
              </p>
            </article>

            <article className="feature-card">
              <div className="feature-icon">⚡</div>
              <h3>Realtime Collaboration</h3>
              <p>
                Update plans together and keep everyone synced as your travel
                ideas evolve.
              </p>
            </article>

            <article className="feature-card">
              <div className="feature-icon">☁️</div>
              <h3>Cloud-Friendly</h3>
              <p>
                Designed for media-heavy travel content so your memories stay
                accessible and scalable.
              </p>
            </article>
          </div>
        </section>

        <section id="collaboration" className="section section--split">
          <div className="split-card">
            <p className="eyebrow">Built for groups</p>
            <h2>Travel together, even before the trip starts</h2>
            <p>
              Share ideas, discuss activities, and update plans in one place.
              No more scattered notes, screenshots, and chat messages.
            </p>

            <ul className="check-list">
              <li>Collaborative trip editing</li>
              <li>One shared place for travel memories</li>
              <li>Clear structure by location and day</li>
              <li>Easy viewing for all trip members</li>
            </ul>
          </div>

          <div className="split-panel">
            <div className="activity-card">
              <p className="activity-title">Today’s planning update</p>
              <div className="activity-item">
                <span className="dot"></span>
                <p>Alex added “Shibuya Sky” to Day 1</p>
              </div>
              <div className="activity-item">
                <span className="dot"></span>
                <p>Jamie uploaded 12 Osaka food photos</p>
              </div>
              <div className="activity-item">
                <span className="dot"></span>
                <p>You updated the Kyoto hotel notes</p>
              </div>
            </div>
          </div>
        </section>

        <section id="plan" className="cta-section">
          <div className="cta-box">
            <p className="eyebrow">Start now</p>
            <h2>Turn your next trip into a shared experience.</h2>
            <p>
              Build your first trip board, invite your travel buddies, and keep
              every memory in one place.
            </p>

            <div className="hero__actions">
              <Link to="/register" className="btn btn--primary btn--large">
                Create Your Account
              </Link>
              <Link to="/login" className="btn btn--secondary btn--large">
                Login
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default Home;