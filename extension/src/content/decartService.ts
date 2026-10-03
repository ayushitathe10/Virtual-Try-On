import { createDecartClient, models, RealTimeClient } from "@decartai/sdk";

export interface DecartSessionCallbacks {
  onStatusChange: (status: string, detail?: string) => void;
  onRemoteStream: (stream: MediaStream) => void;
  onLocalStream: (stream: MediaStream) => void;
  onError: (error: string) => void;
}

export class DecartService {
  private realtimeClient: RealTimeClient | null = null;
  private localStream: MediaStream | null = null;
  private currentGarmentBlob: Blob | null = null;
  private isConnecting: boolean = false;
  private callbacks: DecartSessionCallbacks;

  constructor(callbacks: DecartSessionCallbacks) {
    this.callbacks = callbacks;
  }

  /**
   * Request a short-lived client token from the background script proxy
   */
  private async fetchClientToken(): Promise<string> {
    this.callbacks.onStatusChange("fetching_token", "Minting secure Decart token...");
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({ type: "FETCH_TOKEN" }, (response) => {
        if (chrome.runtime.lastError) {
          return reject(new Error(chrome.runtime.lastError.message));
        }
        if (!response || !response.success) {
          return reject(new Error(response?.error || "Failed to receive token from server"));
        }
        resolve(response.data.apiKey);
      });
    });
  }

  /**
   * Start local camera and connect to Decart Lucy V-TON WebRTC session
   */
  public async startSession(initialGarmentBlob?: Blob | null): Promise<void> {
    if (this.isConnecting || this.realtimeClient) {
      console.warn("[DecartService] Session already active or connecting");
      return;
    }

    this.isConnecting = true;
    this.currentGarmentBlob = initialGarmentBlob || null;

    try {
      // 1. Obtain local webcam stream
      this.callbacks.onStatusChange("connecting_camera", "Accessing camera feed...");
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 720 },
          height: { ideal: 960 },
          facingMode: "user",
          frameRate: { ideal: 30, max: 30 },
        },
        audio: false,
      });

      this.callbacks.onLocalStream(this.localStream);

      // 2. Fetch short-lived client token from backend
      const clientToken = await this.fetchClientToken();

      // 3. Initialize Decart SDK client with ephemeral client token
      this.callbacks.onStatusChange("connecting_decart", "Connecting to Lucy V-TON stream...");
      const client = createDecartClient({ apiKey: clientToken });

      // Use canonical virtual try-on model
      const model = models.realtime("lucy-vton-3.5");

      // Connect WebRTC stream to Decart (standard tier for reliable credits and global routing)
      this.realtimeClient = await client.realtime.connect(this.localStream, {
        model,
        onRemoteStream: (remoteStream: MediaStream) => {
          console.log("[DecartService] Received transformed remote stream from Lucy V-TON");
          this.callbacks.onRemoteStream(remoteStream);
          this.callbacks.onStatusChange("live", "Live Try-On Active");
        },
        onConnectionChange: (state: string) => {
          console.log("[DecartService] Connection state change:", state);
          if (state === "connected") {
            this.callbacks.onStatusChange("live", "Live Try-On Active");
          } else if (state === "connecting" || state === "reconnecting") {
            this.callbacks.onStatusChange("connecting_decart", `Session ${state}...`);
          } else if (state === "disconnected" || state === "failed") {
            this.callbacks.onStatusChange("error", `Connection ${state}`);
          }
        },
      });

      // Listen for runtime errors or session ended
      this.realtimeClient.on("error", (err: any) => {
        console.error("[DecartService] Realtime client error:", err);
        const errMsg = err?.message || String(err);
        this.callbacks.onError(errMsg);
      });

      this.realtimeClient.on("sessionEnded", (event: any) => {
        console.warn("[DecartService] Session ended by server:", event);
        this.stopSession();
        this.callbacks.onStatusChange("idle", "Session ended");
      });

      console.log("[DecartService] Realtime session established with Lucy V-TON");

      // Apply initial garment once connection is open
      if (this.currentGarmentBlob) {
        console.log("[DecartService] Applying queued garment after connect...");
        await this.setGarment(this.currentGarmentBlob);
      }
    } catch (err: any) {
      console.error("[DecartService] Failed to start try-on session:", err);
      this.stopSession();

      const rawMsg = err?.message || String(err);
      let friendlyMsg = rawMsg;

      if (
        rawMsg.includes("Insufficient credits") ||
        rawMsg.includes("Stale connect attempt") ||
        rawMsg.includes("1008") ||
        rawMsg.includes("policy_violation")
      ) {
        friendlyMsg = "Decart API: Insufficient credits on account. Please add credits or provide a new Decart API key in server/.env.";
      }

      this.callbacks.onError(friendlyMsg);
      throw new Error(friendlyMsg);
    } finally {
      this.isConnecting = false;
    }
  }

  /**
   * Set or swap the garment reference mid-session without restarting the stream
   */
  public async setGarment(garmentBlob: Blob, promptText?: string): Promise<void> {
    this.currentGarmentBlob = garmentBlob;

    if (!this.realtimeClient) {
      console.log("[DecartService] Session not running yet, saved garment for session start");
      return;
    }

    try {
      this.callbacks.onStatusChange("applying_garment", "Fitting garment to your live stream...");
      console.log("[DecartService] Calling realtimeClient.setImage with new garment...");

      const prompt =
        promptText ||
        "High realism virtual try-on accurately fitting this garment on the person, keeping realistic fabric drape, lighting, and seams";

      // Decart's official SDK method to swap the garment reference dynamically
      await this.realtimeClient.setImage(garmentBlob, {
        prompt,
        enhance: true,
      });

      console.log("[DecartService] Garment applied successfully");
      this.callbacks.onStatusChange("live", "Garment applied!");
    } catch (err: any) {
      console.error("[DecartService] Error swapping garment:", err);
      this.callbacks.onError("Failed to apply garment: " + (err?.message || err));
      throw err;
    }
  }

  /**
   * Remove current garment and return to normal camera stream
   */
  public async clearGarment(): Promise<void> {
    this.currentGarmentBlob = null;
    if (this.realtimeClient) {
      try {
        await this.realtimeClient.setImage(null);
        this.callbacks.onStatusChange("live", "Garment removed");
      } catch (err: any) {
        console.warn("[DecartService] Failed to clear garment image:", err);
      }
    }
  }

  /**
   * Disconnect realtime session and stop all media tracks
   */
  public stopSession(): void {
    console.log("[DecartService] Stopping session and releasing camera...");

    if (this.realtimeClient) {
      try {
        this.realtimeClient.disconnect();
      } catch (e) {
        console.warn("[DecartService] Error during disconnect:", e);
      }
      this.realtimeClient = null;
    }

    if (this.localStream) {
      // Critical: stop each track so camera indicator light on user's device turns off immediately
      this.localStream.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {
          console.warn("[DecartService] Error stopping track:", e);
        }
      });
      this.localStream = null;
    }

    this.isConnecting = false;
    this.callbacks.onStatusChange("idle", "Camera stopped");
  }

  public isSessionActive(): boolean {
    return Boolean(this.realtimeClient && this.localStream);
  }
}
