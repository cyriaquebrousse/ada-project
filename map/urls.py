from django.conf.urls import url
from . import views

urlpatterns = [
  # dummy home page
  url(r'home$', views.home, name='map_home'),

  # list of all stations
  url(r'stations$', views.view_stations, name='map_stations'),

  # isochrone map
  url(
    r'isochrone/(?P<lat>[-+]?[0-9]*\.?[0-9]+),(?P<lng>[-+]?[0-9]*\.?[0-9]+)/(?P<dep_time>\d\d\d\d)/?$',
    views.view_isochrone,
    name='map_isochrone'
  ),
  url(r'isochrone/(?P<lat>[-+]?[0-9]*\.?[0-9]+),(?P<lng>[-+]?[0-9]*\.?[0-9]+)/?$', views.view_isochrone)
]
