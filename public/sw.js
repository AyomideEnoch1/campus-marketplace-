// Service Worker for ọjà Campus Marketplace Web Push Notifications

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let data = {
    title: "New Notification",
    body: "You have a new update on ọjà.",
    url: "/",
    tag: "oja-notification",
  };

  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const title = data.title || "ọjà Alert";
  const options = {
    body: data.body || "New order or message received",
    icon: data.icon || "/images/logo.png",
    badge: data.badge || "/images/logo.png",
    vibrate: [200, 100, 200, 100, 200],
    tag: data.tag || "oja-update",
    renotify: true,
    data: {
      url: data.url || "/dashboard/orders",
    },
    actions: [
      {
        action: "open",
        title: "View Now",
      },
    ],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || "/";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url && "focus" in client) {
            client.focus();
            if ("navigate" in client) {
              return client.navigate(targetUrl);
            }
            return;
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }
      })
  );
});
