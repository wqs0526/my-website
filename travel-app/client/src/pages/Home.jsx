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
        <section className="hero py-5" id="home">
          <div className="container-xxl">
            <div className="row align-items-center g-5">
              <div className="col-lg-7">
                <div className="hero__content">
                  <p className="eyebrow">Our family travel space</p>
                  <h1>A calm place to plan trips and keep the memories together.</h1>
                  <p className="hero__text">
                    This space is for us. It keeps upcoming plans, useful
                    details, and favourite moments in one warm, easy-to-check
                    home so every trip feels more organised and every memory is
                    easier to return to.
                  </p>

                  <div className="hero__actions d-flex flex-wrap gap-3">
                    <Link to="/login" className="btn btn--primary btn--large">
                      Open our space
                    </Link>
                    <a href="#memories" className="btn btn--secondary btn--large">
                      See how it feels
                    </a>
                  </div>

                  <div className="row g-3">
                    <div className="col-12 col-md-4">
                      <div className="stat-card h-100">
                        <span className="stat-label">Upcoming</span>
                        <h3>One shared trip board</h3>
                        <p>
                          Dates, ideas, places, and reminders collected in one
                          view.
                        </p>
                      </div>
                    </div>
                    <div className="col-12 col-md-4">
                      <div className="stat-card h-100">
                        <span className="stat-label">After the trip</span>
                        <h3>A simple memory corner</h3>
                        <p>
                          Photos, notes, and stories saved by destination and
                          day.
                        </p>
                      </div>
                    </div>
                    <div className="col-12 col-md-4">
                      <div className="stat-card h-100">
                        <span className="stat-label">For everyone</span>
                        <h3>Less chat chaos</h3>
                        <p>
                          Useful updates stay easy to find when someone needs
                          them.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-lg-5">
                <div className="hero__visual d-flex align-items-center justify-content-center">
                  <div className="postcard-stack">
                    <article className="postcard postcard--main">
                      <p className="mockup-label">Next family trip</p>
                      <h3>Weekend in Kyoto</h3>
                      <ul className="postcard-list">
                        <li>Saturday breakfast spot saved</li>
                        <li>Temple walk added for the afternoon</li>
                        <li>Photo places pinned for sunset</li>
                      </ul>
                    </article>

                    <article className="postcard postcard--note postcard--top">
                      <p className="mockup-label">Shared reminder</p>
                      <span>
                        Bring passports, chargers, snacks, and camera batteries.
                      </span>
                    </article>

                    <article className="postcard postcard--note postcard--bottom">
                      <p className="mockup-label">Saved memory</p>
                      <span>
                        Favourite ramen shop and the photo outside the station.
                      </span>
                    </article>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section section--soft py-5" id="memories">
          <div className="container-xxl">
            <div className="section-heading section-heading--left">
              <p className="eyebrow">Why this page feels different</p>
              <h2>More like a family scrapbook, less like a product homepage.</h2>
              <p>
                The goal is not to sell anything. It is simply to welcome our
                family into a shared place where planning feels lighter and old
                trips stay easy to revisit.
              </p>
            </div>

            <div className="row g-4">
              {highlights.map((item) => (
                <div className="col-12 col-lg-4" key={item.title}>
                  <article className="feature-card h-100">
                    <div className="feature-badge">{item.title.slice(0, 1)}</div>
                    <h3>{item.title}</h3>
                    <p>{item.text}</p>
                  </article>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="section py-5" id="trip-board">
          <div className="container-xxl">
            <div className="row g-4 align-items-stretch">
              <div className="col-12 col-lg-6">
                <div className="split-card split-card--warm h-100">
                  <p className="eyebrow">How we can use it</p>
                  <h2>
                    Before, during, and after each trip, everything stays
                    connected.
                  </h2>
                  <p>
                    We can sketch plans before leaving, check small details
                    while we are out, and come back later to the photos and
                    notes that mattered most. Nothing fancy, just a better way
                    to keep our trips together.
                  </p>

                  <ul className="check-list">
                    <li>Plan days without losing everyone's suggestions</li>
                    <li>
                      Keep important notes where the family can actually find
                      them
                    </li>
                    <li>
                      Save memories with context instead of random photo folders
                    </li>
                    <li>Make future trips easier by learning from past ones</li>
                  </ul>
                </div>
              </div>

              <div className="col-12 col-lg-6">
                <div className="split-panel h-100">
                  <div className="activity-card h-100">
                    <p className="activity-title">Little things worth keeping</p>
                    {memoryMoments.map((moment) => (
                      <div className="activity-item" key={moment}>
                        <span className="dot"></span>
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
              <h2>
                A simple home for the trips we have taken and the ones still
                ahead.
              </h2>
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
