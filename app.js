var po = org.polymaps;
var moving = false;
var predictedMap, actualMap;

// create an svg element
var createMap = function(id, url, clipId) {
	var container = document.getElementById(id),
		svg = po.svg("svg"),
		group = po.svg("g"),
		mapContainer = po.svg("g"),
		clipper = po.svg("svg:clipPath"),
		rect = po.svg("svg:rect");

	// clip mask for interaction
	group.setAttribute("clip-path", "url(#" + clipId + ")");

	clipper.id = clipId;

	$(rect).attr("id", clipId + '-rect');

	rect.setAttribute("y", 0);
	rect.setAttribute("height", "100%");
	rect.setAttribute("width", "50%");
	rect.setAttribute("pointer-events", "none");
	rect.setAttribute("x", clipId == 'left-clip' ? 0 : "50%");

	// augh
	clipper.appendChild(rect);

	group.appendChild(clipper);
	group.appendChild(mapContainer);

	svg.appendChild(group);

	container.appendChild(svg);

	var map = po.map()
		.container(mapContainer)
		.zoom(12)
		.center({
			lat: 40.7170,
			lon: -73.9861
		})
		.add(po.interact());


	map.add(po.image()
		.url(
			po.url(url)
			.hosts(['a', 'b', 'c', 'd'])
		)
	);

	// keep track
	map.name = id;

	return map;
};

var scrubMap = function(position) {
	var totalWidth = $(window).width();

	var left = document.getElementById('left-clip-rect');
	left.setAttribute("width", Math.max(0, position) + 'px');

	var right = document.getElementById('right-clip-rect');
	right.setAttribute("x", position + 'px');	
	right.setAttribute("width", Math.max(0, totalWidth - position) + 'px');	
};

// glue two maps together
var mapGlue = function(a, b) {
	return function() {
		if (moving) {
			return;
		}
		moving = true;

		var center = a.center(),
			zoom = a.zoom();

		b.center(center).zoom(zoom);

		moving = false;
	};
};



$(function() {
	// url to the tiles
	var predictedTileURL = "http://{S}.tiles.mapbox.com/v3/jkeefe.map-dg0rv3jh,jkeefe.map-bz4e2who/{Z}/{X}/{Y}.png";
	var actualTileURL = "http://{S}.tiles.mapbox.com/v3/jkeefe.post-sandy-flooding,jkeefe.map-bz4e2who/{Z}/{X}/{Y}.png";

	predictedMap = createMap("map-prediction", predictedTileURL, "left-clip");
	actualMap = createMap("map-actual", actualTileURL, "right-clip");

	// listen to polymaps interaction
	actualMap.on("move", mapGlue(actualMap, predictedMap));
	predictedMap.on("move", mapGlue(predictedMap, actualMap));

	actualMap.add(po.hash());

	var scrubbing = false,
		current = $(window).width() / 2;

	$("#scrubber").draggable({ 
		axis: 'x',
		drag: function(e) {
			current = e.pageX;
			scrubMap(current);
		} 
	});

	$("#scrubber").css("left", current - 5);
});