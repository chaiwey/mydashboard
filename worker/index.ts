// Push event handlers — merged into the generated service worker by next-pwa

declare let self: ServiceWorkerGlobalScope;

self.addEventListener("push", (event) => {
  const data = event.data?.json() as { title?: string; body?: string; todoId?: string } | undefined ?? {};
  event.waitUntil(
    self.registration.showNotification(data.title ?? "Reminder", {
      body: data.body ?? "",
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      data: { todoId: data.todoId, url: "/dashboard" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((list) => {
        for (const client of list) {
          if (client.url.includes("/dashboard")) return client.focus();
        }
        return self.clients.openWindow("/dashboard");
      })
  );
});
