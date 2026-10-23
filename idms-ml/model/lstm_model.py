import os
import numpy as np
import tensorflow as tf
from tensorflow import keras

FEATURES_COUNT = 5  # waterLevel, temperature, humidity, rainfall, pressure


def build_model(sequence_length=24, features=FEATURES_COUNT):
    """
    LSTM architecture for flood water level prediction.
    Input:  (batch, sequence_length, features)
    Output: (batch, 1) — next hour water level normalised
    """
    model = keras.Sequential([
        keras.layers.Input(shape=(sequence_length, features)),

        # First LSTM layer — captures long-term patterns (daily cycles)
        keras.layers.LSTM(
            units=64,
            return_sequences=True,
            dropout=0.2,
            recurrent_dropout=0.2,
        ),

        # Second LSTM layer — captures short-term surge patterns
        keras.layers.LSTM(
            units=32,
            return_sequences=False,
            dropout=0.2,
        ),

        # Dense layers for regression output
        keras.layers.Dense(16, activation='relu'),
        keras.layers.Dropout(0.1),
        keras.layers.Dense(1, activation='linear'),  # unbounded — water level
    ])

    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=0.001),
        loss='mean_squared_error',
        metrics=['mae'],
    )

    return model


def load_model(path):
    """Load trained model from disk."""
    if not os.path.exists(path):
        return None
    return keras.models.load_model(path)


def save_model(model, path):
    """Save trained model to disk."""
    os.makedirs(os.path.dirname(path), exist_ok=True)
    model.save(path)
    print(f'Model saved to {path}')
