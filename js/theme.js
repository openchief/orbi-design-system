/* Theme switcher — light / dark / system. Load in <head> so the theme is set before first paint.
   Markup hooks:  [data-theme-toggle]                       a button that flips light <-> dark
                  [data-theme-switcher] > [data-theme-value="light|dark|system"]   a segmented choice
   API: OrbiTheme.get() -> "light" | "dark" | "system" (the saved preference), OrbiTheme.set(pref)
   Emits "themechange" on document with detail { preference, theme }. */
(function () {
  "use strict";
  var KEY = "orbi-theme", root = document.documentElement;
  var media = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;

  function read() {
    try { var v = localStorage.getItem(KEY); if (v === "light" || v === "dark" || v === "system") return v; } catch (e) {}
    return "system";
  }
  function resolve(pref) { return pref === "system" ? (media && media.matches ? "dark" : "light") : pref; }

  function apply(pref, persist) {
    var theme = resolve(pref);
    root.setAttribute("data-theme", theme);
    root.setAttribute("data-theme-pref", pref);
    if (persist) { try { localStorage.setItem(KEY, pref); } catch (e) {} }
    sync();
    document.dispatchEvent(new CustomEvent("themechange", { detail: { preference: pref, theme: theme } }));
  }

  /* keep every control in step with the current theme */
  function sync() {
    var pref = root.getAttribute("data-theme-pref"), theme = root.getAttribute("data-theme");
    Array.prototype.forEach.call(document.querySelectorAll("[data-theme-value]"), function (b) {
      var on = b.getAttribute("data-theme-value") === pref;
      b.classList.toggle("active", on); b.setAttribute("aria-pressed", on);
    });
    Array.prototype.forEach.call(document.querySelectorAll("[data-theme-toggle]"), function (b) {
      b.setAttribute("aria-label", theme === "dark" ? "Switch to light theme" : "Switch to dark theme");
    });
  }

  apply(read(), false);
  if (media) {
    var follow = function () { if (root.getAttribute("data-theme-pref") === "system") apply("system", false); };
    if (media.addEventListener) media.addEventListener("change", follow); else if (media.addListener) media.addListener(follow);
  }
  document.addEventListener("click", function (e) {
    var t = e.target.closest ? e.target.closest("[data-theme-toggle]") : null;
    if (t) return apply(root.getAttribute("data-theme") === "dark" ? "light" : "dark", true);
    var v = e.target.closest ? e.target.closest("[data-theme-value]") : null;
    if (v) apply(v.getAttribute("data-theme-value"), true);
  });
  document.addEventListener("DOMContentLoaded", sync);
  window.OrbiTheme = { get: function () { return root.getAttribute("data-theme-pref"); }, set: function (p) { apply(p, true); } };
})();
