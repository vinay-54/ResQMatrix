import { initializeApp }   from 'firebase/app';
import { getAuth }         from 'firebase/auth';
import { getDatabase, ref, onValue, off } from 'firebase/database';

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL:       import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);

export const firebaseAuth = getAuth(app);
export const firebaseDB   = getDatabase(app);

// ── Listener helpers ──────────────────────────────────────────────────────

// Listen to all sensor nodes — updates in real time
export const listenToNodes = (callback) => {
  const nodesRef = ref(firebaseDB, 'idms/nodes');
  onValue(nodesRef, (snapshot) => {
    const data  = snapshot.val() || {};
    const nodes = Object.values(data);
    callback(nodes);
  });
  // Return unsubscribe function
  return () => off(nodesRef);
};

// Listen to a single sensor node
export const listenToNode = (nodeId, callback) => {
  const nodeRef = ref(firebaseDB, `idms/nodes/${nodeId}`);
  onValue(nodeRef, (snapshot) => callback(snapshot.val()));
  return () => off(nodeRef);
};

// Listen to drone telemetry
export const listenToDrone = (droneId, callback) => {
  const droneRef = ref(firebaseDB, `idms/drones/${droneId}`);
  onValue(droneRef, (snapshot) => callback(snapshot.val()));
  return () => off(droneRef);
};

// Listen to all drones
export const listenToDrones = (callback) => {
  const dronesRef = ref(firebaseDB, 'idms/drones');
  onValue(dronesRef, (snapshot) => {
    const data   = snapshot.val() || {};
    const drones = Object.values(data);
    callback(drones);
  });
  return () => off(dronesRef);
};

// Listen to system status
export const listenToSystem = (callback) => {
  const sysRef = ref(firebaseDB, 'idms/system');
  onValue(sysRef, (snapshot) => callback(snapshot.val()));
  return () => off(sysRef);
};

// Listen to active SOS incidents
export const listenToActiveSOS = (callback) => {
  const sosRef = ref(firebaseDB, 'idms/sos/active');
  onValue(sosRef, (snapshot) => {
    const data      = snapshot.val() || {};
    const incidents = Object.values(data);
    callback(incidents);
  });
  return () => off(sosRef);
};

// Listen to FWPU-X purification unit
export const listenToPurification = (unitId, callback) => {
  const unitRef = ref(firebaseDB, `idms/purification/${unitId}`);
  onValue(unitRef, (snapshot) => callback(snapshot.val()));
  return () => off(unitRef);
};

// Listen to all purification units
export const listenToAllPurification = (callback) => {
  const purRef = ref(firebaseDB, 'idms/purification');
  onValue(purRef, (snapshot) => {
    const data  = snapshot.val() || {};
    const units = Object.values(data);
    callback(units);
  });
  return () => off(purRef);
};
