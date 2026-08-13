self.addEventListener('push', (event) => {
  const payload = event.data ? event.data.json() : {};
  const notification = payload.notification || payload;
  event.waitUntil(self.registration.showNotification(notification.title || 'NAgorà', {
    body: notification.body || '', icon: notification.icon || '/icons/icon-192.png', badge: notification.badge || '/icons/icon-192.png', data: notification.data || { url: '/' },
  }));
});
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = new URL(event.notification.data?.url || '/', self.location.origin).href;
  event.waitUntil((async () => {
    const windows = await clients.matchAll({ type: 'window', includeUncontrolled: true });
    const existing = windows[0];
    if (existing) {
      const navigated = await existing.navigate(targetUrl);
      return (navigated || existing).focus();
    }
    return clients.openWindow(targetUrl);
  })());
});
