(function () {
	'use strict';

	/**
	* Implementing String.format
	*/
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

	var defaultIcon = new L.Icon.Default(),
			photoLayer = new L.layerGroup([]),
			videoLayer = new L.layerGroup([]),
			blogLayer = new L.layerGroup([]),
			routeLayer = new L.layerGroup([]),
			trackerLayer = new L.layerGroup([]),
			charityLayer = new L.layerGroup([]),
			messageLayer = new L.layerGroup([]);

	var photoIcon = L.AwesomeMarkers.icon({
		prefix: 'fa',
    icon: 'camera',
		extraClasses: 'tracker-icon',
    markerColor: 'blue'
  });

	var videoIcon = L.AwesomeMarkers.icon({
		prefix: 'fa',
    icon: 'video-camera',
    markerColor: 'blue'
  });

	var carIcon = L.AwesomeMarkers.icon({
		prefix: 'fa',
    icon: 'car',
		extraClasses: 'tracker-icon',
    markerColor: 'blue'
  });

	var flagIcon = L.AwesomeMarkers.icon({
		prefix: 'fa',
    icon: 'flag-checkered',
		extraClasses: 'tracker-icon',
    markerColor: 'red'
  });

	var blogIcon = L.AwesomeMarkers.icon({
		prefix: 'fa',
    icon: 'rss',
		extraClasses: 'tracker-icon',
    markerColor: 'blue'
  });

	var routeIcon = L.AwesomeMarkers.icon({
		prefix: 'fa',
    icon: 'road',
		extraClasses: 'tracker-icon',
    markerColor: 'red'
  });

	var trackerIcon = L.AwesomeMarkers.icon({
		prefix: 'fa',
    icon: 'road',
		extraClasses: 'tracker-icon',
    markerColor: 'blue'
  });

	var charityIcon = L.AwesomeMarkers.icon({
		prefix: 'fa',
    icon: 'globe',
		extraClasses: 'tracker-icon',
    markerColor: 'green'
  });

	var messageIcon = L.AwesomeMarkers.icon({
		prefix: 'fa',
    icon: 'comment',
		extraClasses: 'tracker-icon',
    markerColor: 'blue'
  });

	/**
	* The addMarker function adds a marker to a list.
	*/
	function addMarker(lat, lng, timestamp,title, desc, resource, type) {
		var icon = defaultIcon;

		var content = ""

		if (title) {
			content = content.concat("<p><strong>{0}</strong></p>".format(title));
		} else {
			content = content.concat("<p>No Details for Point.<p>");
		}

		if (type === 'car' || type === 'tracker') {
			content = content.concat("<p>{0}</p>".format(timestamp));
		}

		if (desc) {
			content = content.concat("<p>{0}</p>".format(desc));
		}

		if (type === 'photo') {
			if (resource) {
				content = content.concat('<a href="{0}" target="_blank"><img src="{0}" class="photo-pin" alt="{1}" width="400px"/></a>'.format(resource, title));
			}
			icon = photoIcon;
		} else if (type === 'video') {
			if (resource) {
				content = content.concat('<iframe class="video-pin" width="560" height="315" src="{0}" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>'.format(resource));
			}
			icon = videoIcon;
		} else if (type === 'blog') {
			if (resource) {
				content = content.concat('<a href="{0}" class="btn btn-default btn-yakin" target="_blank">View Post</a>'.format(resource));
			}
			icon = blogIcon;
		} else if (type === 'route') {
			icon = routeIcon;
		} else if (type === 'tracker') {
			icon = trackerIcon;
		} else if (type === 'flag') {
			icon = flagIcon;
		} else if (type === 'car') {
			icon = carIcon;
		} else if (type === 'charity') {
			if (resource) {
				content = content.concat('<a href="{0}" class="btn btn-default btn-yakin" target="_blank">See More</a>'.format(resource));
			}
			icon = charityIcon;
		} else if (type === 'message') {
			icon = messageIcon;
		}

		var popup = new L.popup({ maxWidth: 580, maxHeight: 400 })
				.setContent(content);

		var marker = new L.Marker(new L.LatLng(lat, lng), { icon: icon, title: title });

		marker.bindPopup(popup);

		return marker;
	}

	/**
	* The loadPoints function loads all points from the API and adds them to the map.
	*/
	function loadPoints() {

		$.getJSON('api/v1/point/video', function(points) {
			if(points.length > 0) {
				$.each(points, function (index, point) {
					if(!point['hide'] && point['latitude'] && point['longitude']) {
						videoLayer.addLayer(addMarker(parseFloat(point['latitude']), parseFloat(point['longitude']), point['timestamp'], point['title'], point['desc'], point['resource'], 'video'));
					}
				});
			}
		});

		$.getJSON('api/v1/point/photo', function(points) {
			if(points.length > 0) {

				var photoCluster = L.photo.cluster().on('click', function (event) {
					var photo = event.layer.photo,
					template = '<a href="{link}" target="_blank"><img src="{url}"/></a><p>{caption}</p>';
					event.layer.bindPopup(L.Util.template(template, photo), {
						className: 'leaflet-popup-photo',
						minWidth: 400
					}).openPopup();
				});

				var photos = [];

				$.each(points, function (index, point) {
					if(!point['hide'] && point['latitude'] && point['longitude']) {
						// photoLayer.addLayer(addMarker(parseFloat(point['latitude']), parseFloat(point['longitude']), point['timestamp'], point['title'], point['desc'], point['resource'], 'photo'));
						photos.push({
							lat: point['latitude'],
							lng: point['longitude'],
							url: point['photo'],
							caption: point['title'],
							link: point['resource'],
							thumbnail: point['thumb']
						});
					}
				});

				photoCluster.add(photos);

				photoLayer.addLayer(photoCluster);
			}
		});

		$.getJSON('api/v1/point/blog', function(points) {
			if(points.length > 0) {
				$.each(points, function (index, point) {
					if(!point['hide'] && point['latitude'] && point['longitude']) {
						blogLayer.addLayer(addMarker(parseFloat(point['latitude']), parseFloat(point['longitude']), point['timestamp'], point['title'], point['desc'], point['resource'], 'blog'));
					}
				});
			}
		});

		$.getJSON('api/v1/point/charity', function(points) {
			if(points.length > 0) {
				$.each(points, function (index, point) {
					if(!point['hide'] && point['latitude'] && point['longitude']) {
						charityLayer.addLayer(addMarker(parseFloat(point['latitude']), parseFloat(point['longitude']), point['timestamp'], point['title'], point['desc'], point['resource'], 'charity'));
					}
				});
			}
		});

		$.getJSON('api/v1/point/message', function(points) {
			if(points.length > 0) {
				$.each(points, function (index, point) {
					if(!point['hide'] && point['latitude'] && point['longitude']) {
						messageLayer.addLayer(addMarker(parseFloat(point['latitude']), parseFloat(point['longitude']), point['timestamp'], point['title'], point['desc'], point['resource'], 'message'));
					}
				});
			}
		});

		$.getJSON('api/v1/point/route', function(points) {
			if(points.length > 0) {

				var route = new L.MarkerClusterGroup({
    			iconCreateFunction: function(cluster) {
        		return new L.DivIcon({ html: '<div><span>' + cluster.getChildCount() + '</span></div>', className: 'marker-cluster marker-cluster-red', iconSize: new L.Point(40, 40) });
    			}
				});

				// Create array of lat,lon points.
				var line_points = [],
						route_points = [];

				// Define polyline options
				var polyline_options = {
				    color: '#FF0000'
				};

				$.each(points, function (index, point) {
					if(!point['hide'] && point['latitude'] && point['longitude']) {
						route_points.push(point);
						line_points.push([point['latitude'], point['longitude']]);
					}
				});

				var start = route_points.shift();
				var finish = route_points.pop();

				$.each(route_points, function(index, point) {
					route.addLayer(addMarker(parseFloat(point['latitude']), parseFloat(point['longitude']), point['timestamp'], point['title'], point['desc'], point['resource'], 'route'));
				});

				routeLayer.addLayer(L.polyline(line_points, polyline_options));
				routeLayer.addLayer(route);
				routeLayer.addLayer(addMarker(parseFloat(start['latitude']), parseFloat(start['longitude']), start['timestamp'], start['title'], start['desc'], start['resource'], 'flag'));
				routeLayer.addLayer(addMarker(parseFloat(finish['latitude']), parseFloat(finish['longitude']), finish['timestamp'], finish['title'], finish['desc'], finish['resource'], 'flag'));
			}
		});

		$.getJSON('api/v1/point/tracker', function(points) {
			if(points.length > 0) {

				var tracker = new L.MarkerClusterGroup({
					iconCreateFunction: function(cluster) {
						return new L.DivIcon({ html: '<div><span>' + cluster.getChildCount() + '</span></div>', className: 'marker-cluster marker-cluster-blue', iconSize: new L.Point(40, 40) });
					}
				});

				// Create array of lat,lon points.
				var line_points = [],
						tracker_points = [];

				// Define polyline options
				var polyline_options = {
						color: '#0000FF'
				};

				$.each(points, function (index, point) {
					if(!point['hide'] && point['latitude'] && point['longitude']) {
						line_points.push([point['latitude'], point['longitude']]);
						tracker_points.push(point);
					}
				});

				var current = tracker_points.pop();

				$.each(tracker_points, function (index, point) {
					tracker.addLayer(addMarker(parseFloat(point['latitude']), parseFloat(point['longitude']), point['timestamp'], point['title'], point['desc'], point['resource'], 'tracker'));
				});

				trackerLayer.addLayer(L.polyline(line_points, polyline_options));
				trackerLayer.addLayer(tracker);
				trackerLayer.addLayer(addMarker(parseFloat(current['latitude']), parseFloat(current['longitude']), current['timestamp'], current['title'], current['desc'], current['resource'], 'car'));
			}
		});
	}

	/**
	* The initialize function initializes the map.
	*/
	function initialize() {
		L.mapbox.accessToken = 'pk.eyJ1Ijoiam1hbmdpMTMiLCJhIjoiMGZhNjk4OGQ1ODFlMzc4MzA1ZTk1MjdiNGQzNmJjZWQifQ.65ExVqKRSBC1HpsIVSO4Yw';

		var streets = new L.mapbox.tileLayer('mapbox.streets');
		var satellite = new L.mapbox.tileLayer('mapbox.satellite');

		var base = {
    	"Streets": streets,
			"Satellite": satellite
		};

		var overlays = {
    	"Photos": photoLayer,
    	"Videos": videoLayer,
			"Blogs": blogLayer,
			"Message": messageLayer,
			"Charity": charityLayer,
			"Route": routeLayer
		};

		var map = new L.map('map', {
    	center: [43.2358808,51.7155101],
    	zoom: 4,
    	layers: streets,
			minZoom: 3,
			maxZoom: 18,
			zoomControl: false
		});

		map.addLayer(photoLayer);
		map.addLayer(videoLayer);
		map.addLayer(blogLayer);
		map.addLayer(charityLayer);
		map.addLayer(routeLayer);
		map.addLayer(trackerLayer);
		map.addLayer(messageLayer);

		L.control.layers(base, overlays, { collapsed: false, position: 'topright' }).addTo(map);

		new L.Control.Zoom({ position: 'bottomleft' }).addTo(map);

		loadPoints();
	}

	/**
	* Initializing when the document is ready.
	*/
	$( document ).ready(function() {
		initialize();
	});

})();
