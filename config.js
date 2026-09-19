/* ========= Pro Business settings =========
 *
 * EASY LIVE UPDATES (recommended):
 * 1) Create a free Firebase project: https://console.firebase.google.com
 * 2) Add a Web app → copy the firebaseConfig object
 * 3) Paste it below under `firebase`
 * 4) Realtime Database → Create Database → start in test mode
 * 5) Set enabled: true
 * 6) Redeploy / refresh Vercel
 *
 * Then: Admin login → edit → Save = live for everyone. No GitHub upload.
 */
window.APP_CONFIG = {
  adminPin: "pro2026",

  // Set to true after you paste your Firebase config
  enabled: false,

  firebase: {
    apiKey: "PASTE_API_KEY",
    authDomain: "PASTE_PROJECT.firebaseapp.com",
    databaseURL: "https://PASTE_PROJECT-default-rtdb.firebaseio.com",
    projectId: "PASTE_PROJECT",
    storageBucket: "PASTE_PROJECT.appspot.com",
    messagingSenderId: "PASTE_SENDER_ID",
    appId: "PASTE_APP_ID",
  },
};
