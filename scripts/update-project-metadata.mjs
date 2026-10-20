import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const cachePath = resolve(root, "data/project-metadata.json");
const outputPath = resolve(root, "dist/data/project-metadata.json");
const owner = "CarToon890";
const apiBase = "https://api.github.com";
const apiHeaders = {
  Accept: "application/vnd.github+json",
  "X-GitHub-Api-Version": "2022-11-28",
  "User-Agent": "CarToon890-project-showcase",
};

if (process.env.GITHUB_TOKEN) {
  apiHeaders.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
}

async function readCache() {
  try {
    const cached = JSON.parse(await readFile(cachePath, "utf8"));
    return new Map((cached.projects || []).map((project) => [project.name, project]));
  } catch {
    return new Map();
  }
}

async function fetchJson(url) {
  const response = await fetch(url, { headers: apiHeaders, signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new Error(`GitHub API returned ${response.status}`);
  return response.json();
}

async function updateProject(name, cache) {
  const previous = cache.get(name);
  try {
    const commits = await fetchJson(`${apiBase}/repos/${owner}/${name}/commits?per_page=1`);
    const latest = commits[0];
    if (!latest) throw new Error("No commit found");

    const sha = latest.sha;
    let status = previous?.commit?.sha === sha ? previous.status : { state: "none", contexts: [] };
    let statusStale = false;
    try {
      const combined = await fetchJson(`${apiBase}/repos/${owner}/${name}/commits/${sha}/status`);
      status = {
        state: combined.statuses?.length ? combined.state : "none",
        contexts: (combined.statuses || []).map((item) => ({
          name: item.context,
          state: item.state,
          url: item.target_url,
        })),
      };
    } catch {
      statusStale = true;
      if (previous?.commit?.sha !== sha) {
        status = { state: "unknown", contexts: [], unavailable: true };
      }
    }

    const project = {
      name,
      commit: {
        date: latest.commit.committer?.date || latest.commit.author?.date,
        message: latest.commit.message.split("\n")[0],
        sha,
        url: latest.html_url,
      },
      status,
    };
    return { project, stale: statusStale };
  } catch {
    if (previous) return { project: previous, stale: true };
    return { project: { name, commit: null, status: { state: "none", contexts: [] } }, stale: true };
  }
}

const previous = await readCache();
const names = [
  "MediaStudio",
  "dropscan-project",
  "Scale-Slimy-Fish",
  "tileai-project",
  "ProjectWeb-Application-Development",
  "ML-Deployment-Project",
  "Project-CCTV-Safety",
];
const results = await Promise.all(names.map((name) => updateProject(name, previous)));
const projects = results.map(({ project }) => project);
const staleRepos = results.filter(({ stale }) => stale).map(({ project }) => project.name);
const cacheJson = `${JSON.stringify({ projects }, null, 2)}\n`;
const previousJson = JSON.stringify({ projects: [...previous.values()] }, null, 2);

await mkdir(dirname(cachePath), { recursive: true });
await mkdir(dirname(outputPath), { recursive: true });
if (cacheJson !== `${previousJson}\n`) await writeFile(cachePath, cacheJson, "utf8");
await writeFile(outputPath, `${JSON.stringify({
  checkedAt: new Date().toISOString(),
  staleRepos,
  projects,
}, null, 2)}\n`, "utf8");
console.log(`Updated ${projects.length} projects. Using saved data for ${staleRepos.length}.`);
