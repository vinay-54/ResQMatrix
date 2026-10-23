import os
import pandas as pd
from pymongo import MongoClient
from datetime import datetime, timedelta
from dotenv import load_dotenv

load_dotenv()


def get_readings(node_id: str, hours: int = 720) -> pd.DataFrame:
    """
    Fetch the last N hours of sensor readings for a node from MongoDB.
    Returns a DataFrame sorted oldest-first.
    """
    client = MongoClient(os.getenv('MONGODB_URI'))
    db     = client['idms']

    since  = datetime.utcnow() - timedelta(hours=hours)
    cursor = db['sensorreadings'].find(
        {
            'nodeId':     node_id,
            'receivedAt': {'$gte': since},
        },
        {
            '_id':         0,
            'waterLevel':  1,
            'temperature': 1,
            'humidity':    1,
            'rainfall':    1,
            'pressure':    1,
            'receivedAt':  1,
        }
    ).sort('receivedAt', 1)

    rows = list(cursor)
    client.close()

    if not rows:
        return pd.DataFrame(columns=[
            'waterLevel', 'temperature', 'humidity', 'rainfall', 'pressure', 'receivedAt'
        ])

    df = pd.DataFrame(rows)
    # Ensure rainfall is numeric (stored as bool in some packets)
    df['rainfall'] = df['rainfall'].astype(float)
    # Fill any gaps with forward fill
    df = df.ffill().fillna(0)
    return df


def get_all_nodes() -> list:
    """Get all active node IDs from MongoDB."""
    client = MongoClient(os.getenv('MONGODB_URI'))
    db     = client['idms']
    nodes  = list(db['sensornodes'].find(
        {'isActive': True},
        {'_id': 0, 'nodeId': 1, 'name': 1}
    ))
    client.close()
    return nodes
