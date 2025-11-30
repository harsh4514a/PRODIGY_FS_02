import React, { useEffect, useState } from "react";
import api from "./api";

function App() {
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [user, setUser] = useState(
    localStorage.getItem("user")
      ? JSON.parse(localStorage.getItem("user"))
      : null
  );

  const handleLoginSuccess = (data) => {
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
  };

  const handleLogout = () => {
    setToken("");
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  };

  return (
    <div className="app-container">
      <h1 className="app-title">Employee Management System</h1>
      {!token ? (
        <LoginForm onLoginSuccess={handleLoginSuccess} />
      ) : (
        <Dashboard user={user} onLogout={handleLogout} />
      )}
    </div>
  );
}

// ---------------------- Login Form ----------------------
function LoginForm({ onLoginSuccess }) {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin123");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/api/auth/login", { username, password });
      onLoginSuccess(res.data);
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message || "Login failed. Please check credentials."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h2>Admin Login</h2>
      <form onSubmit={handleSubmit} className="form">
        <label>
          Username
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
          />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            autoComplete="current-password"
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        {error && <p className="error-text">{error}</p>}
        <button type="submit" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
      
    </div>
  );
}

// ---------------------- Dashboard ----------------------
function Dashboard({ user, onLogout }) {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formMode, setFormMode] = useState("create"); // "create" | "edit"
  const [currentId, setCurrentId] = useState(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    position: "",
    department: "",
    salary: "",
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const resetForm = () => {
    setForm({
      name: "",
      email: "",
      position: "",
      department: "",
      salary: "",
    });
    setCurrentId(null);
    setFormMode("create");
  };

  const fetchEmployees = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/api/employees");
      setEmployees(res.data);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch employees");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (
      !form.name ||
      !form.email ||
      !form.position ||
      !form.department ||
      !form.salary
    ) {
      setError("All fields are required");
      return;
    }

    try {
      if (formMode === "create") {
        const res = await api.post("/api/employees", {
          ...form,
          salary: Number(form.salary),
        });
        setEmployees((prev) => [res.data, ...prev]);
        setMessage("Employee created successfully");
      } else {
        const res = await api.put(`/api/employees/${currentId}`, {
          ...form,
          salary: Number(form.salary),
        });
        setEmployees((prev) =>
          prev.map((emp) => (emp.id === currentId ? res.data : emp))
        );
        setMessage("Employee updated successfully");
      }
      resetForm();
    } catch (err) {
      console.error(err);
      const msg =
        err.response?.data?.message ||
        err.response?.data?.errors?.[0]?.msg ||
        "Operation failed";
      setError(msg);
    }
  };

  const handleEdit = (emp) => {
    setFormMode("edit");
    setCurrentId(emp.id);
    setForm({
      name: emp.name,
      email: emp.email,
      position: emp.position,
      department: emp.department,
      salary: emp.salary,
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this employee?"))
      return;
    try {
      await api.delete(`/api/employees/${id}`);
      setEmployees((prev) => prev.filter((emp) => emp.id !== id));
      setMessage("Employee deleted");
    } catch (err) {
      console.error(err);
      setError("Failed to delete employee");
    }
  };

  const [searchTerm, setSearchTerm] = useState("");

  const filteredEmployees = employees.filter((emp) => {
    const term = searchTerm.toLowerCase();
    return (
      emp.name.toLowerCase().includes(term) ||
      emp.email.toLowerCase().includes(term) ||
      emp.position.toLowerCase().includes(term) ||
      emp.department.toLowerCase().includes(term)
    );
  });

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h2>Welcome, {user?.username}</h2>
          <p className="subtitle">Role: {user?.role}</p>
        </div>
        <button onClick={onLogout} className="logout-btn">
          Logout
        </button>
      </div>

      <div className="grid">
        {/* Form */}
        <div className="card">
          <h3>
            {formMode === "create" ? "Add New Employee" : "Edit Employee"}
          </h3>
          <form onSubmit={handleSubmit} className="form">
            <label>
              Name
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                type="text"
              />
            </label>
            <label>
              Email
              <input
                name="email"
                value={form.email}
                onChange={handleChange}
                type="email"
              />
            </label>
            <label>
              Position
              <input
                name="position"
                value={form.position}
                onChange={handleChange}
                type="text"
              />
            </label>
            <label>
              Department
              <input
                name="department"
                value={form.department}
                onChange={handleChange}
                type="text"
              />
            </label>
            <label>
              Salary
              <input
                name="salary"
                value={form.salary}
                onChange={handleChange}
                type="number"
                min="0"
              />
            </label>

            {error && <p className="error-text">{error}</p>}
            {message && <p className="success-text">{message}</p>}

            <div className="form-actions">
              <button type="submit">
                {formMode === "create" ? "Create" : "Update"}
              </button>
              {formMode === "edit" && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="secondary-btn"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Employee List */}
        <div className="card">
          <div className="table-header">
            <div>
              <h3>Employee List</h3>
              <p className="table-subtitle">
                {employees.length === 0
                  ? "No employees added yet"
                  : `${employees.length} total employee${
                      employees.length > 1 ? "s" : ""
                    }`}
              </p>
            </div>
            <div className="table-header-actions">
              <input
                type="text"
                placeholder="Search by name, email, role..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
              <button onClick={fetchEmployees} className="secondary-btn small">
                Refresh
              </button>
            </div>
          </div>

          {loading ? (
            <p>Loading employees...</p>
          ) : filteredEmployees.length === 0 ? (
            <div className="empty-state">
              <p className="empty-title">No matching employees</p>
              <p className="empty-text">
                Try changing the search term or add a new employee using the
                form.
              </p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Employee</th>
                    <th>Position</th>
                    <th>Department</th>
                    <th>Salary</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEmployees.map((emp, index) => (
                    <tr key={emp.id}>
                      <td>{index + 1}</td>
                      <td>
                        <div className="emp-primary">
                          <div className="emp-avatar">
                            {emp.name?.charAt(0)?.toUpperCase()}
                          </div>
                          <div>
                            <div className="emp-name">{emp.name}</div>
                            <div className="emp-email">{emp.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>{emp.position}</td>
                      <td>{emp.department}</td>
                      <td>₹{emp.salary}</td>
                      <td>
                        <div className="row-actions">
                          <button
                            onClick={() => handleEdit(emp)}
                            className="secondary-btn small"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(emp.id)}
                            className="danger-btn small"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
