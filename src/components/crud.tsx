import { useEffect, useState, type ChangeEvent } from "react";
import supabase from "../utils/supabase";
import type { Session } from "@supabase/supabase-js";

interface Tasks {
  id: number;
  title: string;
  description: string;
  created_at: string;
  img_url?: string | null;
  email: string;
}

function Crud({ session }: { session: Session }) {
  const [newTasks, setNewTasks] = useState({
    title: "",
    description: "",
  });
  const [tasks, setTasks] = useState<Tasks[]>([]);
  const [editValues, setEditValues] = useState<{ [key: number]: string }>({});

  const [taskImage, setTaskImage] = useState<File | null>(null);

  // Function to upload image to Supabase Storage
  const uploadImage = async (file: File): Promise<string | null> => {
    const fileName = `${Date.now()}_${file.name}`;

    const { error } = await supabase.storage
      .from("CRUD_imgs")
      .upload(fileName, file, { upsert: false });

    if (error) {
      console.error("Image upload error:", error);
      return null;
    }

    const { data } = supabase.storage.from("CRUD_imgs").getPublicUrl(fileName);

    return data.publicUrl;
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    let imageUrl: string | null = null;

    if (taskImage) {
      imageUrl = await uploadImage(taskImage);

      //  Stop if upload failed
      if (!imageUrl) {
        alert("Image upload failed. Check storage policies.");
        return;
      }
    }

    const { error, data } = await supabase
      .from("CRUD")
      .insert({
        ...newTasks,
        email: session.user.email,
        img_url: imageUrl,
      })
      .select()
      .single();

    if (error) {
      console.error("Error adding task:", error);
      alert("Failed to add task.");
      return;
    }

    setTasks((prev) => [...prev, data]);

    // Reset form
    setNewTasks({ title: "", description: "" });
    setTaskImage(null);
  }

  async function updatedTask(id: number) {
    const newDescription = editValues[id];

    if (!newDescription || !newDescription.trim()) {
      alert("Please enter updated description.");
      return;
    }

    const { error } = await supabase
      .from("CRUD")
      .update({ description: newDescription })
      .eq("id", id);

    if (error) {
      console.error("Error updating task:", error);
      alert("Failed to update task.");
      return;
    }

    // Clear only that task's edit value
    setEditValues((prev) => {
      const updated = { ...prev };
      delete updated[id];
      return updated;
    });
  }

  async function deleteTask(id: number) {
    const { error } = await supabase.from("CRUD").delete().eq("id", id);

    if (error) {
      console.error("Error deleting task:", error);
      alert("Failed to delete task.");
    }
  }

  async function fetchTasks() {
    const { data, error } = await supabase
      .from("CRUD")
      .select("*")
      .eq("email", session.user.email)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching tasks:", error);
      return;
    }

    setTasks(data ?? []);
  }
  useEffect(() => {
    if (session?.user?.email) {
      fetchTasks();
    }
  }, [session?.user?.email]);

  // // Real-time subscription to task changes
  // useEffect(() => {
  //   const channel = supabase.channel("tasks-channel");
  //   channel
  //     .on(
  //       "postgres_changes",
  //       { event: "INSERT", schema: "public", table: "CRUD" },
  //       (payload) => {
  //         const newTask = payload.new as Tasks;
  //         setTasks((prevTasks) => [...prevTasks, newTask]);
  //       },
  //     )
  //     .subscribe((status) => {
  //       console.log("Subscription status:", status);
  //     });
  // }, []);

  useEffect(() => {
    if (!session?.user?.email) return;

    const userEmail = session.user.email;

    console.log("Subscribing once for:", userEmail);

    const channel = supabase
      .channel("tasks-channel")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "CRUD",
        },
        (payload) => {
          console.log("Realtime payload:", payload);

          const newRow = payload.new as Tasks;
          const oldRow = payload.old as Tasks;

          // Filter only current user's rows
          if (
            (newRow && newRow.email !== userEmail) ||
            (oldRow && oldRow.email !== userEmail)
          ) {
            return;
          }

          if (payload.eventType === "INSERT") {
            setTasks((prev) => {
              if (prev.find((t) => t.id === newRow.id)) return prev;
              return [...prev, newRow];
            });
          }

          if (payload.eventType === "UPDATE") {
            setTasks((prev) =>
              prev.map((task) => (task.id === newRow.id ? newRow : task)),
            );
          }

          if (payload.eventType === "DELETE") {
            setTasks((prev) => prev.filter((task) => task.id !== oldRow.id));
          }
        },
      )
      .subscribe((status) => {
        console.log("Realtime status:", status);
      });

    return () => {
      console.log("Cleaning up channel");
      supabase.removeChannel(channel);
    };
  }, [session?.user?.email]);

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setTaskImage(e.target.files[0]);
    }
  };

  return (
    <div style={{ maxWidth: "600px", margin: "0 auto", padding: "1rem" }}>
      <h2 style={{ marginBottom: "1rem" }}>Task Manager CRUD</h2>

      {/* Form to add a new task */}
      <form
        onSubmit={handleSubmit}
        style={{ marginBottom: "1.5rem" }}
        action=""
      >
        <input
          type="text"
          placeholder="Task Title"
          value={newTasks.title}
          onChange={(e) =>
            setNewTasks((prev) => ({ ...prev, title: e.target.value }))
          }
          style={{
            width: "100%",
            marginBottom: "0.75rem",
            padding: "0.6rem",
            border: "1px solid #333",
            borderRadius: "6px",
            outline: "none",
          }}
        />

        <textarea
          placeholder="Task Description"
          value={newTasks.description}
          onChange={(e) =>
            setNewTasks((prev) => ({ ...prev, description: e.target.value }))
          }
          style={{
            width: "100%",
            marginBottom: "0.75rem",
            padding: "0.6rem",
            border: "1px solid #333",
            borderRadius: "6px",
            outline: "none",
            resize: "vertical",
          }}
        />

        <input
          type="file"
          placeholder="Task Image"
          accept="image/*"
          style={{
            width: "100%",
            marginBottom: "0.75rem",
            padding: "0.6rem",
            border: "1px solid #333",
            borderRadius: "6px",
            outline: "none",
            cursor: "pointer",
          }}
          onChange={handleImageChange}
        />

        <button
          type="submit"
          disabled={
            newTasks.title.trim() === "" || newTasks.description.trim() === ""
          }
          style={{
            padding: "0.6rem 1.2rem",
            backgroundColor:
              newTasks.title.trim() === "" || newTasks.description.trim() === ""
                ? "#9ca3af"
                : "#2563eb",
            color: "#fff",
            border: "none",
            borderRadius: "6px",
            cursor:
              newTasks.title.trim() === "" || newTasks.description.trim() === ""
                ? "not-allowed"
                : "pointer",
            opacity:
              newTasks.title.trim() === "" || newTasks.description.trim() === ""
                ? 0.6
                : 1,
          }}
        >
          Add Task
        </button>
      </form>

      {/* List of Tasks */}
      <ul style={{ listStyle: "none", padding: 0 }}>
        {tasks.map((task) => (
          <li
            key={task.id}
            style={{
              border: "1px solid #333",
              borderRadius: "8px",
              padding: "1rem",
              marginBottom: "1rem",
              backgroundColor: "#f9f9f9",
            }}
          >
            <h3 style={{ marginBottom: "0.5rem" }}>{task.title}</h3>
            <p style={{ marginBottom: "0.75rem" }}>{task.description}</p>

            <textarea
              placeholder="Updated description..."
              style={{
                width: "100%",
                marginBottom: "0.75rem",
                padding: "0.6rem",
                border: "1px solid #333",
                borderRadius: "6px",
                outline: "none",
                resize: "vertical",
              }}
              value={editValues[task.id] || ""}
              onChange={(e) =>
                setEditValues((prev) => ({
                  ...prev,
                  [task.id]: e.target.value,
                }))
              }
            />

            {task.img_url && (
              <div
                style={{
                  width: "100%",
                  height: "400px",
                  overflowY: "auto",
                  marginBottom: "0.75rem",
                  borderRadius: "10px",
                  overflow: "hidden",
                  boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
                }}
              >
                <img
                  src={task.img_url}
                  alt={task.title}
                  style={{
                    width: "100%",
                    height: "auto",
                    objectFit: "cover",
                    display: "block",
                    transition: "transform 0.3s ease",
                  }}
                />
              </div>
            )}

            <div>
              <button
                style={{
                  padding: "0.5rem 1rem",
                  marginRight: "0.5rem",
                  backgroundColor: "#facc15",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                }}
                onClick={() => updatedTask(task.id)}
              >
                Edit
              </button>

              <button
                style={{
                  padding: "0.5rem 1rem",
                  backgroundColor: "#ef4444",
                  color: "#fff",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                }}
                onClick={() => deleteTask(task.id)}
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Crud;
