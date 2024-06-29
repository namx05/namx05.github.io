'use strict';

const REPORTS_URL = 'https://github.com/namx05/audits/blob/main/audit-reports/pdf/';

const INTERESTING_COUNT = 8;

const SEVERITIES = [
  { key: 'crit', field: 'critical', letter: 'C', name: 'Critical', weight: 4 },
  { key: 'high', field: 'high', letter: 'H', name: 'High', weight: 3 },
  { key: 'med', field: 'medium', letter: 'M', name: 'Medium', weight: 2 },
  { key: 'low', field: 'low', letter: 'L', name: 'Low', weight: 1 },
  { key: 'info', field: 'informational', letter: 'I', name: 'Informational', weight: 0 },
];

const $ = (id) => document.getElementById(id);

function el(tag, props = {}, children = []) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(props)) {
    if (key === 'class') node.className = value;
    else if (key in node) node[key] = value;
    else node.setAttribute(key, value);
  }
  for (const child of [].concat(children)) {
    if (child != null) node.append(child);
  }
  return node;
}

async function loadJson(path) {
  const response = await fetch(path, { cache: 'no-cache' });
  if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
  return response.json();
}

function resolveReport(report) {
  if (!report) return null;
  if (/^https?:\/\//i.test(report)) return report;
  if (/^[a-z][a-z0-9+.-]*:/i.test(report)) return null;
  return REPORTS_URL + encodeURI(report);
}

function toAudit(entry, icons) {
  const counts = {};
  for (const s of SEVERITIES) counts[s.key] = entry.findings?.[s.field] || 0;
  const firmIcon = icons.firms[entry.firm];
  return {
    name: entry.name,
    desc: entry.type || '',
    eco: entry.ecosystem || '',
    source: entry.source || 'Other',
    firm: entry.firm || '',
    icon: firmIcon ? `icons/firms/${encodeURI(firmIcon)}` : null,
    rank: entry.rank || '',
    year: entry.year ? String(entry.year) : '',
    counts,
    total: SEVERITIES.reduce((sum, s) => sum + counts[s.key], 0),
    score: SEVERITIES.reduce((sum, s) => sum + counts[s.key] * s.weight, 0),
    severe: counts.crit + counts.high,
    report: resolveReport(entry.report),
  };
}

function renderFindings(audit) {
  if (!audit.total) return null;
  const pills = SEVERITIES.filter((s) => audit.counts[s.key]).map((s) => {
    const count = audit.counts[s.key];
    return el('span', {
      class: `sev ${s.key}`,
      textContent: `${count}${s.letter}`,
      title: `${count} ${s.name}`,
      role: 'img',
      'aria-label': `${count} ${s.name}`,
    });
  });
  return el('div', { class: 'findings' }, pills);
}

function renderReport(audit) {
  if (audit.report) {
    const isPdf = /\.pdf$/i.test(audit.report);
    return el('a', { href: audit.report, textContent: isPdf ? 'PDF' : 'Results', rel: 'noopener' });
  }
  return el('span', { class: 'locked', textContent: '🔒 Locked', title: 'Report is locked and not yet public' });
}

function renderFirm(audit) {
  const parts = [];
  if (audit.icon) {
    const icon = el('img', { class: 'firm-icon', src: audit.icon, alt: '', loading: 'lazy', width: 15, height: 15 });
    icon.addEventListener('error', () => icon.remove());
    parts.push(icon);
  }
  parts.push(audit.firm || '–');
  return parts;
}

let ecosystemIcons = {};

function ecoIcon(name, alt = '') {
  const file = ecosystemIcons[name];
  if (!file) return null;
  return el('img', { class: 'firm-icon', src: `icons/ecosystems/${encodeURI(file)}`, alt, title: name, loading: 'lazy', width: 15, height: 15 });
}

function renderEcosystem(audit) {
  const names = ecosystemsOf(audit);
  if (!names.length) return ['–'];
  return names.flatMap((name, i) => [i ? ' / ' : null, el('span', { class: 'firm' }, [ecoIcon(name), name])]);
}

function firmLabel(audit) {
  if (!audit.firm) return '';
  return `${audit.source === 'Public contests' ? 'on' : 'with'} ${audit.firm}`;
}

function renderProtocol(audit) {
  const name = [el('span', { class: 'protocol', textContent: audit.name })];
  const icons = ecosystemsOf(audit).map((eco) => ecoIcon(eco, eco)).filter(Boolean);
  if (icons.length) name.push(' ', el('span', { class: 'eco-inline' }, icons));
  if (audit.rank) name.push(' ', el('span', { class: 'rank', textContent: `#${audit.rank}`.replace('#🥇', '🥇') }));
  if (audit.desc) name.push(el('span', { class: 'desc', textContent: audit.desc }));
  if (audit.firm) name.push(el('span', { class: 'desc firm-inline', textContent: firmLabel(audit) }));
  return name;
}

function renderStats(stats) {
  document.querySelectorAll('[data-stat]').forEach((node) => {
    node.textContent = stats[node.dataset.stat] ?? '';
  });
}

function renderInteresting(audits) {
  const top = [...audits]
    .sort((a, b) => b.score - a.score || b.total - a.total)
    .slice(0, INTERESTING_COUNT)
    .sort(SORTS.default);
  $('interesting-list').replaceChildren(...top.map((audit) => {
    const name = audit.report
      ? el('a', { class: 'protocol', href: audit.report, textContent: audit.name, rel: 'noopener' })
      : el('span', { class: 'protocol', textContent: audit.name });
    const parts = [audit.desc, renderEcosystem(audit), firmLabel(audit), audit.year, audit.report ? '' : '🔒 report not yet public'].filter(Boolean);
    const detail = parts.flatMap((part, i) => [i ? ' · ' : null, ...[].concat(part)]);
    return el('li', {}, [
      el('div', {}, [name, el('span', { class: 'desc' }, detail)]),
      renderFindings(audit),
    ]);
  }));
}

const SORTS = {
  default: (a, b) => (Number(b.year) || 0) - (Number(a.year) || 0),
  total: (a, b) => b.total - a.total || b.score - a.score,
  severe: (a, b) => b.severe - a.severe || b.total - a.total,
  name: (a, b) => a.name.localeCompare(b.name),
};

function ecosystemsOf(audit) {
  return audit.eco.split('/').map((e) => e.trim()).filter(Boolean);
}

function fillSelect(select, allLabel, values) {
  select.replaceChildren(
    el('option', { value: '', textContent: allLabel }),
    ...values.map((value) => el('option', { value, textContent: value })),
  );
}

function setupAuditTable(audits) {
  const byFrequency = (values) => {
    const tally = new Map();
    values.forEach((v) => tally.set(v, (tally.get(v) || 0) + 1));
    return [...tally.keys()].sort((a, b) => tally.get(b) - tally.get(a));
  };
  fillSelect($('f-source'), 'All', [...new Set(audits.map((a) => a.source))]);
  fillSelect($('f-firm'), 'All', byFrequency(audits.map((a) => a.firm).filter(Boolean)));
  fillSelect($('f-eco'), 'All', byFrequency(audits.flatMap(ecosystemsOf)));
  fillSelect($('f-year'), 'All', [...new Set(audits.map((a) => a.year).filter(Boolean))].sort().reverse());

  const update = () => {
    const query = $('f-search').value.trim().toLowerCase();
    const source = $('f-source').value;
    const firm = $('f-firm').value;
    const eco = $('f-eco').value;
    const year = $('f-year').value;
    const shown = audits
      .filter((a) => !source || a.source === source)
      .filter((a) => !firm || a.firm === firm)
      .filter((a) => !eco || ecosystemsOf(a).includes(eco))
      .filter((a) => !year || a.year === year)
      .filter((a) => !query || [a.name, a.desc, a.eco, a.firm].join(' ').toLowerCase().includes(query))
      .sort(SORTS[$('f-sort').value]);

    $('no-results').hidden = shown.length > 0;
    $('audit-body').replaceChildren(...shown.map((audit) => el('tr', {}, [
      el('td', {}, renderProtocol(audit)),
      el('td', { class: 'col-eco' }, renderEcosystem(audit)),
      el('td', {}, renderFindings(audit)),
      el('td', { class: 'col-firm' }, renderFirm(audit)),
      el('td', { class: 'col-year', textContent: audit.year || '–' }),
      el('td', {}, renderReport(audit)),
    ])));
  };

  $('f-search').addEventListener('input', update);
  for (const id of ['f-source', 'f-firm', 'f-eco', 'f-year', 'f-sort']) $(id).addEventListener('change', update);
  update();
}

function formatDate(iso) {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-GB', { month: 'short', year: 'numeric', timeZone: 'UTC' });
}

async function loadBlog() {
  const list = $('blog-list');
  try {
    const posts = await loadJson('data/blogs.json');
    posts.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    list.replaceChildren(...posts.filter((p) => /^https?:\/\//.test(p.url)).map((post) => el('li', {}, [
      el('a', { href: post.url, textContent: post.title, rel: 'noopener' }),
      post.date ? el('time', { dateTime: post.date, textContent: formatDate(post.date) }) : null,
    ])));
  } catch (error) {
    console.error(error);
    list.replaceChildren(el('li', {}, el('a', { href: 'https://namx05.medium.com', textContent: 'Read on Medium', rel: 'noopener' })));
  }
}

