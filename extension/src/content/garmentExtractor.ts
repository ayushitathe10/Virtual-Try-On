/**
 * Garment Extractor
 * Handles extraction of high-resolution clothing images from any fashion site (Zara, H&M, Uniqlo, etc.),
 * including lazy-loaded images, srcsets, background-images, and drag-and-drop dataTransfer payloads.
 */

export interface ExtractedGarment {
  url: string;
  title?: string;
  blob?: Blob;
  dataUrl?: string;
}

export class GarmentExtractor {
  private static lastHoveredImage: { url: string; title: string; el: HTMLElement } | null = null;
  private static hoverButtonEl: HTMLButtonElement | null = null;
  private static onSelectGarmentCallback: ((garment: ExtractedGarment) => void) | null = null;

  /**
   * Parse srcset string and find the largest image URL
   */
  public static parseLargestSrcset(srcsetString: string): string | null {
    if (!srcsetString || typeof srcsetString !== "string") return null;

    const candidates = srcsetString
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item) => {
        const parts = item.split(/\s+/);
        const url = parts[0];
        let width = 0;
        if (parts[1]) {
          if (parts[1].endsWith("w")) {
            width = parseInt(parts[1].replace("w", ""), 10) || 0;
          } else if (parts[1].endsWith("x")) {
            width = (parseFloat(parts[1].replace("x", "")) || 1) * 1000;
          }
        }
        return { url, width };
      });

    if (candidates.length === 0) return null;

    candidates.sort((a, b) => b.width - a.width);
    return candidates[0].url;
  }

  /**
   * Extract image URL from a DOM element (img, picture, div with background, etc.)
   */
  public static extractFromElement(el: Element | null): ExtractedGarment | null {
    if (!el) return null;

    let targetEl: HTMLElement | null = el as HTMLElement;

    // If it's a picture element, check source first
    if (targetEl.tagName.toLowerCase() === "picture") {
      const source = targetEl.querySelector("source");
      if (source && source.srcset) {
        const url = this.parseLargestSrcset(source.srcset);
        if (url) return { url: this.normalizeUrl(url), title: this.findTitle(targetEl) };
      }
      targetEl = targetEl.querySelector("img") || targetEl;
    }

    // Check if target is or contains an <img>
    if (targetEl.tagName.toLowerCase() !== "img") {
      const innerImg = targetEl.querySelector("img");
      if (innerImg) {
        targetEl = innerImg;
      }
    }

    if (targetEl.tagName.toLowerCase() === "img") {
      const img = targetEl as HTMLImageElement;

      // 1. Check high-res data attributes common in Zara, H&M, Uniqlo, Shopify
      const highResAttrs = [
        "data-highres",
        "data-zoom-image",
        "data-zoom",
        "data-original",
        "data-src",
        "data-lazy-src",
        "data-srcset",
        "data-fallback-src",
      ];

      for (const attr of highResAttrs) {
        const val = img.getAttribute(attr);
        if (val) {
          if (attr.includes("srcset")) {
            const url = this.parseLargestSrcset(val);
            if (url) return { url: this.normalizeUrl(url), title: this.findTitle(img) };
          }
          return { url: this.normalizeUrl(val), title: this.findTitle(img) };
        }
      }

      // 2. Check srcset
      if (img.srcset) {
        const url = this.parseLargestSrcset(img.srcset);
        if (url) return { url: this.normalizeUrl(url), title: this.findTitle(img) };
      }

      // 3. Check currentSrc or src
      const directUrl = img.currentSrc || img.src;
      if (directUrl && !directUrl.startsWith("data:image/svg+xml")) {
        return { url: this.normalizeUrl(directUrl), title: this.findTitle(img) };
      }
    }

    // Check computed background-image
    const bg = window.getComputedStyle(targetEl).backgroundImage;
    if (bg && bg !== "none" && bg.includes("url(")) {
      const match = bg.match(/url\(['"]?(.*?)['"]?\)/);
      if (match && match[1]) {
        return { url: this.normalizeUrl(match[1]), title: this.findTitle(targetEl) };
      }
    }

    return null;
  }

  /**
   * Extract image from DragEvent dataTransfer
   */
  public static async extractFromDragEvent(e: DragEvent): Promise<ExtractedGarment | null> {
    const dt = e.dataTransfer;
    if (!dt) return null;

    // 1. Direct file drop (e.g. dragging a jpg/png from desktop or file explorer)
    if (dt.files && dt.files.length > 0) {
      const file = dt.files[0];
      if (file.type.startsWith("image/")) {
        const dataUrl = await this.readFileAsDataURL(file);
        return {
          url: URL.createObjectURL(file),
          blob: file,
          dataUrl,
          title: file.name.replace(/\.[^/.]+$/, ""),
        };
      }
    }

    // 2. Check text/uri-list
    const uriList = dt.getData("text/uri-list");
    if (uriList && this.isLikelyImageUrl(uriList)) {
      return { url: this.normalizeUrl(uriList.split("\n")[0].trim()), title: "Dropped Image" };
    }

    // 3. Check text/html (extract img tag)
    const htmlData = dt.getData("text/html");
    if (htmlData) {
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlData, "text/html");
      const img = doc.querySelector("img");
      if (img) {
        const res = this.extractFromElement(img);
        if (res) return res;
      }
    }

    // 4. Check plain text
    const textData = dt.getData("text/plain");
    if (textData && this.isLikelyImageUrl(textData)) {
      return { url: this.normalizeUrl(textData.trim()), title: "Product Image" };
    }

    return null;
  }

  /**
   * Fetch image through background script proxy to bypass CORS
   */
  public static async fetchImageViaProxy(
    imageUrl: string
  ): Promise<{ blob: Blob; dataUrl: string }> {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(
        { type: "FETCH_IMAGE", imageUrl },
        async (response) => {
          if (chrome.runtime.lastError) {
            return reject(new Error(chrome.runtime.lastError.message));
          }
          if (!response || !response.success || !response.dataUrl) {
            return reject(new Error(response?.error || "Failed to load product image"));
          }

          try {
            const res = await fetch(response.dataUrl);
            const blob = await res.blob();
            resolve({ blob, dataUrl: response.dataUrl });
          } catch (err: any) {
            reject(new Error("Failed to process image data: " + err.message));
          }
        }
      );
    });
  }

  /**
   * Helper to inspect nearby product title / alt text
   */
  private static findTitle(el: HTMLElement): string {
    // 1. Myntra specific product details
    const myntraContainer = el.closest(".product-base, .product-sliderContainer, [data-product-id]");
    if (myntraContainer) {
      const brand = myntraContainer.querySelector(".product-brand")?.textContent?.trim();
      const product = myntraContainer.querySelector(".product-product")?.textContent?.trim();
      if (brand && product) return `${brand} ${product}`;
      if (product) return product;
      if (brand) return brand;
    }

    const alt = el.getAttribute("alt");
    if (alt && alt.trim().length > 2) return alt.trim();

    const ariaLabel = el.getAttribute("aria-label");
    if (ariaLabel && ariaLabel.trim().length > 2) return ariaLabel.trim();

    // Look for parent heading or product title element
    const container = el.closest("article, .product, .product-card, [data-product-id], li");
    if (container) {
      const heading = container.querySelector("h1, h2, h3, h4, .title, .product-title, .pdp-title, .pdp-name");
      if (heading && heading.textContent) {
        return heading.textContent.trim().slice(0, 60);
      }
    }

    return "Fashion Garment";
  }

  private static isLikelyImageUrl(url: string): boolean {
    const clean = url.trim().toLowerCase();
    return (
      clean.startsWith("http://") ||
      clean.startsWith("https://") ||
      clean.startsWith("data:image/") ||
      clean.includes(".jpg") ||
      clean.includes(".jpeg") ||
      clean.includes(".png") ||
      clean.includes(".webp") ||
      clean.includes(".avif")
    );
  }

  /**
   * Automatically upgrades CDN image URLs (Myntra, Zara, H&M, Flipkart) to high-definition
   */
  public static upgradeHighResolutionUrl(rawUrl: string): string {
    let url = rawUrl;

    // Myntra CDN (assets.myntassets.com)
    // Example: .../f_webp,dpr_1.5,q_60,w_210,c_limit,fl_progressive/assets/images/...
    if (url.includes("assets.myntassets.com")) {
      url = url.replace(/w_\d+/g, "w_1080");
      url = url.replace(/q_\d+/g, "q_90");
      url = url.replace(/h_\d+/g, "h_1440");
      url = url.replace(/dpr_[0-9.]+/g, "dpr_2.0");
    }

    // Zara CDN
    if (url.includes("static.zara.net")) {
      url = url.replace(/\/w\/\d+\//g, "/w/1024/");
    }

    // H&M CDN
    if (url.includes("lp2.hm.com")) {
      url = url.replace(/\[file:\/product\/miniature\]/g, "[file:/product/main]");
      url = url.replace(/\[file:\/product\/style\]/g, "[file:/product/main]");
    }

    // Flipkart CDN
    if (url.includes("rukminim") || url.includes("flipkart.com")) {
      url = url.replace(/\/image\/\d+\/\d+\//g, "/image/1080/1080/");
    }

    return url;
  }

  private static normalizeUrl(url: string): string {
    let normalized = url.trim();
    if (normalized.startsWith("//")) {
      normalized = window.location.protocol + normalized;
    } else if (normalized.startsWith("/")) {
      normalized = window.location.origin + normalized;
    }
    return this.upgradeHighResolutionUrl(normalized);
  }


  private static readFileAsDataURL(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }

  /**
   * Setup optional hover "+ Try On" button on host page product images
   */
  public static initHoverTryOnButtons(onSelect: (garment: ExtractedGarment) => void): void {
    this.onSelectGarmentCallback = onSelect;

    // Track mouse movement to attach hover button on clothing images
    let timeoutId: number | null = null;

    document.addEventListener("mouseover", (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;

      // Ignore if hovering inside our own widget
      if (target.closest("#tryon-live-root") || target.closest(".tryon-hover-btn")) {
        return;
      }

      if (timeoutId) clearTimeout(timeoutId);

      timeoutId = window.setTimeout(() => {
        const garment = this.extractFromElement(target);
        if (garment && garment.url && target.getBoundingClientRect().width > 120) {
          this.showHoverButton(target, garment);
        }
      }, 150);
    });
  }

  private static showHoverButton(targetEl: HTMLElement, garment: ExtractedGarment): void {
    if (!this.hoverButtonEl) {
      this.hoverButtonEl = document.createElement("button");
      this.hoverButtonEl.className = "tryon-hover-btn";
      this.hoverButtonEl.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z"/>
        </svg>
        <span>Try On</span>
      `;
      document.body.appendChild(this.hoverButtonEl);

      this.hoverButtonEl.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (this.lastHoveredImage && this.onSelectGarmentCallback) {
          this.onSelectGarmentCallback({
            url: this.lastHoveredImage.url,
            title: this.lastHoveredImage.title,
          });
        }
        this.hideHoverButton();
      });

      this.hoverButtonEl.addEventListener("mouseleave", () => {
        this.hideHoverButton();
      });
    }

    const rect = targetEl.getBoundingClientRect();
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const scrollLeft = window.scrollX || document.documentElement.scrollLeft;

    this.lastHoveredImage = { url: garment.url, title: garment.title || "Garment", el: targetEl };

    this.hoverButtonEl.style.top = `${rect.top + scrollTop + 10}px`;
    this.hoverButtonEl.style.left = `${rect.left + scrollLeft + 10}px`;
    this.hoverButtonEl.style.display = "flex";
  }

  private static hideHoverButton(): void {
    if (this.hoverButtonEl) {
      this.hoverButtonEl.style.display = "none";
    }
  }
}
