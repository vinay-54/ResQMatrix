from flask import jsonify


def success(data, message='OK', meta=None):
    body = {'success': True, 'message': message, 'data': data}
    if meta:
        body['meta'] = meta
    return jsonify(body), 200


def error(message='Server error', status=500, errors=None):
    body = {'success': False, 'message': message}
    if errors:
        body['errors'] = errors
    return jsonify(body), status
