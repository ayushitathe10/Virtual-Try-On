export const WIDGET_STYLES = `
:host {
  all: initial;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  color-scheme: dark;
}

*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

.tryon-widget-container {
  position: fixed;
  top: 40px;
  right: 40px;
  width: 380px;
  min-width: 320px;
  max-width: 90vw;
  background: rgba(15, 23, 42, 0.88);
  backdrop-filter: blur(24px) saturate(180%);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 20px;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.65), 0 0 0 1px rgba(255, 255, 255, 0.08);
  color: #f8fafc;
  z-index: 2147483647;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: box-shadow 0.25s ease, transform 0.2s ease, opacity 0.25s ease;
  user-select: none;
}

.tryon-widget-container.minimized {
  width: 260px;
  min-width: 240px;
}

.tryon-widget-container.minimized .widget-body {
  display: none;
}

.tryon-widget-container:focus-within {
  box-shadow: 0 28px 70px rgba(0, 0, 0, 0.75), 0 0 0 1px rgba(99, 102, 241, 0.4);
}

/* Header bar */
.widget-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: rgba(30, 41, 59, 0.65);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
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
  width: 24px;
  height: 24px;
  border-radius: 6px;
  background: linear-gradient(135deg, #6366f1, #06b6d4);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.5);
}

.brand-icon svg {
  width: 14px;
  height: 14px;
  fill: #ffffff;
}

.brand-title {
  font-size: 13.5px;
  font-weight: 700;
  letter-spacing: 0.3px;
  background: linear-gradient(135deg, #ffffff 30%, #cbd5e1);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  display: flex;
  align-items: center;
  gap: 6px;
}

.live-badge {
  font-size: 9.5px;
  font-weight: 700;
  text-transform: uppercase;
  padding: 2px 6px;
  border-radius: 999px;
  letter-spacing: 0.5px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.live-badge.idle {
  background: rgba(148, 163, 184, 0.2);
  color: #94a3b8;
}

.live-badge.connecting {
  background: rgba(234, 179, 8, 0.2);
  color: #facc15;
}

.live-badge.live {
  background: rgba(16, 185, 129, 0.2);
  color: #34d399;
}

.live-badge.error {
  background: rgba(239, 68, 68, 0.2);
  color: #f87171;
}

.pulse-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

.live-badge.live .pulse-dot {
  box-shadow: 0 0 8px currentColor;
  animation: pulseLive 1.5s infinite ease-in-out;
}

@keyframes pulseLive {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.4); opacity: 0.6; }
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.icon-btn {
  background: transparent;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 5px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
}

.icon-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #f8fafc;
}

.icon-btn.close-btn:hover {
  background: rgba(239, 68, 68, 0.2);
  color: #f87171;
}

/* Body */
.widget-body {
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* Video Stage */
.video-stage {
  position: relative;
  width: 100%;
  aspect-ratio: 3 / 4;
  background: #020617;
  border-radius: 14px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.1);
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

/* PiP Webcam Preview */
.pip-preview-container {
  position: absolute;
  bottom: 12px;
  right: 12px;
  width: 86px;
  aspect-ratio: 3 / 4;
  border-radius: 10px;
  overflow: hidden;
  background: #0f172a;
  border: 1.5px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.7);
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
  font-size: 8px;
  font-weight: 700;
  text-transform: uppercase;
  background: rgba(0, 0, 0, 0.6);
  padding: 1px 4px;
  border-radius: 4px;
  color: #94a3b8;
}

/* Stage Overlay: Idle / Loading / Connecting */
.stage-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: radial-gradient(circle at center, rgba(30, 41, 59, 0.75), rgba(15, 23, 42, 0.95));
  padding: 20px;
  text-align: center;
  z-index: 4;
  gap: 12px;
}

.stage-overlay.hidden {
  display: none;
}

.stage-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: rgba(99, 102, 241, 0.15);
  border: 1px solid rgba(99, 102, 241, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #818cf8;
}

.stage-title {
  font-size: 14px;
  font-weight: 600;
  color: #f1f5f9;
}

.stage-desc {
  font-size: 11.5px;
  color: #94a3b8;
  line-height: 1.4;
  max-width: 220px;
}

/* Animated Spinner */
.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid rgba(99, 102, 241, 0.2);
  border-top-color: #6366f1;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Drop Zone Area */
.drop-zone {
  position: relative;
  background: rgba(30, 41, 59, 0.45);
  border: 1.5px dashed rgba(255, 255, 255, 0.18);
  border-radius: 12px;
  padding: 12px;
  display: flex;
  align-items: center;
  gap: 12px;
  transition: all 0.2s ease;
  cursor: pointer;
}

.drop-zone:hover {
  background: rgba(30, 41, 59, 0.65);
  border-color: rgba(99, 102, 241, 0.5);
}

.drop-zone.dragover {
  background: rgba(99, 102, 241, 0.15);
  border-color: #6366f1;
  box-shadow: 0 0 16px rgba(99, 102, 241, 0.35);
  transform: scale(1.01);
}

.drop-zone-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.06);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #818cf8;
  flex-shrink: 0;
}

.drop-zone-content {
  flex: 1;
  min-width: 0;
}

.drop-zone-title {
  font-size: 12.5px;
  font-weight: 600;
  color: #f1f5f9;
  display: flex;
  align-items: center;
  gap: 6px;
}

.drop-zone-subtitle {
  font-size: 11px;
  color: #94a3b8;
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Active Garment Card */
.active-garment-card {
  display: none;
  align-items: center;
  gap: 10px;
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(99, 102, 241, 0.3);
  border-radius: 10px;
  padding: 8px 10px;
  width: 100%;
}

.active-garment-card.visible {
  display: flex;
}

.garment-thumb {
  width: 42px;
  height: 42px;
  border-radius: 6px;
  object-fit: cover;
  background: #0f172a;
  border: 1px solid rgba(255, 255, 255, 0.1);
  flex-shrink: 0;
}

.garment-details {
  flex: 1;
  min-width: 0;
}

.garment-name {
  font-size: 12px;
  font-weight: 600;
  color: #f8fafc;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.garment-status {
  font-size: 10.5px;
  color: #34d399;
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 2px;
}

.remove-garment-btn {
  background: transparent;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 4px;
  border-radius: 6px;
  transition: all 0.15s;
}

.remove-garment-btn:hover {
  background: rgba(239, 68, 68, 0.2);
  color: #f87171;
}

/* Quick preset samples bar */
.quick-samples-bar {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.samples-label {
  font-size: 10.5px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #64748b;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.samples-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
}

.sample-chip {
  background: rgba(30, 41, 59, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  padding: 6px 4px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.sample-chip:hover {
  background: rgba(99, 102, 241, 0.2);
  border-color: rgba(99, 102, 241, 0.4);
  transform: translateY(-1px);
}

.sample-thumb {
  width: 26px;
  height: 26px;
  border-radius: 4px;
  object-fit: cover;
}

.sample-title {
  font-size: 9.5px;
  font-weight: 500;
  color: #cbd5e1;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

/* Actions Controls */
.controls-bar {
  display: flex;
  gap: 8px;
}

.primary-btn {
  flex: 1;
  background: linear-gradient(135deg, #6366f1, #4f46e5);
  color: #ffffff;
  border: none;
  border-radius: 10px;
  padding: 10px 14px;
  font-size: 13px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 14px rgba(99, 102, 241, 0.4);
}

.primary-btn:hover {
  background: linear-gradient(135deg, #4f46e5, #4338ca);
  transform: translateY(-1px);
  box-shadow: 0 6px 18px rgba(99, 102, 241, 0.5);
}

.primary-btn:active {
  transform: translateY(0);
}

.primary-btn.stop {
  background: linear-gradient(135deg, #ef4444, #dc2626);
  box-shadow: 0 4px 14px rgba(239, 68, 68, 0.4);
}

.primary-btn.stop:hover {
  background: linear-gradient(135deg, #dc2626, #b91c1c);
}

.secondary-btn {
  background: rgba(30, 41, 59, 0.6);
  color: #cbd5e1;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  padding: 10px 12px;
  font-size: 12.5px;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.secondary-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #ffffff;
}

/* Error Notification */
.error-banner {
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.35);
  border-radius: 10px;
  padding: 10px 12px;
  display: none;
  align-items: flex-start;
  gap: 8px;
  color: #fca5a5;
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
  color: #fca5a5;
  cursor: pointer;
  padding: 2px;
}

/* Privacy Consent Dialog */
.consent-dialog {
  position: absolute;
  inset: 0;
  background: rgba(15, 23, 42, 0.96);
  backdrop-filter: blur(12px);
  z-index: 10;
  display: none;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px 20px;
  text-align: center;
  gap: 14px;
}

.consent-dialog.visible {
  display: flex;
}

.consent-icon {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  background: rgba(99, 102, 241, 0.18);
  border: 1px solid rgba(99, 102, 241, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #818cf8;
}

.consent-title {
  font-size: 15px;
  font-weight: 700;
  color: #f8fafc;
}

.consent-body {
  font-size: 12px;
  color: #94a3b8;
  line-height: 1.5;
  max-width: 290px;
}

.consent-points {
  display: flex;
  flex-direction: column;
  gap: 6px;
  text-align: left;
  font-size: 11.5px;
  color: #cbd5e1;
  width: 100%;
  background: rgba(30, 41, 59, 0.5);
  border-radius: 10px;
  padding: 10px 12px;
}

.consent-point {
  display: flex;
  align-items: center;
  gap: 6px;
}

.consent-point svg {
  color: #34d399;
  flex-shrink: 0;
}

.consent-actions {
  display: flex;
  gap: 8px;
  width: 100%;
  margin-top: 4px;
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
  opacity: 0.5;
  transition: opacity 0.2s;
}

.resize-handle:hover {
  opacity: 1;
}

.resize-handle svg {
  width: 10px;
  height: 10px;
  fill: #94a3b8;
}

/* Hover "Try On" Button on Host Product Images */
.tryon-hover-btn {
  position: absolute;
  z-index: 2147483640;
  background: rgba(15, 23, 42, 0.9);
  backdrop-filter: blur(10px);
  color: #ffffff;
  border: 1px solid rgba(99, 102, 241, 0.5);
  border-radius: 20px;
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.4), 0 0 12px rgba(99, 102, 241, 0.4);
  cursor: pointer;
  pointer-events: auto;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  transform: translateY(0);
}

.tryon-hover-btn:hover {
  background: #4f46e5;
  transform: translateY(-2px) scale(1.04);
  box-shadow: 0 10px 24px rgba(79, 70, 229, 0.6);
}
`;
