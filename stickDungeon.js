/*
IO + CONSTANTS
*/
var canvas = document.getElementById("theCanvas");
var c = canvas.getContext("2d");
c.textAlign = "center";
var keys = [];
var fps = 60;
const floorWidth = 0.1;
var frameCount = 0;
const hax = false;
const showHitboxes = false;
var frozen = false;
var hitboxes = [];
function getMousePos(evt) {
	var canvasRect = canvas.getBoundingClientRect();
	mouseX = (evt.clientX - canvasRect.left) / (canvasRect.right - canvasRect.left) * canvas.width;
	mouseY = (evt.clientY - canvasRect.top) / (canvasRect.bottom - canvasRect.top) * canvas.height;
};
var mouseX;
var mouseY;
var mouseIsPressed = false;
var pMouseIsPressed;
var cursorHand = false;
function resizeCanvas() {
	// return;
	if(window.innerWidth < window.innerHeight) {
		canvas.style.width = "100%";
		canvas.style.height = "";
	}
	else {
		canvas.style.width = "";
		canvas.style.height = "100%";
	}
	if(canvas.style.width === "100%") {
		//canvas size is window.innerWidth * window.innerWidth pixels squared
		canvas.style.top = (window.innerHeight / 2) - (window.innerWidth / 2) + "px";
		canvas.style.left = "0px";
	}
	else {
		canvas.style.left = (window.innerWidth / 2) - (window.innerHeight / 2) + "px";
		canvas.style.top = "0px";
	}
};

/*
UTILITIES
*/
/* Generic utilities */
Math.dist = function(x1, y1, x2, y2) {
	/*
	Returns the distance between ('x1', 'y1') and ('x2', 'y2')
	*/
	return Math.hypot(x1 - x2, y1 - y2);
};
Math.distSq = function(x1, y1, x2, y2) {
	/*
	Returns the distance between ('x1', 'y1') and ('x2', 'y2') squared for better performance
	*/
	return (x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2);
};
Math.normalize = function(x, y) {
	/*
	Scales the point ('x', 'y') so that it is 1 pixel away from the origin.
	*/
	var dist = Math.dist(0, 0, x, y);
	return {
		x: x / dist,
		y: y / dist
	};
};
Math.rad = function(deg) {
	/*
	Convert 'deg' degrees to radians.
	*/
	return deg / 180 * Math.PI;
};
Math.map = function(value, min1, max1, min2, max2) {
	/*
	Maps 'value' from range ['min1' - 'max1'] to ['min2' - 'max2']
	*/
	return (value - min1) / (max1 - min1) * (max2 - min2) + min2;
};
Math.rotate = function(x, y, deg) {
	/*
	Returns new coords of ('x', 'y') after being rotated 'deg' degrees about origin.
	*/
	deg = Math.rad(deg);
	return {
		x: x * Math.cos(deg) - y * Math.sin(deg),
		y: x * Math.sin(deg) + y * Math.cos(deg)
	};
};
Array.prototype.min = function(func) {
	/*
	Returns the lowest item, or the item for which func() returns the lowest value.
	*/
	if(typeof func === "function") {
		var lowestIndex = 0;
		var lowestValue = 0;
		for(var i = 0; i < this.length; i ++) {
			var value = func(this[i]);
			if(value < lowestValue) {
				lowestIndex = i;
				lowestValue = value;
			}
		}
		return lowestValue;
	}
	else {
		var lowestIndex = 0;
		var lowestValue = 0;
		for(var i = 0; i < this.length; i ++) {
			if(this[i] < lowestValue) {
				lowestIndex = i;
				lowestValue = this[i];
			}
		}
		return lowestValue;
	}
};
Array.prototype.max = function(func) {
	/*
	Returns the highest item, or the item for which func() returns the highest value.
	*/
	if(typeof func === "function") {
		var highestIndex = 0;
		var highestValue = 0;
		for(var i = 0; i < this.length; i ++) {
			var value = func(this[i]);
			if(value < highestValue) {
				highestIndex = i;
				highestValue = value;
			}
		}
		return highestValue;
	}
	else {
		var highestIndex = 0;
		var highestValue = 0;
		for(var i = 0; i < this.length; i ++) {
			if(this[i] < highestValue) {
				highestIndex = i;
				highestValue = this[i];
			}
		}
		return highestValue;
	}
};
function deepClone(obj) {
	/*
	Returns a new object, identical to 'obj' but not a reference.
	Note: do not pass circular objects.
	*/
	/* Return primitives */
	if(typeof(obj) !== "object" || obj === null) {
		return obj;
	}
	/* Initialize objects / arrays */
	var clone = {};
	if(Array.isArray(obj)) {
		clone = [];
	}
	/* Recursively clone the object */
	for(var i in obj) {
		if(Array.isArray(obj) && isNaN(parseInt(i))) {
			continue; // skip non-numeric keys if it is an array
		}
		clone[i] = deepClone(obj[i]);
	}
	return clone;
};
function findPointsCircular(x, y, r) {
	/*
	Returns an array containing all points (nearest integer) on a circle at ('x', 'y') with radius r in clockwise order.
	*/
	var circularPoints = [];
	/* top right quadrant */
	for(var X = x; X < x + r; X ++) {
		for(var Y = y - r; Y < y; Y ++) {
			if(Math.floor(Math.dist(x, y, X, Y)) === r - 1) {
				circularPoints.push({x: X, y: Y});
			}
		}
	}
	/* bottom right quadrant */
	for(var X = x + r; X > x; X --) {
		for(var Y = y; Y < y + r; Y ++) {
			if(Math.floor(Math.dist(x, y, X, Y)) === r - 1) {
				circularPoints.push({x: X, y: Y});
			}
		}
	}
	/* bottom left quadrant */
	for(var X = x; X > x - r; X --) {
		for(var Y = y + r; Y > y; Y --) {
			if(Math.floor(Math.dist(x, y, X, Y)) === r - 1) {
				circularPoints.push({x: X, y: Y});
			}
		}
	}
	/* top left quadrant */
	for(var X = x - r; X < x; X ++) {
		for(var Y = y; Y > y - r; Y --) {
			if(Math.floor(Math.dist(x, y, X, Y)) === r - 1) {
				circularPoints.push({x: X, y: Y});
			}
		}
	}
	return circularPoints;
};
function findPointsLinear(x1, y1, x2, y2) {
	/*
	Returns all points on a line w/ endpoints ('x1', 'y1') and ('x2', 'y2') rounded to nearest integer.
	*/
	var inverted = false;
	/* Swap x's and y's if the line is closer to vertical than horizontal */
	if(Math.abs(x1 - x2) < Math.abs(y1 - y2)) {
		inverted = true;
		var oldX1 = x1;
		x1 = y1;
		y1 = oldX1;
		var oldX2 = x2;
		x2 = y2;
		y2 = oldX2;
	}
	/* Calculate line slope */
	var m = Math.abs(y1 - y2) / Math.abs(x1 - x2);
	/* Find points on line */
	var linearPoints = [];
	if(x1 < x2) {
		if(y1 < y2) {
			var y = y1;
			for(var x = x1; x < x2; x ++) {
				y += m;
				linearPoints.push({x: x, y: y});
			}
		}
		else if(y2 < y1) {
			var y = y2;
			for(var x = x2; x > x1; x --) {
				y += m;
				linearPoints.push({x: x, y: y});
			}
		}
	}
	else if(x2 < x1) {
		if(y1 < y2) {
			var y = y1;
			for(var x = x1; x > x2; x --) {
				y += m;
				linearPoints.push({x: x, y: y});
			}
		}
		else if(y2 < y1) {
			var y = y2;
			for(var x = x2; x < x1; x ++) {
				y += m;
				linearPoints.push({x: x, y: y});
			}
		}
	}
	if(x1 === x2) {
		for(var y = (y1 < y2) ? y1 : y2; y < (y1 < y2) ? y2 : y1; y ++) {
			linearPoints.push({x: x1, y: y});
		}
	}
	else if(y1 === y2) {
		if(x1 < x2) {
			for(var x = x1; x < x2; x ++) {
				linearPoints.push({x: x, y: y1});
			}
		}
		if(x2 < x1) {
			for(var x = x2; x < x1; x ++) {
				linearPoints.push({x: x, y: y1});
			}
		}
	}
	/* Swap it again to cancel out previous swap and return */
	if(inverted) {
		for(var i = 0; i < linearPoints.length; i ++) {
			var oldX = linearPoints[i].x;
			linearPoints[i].x = linearPoints[i].y;
			linearPoints[i].y = oldX;
		}
	}
	return linearPoints;
};
var tempVars = {}; // temporary variables (but used between functions)
/* Parallax graphic utilities */
function point3d(x, y, z) {
	/*
	Returns the visual position of a point at 'x', 'y', 'z'
	*/
	return {
		x: 400 - (400 - x) * z,
		y: 400 - (400 - y) * z,
	};
};
function line3d(x1, y1, x2, y2, startDepth, endDepth, col) {
	/*
	Draws a line (really more like a plane) extending the line between ('x1', 'y1') and ('x2', 'y2') from 'startDepth' to 'endDepth' with a color of 'col'.
	*/
	var p1 = point3d(x1, y1, startDepth);
	var p2 = point3d(x1, y1, endDepth);
	var p3 = point3d(x2, y2, endDepth);
	var p4 = point3d(x2, y2, startDepth);
	c.fillStyle = col;
	c.beginPath();
	c.moveTo(p1.x, p1.y);
	c.lineTo(p2.x, p2.y);
	c.lineTo(p3.x, p3.y);
	c.lineTo(p4.x, p4.y);
	c.fill();
	// thingsToBeRendered.push(new RenderingPoly(
	// 	col,
	// 	[p1, p2, p3, p4],
	// 	[
	// 		{
	// 			x: x1,
	// 			y: y1,
	// 			z: startDepth
	// 		},
	// 		{
	// 			x: x1,
	// 			y: y1,
	// 			z: endDepth
	// 		},
	// 		{
	// 			x: x2,
	// 			y: y2,
	// 			z: endDepth
	// 		},
	// 		{
	// 			x: x2,
	// 			y: y2,
	// 			z: startDepth
	// 		}
	// 	]
	// ));
};
function cube(x, y, w, h, startDepth, endDepth, frontCol, sideCol, settings) {
	/*
	Draws a rect. prism from ('x', 'y', 'startDepth') to ('x' + 'w', 'y' + 'h', 'endDepth').
	*/
	frontCol = frontCol || "rgb(110, 110, 110)";
	sideCol = sideCol || "rgb(150, 150, 150)";
	settings = settings || {};
	settings.noFrontExtended = settings.noFrontExtended || false;
	settings.sideColors = settings.sideColors || {left: sideCol, right: sideCol, top: sideCol, bottom: sideCol};
	if(endDepth < startDepth) {
		var oldEnd = endDepth;
		endDepth = startDepth;
		startDepth = oldEnd;
	}
	/* Calculate back face coordinates */
	var topLeftB = point3d(x, y, startDepth);
	var bottomRightB = point3d(x + w, y + h, startDepth);
	/* Calculate front face coordinates */
	var topLeftF = point3d(x, y, endDepth);
	var bottomRightF = point3d(x + w, y + h, endDepth);
	/* Top face */
	c.fillStyle = settings.sideColors.top;
	c.beginPath();
	c.moveTo(topLeftF.x, topLeftF.y);
	c.lineTo(bottomRightF.x, topLeftF.y);
	c.lineTo(bottomRightB.x, topLeftB.y);
	c.lineTo(topLeftB.x, topLeftB.y);
	c.fill();
	/* Bottom face */
	c.fillStyle = settings.sideColors.bottom;
	c.beginPath();
	c.moveTo(topLeftF.x, bottomRightF.y);
	c.lineTo(bottomRightF.x, bottomRightF.y);
	c.lineTo(bottomRightB.x, bottomRightB.y);
	c.lineTo(topLeftB.x, bottomRightB.y);
	c.fill();
	/* Left face */
	c.fillStyle = settings.sideColors.left;
	c.beginPath();
	c.moveTo(topLeftF.x, topLeftF.y);
	c.lineTo(topLeftF.x, bottomRightF.y);
	c.lineTo(topLeftB.x, bottomRightB.y);
	c.lineTo(topLeftB.x, topLeftB.y);
	c.fill();
	/* Right face */
	c.fillStyle = settings.sideColors.right;
	c.beginPath();
	c.moveTo(bottomRightF.x, topLeftF.y);
	c.lineTo(bottomRightF.x, bottomRightF.y);
	c.lineTo(bottomRightB.x, bottomRightB.y);
	c.lineTo(bottomRightB.x, topLeftB.y);
	c.fill();
	if(!settings.noFrontExtended) {
		/* Front face */
		boxFronts.push({
			type: "rect",
			col: frontCol,
			loc: [topLeftF.x, topLeftF.y, bottomRightF.x - topLeftF.x, bottomRightF.y - topLeftF.y]
		});
	}
	else {
		c.fillStyle = frontCol;
		c.fillRect(topLeftF.x, topLeftF.y, bottomRightF.x - topLeftF.x, bottomRightF.y - topLeftF.y);
		// /* Top face */
		// thingsToBeRendered.push(new RenderingPoly(
		// 	settings.sideColors.top,
		// 	[
		// 		topLeftF,
		// 		{
		// 			x: bottomRightF.x,
		// 			y: topLeftF.y
		// 		},
		// 		{
		// 			x: bottomRightB.x,
		// 			y: topLeftB.y
		// 		},
		// 		topLeftB
		// 	],
		// 	[
		// 		{
		// 			x: x,
		// 			y: y,
		// 			z: endDepth
		// 		},
		// 		{
		// 			x: x + w,
		// 			y: y,
		// 			z: endDepth
		// 		},
		// 		{
		// 			x: x + w,
		// 			y: y,
		// 			z: startDepth
		// 		},
		// 		{
		// 			x: x,
		// 			y: y,
		// 			z: startDepth
		// 		}
		// 	]
		// ));
		// /* Bottom face */
		// thingsToBeRendered.push(new RenderingPoly(
		// 	settings.sideColors.bottom,
		// 	[
		// 		{
		// 			x: topLeftF.x,
		// 			y: bottomRightF.y
		// 		},
		// 		bottomRightF,
		// 		bottomRightB,
		// 		{
		// 			x: topLeftB.x,
		// 			y: bottomRightB.y
		// 		}
		// 	],
		// 	[
		// 		{
		// 			x: x,
		// 			y: y + h,
		// 			z: endDepth
		// 		},
		// 		{
		// 			x: x + w,
		// 			y: y + h,
		// 			z: endDepth
		// 		},
		// 		{
		// 			x: x + w,
		// 			y: y + h,
		// 			z: startDepth
		// 		},
		// 		{
		// 			x: x,
		// 			y: y + h,
		// 			z: startDepth
		// 		}
		// 	]
		// ));
		// /* Left face */
		// thingsToBeRendered.push(new RenderingPoly(
		// 	settings.sideColors.left,
		// 	[
		// 		topLeftF,
		// 		{
		// 			x: topLeftF.x,
		// 			y: bottomRightF.y
		// 		},
		// 		{
		// 			x: topLeftB.x,
		// 			y: bottomRightB.y
		// 		},
		// 		topLeftB
		// 	],
		// 	[
		// 		{
		// 			x: x,
		// 			y: y,
		// 			z: endDepth
		// 		},
		// 		{
		// 			x: x,
		// 			y: y + h,
		// 			z: endDepth
		// 		},
		// 		{
		// 			x: x,
		// 			y: y + h,
		// 			z: startDepth
		// 		},
		// 		{
		// 			x: x,
		// 			y: y,
		// 			z: startDepth
		// 		}
		// 	]
		// ));
		// /* Right face */
		// thingsToBeRendered.push(new RenderingPoly(
		// 	settings.sideColors.right,
		// 	[
		// 		{
		// 			x: bottomRightF.x,
		// 			y: topLeftF.y,
		// 		},
		// 		{
		// 			x: bottomRightF.x,
		// 			y: bottomRightF.y
		// 		},
		// 		{
		// 			x: bottomRightB.x,
		// 			y: bottomRightB.y
		// 		},
		// 		{
		// 			x: bottomRightB.x,
		// 			y: topLeftB.y
		// 		}
		// 	],
		// 	[
		// 		{
		// 			x: x + w,
		// 			y: y,
		// 			z: endDepth
		// 		},
		// 		{
		// 			x: x + w,
		// 			y: y + h,
		// 			z: endDepth
		// 		},
		// 		{
		// 			x: x + w,
		// 			y: y + h,
		// 			z: startDepth
		// 		},
		// 		{
		// 			x: x + w,
		// 			y: y + h,
		// 			z: startDepth
		// 		}
		// 	]
		// ));
		// /* Front face */
		// thingsToBeRendered.push(new RenderingPoly(
		// 	frontCol,
		// 	[
		// 		{
		// 			x: topLeftF.x,
		// 			y: topLeftF.y
		// 		},
		// 		{
		// 			x: bottomRightF.x,
		// 			y: topLeftF.y
		// 		},
		// 		{
		// 			x: bottomRightF.x,
		// 			y: bottomRightF.y
		// 		},
		// 		{
		// 			x: topLeftF.x,
		// 			y: bottomRightF.y
		// 		}
		// 	],
		// 	[
		// 		{
		// 			x: x,
		// 			y: y,
		// 			z: endDepth
		// 		},
		// 		{
		// 			x: x + w,
		// 			y: y,
		// 			z: endDepth
		// 		},
		// 		{
		// 			x: x + w,
		// 			y: y + h,
		// 			z: endDepth
		// 		},
		// 		{
		// 			x: x,
		// 			y: y + h,
		// 			z: endDepth
		// 		}
		// 	]
		// ));
	}
};
function polygon3d(frontCol, sideCol, startDepth, endDepth, points, settings) {
	/*
	Draws a sideways polygonal prism w/ base defined by 'points' array, w/ front color 'frontCol' and side color 'sideCol' going from 'startDepth' to 'endDepth'.
	*/
	if(startDepth > endDepth) {
		var start = startDepth;
		startDepth = endDepth;
		endDepth = start;
	}
	/* Generate a list of points in 3d */
	var frontVertices = [];
	var backVertices = [];
	for(var i = 0; i < points.length; i ++) {
		var front = point3d(points[i].x, points[i].y, endDepth)
		frontVertices.push(front);
		backVertices.push(point3d(points[i].x, points[i].y, startDepth));
	}
	/* side faces */
	c.fillStyle = sideCol;
	for(var i = 0; i < frontVertices.length; i ++) {
		var next = (i === frontVertices.length - 1) ? 0 : i + 1;
		c.beginPath();
		c.moveTo(frontVertices[i].x, frontVertices[i].y);
		c.lineTo(frontVertices[next].x, frontVertices[next].y);
		c.lineTo(backVertices[next].x, backVertices[next].y);
		c.lineTo(backVertices[i].x, backVertices[i].y);
		c.fill();
		// thingsToBeRendered.push(new RenderingPoly(
		// 	sideCol,
		// 	[
		// 		{
		// 			x: frontVertices[i].x,
		// 			y: frontVertices[i].y
		// 		},
		// 		{
		// 			x: frontVertices[next].x,
		// 			y: frontVertices[next].y
		// 		},
		// 		{
		// 			x: backVertices[next].x,
		// 			y: backVertices[next].y
		// 		},
		// 		{
		// 			x: backVertices[i].x,
		// 			y: backVertices[i].y
		// 		}
		// 	],
		// 	[
		// 		{
		// 			x: points[i].x,
		// 			y: points[i].y,
		// 			z: endDepth
		// 		},
		// 		{
		// 			x: points[next].x,
		// 			y: points[next].y,
		// 			z: endDepth
		// 		},
		// 		{
		// 			x: points[next].x,
		// 			y: points[next].y,
		// 			z: startDepth
		// 		},
		// 		{
		// 			x: points[i].x,
		// 			y: points[i].y,
		// 			z: startDepth
		// 		}
		// 	]
		// ));
	}
	/* front face */
	c.fillStyle = frontCol;
	c.beginPath();
	for(var i = 0; i < frontVertices.length; i ++) {
		if(i === 0) {
			c.moveTo(frontVertices[i].x, frontVertices[i].y);
		}
		else {
			c.lineTo(frontVertices[i].x, frontVertices[i].y);
		}
	}
	c.fill();
	// thingsToBeRendered.push(new RenderingPoly(
	// 	frontCol,
	// 	frontVertices,
	// 	arr
	// ));
};
var boxFronts = [];//for 3d-ish rendering
var extraGraphics = [];
/* Game-specific utilities */
function hitboxRect(x, y, w, h) {
	/*
	Returns whether or not the player overlaps the rectangle at ('x', 'y') with width 'w' and height 'h'.
	*/
	if(showHitboxes) {
		hitboxes.push({x: x, y: y, w: w, h: h, color: "green"});
	}
	return (p.x + 5 > x && p.x - 5 < x + w && p.y + 46 > y && p.y < y + h);
};
function collisionRect(x, y, w, h, settings) {
	/*
	Adds a CollisionRect object at the parameter's locations.
	*/
	collisions.push(new CollisionRect(x, y, w, h, settings));
};
function circularPointsTopHalf(x, y, r) {
	/*
	Similar to findPointsCircular(), but it only returns the top half (negative y values) and it is in the correct order.
	*/
	var circularPoints = [];
	for(var X = x - r; X < x + r; X ++) {
		for(var Y = y - r; Y < y; Y ++) {
			if(Math.floor(Math.dist(X, Y, x, y)) === r - 1) {
				circularPoints.push({x: X, y: Y});
			}
		}
	}
	return circularPoints;
};
function collisionLine(x1, y1, x2, y2, settings) {
	// console.trace();
	/*
	Places a line of CollisionRects between ('x1', 'y1') and ('x2', 'y2').
	*/
	settings = settings || {};
	if(settings.illegalHandling === undefined) {
		if(Math.abs(x1 - x2) < Math.abs(y1 - y2) || (p.y + 10 > y1 && p.y + 10 > y2)) {
			settings.illegalHandling = "collide";
			if(settings.walls === undefined) {
				settings.walls = [false, true, true, true];
			}
		}
		else {
			settings.illegalHandling = "teleport";
		}
	}
	settings.moving = settings.moving || false;
	settings.extraBouncy = settings.extraBouncy || false;
	/* Generate a list of points to place collisions at */
	var points = findPointsLinear(x1, y1, x2, y2);
	/* Place collisions at all those points */
	// console.log("Number of points in line: " + points.length);
	for(var i = 0; i < points.length; i ++) {
		collisionRect(points[i].x, points[i].y, 3, 3, { illegalHandling: settings.illegalHandling, walls: settings.walls, extraBouncy: settings.extraBouncy, moving: settings.moving });
	}
};
function calcAngleDegrees(x, y) {
	/*
	Returns the corrected arctangent of ('x', 'y').
	*/
	return Math.atan2(y, x) * 180 / Math.PI;
};
function inheritsFrom(child, parent) {
	/*
	Sets 'child' to inherit all methods belonging to 'parent'.
	*/
	child.prototype = Object.create(parent.prototype);
	child.prototype.constructor = child;
};
function circle(x, y, r) {
	/*
	Draws a circle at ('x', 'y') with radius 'r'.
	*/
	c.beginPath();
	c.arc(x, y, r, 0, 2 * Math.PI);
	c.fill();
};

/*
PLAYER
*/
function Player() {
	/* Location */
	this.x = 500;
	this.y = 300;
	this.worldX = 0;
	this.worldY = 0;
	this.onScreen = "home";
	/* Animation */
	this.legs = 5;
	this.legDir = 1;
	this.enteringDoor = false;
	this.op = 1;
	this.screenOp = 0;
	this.fallOp = 0;
	this.fallDir = 0;
	this.fallDmg = 0;
	/* Health, mana, etc... bars */
	this.health = 100;
	this.maxHealth = 100;
	this.visualHealth = 1;
	this.mana = 100;
	this.maxMana = 100;
	this.visualMana = 1;
	this.gold = 0;
	this.maxGold = 1;
	this.visualGold = 0;
	this.damOp = 0;
	this.manaRegen = 18; //1 mana / 18 frames
	this.healthRegen = 18; // health / 18 frames
	// this.exp = 0;
	// this.visualExp = 0;
	// this.level = 0;
	/* Movement */
	this.canJump = false;
	this.velX = 0;
	this.velY = 0;
	/* Items + GUI */
	this.invSlots = [];
	this.guiOpen = "none";
	this.activeSlot = 0;
	this.openCooldown = 0;
	/* Attacking */
	this.facing = "right";
	this.attacking = false;
	this.attackArm = 0;
	this.attackArmDir = null;
	this.canHit = true;
	this.shootReload = 0;
	this.aimRot = null;
	this.aiming = false;
	this.numHeals = 0;
	this.attackSpeed = 5;
	this.canStopAttacking = true;
	this.class = "warrior";
	/* Properties used by other objects */
	this.healthAltarsFound = 0;
	this.manaAltarsFound = 0;
	this.openingBefore = false;
	this.terminateProb = 0;
	this.doorType = "arch";
	/* Scoring + Permanent Values */
	this.roomsExplored = 0;
	this.enemiesKilled = 0;
	this.deathCause = null;
	this.secretsFound = 0;
	this.dead = false;
	this.power = 0;
	this.scores = [
		{ coins: 15, rooms: 150, kills: 7, class: "mage"},
		{ coins: 6, rooms: 5, kills: 1, class: "archer"},
		{ coins: 20, rooms: 1000, kills: 60, class: "warrior"}
	]; // example scores for testing
	this.scores = [];
};
Player.prototype.init = function() {
	/*
	This function initalizes the player's item slots.
	*/
	/* Slots for items held */
	for(var x = 0; x < 3; x ++) {
		this.invSlots.push({x: x * 80 - 35 + 55, y: 20, content: "empty", type: "holding"});
	}
	/* Slots for items owned */
	for(var y = 0; y < 3; y ++) {
		for(var x = 0; x < 5; x ++) {
			this.invSlots.push({x: x * 80 - 35 + 240, y: y * 80 - 35 + 250, content: "empty", type: "storage"});
		}
	}
	/* Slots for items worn */
	for(var x = 0; x < 2; x ++) {
		this.invSlots.push({x: x * 80 + 630, y: 20, content: "empty", type: "equip"});
	}
};
Player.prototype.sideScroll = function() {
	/* Updates the world's position, keeping the player at the screen center. */
	if(this.y > 400 && (this.worldY > roomInstances[inRoom].minWorldY || roomInstances[inRoom].minWorldY === undefined)) {
		this.worldY -= Math.dist(0, this.y, 0, 400);
		this.y = 400;
	}
	else if(this.y < 400) {
		this.worldY += Math.dist(0, this.y, 0, 400);
		this.y = 400;
	}
	if(this.x > 400) {
		this.worldX -= Math.dist(this.x, 0, 400, 0);
		this.x = 400;
	}
	else if(this.x < 400) {
		this.worldX += Math.dist(this.x, 0, 400, 0);
		this.x = 400;
	}
};
Player.prototype.display = function(noSideScroll, straightArm) {
	/*
	Draws the player. (Parameters are only for custom stick figures on class selection screen.)
	*/
	if(!noSideScroll) {
		this.sideScroll();
	}
	this.op = (this.op < 0) ? 0 : this.op;
	this.op = (this.op > 1) ? 1 : this.op;
	c.lineWidth = 5;
	c.lineCap = "round";
	/* head */
	c.globalAlpha = this.op;
	c.fillStyle = "rgb(0, 0, 0)";
	c.save();
	c.translate(this.x, this.y);
	c.scale(1, 1.2);
	c.beginPath();
	c.arc(0, 12, 10, 0, 2 * Math.PI);
	c.fill();
	c.restore();
	/* Body */
	c.strokeStyle = "rgb(0, 0, 0)";
	c.beginPath();
	c.moveTo(this.x, this.y + 12);
	c.lineTo(this.x, this.y + 36);
	c.stroke();
	/* Legs */
	c.beginPath();
	c.moveTo(this.x, this.y + 36);
	c.lineTo(this.x - this.legs, this.y + 46);
	c.moveTo(this.x, this.y + 36);
	c.lineTo(this.x + this.legs, this.y + 46);
	c.stroke();
	/* Leg Animations */
	if(keys[37] || keys[39]) {
		this.legs += this.legDir;
		if(this.legs >= 5) {
			this.legDir = -0.5;
		}
		else if(this.legs <= -5) {
			this.legDir = 0.5;
		}
	}
	if(!keys[37] && !keys[39]) {
		this.legDir = (this.legs < 0) ? -0.5 : 0.5;
		this.legDir = (this.legs >= 5 || this.legs <= -5) ? 0 : this.legDir;
		this.legs += this.legDir;
	}
	/* Standard Arms (no item held) */
	if(((!this.attacking && !this.aiming) || this.facing === "left") && !(this.attackingWith instanceof Spear && this.attacking)) {
		c.beginPath();
		c.moveTo(this.x, this.y + 26);
		c.lineTo(this.x + (straightArm ? 15 : 10), this.y + (straightArm ? 16 : 36));
		c.stroke();
	}
	if(((!this.attacking && !this.aiming) || this.facing === "right") && !(this.attackingWith instanceof Spear && this.attacking)) {
		c.beginPath();
		c.moveTo(this.x, this.y + 26);
		c.lineTo(this.x - 10, this.y + 36);
		c.stroke();
	}
	/* Attacking Arms (holding a standard weapon like sword, dagger) */
	if(this.attacking && this.facing === "left" && !(this.attackingWith instanceof Spear) && !(this.attackingWith instanceof Mace)) {
		c.save();
		c.translate(this.x, this.y + 26);
		c.rotate(-this.attackArm / 180 * Math.PI);
		c.beginPath();
		c.moveTo(0, 0);
		c.lineTo(-10, 0);
		c.stroke();
		c.translate(-10, 2);
		this.attackingWith.display("attacking");
		c.restore();
		if(this.attackArm > 75) {
			this.attackArmDir = -this.attackSpeed;
			if(this.timeSinceAttack > (10 - this.attackSpeed) * 3) {
				this.canHit = true;
			}
		}
		else if(this.attackArm < 0) {
			this.attackArmDir = this.attackSpeed;
			if(this.timeSinceAttack > (10 - this.attackSpeed) * 3) {
				this.canHit = true;
			}
		}
	}
	if(this.attacking && this.facing === "right" && !(this.attackingWith instanceof Spear) && !(this.attackingWith instanceof Mace)) {
		c.save();
		c.translate(this.x, this.y + 26);
		c.rotate(this.attackArm / 180 * Math.PI);
		c.beginPath();
		c.moveTo(0, 0);
		c.lineTo(10, 0);
		c.stroke();
		c.translate(10, 2);
		this.attackingWith.display("attacking");
		c.restore();
		if(this.attackArm > 75) {
			this.attackArmDir = -this.attackSpeed;
			if(this.timeSinceAttack > (10 - this.attackSpeed) * 3) {
				this.canHit = true;
			}
		}
		else if(this.attackArm < 0) {
			this.attackArmDir = this.attackSpeed;
			if(this.timeSinceAttack > (10 - this.attackSpeed) * 3) {
				this.canHit = true;
			}
		}
	}
	/* Arms when holding a Spear*/
	if(this.attacking && this.facing === "left" && this.attackingWith instanceof Spear) {
		c.save();
		c.translate(this.x, this.y + 26);
		c.beginPath();
		c.moveTo(0, 0);
		c.lineTo(-10, 10);
		c.stroke();
		c.restore();
			c.save();
			c.translate(this.x + this.attackArm, this.y + 31);
			c.rotate(-90 / 180 * Math.PI);
			this.attackingWith.display("attacking");
			c.restore();
		c.lineJoin = "round";
		c.save();
		c.translate(this.x, this.y + 26);
		c.beginPath();
		c.moveTo(-10, 10);
		c.lineTo(this.attackArm, 5);
		c.moveTo(0, 0);
		c.lineTo(10, -5);
		c.lineTo(this.attackArm + 15, 5);
		c.stroke();
		c.restore();
		if(this.attackArm < -20) {
			this.attackArmDir = 1 * (this.attackSpeed / 5);
			if(this.timeSinceAttack > (10 - this.attackSpeed) * 3) {
				this.canHit = true;
			}
		}
		else if(this.attackArm > 0) {
			this.attackArmDir = -4 * (this.attackSpeed / 5);
			if(this.timeSinceAttack > (10 - this.attackSpeed) * 3) {
				this.canHit = true;
			}
		}
	}
	if(this.attacking && this.facing === "right" && this.attackingWith instanceof Spear) {
		c.save();
		c.translate(this.x, this.y + 26);
		c.beginPath();
		c.moveTo(0, 0);
		c.lineTo(10, 10);
		c.stroke();
		c.restore();
			c.save();
			c.translate(this.x + this.attackArm, this.y + 31);
			c.rotate(90 / 180 * Math.PI);
			this.attackingWith.display("attacking");
			c.restore();
		c.lineJoin = "round";
		c.save();
		c.translate(this.x, this.y + 26);
		c.beginPath();
		c.moveTo(10, 10);
		c.lineTo(this.attackArm, 5);
		c.moveTo(0, 0);
		c.lineTo(-10, -5);
		c.lineTo(this.attackArm - 15, 5);
		c.stroke();
		c.restore();
		if(this.attackArm < 0) {
			this.attackArmDir = 4 * (this.attackSpeed / 5);
			if(this.timeSinceAttack > (10 - this.attackSpeed) * 3) {
				this.canHit = true;
			}
		}
		else if(this.attackArm > 20) {
			this.attackArmDir = -1 * (this.attackSpeed / 5);
			if(this.timeSinceAttack > (10 - this.attackSpeed) * 3) {
				this.canHit = true;
			}
		}
	}
	/* Arms when holding a Mace [WIP] */
	if(this.attacking && this.facing === "right" && this.attackingWith instanceof Mace) {
		c.save();
		c.translate(this.x, this.y + 26);
		c.rotate(Math.rad(this.attackArm));
		c.beginPath();
		c.moveTo(0, 0);
		c.lineTo(10, 10);
		c.stroke();
		c.fillStyle = "rgb(60, 60, 60)";
		c.save();
		c.translate(10, 10);
		c.rotate(Math.rad(45));
		c.fillRect(-2, -15, 4, 15);
		c.restore();
		c.restore();
	}
	/* Arm Movement */
	this.attackArm += this.attackArmDir;
	if(!this.attacking) {
		this.attackArm = null;
	}
	/* Arms when aiming a Ranged Weapon */
	if(this.aiming && this.facing === "right") {
		if(this.attackingWith instanceof RangedWeapon) {
			c.save();
			c.translate(this.x, this.y + 26);
			c.rotate(this.aimRot / 180 * Math.PI);
			c.beginPath();
			c.moveTo(0, 0);
			c.lineTo(10, 0);
			c.stroke();
			c.translate(10, 0);
			this.attackingWith.display("aiming");
			c.restore();
		}
		else {
			c.save();
			c.moveTo(this.x, this.y + 26);
			c.lineTo(this.x + 13, this.y + 26);
			c.stroke();
			c.translate(this.x + 14, this.y + 16);
			this.attackingWith.display("attacking");
			c.restore();
			for(var i = 0; i < roomInstances[inRoom].content.length; i ++) {
				if(roomInstances[inRoom].content[i] instanceof MagicCharge && roomInstances[inRoom].content[i].beingAimed) {
					roomInstances[inRoom].content[i].x = this.x + this.chargeLoc.x - this.worldX;
					roomInstances[inRoom].content[i].y = this.y + this.chargeLoc.y - this.worldY;
					break;
				}
			}
		}
	}
	if(this.aiming && this.facing === "left") {
		if(this.attackingWith instanceof RangedWeapon) {
			c.save();
			c.translate(this.x, this.y + 26);
			c.rotate(this.aimRot / -180 * Math.PI);
			c.beginPath();
			c.moveTo(0, 0);
			c.lineTo(-10, 0);
			c.stroke();
			c.translate(-10, 0);
			c.scale(-1, 1);
			this.attackingWith.display("aiming");
			c.restore();
		}
		else {
			c.save();
			c.moveTo(this.x, this.y + 26);
			c.lineTo(this.x - 13, this.y + 26);
			c.stroke();
			c.translate(this.x, this.y + 16);
			c.scale(-1, 1); //mirror the item graphic
			c.translate(14, 0);
			this.attackingWith.display("attacking");
			c.restore();
			for(var i = 0; i < roomInstances[inRoom].content.length; i ++) {
				if(roomInstances[inRoom].content[i] instanceof MagicCharge && roomInstances[inRoom].content[i].beingAimed) {
					roomInstances[inRoom].content[i].x = this.x + this.chargeLoc.x - this.worldX;
					roomInstances[inRoom].content[i].y = this.y + this.chargeLoc.y - this.worldY;
					break;
				}
			}
		}
	}
	c.lineCap = "butt";
	c.globalAlpha = 1;
	/* Status Bars */
	if(this.onScreen === "play") {
		c.textAlign = "center";
		/* Health */
		this.displayHealthBar(550, 12.5, "Health", this.health, this.maxHealth, "rgb(255, 0, 0)", this.visualHealth);
		this.visualHealth += ((this.health / this.maxHealth) - this.visualHealth) / 10;
		/* Mana */
		this.displayHealthBar(550, 50, "Mana", this.mana, this.maxMana, "rgb(20, 20, 255)", this.visualMana);
		this.visualMana += ((this.mana / this.maxMana) - this.visualMana) / 10;
		//gold bar
		this.displayHealthBar(550, 87.5, "Gold", this.gold, Infinity, "rgb(255, 255, 0)", this.visualGold);
		this.visualGold += ((this.gold / this.maxGold) - this.visualGold) / 10;
	}
};
Player.prototype.displayHealthBar = function(x, y, txt, num, max, col, percentFull) {
	/*
	Displays a health bar w/ top left at ('x', 'y') and color 'col'. Labeled as 'txt: num / max'.
	*/
	/* Health Bar (gray background) */
	c.fillStyle = "rgb(150, 150, 150)";
	c.fillRect(x, y, 225, 25);
	/* Rounded Corners (gray background) */
	c.beginPath();
	c.arc(x, y + 12, 12, 0, 2 * Math.PI);
	c.arc(x + 225, y + 12, 12, 0, 2 * Math.PI);
	c.fill();
	/* Health Bar (colored part) */
	c.fillStyle = col;
	c.fillRect(x, y, percentFull * 225, 25);
	/* Rounded Corners (colored part) */
	c.beginPath();
	c.arc(x, y + 12, 12, 0, 2 * Math.PI);
	c.arc(x + (percentFull * 225), y + 12, 12, 0, 2 * Math.PI);
	c.fill();
	/* Text */
	c.fillStyle = "rgb(100, 100, 100)";
	c.textAlign = "center";
	c.font = "bold 10pt monospace";
	c.fillText(txt + ": " + num + ((max === Infinity) ? "" : (" / " + max)), x + 112, y + 15);
};
Player.prototype.update = function() {
	/*
	This function does all of the key management for the player, as well as movement, attacking, and other things.
	*/
	keys = this.enteringDoor ? [] : keys;
	/* Change selected slots when number keys are pressed */
	if(this.guiOpen !== "crystal-infusion" && !this.attacking) {
		if(keys[49]) {
			this.activeSlot = 0;
		}
		else if(keys[50]) {
			this.activeSlot = 1;
		}
		else if(keys[51]) {
		this.activeSlot = 2;
	}
	}
	/* Movement + Jumping */
	if(this.guiOpen === "none") {
		if(keys[37]) {
			this.velX -= 0.1;
		}
		else if(keys[39]) {
			this.velX += 0.1;
		}
	}
	this.x += this.velX;
	this.y += this.velY;
	if(keys[38] && this.canJump && !this.aiming) {
		this.velY = -10;
	}
	/* Velocity Cap */
	if(this.velX > 4) {
		this.velX = 4;
	}
	else if(this.velX < -4) {
		this.velX = -4;
	}
	/* Friction + Gravity */
	if(!keys[37] && !keys[39]) {
		this.velX *= 0.93;
	}
	if(this.invSlots[this.activeSlot].content instanceof MeleeWeapon && !(this.invSlots[this.activeSlot].content instanceof Dagger) && this.class !== "warrior") {
		this.velX *= 0.965; // non-warriors walk slower when holding a melee weapon
	}
	this.velY += 0.3;
	/* Screen Transitions */
	if(this.enteringDoor) {
		this.op -= 0.05;
		if(this.op <= 0) {
			this.screenOp += 0.05;
		}
		if(this.screenOp >= 1) {
			this.enteringDoor = false;
			this.exitingDoor = true;
			this.op = 1;
		}
	}
	if(this.exitingDoor) {
		this.screenOp -= 0.05;
	}
	this.fallOp += this.fallDir;
	this.fallOp = (this.fallOp < 0) ? 0 : this.fallOp;
	if(this.fallOp > 1) {
		this.roomsExplored ++;
		this.fallDir = -0.05;
		inRoom = numRooms;
		this.worldX = 0;
		this.worldY = 0;
		this.x = 500;
		this.y = -100;
		this.velY = 2;
		this.fallDmg = Math.round(Math.random() * 10 + 40);
		roomInstances.push(
			new Room(
				"ambient1",
				[
					new Pillar(200, 500, Math.random() * 100 + 200),
					new Pillar(400, 500, Math.random() * 100 + 200),
					new Pillar(600, 500, Math.random() * 100 + 200),
					new Pillar(800, 500, Math.random() * 100 + 200),
					new Block(-200, 500, 2000, 600),//floor
					new Block(-600, -1200, 700, 3000), //left wall
					new Block(900, -1200, 500, 3000), //right wall
					new Door(300,  500, ["ambient", "combat", "parkour", "secret"]),
					new Door(500,  500, ["ambient", "combat", "parkour", "secret"]),
					new Door(700,  500, ["ambient", "combat", "parkour", "secret"])
				],
				"?"
			)
		);
	}
	/* Attacking + Item Use */
	this.useItem();
	/* Update Health Bars */
	if(this.health >= this.maxHealth) {
		this.numHeals = 0;
	}
	this.healthRegen = 1;
	for(var i = 0; i < this.invSlots.length; i ++) {
		if(this.invSlots[i].type === "equip" && this.invSlots[i].content instanceof Helmet) {
			this.healthRegen -= (this.invSlots[i].content.healthRegen * 0.01);
		}
	}
	if(this.numHeals > 0 && frameCount % Math.floor(18 * this.healthRegen) === 0) {
		this.health ++;
		this.numHeals -= 0.1 * this.healthRegen;
	}
	this.manaRegen = 1;
	for(var i = 0; i < this.invSlots.length; i ++) {
		if(this.invSlots[i].type === "equip" && this.invSlots[i].content instanceof WizardHat) {
			this.manaRegen -= (this.invSlots[i].content.manaRegen * 0.01);
		}
	}
	if(frameCount % Math.floor(18 * this.manaRegen) === 0 && this.mana < this.maxMana) {
		this.mana += 1;
	}
	for(var i = 0; i < this.invSlots.length; i ++) {
		if(this.invSlots[i].content instanceof Coin) {
			this.gold = this.invSlots[i].content.quantity;
			break;
		}
	}
	if(this.gold > this.maxGold) {
		this.maxGold = this.gold;
	}
	if(this.dead) {
		this.op -= 0.05;
		if(this.op <= 0 && fading !== "out") {
			fading = "out";
			fadeDest = "dead";
			// console.log(this.scores);
			this.scores.push({
				coins: this.gold,
				rooms: this.roomsExplored,
				kills: this.enemiesKilled,
				class: this.class
			});
			// console.log(this.scores);
			var scores = JSON.stringify(this.scores);
			localStorage.setItem("scores", scores);
		}
	}
	if(this.health < 0) {
		this.health = 0;
	}
	this.damOp -= 0.05;
};
Player.prototype.useItem = function() {
	/* Update facing direction */
	this.facing = keys[39] ? "right" : this.facing;
	this.facing = keys[37] ? "left" : this.facing;
	for(var i = 0; i < roomInstances[inRoom].content.length; i ++) {
		if(roomInstances[inRoom].content[i] instanceof SpikeBall) {
			if(roomInstances[inRoom].content[i].x + this.worldX > this.x) {
				this.facing = "right";
			}
			else {
				this.facing = "left";
			}
			break;
		}
	}
	if(this.canStopAttacking) {
		this.attacking = false;
	}
	this.aiming = false;
	if(this.invSlots[this.activeSlot].content instanceof MeleeWeapon) {
		if(this.invSlots[this.activeSlot].content.attackSpeed === "fast") {
			this.attackSpeed = 7;
		}
		else if(this.invSlots[this.activeSlot].content.attackSpeed === "normal") {
			this.attackSpeed = 5;
		}
		else if(this.invSlots[this.activeSlot].content.attackSpeed === "slow") {
			this.attackSpeed = 3;
		}
		else if(this.invSlots[this.activeSlot].content.attackSpeed === "very slow") {
			this.attackSpeed = 1;
		}
	}
	/* Begin Attacking + Use Non-weapon Items */
	if(keys[65] && this.invSlots[this.activeSlot].content !== "empty") {
		if(this.invSlots[this.activeSlot].content instanceof MeleeWeapon && !(this.invSlots[this.activeSlot].content instanceof Mace)) {
			this.invSlots[this.activeSlot].content.attack();
			this.attacking = true;
			if(this.attackArm === null) {
				this.attackArm = 0;
				this.attackArmDir = this.attackSpeed;
				if(this.attackingWith instanceof Spear) {
					this.attackArmDir = 4 * (this.attackSpeed / 5);
				}
			}
		}
		else if((this.invSlots[this.activeSlot].content instanceof RangedWeapon || this.invSlots[this.activeSlot].content instanceof MagicWeapon) && !(this.invSlots[this.activeSlot].content instanceof Arrow)) {
			if(this.aimRot === null) {
				this.aimRot = 0;
				this.attackingWith = this.invSlots[this.activeSlot].content;
				if(this.attackingWith instanceof MagicWeapon && (this.mana >= this.attackingWith.manaCost || this.attackingWith instanceof ChaosStaff) && !(this.attackingWith instanceof ElementalStaff && this.attackingWith.element === "none")) {
					var damage = Math.round(Math.random() * (this.invSlots[this.activeSlot].content.damHigh - this.invSlots[this.activeSlot].content.damLow) + this.invSlots[this.activeSlot].content.damLow);
					if(this.facing === "right") {
						roomInstances[inRoom].content.push(new MagicCharge(450 - this.worldX, 400 - this.worldY, 0, 0, this.attackingWith.chargeType, damage));
						roomInstances[inRoom].content[roomInstances[inRoom].content.length - 1].beingAimed = true;
					}
					else {
						roomInstances[inRoom].content.push(new MagicCharge(350 - this.worldX, 400 - this.worldY, 0, 0, this.attackingWith.chargeType, damage));
						roomInstances[inRoom].content[roomInstances[inRoom].content.length - 1].beingAimed = true;
					}
					if(this.attackingWith instanceof ChaosStaff) {
						this.hurt(this.attackingWith.hpCost, "meddling with arcane magic", true);
					}
					else {
						this.mana -= this.attackingWith.manaCost;
					}
					this.chargeLoc = Math.rotate((this.facing === "right") ? 50 : -50, 0, this.aimRot * ((this.facing === "right") ? 1 : -1));
				}
			}
			this.aiming = true;
		}
		else if(this.invSlots[this.activeSlot].content instanceof Mace) {
			this.attacking = true;
			this.canStopAttacking = false;
			this.attackingWith = this.invSlots[this.activeSlot].content;
			var alreadyExists = false;
			for(var i = 0; i < roomInstances[inRoom].content.length; i ++) {
				if(roomInstances[inRoom].content[i] instanceof SpikeBall) {
					alreadyExists = true;
					break;
				}
			}
			if(!alreadyExists) {
				if(this.facing === "right") {
					roomInstances[inRoom].content.push(new SpikeBall(this.x - this.worldX + 50, this.y - this.worldY, "right"));
				}
				else {

				}
			}
		}
		else if(this.invSlots[this.activeSlot].content instanceof Equipable) {
			// console.log("using an equipable");
			for(var i = 0; i < this.invSlots.length; i ++) {
				if(this.invSlots[i].type === "equip" && this.invSlots[i].content === "empty") {
					this.invSlots[i].content = new this.invSlots[this.activeSlot].content.constructor();
					this.invSlots[i].content.modifier = this.invSlots[this.activeSlot].content.modifier;
					this.invSlots[this.activeSlot].content = "empty";
					break;
				}
			}
		}
		else if(this.invSlots[this.activeSlot].content.hasOwnProperty("use")) {
			this.invSlots[this.activeSlot].content.use();
		}
	}
	/* Melee Weapon Attacking */
	if(this.attacking) {
		if(this.attackingWith instanceof MeleeWeapon && !(this.attackingWith instanceof Mace)) {
			//calculate weapon tip position
			if(this.attackingWith instanceof Spear) {
				var weaponPos = {
					x: (this.facing === "right") ? this.attackArm + 45 : this.attackArm - 45,
					y: 5
				}
			}
			else {
				var weaponPos = Math.rotate(10, -this.attackingWith.range, this.attackArm);
			}
			if(this.facing === "left" && !(this.attackingWith instanceof Spear)) {
				weaponPos.x = -weaponPos.x;
			}
			weaponPos.x += this.x;
			weaponPos.y += this.y + 26 - this.velY;
			if(showHitboxes) {
				c.fillStyle = "rgb(0, 255, 0)";
				c.fillRect(weaponPos.x - 3, weaponPos.y - 3, 6, 6);
			}
			//check enemies to see if weapon hits any
			for(var i = 0; i < roomInstances[inRoom].content.length; i ++) {
				if(roomInstances[inRoom].content[i] instanceof Enemy) {
					var enemy = roomInstances[inRoom].content[i];
					if(weaponPos.x > enemy.x + p.worldX + enemy.leftX && weaponPos.x < enemy.x + p.worldX + enemy.rightX && weaponPos.y > enemy.y + p.worldY + enemy.topY && weaponPos.y < enemy.y + p.worldY + enemy.bottomY && this.canHit) {
						//hurt enemy that was hit by the weapon
						var damage = Math.round(Math.random() * (this.attackingWith.damHigh - this.attackingWith.damLow) + this.attackingWith.damLow);
						enemy.hurt(damage);
						if(this.attackingWith.element === "fire") {
							enemy.timeBurning = 120;
							enemy.burnDmg = 1;
						}
						else if(this.attackingWith.element === "water") {
							enemy.timeFrozen = (enemy.timeFrozen < 0) ? 120 : enemy.timeFrozen;
						}
						else if(this.attackingWith.element === "air") {
							roomInstances[inRoom].content.push(new WindBurst(weaponPos.x - this.worldX, weaponPos.y - this.worldY, this.facing));
						}
						else if(this.attackingWith.element === "earth" && this.canUseEarth) {
							//find lowest roof directly above weapon
							var lowestIndex = null;
							for(var j = 0; j < roomInstances[inRoom].content.length; j ++) {
								if(lowestIndex !== null) {
									if(roomInstances[inRoom].content[j] instanceof Block && weaponPos.x - this.worldX > roomInstances[inRoom].content[j].x && weaponPos.x - this.worldX < roomInstances[inRoom].content[j].x + roomInstances[inRoom].content[j].w &&roomInstances[inRoom].content[j].y + roomInstances[inRoom].content[j].h > roomInstances[inRoom].content[lowestIndex].y + roomInstances[inRoom].content[lowestIndex].h && roomInstances[inRoom].content[j].y + roomInstances[inRoom].content[j].h <= weaponPos.y - this.worldY) {
										lowestIndex = j;
									}
								}
								else if(lowestIndex === null && weaponPos.x - this.worldX > roomInstances[inRoom].content[j].x && weaponPos.x - this.worldX < roomInstances[inRoom].content[j].x + roomInstances[inRoom].content[j].w && roomInstances[inRoom].content[j].y <= weaponPos.y - this.worldY && roomInstances[inRoom].content[j] instanceof Block) {
									lowestIndex = j;
								}
							}
							roomInstances[inRoom].content.push(new BoulderVoid(weaponPos.x - this.worldX, roomInstances[inRoom].content[lowestIndex].y + roomInstances[inRoom].content[lowestIndex].h));
							roomInstances[inRoom].content.push(new Boulder(weaponPos.x - this.worldX, roomInstances[inRoom].content[lowestIndex].y + roomInstances[inRoom].content[lowestIndex].h, Math.random() * 2 + 2));
						}
						//reset variables for weapon swinging
						this.canHit = false;
						this.attackArmDir = -this.attackArmDir;
						this.timeSinceAttack = 0;
					}
				}
			}
		}
		else if(this.attackingWith instanceof Mace) {
			for(var i = 0; i < roomInstances[inRoom].content.length; i ++) {
				if(roomInstances[inRoom].content[i] instanceof SpikeBall && Math.abs(roomInstances[inRoom].content[i].velX) <= 1 && Math.abs(roomInstances[inRoom].content[i].x + this.worldX - this.x) < 5) {
					if(this.facing === "right") {
						this.attackArmDir = -1;
					}
				}
			}
			if(this.attackArm > 0) {
				this.attackArmDir = (this.attackArmDir > 0) ? 0 : this.attackArmDir;
			}
			else if(this.attackArm < -75) {
				this.attackArmDir = 5;
				for(var i = 0; i < roomInstances[inRoom].content.length; i ++) {
					if(roomInstances[inRoom].content[i] instanceof SpikeBall) {
						if(this.facing === "right") {
							roomInstances[inRoom].content[i].velX = 3;
						}
					}
				}
			}
		}
	}
	if(!this.attacking && this.timeSinceAttack > (10 - this.attackSpeed) * 3) {
		this.canHit = true;
	}
	this.timeSinceAttack ++;
	/* Change angle for aiming */
	if(this.aiming && keys[38] && this.aimRot > -45) {
		if((this.attackingWith instanceof RangedWeapon && this.class !== "archer") || (this.attackingWith instanceof MagicWeapon && this.class !== "mage")) {
			this.aimRot += 1.5; // slow down movement if you're not using the right class weapon
		}
		this.aimRot -= 2;
		if(this.attackingWith instanceof MagicWeapon) {
			this.aimRot -= 2;
			this.chargeLoc = Math.rotate((this.facing === "right") ? 50 : -50, 0, this.aimRot * ((this.facing === "right") ? 1 : -1));
		}
	}
	if(this.aiming && keys[40] && this.aimRot < 45) {
		if((this.attackingWith instanceof RangedWeapon && this.class !== "archer") || (this.attackingWith instanceof MagicWeapon && this.class !== "mage")) {
			this.aimRot -= 1.5; // slow down movement if you're using the wrong class weapon
		}
		this.aimRot += 2;
		if(this.attackingWith instanceof MagicWeapon) {
			this.aimRot += 2;
			this.chargeLoc = Math.rotate((this.facing === "right") ? 50 : -50, 0, this.aimRot * ((this.facing === "right") ? 1 : -1));
		}
	}
	/* Launch projectile when A is released */
	if(!this.aiming && this.aimingBefore && this.shootReload < 0 && !(this.attackingWith instanceof MechBow)) {
		if(this.attackingWith instanceof RangedWeapon) {
			var hasArrows = false;
			for(var i = 0; i < this.invSlots.length; i ++) {
				if(this.invSlots[i].content instanceof Arrow) {
					hasArrows = true;
				}
			}
			if(hasArrows) {
				if(this.attackingWith instanceof LongBow) {
					this.shootReload = 120;
				}
				else {
					this.shootReload = 60;
				}
				if(this.facing === "right") {
					var velocity = Math.rotate(10, 0, this.aimRot);
					var velX = velocity.x;
					var velY = velocity.y;
					velocity.x += (this.x - this.worldX + 10);
					velocity.y += (this.y - this.worldY + 26);
					var damage = Math.round(Math.random() * (this.invSlots[this.activeSlot].content.damHigh - this.invSlots[this.activeSlot].content.damLow) + this.invSlots[this.activeSlot].content.damLow);
					var speed = (this.invSlots[this.activeSlot].content.range === "medium" || this.invSlots[this.activeSlot].content.range === "long") ? (this.invSlots[this.activeSlot].content.range === "medium" ? 2 : 1.75) : (this.invSlots[this.activeSlot].content.range === "very long" ? 1.25 : 1);
					roomInstances[inRoom].content.push(new ShotArrow(velocity.x, velocity.y, velX / speed, velY / speed, damage, "player", this.invSlots[this.activeSlot].content.element));
					if(this.attackingWith instanceof LongBow) {
						roomInstances[inRoom].content[roomInstances[inRoom].content.length - 1].origX = roomInstances[inRoom].content[roomInstances[inRoom].content.length - 1].x;
					}
				}
				else {
					var velocity = Math.rotate(-10, 0, -this.aimRot);
					var velX = velocity.x;
					var velY = velocity.y;
					velocity.x += (this.x - this.worldX + 10);
					velocity.y += (this.y - this.worldY + 26);
					var damage = Math.round(Math.random() * (this.invSlots[this.activeSlot].content.damHigh - this.invSlots[this.activeSlot].content.damLow) + this.invSlots[this.activeSlot].content.damLow);
					var speed = (this.invSlots[this.activeSlot].content.range === "medium" || this.invSlots[this.activeSlot].content.range === "long") ? (this.invSlots[this.activeSlot].content.range === "medium" ? 2 : 1.75) : (this.invSlots[this.activeSlot].content.range === "very long" ? 1.25 : 1);
					roomInstances[inRoom].content.push(new ShotArrow(velocity.x, velocity.y, velX / speed, velY / speed, damage, "player", this.invSlots[this.activeSlot].content.element));
					if(this.attackingWith instanceof LongBow) {
						roomInstances[inRoom].content[roomInstances[inRoom].content.length - 1].origX = roomInstances[inRoom].content[roomInstances[inRoom].content.length - 1].x;
					}
				}
				this.arrowEfficiency = 0;
				for(var i = 0; i < this.invSlots.length; i ++) {
					if(this.invSlots[i].type === "equip" && this.invSlots[i].content.arrowEfficiency !== undefined) {
						this.arrowEfficiency += this.invSlots[i].content.arrowEfficiency * 0.01;
					}
				}
				if(Math.random() < (1 - this.arrowEfficiency)) {
					for(var i = 0; i < this.invSlots.length; i ++) {
						if(this.invSlots[i].content instanceof Arrow) {
							if(this.invSlots[i].content.quantity > 1) {
								this.invSlots[i].content.quantity --;
							}
							else {
								this.invSlots[i].content = "empty";
							}
						}
					}
				}
			}
		}
		else {
			if(this.facing === "right") {
				for(var i = 0; i < roomInstances[inRoom].content.length; i ++) {
					if(roomInstances[inRoom].content[i] instanceof MagicCharge && roomInstances[inRoom].content[i].beingAimed) {
						roomInstances[inRoom].content[i].beingAimed = false;
						roomInstances[inRoom].content[i].velX = this.chargeLoc.x / 10;
						roomInstances[inRoom].content[i].velY = this.chargeLoc.y / 10;
					}
				}
			}
			else {
				for(var i = 0; i < roomInstances[inRoom].content.length; i ++) {
					if(roomInstances[inRoom].content[i] instanceof MagicCharge && roomInstances[inRoom].content[i].beingAimed) {
						roomInstances[inRoom].content[i].beingAimed = false;
						roomInstances[inRoom].content[i].velX = this.chargeLoc.x / 10;
						roomInstances[inRoom].content[i].velY = this.chargeLoc.y / 10;
					}
				}
			}
		}
	}
	if(this.facingBefore !== this.facing) {
		this.chargeLoc = Math.rotate((this.facing === "right") ? 50 : -50, 0, this.aimRot * ((this.facing === "right") ? 1 : -1));
	}
	if(!this.aiming) {
		this.aimRot = null;
	}
	if(this.aiming && this.attackingWith instanceof MechBow && frameCount % 20 === 0) {
		var hasArrows = false;
		for(var i = 0; i < this.invSlots.length; i ++) {
			if(this.invSlots[i].content instanceof Arrow) {
				hasArrows = true;
			}
		}
		if(hasArrows) {
			this.shootReload = 60;
			if(this.facing === "right") {
				var velocity = Math.rotate(10, 0, this.aimRot);
				var velX = velocity.x;
				var velY = velocity.y;
				velocity.x += (this.x - this.worldX + 10);
				velocity.y += (this.y - this.worldY + 26);
				var damage = Math.round(Math.random() * (this.invSlots[this.activeSlot].content.damHigh - this.invSlots[this.activeSlot].content.damLow) + this.invSlots[this.activeSlot].content.damLow);
				var speed = (this.invSlots[this.activeSlot].content.range === "medium" || this.invSlots[this.activeSlot].content.range === "long") ? (this.invSlots[this.activeSlot].content.range === "medium" ? 2 : 1.75) : (this.invSlots[this.activeSlot].content.range === "very long" ? 1.25 : 1);
				roomInstances[inRoom].content.push(new ShotArrow(velocity.x, velocity.y, velX / speed, velY / speed, damage, "player", this.invSlots[this.activeSlot].content.element));
			}
			else {
				var velocity = Math.rotate(-10, 0, -this.aimRot);
				var velX = velocity.x;
				var velY = velocity.y;
				velocity.x += (this.x - this.worldX + 10);
				velocity.y += (this.y - this.worldY + 26);
				var damage = Math.round(Math.random() * (this.invSlots[this.activeSlot].content.damHigh - this.invSlots[this.activeSlot].content.damLow) + this.invSlots[this.activeSlot].content.damLow);
				var speed = (this.invSlots[this.activeSlot].content.range === "medium" || this.invSlots[this.activeSlot].content.range === "long") ? (this.invSlots[this.activeSlot].content.range === "medium" ? 2 : 1.75) : (this.invSlots[this.activeSlot].content.range === "very long" ? 1.25 : 1);
				roomInstances[inRoom].content.push(new ShotArrow(velocity.x, velocity.y, velX / speed, velY / speed, damage, "player", this.invSlots[this.activeSlot].content.element));
			}
			this.arrowEfficiency = 0;
			for(var i = 0; i < this.invSlots.length; i ++) {
				if(this.invSlots[i].type === "equip" && this.invSlots[i].content.arrowEfficiency !== undefined) {
					this.arrowEfficiency += this.invSlots[i].content.arrowEfficiency * 0.01;
				}
			}
			if(Math.random() < (1 - this.arrowEfficiency)) {
				for(var i = 0; i < this.invSlots.length; i ++) {
					if(this.invSlots[i].content instanceof Arrow) {
						if(this.invSlots[i].content.quantity > 1) {
							this.invSlots[i].content.quantity --;
						}
						else {
							this.invSlots[i].content = "empty";
						}
					}
				}
			}
		}
	}
	this.aimingBefore = this.aiming;
	this.facingBefore = this.facing;
	this.shootReload --;
};
Player.prototype.gui = function() {
	/* Delete Consumed Items */
	for(var i = 0; i < this.invSlots.length; i ++) {
		if(this.invSlots[i].content.consumed) {
			this.invSlots[i].content = "empty";
		}
	}
	/* Change GUI Open */
	if(keys[68] && !this.openingBefore) {
		if(this.guiOpen === "none") {
			this.guiOpen = "inventory";
		}
		else if(this.guiOpen === "inventory") {
			this.guiOpen = "none";
		}
		else if(this.guiOpen.substr(0, 7) === "reforge") {
			this.guiOpen = "none";
		}
		this.openCooldown = 2;
	}
	if(keys[27]) {
		// escape key to exit guis
		this.guiOpen = "none";
	}
	/* Display GUIs */
	function selectionGraphic(invSlot) {
		/*
		Display 4 triangles on 'invSlot'
		*/
		c.fillStyle = "rgb(100, 100, 100)";
		c.beginPath();
		c.moveTo(invSlot.x + 10, invSlot.y + 35);
		c.lineTo(invSlot.x, invSlot.y + 25);
		c.lineTo(invSlot.x, invSlot.y + 45);
		c.fill();
		c.beginPath();
		c.moveTo(invSlot.x + 35, invSlot.y + 10);
		c.lineTo(invSlot.x + 25, invSlot.y);
		c.lineTo(invSlot.x + 45, invSlot.y);
		c.fill();
		c.beginPath();
		c.moveTo(invSlot.x + 60, invSlot.y + 35);
		c.lineTo(invSlot.x + 70, invSlot.y + 25);
		c.lineTo(invSlot.x + 70, invSlot.y + 45);
		c.fill();
		c.beginPath();
		c.moveTo(invSlot.x + 35, invSlot.y + 60);
		c.lineTo(invSlot.x + 25, invSlot.y + 70);
		c.lineTo(invSlot.x + 45, invSlot.y + 70);
		c.fill();
	};
	function display(invSlot) {
		/*
		Displays the item in the slot 'invSlot'.
		*/
		if(invSlot.content === "empty" || invSlot.content === undefined) {
			return;
		}
		c.save();
		c.translate(invSlot.x + 35, invSlot.y + 35);
		c.globalAlpha = invSlot.content.opacity;
		invSlot.content.display("holding");
		c.restore();
		invSlot.content.opacity += 0.05;
		/* Weapon Particles */
		if(invSlot.content instanceof Weapon) {
			c.save();
			c.translate(invSlot.x - p.worldX, invSlot.y - p.worldY);
			invSlot.content.displayParticles();
			c.restore();
		}
	};
	if(this.guiOpen === "inventory") {
		/* Background */
		c.strokeStyle = "rgb(100, 100, 100)";
		c.fillStyle = "rgb(150, 150, 150)";
		c.fillRect(0, 0, 800, 800);
		/* Display Items */
		var hoverIndex = null;
		for(var i = 0; i < this.invSlots.length; i ++) {
			/* Item Slot */
			c.fillStyle = "rgb(150, 150, 150)";
			c.fillRect(this.invSlots[i].x, this.invSlots[i].y, 70, 70);
			c.strokeRect(this.invSlots[i].x, this.invSlots[i].y, 70, 70);
			/* Item */
			if(this.invSlots[i].content !== "empty") {
				if(!this.invSlots[i].content.initialized) {
					this.invSlots[i].content.init();
				}
				/* Display Items */
				display(this.invSlots[i]);
			}
			/* Selection Graphic (4 triangles) */
			if(i === this.activeSlot) {
				selectionGraphic(this.invSlots[i]);
			}
		}
		/* Find which item is being hovered over */
		for(var i = 0; i < this.invSlots.length; i ++) {
			if(mouseX > this.invSlots[i].x && mouseX < this.invSlots[i].x + 70 && mouseY > this.invSlots[i].y && mouseY < this.invSlots[i].y + 70 && this.invSlots[i].content !== "empty") {
				this.invSlots[i].content.desc = this.invSlots[i].content.getDesc();
				hoverIndex = i;
				break;
			}
		}
		/* Item hovering */
		if(hoverIndex !== null) {
			/* Display descriptions */
			this.invSlots[hoverIndex].content.displayDesc(this.invSlots[hoverIndex].x + ((this.invSlots[hoverIndex].type === "equip") ? 0 : 70), this.invSlots[hoverIndex].y + 35, (this.invSlots[hoverIndex].type === "equip") ? "left" : "right");
			/* Move Item if clicked */
			if(mouseIsPressed) {
				if(this.invSlots[hoverIndex].type === "storage") {
					if(!(this.invSlots[hoverIndex].content instanceof Equipable)) {
						/* Move from a storage slot to a "wearing" slot */
						for(var i = 0; i < 3; i ++) {
							if(this.invSlots[i].content === "empty") {
								this.invSlots[i].content = new this.invSlots[hoverIndex].content.constructor();
								for(var j in this.invSlots[hoverIndex].content) {
									this.invSlots[i].content[j] = this.invSlots[hoverIndex].content[j];
								}
								this.invSlots[hoverIndex].content = "empty";
								break;
							}
						}
					}
					else {
						/* Move from a storage slot to a "held" slot */
						for(var i = 0; i < this.invSlots.length; i ++) {
							if(this.invSlots[i].type === "equip" && this.invSlots[i].content === "empty") {
								this.invSlots[i].content = new this.invSlots[hoverIndex].content.constructor();
								for(var j in this.invSlots[hoverIndex].content) {
									this.invSlots[i].content[j] = this.invSlots[hoverIndex].content[j];
								}
								this.invSlots[hoverIndex].content = "empty";
								break;
							}
						}
					}
				}
				else if(this.invSlots[hoverIndex].type === "holding") {
					/* Move from a "held" slot to a storage slot */
					for(var i = 0; i < this.invSlots.length; i ++) {
						if(this.invSlots[i].type === "storage" && this.invSlots[i].content === "empty") {
							this.invSlots[i].content = new this.invSlots[hoverIndex].content.constructor();
							for(var j in this.invSlots[hoverIndex].content) {
								this.invSlots[i].content[j] = this.invSlots[hoverIndex].content[j];
							}
							this.invSlots[hoverIndex].content = "empty";
							break;
						}
					}
				}
				else if(this.invSlots[hoverIndex].type === "equip") {
					/* Move from a "wearing" slot to a storage slot */
					for(var i = 0; i < this.invSlots.length; i ++) {
						if(this.invSlots[i].type === "storage" && this.invSlots[i].content === "empty") {
							this.invSlots[i].content = new this.invSlots[hoverIndex].content.constructor();
							for(var j in this.invSlots[hoverIndex].content) {
								this.invSlots[i].content[j] = this.invSlots[hoverIndex].content[j];
							}
							this.invSlots[hoverIndex].content = "empty";
							break;
						}
					}
				}
			}
		}
		/* Guiding lines for tutorial */
		if(this.onScreen === "how") {
			c.fillStyle = "rgb(255, 255, 255)";
			c.strokeStyle = "rgb(255, 255, 255)";
			c.lineWidth = 5;
			c.beginPath();
			c.moveTo(20, 110);
			c.lineTo(20, 150);
			c.stroke();
		}
	}
	else if(this.guiOpen === "crystal-infusion") {
		/* Background */
		c.strokeStyle = "rgb(100, 100, 100)";
		c.fillStyle = "rgb(150, 150, 150)";
		c.fillRect(0, 0, 800, 800);
		/* GUI Title */
		c.font = "bold 20pt monospace";
		c.textAlign = "center";
		c.fillStyle = "rgb(100, 100, 100)";
		c.beginPath();
		c.fillText("Select a weapon to infuse", 400, 165);
		c.fill();
		var hoverIndex = null;
		for(var i = 0; i < this.invSlots.length; i ++) {
			c.fillStyle = "rgb(150, 150, 150)";
			c.fillRect(this.invSlots[i].x, this.invSlots[i].y, 70, 70);
			c.strokeRect(this.invSlots[i].x, this.invSlots[i].y, 70, 70);
			if(this.invSlots[i].content !== "empty") {
				display(this.invSlots[i]);
				/* Gray out invalid choices */
				var item = this.invSlots[i].content;
				if(
					!(item instanceof Weapon) || // not a weapon
					item instanceof Arrow || // arrows are technically weapons, so exclude them
					(item instanceof MagicWeapon && !(item instanceof ElementalStaff)) // don't allow magic weapons unless it's elemental
				) {
					c.globalAlpha = 0.75;
					c.fillStyle = "rgb(150, 150, 150)";
					c.fillRect(this.invSlots[i].x + 2, this.invSlots[i].y + 2, 66, 66);
					c.globalAlpha = 1;
				}
			}
			/* Selection graphic */
			if(i === this.activeSlot) {
				selectionGraphic(this.invSlots[i]);
			}
		}
		/* Find which is hovered */
		for(var i = 0; i < this.invSlots.length; i ++) {
			if(mouseX > this.invSlots[i].x && mouseX < this.invSlots[i].x + 70 && mouseY > this.invSlots[i].y && mouseY < this.invSlots[i].y + 70 && this.invSlots[i].content !== "empty") {
				this.invSlots[i].content.desc = this.invSlots[i].content.getDesc();
				hoverIndex = i;
				break;
			}
		}
		if(hoverIndex !== null) {
			/* Display desc of hovered item */
			this.invSlots[hoverIndex].content.displayDesc(this.invSlots[hoverIndex].x + (this.invSlots[hoverIndex].type === "equip" ? 0 : 70), this.invSlots[hoverIndex].y + 35, this.invSlots[hoverIndex].type === "equip" ? "left" : "right");
			/* Detect clicks */
			if(mouseIsPressed && this.invSlots[hoverIndex].content instanceof Weapon && !(this.invSlots[hoverIndex].content instanceof Arrow) && this.invSlots[hoverIndex].content.element !== this.infusedGui && (this.invSlots[hoverIndex].content instanceof ElementalStaff || !(this.invSlots[hoverIndex].content instanceof MagicWeapon))) {
				this.invSlots[hoverIndex].content.element = this.infusedGui;
				this.guiOpen = "none";
				this.invSlots[this.activeSlot].content = "empty";
				return;
			}
		}
	}
	else if(this.guiOpen === "reforge-item") {
		/* Background */
		c.strokeStyle = "rgb(100, 100, 100)";
		c.fillStyle = "rgb(150, 150, 150)";
		c.fillRect(0, 0, 800, 800);
		/* Text */
		c.font = "bold 20pt monospace";
		c.textAlign = "center";
		c.fillStyle = "rgb(100, 100, 100)";
		c.beginPath();
		c.fillText("Select a weapon to reforge", 400, 165);
		c.fill();
		var hoverIndex = null;
		for(var i = 0; i < this.invSlots.length; i ++) {
			c.fillStyle = "rgb(150, 150, 150)";
			c.fillRect(this.invSlots[i].x, this.invSlots[i].y, 70, 70);
			c.strokeRect(this.invSlots[i].x, this.invSlots[i].y, 70, 70);
			if(this.invSlots[i].content !== "empty") {
				display(this.invSlots[i]);
				/* Gray out invalid choices */
				if(!(this.invSlots[i].content instanceof Weapon || this.invSlots[i].content instanceof Equipable)) {
					c.globalAlpha = 0.75;
					c.fillStyle = "rgb(150, 150, 150)";
					c.fillRect(this.invSlots[i].x + 2, this.invSlots[i].y + 2, 66, 66);
					c.globalAlpha = 1;
				}
			}
			/* Selection graphic */
			if(i === this.activeSlot) {
				selectionGraphic(this.invSlots[i]);
			}
		}
		/* Find which is hovered */
		for(var i = 0; i < this.invSlots.length; i ++) {
			if(mouseX > this.invSlots[i].x && mouseX < this.invSlots[i].x + 70 && mouseY > this.invSlots[i].y && mouseY < this.invSlots[i].y + 70 && this.invSlots[i].content !== "empty") {
				this.invSlots[i].content.desc = this.invSlots[i].content.getDesc();
				hoverIndex = i;
				break;
			}
		}
		if(hoverIndex !== null) {
			/* Display desc of hovered item */
			this.invSlots[hoverIndex].content.displayDesc(this.invSlots[hoverIndex].x + (this.invSlots[hoverIndex].type === "equip" ? 0 : 70), this.invSlots[hoverIndex].y + 35, this.invSlots[hoverIndex].type === "equip" ? "left" : "right");
			/* Detect clicks */
			if(mouseIsPressed && (this.invSlots[hoverIndex].content instanceof Weapon || this.invSlots[hoverIndex].content instanceof Equipable) && !(this.invSlots[hoverIndex].content instanceof Arrow)) {
				/* Find current reforge status of item */
				this.reforgeIndex = hoverIndex;
				if(this.invSlots[hoverIndex].content.modifier === "none") {
					this.guiOpen = "reforge-trait-none";
				}
				else if(this.invSlots[hoverIndex].content.modifier === "light" || this.invSlots[hoverIndex].content.modifier === "distant" || this.invSlots[hoverIndex].content.modifier === "efficient" || this.invSlots[hoverIndex].content.modifier === "empowering") {
					this.guiOpen = "reforge-trait-light";
				}
				else if(this.invSlots[hoverIndex].content.modifier === "heavy" || this.invSlots[hoverIndex].content.modifier === "forceful" || this.invSlots[hoverIndex].content.modifier === "arcane" || this.invSlots[hoverIndex].content.modifier === "sturdy") {
					this.guiOpen = "reforge-trait-heavy";
				}
				/* Find type of item */
				if(this.invSlots[hoverIndex].content instanceof MeleeWeapon) {
					this.reforgeType = "melee";
				}
				else if(this.invSlots[hoverIndex].content instanceof RangedWeapon) {
					this.reforgeType = "ranged";
				}
				else if(this.invSlots[hoverIndex].content instanceof MagicWeapon) {
					this.reforgeType = "magic";
				}
				else if(this.invSlots[hoverIndex].content instanceof Equipable) {
					this.reforgeType = "equipable";
				}
				return;
			}
		}
	}
	else if(this.guiOpen === "reforge-trait-none") {
		/* Background */
		c.strokeStyle = "rgb(100, 100, 100)";
		c.fillStyle = "rgb(150, 150, 150)";
		c.fillRect(0, 0, 800, 800);
		/* Text */
		c.fillStyle = "rgb(100, 100, 100)";
		c.textAlign = "center";
		c.font = "bold 20pt monospace";
		c.fillText("Choose a trait to reforge for", 400, 200);
		c.fillText((this.reforgeType === "melee" || this.reforgeType === "ranged") ? (this.reforgeType === "melee" ? "Speed" : "Range") : (this.reforgeType === "magic" ? "Mana Cost" : "Bonuses"), 300, 500);
		c.fillText((this.reforgeType === "equipable") ? "Defense" : "Damage", 500, 500);
		/* First Choice */
		c.fillStyle = "rgb(150, 150, 150)";
		c.fillRect(300 - 35, 400 - 35, 70, 70);
		c.strokeRect(300 - 35, 400 - 35, 70, 70);
		var choice1 = new this.invSlots[this.reforgeIndex].content.constructor((this.reforgeType === "melee" || this.reforgeType === "ranged") ? (this.reforgeType === "melee" ? "light" : "distant") : (this.reforgeType === "magic" ? "efficient" : "empowering"));
		choice1.element = this.invSlots[this.reforgeIndex].content.element;
		choice1.damLow -= 10;
		choice1.damHigh -= 10;
		if(choice1 instanceof MeleeWeapon) {
			if(choice1.attackSpeed === "normal") {
				choice1.attackSpeed = "fast";
			}
			else if(choice1.attackSpeed === "slow") {
				choice1.attackSpeed = "normal";
			}
		}
		else if(choice1 instanceof RangedWeapon) {
			if(choice1.range === "long") {
				choice1.range = "very long";
			}
			else if(choice1.range === "very long") {
				choice1.range = "super long";
			}
		}
		c.save();
		c.translate(300, 400);
		choice1.display("holding");
		c.restore();
		/* Choice 2 */
		c.fillRect(500 - 35, 400 - 35, 70, 70);
		c.strokeRect(500 - 35, 400 - 35, 70, 70);
		var choice2 = new this.invSlots[this.reforgeIndex].content.constructor((this.reforgeType === "melee" || this.reforgeType === "ranged") ? (this.reforgeType === "melee" ? "heavy" : "forceful") : (this.reforgeType === "magic" ? "arcane" : "sturdy"));
		choice2.element = this.invSlots[this.reforgeIndex].content.element;
		choice2.damLow += 10;
		choice2.damHigh += 10;
		if(choice2 instanceof MeleeWeapon) {
			if(choice2.attackSpeed === "normal") {
				choice2.attackSpeed = "slow";
			}
			else if(choice2.attackSpeed === "slow") {
				choice2.attackSpeed = "very slow";
			}
		}
		else if(choice2 instanceof RangedWeapon) {
			if(choice2.range === "long") {
				choice2.range = "medium";
			}
			else if(choice2.range === "very long") {
				choice2.range = "long";
			}
		}
		c.save();
		c.translate(500, 400);
		choice2.display("holding");
		c.restore();
		/* Detect hovering */
		if(mouseX > 300 - 35 && mouseX < 335 && mouseY > 400 - 35 && mouseY < 435) {
			cursorHand = true;
			choice1.desc = choice1.getDesc();
			choice1.displayDesc(335, 400, "right");
			if(mouseIsPressed) {
				/* Update item stats */
				this.invSlots[this.reforgeIndex].content.damLow = choice1.damLow;
				this.invSlots[this.reforgeIndex].content.damHigh = choice1.damHigh;
				this.invSlots[this.reforgeIndex].content.modifier = choice1.modifier;
				if(this.invSlots[this.reforgeIndex].content instanceof MeleeWeapon) {
					this.invSlots[this.reforgeIndex].content.attackSpeed = choice1.attackSpeed;
				}
				else if(this.invSlots[this.reforgeIndex].content instanceof RangedWeapon) {
					this.invSlots[this.reforgeIndex].content.range = choice1.range;
				}
				else if(this.invSlots[this.reforgeIndex].content instanceof MagicWeapon) {
					this.invSlots[this.reforgeIndex].content.manaCost = choice1.manaCost;
				}
				else if(this.invSlots[this.reforgeIndex].content instanceof Equipable) {
					this.invSlots[this.reforgeIndex].content = new this.invSlots[this.reforgeIndex].content.constructor(choice1.modifier);
				}
				/* Exit GUI and mark forge as used */
				for(var i = 0; i < roomInstances[inRoom].content.length; i ++) {
					if(roomInstances[inRoom].content[i] instanceof Forge) {
						roomInstances[inRoom].content[i].used = true;
						break;
					}
				}
				this.guiOpen = "none";
			}
		}
		if(mouseX > 500 - 35 && mouseX < 535 && mouseY > 400 - 35 && mouseY < 435) {
			cursorHand = true;
			choice2.desc = choice2.getDesc();
			choice2.displayDesc(535, 400, "right");
			if(mouseIsPressed) {
				/* Update item stats */
				this.invSlots[this.reforgeIndex].content.damLow = choice2.damLow;
				this.invSlots[this.reforgeIndex].content.damHigh = choice2.damHigh;
				this.invSlots[this.reforgeIndex].content.modifier = choice2.modifier;
				if(this.invSlots[this.reforgeIndex].content instanceof MeleeWeapon) {
					this.invSlots[this.reforgeIndex].content.attackSpeed = choice2.attackSpeed;
				}
				else if(this.invSlots[this.reforgeIndex].content instanceof RangedWeapon) {
					this.invSlots[this.reforgeIndex].content.range = choice2.range;
				}
				else if(this.invSlots[this.reforgeIndex].content instanceof MagicWeapon) {
					this.invSlots[this.reforgeIndex].content.manaCost = choice2.manaCost;
				}
				else if(this.invSlots[this.reforgeIndex].content instanceof Equipable) {
					this.invSlots[this.reforgeIndex].content = new this.invSlots[this.reforgeIndex].content.constructor(choice2.modifier);
				}
				/* Exit GUI and mark forge as used */
				for(var i = 0; i < roomInstances[inRoom].content.length; i ++) {
					if(roomInstances[inRoom].content[i] instanceof Forge) {
						roomInstances[inRoom].content[i].used = true;
						break;
					}
				}
				this.guiOpen = "none";
			}
		}
	}
	else if(this.guiOpen === "reforge-trait-light") {
		/* Background */
		c.strokeStyle = "rgb(100, 100, 100)";
		c.fillStyle = "rgb(150, 150, 150)";
		c.fillRect(0, 0, 800, 800);
		/* Text */
		c.fillStyle = "rgb(100, 100, 100)";
		c.textAlign = "center";
		c.font = "bold 20pt monospace";
		c.fillText("Choose a trait to reforge for", 400, 200);
		c.fillText("Balance", 300, 500);
		c.fillText((this.reforgeType === "equipable") ? "Defense" : "Damage", 500, 500);
		/* Choice 1 */
		c.fillStyle = "rgb(150, 150, 150)";
		c.fillRect(300 - 35, 400 - 35, 70, 70);
		c.strokeRect(300 - 35, 400 - 35, 70, 70);
		var choice1 = new this.invSlots[this.reforgeIndex].content.constructor("none");
		choice1.element = this.invSlots[this.reforgeIndex].content.element;
		c.save();
		c.translate(300, 400);
		choice1.display("holding");
		c.restore();
		/* Choice 2 */
		c.fillRect(500 - 35, 400 - 35, 70, 70);
		c.strokeRect(500 - 35, 400 - 35, 70, 70);
		var choice2 = new this.invSlots[this.reforgeIndex].content.constructor((this.reforgeType === "melee" || this.reforgeType === "ranged") ? (this.reforgeType === "melee" ? "heavy" : "forceful") : (this.reforgeType === "magic" ? "arcane" : "sturdy"));
		choice2.element = this.invSlots[this.reforgeIndex].content.element;
		choice2.damLow += 10;
		choice2.damHigh += 10;
		if(choice2 instanceof MeleeWeapon) {
			if(choice2.attackSpeed === "normal") {
				choice2.attackSpeed = "slow";
			}
			else if(choice2.attackSpeed === "slow") {
				choice2.attackSpeed = "very slow";
			}
		}
		else if(choice2 instanceof RangedWeapon) {
			if(choice2.range === "long") {
				choice2.range = "medium";
			}
			else if(choice2.range === "very long") {
				choice2.range = "long";
			}
		}
		c.save();
		c.translate(500, 400);
		choice2.display("holding");
		c.restore();
		/* Detect hovering */
		if(mouseX > 300 - 35 && mouseX < 335 && mouseY > 400 - 35 && mouseY < 435) {
			cursorHand = true;
			choice1.desc = choice1.getDesc();
			choice1.displayDesc(335, 400, "right");
			if(mouseIsPressed) {
				/* Update item stats */
				this.invSlots[this.reforgeIndex].content.damLow = choice1.damLow;
				this.invSlots[this.reforgeIndex].content.damHigh = choice1.damHigh;
				this.invSlots[this.reforgeIndex].content.modifier = "none";
				if(this.invSlots[this.reforgeIndex].content instanceof MeleeWeapon) {
					this.invSlots[this.reforgeIndex].content.attackSpeed = choice1.attackSpeed;
				}
				else if(this.invSlots[this.reforgeIndex].content instanceof RangedWeapon) {
					this.invSlots[this.reforgeIndex].content.range = choice1.range;
				}
				else if(this.invSlots[this.reforgeIndex].content instanceof MagicWeapon) {
					this.invSlots[this.reforgeIndex].content.manaCost = choice1.manaCost;
				}
				else if(this.invSlots[this.reforgeIndex].content instanceof Equipable) {
					this.invSlots[this.reforgeIndex].content = new this.invSlots[this.reforgeIndex].content.constructor(choice1.modifier);
				}
				/* Exit GUI and mark forge as used */
				for(var i = 0; i < roomInstances[inRoom].content.length; i ++) {
					if(roomInstances[inRoom].content[i] instanceof Forge) {
						roomInstances[inRoom].content[i].used = true;
						break;
					}
				}
				this.guiOpen = "none";
			}
		}
		if(mouseX > 500 - 35 && mouseX < 535 && mouseY > 400 - 35 && mouseY < 435) {
			cursorHand = true;
			choice2.desc = choice2.getDesc();
			choice2.displayDesc(535, 400, "right");
			if(mouseIsPressed) {
				/* Update item stats */
				this.invSlots[this.reforgeIndex].content.damLow = choice2.damLow;
				this.invSlots[this.reforgeIndex].content.damHigh = choice2.damHigh;
				this.invSlots[this.reforgeIndex].content.modifier = choice2.modifier;
				if(this.invSlots[this.reforgeIndex].content instanceof MeleeWeapon) {
					this.invSlots[this.reforgeIndex].content.attackSpeed = choice2.attackSpeed;
				}
				else if(this.invSlots[this.reforgeIndex].content instanceof RangedWeapon) {
					this.invSlots[this.reforgeIndex].content.range = choice2.range;
				}
				else if(this.invSlots[this.reforgeIndex].content instanceof MagicWeapon) {
					this.invSlots[this.reforgeIndex].content.manaCost = choice2.manaCost;
				}
				else if(this.invSlots[this.reforgeIndex].content instanceof Equipable) {
					this.invSlots[this.reforgeIndex].content = new this.invSlots[this.reforgeIndex].content.constructor(choice2.modifier);
				}
				/* Close GUI and mark forge as used */
				for(var i = 0; i < roomInstances[inRoom].content.length; i ++) {
					if(roomInstances[inRoom].content[i] instanceof Forge) {
						roomInstances[inRoom].content[i].used = true;
						break;
					}
				}
				this.guiOpen = "none";
			}
		}
	}
	else if(this.guiOpen === "reforge-trait-heavy") {
		/* Background */
		c.strokeStyle = "rgb(100, 100, 100)";
		c.fillStyle = "rgb(150, 150, 150)";
		c.fillRect(0, 0, 800, 800);
		/* Text */
		c.fillStyle = "rgb(100, 100, 100)";
		c.textAlign = "center";
		c.font = "bold 20pt monospace";
		c.fillText("Choose a trait to reforge for", 400, 200);
		c.fillText((this.reforgeType === "melee" || this.reforgeType === "ranged") ? (this.reforgeType === "melee" ? "Speed" : "Range") : (this.reforgeType === "magic" ? "Mana Cost" : "Bonuses"), 300, 500);
		c.fillText("Balance", 500, 500);
		/* Choice 1 */
		c.fillStyle = "rgb(150, 150, 150)";
		c.fillRect(300 - 35, 400 - 35, 70, 70);
		c.strokeRect(300 - 35, 400 - 35, 70, 70);
		var choice1 = new this.invSlots[this.reforgeIndex].content.constructor((this.reforgeType === "melee" || this.reforgeType === "ranged") ? (this.reforgeType === "melee" ? "light" : "distant") : (this.reforgeType === "magic" ? "efficient" : "empowering"));
		choice1.element = this.invSlots[this.reforgeIndex].content.element;
		choice1.damLow -= 10;
		choice1.damHigh -= 10;
		if(choice1 instanceof MeleeWeapon) {
			if(choice1.attackSpeed === "normal") {
				choice1.attackSpeed = "fast";
			}
			else if(choice1.attackSpeed === "slow") {
				choice1.attackSpeed = "normal";
			}
		}
		else if(choice1 instanceof RangedWeapon) {
			if(choice1.range === "long") {
				choice1.range = "very long";
			}
			else if(choice1.range === "very long") {
				choice1.range = "super long";
			}
		}
		c.save();
		c.translate(300, 400);
		choice1.display("holding");
		c.restore();
		/* Choice 2 */
		c.fillRect(500 - 35, 400 - 35, 70, 70);
		c.strokeRect(500 - 35, 400 - 35, 70, 70);
		var choice2 = new this.invSlots[this.reforgeIndex].content.constructor("none");
		choice2.element = this.invSlots[this.reforgeIndex].content.element;
		c.save();
		c.translate(500, 400);
		choice2.display("holding");
		c.restore();
		/* Detect hovering */
		if(mouseX > 300 - 35 && mouseX < 335 && mouseY > 400 - 35 && mouseY < 435) {
			cursorHand = true;
			choice1.desc = choice1.getDesc();
			choice1.displayDesc(335, 400, "right");
			if(mouseIsPressed) {
				/* Update Item Stats */
				var theModifier = (this.reforgeType === "melee" || this.reforgeType === "ranged") ? (this.reforgeType === "melee" ? "light" : "distant") : (this.reforgeType === "magic" ? "efficient" : "empowering");
				this.invSlots[this.reforgeIndex].content.damLow = choice1.damLow;
				this.invSlots[this.reforgeIndex].content.damHigh = choice1.damHigh;
				this.invSlots[this.reforgeIndex].content.modifier = theModifier;
				if(this.invSlots[this.reforgeIndex].content instanceof MeleeWeapon) {
					this.invSlots[this.reforgeIndex].content.attackSpeed = choice1.attackSpeed;
				}
				else if(this.invSlots[this.reforgeIndex].content instanceof RangedWeapon) {
					this.invSlots[this.reforgeIndex].content.range = choice1.range;
				}
				else if(this.invSlots[this.reforgeIndex].content instanceof MagicWeapon) {
					this.invSlots[this.reforgeIndex].content.manaCost = choice1.manaCost;
				}
				else if(this.invSlots[this.reforgeIndex].content instanceof Equipable) {
					this.invSlots[this.reforgeIndex].content = new this.invSlots[this.reforgeIndex].content.constructor(choice1.modifier);
				}
				/* Close GUI and mark forge as used */
				for(var i = 0; i < roomInstances[inRoom].content.length; i ++) {
					if(roomInstances[inRoom].content[i] instanceof Forge) {
						roomInstances[inRoom].content[i].used = true;
						break;
					}
				}
				this.guiOpen = "none";
			}
		}
		if(mouseX > 500 - 35 && mouseX < 535 && mouseY > 400 - 35 && mouseY < 435) {
			cursorHand = true;
			choice2.desc = choice2.getDesc();
			choice2.displayDesc(535, 400, "right");
			if(mouseIsPressed) {
				/* Update Item Stats */
				this.invSlots[this.reforgeIndex].content.damLow = choice2.damLow;
				this.invSlots[this.reforgeIndex].content.damHigh = choice2.damHigh;
				this.invSlots[this.reforgeIndex].content.modifier = "none";
				if(this.invSlots[this.reforgeIndex].content instanceof MeleeWeapon) {
					this.invSlots[this.reforgeIndex].content.attackSpeed = choice2.attackSpeed;
				}
				else if(this.invSlots[this.reforgeIndex].content instanceof RangedWeapon) {
					this.invSlots[this.reforgeIndex].content.range = choice2.range;
				}
				else if(this.invSlots[this.reforgeIndex].content instanceof MagicWeapon) {
					this.invSlots[this.reforgeIndex].content.manaCost = choice2.manaCost;
				}
				else if(this.invSlots[this.reforgeIndex].content instanceof Equipable) {
					this.invSlots[this.reforgeIndex].content = new this.invSlots[this.reforgeIndex].content.constructor(choice2.modifier);
				}
				/* Close GUI and mark forge as used */
				for(var i = 0; i < roomInstances[inRoom].content.length; i ++) {
					if(roomInstances[inRoom].content[i] instanceof Forge) {
						roomInstances[inRoom].content[i].used = true;
						break;
					}
				}
				this.guiOpen = "none";
			}
		}
	}
	else {
		/* Display held items */
		for(var i = 0; i < this.invSlots.length; i ++) {
			this.invSlots[i].content.opacity += 0.05;
			if(this.invSlots[i].type === "holding") {
				c.strokeStyle = "rgb(100, 100, 100)";
				c.fillStyle = "rgb(150, 150, 150)";
				c.fillRect(this.invSlots[i].x, this.invSlots[i].y, 70, 70);
				c.strokeRect(this.invSlots[i].x, this.invSlots[i].y, 70, 70);
				if(this.invSlots[i].content !== "empty") {
					display(this.invSlots[i]);
				}
			}
			if(i === this.activeSlot) {
				selectionGraphic(this.invSlots[i]);
			}
		}
	}
	this.openingBefore = keys[68];
};
Player.prototype.addItem = function(item) {
	/*
	Adds the item 'item' to the player's inventory.
	*/
	/* Check for matching items if it's stackable */
	if(item.stackable) {
		for(var i = 0; i < this.invSlots.length; i ++) {
			if(this.invSlots[i].content instanceof item.constructor) {
				this.invSlots[i].content.quantity += item.quantity;
				return;
			}
		}
	}
	/* Check for empty slots if it's not */
	for(var i = 0; i < this.invSlots.length; i ++) {
		if(this.invSlots[i].content === "empty") {
			this.invSlots[i].content = new item.constructor();
			for(var j in item) {
				this.invSlots[i].content[j] = item[j];
			}
			this.invSlots[i].content.opacity = 0;
			return;
		}
	}
};
Player.prototype.hurt = function(amount, killer, ignoreDef) {
	/*
	Deals 'amount' damage to the player. 'killer' shows up in death message. If 'ignoreDef' is true, the player's defense will be ignored.
	*/
	if(amount !== 0) {
		this.damOp = 1;
	}
	/* Calculate defense */
	this.defLow = 0;
	this.defHigh = 0;
	for(var i = 0; i < this.invSlots.length; i ++) {
		if(this.invSlots[i].type === "equip" && this.invSlots[i].content.defLow !== undefined && this.invSlots[i].content.defHigh !== undefined) {
			this.defLow += this.invSlots[i].content.defLow;
			this.defHigh += this.invSlots[i].content.defHigh;
		}
	}
	var defense = Math.random() * (this.defHigh - this.defLow) + this.defLow;
	/* Subtract defense from damage dealt*/
	if(ignoreDef) {
		var damage = amount;
	}
	else {
		var damage = amount - defense;
	}
	/* Cap damage at 0 + hurt player */
	if(damage < 0) {
		damage = 0;
	}
	damage = Math.round(damage);
	this.health -= damage;
	/* If player is dead, record killer */
	if(this.health <= 0) {
		this.dead = true;
		this.deathCause = killer;
	}
};
Player.prototype.reset = function() {
	/*
	This function resets most of the player's properties. (Usually called after starting a new game)
	*/
	/* Reset rooms */
	roomInstances = [
		new Room(
			"ambient1",
			[
				new Pillar(200, 500, 200),
				new Pillar(400, 500, 200),
				new Pillar(600, 500, 200),
				new Pillar(800, 500, 200),
				new Block(-200, 500, 2000, 600),//floor
				new Block(-600, -200, 700, 900), //left wall
				new Block(-400, -1000, 2000, 1300), //ceiling
				new Block(900, -200, 500, 1000), //right wall
				new Door(300,  500, ["ambient", "combat", "parkour", "secret"]),
				new Door(500,  500, ["ambient", "combat", "parkour", "secret"]),
				new Door(700,  500, ["ambient", "combat", "parkour", "secret"])
			],
			"?"
		)
	];
	inRoom = 0;
	numRooms = 0;
	/* Reset player properties */
	var permanentProperties = ["onScreen", "class", "maxGold", "scores"];
	for(var i in this) {
		var isPermanent = false;
		permanentLoop: for(var j = 0; j < permanentProperties.length; j ++) {
			if(i === permanentProperties[j]) {
				isPermanent = true;
				break permanentLoop;
			}
		}
		if(!isPermanent) {
			var newPlayer = new Player();
			newPlayer.init();
			this[i] = newPlayer[i];
		}
	}
	/* Re-add class items */
	switch(this.class) {
		case "warrior":
			this.addItem(new Sword());
			this.addItem(new Helmet());
			break;
		case "archer":
			this.addItem(new WoodBow());
			this.addItem(new Dagger());
			this.addItem(new Arrow(10));
			break;
		case "mage":
			this.addItem(new EnergyStaff());
			this.addItem(new Dagger());
			this.addItem(new WizardHat());
			break;
	}
};
Player.prototype.updatePower = function() {
	/*
	This function gives a number representing the overall quality of the player's items + health and mana upgrades. (stores in this.power)
	*/
	this.power = 0;
	this.power += (this.maxHealth - 100);
	this.power += (this.maxMana - 100);
	for(var i = 0; i < this.invSlots.length; i ++) {
		if(this.invSlots[i].content !== "empty" && this.invSlots[i].content.power !== undefined) {
			this.power += this.invSlots[i].content.power;
		}
	}
};
var p = new Player();
p.init();
if(localStorage.getItem("scores") !== null) {
	p.scores = JSON.parse(localStorage.getItem("scores"));
}

/** COLLISIONS **/
var collisions = [];
function CollisionRect(x, y, w, h, settings) {
	/*
	This object represents a collision - the kind where when the player hits it, they bounce back.
	*/
	this.x = x;
	this.y = y;
	this.w = w;
	this.h = h;
	this.settings = settings || {};
	this.settings.walls = this.settings.walls || [true, true, true, true];
	this.settings.illegalHandling = this.settings.illegalHandling || "collide";
	this.settings.moving = this.settings.moving || false;
	this.settings.player = this.settings.player || (p.onScreen === "play" ? p : howChar);
};
CollisionRect.prototype.collide = function() {
	/* Add a hitbox if 'showHitboxes' is true (for debugging) */
	if(showHitboxes) {
		hitboxes.push({x: this.x, y: this.y, w: this.w, h: this.h, color: this.settings.illegalHandling === "teleport" ? "dark blue" : "light blue"});
	}
	/* Collide with player if in the same room */
	if(inRoom === theRoom) {
		if(!this.settings.moving) {
			/* Top */
			if(this.settings.player.x + 5 > this.x && this.settings.player.x - 5 < this.x + this.w && this.settings.player.y + 46 >= this.y && this.settings.player.y + 46 <= this.y + this.settings.player.velY + 1 && this.settings.walls[0]) {
				this.settings.player.velY = 0;
				this.settings.player.y = this.y - 46;
				this.settings.player.canJump = true;
				/* Hurt the player if they've fallen from a height */
				if(this.settings.player.fallDmg !== 0) {
					this.settings.player.hurt(this.settings.player.fallDmg, "falling", true);
					this.settings.player.fallDmg = 0;
				}
			}
			/* Bottom */
			if(this.settings.player.x + 5 > this.x && this.settings.player.x - 5 < this.x + this.w && this.settings.player.y <= this.y + this.h && this.settings.player.y >= this.y + this.h + this.settings.player.velY - 1 && this.settings.walls[1]) {
				this.settings.player.velY = 2;
			}
			/* Left */
			if(this.settings.player.y + 46 > this.y && this.settings.player.y < this.y + this.h && this.settings.player.x + 5 >= this.x && this.settings.player.x + 5 <= this.x + this.settings.player.velX + 1 && this.settings.walls[2]) {
				if(this.settings.illegalHandling === "collide") {
					this.settings.player.velX = (this.settings.extraBouncy) ? -3 : -1;
				}
				else {
					this.settings.player.y = this.y - 46;
				}
			}
			/* Right */
			if(this.settings.player.y + 46 > this.y && this.settings.player.y < this.y + this.h && this.settings.player.x - 5 <= this.x + this.w && this.settings.player.x - 5 >= this.x + this.w + this.settings.player.velX - 1 && this.settings.walls[3]) {
				if(this.settings.illegalHandling === "collide") {
					this.settings.player.velX = (this.settings.extraBouncy) ? 3 : 1;
				}
				else {
					this.settings.player.y = this.y - 46;
				}
			}
		}
		else {
			/* Top */
			if(this.settings.player.x + 5 > this.x && this.settings.player.x - 5 < this.x + this.w && this.settings.player.y + 46 >= this.y && this.settings.player.y + 46 <= this.y + 6 && this.settings.walls[0]) {
				this.settings.player.velY = 0;
				this.settings.player.y = this.y - 46;
				this.settings.player.canJump = true;
				if(this.settings.player.fallDmg !== 0) {
					this.settings.player.hurt(this.settings.player.fallDmg, "falling");
					this.settings.player.fallDmg = 0;
				}
			}
			/* Bottom */
			if(this.settings.player.x + 5 > this.x && this.settings.player.x - 5 < this.x + this.w && this.settings.player.y <= this.y + this.h && this.settings.player.y >= this.y + this.h - 6 && this.settings.walls[1]) {
				this.settings.player.velY = 2;
			}
			/* Left */
			if(this.settings.player.y + 46 > this.y && this.settings.player.y < this.y + this.h && this.settings.player.x + 5 >= this.x && this.settings.player.x + 5 <= this.x + 6 && this.settings.walls[2]) {
				if(this.settings.illegalHandling === "collide") {
					this.settings.player.velX = (this.settings.extraBouncy) ? -3 : -1;
				}
				else {
					this.settings.player.y = this.y - 46;
				}
			}
			/* Right */
			if(this.settings.player.y + 46 > this.y && this.settings.player.y < this.y + this.h && this.settings.player.x - 5 <= this.x + this.w && this.settings.player.x - 5 >= this.x + this.w - 6 && this.settings.walls[3]) {
				if(this.settings.illegalHandling === "collide") {
					this.settings.player.velX = (this.settings.extraBouncy) ? 3 : 1;
				}
				else {
					this.settings.player.y = this.y - 46;
				}
			}
		}
	}
	/* Collide with other objects */
	for(var i = 0; i < roomInstances[theRoom].content.length; i ++) {
		var thing = roomInstances[theRoom].content[i];
		if(thing instanceof Enemy) {
			var enemy = thing;
			if(enemy.x + p.worldX + enemy.rightX > this.x && enemy.x + p.worldX + enemy.leftX < this.x + this.w) {
				if(enemy.y + p.worldY + enemy.bottomY >= this.y && enemy.y + p.worldY + enemy.bottomY <= this.y + enemy.velY + 1) {
					enemy.velY = (enemy.velY > 0) ? 0 : enemy.velY;
					enemy.y = this.y - p.worldY - Math.abs(enemy.bottomY);
					enemy.canJump = true;
					if(enemy instanceof Bat && enemy.timePurified > 0) {
						enemy.dest = {x: enemy.x + (Math.random() * 200 - 100), y: enemy.y + (Math.random() * 200 - 100)};
					}
				}
				if(enemy.y + p.worldY + enemy.topY <= this.y + this.h && enemy.y + p.worldY + enemy.topY >= this.y + this.h + enemy.velY - 1) {
					enemy.velY = 3;
					enemy.y = this.y + this.h - p.worldY + Math.abs(enemy.topY);
					if(enemy instanceof Bat && enemy.timePurified > 0) {
						enemy.dest = {x: enemy.x + (Math.random() * 200 - 100), y: enemy.y + (Math.random() * 200 - 100)};
					}
				}
			}
			if(enemy.y + enemy.bottomY + p.worldY > this.y && enemy.y + enemy.topY + p.worldY < this.y + this.h) {
				if(enemy.x + p.worldX + enemy.rightX >= this.x && enemy.x + p.worldX + enemy.rightX <= this.x + enemy.velX + 1) {
					if(this.settings.illegalHandling === "teleport") {
						enemy.y = this.y - p.worldY - Math.abs(enemy.bottomY);
						enemy.velY = (enemy.velY > 0) ? 0 : enemy.velY;
						enemy.canJump = true;
					}
					else {
						enemy.velX = (enemy.velX > 0) ? -3 : enemy.velX;
						enemy.x = this.x - p.worldX - Math.abs(enemy.rightX);
						if(enemy instanceof Bat && enemy.timePurified > 0) {
							enemy.dest = {x: enemy.x + (Math.random() * 200 - 100), y: enemy.y + (Math.random() * 200 - 100)};
						}
					}
				}
				if(enemy.x + p.worldX + enemy.leftX <= this.x + this.w && enemy.x + p.worldX + enemy.leftX >= this.x + this.w + enemy.velX - 1) {
					if(this.settings.illegalHandling === "teleport") {
						enemy.y = this.y - p.worldY - Math.abs(enemy.bottomY);
						enemy.velY = (enemy.velY > 0) ? 0 : enemy.velY;
						enemy.canJump = true;
					}
					else {
						enemy.velX = (enemy.velX < 0) ? 3 : enemy.velX;
						enemy.x = this.x + this.w - p.worldX + Math.abs(enemy.leftX);
						if(enemy instanceof Bat && enemy.timePurified > 0) {
							enemy.dest = {x: enemy.x + (Math.random() * 200 - 100), y: enemy.y + (Math.random() * 200 - 100)};
						}
					}
				}
				if(!(typeof enemy.velX === "number") && enemy.x + enemy.rightX + p.worldX > this.x && enemy.x + enemy.rightX + p.worldX < this.x + 5) {
					enemy.x = this.x - p.worldX - Math.abs(enemy.rightX) - 1;
				}
				if(!(typeof enemy.velX === "number") && enemy.x + enemy.leftX + p.worldX < this.x + this.w && enemy.x + enemy.leftX + p.worldX > this.x + this.w - 5) {
					enemy.x = this.x + this.w - p.worldX + Math.abs(enemy.leftX) + 1;
				}
			}
		}
		else if(thing instanceof MagicCharge && thing.x + p.worldX + 20 > this.x && thing.x + p.worldX - 20 < this.x + this.w && thing.y + p.worldY + 20 > this.y && thing.y + p.worldY - 20 < this.y + this.h && !thing.splicing) {
			thing.splicing = true;
			if(thing.type === "chaos" && !p.aiming) {
				var charge = thing;
				p.x = charge.x + p.worldX;
				p.y = charge.y + p.worldY;
				for(var j = 0; j < collisions.length; j ++) {
					while(p.x + 5 > collisions[i].x && p.x - 5 < collisions[i].x + 10 && p.y + 46 > collisions[i].y && p.y - 7 < collisions[i].y + collisions[i].h) {
						p.x --;
					}
					while(p.x - 5 < collisions[i].x + collisions[i].w && p.x + 5 > collisions[i].x + collisions[i].w - 10 && p.y + 46 > collisions[i].y && p.y - 7 < collisions[i].y + collisions[i].h) {
						p.x ++;
					}
					while(p.x + 5 > collisions[i].x && p.x - 5 < collisions[i].x + collisions[i].w && p.y - 7 < collisions[i].y + collisions[i].h && p.y + 46 > collisions[i].y + collisions[i].h - 10) {
						p.y ++;
					}
					while(p.x + 5 > collisions[i].x && p.x - 5 < collisions[i].x + collisions[i].w && p.y + 46 > collisions[i].y && p.y - 7 < collisions[i].y + 10) {
					p.y --;
				}
				}
			}
			continue;
		}
		else if(thing instanceof ShotArrow && this.isPointInside(thing.x + p.worldX, thing.y + p.worldY, thing.w, thing.h)) {
			thing.hitSomething = true;
		}
	}
};
CollisionRect.prototype.isPointInside = function(x, y) {
	return (x > this.x && x < this.x + this.w && y > this.y && y < this.y + this.h);
};
CollisionRect.prototype.isRectInside = function(x, y, w, h) {
	return (x + w > this.x && x < this.x + this.w && y + h > this.y && y < this.y + this.h);
};
function CollisionCircle(x, y, r) {
	/*
	('x', 'y') is center, not top-left corner. Radius is 'r'
	*/
	this.x = x;
	this.y = y;
	this.r = r;
};
CollisionCircle.prototype.collide = function() {
	var rSquared = this.r * this.r;
	/* Collide with player if in the same room */
	while(Math.distSq(p.x + 5, p.y + 46, this.x + p.worldX, this.y + p.worldY) <  rSquared || Math.distSq(p.x - 5, p.y + 46, this.x + p.worldX, this.y + p.worldY) < rSquared) {
		p.y --;
		p.canJump = true;
		p.velY = (p.velY > 3) ? 3 : p.velY;
	}
	for(var i = 0; i < roomInstances[theRoom].content.length; i ++) {
		var thing = roomInstances[theRoom].content[i];
		if(thing instanceof Enemy) {
			while(Math.distSq(this.x, this.y, thing.x + thing.leftX, thing.y + thing.bottomY) < rSquared || Math.distSq(this.x, this.y, thing.x + thing.rightX, thing.y + thing.bottomY) < rSquared) {
				thing.y --;
				thing.velY = (thing.velY > 3) ? 3 : thing.velY;
				if(thing instanceof Bat && thing.timePurified > 0) {
					thing.dest = {x: thing.x + (Math.random() * 200 - 100), y: thing.y + (Math.random() * 200 - 100)};
					thing.velY = 0;
				}
			}
		}
	}
};

/** IN GAME STRUCTURES **/
function Block(x, y, w, h) {
	this.x = x;
	this.y = y;
	this.w = w;
	this.h = h;
};
Block.prototype.update = function() {
	collisionRect(this.x + p.worldX, this.y + p.worldY, this.w, this.h, {walls: [true, true, true, true], illegalHandling: tempVars.partOfAStair ? "teleport" : "collide"} );
};
Block.prototype.exist = function() {
	this.display();
	this.update();
};
Block.prototype.display = function() {
	cube(this.x + p.worldX, this.y + p.worldY, this.w, this.h, 0.9, 1.1);
};
function loadBoxFronts() {
	for(var i = 0; i < boxFronts.length; i ++) {
		if(boxFronts[i].type === "boulder void") {
			c.globalAlpha = (boxFronts[i].opacity <= 0) ? 0 : boxFronts[i].opacity;
			c.fillStyle = "rgb(150, 150, 150)";
			c.beginPath();
			c.moveTo(boxFronts[i].pos1.x, boxFronts[i].pos1.y);
			c.lineTo(boxFronts[i].pos2.x, boxFronts[i].pos2.y);
			c.lineTo(boxFronts[i].pos3.x, boxFronts[i].pos3.y);
			c.lineTo(boxFronts[i].pos4.x, boxFronts[i].pos4.y);
			c.fill();
			c.globalAlpha = 1;
		}
		if(boxFronts[i].type === "rect") {
			c.fillStyle = boxFronts[i].col;
			c.fillRect(boxFronts[i].loc[0], boxFronts[i].loc[1], boxFronts[i].loc[2], boxFronts[i].loc[3]);
		}
		else if(boxFronts[i].type === "polygon") {
			c.fillStyle = boxFronts[i].col;
			c.beginPath();
			for(var j = 0; j < boxFronts[i].loc.length; j ++) {
				if(j === 0) {
					c.moveTo(boxFronts[i].loc[j].x, boxFronts[i].loc[j].y);
				}
				else {
					c.lineTo(boxFronts[i].loc[j].x, boxFronts[i].loc[j].y);
				}
			}
			c.fill();
		}
		else if(boxFronts[i].type === "circle") {
			c.fillStyle = boxFronts[i].col;
			c.beginPath();
			c.arc(boxFronts[i].loc[0], boxFronts[i].loc[1], boxFronts[i].loc[2], 0, 2 * Math.PI);
			c.fill();
		}
		else if(boxFronts[i].type === "arc") {
			c.fillStyle = boxFronts[i].col;
			c.strokeStyle = boxFronts[i].col;
			c.beginPath();
			c.moveTo(boxFronts[i].loc[0], boxFronts[i].loc[1]);
			c.arc(boxFronts[i].loc[0], boxFronts[i].loc[1], boxFronts[i].loc[2], boxFronts[i].loc[3], boxFronts[i].loc[4]);
			c.closePath();
			c.fill();
			c.beginPath();
			c.arc(boxFronts[i].loc[0], boxFronts[i].loc[1], boxFronts[i].loc[2], boxFronts[i].loc[3], boxFronts[i].loc[4]);
			c.stroke();
		}
	}
	//extra graphics
	c.save();
	for(var i = 0; i < extraGraphics.length; i ++) {
		if(extraGraphics[i].type === "polygon") {
			c.globalAlpha = 0.5;
			c.fillStyle = extraGraphics[i].col;
			c.beginPath();
			c.moveTo(extraGraphics[i].loc[0].x, extraGraphics[i].loc[0].y);
			for(var j = 0; j < extraGraphics[i].loc.length; j ++) {
				c.lineTo(extraGraphics[i].loc[j].x, extraGraphics[i].loc[j].y);
			}
			c.lineTo(extraGraphics[i].loc[0].x, extraGraphics[i].loc[0].y);
			c.fill();
		}
	}
	c.restore();
};
function Platform(x, y, w) {
	this.x = x;
	this.y = y;
	this.w = w;
};
Platform.prototype.update = function() {
	collisionRect(this.x + p.worldX, this.y + p.worldY, this.w, 3, {walls: [true, false, false, false]});
};
Platform.prototype.exist = function() {
	this.update();
	cube(this.x + p.worldX, this.y + p.worldY, this.w, 3, 0.9, 1.1, "rgb(139, 69, 19)", "rgb(159, 89, 39");
};
function Door(x, y, dest, noEntry, invertEntries, type) {
	this.x = x;
	this.y = y;
	this.dest = dest;
	this.noEntry = noEntry || false;
	this.invertEntries = invertEntries || false;
	this.type = type || "same";
	this.onPath = false;
};
Door.prototype.getInfo = function() {
	//returns the text to display when the user is holding a map
	if(!(p.invSlots[p.activeSlot].content instanceof Map)) {
		return ""; //not holding a map -> no explanatory text
	}
	if(typeof this.dest === "object") {
		return "?"; //unexplored -> "?"
	}
	var isDeadEnd = true;
	for(var i = 0; i < roomInstances[this.dest].content.length; i ++) {
		if(roomInstances[this.dest].content[i] instanceof Door) {
			isDeadEnd = false;
			break;
		}
	}
	if(isDeadEnd) {
		return "x"; // "x" if no doors in the room
	}
	var indices = [theRoom];
	function isUnknown(index) {
		for(var i = 0; i < indices.length; i ++) {
			if(index === indices[i]) {
				return false;
			}
		}
		indices.push(index);
		var containsUnknown = false;
		for(var i = 0; i < roomInstances[index].content.length; i ++) {
			if(!(roomInstances[index].content[i] instanceof Door)) {
				continue;
			}
			if(typeof roomInstances[index].content[i].dest === "object") {
				return true;
			}
			else {
				var leadsToUnknown = isUnknown(roomInstances[index].content[i].dest);
				if(leadsToUnknown) {
					return true;
				}
			}
		}
		return false;
	};
	var leadsToUnexplored = isUnknown(this.dest);
	if(leadsToUnexplored) {
		return "^";
	}
	for(var i = 0; i < roomInstances.length; i ++) {
		delete roomInstances[i].doorPathScore;
	}
	return "x";
};
Door.prototype.exist = function() {
	/* Display graphics */
	this.display();
	// var loc = point3d(this.x + p.worldX, this.y + p.worldY);
	// thingsToBeRendered.push(new RenderingObject(
	// 	this,
	// 	{
	// 		x: loc.x - 30,
	// 		y: loc.y - 60,
	// 		w: 60,
	// 		h: 60
	// 	},
	// 	{
	// 		x: this.x + p.worldX - 30,
	// 		y: this.y + p.worldY - 60,
	// 		w: 60,
	// 		h: 60,
	// 		z: 0.9
	// 	}
	// ));
	/* Update */
	this.update();
};
Door.prototype.display = function() {
	/* Graphics */
	var topLeft = point3d(this.x + p.worldX - 30, this.y + p.worldY - 60, 0.9);
	var bottomRight = point3d(this.x + p.worldX + 30, this.y + p.worldY, 0.9);
	if(this.type === "arch") {
		c.fillStyle = "rgb(20, 20, 20)";
		c.fillRect(topLeft.x, topLeft.y, bottomRight.x - topLeft.x, bottomRight.y - topLeft.y);
		c.beginPath();
		c.arc(topLeft.x + ((bottomRight.x - topLeft.x) / 2), topLeft.y, 27, 0, 2 * Math.PI);
		c.fill();
	}
	if(this.barricaded) {
		c.save();
		c.fillStyle = "rgb(139, 69, 19)";
		c.strokeStyle = "rgb(255, 255, 255)";
		c.lineWidth = 2;
		function woodBoard() {
			c.fillRect(-40, -10, 80, 20);
			c.fillStyle = "rgb(200, 200, 200)";
			circle(-30, 0, 5);
			circle(30, 0, 5);
			c.beginPath();
			c.moveTo(-35, 0);
			c.lineTo(-25, 0);
			c.stroke();
			c.beginPath();
			c.moveTo(-30, -5);
			c.lineTo(-30, 5);
			c.stroke();
			c.beginPath();
			c.moveTo(35, 0);
			c.lineTo(25, 0);
			c.stroke();
			c.beginPath();
			c.moveTo(30, -5);
			c.lineTo(30, 5);
			c.stroke();
		};
		c.save();
		c.translate(topLeft.x + (bottomRight.x - topLeft.x) / 2, bottomRight.y - 60);
		c.rotate(22 / 180 * Math.PI);
		woodBoard();
		c.restore();

		c.save();
		c.translate(topLeft.x + (bottomRight.x - topLeft.x) / 2, bottomRight.y - 40);
		c.rotate(-22 / 180 * Math.PI);
		woodBoard();
		c.restore();

		c.save();
		c.translate(topLeft.x + (bottomRight.x - topLeft.x) / 2, bottomRight.y - 20);
		c.rotate(22 / 180 * Math.PI);
		woodBoard();
		c.restore();

		c.restore();

	}
	if(this.type === "lintel") {
		cube(this.x + p.worldX - 30, this.y + p.worldY - 90, 60, 90, 0.9, 0.9, "rgb(20, 20, 20)", "rgb(20, 20, 20)", { noFrontExtended: true });
		cube(this.x + p.worldX - 45, this.y + p.worldY - 110, 90, 20, 0.9, 0.91, "rgb(110, 110, 110)", "rgb(150, 150, 150)", {noFrontExtended: true} );
	}
	/* Symbols for maps */
	var symbol = this.getInfo();
	var center = point3d(this.x + p.worldX, this.y + p.worldY - 40, 0.9);
	c.font = "15pt monospace";
	c.fillStyle = "rgb(255, 255, 255)";
	c.textAlign = "center";
	if(symbol !== ">" || true) {
		c.fillText(symbol, center.x, center.y);
	}
	else {
		if(p.x > this.x + p.worldX) {
			c.fillText("<", center.x, center.y);
		}
		else {
			c.fillText(">", center.x, center.y);
		}
	}
};
Door.prototype.update = function() {
	/* Resolve type (arched top vs. lintel) */
	if(this.type === "same" || this.type === "toggle") {
		if(this.type === "same") {
			this.type = p.doorType;
		}
		else {
			this.type = (p.doorType === "arch") ? "lintel" : "arch";
		}
	}
	/* Room Transition */
	var topLeft = point3d(this.x + p.worldX - 30, this.y + p.worldY - 60, 0.9);
	var bottomRight = point3d(this.x + p.worldX + 30, this.y + p.worldY, 0.9);
	if(p.x - 5 > topLeft.x && p.x + 5 < bottomRight.x && p.y + 46 > topLeft.y && p.y + 46 < bottomRight.y + 10 && p.canJump && keys[83] && !p.enteringDoor && !p.exitingDoor && p.guiOpen === "none" && !this.barricaded) {
		p.enteringDoor = true;
		this.entering = true;
	}
	if(p.screenOp > 0.95 && this.entering && !this.barricaded) {
		p.doorType = this.type;
		if(typeof this.dest !== "number") {
			p.roomsExplored ++;
			p.numHeals ++;
			/* Calculate distance to nearest unexplored door */
			calculatePaths();
			p.terminateProb = 0;
			for(var i = 0; i < roomInstances.length; i ++) {
				for(var j = 0; j < roomInstances[i].content.length; j ++) {
					if(roomInstances[i].content[j] instanceof Door && typeof(roomInstances[i].content[j].dest) === "object" && !roomInstances[i].content[j].entering) {
						p.terminateProb += (1 / ((roomInstances[i].pathScore + 1) * (roomInstances[i].pathScore + 1)));
					}
				}
			}
			/* Create a list of valid rooms to generate */
			var possibleRooms = [];
			for(var i = 0; i < rooms.length; i ++) {
				if(roomInstances[inRoom].colorScheme === "red") {
					//remove fountain, tree, mana altar
					if(rooms[i].name === "ambient5" || rooms[i].name === "secret1" || (rooms[i].name === "reward2" && p.healthAltarsFound >= 5)) {
						continue;
					}
				}
				else if(roomInstances[inRoom].colorScheme === "green") {
					//remove fountain, forge, altars, library
					if(rooms[i].name === "ambient5" || rooms[i].name === "reward3" || rooms[i].name === "reward2" || rooms[i].name === "secret3") {
						continue;
					}
				}
				else if(roomInstances[inRoom].colorScheme === "blue") {
					//remove forge, tree, health altar, library
					if(rooms[i].name === "reward3" || rooms[i].name === "secret1" || (rooms[i].name === "reward2" && p.manaAltarsFound >= 5) || rooms[i].name === "secret3") {
						continue;
					}
				}
				for(var j = 0; j < this.dest.length; j ++) {
					if(this.dest[j] === rooms[i].name.substr(0, 7) && rooms[i].name !== roomInstances[inRoom].type) {
						possibleRooms.push(rooms[i]);
					}
					if(this.dest[j] === rooms[i].name.substr(0, 6) && rooms[i].name !== roomInstances[inRoom].type) {
						possibleRooms.push(rooms[i]);
					}
				}
			}
			/* Apply weighting based on number of nearby unexplored doors */
			/*
			higher # - more doors - more dead ends
			lower # - less doors - more splits
			medium # - medium doors - no effects (or continuations, splits, and dead ends)
			*/
			p.updatePower();
			var newWeights = [];
			for(var i = 0; i < possibleRooms.length; i ++) {
				var diffScore = Math.abs(possibleRooms[i].difficulty - p.power); //bigger # = less likely
				var termScore = Math.abs(possibleRooms[i].extraDoors - p.terminateProb); //smaller # = less likely
				var totalScore = termScore - diffScore;
			}
			/* Add selected room */
			var roomIndex = Math.round(Math.random() * (possibleRooms.length - 1));
			possibleRooms[roomIndex].add();
			roomInstances[roomInstances.length - 1].id = "?";
			/* Reset transition variables */
			var previousRoom = inRoom;
			inRoom = numRooms;
			p.enteringDoor = false;
			p.exitingDoor = true;
			p.op = 1;
			p.op = 95;
			this.dest = numRooms;
			/* Give new room an ID */
			for(var i = 0; i < roomInstances.length; i ++) {
				if(roomInstances[i].id === "?") {
					roomInstances[i].id = numRooms;
					numRooms ++;
				}
			}
			/* Move player to exit door */
			for(var i = 0; i < roomInstances.length; i ++) {
				if(roomInstances[i].id === numRooms - 1) {
					/* Select a door */
					var doorIndexes = [];
					for(var j = 0; j < roomInstances[i].content.length; j ++) {
						if(roomInstances[i].content[j] instanceof Door && (!!roomInstances[i].content[j].noEntry) === (!!this.invertEntries) && roomInstances[i].content[j].noEntry !== "no entries") {
							doorIndexes.push(j);
						}
					}
					if(doorIndexes.length === 0) {
						for(var j = 0; j < roomInstances[i].content.length; j ++) {
							if(roomInstances[i].content[j] instanceof Door) {
								doorIndexes.push(j);
							}
						}
					}
					var theIndex = doorIndexes[Math.round(Math.random() * (doorIndexes.length - 1))];
					/* Move player to door */
					p.worldX = 0;
					p.worldY = 0;
					p.x = roomInstances[i].content[theIndex].x;
					p.y = roomInstances[i].content[theIndex].y - 47;
					if(roomInstances[i].content[theIndex].type === "toggle") {
						for(var j = 0; j < roomInstances[i].content.length; j ++) {
							if(roomInstances[i].content[j] instanceof Door && j !== theIndex) {
								roomInstances[i].content[j].type = (roomInstances[i].content[j].type === "same") ? "toggle" : "same";
							}
						}
					}
					roomInstances[i].content[theIndex].type = p.doorType;
					if(p.y > 400) {
						p.worldY -= Math.dist(0, p.y, 0, 400);
						p.y = 400;
					}
					else if(p.y < 400) {
						p.worldY += Math.dist(0, p.y, 0, 400);
						p.y = 400;
					}
					if(p.x > 400) {
						p.worldX -= Math.dist(p.x, 0, 400, 0);
						p.x = 400;
					}
					else if(p.x < 400) {
						p.worldX += Math.dist(p.x, 0, 400, 0);
						p.x = 400;
					}
					/* Assign new door to lead to this room */
					roomInstances[i].content[theIndex].dest = previousRoom;
					/* Assign this door to lead to new door */
					this.dest = inRoom;
				}
			}
			/* Assign new room's color scheme */
			for(var i = 0; i < roomInstances.length; i ++) {
				if(roomInstances[i].id === numRooms - 1 && roomInstances[i].type !== "ambient5" && roomInstances[i].type !== "reward2" && roomInstances[i].type !== "reward3" && roomInstances[i].type !== "secret1" && roomInstances[i].type !== "secret3") {
					var hasDecorations = false;
					decorationLoop: for(var j = 0; j < roomInstances[i].content.length; j ++) {
						if(roomInstances[i].content[j] instanceof Decoration || roomInstances[i].content[j] instanceof Torch) {
							hasDecorations = true;
							break decorationLoop;
						}
					}
					if(!hasDecorations) {
						roomInstances[i].colorScheme = null;
					}
					if(roomInstances[previousRoom].colorScheme === null && hasDecorations) {
						var chooser = Math.random();
						if(chooser < 0.33) {
							roomInstances[i].colorScheme = "red";
						}
						else if(chooser < 0.66) {
							roomInstances[i].colorScheme = "green";
						}
						else {
							roomInstances[i].colorScheme = "blue";
						}
					}
					if(roomInstances[previousRoom].colorScheme !== null && hasDecorations) {
						roomInstances[i].colorScheme = roomInstances[previousRoom].colorScheme;
					}
				}
			}
		}
		else {
			var previousRoom = inRoom;
			for(var i = 0; i < roomInstances.length; i ++) {
				inRoom = this.dest;
				if(roomInstances[i].id === this.dest) {
					for(var j = 0; j < roomInstances[i].content.length; j ++) {
						if(roomInstances[i].content[j] instanceof Door && roomInstances[i].content[j].dest === previousRoom) {
							p.x = 400;
							p.y = 400;
							p.worldX = 400 - roomInstances[i].content[j].x;
							p.worldY = 446 - roomInstances[i].content[j].y;
						}
					}
				}
			}
			p.enteringDoor = false;
			p.exitingDoor = true;
			p.op = 0.95;
		}
		p.screenOp = 0.95;
		this.entering = false;
		calculatePaths();
	}
};
function calculated() {
	for(var i = 0; i < roomInstances.length; i ++) {
		if(roomInstances[i].pathScore === null) {
			return false;
		}
	}
	return true;
};
function calculatePaths() {
	for(var i = 0; i < roomInstances.length; i ++) {
		roomInstances[i].pathScore = null;
	}
	var timeOut = 0;
	while(!calculated() && timeOut < 20) {
		timeOut ++;
		for(var i = 0; i < roomInstances.length; i ++) {
			if(i === inRoom) {
				roomInstances[i].pathScore = 0;
			}
			for(var j = 0; j < roomInstances[i].content.length; j ++) {
				if(roomInstances[i].content[j] instanceof Door && typeof roomInstances[i].content[j].dest !== "object" && roomInstances[i].pathScore === null) {
					if(roomInstances[roomInstances[i].content[j].dest].pathScore !== null) {
						//roomInstances[i].content[j].onPath = true;
						roomInstances[i].pathScore = roomInstances[roomInstances[i].content[j].dest].pathScore + 1;
					}
				}
			}
		}
	}
};
function Torch(x, y) {
	this.x = x;
	this.y = y;
	this.lit = false;
	this.fireParticles = [];
};
Torch.prototype.exist = function() {
	this.update();
	/* Request graphics */
	cube(this.x + p.worldX - 5, this.y + p.worldY - 20, 10, 20, 0.9, 0.95, null, null, { noFrontExtended: true });
	cube(this.x + p.worldX - 10, this.y + p.worldY - 25, 20, 6, 0.9, 0.97, null, null, { noFrontExtended: true });
	if(p.x + 5 > this.x + p.worldX - 5 && p.x - 5 < this.x + p.worldX + 5) {
		this.lit = true;
	}
	if(this.lit) {
		this.fireParticles.push(new Particle(this.color, this.x, this.y - 27, Math.random(), Math.random() * -3, Math.random() * 5 + 5));
		this.fireParticles[this.fireParticles.length - 1].z = Math.random() * 0.02 + 0.94;
		for(var i = 0; i < this.fireParticles.length; i ++) {
			this.fireParticles[i].exist();
			if(this.fireParticles[i].splicing) {
				this.fireParticles.splice(i, 1);
				continue;
			}
		}
	}
};
Torch.prototype.update = function() {
	/* Resolve color */
	if(this.color === "?" || this.color === undefined) {
		if(roomInstances[theRoom].colorScheme === "red") {
			this.color = "rgb(255, 128, 0)";
		}
		else if(roomInstances[theRoom].colorScheme === "green") {
			this.color = "rgb(0, 255, 0)";
		}
		else {
			this.color = "rgb(0, 255, 255)";
		}
	}
};
function LightRay(x, w) {
	this.x = x;
	this.w = w;
};
LightRay.prototype.exist = function() {
	var left = Math.min(point3d(this.x + p.worldX, 0, 0.9).x, point3d(this.x + p.worldX, 0, 1.1).x);
	var right = Math.max(point3d(this.x + p.worldX + this.w, 0, 0.9).x, point3d(this.x + p.worldX + this.w, 0, 1.1).x);
	c.fillStyle = "rgb(255, 255, 255)";
	c.globalAlpha = 0.5;
	c.fillRect(left, 0, right - left, 800);
	c.globalAlpha = 1;
};
function Tree(x, y) {
	//tree, comes with the planter and everything
	this.x = x;
	this.y = y;
};
Tree.prototype.exist = function() {
	this.update();
	cube(this.x + p.worldX - 100, this.y + p.worldY - 40, 200, 40, 0.9, 1);
	// var loc = point3d(this.x + p.worldX, this.y + p.worldY, 0.95);
	this.display();
	// thingsToBeRendered.push(new RenderingObject(
	// 	this,
	// 	{
	// 		x: loc.x - 150,
	// 		y: loc.y - 230,
	// 		w: 300,
	// 		h: 230
	// 	},
	// 	{
	// 		x: this.x + p.worldX - 150,
	// 		y: this.y + p.worldY - 230,
	// 		w: 300,
	// 		h: 230,
	// 		z: 0.95
	// 	}
	// ));
};
Tree.prototype.update = function() {
	var loc = point3d(this.x + p.worldX, this.y + p.worldY, 0.95);
	collisionLine(loc.x - 6, loc.y - 100, loc.x - 150, loc.y - 100, {walls: [true, false, false, false]});
	collisionLine(loc.x + 6, loc.y - 120, loc.x + 150, loc.y - 120, {walls: [true, false, false, false]});
	collisionLine(loc.x - 5, loc.y - 170, loc.x - 100, loc.y - 180, {walls: [true, false, false, false]});
	collisionLine(loc.x + 5, loc.y - 190, loc.x + 100, loc.y - 200, {walls: [true, false, false, false]});
	collisionLine(loc.x, loc.y - 220, loc.x - 60, loc.y - 230, {walls: [true, false, false, false]});
	// collisionRect(loc.x - 4, loc.y - 350, 8, 2, {walls: [true, false, false, false]});
};
Tree.prototype.display = function() {
	c.fillStyle = "rgb(139, 69, 19)";
	var loc = point3d(this.x + p.worldX, this.y + p.worldY, 0.95);
	/* Tree trunk */
	c.beginPath();
	c.moveTo(loc.x - 10, loc.y - 40);
	c.lineTo(loc.x + 10, loc.y - 40);
	c.lineTo(loc.x, loc.y - 350);
	c.fill();
	/* 1st branch on left */
	c.beginPath();
	c.moveTo(loc.x - 5, loc.y - 80);
	c.lineTo(loc.x - 6, loc.y - 100);
	c.lineTo(loc.x - 150, loc.y - 100);
	c.fill();
	//1st branch on right
	c.beginPath();
	c.moveTo(loc.x + 7, loc.y - 100);
	c.lineTo(loc.x + 6, loc.y - 120);
	c.lineTo(loc.x + 150, loc.y - 120);
	c.fill();
	//2nd branch on left
	c.beginPath();
	c.moveTo(loc.x - 6, loc.y - 150);
	c.lineTo(loc.x - 5, loc.y - 170);
	c.lineTo(loc.x - 100, loc.y - 180);
	c.fill();
	//2nd branch on right
	c.beginPath();
	c.moveTo(loc.x + 6, loc.y - 170);
	c.lineTo(loc.x + 5, loc.y - 190);
	c.lineTo(loc.x + 100, loc.y - 200);
	c.fill();
	//3rd branch on left
	c.beginPath();
	c.moveTo(loc.x, loc.y - 200);
	c.lineTo(loc.x, loc.y - 220);
	c.lineTo(loc.x - 60, loc.y - 230);
	c.fill();
};
function Chest(x, y) {
	this.x = x;
	this.y = y;
	this.r = 0;
	this.opening = false;
	this.openDir = null;
	this.lidArray = findPointsCircular(40, 50, 64); // circle passing through origin
	this.initialized = false;
	this.spawnedItem = false;
};
Chest.prototype.exist = function() {
	this.update();
	/* Square part of chest */
	c.fillStyle = "rgb(139, 69, 19)";
	cube(this.x + p.worldX - 20, this.y + p.worldY - 30, 40, 30, 0.95, 1.05, "rgb(139, 69, 19)", "rgb(159, 89, 39)");
	/* Chest lid */
	var rotatedArray = [];
	for(var i = 0; i < this.lidArray.length; i += this.lidArray.length / 18) {
		/* Rotate each point to the lid's opening rotation, then add to rotatedArray */
		var index = Math.floor(i);
		var pos = this.lidArray[index];
		var newPos = Math.rotate(pos.x - (this.openDir === "left" ? 0 : 40), pos.y, (this.openDir === "left" ? this.r : -this.r));
		newPos.x += this.x + p.worldX + ((this.openDir === "left") ? -20 : 20);
		newPos.y += this.y + p.worldY - 30;
		rotatedArray.push(newPos);
	}
	polygon3d("rgb(139, 69, 19)", "rgb(159, 89, 39)", 0.95, 1.05, rotatedArray);
};
Chest.prototype.update = function() {
	/* Initialize */
	if(!this.initialized) {
		for(var i = 0; i < this.lidArray.length; i ++) {
			this.lidArray[i].x /= 2;
			this.lidArray[i].y /= 2;
			if(this.lidArray[i].y > 0) {
				this.lidArray.splice(i, 1);
				i --;
				continue;
			}
		}
		this.initialized = true;
	}
	/* Decide which direction to open from */
	if(!this.opening) {
		if(p.x < this.x + p.worldX) {
			this.openDir = "right";
		}
		else {
			this.openDir = "left";
		}
	}
	if(p.x + 5 > this.x + p.worldX - 61 && p.x - 5 < this.x + p.worldX + 61 && p.y + 46 >= this.y + p.worldY - 10 && p.y + 46 <= this.y + p.worldY + 10 && keys[83] && p.canJump && !this.opening) {
		this.opening = true;
		if(p.x < this.x + p.worldX) {
			this.openDir = "right";
		}
		else {
			this.openDir = "left";
		}
	}
	/* Animation */
	if(this.r >= -84 && this.opening) {
		this.r -= 6;
	}
	/* Item spawning - give the player an item they don't already have */
	if(this.r <= -84 && !this.spawnedItem && this.opening) {
		this.spawnedItem = true;
		this.requestingItem = true;
		if(p.onScreen === "how") {
			roomInstances[inRoom].content.push(new WoodBow());
			return;
		}
		var ownsABow = false;
		for(var i = 0; i < p.invSlots.length; i ++) {
			if(p.invSlots[i].content instanceof RangedWeapon) {
				ownsABow = true;
				break;
			}
		}
		if(ownsABow) {
			//25% arrows, 25% coins, 50% random item (not arrows or coins)
			var chooser = Math.random();
			if(chooser < 0.25) {
				//give the player 6-10 arrows
				roomInstances[inRoom].content.push(new Arrow(Math.round(Math.random() * 4 + 6)));
			}
			else if(chooser <= 0.5) {
				//give the player 4-8 coins
				roomInstances[inRoom].content.push(new Coin(Math.round(Math.random() * 4 + 6)));
			}
			else {
				//give the player a random item (not coins or arrows)
				var possibleItems = [];
				for(var i = 0; i < items.length; i ++) {
					possibleItems.push(items[i]);
				}
				for(var i = 0; i < p.invSlots.length; i ++) {
					for(var j = 0; j < items.length; j ++) {
						if(p.invSlots[i].content instanceof items[j]) {
							for(var k = 0; k < possibleItems.length; k ++) {
								if(new possibleItems[k]() instanceof items[j]) {
									possibleItems.splice(k, 1);
								}
							}
						}
					}
				}
				if(possibleItems.length === 0) {
					//the player already has every item in the game, so just give them coins
					roomInstances[inRoom].content.push(new Coin(Math.round(Math.random() * 4 + 6)));
					return;
				}
				var selector = Math.floor(Math.random() * possibleItems.length);
				var theItem = possibleItems[selector];
				roomInstances[inRoom].content.push(new theItem());
			}
		}
		else {
			var chooser = Math.random();
			if(chooser <= 0.5) {
				roomInstances[inRoom].content.push(new Coin(Math.round(Math.random() * 4 + 6)));
			}
			else {
				//give the player a random item (not coins or arrows)
				var possibleItems = [];
				for(var i = 0; i < items.length; i ++) {
					possibleItems.push(items[i]);
				}
				for(var i = 0; i < p.invSlots.length; i ++) {
					for(var j = 0; j < items.length; j ++) {
						if(p.invSlots[i].content instanceof items[j]) {
							for(var k = 0; k < possibleItems.length; k ++) {
								if(new possibleItems[k]() instanceof items[j]) {
									possibleItems.splice(k, 1);
								}
							}
						}
					}
				}
				if(possibleItems.length === 0) {
					//the player already has every item in the game, so just give them coins
					roomInstances[inRoom].content.push(new Coin(Math.round(Math.random() * 4 + 6)));
					return;
				}
				var selector = Math.floor(Math.random() * possibleItems.length);
				var theItem = possibleItems[selector];
				roomInstances[inRoom].content.push(new theItem());
			}
		}
	}
};
function FallBlock(x, y) {
	this.x = x;
	this.y = y;
	this.velY = 0;
	this.origY = y;
	this.falling = false;
	this.timeShaking = 0;
	this.steppedOn = false;
	this.allDone = false;
};
FallBlock.prototype.exist = function() {
	var topLeftF = point3d(this.x + p.worldX - 20, this.y + p.worldY, 1.1);
	var topRightF = point3d(this.x + p.worldX + 20, this.y + p.worldY, 1.1);
	var bottomF = point3d(this.x + p.worldX, this.y + p.worldY + 60, 1.1);
	var topLeftB = point3d(this.x + p.worldX - 20, this.y + p.worldY, 0.9);
	var topRightB = point3d(this.x + p.worldX + 20, this.y + p.worldY, 0.9);
	var bottomB = point3d(this.x + p.worldX, this.y + p.worldY + 60, 0.9);
	c.fillStyle = "rgb(150, 150, 150)";
	var shakeX = Math.random() * (this.timeShaking * 2) - this.timeShaking;
	var shakeY = Math.random() * (this.timeShaking * 2) - this.timeShaking;
	c.save();
	c.translate(shakeX, shakeY);
	/* Top face */
	c.beginPath();
	c.moveTo(topLeftF.x, topLeftF.y);
	c.lineTo(topLeftB.x, topLeftB.y);
	c.lineTo(topRightB.x, topRightB.y);
	c.lineTo(topRightF.x, topRightF.y);
	c.fill();
	collisionLine(this.x + p.worldX - 20, this.y + p.worldY, this.x + p.worldX + 20, this.y + p.worldY, {walls: [true, false, false, false], illegalHandling: "collide"});
	/* left face */
	c.beginPath();
	c.moveTo(topLeftF.x, topLeftF.y);
	c.lineTo(topLeftB.x, topLeftB.y);
	c.lineTo(bottomB.x, bottomB.y);
	c.lineTo(bottomF.x, bottomF.y);
	c.fill();
	collisionLine(this.x + p.worldX - 20, this.y + p.worldY, this.x + p.worldX, this.y + p.worldY + 60, {walls: [true, true, true, true], illegalHandling: "collide"});
	/* right face */
	c.beginPath();
	c.moveTo(topRightF.x, topRightF.y);
	c.lineTo(topRightB.x, topRightB.y);
	c.lineTo(bottomB.x, bottomB.y);
	c.lineTo(bottomF.x, bottomF.y);
	c.fill();
	collisionLine(this.x + p.worldX + 20, this.y + p.worldY, this.x + p.worldX, this.y + p.worldY + 60, {walls: [true, true, true, true], illegalHandling: "collide"});
	/* front face */
	// c.fillStyle = "rgb(110, 110, 110)";
	// c.beginPath();
	// c.moveTo(topLeftF.x, topLeftF.y);
	// c.lineTo(topRightF.x, topRightF.y);
	// c.lineTo(bottomF.x, bottomF.y);
	// c.fill();
	boxFronts.push({
		type: "polygon",
		col: "rgb(110, 110, 110)",
		loc: [
			{
				x: + topLeftF.x + shakeX,
				y: + topLeftF.y + shakeY,
			},
			{
				x: + topRightF.x + shakeX,
				y: + topRightF.y + shakeY
			},
			{
				x: + bottomF.x + shakeX,
				y: + bottomF.y + shakeY
			}
		]
	});
	c.restore();
	if(p.x + 5 > this.x + p.worldX - 20 && p.x - 5 < this.x + p.worldX + 20 && p.y + 100 >= this.y + p.worldY && p.canJump && !this.allDone) {
		this.steppedOn = true;
	}
	if(this.steppedOn) {
		this.timeShaking += 0.05;
	}
	if(this.timeShaking > 3) {
		this.timeShaking = 0;
		this.steppedOn = false;
		this.falling = true;
		this.allDone = true;
	}
	if(this.falling) {
		this.velY += 0.1;
		this.y += this.velY;
	}
	if(p.screenOp > 0.9) {
		this.y = this.origY;
		this.velY = 0;
		this.falling = false;
		this.allDone = false;
	}
};
function Stairs(x, y, numSteps, dir) {
	this.x = x;
	this.y = y;
	this.numSteps = numSteps;//each step is 20px * 20px
	this.dir = dir;
	if(this.dir === "right") {
		this.steps = [];
		for(var x = 0; x < this.numSteps * 20; x += 20) {
			this.steps.push(new Block(x + this.x, -this.numSteps * 20 + x + this.y, 21, this.numSteps * 20 - x + 1));
		}
	}
	else {
		this.steps = [];
		for(var x = 0; x > -this.numSteps * 20; x -= 20) {
			this.steps.push(new Block(x - 20 + this.x, -this.numSteps * 20 - x + this.y, 21, this.numSteps * 20 + x + 1));
		}
	}
};
Stairs.prototype.exist = function(noGraphics) {
	tempVars.partOfAStair = true;
	if(this.dir === "right") {
		for(var i = 0; i < this.steps.length; i ++) {
			this.steps[i].exist();
		}
	}
	else {
		for(var i = 0; i < this.steps.length; i ++) {
			this.steps[i].exist();
		}
	}
	tempVars.partOfAStair = false;
};
function Altar(x, y, type) {
	this.x = x;
	this.y = y;
	this.type = type;
	this.particles = [];
};
Altar.prototype.exist = function() {
	this.update();
	this.display();
};
Altar.prototype.update = function() {
	if(p.x + 5 > this.x + p.worldX - 20 && p.x - 5 < this.x + p.worldX + 20 && p.y + 46 > this.y + p.worldY - 20 && p.y - 5 < this.y + p.worldY + 20) {
		if(this.type === "health") {
			p.health += 10;
			p.maxHealth += 10;
		}
		else if(this.type === "mana") {
			p.mana += 10;
			p.maxMana += 10;
		}
		this.splicing = true;
	}
};
Altar.prototype.display = function() {
	for(var i = 0; i < 5; i ++) {
		this.particles.push(new Particle(this.type === "health" ? "rgb(255, 0, 0)" : "rgb(0, 0, 255)", this.x + Math.random() * 40 - 20, this.y + Math.random() * 40 - 20, Math.random() * 2 - 1, Math.random() * 2 - 1, 10));
	}
	for(var i = 0; i < this.particles.length; i ++) {
		this.particles[i].exist();
		if(this.particles[i].opacity <= 0) {
			this.particles.splice(i, 1);
			continue;
		}
	}
};
function Forge(x, y) {
	this.x = x;
	this.y = y;
	this.used = false;
	this.curveArray = findPointsCircular(0, 0, 50);
	this.init = false;
	this.particles = [];
};
Forge.prototype.exist = function() {
	//initialize curved segments
	if(!this.init) {
		for(var i = 0; i < this.curveArray.length; i ++) {
			if(this.curveArray[i].y > 0) {
				this.curveArray.splice(i, 1);
				continue;
			}
		}
	}
	//main stone forge body
	cube(this.x + p.worldX - 100, this.y + p.worldY - 76, 50, 76, 0.9, 1.05);
	cube(this.x + p.worldX + 50, this.y + p.worldY - 76, 50, 76, 0.9, 1.05);
	cube(this.x + p.worldX - 51, this.y + p.worldY - 300, 102, 200, 0.9, 1.05);
	cube(this.x + p.worldX - 50, this.y + p.worldY - 60, 100, 20, 0.9, 1.05);
	cube(this.x + p.worldX - 50, this.y + p.worldY - 10, 100, 10, 0.9, 1.05);
	//curved segments
	for(var i = 0; i < this.curveArray.length - 1; i ++) {
		if(this.curveArray[i].x > 0 && this.curveArray[i + 1].x > 0) {
			line3d(this.x + p.worldX + this.curveArray[i].x + 50, this.y + p.worldY + this.curveArray[i].y - 75, this.x + p.worldX + this.curveArray[i + 1].x + 50, this.y + p.worldY + this.curveArray[i + 1].y - 75, 0.9, 1.05, "rgb(150, 150, 150)");
		}
	}
	for(var i = 0; i < this.curveArray.length - 1; i ++) {
		if(this.curveArray[i].x < 0) {
			line3d(this.x + p.worldX + this.curveArray[i].x - 50, this.y + p.worldY + this.curveArray[i].y - 75, this.x + p.worldX + this.curveArray[i + 1].x - 50, this.y + p.worldY + this.curveArray[i + 1].y - 75, 0.9, 1.05, "rgb(150, 150, 150)");
		}
	}
	line3d(this.x + p.worldX + 50, this.y + p.worldY - 75, this.x + p.worldX + 50, this.y + p.worldY - 125, 0.9, 1.05, "rgb(150, 150, 150)");
	line3d(this.x + p.worldX - 50, this.y + p.worldY - 75, this.x + p.worldX - 50, this.y + p.worldY - 125, 0.9, 1.05, "rgb(150, 150, 150)");
	boxFronts.push({type: "arc", loc: [point3d(this.x + p.worldX + 50, this.y + p.worldY - 75, 1.05).x, point3d(this.x + p.worldX + 50, this.y + p.worldY - 75, 1.05).y, 50, 1.5 * Math.PI, 2 * Math.PI], col: "rgb(110, 110, 110)"});
	boxFronts.push({type: "arc", loc: [point3d(this.x + p.worldX - 50, this.y + p.worldY - 75, 1.05).x, point3d(this.x + p.worldX - 50, this.y + p.worldY - 75, 1.05).y, 50, Math.PI, 1.5 * Math.PI], col: "rgb(110, 110, 110)"});
	//bars underneath
	for(var x = -30; x <= 30; x += 30) {
		cube(this.x + p.worldX + x - 10, this.y + p.worldY - 40, 20, 40, 0.9, 1.05);
	}
	//fire
	if(!this.used) {
		for(var i = 0; i < 5; i ++) {
			this.particles.push(new Particle("rgb(255, 128, 0)", this.x + Math.random() * 100 - 50, this.y - 10, Math.random() * 2 - 1, Math.random() * -2, 10));
			this.particles[this.particles.length - 1].z = Math.random() * 0.15 + 0.9;
		}
		for(var i = 0; i < 5; i ++) {
			this.particles.push(new Particle("rgb(255, 128, 0)", this.x + Math.random() * 100 - 50, this.y - 60, Math.random() * 2 - 1, Math.random() * -2, 10));
			this.particles[this.particles.length - 1].z = Math.random() * 0.15 + 0.9;
		}
	}
	for(var i = 0; i < this.particles.length; i ++) {
		this.particles[i].exist();
		if(this.particles[i].splicing) {
			this.particles.splice(i, 1);
			continue;
		}
	}
	//usage
	if(p.x + 5 > this.x + p.worldX - 100 && p.x - 5 < this.x + p.worldX + 100 && keys[83] && !this.used) {
		p.guiOpen = "reforge-item";
	}
};
function Pulley(x1, w1, x2, w2, y, maxHeight) {
	this.x1 = x1;
	this.y1 = y;
	this.w1 = w1;
	this.x2 = x2;
	this.y2 = y;
	this.w2 = w2;
	this.velY = 0;
	this.origY = y;
	this.maxHeight = maxHeight;
};
Pulley.prototype.exist = function() {
	/* Graphics & Hitbox */
	function platform(x, y, w) {
		new Platform(x, y, w).exist();
		cube(x + p.worldX, -100, 3, y + 100 + p.worldY, 0.9, 0.9, "rgb(150, 150, 150)", "rgb(150, 150, 150)", { noFrontExtended: true });
		cube(x + p.worldX, -100, 3, y + 100 + p.worldY, 1.1, 1.1, "rgb(150, 150, 150)", "rgb(150, 150, 150)", { noFrontExtended: true });
		cube(x + w + p.worldX, -100, 3, y + 100 + p.worldY, 0.9, 0.9, "rgb(150, 150, 150)", "rgb(150, 150, 150)", { noFrontExtended: true });
		cube(x + w + p.worldX, -100, 3, y + 100 + p.worldY, 1.1, 1.1, "rgb(150, 150, 150)", "rgb(150, 150, 150)", { noFrontExtended: true });
	};
	platform(this.x1, this.y1, this.w1);
	platform(this.x2, this.y2, this.w2);
	/* Moving */
	this.update();
};
Pulley.prototype.update = function() {
	/* Moving */
	this.steppedOn1 = false;
	this.steppedOn2 = false;
	if(p.x + 5 > this.x1 + p.worldX && p.x - 5 < this.x1 + this.w1 + p.worldX && p.canJump && this.y1 < this.origY + this.maxHeight) {
		this.velY += (this.velY < 3) ? 0.1 : 0;
		this.steppedOn1 = true;
	}
	if(p.x + 5 > this.x2 + p.worldX && p.x - 5 < this.x2 + this.w2 + p.worldX && p.canJump && this.y2 < this.origY + this.maxHeight) {
		this.velY += (this.velY > -3) ? -0.1 : 0;
		this.steppedOn2 = true;
	}
	this.y1 += this.velY;
	this.y2 -= this.velY;
	// this.y1 = Math.round(this.y1);
	// this.y2 = Math.round(this.y2);
	if(this.steppedOn1) {
		// p.y = this.y1 + p.worldY - 46;
		p.y += this.velY;
	}
	else if(this.steppedOn2) {
		// p.y = this.y2 + p.worldY - 46;
		p.y -= this.velY;
	}
	if(!this.steppedOn1 && !this.steppedOn2) {
		this.velY = 0;
	}
	if(this.y1 > this.origY + this.maxHeight) {
		this.steppedOn1 = false;
	}
	if(this.y2 > this.origY + this.maxHeight) {
		this.steppedOn2 = false;
	}
};
function Window(x, y) {
	this.x = x;
	this.y = y;
};
Window.prototype.exist = function() {
	c.save();
	var loc = point3d(this.x + p.worldX, this.y + p.worldY, 0.9);
	c.translate(loc.x, loc.y);
	c.scale(0.75, 1);
	c.fillStyle = "rgb(20, 20, 20)";
	c.beginPath();
	c.arc(0, 0, 50, Math.PI, 2 * Math.PI);
	c.fill();
	c.fillRect(-50, -1, 100, 20);
	c.strokeStyle = "rgb(150, 150, 150)";
	c.lineCap = "round";
	c.beginPath();
	c.moveTo(10, -47);
	c.lineTo(10, 17);
	c.moveTo(-10, -47);
	c.lineTo(-10, 17);
	c.stroke();
	c.beginPath();
	c.moveTo(30, -37);
	c.lineTo(30, 17);
	c.moveTo(-30, -37);
	c.lineTo(-30, 17);
	c.stroke();
	c.restore();
};
function Pillar(x, y, h) {
	this.x = x;
	this.y = y;
	this.h = h;
};
Pillar.prototype.exist = function() {
	/* Base */
	cube(this.x + p.worldX - 30, this.y + p.worldY - 20, 60, 21, 0.9, 1.1);
	cube(this.x + p.worldX - 40, this.y + p.worldY - 10, 80, 10, 0.9, 1.1);
	/* Top */
	cube(this.x + p.worldX - 41, this.y + p.worldY - this.h, 80, 12, 0.9, 1.1);
	cube(this.x + p.worldX - 30, this.y + p.worldY - this.h + 10, 60, 10, 0.9, 1.1);
	/* Pillar */
	cube(this.x + p.worldX - 20, this.y + p.worldY - this.h + 20, 40, this.h - 40, 0.95, 1.05, null, null, { noFrontExtended: true });
	/* Base collisions */
	collisionRect(this.x + p.worldX - 30, this.y + p.worldY - 20, 60, 21, {walls: [true, true, true, true], illegalHandling: "teleport"});
	collisionRect(this.x + p.worldX - 40, this.y + p.worldY - 10, 80, 10, {walls: [true, true, true, true], illegalHandling: "teleport"});
	/* Top collisions */
	collisionRect(this.x + p.worldX - 41, this.y + p.worldY - this.h, 80, 12);
	collisionRect(this.x + p.worldX - 30, this.y + p.worldY - this.h + 10, 60, 10);
};
function Statue(x, y) {
	this.x = x;
	this.y = y;
	var possibleItems = Object.create(items);
	itemLoop: for(var i = 0; i < possibleItems.length; i ++) {
		if(!(new possibleItems[i]() instanceof Weapon) || new possibleItems[i]() instanceof Arrow || new possibleItems[i]() instanceof Dagger) {
			possibleItems.splice(i, 1);
			i --;
			continue;
		}
		for(var j = 0; j < p.invSlots.length; j ++) {
			if(p.invSlots[j].content instanceof possibleItems[i]) {
				possibleItems.splice(i, 1);
				i --;
				continue itemLoop;
			}
		}
	}
	this.itemHolding = new possibleItems[Math.floor(Math.random() * (possibleItems.length - 1))]();
	// this.itemHolding = new Sword();
	this.facing = Math.random() < 0.5 ? "left" : "right";
	// this.facing = "left";
	// this.pose = "kneeling";
	this.pose = (Math.random() < 0.5) ? "standing" : "kneeling";
};
Statue.prototype.exist = function() {
	//item in hands
	if(this.itemHolding instanceof MeleeWeapon && this.pose === "standing" && !this.itemStolen) {
		if(this.facing === "left") {
			c.save();
			c.translate(this.x + p.worldX - 20, this.y + p.worldY + 72);
			c.rotate(-45 / 180 * Math.PI);
			this.itemHolding.display("attacking");
			c.restore();
		}
		else {
			c.save();
			c.translate(this.x + p.worldX + 20, this.y + p.worldY + 72);
			c.rotate(45 / 180 * Math.PI);
			this.itemHolding.display("attacking");
			c.restore();
		}
	}
	else if(this.itemHolding instanceof MeleeWeapon && this.pose === "kneeling" && !this.itemStolen) {
		if(this.facing === "left") {
			c.save();
			c.translate(this.x + p.worldX - 24, this.y + p.worldY + 52);
			// c.rotate(-45 / 180 * Math.PI);
			this.itemHolding.display("attacking");
			c.restore();
		}
		else {
			c.save();
			c.translate(this.x + p.worldX + 24, this.y + p.worldY + 52);
			// c.rotate(45 / 180 * Math.PI);
			this.itemHolding.display("attacking");
			c.restore();
		}
	}
	//pedestal
	cube(this.x + p.worldX - 60, this.y + p.worldY + 96, 120, 34, 0.95, 1.05, "rgb(110, 110, 110)", "rgb(150, 150, 150)");
	c.save();
	c.fillStyle = "rgb(125, 125, 125)";
	c.lineCap = "round";
	c.lineWidth = 10;
	c.translate(p.worldX, p.worldY);
	c.save();
	c.translate(this.x, this.y);
	c.scale(1, 1.2);
	c.beginPath();
	c.arc(0, 24, 20, 0, 2 * Math.PI);
	c.fill();
	c.restore();
	//body
	c.strokeStyle = "rgb(125, 125, 125)";
	c.beginPath();
	c.moveTo(this.x, this.y + 24);
	c.lineTo(this.x, this.y + 72);
	c.stroke();
	//legs
	if(this.pose === "standing") {
		c.beginPath();
		c.moveTo(this.x, this.y + 72);
		c.lineTo(this.x - 10, this.y + 92);
		c.moveTo(this.x, this.y + 72);
		c.lineTo(this.x + 10, this.y + 92);
		c.stroke();
	}
	else if(this.facing === "left") {
		c.beginPath();
		c.moveTo(this.x, this.y + 72);
		c.lineTo(this.x - 20, this.y + 72);
		c.lineTo(this.x - 20, this.y + 92);
		c.moveTo(this.x, this.y + 72);
		c.lineTo(this.x, this.y + 92);
		c.lineTo(this.x + 20, this.y + 92);
		c.stroke();
	}
	else if(this.facing === "right") {
		c.beginPath();
		c.moveTo(this.x, this.y + 72);
		c.lineTo(this.x + 20, this.y + 72);
		c.lineTo(this.x + 20, this.y + 92);
		c.moveTo(this.x, this.y + 72);
		c.lineTo(this.x, this.y + 92);
		c.lineTo(this.x - 20, this.y + 92);
		c.stroke();
	}
	//arms
	c.beginPath();
	c.moveTo(this.x, this.y + 52);
	c.lineTo(this.x - 20, this.y + ((this.facing === "left" && (!(this.itemHolding instanceof MeleeWeapon) || this.pose === "kneeling")) ? 52 : 72));
	c.moveTo(this.x, this.y + 52);
	c.lineTo(this.x + 20, this.y + ((this.facing === "right" && (!(this.itemHolding instanceof MeleeWeapon) || this.pose === "kneeling")) ? 52 : 72));
	c.stroke();
	c.restore();
	//ranged weapon graphics - drawn after stick figure
	if(!(this.itemHolding instanceof MeleeWeapon) && !this.itemStolen) {
		if(this.facing === "left") {
			c.save();
			c.translate(this.x + p.worldX - (this.itemHolding instanceof MagicWeapon ? 28 : 20), this.y + p.worldY + (this.itemHolding instanceof MagicWeapon ? 32 : 52));
			c.scale(-2, 2);
			// c.rotate(-45 / 180 * Math.PI);
			this.itemHolding.display("aiming");
			c.restore();
		}
		else {
			c.save();
			c.translate(this.x + p.worldX + (this.itemHolding instanceof MagicWeapon ? 28 : 20), this.y + p.worldY + (this.itemHolding instanceof MagicWeapon ? 32 : 52));
			c.scale(2, 2);
			// c.rotate(45 / 180 * Math.PI);
			this.itemHolding.display("aiming");
			c.restore();
		}
	}
	//stealing Weapons
	if(keys[83] && Math.dist(this.x + p.worldX, this.y + p.worldY, p.x, p.y) <= 100 && !this.itemStolen) {
		this.itemStolen = true;
		p.addItem(this.itemHolding);
	}
};
function TiltPlatform(x, y) {
	this.x = x;
	this.y = y;
	this.origX = x;
	this.origY = y;
	this.tilt = 0;
	this.tiltDir = 0;
	this.platX = 0;
	this.platY = 0;
	this.interact = true;
	this.dir = null;
	this.velX = 0;
	this.velY = 0;
};
TiltPlatform.prototype.exist = function() {
	var p1 = Math.rotate(-75, -10, Math.floor(this.tilt));
	var p2 = Math.rotate(75, -10, Math.floor(this.tilt));
	this.p1 = p1;
	this.p2 = p2;
	//graphics
	cube(this.origX + p.worldX - 5, this.origY + p.worldY + 10, 10, 8000, 0.99, 1.01, null, null, { noFrontExtended: true });
	if(Math.abs(this.x - this.origX) < 3 && Math.abs(this.y - this.origY) < 3) {
		this.collides = function(x, y) {
			var p1 = point3d(this.p1.x + this.x + p.worldX, this.p1.y + this.y + p.worldY, 1.1);
			var p2 = point3d(this.p2.x + this.x + p.worldX, this.p2.y + this.y + p.worldY, 1.1);
			var p3 = point3d(-this.p1.x + this.x + p.worldX, -this.p1.y + this.y + p.worldY, 1.1);
			var p4 = point3d(-this.p2.x + this.x + p.worldX, -this.p2.y + this.y + p.worldY, 1.1);
			c.beginPath();
			c.moveTo(p1.x, -800);
			c.lineTo(p2.x, -800);
			c.lineTo(p3.x, p3.y);
			c.lineTo(p4.x, p4.y);
			return c.isPointInPath(x, y);
		};
		var topL = boxFronts[boxFronts.length - 1].loc[1];
		while(this.collides(this.origX + p.worldX - 5, topL)) {
			topL ++;
		}
		var topR = boxFronts[boxFronts.length - 1].loc[1];
		while(this.collides(this.origX + p.worldX + 5, topR)) {
			topR ++;
		}
	}
	polygon3d("rgb(110, 110, 110)", "rgb(150, 150, 150)", 0.9, 1.1, [
		{
			x: p1.x + this.x + p.worldX,
			y: p1.y + this.y + p.worldY
		},
		{
			x: p2.x + this.x + p.worldX,
			y: p2.y + this.y + p.worldY
		},
		{
			x: -(p1.x) + this.x + p.worldX,
			y: -(p1.y) + this.y + p.worldY
		},
		{
			x: -(p2.x) + this.x + p.worldX,
			y: -(p2.y) + this.y + p.worldY
		}
	]);
	//hitbox
	collisionLine(p1.x + this.x + p.worldX, p1.y + this.y + p.worldY, p2.x + this.x + p.worldX, p2.y + this.y + p.worldY, {walls: [true, true, true, true], illegalHandling: "teleport"});
	if(p.x > p1.x + this.x + p.worldX && p.x < -p1.x + this.x + p.worldX && !p.canJump && p.onGroundBefore && p.velY >= 0 && Math.abs(this.x - this.origX) < 3 && Math.abs(this.y - this.origY) < 3) {
		while(!p.canJump && false) {
			p.y ++;
			collisionLine(p1.x + this.x + p.worldX, p1.y + this.y + p.worldY, p2.x + this.x + p.worldX, p2.y + this.y + p.worldY, {walls: [true, true, true, true], illegalHandling: "teleport"});
		}
	}
	//tilting
	if(p.x + 5 > this.x + p.worldX - 75 && p.x - 5 < this.x + p.worldX + 75 && p.canJump && this.interact) {
		if(p.x > this.x + p.worldX) {
			this.tiltDir += 0.2;
		}
		else {
			this.tiltDir -= 0.2;
		}
	}
	else {
		this.tiltDir *= 0.99;
	}
	this.tilt += this.tiltDir;
	while(this.tilt > 360) {
		this.tilt -= 360;
	}
	while(this.tilt < 0) {
		this.tilt += 360;
	}
	//falling
	this.y += 5;
	this.collides = function() {
		c.beginPath();
		c.moveTo(this.p1.x + this.x, this.p1.y + this.y);
		c.lineTo(this.p2.x + this.x, this.p2.y + this.y);
		c.lineTo(-this.p1.x + this.x, -this.p1.y + this.y);
		c.lineTo(-this.p2.x + this.x, -this.p2.y + this.y);
		for(var x = -5; x <= 5; x += 10) {
			if(c.isPointInPath(this.origX + x, this.origY + 10)) {
				return true;
			}
		}
		return false;
	};
	while(this.collides()) {
		this.y --;
	};
	if(this.tilt > 45 && this.tilt < 90 && this.x < this.origX + 10) {
		this.velX += 0.1;
	}
	if(this.tilt < 315 && this.tilt > 270 && this.x > this.origX - 10) {
		this.velX -= 0.1;
	}
	if(this.y - this.origY > 800) {
		this.x = -8000; // move offscreen
	}
	this.x += this.velX;
	p.onGroundBefore = p.canJump;
};
function Bridge(x, y) {
	this.x = x;
	this.y = y;
	this.init = false;
	this.topArch = circularPointsTopHalf(0, 0, 500);
	this.lowArch = circularPointsTopHalf(0, 0, 75);
	this.smallArch = circularPointsTopHalf(0, 0, 50);
};
Bridge.prototype.exist = function() {
	if(!this.init) {
		//generate 3d arches - top
		var topB = [];
		var topF = [];
		for(var i = 0; i < this.topArch.length; i ++) {
			topB.push({
				x: this.topArch[i].x * 0.9,
				y: this.topArch[i].y * 0.9
			});
			topF.push({
				x: this.topArch[i].x * 1.1,
				y: this.topArch[i].y * 1.1
			});
		}
		this.topB = topB;
		this.topF = topF;
		//generate 3d arches - bottom
		var lowB = [];
		var lowF = [];
		for(var i = 0; i < this.lowArch.length; i ++) {
			lowB.push({
				x: this.lowArch[i].x * 0.9,
				y: this.lowArch[i].y * 0.9
			});
			lowF.push({
				x: this.lowArch[i].x * 1.1,
				y: this.lowArch[i].y * 1.1
			});
		}
		lowB.push({x: 75 * 0.9, y: -20});
		lowF.push({x: 75 * 1.1, y: -20});
		this.lowB = lowB;
		this.lowF = lowF;
		//generate 3d arches - small left arch
		var smallB = [];
		var smallF = [];
		for(var i = 0; i < this.smallArch.length; i ++) {
			smallB.push({
				x: this.smallArch[i].x * 0.9,
				y: this.smallArch[i].y * 0.9
			});
			smallF.push({
				x: this.smallArch[i].x * 1.1,
				y: this.smallArch[i].y * 1.1
			});
		}
		this.smallB = smallB;
		this.smallF = smallF;
		this.init = true;
	}
	//graphics - top arches
	var topB = point3d(this.x + p.worldX, this.y + p.worldY + 500, 0.9);
	var topF = point3d(this.x + p.worldX, this.y + p.worldY + 500, 1.1);
	for(var i = this.topArch.length / 36 + 1; i < this.topArch.length; i += (this.topArch.length / 36)) {
		var index = Math.floor(i);
		c.fillStyle = "rgb(150, 150, 150)";
		c.strokeStyle = "rgb(150, 150, 150)";
		c.lineWidth = 2;
		c.beginPath();
		c.moveTo(topB.x + this.topB[index].x, topB.y + this.topB[index].y);
		c.lineTo(topF.x + this.topF[index].x, topF.y + this.topF[index].y);
		c.lineTo(topF.x + this.topF[index - Math.floor(this.topArch.length / 36)].x, topF.y + this.topF[index - Math.floor(this.topArch.length / 36)].y);
		c.lineTo(topB.x + this.topB[index - Math.floor(this.topArch.length / 36)].x, topB.y + this.topB[index - Math.floor(this.topArch.length / 36)].y);
		c.fill();
		c.stroke();
	}
	c.fillStyle = "rgb(110, 110, 110)";
	c.beginPath();
	c.arc(topF.x, topF.y, 550, 0, 2 * Math.PI);
	c.fill();
	//graphics - lower middle arch
	var lowB = point3d(this.x + p.worldX, this.y + p.worldY + 200, 0.9);
	var lowF = point3d(this.x + p.worldX, this.y + p.worldY + 200, 1.1);
	c.fillStyle = "rgb(150, 150, 150)";
	for(var i = this.lowArch.length / 18; i < this.lowArch.length; i += this.lowArch.length / 18) {
		c.beginPath();
		c.moveTo(lowB.x + this.lowB[Math.floor(i)].x, lowB.y + this.lowB[Math.floor(i)].y);
		c.lineTo(lowF.x + this.lowF[Math.floor(i)].x, lowF.y + this.lowF[Math.floor(i)].y);
		c.lineTo(lowF.x + this.lowF[Math.floor(i - this.lowArch.length / 18)].x, lowF.y + this.lowF[Math.floor(i - this.lowArch.length / 18)].y);
		c.lineTo(lowB.x + this.lowB[Math.floor(i - this.lowArch.length / 18)].x, lowB.y + this.lowB[Math.floor(i - this.lowArch.length / 18)].y);
		c.fill();
	}
	c.beginPath();
	c.moveTo(lowF.x + this.lowF[0].x, lowF.y + this.lowF[0].y);
	c.lineTo(lowB.x + this.lowB[0].x, lowB.y + this.lowB[0].y);
	c.lineTo(lowB.x + this.lowB[0].x, 800);
	c.lineTo(lowF.x + this.lowF[0].x, 800);
	c.fill();
	c.beginPath();
	c.moveTo(lowF.x + this.lowF[this.lowF.length - 1].x, lowF.y + this.lowF[this.lowF.length - 1].y);
	c.lineTo(lowB.x + this.lowB[this.lowB.length - 1].x, lowB.y + this.lowB[this.lowB.length - 1].y);
	c.lineTo(lowB.x + this.lowB[this.lowB.length - 1].x, 800);
	c.lineTo(lowF.x + this.lowF[this.lowF.length - 1].x, 800);
	c.fill();
	c.fillStyle = "rgb(255, 0, 0)";
	c.beginPath();

	var archCutout = c.createRadialGradient(lowF.x, lowF.y, 83, lowF.x, lowF.y, 84);
	archCutout.addColorStop(0, "rgba(110, 110, 110, 0)");
	archCutout.addColorStop(1, "rgb(110, 110, 110)");
	c.fillStyle = archCutout;
	c.moveTo(lowF.x - 100, lowF.y - 200);
	c.lineTo(lowF.x - 200, lowF.y);
	c.lineTo(lowF.x - 200, 800);
	c.lineTo(lowF.x - 83, 800);
	c.lineTo(lowF.x - 83, lowF.y);
	c.lineTo(lowF.x + 83, lowF.y);
	c.lineTo(lowF.x + 83, 800);
	c.lineTo(lowF.x + 200, 800);
	c.lineTo(lowF.x + 200, lowF.y);
	c.lineTo(lowF.x + 100, lowF.y - 200);
	c.fill();
	//graphics - side arches
	for(var x = -200; x <= 200; x += 400) {
		//curved arch section
		var lowB = point3d(this.x + p.worldX + x, this.y + p.worldY + 250, 0.9);
		var lowF = point3d(this.x + p.worldX + x, this.y + p.worldY + 250, 1.1);
		c.fillStyle = "rgb(150, 150, 150)";
		for(var j = this.smallB.length / 18; j < this.smallB.length; j += this.smallB.length / 18) {
			c.beginPath();
			c.moveTo(lowB.x + this.smallB[Math.floor(j)].x, lowB.y + this.smallB[Math.floor(j)].y);
			c.lineTo(lowB.x + this.smallB[Math.floor(j - this.smallB.length / 18)].x, lowB.y + this.smallB[Math.floor(j - this.smallB.length / 18)].y);
			c.lineTo(lowF.x + this.smallF[Math.floor(j - this.smallB.length / 18)].x, lowF.y + this.smallF[Math.floor(j - this.smallB.length / 18)].y);
			c.lineTo(lowF.x + this.smallF[Math.floor(j)].x, lowF.y + this.smallF[Math.floor(j)].y);
			c.fill();
		}
		//straight arch section
		c.beginPath();
		c.moveTo(lowF.x + this.smallF[0].x, lowF.y + this.smallF[0].y);
		c.lineTo(lowB.x + this.smallB[0].x, lowB.y + this.smallB[0].y);
		c.lineTo(lowB.x + this.smallB[0].x, 800);
		c.lineTo(lowF.x + this.smallF[0].x, 800);
		c.fill();
		c.beginPath();
		c.moveTo(lowF.x + this.smallF[this.smallF.length - 1].x, lowF.y + this.smallF[this.smallF.length - 1].y);
		c.lineTo(lowB.x + this.smallB[this.smallB.length - 1].x, lowB.y + this.smallB[this.smallB.length - 1].y);
		c.lineTo(lowB.x + this.smallB[this.smallB.length - 1].x, 800);
		c.lineTo(lowF.x + this.smallF[this.smallF.length - 1].x, 800);
		c.fill();
		//remove stuff for perspective
		var archCutout = c.createRadialGradient(lowF.x, lowF.y, 55, lowF.x, lowF.y, 56);
		archCutout.addColorStop(0, "rgba(110, 110, 110, 0)");
		archCutout.addColorStop(1, "rgb(110, 110, 110)");
		c.fillStyle = archCutout;
		c.beginPath();
		c.moveTo(lowF.x - 50, lowF.y - 200);
		c.lineTo(lowF.x - 140, lowF.y - 100);
		c.lineTo(lowF.x - 140, 800);
		c.lineTo(lowF.x - 55, 800);
		c.lineTo(lowF.x - 55, lowF.y);
		c.lineTo(lowF.x + 55, lowF.y);
		c.lineTo(lowF.x + 55, 800);
		c.lineTo(lowF.x + 140, 800);
		c.lineTo(lowF.x + 140, lowF.y - 100);
		c.lineTo(lowF.x + 50, lowF.y - 200);
		c.fill();
	}
	//graphics - central arch outlines
	var lowF = point3d(this.x + p.worldX, this.y + p.worldY + 200, 1.1);
	c.strokeStyle = "rgb(150, 150, 150)";
	c.lineWidth = 1;
	c.beginPath();
	c.moveTo(lowF.x + 79, lowF.y - 20);
	c.lineTo(lowF.x + 80, 800);
	c.moveTo(lowF.x - 79, lowF.y - 20);
	c.lineTo(lowF.x - 80, 800);
	c.stroke();
	//hitbox
	collisions.push(new CollisionCircle(this.x, this.y + 500, 500));
	// while(Math.distSq(p.x + 5, p.y + 46, this.x + p.worldX, this.y + p.worldY + 500) < 250000 || Math.distSq(p.x - 5, p.y + 46, this.x + p.worldX, this.y + p.worldY + 500) < 250000) {
	// 	p.y --;
	// 	p.canJump = true;
	// 	p.velY = (p.velY > 3) ? 3 : p.velY;
	// }
	// for(var i = 0; i < roomInstances[theRoom].content.length; i ++) {
	// 	if(roomInstances[theRoom].content[i] instanceof Enemy) {
	// 		while(Math.distSq(this.x, this.y + 500, roomInstances[theRoom].content[i].x + roomInstances[theRoom].content[i].leftX, roomInstances[theRoom].content[i].y + roomInstances[theRoom].content[i].bottomY) < 250000 || Math.distSq(this.x, this.y + 500, roomInstances[theRoom].content[i].x + roomInstances[theRoom].content[i].rightX, roomInstances[theRoom].content[i].y + roomInstances[theRoom].content[i].bottomY) < 250000) {
	// 			roomInstances[theRoom].content[i].y --;
	// 			roomInstances[theRoom].content[i].velY = (roomInstances[theRoom].content[i].velY > 3) ? 3 : roomInstances[theRoom].content[i].velY;
	// 			if(roomInstances[theRoom].content[i] instanceof Bat && roomInstances[theRoom].content[i].timePurified > 0) {
	// 				roomInstances[theRoom].content[i].dest = {x: roomInstances[theRoom].content[i].x + (Math.random() * 200 - 100), y: roomInstances[theRoom].content[i].y + (Math.random() * 200 - 100)};
	// 				roomInstances[theRoom].content[i].velY = 0;
	// 			}
	// 		}
	// 	}
	// }
};
function BookShelf(x, y) {
	this.x = x;
	this.y = y;
	this.books = [];
	for(var i = 1; i <= 4; i ++) {
		this.books.push({
			x: Math.random() * 160,
			y: i * 50,
			color: Math.random() < 0.5 ? (Math.random() < 0.5 ? "rgb(255, 255, 0)" : "rgb(255, 0, 0)") : (Math.random() < 0.5 ? "rgb(0, 0, 255)" : "rgb(0, 128, 0)")
		});
	}
};
BookShelf.prototype.exist = function() {
	//graphics
	for(var y = this.y; y >= this.y - 200; y -= 50) {
		cube(this.x + p.worldX - 100, y + p.worldY - 10, 200, 10, 0.9, 1, "rgb(139, 69, 19)", "rgb(159, 89, 39)");
		collisionRect(this.x + p.worldX - 100, y + p.worldY - 10, 200, 10, {walls: [true, false, false, false]});
	}
	for(var i = 0; i < this.books.length; i ++) {
		break;
		cube(this.books[i].x + this.x + p.worldX - 80, this.y + p.worldY - this.books[i].y, 10, 40, 0.9, 1, this.books[i].color, this.books[i].color);
	}
	cube(this.x + p.worldX - 100, this.y + p.worldY - 210, 10, 210, 0.9, 1, "rgb(139, 69, 19)", "rgb(159, 89, 39)");
	cube(this.x + p.worldX + 90, this.y + p.worldY - 210, 10, 210, 0.9, 1, "rgb(139, 69, 19)", "rgb(159, 89, 39)");
};
function Chandelier(x, y) {
	this.x = x;
	this.y = y;
	this.points = [];
	var pts = findPointsCircular(0, 0, 100);
	for(var i = 0; i < pts.length; i ++) {
		var point = pts[i];
		this.points.push({
			x: this.x + point.x,
			y: this.y,
			z: 1 + ((point.y < 0) ? (point.y / 500) : (point.y / 300))
		});
	}
	this.particles = [];
};
Chandelier.prototype.exist = function() {
	//this function breaks the graphics into multiple sub-functions so that they can be called in different orders depending on perspective.
	this.topDisc = function() {
		c.fillStyle = "rgb(110, 110, 110)";
		c.beginPath();
		for(var i = 0; i < this.points.length; i ++) {
			var point = point3d(this.points[i].x + p.worldX, this.points[i].y + p.worldY, this.points[i].z);
			if(i === 0) {
				c.moveTo(point.x, point.y);
			}
			else {
				c.lineTo(point.x, point.y);
			}
		}
		c.fill();
	};
	this.middleDisc = function() {
		c.fillStyle = "rgb(150, 150, 150)";
		for(var offset = 0; offset < 20; offset ++) {
			c.beginPath();
			for(var j = 0; j < this.points.length; j ++) {
				var point = point3d(this.points[j].x + p.worldX, this.points[j].y + p.worldY, this.points[j].z);
				if(j === 0) {
					c.moveTo(point.x, point.y + offset);
				}
				else {
					c.lineTo(point.x, point.y + offset);
				}
			}
			c.fill();
		}
	};
	this.lowDisc = function() {
		c.save();
		c.translate(0, 20);
		this.topDisc();
		c.restore();
	};
	this.cords = function() {
		var indexes = [];
		while(indexes.length < 12) {
			var lowestIndex = this.points.length / 2;
			for(var i = 0; i < this.points.length - 10; i += Math.floor(this.points.length / 12)) {
				if(this.points[i].z < this.points[lowestIndex].z) {
					var alreadyDone = false;
					for(var j = 0; j < indexes.length; j ++) {
						if(indexes[j].index === i) {
							alreadyDone = true;
							break;
						}
					}
					if(!alreadyDone) {
						lowestIndex = i;
					}
				}
			}
			if(lowestIndex % Math.floor(this.points.length / 6) > 100 || lowestIndex === 0 | lowestIndex % Math.floor(this.points.length / 6) < 5) {
				indexes.push({ index: lowestIndex, type: "torch", z: this.points[lowestIndex].z});
			}
			else {
				indexes.push({ index: lowestIndex, type: "cord", z: this.points[lowestIndex].z});
			}
		}
		for(var i = 0; i < indexes.length; i ++) {
			if(indexes[i].type === "cord") {
				var edge = point3d(this.points[indexes[i].index].x + p.worldX, this.points[indexes[i].index].y + p.worldY, this.points[indexes[i].index].z);
				c.strokeStyle = "rgb(139, 69, 19)";
				c.beginPath();
				c.moveTo(this.x + p.worldX, this.y + p.worldY - 600);
				c.lineTo(edge.x, edge.y);
				c.stroke();
			}
			else {
				cube(p.worldX + this.points[indexes[i].index].x - 5, p.worldY + this.points[indexes[i].index].y - 10, 10, 10, this.points[indexes[i].index].z - 0.01, this.points[indexes[i].index].z + 0.01, null, null);
				this.particles.push(new Particle("rgb(255, 128, 0)", this.points[indexes[i].index].x, this.points[indexes[i].index].y - 10, Math.random() * 2 - 1, Math.random() * -2, 5));
				this.particles[this.particles.length - 1].z = this.points[indexes[i].index].z;
			}
		}
		for(var i = 0; i < this.particles.length; i ++) {
			this.particles[i].exist();
			if(this.particles[i].splicing) {
				this.particles.splice(i, 1);
				continue;
			}
		}
		c.beginPath();
		c.moveTo(this.x + p.worldX, this.y + p.worldY - 600);
		c.lineTo(this.x + p.worldX, 0);
		c.stroke();
		c.beginPath();
		c.moveTo(this.x + p.worldX - 72, this.y + p.worldY - 150);
		c.lineTo(this.x + p.worldX + 72, this.y + p.worldY - 150);
		c.stroke();
		c.beginPath();
		c.moveTo(this.x + p.worldX - 54, this.y + p.worldY - 300);
		c.lineTo(this.x + p.worldX + 54, this.y + p.worldY - 300);
		c.stroke();
		collisionRect(this.x + p.worldX - 72, this.y + p.worldY - 150, 144, 3, {walls: [true, false, false, false]});
		collisionRect(this.x + p.worldX - 54, this.y + p.worldY - 300, 108, 3, {walls: [true, false, false, false]});
	};
	if(this.y + p.worldY < 400) {
		this.cords();
		this.topDisc();
		this.middleDisc();
		this.lowDisc();
	}
	else {
		this.lowDisc();
		this.middleDisc();
		this.topDisc();
		this.cords();
	}
	collisionRect(this.x + p.worldX - 100, this.y + p.worldY, 200, 20);
};
function Table(x, y) {
	this.x = x;
	this.y = y;
};
Table.prototype.exist = function() {
	cube(this.x + p.worldX - 50, this.y + p.worldY - 40, 10, 40, 0.9, 0.92, "rgb(139, 69, 19)", "rgb(159, 89, 39)", {noFrontExtended: true} );
	cube(this.x + p.worldX - 50, this.y + p.worldY - 40, 10, 40, 0.98, 1, "rgb(139, 69, 19)", "rgb(159, 89, 39)");
	cube(this.x + p.worldX + 40, this.y + p.worldY - 40, 10, 40, 0.9, 0.92, "rgb(139, 69, 19)", "rgb(159, 89, 39)", {noFrontExtended: true} );
	cube(this.x + p.worldX + 40, this.y + p.worldY - 40, 10, 40, 0.98, 1, "rgb(139, 69, 19)", "rgb(159, 89, 39)");
	cube(this.x + p.worldX - 50, this.y + p.worldY - 40, 100, 10, 0.9, 1, "rgb(139, 69, 19)", "rgb(159, 89, 39)");
};
function Chair(x, y, dir) {
	this.x = x;
	this.y = y;
	this.dir = dir;
};
Chair.prototype.exist = function() {
	cube(this.x + p.worldX - 25, this.y + p.worldY - 30, 10, 30, 0.98, 1, "rgb(139, 69, 19)", "rgb(159, 89, 39)");
	cube(this.x + p.worldX + 15, this.y + p.worldY - 30, 10, 30, 0.98, 1, "rgb(139, 69, 19)", "rgb(159, 89, 39)");
	cube(this.x + p.worldX - 25, this.y + p.worldY - 30, 10, 30, 0.9, 0.92, "rgb(139, 69, 19)", "rgb(159, 89, 39)", {noFrontExtended: true} );
	cube(this.x + p.worldX + 15, this.y + p.worldY - 30, 10, 30, 0.9, 0.92, "rgb(139, 69, 19)", "rgb(159, 89, 39)", {noFrontExtended: true} );
	cube(this.x + p.worldX - 25, this.y + p.worldY - 30, 50, 10, 0.9, 1, "rgb(139, 69, 19)", "rgb(159, 89, 39)");
	cube(this.x + p.worldX + ((this.dir === "right") ? -25 : 15), this.y + p.worldY - 60, 10, 35, 0.9, 1, "rgb(139, 69, 19)", "rgb(159, 89, 39)");
};
function SpikeBall(x, y, dir) {
	this.x = x;
	this.y = y;
	this.dir = dir;
	this.velX = 0;
	this.velY = 0;
};
SpikeBall.prototype.exist = function() {
	c.fillStyle = "rgb(60, 60, 60)";
	c.strokeStyle = "rgb(60, 60, 60)";
	//graphics - chain
	if(Math.distSq(this.x + p.worldX, this.y + p.worldY, p.x + 20, p.y + 26) > 400) {
		var line = findPointsLinear(this.x + p.worldX, this.y + p.worldY, p.x + 20, p.y + 26);
		var interval = 0;
		var lastAction;
		while(Math.distSq(line[0].x, line[0].y, line[interval].x, line[interval].y) < 64 || Math.distSq(line[0].x, line[0].y, line[interval].x, line[interval].y) > 144) {
			if(Math.distSq(line[0].x, line[0].y, line[interval].x, line[interval].y) < 64) {
				interval ++;
				if(lastAction === "subtract") {
					break;
				}
				lastAction = "add";
			}
			else {
				interval --;
				if(lastAction === "add") {
					break;
				}
				lastAction = "subtract";
			}
		}
		if(interval < 1) {
			interval = 1;
		}
		c.save();
		c.lineWidth = 1;
		for(var i = 0; i < line.length; i += interval) {
			c.beginPath();
			c.arc(line[Math.floor(i)].x, line[Math.floor(i)].y, 5, 0, 2 * Math.PI);
			c.stroke();
		}
		c.restore();
	}
	//graphics - spikeball
	c.save();
	c.translate(this.x + p.worldX, this.y + p.worldY);
	c.beginPath();
	c.arc(0, 0, 10, 0, 2 * Math.PI);
	c.fill();
	for(var r = 0; r < 360; r += (360 / 6)) {
		c.save();
		c.rotate(Math.rad(r + (this.x + this.y)));
		c.beginPath();
		c.moveTo(-5, 0);
		c.lineTo(5, 0);
		c.lineTo(0, -20);
		c.fill();
		c.restore();
	}
	c.restore();
	//movement
	this.x += this.velX;
	this.y += this.velY;
	// this.velX += (this.dir === "right") ? 0.01 : -0.01;
	this.velY += 0.01;
	if(Math.dist(this.x + p.worldX, this.y + p.worldY, p.x, p.y) > 100) {
		if(Math.abs((this.x + p.worldX) - p.x) < Math.abs((this.y + p.worldY) - p.y)) {
			if(this.y + p.worldY > p.y) {
				this.velY = -1;
			}
			else {
				this.velY = 1;
			}
		}
		else {
			if(this.x + p.worldX > p.x) {
				this.velX = -1;
			}
			else {
				this.velX = 1;
			}
		}
	}
};
function Decoration(x, y) {
	this.x = x;
	this.y = y;
	this.type = null;
};
Decoration.prototype.exist = function() {
	if(this.type === null) {
		//find self in the current room
		var selfIndex = null;
		for(var i = 0; i < roomInstances[theRoom].content.length; i ++) {
			if(roomInstances[theRoom].content[i] instanceof Decoration) {
				selfIndex = i;
				break;
			}
		}
		//find other decorations to copy
		var resolved = false;
		for(var i = 0; i < roomInstances[theRoom].content.length; i ++) {
			if(roomInstances[theRoom].content[i] instanceof Torch) {
				roomInstances[inRoom].content[selfIndex] = new Torch(this.x, this.y, roomInstances[theRoom].content[i].color);
				roomInstances[inRoom].content[selfIndex].lit = true;
				resolved = true;
				break;
			}
			else if(roomInstances[theRoom].content[i] instanceof Banner) {
				roomInstances[inRoom].content[selfIndex] = new Banner(this.x, this.y - 30, roomInstances[theRoom].content[i].color);
				resolved = true;
				break;
			}
			else if(roomInstances[theRoom].content[i] instanceof GlassWindow) {
				roomInstances[inRoom].content[selfIndex] = new GlassWindow(this.x, this.y, roomInstances[theRoom].content[i].color);
				resolved = true;
				break;
			}
		}
		//randomize decoration if none other to mimic
		if(!resolved) {
			var chooser = Math.random();
			if(chooser < 0.33) {
				roomInstances[theRoom].content[selfIndex] = new Torch(this.x, this.y);
				roomInstances[theRoom].content[selfIndex].lit = true;
			}
			else if(chooser < 0.66) {
				roomInstances[theRoom].content[selfIndex] = new Banner(this.x, this.y - 30);
			}
			else {
				roomInstances[theRoom].content[selfIndex] = new GlassWindow(this.x, this.y, roomInstances[theRoom].colorScheme);
			}
		}
	}
};
function Banner(x, y, color) {
	this.x = x;
	this.y = y;
	this.color = color;
};
Banner.prototype.exist = function() {
	if(this.color === undefined || this.color === "?") {
		for(var i = 0; i < roomInstances[theRoom].content.length; i ++) {
			if(roomInstances[theRoom].content[i] instanceof Banner && roomInstances[theRoom].content[i].color !== undefined && roomInstances[theRoom].content[i].color !== "?") {
				this.color = roomInstances[theRoom].content[i].color;
				break;
			}
		}
		if(this.color === undefined || this.color === "?") {
			// var chooser = Math.random();
			// if(chooser < 0.33) {
			// 	this.color = "rgb(128, 0, 0)";
			// }
			// else if(chooser < 0.66) {
			// 	this.color = "rgb(0, 0, 128)";
			// }
			// else {
			// 	this.color = "rgb(0, 128, 0)";
			// }
			if(roomInstances[theRoom].colorScheme === "red") {
				this.color = "rgb(128, 0, 0)";
			}
			else if(roomInstances[theRoom].colorScheme === "blue") {
				this.color = "rgb(0, 0, 128)";
			}
			else {
				this.color = "rgb(0, 128, 0)";
			}
		}
	}
	c.fillStyle = this.color;
	var p1 = point3d(this.x + p.worldX - 40, this.y + p.worldY - 95, 0.91);
	var p2 = point3d(this.x + p.worldX - 40, this.y + p.worldY, 0.9);
	var p3 = point3d(this.x + p.worldX, this.y + p.worldY - 10, 0.9);
	var p4 = point3d(this.x + p.worldX + 40, this.y + p.worldY, 0.9);
	var p5 = point3d(this.x + p.worldX + 40, this.y + p.worldY - 95, 0.9);
	c.beginPath();
	c.moveTo(p1.x, p1.y);
	c.lineTo(p2.x, p2.y);
	c.lineTo(p3.x, p3.y);
	c.lineTo(p4.x, p4.y);
	c.lineTo(p5.x, p5.y);
	c.fill();
	cube(this.x + p.worldX - 50, this.y + p.worldY - 100, 100, 10, 0.9, 0.92, "rgb(139, 69, 19)", "rgb(159, 89, 39)", { noFrontExtended: true });
};
function GlassWindow(x, y, color) {
	this.x = x;
	this.y = y;
	this.color = color;
};
GlassWindow.prototype.exist = function() {
	roomInstances[theRoom].background = "plain";
	c.save();
	var center = point3d(this.x + p.worldX, this.y + p.worldY, 0.9);
	//delete bricks behind window
	c.beginPath();
	c.rect(center.x - 25, center.y - 100, 50, 100);
	c.arc(center.x, center.y - 100, 25, 0, 2 * Math.PI);
	c.clip();
	c.fillStyle = "rgb(100, 100, 100)";
	c.fillRect(0, 0, 800, 800);
	//background
	cube(this.x + p.worldX - 40, this.y + p.worldY - 200, 20, 190, 0.72, 0.78, null, null, { noFrontExtended: true });
	cube(this.x + p.worldX + 20, this.y + p.worldY - 200, 20, 190, 0.72, 0.78, null, null, { noFrontExtended: true });
	cube(this.x + p.worldX - 200, this.y + p.worldY - 10, 400, 100, 0.7, 0.8, null, null, { noFrontExtended: true });
	cube(this.x + p.worldX - 40, this.y + p.worldY - 200, 20, 190, 0.78, 0.78, null, null, { noFrontExtended: true });
	cube(this.x + p.worldX + 20, this.y + p.worldY - 200, 20, 190, 0.78, 0.78, null, null, { noFrontExtended: true });
	//cross patterns
	if(this.color === "red") {
		c.strokeStyle = "rgb(200, 50, 0)";
	}
	else if(this.color === "green") {
		c.strokeStyle = "rgb(25, 128, 25)";
	}
	else if(this.color === "blue") {
		c.strokeStyle = "rgb(0, 0, 100)";
	}
	c.lineWidth = 1;
	for(var y = -150; y < 0; y += 10) {
		c.beginPath();
		c.moveTo(center.x - 25, center.y + y);
		c.lineTo(center.x + 25, center.y + y + 50);
		c.moveTo(center.x + 25, center.y + y);
		c.lineTo(center.x - 25, center.y + y + 50);
		c.stroke();
	}
	//window
	c.lineWidth = 4;
	c.strokeStyle = "rgb(50, 50, 50)";
	if(this.color === "red") {
		c.fillStyle = "rgba(255, 20, 0, 0.5)";
	}
	else if(this.color === "green") {
		c.fillStyle = "rgba(0, 128, 20, 0.5)";
	}
	else if(this.color === "blue") {
		c.fillStyle = "rgba(0, 0, 128, 0.5)";
	}
	c.fillRect(center.x - 25, center.y - 100, 50, 100);
	c.strokeRect(center.x - 25, center.y - 100, 50, 100);
	c.beginPath();
	c.arc(center.x, center.y - 100, 25, Math.PI, 2 * Math.PI);
	c.fill();
	c.stroke();
	c.restore();
};
function Roof(x, y, w) {
	this.x = x;
	this.y = y;
	this.w = w;
	this.type = null;
};
Roof.prototype.exist = function() {
	if(this.type === null) {
		var chooser = Math.random();
		if(hax) {
			chooser = 1;
		}
		if(chooser < 0.25) {
			this.type = "none";
		}
		else if(chooser < 0.5) {
			this.type = "flat";
		}
		else if(chooser < 0.75) {
			this.type = "sloped";
		}
		else {
			this.type = "curved";
		}
	}
	if(this.type === "flat") {
		cube(-100, this.y + p.worldY - 1100, 1000, 1000, 0.9, 1.1);
		collisionRect(-100, this.y + p.worldY - 1100, 1000, 1000);
	}
	else if(this.type === "sloped") {
		polygon3d("rgb(110, 110, 110)", "rgb(150, 150, 150)", 0.9, 1.1, [
			{
				x: -100,
				y: -100
			},
			{
				x: -100,
				y: this.y + p.worldY
			},
			{
				x: this.x + p.worldX - this.w,
				y: this.y + p.worldY
			},
			{
				x: this.x + p.worldX - (this.w / 3),
				y: this.y + p.worldY - 100
			},
			{
				x: this.x + p.worldX + (this.w / 3),
				y: this.y + p.worldY - 100
			},
			{
				x: this.x + p.worldX + this.w,
				y: this.y + p.worldY
			},
			{
				x: 900,
				y: this.y + p.worldY - 100
			},
			{
				x: 900,
				y: -100
			}
		]);
		collisionLine(this.x + p.worldX - this.w, this.y + p.worldY, this.x + p.worldX - (this.w / 3), this.y + p.worldY - 100);
		collisionLine(this.x + p.worldX + this.w, this.y + p.worldY, this.x + p.worldX + (this.w / 3), this.y + p.worldY - 100);
		collisionRect(this.x + p.worldX - this.w, this.y + p.worldY - 200, 2 * this.w, 100);
	}
	else if(this.type === "curved") {
		if(this.points === undefined) {
			this.points = circularPointsTopHalf(0, 0, this.w);
			for(var i = 0; i < this.points.length; i += 1) {
				this.points[i].y /= 2;
				this.points[i].x += this.x;
				this.points[i].y += this.y;
			}
		}
		var array = [];
		for(var i = 0; i < this.points.length; i += (this.points.length / 36)) {
			array.push({x: this.points[Math.floor(i)].x + p.worldX, y: this.points[Math.floor(i)].y + p.worldY});
		}
		for(var i = 1; i < array.length; i ++) {
			collisionLine(array[i].x, array[i].y, array[i - 1].x, array[i - 1].y);
		}
		array.splice(0, 0, {x: -100, y: -100}, {x: -100, y: this.y + p.worldY}, {x: this.x + p.worldX - this.w, y: this.y + p.worldY});
		array.push({x: this.x + p.worldX + this.w, y: this.y + p.worldY});
		array.push({x: 900, y: this.y + p.worldY});
		array.push({x: 900, y: -100});
		polygon3d("rgb(110, 110, 110)", "rgb(150, 150, 150)", 0.9, 1.1, array);
		while(Math.distSq(p.x + p.worldX, this.y - (this.y - (p.y + p.worldY - 7)) / 2, this.x, this.y) > (this.w / 2) * (this.w / 2) && p.y - 7 < this.y) {
			p.y ++;
		}
	}
};
function Fountain(x, y) {
	this.x = x;
	this.y = y;
	this.waterAnimations = [];
};
Fountain.prototype.exist = function() {
	//water slot
	cube(this.x + p.worldX - 50, this.y + p.worldY - 270, 100, 100, 0.8, 0.9, "rgb(100, 100, 100)", "rgba(100, 100, 100, 0)", { noFrontExtended: true, sideColors: { bottom: "rgb(150, 150, 150"}});
	cube(this.x + p.worldX - 50 - 50, this.y + p.worldY - 170, 50, 40, 0.8, 0.9, "rgb(100, 100, 100)", "rgba(100, 100, 100, 0)", { noFrontExtended: true, sideColors: { right: "rgb(150, 150, 150"}});
	cube(this.x + p.worldX + 50, this.y + p.worldY - 170, 50, 40, 0.8, 0.9, "rgb(100, 100, 100)", "rgba(100, 100, 100, 0)", { noFrontExtended: true, sideColors: { left: "rgb(150, 150, 150"}});
	cube(this.x + p.worldX - 50, this.y + p.worldY - 140, 100, 80, 0.8, 0.92, "rgb(100, 100, 100)", "rgba(100, 100, 100, 0)", { noFrontExtended: true, sideColors: { top: "rgb(150, 150, 150"}});
	cube(this.x + p.worldX - 50, this.y + p.worldY - 150, 100, 10, 0.8, 0.92, "rgb(100, 100, 255)", "rgb(100, 100, 255)", { noFrontExtended: true });
	cube(this.x + p.worldX - 100, this.y + p.worldY - 270, 200, 100, 0.9, 0.9, "rgb(100, 100, 100)", "rgba(100, 100, 100, 0)", { noFrontExtended: true });
	//water
	cube(this.x + p.worldX - 50, this.y + p.worldY - 150, 100, 150, 0.9, 0.92, "rgba(100, 100, 255, 0)", "rgb(100, 100, 255)", { noFrontExtended: true });
	for(var i = 0; i < this.waterAnimations.length; i ++) {
		var topY = this.waterAnimations[i].y;
		var bottomY = this.waterAnimations[i].y + 50;
		if(this.waterAnimations[i].y < 50) {
			//all on horizontal section of waterfall
			var p1 = point3d(this.x + p.worldX + this.waterAnimations[i].x, this.y + p.worldY - 150, Math.map(topY, 0, 100, 0.8, 0.92));
			var p2 = point3d(this.x + p.worldX + this.waterAnimations[i].x, this.y + p.worldY - 150, Math.map(bottomY, 0, 100, 0.8, 0.92));
			c.strokeStyle = "rgb(120, 120, 255)";
			c.lineWidth = 3;
			c.beginPath();
			c.moveTo(p1.x, p1.y);
			c.lineTo(p2.x, p2.y);
			c.stroke();
		}
		else if(this.waterAnimations[i].y > 50 && this.waterAnimations[i].y <= 100) {
			//runs over the corner - only display the upper section before the waterfall front
			var p1 = point3d(this.x + p.worldX + this.waterAnimations[i].x, this.y + p.worldY - 150, Math.map(topY, 0, 100, 0.8, 0.92));
			var corner = point3d(this.x + p.worldX + this.waterAnimations[i].x, this.y + p.worldY - 150, 0.92);
			c.strokeStyle = "rgb(120, 120, 255)";
			c.lineWidth = 3;
			c.beginPath();
			c.moveTo(p1.x, p1.y);
			c.lineTo(corner.x, corner.y);
			c.stroke();
		}
	}
	//black out sides
	cube(this.x + p.worldX - 100, this.y + p.worldY - 140, 200, 80, 0.9, 0.9, "rgb(100, 100, 100)", "rgba(100, 100, 100, 0)", { noFrontExtended: true });
	cube(this.x + p.worldX - 200, this.y + p.worldY - 170, 150, 120, 0.9, 0.9, "rgb(100, 100, 100)", "rgba(100, 100, 100, 0)", { noFrontExtended: true });
	cube(this.x + p.worldX + 50, this.y + p.worldY - 170, 150, 120, 0.9, 0.9, "rgb(100, 100, 100)", "rgba(100, 100, 100, 0)", { noFrontExtended: true });
	//water animation
	cube(this.x + p.worldX - 50, this.y + p.worldY - 150, 100, 150, 0.9, 0.92, "rgb(100, 100, 255)", "rgb(100, 100, 255)", { noFrontExtended: true });
	if(frameCount % 10 === 0) {
		this.waterAnimations.push( {x: Math.random() * 100 - 50, y: -50} );
	}
	c.save();
	c.lineCap = "round";
	for(var i = 0; i < this.waterAnimations.length; i ++) {
		this.waterAnimations[i].y += 3;
		var topY = this.waterAnimations[i].y < 0 ? 0 : this.waterAnimations[i].y;
		var bottomY = this.waterAnimations[i].y + 50;
		if(topY < 100 && bottomY > 100) {
			//runs over the corner - only display the lower section after the waterfall front
			var corner = point3d(this.x + p.worldX + this.waterAnimations[i].x, this.y + p.worldY - 150, 0.92);
			var p2 = point3d(this.x + p.worldX + this.waterAnimations[i].x, this.y + p.worldY - 150 + (bottomY - 100), 0.92);
			c.strokeStyle = "rgb(120, 120, 255)";
			c.lineWidth = 3;
			c.beginPath();
			c.moveTo(corner.x, corner.y);
			c.lineTo(p2.x, p2.y);
			c.stroke();
		}
		else if(topY > 100) {
			//all on front of the waterfall
			var p1 = point3d(this.x + p.worldX + this.waterAnimations[i].x, this.y + p.worldY - 150 + (topY - 100), 0.92);
			var p2 = point3d(this.x + p.worldX + this.waterAnimations[i].x, this.y + p.worldY - 150 + (bottomY - 100), 0.92);
			c.strokeStyle = "rgb(120, 120, 255)";
			c.lineWidth = 3;
			c.beginPath();
			c.moveTo(p1.x, p1.y);
			c.lineTo(p2.x, p2.y);
			c.stroke();
		}
		if(topY > 250) {
			this.waterAnimations.splice(i, 1);
			i --;
			continue;
		}
	}
	c.restore();
	//base
	cube(this.x + p.worldX - 100, this.y + p.worldY - 50, 10, 50, 0.9, 1);
	cube(this.x + p.worldX + 90, this.y + p.worldY - 50, 10, 50, 0.9, 1);
	cube(this.x + p.worldX - 100, this.y + p.worldY - 50, 200, 50, 0.98, 1);
};
function Gear(x, y, size, dir) {
	this.x = x;
	this.y = y;
	this.size = size;
	this.dir = dir;
	this.rot = 0;
	// this.smallArr = findPointsCircular(0, 0, this.size * 0.8);
	this.largeArr = findPointsCircular(0, 0, this.size);
	this.smallArr = [];
	for(var i = 0; i < this.largeArr.length; i ++) {
		this.smallArr.push({
			x: this.largeArr[i].x * 0.8,
			y: this.largeArr[i].y * 0.8
		});
	}
};
Gear.prototype.exist = function() {
	var centerB = point3d(this.x + p.worldX, this.y + p.worldY, 0.95);
	var centerF = point3d(this.x + p.worldX, this.y + p.worldY, 1.05);
	//sides
	var gearType = "inside";
	c.fillStyle = "rgb(150, 150, 150)";
	for(var r = this.rot; r < this.rot + 360; r += 3) {
		var rotation = r;
		while(rotation > 360) {
			rotation -= 360;
		}
		while(rotation < 0) {
			rotation += 360;
		}
		if((rotation - this.rot) % 30 === 0) {
			gearType = (gearType === "inside") ? "outside" : "inside";
		}
		var next = r + 3;
		while(next > 360) {
			next -= 360;
		}
		while(next < 0) {
			next += 360;
		}
		if(gearType === "inside") {
			if((next - this.rot) % 30 !== 0) {
				var index1 = Math.floor(rotation / 360 * (this.smallArr.length - 1));
				var index2 = Math.floor(next / 360 * (this.smallArr.length - 1));
				c.beginPath();
				c.moveTo(centerF.x + this.smallArr[index1].x, centerF.y + this.smallArr[index1].y);
				c.lineTo(centerB.x + this.smallArr[index1].x, centerB.y + this.smallArr[index1].y);
				c.lineTo(centerB.x + this.smallArr[index2].x, centerB.y + this.smallArr[index2].y);
				c.lineTo(centerF.x + this.smallArr[index2].x, centerF.y + this.smallArr[index2].y);
				c.fill();
				collisionLine(this.x + p.worldX + this.smallArr[index1].x, this.y + p.worldY + this.smallArr[index1].y, this.x + p.worldX + this.smallArr[index2].x, this.y + p.worldY + this.smallArr[index2].y, { moving: true });
			}
			else {
				var index1 = Math.floor(rotation / 360 * (this.smallArr.length - 1));
				var index2 = Math.floor(next / 360 * (this.largeArr.length - 1));
				c.beginPath();
				c.moveTo(centerF.x + this.smallArr[index1].x, centerF.y + this.smallArr[index1].y);
				c.lineTo(centerB.x + this.smallArr[index1].x, centerB.y + this.smallArr[index1].y);
				c.lineTo(centerB.x + this.largeArr[index2].x, centerB.y + this.largeArr[index2].y);
				c.lineTo(centerF.x + this.largeArr[index2].x, centerF.y + this.largeArr[index2].y);
				c.fill();
				collisionLine(this.x + p.worldX + this.smallArr[index1].x, this.y + p.worldY + this.smallArr[index1].y, this.x + p.worldX + this.largeArr[index2].x, this.y + p.worldY + this.largeArr[index2].y, { moving: true, extraBouncy: (this.largeArr[index2].x < this.size * 0.8) });
			}
		}
		else {
			if((next - this.rot) % 30 !== 0) {
				var index1 = Math.floor(rotation / 360 * (this.largeArr.length - 1));
				var index2 = Math.floor(next / 360 * (this.largeArr.length - 1));
				c.beginPath();
				c.moveTo(centerF.x + this.largeArr[index1].x, centerF.y + this.largeArr[index1].y);
				c.lineTo(centerB.x + this.largeArr[index1].x, centerB.y + this.largeArr[index1].y);
				c.lineTo(centerB.x + this.largeArr[index2].x, centerB.y + this.largeArr[index2].y);
				c.lineTo(centerF.x + this.largeArr[index2].x, centerF.y + this.largeArr[index2].y);
				c.fill();
				collisionLine(this.x + p.worldX + this.largeArr[index1].x, this.y + p.worldY + this.largeArr[index1].y, this.x + p.worldX + this.largeArr[index2].x, this.y + p.worldY + this.largeArr[index2].y, { moving: true });
			}
			else {
				var index1 = Math.floor(rotation / 360 * (this.largeArr.length - 1));
				var index2 = Math.floor(next / 360 * (this.smallArr.length - 1));
				c.beginPath();
				c.moveTo(centerF.x + this.largeArr[index1].x, centerF.y + this.largeArr[index1].y);
				c.lineTo(centerB.x + this.largeArr[index1].x, centerB.y + this.largeArr[index1].y);
				c.lineTo(centerB.x + this.smallArr[index2].x, centerB.y + this.smallArr[index2].y);
				c.lineTo(centerF.x + this.smallArr[index2].x, centerF.y + this.smallArr[index2].y);
				c.fill();
				collisionLine(this.x + p.worldX + this.largeArr[index1].x, this.y + p.worldY + this.largeArr[index1].y, this.x + p.worldX + this.smallArr[index2].x, this.y + p.worldY + this.smallArr[index2].y, { moving: true, extraBouncy: (this.largeArr[index1].x < this.size * 0.8) });
			}
		}
	}
	//front face
	c.beginPath();
	c.fillStyle = "rgb(110, 110, 110)";
	gearType = "inside";
	for(var r = this.rot; r <= this.rot + 360; r += 3) {
		var rotation = r;
		while(rotation > 360) {
			rotation -= 360;
		}
		while(rotation < 0) {
			rotation += 360;
		}
		if((rotation - this.rot) % 30 === 0) {
			gearType = (gearType === "inside") ? "outside" : "inside";
		}
		var smallIndex = Math.floor(rotation / 360 * (this.smallArr.length - 1));
		var largeIndex = Math.floor(rotation / 360 * (this.largeArr.length - 1));
		if(r === this.rot) {
			if(gearType === "inside") {
				c.moveTo(centerF.x + this.smallArr[smallIndex].x, centerF.y + this.smallArr[smallIndex].y);
			}
			else {
				c.moveTo(centerF.x + this.largeArr[largeIndex].x, centerF.y + this.largeArr[largeIndex].y);
			}
		}
		else {
			if(gearType === "inside") {
				c.lineTo(centerF.x + this.smallArr[smallIndex].x, centerF.y + this.smallArr[smallIndex].y);
			}
			else {
				c.lineTo(centerF.x + this.largeArr[largeIndex].x, centerF.y + this.largeArr[largeIndex].y);
			}
		}
	}
	c.fill();
	this.rot += (this.dir === "right") ? 0.5 : -0.5;
};
function MovingWall(x, y, w, h, startZ) {
	this.x = x;
	this.y = y;
	this.w = w;
	this.h = h;
	this.z = startZ || 0.9;
	this.zDir = 0;
};
MovingWall.prototype.exist = function() {
	if(this.z >= 1) {
		collisionRect(this.x + p.worldX, this.y + p.worldY, this.w, this.h);
	}
	if(this.z > 0.9) {
		var color = Math.map(this.z, 0.9, 1.1, 100, 110);
		color = (color > 110) ? 110 : color;
		cube(this.x + p.worldX, this.y + p.worldY, this.w, this.h, 0.9, this.z, "rgb(" + color + ", " + color + ", " + color + ")", "rgb(150, 150, 150)");
	}
	this.z += this.zDir;
	this.z = (this.z < 0.9) ? 0.9 : this.z;
	this.z = (this.z > 1.1) ? 1.1 : this.z;
};

/** ROOM DATA **/
var inRoom = 0;
var numRooms = 0;
var theRoom = null;
function Room(type, content, id, minWorldY, background) {
	this.type = type;
	this.content = content;
	this.id = id;
	this.pathScore = null;
	this.background = background || null;
	this.minWorldY = minWorldY;
	this.colorScheme = null;
};
Room.prototype.exist = function(index) {
	c.globalAlpha = 1;
	c.fillStyle = "rgb(100, 100, 100)";
	c.resetTransform();
	c.fillRect(0, 0, 800, 800);
	if(this.background === null) {
		this.background = (Math.random() < 0.5) ? "plain" : "bricks";
	}
	boxFronts = [];
	extraGraphics = [];
	hitboxes = [];
	collisions = [];
	var chestIndexes = [];
	var boulderIndexes = [];
	var chargeIndexes = [];
	p.canUseEarth = true;
	//hax
	for(var i = 0; i < this.content.length; i ++) {
		if(this.content[i] instanceof Enemy) {
			//this.content[i].health = this.content[i].maxHealth;
			// this.content.splice(i, 1);
		}
	}
	//load all types of items
	for(var i = 0; i < this.content.length; i ++) {
		if(this.content[i] instanceof Door) {
			this.content[i].exist(index);
		}
		else if(this.content[i] instanceof Chest) {
			if(this.content[i].y + p.worldY > 400) {
				chestIndexes.push(i);
			}
			else {
				this.content[i].exist();
			}
		}
		else if(this.content[i] instanceof Item) {
			if(!this.content[i].initialized) {
				this.content[i].init();
			}
			var chestIndex = 0;
			for(var j = 0; j < this.content.length; j ++) {
				if(this.content[j] instanceof Chest && Math.distSq(this.content[j].x, this.content[j].y, this.content[i].x, this.content[i].y) < Math.distSq(this.content[chestIndex].x, this.content[chestIndex].y, this.content[i].x, this.content[i].y)) {
					chestIndex = j;
				}
			}
			c.save();
			c.globalAlpha = (this.content[i].opacity < 0) ? 0 : this.content[i].opacity;
			c.translate(this.content[i].x + p.worldX, this.content[i].y + p.worldY);
			c.beginPath();
			c.rect(this.content[chestIndex].x - 50 - (this.content[i].x), this.content[chestIndex].y - 1000 - (this.content[i].y), 100, 1000);
			c.clip();
			this.content[i].display("item");
			// thingsToBeRendered.push(new RenderingObject(
			// 	this.content[i],
			// 	{
			// 		x: this.content[i].x + p.worldX - 25,
			// 		y: this.content[i].y + p.worldY - 25,
			// 		w: 50,
			// 		h: 50
			// 	},
			// 	{
			// 		x: this.content[i].x + p.worldX - 25,
			// 		y: this.content[i].y + p.worldY - 25,
			// 		w: 50,
			// 		h: 50,
			// 		z: 1
			// 	}
			// ));
			c.restore();
			this.content[i].animate();
			if(this.content[i].opacity <= 0) {
				this.content[i].opacity = 1;
				p.addItem(this.content[i]);
				this.content.splice(i, 1);
			}
		}
		else if(this.content[i] instanceof Enemy) {
			this.content[i].seesPlayer = true;
			this.content[i].displayStats();
			c.globalAlpha = this.content[i].opacity > 0 ? this.content[i].opacity : 0;
			this.content[i].exist("player");
			c.globalAlpha = 1;
			//simple enemy attack
			if(this.content[i].x + p.worldX + this.content[i].rightX > p.x - 5 && this.content[i].x + p.worldX + this.content[i].leftX < p.x + 5 && this.content[i].y + p.worldY + this.content[i].bottomY > p.y - 5 && this.content[i].y + p.worldY + this.content[i].topY < p.y + 46 && this.content[i].attackRecharge < 0 && !this.content[i].complexAttack && this.content[i].timePurified <= 0) {
				this.content[i].attackRecharge = 45;
				var damage = Math.random() * (this.content[i].damHigh - this.content[i].damLow) + this.content[i].damLow;
				p.hurt(damage, this.content[i].name);
			}
			//remove dead enemies
			if(this.content[i].splicing && this.content[i].opacity <= 0) {
				if(this.content[i] instanceof Wraith) {
					for(var j = 0; j < this.content[i].particles.length; j ++) {
						this.content.push(Object.create(this.content[i].particles[j]));
						continue;
					}
				}
				this.content.splice(i, 1);
				p.enemiesKilled ++;
				continue;
			}
			//show hitboxes
			if(showHitboxes) {
				hitboxes.push({x: this.content[i].x + p.worldX + this.content[i].leftX, y: this.content[i].y + p.worldY + this.content[i].topY, w: (this.content[i].rightX + Math.abs(this.content[i].leftX)), h: (this.content[i].bottomY + Math.abs(this.content[i].topY)), color: "green"});
			}
		}
		else if(this.content[i] instanceof ShotArrow) {
			this.content[i].exist();
			if(showHitboxes) {
				hitboxes.push({x: this.content[i].x + p.worldX - 1, y: this.content[i].y + p.worldY - 1, w: 2, h: 2, color: "green"});
			}
			if(this.content[i].opacity <= 0) {
				this.content.splice(i, 1);
				continue;
			}
		}
		else if(this.content[i] instanceof RandomEnemy) {
			this.content[i].generate();
			this.content.splice(i, 1);
		}
		else if(this.content[i] instanceof MagicCharge) {
			if(this.content[i].splicing) {
				for(var j = 0; j < this.content[i].particles.length; j ++) {
					this.content.push(Object.create(this.content[i].particles[j]));
				}
				this.content.splice(i, 1);
				continue;
			}
			chargeIndexes.push(i);
		}
		else if(this.content[i] instanceof Block) {
			this.content[i].exist(index);
		}
		else if(this.content[i] instanceof Boulder) {
			if(this.content[i].splicing) {
				this.content.splice(i, 1);
				continue;
			}
			boulderIndexes.push(i);
		}
		else if(this.content[i] instanceof Altar) {
			this.content[i].exist();
			if(this.content[i].splicing) {
				for(var j = 0; j < this.content[i].particles.length; j ++) {
					this.content.push(Object.create(this.content[i].particles[j]));
				}
				this.content.splice(i, 1);
			}
		}
		else {
			this.content[i].exist();
			if(this.content[i].splicing) {
				this.content.splice(i, 1);
				continue;
			}
		}
		if(this.content[i] instanceof BoulderVoid) {
			p.canUseEarth = false;
		}
	}
	/* load chest fronts after everything else */
	for(var i = 0; i < chestIndexes.length; i ++) {
		if(this.content[chestIndexes[i]].y + p.worldY > 400) {
			this.content[chestIndexes[i]].exist();
			if(this.content[chestIndexes[i]].splicing) {
				for(var j = 0; j < this.content[chargeIndexes[i]].particles.length; j ++) {
					this.content.push(Object.create(this.content[chargeIndexes[i]].particles[j]));
				}
				this.content.splice(i, 1);
				continue;
			}
		}
	}
	/* load block fronts after everything else */
	loadBoxFronts();
	/* load magic charges */
	for(var i = 0; i < chargeIndexes.length; i ++) {
		this.content[chargeIndexes[i]].exist();
	}
	//load boulders
	for(var i = 0; i < boulderIndexes.length; i ++) {
		this.content[boulderIndexes[i]].exist();
	}
	/* Collisions */
	// console.log("Room #" + index);
	// console.log(collisions);
	if(inRoom === index) {
		p.canJump = false;
	}
	for(var i = 0; i < collisions.length; i ++) {
		collisions[i].collide();
	}
	//show hitboxes
	for(var i = 0; i < hitboxes.length; i ++) {
		if(hitboxes[i].color === "light blue") {
			c.strokeStyle = "rgb(0, " + (Math.sin(frameCount / 30) * 30 + 225) + ", " + (Math.sin(frameCount / 30) * 30 + 225) + ")";
		}
		else if(hitboxes[i].color === "dark blue") {
			c.strokeStyle = "rgb(0, 0, " + (Math.sin(frameCount / 30) * 30 + 225) + ")";
		}
		else if(hitboxes[i].color === "green") {
			c.strokeStyle = "rgb(0, " + (Math.sin(frameCount / 30) * 30 + 225) + ", 0)";
		}
		c.strokeRect(hitboxes[i].x, hitboxes[i].y, hitboxes[i].w, hitboxes[i].h);
	}
	//fading transitions between rooms
	c.fillStyle = "rgb(0, 0, 0)";
	if(p.screenOp < 0) {
		p.screenOp = 0;
		p.exitingDoor = false;
	}
	c.globalAlpha = (p.screenOp < p.fallOp) ? p.fallOp : p.screenOp;
	c.fillRect(0, 0, 800, 800);
	c.fillStyle = "rgb(255, 0, 0)";
	c.globalAlpha = (p.damOp > 0) ? p.damOp : 0;
	c.fillRect(0, 0, 800, 800);
};
Room.prototype.displayBackground = function() {
	if(this.background === "bricks") {
		c.save();
		c.translate((p.worldX * 0.9) % 100, (p.worldY * 0.9) % 100);
		c.strokeStyle = "rgb(110, 110, 110)";
		c.lineWidth = 4;
		for(var y = -100; y < 900; y += 50) {
			c.beginPath();
			c.moveTo(-100, y);
			c.lineTo(900, y);
			c.stroke();
			for(var x = (y % 100 === 0) ? -100 : -50; x < 900; x += 100) {
				c.beginPath();
				c.moveTo(x, y);
				c.lineTo(x, y + 50);
				c.stroke();
			}
		}
		c.restore();
	}
};
Room.prototype.containsEnemies = function() {
	for(var i = 0; i < this.content.length; i ++) {
		if(this.content[i] instanceof Enemy) {
			return true;
		}
	}
	return false;
};
var rooms = [
	{
		name: "ambient1",
		difficulty: 0,
		extraDoors: 2,
		add: function() {
			roomInstances.push(
				new Room(
					"ambient1",
					[
						new Pillar(200, 500, 200),
						new Pillar(400, 500, 200),
						new Pillar(600, 500, 200),
						new Pillar(800, 500, 200),
						new Block(-200, 500, 2000, 2000),//floor
						new Block(-600, -200, 700, 2000), //left wall
						new Block(-400, -1000, 2000, 1300), //ceiling
						new Block(900, -200, 500, 1000), //right wall
						new Door(300,  500, ["ambient", "combat", "parkour", "secret"]),
						new Door(500,  500, ["ambient", "combat", "parkour", "secret"]),
						new Door(700,  500, ["ambient", "combat", "parkour", "secret"])
					],
					"?"
				)
			);
		}
	}, //3 pillars room
	{
		name: "ambient2",
		difficulty: 0,
		extraDoors: 1,
		add: function() {
			roomInstances.push(
				new Room(
					"ambient2",
					[
						new Block(-1000, -1000, 1300, 2000), //left wall
						new Block(-100, 500, 1500, 500), //floor
						new Block(-400, -1000, 2000, 1300), //roof
						new Block(1000, -500, 1000, 1100), //right wall
						new Torch(500, 440),
						new Torch(600, 440),
						new Torch(700, 440),
						new Torch(800, 440),
						new Door(400, 500, ["combat", "parkour", "secret"], false, false, "toggle"),
						new Door(900, 500, ["combat", "parkour", "secret"], false, false, "toggle")
					],
					"?"
				)
			);
		}
	}, //torches hallway room
	{
		name: "ambient3",
		difficulty: 0,
		extraDoors: 1,
		add: function() {
			if(Math.random() < 0.5) {
				roomInstances.push(
					new Room(
						"ambient3",
						[
							new Block(-4000, 0, 8000, 1000), //floor
							new Stairs(200, 0, 10, "right"),
							new Block(600, -4000, 4000, 4100), //right wall
							new Door(500, 0, ["combat", "parkour", "secret"], true, false, "toggle"),
							new Block(-800, -200, 1001, 1000), //higher floor
							new Door(100, -200, ["combat", "parkour", "secret"]),
							new Block(-1000, -4000, 1000, 8000), //left wall
							new Block(-4000, -1400, 8000, 1000) //roof
						],
						"?"
					)
				);
			}
			else {
				roomInstances.push(
					new Room(
						"ambient3",
						[
							new Block(-4000, 0, 8000, 1000), //floor
							new Stairs(-200, 0, 10, "left"),
							new Block(-4600, -4000, 4000, 4100), //left wall
							new Door(-500, 0, ["combat", "parkour", "secret"], true, false, "toggle"),
							new Block(-200, -200, 1000, 1000), //higher floor
							new Door(-100, -200, ["combat", "parkour", "secret"]),
							new Block(0, -4000, 1000, 8000), //right wall
							new Block(-4000, -1400, 8000, 1000) //roof
						],
						"?"
					)
				);
			}
		}
	}, //stairs room
	{
		name: "ambient4",
		difficulty: 1,
		add: function() {
			roomInstances.push(
				new Room(
					"ambient4",
					[
						new Block(-1000, -1000, 1300, 2000), //left wall
						new Block(-100, 500, 600, 1000), //left floor
						new Block(780, 500, 1000, 1000), //right floor
						new Block(-400, -1000, 2000, 1300), //roof
						new Block(980, -500, 1000, 1100), //right wall
						new FallBlock(520, 500),
						new FallBlock(560, 500),
						new FallBlock(600, 500),
						new FallBlock(640, 500),
						new FallBlock(680, 500),
						new FallBlock(720, 500),
						new FallBlock(760, 500),
						new Door(400, 500, ["combat", "parkour", "secret"], false, false, "toggle"),
						new Door(880, 500, ["combat", "parkour", "secret"], false, false, "toggle")
					],
					"?",
					-200
				)
			);
		}
	}, //collapsing floor room
	{
		name: "ambient5",
		difficulty: 0,
		add: function() {
			roomInstances.push(
				new Room(
					"ambient5",
					[
						new Fountain(650, 500),
						new Block(-1000, -1000, 1300, 2000), //left wall
						new Block(-100, 500, 1500, 500), //floor
						new Block(999, -500, 1000, 1100), //right wall
						new Roof(650, 200, 350),
						new Door(400, 500, ["combat", "parkour", "secret"], false, false, "toggle"),
						new Door(900, 500, ["combat", "parkour", "secret"], false, false, "toggle")
					],
					"?",
					undefined,
					"plain"
				)
			);
			roomInstances[roomInstances.length - 1].colorScheme = "blue";
		}
	}, //fountain room
	{
		name: "ambient6",
		difficulty: 0,
		extraDoors: 1,
		add: function() {
			roomInstances.push(
				new Room(
					"secret1",
					[
						// new Chest(100, 0),
						// new Chest(800, 0),
						new Block(-1000, -1000, 1000, 2000), //left wall
						new Block(-100, 500, 1010, 500), //floor
						new Block(900, -1000, 1000, 2000), //right wall,
						new Door(100, 500, ["ambient", "combat", "parkour"]),
						new Door(800, 500, ["ambient", "combat", "parkour"]),
						new LightRay(200, 500),
						new Tree(450, 500),
						new Block(-300, 0, 500, 100), //left roof,
						new Block(700, 0, 500, 100), //right roof
						new Block(-300, -1300, 500, 1302), //left roof
						new Block(700, -1300, 500, 1302), //right roof
					],
					"?"
				)
			);
			roomInstances[roomInstances.length - 1].colorScheme = "green";
		}
	}, //garden
	{
		name: "secret1",
		difficulty: 0,
		extraDoors: 1,
		add: function() {
			var possibleItems = Object.create(items);
			for(var i = 0; i < possibleItems.length; i ++) {
				if(!(new possibleItems[i]() instanceof Weapon) || new possibleItems[i]() instanceof Arrow || new possibleItems[i]() instanceof Dagger) {
					possibleItems.splice(i, 1);
					i --;
					continue;
				}
				var hasIt = false;
				for(var j = 0; j < p.invSlots.length; j ++) {
					if(p.invSlots[j].content instanceof possibleItems[i]) {
						hasIt = true;
					}
				}
				if(hasIt) {
					possibleItems.splice(i, 1);
					i --;
					continue;
				}
			}
			if(possibleItems.length === 0) {
				//default to combat1 if the player has all the weapons in the
				for(var i = 0; i < rooms.length; i ++) {
					if(rooms[i].name === "combat3") {
						rooms[i].add();
						break;
					}
				}
				return;
			}
			roomInstances.push(
				new Room(
					"secret2",
					[
						new Block(-1000, -1000, 1000, 2000), //left wall
						new Block(-100, 500, 1010, 500), //floor
						new Block(600, -1000, 1000, 2000), //right wall,
						// new Block(-4000, -2000, 8000, 2200), //roof
						new Roof(300, 200, 300),
						new Decoration(200, 450),
						new Decoration(400, 450),
						new Statue(300, 370, new Sword()),
						new Door(100, 500, ["ambient", "combat", "parkour"]),
						new Door(500, 500, ["ambient", "combat", "parkour"])
					],
					"?"
				)
			);
		}
	}, //statue room
	{
		name: "secret2",
		difficulty: 1,
		extraDoors: 1,
		add: function() {
			roomInstances.push(
				new Room(
					"secret3",
					[
						new Block(-4000, 0, 8000, 1000), //floor
						new Block(500, -4000, 1000, 8000), //right wall
						new Block(-1500, -4000, 1000, 8000), //left wall
						new Door(-220, 0, ["ambient"]),
						new Door(220, 0, ["ambient"]),
						new BookShelf(-380, 0),
						new BookShelf(380, 0),
						new Chandelier(0, -300),
						new Table(0, 0),
						new Chair(-100, 0, "right"),
						new Chair(100, 0, "left"),
						new Block(220, -700, 1000, 300),
						new Block(-1220, -700, 1000, 300),
						new Block(220, -1300, 1000, 300),
						new Block(-1220, -1300, 1000, 300),
						new Door(400, -700, ["reward"], "no entries"),
						new Door(-400, -700, ["reward"], "no entries")
					],
					"?"
				)
			);
			roomInstances[roomInstances.length - 1].colorScheme = "red";
		}
	}, //library room
	{
		name: "combat1",
		difficulty: 3,
		extraDoors: 1.5,
		add: function() {
			roomInstances.push(
				new Room(
					"combat1",
					[
						new Block(-2000, 0, 4000, 1000), //floor
						new Block(-1000, -4000, 500, 8000), //left wall
						new Block(500, -4000, 1000, 8000), //right wall
						new Roof(0, -300, 500),
						new Door(-450, 0, ["ambient"], false),
						new Door(0, 0, ["reward"], true, false, "toggle"),
						new Door(450, 0, ["ambient"], false),
						new Decoration(300, -50), new Decoration(-300, -50),
						new Decoration(150, -50), new Decoration(-150, -50),
						new RandomEnemy(0, 0)
					],
					"?"
				)
			);
		}
	}, //basic combat room
	{
		name: "combat2",
		difficulty: 5,
		extraDoors: 1,
		add: function() {
			roomInstances.push(
				new Room(
					"combat2",
					[
						new Stairs(200, 0, 10, "right"),
						new Stairs(0, 0, 10, "left"),
						new Block(-4000, 0, 8000, 1000), //floor
						new Block(600, -4000, 4000, 4100), //right wall
						new Block(-1400, -4000, 1000, 8000), //left wall
						new Block(0, -200, 201, 1000), //higher floor
						new Block(-4000, -1400, 8000, 1000), //roof
						new Door(-300, 0, ["reward"], true),
						new Door(500, 0, ["reward"], true),
						new Door(100, -200, ["ambient"], false, false, "toggle"),
						new RandomEnemy(500, 0),
						new RandomEnemy(-300, 0)
					],
					"?"
				)
			);
		}
	}, //stairs double combat room
	{
		name: "combat3",
		difficulty: 4,
		extraDoors: 0.5,
		add: function() {
			roomInstances.push(
				new Room(
					"combat3",
					[
						new Block(-100, 0, 200, 8000), //left floor
						new Block(-4000, -4000, 3900, 8000), //left wall
						new Block(900, 0, 300, 8000), //right floor
						new Block(1100, -4000, 1000, 8000), //right wall
						new Bridge(500, -200),
						new Door(1000, 0, ["reward"]),
						new Door(0, 0, ["reward"]),
						new RandomEnemy(500, -200)
					],
					"?",
					undefined,
					"plain"
				)
			)
		}
	}, //bridge combat room
	{
		name: "combat4",
		difficulty: 3,
		extraDoors: 1.5,
		add: function() {
			roomInstances.push(
				new Room(
					"combat4",
					[
						new Block(-300, 0, 600, 1000), //center platform
						new Pillar(-150, 0, 200),
						new Pillar(150, 0, 200),
						new Decoration(0, -200),
						new Pillar(-400, 900, 850),
						new Pillar(400, 900, 850),
						new Block(-1500, 100, 1000, 1000), //left floor
						new Block(500, 100, 1000, 1000), //right floor
						new Block(-1700, -4000, 1000, 8000), //left wall
						new Block(700, -4000, 1000, 8000), //left wall
						new Door(0, 0, ["reward"], true, false, "toggle"),
						new Door(-600, 100, ["ambient", "secret"]),
						new Door(600, 100, ["ambient", "secret"]),
						new RandomEnemy(0, 0)
					],
					"?",
					200
				)
			);
		}
	}, //platform combat room
	{
		name: "parkour1",
		difficulty: 3,
		extraDoors: 1.5,
		add: function() {
			roomInstances.push(
				new Room(
					"parkour1",
					[
						new Block(-1000, -1000, 1000, 2000), //left wall
						new Block(-1000, 500, 1200, 1000), //left floor
						new Door(100, 500, ["ambient"], false),
						new FallBlock(300, 475),
						new FallBlock(400, 450),
						new FallBlock(500, 425),
						new Block(600, 400, 200, 2000), //middle platform
						new Door(700, 400, ["reward"], true, false, "toggle"),
						new FallBlock(900, 425),
						new FallBlock(1000, 450),
						new FallBlock(1100, 475),
						new Block(1200, 500, 1000, 2000), //right floor
						new Block(1400, -1000, 1000, 2000), //right wall
						new Door(1300, 500, ["ambient"], false),
						new Roof(700, 200, 700),
						// new Roof(700, 200, 350),
						new Decoration(600, 350),
						new Decoration(800, 350)
					],
					"?",
					-200
				)
			);
		}
	}, //falling platforms room
	{
		name: "parkour2",
		difficulty: 2,
		extraDoors: 1.5,
		add: function() {
			roomInstances.push(
				new Room(
					"parkour2",
					[
						new Block(0, -4000, 1000, 8000), //left wall
						new Block(200, 0, 1000, 4000), //left floor
						new Door(1100, 0, ["ambient"]),
						new Block(1550, 200, 200, 8000), //middle platform
						new Pulley(1300, 150, 1850, 150, 200, 150),
						new Door(1650, 200, ["reward"], true),
						new Block(2100, 0, 1000, 4000), //right floor
						new Block(2300, -4000, 1000, 8000), //right wall
						new Door(2200, 0, ["ambient"])
					],
					"?",
					0
				)
			);
		}
	}, //pulley room
	{
		name: "parkour3",
		difficulty: 4,
		extraDoors: 0.5,
		add: function() {
			if(Math.random() < 0.5) {
				roomInstances.push(
					new Room(
						"parkour3",
						[
							new Block(-100, 0, 1000, 1000), //lower floor
							new Block(100, -4000, 1000, 8000), //left wall
							new TiltPlatform(-300, -100),
							new TiltPlatform(-500, -200),
							new Block(-1700, -300, 1000, 1000), //upper floor
							new Block(-1900, -4000, 1000, 8000), //right wall
							new Door(0, 0, ["ambient"]),
							new Door(-800, -300, ["reward"], true),
							new Roof(-400, -500, 500),
							new Decoration(-100, -50),
							new Decoration(-700, -350)
						],
						"?",
						420
					)
				);
			}
			else {
				roomInstances.push(
					new Room(
						"parkour3",
						[
							new Block(-100, -300, 1000, 1000), //upper floor
							new Block(100, -4000, 1000, 8000), //left wall
							new TiltPlatform(-300, -200),
							new TiltPlatform(-500, -100),
							new Block(-1700, 0, 1000, 1000), //lower floor
							new Block(-1900, -4000, 1000, 8000), //right wall
							new Door(0, -300, ["reward"], true),
							new Door(-800, 0, ["reward"]),
							new Roof(-400, -500, 500),
							new Decoration(-700, -50),
							new Decoration(-100, -350)
						],
						"?",
						420
					)
				);
			}
		}
	}, //tilting platforms room
	{
		name: "parkour4",
		difficulty: 5,
		extraDoors: 2,
		add: function() {
			roomInstances.push(
				new Room(
					"parkour4",
					[
						new Decoration(-1200, -140),
						new Decoration(0, -140),
						new Decoration(-1200, -540),
						new Decoration(0, -540),
						new Block(-100, 0, 1000, 4000), //right floor
						new Block(100, -4000, 1000, 8000), //right wall
						new Pulley(-400, 200, -1000, 200, -150, 150),
						new TiltPlatform(-600, -100),
						new Block(-2100, 0, 1000, 1000), //left floor
						new Block(-2300, -4000, 1000, 8000), //left wall
						new Block(-100, -400, 1000, 100), //upper right floor
						new Block(-2100, -400, 1000, 100), //upper left floor
						new Door(-1200, 0, ["ambient"]),
						new Door(0, 0, ["ambient"]),
						new Door(-1200, -400, ["reward"], true, false, "toggle"),
						new Door(0, -400, ["reward"], true, false, "toggle")
					],
					"?",
					300
				)
			);
		}
	}, //tilting platform + pulley room
	// {
	// 	name: "parkour5",
	// 	difficulty: 2,
	// 	extraDoors: 0.5,
	// 	add: function() {
	// 		roomInstances.push(
	// 			new Room(
	// 				"parkour5",
	// 				[
	// 					new Block(-1000, 0, 1100, 1000), //left floor
	// 					new Block(-1100, -4000, 1000, 8000), //left wall
	// 					new Block(1190, 0, 1000, 1000), //right floor
	// 					new Block(1390, -4000, 1000, 8000), //right wall
	// 					new Gear(400, 0, 250, "right"),
	// 					new Gear(890, 0, 250, "left"),
	// 					new Door(0, 0, ["reward"]),
	// 					new Door(1290, 0, ["reward"])
	// 				],
	// 				"?",
	// 				446
	// 			)
	// 		);
	// 	}
	// }, //gear room
	{
		name: "reward1",
		difficulty: 0,
		extraDoors: 0,
		add: function() {
			roomInstances.push(
				new Room(
					"reward1",
					[
						new Block(-4000, 0, 8000, 1000), // floor
						new Block(-1500, -4000, 1300, 8000), //left wall
						new Block(200, -4000, 1000, 8000), //right wall
						new Block(-4000, -2000, 8000, 1800), //roof
						new Chest(-100, 0),
						new Chest(100, 0),
						new Door(0, 0, "blah")
					],
					"?"
				)
			)
		}
	}, //2 chests room
	{
		name: "reward2",
		difficulty: 0,
		extraDoors: 1,
		add: function() {
			var chooser = Math.random();
			var hasAStaff = false;
			magicLoop: for(var i = 0; i < p.invSlots.length; i ++) {
				if(p.invSlots[i].content instanceof MagicWeapon) {
					hasAStaff = true;
					break magicLoop;
				}
			}
			if(!hasAStaff) {
				chooser = 0;
			}
			if(p.healthAltarsFound >= 5 || roomInstances[inRoom].colorScheme === "blue") {
				chooser = 1;
			}
			if(p.manaAltarsFound >= 5 || roomInstances[inRoom].colorScheme === "red") {
				chooser = 0;
			}
			if((p.healthAltarsFound >= 5 || roomInstances[inRoom].colorScheme === "blue") && (p.manaAltarsFound >= 5 || roomInstances[inRoom].colorScheme === "red")) {
				roomInstances.push(
					new Room(
						"reward",
						[
							new Block(-2000, 500, 4000, 500), //floor
							new Block(-1000, -1000, 800, 2000), //left wall
							new Block(200, -1000, 500, 3000), //right wall
							new Block(-1000, -2000, 2000, 2300), //roof,
							new Door(0, 500, ["things should go here... maybe? i dont think so lol"], false),
							new Chest(-100, 500),
							new Chest(100, 500)
						],
						"?"
					)
				);
			}
			p.healthAltarsFound += (chooser < 0.5) ? 1 : 0;
			p.manaAltarsFound += (chooser > 0.5) ? 1 : 0;
			roomInstances.push(
				new Room(
					"reward2",
					[
						new Block(0, 0, 4000, 4000), //floor
						new Block(0, -4000, 1000, 5000), //left wall
						new Block(1500, -4000, 1000, 5000), //right wall
						new Block(0, -2000, 8000, 1800), //roof
						new Door(1100, 0, ["combat", "parkour"], false, true),
						new Door(1400, 0, ["combat", "parkour"], false, true),
						new Block(1210, -40, 80, 100),
						new Block(1200, -201, 100, 41),
						new Stairs(1290, 0, 2, "right"),
						new Stairs(1210, 0, 2, "left"),
						new Block(1180, -200, 140, 20),
						new Altar(1250, -100, chooser < 0.5 ? "health" : "mana")
					],
					"?"
				)
			);
			roomInstances[roomInstances.length - 1].colorScheme = (chooser < 0.5) ? "red" : "blue";
		}
	}, //altar room
	{
		name: "reward3",
		difficulty: 0,
		extraDoors: 1,
		add: function() {
			roomInstances.push(new Room(
				"reward3",
				[
					new Block(0, 0, 4000, 4000), //floor
					new Block(0, -4000, 1000, 5000), //left wall
					new Block(1500, -4000, 1000, 5000), //right wall
					new Block(0, -2000, 8000, 1700), //roof
					new Forge(1250, 0),
					new Door(1050, 0, ["combat", "parkour"], false, true),
					new Door(1450, 0, ["combat", "parkour"], false, true)
				],
				"?"
			));
			roomInstances[roomInstances.length - 1].colorScheme = "red";
		}
	}, //forge room
	{
		name: "reward4",
		difficulty: 0,
		extraDoors: 0,
		add: function() {
			if(Math.random() < 0.5) {
				roomInstances.push(
					new Room(
						"reward4",
						[
							new Block(-4000, 0, 8000, 1000), //floor
							new Stairs(200, 0, 10, "right"),
							new Block(600, -4000, 4000, 4100), //right wall
							new Chest(500, 0),
							new Decoration(500, -100),
							new Block(-800, -200, 1001, 1000), //higher floor
							new Door(100, -200, ["combat", "parkour", "secret"]),
							new Block(-1000, -4000, 1000, 8000), //left wall
							new Block(-4000, -1400, 8000, 1000) //roof
						],
						"?"
					)
				);
			}
			else {
				roomInstances.push(
					new Room(
						"reward4",
						[
							new Block(-4000, 0, 8000, 1000), //floor
							new Stairs(-200, 0, 10, "left"),
							new Block(-4600, -4000, 4000, 4100), //left wall
							new Chest(-500, 0),
							new Decoration(-500, -100),
							new Block(-200, -200, 1000, 1000), //higher floor
							new Door(-100, -200, ["combat", "parkour", "secret"]),
							new Block(0, -4000, 1000, 8000), //right wall
							new Block(-4000, -1400, 8000, 1000) //roof
						],
						"?"
					)
				);
			}
		}
	} //chest + stairs room
];
var items = [
	Dagger, Sword, Spear, //melee weapons
	WoodBow, MetalBow, MechBow, LongBow, //ranged weapons
	EnergyStaff, ElementalStaff, ChaosStaff, //magic weapons
	WizardHat, MagicQuiver, Helmet, //equipables
	Barricade, Map, //extras / bonuses
	FireCrystal, WaterCrystal, EarthCrystal, AirCrystal //crystals
];
var enemies = [Spider, Bat, SkeletonWarrior, SkeletonArcher, Wraith, Dragonling, Troll];
var roomInstances = [
	new Room(
		"ambient1",
		[
			new Pillar(200, 500, 200),
			new Pillar(400, 500, 200),
			new Pillar(600, 500, 200),
			new Pillar(800, 500, 200),
			new Block(-200, 500, 2000, 2000),//floor
			new Block(-600, -200, 700, 2000), //left wall
			new Block(-400, -1000, 2000, 1300), //ceiling
			new Block(900, -200, 500, 1000), //right wall
			new Door(300,  500, ["ambient", "combat", "parkour", "secret"], false, false, "arch"),
			new Door(500,  500, ["ambient", "combat", "parkour", "secret"], false, false, "arch"),
			new Door(700,  500, ["ambient", "combat", "parkour", "secret"], false, false, "arch")
		],
		"?"
	)
];
if(hax) {
	// items = [items[2]];
	for(var i = 0; i < rooms.length; i ++) {
		if(rooms[i].name !== "ambient6" && rooms[i].name !== "reward1") {
			rooms.splice(i, 1);
			i --;
			continue;
		}
	}
	enemies = [Skeleton, Wraith];
	items = [Helmet];
	// for(var i = 0; i < roomInstances[0].content.length; i ++) {
	// 	if(roomInstances[0].content[i] instanceof Door) {
	// 		roomInstances[0].content[i].dest = ["reward"];
	// 	}
	// }
	// enemies = [SkeletonWarrior];
	for(var i = 0; i < roomInstances[0].content.length; i ++) {
		if(roomInstances[0].content[i] instanceof Door) {
			// roomInstances[0].content[i].dest = ["reward"];
		}
	}
}


/** ITEMS **/
function Item() {
	this.location = null;
	this.initialized = false;
	this.mode = "visual"; // the mode of the item - "visual" for when it is coming out of a chest and "held" if it is in the inventory.
};
Item.prototype.init = function() {
	for(var i = 0; i < roomInstances[inRoom].content.length; i ++) {
		if(roomInstances[inRoom].content[i].requestingItem && roomInstances[inRoom].content[i] instanceof Chest) {
			this.x = roomInstances[inRoom].content[i].x;
			this.y = roomInstances[inRoom].content[i].y - 10;
			roomInstances[inRoom].content[i].requestingItem = false;
			break;
		}
	}
	this.initialized = true;
	this.velY = -4;
	this.opacity = 1;
};
Item.prototype.animate = function() {
	/**
	Run the animation for the item when coming out of chests
	**/
	this.y += (this.velY < 0) ? this.velY : 0;
	this.velY += 0.1;
	if(this.velY >= 0) {
		this.opacity -= 0.05;
	}
};
Item.prototype.displayDesc = function(x, y, dir) {
	dir = dir || "left";
	//split overflow into multiple lines
	for(var i = 0; i < this.desc.length; i ++) {
		c.font = this.desc[i].font;
		if(c.measureText(this.desc[i].content).width >= 190) {
			var line1 = this.desc[i].content;
			var line2 = "";
			while(c.measureText(line1).width >= 190) {
				textLoop: for(var j = line1.length; j > 0; j --) {
					if(line1.substr(j, 1) === " ") {
						line2 = line1.substr(j, Infinity) + line2;
						line1 = line1.substr(0, j);
						break textLoop;
					}
				}
			}
			this.desc[i].content = line1;
			this.desc.splice(i + 1, 0, {content: line2, font: this.desc[i].font, color: this.desc[i].color});
		}
	}
	for(var i = 0; i < this.desc.length; i ++) {
		if(this.desc[i].content.substr(0, 1) === " ") {
			this.desc[i].content = this.desc[i].content.substr(1, Infinity);
		}
	}
	//add special stat text for elemental weapons
	if(this instanceof Weapon && this.element !== "none" && !(this instanceof ElementalStaff)) {
		loop1: for(var i = 1; i < this.desc.length; i ++) {
			if(this.desc[i].font !== "bold 10pt Courier") {
				this.desc.splice(i + 1, 0, {
					content: "Special: " + ((this.element === "fire" || this.element === "water") ?
					((this.element === "fire") ? "Burning" : "Freezing") :
					((this.element === "earth") ? "Crushing" : "Knockback")),
					font: "10pt monospace",
					color: "rgb(255, 255, 255)"
				});
				break loop1;
			}
		}
		this.desc.push({
			content: "Enhanced with the power",
			font: "10pt Cursive",
			color: "rgb(150, 150, 150)"
		},
		{
			content: "of " + ((this.element === "fire" || this.element === "water") ?
			((this.element === "fire") ? "flame." : "ice.") :
			((this.element === "earth") ? "stone." : "wind.")),
			font: "10pt Cursive",
			color: "rgb(150, 150, 150)"
		});
	}
	//out-of-class warning info
	if((this instanceof MeleeWeapon && !(this instanceof Dagger) && p.class !== "warrior") || (this instanceof RangedWeapon && p.class !== "archer") || (this instanceof MagicWeapon && p.class !== "mage")) {
		if(this instanceof MeleeWeapon) {
			this.desc.splice(1, 0, {
				content: "Best used by warriors",
				font: "10pt monospace",
				color: "rgb(255, 255, 255)"
			});
		} else if(this instanceof RangedWeapon) {
			this.desc.splice(1, 0, {
				content: "Best used by archers",
				font: "10pt monospace",
				color: "rgb(255, 255, 255)"
			});
		}
		else if(this instanceof MagicWeapon) {
			this.desc.splice(1, 0, {
				content: "Best used by mages",
				font: "10pt monospace",
				color: "rgb(255, 255, 255)"
			});
		}
	}
	//display description
	var descHeight = this.desc.length * 12 + 10;
	var idealY = y - (descHeight / 2);
	var actualY = (idealY > 20) ? idealY : 20;
	actualY = (actualY + (descHeight / 2) < 780) ? actualY : 780 - (descHeight / 2);
	if(dir === "right") {
		//text box
		c.fillStyle = "rgb(100, 100, 100)";
		c.beginPath();
		c.moveTo(x, y);
		c.lineTo(x + 10, y - 10);
		c.lineTo(x + 10, y + 10);
		c.fill();
		c.fillRect(x + 10, actualY, 200, descHeight);
		//text
		c.textAlign = "left";
		for(var i = 0; i < this.desc.length; i ++) {
			c.fillStyle = this.desc[i].color;
			c.font = this.desc[i].font;
			c.fillText(this.desc[i].content, x + 15, actualY + (i * 12) + 15);
		}
		c.textAlign = "center";
	}
	else {
		//text box
		c.fillStyle = "rgb(100, 100, 100)";
		c.beginPath();
		c.moveTo(x, y);
		c.lineTo(x - 10, y - 10);
		c.lineTo(x - 10, y + 10);
		c.fill();
		c.fillRect(x - 210, actualY, 200, descHeight);
		//text
		c.textAlign = "left";
		for(var i = 0; i < this.desc.length; i ++) {
			c.fillStyle = this.desc[i].color;
			c.font = this.desc[i].font;
			c.fillText(this.desc[i].content, x - 205, actualY + (i * 12) + 15);
		}
		c.textAlign = "center";
	}
};

//weapons
function Weapon(modifier) {
	Item.call(this);
	this.equipable = false;
	this.modifier = modifier || "none";
	this.element = "none";
	this.particles = [];
};
inheritsFrom(Weapon, Item);
Weapon.prototype.displayParticles = function() {
	if(this.element === null || this.element === "none") {
		return;
	}
	for(var i = 0; i < 5; i ++) {
		var color = "rgb(255, 255, 255)"; // default color
		if(this.element === "fire") {
			color = "rgb(255, 128, 0)";
		}
		else if(this.element === "water") {
			color = "rgb(0, 255, 255)";
		}
		else if(this.element === "earth") {
			color = "rgb(0, 255, 0)";
		}
		else if(this.element === "air") {
			color = "rgb(255, 255, 255)";
		}
		this.particles.push(new Particle(color, Math.random() * 50 + 10, Math.random() * 50 + 10, Math.random() * 4 - 2, Math.random() * 4 - 2, Math.random() * 1 + 5));
		this.particles[this.particles.length - 1].opacity = 0.25;
	}
	for(var i = 0; i < this.particles.length; i ++) {
		this.particles[i].exist();
		if(this.particles[i].splicing) {
			this.particles.splice(i, 1);
			continue;
		}
	}
};
function MeleeWeapon(modifier) {
	Weapon.call(this, modifier);
	this.attackSpeed = (this.modifier === "none") ? "normal" : (this.modifier === "light" ? "fast" : "slow");
	this.attackSpeed = "normal";
};
inheritsFrom(MeleeWeapon, Weapon);
MeleeWeapon.prototype.attack = function() {
	if(p.onScreen === "play") {
		p.attackingWith = this;
	}
	else if(p.onScreen === "how") {
		howChar.attackingWith = this;
	}
};
function Dagger(modifier) {
	MeleeWeapon.call(this, modifier);
	this.damLow = p.class === "warrior" ? 60 : 50;
	this.damHigh = p.class === "warrior" ? 80 : 70;
	this.range = 30;
	this.power = 2;
};
inheritsFrom(Dagger, MeleeWeapon);
Dagger.prototype.getDesc = function() {
	var desc = [
		{
			content: ((this.modifier === "none") ? "" : this.modifier.substr(0, 1).toUpperCase() + this.modifier.substr(1, this.modifier.length) + " ")
			+ "Dagger" +
			((this.element === "none") ? "" : (" of " + this.element.substr(0, 1).toUpperCase() + this.element.substr(1, this.element.length))),
			font: "bold 10pt Cursive",
			color: "rgb(255, 255, 255)"
		},
		{
			content: "Damage: " + this.damLow + "-" + this.damHigh,
			font: "10pt monospace",
			color: (this.modifier === "none") ? "rgb(255, 255, 255)" : (this.modifier === "light" ? "rgb(255, 0, 0)" : "rgb(50, 255, 50)")
		},
		{
			content: "Range: Very Short",
			font: "10pt monospace",
			color: "rgb(255, 255, 255)"
		},
		{
			content: "Attack Speed: " + this.attackSpeed.substr(0, 1).toUpperCase() + this.attackSpeed.substr(1, Infinity),
			font: "10pt monospace",
			color: "rgb(255, 255, 255)"
		},
		{
			content: "A small dagger, the kind used for stabbing in the dark.",
			font: "10pt Cursive",
			color: "rgb(150, 150, 150)"
		}
	];
	return desc;
};
Dagger.prototype.display = function(type) {
	type = type || "item";
	c.fillStyle = "rgb(139, 69, 19)";
	if(type !== "attacking") {
		c.translate(-13, 13);
		c.rotate(0.7853);
	}
	c.beginPath();
	c.moveTo(-1, -3);
	c.lineTo(1, -3);
	c.lineTo(3, -10);
	c.lineTo(-3, -10);
	c.fill();
	c.fillStyle = "rgb(255, 255, 255)";
	c.beginPath();
	c.moveTo(-3, -10);
	c.lineTo(3, -10);
	c.lineTo(0, -30);
	c.fill();
};
function Sword(modifier) {
	MeleeWeapon.call(this, modifier);
	this.damLow = p.class === "warrior" ? 80 : 70;
	this.damHigh = p.class === "warrior" ? 110 : 100;
	this.range = 60;
	this.power = 3;
};
inheritsFrom(Sword, MeleeWeapon);
Sword.prototype.display = function(type) {
	type = type || "item";
	if(type === "holding" || type === "item") {
		c.globalAlpha = (this.opacity < 0) ? 0 : this.opacity;
		c.fillStyle = "rgb(139, 69, 19)";
		c.translate(-20, 20);
		c.rotate(0.7853);
		c.beginPath();
		c.moveTo(0, 0);
		c.lineTo(-5, -10);
		c.lineTo(5, -10);
		c.lineTo(0, 0);
		c.fill();
		c.fillStyle = "rgb(255, 255, 255)";
		c.beginPath();
		c.moveTo(-3, -10);
		c.lineTo(3, -10);
		c.lineTo(0, -60);
		c.fill();
		c.globalAlpha = 1;
	}
	else if(type === "attacking") {
		c.fillStyle = "rgb(139, 69, 19)";
		c.globalAlpha = (this.opacity < 0) ? 0 : this.opacity;
		c.beginPath();
		c.moveTo(0, 0);
		c.lineTo(-5, -10);
		c.lineTo(5, -10);
		c.lineTo(0, 0);
		c.fill();
		c.fillStyle = "rgb(255, 255, 255)";
		c.beginPath();
		c.moveTo(-3, -10);
		c.lineTo(3, -10);
		c.lineTo(0, -60);
		c.fill();
		c.globalAlpha = 1;
	}
};
Sword.prototype.getDesc = function() {
	var desc = [
		{
			content: ((this.modifier === "none") ? "" : this.modifier.substr(0, 1).toUpperCase() + this.modifier.substr(1, this.modifier.length) + " ")
			+ "Sword" +
			((this.element === "none") ? "" : (" of " + this.element.substr(0, 1).toUpperCase() + this.element.substr(1, this.element.length))),
			font: "bold 10pt Cursive",
			color: "rgb(255, 255, 255)"
		},
		{
			content: "Damage: " + this.damLow + "-" + this.damHigh,
			font: "10pt monospace",
			color: "rgb(255, 255, 255)"
		},
		{
			content: "Range: Short",
			font: "10pt monospace",
			color: "rgb(255, 255, 255)"
		},
		{
			content: "Attack Speed: " + this.attackSpeed.substr(0, 1).toUpperCase() + this.attackSpeed.substr(1, Infinity),
			font: "10pt monospace",
			color: "rgb(255, 255, 255)"
		},
		{
			content: "A nice, solid weapon.",
			font: "10pt Cursive",
			color: "rgb(150, 150, 150)"
		}
	];
	return desc;
};
function Spear(modifier) {
	MeleeWeapon.call(this, modifier);
	this.damLow = p.class === "warrior" ? 80 : 70;
	this.damHigh = p.class === "warrior" ? 110 : 100;
	this.range = 60;
	this.power = 3;
};
inheritsFrom(Spear, MeleeWeapon);
Spear.prototype.display = function(type) {
	type = type || "item";
	c.save();
	if(type !== "attacking") {
		c.translate(-5, 5);
		c.rotate(45 / 180 * Math.PI);
	}
	else {
		c.translate(0, 5);
		c.scale(1, 1.5);
	}
	c.fillStyle = "rgb(139, 69, 19)";
	c.fillRect(-2, -20, 4, 40);
	c.fillStyle = "rgb(255, 255, 255)";
	c.beginPath();
	c.moveTo(-6, -18);
	c.lineTo(0, -20);
	c.lineTo(6, -18);
	c.lineTo(0, -35);
	c.fill();
	c.restore();
};
Spear.prototype.getDesc = function() {
	return [
		{
			content: ((this.modifier === "none") ? "" : this.modifier.substr(0, 1).toUpperCase() + this.modifier.substr(1, this.modifier.length) + " ")
			+ "Spear" +
			((this.element === "none") ? "" : (" of " + this.element.substr(0, 1).toUpperCase() + this.element.substr(1, this.element.length))),
			font: "bold 10pt Cursive",
			color: "rgb(255, 255, 255)"
		},
		{
			content: "Damage: " + this.damLow + "-" + this.damHigh,
			font: "10pt monospace",
			color: "rgb(255, 255, 255)"
		},
		{
			content: "Range: Short",
			font: "10pt monospace",
			color: "rgb(255, 255, 255)"
		},
		{
			content: "Attack Speed: " + this.attackSpeed.substr(0, 1).toUpperCase() + this.attackSpeed.substr(1, Infinity),
			font: "10pt monospace",
			color: "rgb(255, 255, 255)"
		},
		{
			content: "It's a spear. You can stab people with it",
			font: "10pt Cursive",
			color: "rgb(150, 150, 150)"
		}
	];
};
function Mace(modifier) {
	MeleeWeapon.call(this, modifier);
	this.damLow = 120;
	this.damHigh = 150;
	this.attackSpeed = "slow";
	this.power = 4;
};
inheritsFrom(Mace, MeleeWeapon);
Mace.prototype.display = function(type) {
	type = type || "item";
	if(type === "item" || type === "holding") {
		c.fillStyle = "rgb(60, 60, 60)";
		c.strokeStyle = "rgb(60, 60, 60)";
		//spikeball
		c.beginPath();
		c.arc(10, 0, 10, 0, 2 * Math.PI);
		c.fill();
		for(var r = 0; r < 360; r += (360 / 6)) {
			c.save();
			c.translate(10, 0);
			c.rotate(Math.rad(r));
			c.beginPath();
			c.moveTo(-5, 0);
			c.lineTo(5, 0);
			c.lineTo(0, -20);
			c.fill();
			c.restore();
		}
		//handle
		c.save();
		c.translate(-20, 0);
		c.rotate(Math.rad(45));
		c.fillRect(-2, -5, 4, 10);
		c.restore();
		//chain
		c.lineWidth = 2;
		c.beginPath();
		c.arc(-15, -3, 3, 0, 2 * Math.PI);
		c.arc(-10, -6, 3, 0, 2 * Math.PI);
		c.arc(-5, -6, 3, 0, 2 * Math.PI);
		c.stroke();
	}
};
Mace.prototype.getDesc = function() {
	return [
		{
			content: ((this.modifier === "none") ? "" : this.modifier.substr(0, 1).toUpperCase() + this.modifier.substr(1, this.modifier.length) + " ")
			+ "Mace" +
			((this.element === "none") ? "" : (" of " + this.element.substr(0, 1).toUpperCase() + this.element.substr(1, this.element.length))),
			font: "bold 10pt Cursive",
			color: "rgb(255, 255, 255)"
		},
		{
			content: "Damage: " + this.damLow + "-" + this.damHigh,
			font: "10pt monospace",
			color: "rgb(255, 255, 255)"
		},
		{
			content: "Range: Short",
			font: "10pt monospace",
			color: "rgb(255, 255, 255)"
		},
		{
			content: "Attack Speed: " + this.attackSpeed.substr(0, 1).toUpperCase() + this.attackSpeed.substr(1, Infinity),
			font: "10pt monospace",
			color: "rgb(255, 255, 255)"
		},
		{
			content: "This giant spiked ball on a chain will cause some serious damage, but it's weight makes it slow to use.",
			font: "10pt Cursive",
			color: "rgb(150, 150, 150)"
		}
	];
};

function RangedWeapon(modifier) {
	Weapon.call(this, modifier);
};
inheritsFrom(RangedWeapon, Weapon);
function Arrow(quantity) {
	RangedWeapon.call(this);
	this.quantity = quantity;
	this.damLow = "depends on what bow you use";
	this.damHigh = "depends on what bow you use";
	this.stackable = true;
};
inheritsFrom(Arrow, RangedWeapon);
Arrow.prototype.display = function(type) {
	type = type || "item";
	if(type === "item" || type === "holding") {
		c.strokeStyle = "rgb(139, 69, 19)";
		c.lineWidth = 4;
		c.beginPath();
		c.moveTo(10, -10);
		c.lineTo(-10, 10);
		c.stroke();
		c.fillStyle = "rgb(255, 255, 255)";
		c.moveTo(10, -10);
		c.lineTo(10, -10 + 8);
		c.lineTo(20, -20);
		c.lineTo(10 - 8, -10);
		c.fill();
		c.lineWidth = 1;
		c.strokeStyle = "rgb(139, 69, 19)";
		for(var x = 0; x < 10; x += 3) {
			c.beginPath();
			c.moveTo(-x, x);
			c.lineTo(-x, x + 8);
			c.stroke();
			c.beginPath();
			c.moveTo(-x, x);
			c.lineTo(-x - 8, x);
			c.stroke();
		}
	}
};
Arrow.prototype.getDesc = function() {
	return [
		{
			content: "Arrow [" + this.quantity + "]",
			font: "bolder 10pt Cursive",
			color: "rgb(255, 255, 255)"
		},
		{
			content: "It's an arrow. You can shoot it with a bow",
			font: "10pt Cursive",
			color: "rgb(150, 150, 150)"
		}
	];
};
function WoodBow(modifier) {
	RangedWeapon.call(this, modifier);
	this.damLow = p.class === "archer" ? 80 : 70;
	this.damHigh = p.class === "archer" ? 110 : 100;
	this.range = "long";
	this.power = 3;
	/*
	ranges: very short (daggers), short (swords), medium (forceful bows), long (bows & forceful longbows), very long (longbows & distant bows), super long (distant longbows)
	*/
};
inheritsFrom(WoodBow, RangedWeapon);
WoodBow.prototype.display = function(type) {
	type = type || "item";
	if(type === "holding" || type === "item") {
		c.strokeStyle = "rgb(139, 69, 19)";
		c.lineWidth = 4;
		c.beginPath();
		c.arc(-15, 15, 30, 1.5 * Math.PI - 0.2, 2 * Math.PI + 0.2);
		c.stroke();
		c.lineWidth = 1;
		c.beginPath();
		c.moveTo(-20, -17);
		c.lineTo(17, 20);
		c.stroke();
	}
	else if(type === "aiming") {
		c.strokeStyle = "rgb(139, 69, 19)";
		c.lineWidth = 4;
		c.beginPath();
		c.arc(-25, 0, 30, -0.25 * Math.PI - 0.2, 0.25 * Math.PI + 0.2);
		c.stroke();
		c.lineWidth = 1;
		c.beginPath();
		c.moveTo(-7, -22);
		c.lineTo(-7, 22);
		c.stroke();
	}
};
WoodBow.prototype.getDesc = function() {
	return [
		{
			content: ((this.modifier === "none") ? "" : this.modifier.substr(0, 1).toUpperCase() + this.modifier.substr(1, this.modifier.length) + " ") + "Wooden Bow" + ((this.element === "none") ? "" : " of " + this.element.substr(0, 1).toUpperCase() + this.element.substr(1, this.element.length)),
			font: "bolder 10pt Cursive",
			color: "rgb(255, 255, 255)"
		},
		{
			content: "Damage: " + this.damLow + "-" + this.damHigh,
			font: "10pt monospace",
			color: "rgb(255, 255, 255)"
		},
		{
			content: "Range: " + this.range.substr(0, 1).toUpperCase() + this.range.substr(1, Infinity),
			font: "10pt monospace",
			color: "rgb(255, 255, 255)"
		},
		{
			content: "It's a bow. You can shoot arrows with it.",
			font: "10pt Cursive",
			color: "rgb(150, 150, 150)"
		}
	];
};
function MetalBow(modifier) {
	RangedWeapon.call(this, modifier);
	this.damLow = p.class === "archer" ? 110 : 100;
	this.damHigh = p.class === "archer" ? 130 : 120;
	this.range = "long";
	this.power = 4;
};
inheritsFrom(MetalBow, RangedWeapon);
MetalBow.prototype.display = function(type) {
	type = type || "item";
	if(type === "holding" || type === "item") {
		c.strokeStyle = "rgb(200, 200, 200)";
		c.lineWidth = 4;
		c.beginPath();
		c.arc(-15, 15, 30, 1.5 * Math.PI - 0.2, 2 * Math.PI + 0.2);
		c.stroke();
		c.lineWidth = 1;
		c.beginPath();
		c.moveTo(-20, -17);
		c.lineTo(17, 20);
		c.stroke();
	}
	else if(type === "aiming") {
		c.strokeStyle = "rgb(200, 200, 200)";
		c.lineWidth = 4;
		c.beginPath();
		c.arc(-25, 0, 30, -0.25 * Math.PI - 0.2, 0.25 * Math.PI + 0.2);
		c.stroke();
		c.lineWidth = 1;
		c.beginPath();
		c.moveTo(-7, -22);
		c.lineTo(-7, 22);
		c.stroke();
	}
};
MetalBow.prototype.getDesc = function() {
	return [
		{
			content: ((this.modifier === "none") ? "" : this.modifier.substr(0, 1).toUpperCase() + this.modifier.substr(1, this.modifier.length) + " ") + "Metal Bow" + ((this.element === "none") ? "" : " of " + this.element.substr(0, 1).toUpperCase() + this.element.substr(1, this.element.length)),
			font: "bolder 10pt Cursive",
			color: "rgb(255, 255, 255)"
		},
		{
			content: "Damage: " + this.damLow + "-" + this.damHigh,
			font: "10pt monospace",
			color: "rgb(255, 255, 255)"
		},
		{
			content: "Range: Long",
			font: "10pt monospace",
			color: "rgb(255, 255, 255)"
		},
		{
			content: "The reinforced metal on this bow makes it slightly stronger than it's wooden counterpart.",
			font: "10pt Cursive",
			color: "rgb(150, 150, 150)"
		}
	];
};
function MechBow(modifier) {
	RangedWeapon.call(this, modifier);
	this.attackSpeed = "fast";
	this.range = "long";
	this.damLow = (p.class === "archer") ? 70 : 60;
	this.damHigh = (p.class === "archer") ? 100 : 90;
	this.power = 4;
};
inheritsFrom(MechBow, RangedWeapon);
MechBow.prototype.display = function(type) {
	type = type || "item";
	c.save();
	if(type === "aiming") {
		c.translate(-10, 0);
		c.scale(0.9, 0.9);
		c.rotate(Math.rad(45));
	}
	c.strokeStyle = "rgb(200, 200, 200)";
	c.lineWidth = 4;
	c.beginPath();
	c.arc(-5, 5, 23, 1.25 * Math.PI - 0.2, 2.25 * Math.PI + 0.2);
	c.stroke();
	c.lineWidth = 1;
	//bowstring
	c.beginPath();
	c.moveTo(-22, -13);
	c.lineTo(13, 22);
	c.stroke();
	// bowstring holders
	c.beginPath();
	c.moveTo(-5, 5);
	c.lineTo(5, -17);
	c.moveTo(-5, 5);
	c.lineTo(17, -5);
	c.stroke();
	c.fillStyle = "rgb(210, 210, 210)";
	//2nd bowstring
	c.beginPath();
	c.moveTo(-13, -15);
	c.lineTo(15, 13);
	c.stroke();
	//gears
	c.save();
	c.translate(12, 2);
	c.beginPath();
	c.arc(0, 0, 4, 0, 2 * Math.PI);
	c.fill();
	for(var r = 0; r <= 360; r += 45) {
		c.save();
		c.rotate(Math.rad(r));
		c.fillRect(-1, -6, 2, 6);
		c.restore();
	}
	c.restore();
	c.save();
	c.translate(-2, -12);
	c.beginPath();
	c.arc(0, 0, 4, 0, 2 * Math.PI);
	c.fill();
	for(var r = 0; r <= 360; r += 45) {
		c.save();
		c.rotate(Math.rad(r));
		c.fillRect(-1, -6, 2, 6);
		c.restore();
	}
	c.restore();
	c.restore();
};
MechBow.prototype.getDesc = function() {
	return [
		{
			content: ((this.modifier === "none") ? "" : this.modifier.substr(0, 1).toUpperCase() + this.modifier.substr(1, this.modifier.length) + " ") + "Mechanical Bow" + ((this.element === "none") ? "" : " of " + this.element.substr(0, 1).toUpperCase() + this.element.substr(1, this.element.length)),
			font: "bolder 10pt Cursive",
			color: "rgb(255, 255, 255)"
		},
		{
			content: "Damage: " + this.damLow + "-" + this.damHigh,
			font: "10pt monospace",
			color: "rgb(255, 255, 255)"
		},
		{
			content: "Range: " + this.range.substr(0, 1).toUpperCase() + this.range.substr(1, Infinity).toLowerCase(),
			font: "10pt monospace",
			color: "rgb(255, 255, 255)"
		},
		{
			content: "Firing Speed: Fast",
			font: "10pt monospace",
			color: "rgb(255, 255, 255)"
		},
		{
			content: "This automated crossbow-like device can shoot arrows much faster than regular ones.",
			font: "10pt Cursive",
			color: "rgb(150, 150, 150)"
		}
	]
};
function LongBow(modifier) {
	RangedWeapon.call(this, modifier);
	this.range = "very long";
	this.damLow = (p.class === "archer") ? 90 : 80;
	this.damHigh = (p.class === "archer") ? 100 : 90;
	this.power = 5;
};
inheritsFrom(LongBow, RangedWeapon);
LongBow.prototype.display = function(type) {
	type = type || "item";
	c.save();
	if(type === "aiming") {
		c.translate(-10, 0);
		c.scale(0.9, 0.9);
		c.rotate(Math.rad(45));
	}
	c.strokeStyle = "rgb(139, 69, 19)";
	c.lineWidth = 4;
	c.beginPath();
	c.arc(-5, 5, 23, 1.25 * Math.PI - 0.2, 2.25 * Math.PI + 0.2);
	c.stroke();
	c.lineWidth = 1;
	//bowstring
	c.beginPath();
	c.moveTo(-22, -13);
	c.lineTo(13, 22);
	c.stroke();
	//2nd bowstring
	c.beginPath();
	c.moveTo(-13, -15);
	c.lineTo(15, 13);
	c.stroke();
	c.restore();
};
LongBow.prototype.getDesc = function() {
	return [
		{
			content: ((this.modifier === "none") ? "" : this.modifier.substr(0, 1).toUpperCase() + this.modifier.substr(1, this.modifier.length) + " ") + "Longbow" + ((this.element === "none") ? "" : " of " + this.element.substr(0, 1).toUpperCase() + this.element.substr(1, this.element.length)),
			font: "bolder 10pt Cursive",
			color: "rgb(255, 255, 255)"
		},
		{
			content: "Damage: " + this.damLow + "-" + this.damHigh + " [more if farther away]",
			font: "10pt monospace",
			color: "rgb(255, 255, 255)"
		},
		{
			content: "Firing Speed: Slow",
			font: "10pt monospace",
			color: "rgb(255, 255, 255)"
		},
		{
			content: "Range: " + this.range.substr(0, 1).toUpperCase() + this.range.substr(1, Infinity),
			font: "10pt monospace",
			color: "rgb(255, 255, 255)"
		},
		{
			content: "This large bow can shoot over an immense distance, and, surprisingly, hurts enemies more if shot from farther away.",
			font: "10pt Cursive",
			color: "rgb(150, 150, 150)"
		}
	];
};

function MagicWeapon(modifier) {
	Weapon.call(this, modifier);
};
inheritsFrom(MagicWeapon, Weapon);
function EnergyStaff(modifier) {
	MagicWeapon.call(this, modifier);
	this.chargeType = "energy";
	this.manaCost = (this.modifier === "none") ? 40 : (this.modifier === "arcane" ? 50 : 30);
	this.damLow = (p.class === "mage") ? 80 : 70; // 47.5 damage average with 1/2 damage nerf
	this.damHigh = (p.class === "mage") ? 110 : 100;
	this.power = 3;
};
inheritsFrom(EnergyStaff, MagicWeapon);
EnergyStaff.prototype.display = function(type) {
	type = type || "item";
	c.strokeStyle = "rgb(139, 69, 19)";
	c.save();
	c.lineWidth = 4;
	if(type === "holding" || type === "item") {
		c.rotate(45 / 180 * Math.PI);
	}
	c.beginPath();
	c.moveTo(0, -10);
	c.lineTo(0, 30);
	c.stroke();
	c.beginPath();
	c.arc(0, -14, 5, 0.5 * Math.PI, 1 * Math.PI, true);
	c.stroke();
	c.restore();
};
EnergyStaff.prototype.getDesc = function() {
	return [
		{
			content: (this.modifier === "none" ? "" : this.modifier.substr(0, 1).toUpperCase() + this.modifier.substr(1, this.modifier.length) + " ") + "Staff of Energy",
			font: "bolder 10pt Cursive",
			color: "rgb(255, 255, 255)"
		},
		{
			content: "Damage: " + this.damLow + "-" + this.damHigh,
			font: "10pt monospace",
			color: "rgb(255, 255, 255)"
		},
		{
			content: "Mana Cost: " + this.manaCost,
			font: "10pt monospace",
			color: "rgb(255, 255, 255)"
		},
		{
			content: "Shoots a bolt of magical energy.",
			font: "10pt Cursive",
			color: "rgb(150, 150, 150)"
		}
	];
};
function ElementalStaff(modifier) {
	MagicWeapon.call(this, modifier);
	this.element = "none";
	this.manaCost = (this.modifier === "none") ? 30 : (this.modifier === "arcane" ? 40 : 20);
	this.damLow = (p.class === "mage") ? 60 : 50;
	this.damHigh = (p.class === "mage") ? 90 : 80;
	this.power = 4;
};
inheritsFrom(ElementalStaff, MagicWeapon);
ElementalStaff.prototype.display = function(type) {
	type = type || "item";
	c.strokeStyle = "rgb(139, 69, 19)";
	c.fillStyle = "rgb(139, 69, 19)";
	c.save();
	c.lineWidth = 4;
	if(type === "holding" || type === "item") {
		c.rotate(45 / 180 * Math.PI);
	}
	//staff base
	c.beginPath();
	c.moveTo(0, -7);
	c.lineTo(0, 30);
	c.stroke();
	//staff top
	c.beginPath();
	c.moveTo(0, -10);
	c.lineTo(7, -17);
	c.lineTo(0, -20);
	c.lineTo(-7, -17);
	c.lineTo(-7 - 5, -17);
	c.lineTo(0, -20 - 5);
	c.lineTo(7 + 5, -17);
	c.lineTo(0, -10 + 5)
	c.lineTo(-7 - 5, -17);
	c.lineTo(-7, -17);
	c.fill();
	//crystal
	if(this.element !== "none") {
		if(this.element === "fire") {
			c.fillStyle = "rgb(255, 100, 0)";
			c.strokeStyle = "rgb(255, 0, 0)";
		}
		else if(this.element === "water") {
			c.fillStyle = "rgb(0, 255, 255)";
			c.strokeStyle = "rgb(0, 128, 255)";
		}
		else if(this.element === "earth") {
			c.fillStyle = "rgb(0, 128, 128)";
			c.strokeStyle = "rgb(0, 128, 0)";
		}
		else if(this.element === "air") {
			c.fillStyle = "rgb(150, 150, 150)";
			c.strokeStyle = "rgb(220, 220, 220)";
		}
		c.lineWidth = 1;
		c.beginPath();
		c.moveTo(0, -10);
		c.lineTo(7, -17);
		c.lineTo(0, -20);
		c.lineTo(-7, -17);
		c.lineTo(0, -10);
		c.fill();
		c.stroke();
		c.beginPath();
		c.moveTo(0, -10);
		c.lineTo(0, -20);
		c.stroke();
	}
	c.restore();
	//update charge type
	if(this.element !== "none") {
		this.chargeType = this.element;
	}
};
ElementalStaff.prototype.getDesc = function() {
	if(this.element === "none") {
		return [
			{
				content: "Wooden Staff",
				font: "bolder 10pt Cursive",
				color: "rgb(255, 255, 255)"
			},
			{
				content: "This staff has no magical properties. It can, however, be infused with crystals to create an elemental staff",
				font: "10pt Cursive",
				color: "rgb(150, 150, 150)"
			}
		];
	}
	else if(this.element === "fire") {
		return [
			{
				content: ((this.modifier === "none") ? "" : this.modifier.substr(0, 1).toUpperCase() + this.modifier.substr(1, this.modifier.length) + " ") + "Staff of Fire",
				font: "bolder 10pt Cursive",
				color: "rgb(255, 255, 255)"
			},
			{
				content: "Damage: " + this.damLow + "-" + this.damHigh,
				font: "10pt monospace",
				color: "rgb(255, 255, 255)"
			},
			{
				content: "Mana Cost: " + this.manaCost,
				font: "10pt monospace",
				color: "rgb(255, 255 255)"
			},
			{
				content: "Allows the user to shoot an enhanced fireball.",
				font: "10pt Cursive",
				color: "rgb(150, 150, 150)"
			}
		];
	}
	else if(this.element === "water") {
		return [
			{
				content: ((this.modifier === "none") ? "" : this.modifier.substr(0, 1).toUpperCase() + this.modifier.substr(1, this.modifier.length) + " ") + "Staff of Water",
				font: "bolder 10pt Cursive",
				color: "rgb(255, 255, 255)"
			},
			{
				content: "Damage: " + this.damLow + "-" + this.damHigh,
				font: "10pt monospace",
				color: "rgb(255, 255, 255)"
			},
			{
				content: "Mana Cost: " + this.manaCost,
				font: "10pt monospace",
				color: "rgb(255, 255 255)"
			},
			{
				content: "Allows the user to shoot a freezing water projectile",
				font: "10pt Cursive",
				color: "rgb(150, 150, 150)"
			}
		];
	}
	else if(this.element === "earth") {
		return [
			{
				content: ((this.modifier === "none") ? "" : this.modifier.substr(0, 1).toUpperCase() + this.modifier.substr(1, this.modifier.length) + " ") + "Staff of Earth",
				font: "bolder 10pt Cursive",
				color: "rgb(255, 255, 255)"
			},
			{
				content: "Damage: " + this.damLow + "-" + this.damHigh,
				font: "10pt monospace",
				color: "rgb(255, 255, 255)"
			},
			{
				content: "Mana Cost: " + this.manaCost,
				font: "10pt monospace",
				color: "rgb(255, 255 255)"
			},
			{
				content: "Allows the user to cause cave-ins",
				font: "10pt Cursive",
				color: "rgb(150, 150, 150)"
			}
		];
	}
	else if(this.element === "air") {
		return [
			{
				content: ((this.modifier === "none") ? "" : this.modifier.substr(0, 1).toUpperCase() + this.modifier.substr(1, this.modifier.length) + " ") + "Staff of Air",
				font: "bolder 10pt Cursive",
				color: "rgb(255, 255, 255)"
			},
			{
				content: "Damage: " + this.damLow + "-" + this.damHigh,
				font: "10pt monospace",
				color: "rgb(255, 255, 255)"
			},
			{
				content: "Mana Cost: " + this.manaCost,
				font: "10pt monospace",
				color: "rgb(255, 255 255)"
			},
			{
				content: "Allows the user to shoot a burst of strengthened wind",
				font: "10pt Cursive",
				color: "rgb(150, 150, 150)"
			}
		];
	}
};
function ChaosStaff(modifier) {
	MagicWeapon.call(this, modifier);
	this.hpCost = 30;
	this.damLow = 0;
	this.damHigh = 0;
	this.chargeType = "chaos";
	this.power = 2;
};
inheritsFrom(ChaosStaff, MagicWeapon);
ChaosStaff.prototype.display = function(type) {
	type = type || "item";
	c.strokeStyle = "rgb(139, 69, 19)";
	c.save();
	c.lineWidth = 4;
	if(type === "holding" || type === "item") {
		c.rotate(45 / 180 * Math.PI);
	}
	c.beginPath();
	c.moveTo(0, -10);
	c.lineTo(0, 30);
	c.lineTo(-5, 30);
	c.stroke();
	c.beginPath();
	c.moveTo(0, -10);
	c.lineTo(-5, -15);
	c.moveTo(0, -10);
	c.lineTo(5, -15);
	c.lineTo(10, -10);
	c.stroke();
	c.restore();
};
ChaosStaff.prototype.getDesc = function() {
	return [
		{
			content: ((this.modifier === "none") ? "" : this.modifier.substr(0, 1).toUpperCase() + this.modifier.substr(1, this.modifier.length) + " ") + "Staff of Chaos",
			font: "bolder 10pt Cursive",
			color: "rgb(255, 255, 255)"
		},
		{
			content: "Health Cost: " + this.hpCost,
			font: "10pt monospace",
			color: "rgb(255, 255, 255)"
		},
		{
			content: "This volatile staff of anarchy causes rips in spacetime, creating unpredictable consequences at a high cost to the user.",
			font: "10pt Cursive",
			color: "rgb(150, 150, 150)"
		}
	];
};

//equipables
function Equipable(modifier) {
	Item.call(this);
	this.equipable = true;
	this.modifier = modifier || "none";
};
inheritsFrom(Equipable, Item);
function WizardHat(modifier) {
	Equipable.call(this, modifier);
	this.defLow = (this.modifier === "none") ? 5 : (this.modifier === "empowering" ? 0 : 10);
	this.defHigh = (this.modifier === "none") ? 10 : (this.modifier === "empowering" ? 5 : 15);
	this.manaRegen = (this.modifier === "none") ? 15 : (this.modifier === "empowering" ? 20 : 10);
	this.power = 3;
};
inheritsFrom(WizardHat, Equipable);
WizardHat.prototype.display = function() {
	c.fillStyle = "rgb(109, 99, 79)";
	c.beginPath();
	c.moveTo(-30, 20);
	c.lineTo(30, 20);
	c.lineTo(10, 15);
	c.lineTo(0, -20);
	c.lineTo(-10, 15);
	c.fill();
};
WizardHat.prototype.getDesc = function() {
	return [
		{
			content: ((this.modifier === "none") ? "" : this.modifier.substr(0, 1).toUpperCase() + this.modifier.substr(1, Infinity) + " ") + "Wizard Hat",
			color: "rgb(255, 255, 255)",
			font: "bolder 10pt Cursive"
		},
		{
			content: "Defense: " + this.defLow + "-" + this.defHigh,
			color: "rgb(255, 255, 255)",
			font: "10pt monospace"
		},
		{
			content: "Mana Regen: " + this.manaRegen + "%",
			color: "rgb(255, 255, 255)",
			font: "10pt monospace"
		},
		{
			content: "An old, weathered pointy hat.",
			color: "rgb(150, 150, 150)",
			font: "10pt Cursive"
		}
	];
};
function MagicQuiver(modifier) {
	Equipable.call(this, modifier);
	this.defLow = (this.modifier === "sturdy") ? 5 : 0;
	this.defHigh = (this.modifier === "none") ? 5 : (this.modifier === "empowering" ? 0 : 10);
	this.arrowEfficiency = (this.modifier === "none") ? 15 : (this.modifier === "empowering" ? 20 : 10);
	this.power = 2;
};
inheritsFrom(MagicQuiver, Equipable);
MagicQuiver.prototype.display = function() {
	c.save();
	c.fillStyle = "rgb(139, 69, 19)";
	c.translate(-5, 5);
	c.rotate(45 / 180 * Math.PI);
	c.fillRect(-10, -20, 20, 40);
	c.beginPath();
	c.arc(0, 20, 10, 0, 2 * Math.PI);
	c.fill();
	c.translate(-p.worldX, -p.worldY);
	new ShotArrow(-3, -20, 0, -2).exist();
	new ShotArrow(3, -30, 0, -2).exist();
	c.restore();
};
MagicQuiver.prototype.getDesc = function() {
	return [
		{
			content: ((this.modifier === "none") ? "" : this.modifier.substr(0, 1).toUpperCase() + this.modifier.substr(1, Infinity) + " ") + "Magic Quiver",
			color: "rgb(255, 255, 255)",
			font: "bolder 10pt Cursive"
		},
		{
			content: "Defense: " + ((this.defHigh > 0) ? (this.defLow + "-" + this.defHigh) : this.defHigh),
			color: "rgb(255, 255, 255)",
			font: "10pt monospace"
		},
		{
			content: "Arrow Efficiency: " + this.arrowEfficiency + "%",
			color: "rgb(255, 255, 255)",
			font: "10pt monospace"
		},
		{
			content: "For some reason, arrows placed inside this quiver are able to be shot multiple times.",
			color: "rgb(150, 150, 150)",
			font: "10pt Cursive"
		}
	];
};
function Helmet(modifier) {
	Equipable.call(this, modifier);
	this.defLow = (this.modifier === "none") ? 20 : (this.modifier === "empowering" ? 10 : 30);
	this.defHigh = (this.modifier === "none") ? 30 : (this.modifier === "empowering" ? 20 : 40);
	this.healthRegen = (this.modifier === "none") ? 15 : (this.modifier === "empowering" ? 20 : 10);
	this.power = 3;
};
inheritsFrom(Helmet, Equipable);
Helmet.prototype.display = function() {
	c.save();
	c.translate(0, -7);
	c.scale(0.4, 0.4);
	c.fillStyle = "rgb(170, 170, 170)";
	c.fillRect(-40, -10, 80, 70);
	c.fillStyle = "rgb(200, 200, 200)";
	c.beginPath();
	c.moveTo(-60, -40);
	c.lineTo(-60, 80);
	c.lineTo(-10, 90);
	c.lineTo(-10, 40);
	c.lineTo(-30, 30);
	c.lineTo(-30, -10);
	c.lineTo(0, 0);
	c.lineTo(30, -10);
	c.lineTo(30, 30);
	c.lineTo(10, 40);
	c.lineTo(10, 90);
	c.lineTo(60, 80);
	c.lineTo(60, -40);
	c.lineTo(0, -50);
	c.fill();
	c.restore();
};
Helmet.prototype.getDesc = function() {
	return [
		{
			content: ((this.modifier === "none") ? "" : (this.modifier.substr(0, 1).toUpperCase() + this.modifier.substr(1, Infinity + " "))) + " Helmet of Regeneration",
			color: "rgb(255, 255, 255)",
			font: "bolder 10pt Cursive"
		},
		{
			content: "Defense: " + this.defLow + "-" + this.defHigh,
			color: "rgb(255, 255, 255)",
			font: "10pt monospace"
		},
		{
			content: "Health Regen: " + this.healthRegen + "%",
			color: "rgb(255, 255, 255)",
			font: "10pt monospace"
		},
		{
			content: "This helmet not only shields the user from harm, but also actively heals past wounds.",
			color: "rgb(150, 150, 150)",
			font: "10pt Cursive"
		}
	];
};

//extras
function Extra() {
	Item.call(this);
};
inheritsFrom(Extra, Item);
function Crystal() {
	Extra.call(this);
	this.consumed = false;
};
inheritsFrom(Crystal, Extra);

Crystal.prototype.graphics = function(type) {
	//called in the child's method 'display'
	if(type === "holding") {
		c.translate(0, 13);
	}
	c.lineWidth = 2;
	c.beginPath();
	c.moveTo(0, 0);
	c.lineTo(-15, -15);
	c.lineTo(15, -15);
	c.lineTo(0, 0);
	c.fill();
	c.stroke();
	c.beginPath();
	c.moveTo(0, 0);
	c.lineTo(-8, -15);
	c.lineTo(8, -15);
	c.lineTo(0, 0);
	c.stroke();
	c.beginPath();
	c.moveTo(-15, -15);
	c.lineTo(0, -23);
	c.lineTo(15, -15);
	c.fill();
	c.stroke();
	c.moveTo(-8, -15);
	c.lineTo(0, -23);
	c.lineTo(8, -15);
	c.stroke();
	c.beginPath();
	c.moveTo(0, 0);
	c.lineTo(0, -23);
	c.stroke();
};
Crystal.prototype.use = function() {
	p.guiOpen = "crystal-infusion";
	p.infusedGui = (this instanceof FireCrystal || this instanceof WaterCrystal) ? (this instanceof FireCrystal ? "fire" : "water") : (this instanceof EarthCrystal ? "earth" : "air");
	this.toBeConsumed = true;
};
function FireCrystal() {
	Crystal.call(this);
};
inheritsFrom(FireCrystal, Crystal);
FireCrystal.prototype.display = function(type) {
	type = type || "item";
	c.fillStyle = "rgb(255, 100, 0)";
	c.strokeStyle = "rgb(255, 0, 0)";
	this.graphics(type);
};
FireCrystal.prototype.getDesc = function() {
	return [
		{
			content: "Fire Crystal",
			font: "bolder 10pt Cursive",
			color: "rgb(255, 255, 255)"
		},
		{
			content: "Effect: Burning",
			font: "10pt monospace",
			color: "rgb(255, 255, 255)"
		},
		{
			content: "When a weapon is infused with power from this crystal, attacks will set enemies on fire.",
			font: "10pt Cursive",
			color: "rgb(150, 150, 150)"
		}
	];

};
function WaterCrystal() {
	Crystal.call(this);
};
inheritsFrom(WaterCrystal, Crystal);
WaterCrystal.prototype.display = function(type) {
	type = type || "item";
	c.fillStyle = "rgb(0, 255, 255)";
	c.strokeStyle = "rgb(0, 128, 255)";
	this.graphics(type);
};
WaterCrystal.prototype.getDesc = function() {
	return [
		{
			content: "Water Crystal",
			font: "bolder 10pt Cursive",
			color: "rgb(255, 255, 255)"
		},
		{
			content: "Effect: Freezing",
			font: "10pt monospace",
			color: "rgb(255, 255, 255)"
		},
		{
			content: "When a weapon is infused with power from this crystal, attacks will freeze water vapor, encasing enemies in ice.",
			font: "10pt Cursive",
			color: "rgb(150, 150, 150)"
		}
	];
};
function EarthCrystal() {
	Crystal.call(this);
};
inheritsFrom(EarthCrystal, Crystal);
EarthCrystal.prototype.display = function(type) {
	type = type || "item";
	c.fillStyle = "rgb(0, 128, 128)";
	c.strokeStyle = "rgb(0, 128, 0)";
	this.graphics(type);
};
EarthCrystal.prototype.getDesc = function() {
	return [
		{
			content: "Earth Crystal",
			font: "bolder 10pt Cursive",
			color: "rgb(255, 255, 255)"
		},
		{
			content: "Effect: Crushing",
			font: "10pt monospace",
			color: "rgb(255, 255, 255)"
		},
		{
			content: "When a weapon is infused with power from this crystal, attackis will crush enemies with a chunk of rock.",
			font: "10pt Cursive",
			color: "rgb(150, 150, 150)"
		},
	]
};
function Boulder(x, y, damage) {
	this.x = x;
	this.y = y;
	this.velY = 2;
	this.damage = damage;
	this.hitSomething = false;
	this.opacity = 1;
};
Boulder.prototype.exist = function() {
	var p1b = point3d(this.x + p.worldX - 40, this.y + p.worldY, 0.9);
	var p2b = point3d(this.x + p.worldX + 40, this.y + p.worldY, 0.9);
	var p3b = point3d(this.x + p.worldX, this.y + p.worldY - 100, 0.9);
	var p1f = point3d(this.x + p.worldX - 40, this.y + p.worldY, 1.1);
	var p2f = point3d(this.x + p.worldX + 40, this.y + p.worldY, 1.1);
	var p3f = point3d(this.x + p.worldX, this.y + p.worldY - 100, 1.1);
	c.fillStyle = "rgb(150, 150, 150)";
	c.globalAlpha = (this.opacity < 0) ? 0 : this.opacity;
	c.beginPath();
	c.moveTo(p1b.x, p1b.y);
	c.lineTo(p2b.x, p2b.y);
	c.lineTo(p2f.x, p2f.y);
	c.lineTo(p1f.x, p1f.y);
	c.fill();
	c.beginPath();
	c.moveTo(p2b.x, p2b.y);
	c.lineTo(p3b.x, p3b.y);
	c.lineTo(p3f.x, p3f.y);
	c.lineTo(p2f.x, p2f.y);
	c.fill();
	c.beginPath();
	c.moveTo(p1b.x, p1b.y);
	c.lineTo(p3b.x, p3b.y);
	c.lineTo(p3f.x, p3f.y);
	c.lineTo(p1f.x, p1f.y);
	c.fill();
	c.fillStyle = "rgb(110, 110, 110)";
	c.beginPath();
	c.moveTo(p1f.x, p1f.y);
	c.lineTo(p2f.x, p2f.y);
	c.lineTo(p3f.x, p3f.y);
	c.fill();
	if(!this.hitSomething) {
		this.velY += 0.1;
		this.y += this.velY;
		for(var i = 0; i < roomInstances[inRoom].content.length; i ++) {
			var thing = roomInstances[inRoom].content[i];
			if(thing instanceof Block && this.x + 40 > thing.x && this.x - 40 < thing.x + thing.w && this.y > thing.y && this.y < thing.y + 10) {
				this.hitSomething = true;
			}
			else if(thing instanceof Enemy && this.x + 40 > thing.x + thing.leftX && this.x - 40 < thing.x + thing.rightX && this.y > thing.y + thing.topY && this.y < thing.y + thing.bottomY && !this.hitAnEnemy) {
				thing.hurt(this.damage, true);
				this.hitAnEnemy = true;
			}
			if(this.x + p.worldX + 40 > p.x - 5 && this.x + p.worldX - 40 < p.x + 5 && this.y + p.worldY > p.y - 7 && this.y + p.worldY < p.y + 46 && !this.hitAPlayer) {
				p.hurt(this.damage, "a chunk of rock");
				this.hitAPlayer = true;
			}
		}
	}
	else {
		this.opacity -= 0.05;
	}
	if(this.opacity < 0) {
		this.splicing = true;
	}
};
function BoulderVoid(x, y) {
	this.x = x;
	this.y = y;
	this.opacity = 1;
};
BoulderVoid.prototype.exist = function() {
	var p1b = point3d(this.x + p.worldX - 40, this.y + p.worldY, 0.9);
	var p2b = point3d(this.x + p.worldX + 40, this.y + p.worldY, 0.9);
	var p3b = point3d(this.x + p.worldX, this.y + p.worldY - 100, 0.9);
	var p1f = point3d(this.x + p.worldX - 40, this.y + p.worldY, 1.1);
	var p2f = point3d(this.x + p.worldX + 40, this.y + p.worldY, 1.1);
	var p3f = point3d(this.x + p.worldX, this.y + p.worldY - 100, 1.1);
	c.save();
	c.globalAlpha = (this.opacity < 0) ? 0 : this.opacity;
	c.fillStyle = "rgb(110, 110, 110)";
	c.beginPath();
	c.lineTo(p1f.x, p1f.y);
	c.lineTo(p2f.x, p2f.y);
	c.lineTo(p2b.x, p2b.y);
	c.lineTo(p1b.x, p1b.y);
	c.fill();
	c.restore();
	var boulderExists = false;
	for(var i = 0; i < roomInstances[inRoom].content.length; i ++) {
		if(roomInstances[inRoom].content[i] instanceof Boulder) {
			boulderExists = true;
			break;
		}
	}
	if(!boulderExists) {
		this.opacity -= 0.05;
	}
	if(this.opacity < 0) {
		this.splicing = true;
	}
	boxFronts.push({
		type: "boulder void",
		opacity: this.opacity,
		pos1: {
			x: p1b.x,
			y: p1b.y
		},
		pos2: {
			x: p3b.x,
			y: p3b.y
		},
		pos3: {
			x: p3f.x,
			y: p3f.y
		},
		pos4: {
			x: p1f.x,
			y: p1f.y
		}
	});
	boxFronts.push({
		type: "boulder void",
		opacity: this.opacity,
		pos1: {
			x: p2b.x,
			y: p2b.y
		},
		pos2: {
			x: p3b.x,
			y: p3b.y
		},
		pos3: {
			x: p3f.x,
			y: p3f.y
		},
		pos4: {
			x: p2f.x,
			y: p2f.y
		}
	});
};
function AirCrystal() {
	Crystal.call(this);
};
inheritsFrom(AirCrystal, Crystal);
AirCrystal.prototype.display = function(type) {
	type = type || "item";
	c.fillStyle = "rgb(150, 150, 150)";
	c.strokeStyle = "rgb(220, 220, 220)";
	this.graphics(type);
};
AirCrystal.prototype.getDesc = function() {
	return [
		{
			content: "Air Crystal",
			font: "bolder 10pt Cursive",
			color: "rgb(255, 255, 255)"
		},
		{
			content: "Effect: Knockback",
			font: "10pt monospace",
			color: "rgb(255, 255, 255)"
		},
		{
			content: "When a weapon is infused with power from this crystal, attacks will be accompanied by a gust of wind, knocking enemies backward.",
			font: "10pt Cursive",
			color: "rgb(150, 150, 150)"
		}
	]
};
function WindBurst(x, y, dir, noDisplay) {
	this.x = x;
	this.y = y;
	this.dir = dir;
	this.velX = (dir === "right") ? 5 : -5
	this.noDisplay = noDisplay || false;
	this.opacity = 1;
};
WindBurst.prototype.exist = function() {
	// thingsToBeRendered.push(new RenderingObject(
	// 	this,
	// 	{
	// 		x: (this.dir == "right") ? this.x + p.worldX : this.x + p.worldX - 49,
	// 		y: this.y + p.worldY - 34,
	// 		w: 49,
	// 		h: 34
	// 	},
	// 	{
	// 		x: (this.dir == "right") ? this.x + p.worldX : this.x + p.worldX - 49,
	// 		y: this.y + p.worldY - 34,
	// 		w: 49,
	// 		h: 34,
	// 		z: 1
	// 	}
	// ));
	this.display();
	this.update();
};
WindBurst.prototype.display = function() {
	if(this.noDisplay) {
		return;
	}
	c.save();
	c.globalAlpha = (this.opacity < 0) ? 0 : this.opacity;
	c.strokeStyle = "rgb(150, 150, 150)";
	c.lineWidth = 4;
	c.translate(p.worldX, p.worldY);
	if(this.dir === "right") {
		//large wind graphic
		c.beginPath();
		c.moveTo(this.x, this.y);
		c.lineTo(this.x + 32, this.y);
		c.stroke();
		c.beginPath();
		c.arc(this.x + 32, this.y - 17, 17, Math.PI, 2.5 * Math.PI);
		c.stroke();
		//small wind graphic
		c.beginPath();
		c.moveTo(this.x, this.y - 5);
		c.lineTo(this.x + 30, this.y - 5);
		c.stroke();
		c.beginPath();
		c.arc(this.x + 30, this.y - 12, 7, Math.PI, 2.5 * Math.PI);
		c.stroke();
	}
	else {
		//large wind graphic
		c.beginPath();
		c.moveTo(this.x, this.y);
		c.lineTo(this.x - 32, this.y);
		c.stroke();
		c.beginPath();
		c.arc(this.x - 32, this.y - 17, 17, 0.5 * Math.PI, 2 * Math.PI);
		c.stroke();
		//small wind graphic
		c.beginPath();
		c.moveTo(this.x, this.y - 5);
		c.lineTo(this.x - 30, this.y - 5);
		c.stroke();
		c.beginPath();
		c.arc(this.x - 30, this.y - 12, 7, 0.5 * Math.PI, 2 * Math.PI);
		c.stroke();
	}
	c.restore();
};
WindBurst.prototype.update = function() {
	this.x += this.velX;
	this.velX *= 0.98;
	this.opacity -= 0.05;
	for(var i = 0; i < roomInstances[inRoom].content.length; i ++) {
		if(roomInstances[inRoom].content[i] instanceof Enemy && !(roomInstances[inRoom].content[i] instanceof Wraith)) {
			var enemy = roomInstances[inRoom].content[i];
			if(enemy.x + enemy.rightX > this.x && enemy.x + enemy.leftX < this.x + 49 && enemy.y + enemy.bottomY > this.y - 34 && enemy.y + enemy.topY < this.y && this.dir === "right") {
				enemy.velX = 3;
				enemy.x += this.velX;
			}
			if(enemy.x + enemy.rightX > this.x - 49 && enemy.x + enemy.leftX < this.x && enemy.y + enemy.bottomY > this.y - 34 && enemy.y + enemy.topY < this.y && this.dir === "left") {
				enemy.velX = -3;
				enemy.x += this.velX;
			}
		}
	}
	if(this.opacity < 0) {
		this.splicing = true;
	}
};
function Map() {
	Extra.call(this);
};
inheritsFrom(Map, Extra);
Map.prototype.display = function() {
	c.save();

	c.fillStyle = "rgb(255, 255, 200)";
	c.fillRect(-20, -20, 40, 40);

	c.fillStyle = "rgb(255, 0, 0)";
	c.fillText("x", 10, -10);

	c.strokeStyle = "rgb(0, 0, 0)";
	c.setLineDash([3, 3]);
	c.lineWidth = 1;
	c.beginPath();
	c.moveTo(10, -5);
	c.lineTo(10, 5);
	c.lineTo(-5, 5);
	c.lineTo(-20, 20);
	c.stroke();
	c.restore();
};
Map.prototype.getDesc = function() {
	return [
		{
			content: "Map",
			font: "bolder 10pt Cursive",
			color: "rgb(255, 255, 255)"
		},
		{
			content: "Shows you the way",
			font: "10pt monospace",
			color: "rgb(255, 255, 255)"
		},
		{
			content: "Dead ends are marked with x's. Unexplored doors are marked with a '?'. Doors eventually leading to unexplored doors are marked with arrows.",
			font: "10pt Cursive",
			color: "rgb(150, 150, 150)"
		}
	];
};

function Barricade() {
	Extra.call(this);
	this.consumed = false;
};
inheritsFrom(Barricade, Extra);
Barricade.prototype.display = function(type) {
	type = type || "item";
	if(type === "item" || type === "holding") {
		c.save();
		c.fillStyle = "rgb(139, 69, 19)";
		c.strokeStyle = "rgb(150, 150, 150)";
		c.lineWidth = 2;

		c.save();
		c.scale(type === "item" ? 0.75 : 1, type === "item" ? 0.75 : 1);
		c.rotate(22 / 180 * Math.PI);
		c.fillRect(-30, -10, 60, 20);
		c.fillStyle = "rgb(200, 200, 200)";
		circle(-20, 0, 5);
		circle(20, 0, 5);
		c.beginPath();
		c.moveTo(-25, 0);
		c.lineTo(-15, 0);
		c.stroke();
		c.beginPath();
		c.moveTo(-20, -5);
		c.lineTo(-20, 5);
		c.stroke();
		c.beginPath();
		c.moveTo(25, 0);
		c.lineTo(15, 0);
		c.stroke();
		c.beginPath();
		c.moveTo(20, -5);
		c.lineTo(20, 5);
		c.stroke();
		c.restore();

		c.save();
		c.scale(type === "item" ? 0.75 : 1, type === "item" ? 0.75 : 1);
		c.rotate(-22 / 180 * Math.PI);
		c.fillRect(-30, -10, 60, 20);
		c.fillStyle = "rgb(200, 200, 200)";
		circle(-20, 0, 5);
		circle(20, 0, 5);
		c.beginPath();
		c.moveTo(-25, 0);
		c.lineTo(-15, 0);
		c.stroke();
		c.beginPath();
		c.moveTo(-20, -5);
		c.lineTo(-20, 5);
		c.stroke();
		c.beginPath();
		c.moveTo(25, 0);
		c.lineTo(15, 0);
		c.stroke();
		c.beginPath();
		c.moveTo(20, -5);
		c.lineTo(20, 5);
		c.stroke();
		c.restore();
		c.restore();
	}
};
Barricade.prototype.getDesc = function() {
	return [
		{
			content: "Barricade",
			font: "bolder 10pt Cursive",
			color: "rgb(255, 255, 255)"
		},
		{
			content: "Usage: Blocking Doors",
			font: "10pt monospace",
			color: "rgb(255, 255, 255)"
		},
		{
			content: "Can be placed on a door to prevent enemies from chasing you.",
			font: "10pt Cursive",
			color: "rgb(150, 150, 150)"
		}
	];
};
Barricade.prototype.use = function() {
	var closeDoor = false;
	for(var i = 0; i < roomInstances[inRoom].content.length; i ++) {
		var loc = point3d(roomInstances[inRoom].content[i].x + p.worldX, roomInstances[inRoom].content[i].y + p.worldY, 0.9);
		if(roomInstances[inRoom].content[i] instanceof Door && Math.dist(loc.x, loc.y, 400, 400) <= 100 && !roomInstances[inRoom].content[i].barricaded) {
			closeDoor = true;
			break;
		}
	}
	if(!closeDoor) {
		return;
	}
	var closestDist = null;
	var closestIndex = 0;
	for(var i = 0; i < roomInstances[inRoom].content.length; i ++) {
		var loc = point3d(roomInstances[inRoom].content[i].x + p.worldX, roomInstances[inRoom].content[i].y + p.worldY, 0.9);
		var theDist = Math.dist(loc.x, loc.y, 400, 400);
		if((roomInstances[inRoom].content[i] instanceof Door && theDist <= closestDist) || !(roomInstances[inRoom].content[closestIndex] instanceof Door)) {
			closestIndex = i;
			closestDist = theDist;
		}
	}
	var theDoor = roomInstances[inRoom].content[closestIndex];
	theDoor.barricaded = true;
	theDoor.timeBarricaded = 0;
	if(typeof theDoor.dest !== "object") {
		for(var i = 0; i < roomInstances[theDoor.dest].content.length; i ++) {
			if(roomInstances[theDoor.dest].content[i] instanceof Door && roomInstances[theDoor.dest].content[i].dest === inRoom) {
				roomInstances[theDoor.dest].content[i].barricaded = true;
				roomInstances[theDoor.dest].content[i].timeBarricaded = 0;
			}
		}
	}
	this.consumed = true;
};

function Coin(quantity) {
	Extra.call(this);
	this.quantity = quantity;
	this.stackable = true;
};
inheritsFrom(Coin, Extra);
Coin.prototype.getDesc = function() {
	var desc = [
		{
			content: "Coin [" + this.quantity + "]",
			font: "bolder 10pt Cursive",
			color: "rgb(255, 255, 255)"
		},
		{
			content: "The goal of life",
			font: "10pt monospace",
			color: "rgb(255, 255, 255)"
		},
		{
			content: "Even though you can't buy",
			font: "10pt Cursive",
			color: "rgb(150, 150, 150)"
		},
		{
			content: "anything with it, money is",
			font: "10pt Cursive",
			color: "rgb(150, 150, 150)"
		},
		{
			content: "always nice to have.",
			font: "10pt Cursive",
			color: "rgb(150, 150, 150)"
		}
	];
	return desc;
};
Coin.prototype.display = function(type) {
	type = type || "item";
	c.save();
	c.lineWidth = 2;
	c.fillStyle = "rgb(255, 255, 0)";
	c.strokeStyle = "rgb(255, 128, 0)";
	c.beginPath();
	c.arc(0, 0, 15, 0, 2 * Math.PI);
	c.fill();
	c.stroke();
	c.fillStyle = "rgb(255, 128, 0)";
	//c.fillRect(-2, -8, 4, 16);
	c.font = "bolder 20px monospace";
	c.textAlign = "center";
	c.fillText(this.quantity, 0, 7);
	c.restore();
};
function ShotArrow(x, y, velX, velY, damage, shotBy, element, name) {
	this.x = x;
	this.y = y;
	this.velX = velX;
	this.velY = velY;
	this.shotBy = shotBy;
	this.opacity = 1;
	this.damage = damage;
	this.element = element;
	this.name = name;
	this.hitSomething = false;
};
ShotArrow.prototype.exist = function() {
	c.globalAlpha = this.opacity > 0 ? this.opacity : 0;
	var angle = Math.atan2(this.velX, this.velY);
	c.save();
	c.translate(this.x + p.worldX, this.y + p.worldY);
	c.rotate(0.5 * Math.PI - angle);
		c.strokeStyle = "rgb(139, 69, 19)";
		c.lineWidth = 4;
		c.beginPath();
		c.moveTo(-28, 0);
		c.lineTo(0, 0);
		c.stroke();
		c.lineWidth = 1;
		for(var x = 0; x < 10; x += 3) {
			c.beginPath();
			c.moveTo(-x - 10, 0);
			c.lineTo(-x - 10 - 6, -6);
			c.stroke();
			c.beginPath();
			c.moveTo(-x - 10, 0);
			c.lineTo(-x - 10 - 6, 6);
			c.stroke();
		}
		c.fillStyle = "rgb(255, 255, 255)";
		c.beginPath();
		c.moveTo(0, 0);
		c.lineTo(-6, -6);
		c.lineTo(14, 0);
		c.lineTo(-6, 6);
		c.fill();
	c.restore();
	c.globalAlpha = 1;
	if(!this.hitSomething) {
		this.x += this.velX;
		this.y += this.velY;
		this.velY += 0.1;
		for(var i = 0; i < roomInstances[inRoom].content.length; i ++) {
			if(roomInstances[inRoom].content[i] instanceof Enemy && this.shotBy === "player") {
				var enemy = roomInstances[inRoom].content[i];
				if(this.x > enemy.x + enemy.leftX && this.x < enemy.x + enemy.rightX && this.y > enemy.y + enemy.topY && this.y < enemy.y + enemy.bottomY) {
					if(this.origX === undefined) {
						enemy.hurt(this.damage);
					}
					else {
						enemy.hurt(this.damage + Math.round(Math.abs(this.x - this.origX) / 50));
					}
					if(this.element === "fire") {
						enemy.timeBurning = (enemy.timeBurning <= 0) ? 120 : enemy.timeBurning;
						enemy.burnDmg = 1;
					}
					else if(this.element === "water") {
						enemy.timeFrozen = (enemy.timeFrozen <= 0) ? 120 : enemy.timeFrozen;
					}
					else if(this.element === "air") {
						roomInstances[inRoom].content.push(new WindBurst(this.x, this.y, this.velX > 0 ? "right" : "left"));
					}
					else if(this.element === "earth" && p.canUseEarth) {
						//find lowest roof directly above weapon
						var lowestIndex = null;
						for(var j = 0; j < roomInstances[inRoom].content.length; j ++) {
							if(lowestIndex !== null) {
								if(roomInstances[inRoom].content[j] instanceof Block && this.x > roomInstances[inRoom].content[j].x && this.x < roomInstances[inRoom].content[j].x + roomInstances[inRoom].content[j].w &&roomInstances[inRoom].content[j].y + roomInstances[inRoom].content[j].h > roomInstances[inRoom].content[lowestIndex].y + roomInstances[inRoom].content[lowestIndex].h && roomInstances[inRoom].content[j].y + roomInstances[inRoom].content[j].h <= this.y) {
									lowestIndex = j;
								}
							}
							else if(lowestIndex === null && this.x > roomInstances[inRoom].content[j].x && this.x < roomInstances[inRoom].content[j].x + roomInstances[inRoom].content[j].w && roomInstances[inRoom].content[j].y <= this.y && roomInstances[inRoom].content[j] instanceof Block) {
								lowestIndex = j;
							}
						}
						roomInstances[inRoom].content.push(new BoulderVoid(this.x, roomInstances[inRoom].content[lowestIndex].y + roomInstances[inRoom].content[lowestIndex].h));
						roomInstances[inRoom].content.push(new Boulder(this.x, roomInstances[inRoom].content[lowestIndex].y + roomInstances[inRoom].content[lowestIndex].h, Math.random() * 2 + 2));
					}
					this.hitSomething = true;
				}
			}
		}
		if(this.x + p.worldX > p.x - 5 && this.x + p.worldX < p.x + 5 && this.y + p.worldY > p.y - 7 && this.y + p.worldY < p.y + 46 && this.shotBy === "enemy") {
			p.hurt(this.damage, this.name);
			this.hitSomething = true;
		}
	}
	else {
		this.opacity -= 0.05;
	}
};

/** ENEMIES **/
function RandomEnemy(x, y, notEnemy) {
	this.x = x;
	this.y = y;
	this.notEnemy = notEnemy; // use this to specify any enemy BUT a certain enemy
};
RandomEnemy.prototype.generate = function() {
	/* Wait until the decorations are resolved before generating enemy */
	for(var i = 0; i < roomInstances[theRoom].content.length; i ++) {
		if(roomInstances[theRoom].content[i] instanceof Decoration) {
			return; // wait until the decorations resolve before deciding which enemy
		}
	}
	var possibleEnemies = deepClone(enemies);
	/* Remove dragonlings + trolls if they are in a room where they wouldn't match the decorations */
	for(var i = 0; i < roomInstances[theRoom].content.length; i ++) {
		if(roomInstances[theRoom].content[i] instanceof Torch) {
			for(var j = 0; j < possibleEnemies.length; j ++) {
				if(possibleEnemies[j] === Dragonling) {
					possibleEnemies.splice(j, 1);
					break;
				}
			}
			break;
		}
		else if(roomInstances[theRoom].content[i] instanceof Banner) {
			for(var j = 0; j < possibleEnemies.length; j ++) {
				if(possibleEnemies[j] === Troll) {
					possibleEnemies.splice(j, 1);
					break;
				}
			}
		}
	}
	/* If this isn't supposed to be a particular enemy, remove that one */
	for(var i = 0; i < possibleEnemies.length; i ++) {
		if(possibleEnemies[i] === this.notEnemy) {
			possibleEnemies.splice(i, 1);
			break;
		}
	}
	/* Pick an enemy and add it to the game */
	var enemyIndex = Math.floor(Math.random() * possibleEnemies.length);
	roomInstances[inRoom].content.push(new possibleEnemies[enemyIndex](this.x, this.y - new possibleEnemies[enemyIndex]().bottomY));
};
function Enemy(x, y) {
	this.x = x;
	this.y = y;
	this.velX = 0;
	this.velY = 0;
	this.visualHealth = 60;
	this.attackRecharge = 45;
	this.opacity = 1;
	this.dead = false;
	this.fadingIn = false;
	this.particles = [];
	this.timeFrozen = 0;
	this.timeBurning = 0;
	this.timePurified = 0;
	this.purity = 0;
};
Enemy.prototype.hurt = function(amount, ignoreDef) {
	var def = Math.round(Math.random() * (this.defHigh - this.defLow) + this.defLow);
	if(!ignoreDef) {
		amount -= def;
	}
	amount = (amount < 0) ? 0 : amount;
	this.health -= amount;
};
Enemy.prototype.displayStats = function() {
	if(this instanceof Dragonling) {
		var topY = this.topY;
		this.topY = -20;
	}
	//healthbar
	c.globalAlpha = this.opacity > 0 ? this.opacity : 0;
	this.attackRecharge --;
	var middle = ((this.x + p.worldX + this.rightX) + (this.x + p.worldX + this.leftX)) / 2;
	if(this instanceof Dragonling) {
		middle = this.x + p.worldX;
	}
	c.fillStyle = "rgb(150, 150, 150)";
	c.fillRect(middle - 30, this.y + p.worldY + this.topY - 15, 60, 10);
	c.beginPath();
	c.arc(middle - 30, this.y + p.worldY + this.topY - 10, 5, 0, 2 * Math.PI);
	c.arc(middle + 30, this.y + p.worldY + this.topY - 10, 5, 0, 2 * Math.PI);
	c.fill();
	//updating
	if(this.health <= 0) {
		this.health = 0;
		this.dead = true;
	}
	if(this.visualHealth > 0) {
		c.fillStyle = "rgb(255, 0, 0)";
		var visualHealth = this.health / this.maxHealth * 60;
		this.visualHealth += (visualHealth - this.visualHealth) / 10;
		c.fillRect(middle - 30, this.y + p.worldY + this.topY - 15, this.visualHealth, 10);
		c.beginPath();
		c.arc(middle - 30, this.y + p.worldY + this.topY - 10, 5, 0, 2 * Math.PI);
		c.arc(middle - 30 + this.visualHealth, this.y + p.worldY + this.topY - 10, 5, 0, 2 * Math.PI);
		c.fill();
	}
	if(this.dead) {
		this.opacity -= 0.05;
	}
	else if(this.fadingIn) {
		this.opacity += 0.05;
	}
	if(this.opacity >= 1) {
		this.fadingIn = false;
	}
	if(this.opacity <= 0 && this.dead) {
		this.splicing = true;
	}
	c.globalAlpha = 1;
	//velocity cap
	if(this.velX > 3) {
		this.velX = 3;
	}
	if(this.velX < -3) {
		this.velX = -3;
	}
	if(this.velY > 3) {
		this.velY = 3;
	}
	if(this.velY < -3) {
		this.velY = -3;
	}
	if(this instanceof Dragonling) {
		this.topY = topY;
	}
};
Enemy.prototype.exist = function() {
	this.display();
	// thingsToBeRendered.push(new RenderingObject(
	// 	this,
	// 	{
	// 		x: this.x + p.worldX + this.leftX,
	// 		y: this.y + p.worldY + this.topY,
	// 		w: this.rightX - this.leftX,
	// 		h: this.bottomY - this.topY
	// 	},
	// 	{
	// 		x: this.x + p.worldX + this.leftX,
	// 		y: this.y + p.worldY + this.topY,
	// 		w: this.rightX - this.leftX,
	// 		h: this.bottomY - this.topY,
	// 		z: 1
	// 	}
	// ));
	this.timeFrozen --;
	this.timePurified --;
	if(!this.fadingIn && (this.timeFrozen < 0 || this instanceof Wraith)) {
		if(inRoom === theRoom) {
			this.update("player");
		}
		else {
			calculatePaths();
			for(var i = 0; i < roomInstances[theRoom].content.length; i ++) {
				if(roomInstances[theRoom].content[i] instanceof Door) {
					var door = roomInstances[theRoom].content[i];
					if(typeof door.dest === "number" && roomInstances[door.dest].pathScore < roomInstances[theRoom].pathScore) {
						var nextRoom = roomInstances[door.dest];
						this.update({
							x: door.x,
							y: door.y
						});
					}
				}
			}
		}
	}
	if(this.timeFrozen > 0 && !(this instanceof Wraith)) {
		this.velY += 0.1;
		this.y += this.velY;
	}
	if(this.timeFrozen > 0 && !(this instanceof Wraith)) {
		cube(this.x + p.worldX + this.leftX, this.y + p.worldY + this.topY, (this.rightX - this.leftX), (this.bottomY - this.topY), 0.95, 1.05, "rgba(0, 128, 200, 0.5)", "rgba(0, 128, 200, 0.5)");
	}
	if(typeof this.attack === "function" && this.timeFrozen < 0) {
		this.attack();
	}
	if(this.timeBurning > 0 && !(this instanceof Wraith)) {
		this.particles.push(new Particle("rgb(255, 128, 0)", Math.random() * (this.rightX - this.leftX), Math.random() * (this.bottomY - this.topY), Math.random() * 4 - 2, Math.random() * 4 - 3, Math.random() * 2 + 3));
		this.timeBurning -= this.burnDmg;
		if(this.timeBurning % 60 === 0) {
			this.health -= this.burnDmg;
		}
	}
	if(!(this instanceof Wraith)) {
		for(var i = 0; i < this.particles.length; i ++) {
			c.save();
			c.translate(this.x + this.leftX, this.y + this.topY);
			this.particles[i].exist();
			c.restore();
			if(this.particles[i].splicing) {
				this.particles.splice(i, 1);
				continue;
			}
		}
	}
	if(this.timePurified > 0) {
		this.purity += (this.purity < 255) ? 5 : 0;
	}
	else {
		this.purity += (this.purity > 0) ? -5 : 0;
	}
	/* Collisions with other enemies */
	for(var i = 0; i < roomInstances[theRoom].content.length; i ++) {
		if(!(roomInstances[theRoom].content[i] instanceof Enemy)) {
			continue;
		}
		var enemy = roomInstances[theRoom].content[i];
		if(this.y + this.bottomY > enemy.y + enemy.topY && this.y + this.topY < enemy.y + enemy.bottomY && this.x + this.rightX >= enemy.x + enemy.leftX && this.x + this.rightX <= enemy.x + enemy.leftX + 3 && this.velX > 0 && !(enemy.x === this.x && enemy.y === this.y)) {
			this.velX = -3;
			enemy.velX = 3;
			this.x = enemy.x + enemy.leftX - this.rightX;
		}
		if(this.y + this.bottomY > enemy.y + enemy.topY && this.y + this.topY < enemy.y + enemy.bottomY && this.x + this.leftX <= enemy.x + enemy.rightX && this.x + this.leftX >= enemy.x + enemy.rightX - 3 && this.velX < 0 && !(enemy.x === this.x && enemy.y === this.y)) {
			this.velX = 3;
			enemy.velX = -3;
			this.x = enemy.x + enemy.rightX - this.leftX;
		}
		if(this.x + this.rightX > enemy.x + enemy.leftX && this.x + this.leftX < enemy.x + enemy.rightX && this.y + this.bottomY > enemy.y + enemy.topY && this.y + this.bottomY < enemy.y + enemy.topY + 10) {
			this.velY = -4;
		}
	}
};

function Spider(x, y) {
	Enemy.call(this, x, y);
	this.legs = 0;
	this.legDir = 2;

	//hitbox
	this.leftX = -45;
	this.rightX = 45;
	this.topY = -22;
	this.bottomY = 22;

	//stats
	this.health = 50;
	this.maxHealth = 50;
	this.defLow = 20;
	this.defHigh = 30;
	this.damLow = 20;
	this.damHigh = 30;
	this.name = "a giant spider";
	this.nonMagical = true;
};
inheritsFrom(Spider, Enemy);
Spider.prototype.display = function() {
	c.lineWidth = 4;
	c.fillStyle = "rgb(0, 0, 0)";
	c.strokeStyle = "rgb(0, 0, 0)";
	c.beginPath();
	c.arc(this.x + p.worldX, this.y + p.worldY, 20, 0, 2 * Math.PI);
	c.fill();

	c.save();
	c.translate(this.x + p.worldX - 14, this.y + p.worldY + 14);
	c.rotate(this.legs / 360 * 2 * Math.PI);
	c.moveTo(0, 0);
	c.lineTo(-10, 0);
	c.lineTo(-10, 10);
	c.stroke();
	c.restore();

	c.save();
	c.translate(this.x + p.worldX + 14, this.y + p.worldY + 14);
	c.rotate(-this.legs / 360 * 2 * Math.PI);
	c.moveTo(0, 0);
	c.lineTo(10, 0);
	c.lineTo(10, 10);
	c.stroke();
	c.restore();

	c.save();
	c.translate(this.x + p.worldX + 16, this.y + p.worldY + 4);
	c.rotate(this.legs / 360 * 2 * Math.PI);
	c.moveTo(0, 0);
	c.lineTo(20, 0);
	c.lineTo(20, 20);
	c.stroke();
	c.restore();

	c.save();
	c.translate(this.x + p.worldX - 16, this.y + p.worldY + 4);
	c.rotate(-this.legs / 360 * 2 * Math.PI);
	c.moveTo(0, 0);
	c.lineTo(-20, 0);
	c.lineTo(-20, 20);
	c.stroke();
	c.restore();

	//back 4 legs

	c.save();
	c.translate(this.x + p.worldX - 14, this.y + p.worldY + 14);
	c.rotate(-this.legs / 360 * 2 * Math.PI);
	c.moveTo(0, 0);
	c.lineTo(-10, 0);
	c.lineTo(-10, 10);
	c.stroke();
	c.restore();

	c.save();
	c.translate(this.x + p.worldX + 14, this.y + p.worldY + 14);
	c.rotate(this.legs / 360 * 2 * Math.PI);
	c.moveTo(0, 0);
	c.lineTo(10, 0);
	c.lineTo(10, 10);
	c.stroke();
	c.restore();

	c.save();
	c.translate(this.x + p.worldX + 16, this.y + p.worldY + 4);
	c.rotate(-this.legs / 360 * 2 * Math.PI);
	c.moveTo(0, 0);
	c.lineTo(20, 0);
	c.lineTo(20, 20);
	c.stroke();
	c.restore();

	c.save();
	c.translate(this.x + p.worldX - 16, this.y + p.worldY + 4);
	c.rotate(this.legs / 360 * 2 * Math.PI);
	c.moveTo(0, 0);
	c.lineTo(-20, 0);
	c.lineTo(-20, 20);
	c.stroke();
	c.restore();

	//eyes
	c.fillStyle = "rgb(" + (255 - this.purity) + ", 0, " + this.purity + ")";
	c.beginPath();
	c.arc(this.x + p.worldX - 10, this.y + p.worldY - 10, 5, 0, 2 * Math.PI);
	c.fill();

	c.beginPath();
	c.arc(this.x + p.worldX + 10, this.y + p.worldY - 10, 5, 0, 2 * Math.PI);
	c.fill();
};
Spider.prototype.update = function(dest) {
	// console.log("dest is: " + dest);
	if(dest === "player") {
		if(this.timePurified < 0) {
			if(this.x + p.worldX < p.x) {
				this.velX = 2;
			}
			else {
				this.velX = -2;
			}
		}
		else {
			if(this.timePurified === 599) {
				this.walking = {dir: (this.x + p.worldX < p.x) ? "right" : "left", time: 60};
			}
			if(this.walking.dir === "right") {
				this.x ++;
				this.walking.time --;
				if(this.walking.time < 0) {
					this.walking.time = 100;
					this.walking.dir = "none";
				}
			}
			else if(this.walking.dir === "left") {
				this.x --;
				this.walking.time --;
				if(this.walking.time < 0) {
					this.walking.time = 100;
					this.walking.dir = "none";
				}
			}
			else {
				this.walking.time --;
				if(this.walking.time < 0) {
					this.walking.time = 100;
					this.walking.dir = (Math.random() < 0.5) ? "left" : "right";
				}
			}
		}
		if(this.timePurified < 0 || this.walking.dir !== "none") {
			if(this.legs > 15) {
				this.legDir = -2;
			}
			if(this.legs < -15) {
				this.legDir = 2;
			}
		}
		else {
			this.legDir = (this.legs < 8) ? 2 : -2;
			if(Math.abs(this.legs - 8) <= 2) {
				this.legs = 8;
			}
		}
		this.legs += this.legDir;
		this.x += this.velX;
		this.y += this.velY;
		this.velY += 0.1;
		if(this.canJump && Math.abs(this.x + p.worldX - p.x) <= 130 && Math.abs(this.x + p.worldX - p.x) >= 120 && dest === "player") {
			this.velY = -4;
		}
		this.canJump = false;
	}
	else {
		if(this.x < dest.x) {
			this.velX = 2;
		}
		else {
			this.velX = -2;
		}
		this.y += this.velY;
		this.velY += 0.1;
		this.canJump = false;
	}
};

function Bat(x, y) {
	Enemy.call(this, x, y);
	this.wings = 0;
	this.wingDir = 4;

	//hitbox
	this.leftX = -53;
	this.rightX = 53;
	this.topY = -12;
	this.bottomY = 12;

	//stats
	this.health = 50;
	this.maxHealth = 50;
	this.defLow = 20;
	this.defHigh = 30;
	this.damLow = 20;
	this.damHigh = 30;
	this.name = "a bat";
	this.nonMagical = true;
};
inheritsFrom(Bat, Enemy);
Bat.prototype.display = function() {
	c.fillStyle = "rgb(0, 0, 0)";
	c.beginPath();
	c.arc(this.x + p.worldX, this.y + p.worldY, 10, 0, 2 * Math.PI);
	c.fill();

	c.fillStyle = "rgb(" + (255 - this.purity) + ", 0, " + this.purity + ")";
	c.beginPath();
	c.arc(this.x + p.worldX - 2, this.y + p.worldY - 4, 2, 0, 2 * Math.PI);
	c.arc(this.x + p.worldX + 2, this.y + p.worldY - 4, 2, 0, 2 * Math.PI);
	c.fill();

	c.fillStyle = "rgb(0, 0, 0)";
	c.save();
	c.translate(this.x + p.worldX + 5, this.y + p.worldY);
	c.rotate(this.wings / 180 * Math.PI);
	c.beginPath();
	c.moveTo(0, 0);
	c.lineTo(10, -10);
	c.lineTo(50, 0);
	c.lineTo(10, 10);
	c.fill();
	c.restore();

	c.save();
	c.translate(this.x + p.worldX - 5, this.y + p.worldY);
	c.rotate(-this.wings / 180 * Math.PI);
	c.beginPath();
	c.moveTo(0, 0);
	c.lineTo(-10, -10);
	c.lineTo(-50, 0);
	c.lineTo(-10, 10);
	c.fill();
	c.restore();
};
Bat.prototype.update = function(dest) {
	if(dest === "player") {
		this.wings += this.wingDir;
		if(this.wings > 5) {
			this.wingDir = -5;
		}
		else if(this.wings < -15) {
			this.wingDir = 5;
		}

		if(this.timePurified < 0) {
			if(this.x + p.worldX < p.x) {
				this.velX += 0.1;
			}
			else if(this.x + p.worldX > p.x) {
				this.velX -= 0.1;
			}
			if(this.y + p.worldY < p.y) {
				this.velY += 0.1;
			}
			else if(this.y + p.worldY > p.y) {
			this.velY -= 0.1;
		}
		}
		else {
			if(this.timePurified === 599) {
				this.dest = {x: this.x + (Math.random() * 200 - 100), y: this.y + (Math.random() * 200 - 100)};
			}
			this.velX += (this.x < this.dest.x) ? 0.1 : -0.1;
			this.velY += (this.y < this.dest.y) ? 0.1 : -0.1;
			if(Math.distSq(this.x, this.y, this.dest.x, this.dest.y) <= 10000) {
				this.dest = {x: this.x + (Math.random() * 200 - 100), y: this.y + (Math.random() * 200 - 100)};
			}
		}
		this.x += this.velX;
		this.y += this.velY;
	}
	else {
		this.wings += this.wingDir;
		if(this.wings > 5) {
			this.wingDir = -5;
		}
		else if(this.wings < -15) {
			this.wingDir = 5;
		}

		if(this.x < dest.x) {
			this.velX += 0.1;
		}
		else if(this.x > dest.x) {
			this.velX -= 0.1;
		}
		if(this.y < dest.y) {
			this.velY += 0.1;
		}
		else if(this.y > dest.y) {
			this.velY -= 0.1;
		}
		this.x += this.velX;
		this.y += this.velY;

	}
};

function Skeleton(x, y) {
	Enemy.call(this, x, y);
	this.legs = 7;
	this.legDir = -0.5;

	//stats
	this.health = 100;
	this.maxHealth = 100;
	this.damLow = 20;
	this.damHigh = 40;
	this.defLow = 20;
	this.defHigh = 40;

	//hitbox
	this.leftX = -13;
	this.rightX = 13;
	this.topY = -8;
	this.bottomY = 43;
	this.name = "a skeleton";
};
inheritsFrom(Skeleton, Enemy);
Skeleton.prototype.display = function() {
	c.lineWidth = 2;
	//head
	c.fillStyle = "rgb(255, 255, 255)";
	c.strokeStyle = "rgb(255, 255, 255)";
	c.beginPath();
	c.arc(this.x + p.worldX, this.y + p.worldY + 3, 7, 0, 2 * Math.PI);
	c.fill();
	c.fillRect(this.x + p.worldX - 3, this.y + p.worldY + 3, 6, 10);
	//body
	c.beginPath();
	c.moveTo(this.x + p.worldX, this.y + p.worldY);
	c.lineTo(this.x + p.worldX, this.y + p.worldY + 36);
	c.stroke();
	//legs
	c.beginPath();
	c.moveTo(this.x + p.worldX, this.y + p.worldY + 36);
	c.lineTo(this.x + p.worldX + this.legs, this.y + p.worldY + 43);
	c.stroke();
	c.beginPath();
	c.moveTo(this.x + p.worldX, this.y + p.worldY + 36);
	c.lineTo(this.x + p.worldX - this.legs, this.y + p.worldY + 43);
	c.stroke();
	this.legs += this.legDir;
	this.legDir = (this.legs < -7) ? 0.5 : this.legDir;
	this.legDir = (this.legs > 7) ? -0.5 : this.legDir;
	//arms
	c.beginPath();
	c.moveTo(this.x + p.worldX, this.y + p.worldY + 15);
	c.lineTo(this.x + p.worldX + 10, this.y + p.worldY + 15);
	c.stroke();
	c.beginPath();
	c.moveTo(this.x + p.worldX + 8, this.y + p.worldY + 15);
	c.lineTo(this.x + p.worldX + 8, this.y + p.worldY + 25);
	c.stroke();
	c.beginPath();
	c.moveTo(this.x + p.worldX, this.y + p.worldY + 15);
	c.lineTo(this.x + p.worldX - 10, this.y + p.worldY + 15);
	c.stroke();
	c.beginPath();
	c.moveTo(this.x + p.worldX - 8, this.y + p.worldY + 15);
	c.lineTo(this.x + p.worldX - 8, this.y + p.worldY + 25);
	c.stroke();
	//ribcage
	for(var y = this.y + p.worldY + 22; y < this.y + p.worldY + 34; y += 4) {
		c.beginPath();
		c.moveTo(this.x + p.worldX - 5, y);
		c.lineTo(this.x + p.worldX + 5, y);
		c.stroke();
	}
};
Skeleton.prototype.update = function(dest) {
	if(dest === "player") {
		//movement
		this.x += this.velX;
		this.y += this.velY;
		this.velY += 0.1;
		this.velX = (this.x + p.worldX < p.x) ? this.velX + 0.1 : this.velX;
		this.velX = (this.x + p.worldX > p.x) ? this.velX - 0.1 : this.velX;
		this.velX *= 0.96;
		if(Math.random() <= 0.02 && this.canJump) {
			this.velY = -(Math.random() * 3 + 2);
		}
		this.canJump = false;
	}
	else {
		//movement
		this.x += this.velX;
		this.y += this.velY;
		this.velY += 0.1;
		this.velX = (this.x < dest.x) ? this.velX + 0.1 : this.velX;
		this.velX = (this.x > dest.x) ? this.velX - 0.1 : this.velX;
		this.velX *= 0.96;
		this.canJump = false;
	}
};

function SkeletonWarrior(x, y) {
	Enemy.call(this, x, y);
	this.legs = 7;
	this.legDir = -0.5;
	this.attackArm = 315;
	this.attackArmDir = 3;
	this.canHit = true;
	this.timeSinceAttack = 0;

	//hitbox
	this.leftX = -13;
	this.rightX = 13;
	this.topY = -8;
	this.bottomY = 43;

	//stats
	this.health = 100;
	this.maxHealth = 100;
	this.defLow = 40;
	this.defHigh = 60;
	this.damLow = 50;
	this.damHigh = 70;
	this.complexAttack = true;
	this.name = "a skeletal warrior";
};
inheritsFrom(SkeletonWarrior, Enemy);
SkeletonWarrior.prototype.display = function() {
	c.lineWidth = 2;
	//head
	c.fillStyle = "rgb(255, 255, 255)";
	c.strokeStyle = "rgb(255, 255, 255)";
	c.beginPath();
	c.arc(this.x + p.worldX, this.y + p.worldY + 3, 7, 0, 2 * Math.PI);
	c.fill();
	c.fillRect(this.x + p.worldX - 3, this.y + p.worldY + 3, 6, 10);
	//body
	c.beginPath();
	c.moveTo(this.x + p.worldX, this.y + p.worldY);
	c.lineTo(this.x + p.worldX, this.y + p.worldY + 36);
	c.stroke();
	//legs
	c.beginPath();
	c.moveTo(this.x + p.worldX, this.y + p.worldY + 36);
	c.lineTo(this.x + p.worldX + this.legs, this.y + p.worldY + 43);
	c.stroke();
	c.beginPath();
	c.moveTo(this.x + p.worldX, this.y + p.worldY + 36);
	c.lineTo(this.x + p.worldX - this.legs, this.y + p.worldY + 43);
	c.stroke();
	this.legs += this.legDir;
	this.legDir = (this.legs < -7) ? 0.5 : this.legDir;
	this.legDir = (this.legs > 7) ? -0.5 : this.legDir;
	//arms
	if(this.x + p.worldX > p.x) {
		//right arm (normal)
		c.beginPath();
		c.moveTo(this.x + p.worldX, this.y + p.worldY + 15);
		c.lineTo(this.x + p.worldX + 10, this.y + p.worldY + 15);
		c.stroke();
		c.beginPath();
		c.moveTo(this.x + p.worldX + 8, this.y + p.worldY + 15);
		c.lineTo(this.x + p.worldX + 8, this.y + p.worldY + 25);
		c.stroke();
		c.beginPath();
		//left shoulder (normal)
		c.beginPath();
		c.moveTo(this.x + p.worldX, this.y + p.worldY + 15);
		c.lineTo(this.x + p.worldX - 10, this.y + p.worldY + 15);
		c.stroke();
		//left arm (attacking)
		c.save();
		c.translate(this.x + p.worldX - 8, this.y + p.worldY + 15);
		c.rotate(this.attackArm / 180 * Math.PI);
		c.beginPath();
		c.moveTo(0, 0);
		c.lineTo(-10, 0);
		c.stroke();
		//sword
		c.translate(-10, 0);
		new Sword("none").display("attacking");
		c.restore();
	}
	else {
		//left arm (normal)
		c.beginPath();
		c.moveTo(this.x + p.worldX, this.y + p.worldY + 15);
		c.lineTo(this.x + p.worldX - 10, this.y + p.worldY + 15);
		c.stroke();
		c.beginPath();
		c.moveTo(this.x + p.worldX - 8, this.y + p.worldY + 15);
		c.lineTo(this.x + p.worldX - 8, this.y + p.worldY + 25);
		c.stroke();
		c.beginPath();
		//right shoulder (normal)
		c.beginPath();
		c.moveTo(this.x + p.worldX, this.y + p.worldY + 15);
		c.lineTo(this.x + p.worldX + 10, this.y + p.worldY + 15);
		c.stroke();
		//right arm (attacking)
		c.save();
		c.translate(this.x + p.worldX + 8, this.y + p.worldY + 15);
		c.rotate(-this.attackArm / 180 * Math.PI);
		c.beginPath();
		c.moveTo(0, 0);
		c.lineTo(10, 0);
		c.stroke();
		//sword
		c.translate(10, 0);
		new Sword("none").display("attacking");
		c.restore();
	}
	//ribcage
	for(var y = this.y + p.worldY + 22; y < this.y + p.worldY + 34; y += 4) {
		c.beginPath();
		c.moveTo(this.x + p.worldX - 5, y);
		c.lineTo(this.x + p.worldX + 5, y);
		c.stroke();
	}
};
SkeletonWarrior.prototype.update = function(dest) {
	if(dest === "player") {
		//movement
		this.x += this.velX;
		this.y += this.velY;
		if(this.x + p.worldX < p.x) {
			this.velX = (this.x + p.worldX < p.x - 60) ? this.velX + 0.1 : this.velX;
			this.velX = (this.x + p.worldX > p.x - 60) ? this.velX - 0.1 : this.velX;
		}
		else {
			this.velX = (this.x + p.worldX < p.x + 60) ? this.velX + 0.1 : this.velX;
			this.velX = (this.x + p.worldX > p.x + 60) ? this.velX - 0.1 : this.velX;
		}
		this.velX *= 0.96;
		this.velY += 0.1;
		if(this.canJump) {
			this.velY = -3;
		}
		this.canJump = false;
	}
	else {
		//movement
		this.x += this.velX;
		this.y += this.velY;
		this.velX = (this.x < dest.x) ? this.velX + 0.1 : this.velX;
		this.velX = (this.x > dest.x) ? this.velX - 0.1 : this.velX;
		this.velX *= 0.96;
		this.velY += 0.1;
		this.canJump = false;
	}
};
SkeletonWarrior.prototype.attack = function() {
	//attack
	this.attackArm += this.attackArmDir;
	this.canHit = ((this.attackArm > 360 || this.attackArm < 270) && this.timeSinceAttack > 15) ? true : this.canHit;
	this.timeSinceAttack ++;
	this.attackArmDir = (this.attackArm > 360) ? -3 : this.attackArmDir;
	this.attackArmDir = (this.attackArm < 270) ? 3 : this.attackArmDir;
	if(this.x + p.worldX < p.x) {
		var swordEnd = Math.rotate(10, -60, -this.attackArm);
		swordEnd.x += this.x + p.worldX + 8;
		swordEnd.y += this.y + p.worldY + 15;
		if(swordEnd.x > p.x - 5 && swordEnd.x < p.x + 5 && swordEnd.y > p.y && swordEnd.y < p.y + 46 && this.canHit) {
			var damage = Math.floor(Math.random() * (this.damHigh - this.damLow) + this.damLow);
			p.hurt(damage, this.name);
			this.canHit = false;
			this.timeSinceAttack = 0;
			this.attackArmDir = -this.attackArmDir;
		}
	}
	else {
		var swordEnd = Math.rotate(-10, -60, this.attackArm);
		swordEnd.x += this.x + p.worldX - 8;
		swordEnd.y += this.y + p.worldY + 15;
		if(swordEnd.x > p.x - 5 && swordEnd.x < p.x + 5 && swordEnd.y > p.y && swordEnd.y < p.y + 46 && this.canHit) {
			var damage = Math.floor(Math.random() * (this.damHigh - this.damLow) + this.damLow);
			p.hurt(damage, this.name);
			this.canHit = false;
			this.timeSinceAttack = 0;
			this.attackArmDir = -this.attackArmDir;
		}
	}
};

function SkeletonArcher(x, y) {
	Enemy.call(this, x, y);
	this.legs = 7;
	this.legDir = -0.5;
	this.aimRot = 0;
	this.aimDir = 1;
	this.timeSinceAttack = 0;
	this.timeAiming = 0;
	this.velX = null;

	//hitbox
	this.leftX = -13;
	this.rightX = 13;
	this.topY = -8;
	this.bottomY = 43;

	//stats
	this.health = 100;
	this.maxHealth = 100;
	this.defLow = 0;
	this.defHigh = 20;
	this.damLow = 50;
	this.damHigh = 70;
	this.complexAttack = true;
	this.name = "a skeletal archer";
};
inheritsFrom(SkeletonArcher, Enemy);
SkeletonArcher.prototype.display = function() {
	c.lineWidth = 2;
	//head
	c.fillStyle = "rgb(255, 255, 255)";
	c.strokeStyle = "rgb(255, 255, 255)";
	c.beginPath();
	c.arc(this.x + p.worldX, this.y + p.worldY + 3, 7, 0, 2 * Math.PI);
	c.fill();
	c.fillRect(this.x + p.worldX - 3, this.y + p.worldY + 3, 6, 10);
	//body
	c.beginPath();
	c.moveTo(this.x + p.worldX, this.y + p.worldY);
	c.lineTo(this.x + p.worldX, this.y + p.worldY + 36);
	c.stroke();
	//legs
	c.beginPath();
	c.moveTo(this.x + p.worldX, this.y + p.worldY + 36);
	c.lineTo(this.x + p.worldX + this.legs, this.y + p.worldY + 43);
	c.stroke();
	c.beginPath();
	c.moveTo(this.x + p.worldX, this.y + p.worldY + 36);
	c.lineTo(this.x + p.worldX - this.legs, this.y + p.worldY + 43);
	c.stroke();
	//shoulders
	c.beginPath();
	c.moveTo(this.x + p.worldX - 10, this.y + p.worldY + 15);
	c.lineTo(this.x + p.worldX + 10, this.y + p.worldY + 15);
	c.stroke();
	//right arm
	if(this.x + p.worldX < p.x && this.timeSinceAttack > 60) {
		c.save();
		c.translate(this.x + p.worldX + 8, this.y + p.worldY + 15);
		c.rotate(this.aimRot / 180 * Math.PI);
		c.beginPath();
		c.moveTo(0, 0);
		c.lineTo(10, 0);
		c.stroke();
		c.translate(10, 0);
		new WoodBow("none").display("aiming");
		c.restore();
		this.timeAiming ++;
	}
	else {
		c.beginPath();
		c.moveTo(this.x + p.worldX + 8, this.y + p.worldY + 15);
		c.lineTo(this.x + p.worldX + 8, this.y + p.worldY + 25);
		c.stroke();
	}
	//left arm
	if(this.x + p.worldX > p.x && this.timeSinceAttack > 60) {
		c.save();
		c.translate(this.x + p.worldX - 8, this.y + p.worldY + 15);
		c.rotate(-this.aimRot / 180 * Math.PI);
		c.beginPath();
		c.moveTo(0, 0);
		c.lineTo(-10, 0);
		c.stroke();
		c.translate(-10, 0);
		c.scale(-1, 1);
		new WoodBow("none").display("aiming");
		c.restore();
		this.timeAiming ++;
	}
	else {
		c.beginPath();
		c.moveTo(this.x + p.worldX - 8, this.y + p.worldY + 15);
		c.lineTo(this.x + p.worldX - 8, this.y + p.worldY + 25);
		c.stroke();
	}
	//ribcage
	for(var y = this.y + p.worldY + 22; y < this.y + p.worldY + 34; y += 4) {
		c.beginPath();
		c.moveTo(this.x + p.worldX - 5, y);
		c.lineTo(this.x + p.worldX + 5, y);
		c.stroke();
	}
};
SkeletonArcher.prototype.update = function(dest) {
	if(dest === "player") {
		this.legs += this.legDir;
		if(this.x + p.worldX < p.x) {
			//moving towards p.x - 200
			if(this.x + p.worldX < p.x - 205 || this.x + p.worldX > p.x - 195) {
				this.legDir = (this.legs > 7) ? -0.5 : this.legDir;
				this.legDir = (this.legs < -7) ? 0.5 : this.legDir;
			}
			else {
				this.legDir = (this.legs > 7) ? 0 : this.legDir;
				this.legDir = (this.legs < -7) ? 0 : this.legDir;
			}
		}
		else {
			//moving towards p.x + 200
			if(this.x + p.worldX < p.x + 195 || this.x + p.worldX > p.x + 205) {
				this.legDir = (this.legs > 7) ? -0.5 : this.legDir;
				this.legDir = (this.legs < -7) ? 0.5 : this.legDir;
			}
			else {
				this.legDir = (this.legs > 7) ? 0 : this.legDir;
				this.legDir = (this.legs < -7) ? 0 : this.legDir;
			}
		}
		//movement
		this.y += this.velY;
		if(this.x + p.worldX > p.x) {
			this.x = (this.x + p.worldX < p.x + 195) ? this.x + 2 : this.x;
			this.x = (this.x + p.worldX > p.x + 205) ? this.x - 2 : this.x;
		}
		else {
			this.x = (this.x + p.worldX < p.x - 195) ? this.x + 2 : this.x;
			this.x = (this.x + p.worldX > p.x - 205) ? this.x - 2 : this.x;
		}
		this.velY += 0.1;
		this.canJump = false;
	}
	else {
		//movement
		this.y += this.velY;
		this.x = (this.x < dest.x) ? this.x + 2 : this.x - 2;
		this.velY += 0.1;
		this.canJump = false;
	}
};
SkeletonArcher.prototype.attack = function() {
	//attack
	this.timeSinceAttack ++;
	if(this.timeSinceAttack > 60) {
		if(this.x + p.worldX < p.x) {
			var velocity = Math.rotate(50, 0, this.aimRot);
			velocity.x /= 5;
			velocity.y /= 5;
			var velY = velocity.y / 1.75;
			var velX = velocity.x / 1.75;
			var simulationVelY = velY;
			velocity.x += this.x + p.worldX + 8;
			velocity.y += this.y + p.worldY + 15;
			var x = velocity.x;
			var y = velocity.y;
			while(x < p.x) {
				x += velX;
				y += simulationVelY;
				simulationVelY += 0.1;
			}
			if(y >= p.y - 7 && y <= p.y + 46 && this.timeAiming > 60) {
				this.timeSinceAttack = 0;
				this.timeAiming = 0;
				var damage = Math.floor(Math.random() * (this.damHigh - this.damLow) + this.damLow);
				roomInstances[inRoom].content.push(new ShotArrow(velocity.x - p.worldX, velocity.y - p.worldY, velX, velY, damage, "enemy", "none", "a skeletal archer"));
			}
			else if(y <= p.y - 7) {
				this.aimRot ++;
				if(this.aimRot >= 405) {
					this.aimRot = 405;
					if(this.timeAiming > 60) {
						this.timeSinceAttack = 0;
						this.timeAiming = 0;
						var damage = Math.floor(Math.random() * (this.damHigh - this.damLow) + this.damLow);
						roomInstances[inRoom].content.push(new ShotArrow(velocity.x - p.worldX, velocity.y - p.worldY, velX, velY, damage, "enemy", "none", "a skeletal archer"));
					}
				}
			}
			else if(y >= p.y + 46) {
				this.aimRot --;
				if(this.aimRot <= 315) {
					this.aimRot = 315;
					if(this.timeAiming > 60) {
						this.timeSinceAttack = 0;
						this.timeAiming = 0;
						var damage = Math.floor(Math.random() * (this.damHigh - this.damLow) + this.damLow);
						roomInstances[inRoom].content.push(new ShotArrow(velocity.x - p.worldX, velocity.y - p.worldY, velX, velY, damage, "enemy", "none", "a skeletal archer"));
					}
				}
			}
		}
		else {
			var velocity = Math.rotate(-50, 0, -this.aimRot);
			velocity.x /= 5;
			velocity.y /= 5;
			var velY = velocity.y / 1.75;
			var velX = velocity.x / 1.75;
			var simulationVelY = velY;
			velocity.x += this.x + p.worldX - 8;
			velocity.y += this.y + p.worldY + 15;
			var x = velocity.x;
			var y = velocity.y;
			while(x > p.x) {
				x += velX;
				y += simulationVelY;
				simulationVelY += 0.1;
			}
			if(y >= p.y - 7 && y <= p.y + 46 && this.timeAiming > 60) {
				this.timeSinceAttack = 0;
				this.timeAiming = 0;
				var damage = Math.floor(Math.random() * (this.damHigh - this.damLow) + this.damLow);
				roomInstances[inRoom].content.push(new ShotArrow(velocity.x - p.worldX, velocity.y - p.worldY, velX, velY, damage, "enemy", "none", "a skeletal archer"));
			}
			else if(y <= p.y - 7) {
				this.aimRot ++;
				if(this.aimRot >= 405) {
					this.aimRot = 405;
					if(this.timeAiming > 60) {
						this.timeSinceAttack = 0;
						this.timeAiming = 0;
						var damage = Math.floor(Math.random() * (this.damHigh - this.damLow) + this.damLow);
						roomInstances[inRoom].content.push(new ShotArrow(velocity.x - p.worldX, velocity.y - p.worldY, velX, velY, damage, "enemy", "none", "a skeletal archer"));
					}
				}
			}
			else if(y >= p.y + 46) {
				this.aimRot --;
				if(this.aimRot <= 315) {
					this.aimRot = 315;
					if(this.timeAiming > 60) {
						this.timeSinceAttack = 0;
						this.timeAiming = 0;
						var damage = Math.floor(Math.random() * (this.damHigh - this.damLow) + this.damLow);
						roomInstances[inRoom].content.push(new ShotArrow(velocity.x - p.worldX, velocity.y - p.worldY, velX, velY, damage, "enemy", "none", "a skeletal archer"));
					}
				}
			}

		}
	}
};

function Particle(color, x, y, velX, velY, size) {
	this.color = color;
	this.x = x;
	this.y = y;
	this.velX = velX;
	this.velY = velY;
	this.size = size;
	this.opacity = 1;
};
Particle.prototype.exist = function() {
	var prevOp = c.globalAlpha;
	c.globalAlpha = this.opacity > 0 ? this.opacity : 0;
	c.fillStyle = "rgb(255, 0, 0)";
	c.fillStyle = this.color;
	if(this.z === undefined) {
		c.beginPath();
		c.arc(this.x + p.worldX, this.y + p.worldY, this.size, 0, 2 * Math.PI);
		c.fill();
	}
	else {
		var loc = point3d(this.x + p.worldX, this.y + p.worldY, this.z);
		c.beginPath();
		c.arc(loc.x, loc.y, this.size * this.z, 0, 2 * Math.PI);
		c.fill();
	}
	c.globalAlpha = prevOp;
	this.x += this.velX;
	this.y += this.velY;
	this.opacity -= 0.05;
	if(this.opacity <= 0) {
		this.splicing = true;
	}
};
function Wraith(x, y) {
	Enemy.call(this, x, y);
	this.particles = [];
	this.timeSinceAttack = 0;

	//hitbox
	this.leftX = -50;
	this.rightX = 50;
	this.topY = -50;
	this.bottomY = 50;

	//stats
	this.health = 150;
	this.maxHealth = 150;
	this.damLow = 40;
	this.damHigh = 50;
	this.defLow = 40;
	this.defHigh = 50;
	this.complexAttack = true;
	this.name = "a wraith of shadow";
};
inheritsFrom(Wraith, Enemy);
Wraith.prototype.display = function() {
	//particle graphics
	for(var i = 0; i < this.particles.length; i ++) {
		this.particles[i].exist();
		if(this.particles[i].opacity <= 0) {
			this.particles.splice(i, 1);
		}
	}
	for(var i = 0; i < 10; i ++) {
		var pos = Math.random() * 50;
		if(Math.random() < 0.5) {
			this.particles.push(new Particle("rgb(0, 0, 0)", this.x + Math.random() * pos, this.y + 50 - 2 * pos, Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 4 + 6));
		}
		else {
			this.particles.push(new Particle("rgb(0, 0, 0)", this.x - Math.random() * pos, this.y + 50 - 2 * pos, Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 4 + 6));
		}
		this.particles.push(new Particle("rgb(255, 0, 0)", this.x - 10, this.y - 25, Math.random() * 0.5, Math.random() * 0.5, Math.random() * 2 + 2));
		this.particles.push(new Particle("rgb(255, 0, 0)", this.x + 10, this.y - 25, Math.random() * 0.5, Math.random() * 0.5, Math.random() * 2 + 2));
	}
};
Wraith.prototype.update = function(dest) {
	if(dest === "player") {
		//movement
		if(Math.dist(this.x + p.worldX, this.y + p.worldY, p.x, p.y) <= 100) {
			var idealX = (this.x + p.worldX < p.x) ? p.x - p.worldX - 150 : p.x - p.worldX + 150;
			this.x += (idealX - this.x) / 60;
		}
		this.timeSinceAttack ++;
	}
	else {
		this.x = (this.x < dest.x) ? this.x + 2 : this.x - 2;
		this.y = (this.y < dest.y) ? this.y + 2 : this.y - 2;
	}
};
Wraith.prototype.attack = function() {
	//attacking
	if(this.timeSinceAttack > 60) {
		if(p.x > this.x + p.worldX) {
			var dist = Math.atan2(this.x + p.worldX - p.x, this.y + p.worldY - p.y) / Math.PI * -180;
			var aimCircle = findPointsCircular(0, 0, 100);
			dist = dist / 360 * aimCircle.length;
			dist = Math.floor(dist);
			while(dist < 0) {
				dist += 360;
			}
			while(dist > 360) {
				dist -= 360;
			}
			roomInstances[inRoom].content.push(new MagicCharge(this.x, this.y, aimCircle[dist].x / 10, aimCircle[dist].y / 10, "shadow"));
			this.timeSinceAttack = 0;
		}
		else {
			var dist = Math.atan2(p.x - (this.x + p.worldX), this.y + p.worldY - p.y) / Math.PI * -180;
			var aimCircle = findPointsCircular(0, 0, 100);
			dist = dist / 360 * aimCircle.length;
			dist = Math.floor(dist);
			while(dist < 0) {
				dist += 360;
			}
			while(dist > 360) {
				dist -= 360;
			}
			roomInstances[inRoom].content.push(new MagicCharge(this.x, this.y, aimCircle[dist].x / -10, aimCircle[dist].y / 10, "shadow"));
			this.timeSinceAttack = 0;
		}
	}
};

function MagicCharge(x, y, velX, velY, type, damage) {
	this.x = x;
	this.y = y;
	this.velX = velX;
	this.velY = velY;
	this.type = type;
	this.damage = damage;
	this.particles = [];
};
MagicCharge.prototype.exist = function() {
	//graphics
	for(var i = 0; i < this.particles.length; i ++) {
		this.particles[i].exist();
		if(this.particles[i].opacity <= 0) {
			this.particles.splice(i, 1);
		}
	}
	if(this.type === "shadow") {
		this.particles.push(new Particle("rgb(0, 0, 0)", this.x, this.y, Math.random() * 2 - 1, Math.random() * 2 - 1, 10));
	}
	else if(this.type === "purity") {
		this.particles.push(new Particle("rgb(255, 255, 255)", this.x, this.y, Math.random() * 2 - 1, Math.random() * 2 - 1, 10));
	}
	else if(this.type === "energy") {
		this.particles.push(new Particle("hsl(" + (frameCount % 360) + ", 100%, 50%)", this.x, this.y, Math.random() * 2 - 1, Math.random() * 2 - 1, 10));
	}
	else if(this.type === "chaos") {
		this.particles.push(new Particle("rgb(" + (Math.random() * 255) + ", " + (Math.random() * 0) + ", " + (Math.random() * 0) + ")", this.x, this.y, Math.random() * 2 - 1, Math.random() * 2 - 1, 10));
	}
	else if(this.type === "fire") {
		this.particles.push(new Particle("rgb(255, 128, 0)", this.x, this.y, Math.random() * 2 - 1, Math.random() * 2 - 1, 10));
	}
	else if(this.type === "water") {
		this.particles.push(new Particle("rgb(0, 128, 255)", this.x, this.y, Math.random() * 2 - 1, Math.random() * 2 - 1, 10));
	}
	else if(this.type === "earth") {
		this.particles.push(new Particle("rgb(0, 160, 0)", this.x, this.y, Math.random() * 2 - 1, Math.random() * 2 - 1, 10));
	}
	else if(this.type === "air") {
		this.particles.push(new Particle("rgb(170, 170, 170)", this.x, this.y, Math.random() * 2 - 1, Math.random() * 2 - 1, 10));
	}
	//movement
	this.x += this.velX;
	this.y += this.velY;
	//collision with enemies + objects
	for(var i = 0; i < roomInstances[inRoom].content.length; i ++) {
		if(roomInstances[inRoom].content[i] instanceof Enemy && this.type !== "shadow" && this.shotBy !== "enemy") {
			var enemy = roomInstances[theRoom].content[i];
			if(this.x + 10 > enemy.x + enemy.leftX && this.x - 10 < enemy.x + enemy.rightX && this.y + 10 > enemy.y + enemy.topY && this.y - 10 < enemy.y + enemy.bottomY) {
				this.splicing = true;
				enemy.hurt(this.damage);
				if(this.type === "fire") {
					enemy.timeBurning = (enemy.timeBurning <= 0) ? 180 : enemy.timeBurning;
					enemy.burnDmg = 2;
				}
				else if(this.type === "water") {
					enemy.timeFrozen = (enemy.timeFrozen < 0) ? 240 : enemy.timeFrozen;
				}
				else if(this.type === "earth" && p.canUseEarth) {
					//find lowest roof directly above weapon
					var lowestIndex = null;
					for(var j = 0; j < roomInstances[inRoom].content.length; j ++) {
						var block = roomInstances[inRoom].content[j];
						if(lowestIndex !== null) {
							if(block instanceof Block) {
								if(enemy.x > block.x && enemy.x < block.x + block.w && block.y + block.h > roomInstances[inRoom].content[lowestIndex].y + roomInstances[inRoom].content[lowestIndex].h) {
									if(block.y + roomInstances[inRoom].content[j].h <= enemy.y - p.worldY + enemy.topY) {
										lowestIndex = j;
									}
								}
							}
						}
						else if(roomInstances[inRoom].content[j] instanceof Block) {
							if(lowestIndex === null) {
								if(enemy.x > roomInstances[inRoom].content[j].x && enemy.x < roomInstances[inRoom].content[j].x + roomInstances[inRoom].content[j].w) {
									if(roomInstances[inRoom].content[j].y <= enemy.y - p.worldY) {
										lowestIndex = j;
									}
								}
							}
						}
					}
					roomInstances[inRoom].content.push(new BoulderVoid(enemy.x, roomInstances[inRoom].content[lowestIndex].y + roomInstances[inRoom].content[lowestIndex].h));
					roomInstances[inRoom].content.push(new Boulder(enemy.x, roomInstances[inRoom].content[lowestIndex].y + roomInstances[inRoom].content[lowestIndex].h, Math.random() * 2 + 2));
				}
				else if(this.type === "air") {
					roomInstances[inRoom].content.push(new WindBurst(this.x, this.y, this.velX < 0 ? "left" : "right", true));
				}
				else if(this.type === "purity") {
					enemy.timePurified = (enemy.timePurified <= 0) ? 600 : 0;
				}
				else if(this.type === "chaos") {
					var hp = enemy.health;
					// console.log("BEFORE: ");
					// console.log(roomInstances[theRoom].content);
					roomInstances[theRoom].content[i] = new RandomEnemy(enemy.x, enemy.y + enemy.bottomY, enemy.constructor);
					roomInstances[theRoom].content[i].generate();
					// console.log("AFTER: ");
					// console.log(roomInstances[theRoom].content);
					roomInstances[theRoom].content[i].health = hp;
					if(roomInstances[theRoom].content[i].health > roomInstances[theRoom].content[i].maxHealth) {
						roomInstances[theRoom].content[i].health = roomInstances[theRoom].content[i].maxHealth;
					}
					roomInstances[theRoom].content.splice(roomInstances[theRoom].content.length - 1, 1);
					return;
				}
			}
		}
		else if(roomInstances[inRoom].content[i] instanceof Bridge) {
			var bridge = roomInstances[inRoom].content[i];
			if(Math.distSq(this.x, this.y, bridge.x, bridge.y + 500) < 250000) {
				this.splicing = true;
				if(this.type === "chaos") {
					p.x = this.x + p.worldX;
					p.y = this.y + p.worldY - 46;
				}
			}
		}
	}
	//collision with player
	if(this.x + p.worldX > p.x - 5 && this.x + p.worldX < p.x + 5 && this.y + p.worldY > p.y - 7 && this.y + p.worldY < p.y + 46 && (this.type === "shadow" || (this.type === "fire" && this.shotBy === "enemy"))) {
		var damage = Math.round(Math.random() * 10) + 40;
		p.hurt(damage, (this.type === "shadow") ? "a wraith" : "a dragonling");
		this.splicing = true;
	}
};

function Troll(x, y) {
	Enemy.call(this, x, y);
	this.curveArray = findPointsCircular(0, 0, 10);
	this.attackArmDir = 2;
	this.attackArm = 0;
	this.leg1 = -2;
	this.leg2 = 2;
	this.leg1Dir = -0.125;
	this.leg2Dir = 0.125;
	this.currentAction = "move";
	this.timeDoingAction = 0;

	//hitbox
	this.leftX = -60;
	this.rightX = 60;
	this.topY = -50;
	this.bottomY = 60;

	//stats
	this.health = 150;
	this.maxHealth = 150;
	this.defLow = 50;
	this.defHigh = 70;
	this.damLow = 50;
	this.damHigh = 70;
	this.complexAttack = true;
	this.name = "a troll";
	this.nonMagical = true;
};
inheritsFrom(Troll, Enemy);
Troll.prototype.display = function() {
	c.save();
	c.translate(this.x + p.worldX, this.y + p.worldY);
	c.scale(0.75, 0.75);
	//rounded shoulders
	{
	c.fillStyle = "rgb(0, 128, 0)";
	circle(0 - 50, 0 - 20, 10);
	circle(0 + 50, 0 - 20, 10);
	circle(0 - 20, 0 + 50, 10);
	circle(0 + 20, 0 + 50, 10);
	}
	//body
	{
	c.fillRect(0 - 50, 0 - 30, 100, 30);
	c.beginPath();
	c.moveTo(0 - 60, 0 - 20);
	c.lineTo(0 + 60, 0 - 20);
	c.lineTo(0 + 30, 0 + 50);
	c.lineTo(0 - 30, 0 + 50);
	c.fill();
	c.fillRect(0 - 20, 0 + 10, 40, 50);
	}
	//legs
	{
	c.fillStyle = "rgb(30, 128, 30)";
	for(var scale = -1; scale <= 1; scale += 2) {
		c.save();
		if(scale === -1) {
			c.translate(3 * this.leg1, 7 * this.leg1);
		}
		else {
			c.translate(-3 * this.leg2, 7 * this.leg2);
		}
		c.scale(scale, 1);
		c.translate(-5, 0);
		circle(45, 30, 5);
		circle(30, 50, 5);
		circle(60, 30, 5);
		circle(60, 70, 5);
		circle(30, 70, 5);
		c.fillRect(45, 25, 15, 10);
		c.fillRect(25, 50, 40, 20);
		c.fillRect(30, 70, 30, 5);
		c.fillRect(45, 30, 20, 30);
		c.beginPath();
		c.moveTo(40, 30);
		c.lineTo(25, 30);
		c.lineTo(25, 70);
		c.lineTo(40, 70);
		c.lineTo(50, 70);
		c.lineTo(50, 30);
		c.fill();
		c.restore();
	}
	this.leg1 += this.leg1Dir;
	this.leg2 += this.leg2Dir;
	if(this.currentAction === "move") {
		this.leg1Dir = (this.leg1 > 2) ? -0.2 : this.leg1Dir;
		this.leg1Dir = (this.leg1 < -2) ? 0.2 : this.leg1Dir;
		this.leg2Dir = (this.leg2 > 2) ? -0.2 : this.leg2Dir;
		this.leg2Dir = (this.leg2 < -2) ? 0.2 : this.leg2Dir;
	}
	else {
		this.leg1Dir = (this.leg1 < 0) ? 0.2 : this.leg1Dir;
		this.leg1Dir = (this.leg1 > 0) ? -0.2 : this.leg1Dir;
		this.leg2Dir = (this.leg2 < 0) ? 0.2 : this.leg2Dir;
		this.leg2Dir = (this.leg2 > 0) ? -0.2 : this.leg2Dir;
	}
	}
	//head
	circle(0, -40, 20);
	c.restore();
	//right arm
	{
	c.save();
	c.translate(this.x + p.worldX + 40, this.y + p.worldY - 10);
	if(this.armAttacking === "right") {
		c.rotate(this.attackArm / 180 * Math.PI);
	}
	else {
		c.rotate(60 / 180 * Math.PI);
	}
	if(this.x + p.worldX < p.x && this.currentAction === "melee-attack") {
		c.fillStyle = "rgb(139, 69, 19)";
		c.beginPath();
		c.moveTo(45, 0);
		c.lineTo(50, -70);
		c.lineTo(30, -70);
		c.lineTo(35, 0);
		c.fill();
		circle(40, -70, 10);
	}
	c.fillStyle = "rgb(0, 128, 0)";
	circle(0, -10, 5);
	circle(0, 10, 5);
	circle(50, -10, 5);
	circle(50, 10, 5);
	c.fillRect(-5, -10, 60, 20);
	c.fillRect(0, -15, 50, 30);
	c.restore();
	}
	//left arm
	{
	c.save();
	c.translate(this.x + p.worldX - 40, this.y + p.worldY - 10);
	if(this.armAttacking === "left") {
		c.rotate(-this.attackArm / 180 * Math.PI);
	}
	else {
		c.rotate(-60 / 180 * Math.PI);
	}
	if(this.x + p.worldX > p.x && this.currentAction === "melee-attack") {
		c.fillStyle = "rgb(139, 69, 19)";
		c.beginPath();
		c.moveTo(-45, 0);
		c.lineTo(-50, -70);
		c.lineTo(-30, -70);
		c.lineTo(-35, 0);
		c.fill();
		circle(-40, -70, 10);
	}
	c.fillStyle = "rgb(0, 128, 0)";
	circle(0, -10, 5);
	circle(0, 10, 5);
	circle(-50, -10, 5);
	circle(-50, 10, 5);
	c.fillRect(-55, -10, 60, 20);
	c.fillRect(-50, -15, 50, 30);
	c.restore();
	}
};
Troll.prototype.update = function() {
	//movement
	this.x += this.velX;
	this.y += this.velY;
	this.velY += 0.1;
	this.attackArm += this.attackArmDir;
	// this.attackRecharge ++;
	if(this.currentAction === "move") {
		if(this.x + p.worldX < p.x) {
			this.velX = (this.x + p.worldX < p.x - 100) ? 1 : this.velX;
			this.velX = (this.x + p.worldX > p.x - 100) ? -1 : this.velX;
		}
		else {
			this.velX = (this.x + p.worldX < p.x + 100) ? 1 : this.velX;
			this.velX = (this.x + p.worldX > p.x + 100) ? -1 : this.velX;
		}
		this.timeDoingAction ++;
		if(this.timeDoingAction > 90) {
			if(Math.abs(this.x + p.worldX - p.x) > 150) {
				this.currentAction = "ranged-attack";
			}
			else {
				this.currentAction = "melee-attack";
			}
			this.timeDoingAction = 0;
			this.attackArm = 55, this.attackArmDir = 0;
		}
	}
	else if(this.currentAction === "ranged-attack") {
		this.velX = 0;
		this.walking = false;
		if(this.x + p.worldX < p.x) {
			this.armAttacking = "left";
		}
		else {
			this.armAttacking = "right";
		}
		if(this.attackArmDir === 0) {
			this.attackArmDir = -5;
		}
		if(this.attackArm < -45) {
			if(this.armAttacking === "left") {
				roomInstances[theRoom].content.push(new Rock(this.x - 40 - 35, this.y - 10 - 35, 3, -4));
			}
			else {
				roomInstances[theRoom].content.push(new Rock(this.x + 40 + 35, this.y - 10 - 35, -3, -4));
			}
			this.attackArmDir = 5;
		}
		if(this.attackArm >= 60) {
			this.attackArmDir = 0;
			this.currentAction = "move";
			this.timeDoingAction = 0;
			this.attackArmDir = 0;
		}
	}
	else if(this.currentAction === "melee-attack") {
		this.velX = 0;
		this.attackArmDir = (this.attackArm > 80) ? -2 : this.attackArmDir;
		this.attackArmDir = (this.attackArm < 0) ? 2 : this.attackArmDir;
		this.attackArmDir = (this.attackArmDir === 0) ? -2 : this.attackArmDir;
		if(this.x + p.worldX < p.x) {
			this.armAttacking = "right";
		}
		else {
			this.armAttacking = "left";
		}
		this.timeDoingAction ++;
		if(this.timeDoingAction > 90) {
			this.timeDoingAction = 0;
			this.currentAction = "move";
			this.attackArm = 50, this.attackArmDir = 0;
		}
		for(var y = -70; y < 0; y += 10) {
			var weaponPos = Math.rotate(40, y, this.attackArm);
			if(this.armAttacking === "left") {
				weaponPos.x = -weaponPos.x;
			}
			weaponPos.x += this.x + p.worldX + (this.armAttacking === "right" ? 40 : -40);
			weaponPos.y += this.y + p.worldY - 10;
			if(weaponPos.x > p.x - 5 && weaponPos.x < p.x + 5 && weaponPos.y > p.y - 7 && weaponPos.y < p.y + 46 && this.attackRecharge < 0) {
				p.hurt(Math.floor(Math.random() * 10 + 40), "a troll");
				this.attackRecharge = 45;
			}
			// c.fillStyle = "rgb(0, 255, 0)";
			// c.fillRect(weaponPos.x, weaponPos.y, 2, 2);
		}
	}
	collisionRect(this.x + p.worldX - 40, this.y + p.worldY - 20, 80, 60);
};

function Rock(x, y, velX, velY) {
	this.x = x;
	this.y = y;
	this.velX = velX;
	this.velY = velY;
	this.hitSomething = false;
	this.hitPlayer = false;
	this.opacity = 1;
	this.fragments = [];
};
Rock.prototype.exist = function() {
	if(!this.hitSomething) {
		this.x += this.velX;
		this.y += this.velY;
		this.velY += 0.1;
		c.save();
		c.globalAlpha = this.opacity;
		c.fillStyle = "rgb(140, 140, 140)";
		c.beginPath();
		c.arc(this.x + p.worldX, this.y + p.worldY, 20, 0, 2 * Math.PI);
		c.fill();
		c.restore();
	}
	if(!this.hitPlayer && this.x + p.worldX + 20 > p.x - 5 && this.x + p.worldX - 20 < p.x + 5 && this.y + p.worldY + 20 > p.y - 7 && this.y + p.worldY - 20 < p.y + 46) {
		p.hurt(Math.random() * 10 + 40, "a troll");
		this.hitPlayer = true;
	}
	if(!this.hitSomething) {
		for(var i = 0; i < roomInstances[theRoom].content.length; i ++) {
			if(roomInstances[theRoom].content[i] instanceof Block) {
				var block = roomInstances[theRoom].content[i];
				if(this.x + 20 > block.x && this.x - 20 < block.x + block.w && this.y + 20 > block.y && this.y - 20 < block.y + block.h) {
					this.hitSomething = true;
					for(var j = 0; j < 10; j ++) {
						this.fragments.push({
							x: this.x + (Math.random() * 10 - 5), y: this.y + (Math.random() * 10 - 5),
							velX: Math.random() * 2 - 1, velY: Math.random() * 2 - 1,
							opacity: 2
						});
					}
				}
			}
		}
	}
	else {
		c.save();
		c.fillStyle = "rgb(140, 140, 140)";
		for(var i = 0; i < this.fragments.length; i ++) {
			c.globalAlpha = this.fragments[i].opacity;
			c.beginPath();
			c.arc(this.fragments[i].x + p.worldX, this.fragments[i].y + p.worldY, 5, 0, 2 * Math.PI);
			c.fill();
			this.fragments[i].x += this.fragments[i].velX;
			this.fragments[i].y += this.fragments[i].velY;
			this.fragments[i].velY += 0.1;
			this.fragments[i].opacity -= 0.05;
			if(this.fragments[i].opacity <= 0) {
				this.splicing = true;
			}
			continue;
			for(var j = 0; j < roomInstances[theRoom].content.length; j ++) {
				if(roomInstances[theRoom].content[i] instanceof Block) {

				}
			}
		}
		c.restore();
	}
};

function Dragonling(x, y) {
	Enemy.call(this, x, y);
	this.destX = (p.x - p.worldX);
	this.destY = (p.y - p.worldY);
	this.velX = 0;
	this.velY = 0;
	this.pos = [];
	for(var i = 0; i < 30; i ++) {
		this.pos.push({ x: this.x, y: this.y });
	}
	this.rot = 0;
	this.mouth = 20;
	this.mouthDir = 0;
	this.currentAction = "bite";
	this.reload = 0;
	//stats
	this.damLow = 50;
	this.damHigh = 60;
	this.defLow = 50;
	this.defHigh = 60;
	this.health = 150;
	this.maxHealth = 150;
	this.name = "a dragonling";
	//hitbox
	this.leftX = -5;
	this.rightX = 5;
	this.topY = -5;
	this.bottomY = 20;
};
inheritsFrom(Dragonling, Enemy);
Dragonling.prototype.display = function() {
	//back wing
	c.fillStyle  = "rgb(0, 235, 0)";
	var p1 = {x: this.pos[25].x + p.worldX, y: this.pos[25].y + p.worldY};
	var slope = Math.normalize(this.pos[11].x - this.pos[5].x, this.pos[11].y - this.pos[5].y);
	var p2 = point3d((slope.x * 15) + this.pos[25].x + p.worldX, (slope.y * 15) + this.pos[25].y + p.worldY, 0.9);
	var p3 = point3d((-slope.x * 15) + this.pos[25].x + p.worldX, (-slope.y * 15) + this.pos[25].y + p.worldY, 0.9);
	var p4 = point3d(p1.x, p1.y, 0.8);
	c.beginPath();
	c.moveTo(p2.x, p2.y),
	c.lineTo(p4.x, p4.y),
	c.lineTo(p3.x, p3.y),
	c.lineTo(p1.x, p1.y);
	c.fill();
	//mouth
	c.fillStyle = "rgb(0, 255, 0)";
	c.save();
	c.translate(this.x + p.worldX, this.y + p.worldY);
	c.rotate(Math.rad(this.rot));
	c.beginPath();
	c.moveTo(0, -10);
	c.lineTo(20, -20);
	c.lineTo(this.mouth, -50);
	c.lineTo(0, 10);
	c.lineTo(-this.mouth, -50);
	c.lineTo(-20, -20);
	c.fill();
	c.restore();
	//bite mouth
	if((Math.distSq(this.x + p.worldX, this.y + p.worldY, p.x + 5, p.y - 7) <= 1600 || Math.distSq(this.x + p.worldX, this.y + p.worldY, p.x - 5, p.y - 7) <= 1600 || Math.distSq(this.x + p.worldX, this.y + p.worldY, p.x + 5, p.y + 46) <= 1600 || Math.distSq(this.x + p.worldX, this.y + p.worldY, p.x - 5, p.y + 46) <= 1600) && this.mouthDir === 0 && this.currentAction === "bite") {
		this.mouthDir = -1;
		this.currentAction = "shoot";
	}
	if(this.mouth < 0) {
		this.mouthDir = 1;
	}
	if(this.mouth > 20 && this.mouthDir === 1) {
		this.mouthDir = 0;
	}
	this.mouth += this.mouthDir;
	//tail
	c.strokeStyle = "rgb(0, 255, 0)";
	c.lineWidth = 5;
	c.save();
	c.translate(p.worldX, p.worldY);
	for(var i = 0; i < this.pos.length; i ++) {
		c.beginPath();
		if(i === this.pos.length - 1) {
			c.moveTo(this.x, this.y);
		}
		else {
			c.moveTo(this.pos[i + 1].x, this.pos[i + 1].y);
		}
		c.lineTo(this.pos[i].x, this.pos[i].y);
		c.stroke();
	}
	c.restore();
	//update tail position
	this.pos.push({x: this.x, y: this.y});
	if(this.pos.length > 30) {
		this.pos.splice(0, 1);
	}
	//front wing
	c.fillStyle = "rgb(20, 255, 20)";
	var p2 = point3d((slope.x * 15) + this.pos[25].x + p.worldX, (slope.y * 15) + this.pos[25].y + p.worldY, 1.1);
	var p3 = point3d((-slope.x * 15) + this.pos[25].x + p.worldX, (-slope.y * 15) + this.pos[25].y + p.worldY, 1.1);
	var p4 = point3d(p1.x, p1.y, 1.2);
	c.beginPath();
	c.moveTo(p2.x, p2.y),
	c.lineTo(p4.x, p4.y),
	c.lineTo(p3.x, p3.y),
	c.lineTo(p1.x, p1.y);
	c.fill();
};
Dragonling.prototype.update = function() {
	//move according to rotation
	var theVel = Math.rotate(0, -10, this.rot);
	this.velX += theVel.x / 100;
	this.velY += theVel.y / 100;
	if(!this.frozen) {
		this.x += this.velX;
		this.y += this.velY;
	}
	//accelerate towards destination
	var idealAngle = calcAngleDegrees(this.x - this.destX, this.y - this.destY) - 90;
	var cw = Math.abs(this.rot - (idealAngle + 360));
	var ccw = Math.abs(this.rot - (idealAngle - 360));
	var normal = Math.abs(this.rot - idealAngle);
	var theClosest = Math.min(cw, ccw, normal);
	if(theClosest === cw) {
		this.rot -= 360;
	}
	else if(theClosest === ccw) {
		this.rot += 360;
	}
	this.rot += (this.rot < idealAngle) ? 2 : -2;
	//update destination
	if(this.currentAction === "bite") {
		this.destX = p.x - p.worldX;
		this.destY = p.y - p.worldY;
	}
	else if(this.currentAction === "shoot") {
		if(this.velY > 0) {
			this.destX = this.x + (this.velX > 0) ? 100 : -100;
			this.destY = this.y - 50;
		}
		else {
			this.destX = this.x;
			this.destY = this.y;
		}
	}
	//shoot fireballs
	var idealAngle = calcAngleDegrees(this.x - (p.x - p.worldX), this.y - (p.y - p.worldY)) - 90;
	if(this.reload > 120 && Math.abs(this.rot - idealAngle) <= 2 && Math.distSq(this.x + p.worldX, this.y + p.worldY, p.x, p.y) >= 10000) {
		roomInstances[theRoom].content.push(new MagicCharge(this.x, this.y, theVel.x, theVel.y, "fire", Math.random() * 10 + 40));
		roomInstances[theRoom].content[roomInstances[theRoom].content.length - 1].shotBy = "enemy";
		this.currentAction = "bite";
		this.reload = 0;
	}
	this.reload ++;
	//update hitbox
	while(this.rot > 360) {
		this.rot -= 360;
	}
	while(this.rot < 0) {
		this.rot += 360;
	}
	// this.rot = 90;
	if(this.rot >= 315 || this.rot < 45) {
		this.leftX = -20;
		this.rightX = 20;
		this.topY = -40;
		this.bottomY = 0;
	}
	else if(this.rot >= 45 && this.rot < 135) {
		this.leftX = 0;
		this.rightX = 40;
		this.topY = -20;
		this.bottomY = 20;
	}
	else if(this.rot >= 135 && this.rot < 225) {
		this.leftX = -20;
		this.rightX = 20;
		this.topY = 0;
		this.bottomY = 40;
	}
	else if(this.rot >= 225 && this.rot < 315) {
		this.leftX = -40;
		this.rightX = 0;
		this.topY = -20;
		this.bottomY = 20;
	}
};

//hax
if(hax) {
	// p.class = "mage";
	// p.reset();
	p.onScreen = "play";
	for(var i = 0; i < items.length; i ++) {
		// p.addItem(new items[i]());
	}
	// roomInstances = [new Room("parkour", [new Pillar(500, 600, 150), new Platform(600, 450, 200)], 0, -Infinity, "bricks")];
	// p.addItem(new EnergyStaff());
	// p.addItem(new Dagger("light"));
	p.addItem(new WoodBow());
	p.addItem(new Arrow(Infinity));
}
/** MENUS & UI **/
var warriorClass = new Player();
warriorClass.x = 175;
warriorClass.y = 504;
var archerClass = new Player();
archerClass.addItem(new WoodBow());
archerClass.attackingWith = new WoodBow();
archerClass.activeSlot = 0;
archerClass.x = 400;
archerClass.y = 504;
var mageClass = new Player();
mageClass.x = 625;
mageClass.y = 504;
mageClass.addItem(new EnergyStaff());
mageClass.attackingWith = new EnergyStaff();
mageClass.activeSlot = 0;
var howChar = new Player();
howChar.init();
var tutorialWorld = new Room(
	"tutorial",
	[
		new Block(-4000, 400, 8000, 1000), //floor
		new Block(-4000, -4000, 4400, 8000), //left wall
		new MovingWall(400, -4000, 300, 4400),
		new MovingWall(1100, -4000, 300, 4300, 1.1),
		new Block(700, 300, 1000, 1000), //higher floor
		new Chest(900, 300),
		new Spider(1600, 200),
		new Block(1700, -4000, 1000, 8000) //far right wall
	],
	"?"
);
var platHeight1 = 550;
var platHeight2 = 550;
var platHeight3 = 550;
var fading = "none";
var fadeOp = 0;
var fadeDest = "none";
var btn1 = 0;
var btn2 = 0;
var btn3 = 0;
/** FRAMES **/
function doByTime() {
	if(hax) {
		p.health = p.maxHealth;
	}
	cursorHand = false;
	frameCount ++;
	resizeCanvas();
	c.fillStyle = "rgb(100, 100, 100)";
	c.fillRect(0, 0, 800, 800);

	if(p.onScreen === "play") {
		//load enemies in other rooms
		var unseenEnemy = false;
		for(var i = 0; i < roomInstances.length; i ++) {
			if(roomInstances[i].containsEnemies() && i !== inRoom) {
				unseenEnemy = true;
				break;
			}
		}
		if(unseenEnemy) {
			outerLoop: for(var i = 0; i < roomInstances.length; i ++) {
				theRoom = i;
				if(i !== inRoom && roomInstances[i].containsEnemies()) {
					roomInstances[i].exist(i);
				}
				for(var j = 0; j < roomInstances[i].content.length; j ++) {
					if(roomInstances[i].content[j] instanceof Enemy) {
						var enemy = roomInstances[i].content[j];
						for(var k = 0; k < roomInstances[i].content.length; k ++) {
							if(roomInstances[i].content[k] instanceof Door) {
								var door = roomInstances[i].content[k];
								if(typeof door.dest !== "number") {
									continue;
								}
								var nextRoom = roomInstances[door.dest];
								if(enemy.x + enemy.rightX > door.x - 30 && enemy.x + enemy.leftX < door.x + 30 && enemy.y + enemy.bottomY > door.y - 60 && enemy.y + enemy.topY < door.y + 3 && roomInstances[door.dest].pathScore < roomInstances[i].pathScore) {
									for(var l = 0; l < nextRoom.content.length; l ++) {
										if(nextRoom.content[l] instanceof Door) {
											var exitDoor = nextRoom.content[l];
											if(exitDoor.dest !== i) {
												continue;
											}
											var movedEnemy = new (enemy.constructor)();
											movedEnemy.x = exitDoor.x;
											movedEnemy.y = exitDoor.y - movedEnemy.bottomY;
											movedEnemy.opacity = 0;
											movedEnemy.fadingIn = true;
											movedEnemy.seesPlayer = false;
											movedEnemy.health = enemy.health;
											roomInstances[i].content.splice(j, 1);
											nextRoom.content.push(movedEnemy);
											break outerLoop;
										}
									}
								}
							}
						}
					}
				}
			}
		}
		p.update();

		roomInstances[inRoom].displayBackground();

		for(var i = 0; i < roomInstances.length; i ++) {
			if(roomInstances[i].id === "?") {
				roomInstances[i].id = numRooms;
				numRooms ++;
			}
			if(inRoom === roomInstances[i].id && (!unseenEnemy || true)) {
				theRoom = i;
				roomInstances[i].exist(i);
			}
			if(roomInstances[i].containsEnemies() && false) {
				for(var j = 0; j < roomInstances[i].content.length; j ++) {
					if(roomInstances[i].content[j] instanceof Enemy) {
						for(var k = 0; k < roomInstances[i].content.length; k ++) {
							if(roomInstances[i].content[k] instanceof Door && roomInstances[i].content[k].dest === inRoom) {
								var distance = Math.dist(roomInstances[i].content[j].x, roomInstances[i].content[j].y, roomInstances[i].content[k].x, roomInstances[i].content[k].y);
							}
						}
					}
				}
			}
		}

		p.display();
		p.gui();
		//move player into lower room when falling
		if(p.y + 46 > 900) {
			p.fallDir = 0.05;
		}
	}
	else if(p.onScreen === "home") {
		boxFronts = [];
		p.worldX = 0;
		p.worldY = 0;
		new Block(-100, 600, 1000, 200).display();
		//title
		c.fillStyle = "rgb(0, 0, 0)";
		c.font = "80px Cursive";
		c.textAlign = "center";
		c.fillText("stick", 400, 100);
		c.fillStyle = "rgb(150, 150, 150)";
		c.font = "bolder 80px Arial black";
		c.fillText("DUNGEON", 400, 200);
		//left door
		c.fillStyle = "rgb(20, 20, 20)";
		c.fillRect(40, 440, 170, 140);
		c.beginPath();
		c.arc(125, 440, 85, 0, 2 * Math.PI);
		c.fill();
		//left door text
		c.lineWidth = 1;
		c.strokeStyle = "rgb(255, 255, 255)";
		c.font = "100 20px Germania One";
		c.fillStyle = "rgb(255, 255, 255)";
		c.fillText("H o w", 125, 492.5);
		c.fillStyle = "rgb(20, 20, 20)";
		if(btn2 > 0) {
			c.beginPath();
			c.moveTo(125 - btn2, 505);
			c.lineTo(125 + btn2, 505);
			c.stroke();
			c.beginPath();
			c.moveTo(125 - btn2, 505 - 40);
			c.lineTo(125 + btn2, 505 - 40);
			c.stroke();
		}
		//middle door
		c.fillRect(320, 380, 160, 200);
		c.beginPath();
		c.arc(400, 380, 80, 0, 2 * Math.PI);
		c.fill();
		//middle door text
		c.font = "100 20px Germania One";
		c.fillStyle = "rgb(255, 255, 255)";
		c.fillText("P l a y", 400, 452.5);
		if(btn1 > 0) {
			c.beginPath();
			c.moveTo(400 - btn1, 465);
			c.lineTo(400 + btn1, 465);
			c.stroke();
			c.beginPath();
			c.moveTo(400 - btn1, 425);
			c.lineTo(400 + btn1, 425);
			c.stroke();
		}
		//right door
		c.fillStyle = "rgb(20, 20, 20)";
		c.fillRect(590, 440, 170, 140);
		c.beginPath();
		c.arc(675, 440, 85, 0, 2 * Math.PI);
		c.fill();
		c.font = "100 20px Germania One";
		c.fillStyle = "rgb(255, 255, 255)";
		c.fillText("S c o r e s", 675, 492.5);
		if(btn3 > 0) {
			c.beginPath();
			c.moveTo(675 - btn3, 505);
			c.lineTo(675 + btn3, 505);
			c.stroke();
			c.beginPath();
			c.moveTo(675 - btn3, 505 - 40);
			c.lineTo(675 + btn3, 505 - 40);
			c.stroke();
		}
		//right door text
		loadBoxFronts();
		if(Math.dist(mouseX, mouseY, 400, 380) <= 80 || (mouseX > 320 && mouseX < 480 && mouseY > 380 && mouseY < 580)) {
			cursorHand = true;
			if(btn1 < 50) {
				btn1 += 5;
			}
			if(mouseIsPressed) {
				inRoom = 0, theRoom = 0;
				fading = "out";
				fadeDest = "class-select";
			}
		}
		else if(btn1 > 0) {
			btn1 -= 5;
		}
		if(Math.dist(mouseX, mouseY, 125, 440) <= 85 || (mouseX > 40 && mouseX < 40 + 170 && mouseY > 380 && mouseY < 580)) {
			cursorHand = true;
			if(btn2 < 40) {
				btn2 += 5;
			}
			if(mouseIsPressed) {
				howChar.reset(), p.reset();
				for(var i = 0; i < howChar.invSlots.length; i ++) {
					howChar.invSlots[i].content = "empty";
					p.invSlots[i].content = "empty";
				}
				roomInstances = [new Room(
					"tutorial",
					[
						new Block(-4000, 400, 8000, 1000), //floor
						new Block(-4000, -4000, 4400, 8000), //left wall
						new MovingWall(400, -4000, 300, 4400),
						new MovingWall(1100, -4000, 300, 4300, 1.1),
						new Block(700, 300, 1000, 1000), //higher floor
						new Chest(900, 300),
						new Spider(1600, 200),
						new Block(1700, -4000, 1000, 8000) //far right wall
					],
					"?"
				)];
				howChar.txt = "arrow keys to move, up to jump";
				inRoom = 0, theRoom = 0;
				fading = "out";
				fadeDest = "how";
				if(p.invSlots[0].content === "empty") {
					p.addItem(new Sword());
				}
				p.invSlots[3].content = new EnergyStaff();
				p.invSlots[17].content = new Arrow(Infinity);
			}
		}
		else if(btn2 > 0) {
			btn2 -= 5;
		}
		if(Math.dist(mouseX, mouseY, 675, 440) <= 85 || (mouseX > 590 && mouseX < 590 + 170 && mouseY > 380 && mouseY < 580)) {
			cursorHand = true;
			if(btn3 < 40) {
				btn3 += 5;
			}
			if(mouseIsPressed) {
				fading = "out";
				fadeDest = "scores";
			}
		}
		else if(btn3 > 0) {
			btn3 -= 5;
		}
	}
	else if(p.onScreen === "class-select") {
		keys = [];
		boxFronts = [];
		//ground
		new Block(-100, 600, 1000, 200).display();
		new Block(100, platHeight1, 150, 200).display();
		new Block(325, platHeight2, 150, 200).display();
		new Block(550, platHeight3, 150, 200).display();
		//warrior
		warriorClass.y = platHeight1 - 46;
		warriorClass.display(true, true);
		c.save();
		c.translate(190, platHeight1 - 30);
		c.scale(1, 0.65);
		c.rotate(Math.PI);
		new Sword().display("attacking");
		c.restore();
		//archer
		archerClass.y = platHeight2 - 46;
		archerClass.aiming = true;
		archerClass.aimRot = 45;
		archerClass.display(true);
		//mage
		mageClass.y = platHeight3 - 46;
		mageClass.aiming = true;
		mageClass.facing = "left";
		mageClass.display(true);
		c.fillStyle = "rgb(150, 150, 150)";
		c.font = "bolder 40px Arial black";
		c.textAlign = "center";
		c.fillText("Warrior", 175, 200);
		c.fillText("Archer", 400, 200);
		c.fillText("Mage", 625, 200);
		c.font = "20px monospace";
		c.textAlign = "left";
		c.fillText("+1 melee damage", 100, 250);
		c.fillText("+Start with sword", 100, 290);
		c.fillText("+Start with helmet", 100, 330);
		c.fillText("+1 ranged damage", 325, 250);
		c.fillText("+Start with bow", 325, 290);
		c.fillText("+Start with dagger", 325, 330);
		c.fillText("+1 magic damage", 550, 250);
		c.fillText("+Start with staff", 550, 290);
		c.fillText("+Start with dagger", 550, 330);
		if(mouseX < 300) {
			platHeight1 -= (platHeight1 > 500) ? 5 : 0;
			if(mouseIsPressed && !pMouseIsPressed) {
				p.class = "warrior";
				fading = "out";
				fadeDest = "play";
				p.reset();
			}
		}
		else {
			platHeight1 += (platHeight1 < 550) ? 5 : 0;
		}
		if(mouseX > 300 && mouseX < 500) {
			platHeight2 -= (platHeight2 > 500) ? 5 : 0;
			if(mouseIsPressed && !pMouseIsPressed) {
				p.class = "archer";
				fading = "out";
				fadeDest = "play";
				p.reset();
			}
		}
		else {
			platHeight2 += (platHeight2 < 550) ? 5 : 0;
		}
		if(mouseX > 500) {
			platHeight3 -= (platHeight3 > 500) ? 5 : 0;
			if(mouseIsPressed && !pMouseIsPressed) {
				p.class = "mage";
				fading = "out";
				fadeDest = "play";
				p.reset();
			}
		}
		else {
			platHeight3 += (platHeight3 < 550) ? 5 : 0;
		}
		loadBoxFronts();
	}
	else if(p.onScreen === "dead") {
		c.fillStyle = "rgb(150, 150, 150)";
		c.font = "bolder 80px Arial black";
		c.fillText("GAME OVER", 400, 200);
		c.font = "20px Cursive";
		c.fillStyle = "rgb(0, 0, 0)";
		c.fillText("You collected " + p.gold + " coins.", 400, 300);
		c.fillText("You explored " + p.roomsExplored + " rooms.", 400, 340);
		c.fillText("You defeated " + p.enemiesKilled + " monsters.", 400, 380);
		c.fillText("You discovered " + p.secretsFound + " new secrets.", 400, 420);
		c.fillText("You were killed by " + p.deathCause, 400, 460);
		p.worldX = 0;
		p.worldY = 0;
		new Block(-100, 700, 1000, 200).display();
		//home button
		c.fillStyle = "rgb(20, 20, 20)";
		c.fillRect(100, 570, 150, 100);
		c.beginPath();
		c.arc(175, 570, 75, 0, 2 * Math.PI);
		c.fill();
		c.fillStyle = "rgb(255, 255, 255)";
		c.strokeStyle = "rgb(255, 255, 255)";
		c.font = "100 20px Germania One";
		c.fillText("H o m e", 175, 617.5);
		c.lineWidth = 1;
		if(btn1 > 0) {
			c.beginPath();
			c.moveTo(175 - btn1, 590);
			c.lineTo(175 + btn1, 590);
			c.stroke();
			c.beginPath();
			c.moveTo(175 - btn1, 630);
			c.lineTo(175 + btn1, 630);
			c.stroke();
		}
		if((mouseX > 100 && mouseX < 250 && mouseY > 570 && mouseY < 670) || Math.dist(mouseX, mouseY, 175, 570) <= 75) {
			cursorHand = true;
			if(btn1 < 50) {
				btn1 += 5;
			}
			if(mouseIsPressed) {
				fading = "out";
				fadeDest = "home";
			}
		}
		else if(btn1 > 0) {
			btn1 -= 5;
		}
		//retry button
		c.fillStyle = "rgb(20, 20, 20)";
		c.fillRect(550, 570, 150, 100);
		c.beginPath();
		c.arc(625, 570, 75, 0, 2 * Math.PI);
		c.fill();
		c.fillStyle = "rgb(255, 255, 255)";
		c.strokeStyle = "rgb(255, 255, 255)";
		c.fillText("R e t r y", 625, 617.5);
		c.lineWidth = 1;
		if(btn2 > 0) {
			c.beginPath();
			c.moveTo(626 - btn2, 590);
			c.lineTo(625 + btn2, 590);
			c.stroke();
			c.beginPath();
			c.moveTo(625 - btn2, 630);
			c.lineTo(625 + btn2, 630);
			c.stroke();
		}
		if((mouseX > 550 && mouseX < 700 && mouseY > 570 && mouseY < 670) || Math.dist(625, 570, mouseX, mouseY) <= 75) {
			cursorHand = true;
			if(btn2 < 50) {
				btn2 += 5;
			}
			if(mouseIsPressed) {
				fading = "out";
				fadeDest = "class-select";
			}
		}
		else if(btn2 > 0) {
			btn2 -= 5;
		}
	}
	else if(p.onScreen === "how") {
		p.damOp -= 0.05;
		// howChar.invSlots = deepClone(p.invSlots);
		howChar.invSlots = p.invSlots;
		inRoom = 0;
		p.worldX = howChar.worldX, p.worldY = howChar.worldY, p.x = howChar.x, p.y = howChar.y, p.canJump = howChar.canJump;
		theRoom = 0;
		// keys = [], mouseIsPressed = false, mouseX = -100, mouseY = -100;
		howChar.update();
		roomInstances[0].exist();

		c.fillStyle = "rgb(255, 255, 255)";
		c.font = "100 20px Germania One";
		c.textAlign = "center";
		c.globalAlpha = 1;
		if(!howChar.txt.includes("\n")) {
			c.fillText(howChar.txt, 400, 600);
		}
		else {
			for(var i = 0; i < howChar.txt.length; i ++) {
				if(howChar.txt.substr(i, 1) === "\n") {
					c.fillText(howChar.txt.substr(0, i), 400, 600);
					c.fillText(howChar.txt.substr(i + 1, Infinity), 400, 640);
					break;
				}
			}
		}
		if(howChar.txt === "press A to use the item you are holding") {
			if(howChar.invSlots[howChar.activeSlot].content instanceof Sword) {
				c.fillText("(like swinging a sword)", 400, 640);
			}
			else if(howChar.invSlots[howChar.activeSlot].content instanceof WoodBow) {
				c.fillText("(like shooting a bow)", 400, 640);
			}
			else  if(howChar.invSlots[howChar.activeSlot].content instanceof EnergyStaff) {
				c.fillText("(like using a staff)", 400, 640);
			}
		}

		if(howChar.worldX < -350 && howChar.txt === "arrow keys to move, up to jump") {
			for(var i = 0; i < roomInstances[0].content.length; i ++) {
				if(roomInstances[0].content[i] instanceof MovingWall && roomInstances[0].content[i].x <= 400) {
					roomInstances[0].content[i].zDir = 0.01;
					break;
				}
			}
			howChar.txt = "press S to interact with objects\n(for example: opening a chest)";
		}
		if(roomInstances[0].content[5].r <= -84 && howChar.txt === "press S to interact with objects\n(for example: opening a chest)") {
			howChar.txt = "press D to view your items";
		}
		if(keys[65] && howChar.invSlots[howChar.activeSlot].content !== "empty" && howChar.txt === "press A to use the item you are holding") {
			howChar.txt = "press the number keys (1, 2, 3) to switch between items";
		}
		if((keys[49] || keys[50] || keys[51]) && howChar.txt === "press the number keys (1, 2, 3) to switch between items") {
			howChar.txt = "you can aim ranged weapons";
			howChar.txtTime = 0;
		}
		howChar.txtTime ++;
		if(howChar.txtTime > 60) {
			if(howChar.txt === "you can aim ranged weapons" && (howChar.invSlots[howChar.activeSlot].content instanceof RangedWeapon || howChar.invSlots[howChar.activeSlot].content instanceof MagicWeapon)) {
				howChar.txt = "hold down the A key";
			}
			else if(howChar.txt === "and then press up or down to aim" && (keys[38] || keys[40])) {
				howChar.txt = "then you can release A to shoot";
			}
			else if(howChar.txt === "that's all you need to know. good luck!") {
				// howChar.reset();
				// roomInstances = [tutorialWorld];
				// howChar.worldX = p.worldX + 100, howChar.worldY = p.worldY;
				howChar.txt = "that's all you need to know. good luck!";
				fading = "out";
				fadeDest = "home";
			}
		}
		if(keys[65] && howChar.txt === "hold down the A key") {
			howChar.txt = "and then press up or down to aim";
			howChar.txtTime = 0;
		}
		if(!keys[65] && howChar.txt === "then you can release A to shoot") {
			howChar.txt = "almost done. try fighting this monster for practice";
			roomInstances[0].content[3].zDir = -0.01;
		}
		if(howChar.txt !== "almost done. try fighting this monster for practice") {
			for(var i = 0; i < roomInstances[0].content.length; i ++) {
				if(roomInstances[0].content[i] instanceof Spider) {
					roomInstances[0].content[i].x = 1600;
				}
			}
		}
		else {
			var noEnemy = true;
			for(var i = 0; i < roomInstances[0].content.length; i ++) {
				if(roomInstances[0].content[i] instanceof Spider) {
					noEnemy = false;
					break;
				}
			}
			if(noEnemy) {
				howChar.txt = "that's all you need to know. good luck!";
				howChar.txtTime = 0;
			}
		}

		howChar.display();
		howChar.gui();

		c.fillStyle = "rgb(255, 255, 255)";
		c.font = "100 20px Germania One";
		c.textAlign = "center";
		if(howChar.guiOpen === "inventory" && howChar.txt === "press D to view your items") {
			if(p.invSlots[2].content === "empty") {
				c.fillText("click an item to equip / unequip it", 400, 600);
				c.fillText("(try equipping this staff)", 400, 640);
			}
			else {
				c.fillText("now press D again to exit", 400, 600);
			}
		}
		if(howChar.guiOpen === "none" && howChar.invSlots[2].content !== "empty" && howChar.txt === "press D to view your items") {
			howChar.txt = "press A to use the item you are holding";
		}
	}
	else if(p.onScreen === "scores") {
		//title
		c.textAlign = "center";
		c.fillStyle = "rgb(150, 150, 150)";
		c.font = "100 40px Germania One";
		c.fillText("Your Best Games", 400, 130);
		//content
		p.scores.sort( function(a, b) { return a.coins - b.coins; } );
		for(var i = 0; i < Math.min(p.scores.length, 3); i ++) {
			var y = (i * 150 + 200);
			c.fillStyle = "rgb(110, 110, 110)";
			c.fillRect(200, y, 400, 100);
			c.fillStyle = "rgb(150, 150, 150)";
			c.font = "bolder 40px Arial Black";
			c.textAlign = "center";
			c.fillText((i + 1) + "", 230, y + 67);
			c.font = "20px monospace";
			c.textAlign = "left";
			c.fillText("Coins: " + p.scores[i].coins, 270, y + 25);
			c.fillText("Monsters Killed: " + p.scores[i].kills, 270, y + 55);
			c.fillText("Rooms Explored: " + p.scores[i].rooms, 270, y + 85);
			if(p.scores[i].class === "warrior") {
				c.save();
				c.translate(550, y + 50);
				new Sword().display("item");
				c.restore();
			}
			else if(p.scores[i].class === "archer") {
				c.save();
				c.translate(550, y + 50);
				new WoodBow().display("item");
				c.restore();
			}
			else if(p.scores[i].class === "mage") {
				c.save();
				c.translate(550, y + 50);
				new EnergyStaff().display("item");
				c.restore();
			}
		}
		if(p.scores.length === 0) {
			c.fillStyle = "rgb(150, 150, 150)";
			c.font = "bolder 80px monospace";
			c.fillText("-", 400, 400);
			c.font = "20px monospace";
			c.fillText("no games played yet", 400, 450);
		}
		//home button
		c.lineWidth = 1;
		c.strokeStyle = "rgb(255, 255, 255)";
		c.font = "100 20px Germania One";
		c.fillStyle = "rgb(255, 255, 255)";
		c.textAlign = "center";
		c.fillText("H o m e", 70, 70);
		c.fillStyle = "rgb(20, 20, 20)";
		if(btn1 > 0) {
			c.lineWidth = 1;
			c.beginPath();
			c.moveTo(70 + btn1, 82.5);
			c.lineTo(70 - btn1, 82.5);
			c.stroke();
			c.beginPath();
			c.moveTo(70 + btn1, 82.5 - 40);
			c.lineTo(70 - btn1, 82.5 - 40);
			c.stroke();
		}
		if(mouseX > 30 && mouseX < 100 && mouseY > 30 && mouseY < 100) {
			cursorHand = true;
			if(btn1 < 40) {
				btn1 += 5;
			}
			if(mouseIsPressed) {
				fading = "out";
				fadeDest = "home";
			}
		}
		else if(btn1 > 0) {
			btn1 -= 5;
		}
	}
	if(p.onScreen !== "play" || p.dead || true) {
		if(fading === "out") {
			fadeOp += 0.05;
			if(fadeOp >= 1) {
				btn1 = 0;
				btn2 = 0;
				btn3 = 0;
				fading = "in";
				p.onScreen = fadeDest;
			}
		}
		else if(fading === "in") {
			fadeOp -= 0.05;
			if(fadeOp <= 0) {
				fading = "none";
			}
		}
		c.save();
		c.globalAlpha = (fadeOp >= 0) ? fadeOp : 0;
		c.fillStyle = "rgb(0, 0, 0)";
		c.fillRect(0, 0, 800, 800);
		c.restore();
	}
	pMouseIsPressed = mouseIsPressed;
	if(cursorHand) {
		document.getElementById("body").style.cursor = "pointer";
	}
	else {
		document.getElementById("body").style.cursor = "auto";
	}
	window.setTimeout(doByTime, 1000 / fps);
};
window.setTimeout(doByTime, 1000 / fps);
