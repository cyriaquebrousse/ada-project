from django.conf.urls import url
from . import views

urlpatterns = [
  # home page
  url(r'home/?$', views.view_map, name='map_home'),

  # list of all stations
  url(r'stations/?$', views.view_stations, name='map_stations'),

  # closest stop to coordinates
  url(r'closest-stop/(?P<lat>[-+]?[0-9]*\.?[0-9]+),(?P<lng>[-+]?[0-9]*\.?[0-9]+)/?$',
    views.view_closest_stop,
    name='closest_stop'),

  # isochrone network
  url(
    r'isochrone/(?P<dep_stop_id>[0-9]+)/(?P<dep_time>\d\d\d\d)/?$',
    views.view_isochrone,
    name='map_isochrone'
  ),
  url(r'isochrone/(?P<dep_stop_id>[0-9]+)/?$', views.view_isochrone)
]
