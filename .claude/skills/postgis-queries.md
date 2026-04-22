PostGIS Query Conventions for Traan

- All PostGIS queries must go through /backend/services/geo_service.py
- Always use ST_DWithin for radius checks — faster than ST_Distance filter
- Always cast geometry to geography for accurate meter-based distance: location::geography
- Always use bound parameters with SQLAlchemy text() — never string-format SQL
- Volunteer nearest-neighbor: ORDER BY ST_Distance ASC, LIMIT configurable (default 5)
- Corroboration check radius: 2km, time window: 2 hours
- Always ensure spatial indexes exist before running queries (idx_incidents_coordinates, idx_volunteers_location)
- For incident clustering: ST_Collect + ST_ConvexHull for bounding polygons
- Distance unit: always meters internally, convert to km for display