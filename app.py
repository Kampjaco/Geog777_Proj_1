# This is a script for the backend of a Python and Javascript application

from flask import Flask
import os
from analysis.run_analysis import perform_analysis

## Initializes a Flask application
app = Flask(__name__)
from app import routes

## Defines the homepage route
@app.route('/')
def index():
    return "Hello world"

## Route that will be called from frontend to perform analysis
# @app.route('/run-analysis')
# def run_analysis():
#     print("hello")
#     ##Returns file location of json file
#     output_geojson = perform_analysis()
#     with open(output_geojson) as f:
#         return jsonify(eval(f.read()))

if __name__ == '__main__':
    app.run(debug=True)

