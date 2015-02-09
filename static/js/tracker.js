var finishIcon = 'static/img/finishflag.png';	// start finish icon
var blogIcon = 'static/img/blogmarker.png';	// blog icon
var videoIcon = 'static/img/videomarker.png';	// video icon
var photoIcon = 'static/img/imgmarker.png';	// image icon
var charityIcon = 'static/img/imgmac.png'; // charity icon
var carIcon = 'static/img/car.png';	// car icon

var blogPins = [];
var photoPins = [];
var videoPins = [];
var charityPins = [];

// Implementing String.format
if (!String.prototype.format) {
	String.prototype.format = function() {
		var args = arguments;
		return this.replace(/{(\d+)}/g, function(match, number) {
			return typeof args[number] != 'undefined'
				? args[number]
				: match
			;
		});
	};
}

/**
* The Pin holds all the information about a pin.
*/
function Pin (marker, id, title, desc, resource)
{
	this.marker = marker;
	this.id = id;
	this.title = title;
	this.desc = desc;
	this.resource = resource;
	return this;
}

/**
* The MapControl adds a control to the map.
*/
function MapControl(map, text, title, callback) {
	// Create Control Div
	var controlDiv = document.createElement('div');

	// Set CSS for the control border
	var controlUI = document.createElement('div');
	controlUI.style.backgroundColor = '#fff';
	controlUI.style.border = '2px solid #fff';
	controlUI.style.borderRadius = '3px';
	controlUI.style.boxShadow = '0 2px 6px rgba(0,0,0,.3)';
	controlUI.style.cursor = 'pointer';
	controlUI.style.marginBottom = '22px';
	controlUI.style.marginLeft = '15px';
	controlUI.style.textAlign = 'center';
	controlUI.title = title;
	controlDiv.appendChild(controlUI);

	// Set CSS for the control interior
	var controlText = document.createElement('div');
	controlText.style.color = 'rgb(25,25,25)';
	controlText.style.fontFamily = 'Roboto,Arial,sans-serif';
	controlText.style.fontSize = '16px';
	controlText.style.lineHeight = '38px';
	controlText.style.paddingLeft = '5px';
	controlText.style.paddingRight = '5px';
	controlText.innerHTML = text;
	controlUI.appendChild(controlText);

	// Setup the click event listeners
	google.maps.event.addDomListener(controlUI, 'click', callback);

	controlDiv.index = 1;
	map.controls[google.maps.ControlPosition.BOTTOM_LEFT].push(controlDiv);
}

/**
* The LogoControl adds a logo to the map.
*/
function LogoControl() {
	// Create Control Div
	var controlDiv = document.createElement('div');
	controlDiv.style.padding = '5px';

	// Set CSS for the control border.
	var logoUI = document.createElement('div');
	logoUI.style.borderWidth = '0px';
	logoUI.style.cursor = 'pointer';
	logoUI.style.textAlign = 'center';
	logoUI.title = 'Yakin Logo';
	controlDiv.appendChild(logoUI);

	// Set CSS for the control interior.
	var logoText = document.createElement('div');
	logoText.style.paddingLeft = '4px';
	logoText.style.paddingRight = '4px';
	logoText.innerHTML = '<img src="static/img/logo_white.png" width="30%"/>';
	logoUI.appendChild(logoText);

	google.maps.event.addDomListener(logoUI, 'click', function() {
		window.open('http://yakinaround.com/', '_blank');
	});

	controlDiv.index = 1;
	map.controls[google.maps.ControlPosition.TOP_CENTER].push(controlDiv);
}


/**
* The togglePins function toggles a set of pins visible or not.
*/
function togglePins(pinList) {
	$.each(pinList, function (index, pin) {
		pin.marker.setVisible(!pin.marker.getVisible());
	});
}

/**
* The showPin function opens a InfoWindow with the pin information.
*/
function showPin(pin)
{
	var content = "<h2>{0}</h2><p>{1}</p><p>{2}</p>".format(pin.title, pin.resource, pin.desc);
	var infoWindow = new google.maps.InfoWindow({
		content: content
	});

	infoWindow.open(map, pin.marker)
}

