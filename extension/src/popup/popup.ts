document.addEventListener("DOMContentLoaded", async () => {
  const serverUrlInput = document.getElementById("server-url") as HTMLInputElement;
  const saveServerBtn = document.getElementById("save-server-btn") as HTMLButtonElement;
  const serverHint = document.getElementById("server-hint") as HTMLElement;
  const serverPill = document.getElementById("server-status-pill") as HTMLElement;
  const serverLabel = document.getElementById("server-status-label") as HTMLElement;
  const cameraBadge = document.getElementById("camera-badge") as HTMLElement;
  const cameraStatusText = document.getElementById("camera-status-text") as HTMLElement;
  const testCameraBtn = document.getElementById("test-camera-btn") as HTMLButtonElement;
  const launchBtn = document.getElementById("launch-btn") as HTMLButtonElement;

  // 1. Load saved settings
  chrome.runtime.sendMessage({ type: "GET_SETTINGS" }, (response) => {
    if (response?.success && response.settings?.serverUrl) {
      serverUrlInput.value = response.settings.serverUrl;
    }
    checkServerHealth();
  });

  // 2. Check Backend Server Health
  async function checkServerHealth() {
    serverPill.className = "status-indicator checking";
    serverLabel.textContent = "Checking...";
    serverHint.textContent = "Connecting to backend...";
    serverHint.className = "field-hint";

    chrome.runtime.sendMessage({ type: "CHECK_SERVER_HEALTH" }, (response) => {
      if (response?.success && response.data?.status === "ok") {
        serverPill.className = "status-indicator connected";
        serverLabel.textContent = "Connected";
        if (response.data.hasApiKey) {
          serverHint.textContent = `Server active (Model: ${response.data.model || "lucy-vton-3.5"})`;
          serverHint.className = "field-hint success";
        } else {
          serverHint.textContent = "Server online, but DECART_API_KEY is not set in server/.env";
          serverHint.className = "field-hint error";
        }
      } else {
        serverPill.className = "status-indicator disconnected";
        serverLabel.textContent = "Offline";
        serverHint.textContent = response?.error || "Server offline. Run: npm run start in /server";
        serverHint.className = "field-hint error";
      }
    });
  }

  // 3. Save Server URL
  saveServerBtn.addEventListener("click", () => {
    let url = serverUrlInput.value.trim();
    if (!url) {
      url = "http://localhost:3001";
      serverUrlInput.value = url;
    }
    // Remove trailing slash
    url = url.replace(/\/+$/, "");
    serverUrlInput.value = url;

    chrome.runtime.sendMessage({ type: "SAVE_SETTINGS", settings: { serverUrl: url } }, () => {
      checkServerHealth();
    });
  });

  // 4. Check Camera Permission
  async function checkCameraPermission() {
    try {
      if (navigator.permissions && navigator.permissions.query) {
        const status = await navigator.permissions.query({ name: "camera" as any });
        updateCameraUI(status.state);
        status.onchange = () => updateCameraUI(status.state);
      } else {
        cameraBadge.textContent = "Available";
        cameraBadge.className = "badge";
        cameraStatusText.textContent = "Camera supported in browser.";
      }
    } catch (_) {
      cameraBadge.textContent = "Ready";
      cameraBadge.className = "badge";
      cameraStatusText.textContent = "Click test below to verify access.";
    }
  }

  function updateCameraUI(state: string) {
    if (state === "granted") {
      cameraBadge.textContent = "Allowed";
      cameraBadge.className = "badge allowed";
      cameraStatusText.textContent = "Camera access granted.";
    } else if (state === "denied") {
      cameraBadge.textContent = "Blocked";
      cameraBadge.className = "badge denied";
      cameraStatusText.textContent = "Camera is blocked. Check Chrome site settings.";
    } else {
      cameraBadge.textContent = "Prompt";
      cameraBadge.className = "badge";
      cameraStatusText.textContent = "Permission requested upon first use.";
    }
  }

  checkCameraPermission();

  // Test Camera
  testCameraBtn.addEventListener("click", async () => {
    try {
      testCameraBtn.disabled = true;
      testCameraBtn.innerHTML = "<span>Checking camera hardware...</span>";
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      stream.getTracks().forEach((t) => t.stop());
      updateCameraUI("granted");
      testCameraBtn.disabled = false;
      testCameraBtn.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
        <span>Camera Working Properly!</span>
      `;
    } catch (err: any) {
      testCameraBtn.disabled = false;
      updateCameraUI("denied");
      testCameraBtn.innerHTML = `<span>Camera Error: ${err.message || "Denied"}</span>`;
    }
  });

  // 5. Launch TryOn Live Widget in Active Tab
  launchBtn.addEventListener("click", async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab || !tab.id) {
        alert("Cannot find active browser tab.");
        return;
      }

      // Check if URL is special (e.g. chrome://)
      if (tab.url?.startsWith("chrome://") || tab.url?.startsWith("edge://") || tab.url?.startsWith("about:")) {
        alert("TryOn Live cannot be injected into internal browser pages. Please open an online fashion store (e.g. Zara, H&M, Uniqlo).");
        return;
      }

      chrome.tabs.sendMessage(tab.id, { type: "OPEN_WIDGET" }, async (res) => {
        if (chrome.runtime.lastError || !res) {
          // If content script was not already present, inject it dynamically
          try {
            await chrome.scripting.executeScript({
              target: { tabId: tab.id! },
              files: ["content.js"],
            });
            setTimeout(() => {
              chrome.tabs.sendMessage(tab.id!, { type: "OPEN_WIDGET" });
              window.close();
            }, 300);
          } catch (injectErr: any) {
            alert("Could not open widget on this page: " + injectErr.message);
          }
        } else {
          window.close();
        }
      });
    } catch (err: any) {
      console.error("Error launching widget:", err);
    }
  });
});
