const mongoose = require('mongoose');
const Store = mongoose.model('Store');
const User = mongoose.model('User');
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
	req.body.author = req.user._id;

 	const store = await (new Store(req.body)).save();

 	req.flash('success', `Successfully created ${store.name}. Care to leave a review?`)
 	res.redirect(`/store/${store.slug}`);
 };

exports.getStores = async (req, res) => {

	// Query the database for a list of all stores
	const stores = await Store.find().populate('reviews');
	res.render('stores', { title: 'Stores', stores })
}

exports.getStoreBySlug = async (req, res, next) => {

	// Query the database for the store that matches our slug
	const store = await Store.findOne({ slug: req.params.slug }).populate('author reviews');

	if (!store) {
		next();
		return;
	}

	// res.json(store);
	res.render('store', { title: store.name, store })
}

const confirmOwner = (store, user) => {
	if (!store.author.equals(user._id)) {
		throw Error('You must own a store in order to edit it!');
	}
};

exports.editStore = async (req, res) => {
	// Find store by id
	const store = await Store.findOne({ _id: req.params.id });

	confirmOwner(store, req.user);

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

exports.getStoresByTag = async (req, res) => {
	const tag = req.params.tag;
	const tagQuery = tag || { $exists: true };

	const tagsPromise = Store.getTagsList();
	const storesPromise = Store.find({ tags: tagQuery});

	const [tags, stores] = await Promise.all([tagsPromise,  storesPromise]);

	res.render('tag', { title: 'Tags', tags, tag, stores });
};

exports.searchStores = async (req, res) => {
	const stores = await Store
	.find({
		$text: {
			$search: req.query.q
		}
	}, {
		score: { $meta: 'textScore' }
	})
	.sort({
		score: { $meta: 'textScore' }
	})
	.limit(5);

	res.json(stores);
};

exports.mapStores = async (req, res) => {
	const coordinates = [req.query.lng, req.query.lat].map(parseFloat);

	const q = {
		location: {
			$near: {
				$geometry: {
					type: 'Point',
					coordinates
				},
				$maxDistance: 10000 // 10km
			}
		}

	};

	const stores = await Store.find(q).select('slug name description location photo').limit(10);
	res.json(stores);
};

exports.mapPage = (req, res) => {
	res.render('map', { title: 'Map'});
}

exports.heartStore = async (req, res) => {
	const hearts = req.user.hearts.map(obj => obj.toString());
	const operator = hearts.includes(req.params.id) ? '$pull' : '$addToSet';
	const user = await User
		.findByIdAndUpdate(req.user._id,
			{ [operator]: { hearts: req.params.id } },
			{ new: true }
		);

	res.json(user);
}

exports.getHearts = async (req, res) => {
	const stores = await Store.find({
		_id: { $in: req.user.hearts }
	});

	res.render('stores', { title: 'Hearted Stores', stores });
};

exports.getTopStores = async (req, res) => {
	const stores = await Store.getTopStores();

	res.render('topStores', { stores, title: '★ Top Stores!' } );
};
