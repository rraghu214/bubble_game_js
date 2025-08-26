Bubble Pop — Web version
=========================

This repository contains a browser-based version of the Bubble Pop game and a small Flask server to host it. The original desktop version used MediaPipe + OpenCV and required direct webcam access; this web version uses standard browser input (mouse/touch) so it can be hosted on AWS EC2.

Files added
- `app.py` — small Flask app serving the web UI and sound files
- `templates/index.html` — main HTML
- `static/styles.css` — styles for the game
- `static/game.js` — game logic in JavaScript
- `requirements.txt` — minimal Python dependencies

Run locally

1. Create a virtualenv and install dependencies

```powershell
python -m venv .venv; .\.venv\Scripts\Activate.ps1; pip install -r requirements.txt
```

2. Run the server

```powershell
python app.py
```

Open http://localhost:8000 in your browser.

Deploy to EC2 (quick notes)

- Launch an EC2 instance (Ubuntu/Amazon Linux). Open security group port 8000 (or use 80 and run behind reverse proxy).
- Clone this repo on the instance, install Python, create a venv, and pip install -r requirements.txt.
- Run `python app.py` or use gunicorn + systemd to run as a service and expose port 80.

Camera / hand-tracking note

This web implementation uses mouse/touch input. If you want browser-based hand tracking (so users can point their finger instead of clicking), integrate MediaPipe Hands or TensorFlow.js in `static/game.js` and map the index-finger landmark to the pointer coordinates. That avoids server-side camera access and works in the browser.
