/* WTF Header — progressive enhancement
   - Toggles search drawer with focus
   - Keeps <summary> aria-expanded in sync (for some ATs)
*/
(() => {
  const searchToggle = document.querySelector('[data-search-toggle]');
  const searchDrawer = document.querySelector('[data-search-drawer]');
  if (searchToggle && searchDrawer) {
    searchToggle.addEventListener('click', () => {
      const isHidden = searchDrawer.hasAttribute('hidden');
      if (isHidden) {
        searchDrawer.removeAttribute('hidden');
        const input = searchDrawer.querySelector('.search-input');
        if (input) setTimeout(() => input.focus(), 80);
      } else {
        searchDrawer.setAttribute('hidden', '');
      }
    });
  }

  // Keep details/summary aria-expanded in sync (optional polish)
  const nav = document.querySelector('[data-mobile-nav]');
  if (nav) {
    const summary = nav.querySelector('summary.site-header__nav-toggle');
    if (summary) {
      nav.addEventListener('toggle', () => {
        summary.setAttribute('aria-expanded', nav.open ? 'true' : 'false');
      });
    }
  }
})();
