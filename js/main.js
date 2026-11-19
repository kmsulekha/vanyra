// Change this to your WhatsApp number: country code + number, no + or spaces
var WHATSAPP_NUMBER = "91XXXXXXXXXX";

document.documentElement.classList.add("js");

(function () {
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Footer year
  var y = document.getElementById("y");
  if (y) y.textContent = new Date().getFullYear();

  // WhatsApp enquiry forms
  document.querySelectorAll("form.wa").forEach(function (f) {
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      var m = "Vanyra – " + f.getAttribute("data-kind") + "\n";
      f.querySelectorAll("input,select,textarea").forEach(function (el) {
        if (el.value) m += el.name + ": " + el.value + "\n";
      });
      window.open("https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(m), "_blank", "noopener");
    });
  });

  // Header: transparent over the home hero, solid after scrolling
  var header = document.querySelector(".site-header");
  function onScroll() {
    if (header) header.classList.toggle("is-stuck", window.scrollY > 40);
  }
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  // Mobile menu
  var btn = document.querySelector(".menu-btn");
  var nav = document.getElementById("site-nav");
  function setMenu(open) {
    nav.classList.toggle("open", open);
    header.classList.toggle("menu-open", open);
    btn.setAttribute("aria-expanded", open ? "true" : "false");
    document.body.style.overflow = open ? "hidden" : "";
  }
  if (btn && nav && header) {
    btn.addEventListener("click", function () { setMenu(!nav.classList.contains("open")); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") setMenu(false); });
    nav.addEventListener("click", function (e) { if (e.target.closest("a")) setMenu(false); });
    window.matchMedia("(min-width: 921px)").addEventListener("change", function () { setMenu(false); });
  }

  // Hero background video: fades in over the photo once it is playing.
  // If videos/hero.mp4 is missing, the photo simply stays.
  var hv = document.querySelector(".hero-video");
  if (hv && !reduceMotion) {
    hv.addEventListener("playing", function () { hv.classList.add("is-on"); });
    var p = hv.play();
    if (p && p.catch) p.catch(function () {});
  }

  // Video players with a poster and play button.
  // If the .mp4 file is missing the button is hidden and the poster stays.
  document.querySelectorAll("[data-video]").forEach(function (frame) {
    var v = frame.querySelector("video");
    var b = frame.querySelector(".play");
    var s = v.querySelector("source");
    function markMissing() { frame.classList.add("is-missing"); }
    function check() { if (v.networkState === 3) markMissing(); } // 3 = no usable source
    if (s) s.addEventListener("error", markMissing);
    // Backup in case the error fired before this script ran
    window.addEventListener("load", function () { setTimeout(check, 300); });
    if (document.readyState === "complete") setTimeout(check, 300);
    if (b) b.addEventListener("click", function () {
      frame.classList.add("is-playing");
      v.controls = true;
      v.play();
    });
  });

  // Gallery lightbox (without JavaScript, tiles just open the image)
  var tiles = Array.prototype.slice.call(document.querySelectorAll("a.tile"));
  if (tiles.length && typeof HTMLDialogElement === "function") {
    var dlg = document.createElement("dialog");
    dlg.className = "lightbox";
    dlg.setAttribute("aria-label", "Image viewer");
    dlg.innerHTML =
      '<figure class="lb-fig"><img alt=""><figcaption></figcaption></figure>' +
      '<button class="lb-btn lb-close" type="button" aria-label="Close"><svg viewBox="0 0 24 24"><path d="M5 5l14 14M19 5L5 19"/></svg></button>' +
      '<button class="lb-btn lb-prev" type="button" aria-label="Previous image"><svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg></button>' +
      '<button class="lb-btn lb-next" type="button" aria-label="Next image"><svg viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg></button>';
    document.body.appendChild(dlg);
    var img = dlg.querySelector("img");
    var cap = dlg.querySelector("figcaption");
    var idx = 0;
    function show(i) {
      idx = (i + tiles.length) % tiles.length;
      img.src = tiles[idx].getAttribute("href");
      img.alt = tiles[idx].querySelector("img").alt;
      cap.textContent = img.alt;
    }
    tiles.forEach(function (t, i) {
      t.addEventListener("click", function (e) { e.preventDefault(); show(i); dlg.showModal(); });
    });
    dlg.querySelector(".lb-close").addEventListener("click", function () { dlg.close(); });
    dlg.querySelector(".lb-prev").addEventListener("click", function () { show(idx - 1); });
    dlg.querySelector(".lb-next").addEventListener("click", function () { show(idx + 1); });
    dlg.addEventListener("click", function (e) { if (e.target === dlg) dlg.close(); });
    dlg.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") show(idx - 1);
      if (e.key === "ArrowRight") show(idx + 1);
    });
  }
})();
