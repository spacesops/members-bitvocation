const handleEl = document.querySelector("#verified-handle");
const noteEl = document.querySelector("#session-note");

async function showSession() {
  try {
    const res = await fetch("/auth/verify/founders", { credentials: "include" });
    if (!res.ok) {
      if (noteEl) {
        noteEl.textContent =
          res.status === 403
            ? "Your npub is not on the founders allowlist."
            : "Session could not be confirmed.";
      }
      return;
    }
    const data = await res.json();
    if (handleEl && data.handle) {
      handleEl.textContent = data.handle;
    }
    if (noteEl) {
      noteEl.textContent = `Founders access · ${data.handle} · ${data.npub.slice(0, 20)}…`;
    }
  } catch {
    if (noteEl) noteEl.textContent = "Could not load session details.";
  }
}

void showSession();
