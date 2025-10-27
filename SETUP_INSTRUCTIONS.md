# Setup Instructions for EDA Project

## Issues Found and Fixed

1. **Missing npm packages**: Frontend was missing axios, react-select, recharts, and react-beautiful-dnd
2. **Missing CSS styles**: Added proper CSS for the dashboard layout
3. **React version conflict**: react-beautiful-dnd doesn't support React 19, so using --legacy-peer-deps

## Backend Setup

1. Make sure you have Python installed
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Run migrations (if needed):
   ```bash
   python manage.py migrate
   ```
4. Start the Django backend:
   ```bash
   python manage.py runserver
   ```

## Frontend Setup

1. Navigate to frontend directory:
   ```bash
   cd frontend
   ```
2. Dependencies should already be installed with `--legacy-peer-deps`
3. Start the React app:
   ```bash
   npm start
   ```

## Running the Application

1. **Terminal 1** - Start Django backend:
   ```bash
   python manage.py runserver
   ```
   Backend will run on http://localhost:8000

2. **Terminal 2** - Start React frontend:
   ```bash
   cd frontend
   npm start
   ```
   Frontend will run on http://localhost:3000

## Verify Everything is Working

1. Backend API should be accessible at: http://localhost:8000/api/filters/
2. Frontend should load at: http://localhost:3000
3. Check browser console (F12) for any API errors

## Troubleshooting

- If you see a blank page, check the browser console (F12) for errors
- Make sure the backend is running on port 8000
- Make sure the CSV file exists at: `dashboard/data/fmcg_dataset.csv`
- Check that CORS is properly configured in Django settings


