const mongoose = require('mongoose');
const User = mongoose.model('User');
const promisify = require('es6-promisify');
const passport = require('passport');


exports.loginForm = (req, res) => {
	res.render('login', { title: "Log In"});
};

exports.registerForm = (req, res) => {
	res.render('register', { title: "Register"});
};

exports.validateRegister = (req, res, next) => {

	console.log(req.body);

	req.sanitizeBody('name');
	req.checkBody('name', 'You must supply a name!').notEmpty();
	req.checkBody('email', 'That email is not valid!').isEmail();
	req.sanitizeBody('email').normalizeEmail({
		gmail_remove_dots: false,
		remove_extension: false,
		gmail_remove_subaddress: false
	});
	req.checkBody('password', 'Password cannot be blank!').notEmpty();
	req.checkBody('password-confirm', 'Confirmed password cannot be blank!').notEmpty();
	req.checkBody('password-confirm', 'Oops! Your passwords do not match.').equals(req.body.password);

	const errors = req.validationErrors();

	if (errors) {
		res.send(`Error: ${errors.map(err => err.msg)}`);
		// req.flash('error', errors.map(err => err.msg));
		// res.render('register', { title: 'Register', body: req.body, flashes: req.flash() })
		return;
	}

	// No errors
	console.log(req.body.email);

	// res.send('User validates ok');
	next();
};

exports.register = async (req, res, next) => {
	const user = new User({email: req.body.email, name: req.body.name});
	
	// Wrap an older callback based method to act like a modern "promise"
	const register = promisify(User.register, User);

	await register(user, req.body.password);
	// res.json(user);
	console.log(`Created: ${user}`);
	next(); // pass to auth controller to login
};

exports.login = async (req, res) => {
	console.log('Trying to authenticate');
	passport.authenticate('local', function(err, user, info) {

		if (err) { 
			console.log(err);
			throw Error('Authentication Error'); 
			return;
		}

		if (!user) {
			console.log('No user');
			throw Error('No user'); 
			return;
		}

		console.log(`Authenticated: ${user}`);
		req.login(user, function(err) {
      		if (err) { 
				console.log(err);
				throw Error('Authentication Error'); 
      		}

			console.log(`Current user: ${req.user}`);
			res.json(req.user);
    	});
	})(req, res);

};

exports.logout = (req, res) => {
	req.logout();
	// req.flash('success', 'You are now logged out!');
	console.log(`Current user: ${req.user}`);
	res.json(req.user);
};

exports.account = (req, res) => {
	res.render('account', { title: 'Edit Your Account' });
};

exports.updateAccount = async (req, res) => {
	const updates = {
		name: req.body.name,
		email: req.body.email
	};

	const user = await User.findOneAndUpdate(
		{ _id: req.user.id }, 
		{ $set: updates }, 
		{ new: true, runValidators: true, context: 'query' }
		);

	req.flash('success', 'Updated the profile!');
	res.redirect('/account');
};
