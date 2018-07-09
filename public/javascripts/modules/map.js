import axios from 'axios';
import { $ } from './bling';

const mapOptions = {
	center: { lat: 43.2, lng: -79.8 },
	zoom: 10
};

// Better use navigator.geolocation.getCurrentPosition - day 21 javascript30.com
function loadPlaces(map, lat =  43.2, lng = -79.8) {
	axios.get(`/api/v1/stores/near?lat=${lat}&lng=${lng}`)
		.then(res => {
			const places = res.data;
			
			if (!places.length) {
				// Nice warning message
				alert('No places found!');
				return;
			}

			const bounds = new google.maps.LatLngBounds();
			const infoWindow = new google.maps.InfoWindow();

			const markers = places.map(place => {
				const [placeLng, placeLat] = place.location.coordinates;
				const position = { lat: placeLat, lng: placeLng };

				bounds.extend(position);

				const marker = new google.maps.Marker({ map, position });
				marker.place = place;

				return marker;
			});

			// When someone clicks on a marker, show details of that place
			markers.forEach(marker => marker.addListener('click', function() {

				const html = `
					<div class="popup">
						<a href="/store/${this.place.slug}">
							<img src="/uploads/${this.place.photo || 'store.png'}" alt="${this.place.name}" />
							<p>${this.place.name} - ${this.place.location.address}</p>
						</a>
					</div>
				`;
				infoWindow.setContent(html);
				infoWindow.open(map, this);
			}));

			// zoom the map to fit
			map.setCenter(bounds.getCenter());
			map.fitBounds(bounds);

		})
		.catch(console.error);
}

function makeMap(mapDiv) {
	if (!mapDiv) {
		return;
	}

	// make our map
	const map = new google.maps.Map(mapDiv, mapOptions);
	loadPlaces(map);

	const input = $('[name="geolocate"]');
	const autoComplete = new google.maps.places.Autocomplete(input);

	autoComplete.addListener('place_changed', () => {

		// Bug - if we have an info window open when we re-locate, then we can end up with two open!
		// Figure out how to close the existing one
		
		const place = autoComplete.getPlace();
		loadPlaces(map, place.geometry.location.lat(), place.geometry.location.lng());
	});
}

export default makeMap;