/* The Church in Burlingame — small helpers. The site's core content works without this file. */
(function () {
  "use strict";
  var doc = document.documentElement;

  /* ── Text size (Normal / Large / Extra large), remembered on this device ── */
  var SIZES = { normal: "", large: "size-large", xlarge: "size-xlarge" };
  function applySize(size) {
    doc.classList.remove("size-large", "size-xlarge");
    if (SIZES[size]) doc.classList.add(SIZES[size]);
    document.querySelectorAll(".textsize button").forEach(function (b) {
      b.setAttribute("aria-pressed", b.getAttribute("data-size") === size ? "true" : "false");
    });
  }
  var saved = "normal";
  try { saved = localStorage.getItem("cib-text-size") || "normal"; } catch (e) {}
  applySize(saved);
  document.querySelectorAll(".textsize button").forEach(function (b) {
    b.addEventListener("click", function () {
      var s = b.getAttribute("data-size");
      applySize(s);
      try { localStorage.setItem("cib-text-size", s); } catch (e) {}
    });
  });

  /* ── Print button ── */
  document.querySelectorAll("[data-print]").forEach(function (b) {
    b.addEventListener("click", function () { window.print(); });
  });

  /* ── Thank-you page: say how we'll reply ── */
  var replyEl = document.getElementById("reply-method");
  if (replyEl) {
    var m = new URLSearchParams(location.search).get("method");
    if (m === "phone") replyEl.textContent = "with a phone call";
    else if (m === "email") replyEl.textContent = "by email";
  }

  /* ── Resources: category tiles + search ── */
  var resRoot = document.getElementById("resources");
  if (resRoot) {
    var items = Array.prototype.slice.call(resRoot.querySelectorAll(".res-item"));
    var groups = Array.prototype.slice.call(resRoot.querySelectorAll(".res-group"));
    var tiles = Array.prototype.slice.call(document.querySelectorAll(".cat-tiles button"));
    var status = document.getElementById("filter-status");
    var form = document.getElementById("res-search");
    var input = document.getElementById("res-q");
    var current = "all";

    tiles.forEach(function (t) {
      var c = t.getAttribute("data-cat");
      var n = c === "all" ? items.length : items.filter(function (i) { return i.getAttribute("data-cat") === c; }).length;
      var span = t.querySelector(".count");
      if (span) span.textContent = " (" + n + ")";
    });

    function run() {
      var q = (input.value || "").trim().toLowerCase();
      var shown = 0;
      items.forEach(function (i) {
        var okCat = current === "all" || i.getAttribute("data-cat") === current;
        var okQ = !q || i.textContent.toLowerCase().indexOf(q) !== -1;
        i.hidden = !(okCat && okQ);
        if (!i.hidden) shown++;
      });
      groups.forEach(function (g) {
        g.hidden = !g.querySelector(".res-item:not([hidden])");
      });
      tiles.forEach(function (t) { t.setAttribute("aria-pressed", t.getAttribute("data-cat") === current ? "true" : "false"); });
      var catName = current === "all" ? "All resources" : (tiles.filter(function (t) { return t.getAttribute("data-cat") === current; })[0] || {}).getAttribute("data-name");
      var msg = "Showing: " + catName + (q ? ' matching "' + input.value.trim() + '"' : "") + " — " + shown + (shown === 1 ? " resource." : " resources.");
      if (shown === 0) msg = "No resources match. Try another word, or select “All resources.”";
      status.textContent = msg;
    }
    tiles.forEach(function (t) {
      t.addEventListener("click", function () { current = t.getAttribute("data-cat"); run(); });
    });
    form.addEventListener("submit", function (e) { e.preventDefault(); run(); });
    var params = new URLSearchParams(location.search);
    if (params.get("category")) current = params.get("category");
    if (params.get("q")) input.value = params.get("q");
    if (current !== "all" || input.value) run();
  }

  /* ── Forms (visit request + contact) → Google Sheet ── */
  var f = document.querySelector("form[data-inquiry]");
  if (!f) return;

  var url = (window.CIB_FORM_URL || "").trim();
  var notice = document.getElementById("form-not-ready");
  if (!url && notice) notice.hidden = false;

  f.querySelector("[name=started]").value = String(Date.now());

  // Pre-select a topic from ?topic=
  var topic = new URLSearchParams(location.search).get("topic");
  if (topic) {
    var r = f.querySelector('input[name=inquiryType][value="' + topic + '"]');
    if (r) r.checked = true;
    if (topic === "newsletter") {
      var msg = f.querySelector("[name=message]");
      if (msg && !msg.value) msg.value = "I would like to receive the church newsletter.";
    }
  }

  // Show only the contact field that matches the chosen reply method
  var phoneWrap = document.getElementById("wrap-phone");
  var emailWrap = document.getElementById("wrap-email");
  function syncMethod() {
    var m = f.querySelector("input[name=contactMethod]:checked");
    phoneWrap.hidden = !(m && m.value === "phone");
    emailWrap.hidden = !(m && m.value === "email");
  }
  f.querySelectorAll("input[name=contactMethod]").forEach(function (r) { r.addEventListener("change", syncMethod); });
  syncMethod();

  var summary = document.getElementById("error-summary");
  var summaryList = document.getElementById("error-list");

  function setError(name, text) {
    var el = document.getElementById("err-" + name);
    var wrap = document.getElementById("wrap-" + name);
    if (el) el.textContent = text || "";
    if (wrap) wrap.classList.toggle("has-error", !!text);
    var field = f.querySelector("[name=" + name + "]");
    if (field) {
      if (text) field.setAttribute("aria-invalid", "true"); else field.removeAttribute("aria-invalid");
    }
  }

  function validate(data) {
    var errs = {};
    var name = (data.get("name") || "").trim();
    if (!name) errs.name = "Please enter your name.";
    else if (name.length > 100) errs.name = "Please keep your name under 100 letters.";
    var method = data.get("contactMethod");
    if (!method) errs.contactMethod = "Please choose how we should reply: phone call or email.";
    if (method === "phone") {
      var digits = (data.get("phone") || "").replace(/\D/g, "");
      if (digits.length < 7 || digits.length > 15) errs.phone = "Please enter your phone number, for example 650 555 0123.";
    }
    if (method === "email") {
      var em = (data.get("email") || "").trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) errs.email = "Please enter your email address, for example name@example.com.";
    }
    if (f.querySelector("input[name=inquiryType][type=radio]") && !data.get("inquiryType")) errs.inquiryType = "Please choose what your message is about.";
    if ((data.get("message") || "").length > 2000) errs.message = "Please keep your message under 2,000 letters.";
    return errs;
  }

  function showErrors(errs) {
    ["name", "contactMethod", "phone", "email", "inquiryType", "message"].forEach(function (k) { setError(k, errs[k]); });
    var keys = Object.keys(errs);
    summaryList.innerHTML = "";
    if (!keys.length) { summary.hidden = true; return; }
    keys.forEach(function (k) {
      var li = document.createElement("li");
      var a = document.createElement("a");
      var target = f.querySelector("[name=" + k + "]");
      a.href = "#" + (target ? target.id : "");
      a.textContent = errs[k];
      li.appendChild(a);
      summaryList.appendChild(li);
    });
    summary.hidden = false;
    summary.focus();
  }

  var sendBtn = f.querySelector("button[type=submit]");
  var sendLabel = sendBtn.textContent;

  f.addEventListener("submit", function (e) {
    e.preventDefault();
    var data = new FormData(f);
    var errs = validate(data);
    if (Object.keys(errs).length) { showErrors(errs); return; }
    if (!url) {
      showErrors({ name: "Sorry, our message form is not connected yet. Please try again later." });
      return;
    }
    showErrors({});
    sendBtn.disabled = true;
    sendBtn.textContent = "Sending…";
    var body = new URLSearchParams();
    data.forEach(function (v, k) { body.append(k, v); });
    fetch(url, { method: "POST", body: body })
      .then(function (res) { return res.json(); })
      .then(function (out) {
        if (out && out.ok) {
          location.href = "thank-you.html?method=" + encodeURIComponent(data.get("contactMethod"));
        } else {
          showErrors((out && out.errors) || { name: "Sorry, something went wrong. Please try again." });
        }
      })
      .catch(function () {
        showErrors({ name: "Sorry, your message could not be sent. Please check your internet connection and try again. What you typed is still here." });
      })
      .then(function () { sendBtn.disabled = false; sendBtn.textContent = sendLabel; });
  });
})();