async function loadAudits() {
  const status = $('status');
  try {
    const [entries, stats, icons] = await Promise.all([
      loadJson('data/audits.json'),
      loadJson('data/summary.json'),
      loadJson('data/icons.json'),
    ]);
    ecosystemIcons = icons.ecosystems;
    const audits = entries.map((entry) => toAudit(entry, icons));

    renderStats(stats);
    renderInteresting(audits);
    setupAuditTable(audits);
    status.hidden = true;
    document.querySelectorAll('[data-live]').forEach((node) => { node.hidden = false; });
    if (location.hash) document.querySelector(location.hash)?.scrollIntoView();
  } catch (error) {
    console.error(error);
    status.textContent = 'Could not load the audit list.';
  }
}

loadAudits();
loadBlog();

// Sticky header: once the intro photo scrolls out of view, compact the header
// and slide the profile photo up into the brand.
(function () {
  const header = document.querySelector('.site-header');
  const avatar = document.querySelector('.intro .avatar');
  if (!header || !avatar) return;
  const set = (stuck) => header.classList.toggle('is-stuck', stuck);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => set(!e.isIntersecting), {
      rootMargin: `-${header.offsetHeight}px 0px 0px 0px`,
    }).observe(avatar);
  } else {
    const onScroll = () => set(avatar.getBoundingClientRect().bottom < header.offsetHeight);
    addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }
})();
