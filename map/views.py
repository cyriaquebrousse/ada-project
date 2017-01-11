#-*- coding: utf-8 -*-
from django.http import HttpResponse, HttpResponseBadRequest, JsonResponse
from django.shortcuts import render
from . import queries

def view_map(request) :
  return render(request, 'map/index.html')

def view_stations(request):
  """List of stations in Switzerland"""
  from map.models import Stop
  stations = [s for s in Stop.objects.values()]
  return JsonResponse({'stops' : stations})

def view_closest_stop(request, lat, lng):
  """Closest public transport stop to the given coordintes"""
  lat = float(lat)
  lng = float(lng)

  result = {
    'closest_stop' : queries.closest_stop(lat, lng),
  }
  return JsonResponse(result)

def view_isochrone(request, lat, lng, dep_time='1200'):
  """Isochrone map from given coordinates of starting point, and set departure time"""
  lat = float(lat)
  lng = float(lng)
  from datetime import datetime, time
  try:
    dep_time = datetime.strptime(dep_time, '%H%M').time()
  except:
    return HttpResponseBadRequest('400: Departure time could not be cast to time')

  result = {
    'closest_stop' : queries.closest_stop(lat, lng),
    'lat' : lat, # deprecated
    'lng' : lng, # deprecated
    'dep_time' : '{0}{1}'.format(dep_time.hour, dep_time.minute), # deprecated

  }

  return JsonResponse(result)
