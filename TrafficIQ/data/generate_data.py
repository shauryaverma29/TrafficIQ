import numpy as np
import pandas as pd

np.random.seed(42)
n_rows = 1200

road_configs = [
    {"name": "Interstate 80 Express", "type": "Highway", "speed_base": 95, "vol_base": 2400},
    {"name": "Highway 101 Bay Corridor", "type": "Highway", "speed_base": 90, "vol_base": 2800},
    {"name": "Central Metro Arterial", "type": "Arterial", "speed_base": 48, "vol_base": 1900},
    {"name": "Tech Innovation Blvd", "type": "Arterial", "speed_base": 52, "vol_base": 1700},
    {"name": "Airport Transit Link", "type": "Expressway", "speed_base": 80, "vol_base": 2200},
    {"name": "Harbor Industrial Parkway", "type": "Collector", "speed_base": 42, "vol_base": 1300},
    {"name": "Uptown Commercial Ave", "type": "Collector", "speed_base": 36, "vol_base": 1400},
    {"name": "Sunset Suburban Ring", "type": "Local", "speed_base": 40, "vol_base": 650}
]

days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
weathers = ["Clear", "Overcast", "Rain", "Fog"]
weather_weights = [0.65, 0.20, 0.12, 0.03]

records = []

for i in range(n_rows):
    seg_id = f"SEG-{1000 + i}"
    road = np.random.choice(road_configs)
    road_name = road["name"]
    road_type = road["type"]
    
    hour = int(np.random.randint(0, 24))
    day = str(np.random.choice(days))
    is_weekend = day in ["Saturday", "Sunday"]
    is_rush_hour = (7 <= hour <= 9) or (16 <= hour <= 19)
    
    weather = str(np.random.choice(weathers, p=weather_weights))
    incident = 1 if np.random.rand() < (0.14 if is_rush_hour else 0.04) else 0
    
    # Calculate volume based on time and road type
    vol_mult = 1.0
    if is_rush_hour and not is_weekend:
        vol_mult = np.random.uniform(1.4, 1.85)
    elif 10 <= hour <= 15:
        vol_mult = np.random.uniform(0.9, 1.25)
    elif 0 <= hour <= 5:
        vol_mult = np.random.uniform(0.2, 0.45)
    else:
        vol_mult = np.random.uniform(0.7, 1.1)
        
    traffic_vol = int(np.clip(road["vol_base"] * vol_mult + np.random.normal(0, 120), 150, 4800))
    
    # Calculate speed influenced by volume, rush hour, incident, weather
    speed_factor = 1.0
    if vol_mult > 1.3:
        speed_factor -= np.random.uniform(0.35, 0.60)
    elif vol_mult > 1.0:
        speed_factor -= np.random.uniform(0.10, 0.25)
        
    if incident == 1:
        speed_factor -= np.random.uniform(0.25, 0.45)
    if weather == "Rain":
        speed_factor -= 0.12
    elif weather == "Fog":
        speed_factor -= 0.18
        
    speed_factor = max(0.18, min(1.15, speed_factor))
    speed = round(float(np.clip(road["speed_base"] * speed_factor + np.random.normal(0, 3.5), 12.0, 120.0)), 1)
    
    # Occupancy percent
    occupancy = round(float(np.clip((traffic_vol / (road["vol_base"] * 1.9)) * 60 + (1 - speed_factor) * 35 + np.random.normal(0, 2.5), 4.0, 96.0)), 1)
    
    # Congestion Index (0 to 100)
    cong_raw = (occupancy * 0.55) + ((1 - (speed / road["speed_base"])) * 45)
    congestion_index = round(float(np.clip(cong_raw + np.random.normal(0, 2.0), 2.0, 99.5)), 1)
    
    records.append({
        "segment_id": seg_id,
        "road_name": road_name,
        "road_type": road_type,
        "hour_of_day": hour,
        "day_of_week": day,
        "traffic_volume": traffic_vol,
        "average_speed_kmh": speed,
        "congestion_index": congestion_index,
        "occupancy_percent": occupancy,
        "weather_condition": weather,
        "incident_flag": incident
    })

df = pd.DataFrame(records)

# Introduce a small, realistic fraction of missing values (~1.5%) for demonstration of imputation
mask_vol = np.random.rand(n_rows) < 0.015
df.loc[mask_vol, "traffic_volume"] = np.nan

mask_speed = np.random.rand(n_rows) < 0.012
df.loc[mask_speed, "average_speed_kmh"] = np.nan

mask_weather = np.random.rand(n_rows) < 0.008
df.loc[mask_weather, "weather_condition"] = np.nan

# Introduce a small number of duplicates (e.g. 5 duplicate rows) to demonstrate duplicate handling
dup_rows = df.iloc[:5].copy()
df = pd.concat([df, dup_rows], ignore_index=True)

df.to_csv("c:/Users/VICTUS/OneDrive/Desktop/unsupervised/TrafficIQ/data/traffic_kaggle_demo.csv", index=False)
print(f"Generated realistic Kaggle traffic demo dataset with {len(df)} rows and {len(df.columns)} columns.")
