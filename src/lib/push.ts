import webpush from "web-push";

const pub = process.env.VAPID_PUBLIC_KEY;
const priv = process.env.VAPID_PRIVATE_KEY;
const contact = process.env.VAPID_CONTACT || "mailto:admin@nezuko.wtf";

if (pub && priv) {
  webpush.setVapidDetails(contact, pub, priv);
}

export { webpush };
export const VAPID_PUBLIC = pub || "";
