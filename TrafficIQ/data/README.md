# TrafficIQ Demonstration Dataset Documentation

## Overview
This directory contains sample and demonstration datasets for **TrafficIQ: Road-Segment Congestion Profiles Through Unsupervised Learning**.

### Primary File: `traffic_kaggle_demo.csv`
- **Total Records:** 1,205 road-segment observations
- **Features:** 11 columns
- **Purpose:** Rigorous offline and demonstration benchmarking matching Kaggle traffic prediction schemas. Contains realistic temporal traffic distributions, peak-hour congestion corridors, weather-induced slowdowns, and incident variations.
- **Note:** Real user CSVs can be uploaded directly into the web application at any time. The system automatically inspects column structures and allows interactive feature selection.

### Schema Details:
1. `segment_id` (Categorical/ID): Unique road segment tracking identifier (e.g., `SEG-1001`).
2. `road_name` (Categorical): Corridor designation (e.g., `Highway 101 Bay Corridor`, `Interstate 80 Express`, `Central Metro Arterial`).
3. `road_type` (Categorical): Hierarchy of road (`Highway`, `Expressway`, `Arterial`, `Collector`, `Local`).
4. `hour_of_day` (Numerical): Timestamp hour (0–23).
5. `day_of_week` (Categorical): Day name (`Monday` through `Sunday`).
6. `traffic_volume` (Numerical): Vehicles counted per hour (150–4,800).
7. `average_speed_kmh` (Numerical): Monitored mean vehicle speed in km/h (12.0–120.0).
8. `congestion_index` (Numerical): Empirical composite congestion score (2.0–99.5).
9. `occupancy_percent` (Numerical): Sensor loop lane occupancy (4.0%–96.0%).
10. `weather_condition` (Categorical): Environmental state (`Clear`, `Overcast`, `Rain`, `Fog`).
11. `incident_flag` (Binary Numeric): Occurrence of obstruction, stalled vehicle, or collision (0 or 1).

### Demonstration Preprocessing Characteristics:
- Contains ~1.5% natural missing observations in `traffic_volume`, `average_speed_kmh`, and `weather_condition` to test mean/median/mode imputation strategies.
- Contains 5 duplicate records to validate duplicate detection and deduplication routines.
