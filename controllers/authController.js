const passport = require('passport');
const crypto = require('crypto');
const mongoose = require('mongoose');
const User = mongoose.model('User');
const promisify = require('es6-promisify');

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
	req.flash('success', `A password reset has been emailed to you. ${resetURL}`);

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
