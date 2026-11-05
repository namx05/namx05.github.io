// Apollo.io website visitor tracking.
// Kept in its own file because the page's Content-Security-Policy blocks inline scripts.
function initApollo() {
  var n = Math.random().toString(36).substring(7),
    o = document.createElement('script');
  o.src = 'https://assets.apollo.io/micro/website-tracker/tracker.iife.js?nocache=' + n;
  o.async = !0;
  o.defer = !0;
  o.onload = function () {
    window.trackingFunctions.onLoad({ appId: '6ae897b8df99e2001804b564' });
  };
  document.head.appendChild(o);
}
initApollo();
