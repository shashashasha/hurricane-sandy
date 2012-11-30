/*

	A small little hack to selfishly look at some 
	wonderful work by WNYC from a different angle.

	Original:
	http://project.wnyc.org/flooding-sandy-new/index.html

	Thanks to WNYC for not throwing a fit at me doing this.

	- Sha

*/
var po = org.polymaps;
var predictedMap, actualMap;

// create an svg element
var createMap = function(id, url, clipId) {
	// a lot of silly dom juggling here
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

	// acrobatic whitespace or parentheses clusterfuck, take your pick
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

// jquery sucks at svg or something
var scrubMap = function(position) {
	var totalWidth = $(window).width();

	var left = document.getElementById('left-clip-rect');
	left.setAttribute("width", Math.max(0, position) + 'px');

	var right = document.getElementById('right-clip-rect');
	right.setAttribute("x", position + 'px');	
	right.setAttribute("width", Math.max(0, totalWidth - position) + 'px');	
};

// glue two maps together
var moving = false;
var mapGlue = function(a, b) {
	return function() {
		// don't get caught in a loop
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

	// make our maps
	predictedMap = createMap("map-prediction", predictedTileURL, "left-clip");
	actualMap = createMap("map-actual", actualTileURL, "right-clip");

	// listen to polymaps interaction
	actualMap.on("move", mapGlue(actualMap, predictedMap));
	predictedMap.on("move", mapGlue(predictedMap, actualMap));

	// polymaps hash for lat lon zoom rememory
	actualMap.add(po.hash());

	// keep track of window width for when it changes
	var windowWidth = $(window).width(),
		current = windowWidth / 2;

	// move the scrubber
	$("#scrubber").draggable({ 
		axis: 'x',
		drag: function(e) {
			current = e.pageX;
			scrubMap(current);
		} 
	});

	// update on resize
	$(window).resize(function(e) {
		var newWidth = $(window).width();
		current = (current / windowWidth) * newWidth;
		windowWidth = newWidth;

		// yeah, weird right?
		scrubMap(current);
		$("#scrubber").css("left", current - 5);
	});

	// init in center
	$("#scrubber").css("left", current - 5);
});