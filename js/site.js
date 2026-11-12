import { shortenNpub } from "./nip19.js?v=7";

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
const memberNpubEl = document.querySelector("#member-npub");
const memberHandleEl = document.querySelector("#member-handle");

let member = null;
let filter = "all";
let uiBound = false;

function updateIdentityUi() {
  if (!member) return;
  const short = shortenNpub(member.npub);
  who.textContent = short;
  tierEl.textContent = member.handle ? member.handle : "NIP-07";
  memberNpubEl.textContent = member.npub;
  if (memberHandleEl) {
    memberHandleEl.textContent = member.handle || "—";
  }
  reserveName.textContent = short;
  initials.textContent = member.npub.replace(/^npub1/, "").slice(0, 2).toUpperCase();
  document.querySelector("#reserve-tier").textContent =
    member.handle
      ? `Verified Spaces handle · ${member.handle}`
      : "Signed in with your Nostr public key.";
}

function showApp(next) {
  member = next;
  sessionStorage.setItem(
    SESSION_KEY,
    JSON.stringify({ pubkey: member.pubkey, npub: member.npub, handle: member.handle }),
  );
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
  if (!profileForm || !profileNote || !member) return;
  const saved = sessionStorage.getItem(PROFILE_KEY + member.pubkey);
  const data = saved
    ? JSON.parse(saved)
    : { focus: "Job search", proof: "", location: "" };
  profileForm.elements.focus.value = data.focus;
  profileForm.elements.proof.value = data.proof;
  profileForm.elements.location.value = data.location;
  profileNote.textContent = saved ? "Saved on this device for this session." : "";
}

function bindUi() {
  if (uiBound) return;
  uiBound = true;

  document.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;

    if (target.closest("#signout")) {
      void (async () => {
        try {
          await fetch("/auth/logout", { method: "POST", credentials: "include" });
        } catch {
          /* still clear local state */
        }
        sessionStorage.removeItem(SESSION_KEY);
        location.href = "/";
      })();
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

export function startApp(session) {
  bindUi();
  const pubkey =
    session.pubkey ||
    (() => {
      try {
        return JSON.parse(sessionStorage.getItem(SESSION_KEY) || "{}").pubkey;
      } catch {
        return null;
      }
    })();
  if (!session.npub || !pubkey) return;
  showApp({
    pubkey,
    npub: session.npub,
    handle: session.handle,
    handles: session.handles,
  });
}
