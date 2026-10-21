const Joi = require('joi');

// Reusable validation schemas for request bodies

const sensorDataSchema = Joi.object({
  nodeId:      Joi.string().required(),
  waterLevel:  Joi.number().required(),
  temperature: Joi.number(),
  humidity:    Joi.number(),
  pressure:    Joi.number(),
  rain:        Joi.boolean(),
  battery:     Joi.number().min(0).max(100),
  tdsInput:    Joi.number(),
  tdsOutput:   Joi.number(),
});

const sosSchema = Joi.object({
  name:     Joi.string().required(),
  phone:    Joi.string().required(),
  lat:      Joi.number().required(),
  lng:      Joi.number().required(),
  message:  Joi.string().allow(''),
  severity: Joi.string().valid('low', 'medium', 'high', 'critical').default('high'),
});

const loginSchema = Joi.object({
  email:    Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});

const operationSchema = Joi.object({
  name:        Joi.string().required(),
  type:        Joi.string().required(),
  location:    Joi.string().required(),
  lat:         Joi.number().required(),
  lng:         Joi.number().required(),
  priority:    Joi.string().valid('low', 'medium', 'high', 'critical').default('medium'),
  description: Joi.string().allow(''),
});

// Middleware factory for validating request body
const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    const errors = error.details.map(d => d.message);
    return res.status(400).json({ success: false, message: 'Validation failed', errors });
  }
  req.validatedBody = value;
  next();
};

module.exports = {
  sensorDataSchema,
  sosSchema,
  loginSchema,
  operationSchema,
  validate,
};
