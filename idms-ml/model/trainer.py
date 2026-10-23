"""
Training script — run manually or via a scheduled job.
Usage: python model/trainer.py --node DSN-001 --hours 720

Trains one LSTM model per node using the last N hours of readings.
Saves model to model/saved/{nodeId}_lstm.keras
"""
import os
import sys
import argparse
import numpy as np
from dotenv import load_dotenv

load_dotenv()
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from data.fetch_data    import get_readings, get_all_nodes
from utils.preprocessor import Preprocessor
from model.lstm_model   import build_model, save_model


def train_node(node_id: str, hours: int = 720, sequence_length: int = 24):
    print(f'\nTraining LSTM for node: {node_id}')

    # 1. Fetch training data
    df = get_readings(node_id, hours=hours)
    if len(df) < sequence_length + 10:
        print(f'  Insufficient data: {len(df)} rows — need at least {sequence_length + 10}')
        return False

    print(f'  Training on {len(df)} readings')

    # 2. Preprocess
    pre  = Preprocessor(sequence_length=sequence_length)
    data = pre.fit_transform(df)
    X, y = pre.build_sequences(data)

    if len(X) == 0:
        print(f'  Not enough sequences after preprocessing')
        return False

    # 3. Train/val split (80/20)
    split = int(len(X) * 0.8)
    X_train, X_val = X[:split], X[split:]
    y_train, y_val = y[:split], y[split:]

    # 4. Build and train model
    model = build_model(sequence_length=sequence_length)

    import tensorflow as tf
    callbacks = [
        tf.keras.callbacks.EarlyStopping(
            monitor='val_loss', patience=10, restore_best_weights=True
        ),
        tf.keras.callbacks.ReduceLROnPlateau(
            monitor='val_loss', factor=0.5, patience=5, min_lr=1e-6
        ),
    ]

    history = model.fit(
        X_train, y_train,
        validation_data=(X_val, y_val),
        epochs=100,
        batch_size=32,
        callbacks=callbacks,
        verbose=1,
    )

    # 5. Save model and preprocessor
    model_path = f'model/saved/{node_id}_lstm.keras'
    save_model(model, model_path)

    # Save preprocessor scaler
    import pickle
    scaler_path = f'model/saved/{node_id}_scaler.pkl'
    os.makedirs('model/saved', exist_ok=True)
    with open(scaler_path, 'wb') as f:
        pickle.dump(pre.scaler, f)

    best_val_loss = min(history.history['val_loss'])
    print(f'  ✅ Trained — val_loss: {best_val_loss:.4f}')
    print(f'  Saved: {model_path}')
    return True


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--node',  default='all',  help='Node ID or "all"')
    parser.add_argument('--hours', default=720,     type=int, help='Training data window (hours)')
    parser.add_argument('--seq',   default=24,      type=int, help='Sequence length')
    args = parser.parse_args()

    if args.node == 'all':
        nodes = get_all_nodes()
        print(f'Training {len(nodes)} node models...')
        for node in nodes:
            train_node(node['nodeId'], hours=args.hours, sequence_length=args.seq)
    else:
        train_node(args.node, hours=args.hours, sequence_length=args.seq)

    print('\nTraining complete.')
