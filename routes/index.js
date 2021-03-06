const express = require('express');
const router = express.Router();
const apiResponse = require('../handlers/apiResponse');
// const storeController = require('../controllers/storeController');
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');
// const reviewController = require('../controllers/reviewController');

const { catchErrors } = require('../handlers/errorHandlers')

/*
	API
*/


// router.get('/throw', (req, res) => {
// 	// const err = new ResponseError(405, 'Response Error');

// 	// // const err = Error('Thrown Error', 403);
	
// 	// // err.status = 402;

// 	// console.log(err);
// 	// throw new ResponseError(405, 'Response Error');; 
// 	apiResponse.error(res, 309, 'Hey, an error!');
// });

// router.get('/error', (err, req, res, next) => {
// 	err = Error('Returned error');
// 	err.status = 401;

// 	next();
// });

router.get('/', (req, res) => {
	console.log(`Current user is: ${req.user}`)

	if (req.user) {
		apiResponse.success(res, req.user);
	} else {
		apiResponse.error(res, 409, 'Not logged in!');
	}
});

router.post('/api/v1/auth/register', 
	authController.validateRegister,
	catchErrors(authController.register),
	catchErrors(authController.login)
);

router.post('/api/v1/auth/login', authController.login);
router.post('/api/v1/auth/logout', authController.logout);


router.get('/api/v1/users', userController.get);

	// userController.validateRegister,
	// catchErrors(userController.register),
	// function(req, res) {
 //    	res.json(req.user);
 //  });
	// authController.login);

// // Do work here
// router.get('/', catchErrors(storeController.getStores));
// router.get('/stores', catchErrors(storeController.getStores));
// router.get('/stores/page/:page', catchErrors(storeController.getStores));

// router.get('/store/:slug', catchErrors(storeController.getStoreBySlug));
// router.get('/add', 
// 	authController.isLoggedIn,
// 	storeController.addStore);
// router.post('/add', 
// 	storeController.upload,
// 	catchErrors(storeController.resize),
// 	catchErrors(storeController.createStore)); // createStore can throw errors, so we catch them here
// router.post('/add/:id', 
// 	storeController.upload,
// 	catchErrors(storeController.resize),
// 	catchErrors(storeController.updateStore));
// router.get('/stores/:id/edit', catchErrors(storeController.editStore));

// router.get('/tags', catchErrors(storeController.getStoresByTag));
// router.get('/tags/:tag', catchErrors(storeController.getStoresByTag));

// router.get('/login', userController.loginForm);
// router.post('/login', authController.login);
// router.get('/register', userController.registerForm);

// router.post('/register', 
// 	userController.validateRegister,
// 	catchErrors(userController.register),
// 	authController.login);

// router.get('/logout', authController.logout);
// router.get('/account', 
// 	authController.isLoggedIn,
// 	userController.account);
// router.post('/account', catchErrors(userController.updateAccount));
// router.post('/account/forgot', catchErrors(authController.forgot));
// router.get('/account/reset/:token', catchErrors(authController.reset));
// router.post('/account/reset/:token', 
// 	authController.confirmedPasswords,
// 	catchErrors(authController.update)
// 	);

// router.get('/map', storeController.mapPage);
// router.get('/hearts', 
// 	authController.isLoggedIn,
// 	catchErrors(storeController.getHearts));

// router.post('/reviews/:id',
// 	authController.isLoggedIn,
// 	catchErrors(reviewController.addReview));

// router.get('/top', catchErrors(storeController.getTopStores));

// /*
// 	API
// */

// router.get('/api/v1/search', catchErrors(storeController.searchStores));
// router.get('/api/v1/stores/near', catchErrors(storeController.mapStores));
// router.post('/api/v1/stores/:id/heart', catchErrors(storeController.heartStore));

module.exports = router;
