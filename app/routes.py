from flask import render_template, jsonify, request
from app import app
from app.call_idw import perform_idw



## Defines homepage route
@app.route('/')
def index():
    return render_template( 'index.html')


##Route that will be called to perform analysis
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


#     @app.route('/run_analysis')
# def run_analysis():
#     idw = perform_idw()