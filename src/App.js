// App.js
import React, { useState } from "react";
import {
  ApolloClient,
  InMemoryCache,
  HttpLink,
  ApolloProvider,
  useQuery,
  useMutation,
  gql,
} from "@apollo/client";
import "./App.css";

const client = new ApolloClient({
  link: new HttpLink({ uri: "http://localhost:4000/graphql" }),
  cache: new InMemoryCache(),
});

// GraphQL queries/mutations
const SUPER_ADMIN_LOGIN = gql`
  mutation SuperAdminLogin($password: String!) {
    superAdminLogin(password: $password) {
      token
      role
    }
  }
`;

const ORG_LOGIN = gql`
  mutation OrgLogin($slug: String!, $password: String!) {
    organizationLogin(slug: $slug, password: $password) {
      token
      role
    }
  }
`;

const LIST_ORGS = gql`
  query ListOrgs {
    listOrganizations {
      id
      name
      slug
      contact_email
      created_at
    }
  }
`;

const CREATE_ORG = gql`
  mutation CreateOrg($name: String!, $slug: String!, $contact_email: String, $password: String!) {
    createOrganization(name: $name, slug: $slug, contact_email: $contact_email, password: $password) {
      id
      name
      slug
    }
  }
`;

const LIST_PROJECTS = gql`
  query ListProjects {
    listProjects {
      id
      name
      description
      status
      taskCount
      completedTasks
      tasks {
        id
        title
        description
        status
        assignee_email
        due_date
        created_at
        comments {
          id
          content
          author_email
          timestamp
        }
      }
    }
  }
`;

const CREATE_PROJECT = gql`
  mutation CreateProject($input: ProjectInput!) {
    createOrUpdateProject(input: $input) {
      id
      name
      description
      status
      taskCount
      completedTasks
    }
  }
`;

const CREATE_OR_UPDATE_TASK = gql`
  mutation CreateOrUpdateTask($input: TaskInput!) {
    createOrUpdateTask(input: $input) {
      id
      project_id
      title
      description
      status
      assignee_email
      due_date
      created_at
    }
  }
`;

const ADD_COMMENT = gql`
  mutation AddComment($taskId: ID!, $content: String!, $author_email: String) {
    addComment(taskId: $taskId, content: $content, author_email: $author_email) {
      id
      content
      author_email
      timestamp
    }
  }
`;

// ---------------- SuperAdmin Login ----------------
function SuperAdminLogin({ setToken, setRole }) {
  const [password, setPassword] = useState("");
  const [superAdminLogin] = useMutation(SUPER_ADMIN_LOGIN);

  const handleLogin = async () => {
    try {
      const res = await superAdminLogin({ variables: { password } });
      const { token, role } = res.data.superAdminLogin;
      setToken(token);
      setRole(role);
    } catch (err) {
      alert("Super Admin Login Failed: " + (err.message || err));
    }
  };

  return (
    <div className="login-card">
      <h2>Super Admin Login</h2>
      <input type="password" placeholder="Super Admin Password" value={password} onChange={(e) => setPassword(e.target.value)} className="input-field" />
      <button onClick={handleLogin} className="btn-primary mt-2">Login</button>
    </div>
  );
}

// ---------------- Org Login ----------------
function OrgLogin({ setToken, setRole }) {
  const [slug, setSlug] = useState("");
  const [password, setPassword] = useState("");
  const [orgLogin] = useMutation(ORG_LOGIN);

  const handleLogin = async () => {
    try {
      const res = await orgLogin({ variables: { slug, password } });
      const { token, role } = res.data.organizationLogin;
      setToken(token);
      setRole(role);
    } catch (err) {
      alert("Organization Login Failed: " + (err.message || err));
    }
  };

  return (
    <div className="login-card">
      <h2>Organization Login</h2>
      <input placeholder="Organization Slug" value={slug} onChange={(e) => setSlug(e.target.value)} className="input-field" />
      <input type="password" placeholder="Organization Password" value={password} onChange={(e) => setPassword(e.target.value)} className="input-field mt-2" />
      <button onClick={handleLogin} className="btn-primary mt-2">Login</button>
    </div>
  );
}

