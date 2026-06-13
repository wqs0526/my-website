import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";

const highlights = [
  {
    title: "Trip ideas in one place",
    text: "Keep hotel notes, places to eat, and little reminders together so no one has to scroll through old chats.",
  },
  {
    title: "A memory wall for our photos",
    text: "Save pictures, short notes, and small moments from every stop so each trip still feels alive later on.",
  },
  {
    title: "Easy for the whole family",
    text: "Everyone can check the plan, add something useful, or revisit past trips without needing anything complicated.",
  },
];

const memoryMoments = [
  "Morning kopi before the airport run",
  "Auntie's must-visit food spot pinned for day two",
  "Family photo shortlist saved after the trip",
  "Hotel check-in notes kept where everyone can find them",
];

function Home() {
  return (
    <div className="page">
      <Navbar />

      <main>
        <section className="hero hero--immersive" id="home">
          <div className="container-xxl">
            <div className="hero__content">
              <p className="hero-kicker">Our family travel space</p>
              <h1>Plan the next adventure. Relive every moment after.</h1>
              <p className="hero__text">
                TravelSync keeps upcoming plans, useful details, and favourite
                moments in one private family workspace that feels easy to open
                before, during, and after every trip.
              </p>

              <div className="hero__actions d-flex flex-wrap gap-3 justify-content-start">
                <Link to="/login" className="btn btn--primary btn--large">
                  Start planning
                </Link>
                <Link to="/register" className="btn btn--secondary btn--large">
                  Join the family space
                </Link>
              </div>

              <div className="travel-chip-row">
                <span className="travel-chip">Trip boards</span>
                <span className="travel-chip">Family memories</span>
                <span className="travel-chip">Shared plans</span>
              </div>
            </div>
          </div>
        </section>

        <div className="container-xxl">
          <div className="hero-tray reveal">
            <article className="stat-card">
              <span className="stat-label">Before</span>
              <h3>Build the shared plan</h3>
              <p>Dates, places, reminders, and ideas become one clear travel board.</p>
            </article>
            <article className="stat-card">
              <span className="stat-label">During</span>
              <h3>Keep details close</h3>
              <p>Everyone can check what matters without searching old messages.</p>
            </article>
            <article className="stat-card">
              <span className="stat-label">After</span>
              <h3>Save the feeling</h3>
              <p>Stories and media links stay connected to the trips they came from.</p>
            </article>
          </div>
        </div>

        <section className="section section--soft" id="memories">
          <div className="container-xxl">
            <div className="section-heading reveal">
              <p className="eyebrow">Family-first planning</p>
              <h2>Useful before the trip, warm after the trip.</h2>
              <p>
                The site is designed as a practical travel board and a simple
                scrapbook, so the whole family can find plans quickly and return
                to the stories later.
              </p>
            </div>

            <div className="row g-4">
              {highlights.map((item) => (
                <div className="col-12 col-lg-4" key={item.title}>
                  <article className="feature-card reveal">
                    <div className="feature-badge">{item.title.slice(0, 1)}</div>
                    <h3>{item.title}</h3>
                    <p>{item.text}</p>
                  </article>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="section" id="trip-board">
          <div className="container-xxl">
            <div className="section-heading reveal">
              <p className="eyebrow">Memory album preview</p>
              <h2>Small moments can feel big again.</h2>
              <p>TravelSync treats each note like part of a family story, not another admin record.</p>
            </div>
            <div className="memory-strip mb-5">
              {memoryMoments.map((moment, index) => (
                <article className="memory-tile reveal" key={moment}>
                  <strong>Memory {index + 1}</strong>
                  <span>{moment}</span>
                </article>
              ))}
            </div>
            <div className="row g-4 align-items-stretch">
              <div className="col-12 col-lg-6">
                <div className="split-card h-100 reveal">
                  <p className="eyebrow">How we can use it</p>
                  <h2>Before, during, and after each trip, everything stays connected.</h2>
                  <p>
                    We can sketch plans before leaving, check small details
                    while we are out, and come back later to the photos and
                    notes that mattered most.
                  </p>

                  <ul className="check-list">
                    <li>Plan days without losing everyone's suggestions</li>
                    <li>Keep important notes where the family can find them</li>
                    <li>Save memories with context instead of random photo folders</li>
                    <li>Make future trips easier by learning from past ones</li>
                  </ul>
                </div>
              </div>

              <div className="col-12 col-lg-6">
                <div className="split-panel h-100 reveal">
                  <div className="activity-card">
                    <p className="activity-title">Little things worth keeping</p>
                    {memoryMoments.map((moment) => (
                      <div className="activity-item" key={moment}>
                        <p>{moment}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="cta-section pb-5" id="join">
          <div className="container-xxl">
            <div className="cta-box">
              <p className="eyebrow">Ready when we are</p>
              <h2>A simple home for trips taken and trips still ahead.</h2>
              <p>
                Sign in to continue planning, add new memories, or open a trip
                and see what everyone has already saved there.
              </p>

              <div className="hero__actions hero__actions--center d-flex flex-wrap gap-3 justify-content-center">
                <Link to="/login" className="btn btn--primary btn--large">
                  Sign in
                </Link>
                <Link to="/register" className="btn btn--secondary btn--large">
                  Create a family account
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default Home;
