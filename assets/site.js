/* The Church in Burlingame — small helpers. */
(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); };
  var URL_ = (window.CIB_FORM_URL || "").trim();

  function niceDate(s) {
    if (!s) return "";
    var d = new Date(s + "T12:00:00");
    return isNaN(d) ? s : d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  }
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;   // never treated as HTML
    return n;
  }
  function load(action) {
    return fetch(URL_ + "?action=" + action + "&t=" + Date.now()).then(function (r) { return r.json(); });
  }

  /* ── Prayer list: this week, last week, answered ── */
  var loadPrayer = function () {};
  if ($("prayer-public")) {
    var st = $("prayer-status");
    var shortDate = function (s) { var d = new Date(s + "T12:00:00"); return isNaN(d) ? s : d.toLocaleDateString("en-US", { month: "long", day: "numeric" }); };
    var addDays = function (s, n) { var d = new Date(s + "T12:00:00"); d.setDate(d.getDate() + n); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };

    var fill = function (list, rows, answered) {
      list.textContent = "";
      rows.forEach(function (p) {
        var li = el("li");
        p.text.split(/\n+/).forEach(function (t) { li.appendChild(el("p", null, t)); });
        li.appendChild(el("p", "date", "Added " + niceDate(p.dateAdded) + (answered && p.dateAnswered ? " · Answered " + niceDate(p.dateAnswered) : "")));
        var actions = el("div", "item-actions no-print");
        var del = el("button", "btn btn-small btn-del", "Delete");
        del.type = "button";
        del.setAttribute("aria-label", "Delete this prayer burden");
        del.addEventListener("click", function () { askDelete(actions, p.id, del); });
        actions.appendChild(del);
        li.appendChild(actions);
        list.appendChild(li);
      });
    };

    /* Two-step delete: "Delete" → "Yes, delete it" / "Cancel" */
    var askDelete = function (box, id, delBtn) {
      delBtn.hidden = true;
      var q = el("span", "confirm-q", "Delete this prayer burden?");
      var yes = el("button", "btn btn-small btn-del-yes", "Yes, delete it"); yes.type = "button";
      var no = el("button", "btn btn-small btn-ghost", "Cancel"); no.type = "button";
      var reset = function () { [q, yes, no].forEach(function (n) { n.remove(); }); delBtn.hidden = false; delBtn.focus(); };
      no.addEventListener("click", reset);
      yes.addEventListener("click", function () {
        yes.disabled = no.disabled = true; yes.textContent = "Deleting…";
        fetch(URL_, { method: "POST", body: new URLSearchParams({ action: "prayer-delete", id: id }) })
          .then(function (r) { return r.json(); })
          .then(function (d) {
            if (d.ok) loadPrayer().then(function () { showUndo(id); });
            else { reset(); q.textContent = d.error || "It couldn’t be deleted."; box.appendChild(q); }
          })
          .catch(function () { reset(); q.textContent = "It couldn’t be deleted. Please check your connection."; box.appendChild(q); });
      });
      box.appendChild(q); box.appendChild(yes); box.appendChild(no);
      yes.focus();
    };

    /* After a delete: "Deleted. Undo" — puts it back in the same place */
    var showUndo = function (id) {
      var bar = $("undo-bar"); bar.textContent = "";
      bar.appendChild(el("span", null, "Prayer burden deleted. "));
      var u = el("button", "btn btn-small btn-ghost", "Undo"); u.type = "button";
      u.addEventListener("click", function () {
        u.disabled = true; u.textContent = "Restoring…";
        fetch(URL_, { method: "POST", body: new URLSearchParams({ action: "prayer-restore", id: id }) })
          .then(function (r) { return r.json(); })
          .then(function (d) {
            if (d.ok) { bar.hidden = true; loadPrayer(); }
            else { bar.textContent = d.error || "It couldn’t be restored."; }
          })
          .catch(function () { u.disabled = false; u.textContent = "Undo"; });
      });
      bar.appendChild(u);
      bar.hidden = false;
      u.focus();
    };

    loadPrayer = function (note) {
      if (!URL_) { st.textContent = "The prayer list isn’t connected yet."; return; }
      return load("prayer").then(function (d) {
        if (!d.ok) throw 0;
        st.hidden = !note; if (note) st.textContent = note;
        if (d.lastUpdated) { $("prayer-updated").textContent = "Last updated " + niceDate(d.lastUpdated); $("prayer-updated").hidden = false; }
        $("week-of").textContent = "· week of " + shortDate(d.weekOf);
        $("last-week-of").textContent = "· week of " + shortDate(addDays(d.weekOf, -7));
        fill($("prayer-this"), d.thisWeek, false);
        $("prayer-empty").hidden = d.thisWeek.length > 0;
        fill($("prayer-last"), d.lastWeek, false);
        $("prayer-last-wrap").hidden = d.lastWeek.length === 0;
        fill($("prayer-answered"), d.answered, true);
        $("prayer-answered-wrap").hidden = d.answered.length === 0;
      }).catch(function () { st.hidden = false; st.textContent = "The prayer list couldn’t be loaded. Please try again later."; });
    };
    loadPrayer();
  }

  /* ── Share a burden ── */
  var form = $("share-form");
  if (form) {
    var body = $("s-body"), count = $("s-count"), err = $("s-err"), done = $("s-done");
    form.querySelector("[name=started]").value = String(Date.now());
    body.addEventListener("input", function () {
      var n = body.value.trim().length;
      count.textContent = n + " / 600";
      count.classList.toggle("over", n > 600);
      done.hidden = true;
    });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var n = body.value.trim().length;
      err.textContent = !n ? "Please write the prayer burden." : n > 600 ? "Please shorten it to 600 characters or fewer." : "";
      if (err.textContent) { body.focus(); return; }
      if (!URL_) { err.textContent = "Sharing isn’t connected yet."; return; }
      var btn = form.querySelector("button"); btn.disabled = true; btn.textContent = "Sending…";
      var data = new URLSearchParams(new FormData(form)); data.append("action", "prayer-request");
      fetch(URL_, { method: "POST", body: data }).then(function (r) { return r.json(); }).then(function (d) {
        if (d.ok) { form.reset(); count.textContent = "0 / 600"; form.querySelector("[name=started]").value = String(Date.now()); done.hidden = false; done.focus(); loadPrayer(); }
        else err.textContent = d.error || "Sorry, it couldn’t be sent. Please try again.";
      }).catch(function () {
        err.textContent = "Sorry, it couldn’t be sent. Please check your connection. Your words are still in the box.";
      }).then(function () { btn.disabled = false; btn.textContent = "Send"; });
    });
  }

  /* ── Newsletter ── */
  if ($("news-list")) {
    var ns = $("news-status");
    if (!URL_) ns.textContent = "The newsletter list isn’t connected yet.";
    else load("newsletter").then(function (d) {
      if (!d.ok) throw 0;
      ns.hidden = true;
      $("news-empty").hidden = d.issues.length > 0;
      d.issues.forEach(function (i) {
        var li = el("li");
        var t = el("p", "title");
        if (/^https:\/\//.test(i.link)) { var a = el("a", null, i.title); a.href = i.link; t.appendChild(a); } else t.textContent = i.title;
        li.appendChild(t);
        li.appendChild(el("p", "date", niceDate(i.date)));
        $("news-list").appendChild(li);
      });
    }).catch(function () { ns.textContent = "The newsletters couldn’t be loaded. Please try again later."; });
  }

  /* ── Resources: topics + search ── */
  var root = $("resources");
  if (root) {
    var items = [].slice.call(root.querySelectorAll("li[data-cat]"));
    var groups = [].slice.call(root.querySelectorAll(".res-group"));
    var chips = [].slice.call(document.querySelectorAll(".filters button"));
    var q = $("res-q"), status = $("res-status"), cat = "all";
    function run() {
      var term = q.value.trim().toLowerCase(), shown = 0;
      items.forEach(function (i) {
        var ok = (cat === "all" || i.dataset.cat === cat) && (!term || i.textContent.toLowerCase().indexOf(term) > -1);
        i.hidden = !ok; if (ok) shown++;
      });
      groups.forEach(function (g) { g.hidden = !g.querySelector("li:not([hidden])"); });
      chips.forEach(function (c) { c.setAttribute("aria-pressed", String(c.dataset.cat === cat)); });
      status.textContent = shown ? (cat === "all" && !term ? "" : shown + (shown === 1 ? " resource" : " resources")) : "Nothing matches. Try another word, or choose All.";
    }
    chips.forEach(function (c) { c.addEventListener("click", function () { cat = c.dataset.cat; run(); }); });
    $("res-search").addEventListener("submit", function (e) { e.preventDefault(); run(); });
    q.addEventListener("input", run);
  }
})();
