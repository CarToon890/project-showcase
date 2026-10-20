const dateFormatter = new Intl.DateTimeFormat("th-TH", {
  dateStyle: "long",
  timeStyle: "short",
  timeZone: "Asia/Bangkok",
});

function plainText(value) {
  return String(value || "")
    .normalize("NFKC")
    .replace(/[^\p{Script=Thai}\p{Script=Latin}\p{N}\s.,:;!?()'"\/+#+_-]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

function renderRepositoryActivity(project, stale) {
  const card = document.querySelector(`[data-repo="${project.name}"]`);
  const container = card?.querySelector(".repo-meta");
  if (!container) return;

  const date = document.createElement("p");
  date.className = "meta-date";
  date.textContent = project.commit?.date
    ? dateFormatter.format(new Date(project.commit.date))
    : "Commit date unavailable";
  date.setAttribute("aria-label", `Latest commit date, Thailand time: ${date.textContent}`);

  const label = document.createElement("p");
  label.className = "meta-label";
  label.textContent = "LATEST COMMIT - THAILAND TIME";

  const commit = document.createElement("p");
  commit.className = "meta-commit";
  const message = document.createElement("span");
  message.className = "meta-message";
  message.textContent = plainText(project.commit?.message) || "Commit message unavailable";
  const sha = document.createElement("a");
  sha.href = project.commit?.url || `https://github.com/CarToon890/${project.name}`;
  sha.target = "_blank";
  sha.rel = "noopener noreferrer";
  sha.textContent = project.commit?.sha?.slice(0, 7) || "View repo";
  sha.setAttribute("aria-label", `Open latest commit for ${project.name}`);
  commit.append(message, sha);

  const status = document.createElement("p");
  status.className = "meta-status";
  const contexts = project.status?.contexts || [];
  if (contexts.length) {
    const parts = contexts.map((context) => {
      const name = plainText(context.name || context.context) || "Commit status";
      const state = (context.state || "unknown").toLowerCase();
      const text = `${name}: ${plainText(state)}`;
      if (!context.url) return text;
      const link = document.createElement("a");
      link.href = context.url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = text;
      return link;
    });
    status.dataset.state = project.status.state || "unknown";
    status.append(...parts.flatMap((part, index) => index ? [document.createTextNode(" · "), part] : [part]));
  } else {
    status.textContent = project.status?.unavailable ? "Commit status unavailable" : "No commit status reported";
    status.dataset.state = "none";
  }

  container.replaceChildren(label, date, commit, status);
  if (stale) {
    const notice = document.createElement("p");
    notice.className = "meta-loading";
    notice.textContent = "Showing the last saved repository data";
    container.append(notice);
  }
}

async function loadRepositoryMetadata() {
  const refreshNote = document.getElementById("data-refresh");
  try {
    const response = await fetch("data/project-metadata.json", { cache: "no-store" });
    if (!response.ok) throw new Error("Metadata is unavailable");
    const metadata = await response.json();
    for (const project of metadata.projects || []) {
      renderRepositoryActivity(project, metadata.staleRepos?.includes(project.name));
    }
    if (metadata.checkedAt && refreshNote) {
      const checkedAt = dateFormatter.format(new Date(metadata.checkedAt));
      refreshNote.textContent = metadata.staleRepos?.length
        ? `GitHub data checked ${checkedAt} Thailand time. Some saved data could not be refreshed.`
        : `GitHub data checked ${checkedAt} Thailand time.`;
    }
  } catch {
    if (refreshNote) refreshNote.textContent = "Repository activity is temporarily unavailable.";
    document.querySelectorAll(".repo-meta").forEach((container) => {
      const message = document.createElement("p");
      message.className = "meta-loading";
      message.textContent = "Repository activity is temporarily unavailable";
      container.replaceChildren(message);
    });
  }
}

function setupRevealAnimations() {
  const elements = [...document.querySelectorAll(".reveal")];
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) {
    elements.forEach((element) => element.classList.add("is-visible"));
    return;
  }

  elements.forEach((element, index) => {
    element.style.setProperty("--reveal-delay", `${(index % 3) * 70}ms`);
  });
  const observer = new IntersectionObserver((entries, currentObserver) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add("is-visible");
      currentObserver.unobserve(entry.target);
    }
  }, { threshold: 0.12 });
  elements.forEach((element) => observer.observe(element));
}

setupRevealAnimations();
loadRepositoryMetadata();
