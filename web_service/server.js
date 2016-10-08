var express = require('express');
var bodyParser = require('body-parser');
var app = express();

var port = process.env.PORT || 3000;
app.use('/', express.static('./public'));
    
app.set('port', port);
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended:true }));

//Modules
var ParseManager = require('./parse_manager');


var parser = new ParseManager();


app.all('/', function(req, res, next) {
    console.log("successed login");
    req.next();
});



app.get('/parse/:ids', function(req, res) {
    var ids = req.params.ids;
    parser.parseFiles(ids, function(response) {
        console.log("res : " + response);
        res.json(response);
    });
});

app.get('/allfiles', function(req, res) {
    parser.getAllFiles(function(response) {
        console.log("res : " + response);
        res.json(response);
    });
});

app.get('/enablefile/:id', function(req, res) {
    var id = req.params.id;
    parser.enableFile(id, function(response) {
        console.log("res : " + response);
        res.json(response);
    });
});

app.get('/disablefile/:id', function(req, res) {
    var id = req.params.id;
    parser.disableFile(id, function(response) {
        console.log("res : " + response);
        res.json(response);
    });
});


app.get('/searchterm/:term', function(req, res) {
    var term = req.params.term;
    parser.searchTerm(term, function(response) {
        console.log("res : " + response);
        res.json(response);
    });
});

/*
     Registration URL's
*/
app.post('/login', function(req, res) {
    var userName = req.body.username;
    var pass = req.body.password;
    registration.login(userName, pass, function(response) {
        console.log("res : " + response);
        if(response.status == 'success'){
            userSession.userName = response.user;
            userSession.isLogedIn = true;
            userSession.isAdmin = response.isAdmin;
        }
        res.json(response);
    });
});

app.get('/insertkey/:key', function(req, res) {
    var key = req.params.key;
    registration.insertKey(key, function(response) {
        console.log("res : " + response);
        res.json(response);
    });
});

app.post('/createuser', function(req, res) {
    var userName = req.body.username;
    var pass = req.body.password;
    var mail = req.body.mail;
    var firstName = req.body.firstname;
    var lastName = req.body.lastname;
    registration.createUser(userName, pass, mail, firstName, lastName, function(response){
        console.log("res : " + response);
        res.json(response);
    });
});

app.get('/logout', function(req, res) {
    userSession.userName = "";
    userSession.isLogedIn = false;
    registration.logout();
});




/*
     Events URL's
*/
app.post('/createevent', function(req, res) {
    var eventName = req.body.eventName;
    var location = req.body.location;
    var description = req.body.description;
    console.log("eventName:" + eventName);
    console.log("description:" + description);
    console.log("location:" + location);
    eventsManager.createEvent(eventName, location, description, function(response) {
        console.log("res : " + response);
        res.json(response);
    });
});

app.get('/hideevent/:eventId', function(req, res) {
    var eventId = req.params.eventId;
    eventsManager.hideEvent(eventId, function (response) {
        console.log("res : " + response);
        res.json(response);
    });
});

app.get('/startevent/:eventId', function(req, res) {
    var eventId = req.params.eventId;
    eventsManager.startEvent(eventId, function (response) {
        console.log("res : " + response);
        res.json(response);
    });
});

app.get('/showevents', function(req, res){
    eventsManager.showEvents(function (response) {
        console.log("res : " + response);
        res.json(response);
    });
});

app.get('/joinevent/:eventId/:userName', function(req, res){
    var eventId = req.params.eventId;
    var userName = req.params.userName;
    eventsManager.joinEvent(eventId, userName, function (response) {
        console.log("res : " + response);
        res.json(response);
    });
});

app.get('/leaveevent/:eventId/:userName', function(req, res){
    var eventId = req.params.eventId;
    var userName = req.params.userName;
    eventsManager.leaveEvent(eventId, userName, function (response) {
        console.log("res : " + response);
        res.json(response);
    });
});
/*
     Feed URL's
*/
app.get('/showachievements/:userName', function(req, res) {
    console.log("show achievements url in actions");
    var userName = req.params.userName;
    if(userName == "admin") res.json({status: false});
    statistics.showAchievements(userName, function (response) {
        console.log("res : " + response);
        res.json(response);
    });
});

app.listen(port);
console.log("listening on port " + port);