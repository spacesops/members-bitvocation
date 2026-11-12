const handleEl = document.querySelector("#verified-handle");
const noteEl = document.querySelector("#session-note");

async function showSession() {
  try {
    const res = await fetch("/auth/verify", { credentials: "include" });
    if (!res.ok) {
      if (noteEl) {
        noteEl.textContent =
          "Session could not be confirmed in the browser (you may still have reached this page via a verified cookie).";
      }
      return;
    }
    const data = await res.json();
    if (handleEl && data.handle) {
      handleEl.textContent = data.handle;
    }
    if (noteEl) {
      noteEl.textContent = `Signed in as ${data.npub.slice(0, 16)}… · verified ${data.handle}.`;
    }
  } catch {
    if (noteEl) noteEl.textContent = "Could not load session details.";
  }
}

void showSession();
