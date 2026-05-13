(function () {
  if (typeof Lenis === 'undefined') return;
  var lenis = new Lenis({ autoRaf: true });
  window.__lenis = lenis;
})();
