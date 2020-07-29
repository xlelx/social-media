const admin = require('firebase-admin');
const serviceAccount = require('../key/admin.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://social-media-leo.firebaseio.com",
    storageBucket: "social-media-leo.appspot.com"
});

const db = admin.firestore();

module.exports = {admin, db};