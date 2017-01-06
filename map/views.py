#-*- coding: utf-8 -*-
from django.http import HttpResponse, HttpResponseBadRequest
from django.shortcuts import render

def home(request):
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
  lat = float(lat)
  lng = float(lng)
  from datetime import datetime, time
  try:
    dep_time = datetime.strptime(dep_time, '%H%M').time()
  except:
    return HttpResponseBadRequest('400: Departure time could not be cast to time')

  return HttpResponse("""
    <h1>Dummy isochrone map</h1>
    <p>Map for coordinates ({0},{1}), with departure time set at {2}</p>
    """.format(lat, lng, dep_time)
  )
