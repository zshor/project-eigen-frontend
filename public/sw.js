self.addEventListener('push', function(event) {
  // Check if the server sent data
  let data = { title: 'The Mirror', body: '...' };
  if (event.data) {
    data = event.data.json();
  }

  const options = {
    body: data.body,
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    vibrate: [200, 100, 200],
    data: {
      url: self.location.origin
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  // Open the app when the notification is clicked
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});
