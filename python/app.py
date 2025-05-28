#This is a script for the backend of a Python and Javascript application

from flask import Flask, request, jsonify
import arcpy

app = Flask(__name__)

print("ArcPy and Flask are working in the same environment!")


