import numpy as np
from sklearn.preprocessing import MinMaxScaler

FEATURES = ['waterLevel', 'temperature', 'humidity', 'rainfall', 'pressure']


class Preprocessor:
    def __init__(self, sequence_length=24):
        self.sequence_length = sequence_length
        self.scaler          = MinMaxScaler(feature_range=(0, 1))

    def fit_transform(self, df):
        """Fit scaler on training data and return normalised array."""
        data = df[FEATURES].ffill().fillna(0).values
        return self.scaler.fit_transform(data)

    def transform(self, df):
        """Transform new data using already-fitted scaler."""
        data = df[FEATURES].ffill().fillna(0).values
        return self.scaler.transform(data)

    def inverse_water_level(self, normalised_values):
        """Inverse transform only the waterLevel column (index 0)."""
        dummy = np.zeros((len(normalised_values), len(FEATURES)))
        dummy[:, 0] = normalised_values
        return self.scaler.inverse_transform(dummy)[:, 0]

    def build_sequences(self, data):
        """
        Build overlapping input sequences for LSTM.
        Each sequence = past N hours -> predict next water level.
        Returns X (inputs) and y (targets).
        """
        X, y = [], []
        for i in range(len(data) - self.sequence_length):
            X.append(data[i : i + self.sequence_length])
            y.append(data[i + self.sequence_length][0])  # waterLevel is index 0
        return np.array(X), np.array(y)

    def build_prediction_input(self, data):
        """Build a single input sequence for inference."""
        if len(data) < self.sequence_length:
            # Pad with first row if not enough history
            pad_rows = self.sequence_length - len(data)
            pad      = np.tile(data[0], (pad_rows, 1))
            data     = np.vstack([pad, data])
        # Take the last N rows
        return data[-self.sequence_length:].reshape(1, self.sequence_length, len(FEATURES))
