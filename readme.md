# Kerala Career Compass 🧭

An intelligent, free career guidance platform for Kerala students (SSLC to M.Tech) — providing visual career roadmaps, college comparison, fee transparency, and an AI counselor.

**Live:** [your-vercel-url.vercel.app]  
**API:** [your-render-url.onrender.com]

---

## Project Structure
sslc 1/
├── kerala-compass/          ← React frontend (Vite + Tailwind)
│   ├── src/
│   │   ├── App.jsx          ← Entire frontend (single file)
│   │   ├── main.jsx         ← React entry point
│   │   └── index.css        ← Tailwind base styles
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── .env                 ← VITE_API_URL=http://localhost:5000
│
└── backend/                 ← Node.js + Express API (single file)
├── server.js            ← Entire backend (routes + seed + schema)
├── package.json
├── .env                 ← MONGO_URI, GROQ_API_KEY, CLIENT_ORIGIN
└── .gitignore

---

## Architecture
Student Browser
↓
React (Vercel)          ← Static hosting, free forever
↓ fetch()
Express API (Render)    ← Free web service, sleeps after 15min inactivity
↓ mongoose
MongoDB Atlas (Free M0) ← 512MB storage, always on
↓ (for chat)
Groq API (Free)         ← Llama 3.1 8B, 14,400 req/day free

### Data Flow
1. Student selects education level + interest field on frontend
2. React calls `GET /api/roadmap?level=sslc&field=engineering`
3. Express returns matching career path JSON
4. React calls `GET /api/colleges?field=engineering&district=Ernakulam`
5. Express queries MongoDB, returns college array with fees
6. Student types in chatbot → `POST /api/chat`
7. Express fetches 8 relevant colleges from MongoDB, injects as AI context
8. Groq (Llama 3.1) generates grounded answer in English or Malayalam
9. Response displayed with structured formatting

---

## Tech Stack

| Layer     | Technology                        | Cost  |
|-----------|-----------------------------------|-------|
| Frontend  | React 18, Vite, Tailwind CSS, Framer Motion | Free |
| Backend   | Node.js, Express.js, Mongoose     | Free  |
| Database  | MongoDB Atlas M0                  | Free  |
| AI/Chat   | Groq API (Llama 3.1 8B Instant)  | Free  |
| Hosting   | Vercel (frontend)                 | Free  |
| Hosting   | Render.com (backend)              | Free  |
| Keep-alive| UptimeRobot                       | Free  |

**Total monthly cost: ₹0**

---

## Local Development

### Prerequisites
- Node.js 20+
- MongoDB Atlas account (free) — https://mongodb.com/atlas
- Groq API key (free) — https://console.groq.com

### Backend Setup
```bash
cd backend
npm install
```

Create `backend/.env`:
PORT=5000
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/kerala_compass
GROQ_API_KEY=gsk_your_key_here
CLIENT_ORIGIN=http://localhost:5173

```bash
node server.js
# Output: ✅ MongoDB connected
#         ✅ Auto-seeded 50 colleges
#         🚀 Server → http://localhost:5000
```

### Frontend Setup
```bash
cd kerala-compass
npm install
```

Create `kerala-compass/.env`:
VITE_API_URL=http://localhost:5000

```bash
npm run dev
# Open http://localhost:5173
```

### Run Both Together
Open two terminals:
```bash
# Terminal 1
cd backend && node server.js

# Terminal 2  
cd kerala-compass && npm run dev
```

---

## API Reference

### Colleges
GET /api/colleges
?field=engineering
&district=Ernakulam
&type=Government
&naac=A
&fee_max=50000
&page=1
&limit=50
GET /api/colleges/:id

### Roadmap
GET /api/roadmap?level=sslc&field=engineering
→ Returns array of career path objects with steps

### Chat
POST /api/chat
Body: {
"message": "What is the fee for CET Trivandrum?",
"context": { "field": "engineering", "district": "Thiruvananthapuram" }
}
→ { "reply": "...", "lang": "english" }

### Report
POST /api/report
Body: { "college_id": "...", "message": "Fee is wrong" }

---

## Database — Adding Colleges

