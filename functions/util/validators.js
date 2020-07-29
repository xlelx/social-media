

const isEmpty = (string) => {
    return string.trim() === "";
}

const isEmail = (email)=>{
    const regEx = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return email.match(regEx);
}

exports.validateSignupData = (data)=>{
    let errors = {};
    if (isEmpty(data.email)) {
        errors.email = "must not be empty";
    } else if (!isEmail(data.email)){
        errors.email = "must be a valid email address";
    }

    if (isEmpty(data.password)) errors.password = "must not be empty";

    if (data.confirmPassword !== data.confirmPassword) errors.confirmPassword = "passwords much match";

    if (isEmpty(data.handle)) errors.handle = "must not be empty";

    return {
        errors,
        valid: Object.keys(errors).length === 0
    }
}

exports.validateLoginData= (data)=> {
    let errors = {};

    if (isEmpty(data.email)) errors.email = "must not be empty";
    if (isEmpty(data.password)) errors.password = "must not be empty";

    return {
        errors,
        valid: Object.keys(errors).length === 0
    }
}

exports.reduceUserDetails = (data) => {
    let userDetails = {};

    if (!isEmpty(data.bio.trim())) userDetails.bio = data.bio;
    if (!isEmpty(data.website.trim())){
        if (data.website.trim().substring(0, 4) !== 'http'){
            userDetails.website = `http://${data.website.trim()}`;
        }
        else userDetails.website = data.website;
    }
    if (!isEmpty(data.location.trim())) userDetails.location = data.location;

    return userDetails;
    
}