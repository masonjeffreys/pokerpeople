exports.validate = (req, session) => {
    console.log("In validateFunc(). Session user id is: ", session.user.id);
  
    const user = req.server.app.players.find(
        (user) => (user.id === parseInt(session.user.id))
    );
    
    if (!user) {
        // return false will be 'unauthenticated'
        return { valid: false };
    }
  
    console.log("Current user is: ", user.id, " ", user.firstName);
  
    // credentials object will now be available as req.auth.credentials
    
    return { valid: true,
        credentials: {
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

exports.fillFormHomePage = (req, h) => {
    let user = {}
    if (req.auth.credentials && req.auth.credentials.user){
        user = req.auth.credentials.user;
    }
    return h.view('home', {
        user: user
    });
}