### Option 1: MongoDB Compass (Easiest)
1. Download MongoDB Compass — https://mongodb.com/products/compass
2. Connect with your MONGO_URI
3. Open `kerala_compass` → `colleges` collection
4. Click "Add Data" → "Insert Document"
5. Paste college JSON following the schema in `server.js`

### Option 2: Edit seed array
Add to the `SEED` array in `backend/server.js`, then:
```bash
# Drop existing colleges first, then restart server
```
In MongoDB Compass: delete all documents in `colleges` collection → restart server → it auto-seeds again.

---

## Web Scraping — Current Status

**Phase 1 (Current):** 50+ colleges manually seeded into MongoDB. Data maintained manually each admission season.

**Phase 3 (Planned):** Python + Playwright scraper:
college website → Playwright (GPU accelerated) → raw text
→ Gemini/Groq API (extract JSON) → MongoDB upsert

Limitation: Many Kerala college sites block scrapers or publish PDFs. The scraper works on ~60% of target sites. PDF scraping uses `pdfplumber`.

---

## Deployment

### Step 1 — Push to GitHub

Create two repos on github.com: `kerala-compass-frontend` and `kerala-compass-backend`

```bash
# Backend
cd backend
git init
git add .
git commit -m "initial commit"
git remote add origin https://github.com/YOUR_USERNAME/kerala-compass-backend.git
git push -u origin main

# Frontend
cd kerala-compass
git init
git add .
git commit -m "initial commit"
git remote add origin https://github.com/YOUR_USERNAME/kerala-compass-frontend.git
git push -u origin main
```

### Step 2 — Deploy Backend on Render

1. Go to https://render.com → Sign up with GitHub
2. New → Web Service → Connect `kerala-compass-backend` repo
3. Settings:
   - **Runtime:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
4. Environment Variables → Add:
   - `MONGO_URI` = your Atlas connection string
   - `GROQ_API_KEY` = your Groq key
   - `CLIENT_ORIGIN` = `https://your-vercel-url.vercel.app`
5. Click Deploy → Wait 2-3 minutes
6. Copy your Render URL: `https://kerala-compass-backend.onrender.com`

**Keep Render alive (free tier sleeps after 15min):**
1. Go to https://uptimerobot.com → Create free account
2. New Monitor → HTTP(s) → URL = `https://kerala-compass-backend.onrender.com/health`
3. Monitoring interval: every 5 minutes
4. This prevents the free tier from sleeping

### Step 3 — Deploy Frontend on Vercel

1. Go to https://vercel.com → Sign up with GitHub
2. New Project → Import `kerala-compass-frontend` repo
3. Framework: **Vite** (auto-detected)
4. Environment Variables → Add:
   - `VITE_API_URL` = `https://kerala-compass-backend.onrender.com`
5. Click Deploy → Wait 1 minute
6. Your site is live at `https://kerala-compass-frontend.vercel.app`

### Step 4 — Update CORS on Render

Go back to Render → your backend service → Environment Variables → Update:
CLIENT_ORIGIN = https://kerala-compass-frontend.vercel.app
Click "Save Changes" → Render redeploys automatically.

---

## Future Scope

| Feature                  | Priority | Description |
|--------------------------|----------|-------------|
| Web scraping engine      | High     | Python + Playwright auto-fetch fees each admission season |
| Full Malayalam UI        | High     | Complete UI translation for rural students |
| PWA / offline support    | Medium   | Work without internet for rural Kerala |
| Placement & salary data  | Medium   | Average packages and top recruiters per college |
| Admission deadline alerts| Medium   | KEAM, NEET, LET deadline notifications |
| Scholarship database     | Medium   | All Kerala state scholarships mapped to colleges |
| NAAC auto-update         | Low      | Auto-fetch from naac.gov.in |
| Student reviews          | Low      | Verified student ratings |

---

## Data Sources

- Kerala college official websites
- LBS Centre for Science and Technology (lbscentre.ac.in)
- KEAM official portal (cee.kerala.gov.in)
- NAAC (naac.gov.in)
- Kerala University of Health Sciences (kuhs.ac.in)
- APJ Abdul Kalam Technological University (ktu.edu.in)

---

## Developed by

**Mohammed Irfan A**  
Built for Kerala students — completely free, always.