import arcpy
import os

def perform_analysis():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Set the workspace to your file geodatabase
    gdb_path = os.path.join(base_dir, 'project.gdb')
    arcpy.env.workspace = gdb_path

    # Input feature class
    input_fc = os.path.join(gdb_path, 'well_nitrate')

    # Output GeoJSON path
    geojson_path = os.path.join(base_dir, '..', 'static', 'outputs', 'well_nitrate.json')

    # Convert feature class to GeoJSON (use GeoJSON spec)
    arcpy.conversion.FeaturesToJSON(
        input_fc,
        geojson_path,
        format_json='FORMATTED',
        geoJSON='GeoJSON'
    )

    return geojson_path