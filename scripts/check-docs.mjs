import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const docsRoot = join(root, 'docs');
const sidebarPath = join(docsRoot, '_sidebar.md');
const markdownFiles = [];
const markdownLinkPattern = /!?(?:\[[^\]]*\])\(([^)#?]+)(?:#[^)]*)?\)/g;

function collect(path) {
  for (const entry of readdirSync(path)) {
    const fullPath = join(path, entry);
    if (statSync(fullPath).isDirectory()) collect(fullPath);
    else if (entry.endsWith('.md')) markdownFiles.push(fullPath);
  }
}

function routeCandidates(route) {
  const normalized = route.replace(/^\/+|\/+$/g, '');
  return normalized === ''
    ? [join(docsRoot, 'README.md')]
    : [join(docsRoot, normalized, 'README.md'), join(docsRoot, `${normalized}.md`)];
}

function assetPath(file, target) {
  return target.startsWith('/')
    ? join(docsRoot, target)
    : resolve(file, '..', target);
}

collect(docsRoot);
const errors = [];

if (existsSync(sidebarPath)) {
  const sidebar = readFileSync(sidebarPath, 'utf8');
  if (/^-\s+##\s+\[.+\]\(/m.test(sidebar)) {
    errors.push('docs/_sidebar.md: page entries must be regular links for pagination ordering');
  }
}

for (const file of markdownFiles) {
  const content = readFileSync(file, 'utf8');
  const fences = content.match(/^```/gm) ?? [];
  if (fences.length % 2 !== 0) errors.push(`${relative(root, file)}: unbalanced code fence`);

  for (const match of content.matchAll(markdownLinkPattern)) {
    const target = match[1];
    if (/^(?:https?:|mailto:|#)/.test(target)) continue;

    const isImage = match[0].startsWith('!');
    const valid = isImage
      ? existsSync(assetPath(file, target))
      : routeCandidates(target).some(existsSync);
    if (!valid) {
      errors.push(`${relative(root, file)}: missing ${isImage ? 'asset' : 'route'} ${target}`);
    }
  }
}

if (errors.length > 0) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log(`Checked ${markdownFiles.length} Markdown files and all internal routes.`);
