from .models import Stop
from geopy.distance import vincenty
import numpy as np

def closest_stop(lat, lng):
  """
  Returns the closest Stop object, according to its lat and lng attributes.
  Distance computed using the vincenty method from geopy.

  If no stop could be found, returns -1.
  """
  point = (lat, lng)
  stops = np.asarray(Stop.objects.values())

  if len(stops) < 1:
    return -1

  coordinates = [(s['lat'], s['lng']) for s in stops]
  distances = [vincenty(point, c).kilometers for c in coordinates]

  return stops[np.argmin(distances)]
