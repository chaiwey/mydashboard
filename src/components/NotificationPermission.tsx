"use client";

import { api } from "@/trpc/react";
import { useState, useEffect } from "react";

export function NotificationPermission() {
  const [permission, setPermission] = useState<NotificationPermission | null>(null);
  const [subscribing, setSubscribing] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const { data: existingSub } = api.push.getSubscription.useQuery();
  const subscribeMutation = api.push.subscribe.useMutation();

  useEffect(() => {
    if (typeof Notification !== "undefined") setPermission(Notification.permission);
  }, []);

  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

  if (!vapidPublicKey || permission === "granted" || permission === "denied" || dismissed || existingSub) {
    return null;
  }

  const handleEnable = async () => {
    setSubscribing(true);
    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== "granted") return;
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as unknown as ArrayBuffer,
      });
      const json = sub.toJSON();
      await subscribeMutation.mutateAsync({
        endpoint: json.endpoint!,
        p256dh: json.keys!.p256dh,
        auth: json.keys!.auth,
      });
    } catch (err) {
      console.error("Failed to subscribe:", err);
    } finally {
      setSubscribing(false);
    }
  };

  return (
    <div
      className="mb-5 px-4 py-3 rounded-xl flex items-center justify-between gap-3 text-sm"
      style={{ background: "var(--color-surface-raised)", border: "1px solid var(--color-border-subtle)" }}
    >
      <p style={{ color: "var(--color-muted)" }}>Enable reminders to get notified before tasks are due.</p>
      <div className="flex gap-3 shrink-0 items-center">
        <button onClick={() => setDismissed(true)} className="text-xs transition-opacity hover:opacity-70" style={{ color: "var(--color-muted)" }}>
          Dismiss
        </button>
        <button
          onClick={handleEnable}
          disabled={subscribing}
          className="text-xs px-3 py-1.5 rounded-lg transition-opacity hover:opacity-80 disabled:opacity-40"
          style={{ background: "var(--color-accent)", color: "var(--color-surface-raised)", fontFamily: "inherit" }}
        >
          {subscribing ? "Enabling…" : "Enable"}
        </button>
      </div>
    </div>
  );
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}
