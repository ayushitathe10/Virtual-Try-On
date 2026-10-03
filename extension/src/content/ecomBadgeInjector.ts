import { GarmentExtractor, ExtractedGarment } from "./garmentExtractor";

export class EcomBadgeInjector {
  private static onSelectGarmentCallback: ((garment: ExtractedGarment) => void) | null = null;
  private static isObserving = false;
  private static scanDebounceTimer: number | null = null;

  /**
   * Inject stylesheet for host page badges so host site CSS cannot break them
   */
  private static ensureStyles(): void {
    if (document.getElementById("tryon-live-badge-styles")) return;

    const style = document.createElement("style");
    style.id = "tryon-live-badge-styles";
    style.textContent = `
      .tryon-live-badge-btn {
        position: absolute !important;
        top: 10px !important;
        right: 10px !important;
        z-index: 9999 !important;
        display: inline-flex !important;
        align-items: center !important;
        gap: 6px !important;
        padding: 6px 12px !important;
        background: rgba(255, 255, 255, 0.94) !important;
        backdrop-filter: blur(20px) saturate(180%) !important;
        -webkit-backdrop-filter: blur(20px) saturate(180%) !important;
        border: 1px solid rgba(0, 0, 0, 0.08) !important;
        border-radius: 999px !important;
        color: #0f172a !important;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
        font-size: 11px !important;
        font-weight: 600 !important;
        letter-spacing: -0.1px !important;
        cursor: pointer !important;
        box-shadow: 0 4px 14px -2px rgba(15, 23, 42, 0.08), 0 2px 6px -1px rgba(15, 23, 42, 0.04) !important;
        transition: all 0.22s cubic-bezier(0.16, 1, 0.3, 1) !important;
        pointer-events: auto !important;
        user-select: none !important;
        text-transform: none !important;
        line-height: 1 !important;
      }

      .tryon-live-badge-btn:hover {
        background: #0f172a !important;
        color: #ffffff !important;
        border-color: #0f172a !important;
        transform: translateY(-2px) scale(1.03) !important;
        box-shadow: 0 8px 24px -4px rgba(15, 23, 42, 0.25) !important;
      }

      .tryon-live-badge-btn:active {
        transform: translateY(0) scale(0.97) !important;
      }

      .tryon-badge-svg {
        width: 12px !important;
        height: 12px !important;
        stroke: currentColor !important;
        flex-shrink: 0 !important;
        transition: transform 0.2s ease !important;
      }

      .tryon-live-badge-btn:hover .tryon-badge-svg {
        transform: rotate(-8deg) scale(1.1) !important;
      }

      /* Product Detail Page (PDP) Hero Button */
      .tryon-live-pdp-action-btn {
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        gap: 10px !important;
        width: 100% !important;
        box-sizing: border-box !important;
        margin: 14px 0 !important;
        padding: 13px 22px !important;
        background: #ffffff !important;
        color: #0f172a !important;
        border: 1.5px solid #0f172a !important;
        border-radius: 999px !important;
        font-size: 13.5px !important;
        font-weight: 600 !important;
        letter-spacing: 0.1px !important;
        cursor: pointer !important;
        box-shadow: 0 4px 14px rgba(15, 23, 42, 0.06) !important;
        transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1) !important;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
        text-transform: none !important;
        line-height: 1 !important;
      }

      .tryon-live-pdp-action-btn:hover {
        background: #0f172a !important;
        color: #ffffff !important;
        transform: translateY(-1px) !important;
        box-shadow: 0 8px 24px rgba(15, 23, 42, 0.18) !important;
      }

      .tryon-live-pdp-action-btn:active {
        transform: translateY(0) scale(0.99) !important;
      }
    `;
    (document.head || document.documentElement).appendChild(style);
  }

  /**
   * Start scanning and monitoring product cards across e-commerce pages
   */
  public static init(onSelectGarment: (garment: ExtractedGarment) => void): void {
    this.onSelectGarmentCallback = onSelectGarment;
    this.ensureStyles();

    // Initial scans
    this.scanAndInject();
    setTimeout(() => this.scanAndInject(), 1000);
    setTimeout(() => this.scanAndInject(), 3000);

    // Continuous observation for infinite scrolling & dynamic hydration (Myntra, Ajio, Zara, etc.)
    if (!this.isObserving) {
      this.isObserving = true;
      const observer = new MutationObserver((_mutations) => {
        if (this.scanDebounceTimer) clearTimeout(this.scanDebounceTimer);
        this.scanDebounceTimer = window.setTimeout(() => {
          this.scanAndInject();
        }, 500);
      });

      observer.observe(document.body || document.documentElement, {
        childList: true,
        subtree: true,
      });

      // Also listen to scroll event to pick up lazy loaded cards
      window.addEventListener("scroll", () => {
        if (this.scanDebounceTimer) clearTimeout(this.scanDebounceTimer);
        this.scanDebounceTimer = window.setTimeout(() => {
          this.scanAndInject();
        }, 600);
      }, { passive: true });
    }
  }

