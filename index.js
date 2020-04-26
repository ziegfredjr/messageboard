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

var redisHost = '127.0.0.1';
var redisPort = '6379';

var client = redis.createClient('//' + redisHost + ':' + redisPort);


var connection = mysql.createConnection({
	host: 'localhost',
	user: 'root',
	password: '',
	database: 'messageboard'
});

var app = express();

var http = require('http').createServer(app);
var io = require('socket.io')(http);

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
			if (
				typeof result !== 'undefined' && 
				typeof result[0] !== 'undefined' && 
				typeof result[0].password !== 'undefined' && 
				result[0].password !== '' &&
				 bcrypt.compareSync(password, result[0].password)
			) {
				result[0].image_url = imagePath(result[0].image, result[0].gender);
				result[0].last_login_time = new Date();

				//set session
				req.session.loggedin = true;
				req.session.user_key = 'user_data_' + result[0].id;

				//save to redis
				client.set(req.session.user_key, JSON.stringify(result[0]), 'EX', 604800);//expire in 1 week

				//update last login time
				connection.query(`UPDATE users SET last_login_time = NOW() WHERE id =  ?;`, [result[0].id], (err, result) => {
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
	//delete redis data
	client.del(req.session.user_key, (err, response) => {
		if (response == 1) {
			console.log('Data delete succesfully.');
		} else {
			console.log('Unable to delete user data.');
		}
		req.session.destroy();
		res.redirect('/');		
	});
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
		if (typeof result == 'undefined' || err) {
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

	//read data from redis
	client.get(req.session.user_key, (err, result) => {
		if (err) {
			console.log(err);
			throw err;
		}
		res.render('home', JSON.parse(result));
	});
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

app.get('/chat', (req, res) => {
	//redirect to logout
	if (!req.session.loggedin) {
		return res.redirect('/');
	}

	//show hide chatbox
	var chatId = typeof req.query.user !== 'undefined' ? parseInt(req.query.user) : 0;

	//read data from redis
	client.get(req.session.user_key, (err, result) => {
		if (err) {
			console.log(err);
			throw err;
		}
		result = JSON.parse(result);
		result.chatId = chatId;
		res.render('chat', result);
	});	
});

var onlineList = [];

/* socket line */
io.on('connection', (socket) => {
	var userId;

	socket.on('new online', (data) => {
		userId = parseInt(data.id);
		var newData = {"id": data.id, "name": data.name};
		onlineList.push(newData);
		console.log('new user inserted:' + JSON.stringify(newData));

		//send new list from user
		socket.emit('refresh list', onlineList);
	});

    socket.on('chat message', (data) => {
    	console.log(data);
        io.emit('chat message', data);
    });	

	socket.on('disconnect', () => {
		console.log('user disconnected id : ' + userId);
		for (var i = 0; i < onlineList.length; i++) {
			if (
				typeof onlineList[i] !== 'undefined' && 
				typeof onlineList[i].id !== 'undefined' && 
				onlineList[i].id == userId
			) {
				onlineList.splice(i, 1);
				break;
			}
		}
		//send new list from user
		socket.emit('refresh list', onlineList);
	});
});

http.listen(port);