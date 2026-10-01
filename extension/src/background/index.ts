import { ExtensionSettings, MessageToBackground } from "../types";

const DEFAULT_SETTINGS: ExtensionSettings = {
  serverUrl: "http://localhost:3001",
  hasGivenConsent: false,
  preferredMirror: true,
  model: "lucy-vton-3.5",
};

// Initialize settings and context menu on extension install
chrome.runtime.onInstalled.addListener(async () => {
  console.log("[TryOn Live] Extension installed/updated");

  // Setup default settings if not already present
  const existing = await chrome.storage.sync.get("settings");
  if (!existing.settings) {
    await chrome.storage.sync.set({ settings: DEFAULT_SETTINGS });
  }

  // Create context menu for image right-clicks
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: "tryon-live-try-garment",
      title: "✨ Try this garment on with TryOn Live",
      contexts: ["image"],
    });
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "tryon-live-try-garment" && tab?.id && info.srcUrl) {
    console.log("[TryOn Live] Context menu clicked for image:", info.srcUrl);
    try {
      await chrome.tabs.sendMessage(tab.id, {
        type: "APPLY_GARMENT",
        imageUrl: info.srcUrl,
        title: "Product image from page",
      });
    } catch (err) {
      console.warn("[TryOn Live] Failed to send garment to content script, injecting first...", err);
      // If content script is not yet active on tab, inject it and then send message
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ["content.js"],
      });
      setTimeout(() => {
        chrome.tabs.sendMessage(tab.id, {
          type: "APPLY_GARMENT",
          imageUrl: info.srcUrl,
          title: "Product image from page",
        });
      }, 300);
    }
  }
});

// Handle incoming messages from content scripts and popup
chrome.runtime.onMessage.addListener((message: MessageToBackground, _sender, sendResponse) => {
  (async () => {
    try {
      if (message.type === "GET_SETTINGS") {
        const stored = await chrome.storage.sync.get("settings");
        sendResponse({ success: true, settings: stored.settings || DEFAULT_SETTINGS });
        return;
      }

      if (message.type === "SAVE_SETTINGS") {
        const stored = await chrome.storage.sync.get("settings");
        const updated = { ...(stored.settings || DEFAULT_SETTINGS), ...message.settings };
        await chrome.storage.sync.set({ settings: updated });
        sendResponse({ success: true, settings: updated });
        return;
      }

      if (message.type === "CHECK_SERVER_HEALTH") {
        const stored = await chrome.storage.sync.get("settings");
        const serverUrl = stored.settings?.serverUrl || DEFAULT_SETTINGS.serverUrl;
        try {
          const res = await fetch(`${serverUrl}/api/health`, {
            method: "GET",
            headers: { Accept: "application/json" },
          });
          if (!res.ok) {
            throw new Error(`Server returned HTTP ${res.status}`);
          }
          const data = await res.json();
          sendResponse({ success: true, data });
        } catch (err: any) {
          sendResponse({
            success: false,
            error: `Unable to connect to server at ${serverUrl}. Ensure the server is running. (${err.message})`,
          });
        }
        return;
      }

      if (message.type === "FETCH_TOKEN") {
        const stored = await chrome.storage.sync.get("settings");
        const serverUrl = stored.settings?.serverUrl || DEFAULT_SETTINGS.serverUrl;
        console.log(`[TryOn Live] Requesting Decart client token from ${serverUrl}/api/token...`);

        try {
          const res = await fetch(`${serverUrl}/api/token`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
          });

          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.error || `Server returned HTTP ${res.status}`);
          }

          const tokenData = await res.json();
          console.log("[TryOn Live] Client token received from backend successfully");
          sendResponse({ success: true, data: tokenData });
        } catch (err: any) {
          console.error("[TryOn Live] Token fetch failed:", err);
          sendResponse({
            success: false,
            error: err.message || "Failed to fetch token from backend server",
          });
        }
        return;
      }

      if (message.type === "FETCH_IMAGE") {
        const { imageUrl } = message;
        console.log("[TryOn Live] Fetching image via background proxy:", imageUrl);

        try {
          const res = await fetch(imageUrl, {
            mode: "cors",
            credentials: "omit",
          });

          if (!res.ok) {
            throw new Error(`HTTP error ${res.status} fetching image`);
          }

          const blob = await res.blob();
          const mimeType = blob.type || "image/jpeg";

          // Convert blob to base64 Data URL for easy transfer across message ports
          const buffer = await blob.arrayBuffer();
          const bytes = new Uint8Array(buffer);
          let binary = "";
          for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
          }
          const base64 = btoa(binary);
          const dataUrl = `data:${mimeType};base64,${base64}`;

          sendResponse({
            success: true,
            dataUrl,
            mimeType,
            size: buffer.byteLength,
          });
        } catch (err: any) {
          console.error("[TryOn Live] Image proxy fetch failed:", err);
          sendResponse({
            success: false,
            error: `Failed to load image: ${err.message}`,
          });
        }
        return;
      }
    } catch (unexpectedError: any) {
      sendResponse({ success: false, error: unexpectedError.message || "Unexpected background error" });
    }
  })();

  return true; // Keep message channel open for asynchronous sendResponse
});
