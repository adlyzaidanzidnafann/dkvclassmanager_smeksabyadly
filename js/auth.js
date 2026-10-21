
async function requireUser(expectedRole) {
  if (!window.db) {
    alert("Konfigurasi Supabase belum diisi di js/supabase.js.");
    return null;
  }

  const {
    data: { user },
    error
  } = await window.db.auth.getUser();

  if (error || !user) {
    window.location.href = "login.html";
    return null;
  }

  const emailNode = document.getElementById("user-email");

  if (emailNode) {
    emailNode.textContent = user.email || "";
  }

  const { data: profile, error: profileError } =
    await window.db
      .from("profiles")
      .select("role, full_name")
      .eq("id", user.id)
      .single();

  if (profileError || !profile) {
    alert("Profil akun belum dibuat di tabel profiles.");
    await window.db.auth.signOut();
    window.location.href = "login.html";
    return null;
  }

  if (expectedRole && profile.role !== expectedRole) {
    window.location.href =
      profile.role === "guru" ? "guru.html" : "siswa.html";

    return null;
  }

  return { user, profile };
}

document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("login-form");

  if (loginForm) {
    loginForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      const message = document.getElementById("login-message");
      message.classList.remove("error");

      if (!window.db) {
        message.textContent =
          "Isi konfigurasi Supabase di js/supabase.js terlebih dahulu.";
        message.classList.add("error");
        return;
      }

      const email = document.getElementById("email").value.trim();
      const password = document.getElementById("password").value;

      message.textContent = "Sedang masuk...";

      const { data, error } = await window.db.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        message.textContent = "Login gagal: " + error.message;
        message.classList.add("error");
        return;
      }

      const { data: profile, error: profileError } =
        await window.db
          .from("profiles")
          .select("role")
          .eq("id", data.user.id)
          .single();

      if (profileError || !profile) {
        message.textContent =
          "Profil akun belum disiapkan di tabel profiles.";
        message.classList.add("error");
        return;
      }

      if (profile.role === "guru") {
        window.location.href = "guru.html";
      } else if (profile.role === "siswa") {
        window.location.href = "siswa.html";
      } else {
        message.textContent = "Peran akun tidak dikenali.";
        message.classList.add("error");
      }
    });
  }

  const logoutButton = document.getElementById("logout-btn");

  if (logoutButton) {
    logoutButton.addEventListener("click", async () => {
      if (window.db) {
        await window.db.auth.signOut();
      }

      window.location.href = "login.html";
    });
  }
});
