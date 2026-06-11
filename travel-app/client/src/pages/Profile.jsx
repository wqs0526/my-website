import AppShell from "../components/AppShell";
import useCurrentUser from "../hooks/useCurrentUser";

function Profile() {
  const { user } = useCurrentUser();

  return (
    <AppShell user={user}>
      <section className="app-header">
        <p className="eyebrow">Profile</p>
        <h1>{user?.fullName || "Your profile"}</h1>
      </section>

      <section className="panel profile-panel">
        <p><strong>Email:</strong> {user?.email}</p>
        <p><strong>Phone:</strong> +65 {user?.phone}</p>
        <p><strong>Role:</strong> {user?.role}</p>
        <p><strong>Invitation code used:</strong> {user?.inviteCode}</p>
      </section>
    </AppShell>
  );
}

export default Profile;
