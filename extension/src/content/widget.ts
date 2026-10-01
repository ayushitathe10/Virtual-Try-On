import { WIDGET_STYLES } from "./styles";
import { DecartService } from "./decartService";
import { GarmentExtractor, ExtractedGarment } from "./garmentExtractor";

// High-resolution sample apparel references for immediate testing
const SAMPLE_GARMENTS = [
  {
    title: "Biker Jacket",
    url: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&auto=format&fit=crop&q=80",
    thumb: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=100&auto=format&fit=crop&q=80",
  },
  {
    title: "Denim Shirt",
    url: "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=600&auto=format&fit=crop&q=80",
    thumb: "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=100&auto=format&fit=crop&q=80",
  },
  {
    title: "Knit Sweater",
    url: "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=600&auto=format&fit=crop&q=80",
    thumb: "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=100&auto=format&fit=crop&q=80",
  },
  {
    title: "Trench Coat",
    url: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600&auto=format&fit=crop&q=80",
    thumb: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=100&auto=format&fit=crop&q=80",
  },
];

export class TryOnWidget {
  private hostEl: HTMLElement;
  private shadow: ShadowRoot;
  private decartService: DecartService;

  // DOM Elements inside Shadow Root
  private containerEl!: HTMLElement;
  private headerEl!: HTMLElement;
  private statusBadgeEl!: HTMLElement;
  private statusDotEl!: HTMLElement;
  private statusTextEl!: HTMLElement;
  private remoteVideoEl!: HTMLVideoElement;
  private localVideoEl!: HTMLVideoElement;
  private pipContainerEl!: HTMLElement;
  private stageOverlayEl!: HTMLElement;
  private stageTitleEl!: HTMLElement;
  private stageDescEl!: HTMLElement;
  private stageSpinnerEl!: HTMLElement;
  private stageIconEl!: HTMLElement;
  private dropZoneEl!: HTMLElement;
  private activeGarmentCardEl!: HTMLElement;
  private garmentThumbEl!: HTMLImageElement;
  private garmentNameEl!: HTMLElement;
  private removeGarmentBtn!: HTMLElement;
  private startStopBtn!: HTMLButtonElement;
  private mirrorToggleBtn!: HTMLButtonElement;
  private pipToggleBtn!: HTMLButtonElement;
  private consentDialogEl!: HTMLElement;
  private errorBannerEl!: HTMLElement;
  private errorMsgEl!: HTMLElement;
  private resizeHandleEl!: HTMLElement;

  // State
  private isMirrored: boolean = true;
  private isPipVisible: boolean = false;
  private isMinimized: boolean = false;
  private currentGarment: { blob: Blob; url: string; title: string } | null = null;
  private hasConsent: boolean = false;

  constructor() {
    this.hostEl = document.createElement("div");
    this.hostEl.id = "tryon-live-root";
    document.body.appendChild(this.hostEl);
    this.shadow = this.hostEl.attachShadow({ mode: "open" });

    this.decartService = new DecartService({
      onStatusChange: (status, detail) => this.handleStatusChange(status, detail),
      onRemoteStream: (stream) => this.handleRemoteStream(stream),
      onLocalStream: (stream) => this.handleLocalStream(stream),
      onError: (err) => this.showError(err),
    });

    this.render();
    this.bindEvents();
    this.loadConsentState();
    this.hide(); // Guaranteed hidden by default on page load!
  }

