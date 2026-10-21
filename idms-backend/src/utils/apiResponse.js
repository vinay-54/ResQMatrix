// Standardised API response format used by all controllers
// Every response follows: { success, data, message, error, meta }

const success = (res, data, message = 'OK', statusCode = 200, meta = null) => {
  const response = { success: true, message, data };
  if (meta) response.meta = meta;
  return res.status(statusCode).json(response);
};

const created = (res, data, message = 'Created') =>
  success(res, data, message, 201);

const error = (res, message = 'Server error', statusCode = 500, errors = null) => {
  const response = { success: false, message };
  if (errors) response.errors = errors;
  return res.status(statusCode).json(response);
};

const notFound = (res, message = 'Resource not found') =>
  error(res, message, 404);

const badRequest = (res, message = 'Bad request', errors = null) =>
  error(res, message, 400, errors);

const unauthorized = (res, message = 'Unauthorized') =>
  error(res, message, 401);

const forbidden = (res, message = 'Forbidden — insufficient permissions') =>
  error(res, message, 403);

module.exports = { success, created, error, notFound, badRequest, unauthorized, forbidden };
