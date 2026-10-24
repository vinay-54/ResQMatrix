const Joi = require('joi');
require('dotenv').config();

const schema = Joi.object({
  PORT:                  Joi.number().default(5000),
  NODE_ENV:              Joi.string().valid('development', 'production', 'test').default('development'),
  FRONTEND_URL:          Joi.string().required(),
  MONGODB_URI:           Joi.string().required(),
  FIREBASE_PROJECT_ID:   Joi.string().required(),
  FIREBASE_PRIVATE_KEY:  Joi.string().required(),
  FIREBASE_CLIENT_EMAIL: Joi.string().required(),
  FIREBASE_DATABASE_URL: Joi.string().required(),
  MQTT_BROKER_URL:       Joi.string().required(),
  MQTT_USERNAME:         Joi.string().required(),
  MQTT_PASSWORD:         Joi.string().required(),
  JWT_SECRET:            Joi.string().min(32).required(),
  JWT_EXPIRES_IN:        Joi.string().default('7d'),
  ML_SERVICE_URL:        Joi.string().default('http://localhost:5001'),
  THRESHOLD_SAFE:        Joi.number().default(80),
  THRESHOLD_WATCH:       Joi.number().default(40),
  THRESHOLD_WARNING:     Joi.number().default(25),
  THRESHOLD_DANGER:      Joi.number().default(15),
  THRESHOLD_CRITICAL:    Joi.number().default(8),
  MSG91_AUTH_KEY:         Joi.string().optional().allow('', null),
  MSG91_TEMPLATE_ID:     Joi.string().optional().allow('', null),
  MSG91_SENDER_ID:       Joi.string().default('RESQMX'),
}).unknown(true);

const { error, value } = schema.validate(process.env);
if (error) {
  console.error('❌ Environment validation failed:', error.message);
  process.exit(1);
}

module.exports = value;
