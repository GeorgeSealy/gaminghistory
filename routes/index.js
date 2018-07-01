const express = require('express');
const router = express.Router();

// Do work here
router.get('/', (req, res) => {
	const data = {name: 'George', age: 99, here: true};
 	// res.send('Hey! It works!');
 	// res.json(data);
 	// res.send(req.query.name);
 	// res.json(req.query);
 	res.render('hello', {
 		name: 'George',
 		dog: req.query.dog

 	});
});

router.get('/reverse/:name', (req, res) => {
	const reverse = [...req.params.name].reverse().join('');
	res.send(reverse);
})

module.exports = router;
