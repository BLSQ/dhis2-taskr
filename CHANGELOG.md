# 0.0.33

* fixes issue with special character encoding
* adds delete button
* includes general refactor of main app component

# 0.0.32

* improves report display

# 0.0.31

* fix regression in OrgUnitMap when only geojsons were present the auto fit map wasn't working.
* effort on bundle size
   * lazy load leaflet when only the map shown
   * load markown-it-highlight only when the documentation page is displayed
* migrate to swc for bundling   

# 0.0.30

* Allow to return results with more than 100000 lines in a performant but degraded mode (limited filtering)
* Map rendering now support large number of points thanks to [pixi overlay](https://github.com/BLSQ/dhis2-taskr/pull/43)
* Added some new background for maps (more neutral)

# 0.0.29

* Barious technical upgrade
* Add a stats tab to show some statistics about distinct values

# 0.0.28

* Links appear as link in table cell