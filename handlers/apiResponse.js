const apiPkg = function(res, status, pkg, error) {
	const apiPkg = {
		status,
		pkg,
		error
	};

	//console.log(`apiPkg: ${apiPkg}`);
	if (res.apiStartTime) {
		console.log(`Start ${res.apiStartTime}`);

		const endTime = Date.now();
		console.log(`End ${endTime}`);
		console.log(`Duration ${endTime - res.apiStartTime}`);
		apiPkg.delta_ms = endTime - res.apiStartTime;
	}

	res.status(status || 500);
	res.json(apiPkg);
};

exports.error = function(res, status, error) {
	
	const errorDetail = {
		error
	};

	// TODO: only add stack trace in development
	Error.captureStackTrace(errorDetail);

	apiPkg(res, status || 500, null, errorDetail);
};

exports.success = function(res, pkg) {
	apiPkg(res, 200, pkg, null);
};
