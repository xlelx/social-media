const functions = require('firebase-functions');

const { getAllScreams, postScream, getScream, postComment, likeScream, unlikeScream, deleteScream } = require('./handlers/screams')

const { signup, login, uploadImage, addUserDetails, getAuthenticatedUser, getUserDetails, markNotificationsRead } = require('./handlers/users');

const { FBAuth } = require('./util/FBAuth');

const app = require('express')();
const { db } = require('./util/admin');

//scream routes
app.get('/screams', getAllScreams);
app.post('/scream', FBAuth, postScream);
app.get('/scream/:screamId', getScream);
app.delete('/scream/:screamId', FBAuth, deleteScream);
app.get('/screams/:screamId/like', FBAuth, likeScream);
app.get('/screams/:screamId/unlike', FBAuth, unlikeScream);
app.post('/screams/:screamId/comment', FBAuth, postComment);


//user routes
app.post('/signup', signup);
app.post('/login', login);
app.get('/user', FBAuth, getAuthenticatedUser);
app.post('/user/image', FBAuth, uploadImage);
app.post('/user', FBAuth, addUserDetails);
app.get('/user/:handle', getUserDetails);
app.post('/notifications', FBAuth, markNotificationsRead);


// http://baseurl.com/api/
exports.api = functions.https.onRequest(app);

exports.createNotificationOnLike = functions
    .firestore
    .document('likes/{id}')
    .onCreate(async (snapshot) => {

        try {
            const scream = await db.doc(`/screams/${snapshot.data().screamId}`).get()

            if (scream.exists && scream.data().userHandle !== snapshot.data().userHandle) {
                return await db.doc(`notifications/${snapshot.id}`).set({
                    createdAt: new Date().toISOString(),
                    recipient: scream.data().userHandle,
                    sender: snapshot.data().userHandle,
                    type: 'like',
                    read: false,
                    screamId: scream.id
                })
            }

        } catch (err) {
            console.error(err)
        }

    });
exports.deleteNotificationOnUnlike = functions.firestore.document('likes/{id}')
    .onDelete(snapshot => {
        return db.doc(`/notifications/${snapshot.id}`)
            .delete()
            .catch(err => {
                console.error(err);
            })
    });

exports.createNotificationOnComment = functions
    .firestore
    .document('comments/{id}')
    .onCreate(async snapshot => {

        try {
            const scream = await db.doc(`screams/${snapshot.data().screamId}`).get()

            if (scream.exists && scream.data().userHandle !== snapshot.data().userHandle) {
                return await db.doc(`notifications/${snapshot.id}`).set({
                    createdAt: new Date().toISOString(),
                    recipient: scream.data().userHandle,
                    sender: snapshot.data().userHandle,
                    type: 'comment',
                    read: false,
                    screamId: scream.id
                })
            }
        } catch (err) {
            console.error(err)
        }
    })

exports.onUserImageChange = functions
    .firestore
    .document('/users/{id}')
    .onUpdate((change) => {
        if (change.before.data().imageUrl !== change.after.data().imageUrl){
            const batch = db.batch();
            return db.collection('screams').where('userHandle', '==', change.before.data().handle).get()
            .then( data => {
                data.forEach(doc => {
                    const scream = db.doc(`/screams/${doc.id}`);
                    batch.update(scream, { userImage: change.after.data().imageUrl});
                })
                return batch.commit();
            })
        }
        else return true;
    })

exports.onScreamDelete = functions
.firestore
.document('/screams/{id}')
.onDelete( (snapshot, context) => {
    const screamId = context.params.id;
    const batch = db.batch();
    return db.collection('comments')
    .where('screamId', '==', screamId).get()
    .then(data => {
        data.forEach( doc => {
            batch.delete(doc.ref);
        })
        return db.collection('likes')
        .where('screamId', '==', screamId).get()
    })
    .then(data => {
        data.forEach( doc => {
            batch.delete(doc.ref);
        })
        return db.collection('notifications')
        .where('screamId', '==', screamId).get()
    })
    .then(data => {
        data.forEach( doc => {
            batch.delete(doc.ref);
        })
        return batch.commit()
    })
    .catch(err=>{
        console.error(err);
    })
})
