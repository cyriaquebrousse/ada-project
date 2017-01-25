from heapq import heappush, heappop
import pygtfs
import pickle

class TransitGraph:

    #def build_graph(self, stop_ids_in_ch, sched):
        #"""
        #Builds a graph for the given GTFS schedule.
        #Args:
            #stop_ids_in_ch: sanitized stops ids (to take into account).
            #sched: GTFS schedule.

        #Returns:
            #V             : Number of vertices.
            #adj           : Adjacency matrix with edges of the form (v, departure_time, arrival_time).
            #stop_id2index : Mapping from stop_ids to graph vertices.
            #index2stop_id : Mapping from graph vertices to stop ids.
        #"""
        #stop_ids_in_ch = set(stop_ids_in_ch)
        #V, stop_id2index, index2stop_id = 0, dict(), dict()
        #for stop in ch_stops:
            #V += 1
            #stop_id2index[sanitize_stop_id(stop.stop_id)] = V
            #index2stop_id[V] = sanitize_stop_id(stop.stop_id)
        
        #adj = [[] for i in range(V+1)]
        #transfers = [[] for i in range(V+1)]
                        
        #for transfer in sched.transfers:
            #cur_id = sanitize_stop_id(transfer.from_stop_id)
            #w = transfer.min_transfer_time
            #nxt_id = sanitize_stop_id(transfer.to_stop_id)
            #if (cur_id in stop_ids_in_ch) and (nxt_id in stop_ids_in_ch):
                #u = stop_id2index[cur_id]
                #v = stop_id2index[nxt_id]
                #transfers[u].append((v, w))
        
        #for trip in sched.trips:
            #stop_times = sorted(trip.stop_times, key=lambda st: st.stop_sequence)
            #for cur, nxt in zip(stop_times, stop_times[1:]):
                
                #departure_from_u = cur.departure_time.total_seconds()
                #arrival_to_v = nxt.arrival_time.total_seconds()
                
                #cur_id = sanitize_stop_id(cur.stop_id)
                #nxt_id = sanitize_stop_id(nxt.stop_id)
                #if (cur_id in stop_ids_in_ch) and (nxt_id in stop_ids_in_ch):
                    #u = stop_id2index[cur_id]
                    #v = stop_id2index[nxt_id]
                    #adj[u].append((v, departure_from_u, arrival_to_v))

        #return V, adj, transfers, stop_id2index, index2stop_id        
    
    
    def sanitize_stop_id(self, id):
        return id.split(":")[0]

    def dijkstra(self, departing_stop_id, departing_time):
        """
        Computes shortest paths in the graph using Dijkstra algorithm.
        Complexity is O(E lg V).
        Args:
            V                  : Number of vertices.
            adj                : Adjacency matrix with edges of the form (v, departure_time, arrival_time).
            departing_stop_id  : Departing stop.
            departing_time     : Departing time (delta in seconds).

        Returns:
            dist   : Shortest paths (10^9 = no path).
            parent : Previous node in the shortest path tree (0 = no previous node).
        """
        departing_stop_index = self.stop_id2index[self.sanitize_stop_id(departing_stop_id)]
        
        Q, dist, parent = [(departing_time, departing_stop_index )], [10**9]*(self.V+1), [0]*(self.V+1)
        visited = parent[:]
        dist[departing_stop_index] = departing_time
        
        while Q:
            d, u = heappop(Q)
            if visited[u]: continue
            visited[u] = 1

            for (v, departure, arrival) in self.adj[u]:
                if departure >= d and not visited[v] and arrival < dist[v]:
                    assert arrival > 0
                    dist[v] = arrival
                    parent[v] = u
                    heappush(Q, (dist[v], v))
                    
            for (v, w) in self.transfers[u]:
                arrival = d + w
                if not visited[v] and arrival < dist[v]:
                    assert arrival > 0
                    dist[v] = arrival
                    parent[v] = u
                    heappush(Q, (dist[v], v))
            
        return dist, parent

    def __init__(self, pickle_file):
        with open(pickle_file, 'rb') as f:
            self.V, self.adj, self.transfers, self.stop_id2index, self.index2stop_id = pickle.load(f)
