/** PRIMITIVES + CONSTANTS **/
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

/** UTILITIES **/
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
Array.prototype.removeAll = function(item) {
	/**
	Splices all instances of item in the array
	**/
	for(var i = 0; i < this.length; i ++) {
		if(this[i] === item) {
			this.splice(i, 1);
		}
	}
};
Math.rad = function(deg) {
	return deg / 180 * Math.PI;
};
Math.map = function(value, min1, max1, min2, max2) {
	/*
	Maps 'value' from range ['min1' - 'max1'] to ['min2' - 'max2']
	*/
	return (value - min1) / (max1 - min1) * (max2 - min2) + min2;
};
var boxFronts = [];//for 3d-ish rendering
var extraGraphics = [];
function getRotated(x, y, deg) {
	deg = Math.rad(deg);
	return {
		x: x * Math.cos(deg) - y * Math.sin(deg),
		y: x * Math.sin(deg) + y * Math.cos(deg)
	};
};
function cube(x, y, w, h, startDepth, endDepth, frontCol, sideCol, settings) {
	if(typeof sideCol !== "string") {
		sideCol = "rgb(150, 150, 150)";
	}
	if(typeof frontCol !== "string") {
		frontCol = "rgb(110, 110, 110)";
	}
	if(typeof settings !== "object") {
		settings = {
			noFrontExtended: false,
			sideColors: {
				left: sideCol,
				right: sideCol,
				top: sideCol,
				bottom: sideCol
			}
		};
	}
	else if(typeof settings.sideColors !== "object") {
		settings.sideColors = {};
		settings.sideColors.left = sideCol;
		settings.sideColors.top = sideCol;
		settings.sideColors.bottom = sideCol;
		settings.sideColors.right = sideCol;
	}
	else {
		settings.sideColors.left = (settings.sideColors.left === undefined) ? sideCol : settings.sideColors.left;
		settings.sideColors.right = (settings.sideColors.right === undefined) ? sideCol : settings.sideColors.right;
		settings.sideColors.top = (settings.sideColors.top === undefined) ? sideCol : settings.sideColors.top;
		settings.sideColors.bottom = (settings.sideColors.bottom === undefined) ? sideCol : settings.sideColors.bottom;
	}
	//background square
	var leftBX = 400 - (400 - x) * startDepth;
	var topBY = 400 - (400 - y) * startDepth;
	var rightBX = 400 - (400 - (x + w)) * startDepth;
	var bottomBY = 400 - (400 - (y + h)) * startDepth;
	//foreground square
	var leftFX = 400 - (400 - x) * endDepth;
	var topFY = 400 - (400 - y) * endDepth;
	var rightFX = 400 - (400 - (x + w)) * endDepth;
	var bottomFY = 400 - (400 - (y + h)) * endDepth;
	//top face
	c.fillStyle = settings.sideColors.top;
	c.beginPath();
	c.moveTo(leftBX, topBY);
	c.lineTo(rightBX, topBY);
	c.lineTo(rightFX, topFY);
	c.lineTo(leftFX, topFY);
	c.fill();
	//right face
	c.fillStyle = settings.sideColors.right;
	c.beginPath();
	c.moveTo(rightFX, topFY);
	c.lineTo(rightBX, topBY);
	c.lineTo(rightBX, bottomBY);
	c.lineTo(rightFX, bottomFY);
	c.fill();
	//bottom face
	c.fillStyle = settings.sideColors.bottom;
	c.beginPath();
	c.moveTo(rightBX, bottomBY);
	c.lineTo(rightFX, bottomFY);
	c.lineTo(leftFX, bottomFY);
	c.lineTo(leftBX, bottomBY);
	c.fill();
	//left face
	c.fillStyle = settings.sideColors.left;
	c.beginPath();
	c.moveTo(leftBX, topBY);
	c.lineTo(leftFX, topFY);
	c.lineTo(leftFX, bottomFY);
	c.lineTo(leftBX, bottomBY);
	c.fill();
	//front face
	if(!settings.noFrontExtended) {
		boxFronts.push({
			type: "rect",
			loc: [leftFX, topFY, rightFX - leftFX, bottomFY - topFY],
			col: frontCol
		});
	}
	else {
		c.fillStyle = frontCol;
		c.fillRect(leftFX, topFY, rightFX - leftFX, bottomFY - topFY);
	}
};
function cylinder(x, y, r, startDepth, endDepth, frontCol, sideCol, arr) {
	var width = c.lineWidth;
	c.lineWidth = 4;
	if(arr === undefined) {
		//if you know what the array of points is, pass it to the function as 'arr' so it doesn't have to calculate for better fps (should be centered on the origin)
		var arr = findPointsCircular(x, y, r);
	}
	else {
		for(var i = 0; i < arr.length; i ++) {
			arr[i].x += x;
			arr[i].y += y;
		}
	}
	for(var i = 0; i < arr.length - 1; i ++) {
		var front1 = point3d(arr[i].x, arr[i].y, startDepth);
		var back1 = point3d(arr[i].x, arr[i].y, endDepth);
		var front2 = point3d(arr[i + 1].x, arr[i + 1].y, startDepth);
		var back2 = point3d(arr[i + 1].x, arr[i + 1].y, endDepth);
		c.fillStyle = sideCol;
		c.beginPath();
		c.moveTo(front1.x, front1.y);
		c.lineTo(back1.x, back1.y);
		c.lineTo(back2.x, back2.y);
		c.lineTo(front2.x, front2.y);
		c.fill();
	}
	var center = point3d(x, y, (startDepth > endDepth) ? startDepth : endDepth);
	boxFronts.push({
		type: "circle",
		loc: [center.x, center.y, r],
		col: frontCol
	});
	c.lineWidth = width;
};
function point3d(x, y, z) {
	//returns the visual position of a point at x, y, z
	return {
		x: 400 - (400 - x) * z,
		y: 400 - (400 - y) * z,
	}
};
function line3d(x1, y1, x2, y2, startDepth, endDepth, col) {
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
};
function polygon3d(frontCol, sideCol, startDepth, endDepth, points) {
	//swap 'startDepth' and 'endDepth' if in wrong order
	if(startDepth > endDepth) {
		var start = startDepth;
		startDepth = endDepth;
		endDepth = start;
	}
	//generate a list of points in 3d
	var frontVertices = [];
	var backVertices = [];
	for(var i = 0; i < points.length; i ++) {
		frontVertices.push(point3d(points[i].x, points[i].y, endDepth));
		backVertices.push(point3d(points[i].x, points[i].y, startDepth));
	}
	//side faces
	c.fillStyle = sideCol;
	for(var i = 0; i < frontVertices.length; i ++) {
		var next = (i === frontVertices.length - 1) ? 0 : i + 1;
		c.beginPath();
		c.moveTo(frontVertices[i].x, frontVertices[i].y);
		c.lineTo(frontVertices[next].x, frontVertices[next].y);
		c.lineTo(backVertices[next].x, backVertices[next].y);
		c.lineTo(backVertices[i].x, backVertices[i].y);
		c.fill();
	}
	//front face
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
};
function hitboxRect(x, y, w, h) {
	if(showHitboxes) {
		hitboxes.push({x: x, y: y, w: w, h: h, color: "green"});
	}
	return (p.x + 5 > x && p.x - 5 < x + w && p.y + 46 > y && p.y < y + h);
};
function collisionRect(x, y, w, h, settings) {
	settings = settings || {};
	settings.onlyEnemies = settings.onlyEnemies || false;
	settings.walls = settings.walls || [true, true, true, true];
	settings.illegalHandling = settings.illegalHandling || "collide";
	settings.moving = settings.moving || false;
	if(showHitboxes) {
		hitboxes.push({x: x, y: y, w: w, h: h, color: settings.illegalHandling === "teleport" ? "dark blue" : "light blue"});
	}
	if(inRoom === theRoom) {
		if(!settings.moving) {
			if(p.x + 5 > x && p.x - 5 < x + w && p.y + 46 >= y && p.y + 46 <= y + p.velY + 1 && settings.walls[0]) {
				p.velY = 0;
				p.y = y - 46;
				p.canJump = true;
				if(p.fallDmg !== 0) {
					p.hurt(p.fallDmg, "falling");
					p.fallDmg = 0;
				}
			}
			if(p.x + 5 > x && p.x - 5 < x + w && p.y <= y + h && p.y >= y + h + p.velY - 1 && settings.walls[1]) {
				p.velY = 2;
			}
			if(p.y + 46 > y && p.y < y + h && p.x + 5 >= x && p.x + 5 <= x + p.velX + 1 && settings.walls[2]) {
				if(settings.illegalHandling === "collide") {
					p.velX = (settings.extraBouncy) ? -3 : -1;
				}
				else {
					p.y = y - 46;
				}
			}
			if(p.y + 46 > y && p.y < y + h && p.x - 5 <= x + w && p.x - 5 >= x + w + p.velX - 1 && settings.walls[3]) {
				if(settings.illegalHandling === "collide") {
					p.velX = (settings.extraBouncy) ? 3 : 1;
				}
				else {
					p.y = y - 46;
				}
			}
		}
		else {
			if(p.x + 5 > x && p.x - 5 < x + w && p.y + 46 >= y && p.y + 46 <= y + 6 && settings.walls[0]) {
				p.velY = 0;
				p.y = y - 46;
				p.canJump = true;
				if(p.fallDmg !== 0) {
					p.hurt(p.fallDmg, "falling");
					p.fallDmg = 0;
				}
			}
			if(p.x + 5 > x && p.x - 5 < x + w && p.y <= y + h && p.y >= y + h - 6 && settings.walls[1]) {
				p.velY = 2;
			}
			if(p.y + 46 > y && p.y < y + h && p.x + 5 >= x && p.x + 5 <= x + 6 && settings.walls[2]) {
				if(settings.illegalHandling === "collide") {
					p.velX = (settings.extraBouncy) ? -3 : -1;
				}
				else {
					p.y = y - 46;
				}
			}
			if(p.y + 46 > y && p.y < y + h && p.x - 5 <= x + w && p.x - 5 >= x + w - 6 && settings.walls[3]) {
				if(settings.illegalHandling === "collide") {
					p.velX = (settings.extraBouncy) ? 3 : 1;
				}
				else {
					p.y = y - 46;
				}
			}
		}
	}
	for(var i = 0; i < roomInstances[theRoom].content.length; i ++) {
		if(roomInstances[theRoom].content[i] instanceof Enemy) {
			var enemy = roomInstances[theRoom].content[i];
			if(enemy.x + p.worldX + enemy.rightX > x && enemy.x + p.worldX + enemy.leftX < x + w) {
				if(enemy.y + p.worldY + enemy.bottomY >= y && enemy.y + p.worldY + enemy.bottomY <= y + enemy.velY + 1) {
					enemy.velY = (enemy.velY > 0) ? 0 : enemy.velY;
					enemy.y = y - p.worldY - Math.abs(enemy.bottomY);
					enemy.canJump = true;
					if(enemy instanceof Bat && enemy.timePurified > 0) {
						enemy.dest = {x: enemy.x + (Math.random() * 200 - 100), y: enemy.y + (Math.random() * 200 - 100)};
					}
				}
				if(enemy.y + p.worldY + enemy.topY <= y + h && enemy.y + p.worldY + enemy.topY >= y + h + enemy.velY - 1) {
					enemy.velY = 3;
					enemy.y = y + h - p.worldY + Math.abs(enemy.topY);
					if(enemy instanceof Bat && enemy.timePurified > 0) {
						enemy.dest = {x: enemy.x + (Math.random() * 200 - 100), y: enemy.y + (Math.random() * 200 - 100)};
					}
				}
			}
			if(enemy.y + enemy.bottomY + p.worldY > y && enemy.y + enemy.topY + p.worldY < y + h) {
				if(enemy.x + p.worldX + enemy.rightX >= x && enemy.x + p.worldX + enemy.rightX <= x + enemy.velX + 1) {
					if(settings.illegalHandling === "teleport") {
						enemy.y = y - p.worldY - Math.abs(enemy.bottomY);
						enemy.velY = (enemy.velY > 0) ? 0 : enemy.velY;
						enemy.canJump = true;
					}
					else {
						enemy.velX = (enemy.velX > 0) ? -3 : enemy.velX;
						enemy.x = x - p.worldX - Math.abs(enemy.rightX);
						if(enemy instanceof Bat && enemy.timePurified > 0) {
							enemy.dest = {x: enemy.x + (Math.random() * 200 - 100), y: enemy.y + (Math.random() * 200 - 100)};
						}
					}
				}
				if(enemy.x + p.worldX + enemy.leftX <= x + w && enemy.x + p.worldX + enemy.leftX >= x + w + enemy.velX - 1) {
					if(settings.illegalHandling === "teleport") {
						enemy.y = y - p.worldY - Math.abs(enemy.bottomY);
						enemy.velY = (enemy.velY > 0) ? 0 : enemy.velY;
						enemy.canJump = true;
					}
					else {
						enemy.velX = (enemy.velX < 0) ? 3 : enemy.velX;
						enemy.x = x + w - p.worldX + Math.abs(enemy.leftX);
						if(enemy instanceof Bat && enemy.timePurified > 0) {
							enemy.dest = {x: enemy.x + (Math.random() * 200 - 100), y: enemy.y + (Math.random() * 200 - 100)};
						}
					}
				}
				if(!(typeof enemy.velX === "number") && enemy.x + enemy.rightX + p.worldX > x && enemy.x + enemy.rightX + p.worldX < x + 5) {
					enemy.x = x - p.worldX - Math.abs(enemy.rightX);
				}
				if(!(typeof enemy.velX === "number") && enemy.x + enemy.leftX + p.worldX < x + w && enemy.x + enemy.leftX + p.worldX > x + w - 5) {
					enemy.x = x + w - p.worldX + Math.abs(enemy.leftX);
				}
			}
		}
		else if(roomInstances[theRoom].content[i] instanceof MagicCharge && roomInstances[theRoom].content[i].x + p.worldX > x && roomInstances[theRoom].content[i].x + p.worldX < x + w && roomInstances[theRoom].content[i].y + p.worldY > y && roomInstances[theRoom].content[i].y + p.worldY < y + h) {
			roomInstances[theRoom].content[i].splicing = true;
			continue;
		}
		else if(roomInstances[theRoom].content[i] instanceof SpikeBall) {
			x -= p.worldX, y -= p.worldY;
			var spikeball = roomInstances[theRoom].content[i];
			if(spikeball.x + 20 > x && spikeball.x + -20 < x + w) {
				if(spikeball.y + 20 >= y && spikeball.y + 20 <= y + spikeball.velY + 1) {
					spikeball.velY = (spikeball.velY > 0) ? -1 : spikeball.velY;
					spikeball.y = y - Math.abs(20);
				}
				if(spikeball.y + -20 <= y + h && spikeball.y + -20 >= y + h + spikeball.velY - 1) {
					spikeball.velY = 3;
					spikeball.y = y + h + Math.abs(-20);
				}
			}
			if(spikeball.y + 20 > y && spikeball.y + -20 < y + h) {
				if(spikeball.x + 20 >= x && spikeball.x + 20 <= x + spikeball.velX + 1) {
					if(illegalHandling === "teleport") {
						spikeball.y = y - Math.abs(20);
						spikeball.velY = (spikeball.velY > 0) ? 0 : spikeball.velY;
						spikeball.canJump = true;
					}
					else {
						spikeball.velX = (spikeball.velX > 0) ? -3 : spikeball.velX;
						spikeball.x = x - Math.abs(20);
					}
				}
				if(spikeball.x + -20 <= x + w && spikeball.x + -20 >= x + w + spikeball.velX - 1) {
					if(illegalHandling === "teleport") {
						spikeball.y = y - Math.abs(-20);
						spikeball.velY = (spikeball.velY > 0) ? 0 : spikeball.velY;
						spikeball.canJump = true;
					}
					else {
						spikeball.velX = (spikeball.velX < 0) ? 3 : spikeball.velX;
						spikeball.x = x + w + Math.abs(-20);
					}
				}
			}
			x += p.worldX, y += p.worldY;
		}
	}
};
function findPointsCircular(x, y, r) {
	var circularPoints = [];
	//top right quadrant
	for(var X = x; X < x + r; X ++) {
		for(var Y = y - r; Y < y; Y ++) {
			if(Math.floor(Math.dist(x, y, X, Y)) === r - 1) {
				circularPoints.push({x: X, y: Y});
			}
		}
	}
	//bottom right quadrant
	for(var X = x + r; X > x; X --) {
		for(var Y = y; Y < y + r; Y ++) {
			if(Math.floor(Math.dist(x, y, X, Y)) === r - 1) {
				circularPoints.push({x: X, y: Y});
			}
		}
	}
	//bottom left
	for(var X = x; X > x - r; X --) {
		for(var Y = y + r; Y > y; Y --) {
			if(Math.floor(Math.dist(x, y, X, Y)) === r - 1) {
				circularPoints.push({x: X, y: Y});
			}
		}
	}
	//top left
	for(var X = x - r; X < x; X ++) {
		for(var Y = y; Y > y - r; Y --) {
			if(Math.floor(Math.dist(x, y, X, Y)) === r - 1) {
				circularPoints.push({x: X, y: Y});
			}
		}
	}
	return circularPoints;
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
function findPointsLinear(x1, y1, x2, y2) {
	var inverted = false;
	if(Math.abs(x1 - x2) < Math.abs(y1 - y2)) {
		inverted = true;
		//swap x's and y's
		var oldX1 = x1;
		x1 = y1;
		y1 = oldX1;
		var oldX2 = x2;
		x2 = y2;
		y2 = oldX2;
	}
	var m = Math.abs(y1 - y2) / Math.abs(x1 - x2);
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
	if(inverted) {
		for(var i = 0; i < linearPoints.length; i ++) {
			var oldX = linearPoints[i].x;
			linearPoints[i].x = linearPoints[i].y;
			linearPoints[i].y = oldX;
		}
	}
	return linearPoints;
};
function collisionLine(x1, y1, x2, y2, settings) {
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
	var points = findPointsLinear(x1, y1, x2, y2);
	for(var i = 0; i < points.length; i ++) {
		collisionRect(points[i].x, points[i].y, Math.abs(p.velX) + 3, Math.abs(p.velY), { illegalHandling: settings.illegalHandling, walls: settings.walls, extraBouncy: settings.extraBouncy, moving: settings.moving });
	}
};
function calcAngleDegrees(x, y) {
	return Math.atan2(y, x) * 180 / Math.PI;
};
function inheritsFrom(child, parent) {
	child.prototype = Object.create(parent.prototype);
	child.prototype.constructor = child;
};
function circle(x, y, r) {
	c.beginPath();
	c.arc(x, y, r, 0, 2 * Math.PI);
	c.fill();
};

/** PLAYER **/
function Player() {
	//location
	this.x = 500;
	this.y = 300;
	this.worldX = 0;
	this.worldY = 0;
	this.onScreen = "home";
	//animation
	this.legs = 5;
	this.legDir = 1;
	this.enteringDoor = false;
	this.op = 1;
	this.screenOp = 0;
	this.fallOp = 0;
	this.fallDir = 0;
	this.fallDmg = 0;
	//health bars
	this.health = 10;
	this.maxHealth = 10;
	this.visualHealth = 1;
	this.mana = 10;
	this.maxMana = 10;
	this.visualMana = 1;
	this.gold = 0;
	this.maxGold = 1;
	this.visualGold = 1;
	//movement
	this.canJump = false;
	this.velX = 0;
	this.velY = 0;
	//inventory + gui
	this.invSlots = [];
	this.guiOpen = "none";
	this.activeSlot = 0;
	this.openCooldown = 0;
	//attacking
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
	//other object properties
	this.healthAltarsFound = 0;
	this.manaAltarsFound = 0;
	this.openingBefore = false;
	this.terminateProb = 0;
	this.doorType = "arch";
	//scoring / permanent values
	this.roomsExplored = 0;
	this.enemiesKilled = 0;
	this.deathCause = null;
	this.secretsFound = 0;
	this.dead = false;
	this.power = 0;
};
Player.prototype.init = function() {
	for(var x = 0; x < 3; x ++) {
		this.invSlots.push({x: x * 80 - 35 + 55, y: 20, content: "empty", type: "holding"});
	}
	for(var y = 0; y < 3; y ++) {
		for(var x = 0; x < 5; x ++) {
			this.invSlots.push({x: x * 80 - 35 + 240, y: y * 80 - 35 + 250, content: "empty", type: "storage"});
		}
	}
};
Player.prototype.display = function(noSideScroll, straightArm) {
	//parameters are only for custom stick figures on class selection screens
	if(!noSideScroll) {
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
	}
	c.lineWidth = 5;
	c.lineCap = "round";
	//head
	if(this.op <= 0) {
		this.op = 0;
	}
	if(this.op >= 1) {
		this.op = 1;
	}
	c.globalAlpha = this.op;
	c.fillStyle = "rgb(0, 0, 0)";
	c.save();
	c.translate(this.x, this.y);
	c.scale(1, 1.2);
	c.beginPath();
	c.arc(0, 12, 10, 0, 2 * Math.PI);
	c.fill();
	c.restore();
	//body
	c.strokeStyle = "rgb(0, 0, 0)";
	c.beginPath();
	c.moveTo(this.x, this.y + 12);
	c.lineTo(this.x, this.y + 36);
	c.stroke();
	//legs
	c.beginPath();
	c.moveTo(this.x, this.y + 36);
	c.lineTo(this.x - this.legs, this.y + 46);
	c.moveTo(this.x, this.y + 36);
	c.lineTo(this.x + this.legs, this.y + 46);
	c.stroke();
	//leg animations
	if(keys[37] || keys[39]) {
		this.legs += this.legDir;
		if(this.legs >= 5) {
			this.legDir = -0.5;
		}
		else if(this.legs <= -5) {
			this.legDir = 0.5;
		}
	}
	//arms
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
			this.attackArmDir = 1;
			if(this.timeSinceAttack > (10 - this.attackSpeed) * 3) {
				this.canHit = true;
			}
		}
		else if(this.attackArm > 0) {
			this.attackArmDir = -4;
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
			this.attackArmDir = 4;
			if(this.timeSinceAttack > (10 - this.attackSpeed) * 3) {
				this.canHit = true;
			}
		}
		else if(this.attackArm > 20) {
			this.attackArmDir = -1;
			if(this.timeSinceAttack > (10 - this.attackSpeed) * 3) {
				this.canHit = true;
			}
		}
	}
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
	this.attackArm += this.attackArmDir;
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
	if(!this.attacking) {
		this.attackArm = null;
	}
	c.lineCap = "butt";
	c.globalAlpha = 1;
	if(this.onScreen === "play") {
		c.textAlign = "center";
		//health bar
		c.fillStyle = "rgb(150, 150, 150)";
		c.fillRect(550, 12.5, 225, 25);
		c.beginPath();
		c.arc(550, 25, 12, 0, 2 * Math.PI);
		c.arc(775, 25, 12, 0, 2 * Math.PI);
		c.fill();
		c.fillStyle = "rgb(255, 0, 0)";
		c.fillRect(550, 12.5, this.visualHealth * 225, 25);
		c.beginPath();
		c.arc(550, 25, 12, 0, 2 * Math.PI);
		c.arc(550 + (this.visualHealth * 225), 25, 12, 0, 2 * Math.PI);
		c.fill();
		c.fillStyle = "rgb(100, 100, 100)";
		c.font = "bold 10pt monospace";
		c.fillText("Health: " + this.health + " / " + this.maxHealth, 662, 28);
		this.visualHealth += ((this.health / this.maxHealth) - this.visualHealth) / 10;
		//mana bar
		c.fillStyle = "rgb(150, 150, 150)";
		c.fillRect(550, 50, 225, 25);
		c.beginPath();
		c.arc(550, 62.5, 12, 0, 2 * Math.PI);
		c.arc(775, 62.5, 12, 0, 2 * Math.PI);
		c.fill();
		c.fillStyle = "rgb(20, 20, 255)";
		c.fillRect(550, 50, this.visualMana * 225, 25);
		c.beginPath();
		c.arc(550, 62.5, 12, 0, 2 * Math.PI);
		c.arc(550 + (this.visualMana * 225), 62.5, 12, 0, 2 * Math.PI);
		c.fill();
		c.fillStyle = "rgb(100, 100, 100)";
		c.fillText("Mana: " + this.mana + " / " + this.maxMana, 662, 65.5);
		this.visualMana += ((this.mana / this.maxMana) - this.visualMana) / 10;
		//gold bar
		c.fillStyle = "rgb(150, 150, 150)";
		c.fillRect(550, 87.5, 225, 25);
		c.beginPath();
		c.arc(550, 100, 12, 0, 2 * Math.PI);
		c.arc(775, 100, 12, 0, 2 * Math.PI);
		c.fill();
		c.fillStyle = "rgb(255, 255, 0)";
		c.fillRect(550, 87.5, ((this.visualGold / this.maxGold) * 225), 25);
		c.beginPath();
		c.arc(550, 100, 12, 0, 2 * Math.PI);
		c.arc(550 + ((this.visualGold / this.maxGold) * 225), 100, 12, 0, 2 * Math.PI);
		c.fill();
		c.fillStyle = "rgb(100, 100, 100)";
		c.fillText("Gold: " + this.gold, 662, 102.5);
		this.visualGold += (this.gold - this.visualGold) / 10;
	}
};
Player.prototype.update = function() {
	keys = this.enteringDoor ? [] : keys;
	if(!keys[37] && !keys[39]) {
		this.legDir = (this.legs < 0) ? -0.5 : 0.5;
		this.legDir = (this.legs >= 5 || this.legs <= -5) ? 0 : this.legDir;
		this.legs += this.legDir;
	}
	//changing selected slots
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
	//movement
	if(keys[37]) {
		this.velX -= 0.1;
	}
	else if(keys[39]) {
		this.velX += 0.1;
	}
	if(this.velX > 4) {
		this.velX = 4;
	}
	else if(this.velX < -4) {
		this.velX = -4;
	}
	this.x += this.velX;
	this.y += this.velY;
	if(!keys[37] && !keys[39]) {
		this.velX *= 0.93;
	}
	this.velY += 0.15;
	if(keys[38] && this.canJump && !this.aiming) {
		this.velY = -7.5;
	}
	this.canJump = false;
	//screen transitions
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
	this.fallOp = this.fallOp < 0 ? 0 : this.fallOp;
	if(this.fallOp > 1) {
		this.roomsExplored ++;
		this.fallDir = -0.05;
		inRoom = numRooms;
		this.worldX = 0;
		this.worldY = 0;
		this.x = 500;
		this.y = -100;
		this.velY = 2;
		this.fallDmg = Math.round(Math.random() + 4);
		roomInstances.push(
			new Room(
				"ambient1",
				[
					new Pillar(200, 500, Math.random() * 100 + 200),
					new Pillar(400, 500, Math.random() * 100 + 200),
					new Pillar(600, 500, Math.random() * 100 + 200),
					new Pillar(800, 500, Math.random() * 100 + 200),
					new Block(-200, 500, 2000, 600),//floor
					new Block(-600, -1200, 700, 1900), //left wall
					new Block(900, -1200, 500, 1900), //right wall
					new Door(300,  500, ["ambient", "combat", "parkour", "secret"]),
					new Door(500,  500, ["ambient", "combat", "parkour", "secret"]),
					new Door(700,  500, ["ambient", "combat", "parkour", "secret"])
				],
				"?"
			)
		);
	}
	//attacking + item use
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
	if(keys[65] && this.invSlots[this.activeSlot].content !== "empty") {
		if(this.invSlots[this.activeSlot].content instanceof MeleeWeapon && !(this.invSlots[this.activeSlot].content instanceof Mace)) {
			this.invSlots[this.activeSlot].content.attack();
			this.attacking = true;
			if(this.attackArm === null) {
				this.attackArm = 0;
				this.attackArmDir = this.attackSpeed;
				if(this.attackingWith instanceof Spear) {
					this.attackArmDir = 4;
				}
			}
		}
		else if(this.invSlots[this.activeSlot].content instanceof RangedWeapon || this.invSlots[this.activeSlot].content instanceof MagicWeapon) {
			if(this.aimRot === null) {
				this.aimRot = 0;
				this.attackingWith = this.invSlots[this.activeSlot].content;
				if(this.attackingWith instanceof MagicWeapon && this.mana >= this.attackingWith.manaCost && !(this.attackingWith instanceof ElementalStaff && this.attackingWith.element === "none")) {
					var damage = Math.round(Math.random() * (this.invSlots[this.activeSlot].content.damHigh - this.invSlots[this.activeSlot].content.damLow) + this.invSlots[this.activeSlot].content.damLow);
					if(this.facing === "right") {
						roomInstances[inRoom].content.push(new MagicCharge(450 - this.worldX, 400 - this.worldY, 0, 0, this.attackingWith.chargeType, damage));
						roomInstances[inRoom].content[roomInstances[inRoom].content.length - 1].beingAimed = true;
					}
					else {
						roomInstances[inRoom].content.push(new MagicCharge(350 - this.worldX, 400 - this.worldY, 0, 0, this.attackingWith.chargeType, damage));
						roomInstances[inRoom].content[roomInstances[inRoom].content.length - 1].beingAimed = true;
					}
					this.mana -= this.attackingWith.manaCost;
					this.chargeLoc = getRotated((this.facing === "right") ? 50 : -50, 0, this.aimRot * ((this.facing === "right") ? 1 : -1));
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
		else if(this.invSlots[this.activeSlot].content.hasOwnProperty("use")) {
			this.invSlots[this.activeSlot].content.use();
		}
	}
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
				var weaponPos = getRotated(10, -this.attackingWith.range, this.attackArm);
			}
			if(this.facing === "left" && !(this.attackingWith instanceof Spear)) {
				weaponPos.x = -weaponPos.x;
			}
			weaponPos.x += this.x;
			weaponPos.y += this.y + 26 - this.velY;
			if(showHitboxes) {
				c.fillStyle = "rgb(255, 0, 0)";
				c.fillRect(weaponPos.x - 5, weaponPos.y - 5, 10, 10);
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
	if(this.aiming && keys[38] && this.aimRot > -45) {
		this.aimRot -= 2;
		if(this.attackingWith instanceof MagicWeapon) {
			this.aimRot -= 2;
			this.chargeLoc = getRotated((this.facing === "right") ? 50 : -50, 0, this.aimRot * ((this.facing === "right") ? 1 : -1));
		}
	}
	if(this.aiming && keys[40] && this.aimRot < 45) {
		this.aimRot += 2;
		if(this.attackingWith instanceof MagicWeapon) {
			this.aimRot += 2;
			this.chargeLoc = getRotated((this.facing === "right") ? 50 : -50, 0, this.aimRot * ((this.facing === "right") ? 1 : -1));
		}
	}
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
					var velocity = getRotated(10, 0, this.aimRot);
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
					var velocity = getRotated(-10, 0, -this.aimRot);
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
		this.chargeLoc = getRotated((this.facing === "right") ? 50 : -50, 0, this.aimRot * ((this.facing === "right") ? 1 : -1));
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
				var velocity = getRotated(10, 0, this.aimRot);
				var velX = velocity.x;
				var velY = velocity.y;
				velocity.x += (this.x - this.worldX + 10);
				velocity.y += (this.y - this.worldY + 26);
				var damage = Math.round(Math.random() * (this.invSlots[this.activeSlot].content.damHigh - this.invSlots[this.activeSlot].content.damLow) + this.invSlots[this.activeSlot].content.damLow);
				var speed = (this.invSlots[this.activeSlot].content.range === "medium" || this.invSlots[this.activeSlot].content.range === "long") ? (this.invSlots[this.activeSlot].content.range === "medium" ? 2 : 1.75) : (this.invSlots[this.activeSlot].content.range === "very long" ? 1.25 : 1);
				roomInstances[inRoom].content.push(new ShotArrow(velocity.x, velocity.y, velX / speed, velY / speed, damage, "player", this.invSlots[this.activeSlot].content.element));
			}
			else {
				var velocity = getRotated(-10, 0, -this.aimRot);
				var velX = velocity.x;
				var velY = velocity.y;
				velocity.x += (this.x - this.worldX + 10);
				velocity.y += (this.y - this.worldY + 26);
				var damage = Math.round(Math.random() * (this.invSlots[this.activeSlot].content.damHigh - this.invSlots[this.activeSlot].content.damLow) + this.invSlots[this.activeSlot].content.damLow);
				var speed = (this.invSlots[this.activeSlot].content.range === "medium" || this.invSlots[this.activeSlot].content.range === "long") ? (this.invSlots[this.activeSlot].content.range === "medium" ? 2 : 1.75) : (this.invSlots[this.activeSlot].content.range === "very long" ? 1.25 : 1);
				roomInstances[inRoom].content.push(new ShotArrow(velocity.x, velocity.y, velX / speed, velY / speed, damage, "player", this.invSlots[this.activeSlot].content.element));
			}
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
	this.aimingBefore = this.aiming;
	this.facingBefore = this.facing;
	this.shootReload --;
	//update health bars
	if(this.health >= this.maxHealth) {
		this.numHeals = 0;
	}
	if(this.numHeals > 0 && frameCount % 300 === 0) {
		this.health ++;
		this.numHeals --;
	}
	if(frameCount % 180 === 0 && this.mana < this.maxMana) {
		this.mana ++;
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
		if(this.op <= 0) {
			fading = "out";
			fadeDest = "dead";
		}
	}
	if(this.health < 0) {
		this.health = 0;
	}
};
Player.prototype.gui = function() {
	//delete consumed items
	for(var i = 0; i < this.invSlots.length; i ++) {
		if(this.invSlots[i].content.consumed) {
			this.invSlots[i].content = "empty";
		}
	}
	//change gui open
	if(keys[68] && !this.openingBefore) {
		if(this.guiOpen === "none") {
			this.guiOpen = "inventory";
		}
		else if(this.guiOpen === "inventory") {
			this.guiOpen = "none";
		}
		this.openCooldown = 2;
	}
	//inventory
	if(this.guiOpen === "inventory") {
		c.strokeStyle = "rgb(100, 100, 100)";
		c.fillStyle = "rgb(150, 150, 150)";
		c.fillRect(0, 0, 800, 800);
		var hoverIndex = null;
		for(var i = 0; i < this.invSlots.length; i ++) {
			c.fillStyle = "rgb(150, 150, 150)";
			c.fillRect(this.invSlots[i].x, this.invSlots[i].y, 70, 70);
			c.strokeRect(this.invSlots[i].x, this.invSlots[i].y, 70, 70);
			if(this.invSlots[i].content !== "empty") {
				if(!this.invSlots[i].content.initialized) {
					this.invSlots[i].content.init();
				}
				c.save();
				c.translate(this.invSlots[i].x + 35, this.invSlots[i].y + 35);
				c.globalAlpha = this.invSlots[i].content.opacity;
				this.invSlots[i].content.display("holding");
				c.restore();
				this.invSlots[i].content.opacity += 0.05;
				//load weapon particles
				if(this.invSlots[i].content instanceof Weapon) {
					c.save();
					c.translate(this.invSlots[i].x - this.worldX, this.invSlots[i].y - this.worldY);
					this.invSlots[i].content.displayParticles();
					c.restore();
				}
			}
			//graphic for selection
			if(i === this.activeSlot) {
				c.fillStyle = "rgb(100, 100, 100)";
				c.beginPath();
				c.moveTo(this.invSlots[i].x + 10, this.invSlots[i].y + 35);
				c.lineTo(this.invSlots[i].x, this.invSlots[i].y + 25);
				c.lineTo(this.invSlots[i].x, this.invSlots[i].y + 45);
				c.fill();
				c.beginPath();
				c.moveTo(this.invSlots[i].x + 35, this.invSlots[i].y + 10);
				c.lineTo(this.invSlots[i].x + 25, this.invSlots[i].y);
				c.lineTo(this.invSlots[i].x + 45, this.invSlots[i].y);
				c.fill();
				c.beginPath();
				c.moveTo(this.invSlots[i].x + 60, this.invSlots[i].y + 35);
				c.lineTo(this.invSlots[i].x + 70, this.invSlots[i].y + 25);
				c.lineTo(this.invSlots[i].x + 70, this.invSlots[i].y + 45);
				c.fill();
				c.beginPath();
				c.moveTo(this.invSlots[i].x + 35, this.invSlots[i].y + 60);
				c.lineTo(this.invSlots[i].x + 25, this.invSlots[i].y + 70);
				c.lineTo(this.invSlots[i].x + 45, this.invSlots[i].y + 70);
				c.fill();
			}
		}
		//find which you are hovering over
		for(var i = 0; i < this.invSlots.length; i ++) {
			if(mouseX > this.invSlots[i].x && mouseX < this.invSlots[i].x + 70 && mouseY > this.invSlots[i].y && mouseY < this.invSlots[i].y + 70 && this.invSlots[i].content !== "empty") {
				this.invSlots[i].content.desc = this.invSlots[i].content.getDesc();
				hoverIndex = i;
				break;
			}
		}
		if(hoverIndex !== null) {
			//display desc of hovered item
			this.invSlots[hoverIndex].content.displayDesc(this.invSlots[hoverIndex].x + 70, this.invSlots[hoverIndex].y + 35);
			//move item if clicked
			if(mouseIsPressed) {
				if(this.invSlots[hoverIndex].type === "storage") { //hoverIndex is deleted, i is created
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
				else if(this.invSlots[hoverIndex].type === "holding") {
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
	}
	else if(this.guiOpen === "crystal-infusion") {
		//background rect
		c.strokeStyle = "rgb(100, 100, 100)";
		c.fillStyle = "rgb(150, 150, 150)";
		c.fillRect(0, 0, 800, 800);
		//text
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
				if(!this.invSlots[i].content.initialized) {
					this.invSlots[i].content.init();
				}
				c.save();
				c.translate(this.invSlots[i].x + 35, this.invSlots[i].y + 35);
				this.invSlots[i].content.display("holding");
				c.restore();
				//load weapon particles
				if(this.invSlots[i].content instanceof Weapon) {
					c.save();
					c.translate(this.invSlots[i].x - this.worldX, this.invSlots[i].y - this.worldY);
					this.invSlots[i].content.displayParticles();
					c.restore();
				}
				//gray out invalid choices
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
			//graphic for selection
			if(i === this.activeSlot) {
				c.fillStyle = "rgb(100, 100, 100)";
				c.beginPath();
				c.moveTo(this.invSlots[i].x + 10, this.invSlots[i].y + 35);
				c.lineTo(this.invSlots[i].x, this.invSlots[i].y + 25);
				c.lineTo(this.invSlots[i].x, this.invSlots[i].y + 45);
				c.fill();
				c.beginPath();
				c.moveTo(this.invSlots[i].x + 35, this.invSlots[i].y + 10);
				c.lineTo(this.invSlots[i].x + 25, this.invSlots[i].y);
				c.lineTo(this.invSlots[i].x + 45, this.invSlots[i].y);
				c.fill();
				c.beginPath();
				c.moveTo(this.invSlots[i].x + 60, this.invSlots[i].y + 35);
				c.lineTo(this.invSlots[i].x + 70, this.invSlots[i].y + 25);
				c.lineTo(this.invSlots[i].x + 70, this.invSlots[i].y + 45);
				c.fill();
				c.beginPath();
				c.moveTo(this.invSlots[i].x + 35, this.invSlots[i].y + 60);
				c.lineTo(this.invSlots[i].x + 25, this.invSlots[i].y + 70);
				c.lineTo(this.invSlots[i].x + 45, this.invSlots[i].y + 70);
				c.fill();
			}
		}
		//find which you are hovering over
		for(var i = 0; i < this.invSlots.length; i ++) {
			if(mouseX > this.invSlots[i].x && mouseX < this.invSlots[i].x + 70 && mouseY > this.invSlots[i].y && mouseY < this.invSlots[i].y + 70 && this.invSlots[i].content !== "empty") {
				this.invSlots[i].content.desc = this.invSlots[i].content.getDesc();
				hoverIndex = i;
				break;
			}
		}
		if(hoverIndex !== null) {
			//display desc of hovered item
			this.invSlots[hoverIndex].content.displayDesc(this.invSlots[hoverIndex].x + 70, this.invSlots[hoverIndex].y + 35);
			if(mouseIsPressed && this.invSlots[hoverIndex].content instanceof Weapon && !(this.invSlots[hoverIndex].content instanceof Arrow) && this.invSlots[hoverIndex].content.element !== this.infusedGui) {
				this.invSlots[hoverIndex].content.element = this.infusedGui;
				this.guiOpen = "none";
				this.invSlots[this.activeSlot].content = "empty";
				return;
			}
		}
	}
	else if(this.guiOpen === "reforge-item") {
		//background rect
		c.strokeStyle = "rgb(100, 100, 100)";
		c.fillStyle = "rgb(150, 150, 150)";
		c.fillRect(0, 0, 800, 800);
		//text
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
				if(!this.invSlots[i].content.initialized) {
					this.invSlots[i].content.init();
				}
				c.save();
				c.translate(this.invSlots[i].x + 35, this.invSlots[i].y + 35);
				this.invSlots[i].content.display("holding");
				c.restore();
				//load weapon particles
				if(this.invSlots[i].content instanceof Weapon) {
					c.save();
					c.translate(this.invSlots[i].x - this.worldX, this.invSlots[i].y - this.worldY);
					this.invSlots[i].content.displayParticles();
					c.restore();
				}
				//gray out invalid choices
				if(!(this.invSlots[i].content instanceof Weapon || this.invSlots[i].content instanceof Equipable)) {
					c.globalAlpha = 0.75;
					c.fillStyle = "rgb(150, 150, 150)";
					c.fillRect(this.invSlots[i].x + 2, this.invSlots[i].y + 2, 66, 66);
					c.globalAlpha = 1;
				}
			}
			//graphic for selection
			if(i === this.activeSlot) {
				c.fillStyle = "rgb(100, 100, 100)";
				c.beginPath();
				c.moveTo(this.invSlots[i].x + 10, this.invSlots[i].y + 35);
				c.lineTo(this.invSlots[i].x, this.invSlots[i].y + 25);
				c.lineTo(this.invSlots[i].x, this.invSlots[i].y + 45);
				c.fill();
				c.beginPath();
				c.moveTo(this.invSlots[i].x + 35, this.invSlots[i].y + 10);
				c.lineTo(this.invSlots[i].x + 25, this.invSlots[i].y);
				c.lineTo(this.invSlots[i].x + 45, this.invSlots[i].y);
				c.fill();
				c.beginPath();
				c.moveTo(this.invSlots[i].x + 60, this.invSlots[i].y + 35);
				c.lineTo(this.invSlots[i].x + 70, this.invSlots[i].y + 25);
				c.lineTo(this.invSlots[i].x + 70, this.invSlots[i].y + 45);
				c.fill();
				c.beginPath();
				c.moveTo(this.invSlots[i].x + 35, this.invSlots[i].y + 60);
				c.lineTo(this.invSlots[i].x + 25, this.invSlots[i].y + 70);
				c.lineTo(this.invSlots[i].x + 45, this.invSlots[i].y + 70);
				c.fill();
			}
		}
		//find which you are hovering over
		for(var i = 0; i < this.invSlots.length; i ++) {
			if(mouseX > this.invSlots[i].x && mouseX < this.invSlots[i].x + 70 && mouseY > this.invSlots[i].y && mouseY < this.invSlots[i].y + 70 && this.invSlots[i].content !== "empty") {
				this.invSlots[i].content.desc = this.invSlots[i].content.getDesc();
				hoverIndex = i;
				break;
			}
		}
		if(hoverIndex !== null) {
			//display desc of hovered item
			this.invSlots[hoverIndex].content.displayDesc(this.invSlots[hoverIndex].x + 70, this.invSlots[hoverIndex].y + 35);
			if(mouseIsPressed && (this.invSlots[hoverIndex].content instanceof Weapon || this.invSlots[hoverIndex].content instanceof Equipable) && !(this.invSlots[hoverIndex].content instanceof Arrow)) {
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
		//background rect
		c.strokeStyle = "rgb(100, 100, 100)";
		c.fillStyle = "rgb(150, 150, 150)";
		c.fillRect(0, 0, 800, 800);
		//text
		c.fillStyle = "rgb(100, 100, 100)";
		c.textAlign = "center";
		c.font = "bold 20pt monospace";
		c.fillText("Choose a trait to reforge for", 400, 200);
		c.fillText((this.reforgeType === "melee" || this.reforgeType === "ranged") ? (this.reforgeType === "melee" ? "Speed" : "Range") : (this.reforgeType === "magic" ? "Mana Cost" : "Bonuses"), 300, 500);
		c.fillText("Damage", 500, 500);
		//choice 1
		c.fillStyle = "rgb(150, 150, 150)";
		c.fillRect(300 - 35, 400 - 35, 70, 70);
		c.strokeRect(300 - 35, 400 - 35, 70, 70);
		var choice1 = new this.invSlots[this.reforgeIndex].content.constructor((this.reforgeType === "melee" || this.reforgeType === "ranged") ? (this.reforgeType === "melee" ? "light" : "distant") : (this.reforgeType === "magic" ? "efficient" : "empowering"));
		choice1.element = this.invSlots[this.reforgeIndex].content.element;
		choice1.damLow -= 1;
		choice1.damHigh -= 1;
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
		//choice 2
		c.fillRect(500 - 35, 400 - 35, 70, 70);
		c.strokeRect(500 - 35, 400 - 35, 70, 70);
		var choice2 = new this.invSlots[this.reforgeIndex].content.constructor((this.reforgeType === "melee" || this.reforgeType === "ranged") ? (this.reforgeType === "melee" ? "heavy" : "forceful") : (this.reforgeType === "magic" ? "arcane" : "sturdy"));
		choice2.element = this.invSlots[this.reforgeIndex].content.element;
		choice2.damLow += 1;
		choice2.damHigh += 1;
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
		//select choices and add to item
		if(mouseX > 300 - 35 && mouseX < 335 && mouseY > 400 - 35 && mouseY < 435) {
			cursorHand = true;
			choice1.desc = choice1.getDesc();
			choice1.displayDesc(335, 400);
			if(mouseIsPressed) {
				var theModifier = (this.reforgeType === "melee" || this.reforgeType === "ranged") ? (this.reforgeType === "melee" ? "light" : "distant") : (this.reforgeType === "magic" ? "efficient" : "empowering");
				this.guiOpen = "none";
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
			}
		}
		if(mouseX > 500 - 35 && mouseX < 535 && mouseY > 400 - 35 && mouseY < 435) {
			cursorHand = true;
			choice2.desc = choice2.getDesc();
			choice2.displayDesc(535, 400);
			if(mouseIsPressed) {
				var theModifier = (this.reforgeType === "melee" || this.reforgeType === "ranged") ? (this.reforgeType === "melee" ? "heavy" : "forceful") : (this.reforgeType === "magic" ? "arcane" : "sturdy");
				this.guiOpen = "none";
				this.invSlots[this.reforgeIndex].content.damLow = choice2.damLow;
				this.invSlots[this.reforgeIndex].content.damHigh = choice2.damHigh;
				this.invSlots[this.reforgeIndex].content.modifier = theModifier;
				if(this.invSlots[this.reforgeIndex].content instanceof MeleeWeapon) {
					this.invSlots[this.reforgeIndex].content.attackSpeed = choice2.attackSpeed;
				}
				else if(this.invSlots[this.reforgeIndex].content instanceof RangedWeapon) {
					this.invSlots[this.reforgeIndex].content.range = choice2.range;
				}
				else if(this.invSlots[this.reforgeIndex].content instanceof MagicWeapon) {
					this.invSlots[this.reforgeIndex].content.manaCost = choice2.manaCost;
				}
			}
		}
	}
	else if(this.guiOpen === "reforge-trait-light") {
		//background rect
		c.strokeStyle = "rgb(100, 100, 100)";
		c.fillStyle = "rgb(150, 150, 150)";
		c.fillRect(0, 0, 800, 800);
		//text
		c.fillStyle = "rgb(100, 100, 100)";
		c.textAlign = "center";
		c.font = "bold 20pt monospace";
		c.fillText("Choose a trait to reforge for", 400, 200);
		c.fillText("Balance", 300, 500);
		c.fillText("Damage", 500, 500);
		//choice 1
		c.fillStyle = "rgb(150, 150, 150)";
		c.fillRect(300 - 35, 400 - 35, 70, 70);
		c.strokeRect(300 - 35, 400 - 35, 70, 70);
		var choice1 = new this.invSlots[this.reforgeIndex].content.constructor("none");
		choice1.element = this.invSlots[this.reforgeIndex].content.element;
		c.save();
		c.translate(300, 400);
		choice1.display("holding");
		c.restore();
		//choice 2
		c.fillRect(500 - 35, 400 - 35, 70, 70);
		c.strokeRect(500 - 35, 400 - 35, 70, 70);
		var choice2 = new this.invSlots[this.reforgeIndex].content.constructor((this.reforgeType === "melee" || this.reforgeType === "ranged") ? (this.reforgeType === "melee" ? "heavy" : "forceful") : (this.reforgeType === "magic" ? "arcane" : "sturdy"));
		choice2.element = this.invSlots[this.reforgeIndex].content.element;
		choice2.damLow += 1;
		choice2.damHigh += 1;
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
		//select choices and add to item
		if(mouseX > 300 - 35 && mouseX < 335 && mouseY > 400 - 35 && mouseY < 435) {
			cursorHand = true;
			choice1.desc = choice1.getDesc();
			choice1.displayDesc(335, 400);
			if(mouseIsPressed) {
				this.guiOpen = "none";
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
			}
		}
		if(mouseX > 500 - 35 && mouseX < 535 && mouseY > 400 - 35 && mouseY < 435) {
			cursorHand = true;
			choice2.desc = choice2.getDesc();
			choice2.displayDesc(535, 400);
			if(mouseIsPressed) {
				var theModifier = (this.reforgeType === "melee" || this.reforgeType === "ranged") ? (this.reforgeType === "melee" ? "heavy" : "forceful") : (this.reforgeType === "magic" ? "arcane" : "sturdy");
				this.guiOpen = "none";
				this.invSlots[this.reforgeIndex].content.damLow = choice2.damLow;
				this.invSlots[this.reforgeIndex].content.damHigh = choice2.damHigh;
				this.invSlots[this.reforgeIndex].content.modifier = theModifier;
				if(this.invSlots[this.reforgeIndex].content instanceof MeleeWeapon) {
					this.invSlots[this.reforgeIndex].content.attackSpeed = choice2.attackSpeed;
				}
				else if(this.invSlots[this.reforgeIndex].content instanceof RangedWeapon) {
					this.invSlots[this.reforgeIndex].content.range = choice2.range;
				}
				else if(this.invSlots[this.reforgeIndex].content instanceof MagicWeapon) {
					this.invSlots[this.reforgeIndex].content.manaCost = choice2.manaCost;
				}
			}
		}
	}
	else if(this.guiOpen === "reforge-trait-heavy") {
		//background rect
		c.strokeStyle = "rgb(100, 100, 100)";
		c.fillStyle = "rgb(150, 150, 150)";
		c.fillRect(0, 0, 800, 800);
		//text
		c.fillStyle = "rgb(100, 100, 100)";
		c.textAlign = "center";
		c.font = "bold 20pt monospace";
		c.fillText("Choose a trait to reforge for", 400, 200);
		c.fillText((this.reforgeType === "melee" || this.reforgeType === "ranged") ? (this.reforgeType === "melee" ? "Speed" : "Range") : (this.reforgeType === "magic" ? "Mana Cost" : "Bonuses"), 300, 500);
		c.fillText("Balance", 500, 500);
		//choice 1
		c.fillStyle = "rgb(150, 150, 150)";
		c.fillRect(300 - 35, 400 - 35, 70, 70);
		c.strokeRect(300 - 35, 400 - 35, 70, 70);
		var choice1 = new this.invSlots[this.reforgeIndex].content.constructor((this.reforgeType === "melee" || this.reforgeType === "ranged") ? (this.reforgeType === "melee" ? "light" : "distant") : (this.reforgeType === "magic" ? "efficient" : "empowering"));
		choice1.element = this.invSlots[this.reforgeIndex].content.element;
		choice1.damLow -= 1;
		choice1.damHigh -= 1;
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
		//choice 2
		c.fillRect(500 - 35, 400 - 35, 70, 70);
		c.strokeRect(500 - 35, 400 - 35, 70, 70);
		var choice2 = new this.invSlots[this.reforgeIndex].content.constructor("none");
		choice2.element = this.invSlots[this.reforgeIndex].content.element;
		c.save();
		c.translate(500, 400);
		choice2.display("holding");
		c.restore();
		//select choices and add to item
		if(mouseX > 300 - 35 && mouseX < 335 && mouseY > 400 - 35 && mouseY < 435) {
			cursorHand = true;
			choice1.desc = choice1.getDesc();
			choice1.displayDesc(335, 400);
			if(mouseIsPressed) {
				var theModifier = (this.reforgeType === "melee" || this.reforgeType === "ranged") ? (this.reforgeType === "melee" ? "light" : "distant") : (this.reforgeType === "magic" ? "efficient" : "empowering");
				this.guiOpen = "none";
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
			}
		}
		if(mouseX > 500 - 35 && mouseX < 535 && mouseY > 400 - 35 && mouseY < 435) {
			cursorHand = true;
			choice2.desc = choice2.getDesc();
			choice2.displayDesc(535, 400);
			if(mouseIsPressed) {
				this.guiOpen = "none";
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
			}
		}
	}
	else {
		//display items you are holding
		for(var i = 0; i < this.invSlots.length; i ++) {
			this.invSlots[i].content.opacity += 0.05;
			if(this.invSlots[i].type === "holding") {
				c.strokeStyle = "rgb(100, 100, 100)";
				c.fillStyle = "rgb(150, 150, 150)";
				c.fillRect(this.invSlots[i].x, this.invSlots[i].y, 70, 70);
				c.strokeRect(this.invSlots[i].x, this.invSlots[i].y, 70, 70);
				if(this.invSlots[i].content !== "empty") {
					this.invSlots[i].content.opacity += 0.05;
					c.save();
					c.translate(this.invSlots[i].x + 35, this.invSlots[i].y + 35);
					c.globalAlpha = (this.invSlots[i].content.opacity < 0) ? 0 : this.invSlots[i].content.opacity;
					this.invSlots[i].content.display("holding");
					c.restore();
					//load weapon particles
					if(this.invSlots[i].content instanceof Weapon) {
						c.save();
						c.translate(this.invSlots[i].x - this.worldX, this.invSlots[i].y - this.worldY);
						this.invSlots[i].content.displayParticles();
						c.restore();
					}
				}
			}
			if(i === this.activeSlot) {
				c.fillStyle = "rgb(100, 100, 100)";
				c.beginPath();
				c.moveTo(this.invSlots[i].x + 10, this.invSlots[i].y + 35);
				c.lineTo(this.invSlots[i].x, this.invSlots[i].y + 25);
				c.lineTo(this.invSlots[i].x, this.invSlots[i].y + 45);
				c.fill();
				c.beginPath();
				c.moveTo(this.invSlots[i].x + 35, this.invSlots[i].y + 10);
				c.lineTo(this.invSlots[i].x + 25, this.invSlots[i].y);
				c.lineTo(this.invSlots[i].x + 45, this.invSlots[i].y);
				c.fill();
				c.beginPath();
				c.moveTo(this.invSlots[i].x + 60, this.invSlots[i].y + 35);
				c.lineTo(this.invSlots[i].x + 70, this.invSlots[i].y + 25);
				c.lineTo(this.invSlots[i].x + 70, this.invSlots[i].y + 45);
				c.fill();
				c.beginPath();
				c.moveTo(this.invSlots[i].x + 35, this.invSlots[i].y + 60);
				c.lineTo(this.invSlots[i].x + 25, this.invSlots[i].y + 70);
				c.lineTo(this.invSlots[i].x + 45, this.invSlots[i].y + 70);
				c.fill();
			}
		}
	}
	this.openingBefore = keys[68];
};
Player.prototype.addItem = function(item) {
	if(item.stackable) {
		for(var i = 0; i < this.invSlots.length; i ++) {
			if(this.invSlots[i].content instanceof item.constructor) {
				this.invSlots[i].content.quantity += item.quantity;
				return;
			}
		}
	}
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
Player.prototype.hurt = function(amount, killer) {
	this.defLow = 0;//work in progress, this will change depending on armor
	this.defHigh = 0;
	var defense = Math.random() * (this.defHigh - this.defLow) + this.defLow;
	var damage = amount - defense;
	if(damage < 0) {
		damage = 0;
	}
	damage = Math.round(damage);
	this.health -= damage;
	if(this.health <= 0) {
		this.dead = true;
		this.deathCause = killer;
	}
};
Player.prototype.reset = function() {
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
	var permanentProperties = ["onScreen", "class"]; //properties that should not be reset
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
	switch(this["class"]) {
		case "warrior":
			this.addItem(new Sword());
			//this.addItem(new Helmet());
			break;
		case "archer":
			this.addItem(new WoodBow());
			this.addItem(new Dagger());
			this.addItem(new Arrow(10));
			break;
		case "mage":
			this.addItem(new EnergyStaff());
			this.addItem(new Dagger());
			break;
	}
};
Player.prototype.updatePower = function() {
	this.power = 0;
	this.power += (this.maxHealth - 10);
	this.power += (this.maxMana - 10);
	for(var i = 0; i < this.invSlots.length; i ++) {
		if(this.invSlots[i].content !== "empty") {
			this.power += this.invSlots[i].content.power;
		}
	}
};
var p = new Player();
p.init();

/** IN GAME STRUCTURES **/
function Block(x, y, w, h) {
	this.x = x;
	this.y = y;
	this.w = w;
	this.h = h;
};
Block.prototype.update = function() {
	collisionRect(this.x + p.worldX, this.y + p.worldY, this.w, this.h, {walls: [true, true, true, true], illegalHandling: partOfAStair ? "teleport" : "collide"} );
};
Block.prototype.display = function() {
	cube(this.x + p.worldX, this.y + p.worldY, this.w, this.h, 0.9, 1.1);
};
Block.prototype.exist = function() {
	this.display();
	this.update();
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
Platform.prototype.exist = function() {
	cube(this.x + p.worldX, this.y + p.worldY, this.w, 3, 0.9, 1.1, "rgb(139, 69, 19)", "rgb(159, 89, 39");
	collisionRect(this.x + p.worldX, this.y + p.worldY, this.w, 3, {walls: [true, false, false, false]});
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
Door.prototype.exist = function() {
	if(this.type === "same" || this.type === "toggle") {
		if(this.type === "same") {
			this.type = p.doorType;
		}
		else {
			this.type = p.doorType === "arch" ? "lintel" : "arch";
		}
	}
	//graphics
	var leftBX = 400 - (400 - (this.x + p.worldX - 30)) * (1 - floorWidth);
	var rightBX = 400 - (400 - (this.x + p.worldX + 30)) * (1 - floorWidth);
	var bottomBY = 400 - (400 - (this.y + p.worldY)) * (1 - floorWidth);
	var topBY = 400 - (400 - (this.y + p.worldY - 60)) * (1 - floorWidth);
	if(this.type === "arch") {
		c.fillStyle = "rgb(20, 20, 20)";
		c.fillRect(leftBX, topBY, rightBX - leftBX, bottomBY - topBY);
		c.beginPath();
		c.arc(leftBX + ((rightBX - leftBX) / 2), topBY, 27, 0, 2 * Math.PI);
		c.fill();
	}
	else {
		cube(this.x + p.worldX - 30, this.y + p.worldY - 90, 60, 90, 0.9, 0.9, "rgb(20, 20, 20)", "rgb(20, 20, 20)", { noFrontExtended: true });
		cube(this.x + p.worldX - 45, this.y + p.worldY - 110, 90, 20, 0.9, 0.91, "rgb(110, 110, 110)", "rgb(150, 150, 150)", {noFrontExtended: true} );
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
		c.translate(leftBX + (rightBX - leftBX) / 2, bottomBY - 60);
		c.rotate(22 / 180 * Math.PI);
		woodBoard();
		c.restore();

		c.save();
		c.translate(leftBX + (rightBX - leftBX) / 2, bottomBY - 40);
		c.rotate(-22 / 180 * Math.PI);
		woodBoard();
		c.restore();

		c.save();
		c.translate(leftBX + (rightBX - leftBX) / 2, bottomBY - 20);
		c.rotate(22 / 180 * Math.PI);
		woodBoard();
		c.restore();

		c.restore();

	}
	//transition between rooms
	if(p.x - 5 > leftBX && p.x + 5 < rightBX && p.y + 46 > topBY && p.y + 46 < bottomBY + 10 && p.canJump && keys[83] && !p.enteringDoor && !p.exitingDoor && p.guiOpen === "none" && !this.barricaded) {
		p.enteringDoor = true;
		this.entering = true;
	}
	if(p.screenOp > 0.95 && this.entering && !this.barricaded) {
		p.doorType = this.type;
		if(typeof this.dest !== "number") {
			p.roomsExplored ++;
			p.numHeals ++;
			//calculate how close the nearest unexplored door is
			calcPaths();
			p.terminateProb = 0;
			for(var i = 0; i < roomInstances.length; i ++) {
				for(var j = 0; j < roomInstances[i].content.length; j ++) {
					if(roomInstances[i].content[j] instanceof Door && typeof(roomInstances[i].content[j].dest) === "object" && !roomInstances[i].content[j].entering) {
						p.terminateProb += (1 / ((roomInstances[i].pathScore + 1) * (roomInstances[i].pathScore + 1)));
					}
				}
			}
			//create a list of valid rooms to generate
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
			//apply weighting based on number of nearby unexplored doors
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
			// for(var i = 0; i < newWeights.length
			//add selected room
			var roomIndex = Math.round(Math.random() * (possibleRooms.length - 1));
			possibleRooms[roomIndex].add();
			roomInstances[roomInstances.length - 1].id = "?";
			//reset variables for transition
			var previousRoom = inRoom;
			inRoom = numRooms;
			p.enteringDoor = false;
			p.exitingDoor = true;
			p.op = 1;
			p.op = 95;
			this.dest = numRooms;
			//give the newly generated room an id
			for(var i = 0; i < roomInstances.length; i ++) {
				if(roomInstances[i].id === "?") {
					roomInstances[i].id = numRooms;
					numRooms ++;
				}
			}
			for(var i = 0; i < roomInstances.length; i ++) {
				if(roomInstances[i].id === numRooms - 1) {
					//select a door for the player to come out of
					var doorIndexes = [];
					for(var j = 0; j < roomInstances[i].content.length; j ++) {
						if(roomInstances[i].content[j] instanceof Door && (!!roomInstances[i].content[j].noEntry) === (!!this.invertEntries) && roomInstances[i].content[j].noEntry !== "no entries") {
							doorIndexes.push(j);
						}
					}
					if(doorIndexes.length === 0) {
						//prevent errors if you enter a room w/ no illegal entry doors and you have invert turned on
						for(var j = 0; j < roomInstances[i].content.length; j ++) {
							if(roomInstances[i].content[j] instanceof Door) {
								doorIndexes.push(j);
							}
						}
					}
					var theIndex = doorIndexes[Math.round(Math.random() * (doorIndexes.length - 1))];
					//move the player to the door they exit out of
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
					//assign that door to lead back to this room
					roomInstances[i].content[theIndex].dest = previousRoom;
					//assign this door to lead into that room
					this.dest = inRoom;
				}
			}
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
			//schedule enemies to move through the door
			for(var i = 0; i < roomInstances[theRoom].content.length; i ++) {
				if(roomInstances[theRoom].content[i] instanceof Enemy && roomInstances[theRoom].content[i].seesPlayer) {
					roomInstances[theRoom].hasEnemy = true;
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
			//schedule enemies to move through the door
			for(var i = 0; i < roomInstances[theRoom].content.length; i ++) {
				if(roomInstances[theRoom].content[i] instanceof Enemy && roomInstances[theRoom].content[i].seesPlayer) {
					roomInstances[theRoom].hasEnemy = true;
				}
			}
		}
		p.screenOp = 0.95;
		this.entering = false;
		calcPaths();
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
function calcPaths() {
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
	cube(this.x + p.worldX - 5, this.y + p.worldY - 20, 10, 20, 0.9, 0.95);
	cube(this.x + p.worldX - 10, this.y + p.worldY - 25, 20, 6, 0.9, 0.97);
	if(p.x + 5 > this.x + p.worldX - 5 && p.x - 5 < this.x + p.worldX + 5) {
		this.lit = true;
	}
	if(this.lit) {
		// this.fireParticles.push(new FireParticle(this.x, this.y - 25));
		this.fireParticles.push(new Particle(this.color, this.x, this.y - 27, Math.random(), Math.random() * -3, Math.random() * 5 + 5));
		this.fireParticles[this.fireParticles.length - 1].z = 0.97;
		for(var i = 0; i < this.fireParticles.length; i ++) {
			this.fireParticles[i].exist();
			if(this.fireParticles[i].splicing) {
				this.fireParticles.splice(i, 1);
				continue;
			}
		}
	}
};
function FireParticle(x, y) {
	this.x = x;
	this.y = y;
	this.velX = Math.random();
	this.velY = Math.random() * -3;
	this.size = Math.random() * 5 + 5;
	this.op = 1;
};
FireParticle.prototype.exist = function() {
	c.fillStyle = "rgb(255, 128, 0)";
	c.globalAlpha = this.op;
	c.beginPath();
	c.arc(400 - (400 - (this.x + p.worldX)) * 0.96, 400 - (400 - (this.y + p.worldY)), (this.size > 0) ? this.size : 0, 0, 2 * Math.PI);
	c.fill();
	c.globalAlpha = 1;
	this.x += this.velX;
	this.y += this.velY;
	this.size -= 0.5;
	this.op -= 0.05;
};
function LightRay(x, w) {
	this.x = x;
	this.w = w;
};
LightRay.prototype.exist = function() {
	// c.fillStyle = "rgb(255, 255, 255)";
	// c.globalAlpha = 0.5;
	// c.fillRect(p.worldX + this.x, 0, this.w, 800);
	// c.globalAlpha = 1;
	var leftF = 400 - (400 - (p.worldX + this.x)) * 1.1;
	var leftB = 400 - (400 - (p.worldX + this.x)) * 0.9;
	var rightF = 400 - (400 - (p.worldX + this.x + this.w)) * 1.1;
	var rightB = 400 - (400 - (p.worldX + this.x + this.w)) * 0.9;
	var left = Math.min(leftF, leftB);
	var right = Math.max(rightF, rightB);
	c.fillStyle = "rgb(255, 255, 255)";
	c.globalAlpha = 0.5;
	c.fillRect(left, 0, right - left, 800);
	c.globalAlpha = 1;
	// cube(p.worldX + this.x, -100, this.w, 900, 0.9, 0.9, "rgba(255, 255, 255, 0.5)", "rgb(255, 255, 255, 0.5)", true);
};
function Tree(x, y) {
	//tree, comes with the planter and everything
	this.x = x;
	this.y = y;
};
Tree.prototype.exist = function(theRoom) {
	cube(this.x + p.worldX - 100, this.y + p.worldY - 40, 200, 40, 0.9, 1);
	c.fillStyle = "rgb(139, 69, 19)";
	//trunk
	c.beginPath();
	c.moveTo(400 - (400 - (this.x + p.worldX - 10)) * 0.95, 400 - (400 - (this.y + p.worldY - 40)) * 0.95);
	c.lineTo(400 - (400 - (this.x + p.worldX + 10)) * 0.95, 400 - (400 - (this.y + p.worldY - 40)) * 0.95);
	c.lineTo(400 - (400 - (this.x + p.worldX)) * 0.95, 400 - (400 - (this.y + p.worldY - 350)) * 0.95);
	c.fill();
	//1st branch on left
	c.beginPath();
	c.moveTo(400 - (400 - (this.x + p.worldX - 5)) * 0.95, 400 - (400 - (this.y + p.worldY - 80)) * 0.95);
	c.lineTo(400 - (400 - (this.x + p.worldX - 6)) * 0.95, 400 - (400 - (this.y + p.worldY - 100)) * 0.95);
	c.lineTo(400 - (400 - (this.x + p.worldX - 150)) * 0.95, 400 - (400 - (this.y + p.worldY - 100)) * 0.95);
	c.fill();
	collisionLine(400 - (400 - (this.x + p.worldX - 6)) * 0.95, 400 - (400 - (this.y + p.worldY - 100)) * 0.95, 400 - (400 - (this.x + p.worldX - 150)) * 0.95, 400 - (400 - (this.y + p.worldY - 100)) * 0.95, {walls: [true, false, false, false]});
	//1st branch on right
	c.beginPath();
	c.moveTo(400 - (400 - (this.x + p.worldX + 7)) * 0.95, 400 - (400 - (this.y + p.worldY - 100)) * 0.95);
	c.lineTo(400 - (400 - (this.x + p.worldX + 6)) * 0.95, 400 - (400 - (this.y + p.worldY - 120)) * 0.95);
	c.lineTo(400 - (400 - (this.x + p.worldX + 150)) * 0.95, 400 - (400 - (this.y + p.worldY - 120)) * 0.95);
	c.fill();
	collisionLine(400 - (400 - (this.x + p.worldX + 6)) * 0.95, 400 - (400 - (this.y + p.worldY - 120)) * 0.95, 400 - (400 - (this.x + p.worldX + 150)) * 0.95, 400 - (400 - (this.y + p.worldY - 120)) * 0.95, {walls: [true, false, false, false]});
	//2nd branch on left
	c.beginPath();
	c.moveTo(400 - (400 - (this.x + p.worldX - 6)) * 0.95, 400 - (400 - (this.y + p.worldY - 150)) * 0.95);
	c.lineTo(400 - (400 - (this.x + p.worldX - 5)) * 0.95, 400 - (400 - (this.y + p.worldY - 170)) * 0.95);
	c.lineTo(400 - (400 - (this.x + p.worldX - 100)) * 0.95, 400 - (400 - (this.y + p.worldY - 180)) * 0.95);
	c.fill();
	collisionLine(400 - (400 - (this.x + p.worldX - 5)) * 0.95, 400 - (400 - (this.y + p.worldY - 170)) * 0.95, 400 - (400 - (this.x + p.worldX - 100)) * 0.95, 400 - (400 - (this.y + p.worldY - 180)) * 0.95, {walls: [true, false, false, false]});
	//2nd branch on right
	c.beginPath();
	c.moveTo(400 - (400 - (this.x + p.worldX + 6)) * 0.95, 400 - (400 - (this.y + p.worldY - 170)) * 0.95);
	c.lineTo(400 - (400 - (this.x + p.worldX + 5)) * 0.95, 400 - (400 - (this.y + p.worldY - 190)) * 0.95);
	c.lineTo(400 - (400 - (this.x + p.worldX + 100)) * 0.95, 400 - (400 - (this.y + p.worldY - 200)) * 0.95);
	c.fill();
	collisionLine(400 - (400 - (this.x + p.worldX + 5)) * 0.95, 400 - (400 - (this.y + p.worldY - 190)) * 0.95, 400 - (400 - (this.x + p.worldX + 100)) * 0.95, 400 - (400 - (this.y + p.worldY - 200)) * 0.95, {walls: [true, false, false, false]});
	//3rd branch on left
	c.beginPath();
	c.moveTo(400 - (400 - (this.x + p.worldX)) * 0.95, 400 - (400 - (this.y + p.worldY - 200)) * 0.95);
	c.lineTo(400 - (400 - (this.x + p.worldX)) * 0.95, 400 - (400 - (this.y + p.worldY - 220)) * 0.95);
	c.lineTo(400 - (400 - (this.x + p.worldX - 60)) * 0.95, 400 - (400 - (this.y + p.worldY - 230)) * 0.95);
	c.fill();
	collisionLine(400 - (400 - (this.x + p.worldX)) * 0.95, 400 - (400 - (this.y + p.worldY - 220)) * 0.95, 400 - (400 - (this.x + p.worldX - 60)) * 0.95, 400 - (400 - (this.y + p.worldY - 230)) * 0.95, {walls: [true, false, false, false]});
	collisionRect(400 - (400 - (this.x + p.worldX - 4)) * 0.95, 400 - (400 - (this.y + p.worldY - 350)) * 0.95, 8, 2, {walls: [true, false, false, false]});
};
const chestAnimationArray = [
[{x: 37, y: -19}, {x: 38, y: -19}, {x: 39, y: -17}, {x: 40, y: -18}, {x: 41, y: -17}, {x: 41, y: -19}, {x: 42, y: -19}, {x: 44, y: -19}, {x: 45, y: -19}, {x: 46, y: -18}, {x: 46, y: -20}, {x: 47, y: -20}, {x: 49, y: -19}, {x: 50, y: -20}, {x: 51, y: -19}, {x: 52, y: -19}, {x: 53, y: -19}, {x: 55, y: -17}, {x: 55, y: -19}, {x: 56, y: -19}, {x: 57, y: -17}, {x: 58, y: -18}, {x: 59, y: -18}, {x: 60, y: -18}, {x: 61, y: -17}, {x: 62, y: -17}, {x: 63, y: -16}, {x: 64, y: -17}, {x: 65, y: -16}, {x: 66, y: -16}, {x: 66, y: -17}, {x: 67, y: -16}, {x: 68, y: -16}, {x: 69, y: -14}, {x: 70, y: -15}, {x: 71, y: -13}, {x: 72, y: -13}, {x: 73, y: -13}, {x: 75, y: -12}, {x: 76, y: -12}, {x: 76, y: -11}, {x: 77, y: -12}, {x: 78, y: -10}, {x: 0, y: -1}, {x: 1, y: -2}, {x: 1, y: -2}, {x: 2, y: -3}, {x: 3, y: -3}, {x: 4, y: -5}, {x: 5, y: -5}, {x: 6, y: -6}, {x: 7, y: -7}, {x: 8, y: -7}, {x: 8, y: -8}, {x: 9, y: -9}, {x: 10, y: -8}, {x: 11, y: -8}, {x: 11, y: -10}, {x: 12, y: -10}, {x: 12, y: -11}, {x: 13, y: -11}, {x: 15, y: -11}, {x: 15, y: -12}, {x: 16, y: -12}, {x: 17, y: -13}, {x: 18, y: -14}, {x: 19, y: -13}, {x: 20, y: -14}, {x: 21, y: -14}, {x: 22, y: -15}, {x: 22, y: -16}, {x: 24, y: -15}, {x: 25, y: -16}, {x: 26, y: -16}, {x: 27, y: -17}, {x: 28, y: -17}, {x: 29, y: -17}, {x: 30, y: -17}, {x: 31, y: -18}, {x: 31, y: -19}, {x: 33, y: -18}, {x: 34, y: -18}, {x: 35, y: -18}, {x: 36, y: -19}],[{x: 34, y: -23}, {x: 36, y: -22}, {x: 37, y: -20}, {x: 37, y: -22}, {x: 39, y: -22}, {x: 39, y: -23}, {x: 40, y: -23}, {x: 42, y: -23}, {x: 42, y: -24}, {x: 44, y: -23}, {x: 44, y: -25}, {x: 45, y: -25}, {x: 47, y: -23}, {x: 47, y: -25}, {x: 48, y: -25}, {x: 50, y: -25}, {x: 51, y: -24}, {x: 53, y: -22}, {x: 53, y: -25}, {x: 54, y: -25}, {x: 55, y: -23}, {x: 56, y: -24}, {x: 57, y: -23}, {x: 58, y: -23}, {x: 59, y: -24}, {x: 60, y: -23}, {x: 61, y: -23}, {x: 62, y: -24}, {x: 62, y: -23}, {x: 63, y: -23}, {x: 65, y: -23}, {x: 65, y: -22}, {x: 66, y: -22}, {x: 67, y: -22}, {x: 68, y: -22}, {x: 69, y: -21}, {x: 71, y: -20}, {x: 71, y: -21}, {x: 73, y: -20}, {x: 74, y: -20}, {x: 74, y: -19}, {x: 75, y: -20}, {x: 76, y: -18}, {x: 0, y: -1}, {x: 1, y: -2}, {x: 1, y: -2}, {x: 2, y: -3}, {x: 3, y: -3}, {x: 3, y: -6}, {x: 5, y: -6}, {x: 5, y: -7}, {x: 7, y: -7}, {x: 7, y: -8}, {x: 7, y: -9}, {x: 8, y: -9}, {x: 9, y: -8}, {x: 9, y: -10}, {x: 10, y: -10}, {x: 10, y: -12}, {x: 11, y: -12}, {x: 12, y: -13}, {x: 13, y: -13}, {x: 14, y: -13}, {x: 15, y: -14}, {x: 16, y: -15}, {x: 17, y: -15}, {x: 18, y: -15}, {x: 18, y: -16}, {x: 20, y: -16}, {x: 20, y: -18}, {x: 21, y: -17}, {x: 23, y: -17}, {x: 23, y: -19}, {x: 24, y: -18}, {x: 24, y: -20}, {x: 25, y: -20}, {x: 27, y: -20}, {x: 28, y: -20}, {x: 28, y: -21}, {x: 30, y: -21}, {x: 30, y: -22}, {x: 32, y: -21}, {x: 33, y: -21}, {x: 33, y: -23}],[{x: 32, y: -27}, {x: 34, y: -26}, {x: 35, y: -24}, {x: 35, y: -25}, {x: 37, y: -25}, {x: 36, y: -27}, {x: 38, y: -26}, {x: 39, y: -27}, {x: 40, y: -28}, {x: 41, y: -27}, {x: 41, y: -30}, {x: 43, y: -29}, {x: 44, y: -28}, {x: 44, y: -30}, {x: 46, y: -30}, {x: 47, y: -29}, {x: 48, y: -29}, {x: 50, y: -28}, {x: 50, y: -31}, {x: 52, y: -29}, {x: 53, y: -28}, {x: 53, y: -30}, {x: 54, y: -30}, {x: 55, y: -30}, {x: 57, y: -29}, {x: 57, y: -30}, {x: 58, y: -30}, {x: 59, y: -30}, {x: 60, y: -29}, {x: 61, y: -30}, {x: 62, y: -29}, {x: 62, y: -28}, {x: 63, y: -29}, {x: 65, y: -28}, {x: 65, y: -29}, {x: 66, y: -29}, {x: 68, y: -28}, {x: 69, y: -28}, {x: 71, y: -27}, {x: 71, y: -28}, {x: 72, y: -27}, {x: 72, y: -28}, {x: 74, y: -26}, {x: 0, y: -1}, {x: 1, y: -2}, {x: 1, y: -2}, {x: 2, y: -3}, {x: 2, y: -4}, {x: 3, y: -6}, {x: 4, y: -6}, {x: 4, y: -7}, {x: 6, y: -7}, {x: 6, y: -8}, {x: 6, y: -10}, {x: 8, y: -10}, {x: 8, y: -9}, {x: 8, y: -11}, {x: 9, y: -11}, {x: 9, y: -12}, {x: 10, y: -13}, {x: 11, y: -14}, {x: 11, y: -15}, {x: 13, y: -14}, {x: 13, y: -16}, {x: 14, y: -16}, {x: 14, y: -17}, {x: 15, y: -18}, {x: 17, y: -17}, {x: 17, y: -19}, {x: 19, y: -19}, {x: 19, y: -20}, {x: 20, y: -20}, {x: 21, y: -20}, {x: 22, y: -21}, {x: 23, y: -22}, {x: 23, y: -23}, {x: 25, y: -23}, {x: 26, y: -22}, {x: 26, y: -24}, {x: 27, y: -24}, {x: 28, y: -25}, {x: 29, y: -25}, {x: 31, y: -25}, {x: 31, y: -26}],[{x: 29, y: -29}, {x: 30, y: -30}, {x: 32, y: -28}, {x: 32, y: -29}, {x: 34, y: -29}, {x: 33, y: -31}, {x: 35, y: -30}, {x: 36, y: -31}, {x: 37, y: -32}, {x: 38, y: -31}, {x: 37, y: -34}, {x: 40, y: -33}, {x: 41, y: -32}, {x: 41, y: -35}, {x: 42, y: -34}, {x: 44, y: -34}, {x: 45, y: -34}, {x: 47, y: -33}, {x: 46, y: -36}, {x: 49, y: -34}, {x: 50, y: -33}, {x: 49, y: -36}, {x: 51, y: -35}, {x: 51, y: -36}, {x: 53, y: -35}, {x: 54, y: -35}, {x: 55, y: -36}, {x: 56, y: -36}, {x: 56, y: -35}, {x: 57, y: -36}, {x: 59, y: -34}, {x: 60, y: -34}, {x: 60, y: -36}, {x: 61, y: -36}, {x: 62, y: -36}, {x: 64, y: -35}, {x: 65, y: -35}, {x: 65, y: -36}, {x: 67, y: -34}, {x: 68, y: -34}, {x: 69, y: -34}, {x: 69, y: -36}, {x: 71, y: -33}, {x: 0, y: -1}, {x: 0, y: -2}, {x: 0, y: -2}, {x: 1, y: -3}, {x: 2, y: -4}, {x: 2, y: -6}, {x: 3, y: -7}, {x: 4, y: -8}, {x: 5, y: -8}, {x: 6, y: -9}, {x: 5, y: -10}, {x: 6, y: -11}, {x: 8, y: -10}, {x: 7, y: -12}, {x: 8, y: -12}, {x: 8, y: -13}, {x: 8, y: -14}, {x: 9, y: -15}, {x: 10, y: -16}, {x: 12, y: -15}, {x: 12, y: -17}, {x: 12, y: -18}, {x: 13, y: -18}, {x: 13, y: -19}, {x: 16, y: -19}, {x: 15, y: -21}, {x: 17, y: -20}, {x: 17, y: -22}, {x: 17, y: -23}, {x: 19, y: -22}, {x: 19, y: -24}, {x: 21, y: -24}, {x: 20, y: -25}, {x: 23, y: -25}, {x: 23, y: -26}, {x: 22, y: -28}, {x: 25, y: -26}, {x: 24, y: -29}, {x: 27, y: -27}, {x: 28, y: -28}, {x: 27, y: -30}],[{x: 27, y: -31}, {x: 26, y: -33}, {x: 28, y: -32}, {x: 30, y: -32}, {x: 29, y: -34}, {x: 30, y: -34}, {x: 32, y: -34}, {x: 31, y: -36}, {x: 34, y: -34}, {x: 34, y: -36}, {x: 35, y: -37}, {x: 35, y: -38}, {x: 37, y: -37}, {x: 38, y: -38}, {x: 38, y: -39}, {x: 40, y: -38}, {x: 41, y: -39}, {x: 43, y: -38}, {x: 43, y: -40}, {x: 45, y: -39}, {x: 46, y: -37}, {x: 45, y: -40}, {x: 47, y: -40}, {x: 47, y: -41}, {x: 49, y: -41}, {x: 50, y: -40}, {x: 50, y: -42}, {x: 52, y: -42}, {x: 52, y: -41}, {x: 53, y: -41}, {x: 55, y: -41}, {x: 55, y: -40}, {x: 56, y: -41}, {x: 56, y: -42}, {x: 58, y: -41}, {x: 60, y: -41}, {x: 61, y: -41}, {x: 62, y: -42}, {x: 63, y: -42}, {x: 65, y: -41}, {x: 65, y: -40}, {x: 64, y: -43}, {x: 68, y: -40}, {x: 0, y: -1}, {x: 0, y: -2}, {x: 0, y: -2}, {x: 1, y: -3}, {x: 2, y: -4}, {x: 2, y: -6}, {x: 2, y: -7}, {x: 3, y: -8}, {x: 4, y: -9}, {x: 5, y: -9}, {x: 4, y: -11}, {x: 5, y: -11}, {x: 7, y: -10}, {x: 6, y: -12}, {x: 6, y: -13}, {x: 6, y: -14}, {x: 6, y: -15}, {x: 8, y: -15}, {x: 8, y: -17}, {x: 10, y: -17}, {x: 10, y: -18}, {x: 11, y: -19}, {x: 11, y: -20}, {x: 12, y: -20}, {x: 13, y: -21}, {x: 12, y: -22}, {x: 14, y: -22}, {x: 15, y: -23}, {x: 15, y: -24}, {x: 17, y: -24}, {x: 17, y: -25}, {x: 18, y: -26}, {x: 17, y: -28}, {x: 20, y: -27}, {x: 20, y: -28}, {x: 20, y: -29}, {x: 23, y: -28}, {x: 21, y: -31}, {x: 25, y: -29}, {x: 24, y: -31}, {x: 24, y: -33}],[{x: 23, y: -34}, {x: 22, y: -36}, {x: 25, y: -34}, {x: 26, y: -35}, {x: 26, y: -36}, {x: 27, y: -37}, {x: 29, y: -36}, {x: 28, y: -38}, {x: 31, y: -37}, {x: 30, y: -39}, {x: 30, y: -40}, {x: 31, y: -41}, {x: 32, y: -42}, {x: 35, y: -40}, {x: 34, y: -43}, {x: 37, y: -42}, {x: 36, y: -43}, {x: 38, y: -43}, {x: 39, y: -43}, {x: 38, y: -46}, {x: 40, y: -44}, {x: 42, y: -44}, {x: 41, y: -46}, {x: 43, y: -45}, {x: 45, y: -45}, {x: 45, y: -46}, {x: 47, y: -46}, {x: 47, y: -47}, {x: 48, y: -46}, {x: 49, y: -47}, {x: 51, y: -46}, {x: 51, y: -45}, {x: 51, y: -47}, {x: 52, y: -48}, {x: 54, y: -47}, {x: 54, y: -48}, {x: 56, y: -47}, {x: 57, y: -48}, {x: 58, y: -49}, {x: 60, y: -47}, {x: 61, y: -46}, {x: 59, y: -50}, {x: 63, y: -46}, {x: 0, y: -1}, {x: 0, y: -2}, {x: 0, y: -2}, {x: 1, y: -3}, {x: 1, y: -4}, {x: 1, y: -6}, {x: 2, y: -7}, {x: 2, y: -8}, {x: 3, y: -9}, {x: 4, y: -10}, {x: 3, y: -11}, {x: 4, y: -12}, {x: 5, y: -11}, {x: 5, y: -13}, {x: 5, y: -14}, {x: 5, y: -15}, {x: 5, y: -16}, {x: 7, y: -16}, {x: 6, y: -17}, {x: 8, y: -18}, {x: 8, y: -19}, {x: 9, y: -20}, {x: 9, y: -21}, {x: 9, y: -22}, {x: 11, y: -22}, {x: 11, y: -23}, {x: 12, y: -24}, {x: 12, y: -25}, {x: 13, y: -25}, {x: 14, y: -26}, {x: 15, y: -27}, {x: 15, y: -28}, {x: 14, y: -29}, {x: 17, y: -29}, {x: 17, y: -30}, {x: 16, y: -32}, {x: 20, y: -31}, {x: 18, y: -33}, {x: 22, y: -32}, {x: 21, y: -34}, {x: 20, y: -35}],[{x: 20, y: -36}, {x: 19, y: -38}, {x: 20, y: -37}, {x: 22, y: -37}, {x: 22, y: -39}, {x: 22, y: -40}, {x: 25, y: -39}, {x: 23, y: -41}, {x: 27, y: -40}, {x: 26, y: -42}, {x: 25, y: -44}, {x: 26, y: -44}, {x: 27, y: -45}, {x: 31, y: -44}, {x: 29, y: -46}, {x: 32, y: -45}, {x: 32, y: -47}, {x: 33, y: -47}, {x: 35, y: -47}, {x: 33, y: -49}, {x: 35, y: -48}, {x: 38, y: -47}, {x: 35, y: -50}, {x: 38, y: -49}, {x: 40, y: -49}, {x: 40, y: -51}, {x: 43, y: -49}, {x: 41, y: -52}, {x: 42, y: -52}, {x: 45, y: -50}, {x: 44, y: -52}, {x: 45, y: -52}, {x: 44, y: -54}, {x: 48, y: -51}, {x: 46, y: -55}, {x: 50, y: -52}, {x: 50, y: -54}, {x: 52, y: -54}, {x: 53, y: -54}, {x: 54, y: -54}, {x: 55, y: -53}, {x: 55, y: -54}, {x: 58, y: -53}, {x: 0, y: -1}, {x: 0, y: -2}, {x: 0, y: -2}, {x: 0, y: -3}, {x: 1, y: -4}, {x: 0, y: -6}, {x: 1, y: -7}, {x: 1, y: -8}, {x: 2, y: -9}, {x: 3, y: -10}, {x: 2, y: -11}, {x: 2, y: -12}, {x: 4, y: -12}, {x: 4, y: -13}, {x: 3, y: -14}, {x: 3, y: -15}, {x: 3, y: -16}, {x: 5, y: -17}, {x: 5, y: -18}, {x: 6, y: -19}, {x: 6, y: -20}, {x: 7, y: -20}, {x: 6, y: -22}, {x: 7, y: -22}, {x: 8, y: -23}, {x: 8, y: -24}, {x: 10, y: -25}, {x: 9, y: -26}, {x: 10, y: -27}, {x: 12, y: -27}, {x: 12, y: -28}, {x: 12, y: -29}, {x: 11, y: -31}, {x: 14, y: -30}, {x: 14, y: -31}, {x: 13, y: -33}, {x: 16, y: -33}, {x: 14, y: -35}, {x: 18, y: -34}, {x: 17, y: -36}, {x: 17, y: -37}],[{x: 15, y: -39}, {x: 16, y: -39}, {x: 18, y: -39}, {x: 19, y: -39}, {x: 18, y: -41}, {x: 18, y: -42}, {x: 21, y: -42}, {x: 19, y: -43}, {x: 23, y: -43}, {x: 20, y: -45}, {x: 21, y: -46}, {x: 23, y: -46}, {x: 22, y: -48}, {x: 26, y: -47}, {x: 24, y: -49}, {x: 27, y: -49}, {x: 27, y: -50}, {x: 28, y: -50}, {x: 30, y: -50}, {x: 28, y: -52}, {x: 30, y: -51}, {x: 32, y: -51}, {x: 31, y: -53}, {x: 33, y: -53}, {x: 34, y: -54}, {x: 34, y: -55}, {x: 37, y: -54}, {x: 35, y: -56}, {x: 36, y: -56}, {x: 39, y: -55}, {x: 38, y: -57}, {x: 40, y: -56}, {x: 39, y: -58}, {x: 44, y: -55}, {x: 41, y: -59}, {x: 44, y: -57}, {x: 44, y: -59}, {x: 45, y: -59}, {x: 48, y: -58}, {x: 47, y: -60}, {x: 48, y: -60}, {x: 51, y: -58}, {x: 50, y: -60}, {x: -1, y: -1}, {x: -1, y: -2}, {x: -1, y: -2}, {x: 0, y: -3}, {x: 0, y: -4}, {x: 0, y: -6}, {x: 0, y: -7}, {x: 0, y: -8}, {x: 1, y: -9}, {x: 1, y: -10}, {x: 1, y: -11}, {x: 1, y: -12}, {x: 3, y: -12}, {x: 2, y: -13}, {x: 2, y: -14}, {x: 2, y: -15}, {x: 2, y: -16}, {x: 3, y: -17}, {x: 3, y: -18}, {x: 4, y: -19}, {x: 4, y: -20}, {x: 4, y: -21}, {x: 4, y: -22}, {x: 5, y: -23}, {x: 6, y: -24}, {x: 6, y: -25}, {x: 7, y: -26}, {x: 6, y: -27}, {x: 7, y: -28}, {x: 9, y: -28}, {x: 8, y: -29}, {x: 9, y: -30}, {x: 8, y: -32}, {x: 10, y: -32}, {x: 12, y: -32}, {x: 9, y: -34}, {x: 12, y: -34}, {x: 11, y: -36}, {x: 15, y: -35}, {x: 14, y: -37}, {x: 13, y: -38}],[{x: 11, y: -40}, {x: 11, y: -41}, {x: 13, y: -40}, {x: 14, y: -41}, {x: 14, y: -42}, {x: 13, y: -44}, {x: 16, y: -44}, {x: 15, y: -45}, {x: 18, y: -45}, {x: 16, y: -47}, {x: 15, y: -48}, {x: 18, y: -48}, {x: 18, y: -49}, {x: 21, y: -49}, {x: 18, y: -51}, {x: 23, y: -51}, {x: 21, y: -52}, {x: 22, y: -53}, {x: 24, y: -53}, {x: 24, y: -54}, {x: 26, y: -54}, {x: 27, y: -54}, {x: 24, y: -57}, {x: 27, y: -56}, {x: 29, y: -57}, {x: 29, y: -58}, {x: 31, y: -58}, {x: 30, y: -59}, {x: 31, y: -59}, {x: 33, y: -59}, {x: 32, y: -60}, {x: 33, y: -60}, {x: 33, y: -61}, {x: 37, y: -60}, {x: 35, y: -62}, {x: 38, y: -62}, {x: 38, y: -63}, {x: 39, y: -63}, {x: 41, y: -63}, {x: 41, y: -65}, {x: 41, y: -64}, {x: 44, y: -64}, {x: 44, y: -65}, {x: -1, y: -1}, {x: -1, y: -2}, {x: -1, y: -2}, {x: 0, y: -3}, {x: 0, y: -4}, {x: -1, y: -6}, {x: -1, y: -7}, {x: -1, y: -8}, {x: 0, y: -9}, {x: 0, y: -10}, {x: 0, y: -11}, {x: 0, y: -12}, {x: 1, y: -12}, {x: 1, y: -13}, {x: 0, y: -14}, {x: 0, y: -15}, {x: 0, y: -16}, {x: 1, y: -17}, {x: 1, y: -18}, {x: 2, y: -19}, {x: 2, y: -20}, {x: 2, y: -21}, {x: 2, y: -22}, {x: 2, y: -23}, {x: 3, y: -24}, {x: 3, y: -25}, {x: 4, y: -26}, {x: 4, y: -27}, {x: 4, y: -28}, {x: 5, y: -29}, {x: 5, y: -30}, {x: 6, y: -31}, {x: 5, y: -32}, {x: 7, y: -33}, {x: 8, y: -34}, {x: 6, y: -35}, {x: 9, y: -35}, {x: 7, y: -37}, {x: 11, y: -37}, {x: 10, y: -38}, {x: 9, y: -39}],[{x: 7, y: -41}, {x: 7, y: -42}, {x: 9, y: -42}, {x: 10, y: -42}, {x: 9, y: -44}, {x: 9, y: -45}, {x: 11, y: -45}, {x: 10, y: -46}, {x: 13, y: -47}, {x: 11, y: -48}, {x: 11, y: -49}, {x: 12, y: -50}, {x: 13, y: -51}, {x: 15, y: -51}, {x: 13, y: -53}, {x: 17, y: -53}, {x: 16, y: -54}, {x: 17, y: -55}, {x: 18, y: -56}, {x: 18, y: -57}, {x: 20, y: -56}, {x: 21, y: -57}, {x: 19, y: -59}, {x: 21, y: -59}, {x: 23, y: -59}, {x: 22, y: -61}, {x: 25, y: -61}, {x: 23, y: -62}, {x: 24, y: -62}, {x: 27, y: -62}, {x: 26, y: -63}, {x: 28, y: -63}, {x: 26, y: -64}, {x: 30, y: -64}, {x: 28, y: -66}, {x: 32, y: -65}, {x: 31, y: -67}, {x: 32, y: -67}, {x: 33, y: -68}, {x: 34, y: -68}, {x: 35, y: -68}, {x: 38, y: -68}, {x: 37, y: -69}, {x: -1, y: -1}, {x: -1, y: -2}, {x: -1, y: -2}, {x: -1, y: -3}, {x: 0, y: -4}, {x: -1, y: -6}, {x: -2, y: -7}, {x: -2, y: -8}, {x: -1, y: -9}, {x: -1, y: -10}, {x: -1, y: -11}, {x: -2, y: -12}, {x: 0, y: -12}, {x: -1, y: -13}, {x: -1, y: -14}, {x: -2, y: -15}, {x: -2, y: -16}, {x: -1, y: -17}, {x: -1, y: -18}, {x: 0, y: -19}, {x: 0, y: -20}, {x: 0, y: -21}, {x: 0, y: -22}, {x: 0, y: -23}, {x: 1, y: -24}, {x: 0, y: -25}, {x: 1, y: -26}, {x: 1, y: -27}, {x: 1, y: -28}, {x: 2, y: -29}, {x: 2, y: -30}, {x: 2, y: -31}, {x: 2, y: -32}, {x: 4, y: -33}, {x: 4, y: -34}, {x: 2, y: -35}, {x: 5, y: -36}, {x: 3, y: -37}, {x: 7, y: -38}, {x: 6, y: -39}, {x: 5, y: -40}],[{x: 3, y: -41}, {x: 2, y: -42}, {x: 5, y: -42}, {x: 5, y: -43}, {x: 5, y: -44}, {x: 4, y: -45}, {x: 6, y: -46}, {x: 5, y: -47}, {x: 7, y: -48}, {x: 6, y: -49}, {x: 6, y: -50}, {x: 7, y: -51}, {x: 7, y: -52}, {x: 9, y: -53}, {x: 8, y: -54}, {x: 11, y: -54}, {x: 10, y: -56}, {x: 12, y: -56}, {x: 12, y: -57}, {x: 12, y: -58}, {x: 14, y: -58}, {x: 15, y: -59}, {x: 13, y: -60}, {x: 15, y: -61}, {x: 16, y: -61}, {x: 16, y: -62}, {x: 18, y: -63}, {x: 16, y: -65}, {x: 17, y: -64}, {x: 20, y: -64}, {x: 20, y: -65}, {x: 21, y: -65}, {x: 19, y: -67}, {x: 23, y: -67}, {x: 21, y: -68}, {x: 25, y: -68}, {x: 24, y: -69}, {x: 24, y: -70}, {x: 26, y: -71}, {x: 28, y: -71}, {x: 29, y: -71}, {x: 30, y: -71}, {x: 30, y: -73}, {x: -1, y: -1}, {x: -1, y: -2}, {x: -1, y: -2}, {x: -1, y: -3}, {x: -1, y: -4}, {x: -2, y: -6}, {x: -2, y: -7}, {x: -3, y: -8}, {x: -2, y: -9}, {x: -2, y: -10}, {x: -2, y: -11}, {x: -3, y: -12}, {x: -1, y: -12}, {x: -3, y: -13}, {x: -3, y: -14}, {x: -3, y: -15}, {x: -3, y: -16}, {x: -3, y: -17}, {x: -3, y: -18}, {x: -2, y: -19}, {x: -3, y: -20}, {x: -3, y: -21}, {x: -3, y: -22}, {x: -2, y: -23}, {x: -2, y: -24}, {x: -2, y: -25}, {x: -2, y: -26}, {x: -2, y: -27}, {x: -1, y: -28}, {x: -1, y: -29}, {x: -1, y: -30}, {x: -1, y: -31}, {x: -2, y: -32}, {x: 0, y: -33}, {x: 0, y: -34}, {x: -1, y: -35}, {x: 1, y: -36}, {x: 0, y: -37}, {x: 2, y: -38}, {x: 2, y: -39}, {x: 1, y: -40}],[{x: -2, y: -41}, {x: -2, y: -42}, {x: 0, y: -42}, {x: 0, y: -43}, {x: 0, y: -44}, {x: 0, y: -45}, {x: 1, y: -46}, {x: 0, y: -47}, {x: 2, y: -48}, {x: 1, y: -49}, {x: 0, y: -50}, {x: 1, y: -51}, {x: 2, y: -52}, {x: 3, y: -53}, {x: 2, y: -54}, {x: 5, y: -55}, {x: 4, y: -56}, {x: 6, y: -57}, {x: 6, y: -58}, {x: 6, y: -59}, {x: 8, y: -59}, {x: 8, y: -60}, {x: 7, y: -61}, {x: 8, y: -62}, {x: 10, y: -63}, {x: 9, y: -64}, {x: 12, y: -64}, {x: 10, y: -66}, {x: 11, y: -66}, {x: 12, y: -66}, {x: 13, y: -67}, {x: 15, y: -67}, {x: 12, y: -68}, {x: 16, y: -69}, {x: 14, y: -70}, {x: 17, y: -70}, {x: 17, y: -71}, {x: 18, y: -72}, {x: 19, y: -73}, {x: 20, y: -74}, {x: 21, y: -74}, {x: 22, y: -74}, {x: 22, y: -75}, {x: -1, y: -1}, {x: -2, y: -2}, {x: -2, y: -2}, {x: -1, y: -3}, {x: -1, y: -4}, {x: -3, y: -6}, {x: -3, y: -7}, {x: -4, y: -8}, {x: -3, y: -9}, {x: -3, y: -10}, {x: -3, y: -11}, {x: -4, y: -12}, {x: -3, y: -12}, {x: -4, y: -13}, {x: -4, y: -14}, {x: -5, y: -15}, {x: -5, y: -16}, {x: -5, y: -17}, {x: -5, y: -18}, {x: -4, y: -19}, {x: -5, y: -20}, {x: -5, y: -21}, {x: -5, y: -22}, {x: -5, y: -23}, {x: -4, y: -24}, {x: -5, y: -25}, {x: -5, y: -26}, {x: -5, y: -27}, {x: -4, y: -28}, {x: -4, y: -29}, {x: -4, y: -30}, {x: -5, y: -31}, {x: -5, y: -32}, {x: -3, y: -33}, {x: -4, y: -34}, {x: -5, y: -35}, {x: -3, y: -36}, {x: -4, y: -37}, {x: -2, y: -38}, {x: -3, y: -39}, {x: -3, y: -40}],[{x: -7, y: -41}, {x: -6, y: -42}, {x: -4, y: -42}, {x: -4, y: -43}, {x: -4, y: -44}, {x: -5, y: -45}, {x: -4, y: -46}, {x: -5, y: -47}, {x: -3, y: -48}, {x: -4, y: -49}, {x: -5, y: -50}, {x: -4, y: -51}, {x: -3, y: -52}, {x: -2, y: -53}, {x: -3, y: -54}, {x: -2, y: -55}, {x: -1, y: -56}, {x: 0, y: -57}, {x: 0, y: -58}, {x: 0, y: -59}, {x: 2, y: -59}, {x: 2, y: -60}, {x: 1, y: -61}, {x: 2, y: -62}, {x: 3, y: -63}, {x: 3, y: -64}, {x: 4, y: -65}, {x: 3, y: -66}, {x: 4, y: -66}, {x: 5, y: -67}, {x: 6, y: -68}, {x: 7, y: -68}, {x: 5, y: -69}, {x: 8, y: -70}, {x: 7, y: -71}, {x: 10, y: -72}, {x: 10, y: -73}, {x: 10, y: -74}, {x: 11, y: -75}, {x: 12, y: -76}, {x: 13, y: -75}, {x: 13, y: -76}, {x: 14, y: -77}, {x: -1, y: -1}, {x: -2, y: -2}, {x: -2, y: -2}, {x: -2, y: -3}, {x: -2, y: -4}, {x: -3, y: -6}, {x: -4, y: -6}, {x: -4, y: -7}, {x: -4, y: -9}, {x: -4, y: -10}, {x: -4, y: -11}, {x: -6, y: -11}, {x: -4, y: -12}, {x: -5, y: -12}, {x: -6, y: -13}, {x: -6, y: -14}, {x: -6, y: -15}, {x: -7, y: -16}, {x: -6, y: -17}, {x: -6, y: -19}, {x: -7, y: -19}, {x: -8, y: -20}, {x: -7, y: -21}, {x: -7, y: -22}, {x: -7, y: -23}, {x: -7, y: -24}, {x: -8, y: -25}, {x: -7, y: -27}, {x: -7, y: -28}, {x: -7, y: -29}, {x: -7, y: -30}, {x: -8, y: -30}, {x: -8, y: -32}, {x: -7, y: -33}, {x: -7, y: -34}, {x: -8, y: -35}, {x: -7, y: -36}, {x: -8, y: -37}, {x: -6, y: -38}, {x: -7, y: -39}, {x: -7, y: -40}],[{x: -10, y: -40}, {x: -11, y: -41}, {x: -9, y: -42}, {x: -9, y: -43}, {x: -9, y: -44}, {x: -10, y: -44}, {x: -9, y: -46}, {x: -9, y: -47}, {x: -8, y: -48}, {x: -9, y: -49}, {x: -10, y: -49}, {x: -9, y: -51}, {x: -8, y: -52}, {x: -8, y: -53}, {x: -9, y: -54}, {x: -8, y: -55}, {x: -7, y: -56}, {x: -6, y: -57}, {x: -7, y: -58}, {x: -7, y: -59}, {x: -5, y: -59}, {x: -5, y: -60}, {x: -6, y: -61}, {x: -5, y: -62}, {x: -4, y: -63}, {x: -4, y: -64}, {x: -3, y: -65}, {x: -4, y: -66}, {x: -3, y: -66}, {x: -2, y: -67}, {x: -2, y: -68}, {x: 0, y: -68}, {x: -2, y: -69}, {x: 1, y: -70}, {x: 0, y: -71}, {x: 2, y: -72}, {x: 2, y: -73}, {x: 2, y: -74}, {x: 3, y: -75}, {x: 4, y: -76}, {x: 5, y: -76}, {x: 5, y: -77}, {x: 6, y: -78}, {x: -1, y: -1}, {x: -2, y: -2}, {x: -2, y: -2}, {x: -2, y: -3}, {x: -2, y: -4}, {x: -4, y: -5}, {x: -5, y: -6}, {x: -5, y: -7}, {x: -5, y: -8}, {x: -5, y: -9}, {x: -5, y: -10}, {x: -7, y: -10}, {x: -5, y: -11}, {x: -6, y: -12}, {x: -7, y: -13}, {x: -8, y: -13}, {x: -8, y: -14}, {x: -8, y: -15}, {x: -8, y: -17}, {x: -8, y: -18}, {x: -9, y: -18}, {x: -9, y: -19}, {x: -10, y: -20}, {x: -9, y: -22}, {x: -9, y: -23}, {x: -10, y: -23}, {x: -10, y: -24}, {x: -10, y: -26}, {x: -10, y: -27}, {x: -11, y: -27}, {x: -10, y: -29}, {x: -11, y: -30}, {x: -11, y: -31}, {x: -10, y: -32}, {x: -11, y: -33}, {x: -11, y: -34}, {x: -11, y: -35}, {x: -12, y: -36}, {x: -10, y: -37}, {x: -11, y: -38}, {x: -11, y: -39}],[{x: -15, y: -39}, {x: -15, y: -40}, {x: -13, y: -40}, {x: -13, y: -41}, {x: -14, y: -42}, {x: -14, y: -43}, {x: -14, y: -44}, {x: -14, y: -45}, {x: -13, y: -47}, {x: -14, y: -47}, {x: -14, y: -48}, {x: -15, y: -49}, {x: -13, y: -51}, {x: -14, y: -52}, {x: -14, y: -53}, {x: -14, y: -54}, {x: -13, y: -55}, {x: -12, y: -56}, {x: -13, y: -57}, {x: -13, y: -58}, {x: -11, y: -58}, {x: -11, y: -59}, {x: -11, y: -60}, {x: -11, y: -62}, {x: -10, y: -63}, {x: -10, y: -64}, {x: -10, y: -65}, {x: -10, y: -66}, {x: -9, y: -66}, {x: -9, y: -67}, {x: -9, y: -68}, {x: -8, y: -68}, {x: -9, y: -69}, {x: -7, y: -70}, {x: -8, y: -71}, {x: -6, y: -72}, {x: -6, y: -73}, {x: -6, y: -74}, {x: -4, y: -75}, {x: -4, y: -76}, {x: -3, y: -76}, {x: -3, y: -77}, {x: -2, y: -78}, {x: -1, y: -1}, {x: -2, y: -2}, {x: -2, y: -2}, {x: -2, y: -3}, {x: -2, y: -4}, {x: -4, y: -5}, {x: -5, y: -5}, {x: -6, y: -6}, {x: -6, y: -7}, {x: -6, y: -8}, {x: -7, y: -9}, {x: -8, y: -10}, {x: -7, y: -10}, {x: -7, y: -11}, {x: -9, y: -11}, {x: -9, y: -12}, {x: -10, y: -13}, {x: -10, y: -14}, {x: -10, y: -16}, {x: -10, y: -17}, {x: -11, y: -17}, {x: -11, y: -19}, {x: -12, y: -19}, {x: -12, y: -20}, {x: -12, y: -21}, {x: -12, y: -22}, {x: -13, y: -23}, {x: -13, y: -24}, {x: -13, y: -25}, {x: -13, y: -26}, {x: -14, y: -27}, {x: -14, y: -28}, {x: -14, y: -29}, {x: -14, y: -30}, {x: -14, y: -31}, {x: -15, y: -32}, {x: -15, y: -33}, {x: -15, y: -34}, {x: -15, y: -35}, {x: -15, y: -37}, {x: -15, y: -38}]];
function Chest(x, y) {
	this.x = x;
	this.y = y;
	this.r = 0;
	this.opening = false;
	this.openDir = null;
	this.closedArray = findPointsCircular(40, 50, 64);
	this.spawnedItem = false;
};
Chest.prototype.exist = function() {
	if(p.x + 5 > this.x + p.worldX - 61 && p.x - 5 < this.x + p.worldX + 61 && p.y + 46 >= this.y + p.worldY - 10 && p.y + 46 <= this.y + p.worldY + 10 && keys[83] && p.canJump && !this.opening) {
		if(p.x < this.x + p.worldX) {
			this.openDir = "right";
		}
		else  {
			this.openDir = "left";
		}
		this.opening = true;
	}
	//square portion of chest
	c.fillStyle = "rgb(139, 69, 19)";
	cube(this.x + p.worldX - 20, this.y + p.worldY - 30, 40, 30, 0.95, 1.05, "rgb(139, 69, 19)", "rgb(159, 89, 39)");
	if(this.openDir === "left") {
		//top of lid
		if(this.r !== 0) {
			for(var i = 0; i < chestAnimationArray[this.r / -6].length; i ++) {
				var front = point3d(chestAnimationArray[this.r / -6][i].x / 2 + this.x + p.worldX - 20, chestAnimationArray[this.r / -6][i].y / 2 + this.y + p.worldY - 30, 1.05);
				var back = point3d(chestAnimationArray[this.r / -6][i].x / 2 + this.x + p.worldX - 20, chestAnimationArray[this.r / -6][i].y / 2 + this.y + p.worldY - 30, 0.95);
				c.strokeStyle = "rgb(159, 89, 39)";
				c.beginPath();
				c.moveTo(front.x, front.y);
				c.lineTo(back.x, back.y);
				c.stroke();
			}
		}
		//bottom of lid
		if(this.r !== 0) {
			var topB = point3d(this.x + p.worldX - 20 + (chestAnimationArray[this.r / -6][42].x / 2), this.y + p.worldY - 30 + (chestAnimationArray[this.r / -6][42].y / 2), 0.95);
			var topF = point3d(this.x + p.worldX - 20 + (chestAnimationArray[this.r / -6][42].x / 2), this.y + p.worldY - 30 + (chestAnimationArray[this.r / -6][42].y / 2), 1.05);
			var bottomB = point3d(this.x + p.worldX - 20, this.y + p.worldY - 30, 0.95);
			var bottomF = point3d(this.x + p.worldX - 20, this.y + p.worldY - 30, 1.05);
			c.fillStyle = "rgb(159, 89, 39)";
			c.beginPath();
			c.moveTo(topB.x, topB.y);
			c.lineTo(topF.x, topF.y);
			c.lineTo(bottomF.x, bottomF.y);
			c.lineTo(bottomB.x, bottomB.y);
			c.fill();
		}
		//front of lid
		c.fillStyle = "rgb(139, 69, 19)";
		var corner = point3d(this.x + p.worldX - 20, this.y + p.worldY - 30, 1.05);
		var center = point3d(this.x + p.worldX, this.y + p.worldY, 1.05);
		c.save();
		c.translate(corner.x, corner.y);

		if(this.r !== 0) {
			c.rotate(this.r / 360 * 2 * Math.PI - 0.145);
		}
		else if(this.r === -84) {
			c.rotate(90 / 360 * 2 * Math.PI);
		}

		c.beginPath();
		c.arc(20 * 1.05, 25 * 1.05, 32 * 1.05, 1.5 * Math.PI - 0.669, 1.5 * Math.PI + 0.669);
		c.fill();

		c.restore();
	}
	else if(this.openDir === "right") {
		//top of lid
		for(var i = 0; i < chestAnimationArray[this.r / -6].length; i ++) {
			var front = point3d(chestAnimationArray[this.r / -6][i].x / -2 + this.x + p.worldX + 20, chestAnimationArray[this.r / -6][i].y / 2 + this.y + p.worldY - 30, 1.05);
			var back = point3d(chestAnimationArray[this.r / -6][i].x / -2 + this.x + p.worldX + 20, chestAnimationArray[this.r / -6][i].y / 2 + this.y + p.worldY - 30, 0.95);
			c.strokeStyle = "rgb(159, 89, 39)";
			c.beginPath();
			c.moveTo(front.x, front.y);
			c.lineTo(back.x, back.y);
			c.stroke();
		}
		c.fillStyle = "rgb(139, 69, 19)";
		//bottom of lid
		if(this.r !== 0) {
			var topB = point3d(this.x + p.worldX + 20 + (chestAnimationArray[this.r / -6][42].x / -2), this.y + p.worldY - 30 + (chestAnimationArray[this.r / -6][42].y / 2), 0.95);
			var topF = point3d(this.x + p.worldX + 20 + (chestAnimationArray[this.r / -6][42].x / -2), this.y + p.worldY - 30 + (chestAnimationArray[this.r / -6][42].y / 2), 1.05);
			var bottomB = point3d(this.x + p.worldX + 20, this.y + p.worldY - 30, 0.95);
			var bottomF = point3d(this.x + p.worldX + 20, this.y + p.worldY - 30, 1.05);
			c.fillStyle = "rgb(159, 89, 39)";
			c.beginPath();
			c.moveTo(topB.x, topB.y);
			c.lineTo(topF.x, topF.y);
			c.lineTo(bottomF.x, bottomF.y);
			c.lineTo(bottomB.x, bottomB.y);
			c.fill();
		}
		//front of lid
		var corner = point3d(this.x + p.worldX + 20, this.y + p.worldY - 30, 1.05);
		var center = point3d(this.x + p.worldX, this.y + p.worldY, 1.05);
		c.save();
		c.translate(corner.x, corner.y);
		if(this.r !== 0) {
			c.rotate(-this.r / 360 * 2 * Math.PI + 0.145);
		}
		else if(this.r === -84) {
			c.rotate(-90 / 360 * 2 * Math.PI);
		}
		c.beginPath();
		c.arc(20 * -1.05, 25 * 1.05, 32 * 1.05, 1.5 * Math.PI - 0.669, 1.5 * Math.PI + 0.669);
		c.fill();
		c.restore();

	}
	else {
		for(var i = 0; i < this.closedArray.length; i ++) {
			if(this.closedArray[i].y <= 0) {
				var front = point3d(this.closedArray[i].x / 2 + this.x + p.worldX - 20, this.closedArray[i].y / 2 + this.y + p.worldY - 30, 1.05);
				var back = point3d(this.closedArray[i].x / 2 + this.x + p.worldX - 20, this.closedArray[i].y / 2 + this.y + p.worldY - 30, 0.95);
				c.strokeStyle = "rgb(159, 89, 39)";
				c.beginPath();
				c.moveTo(front.x, front.y);
				c.lineTo(back.x, back.y);
				c.stroke();
			}
		}
		c.fillStyle = "rgb(139, 69, 19)";
		var corner = point3d(this.x + p.worldX - 20, this.y + p.worldY - 30, 1.05);
		var center = point3d(this.x + p.worldX, this.y + p.worldY, 1.05);
		c.save();
		c.translate(corner.x, corner.y);
		c.beginPath();
		c.arc(20 * 1.05, 25 * 1.05, 32 * 1.05, 1.5 * Math.PI - 0.669, 1.5 * Math.PI + 0.669);
		c.fill();
		c.restore();
	}
	//animation
	if(this.r > -84 && this.opening) {
		this.r -= 6;
	}
	//item spawning - give the player one item they don't already have
	if(this.r <= -84 && !this.spawnedItem && this.opening) {
		this.spawnedItem = true;
		this.requestingItem = true;
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
	//top face
	c.beginPath();
	c.moveTo(topLeftF.x, topLeftF.y);
	c.lineTo(topLeftB.x, topLeftB.y);
	c.lineTo(topRightB.x, topRightB.y);
	c.lineTo(topRightF.x, topRightF.y);
	c.fill();
	collisionLine(this.x + p.worldX - 20, this.y + p.worldY, this.x + p.worldX + 20, this.y + p.worldY, {walls: [true, false, false, false], illegalHandling: "collide"});
	//left face
	c.beginPath();
	c.moveTo(topLeftF.x, topLeftF.y);
	c.lineTo(topLeftB.x, topLeftB.y);
	c.lineTo(bottomB.x, bottomB.y);
	c.lineTo(bottomF.x, bottomF.y);
	c.fill();
	collisionLine(this.x + p.worldX - 20, this.y + p.worldY, this.x + p.worldX, this.y + p.worldY + 60, {walls: [true, true, true, true], illegalHandling: "collide"});
	//right face
	c.beginPath();
	c.moveTo(topRightF.x, topRightF.y);
	c.lineTo(topRightB.x, topRightB.y);
	c.lineTo(bottomB.x, bottomB.y);
	c.lineTo(bottomF.x, bottomF.y);
	c.fill();
	collisionLine(this.x + p.worldX + 20, this.y + p.worldY, this.x + p.worldX, this.y + p.worldY + 60, {walls: [true, true, true, true], illegalHandling: "collide"});
	//front face
	c.fillStyle = "rgb(110, 110, 110)";
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
};
var partOfAStair;
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
	partOfAStair = true;
	if(this.dir === "right") {
		for(var i = 0; i < this.steps.length; i ++) {
			this.steps[i].update();
			if(!noGraphics) {
				this.steps[i].display();
			}
		}
	}
	else {
		for(var i = 0; i < this.steps.length; i ++) {
			this.steps[i].exist();
			if(!noGraphics) {
				this.steps[i].display();
			}
		}
	}
	partOfAStair = false;
};
function Altar(x, y, type) {
	this.x = x;
	this.y = y;
	this.type = type;
	this.particles = [];
};
Altar.prototype.exist = function() {
	if(p.x + 5 > this.x + p.worldX - 20 && p.x - 5 < this.x + p.worldX + 20 && p.y + 46 > this.y + p.worldY - 20 && p.y - 5 < this.y + p.worldY + 20) {
		if(this.type === "health") {
			p.health ++;
			p.maxHealth ++;
			// roomInstances[inRoom].content.push(new Words(p.x - p.worldX + 70, p.y - p.worldY, "+1 max health", "rgb(255, 0, 0)"));
		}
		else if(this.type === "mana") {
			p.mana ++;
			p.maxMana ++;
			// roomInstances[inRoom].content.push(new Words(p.x - p.worldX + 70, p.y - p.worldY, "+1 max mana", "rgb(0, 0, 255)"));
		}
		this.splicing = true;
	}
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
function Words(x, y, words, color) {
	this.x = x;
	this.y = y;
	this.words = words;
	this.color = color;
	this.opacity = 1;
};
Words.prototype.exist = function() {
	c.save();
	c.globalAlpha = this.opacity;
	c.fillStyle = this.color;
	c.font = "bolder 20pt monospace";
	c.textAlign = "center";
	c.fillText(this.words, this.x + p.worldX, this.y + p.worldY);
	c.restore();
	this.y --;
	this.opacity -= 0.05;
	if(this.opacity <= 0) {
		this.splicing = true;
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
		this.used = true;
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
	//first platform
	new Platform(this.x1, this.y1, this.w1).exist();
	var leftBack = point3d(this.x1 + p.worldX, this.y1 + p.worldY, 0.9);
	var leftFront = point3d(this.x1 + p.worldX, this.y1 + p.worldY, 1.1);
	var rightBack = point3d(this.x1 + this.w1 + p.worldX, this.y1 + p.worldY, 0.9);
	var rightFront = point3d(this.x1 + this.w1 + p.worldX, this.y1 + p.worldY, 1.1);
	c.strokeStyle = "rgb(150, 150, 150)";
	c.beginPath();
	c.moveTo(leftBack.x, leftBack.y);
	c.lineTo(leftBack.x, 0);
	c.moveTo(leftFront.x, leftFront.y);
	c.lineTo(leftFront.x, 0);
	c.moveTo(rightBack.x, rightBack.y);
	c.lineTo(rightBack.x, 0);
	c.moveTo(rightFront.x, rightFront.y);
	c.lineTo(rightFront.x, 0);
	c.stroke();
	//second platform
	new Platform(this.x2, this.y2, this.w2).exist();
	var leftBack = point3d(this.x2 + p.worldX, this.y2 + p.worldY, 0.9);
	var leftFront = point3d(this.x2 + p.worldX, this.y2 + p.worldY, 1.1);
	var rightBack = point3d(this.x2 + this.w1 + p.worldX, this.y2 + p.worldY, 0.9);
	var rightFront = point3d(this.x2 + this.w1 + p.worldX, this.y2 + p.worldY, 1.1);
	c.beginPath();
	c.moveTo(leftBack.x, leftBack.y);
	c.lineTo(leftBack.x, 0);
	c.moveTo(leftFront.x, leftFront.y);
	c.lineTo(leftFront.x, 0);
	c.moveTo(rightBack.x, rightBack.y);
	c.lineTo(rightBack.x, 0);
	c.moveTo(rightFront.x, rightFront.y);
	c.lineTo(rightFront.x, 0);
	c.stroke();
	//moving
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
	this.y1 = Math.round(this.y1);
	this.y2 = Math.round(this.y2);
	if(this.steppedOn1) {
		p.y = this.y1 + p.worldY - 46;
	}
	else if(this.steppedOn2) {
		p.y = this.y2 + p.worldY - 46;
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
	//pillar
	cube(this.x + p.worldX - 20, this.y + p.worldY - this.h + 20, 40, this.h - 40, 0.95, 1.05);
	//base
	cube(this.x + p.worldX - 30, this.y + p.worldY - 20, 60, 21, 0.9, 1.1);
	cube(this.x + p.worldX - 40, this.y + p.worldY - 10, 80, 10, 0.9, 1.1);
	//top
	cube(this.x + p.worldX - 41, this.y + p.worldY - this.h, 80, 12, 0.9, 1.1);
	cube(this.x + p.worldX - 30, this.y + p.worldY - this.h + 10, 60, 10, 0.9, 1.1);
	//base collisions
	collisionRect(this.x + p.worldX - 30, this.y + p.worldY - 20, 60, 21, {walls: [true, true, true, true], illegalHandling: "teleport"});
	collisionRect(this.x + p.worldX - 40, this.y + p.worldY - 10, 80, 10, {walls: [true, true, true, true], illegalHandling: "teleport"});
	//top collisions
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
	var p1 = getRotated(-75, -10, Math.floor(this.tilt));
	var p2 = getRotated(75, -10, Math.floor(this.tilt));
	this.p1 = p1;
	this.p2 = p2;
	//graphics
	cube(this.origX + p.worldX - 5, this.origY + p.worldY + 10, 10, 8000, 0.99, 1.01);
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
		boxFronts[boxFronts.length - 1] = {
		type: "polygon",
		col: "rgb(110, 110, 110)",
		loc: [
			{
				x: boxFronts[boxFronts.length - 1].loc[0],
				y: topL
			},
			{
				x: boxFronts[boxFronts.length - 1].loc[0] + boxFronts[boxFronts.length - 1].loc[2],
				y: topR
			},
			{
				x: boxFronts[boxFronts.length - 1].loc[0] + boxFronts[boxFronts.length - 1].loc[2],
				y: 800
			},
			{
				x: boxFronts[boxFronts.length - 1].loc[0],
				y: 800
			}
		]
	};
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
		while(!p.canJump) {
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
	for(var i = 2; i < this.lowArch.length; i += 2) {
		c.beginPath();
		c.moveTo(lowB.x + this.lowB[i].x, lowB.y + this.lowB[i].y);
		c.lineTo(lowF.x + this.lowF[i].x, lowF.y + this.lowF[i].y);
		c.lineTo(lowF.x + this.lowF[i - 2].x, lowF.y + this.lowF[i - 2].y);
		c.lineTo(lowB.x + this.lowB[i - 2].x, lowB.y + this.lowB[i - 2].y);
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
		for(var j = 2; j < this.smallB.length; j += 2) {
			c.beginPath();
			c.moveTo(lowB.x + this.smallB[j].x, lowB.y + this.smallB[j].y);
			c.lineTo(lowB.x + this.smallB[j - 2].x, lowB.y + this.smallB[j - 2].y);
			c.lineTo(lowF.x + this.smallF[j - 2].x, lowF.y + this.smallF[j - 2].y);
			c.lineTo(lowF.x + this.smallF[j].x, lowF.y + this.smallF[j].y);
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
	while(Math.distSq(p.x + 5, p.y + 46, this.x + p.worldX, this.y + p.worldY + 500) < 500 || Math.distSq(p.x - 5, p.y + 46, this.x + p.worldX, this.y + p.worldY + 500) < 250000) {
		p.y --;
		p.canJump = true;
		p.velY = (p.velY > 3) ? 3 : p.velY;
	}
	for(var i = 0; i < roomInstances[theRoom].content.length; i ++) {
		if(roomInstances[theRoom].content[i] instanceof Enemy) {
			while(Math.distSq(this.x, this.y + 500, roomInstances[theRoom].content[i].x + roomInstances[theRoom].content[i].leftX, roomInstances[theRoom].content[i].y + roomInstances[theRoom].content[i].bottomY) < 250000 || Math.distSq(this.x, this.y + 500, roomInstances[theRoom].content[i].x + roomInstances[theRoom].content[i].rightX, roomInstances[theRoom].content[i].y + roomInstances[theRoom].content[i].bottomY) < 250000) {
				roomInstances[theRoom].content[i].y --;
				roomInstances[theRoom].content[i].velY = (roomInstances[theRoom].content[i].velY > 3) ? 3 : roomInstances[theRoom].content[i].velY;
				if(roomInstances[theRoom].content[i] instanceof Bat && roomInstances[theRoom].content[i].timePurified > 0) {
					roomInstances[theRoom].content[i].dest = {x: roomInstances[theRoom].content[i].x + (Math.random() * 200 - 100), y: roomInstances[theRoom].content[i].y + (Math.random() * 200 - 100)};
					roomInstances[theRoom].content[i].velY = 0;
				}
			}
		}
	}
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
				cube(p.worldX + this.points[indexes[i].index].x - 5, p.worldY + this.points[indexes[i].index].y - 10, 10, 10, this.points[indexes[i].index].z - 0.01, this.points[indexes[i].index].z + 0.01, null, null, true);
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
	cube(this.x + p.worldX - 50, this.y + p.worldY - 100, 100, 10, 0.9, 0.92, "rgb(139, 69, 19)", "rgb(159, 89, 39)");
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
	cube(this.x + p.worldX - 40, this.y + p.worldY - 200, 20, 190, 0.72, 0.78, undefined, undefined, { noFrontExtended: true });
	cube(this.x + p.worldX + 20, this.y + p.worldY - 200, 20, 190, 0.72, 0.78, undefined, undefined, { noFrontExtended: true });
	cube(this.x + p.worldX - 200, this.y + p.worldY - 10, 400, 100, 0.7, 0.8, undefined, undefined, { noFrontExtended: true });
	cube(this.x + p.worldX - 40, this.y + p.worldY - 200, 20, 190, 0.78, 0.78, undefined, undefined, { noFrontExtended: true });
	cube(this.x + p.worldX + 20, this.y + p.worldY - 200, 20, 190, 0.78, 0.78, undefined, undefined, { noFrontExtended: true });
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
		])
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
		array.push({x: -100, y: -100});
		array.push({x: -100, y: this.y + p.worldY});
		for(var i = 0; i < this.points.length; i += 2) {
			array.push({x: this.points[i].x + p.worldX, y: this.points[i].y + p.worldY});
		}
		array.push({x: 900, y: this.y + p.worldY});
		array.push({x: 900, y: -100});
		polygon3d("rgb(110, 110, 110)", "rgb(150, 150, 150)", 0.9, 1.1, array);
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
		if(topY > 150) {
			this.waterAnimations.splice(i, 1);
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

/** ROOM DATA **/
var inRoom = 0;
var numRooms = 0;
var theRoom = null;
function Room(type, content, id, minWorldY, background) {
	this.type = type;
	this.content = content;
	this.id = id;
	this.hasEnemy = false;
	this.pathScore = null;
	this.background = background || null;
	this.minWorldY = minWorldY;
	this.colorScheme = null;
};
Room.prototype.exist = function(index) {
	if(this.background === null) {
		this.background = (Math.random() < 0.5) ? "plain" : "bricks";
	}
	boxFronts = [];
	extraGraphics = [];
	hitboxes = [];
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
			c.save();
			c.globalAlpha = (this.content[i].opacity < 0) ? 0 : this.content[i].opacity;
			c.translate(this.content[i].x + p.worldX, this.content[i].y + p.worldY);
			this.content[i].display("item");
			c.fillStyle = "rgb(255, 0, 0)";
			c.beginPath();
			//c.arc(0, 0, 500000000, 0, 2 * Math.PI);
			c.fill();
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
		if(this.content[i] instanceof Chest) {
			chestIndexes.push(i);
		}
		if(this.content[i] instanceof BoulderVoid) {
			p.canUseEarth = false;
		}
	}
	//load chest fronts after everything else
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
	//load block fronts after everything else
	loadBoxFronts();
	//load magic charges
	for(var i = 0; i < chargeIndexes.length; i ++) {
		this.content[chargeIndexes[i]].exist();
	}
	//load boulders
	for(var i = 0; i < boulderIndexes.length; i ++) {
		this.content[boulderIndexes[i]].exist();
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
		name: "secret1",
		difficulty: 0,
		extraDoors: 1,
		add: function() {
			roomInstances.push(
				new Room(
					"secret1",
					[
						new Chest(100, 0),
						new Chest(800, 0),
						new Block(-1000, -1000, 1000, 2000), //left wall
						new Block(-100, 500, 1010, 500), //floor
						new Block(900, -1000, 1000, 2000), //right wall,
						new Door(100, 500, ["ambient", "combat", "parkour"]),
						new Door(800, 500, ["ambient", "combat", "parkour"]),
						new LightRay(200, 500),
						new Tree(450, 500),
						new Block(-300, 0, 500, 100), //left roof,
						new Block(700, 0, 500, 100), //right roof
						new Block(-300, -1300, 500, 1100), //left roof,
						new Block(700, -1300, 500, 1100), //right roo
					],
					"?"
				)
			);
			roomInstances[roomInstances.length - 1].colorScheme = "green";
		}
	}, //garden
	{
		name: "secret2",
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
		name: "secret3",
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
						new RandomEnemy(50, 0)
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
						new RandomEnemy(400, -200)
					],
					"?",
					undefined,
					"plain"
				)
			)
		}
	}, //bridge combat room
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
	{
		name: "parkour5",
		difficulty: 2,
		extraDoors: 0.5,
		add: function() {
			roomInstances.push(
				new Room(
					"parkour5",
					[
						new Block(-1000, 0, 1100, 1000), //left floor
						new Block(-1100, -4000, 1000, 8000), //left wall
						new Block(1190, 0, 1000, 1000), //right floor
						new Block(1390, -4000, 1000, 8000), //right wall
						new Gear(400, 0, 250, "right"),
						new Gear(890, 0, 250, "left"),
						new Door(0, 0, ["reward"]),
						new Door(1290, 0, ["reward"])
					],
					"?",
					446
				)
			);
		}
	}, //gear room
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
	EnergyStaff, ElementalStaff, PurityStaff, //magic weapons
	Barricade, FireCrystal, WaterCrystal, EarthCrystal, AirCrystal //extras / bonuses
];
var enemies = [Spider, Bat, Skeleton, SkeletonWarrior, SkeletonArcher, Wraith, /*Troll*/];
if(hax) {
	// items = [items[2]];
	for(var i = 0; i < rooms.length; i ++) {
		if(rooms[i].name !== "parkour5") {
			rooms.splice(i, 1);
			i --;
			continue;
		}
	}
	enemies = [Bat];
}
var roomInstances = [
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
			new Door(300,  500, ["ambient", "combat", "parkour", "secret"], false, false, "arch"),
			new Door(500,  500, ["ambient", "combat", "parkour", "secret"], false, false, "arch"),
			new Door(700,  500, ["ambient", "combat", "parkour", "secret"], false, false, "arch")
		],
		"?"
	)
];


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
Item.prototype.displayDesc = function(x, y) {
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
	var descHeight = this.desc.length * 12 + 10;
	var idealY = y - (descHeight / 2);
	var actualY = (idealY > 20) ? idealY : 20;
	actualY = (actualY + (descHeight / 2) < 780) ? actualY : 780 - (descHeight / 2);
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
};

//weapons
function Weapon(modifier) {
	Item.call(this);
	this.equipable = false;
	this.modifier = (modifier === undefined) ? "none" : modifier;
	this.element = "none";
	this.particles = [];
};
inheritsFrom(Weapon, Item);
Weapon.prototype.displayParticles = function() {
	for(var i = 0; i < 5; i ++) {
		if(this.element === "fire") {
			this.particles.push(new Particle("rgb(255, 128, 0)", Math.random() * 50 + 10, Math.random() * 50 + 10, Math.random() * 4 - 2, Math.random() * 4 - 2, Math.random() * 1 + 5));
			this.particles[this.particles.length - 1].opacity = 0.25;
		}
		else if(this.element === "water") {
			this.particles.push(new Particle("rgb(0, 255, 255)", Math.random() * 50 + 10, Math.random() * 50 + 10, Math.random() * 4 - 2, Math.random() * 4 - 2, Math.random() * 1 + 5));
			this.particles[this.particles.length - 1].opacity = 0.25;
		}
		else if(this.element === "earth") {
			this.particles.push(new Particle("rgb(0, 255, 0)", Math.random() * 50 + 10, Math.random() * 50 + 10, Math.random() * 4 - 2, Math.random() * 4 - 2, Math.random() * 1 + 5));
			this.particles[this.particles.length - 1].opacity = 0.25;
		}
		else if(this.element === "air") {
			this.particles.push(new Particle("rgb(255, 255, 255)", Math.random() * 50 + 10, Math.random() * 50 + 10, Math.random() * 4 - 2, Math.random() * 4 - 2, Math.random() * 1 + 5));
			this.particles[this.particles.length - 1].opacity = 0.25;
		}
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
	p.attackingWith = this;
};
function Dagger(modifier) {
	MeleeWeapon.call(this, modifier);
	this.damLow = p.class === "warrior" ? 6 : 5;
	this.damHigh = p.class === "warrior" ? 8 : 7;
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
			color: "rgb(255, 255, 255)"
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
	this.damLow = p.class === "warrior" ? 8 : 7;
	this.damHigh = p.class === "warrior" ? 11 : 10;
	this.range = 60;
	this.power = 3;
};
inheritsFrom(Sword, MeleeWeapon);
Sword.prototype.display = function(type) {
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
	this.damLow = p.class === "warrior" ? 8 : 7;
	this.damHigh = p.class === "warrior" ? 11 : 10;
	this.range = 60;
	this.power = 3;
};
inheritsFrom(Spear, MeleeWeapon);
Spear.prototype.display = function(type) {
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
	this.damLow = 12;
	this.damHigh = 15;
	this.attackSpeed = "slow";
	this.power = 4;
};
inheritsFrom(Mace, MeleeWeapon);
Mace.prototype.display = function(type) {
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
	this.damLow = p.class === "archer" ? 8 : 7;
	this.damHigh = p.class === "archer" ? 11 : 10;
	this.range = "long";
	this.power = 3;
	/*
	ranges: very short (daggers), short (swords), medium (forceful bows), long (bows & forceful longbows), very long (longbows & distant bows), super long (distant longbows)
	*/
};
inheritsFrom(WoodBow, RangedWeapon);
WoodBow.prototype.display = function(type) {
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
	this.damLow = p.class === "archer" ? 11 : 10;
	this.damHigh = p.class === "archer" ? 13 : 12;
	this.range = "long";
	this.power = 4;
};
inheritsFrom(MetalBow, RangedWeapon);
MetalBow.prototype.display = function(type) {
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
	this.damLow = (p.class === "archer") ? 7 : 6;
	this.damHigh = (p.class === "archer") ? 10 : 9;
	this.power = 4;
};
inheritsFrom(MechBow, RangedWeapon);
MechBow.prototype.display = function(type) {
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
	this.damLow = (p.class === "archer") ? 9 : 8;
	this.damHigh = (p.class === "archer") ? 10 : 9;
	this.power = 5;
};
inheritsFrom(LongBow, RangedWeapon);
LongBow.prototype.display = function(type) {
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
	this.manaCost = (this.modifier === "none") ? 4 : (this.modifier === "arcane" ? 5 : 3);
	this.damLow = (p.class === "mage") ? 8 : 7;
	this.damHigh = (p.class === "mage") ? 11 : 10;
	this.power = 3;
};
inheritsFrom(EnergyStaff, MagicWeapon);
EnergyStaff.prototype.display = function(type) {
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
	this.manaCost = 3;
	this.damLow = (p.class === "mage") ? 6 : 5;
	this.damHigh = (p.class === "mage") ? 9 : 8;
	this.power = 4;
};
inheritsFrom(ElementalStaff, MagicWeapon);
ElementalStaff.prototype.display = function(type) {
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
function PurityStaff(modifier) {
	MagicWeapon.call(this, modifier);
	this.manaCost = 6;
	this.damLow = 0;
	this.damHigh = 0;
	this.chargeType = "purity";
	this.power = 2;
};
inheritsFrom(PurityStaff, MagicWeapon);
PurityStaff.prototype.display = function(type) {
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
PurityStaff.prototype.getDesc = function() {
	return [
		{
			content: ((this.modifier === "none") ? "" : this.modifier.substr(0, 1).toUpperCase() + this.modifier.substr(1, this.modifier.length) + " ") + "Staff of Purity",
			font: "bolder 10pt Cursive",
			color: "rgb(255, 255, 255)"
		},
		{
			content: "Mana Cost: " + this.manaCost,
			font: "10pt monospace",
			color: "rgb(255, 255, 255)"
		},
		{
			content: "This staff can remove the evil magic from creatures. However, in the depths of the dungeon, nothing can stay free of corruption for long.",
			font: "10pt Cursive",
			color: "rgb(150, 150, 150)"
		}
	];
};

//equipables
function Equipable() {
	Item.call(this);
	this.equipable = true;
};
Equipable.prototype.init = function() {
	return;
};
function Helmet() {
	Equipable.call(this);
	this.defLow = 3;
	this.defHigh = 5;
	this.power = 3;
};
Helmet.prototype.display = function() {

};
Helmet.prototype.getDesc = function() {
	return [
		{
			content: "something",
			font: "bolder 10pt Cursive",
			color: "rgb(255, 255, 255)"
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

function Barricade() {
	Extra.call(this);
	this.consumed = false;
};
inheritsFrom(Barricade, Extra);
Barricade.prototype.display = function(type) {
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
		if(roomInstances[inRoom].content[i] instanceof Door && Math.dist(loc.x, loc.y, 400, 400) <= 100) {
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
			else if(roomInstances[inRoom].content[i] instanceof Block) {
				var block = roomInstances[inRoom].content[i];
				if(this.x > block.x && this.x < block.x + block.w && this.y > block.y && this.y < block.y + block.h) {
					this.hitSomething = true;
				}
			}
			else if(roomInstances[inRoom].content[i] instanceof Bridge) {
				var bridge = roomInstances[inRoom].content[i];
				if(Math.distSq(this.x, this.y, bridge.x, bridge.y + 500) <= 250000) {
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
function RandomEnemy(x, y) {
	this.x = x;
	this.y = y;
};
RandomEnemy.prototype.generate = function() {
	var enemyIndex = Math.floor(Math.random() * enemies.length);
	roomInstances[inRoom].content.push(new enemies[enemyIndex](this.x, this.y - new enemies[enemyIndex]().bottomY));
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
	roomInstances[inRoom].content.push(new Words(this.x, this.y, "-" + amount, "rgb(128, 0, 0)"));
	this.health -= amount;
};
Enemy.prototype.displayStats = function() {
	//healthbar
	c.globalAlpha = this.opacity > 0 ? this.opacity : 0;
	this.attackRecharge --;
	var middle = ((this.x + p.worldX + this.rightX) + (this.x + p.worldX + this.leftX)) / 2;
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
};
Enemy.prototype.exist = function() {
	this.display();
	this.timeFrozen --;
	this.timePurified --;
	if(!this.fadingIn && (this.timeFrozen < 0 || this instanceof Wraith)) {
		this.update("player");
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
	this.health = 5;
	this.maxHealth = 5;
	this.defLow = 2;
	this.defHigh = 3;
	this.damLow = 2;
	this.damHigh = 3;
	this.name = "a giant spider";
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
	if(typeof dest === "string") {
		if(this.timePurified < 0) {
			if(this.x + p.worldX < p.x) {
				this.x += 2;
			}
			else {
				this.x -= 2;
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
		this.y += this.velY;
		this.velY += 0.1;
		if(this.canJump && Math.abs(this.x + p.worldX - p.x) <= 130 && Math.abs(this.x + p.worldX - p.x) >= 120 && dest === "player") {
			this.velY = -4;
		}
		this.canJump = false;
	}
	else {
		if(this.x < dest.x) {
			this.x += 2;
		}
		else {
			this.x -= 2;
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
	this.health = 5;
	this.maxHealth = 5;
	this.defLow = 2;
	this.defHigh = 3;
	this.damLow = 2;
	this.damHigh = 3;
	this.name = "a bat"
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
	if(typeof dest === "string") {
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
	this.health = 10;
	this.maxHealth = 10;
	this.damLow = 2;
	this.damHigh = 4;
	this.defLow = 2;
	this.defHigh = 4;

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
	if(typeof dest === "string") {
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
	this.health = 10;
	this.maxHealth = 10;
	this.defLow = 4;
	this.defHigh = 6;
	this.damLow = 5;
	this.damHigh = 7;
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
	if(typeof dest === "string") {
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
		var swordEnd = getRotated(10, -60, -this.attackArm);
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
		var swordEnd = getRotated(-10, -60, this.attackArm);
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

	//hitbox
	this.leftX = -13;
	this.rightX = 13;
	this.topY = -8;
	this.bottomY = 43;

	//stats
	this.velX = null;
	this.health = 10;
	this.maxHealth = 10;
	this.defLow = 0;
	this.defHigh = 2;
	this.damLow = 5;
	this.damHigh = 7;
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
	if(typeof dest === "string") {
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
			var velocity = getRotated(50, 0, this.aimRot);
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
			var velocity = getRotated(-50, 0, -this.aimRot);
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
	this.health = 15;
	this.maxHealth = 15;
	this.damLow = 4;
	this.damHigh = 5;
	this.defLow = 4;
	this.defHigh = 5;
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
	if(typeof dest === "string") {
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
		if(roomInstances[inRoom].content[i] instanceof Enemy && this.type !== "shadow") {
			var enemy = roomInstances[inRoom].content[i];
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
			}
		}
		else if(roomInstances[inRoom].content[i] instanceof Bridge) {
			var bridge = roomInstances[inRoom].content[i];
			if(Math.distSq(this.x, this.y, bridge.x, bridge.y + 500) < 250000) {
				this.splicing = true;
			}
		}
	}
	//collision with player
	if(this.x + p.worldX > p.x - 5 && this.x + p.worldX < p.x + 5 && this.y + p.worldY > p.y - 7 && this.y + p.worldY < p.y + 46 && this.type === "shadow") {
		var damage = Math.round(Math.random()) + 4;
		p.hurt(damage, "a wraith");
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
	this.health = 15;
	this.maxHealth = 15;
	this.defLow = 5;
	this.defHigh = 7;
	this.damLow = 5;
	this.damHigh = 7;
	this.complexAttack = true;
	this.name = "a troll";
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
	for(var scale = -1; scale <= 1; scale += 2) {
		c.save();
		if(scale === -1) {
			c.translate(3 * this.leg1, 7 * this.leg1);
		}
		else {
			c.translate(-3 * this.leg2, 7 * this.leg2);
		}
		c.scale(scale, 1);
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
		this.leg1Dir = (this.leg1 > 2) ? -0.125 : this.leg1Dir;
		this.leg1Dir = (this.leg1 < -2) ? 0.125 : this.leg1Dir;
		this.leg2Dir = (this.leg2 > 2) ? -0.125 : this.leg2Dir;
		this.leg2Dir = (this.leg2 < -2) ? 0.125 : this.leg2Dir;
	}
	else {
		this.leg1Dir = (this.leg1 < 0) ? 0.125 : this.leg1Dir;
		this.leg1Dir = (this.leg1 > 0) ? -0.125 : this.leg1Dir;
		this.leg2Dir = (this.leg2 < 0) ? 0.125 : this.leg2Dir;
		this.leg2Dir = (this.leg2 > 0) ? -0.125 : this.leg2Dir;
	}
	}
	//head
	circle(0, -40, 20);
	c.restore();
	//right arm
	{
	c.save();
	c.translate(this.x + p.worldX + 40, this.y + p.worldY - 10);
	if(this.x + p.worldX < p.x && this.currentAction === "melee-attack") {
		c.rotate(this.attackArm / 180 * Math.PI);
	}
	else {
		c.rotate(40 / 180 * Math.PI);
	}
	if(this.x + p.worldX < p.x && this.currentAction === "melee-attack") {
		c.fillStyle = "rgb(139, 69, 19)";
		c.beginPath();
		c.moveTo(45, 0);
		c.lineTo(50, -50);
		c.lineTo(30, -50);
		c.lineTo(35, 0);
		c.fill();
		circle(40, -50, 10);
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
	if(this.x + p.worldX > p.x && this.currentAction === "melee-attack") {
		c.rotate(-this.attackArm / 180 * Math.PI);
	}
	else {
		c.rotate(-40 / 180 * Math.PI);
	}
	if(this.x + p.worldX > p.x && this.currentAction === "melee-attack") {
		c.fillStyle = "rgb(139, 69, 19)";
		c.beginPath();
		c.moveTo(-45, 0);
		c.lineTo(-50, -50);
		c.lineTo(-30, -50);
		c.lineTo(-35, 0);
		c.fill();
		circle(-40, -50, 10);
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
	//attacking
	{
	this.attackArm += this.attackArmDir;
	this.attackArmDir = (this.attackArm > 80) ? -2 : this.attackArmDir;
	this.attackArmDir = (this.attackArm < 0) ? 2 : this.attackArmDir;
	}
};
Troll.prototype.update = function() {
	//movement
	this.x += this.velX;
	this.y += this.velY;
	if(this.currentAction === "move") {
		if(this.x + p.worldX < p.x) {
			this.x = (this.x + p.worldX < p.x - 100) ? this.x + 1 : this.x;
			this.x = (this.x + p.worldX > p.x - 100) ? this.x - 1 : this.x;
		}
		else {
			this.x = (this.x + p.worldX < p.x + 100) ? this.x + 1 : this.x;
			this.x = (this.x + p.worldX > p.x + 100) ? this.x - 1 : this.x;
		}
		this.timeDoingAction ++;
		if(this.timeDoingAction > 90) {
			if(Math.abs(this.x + p.worldX - p.x) > 150 && false) {
				this.currentAction = "ranged-attack";
			}
			else {
				this.currentAction = "melee-attack";
			}
			this.timeDoingAction = 0;
		}
	}
	else if(this.currentAction === "ranged-attack") {
		this.walking = false;
		if(this.x + p.worldX < p.x) {
			this.armAttacking = "left";
		}
	}
};

function Dragonling(x, y) {
	Enemy.call(this, x, y);
	this.destX = (p.x - p.worldX);
	this.destY = (p.y - p.worldY);
	this.velX = 0;
	this.velY = 0;
	this.pos = [];
	this.rot = 0;
	//stats
	this.damLow = 5 - 5;
	this.damHigh = 6 - 6;
	this.health = 15;
	this.maxHealth = 15;
	//hitbox
	this.leftX = -5;
	this.rightX = 5;
	this.topY = -5;
	this.bottomY = 20;
};
inheritsFrom(Dragonling, Enemy);
Dragonling.prototype.display = function() {
	c.fillStyle = "rgb(0, 255, 0)";
	c.beginPath();
	c.arc(this.x + p.worldX, this.y + p.worldY, 5, 0, 2 * Math.PI);
	c.fill();
	c.fillStyle = "rgb(255, 0, 0)";
	c.save();
	c.translate(this.x + p.worldX, this.y + p.worldY);
	c.rotate(this.rot / 180 * Math.PI);
	c.beginPath();
	c.arc(0, -10, 5, 0, 2 * Math.PI);
	c.fill();
	c.restore();
};
Dragonling.prototype.update = function() {
	//move according to rotation
	var theVel = getRotated(0, -10, this.rot);
	this.velX += theVel.x / 100;
	this.velY += theVel.y / 100;
	this.x += this.velX;
	this.y += this.velY;
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
	this.rot += (this.rot < idealAngle) ? 3 : -3;
	//update destination
	this.destX = p.x - p.worldX;
	this.destY = p.y - p.worldY;
};

//hax
if(hax) {
	// p.class = "mage";
	// p.reset();
	p.onScreen = "play";
	for(var i = 0; i < items.length; i ++) {
		//p.addItem(new items[i]());
	}
	p.addItem(new Spear());
	p.addItem(new Sword());
	p.addItem(new Mace());
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
var platHeight1 = 550;
var platHeight2 = 550;
var platHeight3 = 550;
var fading = "none";
var fadeOp = 0;
var fadeDest = "none";
var btn1 = 0;
var btn2 = 0;
var btn3 = 0;
function fancyText(x, y, txt) {
	c.strokeStyle = "rgb(255, 255, 255)";
	c.lineWidth = 1;
	if(txt === "play") {
		c.save();
		c.beginPath();
		c.translate(x - 47.5, y);
		c.moveTo(10, 0);
		c.lineTo(5, 0);
		c.lineTo(5, -20);
		c.lineTo(0, -20);
		c.stroke();
		c.beginPath();
		c.moveTo(5, -20);
		c.lineTo(20, -15);
		c.lineTo(5, -10);
		c.stroke();
		c.restore();

		c.save();
		c.translate(x - 22.5, y);
		c.beginPath();
		c.moveTo(0, -20);
		c.lineTo(5, -20);
		c.lineTo(5, 0);
		c.lineTo(0, 0);
		c.lineTo(20, 0);
		c.lineTo(20, -5);
		c.stroke();
		c.restore();

		c.save();
		c.translate(x + 2.5, y);
		c.beginPath();
		c.moveTo(0, 0);
		c.lineTo(10, -20);
		c.lineTo(20, 0);
		c.stroke();
		c.restore();

		c.save();
		c.translate(x + 27.5, y);
		c.beginPath();
		c.moveTo(5, 0);
		c.lineTo(15, 0);
		c.stroke();
		c.beginPath();
		c.moveTo(10, 0);
		c.lineTo(10, -10);
		c.lineTo(0, -20);
		c.stroke();
		c.beginPath();
		c.moveTo(10, -10);
		c.lineTo(20, -20);
		c.stroke();
		c.restore();
	}
	else if(txt === "how") {
		c.save();
		c.translate(x - 35, y);
		c.beginPath();
		c.moveTo(0, 0);
		c.lineTo(5, 0);
		c.moveTo(2.5, 0);
		c.lineTo(2.5, -20);
		c.moveTo(0, -20);
		c.lineTo(5, -20);
		c.moveTo(2.5, -12.5);
		c.lineTo(17.5, -7.5);
		c.moveTo(15, 0);
		c.lineTo(20, 0);
		c.moveTo(17.5, 0);
		c.lineTo(17.5, -20);
		c.moveTo(15, -20);
		c.lineTo(20, -20);
		c.stroke();
		c.restore();

		c.save();
		c.translate(x - 10, y);
		c.beginPath();
		c.moveTo(0, -10);
		c.lineTo(10, -20);
		c.lineTo(20, -10);
		c.lineTo(10, 0);
		c.lineTo(0, -10);
		c.stroke();
		c.restore();

		c.save();
		c.translate(x + 15, y);
		c.beginPath();
		c.moveTo(5, -20);
		c.lineTo(0, -20);
		c.lineTo(5, 0);
		c.lineTo(10, -10);
		c.lineTo(15, 0);
		c.lineTo(20, -20);
		c.lineTo(15, -20);
		c.stroke();
		c.restore();
	}
	else if(txt === "scores") {
		c.save();//675, 495
		c.translate(x - 72.5, y);
		c.beginPath();
		c.moveTo(0, 0);
		c.lineTo(20, -6);
		c.lineTo(0, -14);
		c.lineTo(20, -20);
		c.stroke();
		c.restore();

		c.save();
		c.translate(x - 47.5, y);
		c.moveTo(0, 0);
		c.lineTo(20, 0);
		c.lineTo(20, -5);
		c.moveTo(5, 0);
		c.lineTo(5, -20);
		c.moveTo(0, -20);
		c.lineTo(20, -20);
		c.lineTo(20, -15);
		c.stroke();
		c.restore();

		c.save();
		c.translate(x - 22.5, y);
		c.beginPath();
		c.moveTo(0, -10);
		c.lineTo(10, -20);
		c.lineTo(20, -10);
		c.lineTo(10, 0);
		c.lineTo(0, -10);
		c.stroke();
		c.restore();

		c.save();
		c.translate(x + 2.5, y);
		c.beginPath();
		c.moveTo(10, 0);
		c.lineTo(5, 0);
		c.lineTo(5, -20);
		c.lineTo(0, -20);
		c.stroke();
		c.beginPath();
		c.moveTo(5, -20);
		c.lineTo(20, -15);
		c.lineTo(5, -10);
		c.lineTo(20, 0);
		c.stroke();
		c.restore();

		c.save();
		c.translate(x + 27.5, y);
		c.beginPath();
		c.moveTo(0, 0);
		c.lineTo(20, 0);
		c.lineTo(20, -5);
		c.moveTo(5, 0);
		c.lineTo(5, -20);
		c.moveTo(0, -20);
		c.lineTo(20, -20);
		c.lineTo(20, -15);
		c.moveTo(5, -10);
		c.lineTo(20, -10);
		c.stroke();
		c.restore();

		c.save();
		c.translate(x + 52.5, y);
		c.beginPath();
		c.moveTo(0, 0);
		c.lineTo(20, -6);
		c.lineTo(0, -14);
		c.lineTo(20, -20);
		c.stroke();
		c.restore();
	}
	else if(txt === "home") {
		// c.fillStyle = "rgb(255, 0, 0)";
		// c.fillRect(x - 22.5, y, 20, 5);
		// c.fillRect(x + 2.5, y, 20, 5);
		// c.fillRect(x - 47.5, y, 20, 5);
		// c.fillRect(x + 27.5, y, 20, 5);

		c.save();
		c.translate(x - 47.5, y);
		c.beginPath();
		c.moveTo(0, 0);
		c.lineTo(5, 0);
		c.moveTo(2.5, 0);
		c.lineTo(2.5, -20);
		c.moveTo(0, -20);
		c.lineTo(5, -20);
		c.moveTo(2.5, -10);
		c.lineTo(17.5, -10);
		c.moveTo(17.5, -20);
		c.lineTo(17.5, 0);
		c.moveTo(15, -20);
		c.lineTo(20, -20);
		c.moveTo(15, 0);
		c.lineTo(20, 0);
		c.stroke();
		c.restore();

		c.save();
		c.translate(x - 22.5, y);
		c.beginPath();
		c.moveTo(0, -10);
		c.lineTo(10, -20);
		c.lineTo(20, -10);
		c.lineTo(10, 0);
		c.lineTo(0, -10);
		c.stroke();
		c.restore();

		c.save();
		c.translate(x + 2.5, y);
		c.beginPath();
		c.moveTo(5, 0);
		c.lineTo(0, 0);
		c.lineTo(5, -20);
		c.lineTo(10, -10);
		c.lineTo(15, -20);
		c.lineTo(20, 0);
		c.lineTo(15, 0);
		c.stroke();
		c.restore();

		c.save();
		c.translate(x + 27.5, y);
		c.beginPath();
		c.moveTo(0, 0);
		c.lineTo(20, 0);
		c.lineTo(20, -5);
		c.moveTo(5, 0);
		c.lineTo(5, -20);
		c.moveTo(0, -20);
		c.lineTo(20, -20);
		c.lineTo(20, -15);
		c.moveTo(5, -10);
		c.lineTo(20, -10);
		c.stroke();
		c.restore();
	}
	else if(txt === "retry") {

		c.save();
		c.translate(x - 60, y);
		c.beginPath();
		c.moveTo(10, 0);
		c.lineTo(5, 0);
		c.lineTo(5, -20);
		c.lineTo(0, -20);
		c.stroke();
		c.beginPath();
		c.moveTo(5, -20);
		c.lineTo(20, -15);
		c.lineTo(5, -10);
		c.lineTo(20, 0);
		c.stroke();
		c.restore();

		c.save();
		c.translate(x - 35, y);
		c.beginPath();
		c.moveTo(0, 0);
		c.lineTo(20, 0);
		c.lineTo(20, -5);
		c.moveTo(5, 0);
		c.lineTo(5, -20);
		c.moveTo(0, -20);
		c.lineTo(20, -20);
		c.lineTo(20, -15);
		c.moveTo(5, -10);
		c.lineTo(20, -10);
		c.stroke();
		c.restore();

		c.save();
		c.translate(x - 10, y);
		c.beginPath();
		c.moveTo(7.5, 0);
		c.lineTo(12.5, 0);
		c.moveTo(10, 0);
		c.lineTo(10, -17.5);
		c.moveTo(0, -17.5);
		c.lineTo(20, -17.5);
		c.moveTo(20, -20);
		c.lineTo(20, -15);
		c.moveTo(0, -20);
		c.lineTo(0, -15);
		c.stroke();
		c.restore();

		c.save();
		c.translate(x + 15, y);
		c.beginPath();
		c.moveTo(10, 0);
		c.lineTo(5, 0);
		c.lineTo(5, -20);
		c.lineTo(0, -20);
		c.stroke();
		c.beginPath();
		c.moveTo(5, -20);
		c.lineTo(20, -15);
		c.lineTo(5, -10);
		c.lineTo(20, 0);
		c.stroke();
		c.restore();

		c.save();
		c.translate(x + 40, y);
		c.beginPath();
		c.moveTo(7.5, 0);
		c.lineTo(12.5, 0);
		c.moveTo(10, 0);
		c.lineTo(10, -10);
		c.lineTo(20, -20);
		c.moveTo(10, -10);
		c.lineTo(0, -20);
		c.moveTo(0, -15);
		c.lineTo(0, -20);
		c.lineTo(5, -20);
		c.moveTo(20, -15);
		c.lineTo(20, -20);
		c.lineTo(15, -20);
		c.stroke();
		c.restore();

		// c.fillStyle = "rgb(255, 0, 0)";
		// c.fillRect(x - 10, y - 5, 20, 5);
		// c.fillRect(x - 35, y - 5, 20, 5);
		// c.fillRect(x + 15, y - 5, 20, 5);
		// c.fillRect(x - 60, y - 5, 20, 5);
		// c.fillRect(x + 40, y - 5, 20, 5);
	}
};
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
		if(roomInstances[inRoom].background === "bricks") {
			var transX = (p.worldX * 0.9) % 100;
			var transY = (p.worldY * 0.9) % 100;
			c.save();
			c.translate(transX, transY);
			c.strokeStyle = "rgb(110, 110, 110)";
			c.lineWidth = 4;
			for(var y = -100; y < 800; y += 50) {
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
		p.update();

		for(var i = 0; i < roomInstances.length; i ++) {
			if(roomInstances[i].id === "?") {
				roomInstances[i].id = numRooms;
				numRooms ++;
			}
			if(inRoom === roomInstances[i].id) {
				theRoom = i;
				roomInstances[i].exist(i);
			}
			if(roomInstances[i].hasEnemy) {
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

		//load enemies in other rooms
		var unseenEnemy = false;
		for(var i = 0; i < roomInstances.length; i ++) {
			for(var j = 0; j < roomInstances[i].content.length; j ++) {
				if(roomInstances[i].content[j] instanceof Enemy && i !== inRoom) {
					unseenEnemy = true;
					break;
				}
			}
		}
		if(unseenEnemy) {
			for(var i = 0; i < roomInstances.length; i ++) {
				theRoom = i;
				enemyLoop: for(var j = 0; j < roomInstances[i].content.length; j ++) {
					if(roomInstances[i].content[j] instanceof Enemy) { // roomInstances[i].content[j] is the enemy
						var doorLoc = null;
						doorLoop: for(var k = 0; k < roomInstances[i].content.length; k ++) { // roomInstances[i].content[k] is the door
							if(typeof roomInstances[i].content[k].dest !== "object" && !roomInstances[i].content[k].barricaded) {
								if(roomInstances[i].content[k] instanceof Door && roomInstances[roomInstances[i].content[k].dest].pathScore < roomInstances[i].pathScore) {
									doorLoc = {x: roomInstances[i].content[k].x, y: roomInstances[i].content[k].y};
									break doorLoop;
								}
							}
						}
						if(doorLoc === null) {
							continue enemyLoop;
						}
						doorLoop: for(var k = 0; k < roomInstances[i].content.length; k ++) {
							if(roomInstances[i].content[k] instanceof Door && typeof roomInstances[i].content[k].dest !== "object") {
								var door = roomInstances[i].content[k];
								var enemy = roomInstances[i].content[j];
								if(enemy.x + enemy.rightX > door.x - 30 && enemy.x + enemy.leftX < door.x + 30 && enemy.y + enemy.bottomY > door.y - 60 && enemy.y + enemy.topY < door.y + 3) {
									roomInstances[door.dest].content.push(new enemy.constructor());
									var newIndex = roomInstances[door.dest].content.length - 1;
									var exitDoorIndex = null;
									for(var l = 0; l < roomInstances[door.dest].content.length; l ++) {
										if(roomInstances[door.dest].content[l] instanceof Door && roomInstances[door.dest].content[l].dest === i) {
											exitDoorIndex = l;
											break;
										}
									}
									roomInstances[door.dest].content[newIndex].x = roomInstances[door.dest].content[exitDoorIndex].x;
									roomInstances[door.dest].content[newIndex].y = roomInstances[door.dest].content[exitDoorIndex].y - roomInstances[door.dest].content[newIndex].bottomY;
									roomInstances[door.dest].content[newIndex].opacity = 0;
									roomInstances[door.dest].content[newIndex].fadingIn = true;
									roomInstances[door.dest].content[newIndex].seesPlayer = true;
									roomInstances[i].content.splice(j, 1);
									continue enemyLoop;
								}
							}
						}
						roomInstances[i].content[j].update(doorLoc);
						// roomInstances[i].content[j].display();
					}
					else if(roomInstances[i].content[j] instanceof Block || roomInstances[i].content[j] instanceof Platform || roomInstances[i].content[j] instanceof Stairs || roomInstances[i].content[j] instanceof Pulley) {
						// roomInstances[i].content[j].x -= p.worldX;
						// roomInstances[i].content[j].y -= p.worldY;
						if(roomInstances[i].content[j] instanceof Block || roomInstances[i].content[j] instanceof Platform) {
							roomInstances[i].content[j].update();
							// roomInstances[i].content[j].display();
						}
						else if(roomInstances[i].content[j] instanceof Stairs) {
							roomInstances[i].content[j].exist(false);
						}
						// roomInstances[i].content[j].x += p.worldX;
						// roomInstances[i].content[j].y += p.worldY;
					}
				}
			}
		}
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
		fancyText(125, 495, "how");
		c.fillStyle = "rgb(20, 20, 20)";
		//middle door
		c.fillRect(320, 380, 160, 200);
		c.beginPath();
		c.arc(400, 380, 80, 0, 2 * Math.PI);
		c.fill();
		//middle door text
		fancyText(400, 455, "play");
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
		c.fillRect(590, 420, 170, 160);
		c.beginPath();
		c.arc(675, 420, 85, 0, 2 * Math.PI);
		c.fill();
		//right door text
		fancyText(675, 495, "scores");
		loadBoxFronts();
		if(Math.dist(mouseX, mouseY, 400, 380) <= 80 || (mouseX > 320 && mouseX < 480 && mouseY > 380 && mouseY < 580)) {
			cursorHand = true;
			if(btn1 < 50) {
				btn1 += 5;
			}
			if(mouseIsPressed) {
				fading = "out";
				fadeDest = "class-select";
			}
		}
		else if(btn1 > 0) {
			btn1 -= 5;
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
			platHeight1 -= Math.dist(platHeight1, 0, 500, 0) / 30;
			if(mouseIsPressed && !pMouseIsPressed) {
				p.class = "warrior";
				fading = "out";
				fadeDest = "play";
				p.reset();
			}
		}
		else {
			platHeight1 += Math.dist(platHeight1, 0, 550, 0) / 30;
		}
		if(mouseX > 300 && mouseX < 500) {
			platHeight2 -= Math.dist(platHeight2, 0, 500, 0) /30;
			if(mouseIsPressed && !pMouseIsPressed) {
				p.class = "archer";
				fading = "out";
				fadeDest = "play";
				p.reset();
			}
		}
		else {
			platHeight2 += Math.dist(platHeight2, 0, 550, 0) / 30;
		}
		if(mouseX > 500) {
			platHeight3 -= Math.dist(platHeight3, 0, 500, 0) / 30;
			if(mouseIsPressed && !pMouseIsPressed) {
				p.class = "mage";
				fading = "out";
				fadeDest = "play";
				p.reset();
			}
		}
		else {
			platHeight3 += Math.dist(platHeight3, 0, 550, 0) / 30;
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
		fancyText(175, 620, "home");
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
		fancyText(625, 620, "retry");
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
			if(btn2 < 62) {
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
		canvas.style.cursor = "pointer";
	}
	else {
		canvas.style.cursor = "auto";
	}
	if(!frozen) {
		window.setTimeout(doByTime, 1000 / fps);
	}
};
window.setTimeout(doByTime, 1000 / fps);
