export function closeMobileSheet(selector: string, onClosed: () => void): void {
  if (
    typeof window === 'undefined'
    || typeof document === 'undefined'
    || !window.matchMedia('(max-width: 900px)').matches
    || window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ) {
    onClosed();
    return;
  }

  const sheet = document.querySelector<HTMLElement>(selector);
  if (!sheet || sheet.dataset['sheetClosing'] === 'true') {
    if (!sheet) {
      onClosed();
    }
    return;
  }

  sheet.dataset['sheetClosing'] = 'true';
  const animation = sheet.animate(
    [
      { transform: 'translate3d(0, 0, 0)' },
      { transform: 'translate3d(0, 100%, 0)' },
    ],
    {
      duration: 260,
      easing: 'cubic-bezier(.4, 0, 1, 1)',
      fill: 'forwards',
    },
  );

  let completed = false;
  const finish = (): void => {
    if (completed) {
      return;
    }
    completed = true;
    onClosed();
  };

  animation.addEventListener('finish', finish, { once: true });
  animation.addEventListener('cancel', finish, { once: true });
}
