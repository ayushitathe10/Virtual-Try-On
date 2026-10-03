export const WIDGET_STYLES = `
:host {
  all: initial;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  color-scheme: light;
}

*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

.tryon-widget-container {
  position: fixed;
  top: 24px;
  right: 24px;
  width: 335px;
  min-width: 290px;
  max-width: calc(100vw - 32px);
  max-height: calc(100vh - 32px);
  background: rgba(255, 255, 255, 0.96);
  backdrop-filter: blur(36px) saturate(190%);
  -webkit-backdrop-filter: blur(36px) saturate(190%);
  border: 1px solid rgba(226, 232, 240, 0.85);
  border-radius: 20px;
  box-shadow: 0 24px 60px -12px rgba(15, 23, 42, 0.16), 0 8px 24px -4px rgba(15, 23, 42, 0.06), 0 0 0 1px rgba(0, 0, 0, 0.04);
  color: #0f172a;
  z-index: 2147483647;
  display: none; /* Hidden by default until user triggers Try On */
  flex-direction: column;
  overflow: hidden;
  transition: box-shadow 0.25s ease, transform 0.2s ease, opacity 0.2s ease, width 0.25s ease;
  user-select: none;
}

.tryon-widget-container.active {
  display: flex;
  animation: tryonWidgetAppear 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes tryonWidgetAppear {
  from {
    opacity: 0;
    transform: translateY(-10px) scale(0.97);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.tryon-widget-container.minimized {
  width: auto;
  min-width: 0;
  border-radius: 999px;
  box-shadow: 0 12px 32px -4px rgba(15, 23, 42, 0.14), 0 0 0 1px rgba(0, 0, 0, 0.06);
  cursor: pointer;
  border-color: #cbd5e1;
}

.tryon-widget-container.minimized .widget-header {
  border-bottom: none;
  padding: 8px 14px;
  gap: 12px;
}

.tryon-widget-container.minimized .widget-body,
.tryon-widget-container.minimized .resize-handle {
  display: none;
}

.tryon-widget-container:focus-within {
  box-shadow: 0 30px 70px -12px rgba(15, 23, 42, 0.2), 0 0 0 1px rgba(15, 23, 42, 0.1);
}

/* Header bar */
.widget-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 13px 16px;
  background: rgba(255, 255, 255, 0.85);
  border-bottom: 1px solid #f1f5f9;
  cursor: grab;
  touch-action: none;
}

.widget-header:active {
  cursor: grabbing;
}

.brand-section {
  display: flex;
  align-items: center;
  gap: 10px;
}

.brand-icon {
  width: 26px;
  height: 26px;
  border-radius: 7px;
  background: #0f172a;
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 6px rgba(15, 23, 42, 0.15);
}

.brand-icon svg {
  width: 15px;
  height: 15px;
  fill: #ffffff;
}

.brand-title {
  font-size: 13.5px;
  font-weight: 700;
  letter-spacing: -0.2px;
  color: #0f172a;
  display: flex;
  align-items: center;
  gap: 7px;
}

.live-badge {
  font-size: 9.5px;
  font-weight: 600;
  text-transform: uppercase;
  padding: 2.5px 7px;
  border-radius: 999px;
  letter-spacing: 0.4px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.live-badge.idle {
  background: #f1f5f9;
  color: #64748b;
  border: 1px solid #e2e8f0;
}

.live-badge.connecting {
  background: #fef3c7;
  color: #92400e;
  border: 1px solid #fde68a;
}

.live-badge.live {
  background: #ecfdf5;
  color: #065f46;
  border: 1px solid #a7f3d0;
}

.live-badge.error {
  background: #fef2f2;
  color: #991b1b;
  border: 1px solid #fecaca;
}

.pulse-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

.live-badge.live .pulse-dot {
  box-shadow: 0 0 6px currentColor;
  animation: pulseLive 1.5s infinite ease-in-out;
}

@keyframes pulseLive {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.4); opacity: 0.6; }
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 5px;
}

.icon-btn {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  color: #64748b;
  cursor: pointer;
  padding: 6px;
  border-radius: 7px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
}

.icon-btn:hover {
  background: #f1f5f9;
  color: #0f172a;
  border-color: #cbd5e1;
}

.icon-btn.close-btn:hover {
  background: #fef2f2;
  color: #dc2626;
  border-color: #fecaca;
}

/* Body */
.widget-body {
  padding: 13px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: calc(100vh - 90px);
  overflow-y: auto;
  overflow-x: hidden;
}

.widget-body::-webkit-scrollbar {
  width: 4px;
}

.widget-body::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.15);
  border-radius: 4px;
}

/* Video Stage */
.video-stage {
  position: relative;
  width: 100%;
  aspect-ratio: 3 / 4;
  min-height: 290px;
  background: #0f172a;
  border-radius: 14px;
  overflow: hidden;
  border: 1px solid rgba(0, 0, 0, 0.08);
  box-shadow: 0 4px 16px -2px rgba(15, 23, 42, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
}

.video-stage video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.video-stage.mirrored video {
  transform: scaleX(-1);
}

/* In-Stage Active Garment Floating Chip */
.stage-garment-badge {
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 6;
  display: none;
  align-items: center;
  gap: 7px;
  padding: 3px 10px 3px 4px;
  background: rgba(255, 255, 255, 0.94);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 999px;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.12);
  max-width: calc(100% - 20px);
}

.stage-garment-badge.visible {
  display: inline-flex;
  animation: badgeSlideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes badgeSlideIn {
  from { opacity: 0; transform: translateY(-6px); }
  to { opacity: 1; transform: translateY(0); }
}

.stage-garment-thumb {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid rgba(0, 0, 0, 0.08);
  flex-shrink: 0;
}

.stage-garment-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.stage-garment-label {
  font-size: 7.5px;
  font-weight: 700;
  text-transform: uppercase;
  color: #64748b;
  letter-spacing: 0.4px;
  line-height: 1;
}

.stage-garment-title {
  font-size: 9.5px;
  font-weight: 600;
  color: #0f172a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 135px;
  line-height: 1.2;
}

/* PiP Webcam Preview */
.pip-preview-container {
  position: absolute;
  bottom: 10px;
  right: 10px;
  width: 86px;
  aspect-ratio: 3 / 4;
  border-radius: 9px;
  overflow: hidden;
  background: #ffffff;
  border: 2px solid #ffffff;
  box-shadow: 0 6px 20px rgba(15, 23, 42, 0.2);
  z-index: 5;
  transition: transform 0.2s ease, opacity 0.2s ease;
  display: none;
}

.pip-preview-container.visible {
  display: block;
}

.pip-preview-container video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transform: scaleX(-1);
}

.pip-label {
  position: absolute;
  top: 4px;
  left: 4px;
  font-size: 7.5px;
  font-weight: 700;
  text-transform: uppercase;
  background: rgba(15, 23, 42, 0.8);
  padding: 1.5px 5px;
  border-radius: 4px;
  color: #ffffff;
  letter-spacing: 0.3px;
}

/* Stage Overlay: Idle / Loading / Connecting */
.stage-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.98) 100%);
  padding: 20px;
  text-align: center;
  z-index: 4;
  gap: 10px;
}

.stage-overlay.hidden {
  display: none;
}

.stage-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #0f172a;
  box-shadow: 0 4px 14px rgba(15, 23, 42, 0.06);
}

.stage-title {
  font-size: 14px;
  font-weight: 700;
  color: #0f172a;
  letter-spacing: -0.2px;
}

.stage-desc {
  font-size: 11px;
  color: #64748b;
  line-height: 1.45;
  max-width: 230px;
}

/* Animated Spinner */
.spinner {
  width: 30px;
  height: 30px;
  border: 2.5px solid #e2e8f0;
  border-top-color: #0f172a;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Privacy Consent Dialog - Fully fits within stage square without clipping */
.consent-dialog {
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  z-index: 10;
  display: none;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding: 12px 14px;
  box-sizing: border-box;
  overflow-y: auto;
  overflow-x: hidden;
}

.consent-dialog.visible {
  display: flex;
}

.consent-dialog::-webkit-scrollbar {
  width: 4px;
}

.consent-dialog::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.12);
  border-radius: 4px;
}

.consent-content-wrapper {
  margin: auto 0;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 7px;
  max-width: 270px;
}

.consent-icon {
  width: 32px;
  height: 32px;
  border-radius: 9px;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #0f172a;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
  flex-shrink: 0;
}

.consent-icon svg {
  width: 16px;
  height: 16px;
}

.consent-title {
  font-size: 13px;
  font-weight: 700;
  color: #0f172a;
  letter-spacing: -0.2px;
  margin: 0;
  line-height: 1.2;
}

/* In-Consent Garment Preview Chip (Clothes You Are Trying) */
.consent-garment-chip {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 9px;
  padding: 5px 8px;
  box-sizing: border-box;
  text-align: left;
}

.consent-garment-thumb {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  object-fit: cover;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  flex-shrink: 0;
}

.consent-garment-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1;
}

.consent-garment-badge {
  font-size: 7.5px;
  font-weight: 700;
  text-transform: uppercase;
  color: #059669;
  letter-spacing: 0.4px;
  line-height: 1.1;
}

.consent-garment-title {
  font-size: 10.5px;
  font-weight: 600;
  color: #0f172a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.2;
}

.consent-body {
  font-size: 10.5px;
  color: #475569;
  line-height: 1.3;
  margin: 0;
  max-width: 250px;
}

.consent-points {
  display: flex;
  flex-direction: column;
  gap: 4px;
  text-align: left;
  font-size: 10px;
  color: #334155;
  width: 100%;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 6px 9px;
  box-sizing: border-box;
}

.consent-point {
  display: flex;
  align-items: center;
  gap: 6px;
  line-height: 1.25;
}

.consent-point svg {
  color: #059669;
  flex-shrink: 0;
  width: 11px;
  height: 11px;
}

.consent-actions {
  display: flex;
  gap: 8px;
  width: 100%;
  margin-top: 2px;
}

.consent-actions .primary-btn {
  padding: 8px 12px;
  font-size: 11.5px;
  border-radius: 8px;
  font-weight: 600;
  flex: 1.35;
  height: 35px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
}

.consent-actions .secondary-btn {
  padding: 8px 10px;
  font-size: 11.5px;
  border-radius: 8px;
  font-weight: 600;
  flex: 1;
  height: 35px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
}

/* Drop Zone Area & Active Garment Display */
.drop-zone {
  position: relative;
  background: #f8fafc;
  border: 1.5px dashed #cbd5e1;
  border-radius: 12px;
  padding: 10px 12px;
  display: flex;
  align-items: center;
  gap: 10px;
  transition: all 0.2s ease;
  cursor: pointer;
  box-sizing: border-box;
}

.drop-zone.has-garment {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04);
  padding: 8px 10px;
  cursor: default;
}

.drop-zone.has-garment .drop-zone-icon,
.drop-zone.has-garment .drop-zone-content {
  display: none !important;
}

.drop-zone:hover:not(.has-garment) {
  background: #ffffff;
  border-color: #0f172a;
  box-shadow: 0 4px 16px rgba(15, 23, 42, 0.05);
}

.drop-zone.dragover {
  background: #eff6ff;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.12);
  transform: scale(1.01);
}

.drop-zone-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #0f172a;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.03);
  flex-shrink: 0;
}

.drop-zone-content {
  flex: 1;
  min-width: 0;
}

.drop-zone-title {
  font-size: 12px;
  font-weight: 600;
  color: #0f172a;
  display: flex;
  align-items: center;
  gap: 6px;
}

.drop-zone-subtitle {
  font-size: 10.5px;
  color: #64748b;
  margin-top: 1px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Active Garment Card - Clothes Being Tried */
.active-garment-card {
  display: none;
  align-items: center;
  gap: 10px;
  background: transparent;
  border: none;
  padding: 0;
  width: 100%;
  box-sizing: border-box;
}

.active-garment-card.visible {
  display: flex;
}

.garment-thumb {
  width: 44px;
  height: 44px;
  border-radius: 8px;
  object-fit: cover;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  flex-shrink: 0;
}

.garment-details {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.garment-name {
  font-size: 12px;
  font-weight: 600;
  color: #0f172a;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.35;
  word-break: break-word;
}

.garment-status {
  font-size: 10px;
  color: #059669;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 4px;
}

.remove-garment-btn {
  width: 24px;
  height: 24px;
  border-radius: 6px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  color: #64748b;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.15s;
}

.remove-garment-btn:hover {
  background: #fef2f2;
  color: #dc2626;
  border-color: #fecaca;
}

/* Actions Controls */
.controls-bar {
  display: flex;
  gap: 7px;
}

.primary-btn {
  flex: 1;
  background: #0f172a;
  color: #ffffff;
  border: none;
  border-radius: 10px;
  padding: 11px 16px;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.1px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.18s ease;
  box-shadow: 0 4px 14px rgba(15, 23, 42, 0.16);
}

.primary-btn:hover {
  background: #1e293b;
  transform: translateY(-1px);
  box-shadow: 0 6px 18px rgba(15, 23, 42, 0.22);
}

.primary-btn:active {
  transform: translateY(0);
}

.primary-btn.stop {
  background: #dc2626;
  box-shadow: 0 4px 14px rgba(220, 38, 38, 0.22);
}

.primary-btn.stop:hover {
  background: #b91c1c;
}

.secondary-btn {
  background: #ffffff;
  color: #334155;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 11px 12px;
  font-size: 12.5px;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  cursor: pointer;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
  transition: all 0.15s ease;
}

.secondary-btn:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
  color: #0f172a;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
}

/* Error Notification */
.error-banner {
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 10px;
  padding: 10px 12px;
  display: none;
  align-items: flex-start;
  gap: 8px;
  color: #991b1b;
  font-size: 11.5px;
  line-height: 1.4;
}

.error-banner.visible {
  display: flex;
}

.error-icon {
  flex-shrink: 0;
  margin-top: 1px;
}

.error-msg {
  flex: 1;
}

.error-dismiss {
  background: transparent;
  border: none;
  color: #dc2626;
  cursor: pointer;
  padding: 2px;
  font-size: 14px;
}

.error-dismiss:hover {
  color: #991b1b;
}

/* Resize handle */
.resize-handle {
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 16px;
  height: 16px;
  cursor: nwse-resize;
  display: flex;
  align-items: flex-end;
  justify-content: flex-end;
  padding: 3px;
  opacity: 0.4;
  transition: opacity 0.2s;
}

.resize-handle:hover {
  opacity: 1;
}

.resize-handle svg {
  width: 10px;
  height: 10px;
  stroke: #64748b;
}

/* Hover "Try On" Button on Host Product Images */
.tryon-hover-btn {
  position: absolute;
  z-index: 2147483640;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  color: #0f172a;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 999px;
  padding: 7px 14px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: -0.1px;
  display: flex;
  align-items: center;
  gap: 6px;
  box-shadow: 0 6px 18px -2px rgba(15, 23, 42, 0.12), 0 2px 6px rgba(0, 0, 0, 0.04);
  cursor: pointer;
  pointer-events: auto;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  transform: translateY(0);
}

.tryon-hover-btn:hover {
  background: #0f172a;
  color: #ffffff;
  border-color: #0f172a;
  transform: translateY(-2px) scale(1.03);
  box-shadow: 0 10px 24px -4px rgba(15, 23, 42, 0.25);
}
`;
