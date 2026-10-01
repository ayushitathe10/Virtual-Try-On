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
        background: rgba(15, 23, 42, 0.90) !important;
        backdrop-filter: blur(16px) saturate(180%) !important;
        -webkit-backdrop-filter: blur(16px) saturate(180%) !important;
        border: 1px solid rgba(99, 102, 241, 0.6) !important;
        border-radius: 999px !important;
        color: #ffffff !important;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
        font-size: 11.5px !important;
        font-weight: 700 !important;
        letter-spacing: 0.3px !important;
        cursor: pointer !important;
        box-shadow: 0 4px 14px rgba(0, 0, 0, 0.5), 0 0 12px rgba(99, 102, 241, 0.4) !important;
        transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1) !important;
        pointer-events: auto !important;
        user-select: none !important;
        text-transform: none !important;
        line-height: 1 !important;
      }

      .tryon-live-badge-btn:hover {
        background: linear-gradient(135deg, #4f46e5, #06b6d4) !important;
        border-color: #a5b4fc !important;
        transform: translateY(-2px) scale(1.06) !important;
        box-shadow: 0 8px 24px rgba(79, 70, 229, 0.6), 0 0 16px rgba(6, 182, 212, 0.5) !important;
      }

      .tryon-live-badge-btn:active {
        transform: translateY(0) scale(0.98) !important;
      }

      .tryon-sparkle-icon {
        font-size: 13px !important;
        filter: drop-shadow(0 0 4px #818cf8) !important;
      }

      /* Product Detail Page (PDP) Hero Button */
      .tryon-live-pdp-action-btn {
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        gap: 8px !important;
        width: 100% !important;
        box-sizing: border-box !important;
        margin: 12px 0 !important;
        padding: 13px 20px !important;
        background: linear-gradient(135deg, #6366f1, #06b6d4) !important;
        color: #ffffff !important;
        border: none !important;
        border-radius: 10px !important;
        font-size: 14px !important;
        font-weight: 700 !important;
        letter-spacing: 0.5px !important;
        cursor: pointer !important;
        box-shadow: 0 6px 20px rgba(99, 102, 241, 0.45) !important;
        transition: all 0.2s ease !important;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
        text-transform: uppercase !important;
        line-height: 1 !important;
      }

      .tryon-live-pdp-action-btn:hover {
        background: linear-gradient(135deg, #4f46e5, #0891b2) !important;
        transform: translateY(-2px) !important;
        box-shadow: 0 8px 26px rgba(99, 102, 241, 0.65) !important;
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
        <span class="tryon-sparkle-icon">✨</span>
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
      <span class="tryon-sparkle-icon">✨</span>
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
