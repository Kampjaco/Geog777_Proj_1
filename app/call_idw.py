import arcpy
from arcpy.sa import *
import os

def perform_idw(decay):

    arcpy.env.overwriteOutput = True
    
    project_root = os.path.dirname(os.path.abspath(__file__))
    data_folder = os.path.join(project_root, "static", "raw_files")
    arcpy.env.workspace = data_folder
    arcpy.env.scratchWorkspace = "in_memory"

    ##Set local variables
    inPointFeatures = "nitrate_wells.shp"
    zField = "nitr_ran"
    power = decay

    ##Output location
    output_folder = os.path.join(project_root, "static", "final_files")
    os.makedirs(output_folder, exist_ok=True)
    output_path = os.path.join(output_folder, "idw_output.tif")

    outIDW = Idw(in_point_features=inPointFeatures, z_field=zField, power=power)

    outIDW.save(output_path)

    return "/static/final_files/idw_output.tif"