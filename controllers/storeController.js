const mongoose = require('mongoose');
const Store = mongoose.model('Store');
const multer = require('multer');
const jimp = require('jimp');
const uuid = require('uuid');

const multerOptions = {
	storage: multer.memoryStorage(),
	fileFilter(req, file, next) {
		const isPhoto = file.mimetype.startsWith('image/')

		if (isPhoto) {
			next(null, true);
		} else {
			next({ message: 'That file type isn\'t allowed!' }, false);
		}
	}
};

exports.homePage = (req, res) => {
	console.log(req.name);
 	res.render('index');
 };

 exports.addStore = (req, res) => {
 	res.render('editStore', {
 		title: 'Add Store'
 	});
 };

exports.upload = multer(multerOptions).single('photo');
exports.resize = async (req, res, next) => {
	// Check if there is no new file to resize
	if (!req.file) {
		next();	// Skip to the next middleware
		return;
	}

	// console.log(req.file);
	const extension = req.file.mimetype.split('/')[1];
	req.body.photo = `${uuid.v4()}.${extension}`;

	// Now we resize
	const photo = await jimp.read(req.file.buffer);
	await photo.resize(800, jimp.AUTO);
	await photo.write(`./public/uploads/${req.body.photo}`); 

	// nce we have written the file, keep going
	next();
};

exports.createStore = async (req, res) => {
 	console.log('Creating store...')
 	console.log(req.body);


 	const store = await (new Store(req.body)).save();

 	req.flash('success', `Successfully created ${store.name}. Care to leave a review?`)
 	res.redirect(`/stores/${store.slug}`);
 };

exports.getStores = async (req, res) => {

	// Query the database for a list of all stores
	const stores = await Store.find();
	res.render('stores', { title: 'Stores', stores })
}

exports.getStoreBySlug = async (req, res, next) => {

	// Query the database for the store that matches our slug
	const store = await Store.findOne({ slug: req.params.slug });

	if (!store) {
		next();
		return;
	}

	// res.json(store);
	res.render('store', { title: store.name, store })
}

exports.editStore = async (req, res) => {
	// Find store by id
	const store = await Store.findOne({ _id: req.params.id });

	// TODO: confirm owner of store

	// render out edit form
	res.render('editStore', { title: `Edit ${store.name}`, store: store});
}

 exports.updateStore = async (req, res) => {

 	// set the location type  to be a point
 	req.body.location.type = 'Point';

	// params query, data, options
 	const store = await Store.findOneAndUpdate({ _id: req.params.id }, req.body, {
 		new: true, // return new store instead of old one
 		runValidators: true
 	}).exec();	// Actually run it

 	req.flash('success', `Successfully updated <strong>${store.name}</strong>. <a href="stores/${store.slug}">View Store →</a>`)
 	res.redirect(`/stores/${store._id}/edit`);
 };
