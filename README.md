# Applied Data Analysis Project

Calculate time-to-destination using the Swiss pubic transport network, from any starting point
stop to the whole rest of the country; and display the result in a meaningful way (isochrone maps).

## Project presentation
The slides that were used on the board are found [here](Presentation 31.01.pdf).

## Code organization
All the Python code is found in [map/](./map/). The javascript code is in the `static` sub-directory.

## Data Description
The feeds are based on the official Swiss schedule that is being published in the HAFAS format.
Data is converted to [GTFS format](http://www.transitwiki.org/TransitWiki/index.php?title=General_Transit_Feed_Specification).
The version of the feed offered here does not contain every bit of information present in the original data.
However it has everything needed to find the complete set of valid connections between two destinations for a
given date and time.

## Feasibility and Risks
Due to the size and complex nature of the graph, the minimum shortest paths computation could take more time than expected.
We already have some ideas to prune the search space, and to hide the latency e.g. displaying the map progressively.

## Deliverable
Graphical application (web, or desktop) to visualize isochrone maps of Switzerland, based on time-to-destination distances
using the Swiss public transport network.

## Tasks
 - Explore, analyse and process the Swiss public transport network data from [GTFS-CH](http://gtfs.geops.ch/).
 - Build a graph with a bearable memory footprint (to be stored in memory).
 - Handle minimum shortest paths queries in a computational efficient way.
 - Visualize the results using a custom visualization tool (isochrone maps).


## Getting started
First, install Django with `pip install django`. Make sure your PATH is in order.<br>
Place yourself in the root of the repository, and execute `python manage.py runserver`.<br>
You can then access [http://localhost:8000/isochrone/home](http://localhost:8000/isochrone/home).
