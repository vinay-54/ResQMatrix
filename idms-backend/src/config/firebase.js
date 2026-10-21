const admin = require('firebase-admin');
const env   = require('./env');

let firebaseApp = null;

const initFirebase = () => {
  if (firebaseApp) return firebaseApp;

  firebaseApp = admin.initializeApp({
    credential: admin.credential.cert({
      projectId:   env.FIREBASE_PROJECT_ID,
      privateKey:  env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      clientEmail: env.FIREBASE_CLIENT_EMAIL,
    }),
    databaseURL: env.FIREBASE_DATABASE_URL,
  });

  return firebaseApp;
};

const getAuth      = () => admin.auth();
const getDatabase  = () => admin.database();
const getFirestore = () => admin.firestore();

module.exports = { initFirebase, getAuth, getDatabase, getFirestore };
