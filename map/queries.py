from .models import Stop
from .graph import TransitGraph
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


import pickle

with open('./data/trains_graph.pickle', 'rb') as f:
    # TODO: Load the graph once
    print("Hello World")
    G = pickle.load(f)

def compute_shortest_paths(dep_stop_id, dep_time_seconds):
    """
    Returns a list of shortest paths from the given starting stop at the given time,
    to all reachable stops in the network.
    """
    MAX_TIME = 24 * 60 * 60

    #with open('./data/trains_graph.pickle', 'wb') as f:
        # TODO: Load the graph once
        #G = TransitGraph(pygtfs.Schedule("./dbs/trains.sqlite"))
        #pickle.dump(G, f, pickle.HIGHEST_PROTOCOL)

    dep_stop_index = G.stop_id2index[dep_stop_id]

    dist, parent = G.dijkstra(dep_stop_index, dep_time_seconds)

    return [
      {
        'stop_id'      : int(G.index2stop_id[i]),
        'time_arrival' : dist[i],
        'prev_stop_id' : int(G.index2stop_id[parent[i]]) if parent[i] > 0 else -1
      } for i in range(len(dist)) if dist[i] < MAX_TIME
    ]