  private render(): void {
    const styleEl = document.createElement("style");
    styleEl.textContent = WIDGET_STYLES;
    this.shadow.appendChild(styleEl);

    const template = document.createElement("div");
    template.className = "tryon-widget-container";
    template.innerHTML = `
      <!-- Header -->
      <div class="widget-header" id="widget-header">
        <div class="brand-section">
          <div class="brand-icon">
            <svg viewBox="0 0 24 24">
              <path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z"/>
            </svg>
          </div>
          <div class="brand-title">
            <span>TryOn Live</span>
            <span class="live-badge idle" id="status-badge">
              <span class="pulse-dot"></span>
              <span id="status-text">Ready</span>
            </span>
          </div>
        </div>
        <div class="header-actions">
          <button class="icon-btn" id="minimize-btn" title="Minimize / Expand">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </button>
          <button class="icon-btn close-btn" id="close-btn" title="Close Widget">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      </div>

      <!-- Widget Body -->
      <div class="widget-body">
        <!-- Error Banner -->
        <div class="error-banner" id="error-banner">
          <div class="error-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
          </div>
          <div class="error-msg" id="error-msg">Error description</div>
          <button class="error-dismiss" id="error-dismiss">&times;</button>
        </div>

        <!-- Video Viewport Stage -->
        <div class="video-stage mirrored" id="video-stage">
          <video id="remote-video" autoplay playsinline muted></video>

          <!-- Local Webcam PiP Preview -->
          <div class="pip-preview-container" id="pip-container">
            <span class="pip-label">Webcam</span>
            <video id="local-video" autoplay playsinline muted></video>
          </div>

          <!-- Stage State Overlay -->
          <div class="stage-overlay" id="stage-overlay">
            <div class="stage-icon" id="stage-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                <circle cx="12" cy="13" r="4"></circle>
              </svg>
            </div>
            <div class="spinner" id="stage-spinner" style="display: none;"></div>
            <div class="stage-title" id="stage-title">Decart Lucy V-TON Mirror</div>
            <div class="stage-desc" id="stage-desc">Click "Start Camera" to see garments rendered on your live video in real time.</div>
          </div>

          <!-- Privacy Consent Modal -->
          <div class="consent-dialog" id="consent-dialog">
            <div class="consent-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
            </div>
            <div class="consent-title">Camera & Privacy Consent</div>
            <div class="consent-body">
              TryOn Live streams your video feed in real time to Decart's Lucy V-TON model for virtual fitting.
            </div>
            <div class="consent-points">
              <div class="consent-point">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                <span>Zero images or video stored on server</span>
              </div>
              <div class="consent-point">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                <span>Encrypted real-time WebRTC stream</span>
              </div>
              <div class="consent-point">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                <span>Camera shuts off immediately when closed</span>
              </div>
            </div>
            <div class="consent-actions">
              <button class="primary-btn" id="consent-allow-btn">Accept & Start</button>
              <button class="secondary-btn" id="consent-cancel-btn">Cancel</button>
            </div>
          </div>
        </div>

        <!-- Garment Drop Zone -->
        <div class="drop-zone" id="drop-zone" title="Drag and drop any clothing image here">
          <!-- Default Drop Prompt -->
          <div class="drop-zone-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="17 8 12 3 7 8"></polyline>
              <line x1="12" y1="3" x2="12" y2="15"></line>
            </svg>
          </div>
          <div class="drop-zone-content" id="drop-prompt">
            <div class="drop-zone-title">
              <span>Drop clothing image here</span>
            </div>
            <div class="drop-zone-subtitle">Drag from Zara, H&M, Uniqlo or right-click "Try on"</div>
          </div>

          <!-- Active Garment Card -->
          <div class="active-garment-card" id="active-garment-card">
            <img class="garment-thumb" id="garment-thumb" src="" alt="Active garment" />
            <div class="garment-details">
              <div class="garment-name" id="garment-name">Garment loaded</div>
              <div class="garment-status">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                <span>Garment Active (Lucy V-TON)</span>
              </div>
            </div>
            <button class="remove-garment-btn" id="remove-garment-btn" title="Remove Garment">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>

        <!-- Quick Preset Samples -->
        <div class="quick-samples-bar">
          <div class="samples-label">
            <span>Quick Samples</span>
            <span style="font-size: 9px; color: #94a3b8;">Click to try</span>
          </div>
          <div class="samples-grid" id="samples-grid"></div>
        </div>

        <!-- Main Controls Bar -->
        <div class="controls-bar">
          <button class="primary-btn" id="start-stop-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
            <span id="start-btn-text">Start Camera</span>
          </button>
          <button class="secondary-btn" id="mirror-btn" title="Flip / Mirror Camera">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="16 3 21 3 21 8"></polyline>
              <line x1="4" y1="20" x2="21" y2="3"></line>
              <polyline points="21 16 21 21 16 21"></polyline>
              <line x1="15" y1="15" x2="21" y2="21"></line>
              <line x1="4" y1="4" x2="9" y2="9"></line>
            </svg>
          </button>
          <button class="secondary-btn" id="pip-btn" title="Toggle Webcam Overlay">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
              <rect x="13" y="10" width="7" height="5" rx="1" ry="1"></rect>
            </svg>
          </button>
        </div>
      </div>

      <!-- Resize corner grip -->
      <div class="resize-handle" id="resize-handle">
        <svg viewBox="0 0 10 10">
          <path d="M9 1v8H1" fill="none" stroke="currentColor" stroke-width="1.5"/>
        </svg>
      </div>
    `;

    this.shadow.appendChild(template);

    // Cache elements
    this.containerEl = this.shadow.querySelector(".tryon-widget-container") as HTMLElement;
    this.headerEl = this.shadow.querySelector("#widget-header") as HTMLElement;
    this.statusBadgeEl = this.shadow.querySelector("#status-badge") as HTMLElement;
    this.statusDotEl = this.shadow.querySelector(".pulse-dot") as HTMLElement;
    this.statusTextEl = this.shadow.querySelector("#status-text") as HTMLElement;
    this.remoteVideoEl = this.shadow.querySelector("#remote-video") as HTMLVideoElement;
    this.localVideoEl = this.shadow.querySelector("#local-video") as HTMLVideoElement;
    this.pipContainerEl = this.shadow.querySelector("#pip-container") as HTMLElement;
    this.stageOverlayEl = this.shadow.querySelector("#stage-overlay") as HTMLElement;
    this.stageTitleEl = this.shadow.querySelector("#stage-title") as HTMLElement;
    this.stageDescEl = this.shadow.querySelector("#stage-desc") as HTMLElement;
    this.stageSpinnerEl = this.shadow.querySelector("#stage-spinner") as HTMLElement;
    this.stageIconEl = this.shadow.querySelector("#stage-icon") as HTMLElement;
    this.dropZoneEl = this.shadow.querySelector("#drop-zone") as HTMLElement;
    this.activeGarmentCardEl = this.shadow.querySelector("#active-garment-card") as HTMLElement;
    this.garmentThumbEl = this.shadow.querySelector("#garment-thumb") as HTMLImageElement;
    this.garmentNameEl = this.shadow.querySelector("#garment-name") as HTMLElement;
    this.removeGarmentBtn = this.shadow.querySelector("#remove-garment-btn") as HTMLElement;
    this.startStopBtn = this.shadow.querySelector("#start-stop-btn") as HTMLButtonElement;
    this.mirrorToggleBtn = this.shadow.querySelector("#mirror-btn") as HTMLButtonElement;
    this.pipToggleBtn = this.shadow.querySelector("#pip-btn") as HTMLButtonElement;
    this.consentDialogEl = this.shadow.querySelector("#consent-dialog") as HTMLElement;
    this.errorBannerEl = this.shadow.querySelector("#error-banner") as HTMLElement;
    this.errorMsgEl = this.shadow.querySelector("#error-msg") as HTMLElement;
    this.resizeHandleEl = this.shadow.querySelector("#resize-handle") as HTMLElement;

    // Render Quick Samples
    const samplesGrid = this.shadow.querySelector("#samples-grid") as HTMLElement;
    SAMPLE_GARMENTS.forEach((sample) => {
      const chip = document.createElement("div");
      chip.className = "sample-chip";
      chip.title = `Try ${sample.title}`;
      chip.innerHTML = `
        <img class="sample-thumb" src="${sample.thumb}" alt="${sample.title}" />
        <span class="sample-title">${sample.title}</span>
      `;
      chip.addEventListener("click", () => {
        this.applyGarmentFromUrl(sample.url, sample.title);
      });
      samplesGrid.appendChild(chip);
    });
  }

