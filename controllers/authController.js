const passport = require('passport');
const crypto = require('crypto');
const mongoose = require('mongoose');
const User = mongoose.model('User');
const promisify = require('es6-promisify');
const mail = require('../handlers/mail');

exports.login = passport.authenticate('local', {
	failureRedirect: '/login',
	failureFlash: 'Failed Login!',
	successRedirect: '/',
	successFlash: 'You are now logged in!'
});

exports.logout = (req, res) => {
	req.logout();
	req.flash('success', 'You are now logged out!');
	res.redirect('/');
};

exports.isLoggedIn = (req, res, next) => {
	// First check if the user is authenticated
	if (req.isAuthenticated()) {
		next();
		return;
	}

	req.flash('error', 'Oops, you must be logged in to do that!');
	res.redirect('/login');
}

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
	res.json(req.user);
};

exports.forgot = async (req, res) => {
	// Does user exist?
	const user = await User.findOne({ email: req.body.email });
	if (!user) {
		// Security implication - don't tell them this is a failure result
		req.flash('success', 'A password reset has been emailed to you.');
		res.redirect('/login');
		return;
	}

	// Set reset token and expiry on account
	user.resetPasswordToken = crypto.randomBytes(20).toString('hex');
	user.resetPasswordExpires = Date.now() + 3600000; // 1 hour from now
	await user.save();

	// Send email with the token
	const resetURL = `http://${req.headers.host}/account/reset/${user.resetPasswordToken}`;
	await mail.send({
		user,
		subject: "Password Reset",
		resetURL,
		filename: 'password-reset'
	});
	req.flash('success', `A password reset has been emailed to you.`);

	// redirect to login page
	// req.flash('success', 'A password reset has been emailed to you.');
	res.redirect('/login');
};

exports.reset = async (req, res) => {
	const user = await User.findOne({
		resetPasswordToken: req.params.token,
		resetPasswordExpires: { $gt: Date.now() }
	});

	if (!user) {
		req.flash('error', 'Password reset is invalid or has expired.');
		res.redirect('/login');
		return;
	}

	// if there is a user, show the reset form
	res.render('reset', { title: 'Reset your password'});
};

exports.confirmedPasswords = (req, res, next) => {
	if (req.body.password === req.body['confirm-password']) {
		next(); // We're cool, continue on
		return;
	}

	req.flash('error', 'Passwords do not match!');
	res.redirect('back');
};

exports.update = async (req, res) => {
		const user = await User.findOne({
		resetPasswordToken: req.params.token,
		resetPasswordExpires: { $gt: Date.now() }
	});

	if (!user) {
		req.flash('error', 'Password reset is invalid or has expired.');
		res.redirect('/login');
		return;
	}

	const setPassword = promisify(user.setPassword, user);
	await setPassword(req.body.password);
	user.resetPasswordToken = undefined;
	user.resetPasswordExpires = undefined;

	const updatedUser = await user.save();
	await req.login(updatedUser);
	req.flash('success', 'Password has been reset. You are now logged in.');
	res.redirect('/');
};
