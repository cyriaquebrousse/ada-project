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
    'closest_stop' : queries.find_closest_stop(lat, lng),
  }
  return JsonResponse(result)

def view_isochrone(request, dep_stop_id, dep_time='0800'):
  """Isochrone map from given coordinates of starting point, and set departure time"""
  from datetime import datetime, time
  try:
    dep_time = datetime.strptime(dep_time, '%H%M').time()
    dep_time_seconds = dep_time.hour * 60 * 60 + dep_time.minute * 60 + dep_time.second 
  except:
    return HttpResponseBadRequest('400: Departure time could not be cast to time')

  result = {
    'reachable_stops': queries.compute_shortest_paths(dep_stop_id, dep_time_seconds)
  }
  return JsonResponse(result)
