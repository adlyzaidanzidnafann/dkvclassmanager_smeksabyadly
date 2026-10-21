
function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

document.addEventListener("DOMContentLoaded", async () => {
  const form = document.getElementById("task-form");
  if (!form) return;

  const session = await requireUser("guru");
  if (!session) return;

  const message = document.getElementById("task-message");
  const list = document.getElementById("teacher-task-list");

  async function loadTasks() {
    list.textContent = "Memuat data...";

    const { data, error } = await window.db
      .from("tasks")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      list.textContent = "Gagal memuat: " + error.message;
      return;
    }

    if (!data.length) {
      list.textContent = "Belum ada materi atau tugas.";
      return;
    }

    list.innerHTML = data.map(task => `
      <article class="item-card">
        <span class="pill">${escapeHtml(task.kind)}</span>
        <h3>${escapeHtml(task.title)}</h3>
        <p>${escapeHtml(task.description)}</p>
        <p class="item-meta">
          ${task.due_date
            ? "Tenggat: " + escapeHtml(task.due_date)
            : "Tidak ada tenggat"}
        </p>
      </article>
    `).join("");
  }

  form.addEventListener("submit", async event => {
    event.preventDefault();
    message.classList.remove("error");
    message.textContent = "Menyimpan...";

    const record = {
      title: document.getElementById("task-title").value.trim(),
      description:
        document.getElementById("task-description").value.trim(),
      due_date: document.getElementById("task-due").value || null,
      kind: document.getElementById("task-kind").value,
      created_by: session.user.id
    };

    const { error } = await window.db.from("tasks").insert(record);

    if (error) {
      message.textContent = "Gagal menyimpan: " + error.message;
      message.classList.add("error");
      return;
    }

    form.reset();
    message.textContent = "Materi/tugas berhasil dipublikasikan.";
    await loadTasks();
  });

  document.getElementById("refresh-tasks")
    .addEventListener("click", loadTasks);

  await loadTasks();
});
