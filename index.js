var express = require('express'),
	path = require('path');
var port = 3000;

var app = express();

//default page
app.get('/', (req, res) => {
	res.sendFile(path.join(__dirname + '/view/login.html'));
})

//login page
app.get('/login', (req, res) => {
	res.sendFile(path.join(__dirname + '/view/login.html'));
})

//register page
app.get('/register', (req, res) => {
	res.sendFile(path.join(__dirname + '/view/register.html'));
})


app.listen(port);