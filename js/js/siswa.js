
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
  const list = document.getElementById("student-task-list");
  if (!list) return;

  const session = await requireUser("siswa");
  if (!session) return;

  const attendanceMessage =
    document.getElementById("attendance-message");

  async function loadTasks() {
    list.textContent = "Memuat data...";

    const { data: tasks, error } = await window.db
      .from("tasks")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      list.textContent = "Gagal memuat tugas: " + error.message;
      return;
    }

    const { data: submissions, error: subError } = await window.db
      .from("submissions")
      .select("task_id, content, submitted_at")
      .eq("student_id", session.user.id);

    if (subError) {
      list.textContent = "Gagal membaca pengumpulan: " + subError.message;
      return;
    }

    if (!tasks.length) {
      list.textContent = "Belum ada materi atau tugas dari guru.";
      return;
    }

    const submissionMap = new Map(
      submissions.map(item => [item.task_id, item])
    );

    list.innerHTML = tasks.map(task => {
      const submission = submissionMap.get(task.id);

      return `
        <article class="item-card">
          <span class="pill">${escapeHtml(task.kind)}</span>
          <h3>${escapeHtml(task.title)}</h3>
          <p>${escapeHtml(task.description)}</p>
          <p class="item-meta">
            ${task.due_date
              ? "Tenggat: " + escapeHtml(task.due_date)
              : "Tidak ada tenggat"}
          </p>

          ${task.kind === "tugas" ? `
            <form class="submission-form"
              data-task-id="${escapeHtml(task.id)}">
              <label>Jawaban atau tautan tugas</label>
              <textarea name="content" rows="3" required
                placeholder="Tulis jawaban atau tautan hasil tugas">${submission
                  ? escapeHtml(submission.content)
                  : ""}</textarea>
              <button class="primary-btn" type="submit">
                ${submission ? "Perbarui pengumpulan" : "Kumpulkan tugas"}
              </button>
              <p class="message" role="status"></p>
            </form>
            ${submission ? `
              <p class="item-meta">
                Dikumpulkan: ${
                  new Date(submission.submitted_at).toLocaleString("id-ID")
                }
              </p>
            ` : ""}
          ` : ""}
        </article>
      `;
    }).join("");

    list.querySelectorAll(".submission-form").forEach(form => {
      form.addEventListener("submit", async event => {
        event.preventDefault();

        const message = form.querySelector(".message");
        const content = new FormData(form)
          .get("content").toString().trim();

        if (!content) {
          message.textContent = "Jawaban tidak boleh kosong.";
          message.classList.add("error");
          return;
        }

        message.textContent = "Mengirim...";
        message.classList.remove("error");

        const { error } = await window.db
          .from("submissions")
          .upsert({
            task_id: form.dataset.taskId,
            student_id: session.user.id,
            content,
            submitted_at: new Date().toISOString()
          }, {
            onConflict: "task_id,student_id"
          });

        if (error) {
          message.textContent = "Gagal mengirim: " + error.message;
          message.classList.add("error");
          return;
        }

        await loadTasks();
      });
    });
  }

  document.getElementById("attendance-btn")
    .addEventListener("click", async () => {
      attendanceMessage.textContent = "Mencatat kehadiran...";
      attendanceMessage.classList.remove("error");

      const now = new Date();
      const today = [
        now.getFullYear(),
        String(now.getMonth() + 1).padStart(2, "0"),
        String(now.getDate()).padStart(2, "0")
      ].join("-");

      const { error } = await window.db
        .from("attendance")
        .upsert({
          student_id: session.user.id,
          attendance_date: today,
          status: "hadir"
        }, {
          onConflict: "student_id,attendance_date"
        });

      if (error) {
        attendanceMessage.textContent =
          "Absensi gagal: " + error.message;
        attendanceMessage.classList.add("error");
        return;
      }

      attendanceMessage.textContent =
        "Absensi hari ini berhasil dicatat.";
    });

  document.getElementById("refresh-student-tasks")
    .addEventListener("click", loadTasks);

  await loadTasks();
});
