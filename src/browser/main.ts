import { inject } from "@vercel/analytics";
import { initApp } from "./app";
import { initTooltip } from "./tooltip";
import "./style.css";

inject();

window.addEventListener("DOMContentLoaded", () => {
	initApp();

	// Set version from package.json (via Vite define)
	const versionEl = document.getElementById("app-version");
	if (versionEl) {
		versionEl.textContent = `v${import.meta.env.APP_VERSION}`;
	}

	initTooltip();

	// Offline support: register the service worker in production builds.
	if (import.meta.env.PROD && "serviceWorker" in navigator) {
		navigator.serviceWorker.register("/sw.js").catch(() => {
			// Offline support is best-effort; the app works without it.
		});
	}
});
