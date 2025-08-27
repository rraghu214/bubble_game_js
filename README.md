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


Hosting on AWS EC2 with HTTPS

When deploying on AWS EC2, modern browsers block camera access if the site is served over plain HTTP. To enable camera or hand-tracking features, you need to expose the Flask app via HTTPS.

Here’s the approach used:

Login to EC2 Ubuntu instance from VS code terminal

```
ssh -i <my_ec2_key>.pem <username>@<ip/hostname> # .pem would be available when creating a new EC2 instance. Make sure to download it to a safe location.
```

Install nginx and certbot:

```
sudo apt update
sudo apt install -y nginx certbot python3-certbot-nginx
```


Configure nginx as a reverse proxy to forward traffic to Flask (running on port 8000).
Example /etc/nginx/sites-available/flask_app:

```
server {
    listen 443 ssl;
    server_name ec2-51-21-202-77.eu-north-1.compute.amazonaws.com;

    ssl_certificate /etc/ssl/certs/flask-selfsigned.crt;
    ssl_certificate_key /etc/ssl/private/flask-selfsigned.key;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

```
Enable it:

```
sudo ln -s /etc/nginx/sites-available/flask_app /etc/nginx/sites-enabled
sudo nginx -t
sudo systemctl restart nginx

```

Obtain HTTPS certificate using certbot:

````
sudo certbot --nginx -d ec2-51-21-202-77.eu-north-1.compute.amazonaws.com
```

This configures SSL automatically. For a quick test setup, you can also generate a self-signed certificate and point ssl_certificate / ssl_certificate_key to it.

Now the Flask app is available at:

https://ec2-51-21-202-77.eu-north-1.compute.amazonaws.com
(representational only)

which allows camera features to work in the browser.