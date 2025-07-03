from flask import render_template, jsonify, request
from app import app
from app.call_idw import perform_idw
from app.call_zonal_regression import perform_zonal, perform_regression



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

@app.route("/call_zonal_regression", methods=['POST'])
def call_zonal_regression_route():
    try:
        perform_zonal()
        regression_path, stats = perform_regression()

        return jsonify({
            "message": "success",
            "geojson_url": regression_path,
            "glr_stats": stats
        })
    except Exception as e:
        return jsonify({"message": "error", "message": str(e)}), 500
