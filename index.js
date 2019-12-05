"use strict"

var express = require('express'),
	bodyParser = require('body-parser'),
	path = require('path'),
	mysql = require('mysql'),
	bcrypt = require('bcrypt');
var port = 3000;

var connection = mysql.createConnection({
	host: 'localhost',
	user: 'root',
	password: 'password',
	database: 'messageboard'
});

var app = express();
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

//default page
app.get('/', (req, res) => {
	res.sendFile(path.join(__dirname + '/view/login.html'));
})

app.post('/register', (req, res) => {
	var data = req.body;
	data.password = bcrypt.hashSync(data.password, 10);
	var query = `INSERT INTO users (name, email, password, birthdate, gender, created, modified, created_ip, modified_ip) VALUES(?, ?, ?, ?, ?, NOW(), NOW(), ?, ?);`;
	res.send(data);
});

//login page
app.get('/login', (req, res) => {
	res.sendFile(path.join(__dirname + '/view/login.html'));
})

//register page
app.get('/register', (req, res) => {
	res.sendFile(path.join(__dirname + '/view/register.html'));
})

app.get('/users', (req, res) => {

return res.send(req.connection.remoteAddress);

	connection.query('SELECT * FROM users', (err, result) => {
		if (err) throw err;
		res.send(result);
	})
})


app.listen(port);