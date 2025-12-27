"""Simple wrapper to run the Flask app using Waitress for Windows stability."""
import sys
import os
import traceback

# Ensure we're in the right directory
os.chdir(os.path.dirname(os.path.abspath(__file__)))

try:
    from waitress import serve
    from app import app
    
    print("Starting server on http://127.0.0.1:5000")
    serve(app, host='127.0.0.1', port=5000)
except Exception as e:
    print(f"ERROR: {e}")
    traceback.print_exc()
    input("Press Enter to exit...")
