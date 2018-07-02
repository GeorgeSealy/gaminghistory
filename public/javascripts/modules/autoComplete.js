function autoComplete(input, latInput, lngInput) {
	if (!input) return; // Skip this from running if there is no input on the page

	const dropDown = new google.maps.places.Autocomplete(input);

	dropDown.addListener('place_changed', () => {
		const place = dropDown.getPlace();
		latInput.value = place.geometry.location.lat();
		lngInput.value = place.geometry.location.lng();
	});

	// If someone hits enter on the address field, don't submit the form
	input.on('keydown', (e) => {
		if (e.keyCode === 13) e.preventDefault();
	})
}

export default autoComplete;