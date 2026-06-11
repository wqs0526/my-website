import { useEffect, useState } from "react";
import { apiRequest } from "../api";
import AppShell from "../components/AppShell";
import useCurrentUser from "../hooks/useCurrentUser";

function Admin() {
  const { user } = useCurrentUser();
  const [users, setUsers] = useState([]);
  const [codes, setCodes] = useState([]);
  const [settings, setSettings] = useState([]);
  const [logs, setLogs] = useState([]);
  const [inviteCode, setInviteCode] = useState("FAMILY");
  const [setting, setSetting] = useState({ key: "site_notice", value: "" });
  const [message, setMessage] = useState("");

  const loadAdmin = () => {
    Promise.all([
      apiRequest("/api/admin/users"),
      apiRequest("/api/admin/invites"),
      apiRequest("/api/admin/settings"),
      apiRequest("/api/admin/audit-logs"),
    ])
      .then(([userData, inviteData, settingsData, logData]) => {
        setUsers(userData.users);
        setCodes(inviteData.codes);
        setSettings(settingsData.settings);
        setLogs(logData.logs);
      })
      .catch((error) => setMessage(error.message));
  };

  useEffect(loadAdmin, []);

  const saveInvite = async (event) => {
    event.preventDefault();
    await apiRequest("/api/admin/invites", { method: "POST", body: JSON.stringify({ code: inviteCode }) });
    loadAdmin();
  };

  const toggleInvite = async (code) => {
    await apiRequest(`/api/admin/invites/${code.id}`, { method: "PUT", body: JSON.stringify({ isActive: !code.is_active }) });
    loadAdmin();
  };

  const updateUser = async (person, role) => {
    await apiRequest(`/api/admin/users/${person.id}`, {
      method: "PUT",
      body: JSON.stringify({ fullName: person.full_name, phone: person.phone, role }),
    });
    loadAdmin();
  };

  const deleteUser = async (person) => {
    if (!window.confirm(`Delete ${person.email}?`)) return;
    await apiRequest(`/api/admin/users/${person.id}`, { method: "DELETE" });
    loadAdmin();
  };

  const saveSetting = async (event) => {
    event.preventDefault();
    await apiRequest("/api/admin/settings", { method: "PUT", body: JSON.stringify(setting) });
    setSetting({ key: "site_notice", value: "" });
    loadAdmin();
  };

  return (
    <AppShell user={user}>
      <section className="app-header">
        <p className="eyebrow">Admin panel</p>
        <h1>User, content, system, and audit controls.</h1>
      </section>

      {message ? <p className="auth-alert">{message}</p> : null}

      <div className="admin-grid">
        <section className="panel">
          <h2>User management</h2>
          {users.map((person) => (
            <article className="admin-row" key={person.id}>
              <div>
                <strong>{person.full_name}</strong>
                <p>{person.email} · {person.role}</p>
              </div>
              <div className="inline-actions">
                <button type="button" className="btn btn--secondary" onClick={() => updateUser(person, person.role === "admin" ? "member" : "admin")}>Toggle role</button>
                <button type="button" className="btn btn--secondary" onClick={() => deleteUser(person)}>Delete</button>
              </div>
            </article>
          ))}
        </section>

        <section className="panel">
          <h2>Invitation codes</h2>
          <form className="inline-form" onSubmit={saveInvite}>
            <input value={inviteCode} onChange={(e) => setInviteCode(e.target.value)} />
            <button type="submit" className="btn btn--primary">Save code</button>
          </form>
          {codes.map((code) => (
            <article className="admin-row" key={code.id}>
              <strong>{code.code}</strong>
              <button type="button" className="btn btn--secondary" onClick={() => toggleInvite(code)}>
                {code.is_active ? "Deactivate" : "Activate"}
              </button>
            </article>
          ))}
        </section>

        <section className="panel">
          <h2>System configuration</h2>
          <form className="form-grid" onSubmit={saveSetting}>
            <input placeholder="Setting key" value={setting.key} onChange={(e) => setSetting({ ...setting, key: e.target.value })} />
            <textarea placeholder="Setting value" value={setting.value} onChange={(e) => setSetting({ ...setting, value: e.target.value })}></textarea>
            <button type="submit" className="btn btn--primary">Save setting</button>
          </form>
          {settings.map((item) => <p key={item.id}><strong>{item.setting_key}:</strong> {item.setting_value}</p>)}
        </section>

        <section className="panel">
          <h2>Monitoring and audit logs</h2>
          {logs.map((log) => (
            <article className="log-row" key={log.id}>
              <strong>{log.action}</strong>
              <p>{log.details}</p>
              <small>{log.user_email || "system"} · {new Date(log.created_at).toLocaleString()}</small>
            </article>
          ))}
        </section>
      </div>
    </AppShell>
  );
}

export default Admin;
