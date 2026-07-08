#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

const API_ROOT = 'https://api.github.com';

function parseArgs(argv) {
  const args = {
    path: process.env.DRAFT_PATH || 'docs/github/issues',
    dryRun: String(process.env.DRY_RUN || '').toLowerCase() === 'true',
    duplicateMode: process.env.DUPLICATE_MODE || 'skip',
  };

  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--dry-run') {
      args.dryRun = true;
    } else if (arg === '--path') {
      args.path = argv[++i];
    } else if (arg.startsWith('--path=')) {
      args.path = arg.slice('--path='.length);
    } else if (arg === '--duplicate-mode') {
      args.duplicateMode = argv[++i];
    } else if (arg.startsWith('--duplicate-mode=')) {
      args.duplicateMode = arg.slice('--duplicate-mode='.length);
    } else if (arg === '--help' || arg === '-h') {
      printHelp();
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (!['skip', 'create'].includes(args.duplicateMode)) {
    throw new Error('--duplicate-mode must be either "skip" or "create".');
  }

  return args;
}

function printHelp() {
  console.log(`Usage: node scripts/create-github-issues-from-drafts.js [options]\n\nOptions:\n  --path <path>             Markdown file or directory to import (default: docs/github/issues)\n  --dry-run                 Print the issues that would be created without calling GitHub\n  --duplicate-mode <mode>   "skip" or "create" when an issue title already exists (default: skip)\n`);
}

function getMarkdownFiles(inputPath) {
  const resolved = path.resolve(process.cwd(), inputPath);
  if (!fs.existsSync(resolved)) {
    throw new Error(`Draft path does not exist: ${inputPath}`);
  }

  const stats = fs.statSync(resolved);
  if (stats.isFile()) {
    if (!resolved.endsWith('.md')) {
      throw new Error(`Draft file must be Markdown: ${inputPath}`);
    }
    return [resolved];
  }

  return fs.readdirSync(resolved, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
    .map((entry) => path.join(resolved, entry.name))
    .sort((a, b) => a.localeCompare(b));
}

function parseDraftFile(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const sections = raw.split(/^# Issue:\s+/gm);
  sections.shift();

  return sections.map((section) => {
    const firstLineBreak = section.indexOf('\n');
    const title = (firstLineBreak === -1 ? section : section.slice(0, firstLineBreak)).trim();
    const body = (firstLineBreak === -1 ? '' : section.slice(firstLineBreak + 1)).trim();
    const labels = extractLabels(body);

    return {
      title,
      body: `${body}\n\n---\nImported from \`${path.relative(process.cwd(), filePath)}\`.`,
      labels,
      source: path.relative(process.cwd(), filePath),
    };
  }).filter((issue) => issue.title && issue.body.trim());
}

function extractLabels(body) {
  const labelSection = body.match(/^## Labels\s*\n([\s\S]*?)(?=\n##\s|\n# Issue:|$)/m);
  if (!labelSection) {
    return [];
  }

  const labels = new Set();
  const labelText = labelSection[1];
  for (const match of labelText.matchAll(/`([^`]+)`/g)) {
    labels.add(match[1].trim());
  }

  if (labels.size === 0) {
    labelText.split(/[\n,]/).map((label) => label.trim()).filter(Boolean).forEach((label) => labels.add(label));
  }

  return [...labels];
}

async function githubRequest(endpoint, { method = 'GET', body, token }) {
  const response = await fetch(`${API_ROOT}${endpoint}`, {
    method,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'motocross-life-simulator-issue-importer',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new Error(`GitHub API ${method} ${endpoint} failed (${response.status}): ${data?.message || text}`);
  }

  return data;
}

async function ensureLabel({ repo, label, token, cache }) {
  if (cache.has(label)) return;

  const encodedLabel = encodeURIComponent(label);
  try {
    await githubRequest(`/repos/${repo}/labels/${encodedLabel}`, { token });
  } catch (error) {
    if (!error.message.includes('failed (404)')) {
      throw error;
    }

    await githubRequest(`/repos/${repo}/labels`, {
      method: 'POST',
      token,
      body: {
        name: label,
        color: '5319e7',
        description: 'Created automatically by the Markdown issue draft importer.',
      },
    });
    console.log(`Created missing label: ${label}`);
  }

  cache.add(label);
}

async function findExistingIssue({ repo, title, token }) {
  const query = encodeURIComponent(`repo:${repo} is:issue in:title "${title.replace(/"/g, '\\"')}"`);
  const data = await githubRequest(`/search/issues?q=${query}&per_page=10`, { token });
  return data.items?.find((issue) => issue.title === title) || null;
}

async function main() {
  const args = parseArgs(process.argv);
  const files = getMarkdownFiles(args.path);
  const issues = files.flatMap(parseDraftFile);

  console.log(`Found ${issues.length} issue draft(s) in ${files.length} Markdown file(s).`);

  if (issues.length === 0) {
    console.log('No issue drafts found. Draft headings must use "# Issue: <title>".');
    return;
  }

  if (args.dryRun) {
    for (const issue of issues) {
      console.log(`[dry-run] ${issue.title} (${issue.labels.length ? issue.labels.join(', ') : 'no labels'}) from ${issue.source}`);
    }
    return;
  }

  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPOSITORY;
  if (!token) throw new Error('GITHUB_TOKEN is required unless --dry-run is used.');
  if (!repo) throw new Error('GITHUB_REPOSITORY is required unless --dry-run is used.');

  const labelCache = new Set();

  for (const issue of issues) {
    for (const label of issue.labels) {
      await ensureLabel({ repo, label, token, cache: labelCache });
    }

    if (args.duplicateMode === 'skip') {
      const existing = await findExistingIssue({ repo, title: issue.title, token });
      if (existing) {
        console.log(`Skipped existing issue #${existing.number}: ${issue.title}`);
        continue;
      }
    }

    const created = await githubRequest(`/repos/${repo}/issues`, {
      method: 'POST',
      token,
      body: {
        title: issue.title,
        body: issue.body,
        labels: issue.labels,
      },
    });
    console.log(`Created issue #${created.number}: ${created.title}`);
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
