from flask import Flask, render_template, send_from_directory
import os

app = Flask(__name__, static_folder='static', template_folder='templates')


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/pop.wav')
def pop_sound():
    # serve existing pop.wav from repo root
    return send_from_directory('.', 'pop.wav')


@app.route('/game-over.wav')
def game_over_sound():
    # serve existing game-over.wav from repo root
    return send_from_directory('.', 'game-over.wav')


@app.route('/favicon.ico')
def favicon():
    # serve the favicon from the static folder
    return send_from_directory(os.path.join(app.root_path, 'static'), 'favicon.svg')


if __name__ == '__main__':
    # Bind to all interfaces so EC2 can reach it; debug can be turned off in production
    app.run(host='0.0.0.0', port=8000, debug=True)
