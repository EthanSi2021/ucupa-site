(() => {
  const root = document.getElementById('ucupa-site');
  root.querySelectorAll('a[href^="#"]').forEach(a => a.addEventListener('click', () => {
    root.querySelector('.u-mobile-menu').open = false;
  }));
  root.querySelector('#u-copy-command').addEventListener('click', async () => {
    const status = root.querySelector('#u-copy-status');
    try {
      await navigator.clipboard.writeText('go run ./cmd/ucupa');
      status.textContent = 'Command copied.';
    } catch {
      status.textContent = 'Copy unavailable. Select the command above to copy it manually.';
    }
  });
})();
