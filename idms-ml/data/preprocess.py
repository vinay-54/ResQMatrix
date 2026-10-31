"""
Preprocesses raw flood datasets into IDMS SensorReading schema.

Input:  data/raw/*.csv
Output: data/processed/*.json

Each output file maps to one virtual "node" in IDMS.
These nodes are loaded into MongoDB as real SensorReading documents.

Usage: python data/preprocess.py
"""

import os
import json
import pandas as pd
import numpy as np
from pathlib import Path
from datetime import datetime
from tqdm import tqdm

RAW_DIR       = Path('data/raw')
PROCESSED_DIR = Path('data/processed')
PROCESSED_DIR.mkdir(parents=True, exist_ok=True)

# Alert thresholds (same as backend .env)
THRESHOLDS = {
    'safe':     80,
    'watch':    40,
    'warning':  25,
    'danger':   15,
    'critical':  8,
}


def get_alert_level(water_level):
    if water_level <= THRESHOLDS['critical']: return 'CRITICAL'
    if water_level <= THRESHOLDS['danger']:   return 'DANGER'
    if water_level <= THRESHOLDS['warning']:  return 'WARNING'
    if water_level <= THRESHOLDS['watch']:    return 'WATCH'
    return 'SAFE'


def get_comm_layer():
    """Simulate realistic 4-layer comm distribution."""
    r = np.random.random()
    if r < 0.88: return '4G'
    if r < 0.96: return '2G'
    if r < 0.99: return 'LORA'
    return 'SD'


def get_battery_percent(hour, day_of_year):
    """Simulate solar battery state -- high midday, lower at night."""
    solar_charge = max(0, np.sin((hour - 6) * np.pi / 12))
    base         = 70 + 25 * solar_charge
    seasonal     = 5 * np.sin((day_of_year - 80) * 2 * np.pi / 365)
    return round(max(15, min(100, base + seasonal + np.random.normal(0, 2))), 1)


def row_to_sensor_reading(row, node_id):
    """
    Convert a raw CSV row to an IDMS SensorReading document.
    Matches the Mongoose SensorReading schema from B3 exactly.
    """
    ts          = pd.to_datetime(row['timestamp'])
    water_level = float(row['waterLevel'])
    alert_level = get_alert_level(water_level)

    # Estimate battery voltage from percent
    battery_pct = get_battery_percent(ts.hour, ts.day_of_year)
    bat_voltage  = 11.6 + (battery_pct / 100) * 1.4  # 11.6V–13.0V range

    return {
        'nodeId':           node_id,
        'waterLevel':       round(water_level, 2),
        'temperature':      round(float(row.get('temperature', 28.0)), 1),
        'humidity':         round(float(row.get('humidity', 75.0)), 1),
        'pressure':         round(float(row.get('pressure', 1012.0)), 1),
        'rainfall':         float(row.get('rainfall', 0)) > 0.5,
        'batteryVoltage':   round(bat_voltage, 2),
        'batteryPercent':   battery_pct,
        'solarVoltage':     round(max(0, 18 * np.sin((ts.hour - 6) * np.pi / 12)), 2),
        'rssi':             int(-60 - np.random.exponential(10)),
        'commLayer':        get_comm_layer(),
        'alertLevel':       alert_level,
        'lat':              float(row.get('lat', 13.6289)),
        'lng':              float(row.get('lng', 79.4192)),
        'deviceTimestamp':  ts.isoformat(),
        'receivedAt':       ts.isoformat(),
    }


