const mongoose = require('mongoose');
const Store = mongoose.model('Store');

exports.homePage = (req, res) => {
	console.log(req.name);
 	res.render('index');
 };

 exports.addStore = (req, res) => {
 	res.render('editStore', {
 		title: 'Add Store'
 	});
 };

 exports.createStore = async (req, res) => {
 	console.log('Creating store...')
 	console.log(req.body);


 	const store = await (new Store(req.body)).save();

 	req.flash('success', `Successfully created ${store.name}. Care to leave a review?`)
 	res.redirect(`/store/${store.slug}`);
 };
