/**
 * lean-packages — Client-side scripts
 * - Dynamic GitHub API release/tag fetching with caching
 * - Interactive installation command switcher
 * - Accessible copy-to-clipboard functionality
 */

document.addEventListener('DOMContentLoaded', () => {
  initVersionFetcher();
  initInstallTabs();
  initCopyButtons();
  initYear();
});

/**
 * Fetch latest version tags from GitHub API for each repository.
 * Uses sessionStorage cache to prevent API rate limiting.
 */
function initVersionFetcher() {
  const repos = ['php-lean', 'cargo-lean', 'py-lean', 'js-lean'];
  const CACHE_KEY_PREFIX = 'lean_pkg_ver_';
  const CACHE_TTL = 3600 * 1000; // 1 hour

  repos.forEach(repo => {
    const versionEl = document.getElementById(`version-${repo}`);
    if (!versionEl) return;
    const vText = versionEl.querySelector('.v-text');

    // 1. Check local session cache
    try {
      const cached = sessionStorage.getItem(CACHE_KEY_PREFIX + repo);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Date.now() - parsed.timestamp < CACHE_TTL && parsed.version) {
          if (vText) vText.textContent = parsed.version;
          return;
        }
      }
    } catch {
      // Storage access may be blocked; proceed to fetch
    }

    // 2. Fetch tags from GitHub API
    fetch(`https://api.github.com/repos/lean-packages/${repo}/tags`)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        return response.json();
      })
      .then(tags => {
        if (Array.isArray(tags) && tags.length > 0 && tags[0].name) {
          const latestTag = tags[0].name;
          if (vText) {
            vText.textContent = latestTag;
          }
          try {
            sessionStorage.setItem(
              CACHE_KEY_PREFIX + repo,
              JSON.stringify({ version: latestTag, timestamp: Date.now() })
            );
          } catch {
            // Ignore storage errors
          }
        }
      })
      .catch(() => {
        // Fallback to static version in HTML if offline or rate limited
      });
  });
}

/**
 * Handle tab switching for installation command variants
 */
function initInstallTabs() {
  const tabContainers = document.querySelectorAll('.install-container');

  tabContainers.forEach(container => {
    const tabs = container.querySelectorAll('.tab-btn');
    const codeElement = container.querySelector('.install-code');

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        // Deactivate siblings
        tabs.forEach(t => {
          t.classList.remove('active');
          t.setAttribute('aria-selected', 'false');
        });

        // Activate current tab
        tab.classList.add('active');
        tab.setAttribute('aria-selected', 'true');

        // Update code snippet
        const newCmd = tab.getAttribute('data-cmd');
        if (newCmd && codeElement) {
          codeElement.textContent = newCmd;
        }
      });
    });
  });
}

/**
 * Handle copy to clipboard functionality
 */
function initCopyButtons() {
  const copyButtons = document.querySelectorAll('.copy-btn');
  const toast = document.getElementById('toast');
  let toastTimer = null;

  copyButtons.forEach(btn => {
    btn.addEventListener('click', async () => {
      const targetId = btn.getAttribute('data-copy-target');
      const targetEl = document.getElementById(targetId);
      if (!targetEl) return;

      const textToCopy = targetEl.textContent.trim();

      try {
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(textToCopy);
        } else {
          // Fallback for non-secure contexts
          const textarea = document.createElement('textarea');
          textarea.value = textToCopy;
          textarea.style.position = 'fixed';
          textarea.style.opacity = '0';
          document.body.appendChild(textarea);
          textarea.focus();
          textarea.select();
          document.execCommand('copy');
          document.body.removeChild(textarea);
        }

        // Button feedback
        const label = btn.querySelector('.copy-label');
        const originalLabel = label ? label.textContent : 'Copy';
        btn.classList.add('copied');
        if (label) label.textContent = 'Copied!';

        // Toast notification
        if (toast) {
          toast.textContent = `Copied: "${textToCopy}"`;
          toast.classList.add('show');
          if (toastTimer) clearTimeout(toastTimer);
          toastTimer = setTimeout(() => {
            toast.classList.remove('show');
          }, 2400);
        }

        setTimeout(() => {
          btn.classList.remove('copied');
          if (label) label.textContent = originalLabel;
        }, 2000);
      } catch (err) {
        console.error('Failed to copy text: ', err);
      }
    });
  });
}

/**
 * Ensure current year is accurate
 */
function initYear() {
  const yearEl = document.getElementById('current-year');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }
}
