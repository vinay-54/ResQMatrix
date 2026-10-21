// Central export for all models
// Import from here instead of individual files in controllers

module.exports = {
  User:          require('./User'),
  SensorNode:    require('./SensorNode'),
  SensorReading: require('./SensorReading'),
  Alert:         require('./Alert'),
  SOSIncident:   require('./SOSIncident'),
  Operation:     require('./Operation'),
  RescueTeam:    require('./RescueTeam'),
  RescueCamp:    require('./RescueCamp'),
  DangerZone:    require('./DangerZone'),
  Drone:         require('./Drone'),
  DroneMission:  require('./DroneMission'),
  Purification:  require('./Purification'),
  SafetyReport:  require('./SafetyReport'),
};
