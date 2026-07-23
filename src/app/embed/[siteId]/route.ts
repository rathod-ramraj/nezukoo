import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongo";
import { VAPID_PUBLIC } from "@/lib/push";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { siteId: string } }) {
  const siteId = params.siteId.replace(/\.js$/, "");
  const db = await getDb();
  const site = await db.collection("sites").findOne({ siteId });
  if (!site) {
    return new NextResponse(`/* Nezuko: unknown site */`, {
      status: 404,
      headers: { "Content-Type": "application/javascript" },
    });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://layla.wtf";
  const js = buildEmbed({ siteId, appUrl, vapidPublic: VAPID_PUBLIC });
  return new NextResponse(js, {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "public, max-age=300",
    },
  });
}

function buildEmbed({ siteId, appUrl, vapidPublic }: { siteId: string; appUrl: string; vapidPublic: string }) {
  return `(function(){
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
  var API = ${JSON.stringify(appUrl)};
  var SITE = ${JSON.stringify(siteId)};
  var VAPID = ${JSON.stringify(vapidPublic)};

  function b64ToUint8(b64){
    var pad='='.repeat((4 - b64.length % 4) % 4);
    var s=(b64+pad).replace(/-/g,'+').replace(/_/g,'/');
    var raw=atob(s); var out=new Uint8Array(raw.length);
    for(var i=0;i<raw.length;i++) out[i]=raw.charCodeAt(i);
    return out;
  }

  function ping(evt, extra){
    try {
      fetch(API + '/api/verify', {
        method:'POST', mode:'cors', keepalive:true,
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify(Object.assign({siteId:SITE, origin:location.origin, event:evt}, extra||{}))
      });
    } catch(e){}
  }

  async function register(){
    var reg;
    try {
      var probe = await fetch('/nezuko-sw.js', { method: 'GET', cache: 'no-store' });
      var ct = (probe.headers.get('content-type') || '').toLowerCase();
      if (!probe.ok || ct.indexOf('javascript') === -1) {
        console.error('[Nezuko] /nezuko-sw.js is missing or not JavaScript (content-type: ' + ct + '). Download it from ' + API + '/sw.js and place it at the root of your site.');
        return;
      }
      reg = await navigator.serviceWorker.register('/nezuko-sw.js', { scope: '/' });
    } catch(e){
      console.error('[Nezuko] Service worker registration failed:', e && e.message ? e.message : e);
      return;
    }
    ping('loaded');

    var perm = Notification.permission;
    if (perm === 'denied') return;
    if (perm === 'default'){
      var asked=false;
      var ask = async function(){
        if (asked) return; asked=true;
        document.removeEventListener('click', ask, true);
        var p = await Notification.requestPermission();
        if (p === 'granted') subscribe(reg);
      };
      document.addEventListener('click', ask, true);
      return;
    }
    subscribe(reg);
  }

  async function subscribe(reg){
    try {
      var sub = await reg.pushManager.getSubscription();
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: b64ToUint8(VAPID),
        });
      }
      await fetch(API + '/api/subscribe', {
        method:'POST', mode:'cors',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ siteId: SITE, origin: location.origin, subscription: sub })
      });
    } catch(e){}
  }

  if (document.readyState === 'complete') register();
  else window.addEventListener('load', register);
})();`;
}
