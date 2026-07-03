"use client";

import { CalendarClock, CheckCircle2, LoaderCircle, PlusCircle, Trash2 } from "lucide-react";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { getSupabase } from "@/lib/supabase";
import Toast from "./Toast";
import Button from "./ui/Button";
import EmptyState from "./ui/EmptyState";
import Input from "./ui/Input";
import Surface from "./ui/Surface";

const STUDY_TASK_SELECT = "id,user_id,title,description,due_date,priority,status,created_at";

const priorityStyles = {
  high: "bg-red-50 text-red-700 dark:bg-red-400/10 dark:text-red-200",
  medium: "bg-amber-50 text-amber-700 dark:bg-amber-400/10 dark:text-amber-200",
  low: "bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-200",
};

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

function isOverdue(task) {
  return task.status !== "completed" && task.due_date < todayDate();
}

const TaskCard = memo(function TaskCard({ task, onToggleComplete, onDelete, isBusy }) {
  return (
    <article className="rounded-2xl border border-border bg-card p-4 shadow-card transition hover:-translate-y-0.5 hover:border-primary/50 dark:border-border dark:bg-card sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="break-words text-lg font-bold tracking-normal text-text [overflow-wrap:anywhere] dark:text-text">
              {task.title}
            </h3>
            <span
              className={`rounded-full px-3 py-1 text-xs font-bold ${
                priorityStyles[task.priority] || priorityStyles.medium
              }`}
            >
              {task.priority}
            </span>
          </div>

          {task.description && (
            <p className="mt-3 whitespace-pre-line break-words text-sm leading-6 text-muted [overflow-wrap:anywhere] dark:text-muted">
              {task.description}
            </p>
          )}

          <p className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-muted dark:text-muted">
            <CalendarClock className="h-4 w-4" aria-hidden="true" />
            Due {new Date(`${task.due_date}T00:00:00`).toLocaleDateString()}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            onClick={() => onToggleComplete(task)}
            disabled={isBusy}
            variant={task.status === "completed" ? "secondary" : "primary"}
            size="sm"
          >
            {isBusy ? (
              <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            )}
            {task.status === "completed" ? "Undo" : "Done"}
          </Button>

          <Button
            type="button"
            onClick={() => onDelete(task.id)}
            disabled={isBusy}
            variant="danger"
            size="icon"
            aria-label="Delete task"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </article>
  );
});

const TaskSection = memo(function TaskSection({ title, tasks, emptyText, onToggleComplete, onDelete, busyId }) {
  return (
    <section>
      <h2 className="text-lg font-bold tracking-normal text-text dark:text-text">{title}</h2>
      <div className="mt-4 grid gap-3">
        {tasks.length === 0 ? (
          <EmptyState
            icon={CalendarClock}
            title={emptyText}
            description="Tasks you add will appear in this section automatically."
            className="px-4 py-8"
          />
        ) : (
          tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onToggleComplete={onToggleComplete}
              onDelete={onDelete}
              isBusy={busyId === task.id}
            />
          ))
        )}
      </div>
    </section>
  );
});