  private bindEvents(): void {
    // Start / Stop camera button
    this.startStopBtn.addEventListener("click", () => {
      if (this.decartService.isSessionActive()) {
        this.stopCamera();
      } else {
        this.requestStartCamera();
      }
    });

    // Consent dialog buttons
    const allowBtn = this.shadow.querySelector("#consent-allow-btn");
    const cancelBtn = this.shadow.querySelector("#consent-cancel-btn");

    allowBtn?.addEventListener("click", async () => {
      this.hasConsent = true;
      await chrome.storage.local.set({ hasGivenConsent: true });
      this.consentDialogEl.classList.remove("visible");
      this.executeStartCamera();
    });

    cancelBtn?.addEventListener("click", () => {
      this.consentDialogEl.classList.remove("visible");
      this.handleStatusChange("idle", "Camera cancelled");
    });

    // Mirror Toggle
    this.mirrorToggleBtn.addEventListener("click", () => {
      this.isMirrored = !this.isMirrored;
      const stage = this.shadow.querySelector("#video-stage");
      if (this.isMirrored) {
        stage?.classList.add("mirrored");
      } else {
        stage?.classList.remove("mirrored");
      }
    });

    // PiP Camera Toggle
    this.pipToggleBtn.addEventListener("click", () => {
      this.isPipVisible = !this.isPipVisible;
      if (this.isPipVisible) {
        this.pipContainerEl.classList.add("visible");
      } else {
        this.pipContainerEl.classList.remove("visible");
      }
    });

    // Remove Garment Button
    this.removeGarmentBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      this.clearGarment();
    });

    // Minimize & Close Buttons
    const minimizeBtn = this.shadow.querySelector("#minimize-btn");
    const closeBtn = this.shadow.querySelector("#close-btn");

    minimizeBtn?.addEventListener("click", (e) => {
      e.stopPropagation();
      this.isMinimized = !this.isMinimized;
      if (this.isMinimized) {
        this.containerEl.classList.add("minimized");
      } else {
        this.containerEl.classList.remove("minimized");
      }
    });

    // Expand back on header click if minimized
    this.headerEl.addEventListener("click", (e) => {
      if (this.isMinimized && !(e.target as HTMLElement).closest(".icon-btn")) {
        this.isMinimized = false;
        this.containerEl.classList.remove("minimized");
      }
    });

    closeBtn?.addEventListener("click", (e) => {
      e.stopPropagation();
      this.hide();
    });

    // Error dismiss
    const errorDismiss = this.shadow.querySelector("#error-dismiss");
    errorDismiss?.addEventListener("click", () => {
      this.errorBannerEl.classList.remove("visible");
    });

    // Setup Drag-and-Drop on Drop Zone
    this.setupDropZone();

    // Draggable Window Movement
    this.setupWindowDragging();

    // Resizable Window
    this.setupWindowResizing();
  }

  private async loadConsentState(): Promise<void> {
    const stored = await chrome.storage.local.get("hasGivenConsent");
    this.hasConsent = Boolean(stored.hasGivenConsent);
  }

  private requestStartCamera(): void {
    this.hideError();
    if (!this.hasConsent) {
      this.consentDialogEl.classList.add("visible");
      this.handleStatusChange("requesting_consent", "Awaiting consent");
    } else {
      this.executeStartCamera();
    }
  }

  private async executeStartCamera(): Promise<void> {
    try {
      this.hideError();
      await this.decartService.startSession(this.currentGarment?.blob || null);
      this.updateStartStopButton(true);
    } catch (err: any) {
      console.error("[Widget] Camera start failed:", err);
      this.updateStartStopButton(false);
    }
  }

  public stopCamera(): void {
    this.decartService.stopSession();
    this.remoteVideoEl.srcObject = null;
    this.localVideoEl.srcObject = null;
    this.updateStartStopButton(false);
    this.handleStatusChange("idle", "Camera stopped");
    this.stageOverlayEl.classList.remove("hidden");
    this.stageIconEl.style.display = "flex";
    this.stageSpinnerEl.style.display = "none";
    this.stageTitleEl.textContent = "Camera Paused";
    this.stageDescEl.textContent = "Click Start Camera to re-engage Lucy V-TON stream.";
  }

  private updateStartStopButton(isRunning: boolean): void {
    const textEl = this.shadow.querySelector("#start-btn-text");
    if (isRunning) {
      this.startStopBtn.classList.add("stop");
      if (textEl) textEl.textContent = "Stop Camera";
      this.startStopBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="6" y="6" width="12" height="12"></rect>
        </svg>
        <span>Stop Camera</span>
      `;
    } else {
      this.startStopBtn.classList.remove("stop");
      this.startStopBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polygon points="5 3 19 12 5 21 5 3"></polygon>
        </svg>
        <span>Start Camera</span>
      `;
    }
  }

  private handleStatusChange(status: string, detail?: string): void {
    console.log(`[Widget Status] ${status}: ${detail || ""}`);

    // Update status badge class
    this.statusBadgeEl.className = `live-badge ${status}`;

    if (status === "idle") {
      this.statusTextEl.textContent = "Ready";
      this.stageOverlayEl.classList.remove("hidden");
      this.stageSpinnerEl.style.display = "none";
      this.stageIconEl.style.display = "flex";
      this.stageTitleEl.textContent = "Lucy V-TON Mirror";
      this.stageDescEl.textContent = detail || "Click Start Camera to begin live WebRTC try-on stream.";
    } else if (status === "connecting_camera" || status === "fetching_token" || status === "connecting_decart") {
      this.statusBadgeEl.className = "live-badge connecting";
      this.statusTextEl.textContent = "Connecting";
      this.stageOverlayEl.classList.remove("hidden");
      this.stageIconEl.style.display = "none";
      this.stageSpinnerEl.style.display = "block";
      this.stageTitleEl.textContent = detail || "Connecting...";
      this.stageDescEl.textContent = "Initiating ultra-low latency WebRTC stream...";
    } else if (status === "applying_garment") {
      this.statusBadgeEl.className = "live-badge connecting";
      this.statusTextEl.textContent = "Applying";
      this.stageOverlayEl.classList.remove("hidden");
      this.stageIconEl.style.display = "none";
      this.stageSpinnerEl.style.display = "block";
      this.stageTitleEl.textContent = "Fitting Garment...";
      this.stageDescEl.textContent = "Analyzing cloth contours and draping in real time...";
    } else if (status === "live") {
      this.statusBadgeEl.className = "live-badge live";
      this.statusTextEl.textContent = "Live Mirror";
      this.stageOverlayEl.classList.add("hidden");
    } else if (status === "error") {
      this.statusBadgeEl.className = "live-badge error";
      this.statusTextEl.textContent = "Offline";
    }
  }

  private handleRemoteStream(stream: MediaStream): void {
    console.log("[Widget] Remote stream attached to video element");
    this.remoteVideoEl.srcObject = stream;
    this.remoteVideoEl.play().catch((e) => console.warn("Auto-play error on remote video:", e));
  }

  private handleLocalStream(stream: MediaStream): void {
    console.log("[Widget] Local stream attached to PiP video element");
    this.localVideoEl.srcObject = stream;
    this.localVideoEl.play().catch((e) => console.warn("Auto-play error on local video:", e));
  }

  public async applyGarmentFromUrl(url: string, title?: string): Promise<void> {
    try {
      this.show();
      this.hideError();
      this.handleStatusChange("applying_garment", "Loading garment image...");

      console.log("[Widget] Fetching garment via background proxy:", url);
      const { blob, dataUrl } = await GarmentExtractor.fetchImageViaProxy(url);

      this.currentGarment = {
        blob,
        url,
        title: title || "Selected Garment",
      };

      // Update UI active card
      this.activeGarmentCardEl.classList.add("visible");
      const dropPrompt = this.shadow.querySelector("#drop-prompt") as HTMLElement;
      if (dropPrompt) dropPrompt.style.display = "none";

      this.garmentThumbEl.src = dataUrl;
      this.garmentNameEl.textContent = this.currentGarment.title;

      // If camera session is active, swap garment mid-session!
      if (this.decartService.isSessionActive()) {
        await this.decartService.setGarment(blob, `Wearing ${this.currentGarment.title} with natural fit and fabric texture`);
      } else {
        // Automatically launch camera / consent dialog so user immediately sees try-on
        console.log("[Widget] Camera not running, automatically requesting camera start...");
        this.requestStartCamera();
      }
    } catch (err: any) {
      console.error("[Widget] Failed to apply garment:", err);
      this.showError("Could not load garment image: " + err.message);
      this.handleStatusChange("idle");
    }
  }

  public clearGarment(): void {
    this.currentGarment = null;
    this.activeGarmentCardEl.classList.remove("visible");
    const dropPrompt = this.shadow.querySelector("#drop-prompt") as HTMLElement;
    if (dropPrompt) dropPrompt.style.display = "block";
    this.garmentThumbEl.src = "";
    this.decartService.clearGarment();
  }

  private setupDropZone(): void {
    const zone = this.dropZoneEl;

    ["dragenter", "dragover"].forEach((eventName) => {
      zone.addEventListener(eventName, (e: any) => {
        e.preventDefault();
        e.stopPropagation();
        zone.classList.add("dragover");
      });
    });

    ["dragleave", "drop"].forEach((eventName) => {
      zone.addEventListener(eventName, (e: any) => {
        e.preventDefault();
        e.stopPropagation();
        zone.classList.remove("dragover");
      });
    });

    zone.addEventListener("drop", async (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      console.log("[Widget] Item dropped into drop zone");
      const garment = await GarmentExtractor.extractFromDragEvent(e);
      if (garment && garment.url) {
        this.applyGarmentFromUrl(garment.url, garment.title);
      } else {
        this.showError("Unable to detect image from dragged element. Try right-clicking and selecting 'Try this garment'.");
      }
    });
  }

  private setupWindowDragging(): void {
    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let initialLeft = 0;
    let initialTop = 0;

    this.headerEl.addEventListener("pointerdown", (e: PointerEvent) => {
      // Don't drag if clicking buttons
      if ((e.target as HTMLElement).closest(".icon-btn")) return;

      isDragging = true;
      this.headerEl.setPointerCapture(e.pointerId);

      const rect = this.containerEl.getBoundingClientRect();
      startX = e.clientX;
      startY = e.clientY;
      initialLeft = rect.left;
      initialTop = rect.top;

      // Switch to left/top positioning instead of right/top
      this.containerEl.style.right = "auto";
      this.containerEl.style.left = `${initialLeft}px`;
      this.containerEl.style.top = `${initialTop}px`;
    });

    this.headerEl.addEventListener("pointermove", (e: PointerEvent) => {
      if (!isDragging) return;

      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      let newLeft = initialLeft + dx;
      let newTop = initialTop + dy;

      // Constrain within viewport bounds
      const maxX = window.innerWidth - this.containerEl.offsetWidth - 10;
      const maxY = window.innerHeight - this.containerEl.offsetHeight - 10;

      newLeft = Math.max(10, Math.min(newLeft, maxX));
      newTop = Math.max(10, Math.min(newTop, maxY));

      this.containerEl.style.left = `${newLeft}px`;
      this.containerEl.style.top = `${newTop}px`;
    });

    const endDrag = (e: PointerEvent) => {
      if (isDragging) {
        isDragging = false;
        try {
          this.headerEl.releasePointerCapture(e.pointerId);
        } catch (_) {}
      }
    };

    this.headerEl.addEventListener("pointerup", endDrag);
    this.headerEl.addEventListener("pointercancel", endDrag);
  }

  private setupWindowResizing(): void {
    let isResizing = false;
    let startWidth = 0;
    let startX = 0;

    this.resizeHandleEl.addEventListener("pointerdown", (e: PointerEvent) => {
      isResizing = true;
      this.resizeHandleEl.setPointerCapture(e.pointerId);
      startWidth = this.containerEl.offsetWidth;
      startX = e.clientX;
      e.stopPropagation();
    });

    this.resizeHandleEl.addEventListener("pointermove", (e: PointerEvent) => {
      if (!isResizing) return;
      const dx = e.clientX - startX;
      const newWidth = Math.max(320, Math.min(startWidth + dx, 560));
      this.containerEl.style.width = `${newWidth}px`;
    });

    const endResize = (e: PointerEvent) => {
      if (isResizing) {
        isResizing = false;
        try {
          this.resizeHandleEl.releasePointerCapture(e.pointerId);
        } catch (_) {}
      }
    };

    this.resizeHandleEl.addEventListener("pointerup", endResize);
    this.resizeHandleEl.addEventListener("pointercancel", endResize);
  }

  public showError(msg: string): void {
    console.error("[Widget UI Error]", msg);
    this.errorMsgEl.textContent = msg;
    this.errorBannerEl.classList.add("visible");
    this.handleStatusChange("error", "Error occurred");
  }

  public hideError(): void {
    this.errorBannerEl.classList.remove("visible");
  }

  public show(): void {
    this.containerEl.style.display = "flex";
    this.containerEl.classList.add("active");
  }

  public hide(): void {
    this.stopCamera();
    this.containerEl.classList.remove("active");
    this.containerEl.style.display = "none";
  }

  public toggle(): void {
    if (this.containerEl.style.display === "none") {
      this.show();
    } else {
      this.hide();
    }
  }
}
