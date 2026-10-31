"""
Loads all processed SensorReading documents into MongoDB Atlas.

Creates one SensorNode document per dataset.
Loads all SensorReading documents in batches.

Usage: python data/load_to_mongo.py [--node DSN-KL2018] [--clear]

Options:
  --node   Load only this node (default: all)
  --clear  Delete existing readings before loading
  --dry    Dry run -- count records only, no insert
"""

import os
import sys
import json
import argparse
from pathlib import Path
from datetime import datetime
from pymongo import MongoClient, ASCENDING, InsertOne
from pymongo.errors import BulkWriteError
from dotenv import load_dotenv
from tqdm import tqdm

load_dotenv()

PROCESSED_DIR = Path('data/processed')
BATCH_SIZE    = 1000   # MongoDB bulk insert batch size

NODE_META = {
    'DSN-KL2018': {
        'name':           'Chalakudy River -- Kerala 2018',
        'location':       'Chalakudy, Thrissur, Kerala',
        'lat':            10.3013,
        'lng':            76.3314,
        'deploymentArea': 'Public Dataset -- Kerala',
        'isPublicDataset': True,
        'dataSource':     'Kerala Floods 2018 (Generated from historical patterns)',
    },
    'DSN-GDV001': {
        'name':           'Godavari River -- Rajamahendravaram AP',
        'location':       'Dowlaiswaram Barrage, East Godavari, AP',
        'lat':            17.0005,
        'lng':            81.7799,
        'deploymentArea': 'Public Dataset -- AP Godavari',
        'isPublicDataset': True,
        'dataSource':     'CWC Godavari River Data (Generated from historical patterns)',
    },
    'DSN-IMDAP': {
        'name':           'IMD Composite -- Andhra Pradesh',
        'location':       'AP Region Composite Station',
        'lat':            15.9129,
        'lng':            79.7400,
        'deploymentArea': 'Public Dataset -- IMD AP',
        'isPublicDataset': True,
        'dataSource':     'IMD Rainfall AP Region (Generated from historical patterns)',
    },
    'DSN-SYNTHETIC': {
        'name':           'Synthetic Augmentation Dataset',
        'location':       'Synthetic -- IDMS Training Data',
        'lat':            13.6289,
        'lng':            79.4192,
        'deploymentArea': 'Synthetic Dataset',
        'isPublicDataset': True,
        'dataSource':     'IDMS Synthetic Flood Surge Generator',
    },
}


def get_db():
    uri    = os.getenv('MONGODB_URI')
    if not uri:
        print('[ERROR] MONGODB_URI not set in .env')
        sys.exit(1)
    client = MongoClient(uri, serverSelectionTimeoutMS=5000)
    # Test connection
    client.admin.command('ping')
    return client['idms']


def upsert_sensor_node(db, node_id):
    """Create or update the SensorNode document for this dataset node."""
    meta = NODE_META.get(node_id, {})
    db['sensornodes'].update_one(
        { 'nodeId': node_id },
        { '$set': {
            'nodeId':           node_id,
            'name':             meta.get('name', node_id),
            'location':         meta.get('location', ''),
            'lat':              meta.get('lat', 0),
            'lng':              meta.get('lng', 0),
            'deploymentArea':   meta.get('deploymentArea', 'Training Data'),
            'isPublicDataset':  meta.get('isPublicDataset', True),
            'dataSource':       meta.get('dataSource', ''),
            'status':           'online',
            'alertLevel':       'SAFE',
            'isActive':         True,
            'updatedAt':        datetime.utcnow(),
        }},
        upsert=True,
    )
    print(f'  SensorNode upserted: {node_id}')


