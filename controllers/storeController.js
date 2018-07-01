exports.myMiddleware = (req, res, next) => {
	req.name = 'George';

	// if (req.name === 'George') {
	// 	throw Error('Not a good path');
	// }
	
	next();
};

exports.homePage = (req, res) => {
	console.log(req.name);
 	res.render('index');
 };