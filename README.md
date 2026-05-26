# House Prediction App

This project is a house price prediction application with a Next.js frontend and a Python backend.

## Prerequisites

- Python 3.8+
- Node.js 14+
- pip
- npm

## Backend Setup

1.  **Navigate to the backend directory:**
    ```bash
    cd backend
    ```

2.  **Create a virtual environment:**
    ```bash
    python -m venv .venv
    ```

3.  **Activate the virtual environment:**
    - On macOS/Linux:
      ```bash
      source .venv/bin/activate
      ```
    - On Windows:
      ```bash
      .venv\Scripts\activate
      ```

4.  **Install the required packages:**
    ```bash
    pip install -r requirements.txt
    ```

5.  **Train the model:**
    ```bash
    python train.py
    ```

6.  **Run the backend server:**
    The Flask server will start on `http://127.0.0.1:5000`.
    ```bash
    python main.py
    ```

## Frontend Setup

1.  **Navigate to the frontend directory:**
    ```bash
    cd frontend
    ```

2.  **Install the dependencies:**
    ```bash
    npm install
    ```

3.  **Run the development server:**
    The Next.js app will start on `http://localhost:3000`.
    ```bash
    npm run dev
    ```

## How to Use

1.  Make sure both the backend and frontend servers are running.
2.  Open your browser and go to `http://localhost:3000`.
3.  Fill in the form with the house details and submit to get the predicted price.
