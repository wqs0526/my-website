import { Link } from "react-router-dom";

function Dashboard() {
  return (
    <main className="dashboard-page">
      <div className="container-xxl py-5">
        <section className="dashboard-card">
          <p className="eyebrow">Placeholder dashboard</p>
          <h1>You are signed in.</h1>
          <p>
            This is a temporary dashboard route for now. Once your backend is
            ready, we can connect login, sign up, and real trip data here.
          </p>
          <div className="hero__actions d-flex flex-wrap gap-3 justify-content-center">
            <Link to="/" className="btn btn--secondary btn--large">
              Back to home
            </Link>
            <Link to="/login" className="btn btn--primary btn--large">
              Open auth page
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

export default Dashboard;
