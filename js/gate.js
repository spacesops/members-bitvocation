import { hexToNpub } from "./nip19.js?v=7";

const NIP07_TIMEOUT_MS = 30_000;
const SESSION_TIMEOUT_MS = 120_000;

const nostrErrorEl = document.querySelector("#nostr-error");
const nostrSignInBtn = document.querySelector("#nostr-signin");

function hasNip07() {
  return typeof window.nostr?.getPublicKey === "function";
}

function withTimeout(promise, ms, message) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      window.setTimeout(() => reject(new Error(message)), ms);
    }),
  ]);
}

function setBusy(buttonLabel, statusText) {
  if (nostrSignInBtn) {
    nostrSignInBtn.disabled = true;
    nostrSignInBtn.textContent = buttonLabel;
  }
  if (nostrErrorEl) nostrErrorEl.textContent = statusText;
}

async function loadMemberApp(verifyJson) {
  const mod = await import("./site.js?v=7");
  mod.startApp(verifyJson);
}

async function tryResumeSession() {
  try {
    const res = await fetch("/auth/verify", { credentials: "include" });
    if (!res.ok) return false;
    const data = await res.json();
    await loadMemberApp(data);
    return true;
  } catch {
    return false;
  }
}

async function signInWithNostr() {
  if (nostrErrorEl) nostrErrorEl.textContent = "";
  if (!hasNip07()) {
    if (nostrErrorEl) {
      nostrErrorEl.textContent =
        "Nostr bridge failed to load. Reload the page and try again.";
    }
    return;
  }

  const defaultLabel =
    nostrSignInBtn?.dataset.label || "Continue with Nostr";

  setBusy(
    "Waiting for keys.band…",
    "Approve this site in the keys.band extension if a popup is open.",
  );

  try {
    const pubkey = (
      await withTimeout(
        window.nostr.getPublicKey(),
        NIP07_TIMEOUT_MS,
        "keys.band did not respond in time. Unlock the extension and approve this site when prompted.",
      )
    ).trim();
    const npub = hexToNpub(pubkey);
    if (!npub) {
      if (nostrErrorEl) {
        nostrErrorEl.textContent = "The extension returned an invalid public key.";
      }
      return;
    }

    setBusy(
      "Verifying @space…",
      "Checking your npub against the relay network (first sign-in may take up to two minutes).",
    );

    const controller = new AbortController();
    const sessionTimer = window.setTimeout(
      () => controller.abort(),
      SESSION_TIMEOUT_MS,
    );

    let res;
    try {
      res = await fetch("/auth/session", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ npub, pubkey }),
        signal: controller.signal,
      });
    } finally {
      window.clearTimeout(sessionTimer);
    }

    const body = await res.json().catch(() => ({}));
    if (res.status === 403) {
      if (nostrErrorEl) {
        nostrErrorEl.textContent =
          body.error ||
          "No verified @space handle is linked to this Nostr key.";
      }
      return;
    }
    if (!res.ok) {
      if (nostrErrorEl) {
        nostrErrorEl.textContent =
          body.error ||
          (res.status === 502
            ? "Relay verification failed or timed out. Try again in a moment."
            : res.status === 504
              ? "Gateway timed out while verifying your handle. Try again."
              : `Sign-in failed (HTTP ${res.status}).`);
      }
      return;
    }

    if (nostrErrorEl) nostrErrorEl.textContent = "";
    await loadMemberApp({
      npub,
      pubkey: body.pubkey || pubkey,
      handle: body.handle,
      handles: body.handles,
    });
  } catch (err) {
    if (nostrErrorEl) {
      const msg =
        err?.name === "AbortError"
          ? "Verification timed out. The relay may be slow — try again."
          : err?.message ||
            "Could not complete Nostr sign-in. Check the extension and retry.";
      nostrErrorEl.textContent = msg;
    }
  } finally {
    if (nostrSignInBtn) {
      nostrSignInBtn.disabled = false;
      nostrSignInBtn.textContent = defaultLabel;
    }
  }
}

function bindGate() {
  document.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    if (target.closest("#nostr-signin")) {
      void signInWithNostr();
    }
  });
}

bindGate();
void tryResumeSession();
