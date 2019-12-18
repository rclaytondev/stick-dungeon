/* IO + constants */
var canvas = document.getElementById("theCanvas");
var c = canvas.getContext("2d");

const FPS = 60;
const FLOOR_WIDTH = 0.1;
const TESTING_MODE = false;
const SHOW_HITBOXES = false;

/* utilities */
CanvasRenderingContext2D.prototype.line = function() {
	/*
	Can be used to draw a line or a series of lines.

	Possible parameters:
	 - Numbers (alternating x and y values)
	 - Objects with x and y properties for each point
	 - Array of objects with x and y properties
	*/
	if(Array.isArray(arguments[0])) {
		/* assume the input is an array of objects */
		this.polygon.apply(this, arguments[0]);
	}
	else if(typeof arguments[0] === "object") {
		/* assume each of the arguments is an object */
		this.moveTo(arguments[0].x, arguments[0].y);
		for(var i = 0; i < arguments.length; i ++) {
			this.lineTo(arguments[i].x, arguments[i].y);
		}
	}
	else if(typeof arguments[0] === "number") {
		/* assume all inputs are numbers */
		this.moveTo(arguments[0], arguments[1]);
		for(var i = 2; i < arguments.length; i += 2) {
			this.lineTo(arguments[i], arguments[i + 1]);
		}
	}
};
CanvasRenderingContext2D.prototype.strokeLine = function() {
	/*
	Can be used to stroke a line or a series of lines. Similar to polygon() but it doesn't automatically close the path (and it outlines the path).
	*/
	this.beginPath();
	this.line.apply(this, arguments);
	this.stroke();
};
CanvasRenderingContext2D.prototype.polygon = function() {
	/* draw lines connecting all vertices + close path to form polygon */
	this.line.apply(this, arguments);
	this.closePath();
};
CanvasRenderingContext2D.prototype.fillPoly = function() {
	/*
	Arguments can be objects with 'x' and 'y' properties or numbers with each argument being either the x or the y, starting with x.
	*/
	this.beginPath();
	this.polygon.apply(this, arguments);
	this.fill();
};
CanvasRenderingContext2D.prototype.strokePoly = function() {
	this.beginPath();
	this.polygon.apply(this, arguments);
	this.stroke();
};
CanvasRenderingContext2D.prototype.fillCircle = function(x, y, r) {
	this.beginPath();
	this.arc(x, y, r, 0, 2 * Math.PI);
	this.fill();
};
CanvasRenderingContext2D.prototype.strokeCircle = function(x, y, r) {
	this.beginPath();
	this.arc(x, y, r, 0, 2 * Math.PI);
	this.stroke();
};
CanvasRenderingContext2D.prototype.circle = function(x, y, r) {
	this.arc(x, y, r, 0, 2 * Math.PI);
};
CanvasRenderingContext2D.prototype.fillArc = function(x, y, r, start, end, antiClockwise) {
	/*
	Unlike strokeArc(), this function draws an arc like a pie shape instead of an arc outline.
	*/
	this.beginPath();
	this.moveTo(x, y);
	this.arc(x, y, r, start, end, antiClockwise);
	this.closePath();
	this.fill();
};
CanvasRenderingContext2D.prototype.strokeArc = function(x, y, r, start, end, antiClockwise) {
	this.beginPath();
	this.arc(x, y, r, start, end, antiClockwise);
	this.stroke();
};
CanvasRenderingContext2D.prototype.invertPath = function() {
	/*
	Inverts the canvas path. Drawing a line on each of the canvas boundaries will, for any point on the canvas, increase the number of lines crossed by 1. When using the "evenodd" fill rule, this will toggle whether the point is in the path or not.

	Calling this multiple times on the same path does not work for some reason.

	The evenodd fillrule MUST be used in order for this function to work as intended.
	*/
	this.moveTo(-8000, -8000);
	this.lineTo(8000, 0);
	this.lineTo(8000, 8000);
	this.lineTo(-8000, 8000);
	this.lineTo(-8000, -8000);
};
CanvasRenderingContext2D.prototype.fillCanvas = function() {
	/*
	Fills the entire canvas with the current fillStyle.
	*/
	this.save();
	this.resetTransform();
	this.fillRect(0, 0, this.canvas.width, this.canvas.height);
	this.restore();
};
CanvasRenderingContext2D.prototype.resetTransform = function() {
	this.setTransform(1, 0, 0, 1, 0, 0);
};
CanvasRenderingContext2D.prototype.displayTextOverLines = function(text, x, y, maxWidth, lineSpacing) {
	var test = c.globalAlpha;
	lineSpacing = lineSpacing || 15;
	var lines = [text];
	for(var i = 0; i < lines.length; i ++) {
		var width = c.measureText(lines[i]).width;
		while(width > maxWidth) {
			var foundNonWhitespace = false;
			for(var j = lines[i].length - 2; j > 0; j --) {
				if(lines[i].substring(j, j + 1) === " " && foundNonWhitespace) {
					var removedWord = lines[i].substring(j, Infinity);
					lines[i] = lines[i].substring(0, j);
					if(lines[i + 1] === undefined) {
						/* add the removed word on a new line */
						lines.push(removedWord);
					}
					else {
						/* add the removed word to the beginning of the next line */
						lines[i + 1] = removedWord + lines[i + 1];
					}
					foundNonWhitespace = false;
					break;
				}
				if(lines[i].substring(j, j + 1) !== " ") {
					foundNonWhitespace = true;
				}
			}
			width = c.measureText(lines[i]).width;
		}
	}
	for(var i = 0; i < lines.length; i ++) {
		lines[i] = lines[i].trim();
		this.fillText(lines[i], x, y + (i * lineSpacing));
		if(i === lines.length - 1) {
			return y + (i * lineSpacing);
		}
	}
};
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
Math.constrain = function(num, min, max) {
	num = Math.min(num, max);
	num = Math.max(num, min);
	return num;
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
Math.scale = function(x, y, factor, scaleX, scaleY) {
	/*
	Returns ('x', 'y') scaled by 'factor', optionally about ('scaleX', 'scaleY').
	*/
	scaleX = scaleX || 0;
	scaleY = scaleY || 0;
	x -= scaleX;
	y -= scaleY;
	x *= factor;
	y *= factor;
	x += scaleX;
	y += scaleY;
	return {
		x: x,
		y: y
	};
};
Math.findPointsCircular = function(x, y, r, quadrants) {
	/*
	Returns an array containing all points (nearest integer) on a circle at ('x', 'y') with radius r in clockwise order.
	To get arcs / half-circles, pass numbers to the optional 'quadrants' array parameter. (1 = top-right, 2=bottom-right, 3=bottom-left, 4=top-left)
	*/
	quadrants = quadrants || [1, 2, 3, 4];

	var circularPoints = [];
	function calculateQuadrant1() {
		/* top right quadrant */
		for(var X = x; X < x + r; X ++) {
			for(var Y = y - r; Y < y; Y ++) {
				if(Math.floor(Math.dist(x, y, X, Y)) === r - 1) {
					circularPoints.push({x: X, y: Y});
				}
			}
		}
	};
	function calculateQuadrant2() {
		/* bottom right quadrant */
		for(var X = x + r; X > x; X --) {
			for(var Y = y; Y < y + r; Y ++) {
				if(Math.floor(Math.dist(x, y, X, Y)) === r - 1) {
					circularPoints.push({x: X, y: Y});
				}
			}
		}
	};
	function calculateQuadrant3() {
		/* bottom left quadrant */
		for(var X = x; X > x - r; X --) {
			for(var Y = y + r; Y > y; Y --) {
				if(Math.floor(Math.dist(x, y, X, Y)) === r - 1) {
					circularPoints.push({x: X, y: Y});
				}
			}
		}
	};
	function calculateQuadrant4() {
		/* top left quadrant */
		for(var X = x - r; X < x; X ++) {
			for(var Y = y; Y > y - r; Y --) {
				if(Math.floor(Math.dist(x, y, X, Y)) === r - 1) {
					circularPoints.push({x: X, y: Y});
				}
			}
		}
	};
	for(var i = 0; i < Math.min(quadrants.length, 4); i ++) {
		switch(quadrants[i]) {
			case 1:
				calculateQuadrant1();
				break;
			case 2:
				calculateQuadrant2();
				break;
			case 3:
				calculateQuadrant3();
				break;
			case 4:
				calculateQuadrant4();
				break;
		}
	}
	return circularPoints;
};
Math.findPointsLinear = function(x1, y1, x2, y2) {
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
Math.calculateDegrees = function(x, y) {
	/*
	Returns the corrected arctangent of ('x', 'y').
	*/
	return Math.atan2(y, x) * 180 / Math.PI;
};
Number.prototype.mod = function(divisor) {
	/*
	This is used instead of the % operator because % returns negatives for negative numbers. (ex: -5 % 10 === -5)

	This is on the number prototype instead of Math since it seems more like an arithmetic operation than the Math functions.
	*/

	return ((this % divisor) + divisor) % divisor;
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
Array.prototype.containsInstanceOf = function(constructor) {
	for(var i = 0; i < this.length; i ++) {
		if(this[i] instanceof constructor) {
			return true;
		}
	}
	return false;
};
Object.prototype.clone = function() {
	var clone = new this.constructor();
	for(var i in this) {
		if(this.hasOwnProperty(i)) {
			if(typeof this[i] === "object" && this[i] !== null) {
				clone[i] = this[i].clone();
			}
			else {
				clone[i] = this[i];
			}
		}
	}
	return clone;
};
Function.prototype.extends = function(superclass) {
	/* copy prototype to inherit methods */
	window[this.name].prototype = Object.create(superclass.prototype);
	window[this.name].prototype.constructor = window[this.name];
};

/* player */
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
	this.dead = false;
	this.power = 0;
	this.scores = [
		{ coins: 15, rooms: 150, kills: 7, class: "mage"},
		{ coins: 6, rooms: 5, kills: 1, class: "archer"},
		{ coins: 20, rooms: 1000, kills: 60, class: "warrior"}
	]; // example scores for testing
	this.scores = [];
	/* initialization of other properties */
	this.init();
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
	if(this.y > 400 && (this.worldY > game.dungeon[game.inRoom].minWorldY || game.dungeon[game.inRoom].minWorldY === undefined)) {
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
	c.save(); {
		c.translate(this.x, this.y);
		c.scale(1, 1.2);
		c.fillCircle(0, 12, 10);
	} c.restore();
	/* Body */
	c.strokeStyle = "rgb(0, 0, 0)";
	c.strokeLine(this.x, this.y + 12, this.x, this.y + 36);
	/* Legs */
	c.strokeLine(this.x, this.y + 36, this.x - this.legs, this.y + 46);
	c.strokeLine(this.x, this.y + 36, this.x + this.legs, this.y + 46);
	/* Leg Animations */
	if(io.keys[37] || io.keys[39]) {
		this.legs += this.legDir;
		if(this.legs >= 5) {
			this.legDir = -0.5;
		}
		else if(this.legs <= -5) {
			this.legDir = 0.5;
		}
	}
	if(!io.keys[37] && !io.keys[39]) {
		this.legDir = (this.legs < 0) ? -0.5 : 0.5;
		this.legDir = (this.legs >= 5 || this.legs <= -5) ? 0 : this.legDir;
		this.legs += this.legDir;
	}
	/* Standard Arms (no item held) */
	if(((!this.attacking && !this.aiming) || this.facing === "left") && !(this.attackingWith instanceof Spear && this.attacking)) {
		c.strokeLine(
			this.x,
			this.y + 26,
			this.x + (straightArm ? 15 : 10),
			this.y + (straightArm ? 16 : 36)
		);
	}
	if(((!this.attacking && !this.aiming) || this.facing === "right") && !(this.attackingWith instanceof Spear && this.attacking)) {
		c.strokeLine(this.x, this.y + 26, this.x - 10, this.y + 36);
	}
	/* Attacking Arms (holding a standard weapon like sword, dagger) */
	if(this.attacking && this.facing === "left" && !(this.attackingWith instanceof Spear) && !(this.attackingWith instanceof Mace)) {
		c.save(); {
			c.translate(this.x, this.y + 26);
			c.rotate(Math.rad(-this.attackArm));
			c.strokeLine(0, 0, -10, 0)/
			c.translate(-10, 2);
			this.attackingWith.display("attacking");
		} c.restore();
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
		c.save(); {
			c.translate(this.x, this.y + 26);
			c.rotate(Math.rad(this.attackArm));
			c.strokeLine(0, 0, 10, 0);
			c.translate(10, 2);
			this.attackingWith.display("attacking");
		} c.restore();
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
		c.save(); {
			c.translate(this.x, this.y + 26);
			c.strokeLine(0, 0, -10, 10);
		} c.restore();

		c.save(); {
			c.translate(this.x + this.attackArm, this.y + 31);
			c.rotate(Math.rad(-90));
			this.attackingWith.display("attacking");
		} c.restore();

		c.lineJoin = "round";
		c.save(); {
			c.translate(this.x, this.y + 26);
			c.strokeLine(-10, 10, this.attackArm, 5);
			c.strokePoly(
				{ x: 0, y: 0 },
				{ x: 10, y: -5 },
				{ x: this.attackArm + 15, y: 5 }
			);
		} c.restore();
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
		c.save(); {
			c.translate(this.x, this.y + 26);
			c.strokeLine(0, 0, 10, 10);
		} c.restore();

		c.save(); {
			c.translate(this.x + this.attackArm, this.y + 31);
			c.rotate(Math.rad(90));
			this.attackingWith.display("attacking");
		} c.restore();

		c.lineJoin = "round";
		c.save(); {
			c.translate(this.x, this.y + 26);
			c.strokeLine(10, 10, this.attackArm, 5);
			c.strokeLine(
				{ x: 0, y: 0 },
				{ x: -10, y: -5 },
				{ x: this.attackArm - 15, y: 5 }
			);
		} c.restore();
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
		c.save(); {
			c.translate(this.x, this.y + 26);
			c.rotate(Math.rad(this.attackArm));
			c.strokeLine(0, 0, 10, 10);
			c.fillStyle = "rgb(60, 60, 60)";

			c.save(); {
				c.translate(10, 10);
				c.rotate(Math.rad(45));
				c.fillRect(-2, -15, 4, 15);
			} c.restore();
		} c.restore();
	}
	/* Arm Movement */
	this.attackArm += this.attackArmDir;
	if(!this.attacking) {
		this.attackArm = null;
	}
	/* Arms when aiming a Ranged Weapon */
	if(this.aiming && this.facing === "right") {
		if(this.attackingWith instanceof RangedWeapon) {
			c.save(); {
				c.translate(this.x, this.y + 26);
				c.rotate(Math.rad(this.aimRot));
				c.strokeLine(0, 0, 10, 0);
				c.translate(10, 0);
				this.attackingWith.display("aiming");
			} c.restore();
		}
		else {
			c.save(); {
				c.strokeLine(this.x, this.y + 26, this.x + 13, this.y + 26);
				c.translate(this.x + 14, this.y + 16);
				this.attackingWith.display("attacking");
			} c.restore();
			for(var i = 0; i < game.dungeon[game.inRoom].content.length; i ++) {
				if(game.dungeon[game.inRoom].content[i] instanceof MagicCharge && game.dungeon[game.inRoom].content[i].beingAimed) {
					game.dungeon[game.inRoom].content[i].x = this.x + this.chargeLoc.x - this.worldX;
					game.dungeon[game.inRoom].content[i].y = this.y + this.chargeLoc.y - this.worldY;
					break;
				}
			}
		}
	}
	if(this.aiming && this.facing === "left") {
		if(this.attackingWith instanceof RangedWeapon) {
			c.save(); {
				c.translate(this.x, this.y + 26);
				c.rotate(this.aimRot / -180 * Math.PI);
				c.strokeLine(0, 0, -10, 0);
				c.translate(-10, 0);
				c.scale(-1, 1);
				this.attackingWith.display("aiming");
			} c.restore();
		}
		else {
			c.save(); {
				c.strokeLine(this.x, this.y + 26, this.x - 13, this.y + 26);
				c.translate(this.x, this.y + 16);
				c.scale(-1, 1); //mirror the item graphic
				c.translate(14, 0);
				this.attackingWith.display("attacking");
			} c.restore();
			for(var i = 0; i < game.dungeon[game.inRoom].content.length; i ++) {
				if(game.dungeon[game.inRoom].content[i] instanceof MagicCharge && game.dungeon[game.inRoom].content[i].beingAimed) {
					game.dungeon[game.inRoom].content[i].x = this.x + this.chargeLoc.x - this.worldX;
					game.dungeon[game.inRoom].content[i].y = this.y + this.chargeLoc.y - this.worldY;
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
		/* gold bar */
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
	c.fillCircle(x, y + 12, 12);
	c.fillCircle(x + 225, y + 12, 12);
	/* Health Bar (colored part) */
	c.fillStyle = col;
	c.fillRect(x, y, percentFull * 225, 25);
	/* Rounded Corners (colored part) */
	c.fillCircle(x, y + 12, 12);
	c.fillCircle(x + (percentFull * 225), y + 12, 12);
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
	io.keys = this.enteringDoor ? [] : io.keys;
	/* Change selected slots when number keys are pressed */
	if(this.guiOpen !== "crystal-infusion" && !this.attacking) {
		if(io.keys[49]) {
			this.activeSlot = 0;
		}
		else if(io.keys[50]) {
			this.activeSlot = 1;
		}
		else if(io.keys[51]) {
		this.activeSlot = 2;
	}
	}
	/* Movement + Jumping */
	if(this.guiOpen === "none") {
		if(io.keys[37]) {
			this.velX -= 0.1;
		}
		else if(io.keys[39]) {
			this.velX += 0.1;
		}
	}
	this.x += this.velX;
	this.y += this.velY;
	if(io.keys[38] && this.canJump && !this.aiming) {
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
	if(!io.keys[37] && !io.keys[39]) {
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
		game.inRoom = game.numRooms;
		this.worldX = 0;
		this.worldY = 0;
		this.x = 500;
		this.y = -100;
		this.velY = 2;
		this.fallDmg = Math.round(Math.random() * 10 + 40);
		game.dungeon.push(
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
	if(this.numHeals > 0 && utilities.frameCount % Math.floor(18 * this.healthRegen) === 0) {
		this.health ++;
		this.numHeals -= 0.1 * this.healthRegen;
	}
	this.manaRegen = 1;
	for(var i = 0; i < this.invSlots.length; i ++) {
		if(this.invSlots[i].type === "equip" && this.invSlots[i].content instanceof WizardHat) {
			this.manaRegen -= (this.invSlots[i].content.manaRegen * 0.01);
		}
	}
	if(utilities.frameCount % Math.floor(18 * this.manaRegen) === 0 && this.mana < this.maxMana) {
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
		if(this.op <= 0 && game.transitions.dir !== "out") {
			game.transitions.dir = "fade-out";
			game.transitions.nextScreen = "dead";
			this.scores.push({
				coins: this.gold,
				rooms: this.roomsExplored,
				kills: this.enemiesKilled,
				class: this.class
			});
			this.saveScores();
		}
	}
	if(this.health < 0) {
		this.health = 0;
	}
	this.damOp -= 0.05;
};
Player.prototype.useItem = function() {
	/* Update facing direction */
	this.facing = io.keys[39] ? "right" : this.facing;
	this.facing = io.keys[37] ? "left" : this.facing;
	for(var i = 0; i < game.dungeon[game.inRoom].content.length; i ++) {
		if(game.dungeon[game.inRoom].content[i] instanceof SpikeBall) {
			if(game.dungeon[game.inRoom].content[i].x + this.worldX > this.x) {
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
	if(io.keys[65] && this.invSlots[this.activeSlot].content !== "empty") {
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
						game.dungeon[game.inRoom].content.push(new MagicCharge(450 - this.worldX, 400 - this.worldY, 0, 0, this.attackingWith.chargeType, damage));
						game.dungeon[game.inRoom].content[game.dungeon[game.inRoom].content.length - 1].beingAimed = true;
					}
					else {
						game.dungeon[game.inRoom].content.push(new MagicCharge(350 - this.worldX, 400 - this.worldY, 0, 0, this.attackingWith.chargeType, damage));
						game.dungeon[game.inRoom].content[game.dungeon[game.inRoom].content.length - 1].beingAimed = true;
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
			for(var i = 0; i < game.dungeon[game.inRoom].content.length; i ++) {
				if(game.dungeon[game.inRoom].content[i] instanceof SpikeBall) {
					alreadyExists = true;
					break;
				}
			}
			if(!alreadyExists) {
				if(this.facing === "right") {
					game.dungeon[game.inRoom].content.push(new SpikeBall(this.x - this.worldX + 50, this.y - this.worldY, "right"));
				}
				else {

				}
			}
		}
		else if(this.invSlots[this.activeSlot].content instanceof Equipable) {
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
			/* calculate weapon tip position */
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
			if(SHOW_HITBOXES) {
				c.fillStyle = "rgb(0, 255, 0)";
				c.fillRect(weaponPos.x - 3, weaponPos.y - 3, 6, 6);
			}
			/* check enemies to see if weapon hits any */
			for(var i = 0; i < game.dungeon[game.inRoom].content.length; i ++) {
				if(game.dungeon[game.inRoom].content[i] instanceof Enemy) {
					var enemy = game.dungeon[game.inRoom].content[i];
					if(weaponPos.x > enemy.x + p.worldX + enemy.leftX && weaponPos.x < enemy.x + p.worldX + enemy.rightX && weaponPos.y > enemy.y + p.worldY + enemy.topY && weaponPos.y < enemy.y + p.worldY + enemy.bottomY && this.canHit) {
						/* hurt enemy that was hit by the weapon */
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
							game.dungeon[game.inRoom].content.push(new WindBurst(weaponPos.x - this.worldX, weaponPos.y - this.worldY, this.facing));
						}
						else if(this.attackingWith.element === "earth" && this.canUseEarth) {
							/* find lowest roof directly above weapon */
							var lowestIndex = null;
							for(var j = 0; j < game.dungeon[game.inRoom].content.length; j ++) {
								if(lowestIndex !== null) {
									if(game.dungeon[game.inRoom].content[j] instanceof Block && weaponPos.x - this.worldX > game.dungeon[game.inRoom].content[j].x && weaponPos.x - this.worldX < game.dungeon[game.inRoom].content[j].x + game.dungeon[game.inRoom].content[j].w &&game.dungeon[game.inRoom].content[j].y + game.dungeon[game.inRoom].content[j].h > game.dungeon[game.inRoom].content[lowestIndex].y + game.dungeon[game.inRoom].content[lowestIndex].h && game.dungeon[game.inRoom].content[j].y + game.dungeon[game.inRoom].content[j].h <= weaponPos.y - this.worldY) {
										lowestIndex = j;
									}
								}
								else if(lowestIndex === null && weaponPos.x - this.worldX > game.dungeon[game.inRoom].content[j].x && weaponPos.x - this.worldX < game.dungeon[game.inRoom].content[j].x + game.dungeon[game.inRoom].content[j].w && game.dungeon[game.inRoom].content[j].y <= weaponPos.y - this.worldY && game.dungeon[game.inRoom].content[j] instanceof Block) {
									lowestIndex = j;
								}
							}
							game.dungeon[game.inRoom].content.push(new BoulderVoid(weaponPos.x - this.worldX, game.dungeon[game.inRoom].content[lowestIndex].y + game.dungeon[game.inRoom].content[lowestIndex].h));
							game.dungeon[game.inRoom].content.push(new Boulder(weaponPos.x - this.worldX, game.dungeon[game.inRoom].content[lowestIndex].y + game.dungeon[game.inRoom].content[lowestIndex].h, Math.random() * 2 + 2));
						}
						/* reset variables for weapon swinging */
						this.canHit = false;
						this.attackArmDir = -this.attackArmDir;
						this.timeSinceAttack = 0;
					}
				}
			}
		}
		else if(this.attackingWith instanceof Mace) {
			for(var i = 0; i < game.dungeon[game.inRoom].content.length; i ++) {
				if(game.dungeon[game.inRoom].content[i] instanceof SpikeBall && Math.abs(game.dungeon[game.inRoom].content[i].velX) <= 1 && Math.abs(game.dungeon[game.inRoom].content[i].x + this.worldX - this.x) < 5) {
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
				for(var i = 0; i < game.dungeon[game.inRoom].content.length; i ++) {
					if(game.dungeon[game.inRoom].content[i] instanceof SpikeBall) {
						if(this.facing === "right") {
							game.dungeon[game.inRoom].content[i].velX = 3;
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
	if(this.aiming && io.keys[38] && this.aimRot > -45) {
		if((this.attackingWith instanceof RangedWeapon && this.class !== "archer") || (this.attackingWith instanceof MagicWeapon && this.class !== "mage")) {
			this.aimRot += 1.5; // slow down movement if you're not using the right class weapon
		}
		this.aimRot -= 2;
		if(this.attackingWith instanceof MagicWeapon) {
			this.aimRot -= 2;
			this.chargeLoc = Math.rotate((this.facing === "right") ? 50 : -50, 0, this.aimRot * ((this.facing === "right") ? 1 : -1));
		}
	}
	if(this.aiming && io.keys[40] && this.aimRot < 45) {
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
	if(!this.aiming && this.aimingBefore && this.shootReload < 0 && !(this.attackingWith instanceof MechBow) && ((this.invSlots[this.activeSlot].content instanceof RangedWeapon && !(this.invSlots[this.activeSlot].content instanceof Arrow)) || this.attackingWith instanceof MagicWeapon)) {
		if(this.attackingWith instanceof RangedWeapon && this.hasInInventory(Arrow)) {
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
				game.dungeon[game.inRoom].content.push(new ShotArrow(velocity.x, velocity.y, velX / speed, velY / speed, damage, "player", this.invSlots[this.activeSlot].content.element));
				if(this.attackingWith instanceof LongBow) {
					game.dungeon[game.inRoom].content[game.dungeon[game.inRoom].content.length - 1].origX = game.dungeon[game.inRoom].content[game.dungeon[game.inRoom].content.length - 1].x;
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
				game.dungeon[game.inRoom].content.push(new ShotArrow(velocity.x, velocity.y, velX / speed, velY / speed, damage, "player", this.invSlots[this.activeSlot].content.element));
				if(this.attackingWith instanceof LongBow) {
					game.dungeon[game.inRoom].content[game.dungeon[game.inRoom].content.length - 1].origX = game.dungeon[game.inRoom].content[game.dungeon[game.inRoom].content.length - 1].x;
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
		else {
			if(this.facing === "right") {
				for(var i = 0; i < game.dungeon[game.inRoom].content.length; i ++) {
					if(game.dungeon[game.inRoom].content[i] instanceof MagicCharge && game.dungeon[game.inRoom].content[i].beingAimed) {
						game.dungeon[game.inRoom].content[i].beingAimed = false;
						game.dungeon[game.inRoom].content[i].velX = this.chargeLoc.x / 10;
						game.dungeon[game.inRoom].content[i].velY = this.chargeLoc.y / 10;
					}
				}
			}
			else {
				for(var i = 0; i < game.dungeon[game.inRoom].content.length; i ++) {
					if(game.dungeon[game.inRoom].content[i] instanceof MagicCharge && game.dungeon[game.inRoom].content[i].beingAimed) {
						game.dungeon[game.inRoom].content[i].beingAimed = false;
						game.dungeon[game.inRoom].content[i].velX = this.chargeLoc.x / 10;
						game.dungeon[game.inRoom].content[i].velY = this.chargeLoc.y / 10;
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
	if(this.aiming && this.attackingWith instanceof MechBow && utilities.frameCount % 20 === 0 && this.hasInInventory(Arrow)) {
		this.shootReload = 60;
		if(this.facing === "right") {
			var velocity = Math.rotate(10, 0, this.aimRot);
			var velX = velocity.x;
			var velY = velocity.y;
			velocity.x += (this.x - this.worldX + 10);
			velocity.y += (this.y - this.worldY + 26);
			var damage = Math.round(Math.random() * (this.invSlots[this.activeSlot].content.damHigh - this.invSlots[this.activeSlot].content.damLow) + this.invSlots[this.activeSlot].content.damLow);
			var speed = (this.invSlots[this.activeSlot].content.range === "medium" || this.invSlots[this.activeSlot].content.range === "long") ? (this.invSlots[this.activeSlot].content.range === "medium" ? 2 : 1.75) : (this.invSlots[this.activeSlot].content.range === "very long" ? 1.25 : 1);
			game.dungeon[game.inRoom].content.push(new ShotArrow(velocity.x, velocity.y, velX / speed, velY / speed, damage, "player", this.invSlots[this.activeSlot].content.element));
		}
		else {
			var velocity = Math.rotate(-10, 0, -this.aimRot);
			var velX = velocity.x;
			var velY = velocity.y;
			velocity.x += (this.x - this.worldX + 10);
			velocity.y += (this.y - this.worldY + 26);
			var damage = Math.round(Math.random() * (this.invSlots[this.activeSlot].content.damHigh - this.invSlots[this.activeSlot].content.damLow) + this.invSlots[this.activeSlot].content.damLow);
			var speed = (this.invSlots[this.activeSlot].content.range === "medium" || this.invSlots[this.activeSlot].content.range === "long") ? (this.invSlots[this.activeSlot].content.range === "medium" ? 2 : 1.75) : (this.invSlots[this.activeSlot].content.range === "very long" ? 1.25 : 1);
			game.dungeon[game.inRoom].content.push(new ShotArrow(velocity.x, velocity.y, velX / speed, velY / speed, damage, "player", this.invSlots[this.activeSlot].content.element));
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
	if(io.keys[68] && !this.openingBefore) {
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
	if(io.keys[27]) {
		/* escape key to exit guis */
		this.guiOpen = "none";
	}
	/* Display GUIs */
	function selectionGraphic(invSlot) {
		/*
		Display 4 triangles on 'invSlot'
		*/
		c.fillStyle = "rgb(59, 67, 70)";
		c.save(); {
			c.translate(invSlot.x + 35, invSlot.y + 35);
			for(var i = 0; i < 4; i ++) {
				c.rotate(Math.rad(90));
				c.fillPoly(
					{ x: 0, y: -25 },
					{ x: -10, y: -35 },
					{ x: 10, y: -35 }
				);
			}
		} c.restore();
		return;
	};
	function display(invSlot) {
		/*
		Displays the item in the slot 'invSlot'.
		*/
		if(invSlot.content === "empty" || invSlot.content === undefined) {
			return;
		}
		c.save(); {
			c.translate(invSlot.x + 35, invSlot.y + 35);
			c.globalAlpha = invSlot.content.opacity;
			invSlot.content.display("holding");
		} c.restore();
		invSlot.content.opacity += 0.05;
		/* Weapon Particles */
		if(invSlot.content instanceof Weapon) {
			c.save(); {
				c.translate(invSlot.x - p.worldX, invSlot.y - p.worldY);
				invSlot.content.displayParticles();
			} c.restore();
		}
	};
	if(this.guiOpen === "inventory") {
		ui.infoBar.actions.d = "close inventory";
		/* Background */
		c.strokeStyle = "rgb(59, 67, 70)";
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
			if(io.mouse.x > this.invSlots[i].x && io.mouse.x < this.invSlots[i].x + 70 && io.mouse.y > this.invSlots[i].y && io.mouse.y < this.invSlots[i].y + 70 && this.invSlots[i].content !== "empty") {
				this.invSlots[i].content.desc = this.invSlots[i].content.getDesc();
				hoverIndex = i;
				if(this.invSlots[i].type === "holding") {
					ui.infoBar.actions.click = "unequip " + this.invSlots[i].content.name;
				}
				else if(this.invSlots[i].type === "equip") {
					ui.infoBar.actions.click = "take off " + this.invSlots[i].content.name;
				}
				else if(!(this.invSlots[i].content instanceof Arrow)) {
					if(this.invSlots[i].content instanceof Equipable) {
						ui.infoBar.actions.click = "put on " + this.invSlots[i].content.name;
					}
					else {
						ui.infoBar.actions.click = "equip " + this.invSlots[i].content.name;
					}
				}
				break;
			}
		}
		/* Item hovering */
		if(hoverIndex !== null) {
			/* Display descriptions */
			this.invSlots[hoverIndex].content.displayDesc(this.invSlots[hoverIndex].x + ((this.invSlots[hoverIndex].type === "equip") ? 0 : 70), this.invSlots[hoverIndex].y + 35, (this.invSlots[hoverIndex].type === "equip") ? "left" : "right");
			/* Move Item if clicked */
			if(io.mouse.pressed) {
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
			c.strokeLine(20, 110, 20, 150);
		}
	}
	else if(this.guiOpen === "crystal-infusion") {
		ui.infoBar.actions.d = "cancel";
		if(io.keys[68]) {
			this.guiOpen = "none";
		}
		/* Background */
		c.strokeStyle = "rgb(59, 67, 70)";
		c.fillStyle = "rgb(150, 150, 150)";
		c.fillRect(0, 0, 800, 800);
		/* GUI Title */
		c.font = "bold 20pt monospace";
		c.textAlign = "center";
		c.fillStyle = "rgb(59, 67, 70)";
		c.fillText("Select a weapon to infuse", 400, 165);
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
			if(io.mouse.x > this.invSlots[i].x && io.mouse.x < this.invSlots[i].x + 70 && io.mouse.y > this.invSlots[i].y && io.mouse.y < this.invSlots[i].y + 70 && this.invSlots[i].content !== "empty") {
				this.invSlots[i].content.desc = this.invSlots[i].content.getDesc();
				hoverIndex = i;
				break;
			}
		}
		if(hoverIndex !== null) {
			/* Display desc of hovered item */
			this.invSlots[hoverIndex].content.displayDesc(this.invSlots[hoverIndex].x + (this.invSlots[hoverIndex].type === "equip" ? 0 : 70), this.invSlots[hoverIndex].y + 35, this.invSlots[hoverIndex].type === "equip" ? "left" : "right");
			/* Detect clicks */
			if(this.invSlots[hoverIndex].content instanceof Weapon && !(this.invSlots[hoverIndex].content instanceof Arrow) && this.invSlots[hoverIndex].content.element !== this.infusedGui && (this.invSlots[hoverIndex].content instanceof ElementalStaff || !(this.invSlots[hoverIndex].content instanceof MagicWeapon))) {
				ui.infoBar.actions.click = "infuse " + this.invSlots[hoverIndex].content.name;
				if(io.mouse.pressed) {
					this.invSlots[hoverIndex].content.element = this.infusedGui;
					this.guiOpen = "none";
					this.invSlots[this.activeSlot].content = "empty";
					return;
				}
			}
		}
	}
	else if(this.guiOpen === "reforge-item") {
		ui.infoBar.actions.d = "cancel";
		/* Background */
		c.strokeStyle = "rgb(59, 67, 70)";
		c.fillStyle = "rgb(150, 150, 150)";
		c.fillRect(0, 0, 800, 800);
		/* Text */
		c.font = "bold 20pt monospace";
		c.textAlign = "center";
		c.fillStyle = "rgb(59, 67, 70)";
		c.fillText("Select a weapon to reforge", 400, 165);
		var hoverIndex = null;
		for(var i = 0; i < this.invSlots.length; i ++) {
			c.fillStyle = "rgb(150, 150, 150)";
			c.fillRect(this.invSlots[i].x, this.invSlots[i].y, 70, 70);
			c.strokeRect(this.invSlots[i].x, this.invSlots[i].y, 70, 70);
			if(this.invSlots[i].content !== "empty") {
				display(this.invSlots[i]);
				/* Gray out invalid choices */
				if(!(this.invSlots[i].content instanceof Weapon || this.invSlots[i].content instanceof Equipable) || this.invSlots[i].content instanceof Arrow) {
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
			if(io.mouse.x > this.invSlots[i].x && io.mouse.x < this.invSlots[i].x + 70 && io.mouse.y > this.invSlots[i].y && io.mouse.y < this.invSlots[i].y + 70 && this.invSlots[i].content !== "empty") {
				this.invSlots[i].content.desc = this.invSlots[i].content.getDesc();
				hoverIndex = i;
				break;
			}
		}
		if(hoverIndex !== null) {
			/* Display desc of hovered item */
			this.invSlots[hoverIndex].content.displayDesc(this.invSlots[hoverIndex].x + (this.invSlots[hoverIndex].type === "equip" ? 0 : 70), this.invSlots[hoverIndex].y + 35, this.invSlots[hoverIndex].type === "equip" ? "left" : "right");
			/* Detect clicks */
			if((this.invSlots[hoverIndex].content instanceof Weapon || this.invSlots[hoverIndex].content instanceof Equipable) && !(this.invSlots[hoverIndex].content instanceof Arrow)) {
				ui.infoBar.actions.click = "reforge " + this.invSlots[hoverIndex].content.name;
				if(io.mouse.pressed) {
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
	}
	else if(this.guiOpen === "reforge-trait-none") {
		ui.infoBar.actions.d = "cancel";
		/* Background */
		c.strokeStyle = "rgb(59, 67, 70)";
		c.fillStyle = "rgb(150, 150, 150)";
		c.fillRect(0, 0, 800, 800);
		/* Text */
		c.fillStyle = "rgb(59, 67, 70)";
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
		c.save(); {
			c.translate(300, 400);
			choice1.display("holding");
		} c.restore();
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
		c.save(); {
			c.translate(500, 400);
			choice2.display("holding");
		} c.restore();
		/* Detect hovering */
		if(io.mouse.x > 300 - 35 && io.mouse.x < 335 && io.mouse.y > 400 - 35 && io.mouse.y < 435) {
			io.cursor = "pointer";
			choice1.desc = choice1.getDesc();
			choice1.displayDesc(335, 400, "right");
			ui.infoBar.actions.click = "reforge for " + ((this.reforgeType === "melee" || this.reforgeType === "ranged") ? (this.reforgeType === "melee" ? "speed" : "range") : (this.reforgeType === "magic" ? "mana cost" : "bonuses"));
			if(io.mouse.pressed) {
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
				for(var i = 0; i < game.dungeon[game.inRoom].content.length; i ++) {
					if(game.dungeon[game.inRoom].content[i] instanceof Forge) {
						game.dungeon[game.inRoom].content[i].used = true;
						break;
					}
				}
				this.guiOpen = "none";
			}
		}
		if(io.mouse.x > 500 - 35 && io.mouse.x < 535 && io.mouse.y > 400 - 35 && io.mouse.y < 435) {
			io.cursor = "pointer";
			choice2.desc = choice2.getDesc();
			choice2.displayDesc(535, 400, "right");
			ui.infoBar.actions.click = "reforge for " + ((this.reforgeType === "equipable") ? "defense" : "damage");
			if(io.mouse.pressed) {
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
				for(var i = 0; i < game.dungeon[game.inRoom].content.length; i ++) {
					if(game.dungeon[game.inRoom].content[i] instanceof Forge) {
						game.dungeon[game.inRoom].content[i].used = true;
						break;
					}
				}
				this.guiOpen = "none";
			}
		}
	}
	else if(this.guiOpen === "reforge-trait-light") {
		ui.infoBar.actions.d = "cancel";
		/* Background */
		c.strokeStyle = "rgb(59, 67, 70)";
		c.fillStyle = "rgb(150, 150, 150)";
		c.fillRect(0, 0, 800, 800);
		/* Text */
		c.fillStyle = "rgb(59, 67, 70)";
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
		c.save(); {
			c.translate(300, 400);
			choice1.display("holding");
		} c.restore();
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
		c.save(); {
			c.translate(500, 400);
			choice2.display("holding");
		} c.restore();
		/* Detect hovering */
		if(io.mouse.x > 300 - 35 && io.mouse.x < 335 && io.mouse.y > 400 - 35 && io.mouse.y < 435) {
			io.cursor = "pointer";
			choice1.desc = choice1.getDesc();
			choice1.displayDesc(335, 400, "right");
			ui.infoBar.actions.click = "reforge to balance";
			if(io.mouse.pressed) {
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
				for(var i = 0; i < game.dungeon[game.inRoom].content.length; i ++) {
					if(game.dungeon[game.inRoom].content[i] instanceof Forge) {
						game.dungeon[game.inRoom].content[i].used = true;
						break;
					}
				}
				this.guiOpen = "none";
			}
		}
		if(io.mouse.x > 500 - 35 && io.mouse.x < 535 && io.mouse.y > 400 - 35 && io.mouse.y < 435) {
			io.cursor = "pointer";
			choice2.desc = choice2.getDesc();
			choice2.displayDesc(535, 400, "right");
			ui.infoBar.actions.click = "reforge for " + ((this.reforgeType === "equipable") ? "defense" : "damage");
			if(io.mouse.pressed) {
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
				for(var i = 0; i < game.dungeon[game.inRoom].content.length; i ++) {
					if(game.dungeon[game.inRoom].content[i] instanceof Forge) {
						game.dungeon[game.inRoom].content[i].used = true;
						break;
					}
				}
				this.guiOpen = "none";
			}
		}
	}
	else if(this.guiOpen === "reforge-trait-heavy") {
		ui.infoBar.actions.d = "cancel";
		/* Background */
		c.strokeStyle = "rgb(59, 67, 70)";
		c.fillStyle = "rgb(150, 150, 150)";
		c.fillRect(0, 0, 800, 800);
		/* Text */
		c.fillStyle = "rgb(59, 67, 70)";
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
		c.save(); {
			c.translate(300, 400);
			choice1.display("holding");
		} c.restore();
		/* Choice 2 */
		c.fillRect(500 - 35, 400 - 35, 70, 70);
		c.strokeRect(500 - 35, 400 - 35, 70, 70);
		var choice2 = new this.invSlots[this.reforgeIndex].content.constructor("none");
		choice2.element = this.invSlots[this.reforgeIndex].content.element;
		c.save(); {
			c.translate(500, 400);
			choice2.display("holding");
		} c.restore();
		/* Detect hovering */
		if(io.mouse.x > 300 - 35 && io.mouse.x < 335 && io.mouse.y > 400 - 35 && io.mouse.y < 435) {
			io.cursor = "pointer";
			choice1.desc = choice1.getDesc();
			choice1.displayDesc(335, 400, "right");
			ui.infoBar.actions.click = "reforge for " + ((this.reforgeType === "melee" || this.reforgeType === "ranged") ? (this.reforgeType === "melee" ? "speed" : "range") : (this.reforgeType === "magic" ? "mana cost" : "bonuses"));
			if(io.mouse.pressed) {
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
				for(var i = 0; i < game.dungeon[game.inRoom].content.length; i ++) {
					if(game.dungeon[game.inRoom].content[i] instanceof Forge) {
						game.dungeon[game.inRoom].content[i].used = true;
						break;
					}
				}
				this.guiOpen = "none";
			}
		}
		if(io.mouse.x > 500 - 35 && io.mouse.x < 535 && io.mouse.y > 400 - 35 && io.mouse.y < 435) {
			io.cursor = "pointer";
			choice2.desc = choice2.getDesc();
			choice2.displayDesc(535, 400, "right");
			ui.infoBar.actions.click = "reforge to balance";
			if(io.mouse.pressed) {
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
				for(var i = 0; i < game.dungeon[game.inRoom].content.length; i ++) {
					if(game.dungeon[game.inRoom].content[i] instanceof Forge) {
						game.dungeon[game.inRoom].content[i].used = true;
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
				c.strokeStyle = "rgb(59, 67, 70)";
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
	this.openingBefore = io.keys[68];
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
	game.dungeon = [
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
	game.inRoom = 0;
	game.numRooms = 0;
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
Player.prototype.hasInInventory = function(constructor) {
	for(var i = 0; i < this.invSlots.length; i ++) {
		if(this.invSlots[i].content instanceof constructor) {
			return true;
		}
	}
	return false;
};
Player.prototype.clearInventory = function() {
	for(var i = 0; i < this.invSlots.length; i ++) {
		this.invSlots[i].content = "empty";
	}
};
Player.prototype.loadScores = function() {
	if(localStorage.getItem("scores") !== null) {
		p.scores = JSON.parse(localStorage.getItem("scores"));
	}
};
Player.prototype.saveScores = function() {
	var scores = JSON.stringify(this.scores);
	localStorage.setItem("scores", scores);
};
var p = new Player();
p.loadScores();

/** COLLISIONS **/
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
	this.settings.player = p;
};
CollisionRect.prototype.collide = function() {
	/* Add a hitbox if 'SHOW_HITBOXES' is true (for debugging) */
	if(SHOW_HITBOXES) {
		debugging.hitboxes.push({x: this.x, y: this.y, w: this.w, h: this.h, color: this.settings.illegalHandling === "teleport" ? "dark blue" : "light blue"});
	}
	/* Collide with player if in the same room */
	if(game.inRoom === game.theRoom) {
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
	for(var i = 0; i < game.dungeon[game.theRoom].content.length; i ++) {
		var thing = game.dungeon[game.theRoom].content[i];
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
					while(p.x + 5 > collisions.collisions[i].x && p.x - 5 < collisions.collisions[i].x + 10 && p.y + 46 > collisions.collisions[i].y && p.y - 7 < collisions.collisions[i].y + collisions.collisions[i].h) {
						p.x --;
					}
					while(p.x - 5 < collisions.collisions[i].x + collisions.collisions[i].w && p.x + 5 > collisions.collisions[i].x + collisions.collisions[i].w - 10 && p.y + 46 > collisions.collisions[i].y && p.y - 7 < collisions.collisions[i].y + collisions.collisions[i].h) {
						p.x ++;
					}
					while(p.x + 5 > collisions.collisions[i].x && p.x - 5 < collisions.collisions[i].x + collisions.collisions[i].w && p.y - 7 < collisions.collisions[i].y + collisions.collisions[i].h && p.y + 46 > collisions.collisions[i].y + collisions.collisions[i].h - 10) {
						p.y ++;
					}
					while(p.x + 5 > collisions.collisions[i].x && p.x - 5 < collisions.collisions[i].x + collisions.collisions[i].w && p.y + 46 > collisions.collisions[i].y && p.y - 7 < collisions.collisions[i].y + 10) {
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
	for(var i = 0; i < game.dungeon[game.theRoom].content.length; i ++) {
		var thing = game.dungeon[game.theRoom].content[i];
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
	collisions.rect(this.x + p.worldX, this.y + p.worldY, this.w, this.h, {walls: [true, true, true, true], illegalHandling: utilities.tempVars.partOfAStair ? "teleport" : "collide"} );
};
Block.prototype.exist = function() {
	this.display();
	this.update();
};
Block.prototype.display = function() {
	graphics3D.cube(this.x + p.worldX, this.y + p.worldY, this.w, this.h, 0.9, 1.1);
};
function Platform(x, y, w) {
	this.x = x;
	this.y = y;
	this.w = w;
};
Platform.prototype.update = function() {
	collisions.rect(this.x + p.worldX, this.y + p.worldY, this.w, 3, {walls: [true, false, false, false]});
};
Platform.prototype.exist = function() {
	this.update();
	graphics3D.cube(this.x + p.worldX, this.y + p.worldY, this.w, 3, 0.9, 1.1, "rgb(139, 69, 19)", "rgb(159, 89, 39");
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
	/* returns the text to display when the user is holding a map */
	if(!(p.invSlots[p.activeSlot].content instanceof Map)) {
		return ""; //not holding a map -> no explanatory text
	}
	if(typeof this.dest === "object") {
		return "?"; //unexplored -> "?"
	}
	var isDeadEnd = true;
	for(var i = 0; i < game.dungeon[this.dest].content.length; i ++) {
		if(game.dungeon[this.dest].content[i] instanceof Door) {
			isDeadEnd = false;
			break;
		}
	}
	if(isDeadEnd) {
		return "x"; // "x" if no doors in the room
	}
	var indices = [game.theRoom];
	function isUnknown(index) {
		for(var i = 0; i < indices.length; i ++) {
			if(index === indices[i]) {
				return false;
			}
		}
		indices.push(index);
		var containsUnknown = false;
		for(var i = 0; i < game.dungeon[index].content.length; i ++) {
			if(!(game.dungeon[index].content[i] instanceof Door)) {
				continue;
			}
			if(typeof game.dungeon[index].content[i].dest === "object") {
				return true;
			}
			else {
				var leadsToUnknown = isUnknown(game.dungeon[index].content[i].dest);
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
	for(var i = 0; i < game.dungeon.length; i ++) {
		delete game.dungeon[i].doorPathScore;
	}
	return "x";
};
Door.prototype.exist = function() {
	this.display();
	this.update();
};
Door.prototype.display = function() {
	/* Graphics */
	var topLeft = graphics3D.point3D(this.x + p.worldX - 30, this.y + p.worldY - 60, 0.9);
	var bottomRight = graphics3D.point3D(this.x + p.worldX + 30, this.y + p.worldY, 0.9);
	if(this.type === "arch") {
		c.fillStyle = "rgb(20, 20, 20)";
		c.fillRect(topLeft.x, topLeft.y, bottomRight.x - topLeft.x, bottomRight.y - topLeft.y);
		c.fillCircle(topLeft.x + (bottomRight.x - topLeft.x) / 2, topLeft.y, 27);
	}
	if(this.barricaded) {
		c.save(); {
			c.fillStyle = "rgb(139, 69, 19)";
			c.strokeStyle = "rgb(255, 255, 255)";
			c.lineWidth = 2;
			function displayWoodenBoard() {
				c.fillRect(-40, -10, 80, 20);
				c.fillStyle = "rgb(200, 200, 200)";
				c.fillCircle(-30, 0, 5);
				c.fillCircle(30, 0, 5);
				c.strokeLine(-35, 0, -25, 0);
				c.strokeLine(-30, -5, -30, 5);
				c.strokeLine(35, 0, 25, 0);
				c.strokeLine(30, -5, 30, 5);
			};
			var doorWidth = (bottomRight.x - topLeft.x) / 2;
			c.save(); {
				c.translate(topLeft.x + (doorWidth / 2), bottomRight.y - 60);
				c.rotate(Math.rad(22));
				displayWoodenBoard();
			} c.restore();

			c.save(); {
				c.translate(topLeft.x + (doorWidth / 2), bottomRight.y - 40);
				c.rotate(Math.rad(-22));
				displayWoodenBoard();
			} c.restore();

			c.save(); {
				c.translate(topLeft.x + (doorWidth / 2), bottomRight.y - 20);
				c.rotate(Math.rad(22));
				displayWoodenBoard();
			} c.restore();

		} c.restore();

	}
	if(this.type === "lintel") {
		graphics3D.cube(this.x + p.worldX - 30, this.y + p.worldY - 90, 60, 90, 0.9, 0.9, "rgb(20, 20, 20)", "rgb(20, 20, 20)", { noFrontExtended: true });
		graphics3D.cube(this.x + p.worldX - 45, this.y + p.worldY - 110, 90, 20, 0.9, 0.91, "rgb(110, 110, 110)", "rgb(150, 150, 150)", {noFrontExtended: true} );
	}
	/* Symbols for maps */
	var symbol = this.getInfo();
	var center = graphics3D.point3D(this.x + p.worldX, this.y + p.worldY - 40, 0.9);
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
	var topLeft = graphics3D.point3D(this.x + p.worldX - 30, this.y + p.worldY - 60, 0.9);
	var bottomRight = graphics3D.point3D(this.x + p.worldX + 30, this.y + p.worldY, 0.9);
	if(p.x - 5 > topLeft.x && p.x + 5 < bottomRight.x && p.y + 46 > topLeft.y && p.y + 46 < bottomRight.y + 10 && p.canJump && !p.enteringDoor && !p.exitingDoor && p.guiOpen === "none" && !this.barricaded) {
		if(io.keys[83]) {
			p.enteringDoor = true;
			this.entering = true;
		}
		ui.infoBar.actions.s = "enter door";
	}
	if(p.screenOp > 0.95 && this.entering && !this.barricaded) {
		p.doorType = this.type;
		if(typeof this.dest !== "number") {
			p.roomsExplored ++;
			p.numHeals ++;
			/* Calculate distance to nearest unexplored door */
			calculatePaths();
			p.terminateProb = 0;
			for(var i = 0; i < game.dungeon.length; i ++) {
				for(var j = 0; j < game.dungeon[i].content.length; j ++) {
					if(game.dungeon[i].content[j] instanceof Door && typeof(game.dungeon[i].content[j].dest) === "object" && !game.dungeon[i].content[j].entering) {
						p.terminateProb += (1 / ((game.dungeon[i].pathScore + 1) * (game.dungeon[i].pathScore + 1)));
					}
				}
			}
			/* Create a list of valid rooms to generate */
			var possibleRooms = [];
			for(var i = 0; i < game.rooms.length; i ++) {
				if(game.dungeon[game.inRoom].colorScheme === "red") {
					/* remove fountain, tree, mana altar */
					if(game.rooms[i].name === "ambient5" || game.rooms[i].name === "secret1" || (game.rooms[i].name === "reward2" && p.healthAltarsFound >= 5)) {
						continue;
					}
				}
				else if(game.dungeon[game.inRoom].colorScheme === "green") {
					/* remove fountain, forge, altars, library */
					if(game.rooms[i].name === "ambient5" || game.rooms[i].name === "reward3" || game.rooms[i].name === "reward2" || game.rooms[i].name === "secret3") {
						continue;
					}
				}
				else if(game.dungeon[game.inRoom].colorScheme === "blue") {
					/* remove forge, tree, health altar, library */
					if(game.rooms[i].name === "reward3" || game.rooms[i].name === "secret1" || (game.rooms[i].name === "reward2" && p.manaAltarsFound >= 5) || game.rooms[i].name === "secret3") {
						continue;
					}
				}
				for(var j = 0; j < this.dest.length; j ++) {
					if(this.dest[j] === game.rooms[i].name.substr(0, 7) && game.rooms[i].name !== game.dungeon[game.inRoom].type) {
						possibleRooms.push(game.rooms[i]);
					}
					if(this.dest[j] === game.rooms[i].name.substr(0, 6) && game.rooms[i].name !== game.dungeon[game.inRoom].type) {
						possibleRooms.push(game.rooms[i]);
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
			game.dungeon[game.dungeon.length - 1].id = "?";
			/* Reset transition variables */
			var previousRoom = game.inRoom;
			game.inRoom = game.numRooms;
			p.enteringDoor = false;
			p.exitingDoor = true;
			p.op = 1;
			p.op = 95;
			this.dest = game.numRooms;
			/* Give new room an ID */
			for(var i = 0; i < game.dungeon.length; i ++) {
				if(game.dungeon[i].id === "?") {
					game.dungeon[i].id = game.numRooms;
					game.numRooms ++;
				}
			}
			/* Move player to exit door */
			for(var i = 0; i < game.dungeon.length; i ++) {
				if(game.dungeon[i].id === game.numRooms - 1) {
					/* Select a door */
					var doorIndexes = [];
					for(var j = 0; j < game.dungeon[i].content.length; j ++) {
						if(game.dungeon[i].content[j] instanceof Door && (!!game.dungeon[i].content[j].noEntry) === (!!this.invertEntries) && game.dungeon[i].content[j].noEntry !== "no entries") {
							doorIndexes.push(j);
						}
					}
					if(doorIndexes.length === 0) {
						for(var j = 0; j < game.dungeon[i].content.length; j ++) {
							if(game.dungeon[i].content[j] instanceof Door) {
								doorIndexes.push(j);
							}
						}
					}
					var theIndex = doorIndexes[Math.round(Math.random() * (doorIndexes.length - 1))];
					/* Move player to door */
					p.worldX = 0;
					p.worldY = 0;
					p.x = game.dungeon[i].content[theIndex].x;
					p.y = game.dungeon[i].content[theIndex].y - 47;
					if(game.dungeon[i].content[theIndex].type === "toggle") {
						for(var j = 0; j < game.dungeon[i].content.length; j ++) {
							if(game.dungeon[i].content[j] instanceof Door && j !== theIndex) {
								game.dungeon[i].content[j].type = (game.dungeon[i].content[j].type === "same") ? "toggle" : "same";
							}
						}
					}
					game.dungeon[i].content[theIndex].type = p.doorType;
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
					game.dungeon[i].content[theIndex].dest = previousRoom;
					/* Assign this door to lead to new door */
					this.dest = game.inRoom;
				}
			}
			/* Assign new room's color scheme */
			for(var i = 0; i < game.dungeon.length; i ++) {
				if(game.dungeon[i].id === game.numRooms - 1 && game.dungeon[i].type !== "ambient5" && game.dungeon[i].type !== "reward2" && game.dungeon[i].type !== "reward3" && game.dungeon[i].type !== "secret1" && game.dungeon[i].type !== "secret3") {
					var hasDecorations = false;
					decorationLoop: for(var j = 0; j < game.dungeon[i].content.length; j ++) {
						if(game.dungeon[i].content[j] instanceof Decoration || game.dungeon[i].content[j] instanceof Torch) {
							hasDecorations = true;
							break decorationLoop;
						}
					}
					if(!hasDecorations) {
						game.dungeon[i].colorScheme = null;
					}
					if(game.dungeon[previousRoom].colorScheme === null && hasDecorations) {
						var chooser = Math.random();
						if(chooser < 0.33) {
							game.dungeon[i].colorScheme = "red";
						}
						else if(chooser < 0.66) {
							game.dungeon[i].colorScheme = "green";
						}
						else {
							game.dungeon[i].colorScheme = "blue";
						}
					}
					if(game.dungeon[previousRoom].colorScheme !== null && hasDecorations) {
						game.dungeon[i].colorScheme = game.dungeon[previousRoom].colorScheme;
					}
				}
			}
		}
		else {
			var previousRoom = game.inRoom;
			for(var i = 0; i < game.dungeon.length; i ++) {
				game.inRoom = this.dest;
				if(game.dungeon[i].id === this.dest) {
					for(var j = 0; j < game.dungeon[i].content.length; j ++) {
						if(game.dungeon[i].content[j] instanceof Door && game.dungeon[i].content[j].dest === previousRoom) {
							p.x = 400;
							p.y = 400;
							p.worldX = 400 - game.dungeon[i].content[j].x;
							p.worldY = 446 - game.dungeon[i].content[j].y;
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
Door.prototype.isEnemyNear = function(enemy) {
	return enemy.x + enemy.rightX > this.x - 30 && enemy.x + enemy.leftX < this.x + 30 && enemy.y + enemy.bottomY > this.y - 60 && enemy.y + enemy.topY < this.y + 3;
};
function calculatePaths() {
	function calculated() {
		for(var i = 0; i < game.dungeon.length; i ++) {
			if(game.dungeon[i].pathScore === null) {
				return false;
			}
		}
		return true;
	};
	for(var i = 0; i < game.dungeon.length; i ++) {
		game.dungeon[i].pathScore = null;
	}
	var timeOut = 0;
	while(!calculated() && timeOut < 20) {
		timeOut ++;
		for(var i = 0; i < game.dungeon.length; i ++) {
			if(i === game.inRoom) {
				game.dungeon[i].pathScore = 0;
			}
			for(var j = 0; j < game.dungeon[i].content.length; j ++) {
				if(game.dungeon[i].content[j] instanceof Door && typeof game.dungeon[i].content[j].dest !== "object" && game.dungeon[i].pathScore === null) {
					if(game.dungeon[game.dungeon[i].content[j].dest].pathScore !== null) {
						game.dungeon[i].pathScore = game.dungeon[game.dungeon[i].content[j].dest].pathScore + 1;
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
	graphics3D.cube(this.x + p.worldX - 5, this.y + p.worldY - 20, 10, 20, 0.9, 0.95, null, null, { noFrontExtended: true });
	graphics3D.cube(this.x + p.worldX - 10, this.y + p.worldY - 25, 20, 6, 0.9, 0.97, null, null, { noFrontExtended: true });

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
		if(game.dungeon[game.theRoom].colorScheme === "red") {
			this.color = "rgb(255, 128, 0)";
		}
		else if(game.dungeon[game.theRoom].colorScheme === "green") {
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
	var left = Math.min(graphics3D.point3D(this.x + p.worldX, 0, 0.9).x, graphics3D.point3D(this.x + p.worldX, 0, 1.1).x);
	var right = Math.max(graphics3D.point3D(this.x + p.worldX + this.w, 0, 0.9).x, graphics3D.point3D(this.x + p.worldX + this.w, 0, 1.1).x);
	c.fillStyle = "rgb(255, 255, 255)";
	c.globalAlpha = 0.5;
	c.fillRect(left, 0, right - left, 800);
	c.globalAlpha = 1;
};
function Tree(x, y) {
	/*
	dead tree, comes with the planter and everything
	*/
	this.x = x;
	this.y = y;
};
Tree.prototype.exist = function() {
	this.update();
	graphics3D.cube(this.x + p.worldX - 100, this.y + p.worldY - 40, 200, 40, 0.9, 1);
	this.display();
};
Tree.prototype.update = function() {
	var loc = graphics3D.point3D(this.x + p.worldX, this.y + p.worldY, 0.95);
	collisions.line(loc.x - 6, loc.y - 100, loc.x - 150, loc.y - 100, {walls: [true, false, false, false]});
	collisions.line(loc.x + 6, loc.y - 120, loc.x + 150, loc.y - 120, {walls: [true, false, false, false]});
	collisions.line(loc.x - 5, loc.y - 170, loc.x - 100, loc.y - 180, {walls: [true, false, false, false]});
	collisions.line(loc.x + 5, loc.y - 190, loc.x + 100, loc.y - 200, {walls: [true, false, false, false]});
	collisions.line(loc.x, loc.y - 220, loc.x - 60, loc.y - 230, {walls: [true, false, false, false]});
};
Tree.prototype.display = function() {
	c.fillStyle = "rgb(139, 69, 19)";
	var loc = graphics3D.point3D(this.x + p.worldX, this.y + p.worldY, 0.95);
	c.save(); {
		c.translate(loc.x, loc.y);
		/* Tree trunk */
		c.fillPoly(-10, -40, 10, -40, 0, -350);
		/* 1st branch on left */
		c.fillPoly(-5, -80, -6, -100, -150, -100);
		/* 1st branch on right */
		c.fillPoly(7, -100, 6, -120, 150, -120);
		/* 2nd branch on left */
		c.fillPoly(-6, -150, -5, -170, -100, -180);
		/* 2nd branch on right */
		c.fillPoly(6, -170, 5, -190, 100, -200);
		/* 3rd branch on left */
		c.fillPoly(0, -200, 0, -220, -60, -230);
	} c.restore();
};
function Chest(x, y) {
	this.x = x;
	this.y = y;
	this.r = 0;
	this.opening = false;
	this.openDir = null;
	this.lidArray = Math.findPointsCircular(40, 50, 64); // circle passing through origin
	this.initialized = false;
	this.spawnedItem = false;
};
Chest.prototype.exist = function() {
	this.update();
	/* Square part of chest */
	c.fillStyle = "rgb(139, 69, 19)";
	graphics3D.cube(this.x + p.worldX - 20, this.y + p.worldY - 30, 40, 30, 0.95, 1.05, "rgb(139, 69, 19)", "rgb(159, 89, 39)");
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
	graphics3D.polygon3D("rgb(139, 69, 19)", "rgb(159, 89, 39)", 0.95, 1.05, rotatedArray);
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
	if(p.x + 5 > this.x + p.worldX - 61 && p.x - 5 < this.x + p.worldX + 61 && p.y + 46 >= this.y + p.worldY - 10 && p.y + 46 <= this.y + p.worldY + 10 && p.canJump && !this.opening) {
		ui.infoBar.actions.s = "open chest";
		if(io.keys[83]) {
			this.opening = true;
			if(p.x < this.x + p.worldX) {
				this.openDir = "right";
			}
			else {
				this.openDir = "left";
			}
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
			game.dungeon[game.inRoom].content.push(new WoodBow());
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
			/* 25% arrows, 25% coins, 50% random item (not arrows or coins) */
			var chooser = Math.random();
			if(chooser < 0.25) {
				/* give the player 6-10 arrows */
				game.dungeon[game.inRoom].content.push(new Arrow(Math.round(Math.random() * 4 + 6)));
			}
			else if(chooser <= 0.5) {
				/* give the player 4-8 coins */
				game.dungeon[game.inRoom].content.push(new Coin(Math.round(Math.random() * 4 + 6)));
			}
			else {
				/* give the player a random item (not coins or arrows) */
				var possibleItems = [];
				for(var i = 0; i < game.items.length; i ++) {
					possibleItems.push(game.items[i]);
				}
				for(var i = 0; i < p.invSlots.length; i ++) {
					for(var j = 0; j < game.items.length; j ++) {
						if(p.invSlots[i].content instanceof game.items[j]) {
							for(var k = 0; k < possibleItems.length; k ++) {
								if(new possibleItems[k]() instanceof game.items[j]) {
									possibleItems.splice(k, 1);
								}
							}
						}
					}
				}
				if(possibleItems.length === 0) {
					/* the player already has every item in the game, so just give them coins */
					game.dungeon[game.inRoom].content.push(new Coin(Math.round(Math.random() * 4 + 6)));
					return;
				}
				var selector = Math.floor(Math.random() * possibleItems.length);
				var theItem = possibleItems[selector];
				game.dungeon[game.inRoom].content.push(new theItem());
			}
		}
		else {
			var chooser = Math.random();
			if(TESTING_MODE) {
				chooser = 1;
			}
			if(chooser <= 0.5) {
				game.dungeon[game.inRoom].content.push(new Coin(Math.round(Math.random() * 4 + 6)));
			}
			else {
				/* give the player a random item (not coins or arrows) */
				var possibleItems = [];
				for(var i = 0; i < game.items.length; i ++) {
					possibleItems.push(game.items[i]);
				}
				for(var i = 0; i < p.invSlots.length; i ++) {
					for(var j = 0; j < game.items.length; j ++) {
						if(p.invSlots[i].content instanceof game.items[j]) {
							for(var k = 0; k < possibleItems.length; k ++) {
								if(new possibleItems[k]() instanceof game.items[j]) {
									possibleItems.splice(k, 1);
								}
							}
						}
					}
				}
				if(possibleItems.length === 0) {
					/* the player already has every item in the game, so just give them coins */
					game.dungeon[game.inRoom].content.push(new Coin(Math.round(Math.random() * 4 + 6)));
					return;
				}
				var selector = Math.floor(Math.random() * possibleItems.length);
				var theItem = possibleItems[selector];
				game.dungeon[game.inRoom].content.push(new theItem());
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
	var topLeftF = graphics3D.point3D(this.x + p.worldX - 20, this.y + p.worldY, 1.1);
	var topRightF = graphics3D.point3D(this.x + p.worldX + 20, this.y + p.worldY, 1.1);
	var bottomF = graphics3D.point3D(this.x + p.worldX, this.y + p.worldY + 60, 1.1);
	var topLeftB = graphics3D.point3D(this.x + p.worldX - 20, this.y + p.worldY, 0.9);
	var topRightB = graphics3D.point3D(this.x + p.worldX + 20, this.y + p.worldY, 0.9);
	var bottomB = graphics3D.point3D(this.x + p.worldX, this.y + p.worldY + 60, 0.9);
	c.fillStyle = "rgb(150, 150, 150)";
	var shakeX = Math.random() * (this.timeShaking * 2) - this.timeShaking;
	var shakeY = Math.random() * (this.timeShaking * 2) - this.timeShaking;
	c.save(); {
		c.translate(shakeX, shakeY);
		/* Top face */
		c.fillPoly(topLeftF, topLeftB, topRightB, topRightF);
		collisions.line(this.x + p.worldX - 20, this.y + p.worldY, this.x + p.worldX + 20, this.y + p.worldY, {walls: [true, false, false, false], illegalHandling: "collide"});
		/* left face */
		c.fillPoly(topLeftF, topLeftB, bottomB, bottomF);
		collisions.line(this.x + p.worldX - 20, this.y + p.worldY, this.x + p.worldX, this.y + p.worldY + 60, {walls: [true, true, true, true], illegalHandling: "collide"});
		/* right face */
		c.fillPoly(topRightF, topRightB, bottomB, bottomF);
		collisions.line(this.x + p.worldX + 20, this.y + p.worldY, this.x + p.worldX, this.y + p.worldY + 60, {walls: [true, true, true, true], illegalHandling: "collide"});
		/* front face */
		graphics3D.boxFronts.push({
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
	} c.restore();
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
	utilities.tempVars.partOfAStair = true;
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
	utilities.tempVars.partOfAStair = false;
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
	this.curveArray = Math.findPointsCircular(0, 0, 50);
	this.init = false;
	this.particles = [];
};
Forge.prototype.exist = function() {
	/* initialize curved segments */
	if(!this.init) {
		for(var i = 0; i < this.curveArray.length; i ++) {
			if(this.curveArray[i].y > 0) {
				this.curveArray.splice(i, 1);
				continue;
			}
		}
	}
	/* main stone forge body */
	graphics3D.cube(this.x + p.worldX - 100, this.y + p.worldY - 76, 50, 76, 0.9, 1.05);
	graphics3D.cube(this.x + p.worldX + 50, this.y + p.worldY - 76, 50, 76, 0.9, 1.05);
	graphics3D.cube(this.x + p.worldX - 51, this.y + p.worldY - 300, 102, 200, 0.9, 1.05);
	graphics3D.cube(this.x + p.worldX - 50, this.y + p.worldY - 60, 100, 20, 0.9, 1.05);
	graphics3D.cube(this.x + p.worldX - 50, this.y + p.worldY - 10, 100, 10, 0.9, 1.05);
	/* curved segments */
	for(var i = 0; i < this.curveArray.length - 1; i ++) {
		if(this.curveArray[i].x > 0 && this.curveArray[i + 1].x > 0) {
			graphics3D.line3D(this.x + p.worldX + this.curveArray[i].x + 50, this.y + p.worldY + this.curveArray[i].y - 75, this.x + p.worldX + this.curveArray[i + 1].x + 50, this.y + p.worldY + this.curveArray[i + 1].y - 75, 0.9, 1.05, "rgb(150, 150, 150)");
		}
	}
	for(var i = 0; i < this.curveArray.length - 1; i ++) {
		if(this.curveArray[i].x < 0) {
			graphics3D.line3D(this.x + p.worldX + this.curveArray[i].x - 50, this.y + p.worldY + this.curveArray[i].y - 75, this.x + p.worldX + this.curveArray[i + 1].x - 50, this.y + p.worldY + this.curveArray[i + 1].y - 75, 0.9, 1.05, "rgb(150, 150, 150)");
		}
	}
	graphics3D.line3D(this.x + p.worldX + 50, this.y + p.worldY - 75, this.x + p.worldX + 50, this.y + p.worldY - 125, 0.9, 1.05, "rgb(150, 150, 150)");
	graphics3D.line3D(this.x + p.worldX - 50, this.y + p.worldY - 75, this.x + p.worldX - 50, this.y + p.worldY - 125, 0.9, 1.05, "rgb(150, 150, 150)");
	graphics3D.boxFronts.push({type: "arc", loc: [graphics3D.point3D(this.x + p.worldX + 50, this.y + p.worldY - 75, 1.05).x, graphics3D.point3D(this.x + p.worldX + 50, this.y + p.worldY - 75, 1.05).y, 50, 1.5 * Math.PI, 2 * Math.PI], col: "rgb(110, 110, 110)"});
	graphics3D.boxFronts.push({type: "arc", loc: [graphics3D.point3D(this.x + p.worldX - 50, this.y + p.worldY - 75, 1.05).x, graphics3D.point3D(this.x + p.worldX - 50, this.y + p.worldY - 75, 1.05).y, 50, Math.PI, 1.5 * Math.PI], col: "rgb(110, 110, 110)"});
	/* bars underneath */
	for(var x = -30; x <= 30; x += 30) {
		graphics3D.cube(this.x + p.worldX + x - 10, this.y + p.worldY - 40, 20, 40, 0.9, 1.05);
	}
	/* fire */
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
	/* usage */
	if(p.x + 5 > this.x + p.worldX - 100 && p.x - 5 < this.x + p.worldX + 100 && !this.used && p.guiOpen === "none") {
		ui.infoBar.actions.s = "use forge";
		if(io.keys[83]) {
			p.guiOpen = "reforge-item";
		}
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
		graphics3D.cube(x + p.worldX, -100, 3, y + 100 + p.worldY, 0.9, 0.9, "rgb(150, 150, 150)", "rgb(150, 150, 150)", { noFrontExtended: true });
		graphics3D.cube(x + p.worldX, -100, 3, y + 100 + p.worldY, 1.1, 1.1, "rgb(150, 150, 150)", "rgb(150, 150, 150)", { noFrontExtended: true });
		graphics3D.cube(x + w + p.worldX, -100, 3, y + 100 + p.worldY, 0.9, 0.9, "rgb(150, 150, 150)", "rgb(150, 150, 150)", { noFrontExtended: true });
		graphics3D.cube(x + w + p.worldX, -100, 3, y + 100 + p.worldY, 1.1, 1.1, "rgb(150, 150, 150)", "rgb(150, 150, 150)", { noFrontExtended: true });
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
	if(this.steppedOn1) {
		p.y += this.velY;
	}
	else if(this.steppedOn2) {
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
	c.save(); {
		var loc = graphics3D.point3D(this.x + p.worldX, this.y + p.worldY, 0.9);
		c.translate(loc.x, loc.y);
		c.scale(0.75, 1);
		c.fillStyle = "rgb(20, 20, 20)";
		c.fillCircle(0, 0, 50);
		c.fillRect(-50, -1, 100, 20);
		c.strokeStyle = "rgb(150, 150, 150)";
		c.lineCap = "round";
		c.strokeLine(10, -47, 10, -17);
		c.strokeLine(-10, -47, -10, 17);
		c.strokeLine(30, -37, 30, 17);
		c.strokeLine(-30, -37, -30, 17);
	} c.restore();
};
function Pillar(x, y, h) {
	this.x = x;
	this.y = y;
	this.h = h;
};
Pillar.prototype.exist = function() {
	/* Base */
	graphics3D.cube(this.x + p.worldX - 30, this.y + p.worldY - 20, 60, 21, 0.9, 1.1);
	graphics3D.cube(this.x + p.worldX - 40, this.y + p.worldY - 10, 80, 10, 0.9, 1.1);
	/* Top */
	graphics3D.cube(this.x + p.worldX - 41, this.y + p.worldY - this.h, 80, 12, 0.9, 1.1);
	graphics3D.cube(this.x + p.worldX - 30, this.y + p.worldY - this.h + 10, 60, 10, 0.9, 1.1);
	/* Pillar */
	graphics3D.cube(this.x + p.worldX - 20, this.y + p.worldY - this.h + 20, 40, this.h - 40, 0.95, 1.05, null, null, { noFrontExtended: true });
	/* Base collisions */
	collisions.rect(this.x + p.worldX - 30, this.y + p.worldY - 20, 60, 21, {walls: [true, true, true, true], illegalHandling: "teleport"});
	collisions.rect(this.x + p.worldX - 40, this.y + p.worldY - 10, 80, 10, {walls: [true, true, true, true], illegalHandling: "teleport"});
	/* Top collisions */
	collisions.rect(this.x + p.worldX - 41, this.y + p.worldY - this.h, 80, 12);
	collisions.rect(this.x + p.worldX - 30, this.y + p.worldY - this.h + 10, 60, 10);
};
function Statue(x, y) {
	this.x = x;
	this.y = y;
	var possibleItems = Object.create(game.items);
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
	this.facing = Math.random() < 0.5 ? "left" : "right";
	this.pose = (Math.random() < 0.5) ? "standing" : "kneeling";
};
Statue.prototype.exist = function() {
	/* item in hands */
	if(this.itemHolding instanceof MeleeWeapon && this.pose === "standing" && !this.itemStolen) {
		if(this.facing === "left") {
			c.save(); {
				c.translate(this.x + p.worldX - 20, this.y + p.worldY + 72);
				c.rotate(Math.rad(-45));
				this.itemHolding.display("attacking");
			} c.restore();
		}
		else {
			c.save(); {
				c.translate(this.x + p.worldX + 20, this.y + p.worldY + 72);
				c.rotate(Math.rad(45));
				this.itemHolding.display("attacking");
			} c.restore();
		}
	}
	else if(this.itemHolding instanceof MeleeWeapon && this.pose === "kneeling" && !this.itemStolen) {
		if(this.facing === "left") {
			c.save(); {
				c.translate(this.x + p.worldX - 24, this.y + p.worldY + 52);
				this.itemHolding.display("attacking");
			} c.restore();
		}
		else {
			c.save(); {
				c.translate(this.x + p.worldX + 24, this.y + p.worldY + 52);
				this.itemHolding.display("attacking");
			} c.restore();
		}
	}
	/* pedestal */
	graphics3D.cube(this.x + p.worldX - 60, this.y + p.worldY + 96, 120, 34, 0.95, 1.05, "rgb(110, 110, 110)", "rgb(150, 150, 150)");
	c.save(); {
		c.fillStyle = "rgb(125, 125, 125)";
		c.lineCap = "round";
		c.lineWidth = 10;
		c.translate(p.worldX, p.worldY);
		c.save(); {
			c.translate(this.x, this.y);
			c.scale(1, 1.2);
			c.fillCircle(0, 24, 20);
		} c.restore();
		/* body */
		c.strokeStyle = "rgb(125, 125, 125)";
		c.strokeLine(this.x, this.y + 24, this.x, this.y + 72);
		/* legs */
		if(this.pose === "standing") {
			c.strokeLine(this.x, this.y + 72, this.x - 10, this.y + 92);
			c.strokeLine(this.x, this.y + 72, this.x + 10, this.y + 92);
		}
		else if(this.facing === "left") {
			c.strokePoly(
				this.x, this.y + 72,
				this.x - 20, this.y + 72,
				this.x - 20, this.y + 92
			);
			c.strokePoly(
				this.x, this.y + 72,
				this.x, this.y + 92,
				this.x + 20, this.y + 92
			);
		}
		else if(this.facing === "right") {
			c.strokePoly(
				this.x, this.y + 72,
				this.x + 20, this.y + 72,
				this.x + 20, this.y + 92
			);
			c.strokePoly(
				this.x, this.y + 72,
				this.x, this.y + 92,
				this.x - 20, this.y + 92
			);
		}
		/* arms */
		var leftArmUp = (this.facing === "left" && (!(this.itemHolding instanceof MeleeWeapon) || this.pose === "kneeling"));
		var rightArmUp = (this.facing === "right" && (!(this.itemHolding instanceof MeleeWeapon) || this.pose === "kneeling"));
		c.strokeLine(this.x, this.y + 52, this.x - 20, this.y + (leftArmUp ? 52 : 72));
		c.strokeLine(this.x, this.y + 52, this.x + 20, this.y + (rightArmUp ? 52 : 72));
	} c.restore();
	/* ranged weapon graphics - drawn after stick figure */
	if(!(this.itemHolding instanceof MeleeWeapon) && !this.itemStolen) {
		if(this.facing === "left") {
			c.save(); {
				c.translate(this.x + p.worldX - (this.itemHolding instanceof MagicWeapon ? 28 : 20), this.y + p.worldY + (this.itemHolding instanceof MagicWeapon ? 32 : 52));
				c.scale(-2, 2);
				this.itemHolding.display("aiming");
			} c.restore();
		}
		else {
			c.save(); {
				c.translate(this.x + p.worldX + (this.itemHolding instanceof MagicWeapon ? 28 : 20), this.y + p.worldY + (this.itemHolding instanceof MagicWeapon ? 32 : 52));
				c.scale(2, 2);
				this.itemHolding.display("aiming");
			} c.restore();
		}
	}
	/* stealing Weapons */
	if(io.keys[83] && Math.dist(this.x + p.worldX, this.y + p.worldY, p.x, p.y) <= 100 && !this.itemStolen) {
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
	/* graphics */
	graphics3D.cube(this.origX + p.worldX - 5, this.origY + p.worldY + 10, 10, 8000, 0.99, 1.01, null, null, { noFrontExtended: true });
	if(Math.abs(this.x - this.origX) < 3 && Math.abs(this.y - this.origY) < 3) {
		this.collides = function(x, y) {
			var p1 = graphics3D.point3D(this.p1.x + this.x + p.worldX, this.p1.y + this.y + p.worldY, 1.1);
			var p2 = graphics3D.point3D(this.p2.x + this.x + p.worldX, this.p2.y + this.y + p.worldY, 1.1);
			var p3 = graphics3D.point3D(-this.p1.x + this.x + p.worldX, -this.p1.y + this.y + p.worldY, 1.1);
			var p4 = graphics3D.point3D(-this.p2.x + this.x + p.worldX, -this.p2.y + this.y + p.worldY, 1.1);
			c.beginPath();
			c.polygon(
				{ x: p1.x, y: -800 },
				{ x: p2.x, y: -800 },
				p3,
				p4
			);
			return c.isPointInPath(x, y);
		};
		var topL = graphics3D.boxFronts[graphics3D.boxFronts.length - 1].loc[1];
		while(this.collides(this.origX + p.worldX - 5, topL)) {
			topL ++;
		}
		var topR = graphics3D.boxFronts[graphics3D.boxFronts.length - 1].loc[1];
		while(this.collides(this.origX + p.worldX + 5, topR)) {
			topR ++;
		}
	}
	graphics3D.polygon3D("rgb(110, 110, 110)", "rgb(150, 150, 150)", 0.9, 1.1, [
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
	/* hitbox */
	collisions.line(p1.x + this.x + p.worldX, p1.y + this.y + p.worldY, p2.x + this.x + p.worldX, p2.y + this.y + p.worldY, {walls: [true, true, true, true], illegalHandling: "teleport"});
	if(p.x > p1.x + this.x + p.worldX && p.x < -p1.x + this.x + p.worldX && !p.canJump && p.onGroundBefore && p.velY >= 0 && Math.abs(this.x - this.origX) < 3 && Math.abs(this.y - this.origY) < 3) {
		while(!p.canJump && false) {
			p.y ++;
			collisions.line(p1.x + this.x + p.worldX, p1.y + this.y + p.worldY, p2.x + this.x + p.worldX, p2.y + this.y + p.worldY, {walls: [true, true, true, true], illegalHandling: "teleport"});
		}
	}
	/* tilting */
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
	/* falling */
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
};
Bridge.prototype.exist = function() {
	/* hitbox */
	collisions.collisions.push(new CollisionCircle(this.x, this.y + 500, 500));
	/* graphics - top bridge surface */
	var topB = graphics3D.point3D(this.x + p.worldX, this.y + p.worldY + 500, 0.9);
	var topF = graphics3D.point3D(this.x + p.worldX, this.y + p.worldY + 500, 1.1);
	c.fillStyle = "rgb(150, 150, 150)";
	c.save(); {
		c.beginPath();
		c.circle(topF.x, topF.y, 500 * 1.1);
		c.invertPath();
		c.clip("evenodd");
		c.fillCircle(topB.x, topB.y, 500 * 0.9);
	} c.restore();
	c.fillStyle = "rgb(110, 110, 110)";
	c.fillCircle(topF.x, topF.y, 500 * 1.1);
	c.fillStyle = "rgb(150, 150, 150)";
	c.strokeStyle = "rgb(150, 150, 150)";
	c.lineWidth = 4;
	/* graphics - arches */
	for(var x = this.x + p.worldX - 200; x <= this.x + p.worldX + 200; x += 200) {
		var archWidth = (x === this.x + p.worldX) ? 150 : 100;
		var y = (x === this.x + p.worldX) ? this.y + p.worldY + 200 : this.y + p.worldY + 250;
		var centerBack = graphics3D.point3D(x, y, 0.9);
		var leftBack = graphics3D.point3D(x - (archWidth / 2), y, 0.9);
		var rightBack = graphics3D.point3D(x + (archWidth / 2), y, 0.9);
		var centerFront = graphics3D.point3D(x, y, 1.1);
		var leftFront = graphics3D.point3D(x - (archWidth / 2), y, 1.1);
		var rightFront = graphics3D.point3D(x + (archWidth / 2), y, 1.1);
		c.save(); {
			/* clip so it draws only inside the front arch */
			c.beginPath();
			c.line(leftFront.x, centerBack.y + 10000, leftFront.x, centerFront.y);
			c.arc(centerFront.x, centerFront.y, (archWidth / 2 * 1.1), Math.rad(180), Math.rad(360));
			c.line(rightFront.x, centerFront.y, rightFront.x, centerBack.y + 10000);
			c.stroke();
			c.clip();

			/* draw the back of the arch inverted */
			c.beginPath();
			c.line(leftBack.x, centerBack.y + 10000, leftBack.x, centerBack.y);
			c.arc(centerBack.x, centerBack.y, (archWidth / 2 * 0.9), Math.rad(180), Math.rad(360));
			c.line(rightBack.x, centerBack.y, rightBack.x, centerBack.y + 10000);
			c.invertPath();
			c.fill("evenodd");
		} c.restore();
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
	/* graphics */
	for(var y = this.y; y >= this.y - 200; y -= 50) {
		graphics3D.cube(this.x + p.worldX - 100, y + p.worldY - 10, 200, 10, 0.9, 1, "rgb(139, 69, 19)", "rgb(159, 89, 39)");
		collisions.rect(this.x + p.worldX - 100, y + p.worldY - 10, 200, 10, {walls: [true, false, false, false]});
	}
	for(var i = 0; i < this.books.length; i ++) {
		break;
		graphics3D.cube(this.books[i].x + this.x + p.worldX - 80, this.y + p.worldY - this.books[i].y, 10, 40, 0.9, 1, this.books[i].color, this.books[i].color);
	}
	graphics3D.cube(this.x + p.worldX - 100, this.y + p.worldY - 210, 10, 210, 0.9, 1, "rgb(139, 69, 19)", "rgb(159, 89, 39)");
	graphics3D.cube(this.x + p.worldX + 90, this.y + p.worldY - 210, 10, 210, 0.9, 1, "rgb(139, 69, 19)", "rgb(159, 89, 39)");
};
function Chandelier(x, y) {
	this.x = x;
	this.y = y;
	this.points = [];
	var pts = Math.findPointsCircular(0, 0, 100);
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
	/*
	this function breaks the graphics into multiple sub-functions so that they can be called in different orders depending on perspective.
	*/
	this.topDisc = function() {
		c.fillStyle = "rgb(110, 110, 110)";
		c.beginPath();
		for(var i = 0; i < this.points.length; i ++) {
			var point = graphics3D.point3D(this.points[i].x + p.worldX, this.points[i].y + p.worldY, this.points[i].z);
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
				var point = graphics3D.point3D(this.points[j].x + p.worldX, this.points[j].y + p.worldY, this.points[j].z);
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
		c.save(); {
			c.translate(0, 20);
			this.topDisc();
		} c.restore();
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
				var edge = graphics3D.point3D(this.points[indexes[i].index].x + p.worldX, this.points[indexes[i].index].y + p.worldY, this.points[indexes[i].index].z);
				c.strokeStyle = "rgb(139, 69, 19)";
				c.beginPath();
				c.moveTo(this.x + p.worldX, this.y + p.worldY - 600);
				c.lineTo(edge.x, edge.y);
				c.stroke();
			}
			else {
				graphics3D.cube(p.worldX + this.points[indexes[i].index].x - 5, p.worldY + this.points[indexes[i].index].y - 10, 10, 10, this.points[indexes[i].index].z - 0.01, this.points[indexes[i].index].z + 0.01, null, null);
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
		collisions.rect(this.x + p.worldX - 72, this.y + p.worldY - 150, 144, 3, {walls: [true, false, false, false]});
		collisions.rect(this.x + p.worldX - 54, this.y + p.worldY - 300, 108, 3, {walls: [true, false, false, false]});
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
	collisions.rect(this.x + p.worldX - 100, this.y + p.worldY, 200, 20);
};
function Table(x, y) {
	this.x = x;
	this.y = y;
};
Table.prototype.exist = function() {
	graphics3D.cube(this.x + p.worldX - 50, this.y + p.worldY - 40, 10, 40, 0.9, 0.92, "rgb(139, 69, 19)", "rgb(159, 89, 39)", {noFrontExtended: true} );
	graphics3D.cube(this.x + p.worldX - 50, this.y + p.worldY - 40, 10, 40, 0.98, 1, "rgb(139, 69, 19)", "rgb(159, 89, 39)");
	graphics3D.cube(this.x + p.worldX + 40, this.y + p.worldY - 40, 10, 40, 0.9, 0.92, "rgb(139, 69, 19)", "rgb(159, 89, 39)", {noFrontExtended: true} );
	graphics3D.cube(this.x + p.worldX + 40, this.y + p.worldY - 40, 10, 40, 0.98, 1, "rgb(139, 69, 19)", "rgb(159, 89, 39)");
	graphics3D.cube(this.x + p.worldX - 50, this.y + p.worldY - 40, 100, 10, 0.9, 1, "rgb(139, 69, 19)", "rgb(159, 89, 39)");
};
function Chair(x, y, dir) {
	this.x = x;
	this.y = y;
	this.dir = dir;
};
Chair.prototype.exist = function() {
	graphics3D.cube(this.x + p.worldX - 25, this.y + p.worldY - 30, 10, 30, 0.98, 1, "rgb(139, 69, 19)", "rgb(159, 89, 39)");
	graphics3D.cube(this.x + p.worldX + 15, this.y + p.worldY - 30, 10, 30, 0.98, 1, "rgb(139, 69, 19)", "rgb(159, 89, 39)");
	graphics3D.cube(this.x + p.worldX - 25, this.y + p.worldY - 30, 10, 30, 0.9, 0.92, "rgb(139, 69, 19)", "rgb(159, 89, 39)", {noFrontExtended: true} );
	graphics3D.cube(this.x + p.worldX + 15, this.y + p.worldY - 30, 10, 30, 0.9, 0.92, "rgb(139, 69, 19)", "rgb(159, 89, 39)", {noFrontExtended: true} );
	graphics3D.cube(this.x + p.worldX - 25, this.y + p.worldY - 30, 50, 10, 0.9, 1, "rgb(139, 69, 19)", "rgb(159, 89, 39)");
	graphics3D.cube(this.x + p.worldX + ((this.dir === "right") ? -25 : 15), this.y + p.worldY - 60, 10, 35, 0.9, 1, "rgb(139, 69, 19)", "rgb(159, 89, 39)");
};
function SpikeBall(x, y, dir) {
	/*
	Used for the unimplemented mace weapon.
	*/
	this.x = x;
	this.y = y;
	this.dir = dir;
	this.velX = 0;
	this.velY = 0;
};
SpikeBall.prototype.exist = function() {
	c.fillStyle = "rgb(60, 60, 60)";
	c.strokeStyle = "rgb(60, 60, 60)";
	/* graphics - chain */
	if(Math.distSq(this.x + p.worldX, this.y + p.worldY, p.x + 20, p.y + 26) > 400) {
		var line = Math.findPointsLinear(this.x + p.worldX, this.y + p.worldY, p.x + 20, p.y + 26);
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
		c.save(); {
			c.lineWidth = 1;
			for(var i = 0; i < line.length; i += interval) {
				c.fillCircle(line[Math.floor(i)].x, line[Math.floor(i)].y, 5);
			}
		} c.restore();
	}
	/* graphics - spikeball */
	c.save(); {
		c.translate(this.x + p.worldX, this.y + p.worldY);
		c.fillCircle(0, 0, 10);
		for(var r = 0; r < 360; r += (360 / 6)) {
			c.save(); {
				c.rotate(Math.rad(r + (this.x + this.y)));
				c.beginPath();
				c.moveTo(-5, 0);
				c.lineTo(5, 0);
				c.lineTo(0, -20);
				c.fill();
			} c.restore();
		}
	} c.restore();
	/* movement */
	this.x += this.velX;
	this.y += this.velY;
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
	/*
	Never actually displayed in-game. Selects one of the specific types of decorations to display.
	*/
	this.x = x;
	this.y = y;
	this.type = null;
};
Decoration.prototype.exist = function() {
	if(this.type === null) {
		/* find self in the current room */
		var selfIndex = null;
		for(var i = 0; i < game.dungeon[game.theRoom].content.length; i ++) {
			if(game.dungeon[game.theRoom].content[i] instanceof Decoration) {
				selfIndex = i;
				break;
			}
		}
		/* find other decorations to copy */
		var resolved = false;
		for(var i = 0; i < game.dungeon[game.theRoom].content.length; i ++) {
			if(game.dungeon[game.theRoom].content[i] instanceof Torch) {
				game.dungeon[game.inRoom].content[selfIndex] = new Torch(this.x, this.y, game.dungeon[game.theRoom].content[i].color);
				game.dungeon[game.inRoom].content[selfIndex].lit = true;
				resolved = true;
				break;
			}
			else if(game.dungeon[game.theRoom].content[i] instanceof Banner) {
				game.dungeon[game.inRoom].content[selfIndex] = new Banner(this.x, this.y - 30, game.dungeon[game.theRoom].content[i].color);
				resolved = true;
				break;
			}
			else if(game.dungeon[game.theRoom].content[i] instanceof GlassWindow) {
				game.dungeon[game.inRoom].content[selfIndex] = new GlassWindow(this.x, this.y, game.dungeon[game.theRoom].content[i].color);
				resolved = true;
				break;
			}
		}
		/* randomize decoration if none other to mimic */
		if(!resolved) {
			var chooser = Math.random();
			if(chooser < 0.33) {
				game.dungeon[game.theRoom].content[selfIndex] = new Torch(this.x, this.y);
				game.dungeon[game.theRoom].content[selfIndex].lit = true;
			}
			else if(chooser < 0.66) {
				game.dungeon[game.theRoom].content[selfIndex] = new Banner(this.x, this.y - 30);
			}
			else {
				game.dungeon[game.theRoom].content[selfIndex] = new GlassWindow(this.x, this.y, game.dungeon[game.theRoom].colorScheme);
			}
		}
	}
};
function Banner(x, y, color) {
	this.x = x;
	this.y = y;
	this.color = color;
	this.graphic = null;
};
Banner.prototype.exist = function() {
	if(this.color === undefined || this.color === "?") {
		for(var i = 0; i < game.dungeon[game.theRoom].content.length; i ++) {
			if(game.dungeon[game.theRoom].content[i] instanceof Banner && game.dungeon[game.theRoom].content[i].color !== undefined && game.dungeon[game.theRoom].content[i].color !== "?") {
				this.color = game.dungeon[game.theRoom].content[i].color;
				break;
			}
		}
		if(this.color === undefined || this.color === "?") {
			this.color = game.dungeon[game.theRoom].colorScheme;
		}
	}
	if(this.graphic === null) {
		for(var i = 0; i < game.dungeon[game.theRoom].content.length; i ++) {
			if(game.dungeon[game.theRoom].content[i] instanceof Banner && game.dungeon[game.theRoom].content[i].graphic !== null) {
				this.graphic = game.dungeon[game.theRoom].content[i].graphic;
				break;
			}
		}
		if(this.graphic === null) {
			var chooser = Math.random();
			if(chooser < 0.5) {
				this.graphic = "gradient";
			}
			else {
				this.graphic = "border";
			}
		}
		if(TESTING_MODE) {
			this.graphic = "border";
		}
	}
	var p1 = graphics3D.point3D(this.x + p.worldX - 20, this.y + p.worldY - 40, 0.9);
	var p2 = graphics3D.point3D(this.x + p.worldX - 20, this.y + p.worldY + 45, 0.9);
	var p3 = graphics3D.point3D(this.x + p.worldX, this.y + p.worldY + 35, 0.9);
	var p4 = graphics3D.point3D(this.x + p.worldX + 20, this.y + p.worldY + 45, 0.9);
	var p5 = graphics3D.point3D(this.x + p.worldX + 20, this.y + p.worldY - 40, 0.9);
	var color1, color2;
	if(this.color === "green") {
		color1 = "rgb(0, 150, 0)";
		color2 = "rgb(50, 201, 50)";
	}
	else if(this.color === "blue") {
		color1 = "rgb(46, 102, 255)";
		color2 = "rgb(106, 152, 255)";
	}
	else if(this.color === "red") {
		color1 = "rgb(128, 0, 0)";
		color2 = "rgb(178, 50, 50)";
	}
	if(this.graphic === "gradient") {
		var center = graphics3D.point3D(this.x, this.y - 50, 0.9)
		var gradient = c.createLinearGradient(center.x, p1.y, center.x, p3.y);
		gradient.addColorStop(0, color1);
		gradient.addColorStop(1, color2);
		c.fillStyle = gradient;
		c.fillPoly(p1, p2, p3, p4, p5);
	}
	else if(this.graphic === "border") {
		c.fillStyle = color1;
		c.fillPoly(p1, p2, p3, p4, p5);

		var center = graphics3D.point3D(this.x + p.worldX, this.y + p.worldY, 0.9);
		p1 = Math.scale(p1.x, p1.y, 0.7, center.x, center.y);
		p2 = Math.scale(p2.x, p2.y, 0.7, center.x, center.y);
		p3 = Math.scale(p3.x, p3.y, 0.7, center.x, center.y);
		p4 = Math.scale(p4.x, p4.y, 0.7, center.x, center.y);
		p5 = Math.scale(p5.x, p5.y, 0.7, center.x, center.y);

		c.fillStyle = color2;
		c.fillPoly(p1, p2, p3, p4, p5);
	}
	graphics3D.cube(this.x + p.worldX - 30, this.y + p.worldY - 50, 60, 10, 0.9, 0.92, "rgb(139, 69, 19)", "rgb(159, 89, 39)", { noFrontExtended: true });
};
function GlassWindow(x, y, color) {
	this.x = x;
	this.y = y;
	this.color = color;
};
GlassWindow.prototype.exist = function() {
	game.dungeon[game.theRoom].background = "plain";
	c.save(); {
		var center = graphics3D.point3D(this.x + p.worldX, this.y + p.worldY, 0.9);
		/* delete bricks behind window */
		c.beginPath();
		c.rect(center.x - 25, center.y - 100, 50, 100);
		c.circle(center.x, center.y - 100, 25);
		c.clip();
		c.fillStyle = "rgb(100, 100, 100)";
		c.fillRect(0, 0, 800, 800);
		/* background */
		graphics3D.cube(this.x + p.worldX - 40, this.y + p.worldY - 200, 20, 190, 0.72, 0.78, null, null, { noFrontExtended: true });
		graphics3D.cube(this.x + p.worldX + 20, this.y + p.worldY - 200, 20, 190, 0.72, 0.78, null, null, { noFrontExtended: true });
		graphics3D.cube(this.x + p.worldX - 200, this.y + p.worldY - 10, 400, 100, 0.7, 0.8, null, null, { noFrontExtended: true });
		graphics3D.cube(this.x + p.worldX - 40, this.y + p.worldY - 200, 20, 190, 0.78, 0.78, null, null, { noFrontExtended: true });
		graphics3D.cube(this.x + p.worldX + 20, this.y + p.worldY - 200, 20, 190, 0.78, 0.78, null, null, { noFrontExtended: true });
		/* cross patterns */
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
			c.strokeLine(center.x - 25, center.y + y, center.x + 25, center.y + y + 50);
			c.strokeLine(center.x + 25, center.y + y, center.x - 25, center.y + y + 50);
		}
		/* window */
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
	} c.restore();
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
		graphics3D.cube(-100, this.y + p.worldY - 1100, 1000, 1000, 0.9, 1.1);
		collisions.rect(-100, this.y + p.worldY - 1100, 1000, 1000);
	}
	else if(this.type === "sloped") {
		graphics3D.polygon3D("rgb(110, 110, 110)", "rgb(150, 150, 150)", 0.9, 1.1, [
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
		collisions.line(this.x + p.worldX - this.w, this.y + p.worldY, this.x + p.worldX - (this.w / 3), this.y + p.worldY - 100);
		collisions.line(this.x + p.worldX + this.w, this.y + p.worldY, this.x + p.worldX + (this.w / 3), this.y + p.worldY - 100);
		collisions.rect(this.x + p.worldX - this.w, this.y + p.worldY - 200, 2 * this.w, 100);
	}
	else if(this.type === "curved") {
		if(this.points === undefined) {
			this.points = Math.findPointsCircular(0, 0, this.w, [4, 1]);
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
			collisions.line(array[i].x, array[i].y, array[i - 1].x, array[i - 1].y);
		}
		array.splice(0, 0, {x: -100, y: -100}, {x: -100, y: this.y + p.worldY}, {x: this.x + p.worldX - this.w, y: this.y + p.worldY});
		array.push({x: this.x + p.worldX + this.w, y: this.y + p.worldY});
		array.push({x: 900, y: this.y + p.worldY});
		array.push({x: 900, y: -100});
		graphics3D.polygon3D("rgb(110, 110, 110)", "rgb(150, 150, 150)", 0.9, 1.1, array);
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
	c.save(); {
		var center = graphics3D.point3D(this.x + p.worldX, this.y + p.worldY, 0.92);
		c.fillStyle = "red";
		c.beginPath();
		c.rect(center.x - (50 * 0.92), 0, (100 * 0.92), canvas.height);
		c.clip();
		/* water slot */
		graphics3D.cutoutRect(this.x + p.worldX - 50, this.y + p.worldY - 160, 100, 10, "rgba(0, 0, 0, 0)", "rgba(150, 150, 150)", 0.8, 0.9);
		/* water */
		graphics3D.cube(this.x + p.worldX - 50, this.y + p.worldY - 150, 100, 10, 0.8, 0.92, "rgb(100, 100, 255)", "rgb(100, 100, 255)", { noFrontExtended: true });
		graphics3D.cube(this.x + p.worldX - 50, this.y + p.worldY - 150, 100, 150, 0.9, 0.92, "rgba(100, 100, 255, 0)", "rgb(100, 100, 255)", { noFrontExtended: true });
		for(var i = 0; i < this.waterAnimations.length; i ++) {
			var topY = this.waterAnimations[i].y;
			var bottomY = this.waterAnimations[i].y + 50;
			if(this.waterAnimations[i].y < 50) {
				/* all on horizontal section of waterfall */
				var p1 = graphics3D.point3D(this.x + p.worldX + this.waterAnimations[i].x, this.y + p.worldY - 150, Math.map(topY, 0, 100, 0.8, 0.92));
				var p2 = graphics3D.point3D(this.x + p.worldX + this.waterAnimations[i].x, this.y + p.worldY - 150, Math.map(bottomY, 0, 100, 0.8, 0.92));
				c.strokeStyle = "rgb(120, 120, 255)";
				c.lineWidth = 3;
				c.strokeLine(p1, p2);
			}
			else if(this.waterAnimations[i].y > 50 && this.waterAnimations[i].y <= 100) {
				/* runs over the corner - only display the upper section before the waterfall front */
				var p1 = graphics3D.point3D(this.x + p.worldX + this.waterAnimations[i].x, this.y + p.worldY - 150, Math.map(topY, 0, 100, 0.8, 0.92));
				var corner = graphics3D.point3D(this.x + p.worldX + this.waterAnimations[i].x, this.y + p.worldY - 150, 0.92);
				c.strokeStyle = "rgb(120, 120, 255)";
				c.lineWidth = 3;
				c.strokeLine(p1, corner);
			}
		}
		/* water animation */
		graphics3D.cube(this.x + p.worldX - 50, this.y + p.worldY - 150, 100, 150, 0.9, 0.92, "rgb(100, 100, 255)", "rgb(100, 100, 255)", { noFrontExtended: true });
		if(utilities.frameCount % 10 === 0) {
			this.waterAnimations.push( {x: Math.random() * 100 - 50, y: -50} );
		}
		c.save(); {
			c.lineCap = "round";
			for(var i = 0; i < this.waterAnimations.length; i ++) {
				this.waterAnimations[i].y += 3;
				var topY = this.waterAnimations[i].y < 0 ? 0 : this.waterAnimations[i].y;
				var bottomY = this.waterAnimations[i].y + 50;
				if(topY < 100 && bottomY > 100) {
					/* runs over the corner - only display the lower section after the waterfall front */
					var corner = graphics3D.point3D(this.x + p.worldX + this.waterAnimations[i].x, this.y + p.worldY - 150, 0.92);
					var p2 = graphics3D.point3D(this.x + p.worldX + this.waterAnimations[i].x, this.y + p.worldY - 150 + (bottomY - 100), 0.92);
					c.strokeStyle = "rgb(120, 120, 255)";
					c.lineWidth = 3;
					c.strokeLine(corner, p2);
				}
				else if(topY > 100) {
					/* all on front of the waterfall */
					var p1 = graphics3D.point3D(this.x + p.worldX + this.waterAnimations[i].x, this.y + p.worldY - 150 + (topY - 100), 0.92);
					var p2 = graphics3D.point3D(this.x + p.worldX + this.waterAnimations[i].x, this.y + p.worldY - 150 + (bottomY - 100), 0.92);
					c.strokeStyle = "rgb(120, 120, 255)";
					c.lineWidth = 3;
					c.strokeLine(p1, p2);
				}
				if(topY > 250) {
					this.waterAnimations.splice(i, 1);
					i --;
					continue;
				}
			}
		} c.restore();
	} c.restore();
	/* base */
	graphics3D.cube(this.x + p.worldX - 100, this.y + p.worldY - 50, 10, 50, 0.9, 1);
	graphics3D.cube(this.x + p.worldX + 90, this.y + p.worldY - 50, 10, 50, 0.9, 1);
	graphics3D.cube(this.x + p.worldX - 100, this.y + p.worldY - 50, 200, 50, 0.98, 1);
};
function Gear(x, y, size, dir) {
	this.x = x;
	this.y = y;
	this.size = size;
	this.dir = dir;
	this.rot = 0;
	this.largeArr = Math.findPointsCircular(0, 0, this.size);
	this.smallArr = [];
	for(var i = 0; i < this.largeArr.length; i ++) {
		this.smallArr.push({
			x: this.largeArr[i].x * 0.8,
			y: this.largeArr[i].y * 0.8
		});
	}
};
Gear.prototype.exist = function() {
	var centerB = graphics3D.point3D(this.x + p.worldX, this.y + p.worldY, 0.95);
	var centerF = graphics3D.point3D(this.x + p.worldX, this.y + p.worldY, 1.05);
	/* sides */
	var gearType = "inside";
	c.fillStyle = "rgb(150, 150, 150)";
	for(var r = this.rot; r < this.rot + 360; r += 3) {
		var rotation = r;
		rotation = rotation.mod(360);
		if((rotation - this.rot) % 30 === 0) {
			gearType = (gearType === "inside") ? "outside" : "inside";
		}
		var next = r + 3;
		next = next.mod(360);
		if(gearType === "inside") {
			if((next - this.rot) % 30 !== 0) {
				var currentIndex = Math.floor(rotation / 360 * (this.smallArr.length - 1));
				var nextIndex = Math.floor(next / 360 * (this.smallArr.length - 1));
				var current = this.smallArr[currentIndex];
				var next = this.smallArr[nextIndex];
				c.fillPoly(
					{ x: centerF.x + current.x, y: centerF.y + current.y },
					{ x: centerB.x + current.x, y: centerB.y + current.y },
					{ x: centerB.x + next.x, y: centerB.y + next.y },
					{ x: centerF.x + next.x, y: centerF.y + next.y }
				);
				collisions.line(
					this.x + p.worldX + current.x, this.y + p.worldY + current.y,
					this.x + p.worldX + next.x, this.y + p.worldY + next.y,
					{ moving: true }
				);
			}
			else {
				var currentIndex = Math.floor(rotation / 360 * (this.smallArr.length - 1));
				var nextIndex = Math.floor(next / 360 * (this.largeArr.length - 1));
				var current = this.smallArr[currentIndex];
				var next = this.largeArr[nextIndex];
				c.fillPoly(
					{ x: centerF.x + current.x, y: centerF.y + current.y },
					{ x: centerB.x + current.x, y: centerB.y + current.y },
					{ x: centerB.x + next.x, y: centerB.y + next.y },
					{ x: centerF.x + next.x, y: centerF.y + next.y }
				);
				collisions.line(
					this.x + p.worldX + current.x, this.y + p.worldY + current.y,
					this.x + p.worldX + next.x, this.y + p.worldY + next.y,
					{ moving: true, extraBouncy: (next.x < this.size * 0.8) }
				);
			}
		}
		else {
			if((next - this.rot) % 30 !== 0) {
				var currentIndex = Math.floor(rotation / 360 * (this.largeArr.length - 1));
				var nextIndex = Math.floor(next / 360 * (this.largeArr.length - 1));
				var current = this.largeArr[currentIndex];
				var next = this.largeArr[nextIndex];
				c.fillPoly(
					{ x: centerF.x + current.x, y: centerF.y + current.y },
					{ x: centerB.x + current.x, y: centerB.y + current.y },
					{ x: centerB.x + next.x, y: centerB.y + next.y },
					{ x: centerF.x + next.x, y: centerF.y + next.y }
				);
				collisions.line(
					this.x + p.worldX + current.x, this.y + p.worldY + current.y,
					this.x + p.worldX + next.x, this.y + p.worldY + next.y,
					{ moving: true }
				);
			}
			else {
				var currentIndex = Math.floor(rotation / 360 * (this.largeArr.length - 1));
				var nextIndex = Math.floor(next / 360 * (this.smallArr.length - 1));
				var current = this.largeArr[currentIndex];
				var next = this.smallArr[currentIndex];
				c.fillPoly(
					{ x: centerF.x + current.x, y: centerF.y + current.y },
					{ x: centerB.x + current.x, y: centerB.y + current.y },
					{ x: centerB.x + next.x, y: centerB.y + next.y },
					{ x: centerF.x + next.x, y: centerF.y + next.y }
				);
				collisions.line(
					this.x + p.worldX + current.x, this.y + p.worldY + current.y,
					this.x + p.worldX + next.x, this.y + p.worldY + next.y,
					{ moving: true, extraBouncy: (current.x < this.size * 0.8) }
				);
			}
		}
	}
	/* front face */
	c.beginPath();
	c.fillStyle = "rgb(110, 110, 110)";
	gearType = "inside";
	for(var r = this.rot; r <= this.rot + 360; r += 3) {
		var rotation = r;
		rotation = rotation.mod(360);
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
		collisions.rect(this.x + p.worldX, this.y + p.worldY, this.w, this.h);
	}
	if(this.z > 0.9) {
		var color = Math.map(this.z, 0.9, 1.1, 100, 110);
		color = (color > 110) ? 110 : color;
		graphics3D.cube(this.x + p.worldX, this.y + p.worldY, this.w, this.h, 0.9, this.z, "rgb(" + color + ", " + color + ", " + color + ")", "rgb(150, 150, 150)");
	}
	this.z += this.zDir;
	this.z = Math.max(0.9, this.z);
	this.z = Math.min(1.1, this.z);
};

/** ROOM DATA **/
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
	graphics3D.boxFronts = [];
	graphics3D.extraGraphics = [];
	debugging.hitboxes = [];
	collisions.collisions = [];
	var chestIndexes = [];
	var boulderIndexes = [];
	var chargeIndexes = [];
	p.canUseEarth = true;
	/* testing */
	for(var i = 0; i < this.content.length; i ++) {
		if(this.content[i] instanceof Enemy) {
			//this.content[i].health = this.content[i].maxHealth;
			// this.content.splice(i, 1);
		}
	}
	/* load all types of items */
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
			c.save(); {
				c.globalAlpha = (this.content[i].opacity < 0) ? 0 : this.content[i].opacity;
				c.translate(this.content[i].x + p.worldX, this.content[i].y + p.worldY);
				c.beginPath();
				c.rect(this.content[chestIndex].x - 50 - (this.content[i].x), this.content[chestIndex].y - 1000 - (this.content[i].y), 100, 1000);
				c.clip();
				this.content[i].display("item");
			} c.restore();
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
			c.globalAlpha = Math.max(0, this.content[i].opacity);
			this.content[i].exist("player");
			c.globalAlpha = 1;
			/* simple enemy attack */
			if(this.content[i].x + p.worldX + this.content[i].rightX > p.x - 5 && this.content[i].x + p.worldX + this.content[i].leftX < p.x + 5 && this.content[i].y + p.worldY + this.content[i].bottomY > p.y - 5 && this.content[i].y + p.worldY + this.content[i].topY < p.y + 46 && this.content[i].attackRecharge < 0 && !this.content[i].complexAttack && this.content[i].timePurified <= 0) {
				this.content[i].attackRecharge = 45;
				var damage = Math.random() * (this.content[i].damHigh - this.content[i].damLow) + this.content[i].damLow;
				p.hurt(damage, this.content[i].name);
			}
			/* remove dead enemies */
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
			/* show hitboxes */
			if(SHOW_HITBOXES) {
				debugging.hitboxes.push({x: this.content[i].x + p.worldX + this.content[i].leftX, y: this.content[i].y + p.worldY + this.content[i].topY, w: (this.content[i].rightX + Math.abs(this.content[i].leftX)), h: (this.content[i].bottomY + Math.abs(this.content[i].topY)), color: "green"});
			}
		}
		else if(this.content[i] instanceof ShotArrow) {
			this.content[i].exist();
			if(SHOW_HITBOXES) {
				debugging.hitboxes.push({x: this.content[i].x + p.worldX - 1, y: this.content[i].y + p.worldY - 1, w: 2, h: 2, color: "green"});
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
	graphics3D.loadBoxFronts();
	/* load magic charges */
	for(var i = 0; i < chargeIndexes.length; i ++) {
		this.content[chargeIndexes[i]].exist();
	}
	/* load boulders */
	for(var i = 0; i < boulderIndexes.length; i ++) {
		this.content[boulderIndexes[i]].exist();
	}
	/* Collisions */
	if(game.inRoom === index) {
		p.canJump = false;
		for(var i = 0; i < collisions.collisions.length; i ++) {
			collisions.collisions[i].collide();
		}
	}
	/* show hitboxes */
	for(var i = 0; i < debugging.hitboxes.length; i ++) {
		if(debugging.hitboxes[i].color === "light blue") {
			c.strokeStyle = "rgb(0, " + (Math.sin(utilities.frameCount / 30) * 30 + 225) + ", " + (Math.sin(utilities.frameCount / 30) * 30 + 225) + ")";
		}
		else if(debugging.hitboxes[i].color === "dark blue") {
			c.strokeStyle = "rgb(0, 0, " + (Math.sin(utilities.frameCount / 30) * 30 + 225) + ")";
		}
		else if(debugging.hitboxes[i].color === "green") {
			c.strokeStyle = "rgb(0, " + (Math.sin(utilities.frameCount / 30) * 30 + 225) + ", 0)";
		}
		c.strokeRect(debugging.hitboxes[i].x, debugging.hitboxes[i].y, debugging.hitboxes[i].w, debugging.hitboxes[i].h);
	}
	/* fading transitions between rooms */
	c.fillStyle = "rgb(0, 0, 0)";
	if(p.screenOp < 0) {
		p.screenOp = 0;
		p.exitingDoor = false;
	}
	c.globalAlpha = Math.max(p.screenOp, p.fallOp);
	c.fillRect(0, 0, 800, 800);
	c.fillStyle = "rgb(255, 0, 0)";
	c.globalAlpha = Math.max(0, p.damOp);
	c.fillRect(0, 0, 800, 800);
};
Room.prototype.displayBackground = function() {
	if(this.background === "bricks") {
		c.save(); {
			c.translate((p.worldX * 0.9) % 100, (p.worldY * 0.9) % 100);
			c.strokeStyle = "rgb(110, 110, 110)";
			c.lineWidth = 4;
			for(var y = -100; y < 900; y += 50) {
				c.strokeLine(-100, y, 900, y);
				for(var x = (y % 100 === 0) ? -100 : -50; x < 900; x += 100) {
					c.strokeLine(x, y, x, y + 50);
				}
			}
		} c.restore();
	}
};
Room.prototype.displayShadowEffect = function() {
	var gradient = c.createRadialGradient(400, 400, 0, 400, 400, 600);
	c.globalAlpha = 1;
	gradient.addColorStop(0, "rgba(0, 0, 0, 0)");
	gradient.addColorStop(1, "rgba(0, 0, 0, 255)");
	c.fillStyle = gradient;
	c.fillRect(0, 0, 800, 800);
};


/** ITEMS **/
function Item() {
	this.location = null;
	this.initialized = false;
	this.mode = "visual"; // the mode of the item - "visual" for when it is coming out of a chest and "held" if it is in the inventory.
};
Item.prototype.init = function() {
	for(var i = 0; i < game.dungeon[game.inRoom].content.length; i ++) {
		if(game.dungeon[game.inRoom].content[i].requestingItem && game.dungeon[game.inRoom].content[i] instanceof Chest) {
			this.x = game.dungeon[game.inRoom].content[i].x;
			this.y = game.dungeon[game.inRoom].content[i].y - 10;
			game.dungeon[game.inRoom].content[i].requestingItem = false;
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
	/* add special stat text for elemental weapons */
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
			content: "Enhanced with the power of " + ((this.element === "fire" || this.element === "water") ?
			((this.element === "fire") ? "flame." : "ice.") :
			((this.element === "earth") ? "stone." : "wind.")),
			font: "10pt Cursive",
			color: "rgb(150, 150, 150)"
		});
	}
	/* out-of-class warning info */
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
	/* calculate text height for description */
	var textY = 0;
	c.globalAlpha = 0;
	for(var i = 0; i < this.desc.length; i ++) {
		c.font = this.desc[i].font;
		textY = c.displayTextOverLines(this.desc[i].content, x + 15, textY + 12, 190, 12);
	}
	c.globalAlpha = 1;
	var descHeight = textY + 10;
	var idealY = y - (descHeight / 2);
	var textBoxY = Math.constrain(idealY, 20, 780 - (descHeight / 2));
	if(dir === "right") {
		/* display text box */
		c.textAlign = "left";
		var textY = 0;
		c.fillStyle = "rgb(59, 67, 70)";
		c.fillPoly(x, y, x + 10, y - 10, x + 10, y + 10);
		c.fillRect(x + 10, textBoxY, 190, descHeight);

		textY = textBoxY + 4;
		/* display the text */
		for(var i = 0; i < this.desc.length; i ++) {
			c.font = this.desc[i].font;
			c.fillStyle = this.desc[i].color;
			textY = c.displayTextOverLines(this.desc[i].content, x + 15, textY + 12, 190, 12);
		}
	}
	else {
		/* text box */
		c.fillStyle = "rgb(59, 67, 70)";
		c.fillPoly(x, y, x - 10, y - 10, x - 10, y + 10);
		c.fillRect(x - 210, textBoxY, 200, descHeight);
		/* text */
		c.textAlign = "left";
		textY = textBoxY + 4;
		for(var i = 0; i < this.desc.length; i ++) {
			c.font = this.desc[i].font;
			c.fillStyle = this.desc[i].color;
			textY = c.displayTextOverLines(this.desc[i].content, x - 205, textY + 12, 190, 12);
		}
	}
};

/* weapons */
function Weapon(modifier) {
	Item.call(this);
	this.equipable = false;
	this.modifier = modifier || "none";
	this.element = "none";
	this.particles = [];
};
Weapon.extends(Item);
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
MeleeWeapon.extends(Weapon);
MeleeWeapon.prototype.attack = function() {
	p.attackingWith = this;
};
function Dagger(modifier) {
	MeleeWeapon.call(this, modifier);
	this.name = "dagger";
	this.damLow = p.class === "warrior" ? 60 : 50;
	this.damHigh = p.class === "warrior" ? 80 : 70;
	this.range = 30;
	this.power = 2;
};
Dagger.extends(MeleeWeapon);
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
		c.rotate(Math.rad(45));
	}
	c.fillPoly(
		/* dagger hilt */
		{ x: -1, y: -3 },
		{ x: 1, y: -3 },
		{ x: 3, y: -10 },
		{ x: -3, y: -10 }
	);
	c.fillStyle = "rgb(255, 255, 255)";
	c.fillPoly(
		/* dagger blade */
		{ x: -3, y: -10 },
		{ x: 3, y: -10 },
		{ x: 0, y: -30 }
	);
};
function Sword(modifier) {
	MeleeWeapon.call(this, modifier);
	this.name = "sword";
	this.damLow = p.class === "warrior" ? 80 : 70;
	this.damHigh = p.class === "warrior" ? 110 : 100;
	this.range = 60;
	this.power = 3;
};
Sword.extends(MeleeWeapon);
Sword.prototype.display = function(type) {
	type = type || "item";
	c.save(); {
		c.globalAlpha = Math.max(this.opacity, 0);
		c.fillStyle = "rgb(139, 69, 19)";
		if(type === "holding" || type === "item") {
			c.translate(-20, 20);
			c.rotate(Math.rad(45));
		}
		c.fillPoly(
			/* sword handle */
			{ x: 0, y: 0 },
			{ x: -5, y: -10 },
			{ x: 5, y: -10 }
		);
		c.fillStyle = "rgb(255, 255, 255)";
		c.fillPoly(
			/* sword blade */
			{ x: -3, y: -10 },
			{ x: 3, y: -10 },
			{ x: 0, y: -60 }
		);
		c.globalAlpha = 1;
	} c.restore();
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
	this.name = "spear";
	this.damLow = p.class === "warrior" ? 80 : 70;
	this.damHigh = p.class === "warrior" ? 110 : 100;
	this.range = 60;
	this.power = 3;
};
Spear.extends(MeleeWeapon);
Spear.prototype.display = function(type) {
	type = type || "item";
	c.save(); {
		if(type !== "attacking") {
			c.translate(-5, 5);
			c.rotate(Math.rad(45));
		}
		else {
			c.translate(0, 5);
			c.scale(1, 1.5);
		}
		c.fillStyle = "rgb(139, 69, 19)";
		c.fillRect(-2, -20, 4, 40);
		c.fillStyle = "rgb(255, 255, 255)";
		c.fillPoly(
			/* pointy part of spear */
			{ x: -6, y: -18 },
			{ x: 0, y: -20 },
			{ x: 6, y: -18 },
			{ x: 0, y: -35 }
		);
	} c.restore();
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
	this.name = "mace";
	this.damLow = 120;
	this.damHigh = 150;
	this.attackSpeed = "slow";
	this.power = 4;
};
Mace.extends(MeleeWeapon);
Mace.prototype.display = function(type) {
	type = type || "item";
	if(type === "item" || type === "holding") {
		c.fillStyle = "rgb(60, 60, 60)";
		c.strokeStyle = "rgb(60, 60, 60)";
		/* spikeball */
		c.fillCircle(10, 0, 10);
		for(var r = 0; r < 360; r += (360 / 6)) {
			c.save(); {
				c.translate(10, 0);
				c.rotate(Math.rad(r));
				c.fillPoly(
					{ x: -5, y: 0 },
					{ x: 5, y: 0 },
					{ x: 0, y: -20 }
				);
			} c.restore();
		}
		/* handle */
		c.save(); {
			c.translate(-20, 0);
			c.rotate(Math.rad(45));
			c.fillRect(-2, -5, 4, 10);
		} c.restore();
		/* chain */
		c.lineWidth = 2;
		c.strokeCircle(-15, -3, 3);
		c.strokeCircle(-10, -6, 3);
		c.strokeCircle(-5, -6, 3);
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
RangedWeapon.extends(Weapon);
function Arrow(quantity) {
	RangedWeapon.call(this);
	this.name = "arrow";
	this.quantity = quantity;
	this.damLow = "depends on what bow you use";
	this.damHigh = "depends on what bow you use";
	this.stackable = true;
};
Arrow.extends(RangedWeapon);
Arrow.prototype.display = function(type) {
	type = type || "item";
	if(type === "item" || type === "holding") {
		c.strokeStyle = "rgb(139, 69, 19)";
		c.lineWidth = 4;
		c.strokeLine(10, -10, -10, 10);
		c.fillStyle = "rgb(255, 255, 255)";
		c.fillPoly(
			{ x: 10, y: -10 },
			{ x: 10, y: -10 + 8 },
			{ x: 20, y: -20 },
			{ x: 10 - 8, y: -10 }
		);
		c.lineWidth = 1;
		c.strokeStyle = "rgb(139, 69, 19)";
		for(var x = 0; x < 10; x += 3) {
			c.strokeLine(-x, x, -x, x + 8);
			c.strokeLine(-x, x, -x - 8, x);
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
	this.name = "bow";
	this.damLow = p.class === "archer" ? 80 : 70;
	this.damHigh = p.class === "archer" ? 110 : 100;
	this.range = "long";
	this.power = 3;
	/*
	ranges: very short (daggers), short (swords), medium (forceful bows), long (bows & forceful longbows), very long (longbows & distant bows), super long (distant longbows)
	*/
};
WoodBow.extends(RangedWeapon);
WoodBow.prototype.display = function(type) {
	type = type || "item";
	if(type === "holding" || type === "item") {
		c.strokeStyle = "rgb(139, 69, 19)";
		c.lineWidth = 4;
		c.strokeArc(-15, 15, 30, Math.rad(270 - 11), Math.rad(360 + 11));
		c.lineWidth = 1;
		c.strokeLine(-20, -17, 17, 20);
	}
	else if(type === "aiming") {
		c.strokeStyle = "rgb(139, 69, 19)";
		c.lineWidth = 4;
		c.strokeArc(-25, 0, 30, Math.rad(-45 - 11), Math.rad(45 + 11));
		c.lineWidth = 1;
		c.strokeLine(-7, -22, -7, 22);
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
	this.name = "bow";
	this.damLow = p.class === "archer" ? 110 : 100;
	this.damHigh = p.class === "archer" ? 130 : 120;
	this.range = "long";
	this.power = 4;
};
MetalBow.extends(RangedWeapon);
MetalBow.prototype.display = function(type) {
	type = type || "item";
	if(type === "holding" || type === "item") {
		c.strokeStyle = "rgb(200, 200, 200)";
		c.lineWidth = 4;
		c.strokeArc(-15, 15, 30, Math.rad(270 - 11), Math.rad(360 + 11));
		c.lineWidth = 1;
		c.strokeLine(-20, -17, 17, 20);
	}
	else if(type === "aiming") {
		c.strokeStyle = "rgb(200, 200, 200)";
		c.lineWidth = 4;
		c.strokeArc(-25, 0, 30, Math.rad(-45 - 11), Math.rad(45 + 11));
		c.lineWidth = 1;
		c.strokeLine(-7, -22, -7, 22);
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
	this.name = "bow";
	this.attackSpeed = "fast";
	this.range = "long";
	this.damLow = (p.class === "archer") ? 70 : 60;
	this.damHigh = (p.class === "archer") ? 100 : 90;
	this.power = 4;
};
MechBow.extends(RangedWeapon);
MechBow.prototype.display = function(type) {
	type = type || "item";
	c.save(); {
		if(type === "aiming") {
			c.translate(-10, 0);
			c.scale(0.9, 0.9);
			c.rotate(Math.rad(45));
		}
		c.strokeStyle = "rgb(200, 200, 200)";
		c.lineWidth = 4;
		c.strokeArc(-5, 5, 23, Math.rad(225 - 11), Math.rad(405 + 11));
		c.lineWidth = 1;
		/* bowstring */
		c.strokeLine(-22, -13, 13, 22);
		/* bowstring holders */
		c.strokeLine(-5, 5, 5, -17);
		c.strokeLine(-5, 5, 17, -5);
		c.fillStyle = "rgb(210, 210, 210)";
		/* 2nd bowstring */
		c.strokeLine(-13, -15, 15, 13);
		/* gears */
		c.save(); {
			c.translate(12, 2);
			c.fillCircle(0, 0, 4);
			for(var r = 0; r <= 360; r += 45) {
				c.save(); {
					c.rotate(Math.rad(r));
					c.fillRect(-1, -6, 2, 6);
				} c.restore();
			}
		} c.restore();
		c.save(); {
			c.translate(-2, -12);
			c.fillCircle(0, 0, 4);
			for(var r = 0; r <= 360; r += 45) {
				c.save(); {
					c.rotate(Math.rad(r));
					c.fillRect(-1, -6, 2, 6);
				} c.restore();
			}
		} c.restore();
	} c.restore();
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
	this.name = "longbow";
	this.range = "very long";
	this.damLow = (p.class === "archer") ? 90 : 80;
	this.damHigh = (p.class === "archer") ? 100 : 90;
	this.power = 5;
};
LongBow.extends(RangedWeapon);
LongBow.prototype.display = function(type) {
	type = type || "item";
	c.save(); {
		if(type === "aiming") {
			c.translate(-10, 0);
			c.scale(0.9, 0.9);
			c.rotate(Math.rad(45));
		}
		c.strokeStyle = "rgb(139, 69, 19)";
		c.lineWidth = 4;
		c.strokeArc(-5, 5, 23, Math.rad(225 - 11), Math.rad(405 + 11));
		c.lineWidth = 1;
		/* bowstring */
		c.strokeLine(-22, -13, 13, 22);
		/* 2nd bowstring */
		c.strokeLine(-13, -15, 15, 13);
	} c.restore();
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
MagicWeapon.extends(Weapon);
function EnergyStaff(modifier) {
	MagicWeapon.call(this, modifier);
	this.name = "staff";
	this.chargeType = "energy";
	this.manaCost = (this.modifier === "none") ? 40 : (this.modifier === "arcane" ? 50 : 30);
	this.damLow = (p.class === "mage") ? 80 : 70; // 47.5 damage average with 1/2 damage nerf
	this.damHigh = (p.class === "mage") ? 110 : 100;
	this.power = 3;
};
EnergyStaff.extends(MagicWeapon);
EnergyStaff.prototype.display = function(type) {
	type = type || "item";
	c.strokeStyle = "rgb(139, 69, 19)";
	c.save(); {
		c.lineWidth = 4;
		if(type === "holding" || type === "item") {
			c.rotate(Math.rad(45));
		}
		c.strokeLine(0, -10, 0, 30);
		c.strokeArc(0, -14, 5, Math.rad(90), Math.rad(180), true);
	} c.restore();
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
	this.name = "staff";
	this.element = "none";
	this.manaCost = (this.modifier === "none") ? 30 : (this.modifier === "arcane" ? 40 : 20);
	this.damLow = (p.class === "mage") ? 60 : 50;
	this.damHigh = (p.class === "mage") ? 90 : 80;
	this.power = 4;
};
ElementalStaff.extends(MagicWeapon);
ElementalStaff.prototype.display = function(type) {
	type = type || "item";
	c.strokeStyle = "rgb(139, 69, 19)";
	c.fillStyle = "rgb(139, 69, 19)";
	c.save(); {
		c.lineWidth = 4;
		if(type === "holding" || type === "item") {
			c.rotate(Math.rad(45));
		}
		/* staff base */
		c.strokeLine(0, -7, 0, 30);

		c.save(); {
			/* cutout in middle of staff */
			c.beginPath();
			c.polygon(
				0, -10,
				7, -17,
				0, -20,
				-7, -17
			);
			c.invertPath();
			c.clip("evenodd");
			/* top of staff (with cutout) */
			c.fillPoly(
				{ x: -7 - 5, y: -17 },
				{ x: 0, y: -20 - 5},
				{ x: 7 + 5, y: -17 },
				{ x: 0, y: -10 + 5 }
			);
		} c.restore();

		/* crystal */
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
		c.polygon(
			0, -10,
			7, -17,
			0, -20,
			-7, -17,
			0, -10
		);
		c.fill();
		c.stroke();

		c.strokeLine(0, -10, 0, -20);
	}
	} c.restore();
	/* update charge type */
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
	this.name = "staff";
	this.hpCost = 30;
	this.damLow = 0;
	this.damHigh = 0;
	this.chargeType = "chaos";
	this.power = 2;
};
ChaosStaff.extends(MagicWeapon);
ChaosStaff.prototype.display = function(type) {
	type = type || "item";
	c.strokeStyle = "rgb(139, 69, 19)";
	c.save(); {
		c.lineWidth = 4;
		if(type === "holding" || type === "item") {
			c.rotate(Math.rad(45));
		}
		c.strokeLine(
			0, -10,
			0, 30,
			-5, 30
		);
		c.strokeLine(
			0, -10,
			-5, -15
		);
		c.strokeLine(
			0, -10,
			5, -15,
			10, -10
		);
	} c.restore();
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

/* equipables */
function Equipable(modifier) {
	Item.call(this);
	this.equipable = true;
	this.modifier = modifier || "none";
};
Equipable.extends(Item);
function WizardHat(modifier) {
	Equipable.call(this, modifier);
	this.name = "hat";
	this.defLow = (this.modifier === "none") ? 5 : (this.modifier === "empowering" ? 0 : 10);
	this.defHigh = (this.modifier === "none") ? 10 : (this.modifier === "empowering" ? 5 : 15);
	this.manaRegen = (this.modifier === "none") ? 15 : (this.modifier === "empowering" ? 20 : 10);
	this.power = 3;
};
WizardHat.extends(Equipable);
WizardHat.prototype.display = function() {
	c.fillStyle = "rgb(109, 99, 79)";
	c.fillPoly(
		-30, 20,
		30, 20,
		10, 15,
		0, -20,
		-10, 15
	);
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
	this.name = "quiver";
	this.defLow = (this.modifier === "sturdy") ? 5 : 0;
	this.defHigh = (this.modifier === "none") ? 5 : (this.modifier === "empowering" ? 0 : 10);
	this.arrowEfficiency = (this.modifier === "none") ? 15 : (this.modifier === "empowering" ? 20 : 10);
	this.power = 2;
};
MagicQuiver.extends(Equipable);
MagicQuiver.prototype.display = function() {
	c.save(); {
		c.fillStyle = "rgb(139, 69, 19)";
		c.translate(-5, 5);
		c.rotate(Math.rad(45));
		c.fillRect(-10, -20, 20, 40);
		c.fillCircle(0, 20, 10);
		c.translate(-p.worldX, -p.worldY);
		new ShotArrow(-3, -20, 0, -2).exist();
		new ShotArrow(3, -30, 0, -2).exist();
	} c.restore();
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
	this.name = "helmet";
	this.defLow = (this.modifier === "none") ? 20 : (this.modifier === "empowering" ? 10 : 30);
	this.defHigh = (this.modifier === "none") ? 30 : (this.modifier === "empowering" ? 20 : 40);
	this.healthRegen = (this.modifier === "none") ? 15 : (this.modifier === "empowering" ? 20 : 10);
	this.power = 3;
};
Helmet.extends(Equipable);
Helmet.prototype.display = function() {
	c.save(); {
		c.translate(0, -7);
		c.scale(0.4, 0.4);

		/* helmet background */
		c.fillStyle = "rgb(170, 170, 170)";
		c.fillRect(-40, -10, 80, 70);
		/* cutout for helmet mask */
		c.beginPath();
		c.polygon(
			-10, 90,
			-10, 40,
			-30, 30,
			-30, -10,
			0, 0,
			30, -10,
			30, 30,
			10, 40,
			10, 90
		);
		c.invertPath();
		c.clip("evenodd");
		/* helmet shape */
		c.fillStyle = "rgb(200, 200, 200)";
		c.fillPoly(
			-60, -40,
			-60, 80,
			-10, 90,
			10, 90,
			60, 80,
			60, -40,
			0, -50
		);

	} c.restore();
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

/* extras */
function Extra() {
	Item.call(this);
};
Extra.extends(Item);
function Crystal() {
	Extra.call(this);
	this.consumed = false;
};
Crystal.extends(Extra);
Crystal.prototype.graphics = function(type) {
	/* called in the subclass's method 'display' */
	if(type === "holding") {
		c.translate(0, 13);
	}
	c.lineWidth = 2;

	/* crystal shape / outline */
	c.beginPath();
	c.polygon(
		/* lower half of crystal */
		0, 0,
		-15, -15,
		15, -15
	);
	c.polygon(
		/* upper half of crystal */
		-15, -15,
		0, -15 - 8,
		15, -15
	);
	c.fill();
	c.stroke();
	/* inner lines inside crystal */
	c.strokePoly(
		0, 0,
		-8, -15,
		8, -15
	);
	c.strokePoly(
		-8, -15,
		0, -15 - 8,
		8, -15
	);
	c.strokeLine(0, 0, 0, -23);
};
Crystal.prototype.use = function() {
	p.guiOpen = "crystal-infusion";
	p.infusedGui = (this instanceof FireCrystal || this instanceof WaterCrystal) ? (this instanceof FireCrystal ? "fire" : "water") : (this instanceof EarthCrystal ? "earth" : "air");
	this.toBeConsumed = true;
};
function FireCrystal() {
	Crystal.call(this);
};
FireCrystal.extends(Crystal);
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
WaterCrystal.extends(Crystal);
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
EarthCrystal.extends(Crystal);
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
	var p1b = graphics3D.point3D(this.x + p.worldX - 40, this.y + p.worldY, 0.9);
	var p2b = graphics3D.point3D(this.x + p.worldX + 40, this.y + p.worldY, 0.9);
	var p3b = graphics3D.point3D(this.x + p.worldX, this.y + p.worldY - 100, 0.9);
	var p1f = graphics3D.point3D(this.x + p.worldX - 40, this.y + p.worldY, 1.1);
	var p2f = graphics3D.point3D(this.x + p.worldX + 40, this.y + p.worldY, 1.1);
	var p3f = graphics3D.point3D(this.x + p.worldX, this.y + p.worldY - 100, 1.1);

	/* sides */
	c.globalAlpha = Math.max(this.opacity, 0);
	c.fillStyle = "rgb(150, 150, 150)";
	c.fillPoly(p1b, p2b, p2f, p1f);
	c.fillPoly(p2b, p3b, p3f, p2f);
	c.fillPoly(p1b, p3b, p3f, p1f);

	/* front */
	c.fillStyle = "rgb(110, 110, 110)";
	c.fillPoly(p1f, p2f, p3f);

	if(!this.hitSomething) {
		this.velY += 0.1;
		this.y += this.velY;
		for(var i = 0; i < game.dungeon[game.inRoom].content.length; i ++) {
			var thing = game.dungeon[game.inRoom].content[i];
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
	var p1b = graphics3D.point3D(this.x + p.worldX - 40, this.y + p.worldY, 0.9);
	var p2b = graphics3D.point3D(this.x + p.worldX + 40, this.y + p.worldY, 0.9);
	var p3b = graphics3D.point3D(this.x + p.worldX, this.y + p.worldY - 100, 0.9);
	var p1f = graphics3D.point3D(this.x + p.worldX - 40, this.y + p.worldY, 1.1);
	var p2f = graphics3D.point3D(this.x + p.worldX + 40, this.y + p.worldY, 1.1);
	var p3f = graphics3D.point3D(this.x + p.worldX, this.y + p.worldY - 100, 1.1);
	c.save(); {
		c.globalAlpha = Math.max(this.opacity, 0);
		c.fillStyle = "rgb(110, 110, 110)";
		c.fillPoly(p1f, p2f, p2b, p1b);
	} c.restore();
	if(!game.dungeon[game.inRoom].content.containsInstanceOf(Boulder)) {
		this.opacity -= 0.05;
	}
	if(this.opacity < 0) {
		this.splicing = true;
	}
	graphics3D.boxFronts.push({
		type: "boulder void",
		opacity: this.opacity,
		pos1: p1b,
		pos2: p3b,
		pos3: p3f,
		pos4: p1f
	});
	graphics3D.boxFronts.push({
		type: "boulder void",
		opacity: this.opacity,
		pos1: p2b,
		pos2: p3b,
		pos3: p3f,
		pos4: p2f
	});
};
function AirCrystal() {
	Crystal.call(this);
};
AirCrystal.extends(Crystal);
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
	this.display();
	this.update();
};
WindBurst.prototype.display = function() {
	if(this.noDisplay) {
		return;
	}
	c.save(); {
		c.globalAlpha = Math.max(this.opacity, 0);
		c.strokeStyle = "rgb(150, 150, 150)";
		c.lineWidth = 4;
		c.translate(this.x + p.worldX, this.y + p.worldY);
		c.scale(this.dir === "right" ? -1 : 1, 1);
		/* large wind graphic */
		c.strokeLine(0, 0, 32, 0);
		c.strokeArc(17, 0 - 17, 17, Math.rad(90), Math.rad(360));
		/* small wind graphic */
		c.strokeLine(0, 0 - 5, 30, 0 - 5);
		c.strokeArc(17, 0 - 12, 7, Math.rad(90), Math.rad(360));
	} c.restore();
};
WindBurst.prototype.update = function() {
	this.x += this.velX;
	this.velX *= 0.98;
	this.opacity -= 0.05;
	for(var i = 0; i < game.dungeon[game.inRoom].content.length; i ++) {
		if(game.dungeon[game.inRoom].content[i] instanceof Enemy && !(game.dungeon[game.inRoom].content[i] instanceof Wraith)) {
			var enemy = game.dungeon[game.inRoom].content[i];
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
Map.extends(Extra);
Map.prototype.display = function() {
	c.save(); {

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
	} c.restore();
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
Barricade.extends(Extra);
Barricade.prototype.display = function(type) {
	type = type || "item";
	var scaleFactor = (type === "item") ? 0.75 : 1;
	if(type === "item" || type === "holding") {
		c.save(); {
			c.fillStyle = "rgb(139, 69, 19)";
			c.lineWidth = 2;

			function displayWoodBoard() {
				function displayScrew(x, y) {
					c.fillStyle = "rgb(200, 200, 200)";
					c.strokeStyle = "rgb(150, 150, 150)";
					c.fillCircle(x, y, 5);
					c.strokeLine(x - 5, y, x + 5, y);
					c.strokeLine(x, y - 5, x, y + 5);
				};
				c.fillRect(-30, -10, 60, 20);
				displayScrew(-20, 0);
				displayScrew(20, 0);
			};

			for(var rotation = -22; rotation <= 22; rotation += 44) {
				/* displays 2 wooden board graphics */
				c.save(); {
					c.scale(scaleFactor, scaleFactor);
					c.rotate(Math.rad(rotation));
					displayWoodBoard();
				} c.restore();
			}
		} c.restore();
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
	var doorNearby = false;
	for(var i = 0; i < game.dungeon[game.inRoom].content.length; i ++) {
		var loc = graphics3D.point3D(game.dungeon[game.inRoom].content[i].x + p.worldX, game.dungeon[game.inRoom].content[i].y + p.worldY, 0.9);
		if(game.dungeon[game.inRoom].content[i] instanceof Door && Math.dist(loc.x, loc.y, 400, 400) <= 100 && !game.dungeon[game.inRoom].content[i].barricaded) {
			doorNearby = true;
			break;
		}
	}
	if(!doorNearby) {
		return;
	}
	var closestDist = null;
	var closestIndex = 0;
	for(var i = 0; i < game.dungeon[game.inRoom].content.length; i ++) {
		var loc = graphics3D.point3D(game.dungeon[game.inRoom].content[i].x + p.worldX, game.dungeon[game.inRoom].content[i].y + p.worldY, 0.9);
		var theDist = Math.dist(loc.x, loc.y, 400, 400);
		if((game.dungeon[game.inRoom].content[i] instanceof Door && theDist <= closestDist) || !(game.dungeon[game.inRoom].content[closestIndex] instanceof Door)) {
			closestIndex = i;
			closestDist = theDist;
		}
	}
	var theDoor = game.dungeon[game.inRoom].content[closestIndex];
	theDoor.barricaded = true;
	if(typeof theDoor.dest !== "object") {
		for(var i = 0; i < game.dungeon[theDoor.dest].content.length; i ++) {
			if(game.dungeon[theDoor.dest].content[i] instanceof Door && game.dungeon[theDoor.dest].content[i].dest === game.inRoom) {
				game.dungeon[theDoor.dest].content[i].barricaded = true;
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
Coin.extends(Extra);
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

	c.lineWidth = 2;
	c.fillStyle = "rgb(255, 255, 0)";
	c.strokeStyle = "rgb(255, 128, 0)";
	c.fillCircle(0, 0, 15);
	c.strokeCircle(0, 0, 15);

	c.fillStyle = "rgb(255, 128, 0)";
	c.font = "bolder 20px monospace";
	c.textAlign = "center";
	c.fillText(this.quantity, 0, 7);
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
	var angle = Math.atan2(this.velX, this.velY);
	c.save(); {
		c.globalAlpha = Math.max(0, this.opacity);
		c.translate(this.x + p.worldX, this.y + p.worldY);
		c.rotate(Math.rad(90) - angle);
		c.strokeStyle = "rgb(139, 69, 19)";
		c.lineWidth = 4;
		c.strokeLine(-28, 0, 0, 0);
		for(var x = 0; x < 10; x += 3) {
			c.lineWidth = 1;
			c.strokeLine(
				-x - 10, 0,
				-x - 16, -6
			);
			c.strokeLine(
				-x - 10, 0,
				-x - 16, 6
			);
		}
		c.fillStyle = "rgb(255, 255, 255)";
		c.fillPoly(
			0, 0,
			-6, -6,
			14, 0,
			-6, 6
		);
	} c.restore();
	if(!this.hitSomething) {
		this.x += this.velX;
		this.y += this.velY;
		this.velY += 0.1;
		for(var i = 0; i < game.dungeon[game.inRoom].content.length; i ++) {
			if(game.dungeon[game.inRoom].content[i] instanceof Enemy && this.shotBy === "player") {
				var enemy = game.dungeon[game.inRoom].content[i];
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
						game.dungeon[game.inRoom].content.push(new WindBurst(this.x, this.y, this.velX > 0 ? "right" : "left"));
					}
					else if(this.element === "earth" && p.canUseEarth) {
						/* find lowest roof directly above weapon */
						var lowestIndex = null;
						for(var j = 0; j < game.dungeon[game.inRoom].content.length; j ++) {
							if(lowestIndex !== null) {
								if(game.dungeon[game.inRoom].content[j] instanceof Block && this.x > game.dungeon[game.inRoom].content[j].x && this.x < game.dungeon[game.inRoom].content[j].x + game.dungeon[game.inRoom].content[j].w &&game.dungeon[game.inRoom].content[j].y + game.dungeon[game.inRoom].content[j].h > game.dungeon[game.inRoom].content[lowestIndex].y + game.dungeon[game.inRoom].content[lowestIndex].h && game.dungeon[game.inRoom].content[j].y + game.dungeon[game.inRoom].content[j].h <= this.y) {
									lowestIndex = j;
								}
							}
							else if(lowestIndex === null && this.x > game.dungeon[game.inRoom].content[j].x && this.x < game.dungeon[game.inRoom].content[j].x + game.dungeon[game.inRoom].content[j].w && game.dungeon[game.inRoom].content[j].y <= this.y && game.dungeon[game.inRoom].content[j] instanceof Block) {
								lowestIndex = j;
							}
						}
						game.dungeon[game.inRoom].content.push(new BoulderVoid(this.x, game.dungeon[game.inRoom].content[lowestIndex].y + game.dungeon[game.inRoom].content[lowestIndex].h));
						game.dungeon[game.inRoom].content.push(new Boulder(this.x, game.dungeon[game.inRoom].content[lowestIndex].y + game.dungeon[game.inRoom].content[lowestIndex].h, Math.random() * 2 + 2));
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
	for(var i = 0; i < game.dungeon[game.theRoom].content.length; i ++) {
		if(game.dungeon[game.theRoom].content[i] instanceof Decoration) {
			return; // wait until the decorations resolve before deciding which enemy
		}
	}
	var possibleEnemies = game.enemies.clone();
	/* Remove dragonlings + trolls if they are in a room where they wouldn't match the decorations */
	for(var i = 0; i < game.dungeon[game.theRoom].content.length; i ++) {
		if(game.dungeon[game.theRoom].content[i] instanceof Torch) {
			for(var j = 0; j < possibleEnemies.length; j ++) {
				if(possibleEnemies[j] === Dragonling) {
					possibleEnemies.splice(j, 1);
					break;
				}
			}
			break;
		}
		else if(game.dungeon[game.theRoom].content[i] instanceof Banner) {
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
	game.dungeon[game.inRoom].content.push(new possibleEnemies[enemyIndex](this.x, this.y - new possibleEnemies[enemyIndex]().bottomY));
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
	/* healthbar */
	c.globalAlpha = Math.max(0, this.opacity);
	this.attackRecharge --;
	var middle = ((this.x + p.worldX + this.rightX) + (this.x + p.worldX + this.leftX)) / 2;
	if(this instanceof Dragonling) {
		middle = this.x + p.worldX;
	}
	c.fillStyle = "rgb(150, 150, 150)";
	c.fillRect(middle - 30, this.y + p.worldY + this.topY - 15, 60, 10);
	c.fillCircle(middle - 30, this.y + p.worldY + this.topY - 10, 5);
	c.fillCircle(middle + 30, this.y + p.worldY + this.topY - 10, 5);
	/* updating */
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
	/* velocity cap */
	this.velX = Math.constrain(this.velX, -3, 3);
	this.velY = Math.constrain(this.velY, -3, 3);
	if(this instanceof Dragonling) {
		this.topY = topY;
	}
};
Enemy.prototype.exist = function() {
	this.display();
	this.timeFrozen --;
	this.timePurified --;
	if(!this.fadingIn && (this.timeFrozen < 0 || this instanceof Wraith)) {
		if(game.inRoom === game.theRoom) {
			this.update("player");
		}
		else {
			calculatePaths();
			outerLoop: for(var i = 0; i < game.dungeon[game.theRoom].content.length; i ++) {
				if(game.dungeon[game.theRoom].content[i] instanceof Door) {
					var door = game.dungeon[game.theRoom].content[i];
					if(typeof door.dest === "number" && game.dungeon[door.dest].pathScore < game.dungeon[game.theRoom].pathScore) {
						var nextRoom = game.dungeon[door.dest];
						this.update({
							x: door.x,
							y: door.y
						});
						/* enter door if arrived */
						for(var k = 0; k < game.dungeon[game.theRoom].content.length; k ++) {
							if(game.dungeon[game.theRoom].content[k] instanceof Door) {
								var door = game.dungeon[game.theRoom].content[k];
								if(typeof door.dest !== "number") {
									continue;
								}
								var nextRoom = game.dungeon[door.dest];
								if(door.isEnemyNear(this) && game.dungeon[door.dest].pathScore < game.dungeon[game.theRoom].pathScore) {
									for(var l = 0; l < nextRoom.content.length; l ++) {
										if(nextRoom.content[l] instanceof Door) {
											var exitDoor = nextRoom.content[l];
											if(exitDoor.dest !== i) {
												continue;
											}
											var movedEnemy = new (this.constructor)();
											movedEnemy.x = exitDoor.x;
											movedEnemy.y = exitDoor.y - movedEnemy.bottomY;
											movedEnemy.opacity = 0;
											movedEnemy.fadingIn = true;
											movedEnemy.seesPlayer = false;
											movedEnemy.health = this.health;
											this.splicing = true;
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
	}
	if(this.timeFrozen > 0 && !(this instanceof Wraith)) {
		this.velY += 0.1;
		this.y += this.velY;
	}
	if(this.timeFrozen > 0 && !(this instanceof Wraith)) {
		graphics3D.cube(this.x + p.worldX + this.leftX, this.y + p.worldY + this.topY, (this.rightX - this.leftX), (this.bottomY - this.topY), 0.95, 1.05, "rgba(0, 128, 200, 0.5)", "rgba(0, 128, 200, 0.5)");
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
			c.save(); {
				c.translate(this.x + this.leftX, this.y + this.topY);
				this.particles[i].exist();
			} c.restore();
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
	for(var i = 0; i < game.dungeon[game.theRoom].content.length; i ++) {
		if(!(game.dungeon[game.theRoom].content[i] instanceof Enemy)) {
			continue;
		}
		var enemy = game.dungeon[game.theRoom].content[i];
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

	/* hitbox */
	this.leftX = -45;
	this.rightX = 45;
	this.topY = -22;
	this.bottomY = 22;

	/* stats */
	this.health = 50;
	this.maxHealth = 50;
	this.defLow = 20;
	this.defHigh = 30;
	this.damLow = 20;
	this.damHigh = 30;
	this.name = "a giant spider";
	this.nonMagical = true;
};
Spider.extends(Enemy);
Spider.prototype.display = function() {
	c.lineWidth = 4;
	c.fillStyle = "rgb(0, 0, 0)";
	c.strokeStyle = "rgb(0, 0, 0)";
	c.fillCircle(this.x + p.worldX, this.y + p.worldY, 20);

	for(var scale = -1; scale <= 1; scale += (1 - (-1)) ) {
		/* scaling is used to flip the legs (for left + right pairs of legs) */
		for(var rotation = -this.legs; rotation <= this.legs; rotation += (this.legs === 0 ? Infinity : (this.legs * 2)) ) {
			for(var legSize = 10; legSize <= 20; legSize += (20 - 10)) {
				c.save(); {
					c.translate(
						this.x + p.worldX + (scale * (legSize === 10 ? 14 : 16)),
						this.y + p.worldY + (legSize === 10 ? 14 : 4)
					);
					c.rotate(Math.rad(rotation));
					c.scale(scale, 1);

					c.strokeLine(
						0, 0,
						legSize, 0,
						legSize, legSize
					);
				} c.restore();
			}
		}
	}
	/* eyes */
	c.fillStyle = "rgb(" + (255 - this.purity) + ", 0, " + this.purity + ")";
	c.fillCircle(this.x + p.worldX - 10, this.y + p.worldY - 10, 5);
	c.fillCircle(this.x + p.worldX + 10, this.y + p.worldY - 10, 5);
};
Spider.prototype.update = function(dest) {
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
			if(this.legs <= 0) {
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

	/* hitbox */
	this.leftX = -53;
	this.rightX = 53;
	this.topY = -12;
	this.bottomY = 12;

	/* stats */
	this.health = 50;
	this.maxHealth = 50;
	this.defLow = 20;
	this.defHigh = 30;
	this.damLow = 20;
	this.damHigh = 30;
	this.name = "a bat";
	this.nonMagical = true;
};
Bat.extends(Enemy);
Bat.prototype.display = function() {
	c.fillStyle = "rgb(0, 0, 0)";
	c.fillCircle(this.x + p.worldX, this.y + p.worldY, 10);

	c.fillStyle = "rgb(" + (255 - this.purity) + ", 0, " + this.purity + ")";
	c.fillCircle(this.x + p.worldX - 2, this.y + p.worldY - 4, 2);
	c.fillCircle(this.x + p.worldX + 2, this.y + p.worldY - 4, 2);

	c.fillStyle = "rgb(0, 0, 0)";
	for(var scale = -1; scale <= 1; scale += 2) {
		c.save(); {
			c.translate(this.x + p.worldX + (5 * scale), this.y + p.worldY);
			c.rotate(Math.rad(this.wings * scale));
			c.scale(scale, 1);
			c.fillPoly(
				0, 0,
				10, -10,
				50, 0,
				10, 10
			);
		} c.restore();
	}
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

	/* stats */
	this.health = 100;
	this.maxHealth = 100;
	this.damLow = 20;
	this.damHigh = 40;
	this.defLow = 20;
	this.defHigh = 40;

	/* hitbox */
	this.leftX = -13;
	this.rightX = 13;
	this.topY = -8;
	this.bottomY = 43;
	this.name = "a skeleton";
};
Skeleton.extends(Enemy);
Skeleton.prototype.display = function() {
	c.lineWidth = 2;
	/* head */
	c.fillStyle = "rgb(255, 255, 255)";
	c.strokeStyle = "rgb(255, 255, 255)";
	c.fillCircle(this.x + p.worldX, this.y + p.worldY + 3, 7);
	c.fillRect(this.x + p.worldX - 3, this.y + p.worldY + 3, 6, 10);
	/* body */
	c.strokeLine(this.x + p.worldX, this.y + p.worldY, this.x + p.worldX, this.y + p.worldY + 36);
	/* legs */
	c.strokeLine(
		this.x + p.worldX, this.y + p.worldY + 36,
		this.x + p.worldX + this.legs, this.y + p.worldY + 36 + 7
	);
	c.strokeLine(
		this.x + p.worldX, this.y + p.worldY + 36,
		this.x + p.worldX - this.legs, this.y + p.worldY + 36 + 7
	);
	this.legs += this.legDir;
	this.legDir = (this.legs < -7) ? 0.5 : this.legDir;
	this.legDir = (this.legs > 7) ? -0.5 : this.legDir;
	/* arms */
	c.strokeLine(
		this.x + p.worldX     , this.y + p.worldY + 15,
		this.x + p.worldX + 10, this.y + p.worldY + 15
	);
	c.strokeLine(
		this.x + p.worldX + 8, this.y + p.worldY + 15,
		this.x + p.worldX + 8, this.y + p.worldY + 15 + 10
	);
	c.strokeLine(
		this.x + p.worldX     , this.y + p.worldY + 15,
		this.x + p.worldX - 10, this.y + p.worldY + 15
	);
	c.strokeLine(
		this.x + p.worldX - 8, this.y + p.worldY + 15,
		this.x + p.worldX - 8, this.y + p.worldY + 15 + 10
	);
	/* ribcage */
	for(var y = this.y + p.worldY + 22; y < this.y + p.worldY + 34; y += 4) {
		c.strokeLine(this.x + p.worldX - 5, y, this.x + p.worldX + 5, y);
	}
};
Skeleton.prototype.update = function(dest) {
	if(dest === "player") {
		/* movement */
		this.x += this.velX;
		this.y += this.velY;
		this.velY += 0.1;
		this.velX += (this.x + p.worldX < p.x) ? 0.1 : 0;
		this.velX -= (this.x + p.worldX > p.x) ? 0.1 : 0;
		this.velX *= 0.96;
		if(Math.random() <= 0.02 && this.canJump) {
			this.velY = -(Math.random() * 3 + 2);
		}
		this.canJump = false;
	}
	else {
		/* movement */
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

	/* hitbox */
	this.leftX = -13;
	this.rightX = 13;
	this.topY = -8;
	this.bottomY = 43;

	/* stats */
	this.health = 100;
	this.maxHealth = 100;
	this.defLow = 40;
	this.defHigh = 60;
	this.damLow = 50;
	this.damHigh = 70;
	this.complexAttack = true;
	this.name = "a skeletal warrior";
};
SkeletonWarrior.extends(Enemy);
SkeletonWarrior.prototype.display = function() {
	c.lineWidth = 2;
	/* head */
	c.fillStyle = "rgb(255, 255, 255)";
	c.strokeStyle = "rgb(255, 255, 255)";
	c.fillCircle(this.x + p.worldX, this.y + p.worldY + 3, 7);
	c.fillRect(this.x + p.worldX - 3, this.y + p.worldY + 3, 6, 10);
	/* body */
	c.strokeLine(
		this.x + p.worldX, this.y + p.worldY,
		this.x + p.worldX, this.y + p.worldY + 36
	);
	/* legs */
	c.strokeLine(
		this.x + p.worldX            , this.y + p.worldY + 36,
		this.x + p.worldX + this.legs, this.y + p.worldY + 36 + 7
	);
	c.strokeLine(
		this.x + p.worldX            , this.y + p.worldY + 36,
		this.x + p.worldX - this.legs, this.y + p.worldY + 36 + 7
	);
	this.legs += this.legDir;
	this.legDir = (this.legs < -7) ? 0.5 : this.legDir;
	this.legDir = (this.legs > 7) ? -0.5 : this.legDir;
	/* arms */
	if(this.x + p.worldX > p.x) {
		/* right arm (normal) */
		c.strokeLine(
			this.x + p.worldX     , this.y + p.worldY + 15,
			this.x + p.worldX + 10, this.y + p.worldY + 15
		);
		c.strokeLine(
			this.x + p.worldX + 8, this.y + p.worldY + 15,
			this.x + p.worldX + 8, this.y + p.worldY + 15 + 10
		);
		/* left shoulder (normal) */
		c.strokeLine(
			this.x + p.worldX     , this.y + p.worldY + 15,
			this.x + p.worldX - 10, this.y + p.worldY + 15
		);
		/* left arm (attacking) */
		c.save(); {
			c.translate(this.x + p.worldX - 8, this.y + p.worldY + 15);
			c.rotate(Math.rad(this.attackArm));
			c.strokeLine(0, 0, -10, 0);
			/* sword */
			c.translate(-10, 0);
			new Sword("none").display("attacking");
		} c.restore();
	}
	else {
		/* left arm (normal) */
		c.strokeLine(
			this.x + p.worldX     , this.y + p.worldY + 15,
			this.x + p.worldX - 10, this.y + p.worldY + 15
		);
		c.strokeLine(
			this.x + p.worldX - 8, this.y + p.worldY + 15,
			this.x + p.worldX - 8, this.y + p.worldY + 15 + 10
		);
		/* right shoulder (normal) */
		c.strokeLine(
			this.x + p.worldX     , this.y + p.worldY + 15,
			this.x + p.worldX + 10, this.y + p.worldY + 15
		);
		/* right arm (attacking) */
		c.save(); {
			c.translate(this.x + p.worldX + 8, this.y + p.worldY + 15);
			c.rotate(Math.rad(-this.attackArm));
			c.strokeLine(0, 0, 10, 0);
			/* sword */
			c.translate(10, 0);
			new Sword("none").display("attacking");
		} c.restore();
	}
	/* ribcage */
	for(var y = this.y + p.worldY + 22; y < this.y + p.worldY + 34; y += 4) {
		c.strokeLine(
			this.x + p.worldX - 5, y,
			this.x + p.worldX + 5, y
		);
	}
};
SkeletonWarrior.prototype.update = function(dest) {
	if(dest === "player") {
		/* movement */
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
		/* movement */
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
	/* attack */
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

	/* hitbox */
	this.leftX = -13;
	this.rightX = 13;
	this.topY = -8;
	this.bottomY = 43;

	/* stats */
	this.health = 100;
	this.maxHealth = 100;
	this.defLow = 0;
	this.defHigh = 20;
	this.damLow = 50;
	this.damHigh = 70;
	this.complexAttack = true;
	this.name = "a skeletal archer";
};
SkeletonArcher.extends(Enemy);
SkeletonArcher.prototype.display = function() {
	c.lineWidth = 2;
	/* head */
	c.fillStyle = "rgb(255, 255, 255)";
	c.strokeStyle = "rgb(255, 255, 255)";
	c.fillCircle(this.x + p.worldX, this.y + p.worldY + 3, 7);
	c.fillRect(this.x + p.worldX - 3, this.y + p.worldY + 3, 6, 10);
	/* body */
	c.strokeLine(
		this.x + p.worldX, this.y + p.worldY,
		this.x + p.worldX, this.y + p.worldY + 36
	);
	/* legs */
	c.strokeLine(
		this.x + p.worldX            , this.y + p.worldY + 36,
		this.x + p.worldX + this.legs, this.y + p.worldY + 36 + 7
	);
	c.strokeLine(
		this.x + p.worldX            , this.y + p.worldY + 36,
		this.x + p.worldX - this.legs, this.y + p.worldY + 36 + 7
	);
	/* shoulders */
	c.strokeLine(
		this.x + p.worldX - 10, this.y + p.worldY + 15,
		this.x + p.worldX + 10, this.y + p.worldY + 15
	);
	/* right arm */
	if(this.x + p.worldX < p.x && this.timeSinceAttack > 60) {
		c.save(); {
			c.translate(this.x + p.worldX + 8, this.y + p.worldY + 15);
			c.rotate(Math.rad(this.aimRot));
			c.strokeLine(0, 0, 10, 0);
			c.translate(10, 0);
			new WoodBow("none").display("aiming");
		} c.restore();
		this.timeAiming ++;
	}
	else {
		c.strokeLine(
			this.x + p.worldX + 8, this.y + p.worldY + 15,
			this.x + p.worldX + 8, this.y + p.worldY + 15 + 10
		);
	}
	/* left arm */
	if(this.x + p.worldX > p.x && this.timeSinceAttack > 60) {
		c.save(); {
			c.translate(this.x + p.worldX - 8, this.y + p.worldY + 15);
			c.rotate(Math.rad(-this.aimRot));
			c.strokeLine(0, 0, -10, 0);

			c.translate(-10, 0);
			c.scale(-1, 1);
			new WoodBow("none").display("aiming");
		} c.restore();
		this.timeAiming ++;
	}
	else {
		c.strokeLine(
			this.x + p.worldX - 8, this.y + p.worldY + 15,
			this.x + p.worldX - 8, this.y + p.worldY + 15 + 10
		);
	}
	/* ribcage */
	for(var y = this.y + p.worldY + 22; y < this.y + p.worldY + 34; y += 4) {
		c.strokeLine(
			this.x + p.worldX - 5, y,
			this.x + p.worldX + 5, y
		);
	}
};
SkeletonArcher.prototype.update = function(dest) {
	if(dest === "player") {
		this.legs += this.legDir;
		if(this.x + p.worldX < p.x) {
			/* moving towards p.x - 200 */
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
			/* moving towards p.x + 200 */
			if(this.x + p.worldX < p.x + 195 || this.x + p.worldX > p.x + 205) {
				this.legDir = (this.legs > 7) ? -0.5 : this.legDir;
				this.legDir = (this.legs < -7) ? 0.5 : this.legDir;
			}
			else {
				this.legDir = (this.legs > 7) ? 0 : this.legDir;
				this.legDir = (this.legs < -7) ? 0 : this.legDir;
			}
		}
		/* movement */
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
		/* movement */
		this.y += this.velY;
		this.x = (this.x < dest.x) ? this.x + 2 : this.x - 2;
		this.velY += 0.1;
		this.canJump = false;
	}
};
SkeletonArcher.prototype.attack = function() {
	/* attack */
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
				game.dungeon[game.inRoom].content.push(new ShotArrow(velocity.x - p.worldX, velocity.y - p.worldY, velX, velY, damage, "enemy", "none", "a skeletal archer"));
			}
			else if(y <= p.y - 7) {
				this.aimRot ++;
				if(this.aimRot >= 405) {
					this.aimRot = 405;
					if(this.timeAiming > 60) {
						this.timeSinceAttack = 0;
						this.timeAiming = 0;
						var damage = Math.floor(Math.random() * (this.damHigh - this.damLow) + this.damLow);
						game.dungeon[game.inRoom].content.push(new ShotArrow(velocity.x - p.worldX, velocity.y - p.worldY, velX, velY, damage, "enemy", "none", "a skeletal archer"));
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
						game.dungeon[game.inRoom].content.push(new ShotArrow(velocity.x - p.worldX, velocity.y - p.worldY, velX, velY, damage, "enemy", "none", "a skeletal archer"));
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
				game.dungeon[game.inRoom].content.push(new ShotArrow(velocity.x - p.worldX, velocity.y - p.worldY, velX, velY, damage, "enemy", "none", "a skeletal archer"));
			}
			else if(y <= p.y - 7) {
				this.aimRot ++;
				if(this.aimRot >= 405) {
					this.aimRot = 405;
					if(this.timeAiming > 60) {
						this.timeSinceAttack = 0;
						this.timeAiming = 0;
						var damage = Math.floor(Math.random() * (this.damHigh - this.damLow) + this.damLow);
						game.dungeon[game.inRoom].content.push(new ShotArrow(velocity.x - p.worldX, velocity.y - p.worldY, velX, velY, damage, "enemy", "none", "a skeletal archer"));
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
						game.dungeon[game.inRoom].content.push(new ShotArrow(velocity.x - p.worldX, velocity.y - p.worldY, velX, velY, damage, "enemy", "none", "a skeletal archer"));
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
	c.globalAlpha = Math.max(0, this.opacity);
	c.fillStyle = "rgb(255, 0, 0)";
	c.fillStyle = this.color;
	if(this.z === undefined) {
		c.fillCircle(this.x + p.worldX, this.y + p.worldY, this.size);
	}
	else {
		var loc = graphics3D.point3D(this.x + p.worldX, this.y + p.worldY, this.z);
		c.fillCircle(loc.x, loc.y, this.size * this.z);
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

	/* hitbox */
	this.leftX = -50;
	this.rightX = 50;
	this.topY = -50;
	this.bottomY = 50;

	/* stats */
	this.health = 150;
	this.maxHealth = 150;
	this.damLow = 40;
	this.damHigh = 50;
	this.defLow = 40;
	this.defHigh = 50;
	this.complexAttack = true;
	this.name = "a wraith of shadow";
};
Wraith.extends(Enemy);
Wraith.prototype.display = function() {
	/* particle graphics */
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
		/* movement */
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
	/* attacking */
	if(this.timeSinceAttack > 60) {
		if(p.x > this.x + p.worldX) {
			var dist = Math.atan2(this.x + p.worldX - p.x, this.y + p.worldY - p.y) / Math.PI * -180;
			var aimCircle = Math.findPointsCircular(0, 0, 100);
			dist = dist / 360 * aimCircle.length;
			dist = Math.floor(dist);
			while(dist < 0) {
				dist += 360;
			}
			while(dist > 360) {
				dist -= 360;
			}
			game.dungeon[game.inRoom].content.push(new MagicCharge(this.x, this.y, aimCircle[dist].x / 10, aimCircle[dist].y / 10, "shadow"));
			this.timeSinceAttack = 0;
		}
		else {
			var dist = Math.atan2(p.x - (this.x + p.worldX), this.y + p.worldY - p.y) / Math.PI * -180;
			var aimCircle = Math.findPointsCircular(0, 0, 100);
			dist = dist / 360 * aimCircle.length;
			dist = Math.floor(dist);
			while(dist < 0) {
				dist += 360;
			}
			while(dist > 360) {
				dist -= 360;
			}
			game.dungeon[game.inRoom].content.push(new MagicCharge(this.x, this.y, aimCircle[dist].x / -10, aimCircle[dist].y / 10, "shadow"));
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
	this.beingAimed = false;
};
MagicCharge.prototype.exist = function() {
	/* graphics */
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
		this.particles.push(new Particle("hsl(" + (utilities.frameCount % 360) + ", 100%, 50%)", this.x, this.y, Math.random() * 2 - 1, Math.random() * 2 - 1, 10));
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
	/* movement */
	this.x += this.velX;
	this.y += this.velY;
	/* collision with enemies + objects */
	for(var i = 0; i < game.dungeon[game.inRoom].content.length; i ++) {
		if(game.dungeon[game.inRoom].content[i] instanceof Enemy && this.type !== "shadow" && this.shotBy !== "enemy") {
			var enemy = game.dungeon[game.theRoom].content[i];
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
					/* find lowest roof directly above weapon */
					var lowestIndex = null;
					for(var j = 0; j < game.dungeon[game.inRoom].content.length; j ++) {
						var block = game.dungeon[game.inRoom].content[j];
						if(lowestIndex !== null) {
							if(block instanceof Block) {
								if(enemy.x > block.x && enemy.x < block.x + block.w && block.y + block.h > game.dungeon[game.inRoom].content[lowestIndex].y + game.dungeon[game.inRoom].content[lowestIndex].h) {
									if(block.y + game.dungeon[game.inRoom].content[j].h <= enemy.y - p.worldY + enemy.topY) {
										lowestIndex = j;
									}
								}
							}
						}
						else if(game.dungeon[game.inRoom].content[j] instanceof Block) {
							if(lowestIndex === null) {
								if(enemy.x > game.dungeon[game.inRoom].content[j].x && enemy.x < game.dungeon[game.inRoom].content[j].x + game.dungeon[game.inRoom].content[j].w) {
									if(game.dungeon[game.inRoom].content[j].y <= enemy.y - p.worldY) {
										lowestIndex = j;
									}
								}
							}
						}
					}
					game.dungeon[game.inRoom].content.push(new BoulderVoid(enemy.x, game.dungeon[game.inRoom].content[lowestIndex].y + game.dungeon[game.inRoom].content[lowestIndex].h));
					game.dungeon[game.inRoom].content.push(new Boulder(enemy.x, game.dungeon[game.inRoom].content[lowestIndex].y + game.dungeon[game.inRoom].content[lowestIndex].h, Math.random() * 2 + 2));
				}
				else if(this.type === "air") {
					game.dungeon[game.inRoom].content.push(new WindBurst(this.x, this.y, this.velX < 0 ? "left" : "right", true));
				}
				else if(this.type === "purity") {
					enemy.timePurified = (enemy.timePurified <= 0) ? 600 : 0;
				}
				else if(this.type === "chaos") {
					var hp = enemy.health;
					game.dungeon[game.theRoom].content[i] = new RandomEnemy(enemy.x, enemy.y + enemy.bottomY, enemy.constructor);
					game.dungeon[game.theRoom].content[i].generate();
					game.dungeon[game.theRoom].content[i].health = hp;
					if(game.dungeon[game.theRoom].content[i].health > game.dungeon[game.theRoom].content[i].maxHealth) {
						game.dungeon[game.theRoom].content[i].health = game.dungeon[game.theRoom].content[i].maxHealth;
					}
					game.dungeon[game.theRoom].content.splice(game.dungeon[game.theRoom].content.length - 1, 1);
					return;
				}
			}
		}
		else if(game.dungeon[game.inRoom].content[i] instanceof Bridge) {
			var bridge = game.dungeon[game.inRoom].content[i];
			if(Math.distSq(this.x, this.y, bridge.x, bridge.y + 500) < 250000) {
				this.splicing = true;
				if(this.type === "chaos") {
					p.x = this.x + p.worldX;
					p.y = this.y + p.worldY - 46;
				}
			}
		}
	}
	/* collision with player */
	if(this.x + p.worldX > p.x - 5 && this.x + p.worldX < p.x + 5 && this.y + p.worldY > p.y - 7 && this.y + p.worldY < p.y + 46 && (this.type === "shadow" || (this.type === "fire" && this.shotBy === "enemy"))) {
		var damage = Math.round(Math.random() * 10) + 40;
		p.hurt(damage, (this.type === "shadow") ? "a wraith" : "a dragonling");
		this.splicing = true;
	}
};

function Troll(x, y) {
	Enemy.call(this, x, y);
	this.curveArray = Math.findPointsCircular(0, 0, 10);
	this.attackArmDir = 2;
	this.attackArm = 0;
	this.leg1 = -2;
	this.leg2 = 2;
	this.leg1Dir = -0.125;
	this.leg2Dir = 0.125;
	this.currentAction = "move";
	this.timeDoingAction = 0;

	/* hitbox */
	this.leftX = -60;
	this.rightX = 60;
	this.topY = -50;
	this.bottomY = 60;

	/* stats */
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
Troll.extends(Enemy);
Troll.prototype.display = function() {
	c.save(); {
		c.translate(this.x + p.worldX, this.y + p.worldY);
		c.scale(0.75, 0.75);
		/* rounded shoulders */
		c.fillStyle = "rgb(0, 128, 0)";
		c.fillCircle(0 - 50, 0 - 20, 10);
		c.fillCircle(0 + 50, 0 - 20, 10);
		c.fillCircle(0 - 20, 0 + 50, 10);
		c.fillCircle(0 + 20, 0 + 50, 10);
		/* body */
		c.fillRect(0 - 50, 0 - 30, 100, 30);
		c.fillPoly(
			-60, -20,
			60, -20,
			30, 50,
			-30, 50
		);
		c.fillRect(0 - 20, 0 + 10, 40, 50);
		/* legs */
		c.fillStyle = "rgb(30, 128, 30)";
		for(var scale = -1; scale <= 1; scale += 2) {
			c.save(); {
				if(scale === -1) {
					c.translate(3 * this.leg1, 7 * this.leg1);
				}
				else {
					c.translate(-3 * this.leg2, 7 * this.leg2);
				}
				c.scale(scale, 1);
				c.translate(-5, 0);
				c.fillCircle(45, 30, 5);
				c.fillCircle(30, 50, 5);
				c.fillCircle(60, 30, 5);
				c.fillCircle(60, 70, 5);
				c.fillCircle(30, 70, 5);
				c.fillRect(45, 25, 15, 10);
				c.fillRect(25, 50, 40, 20);
				c.fillRect(30, 70, 30, 5);
				c.fillRect(45, 30, 20, 30);
				c.fillPoly(
					40, 30,
					25, 30,
					25, 70,
					40, 70,
					50, 70,
					50, 30
				);
			} c.restore();
		}
		/* head */
		c.fillCircle(0, -40, 20);
	} c.restore();
	/* right arm */
	c.save(); {
		c.translate(this.x + p.worldX + 40, this.y + p.worldY - 10);
		if(this.armAttacking === "right") {
			c.rotate(Math.rad(this.attackArm));
		}
		else {
			c.rotate(Math.rad(60));
		}
		if(this.x + p.worldX < p.x && this.currentAction === "melee-attack") {
			c.fillStyle = "rgb(139, 69, 19)";
			c.fillPoly(
				45, 0,
				50, -70,
				30, -70,
				35, 0
			);
			c.fillCircle(40, -70, 10);
		}
		c.fillStyle = "rgb(0, 128, 0)";
		c.fillCircle(0, -10, 5);
		c.fillCircle(0, 10, 5);
		c.fillCircle(50, -10, 5);
		c.fillCircle(50, 10, 5);
		c.fillRect(-5, -10, 60, 20);
		c.fillRect(0, -15, 50, 30);
	} c.restore();
	/* left arm */
	c.save(); {
		c.translate(this.x + p.worldX - 40, this.y + p.worldY - 10);
		if(this.armAttacking === "left") {
			c.rotate(Math.rad(-this.attackArm));
		}
		else {
			c.rotate(Math.rad(-60));
		}
		if(this.x + p.worldX > p.x && this.currentAction === "melee-attack") {
			c.fillStyle = "rgb(139, 69, 19)";
			c.fillPoly(
				-45, 0,
				-50, -70,
				-30, -70,
				-35, 0
			);
			c.fillCircle(-40, -70, 10);
		}
		c.fillStyle = "rgb(0, 128, 0)";
		c.fillCircle(0, -10, 5);
		c.fillCircle(0, 10, 5);
		c.fillCircle(-50, -10, 5);
		c.fillCircle(-50, 10, 5);
		c.fillRect(-55, -10, 60, 20);
		c.fillRect(-50, -15, 50, 30);
	} c.restore();
};
Troll.prototype.update = function() {
	/* animations */
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
	/* movement */
	this.x += this.velX;
	this.y += this.velY;
	this.velY += 0.1;
	this.attackArm += this.attackArmDir;
	/* this.attackRecharge ++; */
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
				game.dungeon[game.theRoom].content.push(new Rock(this.x - 40 - 35, this.y - 10 - 35, 3, -4));
			}
			else {
				game.dungeon[game.theRoom].content.push(new Rock(this.x + 40 + 35, this.y - 10 - 35, -3, -4));
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
		}
	}
	collisions.rect(this.x + p.worldX - 40, this.y + p.worldY - 20, 80, 60);
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
		c.save(); {
			c.globalAlpha = this.opacity;
			c.fillStyle = "rgb(140, 140, 140)";
			c.fillCircle(this.x + p.worldX, this.y + p.worldY, 20);
		} c.restore();
	}
	if(!this.hitPlayer && this.x + p.worldX + 20 > p.x - 5 && this.x + p.worldX - 20 < p.x + 5 && this.y + p.worldY + 20 > p.y - 7 && this.y + p.worldY - 20 < p.y + 46) {
		p.hurt(Math.random() * 10 + 40, "a troll");
		this.hitPlayer = true;
	}
	if(!this.hitSomething) {
		for(var i = 0; i < game.dungeon[game.theRoom].content.length; i ++) {
			if(game.dungeon[game.theRoom].content[i] instanceof Block) {
				var block = game.dungeon[game.theRoom].content[i];
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
		c.save(); {
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
				for(var j = 0; j < game.dungeon[game.theRoom].content.length; j ++) {
					if(game.dungeon[game.theRoom].content[i] instanceof Block) {

					}
				}
			}
		} c.restore();
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
	/* stats */
	this.damLow = 50;
	this.damHigh = 60;
	this.defLow = 50;
	this.defHigh = 60;
	this.health = 150;
	this.maxHealth = 150;
	this.name = "a dragonling";
	/* hitbox */
	this.leftX = -5;
	this.rightX = 5;
	this.topY = -5;
	this.bottomY = 20;
};
Dragonling.extends(Enemy);
Dragonling.prototype.display = function() {
	/* back wing */
	c.fillStyle  = "rgb(0, 235, 0)";
	var p1 = {x: this.pos[25].x + p.worldX, y: this.pos[25].y + p.worldY};
	var slope = Math.normalize(this.pos[11].x - this.pos[5].x, this.pos[11].y - this.pos[5].y);
	var p2 = graphics3D.point3D((slope.x * 15) + this.pos[25].x + p.worldX, (slope.y * 15) + this.pos[25].y + p.worldY, 0.9);
	var p3 = graphics3D.point3D((-slope.x * 15) + this.pos[25].x + p.worldX, (-slope.y * 15) + this.pos[25].y + p.worldY, 0.9);
	var p4 = graphics3D.point3D(p1.x, p1.y, 0.8);
	c.fillPoly(p2, p4, p3, p1);
	/* mouth */
	c.fillStyle = "rgb(0, 255, 0)";
	c.save(); {
		c.translate(this.x + p.worldX, this.y + p.worldY);
		c.rotate(Math.rad(this.rot));
		c.fillPoly(
			0, -10,
			20, -20,
			this.mouth, -50,
			0, 10,
			-this.mouth, -50,
			-20, -20
		);
	} c.restore();
	/* tail */
	c.strokeStyle = "rgb(0, 255, 0)";
	c.lineWidth = 5;
	c.save(); {
		c.translate(p.worldX, p.worldY);
		c.strokeLine.apply(c, this.pos);
	} c.restore();
	/* update tail position */
	this.pos.push({x: this.x, y: this.y});
	if(this.pos.length > 30) {
		this.pos.splice(0, 1);
	}
	/* front wing */
	c.fillStyle = "rgb(20, 255, 20)";
	var p2 = graphics3D.point3D((slope.x * 15) + this.pos[25].x + p.worldX, (slope.y * 15) + this.pos[25].y + p.worldY, 1.1);
	var p3 = graphics3D.point3D((-slope.x * 15) + this.pos[25].x + p.worldX, (-slope.y * 15) + this.pos[25].y + p.worldY, 1.1);
	var p4 = graphics3D.point3D(p1.x, p1.y, 1.2);
	c.fillPoly(p2, p4, p3, p1);
};
Dragonling.prototype.update = function() {
	/* move according to rotation */
	var theVel = Math.rotate(0, -10, this.rot);
	this.velX += theVel.x / 100;
	this.velY += theVel.y / 100;
	if(!this.frozen) {
		this.x += this.velX;
		this.y += this.velY;
	}
	/* accelerate towards destination */
	var idealAngle = Math.calculateDegrees(this.x - this.destX, this.y - this.destY) - 90;
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
	/* update destination */
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
	/* bite mouth */
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
	/* shoot fireballs */
	var idealAngle = Math.calculateDegrees(this.x - (p.x - p.worldX), this.y - (p.y - p.worldY)) - 90;
	if(this.reload > 120 && Math.abs(this.rot - idealAngle) <= 2 && Math.distSq(this.x + p.worldX, this.y + p.worldY, p.x, p.y) >= 10000) {
		game.dungeon[game.theRoom].content.push(new MagicCharge(this.x, this.y, theVel.x, theVel.y, "fire", Math.random() * 10 + 40));
		game.dungeon[game.theRoom].content[game.dungeon[game.theRoom].content.length - 1].shotBy = "enemy";
		this.currentAction = "bite";
		this.reload = 0;
	}
	this.reload ++;
	/* update hitbox */
	while(this.rot > 360) {
		this.rot -= 360;
	}
	while(this.rot < 0) {
		this.rot += 360;
	}
	/* this.rot = 90; */
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



var io = {
	keys: [],
	mouse: {
		x: 0,
		y: 0,
		pressed: false,
		cursor: "auto"
	},
	getMousePos: function(event) {
		var canvasRect = canvas.getBoundingClientRect();
		io.mouse.x = (event.clientX - canvasRect.left) / (canvasRect.right - canvasRect.left) * canvas.width;
		io.mouse.y = (event.clientY - canvasRect.top) / (canvasRect.bottom - canvasRect.top) * canvas.height;
	},
	initialized: function() {
		document.body.onkeydown = function() { io.keys[event.which] = true; };
		document.body.onkeyup = function() { io.keys[event.which] = false; };
		document.body.onmousedown = function() { io.mouse.pressed = true; };
		document.body.onmouseup = function() { io.mouse.pressed = false; };
		document.body.onmousemove = function() { io.getMousePos(event); };
		return true;
	} ()
};
var utilities = {
	mouseInRect: function(x, y, w, h) {
		return (io.mouse.x > x && io.mouse.x < x + w && io.mouse.y > y && io.mouse.y < y + h);
	},
	mouseInCircle: function(x, y, r) {
		return Math.distSq(io.mouse.x, io.mouse.y, x, y) <= (r * r);
	},
	resizeCanvas: function() {
		if(window.innerWidth < window.innerHeight) {
			canvas.style.width = "100%";
			canvas.style.height = "";
		}
		else {
			canvas.style.width = "";
			canvas.style.height = "100%";
		}
		if(canvas.style.width === "100%") {
			/* canvas size is window.innerWidth * window.innerWidth pixels squared */
			canvas.style.top = (window.innerHeight / 2) - (window.innerWidth / 2) + "px";
			canvas.style.left = "0px";
		}
		else {
			canvas.style.left = (window.innerWidth / 2) - (window.innerHeight / 2) + "px";
			canvas.style.top = "0px";
		}
	},

	tempVars: {
		/* Temporary (local) variables, but used between functions go here */
	},
	pastInputs: {
		/* used to remember what inputs were given 1 frame ago */
		keys: [],
		mouse: { x: 0, y: 0, pressed: false },
		update: function() {
			this.keys = io.keys.clone();
			this.mouse.x = io.mouse.x;
			this.mouse.y = io.mouse.y;
			this.mouse.pressed = io.mouse.pressed;
		}
	},
	frameCount: 0
};
var graphics3D = {
	point3D: function(x, y, z) {
		/*
		Returns the visual position of a point at 'x', 'y', 'z'
		*/
		return Math.scale(x, y, z, canvas.width / 2, canvas.height / 2);
	},
	cube: function(x, y, w, h, startDepth, endDepth, frontCol, sideCol, settings) {
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
		var topLeftB = graphics3D.point3D(x, y, startDepth);
		var topRightB = graphics3D.point3D(x + w, y, startDepth);
		var bottomLeftB = graphics3D.point3D(x, y + h, startDepth);
		var bottomRightB = graphics3D.point3D(x + w, y + h, startDepth);
		/* Calculate front face coordinates */
		var topLeftF = graphics3D.point3D(x, y, endDepth);
		var topRightF = graphics3D.point3D(x + w, y, endDepth);
		var bottomLeftF = graphics3D.point3D(x, y + h, endDepth);
		var bottomRightF = graphics3D.point3D(x + w, y + h, endDepth);
		/* Top face */
		c.fillStyle = settings.sideColors.top;
		c.fillPoly(topLeftF, topRightF, topRightB, topLeftB);
		/* Bottom face */
		c.fillStyle = settings.sideColors.bottom;
		c.fillPoly(bottomLeftF, bottomRightF, bottomRightB, bottomLeftB);
		/* Left face */
		c.fillStyle = settings.sideColors.left;
		c.fillPoly(topLeftF, bottomLeftF, bottomLeftB, topLeftB);
		/* Right face */
		c.fillStyle = settings.sideColors.right;
		c.fillPoly(topRightF, bottomRightF, bottomRightB, topRightB);
		if(!settings.noFrontExtended) {
			/* Front face */
			graphics3D.boxFronts.push({
				type: "rect",
				col: frontCol,
				loc: [topLeftF.x, topLeftF.y, bottomRightF.x - topLeftF.x, bottomRightF.y - topLeftF.y]
			});
		}
		else {
			c.fillStyle = frontCol;
			c.fillRect(topLeftF.x, topLeftF.y, bottomRightF.x - topLeftF.x, bottomRightF.y - topLeftF.y);
		}
	},
	line3D: function(x1, y1, x2, y2, startDepth, endDepth, col) {
		/*
		Draws a line (really more like a plane) extending the line between ('x1', 'y1') and ('x2', 'y2') from 'startDepth' to 'endDepth' with a color of 'col'.
		*/
		var p1 = graphics3D.point3D(x1, y1, startDepth);
		var p2 = graphics3D.point3D(x1, y1, endDepth);
		var p3 = graphics3D.point3D(x2, y2, endDepth);
		var p4 = graphics3D.point3D(x2, y2, startDepth);
		c.fillStyle = col;
		c.fillPoly(p1, p2, p3, p4);
	},
	polygon3D: function(frontCol, sideCol, startDepth, endDepth, points, settings) {
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
			var front = graphics3D.point3D(points[i].x, points[i].y, endDepth)
			frontVertices.push(front);
			backVertices.push(graphics3D.point3D(points[i].x, points[i].y, startDepth));
		}
		/* side faces */
		c.fillStyle = sideCol;
		for(var i = 0; i < frontVertices.length; i ++) {
			var next = (i === frontVertices.length - 1) ? 0 : i + 1;
			c.fillPoly(frontVertices[i], frontVertices[next], backVertices[next], backVertices[i]);
		}
		/* front face */
		c.fillStyle = frontCol;
		c.fillPoly(frontVertices);
	},

	cutoutPolygon: function(frontCol, sideCol, startDepth, endDepth, points) {
		if(startDepth < endDepth) {
			var previousStartDepth = startDepth;
			startDepth = endDepth;
			endDepth = previousStartDepth;
		}
		var front = [];
		for(var i = 0; i < points.length; i ++) {
			front.push(graphics3D.point3D(points[i].x, points[i].y, startDepth));
		}
		var back = [];
		for(var i = 0; i < points.length; i ++) {
			back.push(graphics3D.point3D(points[i].x, points[i].y, endDepth));
		}
		c.save(); {
			c.beginPath();
			c.polygon(front);
			c.clip();
			c.fillStyle = sideCol;
			for(var i = 0; i < points.length; i ++) {
				var next = (i === points.length - 1) ? 0 : i + 1;
				c.fillPoly(front[i], front[next], back[next], back[i]);
			}
		} c.restore();
	},
	cutoutRect: function(x, y, w, h, frontCol, sideCol, startDepth, endDepth) {
		this.cutoutPolygon(
			frontCol, sideCol, startDepth, endDepth,
			[
				{ x: x, y: y },
				{ x: x + w, y: y },
				{ x: x + w, y: y + h },
				{ x: x, y: y + h }
			]
		);
	},

	loadBoxFronts: function() {
		for(var i = 0; i < graphics3D.boxFronts.length; i ++) {
			var boxFront = graphics3D.boxFronts[i];
			if(graphics3D.boxFronts[i].type === "boulder void") {
				c.globalAlpha = Math.min(boxFront.opacity, 0);
				c.fillStyle = "rgb(150, 150, 150)";
				c.fillPoly(boxFront.pos1, boxFront.pos2, boxFront.pos3, boxFront.pos4);
				c.globalAlpha = 1;
			}
			if(graphics3D.boxFronts[i].type === "rect") {
				c.fillStyle = boxFront.col;
				c.fillRect(boxFront.loc[0], boxFront.loc[1], boxFront.loc[2], boxFront.loc[3]);
			}
			else if(boxFront.type === "polygon") {
				c.fillStyle = boxFront.col;
				c.fillPoly(boxFront.loc);
			}
			else if(boxFront.type === "circle") {
				c.fillStyle = boxFront.col;
				c.fillCircle(boxFront.loc[0], boxFront.loc[1], boxFront.loc[2]);
			}
			else if(graphics3D.boxFronts[i].type === "arc") {
				c.fillStyle = boxFront.col;
				c.strokeStyle = boxFront.col;
				c.fillArc(boxFront.loc[0], boxFront.loc[1], boxFront.loc[2], boxFront.loc[3], boxFront.loc[4]);
				c.strokeArc(boxFront.loc[0], boxFront.loc[1], boxFront.loc[2], boxFront.loc[3], boxFront.loc[4]);
			}
		}
		/* extra graphics */
		c.save(); {
			for(var i = 0; i < graphics3D.extraGraphics.length; i ++) {
				if(graphics3D.extraGraphics[i].type === "polygon") {
					c.globalAlpha = 0.5;
					c.fillStyle = graphics3D.extraGraphics[i].col;
					c.fillPoly(graphics3D.extraGraphics[i].loc);
				}
			}
		} c.restore();
	},

	extraGraphics: [],
	boxFronts: []
};
var collisions = {
	rect: function(x, y, w, h, settings) {
		/*
		Adds a CollisionRect object at the parameter's locations.
		*/
		collisions.collisions.push(new CollisionRect(x, y, w, h, settings));
	},
	line: function(x1, y1, x2, y2, settings) {
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
		var points = Math.findPointsLinear(x1, y1, x2, y2);
		/* Place collisions at all those points */
		for(var i = 0; i < points.length; i ++) {
			collisions.rect(points[i].x, points[i].y, 3, 3, { illegalHandling: settings.illegalHandling, walls: settings.walls, extraBouncy: settings.extraBouncy, moving: settings.moving });
		}
	},

	isPlayerInRect: function(x, y, w, h) {
		if(SHOW_HITBOXES) {
			debugging.hitboxes.push({x: x, y: y, w: w, h: h, color: "green"});
		}
		return (p.x + 5 > x && p.x - 5 < x + w && p.y + 46 > y && p.y < y + h);
	},

	collisions: []
};
var debugging = {
	/*
	This object provides methods + properties so that you can disable certain aspects of the game for manual testing + debugging.
	*/
	hitboxes: [],

	activateDebuggingSettings: function() {
		p.onScreen = "play";
		/* override randomizer for room generation */
		var includedRooms = ["ambient5", "reward3"];
		for(var i = 0; i < game.rooms.length; i ++) {
			if(!includedRooms.includes(game.rooms[i].name)) {
				game.rooms.splice(i, 1);
				i --;
				continue;
			}
		}
		// game.items = [Barricade];
		game.enemies = [Table];
		/* change doors in first room */
		for(var i = 0; i < game.dungeon[0].content.length; i ++) {
			if(game.dungeon[0].content[i] instanceof Door) {
				// game.dungeon[0].content[i].dest = ["reward"];
			}
		}
		/* give player items */
		p.class = "mage";
		for(var i = 0; i < game.items.length; i ++) {
			p.addItem(new game.items[i]());
		}
	}
};
var game = {
	items: [
		Dagger, Sword, Spear, //melee weapons
		WoodBow, MetalBow, MechBow, LongBow, //ranged weapons
		EnergyStaff, ElementalStaff, ChaosStaff, //magic weapons
		WizardHat, MagicQuiver, Helmet, //equipables
		Barricade, Map, //extras / bonuses
		FireCrystal, WaterCrystal, EarthCrystal, AirCrystal //crystals
	],
	enemies: [
		Spider, Bat,
		SkeletonWarrior, SkeletonArcher,
		Wraith, Dragonling, Troll
	],
	rooms: [
		/* 3 pillars room */
		{
			name: "ambient1",
			difficulty: 0,
			extraDoors: 2,
			add: function() {
				game.dungeon.push(
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
		},
		/* torches hallway room */
		{
			name: "ambient2",
			difficulty: 0,
			extraDoors: 1,
			add: function() {
				game.dungeon.push(
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
		},
		/* stairs room */
		{
			name: "ambient3",
			difficulty: 0,
			extraDoors: 1,
			add: function() {
				if(Math.random() < 0.5) {
					game.dungeon.push(
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
					game.dungeon.push(
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
		},
		/* collapsing floor room */
		{
			name: "ambient4",
			difficulty: 1,
			add: function() {
				game.dungeon.push(
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
		},
		/* fountain room */
		{
			name: "ambient5",
			difficulty: 0,
			add: function() {
				game.dungeon.push(
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
				game.dungeon[game.dungeon.length - 1].colorScheme = "blue";
			}
		},
		/* garden room */
		{
			name: "ambient6",
			difficulty: 0,
			extraDoors: 1,
			add: function() {
				game.dungeon.push(
					new Room(
						"secret1",
						[
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
				game.dungeon[game.dungeon.length - 1].colorScheme = "green";
			}
		},
		/* statue room */
		{
			name: "secret1",
			difficulty: 0,
			extraDoors: 1,
			add: function() {
				var possibleItems = Object.create(game.items);
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
					/* default to combat1 if the player has all the weapons in the game */
					for(var i = 0; i < game.rooms.length; i ++) {
						if(game.rooms[i].name === "combat3") {
							game.rooms[i].add();
							break;
						}
					}
					return;
				}
				game.dungeon.push(
					new Room(
						"secret2",
						[
							new Block(-1000, -1000, 1000, 2000), //left wall
							new Block(-100, 500, 1010, 500), //floor
							new Block(600, -1000, 1000, 2000), //right wall,
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
		},
		/* library room */
		{
			name: "secret2",
			difficulty: 1,
			extraDoors: 1,
			add: function() {
				game.dungeon.push(
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
				game.dungeon[game.dungeon.length - 1].colorScheme = "red";
			}
		},
		/* basic combat room */
		{
			name: "combat1",
			difficulty: 3,
			extraDoors: 1.5,
			add: function() {
				game.dungeon.push(
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
		},
		/* stairs 2-enemy combat room */
		{
			name: "combat2",
			difficulty: 5,
			extraDoors: 1,
			add: function() {
				game.dungeon.push(
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
		},
		/* bridge combat room */
		{
			name: "combat3",
			difficulty: 4,
			extraDoors: 0.5,
			add: function() {
				game.dungeon.push(
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
		},
		/* platform combat room */
		{
			name: "combat4",
			difficulty: 3,
			extraDoors: 1.5,
			add: function() {
				game.dungeon.push(
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
		},
		/* falling platforms room */
		{
			name: "parkour1",
			difficulty: 3,
			extraDoors: 1.5,
			add: function() {
				game.dungeon.push(
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
		},
		/* pulley room */
		{
			name: "parkour2",
			difficulty: 2,
			extraDoors: 1.5,
			add: function() {
				game.dungeon.push(
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
		},
		/* tilting platforms room */
		{
			name: "parkour3",
			difficulty: 4,
			extraDoors: 0.5,
			add: function() {
				if(Math.random() < 0.5) {
					game.dungeon.push(
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
					game.dungeon.push(
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
		},
		/* tilting platform + pulley room */
		{
			name: "parkour4",
			difficulty: 5,
			extraDoors: 2,
			add: function() {
				game.dungeon.push(
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
		},
		/* 2 chests room */
		{
			name: "reward1",
			difficulty: 0,
			extraDoors: 0,
			add: function() {
				game.dungeon.push(
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
		},
		/* altar room */
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
				if(p.healthAltarsFound >= 5 || game.dungeon[game.inRoom].colorScheme === "blue") {
					chooser = 1;
				}
				if(p.manaAltarsFound >= 5 || game.dungeon[game.inRoom].colorScheme === "red") {
					chooser = 0;
				}
				if((p.healthAltarsFound >= 5 || game.dungeon[game.inRoom].colorScheme === "blue") && (p.manaAltarsFound >= 5 || game.dungeon[game.inRoom].colorScheme === "red")) {
					game.dungeon.push(
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
				game.dungeon.push(
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
				game.dungeon[game.dungeon.length - 1].colorScheme = (chooser < 0.5) ? "red" : "blue";
			}
		},
		/* forge room */
		{
			name: "reward3",
			difficulty: 0,
			extraDoors: 1,
			add: function() {
				game.dungeon.push(new Room(
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
				game.dungeon[game.dungeon.length - 1].colorScheme = "red";
			}
		},
		/* chest + stairs room */
		{
			name: "reward4",
			difficulty: 0,
			extraDoors: 0,
			add: function() {
				if(Math.random() < 0.5) {
					game.dungeon.push(
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
					game.dungeon.push(
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
		}
	],
	dungeon: [
		/*
		This array represents the rooms in the dungeon that have been generated so far in the game.
		*/
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
	],

	inRoom: 0,
	theRoom: null,
	numRooms: 0,

	exist: function() {

	},

	tutorial: {
		exist: function() {
			p.damOp -= 0.05;
			game.inRoom = 0;
			game.theRoom = 0;
			p.update();
			game.dungeon[0].exist(0);

			c.fillStyle = "rgb(255, 255, 255)";
			c.font = "100 20px Germania One";
			c.textAlign = "center";
			c.globalAlpha = 1;
			if(!game.tutorial.infoText.includes("\n")) {
				c.fillText(game.tutorial.infoText, 400, 600);
			}
			else {
				for(var i = 0; i < game.tutorial.infoText.length; i ++) {
					if(game.tutorial.infoText.substr(i, 1) === "\n") {
						c.fillText(game.tutorial.infoText.substr(0, i), 400, 600);
						c.fillText(game.tutorial.infoText.substr(i + 1, Infinity), 400, 640);
						break;
					}
				}
			}
			if(game.tutorial.infoText === "press A to use the item you are holding") {
				if(p.invSlots[p.activeSlot].content instanceof Sword) {
					c.fillText("(like swinging a sword)", 400, 640);
				}
				else if(p.invSlots[p.activeSlot].content instanceof WoodBow) {
					c.fillText("(like shooting a bow)", 400, 640);
				}
				else  if(p.invSlots[p.activeSlot].content instanceof EnergyStaff) {
					c.fillText("(like using a staff)", 400, 640);
				}
			}

			if(p.worldX < -350 && game.tutorial.infoText === "arrow keys to move, up to jump") {
				for(var i = 0; i < game.dungeon[0].content.length; i ++) {
					if(game.dungeon[0].content[i] instanceof MovingWall && game.dungeon[0].content[i].x <= 400) {
						game.dungeon[0].content[i].zDir = 0.01;
						break;
					}
				}
				game.tutorial.infoText = "press S to interact with objects\n(for example: opening a chest)";
			}
			if(game.dungeon[0].content[5].r <= -84 && game.tutorial.infoText === "press S to interact with objects\n(for example: opening a chest)") {
				game.tutorial.infoText = "press D to view your items";
			}
			if(io.keys[65] && p.invSlots[p.activeSlot].content !== "empty" && game.tutorial.infoText === "press A to use the item you are holding") {
				game.tutorial.infoText = "press the number keys (1, 2, 3) to switch between items";
			}
			if((io.keys[49] || io.keys[50] || io.keys[51]) && game.tutorial.infoText === "press the number keys (1, 2, 3) to switch between items") {
				game.tutorial.infoText = "you can aim ranged weapons";
				game.tutorial.infoTextTime = 0;
			}
			game.tutorial.infoTextTime ++;
			if(game.tutorial.infoTextTime > 60) {
				if(game.tutorial.infoText === "you can aim ranged weapons" && (p.invSlots[p.activeSlot].content instanceof RangedWeapon || p.invSlots[p.activeSlot].content instanceof MagicWeapon)) {
					game.tutorial.infoText = "hold down the A key";
				}
				else if(game.tutorial.infoText === "and then press up or down to aim" && (io.keys[38] || io.keys[40])) {
					game.tutorial.infoText = "then you can release A to shoot";
				}
				else if(game.tutorial.infoText === "that's all you need to know. good luck!") {
					game.tutorial.infoText = "that's all you need to know. good luck!";
					game.transitions.dir = "fade-out";
					game.transitions.nextScreen = "home";
				}
			}
			if(io.keys[65] && game.tutorial.infoText === "hold down the A key") {
				game.tutorial.infoText = "and then press up or down to aim";
				game.tutorial.infoTextTime = 0;
			}
			if(!io.keys[65] && game.tutorial.infoText === "then you can release A to shoot") {
				game.tutorial.infoText = "almost done. try fighting this monster for practice";
				game.dungeon[0].content[3].zDir = -0.01;
			}
			if(game.tutorial.infoText !== "almost done. try fighting this monster for practice") {
				for(var i = 0; i < game.dungeon[0].content.length; i ++) {
					if(game.dungeon[0].content[i] instanceof Spider) {
						game.dungeon[0].content[i].x = 1600;
					}
				}
			}
			else {
				var noEnemy = true;
				for(var i = 0; i < game.dungeon[0].content.length; i ++) {
					if(game.dungeon[0].content[i] instanceof Spider) {
						noEnemy = false;
						break;
					}
				}
				if(noEnemy) {
					game.tutorial.infoText = "that's all you need to know. good luck!";
					game.tutorial.infoTextTime = 0;
				}
			}

			p.display();
			p.gui();

			c.fillStyle = "rgb(255, 255, 255)";
			c.font = "100 20px Germania One";
			c.textAlign = "center";
			if(p.guiOpen === "inventory" && game.tutorial.infoText === "press D to view your items") {
				if(p.invSlots[2].content === "empty") {
					c.fillText("click an item to equip / unequip it", 400, 600);
					c.fillText("(try equipping this staff)", 400, 640);
				}
				else {
					c.fillText("now press D again to exit", 400, 600);
				}
			}
			if(p.guiOpen === "none" && p.invSlots[2].content !== "empty" && game.tutorial.infoText === "press D to view your items") {
				game.tutorial.infoText = "press A to use the item you are holding";
			}
		},

		infoText: ""
	},
	transitions: {
		dir: null, // can be "fade-in" or "fade-out"
		opacity: 0,
		nextScreen: null
	}
};
var ui = {
	homeScreen: {
		display: function() {
			graphics3D.boxFronts = [];
			p.worldX = 0;
			p.worldY = 0;
			new Block(-100, 600, 1000, 200).display();
			/* title */
			c.fillStyle = "rgb(0, 0, 0)";
			c.font = "80px Cursive";
			c.textAlign = "center";
			c.fillText("stick", 400, 100);
			c.fillStyle = "rgb(150, 150, 150)";
			c.font = "bolder 80px Arial black";
			c.fillText("DUNGEON", 400, 200);
			/* buttons */
			this.howButton.display();
			this.playButton.display();
			this.scoresButton.display();

			graphics3D.loadBoxFronts();
		},
		update: function() {
			this.howButton.update();
			this.playButton.update();
			this.scoresButton.update();
		},

		howButton: new ArchedDoorButton(
			125, 440, 170, 140,
			"H o w",
			function() {
				p.reset();
				p.clearInventory();
				game.dungeon = [new Room(
					"tutorial",
					[
						new Block(-4000, 400, 8000, 1000), /* floor */
						new Block(-4000, -4000, 4400, 8000), /* left wall */
						new MovingWall(400, -4000, 300, 4400),
						new MovingWall(1100, -4000, 300, 4300, 1.1),
						new Block(700, 300, 1000, 1000), /* higher floor */
						new Chest(900, 300),
						new Spider(1600, 200),
						new Block(1700, -4000, 1000, 8000) /* far right wall */
					],
					"?"
				)];
				game.tutorial.infoText = "arrow keys to move, up to jump";
				game.inRoom = 0, game.theRoom = 0;
				game.transitions.dir = "fade-out";
				game.transitions.nextScreen = "how";
				p.addItem(new Sword());
				p.invSlots[3].content = new EnergyStaff();
				p.invSlots[17].content = new Arrow(Infinity);
			},
			{
				textY: 490,
				maxUnderlineWidth: 50
			}
		),
		playButton: new ArchedDoorButton(
			400, 380, 160, 200,
			"P l a y",
			function() {
				game.inRoom = 0;
				game.theRoom = 0;
				game.transitions.dir = "fade-out";
				game.transitions.nextScreen = "class-select";
			},
			{
				textY: 450,
				maxUnderlineWidth: 50
			}
		),
		scoresButton: new ArchedDoorButton(
			670, 440, 170, 140,
			"S c o r e s",
			function() {
				game.transitions.dir = "fade-out";
				game.transitions.nextScreen = "scores";
			},
			{
				textY: 490,
				maxUnderlineWidth: 40
			}
		)
	},
	classSelectScreen: {
		display: function() {
			io.keys = [];
			graphics3D.boxFronts = [];
			/* ground */
			new Block(-100, 600, 1000, 200).display();
			/* archer */
			this.warriorButton.display();
			this.archerButton.display();
			this.mageButton.display();
			/* mage */
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
			graphics3D.loadBoxFronts();
		},
		update: function() {
			this.warriorButton.update();
			this.archerButton.update();
			this.mageButton.update();
		},

		warriorButton: new RisingPlatformButton(
			175, 550, 150, 100000, "warrior",
			{
				mouseOverFunction: function() { return io.mouse.x < 300; },
				maxHoverY: -50
			}
		),
		archerButton: new RisingPlatformButton(
			400, 550, 150, 100000, "archer",
			{
				mouseOverFunction: function() { return io.mouse.x > 300 && io.mouse.x < 500; },
				maxHoverY: -50
			}
		),
		mageButton: new RisingPlatformButton(
			625, 550, 150, 100000, "mage",
			{
				mouseOverFunction: function() { return io.mouse.x > 500; },
				maxHoverY: -50
			}
		)
	},
	deathScreen: {
		display: function() {
			c.fillStyle = "rgb(150, 150, 150)";
			c.font = "bolder 80px Arial black";
			c.textAlign = "center";
			c.fillText("GAME OVER", 400, 200);
			c.font = "20px Cursive";
			c.fillStyle = "rgb(0, 0, 0)";
			c.fillText("You collected " + p.gold + " coins.", 400, 300);
			c.fillText("You explored " + p.roomsExplored + " rooms.", 400, 340);
			c.fillText("You defeated " + p.enemiesKilled + " monsters.", 400, 380);
			c.fillText("You were killed by " + p.deathCause, 400, 420);
			p.worldX = 0;
			p.worldY = 0;
			new Block(-100, 700, 1000, 200).display();

			this.homeButton.display();
			this.retryButton.display();
		},
		update: function() {
			this.homeButton.update();
			this.retryButton.update();
		},

		homeButton: new ArchedDoorButton(
			175, 570, 150, 100, "H o m e",
			function() {
				game.transitions.dir = "fade-out";
				game.transitions.nextScreen = "home";
			},
			{
				textY: 617.5,
				maxUnderlineWidth: 50
			}
		),
		retryButton: new ArchedDoorButton(
			625, 570, 150, 100, "R e t r y",
			function() {
				game.transitions.dir = "fade-out";
				game.transitions.nextScreen = "class-select";
			},
			{
				textY: 617.5,
				maxUnderlineWidth: 50
			}
		)
	},
	highscoresScreen: {
		display: function() {
			/* title */
			c.textAlign = "center";
			c.fillStyle = "rgb(150, 150, 150)";
			c.font = "100 40px Germania One";
			c.fillText("Your Best Games", 400, 130);
			/* content */
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
					c.save(); {
						c.translate(550, y + 50);
						new Sword().display("item");
					} c.restore();
				}
				else if(p.scores[i].class === "archer") {
					c.save(); {
						c.translate(550, y + 50);
						new WoodBow().display("item");
					} c.restore();
				}
				else if(p.scores[i].class === "mage") {
					c.save(); {
						c.translate(550, y + 50);
						new EnergyStaff().display("item");
					} c.restore();
				}
			}
			if(p.scores.length === 0) {
				c.fillStyle = "rgb(150, 150, 150)";
				c.font = "bolder 80px monospace";
				c.fillText("-", 400, 400);
				c.font = "20px monospace";
				c.fillText("no games played yet", 400, 450);
			}
			/* home button */
			this.homeButton.display();
			return;
		},
		update: function() {
			this.homeButton.update();
		},

		homeButton: new TextButton(
			70, 60, 80, 40,
			"H o m e",
			function() {
				game.transitions.dir = "fade-out";
				game.transitions.nextScreen = "home";
			},
			{
				textY: 60,
				maxUnderlineWidth: 40
			}
		)
	},

	infoBar: {
		/*
		Top row:
		 - Click to equip / unequip
		 - A to use item
		 - S to interact with object
		 - Up + Down to aim
		Bottom row:
		 - Arrow keys to move
		 - Up to jump
		 - D to view items
		 - 1 / 2 / 3 to switch items
		*/
		y: 20,
		destY: 20,
		upButton: {
			y: 0,
			destY: 0
		},
		downButton: {
			y: 0,
			destY: 0
		},
		rowHeight: 20,
		actions: {
			click: null,
			upDown: null,
			a: null,
			s: null,

			arrows: "move",
			up: "jump",
			d: "view items"
		},
		display: function() {
			c.font = "bold 13.33px monospace";
			c.lineWidth = 2;

			var pressingUpButton = utilities.mouseInRect(770, 800 - this.y - this.upButton.y, 20, 20) && this.destY < 40;
			c.fillStyle = pressingUpButton ? "rgb(59, 67, 70)" : "rgb(200, 200, 200)";
			c.strokeStyle = "rgb(59, 67, 70)";
			c.fillRect(770, 800 - this.y - this.upButton.y, 20, 20);
			c.strokeRect(770, 800 - this.y - this.upButton.y, 20, 20);
			displayButtonIcon(770, 800 - this.y - this.upButton.y, "arrow-up", null, pressingUpButton);

			var pressingDownButton = utilities.mouseInRect(740, 800 - this.y - this.downButton.y, 20, 20) && this.destY > 0;
			c.fillStyle = pressingDownButton ? "rgb(59, 67, 70)" : "rgb(200, 200, 200)";
			c.strokeStyle = "rgb(59, 67, 70)";
			c.fillRect(740, 800 - this.y - this.downButton.y, 20, 20);
			c.strokeRect(740, 800 - this.y - this.downButton.y, 20, 20);
			displayButtonIcon(740, 800 - this.y - this.downButton.y, "arrow-down", null, pressingDownButton);

			c.lineWidth = 5;
			c.fillStyle = "rgb(200, 200, 200)";
			c.strokeStyle = "rgb(59, 67, 70)";
			c.strokeRect(0, 800 - this.y, 800, this.y);
			c.fillRect(0, 800 - this.y, 800, this.y);

			function displayButtonIcon(x, y, icon, align, invertColors) {
				if(icon.substr(0, 5) === "arrow") {
					c.strokeStyle = "rgb(59, 67, 70)";
					if(invertColors) {
						c.strokeStyle = "rgb(200, 200, 200)";
						c.fillStyle = "rgb(59, 67, 70)";
					}
					c.save(); {
						c.translate(x + 10, y + ((icon === "arrow-up") ? 12 : 8));
						c.scale(1, (icon === "arrow-down") ? -1 : 1);
						c.strokePoly(
							-5, 0,
							0, -5,
							5, 0
						);
					} c.restore();
					return;
				}
				c.textAlign = "center";
				var boxHeight = ui.infoBar.rowHeight - 5;
				c.lineWidth = 2;
				c.fillStyle = "rgb(200, 200, 200)";
				c.strokeStyle = "rgb(59, 67, 70)";
				if(icon !== "left-click") {
					c.fillRect(x, y, boxHeight, boxHeight);
					c.strokeRect(x, y, boxHeight, boxHeight);
				}
				c.fillStyle = "rgb(59, 67, 70)";
				if(icon.length === 1) {
					c.fillText(icon, x + boxHeight / 2, y + (boxHeight / 2) + 4);
				}
				else if(icon.substring(0, 8) === "triangle") {
					/* filled-in triangle */
					c.save(); {
						c.translate(x + (boxHeight / 2), y + (boxHeight / 2));
						if(icon === "triangle-left") {
							c.rotate(Math.rad(-90));
						}
						else if(icon === "triangle-down") {
							c.rotate(Math.rad(-180));
						}
						else if(icon === "triangle-right") {
							c.rotate(Math.rad(-270));
						}
						c.fillPoly(
							-5, 5,
							5, 5,
							0, -5
						);
					} c.restore();
				}
				else if(icon === "left-click") {
					c.save(); {
						c.translate(x + (boxHeight / 2), y + (boxHeight / 2));
						c.scale(1, 1.2);

						c.strokeCircle(0, 0, 5);

						c.fillStyle = "rgb(59, 67, 70)";
						c.fillArc(0, 0, 5, Math.rad(180), Math.rad(270));

						c.strokeLine(-5, 0, 5, 0);
					} c.restore();
				}
			};
			function displayAction(x, y, icon, action, align) {
				align = align || "left";
				if(action === null || action === undefined) {
					return x;
				}
				if(align === "left") {
					var boxHeight = ui.infoBar.rowHeight - 5;
					if(icon === "triangle-left-right") {
						displayButtonIcon(x, y, "triangle-left");
						displayButtonIcon(x + boxHeight + 2.5, y, "triangle-right");
						c.fillStyle = "rgb(59, 67, 70)";
						c.textAlign = "left";
						c.fillText(action, x + (boxHeight * 2) + 7.5, y + (boxHeight / 2) + 4);
						return (x + (boxHeight * 2)) + c.measureText(action).width + 25;
					}
					else {
						displayButtonIcon(x, y, icon);
						c.fillStyle = "rgb(59, 67, 70)";
						c.textAlign = "left";
						c.fillText(action, x + boxHeight + 5, y + (boxHeight / 2) + 4);
					}
					/* Return the x-coordinate at which to draw the next icon */
					return (x + boxHeight + 5) + c.measureText(action).width + 25;
				}
				else {
					var boxHeight = ui.infoBar.rowHeight - 5;
					c.textAlign = "right";
					c.fillStyle = "rgb(59, 67, 70)";
					c.fillText(action, x, y + (boxHeight / 2) + 4);
					var textWidth = c.measureText(action).width;
					if(icon === "triangle-up-down") {
						displayButtonIcon(x - textWidth - boxHeight - 5, y, "triangle-down");
						displayButtonIcon(x - textWidth - (boxHeight * 2) - 7.5, y, "triangle-up");
						return x - textWidth - (boxHeight * 2) - 10 - 25;
					}
					else {
						displayButtonIcon(x - textWidth - boxHeight - 2.5, y, icon);
						return x - textWidth - boxHeight - 25;
					}
				}
			};
			var x1 = displayAction(2.5, 800 - this.y + 2.5, "A", this.actions.a);
			var x2 = displayAction(x1, 800 - this.y + 2.5, "S", this.actions.s);

			var x3 = displayAction(800 - 5, 800 - this.y + 2.5, "triangle-up-down", this.actions.upDown, "right");
			var x4 = displayAction(x3, 800 - this.y + 2.5, "left-click", this.actions.click, "right");

			var x5 = displayAction(2.5, 800 - this.y + 22.5, "triangle-left-right", this.actions.arrows);
			var x6 = displayAction(x5, 800 - this.y + 22.5, "triangle-up", this.actions.up);

			var x7 = displayAction(800 - 5, 800 - this.y + 22.5, "D", this.actions.d, "right");

			if(io.mouse.y > 800 - 100) {
				if(this.destY === 0) {
					this.upButton.destY = 20;
					this.downButton.destY = 5;
				}
				else if(this.destY === 20) {
					this.upButton.destY = 20;
					this.downButton.destY = 20;
				}
				else if(this.destY === 40) {
					this.upButton.destY = 5;
					this.downButton.destY = 20;
				}
			}
			else {
				this.upButton.destY = 5;
				this.downButton.destY = 5;
			}
			if(pressingUpButton && io.mouse.pressed && this.y === this.destY && this.destY < 40) {
				this.destY += 20;
			}
			if(pressingDownButton && io.mouse.pressed && this.y === this.destY && this.destY > 0) {
				this.destY -= 20;
			}
			this.upButton.y += (this.upButton.y < this.upButton.destY) ? 2 : 0;
			this.upButton.y -= (this.upButton.y > this.upButton.destY) ? 2 : 0;
			this.downButton.y += (this.downButton.y < this.downButton.destY) ? 2 : 0;
			this.downButton.y -= (this.downButton.y > this.downButton.destY) ? 2 : 0;
			this.y += (this.y < this.destY) ? 1 : 0;
			this.y -= (this.y > this.destY) ? 1 : 0;
			this.y = Math.max(this.y, 0);
			this.y = Math.min(this.y, 40);
			this.y = Math.round(this.y);
		},
		resetActions: function() {
			this.actions = {
				click: null,
				a: null,
				s: null,
				upDown: null,

				arrows: null,
				up: null,
				d: null
			};
		},
		calculateActions: function() {
			/*
			Some of the buttons' text are calculated in other places
			*/
			var item = p.invSlots[p.activeSlot].content;
			if(p.guiOpen === "none") {
				if((item instanceof RangedWeapon && !(item instanceof Arrow) && p.hasInInventory(Arrow))) {
					this.actions.a = "shoot bow";
				}
				if(item instanceof MagicWeapon && p.mana > item.manaCost) {
					this.actions.a = "use magic";
				}
				if(item instanceof MeleeWeapon) {
					this.actions.a = "attack";
				}
				if(item instanceof Crystal) {
					if(p.guiOpen === "crystal-infusion") {
						this.actions.a = "cancel";
					}
					else {
						this.actions.a = "infuse item";
					}
				}
				if(item instanceof Equipable) {
					this.actions.a = "put on " + item.name;
				}
				if(item instanceof Barricade) {
					var doorNearby = false;
					for(var i = 0; i < game.dungeon[game.inRoom].content.length; i ++) {
						var loc = graphics3D.point3D(game.dungeon[game.inRoom].content[i].x + p.worldX, game.dungeon[game.inRoom].content[i].y + p.worldY, 0.9);
						if(game.dungeon[game.inRoom].content[i] instanceof Door && Math.dist(loc.x, loc.y, 400, 400) <= 100 && !game.dungeon[game.inRoom].content[i].barricaded) {
							doorNearby = true;
							break;
						}
					}
					if(doorNearby) {
						this.actions.a = "barricade door";
					}
				}
				if(p.aiming) {
					this.actions.upDown = "aim";
					if(item instanceof MagicWeapon) {
						var containsCharge = false;
						for(var i = 0; i < game.dungeon[game.inRoom].content.length; i ++) {
							if(game.dungeon[game.inRoom].content[i] instanceof MagicCharge && game.dungeon[game.inRoom].content[i].beingAimed) {
								containsCharge = true;
								break;
							}
						}
						if(!containsCharge) {
							this.actions.upDown = null;
						}
					}
					if(item instanceof RangedWeapon && !p.hasInInventory(Arrow)) {
						this.actions.upDown = null;
					}
				}
				this.actions.arrows = "move";
				if(p.canJump && this.actions.upDown === null) {
					this.actions.up = "jump";
				}
				this.actions.d = "view items";
			}
		}
	}
};

if(TESTING_MODE) {
	debugging.activateDebuggingSettings();
}

function ArchedDoorButton(x, y, w, h, text, onclick, settings) {
	/*
	Creates a arch-shaped button (the ones on the menus.)

	(x, y) is the center of the half-circle for the top of the arch.
	*/
	this.x = x;
	this.y = y;
	this.w = w;
	this.h = h;
	this.text = text;
	this.onclick = onclick;
	this.underlineWidth = 0;
	settings = settings || {};
	this.textY = settings.textY || this.y;
	this.maxUnderlineWidth = settings.maxUnderlineWidth || 50;
};
ArchedDoorButton.prototype.display = function() {
	c.fillStyle = "rgb(20, 20, 20)";
	c.fillCircle(this.x, this.y, this.w / 2);
	c.fillRect(this.x - (this.w / 2), this.y, this.w, this.h);

	c.fillStyle = "rgb(255, 255, 255)";
	c.font = "100 20px Germania One";
	c.textAlign = "center";
	c.fillText(this.text, this.x, this.textY + 5);

	c.strokeStyle = "rgb(255, 255, 255)";
	if(this.underlineWidth > 0) {
		c.strokeLine(
			this.x - this.underlineWidth, this.textY - 20,
			this.x + this.underlineWidth, this.textY - 20
		);
		c.strokeLine(
			this.x - this.underlineWidth, this.textY + 20,
			this.x + this.underlineWidth, this.textY + 20
		);
	}
};
ArchedDoorButton.prototype.update = function() {
	if(
		utilities.mouseInCircle(this.x, this.y, this.w / 2) ||
		utilities.mouseInRect(this.x - (this.w / 2), this.y, this.w, this.h)
	) {
		io.cursor = "pointer";
		if(this.underlineWidth < this.maxUnderlineWidth) {
			this.underlineWidth += 5;
		}
		if(io.mouse.pressed) {
			this.onclick();
		}
	}
	else if(this.underlineWidth > 0) {
		this.underlineWidth -= 5;
	}
};

function RisingPlatformButton(x, y, w, h, player, settings) {
	/*
	The buttons on the class select screen (rising platforms with a stick figure on top of them)
	*/
	this.x = x; // middle of platform
	this.y = y; // top of platform
	this.w = w;
	this.h = h;
	this.player = player;
	settings = settings || {};
	this.mouseOverFunction = settings.mouseOverFunction; // a function that returns whether this button is hovered or not
	this.maxHoverY = settings.maxHoverY || -50;
	this.offsetY = 0;
};
RisingPlatformButton.prototype.display = function() {
	new Block(this.x - (this.w / 2), this.y + this.offsetY, this.w, this.h).display();
	var stickFigure = new Player();
	stickFigure.x = this.x;
	stickFigure.y = this.y + this.offsetY - 46;
	if(this.player === "warrior") {
		stickFigure.display(true, true);
		c.save(); {
			c.translate(this.x + 15, this.y + this.offsetY - 30);
			c.scale(1, 0.65);
			c.rotate(Math.rad(180));
			new Sword().display("attacking");
		} c.restore();
	}
	else if(this.player === "archer") {
		stickFigure.aiming = true;
		stickFigure.attackingWith = new WoodBow();
		stickFigure.aimRot = 45;
		stickFigure.display(true);
	}
	else if(this.player === "mage") {
		stickFigure.aiming = true;
		stickFigure.attackingWith = new EnergyStaff();
		stickFigure.facing = "left";
		stickFigure.display(true);
	}
};
RisingPlatformButton.prototype.update = function() {
	if(this.mouseOverFunction()) {
		if(this.offsetY > this.maxHoverY) {
			this.offsetY -= 5;
		}
		if(io.mouse.pressed) {
			// this.onclick();
			p.class = this.player;
			game.transitions.dir = "fade-out";
			game.transitions.nextScreen = "play";
			p.reset();
		}
	}
	else if(this.offsetY < 0) {
		this.offsetY += 5;
	}
};

function TextButton(x, y, w, h, text, onclick, settings) {
	this.x = x;
	this.y = y;
	this.w = w;
	this.h = h;
	this.text = text;
	this.onclick = onclick;
	settings = settings || {};
	this.textY = settings.textY || this.y + (this.h / 2);
	this.maxUnderlineWidth = settings.maxUnderlineWidth || 50;
	this.underlineWidth = 0;
};
TextButton.prototype.display = function() {
	c.fillStyle = "rgb(255, 255, 255)";
	c.textAlign = "center";
	c.font = "100 20px Germania One";
	c.fillText(this.text, this.x, this.textY + 5);

	c.strokeStyle = "rgb(255, 255, 255)";
	if(this.underlineWidth > 0) {
		c.strokeLine(
			this.x - this.underlineWidth, this.textY - 20,
			this.x + this.underlineWidth, this.textY - 20
		);
		c.strokeLine(
			this.x - this.underlineWidth, this.textY + 20,
			this.x + this.underlineWidth, this.textY + 20
		);
	}
};
TextButton.prototype.update = function() {
	if(utilities.mouseInRect(this.x - (this.w / 2), this.y - (this.h / 2), this.w, this.h)) {
		io.cursor = "pointer";
		if(this.underlineWidth < this.maxUnderlineWidth) {
			this.underlineWidth += 5;
		}
		if(io.mouse.pressed) {
			this.onclick();
		}
	}
	else if(this.underlineWidth > 0) {
		this.underlineWidth -= 5;
	}
};

/** FRAMES **/
function timer() {
	if(TESTING_MODE) {
		p.health = p.maxHealth;
	}
	io.cursor = "auto";
	utilities.frameCount ++;
	utilities.resizeCanvas();
	c.fillStyle = "rgb(100, 100, 100)";
	c.fillCanvas();

	if(p.onScreen === "play") {
		/* load enemies in other rooms */
		var unseenEnemy = false;
		for(var i = 0; i < game.dungeon.length; i ++) {
			if(game.dungeon[i].content.containsInstanceOf(Enemy) && i !== game.inRoom) {
				unseenEnemy = true;
				break;
			}
		}
		p.update();

		game.dungeon[game.inRoom].displayBackground();

		for(var i = 0; i < game.dungeon.length; i ++) {
			if(game.dungeon[i].id === "?") {
				game.dungeon[i].id = game.numRooms;
				game.numRooms ++;
			}
			if(game.inRoom === game.dungeon[i].id && (!unseenEnemy || true)) {
				game.theRoom = i;
				game.dungeon[i].exist(i);
			}
		}

		/* move player into lower room when falling */
		if(p.y + 46 > 900) {
			p.fallDir = 0.05;
		}

		game.dungeon[game.inRoom].displayShadowEffect();

		p.display();
		p.gui();
		ui.infoBar.calculateActions();
		ui.infoBar.display();
		ui.infoBar.resetActions();
	}
	else if(p.onScreen === "home") {
		ui.homeScreen.update();
		ui.homeScreen.display();
	}
	else if(p.onScreen === "class-select") {
		ui.classSelectScreen.update();
		ui.classSelectScreen.display();
	}
	else if(p.onScreen === "dead") {
		ui.deathScreen.update();
		ui.deathScreen.display();
	}
	else if(p.onScreen === "how") {
		game.tutorial.exist();
	}
	else if(p.onScreen === "scores") {
		ui.highscoresScreen.update();
		ui.highscoresScreen.display();
	}
	if(game.transitions.dir === "fade-out") {
		game.transitions.opacity += 0.05;
		if(game.transitions.opacity >= 1) {
			game.transitions.dir = "fade-in";
			p.onScreen = game.transitions.nextScreen;
		}
	}
	else if(game.transitions.dir === "fade-in") {
		game.transitions.opacity -= 0.05;
		if(game.transitions.opacity <= 0) {
			game.transitions.dir = null;
		}
	}
	c.save(); {
		c.globalAlpha = Math.max(game.transitions.opacity, 0);
		c.fillStyle = "rgb(0, 0, 0)";
		c.fillRect(0, 0, canvas.width, canvas.height);
	} c.restore();

	utilities.pastInputs.update();
	document.body.style.cursor = io.cursor;
	window.setTimeout(timer, 1000 / FPS);
};
window.setTimeout(timer, 1000 / FPS);
