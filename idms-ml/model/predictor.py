import os
import pickle
import numpy as np
from datetime import datetime, timedelta

from data.fetch_data    import get_readings
from utils.preprocessor import Preprocessor, FEATURES
from model.lstm_model   import load_model, build_model


ALERT_THRESHOLDS = {
    'SAFE':     80,
    'WATCH':    40,
    'WARNING':  25,
    'DANGER':   15,
    'CRITICAL':  8,
}


def get_alert_level(water_level_cm: float) -> str:
    if water_level_cm <= ALERT_THRESHOLDS['CRITICAL']: return 'CRITICAL'
    if water_level_cm <= ALERT_THRESHOLDS['DANGER']:   return 'DANGER'
    if water_level_cm <= ALERT_THRESHOLDS['WARNING']:  return 'WARNING'
    if water_level_cm <= ALERT_THRESHOLDS['WATCH']:    return 'WATCH'
    return 'SAFE'


def _statistical_fallback(df, hours=24):
    """
    Simple trend-based fallback when LSTM model is not yet trained.
    Uses linear extrapolation of recent readings.
    Always returns something — prediction page never shows empty.
    """
    if len(df) == 0:
        # No data at all — return flat safe forecast
        base      = 70.0
        now       = datetime.utcnow()
        forecasts = []
        for h in range(hours):
            wl = base
            forecasts.append({
                'hour':       h + 1,
                'timestamp':  (now + timedelta(hours=h+1)).isoformat() + 'Z',
                'waterLevel': round(wl, 1),
                'alertLevel': get_alert_level(wl),
                'confidence': 0.3,
                'method':     'fallback_no_data',
            })
        return forecasts

    recent = df['waterLevel'].tail(12).values
    # Trend = average change per hour over last 12 readings
    if len(recent) > 1:
        trend = (recent[-1] - recent[0]) / len(recent)
    else:
        trend = 0.0
    # Cap trend to prevent runaway extrapolation
    trend = max(-2.0, min(2.0, trend))

    base      = float(recent[-1])
    now       = datetime.utcnow()
    forecasts = []

    for h in range(hours):
        wl = base + trend * (h + 1)
        wl = max(5.0, min(120.0, wl))  # clamp to realistic bounds
        forecasts.append({
            'hour':       h + 1,
            'timestamp':  (now + timedelta(hours=h+1)).isoformat() + 'Z',
            'waterLevel': round(wl, 1),
            'alertLevel': get_alert_level(wl),
            'confidence': max(0.4, 0.7 - h * 0.012),  # confidence decreases over time
            'method':     'statistical_trend',
        })

    return forecasts


def predict(node_id: str, hours: int = 24, sequence_length: int = 24) -> dict:
    """
    Generate flood water level forecast for the next N hours.
    Uses LSTM model if trained, falls back to statistical trend if not.

    Returns:
        {
          nodeId, method, generatedAt,
          forecast: [ { hour, timestamp, waterLevel, alertLevel, confidence } ],
          summary:  { currentLevel, maxLevel, maxLevelHour, peakAlertLevel,
                      risingTrend, recommendation }
        }
    """
    # 1. Fetch recent readings
    df = get_readings(node_id, hours=sequence_length * 3)

    # 2. Try LSTM model first
    model_path  = f'model/saved/{node_id}_lstm.keras'
    scaler_path = f'model/saved/{node_id}_scaler.pkl'
    model       = load_model(model_path)

    if model is not None and os.path.exists(scaler_path) and len(df) >= sequence_length:
        try:
            with open(scaler_path, 'rb') as f:
                scaler = pickle.load(f)

            pre        = Preprocessor(sequence_length=sequence_length)
            pre.scaler = scaler

            # Build input sequence
            scaled_data = pre.transform(df)
            x_input     = pre.build_prediction_input(scaled_data)

            # Iterative multi-step forecast
            forecasts     = []
            now           = datetime.utcnow()
            current_input = x_input.copy()

            for h in range(hours):
                pred_scaled = model.predict(current_input, verbose=0)[0][0]
                # Inverse transform the prediction
                pred_cm     = pre.inverse_water_level([pred_scaled])[0]
                pred_cm     = max(5.0, min(120.0, float(pred_cm)))

                # Confidence decreases for further-ahead predictions
                confidence = max(0.5, 0.95 - h * 0.018)

                forecasts.append({
                    'hour':       h + 1,
                    'timestamp':  (now + timedelta(hours=h+1)).isoformat() + 'Z',
                    'waterLevel': round(pred_cm, 1),
                    'alertLevel': get_alert_level(pred_cm),
                    'confidence': round(confidence, 2),
                    'method':     'lstm',
                })

                # Roll input window forward by one step
                new_row       = current_input[0, -1, :].copy()
                new_row[0]    = pred_scaled  # update waterLevel feature
                current_input = np.roll(current_input, -1, axis=1)
                current_input[0, -1, :] = new_row

            method = 'lstm'
        except Exception as e:
            print(f'LSTM prediction failed for {node_id}: {e} — using fallback')
            forecasts = _statistical_fallback(df, hours)
            method    = 'statistical_fallback'
    else:
        forecasts = _statistical_fallback(df, hours)
        method    = 'statistical_trend' if len(df) > 0 else 'fallback_no_data'

    # 3. Compute summary
    current_level = float(df['waterLevel'].iloc[-1]) if len(df) > 0 else 70.0
    levels        = [f['waterLevel'] for f in forecasts]
    max_level     = max(levels)
    max_hour      = levels.index(max_level) + 1
    peak_alert    = get_alert_level(min(levels))  # min distance = max water height

    trend_values = levels[:6]  # next 6 hours
    rising       = trend_values[-1] < trend_values[0]  # lower cm = higher water

    recommendations = {
        'SAFE':     'No action required. Continue normal monitoring.',
        'WATCH':    'Monitor closely. Pre-position rescue resources.',
        'WARNING':  'Issue public advisory. Begin voluntary evacuation.',
        'DANGER':   'Mandatory evacuation of low-lying areas.',
        'CRITICAL': 'Immediate evacuation. Activate all rescue teams.',
    }

    summary = {
        'currentLevel':   round(current_level, 1),
        'currentAlert':   get_alert_level(current_level),
        'maxLevel':       round(max_level, 1),
        'maxLevelHour':   max_hour,
        'peakAlertLevel': peak_alert,
        'risingTrend':    rising,
        'recommendation': recommendations.get(peak_alert, 'Monitor situation.'),
        'dataPoints':     len(df),
    }

    return {
        'nodeId':      node_id,
        'method':      method,
        'generatedAt': datetime.utcnow().isoformat() + 'Z',
        'forecast':    forecasts,
        'summary':     summary,
    }
