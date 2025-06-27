from flask import render_template, jsonify, request
from app import app
from app.call_idw import perform_idw



## Defines homepage route
@app.route('/')
def index():
    return render_template( 'index.html')


##IDW Route
@app.route("/call_idw", methods=['POST'])
def call_idw_route():
    try:
        data = request.get_json()
        decay_coefficient = float(data.get("decay"))

        raster_path = perform_idw(decay_coefficient)

        return jsonify({
            "raster_url": raster_path
        })
    except Exception as e:
        return jsonify({ "message": f"Error during IDW: {str(e)}" }), 500

@app.route("/call_zonal", methods=['POST'])
def call_zonal_route():
    try:
        data = request.get_json
    except Exception as e:
        return