// ---------------- SuperAdmin Dashboard ----------------
function SuperAdminDashboard({ token, logout }) {
  const { data, loading, error, refetch } = useQuery(LIST_ORGS, {
    context: { headers: { Authorization: `Bearer ${token}` } },
    fetchPolicy: "network-only",
  });

  const [createOrg] = useMutation(CREATE_ORG, {
    context: { headers: { Authorization: `Bearer ${token}` } },
  });

  const [newOrg, setNewOrg] = useState({ name: "", slug: "", contact_email: "", password: "" });

  const handleCreateOrg = async () => {
    if (!newOrg.name || !newOrg.slug || !newOrg.password) {
      alert("Please fill name, slug and password");
      return;
    }
    try {
      await createOrg({ variables: { ...newOrg } });
      setNewOrg({ name: "", slug: "", contact_email: "", password: "" });
      refetch();
    } catch (err) {
      alert("Create org failed: " + (err.message || err));
    }
  };

  if (loading) return <div>Loading organizations...</div>;
  if (error) return <div>Error loading organizations: {error.message}</div>;

  return (
    <div>
      <div className="flex-between">
        <h2 className="text-xl font-bold">Super Admin Dashboard</h2>
        <button onClick={logout} className="btn-secondary">Logout</button>
      </div>

      <div className="mb-6 mt-4">
        <h3>Create New Organization</h3>
        <input placeholder="Name" value={newOrg.name} onChange={e => setNewOrg({ ...newOrg, name: e.target.value })} className="input-field" />
        <input placeholder="Slug" value={newOrg.slug} onChange={e => setNewOrg({ ...newOrg, slug: e.target.value })} className="input-field mt-1" />
        <input placeholder="Contact Email" value={newOrg.contact_email} onChange={e => setNewOrg({ ...newOrg, contact_email: e.target.value })} className="input-field mt-1" />
        <input placeholder="Password" type="password" value={newOrg.password} onChange={e => setNewOrg({ ...newOrg, password: e.target.value })} className="input-field mt-1" />
        <button onClick={handleCreateOrg} className="btn-primary mt-2">Create Organization</button>
      </div>

      <h3>Organizations</h3>
      <table className="table-auto w-full border-collapse border border-gray-400 mt-2">
        <thead>
          <tr className="bg-gray-200">
            <th className="border px-2 py-1">Name</th>
            <th className="border px-2 py-1">Slug</th>
            <th className="border px-2 py-1">Email</th>
            <th className="border px-2 py-1">Created</th>
          </tr>
        </thead>
        <tbody>
          {data.listOrganizations.map(org => (
            <tr key={org.id}>
              <td className="border px-2 py-1">{org.name}</td>
              <td className="border px-2 py-1">{org.slug}</td>
              <td className="border px-2 py-1">{org.contact_email}</td>
              <td className="border px-2 py-1">{org.created_at || "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---------------- Project Tasks Table (in-place editing + top add row + inline comments) ----------------
function ProjectTasksTable({ project, token, onBack }) {
  // This component receives project (with id) and will use LIST_PROJECTS query to get tasks currently in cache/refetch.
  const { data, loading, error, refetch } = useQuery(LIST_PROJECTS, {
    context: { headers: { Authorization: `Bearer ${token}` } },
    fetchPolicy: "network-only",
  });

  const [createOrUpdateTask] = useMutation(CREATE_OR_UPDATE_TASK, { context: { headers: { Authorization: `Bearer ${token}` } } });
  const [addComment] = useMutation(ADD_COMMENT, { context: { headers: { Authorization: `Bearer ${token}` } } });

  // top new-task row state (per project)
  const [newRow, setNewRow] = useState({
    title: "",
    description: "",
    status: "Pending",
    assignee_email: "",
    due_date: ""
  });

  // per-task edit state
  const [edits, setEdits] = useState({}); // taskId -> { title, description, ... }

  // show comment input toggles
  const [showCommentInput, setShowCommentInput] = useState({}); // taskId -> bool
  const [commentValues, setCommentValues] = useState({}); // taskId -> content

  if (loading) return <div>Loading tasks...</div>;
  if (error) return <div>Error loading projects/tasks: {error.message}</div>;

  // find latest project from query result (to get fresh tasks)
  const projectFromServer = data.listProjects.find(p => p.id === project.id);
  const tasks = projectFromServer ? (projectFromServer.tasks || []) : [];

  // Add new task (top row)
  const handleAddNew = async () => {
    if (!newRow.title) {
      alert("Enter title");
      return;
    }
    try {
      await createOrUpdateTask({
        variables: {
          input: {
            project_id: project.id,
            title: newRow.title,
            description: newRow.description || "",
            status: newRow.status || "Pending",
            assignee_email: newRow.assignee_email || null,
            due_date: newRow.due_date || null
          }
        }
      });
      setNewRow({ title: "", description: "", status: "Pending", assignee_email: "", due_date: "" });
      await refetch();
    } catch (err) {
      alert("Add task failed: " + (err.message || err));
    }
  };

  // Save edited task fields
  const handleSaveEdits = async (taskId) => {
    const dataToSave = edits[taskId];
    if (!dataToSave) return;
    try {
      await createOrUpdateTask({
        variables: {
          input: {
            id: taskId,
            title: dataToSave.title,
            description: dataToSave.description,
            status: dataToSave.status,
            assignee_email: dataToSave.assignee_email,
            due_date: dataToSave.due_date
          }
        }
      });
      setEdits({ ...edits, [taskId]: undefined });
      await refetch();
    } catch (err) {
      alert("Update failed: " + (err.message || err));
    }
  };

  // Inline assign quick save
  const handleQuickAssign = async (taskId, email) => {
    try {
      await createOrUpdateTask({
        variables: { input: { id: taskId, assignee_email: email } }
      });
      await refetch();
    } catch (err) {
      alert("Assign failed: " + (err.message || err));
    }
  };

  // Inline status quick save
  const handleQuickStatus = async (taskId, status) => {
    try {
      await createOrUpdateTask({
        variables: { input: { id: taskId, status } }
      });
      await refetch();
    } catch (err) {
      alert("Status update failed: " + (err.message || err));
    }
  };

  // Add comment inline
  const handleAddComment = async (taskId) => {
    const content = (commentValues[taskId] || "").trim();
    if (!content) {
      alert("Enter comment");
      return;
    }
    try {
      await addComment({ variables: { taskId, content, author_email: null } });
      setCommentValues({ ...commentValues, [taskId]: "" });
      setShowCommentInput({ ...showCommentInput, [taskId]: false });
      await refetch();
    } catch (err) {
      alert("Add comment failed: " + (err.message || err));
    }
  };

  return (
    <div className="mt-6">
      <div className="flex-between mb-3">
        <h3 className="text-lg font-bold">Tasks for: {project.name}</h3>
        <button className="btn-secondary" onClick={onBack}>Back to Projects</button>
      </div>

      <table className="table-auto w-full border-collapse border border-gray-400">
        <thead>
          <tr className="bg-gray-200">
            <th className="border px-2 py-1">#</th>
            <th className="border px-2 py-1">Title</th>
            <th className="border px-2 py-1">Description</th>
            <th className="border px-2 py-1">Assignee</th>
            <th className="border px-2 py-1">Status</th>
            <th className="border px-2 py-1">Due Date</th>
            <th className="border px-2 py-1">Comments</th>
            <th className="border px-2 py-1">Actions</th>
          </tr>
        </thead>

        <tbody>
          {/* Top row: new task inputs */}
          <tr>
            <td className="border px-2 py-1">
              <b>Add New Entry </b>
              </td>
            <td className="border px-2 py-1">
              <input className="input-field" value={newRow.title} onChange={e => setNewRow({ ...newRow, title: e.target.value })} placeholder="Task title" />
            </td>
            <td className="border px-2 py-1">
              <input className="input-field" value={newRow.description} onChange={e => setNewRow({ ...newRow, description: e.target.value })} placeholder="Description" />
            </td>
            <td className="border px-2 py-1">
              <input className="input-field" value={newRow.assignee_email} onChange={e => setNewRow({ ...newRow, assignee_email: e.target.value })} placeholder="Assignee email" />
            </td>
            <td className="border px-2 py-1">
              <select className="input-field" value={newRow.status} onChange={e => setNewRow({ ...newRow, status: e.target.value })}>
                <option>Pending</option>
                <option>In Progress</option>
                <option>Done</option>
              </select>
            </td>
            <td className="border px-2 py-1">
              <input type="date" className="input-field" value={newRow.due_date || ""} onChange={e => setNewRow({ ...newRow, due_date: e.target.value })} />
            </td>
            <td className="border px-2 py-1">—</td>
            <td className="border px-2 py-1">
              <button onClick={handleAddNew} className="btn-primary">Add</button>
            </td>
          </tr>

          {/* Existing tasks */}
          {tasks.map((task, idx) => {
            const edit = edits[task.id] || {
              title: task.title || "",
              description: task.description || "",
              assignee_email: task.assignee_email || "",
              status: task.status || "Pending",
              due_date: task.due_date ? task.due_date.split("T")[0] : ""
            };

            return (
              <tr key={task.id}>
                <td className="border px-2 py-1">{idx + 1}</td>

                {/* Title - editable */}
                <td className="border px-2 py-1">
                  <input className="input-field" value={edit.title} onChange={e => setEdits({ ...edits, [task.id]: { ...edit, title: e.target.value } })} />
                </td>

                {/* Description - editable */}
                <td className="border px-2 py-1">
                  <input className="input-field" value={edit.description} onChange={e => setEdits({ ...edits, [task.id]: { ...edit, description: e.target.value } })} />
                </td>

                {/* Assignee */}
                <td className="border px-2 py-1">
                  <input className="input-field" value={edit.assignee_email} onChange={e => setEdits({ ...edits, [task.id]: { ...edit, assignee_email: e.target.value } })} placeholder="email or empty" />
                </td>

                {/* Status */}
                <td className="border px-2 py-1">
                  <select className="input-field" value={edit.status} onChange={e => setEdits({ ...edits, [task.id]: { ...edit, status: e.target.value } })}>
                    <option>Pending</option>
                    <option>In Progress</option>
                    <option>Done</option>
                  </select>
                </td>

                {/* Due date */}
                <td className="border px-2 py-1">
                  <input type="date" className="input-field" value={edit.due_date || ""} onChange={e => setEdits({ ...edits, [task.id]: { ...edit, due_date: e.target.value } })} />
                </td>

                {/* Comments cell (shows comments + Add button & input when requested) */}
                <td className="border px-2 py-1">
                  <div style={{ maxHeight: 140, overflowY: "auto", paddingRight: 6 }}>
                    {(task.comments || []).map(c => (
                      <div key={c.id} style={{ borderBottom: "1px solid #e5e7eb", paddingBottom: 6, marginBottom: 6 }}>
                        <b>{c.author_email || "Anonymous"}</b> <small>({c.timestamp ? new Date(c.timestamp).toLocaleString() : ""})</small>
                        <div>{c.content}</div>
                      </div>
                    ))}
                  </div>

                  {showCommentInput[task.id] ? (
                    <div className="mt-1">
                      <input className="input-field" placeholder="Write comment..." value={commentValues[task.id] || ""} onChange={e => setCommentValues({ ...commentValues, [task.id]: e.target.value })} />
                      <div style={{ marginTop: 6 }}>
                        <button className="btn-primary" onClick={() => handleAddComment(task.id)}>Post</button>
                        <button className="btn-secondary ml-2" onClick={() => setShowCommentInput({ ...showCommentInput, [task.id]: false })}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <button className="btn-primary mt-2" onClick={() => setShowCommentInput({ ...showCommentInput, [task.id]: true })}>+ Add comment</button>
                  )}
                </td>

                {/* Actions: Save edits / quick assign / quick status */}
                <td className="border px-2 py-1">
                  <button className="btn-primary mr-1" onClick={() => handleSaveEdits(task.id)}>Save</button>
                  <button className="btn-secondary ml-1" onClick={() => {
                    // quick assign via prompt (optional)
                    const email = prompt("Enter assignee email", edit.assignee_email || "");
                    if (email !== null) handleQuickAssign(task.id, email);
                  }}>Assign</button>
                  <button className="btn-secondary ml-1" onClick={() => {
                    const s = prompt("Update status (Pending / In Progress / Done)", edit.status || "Pending");
                    if (s) handleQuickStatus(task.id, s);
                  }}>Status</button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ---------------- Org Dashboard ----------------
function OrgDashboard({ token, logout }) {
  const { data, loading, error, refetch } = useQuery(LIST_PROJECTS, {
    context: { headers: { Authorization: `Bearer ${token}` } },
    fetchPolicy: "network-only",
  });

  const [createProject] = useMutation(CREATE_PROJECT, { context: { headers: { Authorization: `Bearer ${token}` } } });
  const [newProject, setNewProject] = useState({ name: "", description: "", status: "ACTIVE" });
  const [activeProject, setActiveProject] = useState(null);

  if (loading) return <div>Loading projects...</div>;
  if (error) return <div>Error loading projects: {error.message}</div>;

  const handleAddProject = async () => {
    if (!newProject.name) {
      alert("Enter project name");
      return;
    }
    try {
      await createProject({ variables: { input: newProject } });
      setNewProject({ name: "", description: "", status: "ACTIVE" });
      refetch();
    } catch (err) {
      alert("Create project failed: " + (err.message || err));
    }
  };

  return (
    <div>
      <div className="flex-between">
        <h2 className="text-xl font-bold">Organization Dashboard</h2>
        <button onClick={logout} className="btn-secondary">Logout</button>
      </div>

      <div className="mt-4 mb-6">
        <h3>Add Project</h3>
        <input placeholder="Project name" value={newProject.name} onChange={e => setNewProject({ ...newProject, name: e.target.value })} className="input-field" />
        <textarea placeholder="Description" value={newProject.description} onChange={e => setNewProject({ ...newProject, description: e.target.value })} className="input-field mt-1" />
        <select value={newProject.status} onChange={e => setNewProject({ ...newProject, status: e.target.value })} className="input-field mt-1">
          <option value="ACTIVE">ACTIVE</option>
          <option value="ON_HOLD">ON_HOLD</option>
          <option value="COMPLETED">COMPLETED</option>
        </select>
        <button onClick={handleAddProject} className="btn-primary mt-2">Create Project</button>
      </div>

      <h3>Projects</h3>
      <table className="table-auto w-full border-collapse border border-gray-400 mt-2">
        <thead>
          <tr className="bg-gray-200">
            <th className="border px-2 py-1">Name</th>
            <th className="border px-2 py-1">Description</th>
            <th className="border px-2 py-1">Status</th>
            <th className="border px-2 py-1">Tasks</th>
            <th className="border px-2 py-1">Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.listProjects.map(p => (
            <tr key={p.id}>
              <td className="border px-2 py-1">{p.name}</td>
              <td className="border px-2 py-1">{p.description}</td>
              <td className="border px-2 py-1">{p.status}</td>
              <td className="border px-2 py-1">{p.taskCount}</td>
              <td className="border px-2 py-1">
                <button className="btn-primary" onClick={() => setActiveProject(p)}>View / Manage Tasks</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {activeProject && (
        <div className="mt-6">
          <ProjectTasksTable project={activeProject} token={token} onBack={() => { setActiveProject(null); }} />
        </div>
      )}
    </div>
  );
}

// ---------------- Main App ----------------
export default function App() {
  const [token, setToken] = useState("");
  const [role, setRole] = useState("");

  const logout = () => {
    setToken("");
    setRole("");
  };

  return (
    <ApolloProvider client={client}>
      <div className="container p-6">
        <h1 className="text-center text-3xl font-bold mb-6">Multi-Tenant Project Manager</h1>

        {!token ? (
          <div className="grid md:grid-cols-2 gap-6">
            <SuperAdminLogin setToken={setToken} setRole={setRole} />
            <OrgLogin setToken={setToken} setRole={setRole} />
          </div>
        ) : role === "SUPER_ADMIN" ? (
          <SuperAdminDashboard token={token} logout={logout} />
        ) : (
          <OrgDashboard token={token} logout={logout} />
        )}
      </div>
    </ApolloProvider>
  );
}


