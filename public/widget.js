(() => {
  const scriptEl = document.currentScript;
  if (!scriptEl) return;

  const scriptSrc = scriptEl.getAttribute("src") || "";
  let origin = window.location.origin;
  try {
    if (scriptSrc) {
      origin = new URL(scriptSrc, window.location.href).origin;
    }
  } catch {
    // Fallback to current window origin
  }

  const embedUrl = scriptEl.getAttribute("data-url") || `${origin}/embed`;
  const title = scriptEl.getAttribute("data-title") || "AI Assistant";
  const label = scriptEl.getAttribute("data-label") || "";
  const position =
    scriptEl.getAttribute("data-position") === "bottom-left"
      ? "bottom-left"
      : "bottom-right";

  if (document.getElementById("ai-chat-floating-root")) return;

  const host = document.createElement("div");
  host.id = "ai-chat-floating-root";
  const shadow = host.attachShadow({ mode: "open" });

  const isLeft = position === "bottom-left";
  const sideRule = isLeft ? "left: 20px;" : "right: 20px;";
  const originRule = isLeft ? "bottom left" : "bottom right";

  const style = document.createElement("style");
  style.textContent = `
    :host {
      all: initial;
      font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    .panel {
      position: fixed;
      bottom: 80px;
      ${sideRule}
      width: min(410px, calc(100vw - 24px));
      height: min(620px, calc(100dvh - 104px));
      border-radius: 16px;
      overflow: hidden;
      border: 1px solid rgba(15, 23, 42, 0.12);
      background: #ffffff;
      box-shadow: 0 24px 48px -12px rgba(15, 23, 42, 0.25);
      z-index: 2147483000;
      transform-origin: ${originRule};
      transition: opacity 0.2s ease, transform 0.2s ease, visibility 0.2s ease;
      opacity: 0;
      transform: translateY(12px) scale(0.95);
      visibility: hidden;
      pointer-events: none;
    }
    .panel.open {
      opacity: 1;
      transform: translateY(0) scale(1);
      visibility: visible;
      pointer-events: auto;
    }
    .frame {
      width: 100%;
      height: 100%;
      border: 0;
      display: block;
    }
    .launcher {
      position: fixed;
      bottom: 20px;
      ${sideRule}
      height: 48px;
      min-width: 48px;
      padding: ${label ? "0 16px" : "0"};
      border-radius: 9999px;
      border: 0;
      background: #171717;
      color: #ffffff;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      cursor: pointer;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
      z-index: 2147483001;
      transition: transform 0.18s ease, background-color 0.18s ease;
      font-size: 14px;
      font-weight: 500;
    }
    .launcher:hover {
      transform: scale(1.05);
    }
    .launcher:active {
      transform: scale(0.96);
    }
    .dot {
      position: absolute;
      top: -2px;
      right: -2px;
      width: 10px;
      height: 10px;
      border-radius: 9999px;
      background: #34d399;
      border: 2px solid #171717;
    }
    .icon-wrap {
      position: relative;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
  `;

  const panel = document.createElement("div");
  panel.className = "panel";
  panel.setAttribute("aria-hidden", "true");

  const iframe = document.createElement("iframe");
  iframe.className = "frame";
  iframe.title = title;
  iframe.src = embedUrl;
  panel.appendChild(iframe);

  const button = document.createElement("button");
  button.className = "launcher";
  button.type = "button";
  button.setAttribute("aria-expanded", "false");
  button.setAttribute("aria-label", label || `Buka ${title}`);

  const chatIconSvg = `
    <span class="icon-wrap">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
      </svg>
      <span class="dot" aria-hidden="true"></span>
    </span>
    ${label ? `<span>${label.replace(/[<>&"']/g, "")}</span>` : ""}
  `;

  const closeIconSvg = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M18 6 6 18"></path>
      <path d="m6 6 12 12"></path>
    </svg>
  `;

  let isOpen = false;
  const renderButton = () => {
    button.innerHTML = isOpen ? closeIconSvg : chatIconSvg;
    button.setAttribute("aria-expanded", String(isOpen));
    button.setAttribute("aria-label", isOpen ? `Tutup ${title}` : label || `Buka ${title}`);
    panel.classList.toggle("open", isOpen);
    panel.setAttribute("aria-hidden", String(!isOpen));
  };

  button.addEventListener("click", () => {
    isOpen = !isOpen;
    renderButton();
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && isOpen) {
      isOpen = false;
      renderButton();
    }
  });

  renderButton();
  shadow.append(style, panel, button);

  const mount = () => {
    if (!document.body.contains(host)) {
      document.body.appendChild(host);
    }
  };

  if (document.body) {
    mount();
  } else {
    document.addEventListener("DOMContentLoaded", mount, { once: true });
  }
})();
