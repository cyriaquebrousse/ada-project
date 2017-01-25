from .models import Stop
from .graph import TransitGraph
from geopy.distance import vincenty
import numpy as np

G = TransitGraph('graph.pickle')

def find_closest_stop(lat, lng):
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

def compute_shortest_paths(dep_stop_id, dep_time_seconds):
    """
    Returns a list of shortest paths from the given starting stop at the given time,
    to all reachable stops in the network.
    """
    global G
    
    MAX_TIME = 24 * 60 * 60

    dist, parent = G.dijkstra(dep_stop_id, dep_time_seconds)

    return [
      {
        'stop_id'      : int(G.index2stop_id[i]),
        'time_arrival' : dist[i],
        'prev_stop_id' : int(G.index2stop_id[parent[i]]) if parent[i] > 0 else -1
      } for i in range(1, len(dist)) if dist[i] <= MAX_TIME
    ]
