import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
export default function TaskCard({ task, onEdit }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: task._id });
  const style = { transform: CSS.Translate.toString(transform), opacity: isDragging ? 0.5 : 1 };
  return <article ref={setNodeRef} style={style} className="task-card">
    <div className="task-top"><span className={`priority ${String(task.priority).toLowerCase()}`}>{task.priority}</span><button className="small ghost" onClick={() => onEdit(task)}>Edit</button></div>
    <div {...listeners} {...attributes} className="drag-area"><h4>{task.title}</h4><p>{task.description || "No description"}</p></div>
    {task.assigneeId?.name && <small>Assigned to {task.assigneeId.name}</small>}
    {task.dueDate && <small>Due {new Date(task.dueDate).toLocaleDateString()}</small>}
  </article>;
}