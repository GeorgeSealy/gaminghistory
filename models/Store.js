const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
const slug = require('slugs');

const storeSchema = new mongoose.Schema({
	name: {
		type: String,
		trim: true,
		required: 'Please enter a store name!'
	},
	slug: String,
	description: {
		type: String,
		trim: true
	},
	tags: [String],
	created: {
		type: Date,
		default: Date.now
	},
	location: {
		type: {
			type: String,
			default: 'Point'
		},
		coordinates: [{
			type: Number,
			required: 'You must supply coordinates!'
		}],
		address: {
			type: String,
			required: 'You must supply an address!'
		}
	},
	photo: String,
	author: {
		type: mongoose.Schema.ObjectId,
		ref: 'User',
		required: 'You must supply an author'
	}
}, {
	// toJSON: { virtuals: true },
	// toObject: { virtuals: true },
});

// Define our indexes

// Note: this is a compund index (not two separate ones)
storeSchema.index({
	name: 'text',
	description: 'text'
})

storeSchema.index({
	location: '2dsphere'
});

storeSchema.pre('save', async function(next) {

	if (!this.isModified('name')) {
		next();	// skip it
		return; // early exit
	}

	this.slug = slug(this.name);

	// Find other stores that have a similar slug
	const slugRegEx = new RegExp(`^(${this.slug})((-[0-9]*$)?)$`, 'i');
	const storesWithSlug = await this.constructor.find({ slug: slugRegEx});

	if (storesWithSlug.length) {
		this.slug = `${this.slug}-${storesWithSlug.length + 1}`;
	}

	next();
});

storeSchema.statics.getTagsList = function() {
	return this.aggregate([
		{ $unwind: '$tags'},
		{ $group: { _id: '$tags', count: { $sum: 1 } } },
		{ $sort: { count: -1 } }
		]);
};

storeSchema.statics.getTopStores = function() {
	return this.aggregate([
			// Lookup stores and poulate their reviews
			// Like virtual method below, but this works with mongoosedb directly
			// as the virtuals from mongoose aren't available to us at the lower level (mongodb)
			{ $lookup: { 
					from: 'reviews', 
					localField: '_id', 
					foreignField: 'store', 
					as: 'reviews' 
				}
			},
			// filter for only itmes with 2+ reviews
			{ $match: { 'reviews.1': { $exists: true } } },
			// Add the average reviews field
			{ $project: {
					photo: '$$ROOT.photo',
					name: '$$ROOT.name',
					slug: '$$ROOT.slug',
					reviews: '$$ROOT.reviews',
					averageRating: { $avg: '$reviews.rating' }
				} 
			},
			// Sort it by new average field
			{ $sort: { averageRating: -1 } },
			// limit to 10 at most
			 { $limit: 10 }
		]);
};

storeSchema.virtual('reviews', {
	ref: 'Review', // what model to link
	localField: '_id',	// what field on the store
	foreignField: 'store' // field on the review
});

function autoPopulate(next) {
	this.populate('reviews');
	next();
};

storeSchema.pre('find', autoPopulate);
storeSchema.pre('findOne', autoPopulate);

module.exports = mongoose.model('Store', storeSchema);
