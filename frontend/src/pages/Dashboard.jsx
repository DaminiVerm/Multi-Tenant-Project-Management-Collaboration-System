import { useEffect, useMemo, useState } from "react";
import { DndContext } from "@dnd-kit/core";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import TaskColumn from "../components/TaskColumn";
import TaskModal from "../components/TaskModel";
import { connectSocket } from "../services/socket";
const statuses = ["TODO", "IN_PROGRESS", "REVIEW", "DONE"];

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [orgs, setOrgs] = useState([]);
  const [orgId, setOrgId] = useState("");
  const [projects, setProjects] = useState([]);
  const [projectId, setProjectId] = useState("");
  const [tasks, setTasks] = useState([]);
  const [modalTask, setModalTask] = useState(undefined);
  const [orgName, setOrgName] = useState("");
  const [projectName, setProjectName] = useState("");
  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [notifications, setNotifications] = useState([]);
  const [logs, setLogs] = useState([]);
  const [message, setMessage] = useState("");
  const [socket, setSocket] = useState(null);
  const selectedOrg = orgs.find(o => o._id === orgId);
  const canManage = ["OWNER", "ADMIN"].includes(selectedOrg?.role);
  const filteredTasks = useMemo(() => tasks.filter(t => (!priorityFilter || t.priority === priorityFilter) && (!search || `${t.title} ${t.description}`.toLowerCase().includes(search.toLowerCase()))), [tasks, priorityFilter, search]);

  async function loadOrgs() {
    try { const { data } = await api.get("/organizations"); setOrgs(data.organizations); if (data.organizations.length && !orgId) setOrgId(data.organizations[0]._id); }
    catch (e) { setMessage(e.response?.data?.message || "Could not load organizations"); }
  }
  
async function loadProjects(id = orgId) {
  if (!id) {
    setProjects([]);
    setProjectId("");
    setTasks([]);
    return;
  }

  try {
    const { data } = await api.get("/projects", {
      params: { organizationId: id },
    });

    const projectList = data.projects || [];
    setProjects(projectList);

    const currentProjectExists = projectList.some(
      (p) => p._id === projectId
    );

    if (!currentProjectExists) {
      setProjectId(projectList[0]?._id || "");
      setTasks([]);
    }
  } catch (error) {
    console.error("Failed to load projects:", error);
    setProjects([]);
    setProjectId("");
    setTasks([]);
  }
}

 

