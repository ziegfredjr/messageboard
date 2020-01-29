"use strict"

var express = require('express'),
    session = require('express-session'),
	bodyParser = require('body-parser'),
	path = require('path'),
	mysql = require('mysql'),
	bcrypt = require('bcrypt'),
	fileUpload = require('express-fileupload'),
	redis = require('redis');

var port = process.env.port || 3000;

var client = redis.createClient();


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

app.use(express.static(__dirname + '/public'));

//default page
app.get('/', (req, res) => {
	if (req.session.loggedin) {
		return res.redirect('/home');
	}
	res.render('login');
});


/**
* Fetch image path
*/
function imagePath(image, gender) {
	var imagePath = "";
	if (image !== "" && image !== null) {
		imagePath = "files/profile/upload/" + image;
	} else {
		if (gender == 2) {
			imagePath = "files/profile/default.jpg";
		} else if (gender == 1) {
			imagePath = "files/profile/default_female.jpg";
		} else {
			imagePath = "files/profile/default_other.jpg";
		}
	}
	return imagePath;
}

//login action
app.post('/auth', (req, res) => {
	var email = req.body.email;
	var password = req.body.password;

	if (email && password) {
		connection.query('SELECT * FROM users WHERE email = ? LIMIT 1;', email, (err, result, fields) => {
			if (result.length > 0 && typeof result[0].password !== 'undefined' && result[0].password !== '' && bcrypt.compareSync(password, result[0].password)) {

				result[0].image_url = imagePath(result[0].image, result[0].gender);

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
		return res.redirect('/');
	}

	client.get('key-test', (err, result) => {
	if (err) {
		console.log(err);
		throw err;
	}

	console.log('GET result --> ' + result);
});

	res.render('home', req.session.user_data);
});

app.post('/upload', (req, res) => {
	if (!req.files || Object.keys(req.file).length === 0) {
		return res.status(400).send('No files were uploaded.');
	}

	let image = req.files.image_upload;

	image.mv('/public/files/profile/sample1.jpg', (err) => {
		if (err) throw err;
		res.send('File uploaded!');
	});
});

app.listen(port);