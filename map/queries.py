from .models import Stop
from geopy.distance import vincenty
import numpy as np

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
    MAX_TIME = 24 * 60 * 60
    
    import pickle

    with open('data/trains_graph.pickle', 'rb') as f:
        # TODO: Load the graph once
        G = pickle.load(f)
        
    dep_stop_index = G.stop_id2index[dep_stop_id]
    
    dist, parent = G.dijkstra(dep_stop_id, dep_time) # TODO sure not index?
    
    return [
      {
        'stop_id'      : G.index2stop_id[i],
        'time_arrival' : dist[i],
        'prev_stop_id' : parent[i] if i == dep_stop_index else -1
      } for i in range(len(dist)) if dist[i] < MAX_TIME
    ]
        
    
    