def load_readings(db, json_path, clear=False, dry_run=False):
    """Load SensorReading documents from a processed JSON file."""
    print(f'\nLoading: {json_path.name}')

    with open(json_path) as f:
        data = json.load(f)

    node_id  = data['nodeId']
    readings = data['readings']
    count    = len(readings)

    print(f'  Node:    {node_id}')
    print(f'  Records: {count:,}')

    if dry_run:
        print('  [DRY RUN] -- No data inserted')
        return count

    # Clear existing readings for this node
    if clear:
        result = db['sensorreadings'].delete_many({'nodeId': node_id})
        print(f'  Cleared: {result.deleted_count:,} existing readings')

    # Upsert SensorNode metadata
    upsert_sensor_node(db, node_id)

    # Bulk insert in batches
    inserted = 0
    errors   = 0

    for i in tqdm(range(0, count, BATCH_SIZE),
                  desc=f'  Inserting {node_id}', unit='batch'):
        batch      = readings[i : i + BATCH_SIZE]
        operations = [InsertOne(r) for r in batch]

        try:
            result   = db['sensorreadings'].bulk_write(operations, ordered=False)
            inserted += result.inserted_count
        except BulkWriteError as e:
            # Ignore duplicate key errors (already loaded)
            inserted += e.details.get('nInserted', 0)
            errors   += len(e.details.get('writeErrors', []))

    print(f'  Inserted: {inserted:,}  Errors: {errors}')

    # Create compound index if not exists
    db['sensorreadings'].create_index(
        [('nodeId', ASCENDING), ('receivedAt', ASCENDING)],
        background=True,
    )

    return inserted


def print_summary(db):
    """Print database summary after loading."""
    print('\n' + '=' * 55)
    print('  MongoDB Atlas -- IDMS Training Data Summary')
    print('=' * 55)

    pipeline = [
        { '$group': {
            '_id':   '$nodeId',
            'count': { '$sum': 1 },
            'minDate': { '$min': '$receivedAt' },
            'maxDate': { '$max': '$receivedAt' },
            'levels': { '$push': '$alertLevel' },
        }},
        { '$sort': { '_id': 1 } },
    ]

    for doc in db['sensorreadings'].aggregate(pipeline):
        levels   = doc['levels']
        total    = len(levels)
        critical = levels.count('CRITICAL')
        danger   = levels.count('DANGER')
        warning  = levels.count('WARNING')
        watch    = levels.count('WATCH')
        safe     = levels.count('SAFE')

        print(f"\n  Node: {doc['_id']}")
        print(f"  Records: {doc['count']:,}")
        print(f"  Range:   {str(doc['minDate'])[:10]} -> {str(doc['maxDate'])[:10]}")
        print(f"  SAFE:{safe:,} WATCH:{watch:,} WARNING:{warning:,} DANGER:{danger:,} CRITICAL:{critical:,}")


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--node',  default='all',   help='Node ID or "all"')
    parser.add_argument('--clear', action='store_true', help='Clear before loading')
    parser.add_argument('--dry',   action='store_true', help='Dry run')
    args = parser.parse_args()

    print('=' * 55)
    print('  IDMS MongoDB Data Loader')
    print('=' * 55)

    # Find JSON files to load
    if args.node == 'all':
        json_files = sorted(PROCESSED_DIR.glob('DSN-*.json'))
    else:
        json_files = list(PROCESSED_DIR.glob(f'{args.node}.json'))

    if not json_files:
        print('  No processed files found. Run preprocess.py first.')
        sys.exit(1)

    print(f'  Files to load: {len(json_files)}')

    # Connect to MongoDB (skip for dry run)
    db = None
    if not args.dry:
        try:
            db = get_db()
            print('  [OK] MongoDB Atlas connected')
        except Exception as e:
            print(f'  [ERROR] MongoDB connection failed: {e}')
            sys.exit(1)

    total_inserted = 0
    for json_path in json_files:
        total_inserted += load_readings(
            db, json_path,
            clear   = args.clear,
            dry_run = args.dry,
        )

    if not args.dry and db:
        print_summary(db)

    print()
    print('=' * 55)
    print(f'  Total records loaded: {total_inserted:,}')
    print('  Next: python model/trainer.py --node DSN-KL2018')
    print('=' * 55)

