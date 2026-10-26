# EcoSort — AI Waste Classification Frontend

A modern, responsive, and eco-friendly frontend application for **EcoSort**, powered by a fine-tuned YOLOv8 computer vision model for waste detection and disposal guidance.

Built with **React**, **TypeScript**, **Vite**, and **Tailwind CSS**, styled in the **Eco Green & White** palette (Forest green `#14532d`, Leaf green `#16a34a`, crisp white, and light grey surfaces).

---

## 🌿 Colour Palette & Design System

- **Primary:** Forest Green (`#14532d` / `#166534`)
- **Secondary / Accent:** Leaf Green (`#16a34a` / `#22c55e`)
- **Backgrounds:** Clean White (`#ffffff`) and Slate Off-White (`#f8fafc`)
- **Borders & Dividers:** Soft Slate (`#e2e8f0`)
- **Category Color Coding:**
  - **Plastic:** Warm Amber / Gold
  - **Paper & Cardboard:** Emerald Leaf Green
  - **Metal:** Silver Slate
  - **Glass:** Teal / Aquamarine
  - **Other Waste:** Soft Indigo / Purple

---

## 🚀 Key Features

1. **Dashboard / Home:**
   - Hero banner with quick file dropzone.
   - Real-time system metrics (FastAPI live health check, model class count, community review count from SQLite, and local browser analysis count).
   - 3-step AI waste workflow breakdown.
   - Supported material categories guide.

2. **AI Waste Detection & Real-Time Camera Scanner:**
   - **Upload Mode:** Multi-format image upload (`JPG`, `JPEG`, `PNG`, `WEBP` up to 10 MB) with confidence threshold slider.
   - **Live Camera Scanner (WebRTC):** Live camera viewfinder with animated laser reticle, instant frame capture, and **Continuous Auto-Scan (3s interval)** for on-the-fly waste classification.
   - **Bounding Box Overlay:** Displays classified items, confidence percentages, and instant disposal action badges over the live feed.

3. **Smart Eco-Points & Gamified Rewards:**
   - **Points System:** Earn Eco-Points for camera scans (+15 pts), photo uploads (+25 pts), and verified feedback reviews (+50 pts).
   - **Tiers & Levels:** 5 progressive eco ranks from *Seedling Recycler* to *Zero-Waste Champion*.
   - **Weekly Community Challenges:** Collective targets (e.g. divert 5 plastics, perform 3 camera scans) with point multipliers.
   - **Real-World Impact Rewards:** Redeem points to plant real mangrove trees (partnered with Eden Reforestation), get zero-waste store vouchers, and earn digital recycler certificates.

4. **Nearby Recycling Center Locator:**
   - Interactive map powered by OpenStreetMap and browser HTML5 Geolocation (`navigator.geolocation`).
   - Find verified drop-off hubs, scrap metal yards, e-waste centers, and community composting depots sorted by proximity.
   - Material filters (Plastics, Paper, Metal, Glass, E-Waste, Organic Compost) with one-click driving directions to coordinates.

5. **Environmental Impact Dashboard (Feature 6):**
   - **Carbon Telemetry:** Track total estimated waste diverted (kg), net greenhouse gas emissions avoided (kg CO₂e), mature tree sequestration equivalents, and clean energy conserved (kWh).
   - **Material Composition Breakdown:** Interactive proportional bar and breakdown table detailing weights and emissions for Plastic, Paper/Cardboard, Metal, Glass, and Other Waste.
   - **Weekly Diversion Trends:** Mon–Sun dynamic bar chart tracking daily sorting activity and peak diversion performance.
   - **Documented Assumptions Modal:** Transparent lifecycle conversion factors adhering to the **US EPA WARM (Waste Reduction Model) v15** and **IPCC** waste guidelines.
   - **One-Click Printable Impact Report:** Formats a clean, printable sustainability certificate for user recycling achievements.

6. **Multilingual Voice Assistant (Feature 7):**
   - **Voice Navigation & Querying:** Web Speech API speech-to-text (`webkitSpeechRecognition`) and text-to-speech (`speechSynthesis`).
   - **Bilingual Hindi & English Support:** Full voice command parser and spoken guidance in both English and Hindi (`hi-IN`).
   - **Direct Audio Guidance Read-Aloud:** Dedicated "Listen EN" and "सुनें (हिन्दी)" voice triggers on detected objects and throughout the waste guidance directory.
   - **Voice Assistant Modal:** Quick mic visualizer, live spoken transcript, audio playback controls, fallback typed query input, and contextual command chips (e.g., *"प्लास्टिक के नियम"*, *"Open drop-off locator"*).

7. **Waste Disposal Guidance:**
   - Full recycling and disposal directory covering all 5 classes (`Plastic`, `Paper_Cardboard`, `Metal`, `Glass`, `Other_Waste`) with integrated bilingual audio read-aloud buttons.
   - Real-world preparation best practices, contamination warnings, and municipal caveats.
   - Synchronized directly with `backend/ml/waste_guidance.py`.

8. **Human-in-the-Loop Review & Feedback:**
   - Review detection results, adjust bounding box coordinates, remove false positives, or add missing boxes.
   - Submit corrected annotation sets to `POST /feedback` (saved in SQLite `feedback.db`).

9. **Client-Side History & Live Health Status:**
   - Private local analysis history stored in your browser (`localStorage`).
   - Real-time backend status polling.

---

## 🛠️ Tech Stack

- **Framework:** React 19 + TypeScript
- **Bundler:** Vite
- **Styling:** Tailwind CSS v4 (`@tailwindcss/vite`)
- **Icons:** Lucide React (`lucide-react`)
- **API Client:** Native fetch with custom error interception

---

## 💻 Running the Application in VS Code on Windows

### 1. Start the FastAPI Backend

Open a PowerShell terminal in the project root (`EcoSort`):

```powershell
# Activate the existing Python virtual environment
.\.venv\Scripts\Activate.ps1

# Run the backend server with hot-reload
uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000
```

The backend will be accessible at:
- **API Base:** `http://127.0.0.1:8000`
- **Swagger Docs:** `http://127.0.0.1:8000/docs`
- **Health Check:** `http://127.0.0.1:8000/health`

---

### 2. Start the Frontend Development Server

Open a second PowerShell terminal in the `frontend` folder:

```powershell
cd frontend

# Install dependencies (already installed)
npm install

# Start the Vite development server
npm run dev
```

Open your browser at `http://127.0.0.1:5173`.

---

### 3. Build for Production

To create an optimized production build:

```powershell
cd frontend
npm run build
```

---

## 🔍 API Endpoints & Architecture Notes

| Endpoint | Method | Status | Notes |
| :--- | :--- | :--- | :--- |
| `/health` | `GET` | Supported | Checks backend model status and class dictionary. |
| `/classes` | `GET` | Supported | Lists registered YOLOv8 class IDs and names. |
| `/predict` | `POST` | Supported | Accepts multipart form `file` and query param `confidence`. Returns base64 annotated image and bounding boxes. |
| `/feedback` | `POST` | Supported | Saves corrected annotations into SQLite database (`feedback.db`). |
| `/feedback/count` | `GET` | Supported | Returns total verified human review records. |
| `/guidance` | `GET` | **Frontend-Mirrored** | Defined in `backend/ml/waste_guidance.py` but not exposed as an HTTP route in `main.py`. The frontend directly mirrors this definition without modifying server code. |
| `/history` | `GET` | **Client-Side (localStorage)** | Backend does not retain server-side inference history for user privacy. The frontend implements browser-based history. |