export default function StudyPlanner() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState(todayDate());
  const [priority, setPriority] = useState("medium");
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [toast, setToast] = useState("");
  const [error, setError] = useState("");

  const groupedTasks = useMemo(() => {
    const completed = tasks.filter((task) => task.status === "completed");
    const overdue = tasks.filter(isOverdue);
    const upcoming = tasks.filter(
      (task) => task.status !== "completed" && !isOverdue(task)
    );

    return { upcoming, overdue, completed };
  }, [tasks]);

  useEffect(() => {
    let isMounted = true;

    async function loadTasks() {
      setIsLoading(true);
      setError("");

      try {
        const supabase = getSupabase();
        const { data: userData, error: userError } = await supabase.auth.getUser();

        if (userError) {
          throw userError;
        }

        const user = userData.user;

        if (!user) {
          throw new Error("Please login to view your planner.");
        }

        const { data, error: loadError } = await supabase
          .from("study_planner")
          .select(STUDY_TASK_SELECT)
          .eq("user_id", user.id)
          .order("due_date", { ascending: true });

        if (loadError) {
          throw loadError;
        }

        if (isMounted) {
          setTasks(data || []);
        }
      } catch (loadError) {
        if (isMounted) {
          setError(loadError.message);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadTasks();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!toast) {
      return undefined;
    }

    const timeout = window.setTimeout(() => setToast(""), 3000);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  async function createTask(event) {
    event.preventDefault();

    const cleanTitle = title.trim();

    if (!cleanTitle) {
      setError("Task title is required.");
      return;
    }

    setIsCreating(true);
    setError("");
    setToast("");

    try {
      const supabase = getSupabase();
      const { data: userData, error: userError } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      const user = userData.user;

      if (!user) {
        throw new Error("Please login again.");
      }

      const { data, error: createError } = await supabase
        .from("study_planner")
        .insert({
          user_id: user.id,
          title: cleanTitle,
          description: description.trim() || null,
          due_date: dueDate,
          priority,
          status: "pending",
        })
        .select(STUDY_TASK_SELECT)
        .single();

      if (createError) {
        throw createError;
      }

      setTasks((currentTasks) =>
        [...currentTasks, data].sort((first, second) =>
          first.due_date.localeCompare(second.due_date)
        )
      );
      setTitle("");
      setDescription("");
      setDueDate(todayDate());
      setPriority("medium");
      setToast("Study task created.");
    } catch (createError) {
      setError(createError.message);
    } finally {
      setIsCreating(false);
    }
  }

  const toggleComplete = useCallback(async (task) => {
    setBusyId(task.id);
    setError("");
    setToast("");

    try {
      const supabase = getSupabase();
      const { data: userData, error: userError } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      const user = userData.user;
      const nextStatus = task.status === "completed" ? "pending" : "completed";

      const { data, error: updateError } = await supabase
        .from("study_planner")
        .update({ status: nextStatus })
        .eq("id", task.id)
        .eq("user_id", user.id)
        .select(STUDY_TASK_SELECT)
        .single();

      if (updateError) {
        throw updateError;
      }

      setTasks((currentTasks) =>
        currentTasks.map((currentTask) =>
          currentTask.id === task.id ? data : currentTask
        )
      );
      setToast(nextStatus === "completed" ? "Task completed." : "Task reopened.");
    } catch (updateError) {
      setError(updateError.message);
    } finally {
      setBusyId(null);
    }
  }, []);

  const deleteTask = useCallback(async (taskId) => {
    if (!window.confirm("Delete this study task?")) {
      return;
    }

    setBusyId(taskId);
    setError("");
    setToast("");

    try {
      const supabase = getSupabase();
      const { data: userData, error: userError } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      const user = userData.user;

      const { error: deleteError } = await supabase
        .from("study_planner")
        .delete()
        .eq("id", taskId)
        .eq("user_id", user.id);

      if (deleteError) {
        throw deleteError;
      }

      setTasks((currentTasks) => currentTasks.filter((task) => task.id !== taskId));
      setToast("Task deleted.");
    } catch (deleteError) {
      setError(deleteError.message);
    } finally {
      setBusyId(null);
    }
  }, []);

  return (
    <div className="space-y-5">
      <Surface as="form" onSubmit={createTask} padding="compact" aria-busy={isCreating}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-bold tracking-normal text-text dark:text-text">
              Create study task
            </h2>
            <p className="mt-1 text-sm leading-6 text-muted dark:text-muted">
              Plan study sessions, deadlines, and revision goals.
            </p>
          </div>
          <Button
            type="submit"
            disabled={isCreating}
            className="w-full sm:w-auto"
          >
            {isCreating ? (
              <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <PlusCircle className="h-4 w-4" aria-hidden="true" />
            )}
            {isCreating ? "Creating..." : "Add task"}
          </Button>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <Input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Task title"
            aria-label="Task title"
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <input
              type="date"
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
              aria-label="Task due date"
              className="min-h-12 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm font-semibold text-text outline-none transition focus:border-primary focus:bg-card focus:ring-4 focus:ring-primary/15 dark:border-border dark:bg-sidebar dark:text-text"
            />
            <select
              value={priority}
              onChange={(event) => setPriority(event.target.value)}
              aria-label="Task priority"
              className="min-h-12 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm font-semibold text-text outline-none transition focus:border-primary focus:bg-card focus:ring-4 focus:ring-primary/15 dark:border-border dark:bg-sidebar dark:text-text"
            >
              <option value="low">Low priority</option>
              <option value="medium">Medium priority</option>
              <option value="high">High priority</option>
            </select>
          </div>
        </div>

        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          rows={4}
          placeholder="Description or study plan..."
          aria-label="Task description"
          className="mt-4 min-h-28 w-full resize-y rounded-xl border border-border bg-background px-4 py-3 text-sm leading-6 text-text outline-none transition focus:border-primary focus:bg-card focus:ring-4 focus:ring-primary/15 dark:border-border dark:bg-sidebar dark:text-text"
        />
      </Surface>

      <div className="grid gap-3">
        <Toast message={toast} />
        <Toast message={error} type="error" />
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 rounded-2xl border border-border bg-card p-5 text-sm font-bold text-primary-hover shadow-card dark:border-border dark:bg-card dark:text-primary">
          <LoaderCircle className="h-5 w-5 animate-spin" aria-hidden="true" />
          Loading planner...
        </div>
      ) : (
        <div className="grid gap-5">
          <TaskSection
            title="Overdue tasks"
            tasks={groupedTasks.overdue}
            emptyText="No overdue tasks."
            onToggleComplete={toggleComplete}
            onDelete={deleteTask}
            busyId={busyId}
          />
          <TaskSection
            title="Upcoming tasks"
            tasks={groupedTasks.upcoming}
            emptyText="No upcoming tasks yet."
            onToggleComplete={toggleComplete}
            onDelete={deleteTask}
            busyId={busyId}
          />
          <TaskSection
            title="Completed tasks"
            tasks={groupedTasks.completed}
            emptyText="No completed tasks yet."
            onToggleComplete={toggleComplete}
            onDelete={deleteTask}
            busyId={busyId}
          />
        </div>
      )}
    </div>
  );
}
