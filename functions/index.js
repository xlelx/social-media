const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

const config = {
    apiKey: "AIzaSyC5DWRHnyYwSoTW2-GmXgDwPuTqPaTmRdM",
    authDomain: "social-media-leo.firebaseapp.com",
    databaseURL: "https://social-media-leo.firebaseio.com",
    projectId: "social-media-leo",
    storageBucket: "social-media-leo.appspot.com",
    messagingSenderId: "93949716859",
    appId: "1:93949716859:web:61949096951375695135de",
    measurementId: "G-G0687BKC1N"
  };

const firebase = require('firebase');
firebase.initializeApp(config);

const app = require('express')();

const db = admin.firestore();

app.get('/screams', (req, res)=>{
    db
    .collection('screams')
    .orderBy('createdAt', 'desc')
    .get()
    .then(data=>{
        let screams = [];
        data.forEach((doc)=>{
            screams.push({
                screamId: doc.id,
                ...doc.data()
            });
        });
        return res.json(screams);
    })
    .catch(err=>{
        console.error(err);
    })
});

app.post('/scream', (req, res)=>{
    const newScream = {
        body: req.body.body,
        userHandle: req.body.userHandle,
        createdAt: new Date().toISOString()
    };
    db
    .collection('screams')
    .add(newScream)
    .then(doc=>{
        res.json({message: `document ${doc.id} created sucessfully`});
    })
    .catch(err=>{
        res.status(500).json({error: 'something went wrong'});
        console.error(err);
    })
});

const isEmpty = (string) => {
    return string.trim() === "";
}

const isEmail = (email)=>{
    const regEx = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return email.match(regEx);
}
//Signup route
app.post('/signup', (req, res)=>{   
    const newUser = {   
        email: req.body.email,
        password: req.body.password,
        confirmPassword: req.body.confirmPassword,
        handle: req.body.handle,    
    }
        
    let errors = {};
    if (isEmpty(newUser.email)) {
        errors.email = "must not be empty";
    } else if (!isEmail(newUser.email)){
        errors.email = "must be a valid email address";
    }

    if (isEmpty(newUser.password)) errors.password = "must not be empty";

    if (newUser.confirmPassword !== newUser.confirmPassword) errors.confirmPassword = "passwords much match";

    if (isEmpty(newUser.handle)) errors.handle = "must not be empty"    ;

    if (Object.keys(errors).length > 0) return res.status(400).json(errors);
    //validate data
    let token, userId;
    db.doc(`/users/${newUser.handle}`).get()
    .then(doc => {
        if (doc.exists){
            return res.status(400).json({handle: 'this handle is already taken'});
        }
        else{
            return firebase
            .auth()
            .createUserWithEmailAndPassword(newUser.email, newUser.password);
        }
    })
    .then(data => {
        userId = data.user.uid;
        return data.user.getIdToken();
    })
    .then(idtoken =>{
        token = idtoken;
        const userCredentials = {
            handle: newUser.handle,
            email: newUser.email,
            createdAt: new Date().toISOString(),
            userId
        };
        return db.doc(`/users/${newUser.handle}`).set(userCredentials);
    })
    .then(()=>{
        return res.status(201).json({ token });
    })
    .catch(err=>{
        console.error(err);
        if (err.code === "auth/email-already-in-use"){
            return res.status(400).json({email: "email is already in use"});
        }
        return res.status(500).json({error: err.code});
    })
})


// http://baseurl.com/api/
exports.api = functions.https.onRequest(app);
