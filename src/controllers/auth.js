exports.validate = (req, session) => {
    // will be called for home page (where we might depend on cookie data)
    // and called on postgame where we need form data. Prioritize form data
    console.log("In validateFunc(). Session user id is: ", session.user.id);
    console.log("Prev details are ", session.prevDetails)

    let user = req.server.app.users.find(
        (user) => (user.id === parseInt(session.user.id))
    );

    // either have a user from DB or not
    if (!user && (session.prevDetails == null || session.prevDetails == {})) {
        // return false will be 'unauthenticated'
        console.log('not valid user');
        return { valid: false };
    }

    if (user == null){
        user = {}
    }
  
    console.log("Current user is: ");
  
    // credentials object will now be available as req.auth.credentials
    
    return { valid: true,
        credentials: {
            prevDetails:{
                firstName: session.prevDetails.firstName,
                lastName: session.prevDetails.lastName,
                lastGameCode: session.prevDetails.lastGameCode
            },
            user: {
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                lastGameCode: user.lastGameCode
            }
        }
    }
  }

exports.invalid = (req, h) => {
    return 'Cannot access this without logging in!<br><a href="/">Home</a>';
}

exports.logout = (req, h) => {
    req.cookieAuth.clear();
    return h.redirect('/');
}

exports.fillFormHomePage = (req, h) => {
    let user = {}
    let prevDetails = {}
    
    if (req.auth.credentials && req.auth.credentials.prevDetails){
        console.log("we hva")
        prevDetails = req.auth.credentials.prevDetails
    }
    
    if (req.auth.credentials && req.auth.credentials.user){
        user = req.auth.credentials.user;
    }
    
    return h.view('home', {
        user: user,
        prevDetails: prevDetails
    });
}