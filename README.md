# Virtual-Try-On — Real-Time TryOn Live Chrome Extension (Manifest V3)

[![Manifest V3](https://img.shields.io/badge/Chrome-Manifest%20V3-blue?logo=googlechrome)](https://developer.chrome.com/docs/extensions/mv3/intro/)
[![Decart AI](https://img.shields.io/badge/AI%20Model-Decart%20Lucy%20V--TON%203.5-6366f1)](https://docs.decart.ai)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178c6?logo=typescript)](https://www.typescriptlang.org/)
[![WebRTC](https://img.shields.io/badge/Streaming-WebRTC%20LiveKit-34d399)](https://webrtc.org/)

**TryOn Live (Virtual-Try-On)** is a Chrome extension (Manifest V3) that lets users try on any clothing item from any fashion website (including **Myntra**, **Zara**, **H&M**, **Uniqlo**, **Ajio**, **ASOS**) onto a sleek floating webcam mirror and see themselves wearing the garment in real time.


Powered by **Decart's Lucy V-TON** (`lucy-vton-3.5`) via the official `@decartai/sdk`.

---

## 🌟 Key Features

1. **Floating Dark Glassmorphism Widget (Shadow DOM)**
   - Isolated inside an open Shadow DOM root (`#tryon-live-root`) so host site CSS (z-indices, resets, frameworks) cannot distort the widget.
   - Smoothly draggable header bar with viewport boundary constraints.
   - Resizable corner handle (320px – 560px).
   - Collapse / minimize mode.

2. **Decart Lucy V-TON Real-Time WebRTC Integration**
   - Live transformed video stream rendered over low-latency WebRTC.
   - Seamless mid-session garment swapping via `realtimeClient.setImage(blob, { prompt, enhance: true })` without reconnecting or resetting the video feed.
   - Dual-view Picture-in-Picture (PiP) inset preview of the user's raw webcam for posture alignment.
   - Camera mirror flip toggle.

3. **CORS-Bypassing Garment Extraction**
   - **Drag & Drop**: Drag any `<img>` or product card from the host page or drop an image file directly into the widget drop zone.
   - **Right-Click Context Menu**: Right-click any garment photo on any website and select `"✨ Try this garment on with TryOn Live"`.
   - **Hover "+ Try On" Button**: Automatically appears over fashion store product photos for instant 1-click try-on.
   - **Multi-Attribute Resolution**: Handles complex e-commerce image implementations: `srcset` (automatically picks highest resolution), `data-src`, `data-original`, `data-zoom-image`, `data-highres`, and CSS `background-image`.
   - **Background Worker Proxy**: Image bytes are fetched via the extension service worker (`<all_urls>` host permissions) to bypass CORS and anti-hotlinking headers.

4. **Privacy & Security First**
   - **Zero Storage**: No images or video frames are ever saved on disk or server. Everything is processed purely in-memory.
   - **Clean Hardware Release**: Camera tracks are explicitly stopped (`track.stop()`) the moment the widget closes or camera is paused, immediately turning off the webcam indicator light.
   - **Explicit Consent**: A privacy consent modal is presented before camera activation.

5. **Secure Ephemeral Token Architecture**
   - The permanent `DECART_API_KEY` stays strictly protected inside the Node.js backend.
   - The server calls `client.tokens.create({ expiresIn: 600, allowedModels: ["lucy-vton-3.5"] })` to mint 10-minute ephemeral client tokens.

---

## 🏗️ Architecture

```
VirtualTryOn/
├── package.json              # Root workspace scripts
├── README.md                 # Complete documentation & test checklist
│
├── server/                   # Token Minting & Proxy Backend (Node.js + Express)
│   ├── .env                  # Environment variables (DECART_API_KEY)
│   ├── .env.example          # Sample environment file
│   ├── package.json
│   ├── tsconfig.json
│   ├── src/
│   │   └── index.ts          # Express server with POST /api/token & GET /api/health
│   └── public/
│       └── index.html        # Built-in mock fashion store for instant testing
│
└── extension/                # Chrome Extension (Manifest V3)
    ├── manifest.json         # Manifest V3 configuration
    ├── package.json
    ├── tsconfig.json
    ├── build.cjs             # esbuild bundler script (ESM background + IIFE content)
    ├── icons/                # High-res app icons (16px, 48px, 128px)
    ├── src/
    │   ├── background/
    │   │   └── index.ts      # Service worker: context menu, token/image relay
    │   ├── content/
    │   │   ├── index.ts      # Content script entry point
    │   │   ├── widget.ts     # Shadow DOM floating draggable widget
    │   │   ├── styles.ts     # Glassmorphism dark CSS for Shadow DOM
    │   │   ├── decartService.ts # @decartai/sdk WebRTC Lucy V-TON manager
    │   │   └── garmentExtractor.ts # Image extraction, srcset parser, drag-drop
    │   ├── popup/
    │   │   ├── popup.html    # Extension popup UI
    │   │   ├── popup.css     # Popup styling
    │   │   └── popup.ts      # Server health check, settings, camera test
    │   └── types/
    │       └── index.ts      # Shared TypeScript types & message protocols
    └── dist/                 # Loadable unpacked folder for chrome://extensions
        ├── manifest.json
        ├── background.js
        ├── content.js
        ├── popup.html
        ├── popup.js
        ├── popup.css
        └── icons/
```

---

## 🚀 Quick Start Guide

### Step 1: Clone and Configure Environment

Navigate to the project directory and create the `.env` file in `/server`:

```bash
cd server
cp .env.example .env
```

Open `server/.env` and insert your Decart API key:

```env
PORT=3001
DECART_API_KEY=dct_your_decart_api_key_here
ALLOWED_ORIGINS=*
```

> **Note**: Obtain your API key from the [Decart AI Platform](https://platform.decart.ai).

---

### Step 2: Install Dependencies & Build

From the root project folder:

```bash
# 1. Build server
npm --prefix server run build

# 2. Build extension bundle into extension/dist
npm --prefix extension run build
```

Or run development mode:

```bash
# Start server in watch mode
npm run server:dev

# Watch extension changes (in another terminal)
npm run ext:watch
```

---

### Step 3: Run the Token Server

Start the server on `http://localhost:3001`:

```bash
npm --prefix server run start
```

Verify that the health check responds:
- Open: `http://localhost:3001/api/health`
- Expected response: `{"status":"ok","service":"TryOn Live Token Server","model":"lucy-vton-3.5","hasApiKey":true}`

---

### Step 4: Load Extension in Google Chrome

1. Open Google Chrome and navigate to `chrome://extensions/`.
2. Toggle **Developer mode** (top right switch).
3. Click the **Load unpacked** button (top left).
4. Select the directory: `d:\VirtualTryOn\extension\dist`.
5. The **TryOn Live** extension icon will now appear in your Chrome toolbar. Pin it for easy access!

---

## 🧪 Testing Checklist & Verification

### Test 1: Built-in Mock Fashion Store (`http://localhost:3001/test`)

1. Open `http://localhost:3001/test` in Google Chrome.
2. The page displays the **AURA Fashion Studio** test catalog containing 8 curated garments (Leather Biker Jacket, Denim Shirt, Ribbed Knit, Trench Coat, Green Hoodie, Wool Blazer, Poplin Shirt, Floral Dress).
3. Click the **TryOn Live** extension icon in your Chrome toolbar -> Click **Open TryOn Mirror on Page**.
4. The floating glassmorphism mirror widget appears in the top-right corner.
5. Click **Start Camera**:
   - The privacy consent dialog appears explaining encrypted WebRTC streaming.
   - Click **Accept & Start** -> Allow camera in the browser prompt.
   - The live camera feed initializes and connects to Decart's Lucy V-TON stream.
6. **Drag & Drop**:
   - Drag the *Classic Leather Biker Jacket* directly from the webpage into the widget's drop zone.
   - Notice the widget updates: "Fitting garment to your live stream..." -> "Garment applied!".
   - The AI stream now renders the biker jacket fitted onto your body in real time!
7. **Mid-Session Swapping**:
   - Without stopping the camera, drag the *Relaxed Indigo Denim Overshirt* into the widget.
   - The garment swaps seamlessly without any video stream interruption.
8. **Quick Presets**:
   - Click any of the 4 quick sample chips inside the widget (Biker Jacket, Denim Shirt, Knit Sweater, Trench Coat) to immediately swap items.
9. **Controls**:
   - Click the **Mirror** button to toggle camera horizontal flip.
   - Click the **PiP** button to show/hide your original webcam inset for posture reference.
   - Drag the widget by its header to reposition anywhere on the screen.
   - Resize the widget using the bottom-right grip.
10. Click the **Close (X)** button -> Verify that your webcam indicator light turns off immediately.

---

### Test 2: Live Fashion Store — Zara (`https://www.zara.com`)

1. Navigate to [Zara Women or Men jackets](https://www.zara.com).
2. Click the TryOn Live toolbar icon -> Click **Open TryOn Mirror on Page**.
3. Click **Start Camera**.
4. Right-click any product image -> Select **"✨ Try this garment on with TryOn Live"**.
5. The background worker fetches the high-res image (bypassing Zara's CDN CORS restrictions) and applies it to the Decart session.
6. Alternatively, hover over any product image and click the floating **"+ Try On"** button.

---

### Test 3: Live Fashion Store — H&M (`https://www2.hm.com`)

1. Navigate to [H&M New Arrivals](https://www2.hm.com).
2. Open the TryOn Live mirror widget.
3. Drag any product image from the H&M catalog into the widget drop zone.
4. The `GarmentExtractor` parses H&M's responsive `srcset` and `data-src` to extract the highest-resolution photo and streams it to Lucy V-TON.

---

### Test 4: Live Fashion Store — Uniqlo (`https://www.uniqlo.com`)

1. Navigate to [Uniqlo Tops & Outerwear](https://www.uniqlo.com).
2. Drag any fleece, flannel, or down jacket onto the TryOn Live mirror.
3. Verify that the garment fits realistically over your movements.

---

## 🔒 Privacy & Data Handling Guarantee

- **No Video Storage**: Video frames are transmitted directly over WebRTC to Decart's Lucy V-TON inference cluster and are processed in volatile GPU memory. Neither the extension nor the local server stores video frames.
- **No Image Storage**: Garment images are retrieved into transient browser Blobs and forwarded to the Decart session.
- **Hardware Teardown**: Closing or stopping the widget calls `MediaStreamTrack.stop()` on all video tracks, guaranteeing camera deactivation.

---

## 🛠️ API & Decart SDK Reference

This project follows Decart's official `@decartai/sdk` specifications:

- **Server-Side Token Minting**:
  ```typescript
  import { createDecartClient } from "@decartai/sdk";

  const client = createDecartClient({ apiKey: process.env.DECART_API_KEY });
  const token = await client.tokens.create({
    expiresIn: 600, // 10 minutes
    allowedModels: ["lucy-vton-3.5", "lucy-vton-latest"],
  });
  // Returns: { apiKey: "ek_...", expiresAt: "..." }
  ```

- **Client-Side Realtime Connection**:
  ```typescript
  import { createDecartClient, models } from "@decartai/sdk";

  const client = createDecartClient({ apiKey: ephemeralClientToken });
  const model = models.realtime("lucy-vton-3.5");

  const realtimeClient = await client.realtime.connect(cameraStream, {
    model,
    speed: "fast",
    onRemoteStream: (stream) => {
      videoElement.srcObject = stream;
    },
  });

  // Dynamic Garment Swapping mid-session
  await realtimeClient.setImage(garmentBlob, {
    prompt: "Realistic virtual try-on fitting this garment with accurate fabric drape",
    enhance: true,
  });

  // Cleanup
  realtimeClient.disconnect();
  cameraStream.getTracks().forEach((track) => track.stop());
  ```

---

## 📋 Project Status

| Component | Status | Details |
|---|---|---|
| Server (`/server`) | ✅ Ready | Express, CORS, Rate Limit, Token Minting (`/api/token`), Mock Store (`/test`) |
| Extension Manifest | ✅ Ready | Manifest V3, permissions: `activeTab`, `storage`, `scripting`, `contextMenus` |
| Floating Widget | ✅ Ready | Open Shadow DOM, dark glassmorphism, draggable & resizable |
| Real-time WebRTC | ✅ Ready | Decart Lucy V-TON (`lucy-vton-3.5`), low-latency streaming |
| Garment Selection | ✅ Ready | Drag-and-drop, context menu, hover button, mid-session swapping |
| Bundler & Dist | ✅ Ready | esbuild bundle produced in `extension/dist`, loadable unpacked in Chrome |
