#-*- coding: utf-8 -*-
from django.http import HttpResponse
from django.shortcuts import render

def home(reauest):
  """dummy"""
  text = "Hello world!"
  return HttpResponse(text)

def view_stations(request):
  """List of stations in Switzerland"""
  return HttpResponse("""
    <h1>Dummy list of stations</h1>
    <p>List of all train stations in Switzerland</p>
    """
  )

def view_isochrone(request, lat, lng, dep_time=1200):
  """Isochrone map from given coordinates of starting point, and set departure time"""
  return HttpResponse("""
    <h1>Dummy isochrone map</h1>
    <p>Map for coordinates ({0},{1}), with departure time set at {2}</p>
    """.format(lat, lng, dep_time)
  )
