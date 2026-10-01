export type ConnectionState =
  | "idle"
  | "requesting_consent"
  | "connecting_camera"
  | "fetching_token"
  | "connecting_decart"
  | "live"
  | "applying_garment"
  | "error";

export interface GarmentData {
  url: string;
  dataUrl?: string;
  sourceTitle?: string;
  blob?: Blob;
  addedAt: number;
}

export interface ExtensionSettings {
  serverUrl: string;
  hasGivenConsent: boolean;
  preferredMirror: boolean;
  model: string;
}

export type MessageToBackground =
  | { type: "FETCH_TOKEN" }
  | { type: "FETCH_IMAGE"; imageUrl: string }
  | { type: "CHECK_SERVER_HEALTH" }
  | { type: "GET_SETTINGS" }
  | { type: "SAVE_SETTINGS"; settings: Partial<ExtensionSettings> };

export type MessageToContent =
  | { type: "TOGGLE_WIDGET" }
  | { type: "OPEN_WIDGET" }
  | { type: "APPLY_GARMENT"; imageUrl: string; title?: string };

export interface ServerTokenResponse {
  apiKey: string;
  expiresAt: string;
  model: string;
}
