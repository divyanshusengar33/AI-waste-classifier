EcoSort Waste Detection & Review App

1. Keep app.py, requirements.txt, and EcoSort_YOLOv8n_best.pt in the same folder.
2. Open a terminal in that folder.
3. Create/activate a virtual environment (recommended).
4. Install packages:
   python -m pip install -r requirements.txt
5. Start the app:
   python -m streamlit run app.py
6. Open the local URL Streamlit prints (usually http://localhost:8501).

If the .pt file has a different name or location, enter its full path in the app sidebar.
This app runs inference locally on your machine. Review CSV/JSON downloads are notes for analysis; they do not automatically retrain the model.
