from flask import render_template, jsonify
from app import app
from app.run_analysis import perform_analysis

## Defines homepage route
@app.route('/')
def index():
    return render_template('index.html')

##Route that will be called to perform analysis
@app.route('/run_analysis')
def run_analysis():
    output_geojson = perform_analysis()
    with open(output_geojson) as f:
        return jsonify(eval(f.read()))