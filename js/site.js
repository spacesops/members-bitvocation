import { hexToNpub, shortenNpub } from "./nip19.js?v=3";

const JOBS = [
  {
    role: "Head of Growth",
    company: "Satlantis",
    where: "Remote",
    kind: "bitcoin",
    note: "Own acquisition for a Bitcoin product team.",
  },
  {
    role: "Talent Partner",
    company: "Strike",
    where: "Remote",
    kind: "bitcoin",
    note: "Help a Bitcoin company hire without the LinkedIn flood.",
  },
  {
    role: "Operations Associate",
    company: "Terahash",
    where: "Remote",
    kind: "bitcoin",
    note: "Keep mining operations and vendor work moving.",
  },
  {
    role: "Product Designer",
    company: "Voltage",
    where: "Remote",
    kind: "bitcoin",
    note: "Design tools for teams running Lightning infrastructure.",
  },
  {
    role: "Developer Advocate",
    company: "Synapse",
    where: "Americas",
    kind: "adjacent",
    note: "Explain Bitcoin-adjacent payments to builders.",
  },
  {
    role: "Community Manager",
    company: "OpenSats",
    where: "Remote",
    kind: "bitcoin",
    note: "Support contributors and public proof of work.",
  },
];

const SESSION_KEY = "bv-member-session";
const PROFILE_KEY = "bv-member-profile";

const gate = document.querySelector("#gate");
const app = document.querySelector("#app");
const views = document.querySelectorAll("[data-view]");
const nav = document.querySelector("#nav");
const menuBtn = document.querySelector("#menu-btn");
const who = document.querySelector("#who");
const jobsEl = document.querySelector("#jobs");
const profileForm = document.querySelector("#profile-form");
const profileNote = document.querySelector("#profile-note");
const tierEl = document.querySelector("#tier");
const reserveName = document.querySelector("#reserve-name");
const initials = document.querySelector("#initials");
const nostrErrorEl = document.querySelector("#nostr-error");
const memberNpubEl = document.querySelector("#member-npub");
const nostrSignInBtn = document.querySelector("#nostr-signin");

let member = null;
let filter = "all";

function hasNip07() {
  return typeof window.nostr?.getPublicKey === "function";
}

function readSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const { pubkey } = JSON.parse(raw);
    const npub = hexToNpub(pubkey);
    if (!npub) return null;
    return { pubkey, npub };
  } catch {
    return null;
  }
}

function updateIdentityUi() {
  if (!member) return;
  const short = shortenNpub(member.npub);
  who.textContent = short;
  tierEl.textContent = "NIP-07";
  memberNpubEl.textContent = member.npub;
  reserveName.textContent = short;
  initials.textContent = member.npub.replace(/^npub1/, "").slice(0, 2).toUpperCase();
  document.querySelector("#reserve-tier").textContent =
    "Signed in with your Nostr public key.";
}

function showApp(next) {
  member = next;
  gate.classList.add("hidden");
  app.classList.remove("hidden");
  updateIdentityUi();
  loadProfile();
  renderJobs();
  showView("home");
}

function showGate() {
  member = null;
  app.classList.add("hidden");
  gate.classList.remove("hidden");
  nav?.classList.remove("open");
  if (nostrErrorEl) nostrErrorEl.textContent = "";
}

function showView(name) {
  views.forEach((view) => {
    view.classList.toggle("hidden", view.dataset.view !== name);
  });
  document.querySelectorAll("#nav [data-go]").forEach((button) => {
    if (button.dataset.go === name) button.setAttribute("aria-current", "page");
    else button.removeAttribute("aria-current");
  });
  nav?.classList.remove("open");
  menuBtn?.setAttribute("aria-expanded", "false");
  window.scrollTo(0, 0);
}

function renderJobs() {
  const list = jobsEl || document.querySelector("#jobs");
  if (!list) return;
  const rows = JOBS.filter((job) => filter === "all" || job.kind === filter);
  if (!rows.length) {
    list.innerHTML = '<p class="empty">No roles in this filter.</p>';
    return;
  }
  list.innerHTML = rows
    .map(
      (job) => `
      <article class="job">
        <div>
          <h3>${job.role}</h3>
          <p>${job.company} · ${job.where}</p>
          <p>${job.note}</p>
        </div>
        <div>
          <span class="tag ${job.kind === "bitcoin" ? "" : "warm"}">${
            job.kind === "bitcoin" ? "Bitcoin-only" : "Adjacent"
          }</span>
        </div>
      </article>`,
    )
    .join("");
}

function loadProfile() {
  if (!profileForm || !profileNote) return;
  const saved = sessionStorage.getItem(PROFILE_KEY + member.pubkey);
  const data = saved
    ? JSON.parse(saved)
    : { focus: "Job search", proof: "", location: "" };
  profileForm.elements.focus.value = data.focus;
  profileForm.elements.proof.value = data.proof;
  profileForm.elements.location.value = data.location;
  profileNote.textContent = saved ? "Saved on this device for this session." : "";
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
  if (nostrSignInBtn) {
    nostrSignInBtn.disabled = true;
    nostrSignInBtn.textContent = "Waiting for keys.band…";
  }
  if (nostrErrorEl) {
    nostrErrorEl.textContent =
      "Check for a keys.band approval popup if nothing happens.";
  }
  try {
    const pubkey = (await window.nostr.getPublicKey()).trim();
    const npub = hexToNpub(pubkey);
    if (!npub) {
      if (nostrErrorEl) {
        nostrErrorEl.textContent = "The extension returned an invalid public key.";
      }
      return;
    }
    if (nostrErrorEl) nostrErrorEl.textContent = "";
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ pubkey }));
    showApp({ pubkey, npub });
  } catch (err) {
    if (nostrErrorEl) {
      nostrErrorEl.textContent =
        err?.message || "Could not read your public key from the extension.";
    }
  } finally {
    if (nostrSignInBtn) {
      nostrSignInBtn.disabled = false;
      nostrSignInBtn.textContent = defaultLabel;
    }
  }
}

function bindUi() {
  document.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;

    if (target.closest("#nostr-signin")) {
      void signInWithNostr();
      return;
    }

    if (target.closest("#signout")) {
      sessionStorage.removeItem(SESSION_KEY);
      showGate();
      return;
    }

    const go = target.closest("[data-go]");
    if (go instanceof HTMLElement && go.dataset.go) {
      showView(go.dataset.go);
      return;
    }

    const filterBtn = target.closest("[data-filter]");
    if (filterBtn instanceof HTMLElement && filterBtn.dataset.filter) {
      filter = filterBtn.dataset.filter;
      document.querySelectorAll("[data-filter]").forEach((chip) => {
        chip.setAttribute(
          "aria-pressed",
          chip === filterBtn ? "true" : "false",
        );
      });
      renderJobs();
      return;
    }

    if (target.closest("#menu-btn") && nav && menuBtn) {
      const open = nav.classList.toggle("open");
      menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
    }
  });

  document.addEventListener("submit", (event) => {
    if (!(event.target instanceof HTMLFormElement)) return;
    if (event.target.id !== "profile-form") return;
    event.preventDefault();
    if (!member) return;
    const data = {
      focus: event.target.elements.focus.value,
      proof: event.target.elements.proof.value.trim(),
      location: event.target.elements.location.value.trim(),
    };
    sessionStorage.setItem(PROFILE_KEY + member.pubkey, JSON.stringify(data));
    const note = document.querySelector("#profile-note");
    if (note) note.textContent = "Profile saved for this browser session.";
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bindUi);
} else {
  bindUi();
}

const existing = readSession();
if (existing) showApp(existing);
else showGate();
