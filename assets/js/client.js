const publicVapidKey =
  "BLw8eQT2gXruHzMb4YkMq0Dj-j8Pg1GfUhu8bUWLhdj8fhh13OX7mfR6yDvY4ua6UUx3Wp27MWMgAsyx6DhP4i8";

if ("serviceWorker" in navigator) {
  send().catch((err) => console.error(err));
}

async function send() {
  // Register Service worker
  console.log("Registering Service Worker");
  const register = await navigator.serviceWorker.register("/worker.js");
  console.log("SW registered");
  console.log(navigator.serviceWorker);

  await navigator.serviceWorker.ready;

  const permission = await window.Notification.requestPermission();
  // value of permission can be 'granted', 'default', 'denied'
  // granted: user has accepted the request
  // default: user has dismissed the notification permission popup by clicking on x
  // denied: user has denied the request.
  if (permission !== "granted") {
    throw new Error("Permission not granted for Notification");
  }

  //register push
  console.log("Registering Push...");
  const subscription = await register.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicVapidKey),
  });
  console.log("Push Registered...");

  //send push noti
  console.log("Sending Push...");
  await fetch("/subscribe", {
    method: "POST",
    body: JSON.stringify(subscription),
    headers: {
      "content-type": "application/json",
    },
  });
  console.log("Push Sent");
}

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
