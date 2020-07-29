const { db } = require('../util/admin');

exports.getAllScreams = (req, res) => {
    db
        .collection('screams')
        .orderBy('createdAt', 'desc')
        .get()
        .then(data => {
            let screams = [];
            data.docs.map((doc) => {
                screams.push({
                    screamId: doc.id,
                    ...doc.data()
                });
            });
            return res.json(screams);
        })
        .catch(err => {
            console.error(err);
            return res.status(500).json({ error: err.code });
        })
}

exports.postScream = (req, res) => {
    const newScream = {
        body: req.body.body,
        userHandle: req.user.handle,
        userImage: req.user.imageUrl,
        createdAt: new Date().toISOString(),
        likeCount: 0,
        commentCount: 0
    };
    if (newScream.body.trim() === ''){
        res.status(400).json({body: "Should not be empty!"});
    }
    else{
        db
        .collection('screams')
        .add(newScream)
        .then(doc => {
            const resScream = newScream;
            resScream.screamId = doc.id;
            res.json(resScream);
        })
        .catch(err => {
            res.status(500).json({ error: 'something went wrong' });
            console.error(err);
        })
    }
    
}

exports.getScream = (req, res) => {
    let screamData = {};
    db.doc(`/screams/${req.params.screamId}`).get()
        .then((doc) => {
            if (!doc.exists) {
                return res.status(404).json({ error: 'Scream not found' });
            }
            screamData = doc.data();
            screamData.screamId = doc.id;
            return db.collection('comments')
                .where("screamId", "==", req.params.screamId)
                .orderBy("createdAt", "desc")
                .get();
        })
        .then((data) => {
            screamData.comments = [];
            data.forEach((doc) => {
                screamData.comments.push(doc.data());
                console.log(doc.data());
            });
            return res.json(screamData);
        })
        .catch((err) => {
            console.error(err);
            return res.status(500).json({ error: err.code });
        })
};

exports.postComment = (req, res) => {
    if (req.body.body.trim() === '') return res.status(400).json({ comment : 'Must not be empty' });
    let comment = {
        createdAt: new Date().toISOString(),
        userHandle: req.user.handle,
        body: req.body.body,
        screamId: req.params.screamId,
        userImage: req.user.imageUrl
    };
    db.doc(`/screams/${req.params.screamId}`).get()
        .then((doc) => {
            if (!doc.exists) return res.status(404).json({ error: "Scream not found" });
            return doc.ref.update({ commentCount: doc.data().commentCount + 1 });

        })
        .then(() => {
            return db.collection('comments').add(comment);
        })
        .then((doc) => {
            return res.json({ message: `comment ${doc.id} created successfully`, comment });
        })
        .catch(err => {
            console.error(err);
            return res.status(500).json({ error: err.code });
        })

};
exports.likeScream = (req, res) => {
    const likeDocument = db.collection('likes').where("userHandle", "==", req.user.handle)
        .where('screamId', '==', req.params.screamId).limit(1);

    const screamDocument = db.doc(`/screams/${req.params.screamId}`);
    let screamData;
    const newLike = {
        userHandle: req.user.handle,
        screamId: req.params.screamId
    }
    screamDocument.get()
        .then((doc) => {
            if (!doc.exists) return res.status(404).json({ error: "Scream not found" });
            screamData = doc.data();
            screamData.screamId = doc.id;
            return likeDocument.get();
        })
        .then((data) => {
            if (data.empty) {
                return db.collection('likes').add(newLike)
                    .then(() => {
                        screamData.likeCount++;
                        return screamDocument.update({ likeCount: screamData.likeCount })
                    })
                    .then(() => {
                        return res.json(screamData);
                    })
            }
            else {
                return res.status(400).json({ error: "Scream already liked by user" });
            }

        })
        .catch((err) => {
            console.error(err);
            return res.status(500).json({ error: err.code });
        })
}

exports.unlikeScream = (req, res) => {
    const likeDocument = db.collection('likes').where("userHandle", "==", req.user.handle)
        .where('screamId', '==', req.params.screamId).limit(1);

    const screamDocument = db.doc(`/screams/${req.params.screamId}`);
    let screamData;
    screamDocument.get()
        .then((doc) => {
            if (!doc.exists) return res.status(404).json({ error: "Scream not found" });
            screamData = doc.data();
            screamData.screamId = doc.id;
            return likeDocument.get();
        })
        .then((data) => {
            if (data.empty) {
                return res.status(400).json({ error: "Scream not liked by user" });
            }
            else {
                return db.doc(`/likes/${data.docs[0].id}`).delete()
                    .then(() => {
                        screamData.likeCount--;
                        return screamDocument.update({ likeCount: screamData.likeCount })
                    })
                    .then(() => {
                        return res.json(screamData);
                    })
            }

        })
        .catch((err) => {
            console.error(err);
            return res.status(500).json({ error: err.code });
        })
}

//delete scream
exports.deleteScream = (req, res) => {
    const document = db.doc(`/screams/${req.params.screamId}`);
    document.get()
        .then((doc) => {
            if (!doc.exists) return res.status(404).json({ error: 'Scream not found' });
            if (doc.data().userHandle !== req.user.handle) {
                return res.status(403).json({ error: 'Unauthorized' });
            }
            else {
                return document.delete();
            }

        })
        .then(() => {
            return res.json({message: "Scream successfully deleted"});
        })
        .catch(err => {
            console.error(err);
            return res.status(500).json({ error: err.code });
        })

}