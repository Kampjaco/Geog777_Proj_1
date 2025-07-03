import arcpy
from arcpy.sa import *
from arcpy.management import *
from arcpy.stats import *
import os

def perform_zonal():

    arcpy.env.overwriteOutput = True
    
    project_root = os.path.dirname(os.path.abspath(__file__))

    tracts = os.path.join(project_root,"static","raw_files", "census_tracts.shp")
    idw = os.path.join(project_root,"static", "final_files", "idw_output.tif")
    output_table = os.path.join(project_root, "static", "temp_files", "tracts_nitrate_stats.dbf")
    
    try:
        arcpy.env.cellSize = 400
        ZonalStatisticsAsTable(
            in_zone_data=tracts,
            zone_field="GEOID10",
            in_value_raster=idw,
            out_table=output_table,
            statistics_type="MEAN"
        )
    except Exception as e:
        print(e)


def perform_regression():
    arcpy.env.overwriteOutput = True
    
    project_root = os.path.dirname(os.path.abspath(__file__))
    output_join = os.path.join(project_root, "static", "temp_files", "tracts_join.shp")
    stats_table = os.path.join(project_root, "static", "temp_files", "tracts_nitrate_stats.dbf")
    tracts = os.path.join(project_root,"static","raw_files", "census_tracts.shp")
    output_glr = os.path.join(project_root, "static", "final_files", "output_glr.shp")
    geojson_path = os.path.join(project_root, "static", "final_files", "output_glr.geojson")

    try:
        arcpy.management.MakeFeatureLayer(tracts, "in_memory/tracts_layer")

        arcpy.management.AddJoin(
            in_layer_or_view="in_memory/tracts_layer",
            in_field="GEOID10",
            join_table=stats_table,
            join_field="GEOID10"
        )

        arcpy.management.CalculateField(
            in_table="in_memory/tracts_layer",
            field="idw_mean",
            expression="!tracts_nitrate_stats.MEAN!",
            expression_type="PYTHON3"
        )


        arcpy.stats.GeneralizedLinearRegression(
            in_features=tracts,
            dependent_variable="canrate",
            model_type="CONTINUOUS",
            output_features=output_glr,
            explanatory_variables="idw_mean"
        )

        glr_stats = arcpy.GetMessages()

        arcpy.conversion.FeaturesToJSON(
            in_features=output_glr,
            out_json_file=geojson_path,
            geoJSON="GEOJSON",
            outputToWGS84="WGS84"
        )
    except Exception as e:
        print(e)

    return "/static/final_files/output_glr.geojson", glr_stats




