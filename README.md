# Ready to Perform! - AI Career Matching System

**Ready to Perform!** is a comprehensive Career Path Recommendation System designed to bridge the gap between individual skills and industry needs. By leveraging Machine Learning, this application provides accurate job recommendations based on a user's skills, experience, and career aspirations.

## 🚀 Features

- **AI-Powered Recommendations**: Utilizes a trained Machine Learning model to predict and recommend the most suitable job roles.
- **User-Friendly Interface**: A modern, responsive web application built with **React** and **TypeScript**.
- **Multilingual Support**: Seamless language switching between **English** and **Bahasa Indonesia**.
- **History Tracking**: Save, view, and manage your career prediction history.
- **Batch Prediction**: Upload CSV or Excel files for bulk job classification; view results in a table or download as CSV/Excel. Results auto-delete after **1 hour**.
- **Technical Architecture**:
  - **Frontend**: React + TypeScript, Vite, Tailwind CSS (via Headless UI).
  - **Backend**: Node.js, Express.js, Python (via FastAPI).
  - **Database**: Local JSON file for persistence.

## 🛠️ Getting Started

### Prerequisites

Ensure you have the following installed:

- **Node.js** (v14 or higher)
- **Python** (v3.8 or higher)
- **npm**

### Installation

1.  **Clone the repository** (or download the source code).

2.  **Install Backend Dependencies**:
    ```bash
    cd backend
    npm install
    ```

3.  **Install Frontend Dependencies**:
    ```bash
    cd frontend
    npm install
    ```

### 🏃‍♂️ Running the Application

We recommend running both the backend and frontend simultaneously.

1.  **Start the Backend**:
    Open a terminal, navigate to the `backend` directory, and run:
    ```bash
    cd backend
    npm run dev
    # or
    npm start
    ```
    - The server will start on `http://localhost:5000`.
    - **Note**: Ensure your Python environment (e.g., Conda or venv) with `scikit-learn`, `pandas`, and `fastapi` is activated if required for the model service.

2.  **Start the Frontend**:
    Open a **new** terminal, navigate to the `frontend` directory, and run:
    ```bash
    cd frontend
    npm run dev
    ```
    - The app will open at `http://localhost:5173`.
3. **Run the FastAPI model server (if not already running)**:
    Open a **new** terminal, navigate to the `models` directory, and run:
    ```bash
    cd models
    .\venv313\Scripts\python.exe -m uvicorn main:app --reload --port 8000
    ```
    - The model server will start on `http://localhost:8000`.

### Batch Prediction (CSV / Excel)

1. Open the app and switch to the **Batch Prediction** tab.
2. Download the template via **Download Template**, or prepare a file with columns:
   - `experience_desc` — work experience description
   - `cv_summary` — CV summary
   - `num` — years of experience (aliases: `years_experience`, `tahun_pengalaman`)
   
   Alternatively use `text` + `num` (same as the single prediction API).
3. Upload a `.csv` or `.xlsx` file (max **500 rows**, **5 MB**).
4. Wait for processing; view results in the table or download CSV/Excel.
5. Results are stored for **1 hour**, then removed automatically.

**Backend environment variables (optional):**

| Variable | Default | Description |
|----------|---------|-------------|
| `BATCH_RETENTION_MS` | `3600000` | How long batch results are kept (1 hour) |
| `BATCH_MAX_ROWS` | `500` | Maximum rows per upload |
| `BATCH_CLEANUP_INTERVAL_MS` | `300000` | Cleanup interval (5 minutes) |
| `BATCH_MAX_FILE_BYTES` | `5242880` | Max upload size (5 MB) |
| `VITE_API_URL` | `http://localhost:5000` | Frontend API base URL |

**Batch API endpoints:**

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/batch/template` | Download CSV template |
| `POST` | `/api/batch/predictions` | Upload file (`multipart/form-data`, field `file`) |
| `GET` | `/api/batch/predictions` | List active batch jobs |
| `GET` | `/api/batch/predictions/:id` | Job status and results |
| `GET` | `/api/batch/predictions/:id/download?format=csv\|xlsx` | Download results |
| `DELETE` | `/api/batch/predictions/:id` | Delete a batch job |

**Run batch API test** (requires backend + FastAPI running):

```bash
cd backend
node test/batch.test.js
```

## 📁 Project Structure

```
Capstone-Project/
├── frontend/          # React + TypeScript Application
│   ├── src/
│   │   ├── components/  # UI Components
│   │   ├── contexts/    # React Contexts (Language, etc.)
│   │   ├── services/    # API Call Services
│   │   └── App.jsx      # Main Application
│   └── vite.config.js   # Build Configuration
├── backend/           # Node.js + Express Application
│   ├── src/
│   │   ├── controllers/ # Request Handlers
│   │   ├── routes/      # API Routes
│   │   ├── services/    # Business Logic & AI Integration
│   │   └── app.js       # Express Server Entry Point
│   ├── ai_model/        # Machine Learning Model files
│   └── package.json     # Backend Dependencies
├── models/              # FastAPI Model Server
│   ├── main.py          # FastAPI Application
│   ├── model.pkl        # Trained Machine Learning Model
│   ├── requirements.txt # FastAPI Dependencies
│   └── README.md        # Model Server Instructions
└── README.md          # This file
```

## 🤝 Contributing

Contributions are welcome! This is a capstone project, and we encourage improvements to the model, UI, and features.

## 📝 License

This project is developed as part of an academic capstone project.


**Production Checklist**

- Set required environment variables in `backend/.env.example` and `frontend/.env.example`.
  - Backend: `JWT_SECRET`, `PGHOST`, `PGDATABASE`, `PGUSER`, `PGPASSWORD`, `FRONTEND_URL`, `FASTAPI_URL`.
  - Frontend: `VITE_API_URL`.
- Do not store secrets in repository; use a secure secrets manager or environment variables.
- Run `npm install --production` in `backend` and build frontend for production.
- Ensure `NODE_ENV=production` is set for all production processes.
- Verify CORS is configured (`FRONTEND_URL`) and `JWT_SECRET` is set before starting the server.
- Remove or archive development notebooks and sample data if not required in production.
- Do not use local API defaults in production builds; set `VITE_API_URL` explicitly.
- Use a process manager (e.g., `pm2`, systemd) to run the backend in production.

## Unsorted

exceljs currently depends on uuid version flagged by npm audit.
Risk accepted because:
- vulnerability is moderate
- not directly exposed
- safer than previous xlsx prototype pollution issue
