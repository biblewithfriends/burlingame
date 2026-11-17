/* The Church in Burlingame — page behavior */
(function () {
  "use strict";
  var API = (window.CIB_FORM_URL || "").trim();
  var $ = function (id) { return document.getElementById(id); };
  var MAX = 600;

  function make(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;   // text only, never HTML
    return n;
  }
  function day(s, opts) {
    var d = new Date(s + "T12:00:00");
    return isNaN(d) ? s : d.toLocaleDateString("en-US", opts || { month: "short", day: "numeric" });
  }
  function shift(s, n) {
    var d = new Date(s + "T12:00:00"); d.setDate(d.getDate() + n);
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }
  function get(action) { return fetch(API + "?action=" + action + "&t=" + Date.now()).then(function (r) { return r.json(); }); }
  function send(fields) { return fetch(API, { method: "POST", body: new URLSearchParams(fields) }).then(function (r) { return r.json(); }); }

  /* Keep the current tab in view on small screens */
  var here = document.querySelector('.tabs a[aria-current="page"]');
  if (here) here.parentNode.scrollLeft = here.offsetLeft - 16;

  /* ── Home: which meeting is next (Pacific time) ── */
  var week = $("week");
  if (week) {
    var parts = {};
    new Intl.DateTimeFormat("en-US", { timeZone: "America/Los_Angeles", weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23" })
      .formatToParts(new Date()).forEach(function (p) { parts[p.type] = p.value; });
    var dow = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(parts.weekday);
    var now = Number(parts.hour) * 60 + Number(parts.minute);
    var clock = function (m, bare) {
      var h = Math.floor(m / 60), mm = m % 60;
      return (h % 12 || 12) + ":" + String(mm).padStart(2, "0") + (bare ? "" : h < 12 ? " AM" : " PM");
    };
    var best = null;
    [].forEach.call(week.children, function (li) {
      var d = Number(li.dataset.dow), a = Number(li.dataset.start), b = Number(li.dataset.end);
      var live = d === dow && now >= a && now < b;
      var wait = ((d - dow + 7) % 7) * 1440 + a - now;
      if (wait < 0) wait += 7 * 1440;
      if (live) wait = -1;
      if (!best || wait < best.wait) best = { li: li, wait: wait, live: live, start: a, end: b };
    });
    if (dow > -1 && best) {
      var li = best.li, dayName = li.querySelector(".day").firstChild.textContent;
      best.li.classList.add("is-next");
      if (best.live) {
        li.querySelector(".tag").textContent = "Now";
        $("next-label").textContent = "Happening now";
        $("next-when").textContent = li.dataset.name;
        $("next-what").textContent = "Until " + clock(best.end);
      } else {
        var ahead = Math.floor((now + best.wait) / 1440);
        $("next-label").textContent = "Next up";
        $("next-when").textContent =
          ahead === 0 ? (best.start >= 1020 ? "Tonight at " + clock(best.start, true) : "Today at " + clock(best.start))
          : ahead === 1 ? "Tomorrow at " + clock(best.start)
          : dayName + " at " + clock(best.start);
        $("next-what").textContent = li.dataset.name;
      }
    }
    /* Live lines on the Prayer and Newsletter blocks */
    if (API) {
      get("prayer").then(function (d) {
        if (!d.ok) return;
        var n = d.thisWeek.length;
        $("live-prayer").textContent = n ? n + (n === 1 ? " burden" : " burdens") + " this week" : "Nothing posted yet this week. Be the first.";
      }).catch(function () {});
      get("newsletter").then(function (d) {
        if (d.ok && d.issues.length) $("live-news").textContent = "Latest: " + d.issues[0].title;
      }).catch(function () {});
    }
  }

  /* ── Prayer ── */
  if ($("prayer")) {
    var state = $("p-state"), toast = $("toast");

    var render = function (list, rows, answered) {
      list.textContent = "";
      rows.forEach(function (b) {
        var li = make("li"), text = make("div", "text"), meta = make("div", "meta");
        b.text.split(/\n+/).forEach(function (t) { text.appendChild(make("p", null, t)); });
        meta.appendChild(make("span", null, answered && b.dateAnswered ? "Answered " + day(b.dateAnswered) : "Added " + day(b.dateAdded)));
        var del = make("button", "textbtn", "Delete"); del.type = "button";
        del.addEventListener("click", function () { confirmDelete(meta, del, b.id); });
        meta.appendChild(del);
        text.appendChild(meta); li.appendChild(text); list.appendChild(li);
      });
    };

    /* Step two of deleting: nothing is removed until "Yes, delete" */
    var confirmDelete = function (meta, del, id) {
      del.hidden = true;
      var ask = make("span", "ask", "Delete this burden?");
      var yes = make("button", "btn btn-red btn-sm", "Yes, delete"); yes.type = "button";
      var no = make("button", "btn btn-line btn-sm", "Keep"); no.type = "button";
      var back = function () { [ask, yes, no].forEach(function (n) { n.remove(); }); del.hidden = false; del.focus(); };
      no.addEventListener("click", back);
      yes.addEventListener("click", function () {
        yes.disabled = no.disabled = true; yes.textContent = "Deleting…";
        send({ action: "prayer-delete", id: id }).then(function (d) {
          if (!d.ok) throw new Error(d.error);
          refresh().then(function () { offerUndo(id); });
        }).catch(function (e) { back(); meta.appendChild(make("span", "ask", e && e.message ? e.message : "Couldn’t delete. Check your connection and try again.")); });
      });
      meta.appendChild(ask); meta.appendChild(yes); meta.appendChild(no);
      yes.focus();
    };

    var offerUndo = function (id) {
      toast.textContent = "";
      toast.appendChild(make("span", null, "Burden deleted"));
      var undo = make("button", "btn btn-sm", "Undo"); undo.type = "button";
      var close = make("button", "x", "Dismiss"); close.type = "button";
      close.addEventListener("click", function () { toast.hidden = true; });
      undo.addEventListener("click", function () {
        undo.disabled = true; undo.textContent = "Restoring…";
        send({ action: "prayer-restore", id: id }).then(function (d) {
          if (!d.ok) throw new Error(d.error);
          toast.hidden = true; refresh();
        }).catch(function (e) { toast.textContent = e && e.message ? e.message : "Couldn’t restore. It’s still in the sheet’s Deleted tab."; });
      });
      toast.appendChild(undo); toast.appendChild(close);
      toast.hidden = false; undo.focus();
    };

    var refresh = function () {
      if (!API) { state.textContent = "The prayer list isn’t connected yet."; return Promise.resolve(); }
      return get("prayer").then(function (d) {
        if (!d.ok) throw 0;
        state.hidden = true;
        var long = { month: "long", day: "numeric" };
        $("this-of").textContent = "Week of " + day(d.weekOf, long);
        $("last-of").textContent = "Week of " + day(shift(d.weekOf, -7), long);
        render($("list-this"), d.thisWeek); $("g-this").hidden = false; $("this-empty").hidden = d.thisWeek.length > 0;
        render($("list-last"), d.lastWeek); $("g-last").hidden = !d.lastWeek.length;
        render($("list-answered"), d.answered, true); $("g-answered").hidden = !d.answered.length;
        if (d.lastUpdated) { $("p-updated").textContent = "Last updated " + day(d.lastUpdated, { month: "long", day: "numeric", year: "numeric" }); $("p-updated").hidden = false; }
      }).catch(function () { state.hidden = false; state.textContent = "Couldn’t load the prayer list. Refresh the page to try again."; });
    };
    refresh();

    var form = $("composer"), body = $("c-body"), count = $("c-count"), msg = $("c-msg"), post = $("c-post");
    var stamp = function () { form.elements.started.value = String(Date.now()); };
    stamp();
    body.addEventListener("input", function () {
      var n = body.value.trim().length;
      count.textContent = n + " of " + MAX;
      count.classList.toggle("over", n > MAX);
      msg.textContent = "";
    });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var n = body.value.trim().length;
      msg.textContent = !n ? "Write a burden first." : n > MAX ? "Shorten it to " + MAX + " characters." : !API ? "Posting isn’t connected yet." : "";
      if (msg.textContent) { body.focus(); return; }
      post.disabled = true; post.textContent = "Posting…";
      var fields = new URLSearchParams(new FormData(form)); fields.append("action", "prayer-request");
      send(fields).then(function (d) {
        if (!d.ok) throw new Error(d.error);
        form.reset(); stamp(); count.textContent = "0 of " + MAX;
        msg.textContent = "Posted. It’s in this week’s list.";
        refresh();
      }).catch(function (e) {
        msg.textContent = e && e.message && e.message !== "Failed to fetch" ? e.message : "Couldn’t post. Check your connection. Your words are still here.";
      }).then(function () { post.disabled = false; post.textContent = "Post burden"; });
    });
  }

  /* ── Newsletter ── */
  var issues = $("issues");
  if (issues) {
    var ns = $("n-state");
    if (!API) ns.textContent = "Newsletters aren’t connected yet.";
    else get("newsletter").then(function (d) {
      if (!d.ok) throw 0;
      ns.hidden = true;
      $("n-empty").hidden = d.issues.length > 0;
      d.issues.forEach(function (i, k) {
        var li = make("li", k === 0 ? "latest" : "");
        var when = make("time", null, (k === 0 ? "Latest, " : "") + day(i.date, { month: "long", day: "numeric", year: "numeric" }));
        var t = make("span", "t");
        if (/^https:\/\//.test(i.link)) { var a = make("a", null, i.title); a.href = i.link; t.appendChild(a); } else t.textContent = i.title;
        if (k === 0) { li.appendChild(when); li.appendChild(t); } else { li.appendChild(t); li.appendChild(when); }
        issues.appendChild(li);
      });
    }).catch(function () { ns.textContent = "Couldn’t load the newsletters. Refresh the page to try again."; });
  }

  /* ── Offerings: copy buttons ── */
  [].forEach.call(document.querySelectorAll("[data-copy]"), function (b) {
    b.addEventListener("click", function () {
      var text = b.dataset.copy;
      var done = function () { b.textContent = "Copied"; setTimeout(function () { b.textContent = "Copy"; }, 2000); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, function () { b.textContent = "Press and hold to copy"; });
      else { var t = document.createElement("textarea"); t.value = text; document.body.appendChild(t); t.select(); try { document.execCommand("copy"); done(); } catch (e) {} t.remove(); }
    });
  });

  /* ── Resources: search and topics ── */
  var shelves = $("shelves");
  if (shelves) {
    var find = $("find"), note = $("r-state"), topic = "all";
    var chips = [].slice.call(document.querySelectorAll(".chips button"));
    var filter = function () {
      var q = find.value.trim().toLowerCase(), total = 0;
      [].forEach.call(shelves.children, function (shelf) {
        var shown = 0, inTopic = topic === "all" || shelf.dataset.cat === topic;
        [].forEach.call(shelf.querySelectorAll("li"), function (li) {
          var ok = inTopic && (!q || li.textContent.toLowerCase().indexOf(q) > -1);
          li.hidden = !ok; if (ok) shown++;
        });
        shelf.hidden = !shown; total += shown;
      });
      chips.forEach(function (c) { c.setAttribute("aria-pressed", String(c.dataset.cat === topic)); });
      note.textContent = !total ? "No matches. Try another word, or choose All." : (q || topic !== "all") ? total + (total === 1 ? " resource" : " resources") : "";
    };
    chips.forEach(function (c) { c.addEventListener("click", function () { topic = c.dataset.cat; filter(); }); });
    find.addEventListener("input", filter);
  }
})();
