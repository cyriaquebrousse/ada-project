from heapq import heappush, heappop

import pygtfs

class TransitGraph:

    def build_graph(self, sched):
        """
        Builds a graph for the given GTFS schedule.
        Args:
            sched: GTFS schedule.

        Returns:
            V             : Number of vertices.
            adj           : Adjacency matrix with edges of the form (v, departure_time, arrival_time).
            stop_id2index : Mapping from stop_ids to graph vertices.
            index2stop_id : Mapping from graph vertices to stop ids.
        """
        V, stop_id2index, index2stop_id = 0, dict(), dict()
        for stop in sched.stops:    
            V += 1
            stop_id2index[stop.stop_id] = V
            index2stop_id[V] = stop.stop_id
        
        adj = [[] for i in range(V+1)]

        for trip in sched.trips:
            stop_times = sorted(trip.stop_times, key=lambda st: st.stop_sequence)
            for cur, nxt in zip(stop_times, stop_times[1:]):
                
                departure_from_u = cur.departure_time.total_seconds()
                arrival_to_v = nxt.arrival_time.total_seconds()
                
                u = stop_id2index[cur.stop_id]
                v = stop_id2index[nxt.stop_id]
                adj[u].append((v, departure_from_u, arrival_to_v))
                
        return V, adj, stop_id2index, index2stop_id

    def dijkstra(self, src, departing_time):
        """
        Computes shortest paths in the graph using Dijkstra algorithm.
        Complexity is O(E lg V).
        Args:
            V              : Number of vertices.
            adj            : Adjacency matrix with edges of the form (v, departure_time, arrival_time).
            src            : Departing node.
            departing_time : Departing time (delta in seconds).
    vertex
        Returns:
            dist   : Shortest paths (10^9 = no path).
            parent : Previous node in the shortest path tree (0 = no previous node).
        """
        
        Q, dist, parent = [(departing_time, src)], [10**9]*(self.V+1), [-1]*(self.V+1)
        visited = parent[:]
        dist[src] = departing_time
        
        while Q:
            d, u = heappop(Q)
            if visited[u]: continue
            for (v, departure, arrival) in self.adj[u]:
                if departure >= d and not visited[v] and arrival < dist[v]:
                    assert arrival > 0
                    dist[v] = arrival
                    parent[v] = u
                    heappush(Q, (dist[v], v))
            visited[u] = 1
            
        return dist, parent
    
    def __init__(self, schedule):
        self.V, self.adj, self.stop_id2index, self.index2stop_id = self.build_graph(schedule)