async function loadTasks(project = projectId, organization = orgId) {
  try {
    if (!organization || !project) {
      setTasks([]);
      return;
    }

    const { data } = await api.get("/tasks", {
      params: {
        organizationId: organization,
        projectId: project,
        limit: 100,
      },
    });

    setTasks(data.tasks || []);
  } catch (error) {
    console.error(
      "Failed to load tasks:",
      error.response?.data || error.message
    );
    setTasks([]);
  }
}



  async function loadNotifications() { try { const { data } = await api.get("/notifications"); setNotifications(data.notifications); } catch {} }
  async function loadLogs() { if (!orgId || !canManage) return; try { const { data } = await api.get("/audit-logs", { params: { organizationId: orgId, limit: 20 } }); setLogs(data.logs); } catch {} }
  useEffect(() => { loadOrgs(); loadNotifications(); }, []);
  useEffect(() => { if (orgId) loadProjects(orgId); }, [orgId]);
  useEffect(() => {
  loadTasks(projectId, orgId);
}, [projectId, orgId]);
  useEffect(() => { loadLogs(); }, [orgId, canManage]);
  useEffect(() => {
    const s = connectSocket();
    setSocket(s);
    s.on("task:created", t => setTasks(old => old.some(x=>x._id===t._id) ? old : [...old,t]));
    s.on("task:updated", t => setTasks(old => old.map(x=>x._id===t._id?t:x)));
    s.on("task:deleted", ({_id}) => setTasks(old=>old.filter(t=>t._id!==_id)));
    s.on("notification:new", n => setNotifications(old=>[n,...old]));
    return () => s.disconnect();
  }, []);
  useEffect(() => { if (socket && projectId) socket.emit("project:join", { projectId }); }, [socket, projectId]);

  async function createOrg(e) {
    e.preventDefault(); setMessage("");
    try { const { data } = await api.post("/organizations", { name: orgName }); setOrgs(old=>[...old, {...data.organization, role:"OWNER"}]); setOrgId(data.organization._id); setOrgName(""); setMessage("Organization created"); }
    catch (e) { setMessage(e.response?.data?.message || "Could not create organization"); }
  }
  async function createProject(e) {
    e.preventDefault(); setMessage("");
    try { const { data } = await api.post("/projects", { organizationId: orgId, name: projectName }); setProjects(old=>[data.project,...old]); setProjectId(data.project._id); setProjectName(""); setMessage("Project created"); }
    catch (e) { setMessage(e.response?.data?.message || "Could not create project"); }
  }
  async function saveTask(values) {
    const body = { ...values, organizationId: orgId, projectId };
    if (modalTask?._id) {
      const { data } = await api.put(`/tasks/${modalTask._id}`, values);
      setTasks(old=>old.map(t=>t._id===data.task._id?data.task:t));
    } else {
      const { data } = await api.post("/tasks", body);
      setTasks(old=>[data.task,...old]);
    }
  }
  async function changeStatus(activeId, status) {
    const task = tasks.find(t=>t._id===activeId);
    if (!task || task.status===status) return;
    const previous = tasks;
    setTasks(old=>old.map(t=>t._id===activeId?{...t,status}:t));
    try { const { data } = await api.put(`/tasks/${activeId}`, { status }); setTasks(old=>old.map(t=>t._id===activeId?data.task:t)); }
    catch (e) { setTasks(previous); setMessage(e.response?.data?.message || "Status update failed"); }
  }
  async function comments(taskId, text) {
    if (!text) { const { data } = await api.get(`/tasks/${taskId}/comments`); return data.comments; }
    const { data } = await api.post(`/tasks/${taskId}/comments`, { text }); return data.comment;
  }
  async function markRead(n) {
    try { const { data } = await api.patch(`/notifications/${n._id}/read`); setNotifications(old=>old.map(x=>x._id===n._id?data.notification:x)); }
    catch {}
  }
  function signOut() { logout(); navigate("/login"); }
  return <div className="app-shell">
    <aside className="sidebar"><div className="brand">◈ ProjectHub</div><div className="side-label">WORKSPACE</div>
      <label>Organization<select value={orgId} onChange={e=>{setOrgId(e.target.value);setProjectId("");}}><option value="">Select organization</option>{orgs.map(o=><option key={o._id} value={o._id}>{o.name} · {o.role}</option>)}</select></label>
      <form className="side-form" onSubmit={createOrg}><input value={orgName} onChange={e=>setOrgName(e.target.value)} placeholder="New organization name" required/><button className="secondary">+ Organization</button></form>
      <label>Project<select value={projectId} onChange={e=>setProjectId(e.target.value)}><option value="">Select project</option>{projects.map(p=><option key={p._id} value={p._id}>{p.name}</option>)}</select></label>
      <form className="side-form" onSubmit={createProject}><input value={projectName} onChange={e=>setProjectName(e.target.value)} placeholder="New project name" required disabled={!orgId}/><button className="secondary" disabled={!orgId}>+ Project</button></form>
      <div className="sidebar-bottom"><div className="avatar">{user?.name?.slice(0,1).toUpperCase()}</div><div className="user-info"><strong>{user?.name}</strong><small>{user?.email}</small></div><button className="ghost" onClick={signOut}>Log out</button></div>
    </aside>
    <main className="main-area"><header className="topbar"><div><h1>Project board</h1><p className="muted">{selectedOrg?.name || "Create or select an organization"} {selectedOrg && `· ${projects.find(p=>p._id===projectId)?.name || "Select a project"}`}</p></div><button onClick={()=>setModalTask(null)} disabled={!projectId}>+ New task</button></header>
      {message && <div className="notice"><span>{message}</span><button className="ghost" onClick={()=>setMessage("")}>Dismiss</button></div>}
      <section className="toolbar"><input placeholder="Search tasks..." value={search} onChange={e=>setSearch(e.target.value)}/><select value={priorityFilter} onChange={e=>setPriorityFilter(e.target.value)}><option value="">All priorities</option>{["LOW","MEDIUM","HIGH","URGENT"].map(p=><option key={p}>{p}</option>)}</select><span className="muted">{filteredTasks.length} tasks</span></section>
      {!projectId ? <div className="empty-state"><h2>Let's get started</h2><p>Create an organization and a project to start adding tasks.</p></div> :
        <DndContext onDragEnd={({active,over})=>{if(over && statuses.includes(String(over.id))) changeStatus(String(active.id),String(over.id));}}>
          <div className="board">{statuses.map(status=><TaskColumn key={status} status={status} tasks={filteredTasks.filter(t=>t.status===status)} onEdit={setModalTask}/>)}</div>
        </DndContext>}
      <div className="lower-grid"><section className="panel"><h2>Notifications</h2>{notifications.length===0?<p className="muted">No notifications yet.</p>:notifications.slice(0,8).map(n=><div className={`notification ${n.read?"read":""}`} key={n._id}><div><strong>{n.type.replaceAll("_"," ")}</strong><p>{n.message}</p><small>{new Date(n.createdAt).toLocaleString()}</small></div>{!n.read&&<button className="small secondary" onClick={()=>markRead(n)}>Mark read</button>}</div>)}</section>
      {canManage && <section className="panel"><h2>Recent activity</h2>{logs.length===0?<p className="muted">No activity yet.</p>:logs.map(l=><div className="log-row" key={l._id}><strong>{l.action.replaceAll("_"," ")}</strong><p>{l.userId?.name || "Member"} · {new Date(l.createdAt).toLocaleString()}</p></div>)}</section>}</div>
    </main>
    {modalTask !== undefined && <TaskModal task={modalTask} onClose={()=>setModalTask(undefined)} onSave={saveTask} onComment={comments}/>}
  </div>;
}
