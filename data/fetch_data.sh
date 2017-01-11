#!/bin/bash
wget -P data/ http://gtfs.geops.ch/dl/gtfs_complete.zip
unzip -u -d data data/gtfs_complete.zip
rm -f gtfs_complete.zip
