/** Keep the current member and query when switching API language. */
function updateApiLanguageLinks() {
  for (const link of document.querySelectorAll('[data-api-language]')) {
    const url = new URL(link.href);
    url.search = window.location.search;
    url.hash = window.location.hash;
    link.href = url.href;
  }
}
updateApiLanguageLinks();
window.addEventListener('hashchange', updateApiLanguageLinks);

const root = document.documentElement;
const header = document.querySelector('.sf-api-header');
const themeButton = document.querySelector('.sf-api-theme');
const languageMenu = document.querySelector('.sf-api-languages');
const menuButton = document.querySelector('.sf-api-menu-button');
const sidebarButton = document.querySelector('#sf-api-sidebar-trigger');
const sidebar = document.querySelector('.col-sidebar');
const systemTheme = window.matchMedia('(prefers-color-scheme: dark)');
const narrowScreen = window.matchMedia('(max-width: 959px)');

/**
 * Read the shared preference without breaking navigation when
 * storage is unavailable.
 */
function readPreference() {
  try {
    return localStorage.getItem('vitepress-theme-appearance') ||
      localStorage.getItem('tsd-theme') || 'auto';
  } catch {
    return 'auto';
  }
}

/**
 * Apply the preference used by the main site and keep the switch's
 * accessible name current.
 * @param {string} preference - Stored theme preference.
 */
function applyTheme(preference) {
  const dark =
    preference === 'dark' ||
    (preference !== 'light' && systemTheme.matches);
  root.dataset.theme = dark ? 'dark' : 'light';
  themeButton?.setAttribute('aria-checked', String(dark));
  const label = dark
    ? themeButton?.dataset.lightLabel
    : themeButton?.dataset.darkLabel;
  if (label) {
    themeButton.setAttribute('aria-label', label);
    themeButton.setAttribute('title', label);
  }
  const nativeSelect = document.querySelector('#tsd-theme');
  if (nativeSelect) {
    nativeSelect.value = root.dataset.theme;
  }
}

applyTheme(readPreference());
themeButton?.addEventListener('click', () => {
  const preference = root.dataset.theme === 'dark' ? 'light' : 'dark';
  try {
    localStorage.setItem('vitepress-theme-appearance', preference);
    localStorage.setItem('tsd-theme', preference);
  } catch {
    // The current page can still switch themes when persistence is disabled.
  }
  applyTheme(preference);
});
systemTheme.addEventListener('change', () => applyTheme(readPreference()));
window.addEventListener('storage', event => {
  if (event.key === 'vitepress-theme-appearance') {
    applyTheme(readPreference());
  }
});

/** Collapse the main-site navigation independently of the API member drawer. */
function closeNavigation() {
  header?.classList.remove('nav-open');
  menuButton?.setAttribute('aria-expanded', 'false');
}

/**
 * Keep the mobile member drawer's visibility, focus and background
 * interactivity in sync.
 * @param {boolean} open - Show the member drawer.
 * @param {boolean} restoreFocus - Return focus to its trigger.
 */
function setSidebar(open, restoreFocus = false) {
  root.classList.toggle('has-menu', open);
  sidebarButton?.setAttribute('aria-expanded', String(open));
  for (const element of document.querySelectorAll(
    '.col-content, body > footer'
  )) {
    element.inert = open;
  }
  if (open) {
    closeNavigation();
    languageMenu.open = false;
    sidebar?.querySelector('.site-menu a')?.focus();
  } else if (restoreFocus) {
    sidebarButton?.focus();
  }
}

menuButton?.addEventListener('click', () => {
  const open = !header.classList.contains('nav-open');
  setSidebar(false);
  languageMenu.open = false;
  header.classList.toggle('nav-open', open);
  menuButton.setAttribute('aria-expanded', String(open));
});
sidebarButton?.addEventListener('click', () =>
  setSidebar(!root.classList.contains('has-menu'))
);
document.querySelector('#tsd-search-trigger')?.addEventListener('click', () => {
  setSidebar(false);
  closeNavigation();
  languageMenu.open = false;
});
document
  .querySelector('.overlay')
  ?.addEventListener('click', () => setSidebar(false, true));
sidebar?.addEventListener('click', event => {
  if (event.target.closest('a')) {
    setSidebar(false);
  }
});
languageMenu?.addEventListener('toggle', () => {
  if (languageMenu.open) {
    closeNavigation();
    setSidebar(false);
  }
});
document.addEventListener('click', event => {
  if (!languageMenu?.contains(event.target)) {
    languageMenu.open = false;
  }
  if (!header?.contains(event.target)) {
    closeNavigation();
  }
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape') {
    if (root.classList.contains('has-menu')) {
      setSidebar(false, true);
    }
    if (header?.classList.contains('nav-open')) {
      closeNavigation();
      menuButton.focus();
    }
    if (languageMenu?.open) {
      languageMenu.open = false;
      languageMenu.querySelector('summary')?.focus();
    }
  }
  if (event.key === 'Tab' && root.classList.contains('has-menu')) {
    const targets = [
      sidebarButton,
      ...sidebar.querySelectorAll(
        'a, button, input, select, summary'
      ),
    ].filter(element => element.getClientRects().length);
    const index = targets.indexOf(document.activeElement);
    const next = event.shiftKey ? index - 1 : index + 1;
    if (next < 0 || next >= targets.length) {
      event.preventDefault();
      targets[(next + targets.length) % targets.length]?.focus();
    }
  }
});
narrowScreen.addEventListener('change', () => {
  setSidebar(false);
  closeNavigation();
});

// The module navigation is rendered on the server, so it is ready before
// TypeDoc's asynchronous navigation loader (which normally reveals the page).
window.app?.showPage();

/**
 * Keep the selected API visible inside its bounded list without
 * scrolling the page.
 */
function revealCurrentApi() {
  const current = document.querySelector(
    '#sf-api-module-nav a[aria-current="page"]'
  );
  const list = current?.closest('ul');
  if (!list || !list.clientHeight) {
    return;
  }
  const itemRect = current.getBoundingClientRect();
  const listRect = list.getBoundingClientRect();
  if (
    itemRect.top < listRect.top ||
    itemRect.bottom > listRect.bottom
  ) {
    list.scrollTop +=
      itemRect.top -
      listRect.top -
      (list.clientHeight - itemRect.height) / 2;
  }
}
revealCurrentApi();
sidebarButton?.addEventListener('click', revealCurrentApi);
