const MEMBERS = {
  "member@bitvocation.local": {
    name: "Alex Rivera",
    tier: "POW Lab",
    passcode: "reserve",
  },
  "jordan@bitvocation.local": {
    name: "Jordan Lee",
    tier: "POW Lab Lite",
    passcode: "reserve",
  },
};

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
const errorEl = document.querySelector("#error");

let member = null;
let filter = "all";

function readSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const email = JSON.parse(raw).email;
    return MEMBERS[email] ? { email, ...MEMBERS[email] } : null;
  } catch {
    return null;
  }
}

function showApp(next) {
  member = next;
  gate.classList.add("hidden");
  app.classList.remove("hidden");
  who.textContent = member.name;
  tierEl.textContent = member.tier;
  reserveName.textContent = member.name;
  initials.textContent = member.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2);
  document.querySelector("#reserve-tier").textContent = member.tier;
  loadProfile();
  renderJobs();
  showView("home");
}

function showGate() {
  member = null;
  app.classList.add("hidden");
  gate.classList.remove("hidden");
  nav.classList.remove("open");
}

function showView(name) {
  views.forEach((view) => {
    view.classList.toggle("hidden", view.dataset.view !== name);
  });
  document.querySelectorAll("#nav [data-go]").forEach((button) => {
    if (button.dataset.go === name) button.setAttribute("aria-current", "page");
    else button.removeAttribute("aria-current");
  });
  nav.classList.remove("open");
  menuBtn.setAttribute("aria-expanded", "false");
  window.scrollTo(0, 0);
}

function renderJobs() {
  const rows = JOBS.filter((job) => filter === "all" || job.kind === filter);
  if (!rows.length) {
    jobsEl.innerHTML = '<p class="empty">No roles in this filter.</p>';
    return;
  }
  jobsEl.innerHTML = rows
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
  const saved = sessionStorage.getItem(PROFILE_KEY + member.email);
  const data = saved
    ? JSON.parse(saved)
    : { focus: "Job search", proof: "", location: "" };
  profileForm.elements.focus.value = data.focus;
  profileForm.elements.proof.value = data.proof;
  profileForm.elements.location.value = data.location;
  profileNote.textContent = saved ? "Saved on this device for this session." : "";
}

document.querySelector("#signin").addEventListener("click", () => {
  const email = document.querySelector("#email").value.trim().toLowerCase();
  const passcode = document.querySelector("#passcode").value;
  const known = MEMBERS[email];
  if (!known || known.passcode !== passcode) {
    errorEl.textContent = "That email and passcode do not match a member.";
    return;
  }
  errorEl.textContent = "";
  sessionStorage.setItem(SESSION_KEY, JSON.stringify({ email }));
  showApp({ email, ...known });
});

document.querySelector("#signout").addEventListener("click", () => {
  sessionStorage.removeItem(SESSION_KEY);
  showGate();
});

document.querySelectorAll("[data-go]").forEach((button) => {
  button.addEventListener("click", () => showView(button.dataset.go));
});

document.querySelectorAll("[data-filter]").forEach((button) => {
  button.addEventListener("click", () => {
    filter = button.dataset.filter;
    document.querySelectorAll("[data-filter]").forEach((chip) => {
      chip.setAttribute("aria-pressed", chip === button ? "true" : "false");
    });
    renderJobs();
  });
});

menuBtn.addEventListener("click", () => {
  const open = nav.classList.toggle("open");
  menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
});

profileForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = {
    focus: profileForm.elements.focus.value,
    proof: profileForm.elements.proof.value.trim(),
    location: profileForm.elements.location.value.trim(),
  };
  sessionStorage.setItem(PROFILE_KEY + member.email, JSON.stringify(data));
  profileNote.textContent = "Profile saved for this browser session.";
});

document.querySelector("#signin-card").addEventListener("keydown", (event) => {
  if (event.key === "Enter") document.querySelector("#signin").click();
});

const existing = readSession();
if (existing) showApp(existing);
else showGate();