/**
* The addPin function adds a pin to a list.
*/
function addPin(pos, id, title, desc, resource, icon, zIndex, pinList) {
	var marker = new google.maps.Marker({
				position: pos,
				map: map,
				title: title,
				icon: icon,
				size: new google.maps.Size(1, 1),
				zIndex: zIndex,
				visible: false
			});
	var pin = new Pin(marker, id, title, desc, resource);
	pinList.push(pin);
	new google.maps.event.addListener(pin.marker, 'click', function() {
		showPin(pin);
	});
}

/**
* The getLatLgn function create a LatLgn object based on coordinates.
*/
function getLatLgn(lat,lgn) {
	var e = NaN;
	var n = NaN;
	if((lat != null) && (lgn != null)) {
		n = parseFloat(lat);
		e = parseFloat(lgn);
	}
	if (isNaN(e) || isNaN(n)){
		return;
	}
	return new google.maps.LatLng(n,e);
}

/**
* The loadPoints function loads all points from the API and adds them to the map.
*/
function loadPoints() {
	$.getJSON('api/v1/points/video', function(points) {
		$.each(points, function (index, point) {
			addPin(getLatLgn(point['latitude'], point['longitude']), point['id'], point['pttitle'], point['ptdesc'], point['ptresource'], videoIcon, 3, videoPins);
		});
	});

	$.getJSON('api/v1/points/photo', function(points) {
		$.each(points, function (index, point) {
			addPin(getLatLgn(point['latitude'], point['longitude']), point['id'], point['pttitle'], point['ptdesc'], point['ptresource'], photoIcon, 4, photoPins);
		});
	});

	$.getJSON('api/v1/points/blog', function(points) {
		$.each(points, function (index, point) {
			addPin(getLatLgn(point['latitude'], point['longitude']), point['id'], point['pttitle'], point['ptdesc'], point['ptresource'], blogIcon, 3, blogPins);
		});
	});

	$.getJSON('api/v1/points/charity', function(points) {
		$.each(points, function (index, point) {
			addPin(getLatLgn(point['latitude'], point['longitude']), point['id'], point['pttitle'], point['ptdesc'], point['ptresource'], charityIcon, 5, charityPins);
		});
	});

	$.getJSON('api/v1/points/route', function(points) {
		$.each(points, function (index, point) {
			var finish = new google.maps.Marker({
				position: getLatLgn(point['latitude'], point['longitude']),
				map: map,
				title: point['pttitle'],
				icon: finishIcon,
				size: new google.maps.Size(1, 1.5),
				zIndex: 2
			});
		});
	});

	$.getJSON('api/v1/points/gps', function(points) {
		var linePoints = [];
		var finalPoint;
		var time;
		var en;

		$.each(points, function (index, point) {
			en = getLatLgn(point['latitude'], point['longitude']);
			linePoints.push(en);
			finalPoint = en;
			time = point['dateTime'];
		});

		var currentLocation = new google.maps.Marker({
					position: finalPoint,
					map: map,
					title: "Current Location at: " + time,
					icon: carIcon,
					animation: google.maps.Animation.DROP,
					size: new google.maps.Size(1, 1),
					zIndex: 1,
				});

		var Path = new google.maps.Polyline({
				path: linePoints,
				geodesic: true,
				strokeColor: '#FF0000',
				strokeOpacity: 1.0,
				strokeWeight: 2,
				map: map,
				geodesic: true,
				zIndex: 1
		});
	});
}

/**
* The initialize function initializes the map.
*/
function initialize() {
	var mapOptions = {
		center: new google.maps.LatLng(43.2358808,51.7155101),
		zoom: 4,
		streetViewControl: false,
		scaleControl: true
	};
	map = new google.maps.Map(document.getElementById("map-canvas"), mapOptions);

	loadPoints();

	var blogControl = new MapControl(map, "Blog", "Click to toggle blog pins.", function () {
		togglePins(blogPins);
	});

	var videoControlDiv = document.createElement('div');
	var videoControl = new MapControl(map, "Video", "Click to toggle video pins.", function () {
		togglePins(videoPins);
	});

	var photoControl = new MapControl(map, "Photo", "Click to toggle photo pins.", function () {
		togglePins(photoPins);
	});

	var charityControl = new MapControl(map, "Charity", "Click to toggle charity pins.", function () {
		togglePins(charityPins);
	});

	var logoControl = new LogoControl();
}

google.maps.event.addDomListener(window, 'load', initialize);