  /**
   * Scan page and inject badges onto all visible clothing items
   */
  public static scanAndInject(): void {
    this.ensureStyles();

    // 1. Myntra Specific Injection
    this.injectMyntra();

    // 2. Generic and Other E-Commerce Sites Injection
    this.injectGenericCards();

    // 3. Product Detail Page (PDP) Injection
    this.injectPDPButtons();
  }

  /**
   * Myntra listing grid injection
   */
  private static injectMyntra(): void {
    // Myntra listing items have class .product-base or .product-sliderContainer
    const myntraCards = document.querySelectorAll(
      "li.product-base, .product-base, .product-sliderContainer"
    );

    myntraCards.forEach((card) => {
      if (card.getAttribute("data-tryon-injected") === "true") return;

      const imgContainer =
        card.querySelector(".product-imageSliderContainer") ||
        card.querySelector("picture.img-responsive") ||
        card.querySelector(".product-thumb") ||
        card;

      const img = card.querySelector("img.img-responsive") || card.querySelector("img");
      if (!img) return;

      card.setAttribute("data-tryon-injected", "true");
      this.attachBadge(imgContainer as HTMLElement, card as HTMLElement);
    });
  }

  /**
   * Generic fashion store cards (Zara, H&M, Uniqlo, Ajio, Amazon, Flipkart, Shopify, etc.)
   */
  private static injectGenericCards(): void {
    const cardSelectors = [
      // Common e-commerce classes
      ".product-card",
      ".productCard",
      ".product-item",
      ".productItem",
      ".product-grid-product",
      ".grid-product",
      ".product_card",
      "[data-product-id]",
      ".item-card",
      ".catalog-item",
      "article.product",
      // Zara & H&M
      ".product-item",
      ".media-image",
      // Ajio
      ".item",
      ".preview",
      // Uniqlo
      ".fr-product-item",
      ".fr-product-card",
    ];

    const cards = document.querySelectorAll(cardSelectors.join(", "));

    cards.forEach((card) => {
      if (card.getAttribute("data-tryon-injected") === "true") return;

      // Find primary image inside card
      const img = card.querySelector("img");
      if (!img) return;

      // Check minimum dimensions to avoid tiny icons/swatches
      const rect = img.getBoundingClientRect();
      if (rect.width > 0 && rect.width < 90) return;

      card.setAttribute("data-tryon-injected", "true");

      // Find closest relative container or the card itself
      const container = (img.parentElement as HTMLElement) || (card as HTMLElement);
      this.attachBadge(container, card as HTMLElement);
    });
  }

  /**
   * Product Detail Page (PDP) prominent action button
   */
  private static injectPDPButtons(): void {
    // Myntra PDP action containers
    const myntraActions = document.querySelector(".pdp-actionContainer");
    if (myntraActions && !document.querySelector("#tryon-live-pdp-btn")) {
      const btn = document.createElement("button");
      btn.id = "tryon-live-pdp-btn";
      btn.className = "tryon-live-pdp-action-btn";
      btn.innerHTML = `
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 2a3 3 0 0 0-3 3c0 .77.34 1.46.88 1.94L2 15h20l-7.88-8.06A2.99 2.99 0 0 0 15 5a3 3 0 0 0-3-3z"/>
          <path d="M4 15v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4"/>
        </svg>
        <span>Virtual Try-On Live</span>
      `;
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        const mainImg =
          document.querySelector(".image-grid-image") ||
          document.querySelector(".pdp-image") ||
          document.querySelector("img");
        const garment = GarmentExtractor.extractFromElement(mainImg);
        if (garment && this.onSelectGarmentCallback) {
          this.onSelectGarmentCallback(garment);
        }
      });

      myntraActions.prepend(btn);
    }
  }

  /**
   * Helper to attach a Try On badge to a product card or image container
   */
  private static attachBadge(container: HTMLElement, cardEl: HTMLElement): void {
    // Ensure container has relative positioning so badge can sit at top-right
    const computedPosition = window.getComputedStyle(container).position;
    if (computedPosition === "static") {
      container.style.position = "relative";
    }

    const badge = document.createElement("button");
    badge.className = "tryon-live-badge-btn";
    badge.title = "Try this garment on with TryOn Live";
    badge.innerHTML = `
      <svg class="tryon-badge-svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 2a3 3 0 0 0-3 3c0 .77.34 1.46.88 1.94L2 15h20l-7.88-8.06A2.99 2.99 0 0 0 15 5a3 3 0 0 0-3-3z"/>
        <path d="M4 15v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4"/>
      </svg>
      <span>Try On</span>
    `;

    badge.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();

      console.log("[EcomBadge] User clicked Try On badge for product card");

      // Extract high-res garment from card
      const garment = GarmentExtractor.extractFromElement(cardEl);
      if (garment && garment.url && this.onSelectGarmentCallback) {
        this.onSelectGarmentCallback(garment);
      } else {
        console.warn("[EcomBadge] Failed to extract image from card, trying fallback img");
        const fallbackImg = cardEl.querySelector("img");
        if (fallbackImg) {
          const fallbackGarment = GarmentExtractor.extractFromElement(fallbackImg);
          if (fallbackGarment && this.onSelectGarmentCallback) {
            this.onSelectGarmentCallback(fallbackGarment);
          }
        }
      }
    });

    container.appendChild(badge);
  }
}
