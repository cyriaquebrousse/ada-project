#-*- coding: utf-8 -*-
from django.http import HttpResponse, HttpResponseBadRequest
from django.shortcuts import render

def home(request):
  """dummy"""
  text = "Hello world!"
  return HttpResponse(text)

def view_stations(request):
  """List of stations in Switzerland"""
  return render(request, 'map/stations.html')

def view_isochrone(request, lat, lng, dep_time='1200'):
  """Isochrone map from given coordinates of starting point, and set departure time"""
  lat = float(lat)
  lng = float(lng)
  from datetime import datetime, time
  try:
    dep_time = datetime.strptime(dep_time, '%H%M').time()
  except:
    return HttpResponseBadRequest('400: Departure time could not be cast to time')

  return render(request, 'map/isochrone.html', locals())