def preprocess_file(csv_path, node_id, node_name, resample_to='1H'):
    """
    Load, clean, resample, and convert one CSV file.
    Returns list of SensorReading dicts.
    """
    print(f'\nProcessing {csv_path.name} -> {node_id}')

    df = pd.read_csv(csv_path, parse_dates=['timestamp'])
    print(f'  Raw records: {len(df):,}')

    # Drop duplicates
    df = df.drop_duplicates(subset=['timestamp', 'stationId']
                             if 'stationId' in df.columns else ['timestamp'])

    # Filter to one station if multiple in file
    if 'stationId' in df.columns:
        station = df['stationId'].iloc[0]
        df = df[df['stationId'] == station].copy()
        print(f'  Station filtered: {station} -- {len(df):,} records')

    # Sort chronologically
    df = df.sort_values('timestamp').reset_index(drop=True)

    # Set timestamp as index for resampling
    df = df.set_index('timestamp')

    # Select numeric columns only for resampling
    numeric_cols = ['waterLevel', 'rainfall', 'temperature', 'humidity', 'pressure']
    df_numeric   = df[[c for c in numeric_cols if c in df.columns]]

    # Resample to hourly (mean for each hour)
    df_resampled = df_numeric.resample(resample_to).mean()

    # Forward fill then backward fill any gaps
    df_resampled = df_resampled.ffill().bfill()

    # Remove rows with critical missing data
    df_resampled = df_resampled.dropna(subset=['waterLevel'])

    print(f'  After resample: {len(df_resampled):,} hourly records')

    # Validate water level range
    df_resampled['waterLevel'] = df_resampled['waterLevel'].clip(5.0, 120.0)

    # Convert to SensorReading documents
    readings = []
    for ts, row in tqdm(df_resampled.iterrows(), total=len(df_resampled),
                        desc=f'  Converting {node_id}', leave=False):
        row_dict = row.to_dict()
        row_dict['timestamp'] = ts
        row_dict.setdefault('temperature', 28.0)
        row_dict.setdefault('humidity',    75.0)
        row_dict.setdefault('pressure',  1012.0)
        row_dict.setdefault('rainfall',     0.0)
        readings.append(row_to_sensor_reading(row_dict, node_id))

    print(f'  SensorReading documents: {len(readings):,}')

    # Alert level distribution
    levels = [r['alertLevel'] for r in readings]
    for level in ['SAFE', 'WATCH', 'WARNING', 'DANGER', 'CRITICAL']:
        count = levels.count(level)
        pct   = count / len(levels) * 100
        print(f'  {level:8s}: {count:6,} ({pct:5.1f}%)')

    return readings, node_name


def save_processed(readings, node_id, node_name):
    """Save processed readings to JSON file."""
    output = {
        'nodeId':    node_id,
        'nodeName':  node_name,
        'count':     len(readings),
        'generatedAt': datetime.utcnow().isoformat(),
        'readings':  readings,
    }
    path = PROCESSED_DIR / f'{node_id}.json'
    with open(path, 'w') as f:
        json.dump(output, f, indent=2, default=str)
    print(f'  Saved: {path} ({path.stat().st_size / 1024 / 1024:.1f} MB)')
    return path


if __name__ == '__main__':
    print('=' * 55)
    print('  IDMS Data Preprocessing Pipeline')
    print('=' * 55)

    tasks = [
        ('kerala_2018.csv',    'DSN-KL2018', 'Chalakudy River, Kerala (2018 Floods)'),
        ('cwc_godavari.csv',   'DSN-GDV001', 'Godavari River, Rajamahendravaram, AP'),
        ('imd_rainfall_ap.csv','DSN-IMDAP',  'IMD Composite -- Andhra Pradesh Region'),
    ]

    all_paths = []
    total_records = 0

    for filename, node_id, node_name in tasks:
        csv_path = RAW_DIR / filename
        if not csv_path.exists():
            print(f'  [WARN]  {filename} not found -- skipping')
            continue

        readings, name = preprocess_file(csv_path, node_id, node_name)
        path = save_processed(readings, node_id, node_name)
        all_paths.append(path)
        total_records += len(readings)

    print()
    print('=' * 55)
    print(f'  Total processed records: {total_records:,}')
    print(f'  Files saved to: data/processed/')
    print('  Next: python data/augment.py')
    print('=' * 55)

