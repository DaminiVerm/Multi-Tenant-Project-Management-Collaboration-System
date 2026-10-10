import { useEffect, useState } from "react";
const initial = { title: "", description: "", status: "TODO", priority: "MEDIUM", dueDate: "", assigneeId: "", labels: "" };
export default function TaskModal({ task, onClose, onSave, onComment }) {
  const [form, setForm] = useState(initial);
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState([]);
  const [error, setError] = useState("");
  useEffect(() => {
    if (task) {
      setForm({ title: task.title || "", description: task.description || "", status: task.status || "TODO", priority: task.priority || "MEDIUM", dueDate: task.dueDate ? task.dueDate.slice(0,10) : "", assigneeId: task.assigneeId?._id || task.assigneeId || "", labels: (task.labels || []).join(", ") });
      onComment(task._id, null).then(setComments).catch(()=>{});
    } else setForm(initial);
  }, [task?._id]);
  function change(e) { setForm({ ...form, [e.target.name]: e.target.value }); }
  async function save(e) {
    e.preventDefault(); setError("");
    try { await onSave({ ...form, dueDate: form.dueDate || null, labels: form.labels.split(",").map(s=>s.trim()).filter(Boolean) }); onClose(); }
    catch (e) { setError(e.message || "Could not save task"); }
  }
  async function addComment(e) {
    e.preventDefault();
    if (!comment.trim() || !task) return;
    try { const c = await onComment(task._id, comment); setComments(old => [...old, c]); setComment(""); }
    catch (e) { setError(e.message || "Could not add comment"); }
  }
  return <div className="modal-backdrop" onMouseDown={e=>e.target===e.currentTarget&&onClose()}><form className="modal" onSubmit={save}>
    <div className="modal-head"><h2>{task ? "Edit task" : "New task"}</h2><button type="button" className="ghost" onClick={onClose}>✕</button></div>
    {error && <div className="error">{error}</div>}
    <label>Title<input name="title" value={form.title} onChange={change} required maxLength="200" /></label>
    <label>Description<textarea name="description" value={form.description} onChange={change} rows="3" /></label>
    <div className="form-grid"><label>Status<select name="status" value={form.status} onChange={change}><option>TODO</option><option>IN_PROGRESS</option><option>REVIEW</option><option>DONE</option></select></label>
    <label>Priority<select name="priority" value={form.priority} onChange={change}><option>LOW</option><option>MEDIUM</option><option>HIGH</option><option>URGENT</option></select></label></div>
    <label>Due date<input type="date" name="dueDate" value={form.dueDate} onChange={change} /></label>
    <label>Assignee user ID (optional)<input name="assigneeId" value={form.assigneeId} onChange={change} placeholder="Paste a registered user's ID" /></label>
    <label>Labels, separated by commas<input name="labels" value={form.labels} onChange={change} placeholder="frontend, bug" /></label>
    <button type="submit">Save task</button>
    {task && <div className="comments"><h3>Comments</h3><div className="comment-list">{comments.map(c=><p key={c._id}><strong>{c.authorId?.name || "Member"}:</strong> {c.text}</p>)}</div><div className="comment-input"><input value={comment} onChange={e=>setComment(e.target.value)} placeholder="Write a comment..." /><button type="button" onClick={addComment}>Add</button></div></div>}
  </form></div>;
}
