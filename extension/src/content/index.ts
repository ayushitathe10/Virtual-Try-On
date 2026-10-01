import { TryOnWidget } from "./widget";
import { GarmentExtractor } from "./garmentExtractor";
import { EcomBadgeInjector } from "./ecomBadgeInjector";

// Guard against multiple injections
if (!(window as any).__TRYON_LIVE_INITIALIZED__) {
  (window as any).__TRYON_LIVE_INITIALIZED__ = true;

  console.log("[TryOn Live] Content script initialized on page:", window.location.href);

  // Instantiate the floating Shadow DOM widget
  let widgetInstance: TryOnWidget | null = null;

  const getWidget = (): TryOnWidget => {
    if (!widgetInstance) {
      widgetInstance = new TryOnWidget();
    }
    return widgetInstance;
  };

  // Notice: Widget is created lazily ONLY when user clicks a "Try On" button or triggers the extension

  // Setup interactive persistent "✨ Try On" badges on Myntra and all fashion product cards
  EcomBadgeInjector.init((garment) => {
    console.log("[TryOn Live] Product selected via card badge:", garment.title, garment.url);
    const widget = getWidget();
    widget.applyGarmentFromUrl(garment.url, garment.title);
  });

  // Clean, single source of truth for product card selection: EcomBadgeInjector handles all garments

  // Listen for messages from background script (toolbar action, context menu, popup)
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    const widget = getWidget();

    if (message.type === "TOGGLE_WIDGET") {
      widget.toggle();
      sendResponse({ success: true });
      return;
    }

    if (message.type === "OPEN_WIDGET") {
      widget.show();
      sendResponse({ success: true });
      return;
    }

    if (message.type === "APPLY_GARMENT") {
      console.log("[TryOn Live] Received APPLY_GARMENT message:", message.imageUrl);
      widget.applyGarmentFromUrl(message.imageUrl, message.title);
      sendResponse({ success: true });
      return;
    }
  });
}
