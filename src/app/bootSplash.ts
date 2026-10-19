/** Removes the static launch screen from index.html once the app shell is on screen. */
export function hideBootSplash() {
  const splash = document.getElementById('boot-splash')
  if (!splash) return
  splash.classList.add('is-hidden')
  window.setTimeout(() => splash.remove(), 400)
}
