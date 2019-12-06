"use strict"

var express = require('express'),
    session = require('express-session'),
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
	var form = req.body;
	var dateFormat = require('dateformat');
	var gender = typeof form.gender !== 'undefined'  ? form.gender : 0;
	//hash password
	form.password = bcrypt.hashSync(form.password, 10);

	var formatted_date = dateFormat(new Date(form.birthdate), 'yyyy-mm-dd');

	var data = [
		form.name,
		form.email,
		form.password,
		formatted_date,
		gender,
		'127.0.0.1',
		'127.0.0.1'
	];

	var query = `INSERT INTO users (name, email, password, birthdate, gender, created, modified, created_ip, modified_ip) VALUES(?, ?, ?, ?, ?, NOW(), NOW(), ?, ?);`;
	connection.query(query, data, (err, result) => {
		var info = {error: '', result: ''};
		if (err) {
			info.error = err;
			return res.send(info);
		}
		info.result = result;
		return res.send(info);
	})
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