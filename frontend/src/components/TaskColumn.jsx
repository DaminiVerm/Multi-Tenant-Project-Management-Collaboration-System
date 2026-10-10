import { useDroppable } from "@dnd-kit/core";
import TaskCard from "./TaskCard";
export default function TaskColumn({ status, tasks, onEdit }) {
  const { isOver, setNodeRef } = useDroppable({ id: status });
  return <section ref={setNodeRef} className={`column ${isOver ? "is-over" : ""}`}>
    <header><h3>{status.replace("_", " ")}</h3><span className="count">{tasks.length}</span></header>
    <div className="column-content">{tasks.map(task => <TaskCard key={task._id} task={task} onEdit={onEdit} />)}</div>
  </section>;
}
