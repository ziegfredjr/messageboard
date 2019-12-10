"use strict"

var express = require('express'),
    session = require('express-session'),
	bodyParser = require('body-parser'),
	path = require('path'),
	mysql = require('mysql'),
	bcrypt = require('bcrypt');

var port = process.env.port || 3000;

var connection = mysql.createConnection({
	host: 'localhost',
	user: 'root',
	password: 'password',
	database: 'messageboard'
});

var app = express();

app.use(session({
	secret: 'secret',
	resave: true,
	saveUninitialized: true
}));

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.set("view engine","ejs");

//default page
app.get('/', (req, res) => {
	if (req.session.loggedin) {
		return res.redirect('/home');
	}
	res.render('login');
});

//login action
app.post('/auth', (req, res) => {
	var email = req.body.email;
	var password = req.body.password;

	if (email && password) {
		connection.query('SELECT * FROM users WHERE email = ? LIMIT 1;', email, (err, result, fields) => {
			if (result.length > 0 && typeof result[0].password !== 'undefined' && result[0].password !== '' && bcrypt.compareSync(password, result[0].password)) {
				//set session
				req.session.loggedin = true;
				req.session.user_data = result[0];
				req.session.user_data.last_login_time = new Date();
				//update last login time
				connection.query(`UPDATE users SET last_login_time = NOW() WHERE id =  ?;`, [req.session.user_data.id], (err, result) => {
					console.log('Updating last login time:::');
					console.log(result);
				});
				res.redirect('/home');
			} else {
				res.redirect('/login?stat=Incorrect_password');
			}
			res.end();
		});
	} else {
		res.send('Please enter email and password');
		res.end();
	}
});

app.get('/logout', (req, res) => {
	req.session.destroy();
	res.redirect('/');
});

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
	if (req.session.loggedin) {
		return res.redirect('/home');
	}
	res.render('login');
})

//register page
app.get('/register', (req, res) => {
	if (req.session.loggedin) {
		return res.redirect('/home');
	}		
	res.render('register');
});

app.get('/home', (req, res) => {
	if (!req.session.loggedin) {
		res.redirect('/');
	}
	res.render('home', req.session.user_data);
});


app.listen(port);