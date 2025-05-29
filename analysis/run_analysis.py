import arcpy
import json
import os

def perform_analysis():

    ## Absolute path to analysis/ folder
    base_dir = os.path.dirname(os.path.abspath(__file__))

    ## Path to gdb
    gdb_path = os.path.join(base_dir, 'project.gdb')
    arcpy.env.workspace = gdb_path

    input_fc = os.path.join(gdb_path, 'well_nitrate')
    output_fc = "/temp_files/buffered_wells"

    ## Placeholder analysis
    arcpy.analysis.Buffer(input_fc, output_fc, "1000 Meters")

    ## Path to geojson file.  Will be called for by Leaflet and grabbed with Flask
    geojson_path = os.path.abspath(os.path.join(base_dir, '..', 'final_files', 'output.json'))

    ## Converts output buffer to geojson file
    arcpy.conversion.FeaturesToJSON(output_fc, geojson_path, geoJSON="GeoJSON")

    return geojson_path

