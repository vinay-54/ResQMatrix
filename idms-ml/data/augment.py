"""
Generates synthetic SensorReading data to balance the dataset.

Problem: Real flood data is mostly SAFE (80-90% of readings).
LSTM needs balanced examples of all 5 alert levels to learn well.

Solution: Generate synthetic flood surge sequences that cover
all alert level transitions with realistic physics.

Usage: python data/augment.py

Output: data/processed/DSN-SYNTHETIC.json
"""

import json
import numpy as np
import pandas as pd
from pathlib import Path
from datetime import datetime, timedelta
from tqdm import tqdm

PROCESSED_DIR = Path('data/processed')

THRESHOLDS = {
    'safe': 80, 'watch': 40, 'warning': 25, 'danger': 15, 'critical': 8
}

def get_alert_level(wl):
    if wl <= THRESHOLDS['critical']: return 'CRITICAL'
    if wl <= THRESHOLDS['danger']:   return 'DANGER'
    if wl <= THRESHOLDS['warning']:  return 'WARNING'
    if wl <= THRESHOLDS['watch']:    return 'WATCH'
    return 'SAFE'


def generate_flood_surge(
    start_time,
    peak_wl,        # minimum distance (maximum flood height)
    rise_hours,     # hours to reach peak
    fall_hours,     # hours to recede
    noise_std=1.5,
):
    """
    Generate one realistic flood surge sequence.
    Returns list of (timestamp, waterLevel) tuples.
    """
    rise_hours = max(1, rise_hours)
    fall_hours = max(1, fall_hours)
    readings = []
    total_hours = rise_hours + fall_hours

    for h in range(total_hours):
        ts = start_time + timedelta(hours=h)

        if h <= rise_hours:
            # Rising limb -- exponential approach to peak
            progress = h / rise_hours
            wl = 90 - (90 - peak_wl) * (progress ** 0.8)
        else:
            # Falling limb -- logarithmic recession
            progress = (h - rise_hours) / fall_hours
            wl = peak_wl + (85 - peak_wl) * (progress ** 0.6)

        wl = max(5.0, min(115.0, wl + np.random.normal(0, noise_std)))
        readings.append((ts, round(wl, 2)))

    return readings


def surge_to_reading(ts, wl, node_id='DSN-SYNTHETIC'):
    """Convert a surge point to IDMS SensorReading format."""
    hour    = ts.hour
    battery = max(15, min(100, 70 + 25 * max(0, np.sin((hour-6)*np.pi/12)) + np.random.normal(0,2)))

    return {
        'nodeId':          node_id,
        'waterLevel':      wl,
        'temperature':     round(27 + 4*np.sin((hour-14)*np.pi/12) + np.random.normal(0, 0.8), 1),
        'humidity':        round(min(100, 72 + 15*np.sin((hour-4)*np.pi/12) + np.random.normal(0, 3)), 1),
        'pressure':        round(1010 + np.random.normal(0, 2), 1),
        'rainfall':        wl < 40,
        'batteryVoltage':  round(11.6 + (battery/100) * 1.4, 2),
        'batteryPercent':  round(battery, 1),
        'solarVoltage':    round(max(0, 18*np.sin((hour-6)*np.pi/12) + np.random.normal(0, 0.5)), 2),
        'rssi':            int(-60 - np.random.exponential(8)),
        'commLayer':       np.random.choice(['4G','4G','4G','4G','4G','2G','LORA'], p=[0.7,0.1,0.05,0.05,0.05,0.03,0.02]),
        'alertLevel':      get_alert_level(wl),
        'lat':             13.6289 + np.random.normal(0, 0.001),
        'lng':             79.4192 + np.random.normal(0, 0.001),
        'deviceTimestamp': ts.isoformat(),
        'receivedAt':      ts.isoformat(),
    }


if __name__ == '__main__':
    print('=' * 55)
    print('  IDMS Synthetic Data Augmentation')
    print('=' * 55)

    NODE_ID  = 'DSN-SYNTHETIC'
    readings = []
    base_time = datetime(2023, 1, 1)

    # ── Define surge scenarios ────────────────────────────────────────────
    scenarios = [
        # (description,           peak_wl, rise_h, fall_h, count)
        ('Flash flood CRITICAL',       5,      6,    18,    40),
        ('Major flood DANGER',        13,      8,    24,    60),
        ('Moderate flood WARNING',    22,     10,    20,    80),
        ('Rising watch WATCH',        35,      6,    12,   100),
        ('Slow recession all levels',  8,     24,    48,    20),
        ('Double peak event',          7,     12,    36,    30),
        ('Pre-monsoon build-up',      45,      4,     8,    50),
        ('Overnight flash WARNING',   23,      3,    10,   120),
    ]

    offset_hours = 0

    for desc, peak_wl, rise_h, fall_h, count in tqdm(scenarios, desc='Scenarios'):
        for _ in range(count):
            start = base_time + timedelta(hours=offset_hours)
            surge = generate_flood_surge(
                start_time  = start,
                peak_wl     = peak_wl + np.random.normal(0, 3),
                rise_hours  = rise_h  + int(np.random.normal(0, 2)),
                fall_hours  = fall_h  + int(np.random.normal(0, 4)),
            )
            for ts, wl in surge:
                readings.append(surge_to_reading(ts, wl, NODE_ID))

            offset_hours += rise_h + fall_h + int(np.random.exponential(24))

    print(f'\n  Total synthetic readings: {len(readings):,}')

    # Alert level distribution
    levels = [r['alertLevel'] for r in readings]
    for level in ['SAFE','WATCH','WARNING','DANGER','CRITICAL']:
        count = levels.count(level)
        pct   = count / len(levels) * 100
        bar   = '#' * int(pct / 2)
        print(f'  {level:8s}: {count:6,} ({pct:5.1f}%) {bar}')

    # Save
    output = {
        'nodeId':      NODE_ID,
        'nodeName':    'Synthetic Augmentation Dataset',
        'count':       len(readings),
        'generatedAt': datetime.utcnow().isoformat(),
        'readings':    readings,
    }
    path = PROCESSED_DIR / f'{NODE_ID}.json'
    with open(path, 'w') as f:
        json.dump(output, f, default=str)
    print(f'\n  [OK] Saved: {path} ({path.stat().st_size/1024/1024:.1f} MB)')
    print('  Next: python data/load_to_mongo.py')

