import os
import sys
from flask      import Flask, request, jsonify
from flask_cors import CORS
from dotenv     import load_dotenv

load_dotenv()
sys.path.insert(0, os.path.dirname(__file__))

from model.predictor import predict
from data.fetch_data import get_all_nodes
from utils.response  import success, error

app = Flask(__name__)
CORS(app, origins=[
    'http://localhost:5173',
    'https://your-vercel-app.vercel.app',
    os.getenv('FRONTEND_URL', '*'),
])


# ── Health check ──────────────────────────────────────────────────────────
@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status':  'healthy',
        'service': 'ResQMatrix ML Prediction Service',
        'version': '1.0.0',
    }), 200


# ── POST /predict — single node prediction ───────────────────────────────
@app.route('/predict', methods=['POST'])
def predict_route():
    try:
        body       = request.get_json() or {}
        node_id    = body.get('nodeId')
        hours      = int(body.get('hours', 24))
        seq_length = int(body.get('sequenceLength', 24))

        if not node_id:
            return error('nodeId is required', 400)

        if hours < 1 or hours > 72:
            return error('hours must be between 1 and 72', 400)

        result = predict(node_id, hours=hours, sequence_length=seq_length)
        return success(result, 'Prediction generated', meta={
            'nodeId': node_id,
            'hours':  hours,
            'method': result['method'],
        })
    except Exception as e:
        print(f'Prediction error: {e}')
        return error(f'Prediction failed: {str(e)}', 500)


# ── GET /predict/:nodeId — GET version (easier for frontend) ─────────────
@app.route('/predict/<node_id>', methods=['GET'])
def predict_get(node_id):
    try:
        hours      = int(request.args.get('hours', 24))
        seq_length = int(request.args.get('sequenceLength', 24))

        result = predict(node_id, hours=hours, sequence_length=seq_length)
        return success(result, 'Prediction generated', meta={
            'nodeId': node_id,
            'hours':  hours,
            'method': result['method'],
        })
    except Exception as e:
        print(f'Prediction error: {e}')
        return error(f'Prediction failed: {str(e)}', 500)


# ── GET /predict/all — batch prediction for all nodes ────────────────────
@app.route('/predict/all', methods=['GET'])
def predict_all():
    try:
        hours = int(request.args.get('hours', 24))
        nodes = get_all_nodes()

        if not nodes:
            return error('No active nodes found', 404)

        results = []
        for node in nodes:
            try:
                result = predict(node['nodeId'], hours=hours)
                results.append({
                    'nodeId':  node['nodeId'],
                    'name':    node.get('name', node['nodeId']),
                    'summary': result['summary'],
                    'method':  result['method'],
                })
            except Exception as e:
                results.append({
                    'nodeId': node['nodeId'],
                    'error':  str(e),
                })

        return success(results, 'Batch prediction complete', meta={
            'nodeCount': len(nodes),
            'hours':     hours,
        })
    except Exception as e:
        return error(f'Batch prediction failed: {str(e)}', 500)


# ── GET /models — list which nodes have trained models ───────────────────
@app.route('/models', methods=['GET'])
def list_models():
    model_dir = 'model/saved'
    if not os.path.exists(model_dir):
        return success([], 'No models trained yet')

    files = os.listdir(model_dir)
    trained = [
        f.replace('_lstm.keras', '')
        for f in files
        if f.endswith('_lstm.keras')
    ]
    return success(trained, f'{len(trained)} model(s) available')


if __name__ == '__main__':
    port  = int(os.getenv('PORT', 5001))
    debug = os.getenv('NODE_ENV') != 'production'
    print(f'ResQMatrix ML Service starting on port {port}')
    app.run(host='0.0.0.0', port=port, debug=debug)
