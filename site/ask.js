(() => {
  const dialog = document.querySelector("#portfolio-ask");
  const trigger = document.querySelector(".ask-trigger");
  const form = dialog.querySelector("[data-ask-form]");
  const question = form.elements.question;
  const submit = form.querySelector("button");
  const status = dialog.querySelector("[data-ask-status]");
  const result = dialog.querySelector("[data-ask-result]");
  const answer = dialog.querySelector("[data-ask-answer]");
  const sources = dialog.querySelector("[data-ask-sources]");
  let session;

  function getEndpoint() {
    try {
      const url = new URL(dialog.dataset.askEndpoint);
      const localHosts = ["localhost", "127.0.0.1"];
      const local = localHosts.includes(location.hostname) && localHosts.includes(url.hostname);
      if (url.protocol === "https:" || (local && url.protocol === "http:")) return url;
    } catch {
      // An unconfigured endpoint leaves the preset answers available.
    }
    return null;
  }

  const endpoint = getEndpoint();
  if (typeof dialog.showModal !== "function") return;
  trigger.hidden = false;
  trigger.addEventListener("click", async () => {
    session?.abort();
    const controller = new AbortController();
    session = controller;
    form.hidden = true;
    result.hidden = true;
    status.textContent = "";
    submit.disabled = false;
    dialog.showModal();
    if (!endpoint) return;

    try {
      const response = await fetch(endpoint, {
        credentials: "omit",
        cache: "no-store",
        signal: AbortSignal.any([controller.signal, AbortSignal.timeout(4500)]),
      });
      const availability = response.ok && await response.json();
      if (!controller.signal.aborted && availability?.enabled === true) form.hidden = false;
    } catch {
      // The local answers are available when the status request fails.
    }
  });

  dialog.addEventListener("close", () => {
    if (!dialog.open) session?.abort();
  });
  for (const link of dialog.querySelectorAll('a[href^="#"]')) {
    link.addEventListener("click", () => dialog.close());
  }

  form.addEventListener("submit", async event => {
    event.preventDefault();
    const message = question.value.trim();
    if (!message || !endpoint || form.hidden || submit.disabled) return;
    const controller = session;
    submit.disabled = true;
    result.hidden = true;
    status.textContent = "Looking through the portfolio…";

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        credentials: "omit",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: message }),
        signal: AbortSignal.any([controller.signal, AbortSignal.timeout(22000)]),
      });
      const data = await response.json();
      if (controller.signal.aborted) return;

      if (data.error === "disabled" || data.error === "daily_limit") {
        status.textContent = data.error === "daily_limit"
          ? "Today’s AI questions have been used. You can still browse the common questions below."
          : "AI answers are paused. You can still browse the common questions below.";
        form.hidden = true;
        return;
      }
      if (!response.ok || typeof data.answer !== "string" || !Array.isArray(data.sources)) {
        status.textContent = "An AI answer is unavailable right now. Try the common questions below.";
        return;
      }

      answer.textContent = data.answer;
      const citations = [];
      for (const source of data.sources) {
        if (typeof source?.title !== "string" || typeof source.url !== "string") continue;
        if (!source.url.startsWith("https://")) continue;
        const entry = document.createElement("li");
        const link = document.createElement("a");
        link.href = source.url;
        link.textContent = source.title;
        entry.append(link);
        citations.push(entry);
      }
      sources.replaceChildren(...citations);
      status.textContent = "";
      result.hidden = false;
    } catch {
      if (!controller.signal.aborted) {
        status.textContent = "An AI answer is unavailable right now. Try the common questions below.";
      }
    } finally {
      if (!controller.signal.aborted) submit.disabled = false;
    }
  });
})();
