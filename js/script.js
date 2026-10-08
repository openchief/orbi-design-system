/* Design System — tiny dependency-free behaviours. Everything is opt-in through
   class names / data-attributes so the CSS remains usable without this file. */
(function () {
  "use strict";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = function (s) { return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); };

  /* ---- 0. "View code" panels for documentation demos (captured first) ---- */
  function dedent(html) {
    var lines = html.replace(/^\n+|\s+$/g, "").split("\n");
    var min = Infinity;
    lines.forEach(function (l) { if (l.trim()) min = Math.min(min, l.match(/^\s*/)[0].length); });
    if (!isFinite(min)) min = 0;
    return lines.map(function (l) { return l.slice(min); }).join("\n");
  }
  /* Which behaviours (code-samples.js, built from this file) a demo uses */
  var JS_TRIGGERS = [
    ["1", "[data-trigger], .dropdown, .menu-item"], ["2", "[data-modal-open]"], ["3", "[data-tabs], .switcher"],
    ["4", ".notification-close, [data-toast]"], ["5", ".number-input"], ["6", ".slider"], ["7", ".search"],
    ["8", "input[data-indeterminate]"], ["9", "[data-table]"], ["10", "[data-datepicker]"], ["11", "[data-uploader]"],
    ["12", ".code-copy, .code-more"], ["13", ".tree"],
    ["14", ".tile-toggle, .tile--expandable, [data-toggle-class], [data-toggle-hidden], [data-nav-active], [data-select-one], [data-accordion-single]"],
    ["15", "[data-pagination]"], ["16", "[data-progress-demo], [data-inline-loading], [data-steps]"],
    ["17", "form[data-validate]"], ["theme", "[data-theme-toggle], [data-theme-switcher]"], [["18a", "18b"], "[data-kanban]"], [["18a", "18c"], "[data-planning]"], ["calendar", "[data-calendar]"]
  ];
  function codeBlock(text, lang) {
    return '<div class="code-block" data-lang="' + lang + '"><button class="code-copy" type="button" aria-label="Copy code"><i class="ph-copy-bold"></i></button><pre><code>' + esc(text) + "</code></pre></div>";
  }
  $$(".doc-demo:not([data-nocode])").forEach(function (demo) {
    var source = dedent(demo.innerHTML);
    var samples = window.ORBI_CODE_JS || {};
    var js = [];
    JS_TRIGGERS.forEach(function (t) {
      if (!$(t[1], demo)) return;
      [].concat(t[0]).forEach(function (k) { if (samples[k] && js.indexOf(samples[k]) < 0) js.push(samples[k]); });
    });
    var btn = document.createElement("button");
    btn.type = "button"; btn.className = "doc-code-toggle";
    btn.innerHTML = '<i class="ph-code-bold"></i><span>View code</span>';
    var panel = document.createElement("div");
    panel.className = "doc-code-panel"; panel.hidden = true;
    if (js.length) {
      panel.innerHTML = '<div class="doc-code-tabs" role="tablist"><button type="button" class="active" role="tab" data-code-tab="html">HTML</button><button type="button" role="tab" data-code-tab="js">JavaScript</button></div>' +
        '<div data-code-pane="html">' + codeBlock(source, "html") + '</div><div data-code-pane="js" hidden>' + codeBlock(js.join("\n\n"), "js") + "</div>";
      $$("[data-code-tab]", panel).forEach(function (tab) {
        tab.addEventListener("click", function () {
          $$("[data-code-tab]", panel).forEach(function (t) { t.classList.toggle("active", t === tab); });
          $$("[data-code-pane]", panel).forEach(function (p) { p.hidden = p.dataset.codePane !== tab.dataset.codeTab; });
        });
      });
    } else panel.innerHTML = codeBlock(source, "html");
    demo.after(btn, panel);
    btn.addEventListener("click", function () {
      panel.hidden = !panel.hidden;
      btn.querySelector("span").textContent = panel.hidden ? "View code" : "Hide code";
    });
  });

  /* ---- 1. Open/close wrappers: popover, toggletip, menu, dropdown ---- */
  var WRAPS = ".popover-wrap, .menu-wrap, .dropdown";
  function closeAll(except) {
    $$(WRAPS + ".is-open").forEach(function (w) {
      if (w !== except && !(except && w.contains(except))) {
        w.classList.remove("is-open");
        var t = $("[aria-expanded]", w); if (t) t.setAttribute("aria-expanded", "false");
      }
    });
  }
  document.addEventListener("click", function (e) {
    var trigger = e.target.closest("[data-trigger]");
    if (trigger) {
      var wrap = trigger.closest(WRAPS);
      var open = !wrap.classList.contains("is-open");
      closeAll(open ? wrap : null);
      wrap.classList.toggle("is-open", open);
      trigger.setAttribute("aria-expanded", open);
      return;
    }
    var option = e.target.closest(".dropdown-option");
    if (option) {
      var dd = option.closest(".dropdown");
      if (option.getAttribute("aria-disabled") === "true") return;
      var multi = dd.hasAttribute("data-multi");
      if (multi) {
        option.setAttribute("aria-selected", option.getAttribute("aria-selected") !== "true");
        var chosen = $$('.dropdown-option[aria-selected="true"]', dd).map(function (o) { return o.textContent.trim(); });
        $(".dropdown-value", dd).innerHTML = chosen.length ? esc(chosen.join(", ")) : '<span class="placeholder">' + esc(dd.dataset.placeholder || "Select") + "</span>";
      } else {
        $$(".dropdown-option", dd).forEach(function (o) { o.setAttribute("aria-selected", o === option); });
        $(".dropdown-value", dd).textContent = option.textContent.trim();
        dd.classList.remove("is-open");
      }
      return;
    }
    var item = e.target.closest(".menu-item");
    if (item) {
      var role = item.getAttribute("role");
      if (role === "menuitemcheckbox") item.setAttribute("aria-checked", item.getAttribute("aria-checked") !== "true");
      if (role === "menuitemradio") {
        $$('[role="menuitemradio"]', item.parentNode).forEach(function (r) { r.setAttribute("aria-checked", r === item); });
        return;
      }
      if (role !== "menuitemcheckbox" && !item.classList.contains("has-sub")) closeAll();
      return;
    }
    if (!e.target.closest(WRAPS)) closeAll();
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      closeAll();
      $$(".overlay.is-open").forEach(function (o) { o.classList.remove("is-open"); });
    }
  });
  /* dropdown filter */
  document.addEventListener("input", function (e) {
    if (!e.target.matches(".dropdown-search input")) return;
    var q = e.target.value.toLowerCase();
    $$(".dropdown-option", e.target.closest(".dropdown")).forEach(function (o) { o.hidden = o.textContent.toLowerCase().indexOf(q) < 0; });
  });

  /* ---- 2. Modal ---- */
  document.addEventListener("click", function (e) {
    var open = e.target.closest("[data-modal-open]");
    if (open) { var m = document.getElementById(open.dataset.modalOpen); if (m) { m.classList.add("is-open"); var f = $("input, button.button--primary, button", m); f && f.focus(); } return; }
    if (e.target.closest("[data-modal-close]") || e.target.classList.contains("overlay")) {
      var o = e.target.closest(".overlay"); if (o) o.classList.remove("is-open");
    }
  });

  /* ---- 3. Tabs & content switcher ---- */
  $$("[data-tabs]").forEach(function (root) {
    var tabs = $$("[data-tab]", root);
    tabs.forEach(function (tab) {
      tab.addEventListener("click", function (e) {
        e.preventDefault();
        tabs.forEach(function (t) { t.classList.toggle("active", t === tab); t.setAttribute("aria-selected", t === tab); });
        $$("[data-panel]", root).forEach(function (p) { p.hidden = p.dataset.panel !== tab.dataset.tab; });
      });
    });
  });
  $$(".switcher").forEach(function (sw) {
    var btns = $$("button", sw);
    btns.forEach(function (b) {
      b.addEventListener("click", function () {
        btns.forEach(function (x) { x.classList.toggle("active", x === b); x.setAttribute("aria-selected", x === b); });
        if (sw.dataset.target) $$("[data-switch-panel]", $(sw.dataset.target)).forEach(function (p) { p.hidden = p.dataset.switchPanel !== b.dataset.value; });
      });
    });
  });

  /* ---- 4. Notifications ---- */
  var ICONS = { info: "ph-info-bold", success: "ph-check-circle-bold", warning: "ph-warning-bold", error: "ph-warning-circle-bold" };
  document.addEventListener("click", function (e) {
    var close = e.target.closest(".notification-close");
    if (close) { close.closest(".notification").remove(); return; }
    var t = e.target.closest("[data-toast]");
    if (t) {
      var kind = t.dataset.toast, region = $(".toast-region");
      if (!region) { region = document.createElement("div"); region.className = "toast-region"; region.setAttribute("aria-live", "polite"); document.body.appendChild(region); }
      var n = document.createElement("div");
      n.className = "notification notification--" + kind; n.setAttribute("role", "status");
      n.innerHTML = '<i class="' + ICONS[kind] + '"></i><div class="notification-content"><div class="notification-title">' + esc(t.dataset.title || kind) + '</div><div class="notification-text">' + esc(t.dataset.text || "") + '</div></div><button class="notification-close" aria-label="Dismiss"><i class="ph-x-bold"></i></button>';
      region.appendChild(n);
      setTimeout(function () { n.remove(); }, 5000);
    }
  });

  /* ---- 5. Number input ---- */
  $$(".number-input").forEach(function (box) {
    var input = $("input", box), dec = $('[data-step="-1"]', box), inc = $('[data-step="1"]', box);
    var min = input.min !== "" ? +input.min : -Infinity, max = input.max !== "" ? +input.max : Infinity, step = +(input.step || 1);
    function sync() { var v = +input.value; dec.disabled = v <= min; inc.disabled = v >= max; }
    [dec, inc].forEach(function (b) {
      b.addEventListener("click", function () {
        var v = (+input.value || 0) + step * +b.dataset.step;
        input.value = Math.min(max, Math.max(min, +v.toFixed(10))); sync();
        input.dispatchEvent(new Event("change", { bubbles: true }));
      });
    });
    input.addEventListener("input", sync); sync();
  });

  /* ---- 6. Slider ---- */
  $$(".slider").forEach(function (s) {
    var r = $('input[type="range"]', s), out = $(".slider-value", s);
    function sync() { r.style.setProperty("--pct", ((r.value - r.min) / (r.max - r.min)) * 100 + "%"); if (out) out.textContent = r.value + (r.dataset.unit || ""); }
    r.addEventListener("input", sync); sync();
  });

  /* ---- 7. Search clear ---- */
  $$(".search").forEach(function (s) {
    var i = $("input", s), c = $(".search-clear", s);
    if (!c) return;
    i.addEventListener("input", function () { s.classList.toggle("has-value", !!i.value); });
    c.addEventListener("click", function () { i.value = ""; s.classList.remove("has-value"); i.focus(); i.dispatchEvent(new Event("input", { bubbles: true })); });
  });

  /* ---- 8. Indeterminate checkboxes ---- */
  $$("input[data-indeterminate]").forEach(function (c) { c.indeterminate = true; });

  /* ---- 9. Data table: sort, select ---- */
  $$("[data-table]").forEach(function (wrap) {
    var table = $("table", wrap), body = $("tbody", table);
    var all = $("thead .cell-select input", table), toolbar = $(".table-toolbar", wrap), batch = $(".table-batch", wrap);
    var count = $("[data-count]", wrap);
    function rows() { return $$("tr", body); }
    function updateSel() {
      var checks = $$(".cell-select input", body), n = checks.filter(function (c) { return c.checked; }).length;
      checks.forEach(function (c) { c.closest("tr").classList.toggle("is-selected", c.checked); });
      if (all) { all.checked = n && n === checks.length; all.indeterminate = n > 0 && n < checks.length; }
      if (batch) { batch.hidden = !n; if (toolbar) toolbar.hidden = !!n; if (count) count.textContent = n + " selected"; }
    }
    if (all) all.addEventListener("change", function () { $$(".cell-select input", body).forEach(function (c) { c.checked = all.checked; }); updateSel(); });
    body.addEventListener("change", function (e) { if (e.target.closest(".cell-select")) updateSel(); });
    $$("th.sortable", table).forEach(function (th) {
      th.addEventListener("click", function () {
        var idx = th.cellIndex, dir = th.getAttribute("aria-sort") === "ascending" ? "descending" : "ascending";
        $$("th", table).forEach(function (h) { h.removeAttribute("aria-sort"); });
        th.setAttribute("aria-sort", dir);
        var num = th.classList.contains("num");
        rows().sort(function (a, b) {
          var x = a.cells[idx].textContent.trim(), y = b.cells[idx].textContent.trim();
          if (num) { x = parseFloat(x.replace(/[^0-9.-]/g, "")); y = parseFloat(y.replace(/[^0-9.-]/g, "")); return dir === "ascending" ? x - y : y - x; }
          return dir === "ascending" ? x.localeCompare(y) : y.localeCompare(x);
        }).forEach(function (r) { body.appendChild(r); });
      });
    });
    var filter = $("[data-table-filter]", wrap);
    if (filter) filter.addEventListener("input", function () {
      var q = filter.value.toLowerCase(), shown = 0;
      rows().forEach(function (r) { var m = r.textContent.toLowerCase().indexOf(q) > -1; r.hidden = !m; if (m) shown++; });
      var empty = $(".data-table-empty", wrap); if (empty) empty.hidden = shown > 0;
    });
    var clear = $("[data-batch-clear]", wrap);
    if (clear) clear.addEventListener("click", function () { $$(".cell-select input", wrap).forEach(function (c) { c.checked = false; }); updateSel(); });
    updateSel();
  });

  /* ---- 10. Date picker ---- */
  var MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  $$("[data-datepicker]").forEach(function (dp) {
    var input = $("input", dp), range = dp.hasAttribute("data-range"), cal = null;
    var view = new Date(); view.setDate(1);
    var start = null, end = null;
    var fmt = function (d) { return ("0" + (d.getMonth() + 1)).slice(-2) + "/" + ("0" + d.getDate()).slice(-2) + "/" + d.getFullYear(); };
    var same = function (a, b) { return a && b && a.toDateString() === b.toDateString(); };
    function render() {
      var first = new Date(view.getFullYear(), view.getMonth(), 1), pad = first.getDay();
      var h = '<div class="calendar-head"><button type="button" class="icon-button icon-button--sm" data-nav="-1" aria-label="Previous month"><i class="ph-caret-left-bold"></i></button><span>' + MONTHS[view.getMonth()] + " " + view.getFullYear() + '</span><button type="button" class="icon-button icon-button--sm" data-nav="1" aria-label="Next month"><i class="ph-caret-right-bold"></i></button></div><div class="calendar-grid">';
      "SMTWTFS".split("").forEach(function (d) { h += '<span class="dow">' + d + "</span>"; });
      for (var i = 0; i < 42; i++) {
        var d = new Date(view.getFullYear(), view.getMonth(), 1 - pad + i), cls = [];
        if (d.getMonth() !== view.getMonth()) cls.push("is-muted");
        if (same(d, new Date())) cls.push("is-today");
        if (range) {
          if (same(d, start)) cls.push("is-range-start"); else if (same(d, end)) cls.push("is-range-end");
          else if (start && end && d > start && d < end) cls.push("is-range");
        } else if (same(d, start)) cls.push("is-selected");
        h += '<button type="button" class="' + cls.join(" ") + '" data-ts="' + d.getTime() + '">' + d.getDate() + "</button>";
      }
      cal.innerHTML = h + "</div>";
    }
    function open() { if (!cal) { cal = document.createElement("div"); cal.className = "calendar"; dp.appendChild(cal); render(); } else cal.hidden = false; }
    input.addEventListener("focus", open);
    $(".input-wrap > i", dp) && $(".input-wrap > i", dp).addEventListener("click", function () { input.focus(); });
    dp.addEventListener("click", function (e) {
      var nav = e.target.closest("[data-nav]"), day = e.target.closest("[data-ts]");
      if (nav) { view.setMonth(view.getMonth() + +nav.dataset.nav); render(); }
      if (day) {
        var d = new Date(+day.dataset.ts);
        if (range) {
          if (!start || end) { start = d; end = null; input.value = fmt(d) + " – "; }
          else { if (d < start) { end = start; start = d; } else end = d; input.value = fmt(start) + " – " + fmt(end); cal.hidden = true; }
        } else { start = d; input.value = fmt(d); cal.hidden = true; }
        if (d.getMonth() !== view.getMonth()) view = new Date(d.getFullYear(), d.getMonth(), 1);
        render();
      }
    });
    document.addEventListener("click", function (e) { if (cal && !dp.contains(e.target)) cal.hidden = true; });
  });

  /* ---- 11. File uploader ---- */
  $$("[data-uploader]").forEach(function (root) {
    var drop = $(".file-drop", root), input = $("input", drop), list = $(".file-list", root);
    var max = +(root.dataset.maxMb || 5) * 1024 * 1024;
    var size = function (b) { return b > 1048576 ? (b / 1048576).toFixed(1) + " MB" : Math.max(1, Math.round(b / 1024)) + " KB"; };
    function add(files) {
      Array.prototype.forEach.call(files, function (f) {
        var bad = f.size > max, el = document.createElement("div");
        el.className = "file-item" + (bad ? " is-error" : "");
        el.innerHTML = '<i class="ph-file-bold"></i><div class="file-meta"><div class="file-name">' + esc(f.name) + '</div><div class="file-size">' + (bad ? '<span style="color:var(--c-danger)">Exceeds ' + root.dataset.maxMb + " MB limit</span>" : size(f.size)) + "</div>" + (bad ? "" : '<div class="progress progress--sm"><div class="progress-bar" style="--value:0%"></div></div>') + '</div><button type="button" class="icon-button icon-button--sm" aria-label="Remove file"><i class="ph-x-bold"></i></button>';
        list.appendChild(el);
        $("button", el).addEventListener("click", function () { el.remove(); });
        var bar = $(".progress-bar", el), p = 0;
        if (bar) { var t = setInterval(function () { p = Math.min(100, p + 12 + Math.random() * 18); bar.style.setProperty("--value", p + "%"); if (p >= 100) { clearInterval(t); $(".file-size", el).insertAdjacentHTML("beforeend", ' · <span style="color:var(--c-success)">Uploaded</span>'); $(".progress", el).remove(); } }, 200); }
      });
    }
    drop.addEventListener("click", function () { input.click(); });
    input.addEventListener("change", function () { add(input.files); input.value = ""; });
    ["dragenter", "dragover"].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.add("is-dragover"); }); });
    ["dragleave", "drop"].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.remove("is-dragover"); }); });
    drop.addEventListener("drop", function (e) { add(e.dataTransfer.files); });
  });

  /* ---- 12. Code snippet: copy / expand ---- */
  document.addEventListener("click", function (e) {
    var copy = e.target.closest(".code-copy");
    if (copy) {
      var text = $("pre", copy.closest(".code-block")).textContent;
      (navigator.clipboard ? navigator.clipboard.writeText(text) : Promise.reject()).catch(function () {
        var ta = document.createElement("textarea"); ta.value = text; document.body.appendChild(ta); ta.select(); try { document.execCommand("copy"); } catch (_) {} ta.remove();
      });
      copy.classList.add("is-copied"); var ic = $("i", copy), old = ic.className; ic.className = "ph-check-bold";
      setTimeout(function () { copy.classList.remove("is-copied"); ic.className = old; }, 1500);
      return;
    }
    var more = e.target.closest(".code-more");
    if (more) { var cb = more.closest(".code-block"); cb.classList.toggle("is-expanded"); $("span", more).textContent = cb.classList.contains("is-expanded") ? "Show less" : "Show more"; }
  });

  /* ---- 13. Tree view ---- */
  $$(".tree").forEach(function (tree) {
    tree.addEventListener("click", function (e) {
      var node = e.target.closest(".tree-node"); if (!node) return;
      var li = node.parentNode;
      if (li.hasAttribute("aria-expanded")) li.setAttribute("aria-expanded", li.getAttribute("aria-expanded") !== "true");
      $$(".tree-node.is-selected", tree).forEach(function (n) { n.classList.remove("is-selected"); });
      node.classList.add("is-selected");
    });
  });
  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-tree-all]"); if (!b) return;
    var open = b.dataset.treeAll === "expand";
    $$("li[aria-expanded]", $(b.dataset.tree)).forEach(function (li) { li.setAttribute("aria-expanded", open); });
  });

  /* ---- 14. Generic toggles: expandable tiles, shell panels ---- */
  document.addEventListener("click", function (e) {
    var tile = e.target.closest(".tile-toggle");
    if (tile) { tile.closest(".tile--expandable").classList.toggle("is-open"); return; }
    var t = e.target.closest("[data-toggle-class]");
    if (t) { e.preventDefault(); var target = $(t.dataset.toggleTarget); target && target.classList.toggle(t.dataset.toggleClass); }
    var h = e.target.closest("[data-toggle-hidden]");
    if (h) { e.preventDefault(); var el = $(h.dataset.toggleHidden); el && (el.hidden = !el.hidden); }
    var nav = e.target.closest("[data-nav-active]");
    if (nav) { e.preventDefault(); $$("a", nav.parentNode).forEach(function (a) { a.classList.toggle("active", a === nav); }); }
    var sel = e.target.closest("[data-select-one]");
    if (sel) { $$("[data-select-one]", sel.parentNode).forEach(function (s) { s.classList.toggle("is-selected", s === sel); }); }
  });
  /* accordion: optional single-open mode */
  $$("[data-accordion-single]").forEach(function (acc) {
    acc.addEventListener("toggle", function (e) {
      if (!e.target.open) return;
      $$("details.accordion-item", acc).forEach(function (d) { if (d !== e.target) d.open = false; });
    }, true);
  });

  /* ---- 15. Pagination ---- */
  $$("[data-pagination]").forEach(function (root) {
    var total = +root.dataset.total, page = 1, pages = $(".pagination-pages", root), label = $("[data-range-label]", root);
    var size = +(root.dataset.size || 10);
    function render() {
      var n = Math.ceil(total / size), h = "";
      var btn = function (p, txt, extra) { return '<button type="button" data-page="' + p + '"' + (p === page && !extra ? ' class="active" aria-current="page"' : "") + (extra || "") + ">" + txt + "</button>"; };
      h += btn(page - 1, '<i class="ph-caret-left-bold"></i>', page === 1 ? " disabled aria-label=\"Previous\"" : " aria-label=\"Previous\"");
      var list = [];
      for (var i = 1; i <= n; i++) if (i === 1 || i === n || Math.abs(i - page) <= 1) list.push(i); else if (list[list.length - 1] !== "…") list.push("…");
      list.forEach(function (p) { h += p === "…" ? '<span class="ellipsis">…</span>' : btn(p, p); });
      h += btn(page + 1, '<i class="ph-caret-right-bold"></i>', page === n ? " disabled aria-label=\"Next\"" : " aria-label=\"Next\"");
      pages.innerHTML = h;
      if (label) label.textContent = ((page - 1) * size + 1) + "–" + Math.min(total, page * size) + " of " + total + " items";
    }
    pages.addEventListener("click", function (e) { var b = e.target.closest("[data-page]"); if (b && !b.disabled) { page = +b.dataset.page; render(); } });
    var sz = $("select", root); if (sz) sz.addEventListener("change", function () { size = +sz.value; page = 1; render(); });
    render();
  });

  /* ---- 16. Progress demo, inline loading demo, steps ---- */
  $$("[data-progress-demo]").forEach(function (btn) {
    var bar = $(btn.dataset.progressDemo + " .progress-bar"), lab = $(btn.dataset.progressDemo + " [data-pct]"), t;
    btn.addEventListener("click", function () {
      clearInterval(t); var v = 0;
      t = setInterval(function () { v = Math.min(100, v + 4 + Math.random() * 6); bar.style.setProperty("--value", v + "%"); if (lab) lab.textContent = Math.round(v) + "%"; if (v >= 100) clearInterval(t); }, 150);
    });
  });
  $$("[data-inline-loading]").forEach(function (btn) {
    var box = $(btn.dataset.inlineLoading), txt = $(".il-text", box), spin = $(".spinner", box);
    btn.addEventListener("click", function () {
      box.className = "inline-loading"; txt.textContent = "Saving…"; spin.hidden = false;
      setTimeout(function () {
        spin.hidden = true;
        var fail = btn.dataset.fail === "true";
        box.classList.add(fail ? "is-error" : "is-success"); txt.textContent = fail ? "Save failed" : "Saved";
      }, 1600);
    });
  });
  $$("[data-steps]").forEach(function (root) {
    var steps = $$(".step", root.parentNode.querySelector(root.dataset.steps)), cur = steps.findIndex(function (s) { return s.classList.contains("is-current"); });
    function paint() {
      steps.forEach(function (s, i) {
        s.classList.toggle("is-complete", i < cur); s.classList.toggle("is-current", i === cur);
        var m = $(".step-marker", s); if (m) m.textContent = i < cur ? "✓" : i + 1;
      });
    }
    root.addEventListener("click", function (e) {
      var b = e.target.closest("[data-step-nav]"); if (!b) return;
      cur = Math.max(0, Math.min(steps.length - 1, cur + (b.dataset.stepNav === "next" ? 1 : -1))); paint();
    });
    paint();
  });

  /* ---- 17. Form validation demo ---- */
  $$("form[data-validate]").forEach(function (form) {
    form.noValidate = true;
    form.addEventListener("submit", function (e) {
      e.preventDefault(); var ok = true;
      $$(".field", form).forEach(function (f) {
        var c = $("input, select, textarea", f); if (!c) return;
        var bad = !c.checkValidity();
        f.classList.toggle("is-invalid", bad); f.classList.toggle("is-valid", !bad && c.matches(".input"));
        if (bad) { ok = false; var err = $(".field-error span", f); if (err) err.textContent = c.validationMessage; }
      });
      var res = $("[data-form-result]", form); if (res) res.hidden = !ok;
    });
  });
  /* ---- 18a. Board helpers: floating pickers, inline edit, confirm-delete ----
     <div data-kanban data-people='["Alex Morgan"]'>    click a card to edit it; drag (or ←/→) to move; column ⋯ menu renames, recolours, deletes
     <div data-planning data-start="2026-10-05" data-people='[...]'>   click any name, owner, status, priority, timeline, group or header to edit it;
                                                        ▸ opens subitems; + adds one; trash deletes (click twice to confirm)
     Both emit "board:change" on the board element. */
  var B_COLORS = ["#a1a6bd", "#fdab3d", "#579bfc", "#00b87a", "#a25ddc", "#df2f4a"];
  var B_TONES = ["blue", "yellow", "green", "red"];
  var B_STATUS = [["not-started", "Not started"], ["working", "Working on it"], ["stuck", "Stuck"], ["done", "Done"]];
  var B_PRIORITY = [["low", "Low"], ["medium", "Medium"], ["high", "High"], ["critical", "Critical"]];
  var B_MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  var qa = function (s) { return esc(String(s)).replace(/"/g, "&quot;"); };
  var bDate = function (iso) { var p = iso.split("-"); return new Date(+p[0], p[1] - 1, +p[2]); };
  var bDay = function (iso) { var d = bDate(iso); return B_MON[d.getMonth()] + " " + d.getDate(); };
  var initialsOf = function (n) { var p = n.trim().split(/\s+/); return ((p[0] || "")[0] + (p.length > 1 ? p[p.length - 1][0] : "")).toUpperCase() || "?"; };
  var avatarOf = function (n) {
    return n ? '<span class="avatar" title="' + qa(n) + '">' + esc(initialsOf(n)) + "</span>" : '<span class="avatar avatar--empty" title="Unassigned"><i class="ph-user-plus-bold"></i></span>';
  };
  var rangeLabel = function (a, b) {
    var x = bDate(a), y = bDate(b);
    if (a === b) return bDay(a);
    return bDay(a) + " – " + (x.getMonth() === y.getMonth() ? y.getDate() : bDay(b));
  };
  function peopleOf(board) { try { return JSON.parse(board.dataset.people || "[]"); } catch (e) { return []; } }

  /* one floating panel shared by every board: pickers, menus */
  var floatPop = null, floatAnchor = null;
  function closeFloat() { if (floatPop) { floatPop.remove(); floatPop = null; floatAnchor = null; } }
  function openFloat(anchor, html) {
    if (floatAnchor === anchor) { closeFloat(); return null; }
    closeFloat();
    floatPop = document.createElement("div"); floatPop.className = "pop-float"; floatPop.innerHTML = html;
    document.body.appendChild(floatPop); floatAnchor = anchor;
    var r = anchor.getBoundingClientRect(), w = floatPop.offsetWidth, h = floatPop.offsetHeight;
    var top = r.bottom + 4; if (top + h > window.innerHeight - 8) top = Math.max(8, r.top - h - 4);
    floatPop.style.left = Math.min(Math.max(8, r.left), window.innerWidth - w - 8) + "px"; floatPop.style.top = top + "px";
    return floatPop;
  }
  document.addEventListener("click", function (e) { if (floatPop && !floatPop.contains(e.target) && !(floatAnchor && floatAnchor.contains(e.target))) closeFloat(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeFloat(); });
  window.addEventListener("resize", closeFloat);
  document.addEventListener("scroll", function (e) { if (floatPop && !floatPop.contains(e.target)) closeFloat(); }, true);

  function swatchHtml(current) {
    return '<div class="pop-label">Colour</div><div class="pop-swatches">' + B_COLORS.map(function (c) {
      return '<button type="button" data-color="' + c + '" style="--sw:' + c + '" aria-label="' + c + '"' + (c === current ? ' class="is-on"' : "") + "></button>";
    }).join("") + "</div>";
  }
  function ownerHtml(people, current) {
    return '<div class="pop-list">' + people.map(function (n) {
      return '<button type="button" data-owner="' + qa(n) + '"' + (n === current ? ' class="is-on"' : "") + ">" + avatarOf(n) + "<span>" + esc(n) + "</span></button>";
    }).join("") + '<button type="button" data-owner="">' + avatarOf("") + "<span>Unassigned</span></button></div>" +
      '<div class="pop-add"><input class="input input--sm" placeholder="Add person, then Enter" aria-label="Add person"></div>';
  }
  function bindOwner(pop, board, current, pick) {
    pop.addEventListener("click", function (e) { var b = e.target.closest("[data-owner]"); if (b) { closeFloat(); pick(b.dataset.owner); } });
    $("input", pop).addEventListener("keydown", function (e) {
      if (e.key !== "Enter") return; var n = e.target.value.trim(); if (!n) return;
      var list = peopleOf(board); if (list.indexOf(n) < 0) { list.push(n); board.dataset.people = JSON.stringify(list); }
      closeFloat(); pick(n);
    });
  }
  /* click-to-edit text: swaps el for an input; Enter / blur saves, Esc cancels */
  function inlineEdit(el, save) {
    var old = el.textContent, input = document.createElement("input"), done = false;
    input.className = "input input--sm inline-edit"; input.value = old; input.setAttribute("aria-label", "Edit text");
    el.hidden = true; el.after(input); input.focus(); input.select();
    function end(commit) {
      if (done) return; done = true;
      var v = input.value.trim(); input.remove(); el.hidden = false;
      if (commit && v && v !== old) { el.textContent = v; save(v); }
    }
    input.addEventListener("keydown", function (e) { if (e.key === "Enter") end(true); else if (e.key === "Escape") end(false); });
    input.addEventListener("blur", function () { end(true); });
    input.addEventListener("click", function (e) { e.stopPropagation(); });
  }
  /* inline "add" field that replaces a button until submitted */
  function inlineAdd(btn, placeholder, create) {
    var input = document.createElement("input"), done = false;
    input.className = "input input--sm inline-edit"; input.placeholder = placeholder; input.setAttribute("aria-label", placeholder);
    btn.hidden = true; btn.after(input); input.focus();
    function end(commit) { if (done) return; done = true; var v = input.value.trim(); input.remove(); btn.hidden = false; if (commit && v) create(v); }
    input.addEventListener("keydown", function (e) { if (e.key === "Enter") end(true); else if (e.key === "Escape") end(false); });
    input.addEventListener("blur", function () { end(false); });
  }
  /* destructive buttons need a second click within 3s */
  function armed(btn, run) {
    if (btn.classList.contains("is-armed")) return run();
    btn.classList.add("is-armed"); btn.title = "Click again to confirm";
    setTimeout(function () { btn.classList.remove("is-armed"); btn.removeAttribute("title"); }, 3000);
  }
  function fire(board) { board.dispatchEvent(new CustomEvent("board:change", { bubbles: true })); }

  /* ---- 18b. Kanban board: editable cards and columns ---- */
  $$("[data-kanban]").forEach(function (board) {
    var dragging = null, editing = null, uid = "kb" + Math.random().toString(36).slice(2, 7);
    function counts() { $$(".kcol", board).forEach(function (c) { $(".kcol-count", c).textContent = $$(".kcard", c).length; }); }
    function changed() { counts(); fire(board); }
    function read(card) {
      return { title: $("h4", card).textContent, tags: card.dataset.tags ? card.dataset.tags.split(",") : [], due: card.dataset.due || "", owner: card.dataset.owner || "" };
    }
    function fill(card, d) {
      card.dataset.tags = d.tags.join(","); card.dataset.due = d.due; card.dataset.owner = d.owner;
      card.innerHTML = '<div class="kcard-tags">' + d.tags.map(function (t, i) { return '<span class="tag tag--' + B_TONES[i % B_TONES.length] + ' tag--sm">' + esc(t) + "</span>"; }).join("") + "</div>" +
        "<h4>" + esc(d.title) + '</h4><div class="kcard-foot">' + (d.due ? '<span class="kcard-due"><i class="ph-calendar-blank-bold"></i> ' + bDay(d.due) + "</span>" : "<span></span>") + avatarOf(d.owner) + "</div>";
    }
    function wire(card) { card.draggable = true; card.tabIndex = 0; }
    function colHtml(name, colour) {
      return '<header class="kcol-head"><h3>' + esc(name) + '</h3><span class="kcol-count">0</span><button type="button" class="icon-button icon-button--sm kcol-menu" data-col-menu aria-label="Column options"><i class="ph-dots-three-bold"></i></button></header><div class="kcol-body"></div><button class="kcol-add" type="button" data-kanban-add><i class="ph-plus-bold"></i><span>Add card</span></button>';
    }

    /* card dialog */
    var o = document.createElement("div");
    o.className = "overlay"; o.setAttribute("role", "dialog"); o.setAttribute("aria-modal", "true"); o.setAttribute("aria-labelledby", uid + "t");
    o.innerHTML = '<form class="modal modal--sm" novalidate><div class="modal-header"><h2 id="' + uid + 't">Edit card</h2><button type="button" class="icon-button icon-button--sm" data-modal-close aria-label="Close"><i class="ph-x-bold"></i></button></div><div class="modal-body stack">' +
      '<div class="field" style="max-width:none"><label class="field-label" for="' + uid + 'a">Title</label><input class="input" id="' + uid + 'a" name="title" autocomplete="off"></div>' +
      '<div class="field" style="max-width:none"><label class="field-label" for="' + uid + 'b">Tags</label><input class="input" id="' + uid + 'b" name="tags" placeholder="Design, High" autocomplete="off"><span class="field-helper">Separate with commas</span></div>' +
      '<div class="form-row"><div class="field"><label class="field-label" for="' + uid + 'c">Due date</label><input class="input" type="date" id="' + uid + 'c" name="due"></div>' +
      '<div class="field"><label class="field-label" for="' + uid + 'd">Owner</label><div class="select"><select id="' + uid + 'd" name="owner"></select></div></div></div></div>' +
      '<div class="modal-footer"><button type="button" class="button button--danger-outline cal-dialog-actions" data-delete><i class="ph-trash-bold"></i><span>Delete</span></button><button type="button" class="button" data-modal-close><span>Cancel</span></button><button type="submit" class="button button--primary"><span>Save</span></button></div></form>';
    document.body.appendChild(o);
    var form = $("form", o);
    function openCard(card) {
      editing = card; var d = read(card), f = form.elements;
      f.title.value = d.title; f.tags.value = d.tags.join(", "); f.due.value = d.due;
      f.owner.innerHTML = '<option value="">Unassigned</option>' + peopleOf(board).concat(d.owner && peopleOf(board).indexOf(d.owner) < 0 ? [d.owner] : []).map(function (n) { return '<option value="' + qa(n) + '">' + esc(n) + "</option>"; }).join("");
      f.owner.value = d.owner; o.classList.add("is-open"); f.title.focus();
    }
    form.addEventListener("submit", function (e) {
      e.preventDefault(); var f = form.elements, title = f.title.value.trim();
      if (!title) { f.title.focus(); return; }
      fill(editing, { title: title, tags: f.tags.value.split(",").map(function (t) { return t.trim(); }).filter(Boolean), due: f.due.value, owner: f.owner.value });
      o.classList.remove("is-open"); changed();
    });
    $("[data-delete]", o).addEventListener("click", function () { editing.remove(); o.classList.remove("is-open"); changed(); });

    $$(".kcard", board).forEach(wire);
    board.addEventListener("dragstart", function (e) {
      var card = e.target.closest(".kcard"); if (!card) return;
      dragging = card; card.classList.add("is-dragging"); e.dataTransfer.effectAllowed = "move";
      try { e.dataTransfer.setData("text/plain", ""); } catch (err) {}
    });
    board.addEventListener("dragend", function () {
      if (dragging) dragging.classList.remove("is-dragging");
      dragging = null; $$(".kcol.is-over", board).forEach(function (c) { c.classList.remove("is-over"); }); changed();
    });
    board.addEventListener("dragover", function (e) {
      var col = e.target.closest(".kcol"); if (!col || !dragging) return;
      e.preventDefault();
      $$(".kcol.is-over", board).forEach(function (c) { if (c !== col) c.classList.remove("is-over"); });
      col.classList.add("is-over");
      var body = $(".kcol-body", col), after = null;
      $$(".kcard:not(.is-dragging)", body).forEach(function (c) {
        var r = c.getBoundingClientRect(); if (e.clientY < r.top + r.height / 2 && !after) after = c;
      });
      if (after) body.insertBefore(dragging, after); else body.appendChild(dragging);
    });
    board.addEventListener("keydown", function (e) {
      var card = e.target.closest(".kcard"); if (!card || e.target !== card) return;
      if (e.key === "Enter") { e.preventDefault(); return openCard(card); }
      var col = card.closest(".kcol"), cols = $$(".kcol", board), i = cols.indexOf(col), to = e.key === "ArrowRight" ? i + 1 : e.key === "ArrowLeft" ? i - 1 : -1;
      if (to < 0 || to >= cols.length) return;
      e.preventDefault(); $(".kcol-body", cols[to]).appendChild(card); card.focus(); changed();
    });
    board.addEventListener("click", function (e) {
      var t = e.target, el;
      if ((el = t.closest("[data-kanban-add]"))) {
        var col = el.closest(".kcol");
        return inlineAdd(el, "Card title, then Enter", function (title) {
          var card = document.createElement("article"); card.className = "kcard"; wire(card);
          fill(card, { title: title, tags: [], due: "", owner: "" }); $(".kcol-body", col).appendChild(card); changed();
        });
      }
      if ((el = t.closest("[data-kanban-addcol]"))) {
        var s = document.createElement("section"); s.className = "kcol"; s.style.setProperty("--col", B_COLORS[0]); s.setAttribute("aria-label", "New column");
        s.innerHTML = colHtml("New column"); el.before(s); fire(board); return inlineEdit($("h3", s), function (v) { s.setAttribute("aria-label", v); fire(board); });
      }
      if ((el = t.closest("[data-col-menu]"))) {
        var column = el.closest(".kcol"), p = openFloat(el, '<div class="pop-list"><button type="button" data-act="rename"><i class="ph-pencil-simple-bold"></i><span>Rename</span></button></div>' + swatchHtml(column.style.getPropertyValue("--col").trim()) +
          '<div class="pop-list"><button type="button" class="pop-danger" data-act="delete"><i class="ph-trash-bold"></i><span>Delete column</span></button></div>');
        if (!p) return;
        p.addEventListener("click", function (ev) {
          var sw = ev.target.closest("[data-color]"), act = ev.target.closest("[data-act]");
          if (sw) { column.style.setProperty("--col", sw.dataset.color); closeFloat(); fire(board); }
          else if (act && act.dataset.act === "rename") { closeFloat(); inlineEdit($("h3", column), function (v) { column.setAttribute("aria-label", v); fire(board); }); }
          else if (act) armed(act, function () { closeFloat(); column.remove(); fire(board); });
        });
        return;
      }
      if ((el = t.closest(".kcol-head h3"))) { var c2 = el.closest(".kcol"); return inlineEdit(el, function (v) { c2.setAttribute("aria-label", v); fire(board); }); }
      if ((el = t.closest(".kcard"))) openCard(el);
    });
    counts();
  });

  /* ---- 18c. Team planning board: editable groups, items and subitems ---- */
  $$("[data-planning]").forEach(function (board) {
    var DAYS = 28, start = bDate(board.dataset.start || "2026-10-05");
    function groupOf(el) { return el.closest(".pgroup"); }
    function summarise(group) {
      if (!group) return;
      var rows = $$("[data-row]", group), bar = $(".pgroup-summary", group), n = rows.length, cnt = $(".pgroup-count", group);
      if (!bar || !cnt) return;
      cnt.textContent = n + (n === 1 ? " item" : " items");
      bar.innerHTML = "";
      B_STATUS.forEach(function (o) {
        var c = rows.filter(function (r) { return $('[data-pick="status"]', r).dataset.status === o[0]; }).length;
        if (c) { var seg = document.createElement("i"); seg.dataset.status = o[0]; seg.style.flex = c; seg.title = o[1] + ": " + c; bar.appendChild(seg); }
      });
    }
    function paint(row) {
      var own = row.dataset.owner || "", ob = $("[data-owner-pick]", row), tl = $("[data-timeline-pick]", row), a = row.dataset.from, b = row.dataset.to;
      if (ob) { ob.innerHTML = avatarOf(own); ob.title = own || "Unassigned"; }
      if (!tl) return;
      tl.className = "ptimeline";
      if (!a || !b) { tl.classList.add("is-empty"); tl.innerHTML = "<span>Set dates</span>"; return; }
      var s = Math.round((bDate(a) - start) / 864e5), e = Math.round((bDate(b) - start) / 864e5) + 1, s2 = Math.max(0, Math.min(DAYS, s)), e2 = Math.max(0, Math.min(DAYS, e));
      tl.style.setProperty("--s", s2); tl.style.setProperty("--e", Math.max(e2, s2));
      tl.innerHTML = "<i></i><span>" + rangeLabel(a, b) + "</span>";
      if (e2 <= s2) tl.classList.add("is-out"); if (s2 > 14) tl.classList.add("is-late");
    }
    function subCount(item) {
      var n = $$("[data-subrow]", item).length, c = $(".psub-count", item); c.textContent = n || ""; c.title = n + (n === 1 ? " subitem" : " subitems");
    }
    function rowHtml(name, sub) {
      return '<div class="prow' + (sub ? " prow--sub" : "") + '" ' + (sub ? "data-subrow" : "data-row") + '><span class="pcell-name">' +
        (sub ? '<span class="prow-spacer"></span>' : '<button type="button" class="prow-expand" aria-expanded="false" aria-label="Show subitems"><i class="ph-caret-right-bold"></i></button>') +
        '<span class="pname">' + esc(name) + "</span>" + (sub ? "" : '<span class="psub-count"></span>') +
        '<span class="prow-actions">' + (sub ? "" : '<button type="button" class="row-btn" data-add-sub aria-label="Add subitem"><i class="ph-plus-bold"></i></button>') +
        '<button type="button" class="row-btn row-btn--danger" data-delete-row aria-label="Delete"><i class="ph-trash-bold"></i></button></span></span>' +
        '<span class="pcell-owner"><button type="button" class="owner-btn" data-owner-pick aria-label="Change owner"></button></span>' +
        '<span><button type="button" class="status" data-pick="status" data-status="not-started">Not started</button></span>' +
        '<span><button type="button" class="status" data-pick="priority" data-status="medium">Medium</button></span>' +
        '<span><button type="button" class="ptimeline" data-timeline-pick aria-label="Edit timeline"></button></span></div>';
    }
    function addRow(group, name, sub, item) {
      var tmp = document.createElement("div"); tmp.innerHTML = rowHtml(name, sub); var row = tmp.firstChild;
      if (sub) { $(".psubs-add", item).before(row); subCount(item); }
      else {
        var wrap = document.createElement("div"); wrap.className = "pitem"; wrap.appendChild(row);
        var subs = document.createElement("div"); subs.className = "psubs"; subs.hidden = true;
        subs.innerHTML = '<div class="psubs-add"><button type="button" data-add-subitem><i class="ph-plus-bold"></i><span>Add subitem</span></button></div>';
        wrap.appendChild(subs); $(".ptable", group).appendChild(wrap);
      }
      paint(row); return row;
    }
    function groupHtml(name, colour, head) {
      return '<div class="pgroup-head"><button class="pgroup-toggle" type="button" aria-expanded="true" aria-label="Toggle group"><i class="ph-caret-down-bold"></i></button><button type="button" class="pgroup-color" data-group-color aria-label="Group colour"></button><h3 class="pgroup-title">' + esc(name) + '</h3><span class="pgroup-count"></span>' +
        '<button type="button" class="row-btn row-btn--danger pgroup-del" data-delete-group aria-label="Delete group"><i class="ph-trash-bold"></i></button></div>' +
        '<div class="ptable">' + head + '</div><div class="pgroup-add"><button type="button" data-planning-add><i class="ph-plus-bold"></i><span>Add item</span></button></div><div class="pgroup-summary" aria-label="Status summary"></div>';
    }
    function changed(group) { summarise(group); fire(board); }

    $$(".pgroup", board).forEach(summarise);
    $$("[data-row], [data-subrow]", board).forEach(paint);
    $$(".pitem", board).forEach(subCount);

    board.addEventListener("click", function (e) {
      var t = e.target, el, row, group, p;
      if ((el = t.closest(".pgroup-toggle"))) { group = groupOf(el); var c = group.classList.toggle("is-collapsed"); el.setAttribute("aria-expanded", !c); return; }
      if ((el = t.closest(".pgroup-title"))) { group = groupOf(el); return inlineEdit(el, function () { fire(board); }); }
      if ((el = t.closest("[data-group-color]"))) {
        group = groupOf(el); p = openFloat(el, swatchHtml(group.style.getPropertyValue("--g").trim())); if (!p) return;
        p.addEventListener("click", function (ev) { var sw = ev.target.closest("[data-color]"); if (sw) { group.style.setProperty("--g", sw.dataset.color); closeFloat(); fire(board); } });
        return;
      }
      if ((el = t.closest("[data-delete-group]"))) { group = groupOf(el); return armed(el, function () { group.remove(); fire(board); }); }
      if ((el = t.closest("[data-planning-addgroup]"))) {
        var g = document.createElement("div"); g.className = "pgroup"; g.style.setProperty("--g", B_COLORS[(board.children.length) % B_COLORS.length]);
        var first = $(".prow--head", board); g.innerHTML = groupHtml("New group", "", first ? first.outerHTML : "");
        el.before(g); summarise(g); fire(board); return inlineEdit($(".pgroup-title", g), function () { fire(board); });
      }
      if ((el = t.closest(".prow--head > span"))) {
        var idx = Array.prototype.indexOf.call(el.parentNode.children, el);
        return inlineEdit(el, function (v) { $$(".prow--head", board).forEach(function (h) { h.children[idx].textContent = v; }); fire(board); });
      }
      if ((el = t.closest(".prow-expand"))) { var subs = $(".psubs", el.closest(".pitem")), open = subs.hidden; subs.hidden = !open; el.setAttribute("aria-expanded", open); return; }
      if ((el = t.closest("[data-add-sub]"))) {
        var item = el.closest(".pitem"), sb = $(".psubs", item); sb.hidden = false; $(".prow-expand", item).setAttribute("aria-expanded", "true");
        return $("[data-add-subitem]", item).click();
      }
      if ((el = t.closest("[data-add-subitem]"))) {
        var it = el.closest(".pitem"), gp = groupOf(el);
        return inlineAdd(el, "Subitem name, then Enter", function (name) { addRow(gp, name, true, it); fire(board); });
      }
      if ((el = t.closest("[data-delete-row]"))) {
        row = el.closest("[data-row], [data-subrow]"); group = groupOf(el);
        return armed(el, function () { (row.hasAttribute("data-subrow") ? row : row.closest(".pitem")).remove(); $$(".pitem", board).forEach(subCount); changed(group); });
      }
      if ((el = t.closest(".pname"))) { return inlineEdit(el, function () { fire(board); }); }
      if ((el = t.closest("[data-pick]"))) {
        var kind = el.dataset.pick, opts = kind === "status" ? B_STATUS : B_PRIORITY;
        p = openFloat(el, '<div class="pop-stack">' + opts.map(function (o) { return '<button type="button" class="status" data-status="' + o[0] + '" data-choose="' + o[0] + '">' + o[1] + "</button>"; }).join("") + "</div>"); if (!p) return;
        p.addEventListener("click", function (ev) {
          var ch = ev.target.closest("[data-choose]"); if (!ch) return;
          el.dataset.status = ch.dataset.choose; el.textContent = ch.textContent; closeFloat(); changed(groupOf(el));
        });
        return;
      }
      if ((el = t.closest("[data-owner-pick]"))) {
        row = el.closest("[data-row], [data-subrow]"); p = openFloat(el, ownerHtml(peopleOf(board), row.dataset.owner || "")); if (!p) return;
        return bindOwner(p, board, row.dataset.owner || "", function (n) { row.dataset.owner = n; paint(row); fire(board); });
      }
      if ((el = t.closest("[data-timeline-pick]"))) {
        row = el.closest("[data-row], [data-subrow]");
        p = openFloat(el, '<div class="pop-dates"><label class="field-label">Start<input class="input input--sm" type="date" data-d="from" value="' + (row.dataset.from || "") + '"></label>' +
          '<label class="field-label">End<input class="input input--sm" type="date" data-d="to" value="' + (row.dataset.to || "") + '"></label><button type="button" class="button button--ghost button--sm" data-clear><span>Clear dates</span></button></div>'); if (!p) return;
        p.addEventListener("change", function (ev) {
          var f = $('[data-d="from"]', p), to = $('[data-d="to"]', p);
          if (f.value && to.value && to.value < f.value) { if (ev.target === f) to.value = f.value; else f.value = to.value; }
          if (f.value && !to.value) to.value = f.value;
          row.dataset.from = f.value; row.dataset.to = to.value; paint(row); fire(board);
        });
        p.addEventListener("click", function (ev) { if (ev.target.closest("[data-clear]")) { delete row.dataset.from; delete row.dataset.to; closeFloat(); paint(row); fire(board); } });
        return;
      }
      if ((el = t.closest("[data-planning-add]"))) {
        group = groupOf(el);
        return inlineAdd(el, "Item name, then Enter", function (name) { addRow(group, name, false); changed(group); });
      }
    });
  });

  /* ---- Calendar: day / week / month / year views with add + edit events ----
     <div data-calendar data-view="week" data-events='[{"title":"Standup","date":"2026-10-09","start":"09:00","end":"09:30"}]'></div>
     Event: { id, title, date: "YYYY-MM-DD", start: "HH:MM", end: "HH:MM", allDay, color: blue|green|amber|red|purple }
     API: OrbiCalendar.get(el) -> { getEvents, setEvents, addEvent, setView, setDate }. Emits "calendar:change" on el. */
  var CAL_COLORS = ["blue", "green", "amber", "red", "purple"];
  var CAL_MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  var CAL_DOW = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
  var calPad = function (n) { return (n < 10 ? "0" : "") + n; };
  var calIsoOf = function (d) { return d.getFullYear() + "-" + calPad(d.getMonth() + 1) + "-" + calPad(d.getDate()); };
  var calFromIso = function (s) { var p = s.split("-"); return new Date(+p[0], p[1] - 1, +p[2]); };
  var calAddDays = function (d, n) { return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n); };
  var calMins = function (t) { var p = t.split(":"); return +p[0] * 60 + +p[1]; };
  var calClock = function (t) {
    var m = calMins(t), h = Math.floor(m / 60), mm = m % 60, suf = h < 12 ? "am" : "pm";
    return ((h % 12) || 12) + (mm ? ":" + calPad(mm) : "") + suf;
  };
  var calHourLabel = function (h) { return ((h % 12) || 12) + (h < 12 ? " AM" : " PM"); };
  var calEvRange = function (e) { return calClock(e.start) + " – " + calClock(e.end); };

  function Calendar(root) {
    var self = this, today = new Date();
    self.root = root; self.view = root.dataset.view || "week"; self.date = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    self.events = [];
    try { (JSON.parse(root.dataset.events || "[]")).forEach(function (e) { self.addEvent(e, true); }); } catch (err) {}
    self.dialog = self.buildDialog();
    root.addEventListener("click", function (e) { self.onClick(e); });
    self.render();
    root._calendar = self;
  }
  var CP = Calendar.prototype;

  CP.getEvents = function () { return this.events.map(function (e) { return Object.assign({}, e); }); };
  CP.setEvents = function (list) { var s = this; s.events = []; list.forEach(function (e) { s.addEvent(e, true); }); s.render(); };
  CP.addEvent = function (e, quiet) {
    var ev = Object.assign({ title: "(No title)", start: "09:00", end: "10:00", allDay: false, color: "blue" }, e);
    ev.id = ev.id || "ev" + Date.now().toString(36) + (this.seq = (this.seq || 0) + 1);
    if (CAL_COLORS.indexOf(ev.color) < 0) ev.color = "blue";
    this.events.push(ev);
    if (!quiet) { this.render(); this.emit(); }
    return ev;
  };
  CP.emit = function () { this.root.dispatchEvent(new CustomEvent("calendar:change", { bubbles: true, detail: { events: this.getEvents() } })); };
  CP.setView = function (v) { this.view = v; this.render(); };
  CP.setDate = function (d) { this.date = d; this.render(); };
  CP.eventsOn = function (iso) {
    return this.events.filter(function (e) { return e.date === iso; }).sort(function (a, b) {
      return (b.allDay - a.allDay) || (a.allDay ? 0 : calMins(a.start) - calMins(b.start));
    });
  };

  CP.range = function () {
    var d = this.date;
    if (this.view === "day") return [d];
    var start = calAddDays(d, -d.getDay()), out = [], i;
    for (i = 0; i < 7; i++) out.push(calAddDays(start, i));
    return out;
  };
  CP.title = function () {
    var d = this.date, v = this.view;
    if (v === "year") return String(d.getFullYear());
    if (v === "month") return CAL_MONTHS[d.getMonth()] + " " + d.getFullYear();
    if (v === "day") return CAL_MONTHS[d.getMonth()].slice(0, 3) + " " + d.getDate() + ", " + d.getFullYear();
    var r = this.range(), a = r[0], b = r[6];
    if (a.getMonth() === b.getMonth()) return CAL_MONTHS[a.getMonth()].slice(0, 3) + " " + a.getDate() + " – " + b.getDate() + ", " + b.getFullYear();
    return CAL_MONTHS[a.getMonth()].slice(0, 3) + " " + a.getDate() + " – " + CAL_MONTHS[b.getMonth()].slice(0, 3) + " " + b.getDate() + ", " + b.getFullYear();
  };
  CP.step = function (dir) {
    var d = this.date, v = this.view;
    if (v === "day") this.date = calAddDays(d, dir);
    else if (v === "week") this.date = calAddDays(d, 7 * dir);
    else if (v === "month") this.date = new Date(d.getFullYear(), d.getMonth() + dir, 1);
    else this.date = new Date(d.getFullYear() + dir, d.getMonth(), 1);
    this.render();
  };

  /* lane calLayout so overlapping timed events sit side by side */
  function calLayout(list) {
    var items = list.filter(function (e) { return !e.allDay; }).map(function (e) {
      var s = calMins(e.start), en = Math.max(calMins(e.end), s + 30); return { e: e, s: s, en: en };
    }).sort(function (a, b) { return a.s - b.s || b.en - a.en; });
    var cluster = [], ends = [], clusterEnd = -1;
    function flush() { cluster.forEach(function (c) { c.n = ends.length; }); cluster = []; ends = []; }
    items.forEach(function (it) {
      if (it.s >= clusterEnd) { flush(); clusterEnd = -1; }
      var lane = 0; while (ends[lane] > it.s) lane++;
      ends[lane] = it.en; it.lane = lane; cluster.push(it); clusterEnd = Math.max(clusterEnd, it.en);
    });
    flush();
    return items;
  }

  CP.evButton = function (e, cls) {
    return '<button type="button" class="cal-ev ' + cls + '" data-color="' + e.color + '" data-ev="' + e.id + '"';
  };

  CP.renderGrid = function () {
    var self = this, days = self.range(), todayIso = calIsoOf(new Date()), hasAll = false, h, html;
    days.forEach(function (d) { if (self.eventsOn(calIsoOf(d)).some(function (e) { return e.allDay; })) hasAll = true; });
    html = '<div class="cal-head" style="--cols:' + days.length + '"><span></span>';
    days.forEach(function (d) {
      var iso = calIsoOf(d);
      html += '<button type="button" class="cal-head-cell' + (iso === todayIso ? " is-today" : "") + '" data-goto-day="' + iso + '"><span>' + CAL_DOW[d.getDay()] + "</span><b>" + d.getDate() + "</b></button>";
    });
    html += "</div>";
    if (hasAll) {
      html += '<div class="cal-allday" style="--cols:' + days.length + '"><span class="cal-allday-label">All day</span>';
      days.forEach(function (d) {
        html += '<div class="cal-allday-cell">' + self.eventsOn(calIsoOf(d)).filter(function (e) { return e.allDay; }).map(function (e) {
          return self.evButton(e, "cal-bar") + ">" + esc(e.title) + "</button>";
        }).join("") + "</div>";
      });
      html += "</div>";
    }
    html += '<div class="cal-scroll"><div class="cal-body" style="--cols:' + days.length + '"><div class="cal-hours">';
    for (h = 1; h < 24; h++) html += '<span style="top:calc(var(--cal-hour) * ' + h + ')">' + calHourLabel(h) + "</span>";
    html += "</div>";
    days.forEach(function (d) {
      var iso = calIsoOf(d), isToday = iso === todayIso;
      html += '<div class="cal-col' + (isToday ? " is-today" : "") + '" data-slot-date="' + iso + '">';
      calLayout(self.eventsOn(iso)).forEach(function (it) {
        var top = it.s / 60, hgt = Math.max((it.en - it.s) / 60, 0.45), w = 100 / it.n;
        html += self.evButton(it.e, it.en - it.s <= 30 ? "cal-ev--short" : "") + ' style="top:calc(var(--cal-hour) * ' + top + ");height:calc(var(--cal-hour) * " + hgt + " - 2px);left:calc(" + w * it.lane + "% + 1px);width:calc(" + w + "% - " + (it.lane === it.n - 1 ? 10 : 3) + 'px)"><b>' + esc(it.e.title) + "</b><i>" + (it.en - it.s <= 30 ? ", " + calClock(it.e.start) : calEvRange(it.e)) + "</i></button>";
      });
      if (isToday) { var n = new Date(); html += '<div class="cal-now" style="top:calc(var(--cal-hour) * ' + (n.getHours() + n.getMinutes() / 60) + ')"></div>'; }
      html += "</div>";
    });
    return html + "</div></div>";
  };

  CP.renderMonth = function () {
    var self = this, d = self.date, first = new Date(d.getFullYear(), d.getMonth(), 1), todayIso = calIsoOf(new Date());
    var start = calAddDays(first, -first.getDay()), rows = Math.ceil((first.getDay() + new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()) / 7), html, r, c;
    html = '<div class="cal-month-head">' + CAL_DOW.map(function (n) { return "<span>" + n + "</span>"; }).join("") + "</div>";
    for (r = 0; r < rows; r++) {
      html += '<div class="cal-month-row">';
      for (c = 0; c < 7; c++) {
        var day = calAddDays(start, r * 7 + c), iso = calIsoOf(day), list = self.eventsOn(iso), shown = list.slice(0, 3);
        html += '<div class="cal-cell' + (iso === todayIso ? " is-today" : "") + (day.getMonth() !== d.getMonth() ? " is-muted" : "") + '" data-slot-date="' + iso + '">';
        html += '<button type="button" class="cal-daynum" data-goto-day="' + iso + '">' + (day.getDate() === 1 ? CAL_MONTHS[day.getMonth()].slice(0, 3) + " 1" : day.getDate()) + "</button>";
        shown.forEach(function (e) {
          html += e.allDay ? self.evButton(e, "cal-bar") + ">" + esc(e.title) + "</button>"
            : self.evButton(e, "cal-chip") + "><time>" + calClock(e.start) + "</time><span>" + esc(e.title) + "</span></button>";
        });
        if (list.length > shown.length) html += '<button type="button" class="cal-more" data-goto-day="' + iso + '">' + (list.length - shown.length) + " more</button>";
        html += "</div>";
      }
      html += "</div>";
    }
    return html;
  };

  CP.renderYear = function () {
    var self = this, y = self.date.getFullYear(), todayIso = calIsoOf(new Date()), html = '<div class="cal-year">', m, i, n;
    for (m = 0; m < 12; m++) {
      var first = new Date(y, m, 1), total = new Date(y, m + 1, 0).getDate();
      html += '<div><button type="button" class="cal-mini-title" data-goto-month="' + m + '">' + CAL_MONTHS[m] + '</button><div class="cal-mini-grid">';
      "SMTWTFS".split("").forEach(function (l) { html += "<b>" + l + "</b>"; });
      for (i = 0; i < first.getDay(); i++) html += '<span class="cal-mini-blank"></span>';
      for (n = 1; n <= total; n++) {
        var iso = y + "-" + calPad(m + 1) + "-" + calPad(n);
        html += '<button type="button" class="cal-mini-day' + (iso === todayIso ? " is-today" : "") + (self.eventsOn(iso).length ? " has-events" : "") + '" data-goto-day="' + iso + '" aria-label="' + CAL_MONTHS[m] + " " + n + '">' + n + "</button>";
      }
      html += "</div></div>";
    }
    return html + "</div>";
  };

  CP.render = function () {
    var self = this, v = self.view;
    var views = ["day", "week", "month", "year"].map(function (n) {
      return '<button type="button" data-cal-view="' + n + '" class="' + (n === v ? "active" : "") + '" aria-pressed="' + (n === v) + '">' + n[0].toUpperCase() + n.slice(1) + "</button>";
    }).join("");
    var scroll = $(".cal-scroll", self.root), keep = scroll ? scroll.scrollTop : null;
    self.root.innerHTML =
      '<div class="cal-toolbar"><button type="button" class="button button--sm" data-cal="today"><span>Today</span></button>' +
      '<div class="cal-nav"><button type="button" class="icon-button icon-button--sm" data-cal="prev" aria-label="Previous"><i class="ph-caret-left-bold"></i></button>' +
      '<button type="button" class="icon-button icon-button--sm" data-cal="next" aria-label="Next"><i class="ph-caret-right-bold"></i></button></div>' +
      '<h3 class="cal-title" aria-live="polite">' + self.title() + "</h3>" +
      '<div class="cal-views" role="group" aria-label="Calendar view">' + views + "</div>" +
      '<button type="button" class="button button--primary button--sm" data-cal="add"><i class="ph-plus-bold"></i><span>Add event</span></button></div>' +
      (v === "day" || v === "week" ? self.renderGrid() : v === "month" ? self.renderMonth() : self.renderYear());
    var sc = $(".cal-scroll", self.root);
    if (sc) sc.scrollTop = keep !== null ? keep : 7 * 44 - 8;
  };

  CP.onClick = function (e) {
    var self = this, t = e.target, el;
    if ((el = t.closest("[data-cal-view]"))) return self.setView(el.dataset.calView);
    if ((el = t.closest("[data-cal]"))) {
      var a = el.dataset.cal, n = new Date();
      if (a === "today") { self.date = new Date(n.getFullYear(), n.getMonth(), n.getDate()); return self.render(); }
      if (a === "prev") return self.step(-1);
      if (a === "next") return self.step(1);
      return self.openDialog({ date: calIsoOf(self.view === "year" || self.view === "month" ? (self.date.getMonth() === n.getMonth() && self.date.getFullYear() === n.getFullYear() ? n : self.date) : self.date) });
    }
    if ((el = t.closest("[data-ev]"))) {
      var ev = self.events.filter(function (x) { return x.id === el.dataset.ev; })[0];
      return ev && self.openDialog(ev, true);
    }
    if ((el = t.closest("[data-goto-month]"))) { self.date = new Date(self.date.getFullYear(), +el.dataset.gotoMonth, 1); return self.setView("month"); }
    if ((el = t.closest("[data-goto-day]"))) {
      var inGrid = t.closest(".cal-head-cell") || t.closest(".cal-daynum") || t.closest(".cal-more") || self.view === "year";
      if (inGrid) { self.date = calFromIso(el.dataset.gotoDay); return self.setView("day"); }
    }
    if ((el = t.closest("[data-slot-date]"))) {
      var init = { date: el.dataset.slotDate };
      if (el.classList.contains("cal-col")) {
        var y = e.clientY - el.getBoundingClientRect().top, m = Math.floor(y / 44 * 2) * 30;
        m = Math.max(0, Math.min(m, 23 * 60));
        init.start = calPad(Math.floor(m / 60)) + ":" + calPad(m % 60); init.end = calPad(Math.floor((m + 60) / 60) % 24) + ":" + calPad(m % 60);
        if (m + 60 >= 24 * 60) init.end = "23:59";
      }
      self.openDialog(init);
    }
  };

  /* event dialog, built from the shared overlay + modal pieces */
  CP.buildDialog = function () {
    var uid = "cal" + Math.random().toString(36).slice(2, 7), o = document.createElement("div");
    o.className = "overlay"; o.setAttribute("role", "dialog"); o.setAttribute("aria-modal", "true"); o.setAttribute("aria-labelledby", uid + "t");
    o.innerHTML =
      '<form class="modal modal--sm" novalidate><div class="modal-header"><h2 id="' + uid + 't">Add event</h2><button type="button" class="icon-button icon-button--sm" data-modal-close aria-label="Close"><i class="ph-x-bold"></i></button></div>' +
      '<div class="modal-body stack">' +
      '<div class="field" style="max-width:none"><label class="field-label" for="' + uid + 'a">Title</label><input class="input" id="' + uid + 'a" name="title" placeholder="Add title" autocomplete="off"></div>' +
      '<div class="field" style="max-width:none"><label class="field-label" for="' + uid + 'b">Date</label><input class="input" type="date" id="' + uid + 'b" name="date" required></div>' +
      '<label class="checkbox"><input type="checkbox" name="allDay"><span class="box"></span><span class="label-text">All day</span></label>' +
      '<div class="form-row" data-times><div class="field"><label class="field-label" for="' + uid + 'c">Start</label><input class="input" type="time" id="' + uid + 'c" name="start"></div>' +
      '<div class="field"><label class="field-label" for="' + uid + 'd">End</label><input class="input" type="time" id="' + uid + 'd" name="end"></div></div>' +
      '<div class="field" style="max-width:none"><span class="field-label">Colour</span><div class="cal-swatches">' +
      CAL_COLORS.map(function (c) { return '<label><input type="radio" name="color" value="' + c + '" aria-label="' + c + '"><span style="--sw:var(--cal-' + c + ')"></span></label>'; }).join("") +
      "</div></div></div>" +
      '<div class="modal-footer"><button type="button" class="button button--danger-outline cal-dialog-actions" data-delete hidden><i class="ph-trash-bold"></i><span>Delete</span></button>' +
      '<button type="button" class="button" data-modal-close><span>Cancel</span></button><button type="submit" class="button button--primary"><span>Save</span></button></div></form>';
    o.style.setProperty("--cal-blue", "#6896dd"); o.style.setProperty("--cal-green", "#4a7c47"); o.style.setProperty("--cal-amber", "#d99a1e");
    o.style.setProperty("--cal-red", "#d4505c"); o.style.setProperty("--cal-purple", "#8a63d2");
    document.body.appendChild(o);
    var self = this, form = $("form", o), all = form.elements.allDay;
    all.addEventListener("change", function () { $("[data-times]", form).hidden = all.checked; });
    $("[data-delete]", o).addEventListener("click", function () {
      self.events = self.events.filter(function (x) { return x.id !== self.editing; });
      o.classList.remove("is-open"); self.render(); self.emit();
    });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var f = form.elements, data = {
        title: f.title.value.trim() || "(No title)", date: f.date.value, allDay: f.allDay.checked,
        start: f.start.value || "09:00", end: f.end.value || "10:00", color: (form.querySelector('[name="color"]:checked') || {}).value || "blue"
      };
      if (!data.date) { f.date.focus(); return; }
      if (calMins(data.end) <= calMins(data.start)) data.end = calPad(Math.min(23, Math.floor(calMins(data.start) / 60) + 1)) + ":" + calPad(calMins(data.start) % 60);
      if (self.editing) Object.assign(self.events.filter(function (x) { return x.id === self.editing; })[0], data); else self.addEvent(data, true);
      self.date = calFromIso(data.date);
      o.classList.remove("is-open"); self.render(); self.emit();
    });
    return o;
  };
  CP.openDialog = function (ev, editing) {
    var o = this.dialog, f = $("form", o).elements, d = Object.assign({ title: "", start: "09:00", end: "10:00", allDay: false, color: "blue" }, ev);
    this.editing = editing ? ev.id : null;
    $("h2", o).textContent = editing ? "Edit event" : "Add event";
    $("[data-delete]", o).hidden = !editing;
    f.title.value = d.title; f.date.value = d.date; f.start.value = d.start; f.end.value = d.end; f.allDay.checked = !!d.allDay;
    $("[data-times]", o).hidden = !!d.allDay;
    $$('[name="color"]', o).forEach(function (r) { r.checked = r.value === d.color; });
    o.classList.add("is-open"); f.title.focus();
  };

  window.OrbiCalendar = { get: function (el) { return el._calendar; } };
  $$("[data-calendar]").forEach(function (el) { new Calendar(el); });
})();
