/* IO + constants */
var canvas = document.getElementById("theCanvas");
var c = canvas.getContext("2d");

const FPS = 60;
const FLOOR_WIDTH = 0.1;
const TESTING_MODE = true;
const SHOW_HITBOXES = false;

/* utilities */
Function.prototype.method = function(name, code) {
	this.prototype[name] = code;
	return this;
};
String.method("splitAtIndices", function() {
	if(arguments.length === 0) {
		return [this.substring(0, this.length)]; // strange workaround to return a string primitive, not a String object
	}
	var result = [];
	result.push(this.substring(0, arguments[0]));
	for(var i = 0; i < arguments.length - 1; i ++) {
		var next = i + 1;
		if(Math.dist(arguments[i], arguments[next]) <= 1) {
			continue;
		}
		result.push(this.substring(arguments[i] + 1, arguments[next]));
	}
	result.push(this.substring(arguments[arguments.length - 1] + 1, this.length));
	result = result.filter(function(item) { return item !== ""; });
	return result;
});
Function.overload = function(spec) {
	/*
	Usage examples:
	 - Function.overload({"number": function() {}}); // to run the function for a primitive type (number, in this case)
	 - Function.overload({"MyClass": function() {}}); // to run the function on instances of MyClass
	 - Function.overload({"Object { foo, bar }": function() {}}); // to run the function only on objects with properties foo and bar
	 - Function.overload({"*": function() {}}); // to run the function on a single argument of any type
	 - Function.overload({"number...": function() {}}); // to run the function on any number of number arguments
	Dependencies:
	 - Array.prototype.lastItem()
	 - String.prototype.splitAtIndices()
	 - Object.prototype.hasOwnProperties()
	*/
	function ParameterSet(unparsedString, functionToRun) {
		this.functionToRun = functionToRun;
		this.parameters = [];
		if(unparsedString.trim() === "") {
			/* no arguments */
			return;
		}
		/* split the method signature into an array of parameters instead of one huge string */
		var insideBraces = false;
		var args = [];
		var parameterSeparators = [];
		for(var i = 0; i < signature.length; i ++) {
			var char = signature[i];
			if(char === "{") { insideBraces = true; }
			if(char === "}") { insideBraces = false; }
			if(char === "," && !insideBraces) { parameterSeparators.push(i); }
		}
		var parameters = signature.splitAtIndices.apply(signature, parameterSeparators);
		/* add parameters to function */
		parameters.forEach(function(parameter) { this.parameters.push(new ParameterRequirement(parameter))}, this);
	};
	ParameterSet.method("matches", function(argumentsArray) {
		var lastParameter = this.parameters.lastItem();
		if(argumentsArray.length > this.parameters.length && !lastParameter.continuous) {
			/* too many arguments + final parameter is non-repeating -> parameters and arguments don't match */
			return false;
		}
		if(argumentsArray.length < this.parameters.length) {
			/* too few arguments -> parameters and arguments don't match */
			return false;
		}
		for(var i = 0; i < argumentsArray.length; i ++) {
			var argument = argumentsArray[i];
			var parameterIndex = Math.min(i, this.parameters.length - 1);
			var parameter = this.parameters[parameterIndex];
			if(!parameter.matches(argument)) {
				return false;
			}
		}
		return true;
	});
	function ParameterRequirement(unparsedString) {
		/*
		ParameterRequirement properties:
		 - type: the type of the parameter
		 - continuous: whether this parameter is the infintely-repeatable parameter
		 - propertyRequirements: a list of properties that the argument must have
		*/
		this.type = {
			metaType: "", // metaType can be "primitive", "instance", or "wildcard"
			value: ""
		};
		this.continuous = false; // whether this parameter can be repeated an infinite number of times
		this.propertyRequirements = [];

		unparsedString = unparsedString.trim();
		/* parse type of parameter */
		const EXTRACT_WORDS_AND_WILDCARD_SYMBOL = /[\w\*]+/g;
		this.type.value = unparsedString.match(EXTRACT_WORDS_AND_WILDCARD_SYMBOL)[0];
		const PRIMITIVES = ["number", "int", "string", "boolean", "object", "array"];
		if(PRIMITIVES.includes(this.type.value)) {
			this.type.metaType = "primitive";
		}
		else if(this.type.value === "*") {
			this.type.metaType = "wildcard";
		}
		else {
			this.type.metaType = "instance";
		}
		// else {
		// 	throw new Error("Unsupported data type '" + this.type.value + "'; data types must be primitive values, wildcards (asterisk symbol), or functions.");
		// }
		/* find out if this is a repeatable parameter or not */
		this.continuous = (unparsedString.endsWith("..."));
		/* parse required argument properties */
		if(unparsedString.includes("{")) {
			var beginProperties = unparsedString.indexOf("{") + 1;
			var endProperties = unparsedString.lastIndexOf("}");
			var properties = unparsedString.substring(beginProperties, endProperties);
			this.propertyRequirements = properties.split(",");
			this.propertyRequirements.forEach(function(prop, index, array) { array[index] = prop.trim(); });
		}
	};
	ParameterRequirement.method("matches", function(argument) {
		if(this.type.metaType === "primitive") {
			if(this.type.value === "int") {
				if(Object.typeof(argument) !== "number" || argument !== Math.round(argument)) {
					return false;
				}
			}
			else if(this.type.value === "object") {
				if(typeof argument !== "object") { return false; }
			}
			else if(Object.typeof(argument) !== this.type.value) {
				return false;
			}
		}
		else if(this.type.metaType === "instance" && (typeof argument === "object" && argument !== null)) {
			var isInstance = false;
			var prototype = argument.__proto__;
			while(prototype !== null) {
				if(prototype.constructor.name === this.type.value) {
					isInstance = true;
					break;
				}
				prototype = prototype.__proto__;
			}
			if(!isInstance) {
				return false;
			}
		}
		if(this.propertyRequirements.length !== 0) {
			if((typeof argument === "object" && argument !== null)) {
				if(!argument.hasOwnProperties.apply(argument, this.propertyRequirements)) {
					return false;
				}
			}
			else {
				return false;
			}
		}
		return true;
	});
	var funcs = [];
	for(var signature in spec) {
		if(spec.hasOwnProperty(signature) && typeof spec[signature] === "function") {
			funcs.push(new ParameterSet(signature, spec[signature]));
		}
	}
	return function() {
		for(var i = 0; i < funcs.length; i ++) {
			var func = funcs[i];
			if(func.matches(arguments)) {
				return func.functionToRun.apply(this, arguments);
			}
		}
		throw new Error("Arguments did not match parameters.");
	};
};
Function.method("extends", function(superclass) {
	/* copy prototype to inherit methods */
	this.prototype = Object.create(superclass.prototype);
	this.prototype.constructor = this;
	return this;
});
CanvasRenderingContext2D.method("line", Function.overload({
	"array": function() {
		this.line.apply(this, arguments[0]);
	},
	"object {x, y}...": function() {
		this.moveTo(arguments[0].x, arguments[0].y);
		for(var i = 0; i < arguments.length; i ++) {
			this.lineTo(arguments[i].x, arguments[i].y);
		}
	},
	"number...": function() {
		if(arguments.length % 2 !== 0) {
			throw new Error("Must pass a complete set of (x, y) values");
		}
		this.moveTo(arguments[0], arguments[1]);
		for(var i = 2; i < arguments.length; i += 2) {
			this.lineTo(arguments[i], arguments[i + 1]);
		}
	}
}));
CanvasRenderingContext2D.method("strokeLine", function() {
	/*
	Can be used to stroke a line or a series of lines. Similar to polygon() but it doesn't automatically close the path (and it outlines the path).
	*/
	this.beginPath();
	this.line.apply(this, arguments);
	this.stroke();
});
CanvasRenderingContext2D.method("polygon", function() {
	/* draw lines connecting all vertices + close path to form polygon */
	this.line.apply(this, arguments);
	this.closePath();
});
CanvasRenderingContext2D.method("fillPoly", function() {
	/*
	Arguments can be objects with 'x' and 'y' properties or numbers with each argument being either the x or the y, starting with x.
	*/
	this.beginPath();
	this.polygon.apply(this, arguments);
	this.fill();
});
CanvasRenderingContext2D.method("fillPolyWithoutOrder", function() {
	/*
	This function is for when you are unsure of whether the order of the points in the polygon is correct. It will draw the polygon correctly regardless of the order of the points, at the cost of being slightly slower.
	*/
	if(typeof arguments[0] === "number") {
		/* Call it again with objects with x and y properties as parameters */
		var objects = [];
		for(var i = 0; i < arguments.length; i ++) {
			objects.push({
				x: arguments[i],
				y: arguments[i + 1]
			});
		}
		this.fillPolyWithoutOrder(arguments);
	}
	else if(Array.isArray(arguments[0])) {
		this.fillPolyWithoutOrder.apply(this, arguments);
	}
	else if(typeof arguments[0] === "object") {
		/* draw overlapping triangles connecting every possible set of 3 vertices (inefficient) */
		for(var i = 0; i < arguments.length; i ++) {
			for(var j = i; j < arguments.length; j ++) {
				for(var k = j; k < arguments.length; k ++) {
					this.fillPoly(arguments[i], arguments[j], arguments[k]);
				}
			}
		}
	}
});
CanvasRenderingContext2D.method("strokePoly", function() {
	this.beginPath();
	this.polygon.apply(this, arguments);
	this.stroke();
});
CanvasRenderingContext2D.method("fillCircle", function(x, y, r) {
	this.beginPath();
	this.circle(x, y, r);
	this.fill();
});
CanvasRenderingContext2D.method("strokeCircle", function(x, y, r) {
	this.beginPath();
	this.circle(x, y, r);
	this.stroke();
});
CanvasRenderingContext2D.method("circle", function(x, y, r) {
	this.arc(x, y, r, 0, Math.TWO_PI);
});
CanvasRenderingContext2D.method("fillArc", function(x, y, r, start, end, connectToCenter) {
	/*
	Unlike strokeArc(), this function draws an arc like a pie shape instead of an arc outline.
	*/
	this.beginPath();
	if(connectToCenter) {
		this.moveTo(x, y);
	}
	this.arc(x, y, r, start, end);
	if(connectToCenter) {
		this.closePath();
	}
	this.fill();
});
CanvasRenderingContext2D.method("strokeArc", function(x, y, r, start, end, connectToCenter) {
	this.beginPath();
	if(connectToCenter) {
		this.moveTo(x, y);
	}
	this.arc(x, y, r, start, end);
	if(connectToCenter) {
		this.closePath();
	}
	this.stroke();
});
CanvasRenderingContext2D.method("clipRect", function(x, y, w, h) {
	this.beginPath();
	this.rect(x, y, w, h);
	this.clip();
});
CanvasRenderingContext2D.method("invertPath", function() {
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
});
CanvasRenderingContext2D.method("fillCanvas", function(color) {
	/*
	Fills the entire canvas with the current fillStyle.
	*/
	this.save();
	this.resetTransform();
	if(typeof color === "string") {
		this.fillStyle = color;
	}
	this.fillRect(0, 0, this.canvas.width, this.canvas.height);
	this.restore();
});
CanvasRenderingContext2D.method("reset", function() {
	this.resetTransform();
	this.fillStyle = "rgb(0, 0, 0)";
	this.strokeStyle = "rgb(0, 0, 0)";
	this.font = "10px sans serif";
	this.lineWidth = 1;
	this.globalAlpha = 1;
	this.textAlign = "start";
});
CanvasRenderingContext2D.method("resetTransform", function() {
	this.setTransform(1, 0, 0, 1, 0, 0);
});
CanvasRenderingContext2D.method("displayTextOverLines", function(text, x, y, maxWidth, lineSpacing) {
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
});
Math.TWO_PI = Math.PI * 2;
Math.dist = function(x1, y1, x2, y2) {
	/*
	Returns the distance between ('x1', 'y1') and ('x2', 'y2')
	*/
	if(arguments.length === 2) {
		return Math.abs(arguments[0] - arguments[1]);
	}
	else if(arguments.length === 4) {
		return Math.hypot(x1 - x2, y1 - y2);
	}
	else {
		throw new Error("Math.dist() must be called with 2 or 4 arguments.")
	}
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
Math.modulateIntoRange = function(num, min, max) {
	/*
	Adds or subtracts the range repeatedly until the number is within the range.
	*/
	var range = max - min;
	while(num < min) {
		num += range;
	}
	while(num > max) {
		num -= range;
	}
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
Math.deg = function(rad) {
	return rad / Math.PI * 180;
};
Math.map = function(value, min1, max1, min2, max2) {
	/*
	Maps 'value' from range ['min1' - 'max1'] to ['min2' - 'max2']
	*/
	return (value - min1) / (max1 - min1) * (max2 - min2) + min2;
};
Math.translate = function(x, y, translateX, translateY) {
	return {
		x: x + translateX,
		y: y + translateY
	};
};
Math.rotate = function(x, y, deg, centerX, centerY) {
	/*
	Returns new coords of ('x', 'y') after being rotated 'deg' degrees about ('centerX', 'centerY').
	*/
	centerX = centerX || 0;
	centerY = centerY || 0;
	x -= centerX;
	y -= centerY;
	deg = Math.rad(deg);
	var rotated = {
		x: x * Math.cos(deg) - y * Math.sin(deg),
		y: x * Math.sin(deg) + y * Math.cos(deg)
	};
	return {
		x: rotated.x + centerX,
		y: rotated.y + centerY
	};
};
Math.scale = function(x, y, scaleFactorX, scaleFactorY) {
	/*
	Returns ('x', 'y') scaled by 'scaleFactorX' and 'scaleFactorY' about the origin.
	*/
	scaleFactorY = scaleFactorY || scaleFactorX;
	return {
		x: x * scaleFactorX,
		y: y * scaleFactorY
	}
};
Math.scaleAboutPoint = function(x, y, pointX, pointY, scaleFactorX, scaleFactorY) {
	scaleFactorY = scaleFactorY || scaleFactorX;
	var scaledPoint = { x: x, y: y };
	scaledPoint.x -= pointX;
	scaledPoint.y -= pointY;
	scaledPoint = Math.scale(scaledPoint.x, scaledPoint.y, scaleFactorX, scaleFactorY);
	scaledPoint.x += pointX;
	scaledPoint.y += pointY;
	return scaledPoint;
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
	if(Math.dist(x1, x2) < Math.dist(y1, y2)) {
		inverted = true;
		var oldX1 = x1;
		x1 = y1;
		y1 = oldX1;
		var oldX2 = x2;
		x2 = y2;
		y2 = oldX2;
	}
	/* Calculate line slope */
	var m = Math.dist(y1, y2) / Math.dist(x1, x2);
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
	return Math.deg(Math.atan2(y, x));
};
Math.randomInRange = function(min, max) {
	return Math.random() * (max - min) + min;
};
Array.method("min", function(func) {
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
});
Array.method("max", function(func) {
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
});
Array.method("containsInstanceOf", function(constructor) {
	for(var i = 0; i < this.length; i ++) {
		if(this[i] instanceof constructor) {
			return true;
		}
	}
	return false;
});
Array.method("lastItem", function() {
	return this[this.length - 1];
});
Array.method("randomItem", function() {
	return this[this.randomIndex()];
});
Array.method("randomIndex", function() {
	return Math.floor(Math.random() * this.length);
});
String.method("startsWith", function(substring) {
	return this.substring(0, substring.length) === substring;
});
Object.method("clone", function() {
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
});
Object.method("beginDebugging", function() {
	this.isBeingDebugged = true;
	return this;
});
Object.method("hasOwnProperties", function() {
	/*
	This method allows you to check that multiple properties exist on an object.
	*/
	for(var i = 0; i < arguments.length; i ++) {
		var property = arguments[i];
		if(!this.hasOwnProperty(property)) {
			return false;
		}
	}
	return true;
});
Object.typeof = function(value) {
	/*
	This function serves to determine the type of a variable better than the default "typeof" operator, which returns strange values for some inputs (see special cases below).
	*/
	if(value !== value) {
		return "NaN"; // fix for (typeof NaN === "number")
	}
	else if(value === null) {
		return "null"; // fix for (typeof null === "object")
	}
	else if(Array.isArray(value)) {
		return "array"; // fix for (typeof array === "object")
	}
	else if(typeof value === "object" && Object.getPrototypeOf(value) !== Object.prototype) {
		return "instance"; // return "instance" for instances of a custom class
	}
	else {
		return typeof value;
	}
};

/* player */
function Player() {
	/* Location */
	this.x = 500;
	this.y = 300;
	this.hitbox = new utils.geom.Rectangle({
		left: -5,
		right: 5,
		top: -7,
		bottom: 46
	});
	/* Animation */
	this.legs = 5;
	this.legDir = 1;
	this.enteringDoor = false;
	this.op = 1;
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
	this.velocity = { x: 0, y: 0 };
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
Player.method("init", function() {
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
});
Player.method("sideScroll", function() {
	/* Updates the world's position, keeping the player at the screen center. */
	game.camera.x = this.x;
	game.camera.y = this.y;
});
Player.method("display", function(straightArm) {
	/*
	Draws the player. (Parameters are only for custom stick figures on class selection screen.)
	*/
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
	if(this.attacking && this.facing === "left" && !(this.attackingWith instanceof Spear)) {
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
	if(this.attacking && this.facing === "right" && !(this.attackingWith instanceof Spear)) {
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
	/* Status Bars */
	if(game.onScreen === "play") {
		c.textAlign = "center";
		c.globalAlpha = 1;
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
		}
	}
	if(this.aiming && this.facing === "left") {
		if(this.attackingWith instanceof RangedWeapon) {
			c.save(); {
				c.translate(this.x, this.y + 26);
				c.rotate(-Math.rad(this.aimRot));
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
		}
	}
	c.lineCap = "butt";
	c.globalAlpha = 1;
});
Player.method("displayHealthBar", function(x, y, txt, num, max, col, percentFull) {
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
});
Player.method("displayHitbox", function() {
	/*
	Adds the player's hitbox to the debugging hitbox array.
	*/
	if(SHOW_HITBOXES) {
		debugging.hitboxes.push({
			color: "green",
			x: p.x + p.hitbox.left,
			y: p.y + p.hitbox.top,
			w: p.hitbox.w,
			h: p.hitbox.h
		});
	}
});
Player.method("update", function() {
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
			this.velocity.x -= 0.1;
		}
		else if(io.keys[39]) {
			this.velocity.x += 0.1;
		}
	}
	this.x += this.velocity.x;
	this.y += this.velocity.y;
	if(io.keys[38] && this.canJump && !this.aiming) {
		this.velocity.y = -10;
	}
	/* Velocity Cap */
	if(this.velocity.x > 4) {
		this.velocity.x = 4;
	}
	else if(this.velocity.x < -4) {
		this.velocity.x = -4;
	}
	/* Friction + Gravity */
	if(!io.keys[37] && !io.keys[39]) {
		this.velocity.x *= 0.93;
	}
	if(this.invSlots[this.activeSlot].content instanceof MeleeWeapon && !(this.invSlots[this.activeSlot].content instanceof Dagger) && this.class !== "warrior") {
		this.velocity.x *= 0.965; // non-warriors walk slower when holding a melee weapon
	}
	this.velocity.y += 0.3;
	/* Screen Transitions */
	if(this.enteringDoor) {
		this.op -= 0.05;
		if(this.op <= 0) {
			game.transitions.dir = "fade-out";
			game.transitions.color = "rgb(0, 0, 0)";
		}
	}
	if(this.exitingDoor) {
		this.op += 0.05;
		if(this.op >= 1) {
			this.exitingDoor = false;
		}
	}
	this.op = Math.constrain(this.op, 0, 1);
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
	if(this.numHeals > 0 && utils.frameCount % Math.floor(18 * this.healthRegen) === 0) {
		this.health ++;
		this.numHeals -= 0.1 * this.healthRegen;
	}
	this.manaRegen = 1;
	for(var i = 0; i < this.invSlots.length; i ++) {
		if(this.invSlots[i].type === "equip" && this.invSlots[i].content instanceof WizardHat) {
			this.manaRegen -= (this.invSlots[i].content.manaRegen * 0.01);
		}
	}
	if(utils.frameCount % Math.floor(18 * this.manaRegen) === 0 && this.mana < this.maxMana) {
		this.mana += 1;
	}
	for(var i = 0; i < this.invSlots.length; i ++) {
		if(this.invSlots[i].content instanceof Coin) {
			this.gold = this.invSlots[i].content.quantity;
			break;
		}
	}
	this.maxGold = Math.max(this.maxGold, this.gold);
	if(this.dead) {
		this.op -= 0.05;
		if(this.op <= 0 && game.transitions.dir !== "out") {
			game.transitions.dir = "fade-out";
			game.transitions.color = "rgb(0, 0, 0)";
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
	this.health = Math.constrain(this.health, 0, this.maxHealth);
	this.damOp -= 0.05;

	this.sideScroll();
	/* Arm Movement */
	this.attackArm += this.attackArmDir;
	if(!this.attacking) {
		this.attackArm = null;
	}
	/* Arms when aiming a Ranged Weapon */
	if(this.aiming && this.attackingWith instanceof MagicWeapon) {
		for(var i = 0; i < game.dungeon[game.inRoom].content.length; i ++) {
			var obj = game.dungeon[game.inRoom].content[i];
			if(obj instanceof MagicCharge && obj.beingAimed) {
				obj.x = this.x + this.chargeLoc.x;
				obj.y = this.y + this.chargeLoc.y;
			}
		}
	}
});
Player.method("useItem", function() {
	/* Update facing direction */
	this.facing = io.keys[39] ? "right" : this.facing;
	this.facing = io.keys[37] ? "left" : this.facing;
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
		if(this.invSlots[this.activeSlot].content instanceof MeleeWeapon) {
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
					var damage = Math.round(Math.randomInRange(this.invSlots[this.activeSlot].content.damLow, this.invSlots[this.activeSlot].content.damHigh));
					if(this.facing === "right") {
						game.dungeon[game.inRoom].content.push(new MagicCharge(this.x + 50, this.y, 0, 0, this.attackingWith.chargeType, damage));
						game.dungeon[game.inRoom].content[game.dungeon[game.inRoom].content.length - 1].beingAimed = true;
					}
					else {
						game.dungeon[game.inRoom].content.push(new MagicCharge(this.x - 50, this.y, 0, 0, this.attackingWith.chargeType, damage));
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
		if(this.attackingWith instanceof MeleeWeapon) {
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
			weaponPos.y += this.y + 26 - this.velocity.y;
			if(SHOW_HITBOXES) {
				c.fillStyle = "rgb(0, 255, 0)";
				c.fillRect(weaponPos.x - 3, weaponPos.y - 3, 6, 6);
			}
			/* check enemies to see if weapon hits any */
			for(var i = 0; i < game.dungeon[game.inRoom].content.length; i ++) {
				if(game.dungeon[game.inRoom].content[i] instanceof Enemy) {
					var enemy = game.dungeon[game.inRoom].content[i];
					if(collisions.objectIntersectsPoint(enemy, weaponPos) && this.canHit) {
						/* hurt enemy that was hit by the weapon */
						var damage = Math.randomInRange(this.attackingWith.damLow, this.attackingWith.damHigh);
						enemy.hurt(damage);
						if(["fire", "water", "earth", "air"].includes(this.type)) {
							Weapon.applyElementalEffect(this.attackingWith.element, enemy, this.facing, weaponPos);
						}
						/* reset variables for weapon swinging */
						this.canHit = false;
						this.attackArmDir = -this.attackArmDir;
						this.timeSinceAttack = 0;
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
			this.shootReload = this.attackingWith.reload * FPS;
			var damage = Math.round(Math.randomInRange(this.attackingWith.damLow, this.attackingWith.damHigh));
			var speed = {
				"medium": 5,
				"long": 5.7,
				"very long": 8,
				"super long": 10
			}[this.attackingWith.range];
			var velocity = Math.rotate(1, 0, this.aimRot);
			if(this.facing === "left") {
				velocity.x *= -1;
			}
			var arrow = new ShotArrow(
				(this.x + this.hitbox[this.facing]), (velocity.y + this.y + 26),
				(velocity.x * speed), (velocity.y * speed),
				damage, "player", this.attackingWith.element
			);
			if(this.attackingWith instanceof LongBow) {
				arrow.ORIGINAL_X = arrow.x;
			}
			game.dungeon[game.inRoom].content.push(arrow);
			this.removeArrow();
		}
		else {
			for(var i = 0; i < game.dungeon[game.inRoom].content.length; i ++) {
				var obj = game.dungeon[game.inRoom].content[i];
				if(obj instanceof MagicCharge && obj.beingAimed) {
					obj.beingAimed = false;
					obj.velocity = {
						x: this.chargeLoc.x / 10,
						y: this.chargeLoc.y / 10
					};
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
	if(this.aiming && this.attackingWith instanceof MechBow && utils.frameCount % 20 === 0 && this.hasInInventory(Arrow)) {
		this.shootReload = 60;
		var damage = Math.round(Math.randomInRange(this.attackingWith.damLow, this.attackingWith.damHigh));
		var speed = {
			"medium": 5,
			"long": 5.7,
			"very long": 8,
			"super long": 10
		}[this.attackingWith.range];
		var velocity = Math.rotate(1, 0, this.aimRot);
		if(this.facing === "left") {
			velocity.x *= -1;
		}
		var arrow = new ShotArrow(
			(this.x + this.hitbox[this.facing]), (velocity.y + this.y + 26),
			(velocity.x * speed), (velocity.y * speed),
			damage, "player", this.attackingWith.element
		);
		if(this.attackingWith instanceof LongBow) {
			arrow.ORIGINAL_X = arrow.x;
		}
		game.dungeon[game.inRoom].content.push(arrow);
		/* remove arrows from inventory */
	}
	this.aimingBefore = this.aiming;
	this.facingBefore = this.facing;
	this.shootReload --;
});
Player.method("removeArrow", function() {
	/*
	Removes an arrow from the player's inventory (or does nothing randomly, if the player has an item that lets them sometimes keep arrows)
	*/
	var arrowEfficiency = 0;
	for(var i = 0; i < this.invSlots.length; i ++) {
		if(this.invSlots[i].type === "equip" && this.invSlots[i].content.arrowEfficiency !== undefined) {
			arrowEfficiency += this.invSlots[i].content.arrowEfficiency * 0.01;
		}
	}
	if(Math.random() < (1 - arrowEfficiency)) {
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
});
Player.method("handleCollision", function(direction, collision) {
	if(direction === "floor") {
		this.velocity.y = Math.min(0, this.velocity.y);
		this.canJump = true;
		/* Hurt the player if they've fallen from a height */
		if(this.fallDmg !== 0) {
			this.hurt(this.fallDmg, "falling", true);
			this.fallDmg = 0;
		}
	}
	else if(direction === "ceiling") {
		this.velocity.y = Math.max(2, this.velocity.y);
	}
	else if(direction === "wall-to-left") {
		this.velocity.x = Math.max(this.velocity.x, 0);
	}
	else if(direction === "wall-to-right") {
		this.velocity.x = Math.min(this.velocity.x, 0);
	}
});
Player.method("gui", function() {
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
				c.translate(invSlot.x, invSlot.y);
				invSlot.content.displayParticles();
			} c.restore();
		}
	};
	if(this.guiOpen === "inventory") {
		ui.infoBar.actions.d = "close inventory";
		/* Background */
		c.strokeStyle = "rgb(59, 67, 70)";
		c.fillStyle = "rgb(150, 150, 150)";
		c.fillCanvas();
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
		if(game.onScreen === "how") {
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
		c.fillCanvas();
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
		c.fillCanvas();
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
		c.fillCanvas();
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
		c.fillCanvas();
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
		c.fillCanvas();
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
});
Player.method("addItem", function(item) {
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
			this.invSlots[i].content = item.clone();
			this.invSlots[i].content.opacity = 0;
			return;
		}
	}
});
Player.method("hurt", function(amount, killer, ignoreDef) {
	/*
	Deals 'amount' damage to the player. 'killer' shows up in death message. If 'ignoreDef' is true, the player's defense will be ignored.
	*/
	if(amount !== 0) {
		/* display red flashing screen */
		game.transitions.color = "rgb(255, 0, 0)";
		game.transitions.opacity = 1;
		game.transitions.onScreenChange = function() {
			game.transitions.color = "rgb(0, 0, 0)";
		};
		game.transitions.dir = "fade-in";
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
	var defense = Math.randomInRange(this.defLow, this.defHigh);
	/* Subtract defense from damage dealt*/
	if(ignoreDef) {
		var damage = amount;
	}
	else {
		var damage = amount - defense;
	}
	/* Cap damage at 0 + hurt player */
	damage = Math.max(damage, 0);
	damage = Math.round(damage);
	this.health -= damage;
	/* If player is dead, record killer */
	if(this.health <= 0) {
		this.dead = true;
		this.deathCause = killer;
	}
});
Player.method("reset", function() {
	/*
	This function resets most of the player's properties. (Usually called after starting a new game)
	*/
	/* Reset rooms */
	game.dungeon = [];
	game.getRoomByID("ambient1").add();
	game.inRoom = 0;
	game.numRooms = 0;
	/* Reset player properties */
	var permanentProperties = ["onScreen", "class", "maxGold", "scores"];
	for(var i in this) {
		if(!permanentProperties.includes(i)) {
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
});
Player.method("updatePower", function() {
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
});
Player.method("hasInInventory", function(constructor) {
	for(var i = 0; i < this.invSlots.length; i ++) {
		if(this.invSlots[i].content instanceof constructor) {
			return true;
		}
	}
	return false;
});
Player.method("clearInventory", function() {
	for(var i = 0; i < this.invSlots.length; i ++) {
		this.invSlots[i].content = "empty";
	}
});
Player.method("loadScores", function() {
	if(localStorage.getItem("scores") !== null) {
		p.scores = JSON.parse(localStorage.getItem("scores"));
	}
});
Player.method("saveScores", function() {
	var scores = JSON.stringify(this.scores);
	localStorage.setItem("scores", scores);
});

/** COLLISIONS **/
function CollisionRect(x, y, w, h, settings) {
	/*
	This object represents a collision - the kind where when the player hits it, they bounce back.
	*/
	this.x = x;
	this.y = y;
	this.w = w;
	this.h = h;
	settings = settings || {};
	this.settings = settings;
	this.settings.velocity = settings.velocity || { x: 0, y: 0 }; // used to increase collision buffer to prevent clipping through the surface at high speeds
	this.settings.walls = this.settings.walls || ["top", "bottom", "left", "right"]; // used to only collide on certain surfaces of the rectangle
	this.settings.illegalHandling = this.settings.illegalHandling || "collide"; // values: "collide" or "teleport". allows you to have the player teleport to the top of the block when hitting the side (for things like stairs).
	this.settings.onCollision = settings.onCollision || function() {}; // a function to be run when an object hits a side of the rectangle
	this.settings.collisionCriteria = settings.collisionCriteria || function(obj) { return true; }; // a function to determine which objects this should collide with
	this.settings.noPositionLimits = settings.noPositionLimits || false; // whether or not to move the object until it no longer intersects the rectangle
};
CollisionRect.method("collide", function(obj) {
	if(Object.typeof(obj) === "object" || Object.typeof(obj) === "instance") {
		if(!this.settings.collisionCriteria(obj)) {
			return;
		}
		const MINIMUM_COLLISION_BUFFER = 5;
		var collisionBuffer = {
			left: Math.max(MINIMUM_COLLISION_BUFFER, obj.velocity.x - this.settings.velocity.x),
			right: Math.max(MINIMUM_COLLISION_BUFFER, this.settings.velocity.x - obj.velocity.x),
			top: Math.max(MINIMUM_COLLISION_BUFFER, obj.velocity.y - this.settings.velocity.y),
			bottom: Math.max(MINIMUM_COLLISION_BUFFER, this.settings.velocity.y - obj.velocity.y)
		};
		/* check if obj is directly above / below this (floor + ceiling collisions) */
		if(obj.x + obj.hitbox.right > this.x && obj.x + obj.hitbox.left < this.x + this.w) {
			if(this.settings.walls.includes("top") && obj.y + obj.hitbox.bottom >= this.y && obj.y + obj.hitbox.bottom < this.y + collisionBuffer.top) {
				obj.handleCollision("floor", this);
				if(!this.settings.noPositionLimits) {
					obj.y = Math.min(obj.y, this.y - obj.hitbox.bottom);
				}
				this.settings.onCollision(obj, "floor");
			}
			if(this.settings.walls.includes("bottom") && obj.y + obj.hitbox.top < this.y + this.h && obj.y + obj.hitbox.top > this.y + this.h - collisionBuffer.bottom) {
				obj.handleCollision("ceiling", this);
				if(!this.settings.noPositionLimits) {
					obj.y = Math.max(obj.y, this.y + this.h + Math.abs(obj.hitbox.top));
				}
				this.settings.onCollision(obj, "ceiling");
			}
		}
		/* check if obj is directly to left / to right of this (wall collisions) */
		if(obj.y + obj.hitbox.bottom > this.y && obj.y + obj.hitbox.top < this.y + this.h) {
			if(this.settings.walls.includes("left") && obj.x + obj.hitbox.right > this.x && obj.x + obj.hitbox.right < this.x + collisionBuffer.left) {
				if(this.settings.illegalHandling === "collide" || obj.noTeleportCollisions) {
					obj.handleCollision("wall-to-right", this);
					if(!this.settings.noPositionLimits) {
						obj.x = Math.min(obj.x, this.x - obj.hitbox.right);
					}
				}
				else if(this.settings.illegalHandling === "teleport") {
					obj.y = Math.min(obj.y, this.y - obj.hitbox.bottom);
				}
				this.settings.onCollision(obj, "wall-to-right");
			}
			if(this.settings.walls.includes("right") && obj.x + obj.hitbox.left < this.x + this.w && obj.x + obj.hitbox.left > this.x + this.w - collisionBuffer.right) {
				if(this.settings.illegalHandling === "collide" || obj.noTeleportCollisions) {
					obj.handleCollision("wall-to-left", this);
					if(!this.settings.noPositionLimits) {
						obj.x = Math.max(obj.x, this.x + this.w + Math.abs(obj.hitbox.left));
					}
				}
				else if(this.settings.illegalHandling === "teleport") {
					obj.y = Math.min(obj.y, this.y - obj.hitbox.bottom);
				}
				this.settings.onCollision("wall-to-left");
			}
		}
	}
	else {
		/* Add a hitbox if 'SHOW_HITBOXES' is true (for debugging) */
		if(SHOW_HITBOXES) {
			debugging.hitboxes.push({x: this.x, y: this.y, w: this.w, h: this.h, color: this.settings.illegalHandling === "teleport" ? "dark blue" : "light blue"});
		}
		/* collide with objects */
		for(var i = 0; i < game.dungeon[game.theRoom].content.length; i ++) {
			var obj = game.dungeon[game.theRoom].content[i];
			if(obj.hitbox instanceof utils.geom.Rectangle && Object.typeof(obj.handleCollision) === "function") {
				this.collide(obj);
			}
		}
		this.collide(p);
	}
});
function CollisionCircle(x, y, r, settings) {
	/*
	('x', 'y') is center, not top-left corner. Radius is 'r'
	*/
	this.x = x;
	this.y = y;
	this.r = r;
};
CollisionCircle.method("collide", function(obj) {
	if(Object.typeof(obj) === "object" || Object.typeof(obj) === "instance") {
		var intersection = this.getIntersectionPoint(obj);
		var collided = false;
		var slope;
		while(intersection !== null) {
			/* move the player away from the center of the circle (in the direction they are already in) until they no longer intersect */
			slope = slope || Math.normalize(obj.x - this.x, obj.y - this.y);
			if(Math.abs(slope.y / slope.x) > 0.75) {
				/* slope is shallow enough to not have things slide down -> only move vertically */
				obj.y --;
			}
			else {
				obj.x += slope.x;
				obj.y += slope.y;
			}
			intersection = this.getIntersectionPoint(obj);
			collided = true;
		}
		if(collided) {
			if(Math.abs(slope.y / slope.x) > 0.75) {
				obj.handleCollision((obj.y < this.y ? "floor" : "ceiling"), this);
			}
			else {
				obj.handleCollision((obj.x > this.x ? "left" : "right"), this);
			}
		}
	}
	else {
		/* Add a hitbox if 'SHOW_HITBOXES' is true (for debugging) */
		if(SHOW_HITBOXES) {
			debugging.hitboxes.push({x: this.x, y: this.y, r: this.r, color: "dark blue"});
		}
		/* collide with objects */
		for(var i = 0; i < game.dungeon[game.theRoom].content.length; i ++) {
			var obj = game.dungeon[game.theRoom].content[i];
			if(obj.hitbox instanceof utils.geom.Rectangle && Object.typeof(obj.handleCollision) === "function") {
				this.collide(obj);
			}
		}
		this.collide(p);
	}
});
CollisionCircle.method("getIntersectionPoint", function(obj) {
	var point = {
		x: Math.constrain(this.x, obj.x + obj.hitbox.left, obj.x + obj.hitbox.right),
		y: Math.constrain(this.y, obj.y + obj.hitbox.top, obj.y + obj.hitbox.bottom)
	};
	if(Math.distSq(this.x, this.y, point.x, point.y) < this.r * this.r) {
		return point;
	}
	else {
		return null;
	}
});

/** RENDERING **/
function RenderingOrderObject(display, depth, zOrder) {
	this.display = display; // a function to be called when this object is displayed
	if(Object.typeof(depth) !== "number") {
		throw new Error("Cannot construct RenderingOrderObject without depth argument; value '" + depth + "' is invalid.");
	}
	this.depth = depth; // how far back the polygon is
	this.zOrder = zOrder || 0; // only used when 2 polygons have the same depth
};
function RenderingOrderShape(type, location, color, depth, zOrder) {
	this.type = type;
	if(this.type === "poly") {
		this.type = "polygon";
	}
	this.location = location;
	/*
	Location: (for types 'rect' and 'circle') object w/ properties:
	 - 'x', 'y', 'w', and 'h' (or 'width' and 'height') for type 'rect'
	 - 'x', 'y', 'r' for type 'circle'
	Array of objects with 'x' and 'y' properties for type 'polygon'
	*/
	this.color = color;
	this.depth = depth;
	this.zOrder = zOrder || 0; // only used when 2 polygons have the same depth
};
RenderingOrderShape.method("display", function() {
	c.fillStyle = this.color;
	if(this.type === "rect") {
		if(typeof this.location.w === "number") {
			c.fillRect(this.location.x, this.location.y, this.location.w, this.location.h);
		}
		else if(typeof this.location.width === "number") {
			c.fillRect(this.location.x, this.location.y, this.location.width, this.location.height);
		}
	}
	else if(this.type === "circle") {
		c.fillCircle(this.location.x, this.location.y, this.location.r);
	}
	else if(this.type === "polygon") {
		c.fillPoly(this.location);
	}
});
function RenderingOrderGroup(objects, zOrder) {
	/*
	Represents a group of objects with the same depth that can be rendered in any order since they're all at the same depth.
	*/
	this.objects = objects || [];
	this.zOrder = zOrder || 0;
};
RenderingOrderGroup.method("display", function() {
	for(var i = 0; i < this.objects.length; i ++) {
		this.objects[i].display();
	}
});

/** IN GAME STRUCTURES **/
function Block(x, y, w, h) {
	this.x = x;
	this.y = y;
	this.w = w;
	this.h = h;
};
Block.method("update", function() {
	collisions.solids.rect(this.x, this.y, this.w, this.h, {illegalHandling: utils.tempVars.partOfAStair ? "teleport" : "collide"} );
});
Block.method("display", function() {
	graphics3D.cube(this.x, this.y, this.w, this.h, 0.9, 1.1);
});
function Platform(x, y, w) {
	this.x = x;
	this.y = y;
	this.w = w;
};
Platform.method("update", function() {
	collisions.solids.rect(this.x, this.y, this.w, 3, {walls: ["top"]});
});
Platform.method("display", function() {
	graphics3D.cube(this.x, this.y, this.w, 3, 0.9, 1.1, "rgb(139, 69, 19)", "rgb(159, 89, 39");
});
function Door(x, y, dest, noEntry, invertEntries, type) {
	this.x = x;
	this.y = y;
	this.dest = dest;
	this.noEntry = noEntry || false;
	this.invertEntries = invertEntries || false;
	this.type = type || "same";
	this.onPath = false;

	if(window["game"] === undefined) {
		/* the game is being initialized -> this must in the first room (room #0) */
		this.containingRoomID = 0;
	}
	else {
		this.containingRoomID = game.dungeon.length;
	}
};
Door.method("getInfo", function() {
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
});
Door.method("display", function() {
	/* Graphics */
	var self = this;
	var topLeft = graphics3D.point3D(this.x - 30, this.y - 60, 0.9);
	var bottomRight = graphics3D.point3D(this.x + 30, this.y, 0.9);
	var middle = graphics3D.point3D(this.x, this.y, 0.9);
	game.dungeon[game.theRoom].render(
		new RenderingOrderObject(
			function() {
				if(self.type === "arch") {
					c.fillStyle = "rgb(20, 20, 20)";
					c.fillRect(topLeft.x, topLeft.y, bottomRight.x - topLeft.x, bottomRight.y - topLeft.y);
					c.fillCircle(middle.x, topLeft.y, 27);
				}
				else if(self.type === "lintel") {
					c.fillStyle = "rgb(20, 20, 20)";
					c.fillRect(topLeft.x, topLeft.y - (30 * 0.9), bottomRight.x - topLeft.x, (bottomRight.y - topLeft.y) + (30 * 0.9));
				}
				if(self.barricaded) {
					c.save(); {
						c.lineWidth = 2;
						function displayWoodenBoard() {
							c.fillStyle = "rgb(139, 69, 19)";
							c.fillRect(-40, -10, 80, 20);
							function displayScrew(x, y) {
								c.fillStyle = "rgb(200, 200, 200)";
								c.strokeStyle = "rgb(255, 255, 255)";
								c.fillCircle(x, y, 5);
								c.strokeLine(x - 5, y, x + 5, y);
								c.strokeLine(x, y - 5, x, y + 5);
							};
							displayScrew(-30, 0);
							displayScrew(30, 0);
						};
						var doorWidth = (bottomRight.x - topLeft.x) / 2;
						for(var y = -20; y >= -60; y -= 20) {
							c.save(); {
								c.translate(middle.x, bottomRight.y + y);
								c.rotate((y === -40) ? Math.rad(-22) : Math.rad(22));
								displayWoodenBoard();
							} c.restore();
						}
					} c.restore();
				}
			},
			0.9,
			-1
		)
	);
	if(this.type === "lintel") {
		graphics3D.cube(this.x - 45, this.y - 110, 90, 20, 0.9, 0.91, "rgb(110, 110, 110)", "rgb(150, 150, 150)");
	}
	/* Symbols for maps */
	var symbol = this.getInfo();
	var center = graphics3D.point3D(this.x, this.y - 40, 0.9);
	c.font = "15pt monospace";
	c.fillStyle = "rgb(255, 255, 255)";
	c.textAlign = "center";
	if(symbol !== ">" || true) {
		c.fillText(symbol, center.x, center.y);
	}
	else {
		if(p.x > this.x) {
			c.fillText("<", center.x, center.y);
		}
		else {
			c.fillText(">", center.x, center.y);
		}
	}
});
Door.method("update", function() {
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
	var topLeft = graphics3D.point3D(this.x - 30, this.y - 60, 0.9);
	var bottomRight = graphics3D.point3D(this.x + 30, this.y, 0.9);
	if(collisions.objectIntersectsRect(p, { x: this.x - 30, y: this.y - 60, w: 60, h: 60}) && p.canJump && !p.enteringDoor && !p.exitingDoor && p.guiOpen === "none" && !this.barricaded) {
		if(io.keys[83]) {
			p.enteringDoor = true;
			this.entering = true;
		}
		ui.infoBar.actions.s = "enter door";
	}
	if(game.transitions.opacity > 0.95 && this.entering && !this.barricaded && !p.exitingDoor) {
		p.doorType = this.type;
		if(typeof this.dest !== "number") {
			game.generateNewRoom(this);
		}
		this.enter(p);
		this.entering = false;
	}
});
Door.method("isEnemyNear", function(enemy) {
	return collisions.objectIntersectsRect(enemy, { left: this.x - 30, right: this.x + 30, top: this.y - 60, bottom: this.y + 3});
});
Door.method("enter", function(obj) {
	if(obj instanceof Player) {
		if(Object.typeof(this.dest) === "array") {
			game.generateNewRoom(this);
		}
		var destinationDoor = this.getDestinationDoor();
		game.inRoom = this.dest;
		p.x = destinationDoor.x;
		p.y = destinationDoor.y - p.hitbox.bottom;
		p.enteringDoor = false;
		p.exitingDoor = true;
	}
	else if(obj instanceof Enemy) {
		var destinationRoom = this.getDestinationRoom();
		var destinationDoor = this.getDestinationDoor();
		var enemy = obj.clone();
		enemy.x = destinationDoor.x;
		enemy.y = destinationDoor.y;
		destinationRoom.content.push(enemy);
	}
	else {
		throw new Error("Only enemies and players can enter doors");
	}
});
Door.method("getDestinationRoom", function() {
	if(Object.typeof(this.dest) === "array") {
		return null; // no destination room if the door hasn't generated yet
	}
	return game.dungeon[this.dest];
});
Door.method("getDestinationDoor", function() {
	var destinationRoom = this.getDestinationRoom();
	for(var i = 0; i < destinationRoom.content.length; i ++) {
		var obj = destinationRoom.content[i];
		if(obj instanceof Door && obj.dest === this.containingRoomID) {
			return obj;
		}
	}
});
function Torch(x, y) {
	this.x = x;
	this.y = y;
	this.lit = false;
	this.fireParticles = [];
};
Torch.method("display", function() {
	graphics3D.cube(this.x - 5, this.y - 20, 10, 20, 0.9, 0.95);
	graphics3D.cube(this.x - 10, this.y - 25, 20, 6, 0.9, 0.97);
	var self = this;
	game.dungeon[game.theRoom].render(
		new RenderingOrderObject(
			function() {
				game.dungeon[game.theRoom].displayImmediately(function() {
					for(var i = 0; i < self.fireParticles.length; i ++) {
						self.fireParticles[i].display();
					}
				});
			},
			0.97,
			1
		)
	);
});
Torch.method("update", function() {
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

	if(Math.dist(this.x, p.x) < 10) {
		this.lit = true;
	}
	if(this.lit) {
		this.fireParticles.push(new Particle(this.color, this.x, this.y - 27, Math.random(), Math.randomInRange(-3, 0), Math.randomInRange(5, 10)));
		this.fireParticles.lastItem().z = Math.randomInRange(0.94, 0.96);
	}
	for(var i = 0; i < this.fireParticles.length; i ++) {
		this.fireParticles[i].update();
	}
	this.fireParticles = this.fireParticles.filter(function(particle) { return !particle.toBeRemoved; });
});
Torch.method("translate", function(x, y) {
	this.x += x;
	this.y += y;
	for(var i = 0; i < this.fireParticles.length; i ++) {
		var particle = this.fireParticles[i];
		particle.x += x;
		particle.y += y;
	}
});
function LightRay(x, w, floorY) {
	this.x = x;
	this.w = w;
	this.floorY = floorY; // y-level of floor that light ray hits
};
LightRay.method("display", function() {
	var self = this;
	var leftBack = graphics3D.point3D(this.x, 0, 0.9).x;
	var rightBack = graphics3D.point3D(this.x + this.w, 0, 0.9).x;
	var leftFront = graphics3D.point3D(this.x, 0, 1.1).x;
	var rightFront = graphics3D.point3D(this.x + this.w, 0, 1.1).x;
	var floorBack = graphics3D.point3D(0, this.floorY, 0.9).y;
	var floorFront = graphics3D.point3D(0, this.floorY, 1.1).y;
	game.dungeon[game.theRoom].render(
		new RenderingOrderShape(
			"rect",
			{
				x: leftBack,
				y: 0,
				width: rightBack - leftBack,
				height: floorBack
			},
			"rgba(255, 255, 255, 0.5)",
			0.9,
			-1
		)
	);
	game.dungeon[game.theRoom].render(
		new RenderingOrderShape(
			"polygon",
			[
				leftBack, floorBack,
				leftFront, floorFront,
				rightFront, floorFront,
				rightBack, floorBack
			],
			"rgba(255, 255, 255, 0.5)",
			0.9,
			1
		)
	);
	if(leftBack < 400) {
		game.dungeon[game.theRoom].render(
			new RenderingOrderShape(
				"polygon",
				[
					leftBack, floorBack,
					leftFront, floorFront,
					leftFront, 0,
					leftBack, 0
				],
				"rgba(255, 255, 255, 0.4)",
				0.9,
				1
			)
		);
	}
	if(rightBack > 400) {
		game.dungeon[game.theRoom].render(
			new RenderingOrderShape(
				"polygon",
				[
					rightBack, floorBack,
					rightFront, floorFront,
					rightFront, 0,
					rightBack, 0
				],
				"rgba(255, 255, 255, 0.4)",
				0.9,
				1
			)
		);
	}
});
LightRay.method("translate", function(x, y) {
	this.x += x;
	this.y += y;
	this.floorY += y;
});
function Tree(x, y) {
	/*
	dead tree, comes with the planter and everything
	*/
	this.x = x;
	this.y = y;
};
Tree.method("update", function() {
	var loc = graphics3D.point3D(this.x, this.y, 0.95);
	collisions.solids.line(loc.x - 6, loc.y - 100, loc.x - 150, loc.y - 100, {walls: ["top"]});
	collisions.solids.line(loc.x + 6, loc.y - 120, loc.x + 150, loc.y - 120, {walls: ["top"]});
	collisions.solids.line(loc.x - 5, loc.y - 170, loc.x - 100, loc.y - 180, {walls: ["top"]});
	collisions.solids.line(loc.x + 5, loc.y - 190, loc.x + 100, loc.y - 200, {walls: ["top"]});
	collisions.solids.line(loc.x, loc.y - 220, loc.x - 60, loc.y - 230, {walls: ["top"]});
});
Tree.method("display", function() {
	var loc = graphics3D.point3D(this.x, this.y, 0.95);
		game.dungeon[game.theRoom].render(
			new RenderingOrderObject(
				function() {
					c.fillStyle = "rgb(139, 69, 19)";
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
				},
				0.95
			)
		);
	graphics3D.cube(this.x - 100, this.y - 40, 200, 40, 0.9, 1);
});
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
Chest.method("update", function() {
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
		if(p.x < this.x) {
			this.openDir = "right";
		}
		else {
			this.openDir = "left";
		}
	}
	if(Math.dist(this.x, p.x) < 65 && Math.dist(this.y, p.y + p.hitbox.bottom) < 10 && p.canJump && !this.opening) {
		ui.infoBar.actions.s = "open chest";
		if(io.keys[83]) {
			this.opening = true;
			if(p.x < this.x) {
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
		game.dungeon[game.theRoom].content.push(this.generateItem());
	}
});
Chest.method("generateItem", function() {
	if(game.onScreen === "how") {
		return new WoodBow();
	}
	if(p.hasInInventory(RangedWeapon)) {
		/* 25% arrows, 25% coins, 50% miscellaneous */
		var options = [
			this.generateCoins,
			this.generateArrows,
			this.generateMiscellaneousItem,
			this.generateMiscellaneousItem
		];
	}
	else {
		/* 50% coins, 50% miscellaneous */
		var options = [this.generateCoins, this.generateMiscellaneousItem];
	}
	return (options.randomItem()).call(this);
});
Chest.method("generateCoins", function() {
	return new Coin(Math.round(Math.randomInRange(6, 10)));
});
Chest.method("generateArrows", function() {
	return new Arrow(Math.round(Math.randomInRange(6, 10)));
});
Chest.method("generateMiscellaneousItem", function() {
	/*
	This function is used to select an item at random (not coins or arrows) and give it to the player after first making sure the player doesn't already have that item. See Chest.generateItem(), where this function is called.
	*/
	var possibleItems = game.items.clone().filter(function(item) {
		return !p.hasInInventory(item);
	});
	if(possibleItems.length === 0) {
		/* the player has every item in the game, so just give them coins */
		return this.generateCoins();
	}
	var randomItemConstructor = possibleItems.randomItem();
	return new randomItemConstructor();
});
Chest.method("display", function() {
	// openDir is which corner the chest is rotating around
	var self = this;
	var centerOfRotation = {
		x: -20,
		y: -40
	};
	var scaleFactor = (this.openDir === "left" ? -1 : 1);
	var rotationDegrees = this.r;

	var centerMiddle = { x: this.x, y: this.y };
	var centerBack = graphics3D.point3D(this.x, this.y, 0.95);
	var centerFront = graphics3D.point3D(this.x, this.y, 1.05);
	var cornerMiddle = { x: this.x + 20, y: this.y - 30 };
	var cornerBack = graphics3D.point3D(this.x + 20, this.y - 30, 0.95);
	var cornerFront = graphics3D.point3D(this.x + 20, this.y - 30, 0.95);

	function displayChestLid(color) {
		/* clip out rest of circle for chest lid */
		c.beginPath();
		c.rect(-1000, 0, 2000, 1000);
		c.invertPath();
		c.clip("evenodd");

		/* draw circle for chest lid */
		var radius = 25;
		c.fillStyle = color;
		c.fillCircle(
			-20, // centered on chest
			/*
			Circle passes through corner of chest (0, 0) and is centered at x=-20
			20^2 + y^2 = radius^2
			y^2 = (radius^2 - 20^2)
			y = Math.sqrt(radius^2 - 20^2)
			*/
			Math.sqrt(radius * radius - 20 * 20),   //
			radius
		);
	};
	/* draw back of chest lid */
	game.dungeon[game.theRoom].render(
		new RenderingOrderObject(
			function() {
				c.save(); {
					c.translate(centerBack.x, centerBack.y); // translate to chest location
					c.scale(0.95, 0.95);                     // scale for perspective
					c.scale(scaleFactor, 1);                 // flip so it can open from both sides
					c.translate(20, -30);                    // translate to upper-right corner
					c.rotate(Math.rad(-rotationDegrees));    // rotate according to how much the chest is open
					displayChestLid("rgb(159, 89, 39)");
				} c.restore();
			},
			0.95
		)
	);
	/* draw front of chest lid */
	game.dungeon[game.theRoom].render(
		new RenderingOrderObject(
			function() {
				c.save(); {
					c.translate(centerFront.x, centerFront.y); // translate to chest location
					c.scale(1.05, 1.05);                       // scale for perspective
					c.scale(scaleFactor, 1);                   // flip so it can open from both sides
					c.translate(20, -30);                      // translate to upper-right corner
					c.rotate(Math.rad(-rotationDegrees));      // rotate according to how much the chest is open
					displayChestLid("rgb(139, 69, 19)");
				} c.restore();
			},
			1.05
		)
	);
	/* draw underside of chest lid */
	game.dungeon[game.theRoom].render(
		new RenderingOrderObject(
			function() {
				var p1 = graphics3D.point3D(
					self.x + (self.openDir === "left" ? -20 : 20),
					self.y - 30,
					0.95
				);
				var p2 = graphics3D.point3D(
					self.x + (self.openDir === "left" ? -20 : 20),
					self.y - 30,
					1.05
				);
				var chestSide = { x: self.x - 20, y: self.y - 30 };
				chestSide = Math.rotate(
					chestSide.x, chestSide.y,
					-rotationDegrees,
					cornerMiddle.x, cornerMiddle.y
				);
				chestSide = Math.scaleAboutPoint(
					chestSide.x, chestSide.y,
					centerMiddle.x, centerMiddle.y,
					scaleFactor, 1
				)
				var p3 = graphics3D.point3D(chestSide.x, chestSide.y, 1.05);
				var p4 = graphics3D.point3D(chestSide.x, chestSide.y, 0.95);
				c.fillStyle = "rgb(159, 89, 39)";
				c.fillPolyWithoutOrder(p1, p2, p3, p4);
			},
			0.95
		)
	);
	/* draw box for chest */
	graphics3D.cube(this.x - 20, this.y - 30, 40, 30, 0.95, 1.05, "rgb(139, 69, 19)", "rgb(159, 89, 39)");
});
function FallBlock(x, y) {
	this.x = x;
	this.y = y;
	this.velocity = { x: 0, y: 0 };
	this.ORIGINAL_Y = y;
	this.falling = false;
	this.timeShaking = 0;
	this.steppedOn = false;
	this.allDone = false;
};
FallBlock.method("update", function() {
	/* Top face */
	var self = this;
	collisions.solids.line(this.x - 20, this.y, this.x + 20, this.y, {walls: ["top"], illegalHandling: "collide", onCollision: function() { self.steppedOn = true; }});
	/* left face */
	collisions.solids.line(this.x - 20, this.y, this.x, this.y + 60, {illegalHandling: "collide"});
	/* right face */
	collisions.solids.line(this.x + 20, this.y, this.x, this.y + 60, {illegalHandling: "collide"});

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
		this.velocity.y += 0.1;
		this.y += this.velocity.y;
	}
	if(game.transitions.opacity >= 0.9 && p.enteringDoor) {
		this.y = this.ORIGINAL_Y;
		this.velocity.y = 0;
		this.falling = false;
		this.allDone = false;
	}
});
FallBlock.method("display", function() {
	var shakeX = Math.randomInRange(-this.timeShaking, this.timeShaking);
	var shakeY = Math.randomInRange(-this.timeShaking, this.timeShaking);
	graphics3D.polygon3D(
		"rgb(110, 110, 110)", "rgb(150, 150, 150)",
		0.9, 1.1,
		[
			{
				x: this.x + shakeX - 20,
				y: this.y + shakeY
			},
			{
				x: this.x + shakeX + 20,
				y: this.y + shakeY,
			},
			{
				x: this.x + shakeX,
				y: this.y + shakeY + 60
			}
		]
	);
});
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
Stairs.method("display", function() {
	utils.tempVars.partOfAStair = true;
	for(var i = 0; i < this.steps.length; i ++) {
		this.steps[i].display();
	}
	utils.tempVars.partOfAStair = false;
});
Stairs.method("update", function() {
	utils.tempVars.partOfAStair = true;
	for(var i = 0; i < this.steps.length; i ++) {
		this.steps[i].update();
	}
	utils.tempVars.partOfAStair = false;
});
Stairs.method("translate", function(x, y) {
	for(var i = 0; i < this.steps.length; i ++) {
		var step = this.steps[i];
		step.x += x;
		step.y += y;
	}
});
function Altar(x, y, type) {
	/* Only represents the particles of the altar. The actual stairs + platform are created using Blocks and Stairs. */
	this.x = x;
	this.y = y;
	this.type = type;
	this.particles = [];
};
Altar.method("update", function() {
	if(p.x + p.hitbox.right > this.x - 20 && p.x + p.hitbox.left < this.x + 20 && p.y + p.hitbox.bottom > this.y - 20 && p.y + p.hitbox.top < this.y + 20) {
		if(this.type === "health") {
			p.health += 10;
			p.maxHealth += 10;
		}
		else if(this.type === "mana") {
			p.mana += 10;
			p.maxMana += 10;
		}
		this.toBeRemoved = true;
	}
	for(var i = 0; i < this.particles.length; i ++) {
		this.particles[i].update();
		if(this.particles[i].opacity <= 0) {
			this.particles.splice(i, 1);
			continue;
		}
	}
});
Altar.method("display", function() {
	for(var i = 0; i < 5; i ++) {
		this.particles.push(new Particle(this.type === "health" ? "rgb(255, 0, 0)" : "rgb(0, 0, 255)", this.x + Math.randomInRange(-20, 20), this.y + Math.randomInRange(-20, 20), Math.randomInRange(-1, 1), Math.randomInRange(-1, 1), 10));
	}
	for(var i = 0; i < this.particles.length; i ++) {
		this.particles[i].display();
	}
});
Altar.method("remove", function() {
	game.dungeon[game.theRoom].content = game.dungeon[game.theRoom].content.concat(this.particles);
});
Altar.method("translate", function(x, y) {
	this.x += x;
	this.y += y;
	for(var i = 0; i < this.particles.length; i ++) {
		var particle = this.particles[i];
		particle.x += x;
		particle.y += y;
	}
});
function Forge(x, y) {
	this.x = x;
	this.y = y;
	this.used = false;
	this.init = false;
	this.particles = [];

	this.DEPTH = 0.99;
};
Forge.method("display", function() {
	/* fire */
	for(var i = 0; i < this.particles.length; i ++) {
		this.particles[i].display();
	}

	var self = this;
	function displayForge() {
		for(var scale = -1; scale <= 1; scale += (1 * 2)) {
			c.save(); {
				c.scale(scale, 1);
				c.fillRect(50, -76, 50, 76);
				c.fillArc(50, -75, 50, Math.rad(-90), Math.rad(0), true);
			} c.restore();
		}
		c.fillRect(-50 - 1, -300 - 1, 100 + 2, 200);
		// c.fillRect(-50, -60, 100, 20);
		c.fillRect(-50, -10, 100, 10);
		for(var x = -30; x <= 30; x += 30) {
			c.fillRect(x - 10, -40 - 1, 20, 40 + 1);
		}
	};
	/* sides of forge */
	game.dungeon[game.theRoom].render(
		new RenderingOrderObject(
			function() {
				// return;
				c.save(); {
					var location = graphics3D.point3D(self.x, self.y, 0.9);
					c.translate(location.x, location.y);
					c.scale(0.9, 0.9);
					c.fillStyle = "rgb(150, 150, 150)";
					displayForge();
				} c.restore();
			},
			0.9
		)
	);
	graphics3D.cube(this.x - 50, this.y - 60, 100, 20, 0.9, this.DEPTH);
	for(var x = -30; x <= 30; x += 30) {
		// c.fillRect(x - 10, -40 - 1, 20, 40 + 1);
		graphics3D.cube(this.x + x - 10, this.y - 40 - 1, 20, 40 + 1, 0.9, this.DEPTH);
	}
	/* front of forge */
	game.dungeon[game.theRoom].render(
		new RenderingOrderObject(
			function() {
				// return;
				c.save(); {
					var location = graphics3D.point3D(self.x, self.y, self.DEPTH);
					c.translate(location.x, location.y);
					c.scale(self.DEPTH, self.DEPTH);
					c.fillStyle = "rgb(110, 110, 110)";
					displayForge();
				} c.restore();
			},
			this.DEPTH
		)
	);
	/* crop out dark gray parts on side of forge */
	graphics3D.plane3D(this.x + 50, this.y - 75, this.x + 50, this.y - 125, 0.9, this.DEPTH, "rgb(150, 150, 150)");
	graphics3D.plane3D(this.x - 50, this.y - 75, this.x - 50, this.y - 125, 0.9, this.DEPTH, "rgb(150, 150, 150)");
});
Forge.method("update", function() {
	if(Math.dist(this.x, p.x) <= 100 && !this.used && p.guiOpen === "none") {
		ui.infoBar.actions.s = "use forge";
		if(io.keys[83]) {
			p.guiOpen = "reforge-item";
		}
	}
	for(var i = 0; i < this.particles.length; i ++) {
		this.particles[i].update();
		if(this.particles[i].toBeRemoved) {
			this.particles.splice(i, 1);
			continue;
		}
	}
	if(!this.used) {
		for(var i = 0; i < 5; i ++) {
			this.particles.push(new Particle("rgb(255, 128, 0)", this.x + Math.randomInRange(-50, 50), this.y - 10, Math.randomInRange(-1, 1), Math.randomInRange(-2, 0), 10));
			this.particles.lastItem().z = Math.randomInRange(this.DEPTH - 0.15, this.DEPTH);
		}
		for(var i = 0; i < 5; i ++) {
			this.particles.push(new Particle("rgb(255, 128, 0)", this.x + Math.randomInRange(-50, 50), this.y - 60, Math.randomInRange(-1, 1), Math.randomInRange(-2, 0), 10));
			this.particles.lastItem().z = Math.randomInRange(this.DEPTH - 0.15, this.DEPTH);
		}
	}
});
Forge.method("translate", function(x, y) {
	this.x += x;
	this.y += y;
	for(var i = 0; i < this.particles.length; i ++) {
		var particle = this.particles[i];
		particle.x += x;
		particle.y += y;
	}
});
function Pulley(x1, w1, x2, w2, y, maxHeight) {
	this.x1 = x1;
	this.y1 = y;
	this.w1 = w1;
	this.x2 = x2;
	this.y2 = y;
	this.w2 = w2;
	this.velocity = { x: 0, y: 0 };
	this.ORIGINAL_Y = y;
	this.maxHeight = maxHeight;
};
Pulley.method("display", function() {
	function platform(x, y, w) {
		new Platform(x, y, w).display();
		c.lineWidth = 3;
		c.strokeStyle = "rgb(150, 150, 150)";
		graphics3D.line3D(x, y, 0.8999999, x, -100, 0.8999999, 3);
		graphics3D.line3D(x, y, 1.1, x, -100, 1.1, 3);
		graphics3D.line3D(x + w, y, 0.8999999, x + w, -100, 0.8999999, 3);
		graphics3D.line3D(x + w, y, 1.1, x + w, -100, 1.1, 3);
	};
	platform(this.x1, this.y1, this.w1);
	platform(this.x2, this.y2, this.w2);
});
Pulley.method("update", function() {
	new Platform(this.x1, this.y1, this.w1).update();
	new Platform(this.x2, this.y2, this.w2).update();
	/* Moving */
	this.steppedOn1 = false;
	this.steppedOn2 = false;
	if(p.x + p.hitbox.right > this.x1 && p.x + p.hitbox.left < this.x1 + this.w1 && p.canJump && this.y1 < this.ORIGINAL_Y + this.maxHeight) {
		this.velocity.y += (this.velocity.y < 3) ? 0.1 : 0;
		this.steppedOn1 = true;
	}
	if(p.x + p.hitbox.right > this.x2 && p.x + p.hitbox.left < this.x2 + this.w2 && p.canJump && this.y2 < this.ORIGINAL_Y + this.maxHeight) {
		this.velocity.y += (this.velocity.y > -3) ? -0.1 : 0;
		this.steppedOn2 = true;
	}
	this.y1 += this.velocity.y;
	this.y2 -= this.velocity.y;
	if(this.steppedOn1) {
		p.y += this.velocity.y;
	}
	else if(this.steppedOn2) {
		p.y -= this.velocity.y;
	}
	if(!this.steppedOn1 && !this.steppedOn2) {
		this.velocity.y = 0;
	}
	if(this.y1 > this.ORIGINAL_Y + this.maxHeight) {
		this.steppedOn1 = false;
	}
	if(this.y2 > this.ORIGINAL_Y + this.maxHeight) {
		this.steppedOn2 = false;
	}
});
Pulley.method("translate", function(x, y) {
	this.x1 += x;
	this.y1 += y;
	this.x2 += x;
	this.y2 += y;
});
function Pillar(x, y, h) {
	this.x = x;
	this.y = y;
	this.h = h;
};
Pillar.method("display", function() {
	/* Base */
	graphics3D.cube(this.x - 30, this.y - 20, 60, 21, 0.9, 1.1);
	graphics3D.cube(this.x - 40, this.y - 10, 80, 10, 0.9, 1.1);
	/* Top */
	graphics3D.cube(this.x - 41, this.y - this.h, 80, 12, 0.9, 1.1);
	graphics3D.cube(this.x - 30, this.y - this.h + 10, 60, 10, 0.9, 1.1);
	/* Pillar */
	graphics3D.cube(this.x - 20, this.y - this.h + 20, 40, this.h - 40, 0.95, 1.05);
	/* manual override to make sure enemies and stuff get displayed in front of the pillar (even though the pillar is technically in front) */
	game.dungeon[game.theRoom].renderingObjects.lastItem().depth = 1;
	game.dungeon[game.theRoom].renderingObjects.lastItem().zOrder = -1;
});
Pillar.method("update", function() {
	/* Base collisions */
	collisions.solids.rect(this.x - 30, this.y - 20, 60, 21, {illegalHandling: "teleport"});
	collisions.solids.rect(this.x - 40, this.y - 10, 80, 10, {illegalHandling: "teleport"});
	/* Top collisions */
	collisions.solids.rect(this.x - 41, this.y - this.h, 80, 12);
	collisions.solids.rect(this.x - 30, this.y - this.h + 10, 60, 10);
});
function Statue(x, y) {
	this.x = x;
	this.y = y;
	var possibleItems = game.getRoomByID("secret1").getPossibleStatueItems();
	this.itemHolding = new (possibleItems.randomItem()) ();
	this.facing = ["left", "right"].randomItem();
	this.pose = ["kneeling", "standing"].randomItem();
};
Statue.method("display", function() {
	/* item in hands */
	var self = this;
	if(!this.itemStolen) {
		game.dungeon[game.theRoom].render(
			new RenderingOrderObject(
				function() {
					if(self.itemHolding instanceof MeleeWeapon) {
						if(self.pose === "standing") {
							c.translate(self.x, self.y + 72);
							c.scale((self.facing === "left" ? -1 : 1), 1);
							c.translate(20, 0);
							c.rotate(Math.rad(45));
							self.itemHolding.display("attacking");
						}
						else {
							c.translate(self.x, self.y + 52);
							c.scale((self.facing === "left" ? -1 : 1), 1);
							c.translate(24, 0);
							self.itemHolding.display("attacking");
						}
					}
					else {
						c.translate(self.x, self.y + (self.itemHolding instanceof MagicWeapon ? 32 : 52));
						c.scale((self.facing === "left" ? -1 : 1), 1);
						c.translate((self.itemHolding instanceof MagicWeapon ? 28 : 20), 0);
						c.scale(2, 2);
						self.itemHolding.display("aiming");
					}
				},
				1,
				(this.itemHolding instanceof RangedWeapon) ? 1 : -1
			)
		);
	}
	/* statue */
	game.dungeon[game.theRoom].render(
		new RenderingOrderObject(
			function() {
				c.fillStyle = "rgb(125, 125, 125)";
				c.lineCap = "round";
				c.lineWidth = 10;
				c.save(); {
					c.translate(self.x, self.y);
					c.scale(1, 1.2);
					c.fillCircle(0, 24, 20);
				} c.restore();
				/* body */
				c.strokeStyle = "rgb(125, 125, 125)";
				c.strokeLine(self.x, self.y + 24, self.x, self.y + 72);
				/* legs */
				if(self.pose === "standing") {
					c.strokeLine(self.x, self.y + 72, self.x - 10, self.y + 92);
					c.strokeLine(self.x, self.y + 72, self.x + 10, self.y + 92);
				}
				else if(self.facing === "left") {
					c.strokeLine(
						self.x, self.y + 72,
						self.x - 20, self.y + 72,
						self.x - 20, self.y + 92
					);
					c.strokeLine(
						self.x, self.y + 72,
						self.x, self.y + 92,
						self.x + 20, self.y + 92
					);
				}
				else if(self.facing === "right") {
					c.strokeLine(
						self.x, self.y + 72,
						self.x + 20, self.y + 72,
						self.x + 20, self.y + 92
					);
					c.strokeLine(
						self.x, self.y + 72,
						self.x, self.y + 92,
						self.x - 20, self.y + 92
					);
				}
				/* arms */
				var leftArmUp = (self.facing === "left" && (!(self.itemHolding instanceof MeleeWeapon) || self.pose === "kneeling"));
				var rightArmUp = (self.facing === "right" && (!(self.itemHolding instanceof MeleeWeapon) || self.pose === "kneeling"));
				c.strokeLine(self.x, self.y + 52, self.x - 20, self.y + (leftArmUp ? 52 : 72));
				c.strokeLine(self.x, self.y + 52, self.x + 20, self.y + (rightArmUp ? 52 : 72));
			},
			1
		)
	);
	/* pedestal */
	graphics3D.cube(this.x - 60, this.y + 96, 120, 34, 0.95, 1.05, "rgb(110, 110, 110)", "rgb(150, 150, 150)");
});
Statue.method("update", function() {
	/* stealing Weapons */
	if(io.keys[83] && Math.dist(this.x, this.y, p.x, p.y) <= 100 && !this.itemStolen) {
		this.itemStolen = true;
		p.addItem(this.itemHolding);
	}
});
function TiltPlatform(x, y) {
	this.x = x;
	this.y = y;
	this.ORIGINAL_X = x;
	this.ORIGINAL_Y = y;
	this.platformX = x;
	this.platformY = y;
	this.tilt = 0;
	this.tiltDir = 0;
	this.interact = true;
	this.dir = null;
	this.velocity = { x: 0, y: 0 };
};
TiltPlatform.method("display", function() {
	graphics3D.cube(this.x - 5, this.y + 10, 10, 8000, 0.99, 1.01);
	graphics3D.polygon3D("rgb(110, 110, 110)", "rgb(150, 150, 150)", 0.9, 1.1, [
		{
			x: this.p1.x + this.platformX,
			y: this.p1.y + this.platformY
		},
		{
			x: this.p2.x + this.platformX,
			y: this.p2.y + this.platformY
		},
		{
			x: -(this.p1.x) + this.platformX,
			y: -(this.p1.y) + this.platformY
		},
		{
			x: -(this.p2.x) + this.platformX,
			y: -(this.p2.y) + this.platformY
		}
	]);
});
TiltPlatform.method("update", function() {
	this.p1 = Math.rotate(-75, -10, Math.floor(this.tilt));
	this.p2 = Math.rotate(75, -10, Math.floor(this.tilt));
	/* hitbox */
	collisions.solids.line(this.p1.x + this.platformX, this.p1.y + this.platformY, this.p2.x + this.platformX, this.p2.y + this.platformY, {illegalHandling: "teleport"});
	/* tilting */
	if(p.x + p.hitbox.right > this.x - 75 && p.x + p.hitbox.left < this.x + 75 && p.canJump && this.interact) {
		if(p.x > this.x) {
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
	this.tilt = Math.modulateIntoRange(this.tilt, 0, 360);
	/* falling */
	this.collides = function() {
		c.beginPath();
		c.moveTo(this.p1.x + this.platformX, this.p1.y + this.platformY);
		c.lineTo(this.p2.x + this.platformX, this.p2.y + this.platformY);
		c.lineTo(-this.p1.x + this.platformX, -this.p1.y + this.platformY);
		c.lineTo(-this.p2.x + this.platformX, -this.p2.y + this.platformY);
		for(var x = -5; x <= 5; x += 10) {
			if(c.isPointInPath(this.ORIGINAL_X + x, this.ORIGINAL_Y + 10)) {
				return true;
			}
		}
		return false;
	};
	this.platformY += 5;
	while(this.collides()) {
		this.platformY --;
	};
	if(this.tilt > 45 && this.tilt < 90 && this.x < this.ORIGINAL_X + 10) {
		this.velocity.x += 0.1;
	}
	if(this.tilt < 315 && this.tilt > 270 && this.x > this.ORIGINAL_X - 10) {
		this.velocity.x -= 0.1;
	}
	if(this.y - this.ORIGINAL_Y > 800) {
		this.platformX = -8000; // move offscreen
	}
	this.platformX += this.velocity.x;
	this.platformY += this.velocity.y;
});
TiltPlatform.method("collides", function(x, y) {
	var p1 = graphics3D.point3D(this.p1.x + this.platformX, this.p1.y + this.platformY, 1.1);
	var p2 = graphics3D.point3D(this.p2.x + this.platformX, this.p2.y + this.platformY, 1.1);
	var p3 = graphics3D.point3D(-this.p1.x + this.platformX, -this.p1.y + this.platformY, 1.1);
	var p4 = graphics3D.point3D(-this.p2.x + this.platformX, -this.p2.y + this.platformY, 1.1);
	c.beginPath();
	c.polygon(
		{ x: p1.x, y: -800 },
		{ x: p2.x, y: -800 },
		p3,
		p4
	);
	return c.isPointInPath(x, y);
});
TiltPlatform.method("translate", function(x, y) {
	this.x += x;
	this.y += y;
	this.platformX += x;
	this.platformY += y;
});
function Bridge(x, y) {
	this.x = x;
	this.y = y;
};
Bridge.method("display", function() {
	function displayBridge() {
		/* clip out arches */
		c.lineWidth = 4;
		for(var x = -200; x <= 200; x += 200) {
			var archWidth = (x === 0) ? 150 : 100;
			var y = (x === 0) ? 200 : 250;
			var left = x - (archWidth / 2);
			var right = x + (archWidth / 2);
			c.beginPath();
			c.line(left, canvas.height + 100, left, y);
			c.arc(x, y, archWidth / 2, Math.rad(180), Math.rad(360));
			c.lineTo(right, canvas.height + 100);
			c.stroke();
			c.invertPath();
			c.clip("evenodd");
		}
		/* draw bridge with arches cut out */
		c.fillCircle(0, 500, 500);
	};
	var self = this;
	game.dungeon[game.theRoom].render(
		new RenderingOrderObject(
			function() {
				var backOfBridge = graphics3D.point3D(self.x, self.y, 0.9);
				c.fillStyle = "rgb(150, 150, 150)";
				c.strokeStyle = "rgba(150, 150, 150, 0)";
				c.translate(backOfBridge.x, backOfBridge.y);
				c.scale(0.9, 0.9);
				displayBridge();
			},
			0.9
		)
	);
	game.dungeon[game.theRoom].render(
		new RenderingOrderObject(
			function() {
				var frontOfBridge = graphics3D.point3D(self.x, self.y, 1.1);
				c.fillStyle = "rgb(110, 110, 110)";
				c.strokeStyle = "rgb(150, 150, 150)";
				c.translate(frontOfBridge.x, frontOfBridge.y);
				c.scale(1.1, 1.1);
				displayBridge();
			},
			1.1
		)
	);
});
Bridge.method("update", function() {
	collisions.solids.circle(this.x, this.y + 500, 500);
});
function Decoration(x, y) {
	/*
	Never actually displayed in-game. Selects one of the specific types of decorations to display.
	*/
	this.x = x;
	this.y = y;
	this.type = null;
};
Decoration.method("update", function() {
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
			function torch(x, y) {
				game.dungeon[game.theRoom].content[selfIndex] = new Torch(x, y);
				game.dungeon[game.theRoom].content[selfIndex].lit = true;
			};
			function banner(x, y) {
				game.dungeon[game.theRoom].content[selfIndex] = new Banner(x, y - 30);
			};
			function window(x, y) {
				game.dungeon[game.theRoom].content[selfIndex] = new GlassWindow(x, y, game.dungeon[game.theRoom].colorScheme);
			};
			var decoration = [torch, banner, window].randomItem();
			if(TESTING_MODE) {
				// decoration = torch;
			}
			decoration(this.x, this.y);
		}
	}
});
function Banner(x, y, color) {
	this.x = x;
	this.y = y;
	this.color = color;
	this.graphic = null;
};
Banner.method("display", function() {
	var p1 = graphics3D.point3D(this.x - 20, this.y - 40, 0.9);
	var p2 = graphics3D.point3D(this.x - 20, this.y + 45, 0.9);
	var p3 = graphics3D.point3D(this.x, this.y + 35, 0.9);
	var p4 = graphics3D.point3D(this.x + 20, this.y + 45, 0.9);
	var p5 = graphics3D.point3D(this.x + 20, this.y - 40, 0.9);
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
		game.dungeon[game.theRoom].render(new RenderingOrderObject(
			function() {
				c.fillStyle = gradient;
				c.fillPoly(p1, p2, p3, p4, p5);
			},
			0.9
		));
	}
	else if(this.graphic === "border") {
		var center = graphics3D.point3D(this.x, this.y, 0.9);
		var p6 = Math.scaleAboutPoint(p1.x, p1.y, center.x, center.y, 0.7);
		var p7 = Math.scaleAboutPoint(p2.x, p2.y, center.x, center.y, 0.7);
		var p8 = Math.scaleAboutPoint(p3.x, p3.y, center.x, center.y, 0.7);
		var p9 = Math.scaleAboutPoint(p4.x, p4.y, center.x, center.y, 0.7);
		var p10 = Math.scaleAboutPoint(p5.x, p5.y, center.x, center.y, 0.7);

		game.dungeon[game.theRoom].render(new RenderingOrderObject(
			function() {
				c.fillStyle = color1;
				c.fillPoly(p1, p2, p3, p4, p5);

				c.fillStyle = color2;
				c.fillPoly(p6, p7, p8, p9, p10);
			},
			0.9
		));
	}
	graphics3D.cube(this.x - 30, this.y - 50, 60, 10, 0.9, 0.92, "rgb(139, 69, 19)", "rgb(159, 89, 39)");
});
Banner.method("update", function() {
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
			this.graphic = ["gradient", "border"].randomItem();
		}
		if(TESTING_MODE) {
			this.graphic = "border";
		}
	}
});
function GlassWindow(x, y, color) {
	this.x = x;
	this.y = y;
	this.color = color;
};
GlassWindow.method("update", function() {
	game.dungeon[game.theRoom].background = "plain";
});
GlassWindow.method("display", function() {
	c.save(); {
		var center = graphics3D.point3D(this.x, this.y, 0.9);
		/* delete bricks behind window */
		function clip() {
			c.beginPath();
			c.rect(center.x - 25, center.y - 100, 50, 100);
			c.circle(center.x, center.y - 100, 25);
			c.clip();
		};
		c.fillStyle = "rgb(100, 100, 100)";
		c.fillCanvas();
		/* background */
		graphics3D.cube(this.x - 40, this.y - 200, 20, 190, 0.72, 0.78, null, null);
		graphics3D.cube(this.x + 20, this.y - 200, 20, 190, 0.72, 0.78, null, null);
		graphics3D.cube(this.x - 200, this.y - 10, 400, 100, 0.7, 0.8, null, null);
		var renderingObjects = game.dungeon[game.theRoom].renderingObjects;
		for(var i = renderingObjects.length - 6; i < renderingObjects.length; i ++) {
			var obj = renderingObjects[i];
			obj.transform = clip;
		}
		/* cross patterns */
		var self = this;
		game.dungeon[game.theRoom].render(new RenderingOrderObject(
			function() {
				clip();
				if(self.color === "red") {
					c.strokeStyle = "rgb(200, 50, 0)";
				}
				else if(self.color === "green") {
					c.strokeStyle = "rgb(25, 128, 25)";
				}
				else if(self.color === "blue") {
					c.strokeStyle = "rgb(0, 0, 100)";
				}
				c.lineWidth = 1;
				for(var y = -150; y < 0; y += 10) {
					c.strokeLine(center.x - 25, center.y + y, center.x + 25, center.y + y + 50);
					c.strokeLine(center.x + 25, center.y + y, center.x - 25, center.y + y + 50);
				}
			},
			0.9
		));
		/* window */
		game.dungeon[game.theRoom].render(new RenderingOrderObject(
			function() {
				c.lineWidth = 4;
				c.strokeStyle = "rgb(50, 50, 50)";
				if(self.color === "red") {
					c.fillStyle = "rgba(255, 20, 0, 0.5)";
				}
				else if(self.color === "green") {
					c.fillStyle = "rgba(0, 128, 20, 0.5)";
				}
				else if(self.color === "blue") {
					c.fillStyle = "rgba(0, 0, 128, 0.5)";
				}
				c.fillRect(center.x - 25, center.y - 100, 50, 100);
				c.strokeRect(center.x - 25, center.y - 100, 50, 100);
				c.fillArc(center.x, center.y - 100, 25, Math.rad(180), Math.rad(360));
				c.stroke();
			},
			0.9
		));
	} c.restore();
});
function Roof(x, y, w) {
	this.x = x;
	this.y = y;
	this.w = w;
	this.type = null;
};
Roof.method("update", function() {
	if(this.type === null) {
		this.type = ["none", "flat", "sloped", "curved"].randomItem();
		if(TESTING_MODE) {
			this.type = "curved";
		}
	}
	if(this.type === "flat") {
		collisions.solids.rect(-100, this.y - 1100, 1000, 1000);
	}
	else if(this.type === "sloped") {
		collisions.solids.line(this.x - this.w, this.y, this.x - (this.w / 3), this.y - 100);
		collisions.solids.line(this.x + this.w, this.y, this.x + (this.w / 3), this.y - 100);
		collisions.solids.rect(this.x - this.w, this.y - 200, 2 * this.w, 100);
	}
	else if(this.type === "curved") {
		while(Math.distSq(p.x, this.y - (this.y - (p.y + p.hitbox.top)) / 2, this.x, this.y) > (this.w / 2) * (this.w / 2) && p.y + p.hitbox.top < this.y) {
			p.y ++;
		}
	}
});
Roof.method("display", function() {
	if(this.type === "flat") {
		graphics3D.cube(-100, this.y - 1100, 1000, 1000, 0.9, 1.1);
	}
	else if(this.type === "sloped") {
		graphics3D.polygon3D("rgb(110, 110, 110)", "rgb(150, 150, 150)", 0.9, 1.1, [
			{
				x: -100,
				y: -100
			},
			{
				x: -100,
				y: this.y
			},
			{
				x: this.x - this.w,
				y: this.y
			},
			{
				x: this.x - (this.w / 3),
				y: this.y - 100
			},
			{
				x: this.x + (this.w / 3),
				y: this.y - 100
			},
			{
				x: this.x + this.w,
				y: this.y
			},
			{
				x: 900,
				y: this.y - 100
			},
			{
				x: 900,
				y: -100
			}
		]);
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
			array.push({x: this.points[Math.floor(i)].x, y: this.points[Math.floor(i)].y});
		}
		for(var i = 1; i < array.length; i ++) {
			collisions.solids.line(array[i].x, array[i].y, array[i - 1].x, array[i - 1].y);
		}
		array.splice(0, 0, {x: -100, y: -100}, {x: -100, y: this.y}, {x: this.x - this.w, y: this.y});
		array.push({x: this.x + this.w, y: this.y});
		array.push({x: canvas.width + 100, y: this.y});
		array.push({x: canvas.width + 100, y: -100});
		graphics3D.polygon3D("rgb(110, 110, 110)", "rgb(150, 150, 150)", 0.9, 1.1, array);
	}
});
Roof.method("translate", function(x, y) {
	this.x += x;
	this.y += y;
	if(this.type === "curved" && Object.typeof(this.points) === "array") {
		for(var i = 0; i < this.points.length; i ++) {
			var point = this.points[i];
			point.x += x;
			point.y += y;
		}
	}
});
function Fountain(x, y) {
	this.x = x;
	this.y = y;
	this.waterAnimations = [];
};
Fountain.method("display", function() {
	/* water slot */
	graphics3D.cutoutRect(this.x - 50, this.y - 160, 100, 10, "rgba(0, 0, 0, 0)", "rgba(150, 150, 150)", 0.8, 0.9);

	var center = graphics3D.point3D(this.x, this.y, 0.92);
	game.dungeon[game.theRoom].setRenderingStyle(function() {
		c.beginPath();
		c.rect(center.x - (50 * 0.92), 0, (100 * 0.92), canvas.height);
		c.clip();
	});
	c.save(); {
		/* water */
		graphics3D.cube(this.x - 50, this.y - 150, 100, 10, 0.8, 0.92, "rgb(100, 100, 255)", "rgb(100, 100, 255)");
		graphics3D.cube(this.x - 50, this.y - 150, 100, 150, 0.9, 0.92, "rgba(100, 100, 255, 0)", "rgb(100, 100, 255)");
		graphics3D.cube(this.x - 50, this.y - 150, 100, 150, 0.9, 0.92, "rgb(100, 100, 255)", "rgb(100, 100, 255)");
		/*
		Each water graphic's y-value is on a scale from 0 to 250. Each one is 50 tall. The corner of the fountain is at 100, so any value less than 100 is on the horizontal section and anything greater than 100 is on the vertical section.
		*/
		var self = this;
		const HORIZONTAL_FOUNTAIN_HEIGHT = 100;
		const TOTAL_FOUNTAIN_HEIGHT = 250;
		const WATER_ANIMATION_HEIGHT = 50;
		function displayWaterGraphic(p1, p2) {
			/*
			This function uses currying to avoid the problem that arises when creating functions in loops where the function only has access to the current value of the loop variable, instead of being able to take a snapshot of that value.
			*/
			return function() {
				c.strokeStyle = "rgb(120, 120, 255)";
				c.lineWidth = 3;
				c.strokeLine(p1, p2);
			};
		};
		function calculatePosition(x, y) {
			/*
			Returns the three-dimensional location of a water animation at ('x', 'y')
			*/
			if(y < HORIZONTAL_FOUNTAIN_HEIGHT) {
				return {
					x: self.x + x,
					y: self.y - 150,
					z: Math.map(y, 0, HORIZONTAL_FOUNTAIN_HEIGHT, 0.8, 0.92)
				};
			}
			else {
				return {
					x: self.x + x,
					y: self.y - 150 + Math.map(y, HORIZONTAL_FOUNTAIN_HEIGHT, TOTAL_FOUNTAIN_HEIGHT, 0, 150),
					z: 0.92
				};
			}
		};
		for(var i = 0; i < this.waterAnimations.length; i ++) {
			var topY = this.waterAnimations[i].y;
			var bottomY = this.waterAnimations[i].y + 50;
			if(topY > 225) {
				this.waterAnimations.splice(i, 1);
				i --;
				continue;
			}
			var p1 = calculatePosition(this.waterAnimations[i].x, this.waterAnimations[i].y);
			var corner = calculatePosition(this.waterAnimations[i].x, HORIZONTAL_FOUNTAIN_HEIGHT);
			var p2 = calculatePosition(this.waterAnimations[i].x, this.waterAnimations[i].y + 50);
			if(topY < HORIZONTAL_FOUNTAIN_HEIGHT && bottomY > HORIZONTAL_FOUNTAIN_HEIGHT) {
				game.dungeon[game.theRoom].render(new RenderingOrderObject(
					displayWaterGraphic(graphics3D.point3D(p1.x, p1.y, p1.z), graphics3D.point3D(corner.x, corner.y, corner.z)),
					p1.z,
					1
				));
				game.dungeon[game.theRoom].render(new RenderingOrderObject(
					displayWaterGraphic(graphics3D.point3D(corner.x, corner.y, corner.z), graphics3D.point3D(p2.x, p2.y, p2.z)),
					corner.z,
					1
				));
			}
			else {
				game.dungeon[game.theRoom].render(new RenderingOrderObject(
					displayWaterGraphic(graphics3D.point3D(p1.x, p1.y, p1.z), graphics3D.point3D(p2.x, p2.y, p2.z)),
					Math.min(p1.z, p2.z),
					1
				));
			}
		}
	} c.restore();
	/* base */
	game.dungeon[game.theRoom].clearRenderingStyle();
	graphics3D.cube(this.x - 100, this.y - 50, 10, 50, 0.9, 1);
	graphics3D.cube(this.x + 90, this.y - 50, 10, 50, 0.9, 1);
	graphics3D.cube(this.x - 100, this.y - 50, 200, 50, 0.98, 1);
});
Fountain.method("update", function() {
	for(var i = 0; i < this.waterAnimations.length; i ++) {
		this.waterAnimations[i].y += 2;
	}
	if(utils.frameCount % 15 === 0) {
		this.waterAnimations.push( {x: Math.randomInRange(-50, 50), y: -50} );
	}
});
function MovingWall(x, y, w, h, startZ) {
	this.x = x;
	this.y = y;
	this.w = w;
	this.h = h;
	this.z = startZ || 0.9;
	this.zDir = 0;
};
MovingWall.method("exist", function() {
	if(this.z >= 1) {
		collisions.solids.rect(this.x, this.y, this.w, this.h);
	}
	if(this.z > 0.9) {
		var color = Math.map(this.z, 0.9, 1.1, 100, 110);
		color = (color > 110) ? 110 : color;
		graphics3D.cube(this.x, this.y, this.w, this.h, 0.9, this.z, "rgb(" + color + ", " + color + ", " + color + ")", "rgb(150, 150, 150)");
	}
	this.z += this.zDir;
	this.z = Math.max(0.9, this.z);
	this.z = Math.min(1.1, this.z);
});

/** ROOM DATA **/
function Room(type, content, id, minWorldY, background) {
	this.type = type;
	this.content = content;
	this.id = id;
	this.pathScore = null;
	this.background = background || null;
	this.minWorldY = minWorldY;
	this.colorScheme = null;
	this.renderingObjects = [];
};
Room.method("exist", function(index) {
	c.globalAlpha = 1;
	c.fillStyle = "rgb(100, 100, 100)";
	c.resetTransform();
	c.fillCanvas();
	if(this.background === null) {
		this.background = ["plain", "bricks"].randomItem();
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
	this.content.forEach(function(obj) {
		if(obj instanceof Enemy) {
			//this.content[i].health = this.content[i].maxHealth;
			// this.content.splice(i, 1);
		}
	});
	/* load all types of items */
	for(var i = 0; i < this.content.length; i ++) {
		var obj = this.content[i];
		if(!obj.initialized && typeof obj.init === "function") {
			obj.init();
		}
		if(obj instanceof Enemy) {
			Enemy.prototype.update.call(obj);
			/* show hitboxes */
			if(SHOW_HITBOXES) {
				debugging.hitboxes.push({x: obj.x + obj.hitbox.left, y: obj.y + obj.hitbox.top, w: Math.dist(obj.hitbox.left, obj.hitbox.right), h: Math.dist(obj.hitbox.top, obj.hitbox.bottom), color: "green"});
			}
		}
		else if(obj instanceof Boulder) {
			if(obj.toBeRemoved) {
				this.content.splice(i, 1);
				continue;
			}
			boulderIndexes.push(i);
		}
		else if(typeof obj.update === "function") {
			obj.update();
		}
		if(obj.toBeRemoved) {
			if(typeof obj.remove === "function") {
				obj.remove();
			}
			this.content.splice(i, 1);
			i --;
			continue;
		}
		if(obj instanceof BoulderVoid) {
			p.canUseEarth = false;
		}
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
});
Room.method("display", function() {
	for(var i = 0; i < this.content.length; i ++) {
		var obj = this.content[i];
		if(typeof obj.translate === "function") {
			obj.translate(game.camera.getOffsetX(), game.camera.getOffsetY());
		}
		else {
			obj.x += game.camera.getOffsetX();
			obj.y += game.camera.getOffsetY();
		}
	}
	this.content.forEach(
		function(obj) {
			if(obj instanceof Item) {
				obj._display();
			}
			else if(obj instanceof Enemy) {
				Enemy.prototype.display.call(obj);
			}
			else if(typeof obj.display === "function") {
				obj.display();
			}
		}
	);
	/* Displays the objects in the room in order. */
	var sorter = function(a, b) {
		if(a.depth === b.depth) {
			return utils.sortAscending(a.zOrder, b.zOrder);
		}
		else {
			return utils.sortAscending(a.depth, b.depth);
		}
	};
	this.renderingObjects = this.renderingObjects.sort(sorter);
	c.reset();
	for(var i = 0; i < this.renderingObjects.length; i ++) {
		c.save(); {
			if(typeof this.renderingObjects[i].transform === "function") {
				this.renderingObjects[i].transform();
			}
			if(typeof this.renderingObjects[i].renderingStyle === "function") {
				this.renderingObjects[i].renderingStyle();
			}
			this.renderingObjects[i].display();
		} c.restore();
	}

	/* add player hitbox + display hitboxes */
	p.displayHitbox();

	for(var i = 0; i < this.content.length; i ++) {
		var obj = this.content[i];
		if(typeof obj.translate === "function") {
			obj.translate(-game.camera.getOffsetX(), -game.camera.getOffsetY());
		}
		else {
			obj.x -= game.camera.getOffsetX();
			obj.y -= game.camera.getOffsetY();
		}
	}
});
Room.method("displayBackground", function() {
	if(this.background === "bricks") {
		c.save(); {
			c.translate((-game.camera.x * 0.9) % 100, (-game.camera.y * 0.9) % 100);
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
});
Room.method("displayShadowEffect", function() {
	var gradient = c.createRadialGradient(400, 400, 0, 400, 400, 600);
	c.globalAlpha = 1;
	gradient.addColorStop(0, "rgba(0, 0, 0, 0)");
	gradient.addColorStop(1, "rgba(0, 0, 0, 255)");
	c.fillStyle = gradient;
	c.fillCanvas();
});
Room.method("render", function(object) {
	/*
	Parameter: a RenderingOrderObject or RenderingOrderShape to be rendered.
	*/
	if(this.groupingRenderedObjects) {
		this.renderingObjects[this.renderingObjects.length - 1].objects.push(object);
		this.renderingObjects[this.renderingObjects.length - 1].depth = object.depth;
	}
	else {
		this.renderingObjects.push(object);
	}
	this.renderingObjects[this.renderingObjects.length - 1].renderingStyle = this.renderingStyle;
});
Room.method("beginRenderingGroup", function() {
	this.groupingRenderedObjects = true;
	this.renderingObjects.push(new RenderingOrderGroup());
});
Room.method("endRenderingGroup", function() {
	this.groupingRenderedObjects = false;
});
Room.method("setRenderingStyle", function(func) {
	/*
	Allows you to set a function that will be run before every shape is rendered until it is turned off using Room.clearRenderingStyle().
	*/
	this.renderingStyle = func;
});
Room.method("clearRenderingStyle", function(func) {
	/*
	Allows you to set a function that will be run before every shape is rendered until it is turned off using Room.clearRenderingStyle().
	*/
	this.renderingStyle = undefined;
});
Room.method("getInstancesOf", function(type) {
	var objects = [];
	for(var i = 0; i < this.content.length; i ++) {
		var obj = this.content[i];
		if(obj instanceof type) {
			objects.push(obj);
		}
	}
	return objects;
});
Room.method("displayImmediately", function(func, thisArg) {
	/*
	This is used to immediately display things - basically, it just skips the steps of requesting the render and then sorting by depth.
	*/
	var previousLength = this.renderingObjects.length;
	func.call(thisArg);
	while(this.renderingObjects.length > previousLength) {
		var renderingObject = this.renderingObjects.pop();
		renderingObject.display();
	}
});



/** ITEMS **/
function Item() {
	this.location = null;
	this.initialized = false;
	this.mode = "visual"; // the mode of the item - "visual" for when it is coming out of a chest and "held" if it is in the inventory.
	this.velocity = { x: 0, y: 0 };
};
Item.method("init", function() {
	for(var i = 0; i < game.dungeon[game.inRoom].content.length; i ++) {
		if(game.dungeon[game.inRoom].content[i].requestingItem && game.dungeon[game.inRoom].content[i] instanceof Chest) {
			this.x = game.dungeon[game.inRoom].content[i].x;
			this.y = game.dungeon[game.inRoom].content[i].y - 10;
			game.dungeon[game.inRoom].content[i].requestingItem = false;
			break;
		}
	}
	this.initialized = true;
	this.velocity.y = -4;
	this.opacity = 1;
});
Item.method("animate", function() {
	/**
	Run the animation for the item when coming out of chests
	**/
	this.y += (this.velocity.y < 0) ? this.velocity.y : 0;
	this.velocity.y += 0.1;
	if(this.velocity.y >= 0) {
		this.opacity -= 0.05;
		if(this.opacity <= 0) {
			this.toBeRemoved = true;
		}
	}
});
Item.method("remove", function() {
	this.opacity = 1;
	p.addItem(this);
});
Item.method("exist", function() {
	this.update();
	this._display();
});
Item.method("displayDesc", function(x, y, dir) {
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
});
Item.method("_display", function() {
	/*
	This function is used to display the items in-game (the ones in chests). It is used because the individual items already have a method `display`.
	*/
	var nearestChest = game.dungeon[game.theRoom].content[0];
	for(var i = 0; i < game.dungeon[game.theRoom].content.length; i ++) {
		var obj = game.dungeon[game.theRoom].content[i];
		if(obj instanceof Chest && Math.distSq(obj.x, obj.y, this.x, this.y) < Math.distSq(nearestChest.x, nearestChest.y, this.x, this.y)) {
			nearestChest = obj;
		}
	}
	var self = this;
	game.dungeon[game.theRoom].render(new RenderingOrderObject(
		function() {
			c.save(); {
				c.globalAlpha = Math.constrain(self.opacity, 0, 1);
				c.beginPath();
				c.rect(nearestChest.x - 30, nearestChest.y - 1000, 60, 1000);
				c.clip();
				c.save(); {
					c.translate(self.x, self.y);
					self.display("item");
				}
			} c.restore();
		},
		1
	));
});
Item.method("update", function() {
	this.animate();
});

/* weapons */
function Weapon(modifier) {
	Item.call(this);
	this.equipable = false;
	this.modifier = modifier || "none";
	this.element = "none";
	this.particles = [];
};
Weapon.extends(Item);
Weapon.method("displayParticles", function() {
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
		this.particles.push(new Particle(color, Math.randomInRange(10, 60), Math.randomInRange(10, 60), Math.randomInRange(-2, 2), Math.randomInRange(-2, 2), Math.randomInRange(5, 6)));
		this.particles[this.particles.length - 1].opacity = 0.25;
	}
	for(var i = 0; i < this.particles.length; i ++) {
		game.dungeon[game.theRoom].displayImmediately(function() {
			this.particles[i].display();
		}, this);
		this.particles[i].update();
		if(this.particles[i].toBeRemoved) {
			this.particles.splice(i, 1);
			continue;
		}
	}
});
Weapon.applyElementalEffect = function(element, enemy, direction, location, bonusEffects) {
	/*
	Arguments:
	 - "element": the element of the attacking weapon. ("fire", "water", "earth", "air")
	 - "enemy": the enemy being attacked
	 - "direction": whether the attacking object (whether it be melee weapon, an arrow, or a magic charge) is facing "left" or "right".
	 - "location": the location of the attacking object (melee weapon, arrow, magic charge)
	 - "bonusEffects": whether to increase all the effects by a small amount. (Currently used by elemental magic charges)
	*/
	if(element === "fire") {
		enemy.timeBurning = (enemy.timeBurning <= 0) ? (FPS * (bonusEffects ? 3 : 2)) : enemy.timeBurning;
		enemy.burnDmg = (bonusEffects ? 2 : 1);
	}
	else if(element === "water") {
		enemy.timeFrozen = (enemy.timeFrozen < 0) ? (FPS * (bonusEffects ? 4 : 2)) : enemy.timeFrozen;
	}
	else if(element === "earth" && p.canUseEarth) {
		EarthCrystal.addBoulderAbove(enemy.x, enemy.y);
	}
	else if(element === "air") {
		game.dungeon[game.theRoom].content.push(new WindBurst(location.x, location.y, direction, true));
	}
};
function MeleeWeapon(modifier) {
	Weapon.call(this, modifier);
	this.attackSpeed = (this.modifier === "none") ? "normal" : (this.modifier === "light" ? "fast" : "slow");
	this.attackSpeed = "normal";
};
MeleeWeapon.extends(Weapon);
MeleeWeapon.method("attack", function() {
	p.attackingWith = this;
});
function Dagger(modifier) {
	MeleeWeapon.call(this, modifier);
	this.name = "dagger";
	this.damLow = p.class === "warrior" ? 60 : 50;
	this.damHigh = p.class === "warrior" ? 80 : 70;
	this.range = 30;
	this.power = 2;
};
Dagger.extends(MeleeWeapon);
Dagger.method("getDesc", function() {
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
});
Dagger.method("display", function(type) {
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
});
function Sword(modifier) {
	MeleeWeapon.call(this, modifier);
	this.name = "sword";
	this.damLow = p.class === "warrior" ? 80 : 70;
	this.damHigh = p.class === "warrior" ? 110 : 100;
	this.range = 60;
	this.power = 3;
};
Sword.extends(MeleeWeapon);
Sword.method("display", function(type) {
	type = type || "item";
	c.save(); {
		// debugger;
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
});
Sword.method("getDesc", function() {
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
});
function Spear(modifier) {
	MeleeWeapon.call(this, modifier);
	this.name = "spear";
	this.damLow = p.class === "warrior" ? 80 : 70;
	this.damHigh = p.class === "warrior" ? 110 : 100;
	this.range = 60;
	this.power = 3;
};
Spear.extends(MeleeWeapon);
Spear.method("display", function(type) {
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
});
Spear.method("getDesc", function() {
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
});

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
Arrow.method("display", function(type) {
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
});
Arrow.method("getDesc", function() {
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
});
function WoodBow(modifier) {
	RangedWeapon.call(this, modifier);
	this.name = "bow";
	this.damLow = p.class === "archer" ? 80 : 70;
	this.damHigh = p.class === "archer" ? 110 : 100;
	this.range = "long";
	this.reload = 1;
	this.power = 3;
	/*
	ranges: very short (daggers), short (swords), medium (forceful bows), long (bows & forceful longbows), very long (longbows & distant bows), super long (distant longbows)
	*/
};
WoodBow.extends(RangedWeapon);
WoodBow.method("display", function(type) {
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
});
WoodBow.method("getDesc", function() {
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
});
function MetalBow(modifier) {
	RangedWeapon.call(this, modifier);
	this.name = "bow";
	this.damLow = p.class === "archer" ? 110 : 100;
	this.damHigh = p.class === "archer" ? 130 : 120;
	this.range = "long";
	this.reload = 1;
	this.power = 4;
};
MetalBow.extends(RangedWeapon);
MetalBow.method("display", function(type) {
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
});
MetalBow.method("getDesc", function() {
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
});
function MechBow(modifier) {
	RangedWeapon.call(this, modifier);
	this.name = "bow";
	this.attackSpeed = "fast";
	this.range = "long";
	this.reload = 1;
	this.damLow = (p.class === "archer") ? 70 : 60;
	this.damHigh = (p.class === "archer") ? 100 : 90;
	this.power = 4;
};
MechBow.extends(RangedWeapon);
MechBow.method("display", function(type) {
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
});
MechBow.method("getDesc", function() {
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
});
function LongBow(modifier) {
	RangedWeapon.call(this, modifier);
	this.name = "longbow";
	this.range = "very long";
	this.reload = 2;
	this.damLow = (p.class === "archer") ? 90 : 80;
	this.damHigh = (p.class === "archer") ? 100 : 90;
	this.power = 5;
};
LongBow.extends(RangedWeapon);
LongBow.method("display", function(type) {
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
});
LongBow.method("getDesc", function() {
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
});

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
EnergyStaff.method("display", function(type) {
	type = type || "item";
	c.strokeStyle = "rgb(139, 69, 19)";
	c.save(); {
		c.lineWidth = 4;
		if(type === "holding" || type === "item") {
			c.rotate(Math.rad(45));
		}
		c.strokeLine(0, -10, 0, 30);
		c.strokeArc(0, -14, 5, Math.rad(180), Math.rad(90));
	} c.restore();
});
EnergyStaff.method("getDesc", function() {
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
});
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
ElementalStaff.method("display", function(type) {
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
		c.fillPoly(
			0, -10,
			7, -17,
			0, -20,
			-7, -17,
			0, -10
		);
		c.stroke();

		c.strokeLine(0, -10, 0, -20);
	}
	} c.restore();
	/* update charge type */
	if(this.element !== "none") {
		this.chargeType = this.element;
	}
});
ElementalStaff.method("getDesc", function() {
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
});
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
ChaosStaff.method("display", function(type) {
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
});
ChaosStaff.method("getDesc", function() {
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
});

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
WizardHat.method("display", function() {
	c.fillStyle = "rgb(109, 99, 79)";
	c.fillPoly(
		-30, 20,
		30, 20,
		10, 15,
		0, -20,
		-10, 15
	);
});
WizardHat.method("getDesc", function() {
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
});
function MagicQuiver(modifier) {
	Equipable.call(this, modifier);
	this.name = "quiver";
	this.defLow = (this.modifier === "sturdy") ? 5 : 0;
	this.defHigh = (this.modifier === "none") ? 5 : (this.modifier === "empowering" ? 0 : 10);
	this.arrowEfficiency = (this.modifier === "none") ? 15 : (this.modifier === "empowering" ? 20 : 10);
	this.power = 2;
};
MagicQuiver.extends(Equipable);
MagicQuiver.method("display", function() {
	c.save(); {
		c.fillStyle = "rgb(139, 69, 19)";
		c.translate(-5, 5);
		c.rotate(Math.rad(45));
		c.fillRect(-10, -20, 20, 40);
		c.fillCircle(0, 20, 10);
		game.dungeon[game.theRoom].displayImmediately(function() {
			new ShotArrow(-3, -20, 0, -2).display();
			new ShotArrow(3, -30, 0, -2).display();
		});
	} c.restore();
});
MagicQuiver.method("getDesc", function() {
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
});
function Helmet(modifier) {
	Equipable.call(this, modifier);
	this.name = "helmet";
	this.defLow = (this.modifier === "none") ? 20 : (this.modifier === "empowering" ? 10 : 30);
	this.defHigh = (this.modifier === "none") ? 30 : (this.modifier === "empowering" ? 20 : 40);
	this.healthRegen = (this.modifier === "none") ? 15 : (this.modifier === "empowering" ? 20 : 10);
	this.power = 3;
};
Helmet.extends(Equipable);
Helmet.method("display", function() {
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
});
Helmet.method("getDesc", function() {
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
});

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
Crystal.method("graphics", function(type) {
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
});
Crystal.method("use", function() {
	p.guiOpen = "crystal-infusion";
	p.infusedGui = (this instanceof FireCrystal || this instanceof WaterCrystal) ? (this instanceof FireCrystal ? "fire" : "water") : (this instanceof EarthCrystal ? "earth" : "air");
	this.toBeConsumed = true;
});
function FireCrystal() {
	Crystal.call(this);
};
FireCrystal.extends(Crystal);
FireCrystal.method("display", function(type) {
	type = type || "item";
	c.fillStyle = "rgb(255, 100, 0)";
	c.strokeStyle = "rgb(255, 0, 0)";
	this.graphics(type);
});
FireCrystal.method("getDesc", function() {
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

});
function WaterCrystal() {
	Crystal.call(this);
};
WaterCrystal.extends(Crystal);
WaterCrystal.method("display", function(type) {
	type = type || "item";
	c.fillStyle = "rgb(0, 255, 255)";
	c.strokeStyle = "rgb(0, 128, 255)";
	this.graphics(type);
});
WaterCrystal.method("getDesc", function() {
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
});
function EarthCrystal() {
	Crystal.call(this);
};
EarthCrystal.extends(Crystal);
EarthCrystal.method("display", function(type) {
	type = type || "item";
	c.fillStyle = "rgb(0, 128, 128)";
	c.strokeStyle = "rgb(0, 128, 0)";
	this.graphics(type);
});
EarthCrystal.method("getDesc", function() {
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
});
EarthCrystal.addBoulderAbove = function(x, y) {
	/*
	This function can be used to drop a boulder from the ceiling above the specified location (the earth crystal's special ability). The method exits with no effect if there is no roof directly above the given x-value.
	*/
	var lowestIndex = null;
	for(var i = 0; i < game.dungeon[game.inRoom].content.length; i ++) {
		var block = game.dungeon[game.inRoom].content[i];
		if(block instanceof Block) {
			if(lowestIndex === null) {
				if(x > game.dungeon[game.inRoom].content[i].x && x < game.dungeon[game.inRoom].content[i].x + game.dungeon[game.inRoom].content[i].w) {
					if(game.dungeon[game.inRoom].content[i].y <= y) {
						lowestIndex = i;
					}
				}
			}
			else {
				if(x > block.x && x < block.x + block.w && block.y + block.h > game.dungeon[game.inRoom].content[lowestIndex].y + game.dungeon[game.inRoom].content[lowestIndex].h) {
					if(block.y + game.dungeon[game.inRoom].content[i].h <= y) {
						lowestIndex = i;
					}
				}
			}
		}
		if(lowestIndex !== null) {
			if(block instanceof Block) {
			}
		}
		else if(game.dungeon[game.inRoom].content[i] instanceof Block) {
			if(lowestIndex === null) {
			}
		}
	}
	game.dungeon[game.inRoom].content.push(new BoulderVoid(x, game.dungeon[game.inRoom].content[lowestIndex].y + game.dungeon[game.inRoom].content[lowestIndex].h));
	game.dungeon[game.inRoom].content.push(new Boulder(x, game.dungeon[game.inRoom].content[lowestIndex].y + game.dungeon[game.inRoom].content[lowestIndex].h, Math.randomInRange(2, 4)));
};
function Boulder(x, y, damage) {
	this.x = x;
	this.y = y;
	this.velocity = { x: 0, y: 2 };
	this.damage = damage;
	this.hitSomething = false;
	this.opacity = 1;
	this.hitbox = new utils.geom.Rectangle({ left: -40, right: 40, top: -1, bottom: 1 });
};
Boulder.method("exist", function() {
	var p1b = graphics3D.point3D(this.x - 40, this.y, 0.9);
	var p2b = graphics3D.point3D(this.x + 40, this.y, 0.9);
	var p3b = graphics3D.point3D(this.x, this.y - 100, 0.9);
	var p1f = graphics3D.point3D(this.x - 40, this.y, 1.1);
	var p2f = graphics3D.point3D(this.x + 40, this.y, 1.1);
	var p3f = graphics3D.point3D(this.x, this.y - 100, 1.1);

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
		this.velocity.y += 0.1;
		this.y += this.velocity.y;
		for(var i = 0; i < game.dungeon[game.inRoom].content.length; i ++) {
			var thing = game.dungeon[game.inRoom].content[i];
			if(thing instanceof Block && this.x + 40 > thing.x && this.x - 40 < thing.x + thing.w && this.y > thing.y && this.y < thing.y + 10) {
				this.hitSomething = true;
			}
			else if(thing instanceof Enemy && collisions.objectIntersectsObject(this, enemy) && !this.hitAnEnemy) {
				thing.hurt(this.damage, true);
				this.hitAnEnemy = true;
			}
			if(collisions.objectIntersectsObject(this, p) && !this.hitAPlayer) {
				p.hurt(this.damage, "a chunk of rock");
				this.hitAPlayer = true;
			}
		}
	}
	else {
		this.opacity -= 0.05;
	}
	if(this.opacity < 0) {
		this.toBeRemoved = true;
	}
});
function BoulderVoid(x, y) {
	this.x = x;
	this.y = y;
	this.opacity = 1;
};
BoulderVoid.method("exist", function() {
	var p1b = graphics3D.point3D(this.x - 40, this.y, 0.9);
	var p2b = graphics3D.point3D(this.x + 40, this.y, 0.9);
	var p3b = graphics3D.point3D(this.x, this.y - 100, 0.9);
	var p1f = graphics3D.point3D(this.x - 40, this.y, 1.1);
	var p2f = graphics3D.point3D(this.x + 40, this.y, 1.1);
	var p3f = graphics3D.point3D(this.x, this.y - 100, 1.1);
	c.save(); {
		c.globalAlpha = Math.max(this.opacity, 0);
		c.fillStyle = "rgb(110, 110, 110)";
		c.fillPoly(p1f, p2f, p2b, p1b);
	} c.restore();
	if(!game.dungeon[game.inRoom].content.containsInstanceOf(Boulder)) {
		this.opacity -= 0.05;
	}
	if(this.opacity < 0) {
		this.toBeRemoved = true;
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
});
function AirCrystal() {
	Crystal.call(this);
};
AirCrystal.extends(Crystal);
AirCrystal.method("display", function(type) {
	type = type || "item";
	c.fillStyle = "rgb(150, 150, 150)";
	c.strokeStyle = "rgb(220, 220, 220)";
	this.graphics(type);
});
AirCrystal.method("getDesc", function() {
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
});
function WindBurst(x, y, dir, noDisplay) {
	this.x = x;
	this.y = y;
	this.dir = dir;
	this.velocity = {
		x: (dir === "right" ? 5 : -5),
		y: 0
	};
	this.noDisplay = noDisplay || false;
	this.opacity = 1;
	if(dir === "right") {
		this.hitbox = new utils.geom.Rectangle({ left: 0, right: 49, top: -34, bottom: 0 });
	}
	else {
		this.hitbox = new utils.geom.Rectangle({ left: -49, right: 0, top: -34, bottom: 0 });
	}
};
WindBurst.method("exist", function() {
	this.display();
	this.update();
});
WindBurst.method("display", function() {
	if(this.noDisplay) {
		return;
	}
	c.save(); {
		c.globalAlpha = Math.max(this.opacity, 0);
		c.strokeStyle = "rgb(150, 150, 150)";
		c.lineWidth = 4;
		c.translate(this.x, this.y);
		c.scale(this.dir === "right" ? -1 : 1, 1);
		/* large wind graphic */
		c.strokeLine(0, 0, 32, 0);
		c.strokeArc(17, 0 - 17, 17, Math.rad(90), Math.rad(360));
		/* small wind graphic */
		c.strokeLine(0, 0 - 5, 30, 0 - 5);
		c.strokeArc(17, 0 - 12, 7, Math.rad(90), Math.rad(360));
	} c.restore();
});
WindBurst.method("update", function() {
	this.x += this.velocity.x;
	this.velocity.x *= 0.98;
	this.opacity -= 0.05;
	for(var i = 0; i < game.dungeon[game.inRoom].content.length; i ++) {
		if(game.dungeon[game.inRoom].content[i] instanceof Enemy && !(game.dungeon[game.inRoom].content[i] instanceof Wraith)) {
			var enemy = game.dungeon[game.inRoom].content[i];
			if(collisions.objectIntersectsObject(this, enemy)) {
				enemy.velocity.x = (this.dir === "left") ? -3 : 3;
				enemy.x += this.velocity.x;
			}
		}
	}
	if(this.opacity < 0) {
		this.toBeRemoved = true;
	}
});
function Map() {
	Extra.call(this);
};
Map.extends(Extra);
Map.method("display", function() {
	c.save(); {

		c.fillStyle = "rgb(255, 255, 200)";
		c.fillRect(-20, -20, 40, 40);

		c.fillStyle = "rgb(255, 0, 0)";
		c.fillText("x", 10, -10);

		c.strokeStyle = "rgb(0, 0, 0)";
		c.setLineDash([3, 3]);
		c.lineWidth = 1;
		c.strokeLine(
			10, -5,
			10, 5,
			-5, 5,
			-20, 20
		)
	} c.restore();
});
Map.method("getDesc", function() {
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
});

function Barricade() {
	Extra.call(this);
	this.consumed = false;
};
Barricade.extends(Extra);
Barricade.method("display", function(type) {
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
});
Barricade.method("getDesc", function() {
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
});
Barricade.method("use", function() {
	var doorNearby = false;
	for(var i = 0; i < game.dungeon[game.inRoom].content.length; i ++) {
		var loc = graphics3D.point3D(game.dungeon[game.inRoom].content[i].x, game.dungeon[game.inRoom].content[i].y, 0.9);
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
		var loc = graphics3D.point3D(game.dungeon[game.inRoom].content[i].x, game.dungeon[game.inRoom].content[i].y, 0.9);
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
});

function Coin(quantity) {
	Extra.call(this);
	this.quantity = quantity;
	this.stackable = true;
};
Coin.extends(Extra);
Coin.method("getDesc", function() {
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
});
Coin.method("display", function(type) {
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
});
function ShotArrow(x, y, velX, velY, damage, shotBy, element, name) {
	this.x = x;
	this.y = y;
	this.velocity = { x: velX, y: velY };
	this.shotBy = shotBy;
	this.opacity = 1;
	this.damage = damage;
	this.element = element;
	this.name = name;
	this.hitSomething = false;
	this.hitbox = new utils.geom.Rectangle({ left: -1, right: 1, top: -1, bottom: 1 });
};
ShotArrow.method("exist", function() {
	this.update();
	this.display();
});
ShotArrow.method("display", function() {
	var self = this;
	game.dungeon[game.theRoom].render(new RenderingOrderObject(
		function() {
			var angle = Math.atan2(self.velocity.x, self.velocity.y);
			c.save(); {
				c.globalAlpha = Math.max(0, self.opacity);
				c.translate(self.x, self.y);
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
		},
		1
	));
});
ShotArrow.method("update", function() {
	if(!this.hitSomething) {
		this.x += this.velocity.x;
		this.y += this.velocity.y;
		this.velocity.y += 0.1;
		for(var i = 0; i < game.dungeon[game.inRoom].content.length; i ++) {
			if(game.dungeon[game.inRoom].content[i] instanceof Enemy && this.shotBy === "player") {
				var enemy = game.dungeon[game.inRoom].content[i];
				if(collisions.objectIntersectsObject(this, enemy)) {
					if(this.ORIGINAL_X === undefined) {
						enemy.hurt(this.damage);
					}
					else {
						enemy.hurt(this.damage + Math.round(Math.dist(this.x, this.ORIGINAL_X) / 50));
					}
					if(["fire", "water", "earth", "air"].includes(this.element)) {
						Weapon.applyElementalEffect(this.element, enemy, (this.velocity.x > 0) ? "right" : "left", { x: this.x, y: this.y }, false);
					}
					this.hitSomething = true;
				}
			}
		}
		if(collisions.objectIntersectsObject(this, p) && this.shotBy === "enemy") {
			p.hurt(this.damage, this.name);
			this.hitSomething = true;
		}
	}
	else {
		this.opacity -= 0.05;
		if(this.opacity <= 0) {
			this.toBeRemoved = true;
		}
	}
});
ShotArrow.method("handleCollision", function(direction, collision) {
	this.hitSomething = true;
});

/** ENEMIES **/
function RandomEnemy(x, y, notEnemy) {
	this.x = x;
	this.y = y;
	this.notEnemy = notEnemy; // use this to specify any enemy BUT a certain enemy
};
RandomEnemy.method("update", function() {
	if(!this.toBeRemoved) {
		this.generate();
		this.toBeRemoved = true;
	}
});
RandomEnemy.method("generate", function() {
	if(game.enemies.length === 0 && TESTING_MODE) {
		this.toBeRemoved = true;
		return;
	}
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
	var enemyIndex = possibleEnemies.randomIndex();
	game.dungeon[game.inRoom].content.push(new possibleEnemies[enemyIndex](this.x, this.y - new possibleEnemies[enemyIndex]().hitbox.bottom));
});
function Enemy(x, y) {
	this.x = x;
	this.y = y;
	this.velocity = { x: 0, y: 0 };
	this.visualHealth = 60;
	this.attackRecharge = 45;
	this.opacity = 1;
	this.dead = false;
	this.fadingIn = false;
	this.particles = [];
	this.timeFrozen = 0;
	this.timeBurning = 0;
};
Enemy.method("hurt", function(amount, ignoreDef) {
	var def = Math.round(Math.randomInRange(this.defLow, this.defHigh));
	if(!ignoreDef) {
		amount -= def;
	}
	amount = (amount < 0) ? 0 : amount;
	this.health -= amount;
});
Enemy.method("displayStats", function() {
	/* healthbar */
	var self = this;
	game.dungeon[game.theRoom].render(new RenderingOrderObject(
		function() {
			c.globalAlpha = Math.max(0, self.opacity);
			var middle = ((self.x + self.hitbox.right) + (self.x + self.hitbox.left)) / 2;
			if(self instanceof Dragonling) {
				middle = self.x;
			}
			c.fillStyle = "rgb(150, 150, 150)";
			c.fillRect(middle - 30, self.y + self.hitbox.top - 15, 60, 10);
			c.fillCircle(middle - 30, self.y + self.hitbox.top - 10, 5);
			c.fillCircle(middle + 30, self.y + self.hitbox.top - 10, 5);
			c.fillStyle = "rgb(255, 0, 0)";
			c.fillRect(middle - 30, self.y + self.hitbox.top - 15, self.visualHealth, 10);
			c.fillCircle(middle - 30, self.y + self.hitbox.top - 10, 5);
			c.fillCircle(middle - 30 + self.visualHealth, self.y + self.hitbox.top - 10, 5);
		},
		1
	));
});
Enemy.method("update", function() {
	var self = this;
	if(game.inRoom === game.theRoom) {
		this.seesPlayer = true;
	}
	if(!this.fadingIn && this.timeFrozen <= 0) {
		if(game.inRoom === game.theRoom) {
			this.update("player");
		}
		else {
			game.calculatePaths();
			game.dungeon[game.theRoom].content.filter((obj) => (obj instanceof Door)).forEach((door) => {
				var destinationRoom = door.getDestinationRoom();
				if(destinationRoom !== null && destinationRoom.pathScore < game.dungeon[game.theRoom].pathScore) {
					this.update({ x: door.x, y: door.y });
					if(door.isEnemyNear(this)) {
						door.enter(this);
					}
				}
			});
		}
	}
	/* Collisions with other enemies */
	collisions.solids.rect(
		this.x + this.hitbox.left, this.y + this.hitbox.top, this.hitbox.width, this.hitbox.height,
		{
			collisionCriteria: (obj) => (obj instanceof Enemy),
			onCollision: (obj, direction) => {
				if(direction === "floor") {
					/* the bottom of that enemy collided with the top of this enemy */
					obj.velocity.y = -4;
				}
				else if(direction === "wall-to-right") {
					/* the right side of that enemy collided with the left side of this enemy */
					this.velocity.x = 3;
					obj.velocity.x = -3;
				}
				else if(direction === "wall-to-left") {
					/* the left side of that enemy collided with the right side of this enemy */
					this.velocity.x = -3;
					obj.velocity.x = 3;
				}
			},
			noPositionLimits: true
		}
	);
	/* update effects */
	this.timeFrozen --;
	this.timeBurning --;
	if(this.timeFrozen > 0) {
		this.velocity.y += 0.1;
		this.y += this.velocity.y;
	}
	if(this.timeBurning > 0) {
		this.particles.push(new Particle("rgb(255, 128, 0)", Math.randomInRange(this.hitbox.left, this.hitbox.right), Math.randomInRange(this.hitbox.top, this.hitbox.bottom), Math.randomInRange(-2, 2), Math.randomInRange(-3, 1), Math.randomInRange(3, 5)));
		this.timeBurning --;
		if(this.timeBurning % 60 === 0) {
			this.health -= this.burnDmg;
		}
	}
	if(!(this instanceof Wraith)) {
		this.particles.forEach((particle) => { particle.update(); });
	}
	/* basic enemy attack (dealing damage to the player on intersection) */
	this.attackRecharge --;
	if(collisions.objectIntersectsObject(this, p) && this.attackRecharge < 0 && !this.complexAttack) {
		this.attackRecharge = 45;
		var damage = Math.randomInRange(this.damLow, this.damHigh);
		p.hurt(damage, this.name);
	}
	/* other enemy attacks */
	if(typeof this.attack === "function" && this.timeFrozen < 0) {
		this.attack();
	}
	/* health bar updating + dying */
	this.health = Math.constrain(this.health, 0, this.maxHealth);
	if(this.health <= 0 && !this.dead) {
		this.dead = true;
		p.enemiesKilled ++;
	}
	var visualHealth = this.health / this.maxHealth * 60;
	this.visualHealth += (visualHealth - this.visualHealth) / 10;
	/* fading transitions */
	if(this.dead) {
		this.opacity -= 1/20;
		if(this.opacity <= 0) {
			this.toBeRemoved = true;
		}
	}
	else if(this.fadingIn) {
		this.opacity += 1/20;
	}
	if(this.opacity >= 1) {
		this.fadingIn = false;
	}
	this.opacity = Math.constrain(this.opacity, 0, 1);
	/* velocity cap */
	this.velocity.x = Math.constrain(this.velocity.x, -3, 3);
	this.velocity.y = Math.constrain(this.velocity.y, -3, 3);
});
Enemy.method("display", function() {
	this.displayStats();
	this.display(); // NOT recursive. this calls the child's method "display".
	if(this.timeFrozen > 0) {
		/* display ice cube for frozen enemies */
		graphics3D.cube(this.x + this.hitbox.left, this.y + this.hitbox.top, this.hitbox.width, this.hitbox.height, 0.95, 1.05, "rgba(0, 128, 200, 0.5)", "rgba(0, 128, 200, 0.5)");
	}
	if(!(this instanceof Wraith)) {
		/* display fire particles for burning enemies. (This is done even if the enemy isn't burning because there could still be particles left over from when they were burning.) */
		this.particles.forEach((particle) => {
			c.save(); {
				c.translate(this.x + this.hitbox.left, this.y + this.hitbox.top);
				particle.display();
			} c.restore();
		});
		this.particles = this.particles.filter((particle) => (!particle.toBeRemoved));
	}
});

function Spider(x, y) {
	Enemy.call(this, x, y);
	this.legs = 0;
	this.legDir = 2;

	/* hitbox */
	this.hitbox = new utils.geom.Rectangle({
		left: -45,
		right: 45,
		top: -22,
		bottom: 22
	});

	/* stats */
	this.health = 50;
	this.maxHealth = 50;
	this.defLow = 20;
	this.defHigh = 30;
	this.damLow = 20;
	this.damHigh = 30;
	this.name = "a giant spider";
};
Spider.extends(Enemy);
Spider.method("display", function() {
	var self = this;
	game.dungeon[game.theRoom].render(new RenderingOrderObject(
		function() {
			c.lineWidth = 4;
			c.fillStyle = "rgb(0, 0, 0)";
			c.strokeStyle = "rgb(0, 0, 0)";
			c.fillCircle(self.x, self.y, 20);

			for(var scale = -1; scale <= 1; scale += (1 - (-1)) ) {
				/* scaling is used to flip the legs (for left + right pairs of legs) */
				for(var rotation = -self.legs; rotation <= self.legs; rotation += (self.legs === 0 ? Infinity : (self.legs * 2)) ) {
					for(var legSize = 10; legSize <= 20; legSize += (20 - 10)) {
						c.save(); {
							c.translate(
								self.x + (scale * (legSize === 10 ? 14 : 16)),
								self.y + (legSize === 10 ? 14 : 4)
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
			c.fillStyle = "rgb(255, 0, 0)";
			c.fillCircle(self.x - 10, self.y - 10, 5);
			c.fillCircle(self.x + 10, self.y - 10, 5);
		},
		1
	));
});
Spider.method("update", function(dest) {
	if(dest === "player") {
		if(this.x < p.x) {
			this.velocity.x = 2;
		}
		else {
			this.velocity.x = -2;
		}
		if(this.legs > 15) {
			this.legDir = -2;
		}
		if(this.legs <= 0) {
			this.legDir = 2;
		}
		else {
			this.legDir = (this.legs < 8) ? 2 : -2;
			if(Math.dist(this.legs, 8) <= 2) {
				this.legs = 8;
			}
		}
		this.legs += this.legDir;
		this.x += this.velocity.x;
		if(this.canJump && Math.dist(this.x, p.x) <= 130 && Math.dist(this.x, p.x) >= 120) {
			this.velocity.y = -4;
		}
	}
	else {
		if(this.x < dest.x) {
			this.velocity.x = 2;
		}
		else {
			this.velocity.x = -2;
		}
	}
	this.y += this.velocity.y;
	this.velocity.y += 0.1;
	this.canJump = false;
});
Spider.method("handleCollision", function(direction, collision) {
	if(direction === "floor") {
		this.canJump = true;
	}
});

function Bat(x, y) {
	Enemy.call(this, x, y);
	this.wings = 0;
	this.wingDir = 4;

	/* hitbox */
	this.hitbox = new utils.geom.Rectangle({
		left: -53,
		right: 53,
		top: -12,
		bottom: 12
	});

	/* stats */
	this.health = 50;
	this.maxHealth = 50;
	this.defLow = 20;
	this.defHigh = 30;
	this.damLow = 20;
	this.damHigh = 30;
	this.name = "a bat";
};
Bat.extends(Enemy);
Bat.method("display", function() {
	var self = this;
	game.dungeon[game.theRoom].render(new RenderingOrderObject(
		function() {
			c.fillStyle = "rgb(0, 0, 0)";
			c.fillCircle(self.x, self.y, 10);

			c.fillStyle = "rgb(255, 0, 0)";
			c.fillCircle(self.x - 2, self.y - 4, 2);
			c.fillCircle(self.x + 2, self.y - 4, 2);

			c.fillStyle = "rgb(0, 0, 0)";
			for(var scale = -1; scale <= 1; scale += 2) {
				c.save(); {
					c.translate(self.x + (5 * scale), self.y);
					c.rotate(Math.rad(self.wings * scale));
					c.scale(scale, 1);
					c.fillPoly(
						0, 0,
						10, -10,
						50, 0,
						10, 10
					);
				} c.restore();
			}
		},
		1
	));
});
Bat.method("update", function(dest) {
	this.wings += this.wingDir;
	if(this.wings > 5) {
		this.wingDir = -5;
	}
	else if(this.wings < -15) {
		this.wingDir = 5;
	}
	if(dest === "player") {
		if(this.x < p.x) {
			this.velocity.x += 0.1;
		}
		else if(this.x > p.x) {
			this.velocity.x -= 0.1;
		}
		if(this.y < p.y) {
			this.velocity.y += 0.1;
		}
		else if(this.y > p.y) {
			this.velocity.y -= 0.1;
		}
		this.x += this.velocity.x;
		this.y += this.velocity.y;
	}
	else {
		if(this.x < dest.x) {
			this.velocity.x += 0.1;
		}
		else if(this.x > dest.x) {
			this.velocity.x -= 0.1;
		}
		if(this.y < dest.y) {
			this.velocity.y += 0.1;
		}
		else if(this.y > dest.y) {
			this.velocity.y -= 0.1;
		}
		this.x += this.velocity.x;
		this.y += this.velocity.y;
	}
});
Bat.method("handleCollision", function(direction, platform) {
	if(direction === "floor") {
		this.velocity.y = -Math.abs(this.velocity.y);
	}
	else if(direction === "ceiling") {
		this.velocity.y = Math.abs(this.velocity.y);
	}
	else if(direction === "wall-to-left") {
		this.velocity.x = Math.abs(this.velocity.x);
	}
	else if(direction === "wall-to-right") {
		this.velocity.x = -Math.abs(this.velocity.x);
	}
});

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
	this.hitbox = new utils.geom.Rectangle({
		left: -13,
		right: 13,
		top: -8,
		bottom: 43
	});
	this.name = "a skeleton";
};
Skeleton.extends(Enemy);
Skeleton.method("display", function() {
	var self = this;
	game.dungeon[game.theRoom].render(new RenderingOrderObject(
		function() {
			c.lineWidth = 2;
			/* head */
			c.fillStyle = "rgb(255, 255, 255)";
			c.strokeStyle = "rgb(255, 255, 255)";
			c.fillCircle(self.x, self.y + 3, 7);
			c.fillRect(self.x - 3, self.y + 3, 6, 10);
			/* body */
			c.strokeLine(self.x, self.y, self.x, self.y + 36);
			/* legs */
			c.strokeLine(
				self.x, self.y + 36,
				self.x + self.legs, self.y + 36 + 7
			);
			c.strokeLine(
				self.x, self.y + 36,
				self.x - self.legs, self.y + 36 + 7
			);
			self.legs += self.legDir;
			self.legDir = (self.legs < -7) ? 0.5 : self.legDir;
			self.legDir = (self.legs > 7) ? -0.5 : self.legDir;
			/* arms */
			c.strokeLine(
				self.x     , self.y + 15,
				self.x + 10, self.y + 15
			);
			c.strokeLine(
				self.x + 8, self.y + 15,
				self.x + 8, self.y + 15 + 10
			);
			c.strokeLine(
				self.x     , self.y + 15,
				self.x - 10, self.y + 15
			);
			c.strokeLine(
				self.x - 8, self.y + 15,
				self.x - 8, self.y + 15 + 10
			);
			/* ribcage */
			for(var y = self.y + 22; y < self.y + 34; y += 4) {
				c.strokeLine(self.x - 5, y, self.x + 5, y);
			}
		},
		1
	));
});
Skeleton.method("update", function(dest) {
	this.x += this.velocity.x;
	this.y += this.velocity.y;
	this.velocity.y += 0.1;
	this.velocity.x *= 0.96;
	if(dest === "player") {
		this.velocity.x += (this.x < p.x) ? 0.1 : 0;
		this.velocity.x -= (this.x > p.x) ? 0.1 : 0;
		if(Math.random() <= 0.02 && this.canJump) {
			this.velocity.y = Math.randomInRange(-2, -5);
		}
		this.canJump = false;
	}
	else {
		this.velocity.x = (this.x < dest.x) ? this.velocity.x + 0.1 : this.velocity.x;
		this.velocity.x = (this.x > dest.x) ? this.velocity.x - 0.1 : this.velocity.x;
		this.canJump = false;
	}
});
Skeleton.method("handleCollision", function(direction, platform) {
	if(direction === "floor") {
		this.canJump = true;
	}
	else if(direction === "ceiling") {
		this.velocity.y = Math.abs(this.velocity.y);
	}
	else if(direction === "wall-to-left") {
		this.velocity.x = Math.abs(this.velocity.x);
	}
	else if(direction === "wall-to-right") {
		this.velocity.x = -Math.abs(this.velocity.x);
	}
});

function SkeletonWarrior(x, y) {
	Enemy.call(this, x, y);
	this.legs = 7;
	this.legDir = -0.5;
	this.attackArm = 315;
	this.attackArmDir = 3;
	this.canHit = true;
	this.timeSinceAttack = 0;
	this.facing = "right";

	/* hitbox */
	this.hitbox = new utils.geom.Rectangle({
		left: -13,
		right: 13,
		top: -8,
		bottom: 43
	});

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
SkeletonWarrior.method("display", function() {
	var self = this;
	game.dungeon[game.theRoom].render(new RenderingOrderObject(
		function() {
			c.lineWidth = 2;
			/* head */
			c.fillStyle = "rgb(255, 255, 255)";
			c.strokeStyle = "rgb(255, 255, 255)";
			c.fillCircle(self.x, self.y + 3, 7);
			c.fillRect(self.x - 3, self.y + 3, 6, 10);
			/* body */
			c.strokeLine(
				self.x, self.y,
				self.x, self.y + 36
			);
			/* legs */
			c.strokeLine(
				self.x            , self.y + 36,
				self.x + self.legs, self.y + 36 + 7
			);
			c.strokeLine(
				self.x            , self.y + 36,
				self.x - self.legs, self.y + 36 + 7
			);
			self.legs += self.legDir;
			self.legDir = (self.legs < -7) ? 0.5 : self.legDir;
			self.legDir = (self.legs > 7) ? -0.5 : self.legDir;
			/* arms */
			if(self.facing === "left") {
				/* right arm (normal) */
				c.strokeLine(
					self.x     , self.y + 15,
					self.x + 10, self.y + 15
				);
				c.strokeLine(
					self.x + 8, self.y + 15,
					self.x + 8, self.y + 15 + 10
				);
				/* left shoulder (normal) */
				c.strokeLine(
					self.x     , self.y + 15,
					self.x - 10, self.y + 15
				);
				/* left arm (attacking) */
				c.save(); {
					c.translate(self.x - 8, self.y + 15);
					c.rotate(Math.rad(self.attackArm));
					c.strokeLine(0, 0, -10, 0);
					/* sword */
					c.translate(-10, 0);
					new Sword("none").display("attacking");
				} c.restore();
			}
			else {
				/* left arm (normal) */
				c.strokeLine(
					self.x     , self.y + 15,
					self.x - 10, self.y + 15
				);
				c.strokeLine(
					self.x - 8, self.y + 15,
					self.x - 8, self.y + 15 + 10
				);
				/* right shoulder (normal) */
				c.strokeLine(
					self.x     , self.y + 15,
					self.x + 10, self.y + 15
				);
				/* right arm (attacking) */
				c.save(); {
					c.translate(self.x + 8, self.y + 15);
					c.rotate(Math.rad(-self.attackArm));
					c.strokeLine(0, 0, 10, 0);
					/* sword */
					c.translate(10, 0);
					new Sword("none").display("attacking");
				} c.restore();
			}
			/* ribcage */
			for(var y = self.y + 22; y < self.y + 34; y += 4) {
				c.strokeLine(
					self.x - 5, y,
					self.x + 5, y
				);
			}
		},
		1
	));
});
SkeletonWarrior.method("update", function(dest) {
	if(dest === "player") {
		this.facing = (this.x < p.x) ? "right" : "left";
		/* movement */
		if(this.x < p.x) {
			this.velocity.x = (this.x < p.x - 60) ? this.velocity.x + 0.1 : this.velocity.x;
			this.velocity.x = (this.x > p.x - 60) ? this.velocity.x - 0.1 : this.velocity.x;
		}
		else {
			this.velocity.x = (this.x < p.x + 60) ? this.velocity.x + 0.1 : this.velocity.x;
			this.velocity.x = (this.x > p.x + 60) ? this.velocity.x - 0.1 : this.velocity.x;
		}
		if(this.canJump) {
			this.velocity.y = -3;
		}
		this.canJump = false;
	}
	else {
		/* movement */
		this.velocity.x = (this.x < dest.x) ? this.velocity.x + 0.1 : this.velocity.x;
		this.velocity.x = (this.x > dest.x) ? this.velocity.x - 0.1 : this.velocity.x;
		this.canJump = false;
	}
	this.velocity.x *= 0.96;
	this.velocity.y += 0.1;
	this.x += this.velocity.x;
	this.y += this.velocity.y;
});
SkeletonWarrior.method("attack", function() {
	/* attack */
	this.attackArm += this.attackArmDir;
	this.canHit = ((this.attackArm > 360 || this.attackArm < 270) && this.timeSinceAttack > 15) ? true : this.canHit;
	this.timeSinceAttack ++;
	this.attackArmDir = (this.attackArm > 360) ? -3 : this.attackArmDir;
	this.attackArmDir = (this.attackArm < 270) ? 3 : this.attackArmDir;
	if(this.x < p.x) {
		var swordEnd = Math.rotate(10, -60, -this.attackArm);
		swordEnd.x += this.x + 8;
		swordEnd.y += this.y + 15;
		if(collisions.objectIntersectsPoint(p, swordEnd) && this.canHit) {
			var damage = Math.floor(Math.randomInRange(this.damLow, this.damHigh));
			p.hurt(damage, this.name);
			this.canHit = false;
			this.timeSinceAttack = 0;
			this.attackArmDir = -this.attackArmDir;
		}
	}
	else {
		var swordEnd = Math.rotate(-10, -60, this.attackArm);
		swordEnd.x += this.x - 8;
		swordEnd.y += this.y + 15;
		if(collisions.objectIntersectsPoint(p, swordEnd) && this.canHit) {
			var damage = Math.floor(Math.randomInRange(this.damLow, this.damHigh));
			p.hurt(damage, this.name);
			this.canHit = false;
			this.timeSinceAttack = 0;
			this.attackArmDir = -this.attackArmDir;
		}
	}
});
SkeletonWarrior.method("handleCollision", function(direction, collision) {
	if(direction === "floor") {
		this.canJump = true;
	}
	else if(direction === "ceiling") {
		this.velocity.y = Math.abs(this.velocity.y);
	}
});

function SkeletonArcher(x, y) {
	Enemy.call(this, x, y);
	this.legs = 7;
	this.legDir = -0.5;
	this.aimRot = 0;
	this.aimDir = 1;
	this.timeSinceAttack = 0;
	this.timeAiming = 0;
	this.velocity.x = null;

	/* hitbox */
	this.hitbox = new utils.geom.Rectangle({
		left: -13,
		right: 13,
		top: -8,
		bottom: 43
	});

	/* stats */
	this.health = 100;
	this.maxHealth = 100;
	this.defLow = 0;
	this.defHigh = 20;
	this.damLow = 50;
	this.damHigh = 70;
	this.complexAttack = true;
	this.name = "a skeletal archer";

	this.ARROW_SPEED = 5.7;
};
SkeletonArcher.extends(Enemy);
SkeletonArcher.method("display", function() {
	var self = this;
	game.dungeon[game.theRoom].render(new RenderingOrderObject(
		function() {
			c.lineWidth = 2;
			/* head */
			c.fillStyle = "rgb(255, 255, 255)";
			c.strokeStyle = "rgb(255, 255, 255)";
			c.fillCircle(self.x, self.y + 3, 7);
			c.fillRect(self.x - 3, self.y + 3, 6, 10);
			/* body */
			c.strokeLine(
				self.x, self.y,
				self.x, self.y + 36
			);
			/* legs */
			c.strokeLine(
				self.x            , self.y + 36,
				self.x + self.legs, self.y + 36 + 7
			);
			c.strokeLine(
				self.x            , self.y + 36,
				self.x - self.legs, self.y + 36 + 7
			);
			/* shoulders */
			c.strokeLine(
				self.x - 10, self.y + 15,
				self.x + 10, self.y + 15
			);
			/* right arm */
			if(self.facing === "right" && self.timeSinceAttack > 60) {
				c.save(); {
					c.translate(self.x + 8, self.y + 15);
					c.rotate(Math.rad(self.aimRot));
					c.strokeLine(0, 0, 10, 0);
					c.translate(10, 0);
					new WoodBow("none").display("aiming");
				} c.restore();
				self.timeAiming ++;
			}
			else {
				c.strokeLine(
					self.x + 8, self.y + 15,
					self.x + 8, self.y + 15 + 10
				);
			}
			/* left arm */
			if(self.facing === "left" && self.timeSinceAttack > 60) {
				c.save(); {
					c.translate(self.x - 8, self.y + 15);
					c.rotate(Math.rad(-self.aimRot));
					c.strokeLine(0, 0, -10, 0);

					c.translate(-10, 0);
					c.scale(-1, 1);
					new WoodBow("none").display("aiming");
				} c.restore();
				self.timeAiming ++;
			}
			else {
				c.strokeLine(
					self.x - 8, self.y + 15,
					self.x - 8, self.y + 15 + 10
				);
			}
			/* ribcage */
			for(var y = self.y + 22; y < self.y + 34; y += 4) {
				c.strokeLine(
					self.x - 5, y,
					self.x + 5, y
				);
			}
		},
		1
	));
});
SkeletonArcher.method("update", function(dest) {
	this.facing = (this.x < p.x) ? "right" : "left";
	if(dest === "player") {
		this.legs += this.legDir;
		if(this.x < p.x) {
			/* moving towards p.x - 200 */
			if(this.x < p.x - 205 || this.x > p.x - 195) {
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
			if(this.x < p.x + 195 || this.x > p.x + 205) {
				this.legDir = (this.legs > 7) ? -0.5 : this.legDir;
				this.legDir = (this.legs < -7) ? 0.5 : this.legDir;
			}
			else {
				this.legDir = (this.legs > 7) ? 0 : this.legDir;
				this.legDir = (this.legs < -7) ? 0 : this.legDir;
			}
		}
		/* movement */
		if(this.x > p.x) {
			this.x = (this.x < p.x + 195) ? this.x + 2 : this.x;
			this.x = (this.x > p.x + 205) ? this.x - 2 : this.x;
		}
		else {
			this.x = (this.x < p.x - 195) ? this.x + 2 : this.x;
			this.x = (this.x > p.x - 205) ? this.x - 2 : this.x;
		}
		this.canJump = false;
	}
	else {
		/* movement */
		this.x = (this.x < dest.x) ? this.x + 2 : this.x - 2;
		this.canJump = false;
	}
	this.velocity.y += 0.1;
	this.y += this.velocity.y;
});
SkeletonArcher.method("attack", function() {
	this.timeSinceAttack ++;
	if(this.timeSinceAttack > 60) {
		/* (timeSinceAttack > 60) ---> take out bow and begin aiming or shooting */
		var velocity = Math.rotate(this.ARROW_SPEED, 0, this.aimRot);
		if(this.x > p.x) {
			velocity.x *= -1;
		}
		var playerArrowIntersection = {
			x: p.x,
			y: this.simulateAttack(velocity)
		};
		if(playerArrowIntersection.y < p.y + p.hitbox.top) {
			/* aiming too high -> aim lower */
			this.aimRot ++;
			if(this.aimRot > 360 + 45 && this.timeAiming > 60) {
				/* too high, but already aiming as high as possible -> shoot arrow */
				this.shoot();
			}
		}
		else if(playerArrowIntersection.y > p.y + p.hitbox.bottom) {
			/* aiming too low - aim higher */
			this.aimRot --;
			if(this.aimRot < 360 - 45 && this.timeAiming > 60) {
				/* too low, but already aiming as low as possible -> shoot arrow */
				this.shoot();
			}
		}
		else if(this.timeAiming > 60) {
			/* aiming at player -> shoot arrow */
			this.shoot();
		}
	}
	this.aimRot = Math.constrain(this.aimRot, 360 - 45, 360 + 45);
});
SkeletonArcher.method("shoot", function() {
	/*
	This method (UNCONDITIONALLY) shoots an arrow according to how high the skeleton archer is aiming.
	*/
	var damage = Math.floor(Math.randomInRange(this.damLow, this.damHigh));
	var velocity = Math.rotate(5, 0, this.aimRot);
	if(this.x > p.x) {
		velocity.x *= -1;
	}
	var arrow = new ShotArrow(
		this.x + velocity.x / 2, this.y + velocity.y / 2,
		velocity.x, velocity.y,
		damage, "enemy", "none", "a skeletal archer"
	);
	game.dungeon[game.theRoom].content.push(arrow);
	this.timeSinceAttack = 0;
	this.timeAiming = 0;
});
SkeletonArcher.method("simulateAttack", function(arrowVelocity) {
	/*
	This function returns the y-value at which an arrow shot in the player's direction would be once it hit the player's x-value. (You can use this to determine if the SkeletonArcher is aiming at the right angle to hit the player.)
	*/
	var x = this.x;
	var y = this.y;
	if(this.x > p.x) {
		while(x > p.x) {
			x += arrowVelocity.x;
			y += arrowVelocity.y;
			arrowVelocity.y += 0.1;
		}
		return y;
	}
	else {
		while(x < p.x) {
			x += arrowVelocity.x;
			y += arrowVelocity.y;
			arrowVelocity.y += 0.1;
		}
		return y;
	}
});
SkeletonArcher.method("handleCollision", function(direction, collision) { });

function Particle(color, x, y, velX, velY, size) {
	this.color = color;
	this.x = x;
	this.y = y;
	this.z = 1;
	this.velocity = { x: velX, y: velY };
	this.size = size;
	this.opacity = 1;
};
Particle.method("display", function() {
	var self = this;
	var center = graphics3D.point3D(this.x, this.y, this.z);
	var radius = this.size * this.z;
	var display = function() {
		c.save(); {
			c.fillStyle = self.color;
			c.globalAlpha = Math.max(self.opacity, 0);
			c.fillCircle(center.x, center.y, radius);
		} c.restore();
	};
	game.dungeon[game.theRoom].render(
		new RenderingOrderObject(
			display,
			this.z
		)
	);
});
Particle.method("update", function() {
	this.x += this.velocity.x;
	this.y += this.velocity.y;
	this.opacity -= 0.05;
	this.toBeRemoved = (this.opacity <= 0);
});
function Wraith(x, y) {
	Enemy.call(this, x, y);
	this.particles = [];
	this.timeSinceAttack = 0;

	/* hitbox */
	this.hitbox = new utils.geom.Rectangle({
		left: -50,
		right: 50,
		top: -50,
		bottom: 50
	});

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
Wraith.method("display", function() {
	/* particle graphics */
	for(var i = 0; i < this.particles.length; i ++) {
		this.particles[i].display();
		if(this.particles[i].opacity <= 0) {
			this.particles.splice(i, 1);
		}
	}
	for(var i = 0; i < 10; i ++) {
		var pos = Math.randomInRange(0, 50);
		this.particles.push(new Particle("rgb(0, 0, 0)", this.x + Math.randomInRange(-pos, pos), this.y + 50 - pos * 2, Math.randomInRange(-1, 1), Math.randomInRange(-1, 1), Math.randomInRange(6, 10)));
		this.particles.push(new Particle("rgb(255, 0, 0)", this.x - 10, this.y - 25, Math.randomInRange(0, 0.5), Math.randomInRange(0, 0.5), Math.randomInRange(2, 4)));
		this.particles.push(new Particle("rgb(255, 0, 0)", this.x + 10, this.y - 25, Math.randomInRange(0, 0.5), Math.randomInRange(0, 0.5), Math.randomInRange(2, 4)));
	}
});
Wraith.method("update", function(dest) {
	this.timeFrozen = 0; // wraiths are immune to these effects
	this.timeBurning = 0;

	if(dest === "player") {
		/* movement */
		if(Math.dist(this.x, this.y, p.x, p.y) <= 100) {
			var idealX = (this.x < p.x) ? p.x - 150 : p.x + 150;
			this.x += (idealX - this.x) / 60;
		}
		this.timeSinceAttack ++;
	}
	else {
		this.x = (this.x < dest.x) ? this.x + 2 : this.x - 2;
		this.y = (this.y < dest.y) ? this.y + 2 : this.y - 2;
	}

	this.particles.forEach((particle) => { particle.update(); });
});
Wraith.method("attack", function() {
	/* attacking */
	if(this.timeSinceAttack > 60) {
		var velocity = Math.normalize(p.x - (this.x), p.y - (this.y));
		velocity.x *= 10;
		velocity.y *= 10;
		game.dungeon[game.theRoom].content.push(new MagicCharge(this.x, this.y, velocity.x, velocity.y, "shadow", Math.randomInRange(this.damLow, this.damHigh)));
		this.timeSinceAttack = 0;
	}
});
Wraith.method("handleCollision", function(direction, collision) {

});
Wraith.method("translate", function(x, y) {
	this.x += x;
	this.y += y;
	for(var i = 0; i < this.particles.length; i ++) {
		var particle = this.particles[i];
		particle.x += x;
		particle.y += y;
	}
});

function MagicCharge(x, y, velX, velY, type, damage) {
	this.x = x;
	this.y = y;
	this.velocity = { x: velX, y: velY };
	this.type = type;
	this.damage = damage;
	this.particles = [];
	this.beingAimed = false;
	this.hitbox = new utils.geom.Rectangle({
		left: -20,
		right: 20,
		top: -20,
		bottom: 20
	});
	this.noTeleportCollisions = true;
};
MagicCharge.method("display", function() {
	/* graphics */
	for(var i = 0; i < this.particles.length; i ++) {
		this.particles[i].display();
		if(this.particles[i].opacity <= 0) {
			this.particles.splice(i, 1);
		}
	}
});
MagicCharge.method("update", function() {
	this.particles.forEach((particle) => { particle.update(); });
	/* collision with player */
	if(collisions.objectIntersectsObject(this, p) && (this.type === "shadow" || (this.type === "fire" && this.shotBy === "enemy"))) {
		var damage = Math.round(Math.randomInRange(40, 50));
		p.hurt(damage, (this.type === "shadow") ? "a wraith" : "a dragonling");
		this.toBeRemoved = true;
	}
	const COLORS = {
		"shadow": "rgb(0, 0, 0)",
		"energy": "hsl(" + (utils.frameCount % 360) + ", 100%, 50%)",
		"chaos": "rgb(" + (Math.randomInRange(0, 255)) + ", 0, 0)",
		"fire": "rgb(255, 128, 0)",
		"water": "rgb(0, 128, 255)",
		"earth": "rgb(0, 160, 0)",
		"air": "rgb(170, 170, 170)"
	};
	this.particles.push(new Particle(COLORS[this.type], this.x, this.y, Math.randomInRange(-1, 1), Math.randomInRange(-1, 1), 10));
	/* movement */
	this.x += this.velocity.x;
	this.y += this.velocity.y;
	/* collision with enemies + objects */
	for(var i = 0; i < game.dungeon[game.inRoom].content.length; i ++) {
		if(game.dungeon[game.inRoom].content[i] instanceof Enemy && this.type !== "shadow" && this.shotBy !== "enemy") {
			var enemy = game.dungeon[game.theRoom].content[i];
			if(collisions.objectIntersectsObject(this, enemy)) {
				this.toBeRemoved = true;
				enemy.hurt(this.damage);
				if(["fire", "water", "earth", "air"].includes(this.type)) {
					Weapon.applyElementalEffect(this.type, enemy, (this.velocity.x < 0) ? "left" : "right", { x: this.x, y: this.y }, true);
				}
				if(this.type === "chaos") {
					var hp = enemy.health;
					game.dungeon[game.theRoom].content[i] = new RandomEnemy(enemy.x, enemy.y + enemy.hitbox.bottom, enemy.constructor);
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
	}
});
MagicCharge.method("remove", function() {
	game.dungeon[game.theRoom].content = game.dungeon[game.theRoom].content.concat(this.particles);
});
MagicCharge.method("handleCollision", function(direction, collision) {
	this.toBeRemoved = true;
	/* teleport player to position for chaos charges */
	if(this.type === "chaos" && !p.aiming) {
		p.x = this.x;
		p.y = this.y;
		for(var j = 0; j < collisions.length; j ++) {
			while(p.x + p.hitbox.right > collisions.collisions[i].x && p.x + p.hitbox.left < collisions.collisions[i].x + 10 && p.y + p.hitbox.bottom > collisions.collisions[i].y && p.y + p.hitbox.top < collisions.collisions[i].y + collisions.collisions[i].h) {
				p.x --;
			}
			while(p.x + p.hitbox.left < collisions.collisions[i].x + collisions.collisions[i].w && p.x + p.hitbox.right > collisions.collisions[i].x + collisions.collisions[i].w - 10 && p.y + p.hitbox.bottom > collisions.collisions[i].y && p.y + p.hitbox.top < collisions.collisions[i].y + collisions.collisions[i].h) {
				p.x ++;
			}
			while(p.x + p.hitbox.right > collisions.collisions[i].x && p.x + p.hitbox.left < collisions.collisions[i].x + collisions.collisions[i].w && p.y + p.hitbox.top < collisions.collisions[i].y + collisions.collisions[i].h && p.y + p.hitbox.bottom > collisions.collisions[i].y + collisions.collisions[i].h - 10) {
				p.y ++;
			}
			while(p.x + p.hitbox.right > collisions.collisions[i].x && p.x + p.hitbox.left < collisions.collisions[i].x + collisions.collisions[i].w && p.y + p.hitbox.bottom > collisions.collisions[i].y && p.y + p.hitbox.top < collisions.collisions[i].y + 10) {
				p.y --;
			}
		}
	}
});
MagicCharge.method("translate", function(x, y) {
	this.x += x;
	this.y += y;
	for(var i = 0; i < this.particles.length; i ++) {
		var particle = this.particles[i];
		particle.x += x;
		particle.y += y;
	}
});

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
	this.facing = "right";

	/* hitbox */
	this.hitbox = new utils.geom.Rectangle({
		left: -60,
		right: 60,
		top: -50,
		bottom: 60
	});

	/* stats */
	this.health = 150;
	this.maxHealth = 150;
	this.defLow = 50;
	this.defHigh = 70;
	this.damLow = 50;
	this.damHigh = 70;
	this.complexAttack = true;
	this.name = "a troll";
};
Troll.extends(Enemy);
Troll.method("display", function() {
	var self = this;
	game.dungeon[game.theRoom].render(new RenderingOrderObject(
		function() {
			c.save(); {
				c.translate(self.x, self.y);
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
							c.translate(3 * self.leg1, 7 * self.leg1);
						}
						else {
							c.translate(-3 * self.leg2, 7 * self.leg2);
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
				c.translate(self.x + 40, self.y - 10);
				if(self.armAttacking === "right") {
					c.rotate(Math.rad(self.attackArm));
				}
				else {
					c.rotate(Math.rad(60));
				}
				if(self.facing === "right" && self.currentAction === "melee-attack") {
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
				c.translate(self.x - 40, self.y - 10);
				if(self.armAttacking === "left") {
					c.rotate(Math.rad(-self.attackArm));
				}
				else {
					c.rotate(Math.rad(-60));
				}
				if(self.facing === "left" && self.currentAction === "melee-attack") {
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
		},
		1
	));
});
Troll.method("update", function() {
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
	this.facing = (this.x < p.x) ? "right" : "left";
	/* movement */
	this.x += this.velocity.x;
	this.y += this.velocity.y;
	this.velocity.y += 0.1;
	this.attackArm += this.attackArmDir;
	/* this.attackRecharge ++; */
	if(this.currentAction === "move") {
		if(this.x < p.x) {
			this.velocity.x = (this.x < p.x - 100) ? 1 : this.velocity.x;
			this.velocity.x = (this.x > p.x - 100) ? -1 : this.velocity.x;
		}
		else {
			this.velocity.x = (this.x < p.x + 100) ? 1 : this.velocity.x;
			this.velocity.x = (this.x > p.x + 100) ? -1 : this.velocity.x;
		}
		this.timeDoingAction ++;
		if(this.timeDoingAction > 90) {
			if(Math.dist(this.x, p.x) > 150) {
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
		this.velocity.x = 0;
		this.walking = false;
		if(this.x < p.x) {
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
		this.velocity.x = 0;
		this.attackArmDir = (this.attackArm > 80) ? -2 : this.attackArmDir;
		this.attackArmDir = (this.attackArm < 0) ? 2 : this.attackArmDir;
		this.attackArmDir = (this.attackArmDir === 0) ? -2 : this.attackArmDir;
		if(this.x < p.x) {
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
			weaponPos.x += this.x + (this.armAttacking === "right" ? 40 : -40);
			weaponPos.y += this.y - 10;
			if(collisions.objectIntersectsPoint(p, weaponPos) && this.attackRecharge < 0) {
				p.hurt(Math.floor(Math.randomInRange(40, 50)), "a troll");
				this.attackRecharge = 45;
			}
		}
	}
	collisions.solids.rect(this.x - 40, this.y - 20, 80, 60);
});
Troll.method("handleCollision", function(direction, collision) {

});

function Rock(x, y, velX, velY) {
	this.x = x;
	this.y = y;
	this.velocity = { x: velX, y: velY };
	this.hitSomething = false;
	this.hitPlayer = false;
	this.opacity = 1;
	this.fragments = [];
	this.hitbox = new utils.geom.Rectangle({ left: -20, right: 20, top: -20, bottom: 20 });
};
Rock.method("display", function() {
	if(!this.hitSomething) {
		c.save(); {
			c.globalAlpha = this.opacity;
			c.fillStyle = "rgb(140, 140, 140)";
			c.fillCircle(this.x, this.y, 20);
		} c.restore();
	}
	else {
		c.save(); {
			c.fillStyle = "rgb(140, 140, 140)";
			for(var i = 0; i < this.fragments.length; i ++) {
				c.globalAlpha = this.fragments[i].opacity;
				c.fillCircle(this.fragments[i].x, this.fragments[i].y, 5);
			}
		} c.restore();
	}
});
Rock.method("update", function() {
	if(!this.hitSomething) {
		this.x += this.velocity.x;
		this.y += this.velocity.y;
		this.velocity.y += 0.1;
	}
	else {
		c.save(); {
			c.fillStyle = "rgb(140, 140, 140)";
			for(var i = 0; i < this.fragments.length; i ++) {
				this.fragments[i].x += this.fragments[i].velocity.x;
				this.fragments[i].y += this.fragments[i].velocity.y;
				this.fragments[i].velocity.y += 0.1;
				this.fragments[i].opacity -= 0.05;
				if(this.fragments[i].opacity <= 0) {
					this.toBeRemoved = true;
				}
			}
		} c.restore();
	}
	if(!this.hitPlayer && collisions.objectIntersectsObject(this, p)) {
		p.hurt(Math.randomInRange(40, 50), "a troll");
		this.hitPlayer = true;
	}
});
Rock.method("handleCollision", function(direction, collision) {
	if(!this.hitSomething) {
		this.hitSomething = true;
		for(var j = 0; j < 10; j ++) {
			this.fragments.push({
				x: this.x + (Math.randomInRange(-5, 5)), y: this.y + (Math.randomInRange(-5, 5)),
				velocity: {
					x: Math.randomInRange(-1, 1),
					y: Math.randomInRange(-1, 1)
				},
				opacity: 2
			});
		}
	}
});
Rock.method("translate", function(x, y) {
	this.x += x;
	this.y += y;
	for(var i = 0; i < this.fragments.length; i ++) {
		var particle = this.fragments[i];
		particle.x += x;
		particle.y += y;
	}
});

function Dragonling(x, y) {
	Enemy.call(this, x, y);
	this.destX = p.x;
	this.destY = p.y;
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
	this.hitbox = new utils.geom.Rectangle({
		left: -5,
		right: 5,
		top: -5,
		bottom: 20
	});
};
Dragonling.extends(Enemy);
Dragonling.method("display", function() {
	var self = this;
	game.dungeon[game.theRoom].render(new RenderingOrderObject(
		function() {
			/* back wing */
			c.globalAlpha = Math.constrain(self.opacity, 0, 1);
			c.fillStyle  = "rgb(0, 235, 0)";
			var p1 = {x: self.pos[25].x, y: self.pos[25].y};
			var slope = Math.normalize(self.pos[11].x - self.pos[5].x, self.pos[11].y - self.pos[5].y);
			var p2 = graphics3D.point3D((slope.x * 15) + self.pos[25].x, (slope.y * 15) + self.pos[25].y, 0.9);
			var p3 = graphics3D.point3D((-slope.x * 15) + self.pos[25].x, (-slope.y * 15) + self.pos[25].y, 0.9);
			var p4 = graphics3D.point3D(p1.x, p1.y, 0.8);
			c.fillPoly(p2, p4, p3, p1);
			/* mouth */
			c.fillStyle = "rgb(0, 255, 0)";
			c.save(); {
				c.translate(self.x, self.y);
				c.rotate(Math.rad(self.rot));
				c.fillPoly(
					0, -10,
					20, -20,
					self.mouth, -50,
					0, 10,
					-self.mouth, -50,
					-20, -20
				);
			} c.restore();
			/* tail */
			c.strokeStyle = "rgb(0, 255, 0)";
			c.lineWidth = 5;
			c.strokeLine.apply(c, self.pos);
			/* update tail position */
			self.pos.push({x: self.x, y: self.y});
			if(self.pos.length > 30) {
				self.pos.splice(0, 1);
			}
			/* front wing */
			c.fillStyle = "rgb(20, 255, 20)";
			var p2 = graphics3D.point3D((slope.x * 15) + self.pos[25].x, (slope.y * 15) + self.pos[25].y, 1.1);
			var p3 = graphics3D.point3D((-slope.x * 15) + self.pos[25].x, (-slope.y * 15) + self.pos[25].y, 1.1);
			var p4 = graphics3D.point3D(p1.x, p1.y, 1.2);
			c.fillPoly(p2, p4, p3, p1);
		},
		1
	));
});
Dragonling.method("update", function() {
	/* move according to rotation */
	var theVel = Math.rotate(0, -10, this.rot);
	this.velocity.x += theVel.x / 100;
	this.velocity.y += theVel.y / 100;
	if(!this.frozen) {
		this.x += this.velocity.x;
		this.y += this.velocity.y;
	}
	/* accelerate towards destination */
	var idealAngle = Math.calculateDegrees(this.x - this.destX, this.y - this.destY) - 90;
	var cw = Math.dist(this.rot, idealAngle + 360);
	var ccw = Math.dist(this.rot, idealAngle - 360);
	var normal = Math.dist(this.rot, idealAngle);
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
		this.destX = p.x;
		this.destY = p.y;
	}
	else if(this.currentAction === "shoot") {
		if(this.velocity.y > 0) {
			this.destX = this.x + (this.velocity.x > 0) ? 100 : -100;
			this.destY = this.y - 50;
		}
		else {
			this.destX = this.x;
			this.destY = this.y;
		}
	}
	/* bite mouth */
	if(collisions.objectIntersectsCircle(p, { x: this.x, y: this.y, r: 40 }) && this.mouthDir === 0 && this.currentAction === "bite") {
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
	var idealAngle = Math.calculateDegrees(this.x - p.x, this.y - p.y) - 90;
	if(this.reload > 120 && Math.dist(this.rot, idealAngle) <= 2 && Math.distSq(this.x, this.y, p.x, p.y) >= 10000) {
		game.dungeon[game.theRoom].content.push(new MagicCharge(this.x, this.y, theVel.x, theVel.y, "fire", Math.randomInRange(40, 50)));
		game.dungeon[game.theRoom].content[game.dungeon[game.theRoom].content.length - 1].shotBy = "enemy";
		this.currentAction = "bite";
		this.reload = 0;
	}
	this.reload ++;
	/* update hitbox */
	this.rot = Math.modulateIntoRange(this.rot, 0, 360);
	this.hitbox = new utils.geom.Rectangle({ left: -20, right: 20, top: -20, bottom: 20 });
});
Dragonling.method("handleCollision", function() {

});
Dragonling.method("translate", function(x, y) {
	this.x += x;
	this.y += y;
	for(var i = 0; i < this.pos.length; i ++) {
		var position = this.pos[i];
		position.x += x;
		position.y += y;
	}
});



var utils = {
	initializer: {
		/*
		This object allows you to request for things to be initialized while inside an object declaration.
		*/
		initFuncs: [],
		request: function(func) {
			this.initFuncs.push(func);
			return false;
		},
		initializeEverything: function() {
			while(this.initFuncs.length > 0) {
				for(var i = 0; i < this.initFuncs.length; i ++) {
					try {
						this.initFuncs[i]();
						this.initFuncs.splice(i, 1);
						i --;
					}
					catch(error) {
						/* This function was initalized in the wrong order, so skip it and come back later when more things have been initialized */
					}
				}
			}
		}
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
var utils = {
	initializer: utils.initializer,

	mouseInRect: function(x, y, w, h) {
		return (collisions.pointIntersectsRectangle(
			{ x: io.mouse.x, y: io.mouse.y },
			{ x: x, y: y, w: w, h: h }
		));
	},
	mouseInCircle: function(x, y, r) {
		return collisions.pointIntersectsCircle(
			{ x: io.mouse.x, y: io.mouse.y },
			{ x: x, y: y, r: r }
		);
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
			this.mouse = io.mouse.clone();
		}
	},
	frameCount: 0,

	sortAscending: function(a, b) {
		return a - b;
	},
	sortDescending: function(a, b) {
		return b - a;
	},

	geom: {
		Rectangle: function(dimensions) {
			/*
			Rectangles have properties {x, y, width, height}, {x, y, w, h}, and {left, right, top, bottom}. Whenever one property is changed, all the other properties are updated to reflect that change.
			*/
			var x;
			var xGetterSetter = {
				get: function() { return x; },
				set: function(newX) { x = newX; updateBounds(); }
			};
			Object.defineProperty(this, "x", xGetterSetter);
			var y;
			var yGetterSetter = {
				get: function() { return y; },
				set: function(newY) { y = newY; updateBounds(); }
			};
			Object.defineProperty(this, "y", yGetterSetter);
			var width;
			var widthGetterSetter = {
				get: function() { return width; },
				set: function(newWidth) { width = newWidth; updateBounds(); }
			};
			Object.defineProperty(this, "width", widthGetterSetter);
			Object.defineProperty(this, "w", widthGetterSetter);
			var height;
			var heightGetterSetter = {
				get: function() { return height; },
				set: function(newHeight) { height = newHeight; updateBounds(); }
			};
			Object.defineProperty(this, "height", heightGetterSetter);
			Object.defineProperty(this, "h", heightGetterSetter);

			var left;
			var leftGetterSetter = {
				get: function() { return left; },
				set: function(newLeft) { left = newLeft; updateDimensions(); }
			};
			Object.defineProperty(this, "left", leftGetterSetter);
			var right;
			var rightGetterSetter = {
				get: function() { return right; },
				set: function(newRight) { right = newRight; updateDimensions(); }
			};
			Object.defineProperty(this, "right", rightGetterSetter);
			var top;
			var topGetterSetter = {
				get: function() { return top; },
				set: function(newTop) { top = newTop; updateDimensions(); }
			};
			Object.defineProperty(this, "top", topGetterSetter);
			var bottom;
			var bottomGetterSetter = {
				get: function() { return bottom; },
				set: function(newBottom) { bottom = newBottom; updateDimensions(); }
			};
			Object.defineProperty(this, "bottom", bottomGetterSetter);

			function updateDimensions() {
				/* Update x, y, width, and height to be consistent with left, right, top, and bottom. */
				x = left;
				y = top;
				width = right - left;
				height = bottom - top;
			};
			function updateBounds() {
				/* update left, right, top, and bottom to be consistent with x, y, width, and height. */
				left = x;
				right = x + width;
				top = y;
				bottom = y + height;
			};

			for(var i in dimensions) {
				this[i] = dimensions[i];
			}
		}
		.method("translate", function(x, y) {
			return new utils.geom.Rectangle({ x: this.x + x, y: this.y + y, w: this.w, h: this.h });
		})
	}
};
var graphics3D = {
	point3D: function(x, y, z) {
		/*
		Returns the visual position of a point at 'x', 'y', 'z'
		*/
		return Math.scaleAboutPoint(x, y, canvas.width / 2, canvas.height / 2, z);
	},
	cube: function(x, y, w, h, backDepth, frontDepth, frontCol, sideCol, settings) {
		/*
		Draws a rect. prism from ('x', 'y', 'frontDepth') to ('x' + 'w', 'y' + 'h', 'backDepth').
		*/
		frontCol = frontCol || "rgb(110, 110, 110)";
		sideCol = sideCol || "rgb(150, 150, 150)";
		settings = settings || {};
		settings.noFrontExtended = settings.noFrontExtended || false;
		settings.sideColors = settings.sideColors || {left: sideCol, right: sideCol, top: sideCol, bottom: sideCol};
		if(frontDepth < backDepth) {
			throw new Error("frontDepth (" + frontDepth + ") must be greater than backDepth (" + backDepth + ")");
		}
		/* Calculate back face coordinates */
		var topLeftB = graphics3D.point3D(x, y, backDepth);
		var topRightB = graphics3D.point3D(x + w, y, backDepth);
		var bottomLeftB = graphics3D.point3D(x, y + h, backDepth);
		var bottomRightB = graphics3D.point3D(x + w, y + h, backDepth);
		/* Calculate front face coordinates */
		var topLeftF = graphics3D.point3D(x, y, frontDepth);
		var topRightF = graphics3D.point3D(x + w, y, frontDepth);
		var bottomLeftF = graphics3D.point3D(x, y + h, frontDepth);
		var bottomRightF = graphics3D.point3D(x + w, y + h, frontDepth);
		/* Top face */
		game.dungeon[game.theRoom].beginRenderingGroup(); {
			game.dungeon[game.theRoom].render(
				new RenderingOrderShape(
					"polygon",
					[ topLeftF, topRightF, topRightB, topLeftB ],
					settings.sideColors.top,
					backDepth
				)
			);
			/* Bottom face */
			game.dungeon[game.theRoom].render(
				new RenderingOrderShape(
					"polygon",
					[ bottomLeftF, bottomRightF, bottomRightB, bottomLeftB ],
					settings.sideColors.bottom,
					backDepth
				)
			);
			/* Left face */
			game.dungeon[game.theRoom].render(
				new RenderingOrderShape(
					"polygon",
					[ topLeftF, bottomLeftF, bottomLeftB, topLeftB ],
					settings.sideColors.left,
					backDepth
				)
			);
			/* Right face */
			game.dungeon[game.theRoom].render(
				new RenderingOrderShape(
					"polygon",
					[ topRightF, bottomRightF, bottomRightB, topRightB ],
					settings.sideColors.right,
					backDepth
				)
			);
		} game.dungeon[game.theRoom].endRenderingGroup();
		/* Front face */
		if(!settings.noFrontExtended) {
			game.dungeon[game.theRoom].render(
				new RenderingOrderShape(
					"rect",
					{
						x: topLeftF.x,
						y: topLeftF.y,
						w: bottomRightF.x - topLeftF.x,
						h: bottomRightF.y - topLeftF.y
					},
					frontCol,
					frontDepth
				)
			);
		}
		else {
			c.fillStyle = frontCol;
			c.fillRect(topLeftF.x, topLeftF.y, bottomRightF.x - topLeftF.x, bottomRightF.y - topLeftF.y);
		}
	},
	plane3D: function(x1, y1, x2, y2, backDepth, frontDepth, col) {
		/*
		Draws a plane extending the line between ('x1', 'y1') and ('x2', 'y2') from 'frontDepth' to 'backDepth' with a color of 'col'.
		*/
		var p1 = graphics3D.point3D(x1, y1, frontDepth);
		var p2 = graphics3D.point3D(x1, y1, backDepth);
		var p3 = graphics3D.point3D(x2, y2, backDepth);
		var p4 = graphics3D.point3D(x2, y2, frontDepth);
		c.fillStyle = col;
		c.fillPoly(p1, p2, p3, p4);
	},
	line3D: function(x1, y1, z1, x2, y2, z2) {
		var point1 = this.point3D(x1, y1, z1);
		var point2 = this.point3D(x2, y2, z2);
		var lineWidth = c.lineWidth;
		var strokeStyle = c.strokeStyle;
		game.dungeon[game.theRoom].render(
			new RenderingOrderObject(
				function() {
					c.lineWidth = lineWidth;
					c.strokeStyle = strokeStyle;
					c.strokeLine(point1.x, point1.y, point2.x, point2.y);
				},
				Math.min(z1, z2)
			)
		);
	},
	polygon3D: function(frontCol, sideCol, backDepth, frontDepth, points, settings) {
		/*
		Draws a sideways polygonal prism w/ base defined by 'points' array, w/ front color 'frontCol' and side color 'sideCol' going from 'frontDepth' to 'backDepth'.
		*/
		if(frontDepth > backDepth) {
			var start = frontDepth;
			frontDepth = backDepth;
			backDepth = start;
		}
		/* Generate a list of points in 3d */
		var frontVertices = [];
		var backVertices = [];
		for(var i = 0; i < points.length; i ++) {
			var front = graphics3D.point3D(points[i].x, points[i].y, backDepth)
			frontVertices.push(front);
			backVertices.push(graphics3D.point3D(points[i].x, points[i].y, frontDepth));
		}
		/* side faces */
		c.fillStyle = sideCol;
		game.dungeon[game.theRoom].beginRenderingGroup(); {
			for(var i = 0; i < frontVertices.length; i ++) {
				var next = (i === frontVertices.length - 1) ? 0 : i + 1;
				game.dungeon[game.theRoom].render(
					new RenderingOrderShape(
						"polygon",
						[frontVertices[i], frontVertices[next], backVertices[next], backVertices[i]],
						sideCol,
						frontDepth
					)
				);
			}
		} game.dungeon[game.theRoom].endRenderingGroup();
		/* front face */
		game.dungeon[game.theRoom].render(
			new RenderingOrderShape(
				"polygon",
				frontVertices,
				frontCol,
				backDepth,
			)
		);
	},
	polyhedron: function(color, points) {
		/*
		Not really a polyhedron. It just connects the (3d) points in order.
		*/
		var farthestBackPoint = Infinity;
		for(var i = 0; i < points.length; i ++) {
			if(points[i].z < farthestBackPoint) {
				farthestBackPoint = points[i].z;
			}
		}
		game.dungeon[game.theRoom].render(
			new RenderingOrderObject(
				function() {
					var points3D = [];
					for(var i = 0; i < points.length; i ++) {
						var location = graphics3D.point3D(points[i].x, points[i].y, points[i].z);
						points3D.push(location);
					}
					c.fillStyle = color;
					c.fillPoly(location);
				},
				farthestBackPoint
			)
		);
	},

	cutoutPolygon: function(frontCol, sideCol, backDepth, frontDepth, points) {
		if(frontDepth < backDepth) {
			throw new Error("frontDepth (" + frontDepth + ") must be greater than backDepth (" + backDepth + ")");
		}
		var front = [];
		for(var i = 0; i < points.length; i ++) {
			front.push(graphics3D.point3D(points[i].x, points[i].y, frontDepth));
		}
		var back = [];
		for(var i = 0; i < points.length; i ++) {
			back.push(graphics3D.point3D(points[i].x, points[i].y, backDepth));
		}
		c.save(); {
			game.dungeon[game.theRoom].setRenderingStyle(function() {
				c.beginPath();
				c.polygon(front);
				c.clip();
			});
			game.dungeon[game.theRoom].beginRenderingGroup(); {
				for(var i = 0; i < points.length; i ++) {
					var next = (i === points.length - 1) ? 0 : i + 1;
					game.dungeon[game.theRoom].render(new RenderingOrderShape(
						"polygon",
						[ front[i], front[next], back[next], back[i] ],
						sideCol,
						backDepth
					))
					// c.fillPoly(front[i], front[next], back[next], back[i]);
				}
			} game.dungeon[game.theRoom].endRenderingGroup();
			game.dungeon[game.theRoom].clearRenderingStyle();
		} c.restore();
	},
	cutoutRect: function(x, y, w, h, frontCol, sideCol, backDepth, frontDepth) {
		this.cutoutPolygon(
			frontCol, sideCol, backDepth, frontDepth,
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
				c.fillArc(boxFront.loc[0], boxFront.loc[1], boxFront.loc[2], boxFront.loc[3], boxFront.loc[4], true);
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
	solids: {
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
				if(Math.dist(x1, x2) < Math.dist(y1, y2) || (p.y + 10 > y1 && p.y + 10 > y2)) {
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
				collisions.solids.rect(points[i].x, points[i].y, 3, 3, { illegalHandling: settings.illegalHandling, walls: settings.walls, extraBouncy: settings.extraBouncy, moving: settings.moving, onCollision: settings.onCollision, collisionCriteria: settings.collisionCriteria, noPositionLimits: settings.noPositionLimits });
			}
		},
		circle: function(x, y, r) {
			collisions.collisions.push(new CollisionCircle(x, y, r));
		}
	},

	collisions: [],

	pointIntersectsRectangle: Function.overload({
		"object {x, y}, object {x, y, w, h}": function(point, rect) {
			return (point.x > rect.x && point.x < rect.x + rect.w && point.y > rect.y && point.y < rect.y + rect.h);
		},
		"object {x, y}, object {x, y, width, height}": function(point, rect) {
			return (point.x > rect.x && point.x < rect.x + rect.width && point.y > rect.y && point.y < rect.y + rect.height);
		},
		"object {x, y}, object {left, right, top, bottom}": function(point, rect) {
			return (point.x > rect.left && point.x < rect.right && point.y > rect.top && point.y < rect.bottom);
		}
	}),
	pointIntersectsCircle: Function.overload({
		"object {x, y}, object {x, y, r}": function(point, circle) {
			return (Math.distSq(point.x, point.y, circle.x, circle.y) <= (circle.r * circle.r));
		},
		"object {x, y}, object {x, y, radius}": function(point, circle) {
			return this.pointIntersectsCircle(point, { x: circle.x, y: circle.y, r: circle.radius });
		},
		"number, number, number, number, number": function(x, y, circleX, circleY, radius) {
			return this.pointIntersectsCircle(
				{ x: x, y: y },
				{ x: circleX, y: circleY, r: radius }
			);
		}
	}),
	rectangleIntersectsRectangle: function(rect1, rect2) {
		function convertToCorrectForm(rect) {
			if(rect.hasOwnProperties("x", "y", "w", "h")) {
				return rect;
			}
			else if(rect.hasOwnProperties("x", "y", "width", "height")) {
				return { x: rect.x, y: rect.y, w: rect.width, h: rect.height };
			}
			else if(rect.hasOwnProperties("left", "right", "top", "bottom")) {
				return {
					x: rect.left,
					y: rect.top,
					w: Math.dist(rect.left, rect.right),
					h: Math.dist(rect.top, rect.bottom)
				};
			}
		};
		rect1 = convertToCorrectForm(rect1);
		rect2 = convertToCorrectForm(rect2);
		return (
			rect1.x + rect1.w > rect2.x &&
			rect1.x < rect2.x + rect2.w &&
			rect1.y + rect1.h > rect2.y &&
			rect1.y < rect2.y + rect2.h
		);
	},
	rectangleIntersectsCircle: function(rect, circle) {
		/*
		Rectangle: {x, y, w, h}, {x, y, width, height}, {left, right, top, bottom}
		Circle: {x, y, r} or {x, y, radius}
		*/
		var point = { x: circle.x, y: circle.y };
		if(rect.hasOwnProperties("x", "y", "w", "h")) {
			point = {
				x: Math.constrain(point.x, rect.x, rect.x + rect.w),
				y: Math.constrain(point.y, rect.y, rect.y + rect.h)
			};
		}
		else if(rect.hasOwnProperties("x", "y", "width", "height")) {
			point = {
				x: Math.constrain(point.x, rect.x, rect.x + rect.width),
				y: Math.constrain(point.y, rect.y, rect.y + rect.height)
			};
		}
		else if(rect.hasOwnProperties("left", "right", "top", "bottom")) {
			point = {
				x: Math.constrain(point.x, rect.left, rect.right),
				y: Math.constrain(point.y, rect.top, rect.bottom)
			};
		}
		return collisions.pointIntersectsCircle(point, circle);
	},

	objectIntersectsObject: function(obj1, obj2) {
		if(!(obj1.hitbox instanceof utils.geom.Rectangle && obj2.hitbox instanceof utils.geom.Rectangle)) {
			throw new Error("Objects of type " + obj1.constructor.name + " and " + obj2.constructor.name + " have invalid hitbox properties for collision checking.");
		}
		if(obj1 instanceof Player) {
			return this.collidesWith(obj2, obj1);
		}
		return (
			obj1.x + obj1.hitbox.right > obj2.x + obj2.hitbox.left &&
			obj1.x + obj1.hitbox.left < obj2.x + obj2.hitbox.right &&
			obj1.y + obj1.hitbox.bottom > obj2.y + obj2.hitbox.top &&
			obj1.y + obj1.hitbox.top < obj2.y + obj2.hitbox.bottom
		);
	},
	objectIntersectsPoint: Function.overload({
		"object {hitbox}, object {x, y}": function(obj, point) {
			return this.objectIntersectsPoint(obj, point.x, point.y);
		},
		"object {hitbox}, number, number": function(obj, x, y) {
			return collisions.pointIntersectsRectangle({ x: x, y: y }, obj.hitbox.translate(obj.x, obj.y));
		}
	}),
	objectIntersectsRect: function(obj, rect) {
		return collisions.rectangleIntersectsRectangle(obj.hitbox.translate(obj.x, obj.y), rect);
	},
	objectIntersectsCircle: function(obj, circle) {
		return collisions.rectangleIntersectsCircle(obj.hitbox.translate(obj.x, obj.y), circle);
	}
};
var debugging = {
	/*
	This object provides methods + properties so that you can disable certain aspects of the game for manual testing + debugging.
	*/
	hitboxes: [],
	timeOfLastCall: 0,
	frameOfLastCall: 0,
	fps: 0,

	activateDebuggingSettings: function() {
		game.onScreen = "play";
		/* override randomizer for room generation */
		var includedRooms = ["combat1", "reward2"];
		// debugger;
		for(var i = 0; i < game.rooms.length; i ++) {
			if(!includedRooms.includes(game.rooms[i].name)) {
				// game.rooms.splice(i, 1);
				// i --;
				continue;
			}
		}
		// game.items = [Sword];
		game.enemies = [Dragonling];
		/* load different rooms to override the first room */
		function loadRoom(id) {
			game.dungeon = [];
			var foundRoomSuccessfully = false;
			for(var i = 0; i < game.rooms.length; i ++) {
				if(game.rooms[i].name === id) {
					game.rooms[i].add();
					var room = game.dungeon[0];
					for(var j = 0; j < room.content.length; j ++) {
						var object = room.content[j];
						if(object instanceof Door) {
							p.x = object.x;
							p.y = object.y - p.hitbox.bottom;
						}
					}
					room.colorScheme = ["red", "green", "blue"].randomItem();
					foundRoomSuccessfully = true;
					break;
				}
			}
			if(foundRoomSuccessfully) {
				game.dungeon[0].getInstancesOf(Door).forEach(function(obj) { obj.containingRoomID = 0; });
			}
			else {
				throw new Error("Could not find room ID of '" + id + "'");
			}
		};
		loadRoom("parkour1");
		/* change doors in first room */
		for(var i = 0; i < game.dungeon[0].content.length; i ++) {
			if(game.dungeon[0].content[i] instanceof Door) {
				// game.dungeon[0].content[i].dest = ["reward"];
			}
		}
		/* give player items */
		p.class = "archer";
		for(var i = 0; i < game.items.length; i ++) {
			// p.addItem(new game.items[i]());
		}
		p.addItem(new WoodBow());
		p.addItem(new MechBow());
		p.addItem(new EnergyStaff());
		p.addItem(new Arrow(Infinity));
	},
	drawPoint: function() {
		/* Puts a point at the location. (Used for visualizing graphic functions) */
		c.save(); {
			c.fillStyle = "rgb(255, 0, 0)";
			var size = Math.sin(utils.frameCount / 10) * 5 + 5;
			if(typeof arguments[0] === "number") {
				c.fillCircle(arguments[0], arguments[1], size);
			}
			else {
				c.fillCircle(arguments[0].x, arguments[0].y, size);
			}
		} c.restore();
	},

	calculateFPS: function() {
		var timeNow = new Date().getTime();
		var timePassed = timeNow - this.timeOfLastCall;
		var framesNow = utils.frameCount;
		var framesPassed = framesNow - this.frameOfLastCall;
		this.fps = Math.round(framesPassed / timePassed * 1000);

		this.timeOfLastCall = timeNow;
		this.frameOfLastCall = framesNow;
	},
	displayFPS: function() {
		c.fillStyle = "rgb(255, 255, 255)";
		c.textAlign = "left";
		c.fillText(this.fps + " fps", 0, 10);
	},

	displayHitboxes: function() {
		var colorIntensity = Math.map(
			Math.sin(utils.frameCount / 30),
			-1, 1,
			225, 255
		);
		const COLORS = {
			"light blue": "rgb(0, " + colorIntensity + ", " + colorIntensity + ")",
			"dark blue": "rgb(0, 0, " + colorIntensity + ")",
			"green": "rgb(0, " + colorIntensity + ", 0)"
		};
		for(var i = 0; i < debugging.hitboxes.length; i ++) {
			var hitbox = debugging.hitboxes[i];
			c.strokeStyle = COLORS[hitbox.color];
			c.lineWidth = 5;
			if(hitbox.hasOwnProperties("x", "y", "r")) {
				c.strokeCircle(hitbox.x + game.camera.getOffsetX(), hitbox.y + game.camera.getOffsetY(), hitbox.r);
			}
			else if(hitbox.hasOwnProperties("x", "y", "w", "h")) {
				c.strokeRect(hitbox.x + game.camera.getOffsetX(), hitbox.y + game.camera.getOffsetY(), hitbox.w, hitbox.h);
			}
		}
	},

	clearSlot: function(id) {
		/* Clears the specified slot of the player's inventory */
		if(Object.typeof(id) !== "number") {
			p.invSlots.forEach((slot) => { slot.content = "empty"; });
		}
		else {
			p.invSlots[id].content = "empty";
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
			colorScheme: null,
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
			colorScheme: "all",
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
			colorScheme: "all",
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
			colorScheme: null,
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
			colorScheme: "blue",
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
			colorScheme: "green",
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
							new LightRay(200, 500, 500),
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
			colorScheme: "all",
			difficulty: 0,
			extraDoors: 1,
			add: function() {
				var possibleItems = game.items.clone();
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
					if(p.hasInInventory(possibleItems[i])) {
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
							return;
						}
					}
					throw new Error("Player has all items in game and default room was not available");
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
			},
			getPossibleStatueItems: function() {
				return game.items.clone().filter(function(constructor) {
					var instance = new constructor();
					return instance instanceof Weapon && !(instance instanceof Arrow || instance instanceof Dagger);
				}).filter(function(constructor) {
					return !p.hasInInventory(constructor);
				});
			}
		},
		/* basic combat room */
		{
			name: "combat1",
			colorScheme: "all",
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
							new Door(450, 0, ["ambient"], false).beginDebugging(),
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
			colorScheme: null,
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
			colorScheme: null,
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
			colorScheme: "all",
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
			colorScheme: "all",
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
			colorScheme: null,
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
			colorScheme: "all",
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
			colorScheme: "all",
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
			colorScheme: null,
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
			colorScheme: "blue|red",
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
			colorScheme: "red",
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
			colorScheme: "all",
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
	getRoomByID: function(id) {
		return this.rooms.filter(function(room) { return room.name === id; })[0];
	},
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
	theRoom: 0,
	numRooms: 0,

	exist: function() {

	},

	generateNewRoom: function(entranceDoor) {
		p.roomsExplored ++;
		p.numHeals ++;
		/* Calculate distance to nearest unexplored door */
		game.calculatePaths();
		p.terminateProb = 0;
		for(var i = 0; i < game.dungeon.length; i ++) {
			for(var j = 0; j < game.dungeon[i].content.length; j ++) {
				if(game.dungeon[i].content[j] instanceof Door && typeof(game.dungeon[i].content[j].dest) === "object" && !game.dungeon[i].content[j].entering) {
					p.terminateProb += (1 / ((game.dungeon[i].pathScore + 1) * (game.dungeon[i].pathScore + 1)));
				}
			}
		}
		/* Create a list of valid rooms to generate */
		if(game.dungeon[game.inRoom].colorScheme !== null) {
			var possibleRooms = game.rooms.clone().filter(function(room) {
				return (room.colorScheme === "all" || room.colorScheme === null || room.colorScheme.split("|").includes(game.dungeon[game.theRoom].colorScheme));
			});
		}
		else {
			var possibleRooms = game.rooms.clone();
		}
		possibleRooms = possibleRooms.filter(function(room) {
			for(var j = 0; j < entranceDoor.dest.length; j ++) {
				if(room.name.startsWith(entranceDoor.dest[j])) {
					return true;
				}
			}
			return false;
		});
		possibleRooms = possibleRooms.filter(function(room) {
			return (room.name !== game.dungeon[game.theRoom].type);
		});
		/* Add selected room */
		var roomIndex = possibleRooms.randomIndex();
		possibleRooms[roomIndex].add();
		game.dungeon[game.dungeon.length - 1].id = "?";
		/* Reset transition variables */
		var previousRoom = game.inRoom;
		game.inRoom = game.numRooms;
		p.enteringDoor = false;
		p.exitingDoor = true;
		p.op = 1;
		p.op = 95;
		entranceDoor.dest = game.numRooms;
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
					if(game.dungeon[i].content[j] instanceof Door && (!!game.dungeon[i].content[j].noEntry) === (!!entranceDoor.invertEntries) && game.dungeon[i].content[j].noEntry !== "no entries") {
						doorIndexes.push(j);
					}
				}
				if(doorIndexes.length === 0) {
					doorIndexes = game.dungeon[i].content[j].getInstancesOf(Door);
				}
				var theIndex = doorIndexes.randomItem();
				/* update door graphic types inside room */
				if(game.dungeon[i].content[theIndex].type === "toggle") {
					for(var j = 0; j < game.dungeon[i].content.length; j ++) {
						if(game.dungeon[i].content[j] instanceof Door && j !== theIndex) {
							game.dungeon[i].content[j].type = (game.dungeon[i].content[j].type === "same") ? "toggle" : "same";
						}
					}
				}
				game.dungeon[i].content[theIndex].type = p.doorType;
				/* Assign new door to lead to this room */
				game.dungeon[i].content[theIndex].dest = previousRoom;
				/* Assign this door to lead to new door */
				entranceDoor.dest = game.inRoom;
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
					game.dungeon[i].colorScheme = ["red", "green", "blue"].randomItem();
				}
				if(game.dungeon[previousRoom].colorScheme !== null && hasDecorations) {
					game.dungeon[i].colorScheme = game.dungeon[previousRoom].colorScheme;
				}
			}
		}
	},
	calculatePaths: function() {
		/*
		This function goes through and, for each room, it sets that rooms `pathScore` property to be equal to the minimum number of doors you would need to travel through to get from that room to the currently occupied room. (Basically just the distance between that room and the currently occupied room). Currently occupied room's `pathScore` will be equal to 0.
		*/
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
				var room = game.dungeon[i];
				if(i === game.inRoom) {
					room.pathScore = 0;
				}
				for(var j = 0; j < room.content.length; j ++) {
					var door = room.content[j];
					if(door instanceof Door && typeof door.dest !== "object" && room.pathScore === null) {
						var destinationRoom = game.dungeon[door.dest];
						if(destinationRoom.pathScore !== null) {
							room.pathScore = destinationRoom.pathScore + 1;
						}
					}
				}
			}
		}
	},

	tutorial: {
		exist: function() {
			p.damOp -= 0.05;
			game.inRoom = 0;
			game.theRoom = 0;
			p.update();
			game.dungeon[0].renderingObjects = [];
			game.dungeon[0].exist(0);
			game.dungeon[0].display();

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

			if(p.x > 350 && game.tutorial.infoText === "arrow keys to move, up to jump") {
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
					game.transitions.color = "rgb(0, 0, 0)";
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

			game.dungeon[game.inRoom].displayShadowEffect();
			p.x += game.camera.getOffsetX();
			p.y += game.camera.getOffsetY();
			p.display();
			p.x -= game.camera.getOffsetX();
			p.y -= game.camera.getOffsetY();
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
		color: "rgb(0, 0, 0)",
		nextScreen: null,

		isTransitioning: function() {
			return (this.opacity !== 0 || this.dir !== null);
		},
		onScreenChange: function() {

		},

		display: function() {
			c.save(); {
				c.globalAlpha = Math.constrain(this.opacity, 0, 1);
				c.fillCanvas(this.color);
			} c.restore();
		},
		update: function() {
			if(this.dir === "fade-out") {
				this.opacity += 0.05;
				if(this.opacity >= 1) {
					this.dir = "fade-in";
					if(this.nextScreen !== null) {
						game.onScreen = this.nextScreen;
					}
					if(typeof this.onScreenChange === "function") {
						this.onScreenChange();
					}
					this.onScreenChange = null;
				}
			}
			else if(this.dir === "fade-in") {
				this.opacity -= 0.05;
				if(this.opacity <= 0) {
					this.dir = null;
					if(p.enteringDoor) {
						p.enteringDoor = false;
						p.exitingDoor = true;
					}
				}
			}
			this.opacity = Math.constrain(this.opacity, 0, 1);
		}
	},

	camera: {
		x: 0,
		y: 0,
		getOffsetX: function() {
			return (-this.x + (canvas.width / 2));
		},
		getOffsetY: function() {
			return (-this.y + (canvas.height / 2));
		}
	}
};
var ui = {
	buttons: {
		ArchedDoorButton: function(x, y, w, h, text, onclick, settings) {
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
		}
		.method("display", function() {
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
		})
		.method("update", function() {
			if(
				utils.mouseInCircle(this.x, this.y, this.w / 2) ||
				utils.mouseInRect(this.x - (this.w / 2), this.y, this.w, this.h)
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
		}),
		RisingPlatformButton: function(x, y, w, h, player, settings) {
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
		}
		.method("update", function() {
			if(this.mouseOverFunction()) {
				if(this.offsetY > this.maxHoverY) {
					this.offsetY -= 5;
				}
				if(io.mouse.pressed) {
					var self = this;
					game.transitions.onScreenChange = function() {
						p.class = self.player;
						p.reset();
					};
					game.transitions.dir = "fade-out";
					game.transitions.color = "rgb(0, 0, 0)";
					game.transitions.nextScreen = "play";
				}
			}
			else if(this.offsetY < 0) {
				this.offsetY += 5;
			}
		})
		.method("display", function() {
			this.displayPlatform();
			this.displayStickFigure();
		})
		.method("displayPlatform", function() {
			new Block(this.x - (this.w / 2), this.y + this.offsetY, this.w, this.h).display();
		})
		.method("displayStickFigure", function() {
			var stickFigure = new Player();
			stickFigure.x = this.x;
			stickFigure.y = this.y + this.offsetY - stickFigure.hitbox.bottom;
			if(this.player === "warrior") {
				game.dungeon[game.theRoom].render(new RenderingOrderObject(
					function() {
						stickFigure.display(true);
						c.translate(this.x + 15, this.y + this.offsetY - 30);
						c.scale(1, 0.65);
						c.rotate(Math.rad(180));
						new Sword().display("attacking");
					},
					1
				));
			}
			else if(this.player === "archer") {
				game.dungeon[game.theRoom].render(new RenderingOrderObject(
					function() {
						stickFigure.aiming = true;
						stickFigure.attackingWith = new WoodBow();
						stickFigure.aimRot = 45;
						stickFigure.display();
					},
					1
				));
			}
			else if(this.player === "mage") {
				game.dungeon[game.theRoom].render(new RenderingOrderObject(
					function() {
						stickFigure.aiming = true;
						stickFigure.attackingWith = new EnergyStaff();
						stickFigure.facing = "left";
						stickFigure.display();
					},
					1
				));
			}
		}),
		TextButton: function(x, y, w, h, text, onclick, settings) {
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
		}
		.method("display", function() {
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
		})
		.method("update", function() {
			if(utils.mouseInRect(this.x - (this.w / 2), this.y - (this.h / 2), this.w, this.h)) {
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
		})
	},

	homeScreen: {
		display: function() {
			graphics3D.boxFronts = [];
			game.camera.x = 0;
			game.camera.y = 0;
			game.inRoom = 0;
			game.dungeon = [new Room(null, [])];
			new Block(-100, 600, 1000, 200).display();
			game.dungeon[0].display();
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

		initializedButtons: utils.initializer.request(function() {
			ui.homeScreen.howButton = new ui.buttons.ArchedDoorButton(
				125, 440, 170, 140,
				"H o w",
				function() {
					game.transitions.onScreenChange = function() {
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
						p.addItem(new Sword());
						p.invSlots[3].content = new EnergyStaff();
						p.invSlots[17].content = new Arrow(Infinity);
					};
					game.transitions.dir = "fade-out";
					game.transitions.color = "rgb(0, 0, 0)";
					game.transitions.nextScreen = "how";
				},
				{
					textY: 490,
					maxUnderlineWidth: 50
				}
			);
			ui.homeScreen.playButton = new ui.buttons.ArchedDoorButton(
				400, 380, 160, 200,
				"P l a y",
				function() {
					game.inRoom = 0;
					game.theRoom = 0;
					game.transitions.dir = "fade-out";
					game.transitions.color = "rgb(0, 0, 0)";
					game.transitions.nextScreen = "class-select";
				},
				{
					textY: 450,
					maxUnderlineWidth: 50
				}
			);
			ui.homeScreen.scoresButton = new ui.buttons.ArchedDoorButton(
				670, 440, 170, 140,
				"S c o r e s",
				function() {
					game.transitions.dir = "fade-out";
					game.transitions.color = "rgb(0, 0, 0)";
					game.transitions.nextScreen = "scores";
				},
				{
					textY: 490,
					maxUnderlineWidth: 40
				}
			);
			ui.homeScreen.initializedButtons = true;
		})
	},
	classSelectScreen: {
		display: function() {
			io.keys = [];
			graphics3D.boxFronts = [];
			game.inRoom = 0;
			game.dungeon = [new Room(null, [])];
			game.dungeon[game.inRoom].renderingObjects = [];
			new Block(-100, 600, 1000, 200).display();
			/* buttons */
			this.warriorButton.displayPlatform();
			this.archerButton.displayPlatform();
			this.mageButton.displayPlatform();
			this.warriorButton.displayStickFigure();
			this.archerButton.displayStickFigure();
			this.mageButton.displayStickFigure();
			game.dungeon[game.inRoom].display();


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

		initializedButtons: utils.initializer.request(function() {
			ui.classSelectScreen.warriorButton = new ui.buttons.RisingPlatformButton(
				175, 550, 150, 100000, "warrior",
				{
					mouseOverFunction: function() { return io.mouse.x < 300; },
					maxHoverY: -50
				}
			);
			ui.classSelectScreen.archerButton = new ui.buttons.RisingPlatformButton(
				400, 550, 150, 100000, "archer",
				{
					mouseOverFunction: function() { return io.mouse.x > 300 && io.mouse.x < 500; },
					maxHoverY: -50
				}
			);
			ui.classSelectScreen.mageButton = new ui.buttons.RisingPlatformButton(
				625, 550, 150, 100000, "mage",
				{
					mouseOverFunction: function() { return io.mouse.x > 500; },
					maxHoverY: -50
				}
			);
			ui.classSelectScreen.initializedButtons = true;
		})
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
			game.camera.x = 0;
			game.camera.y = 0;
			game.dungeon = [new Room()];
			game.theRoom = 0;
			game.inRoom = 0;
			new Block(-100, 700, 1000, 200).display();
			game.dungeon[0].display();

			this.homeButton.display();
			this.retryButton.display();
		},
		update: function() {
			this.homeButton.update();
			this.retryButton.update();
		},

		initializedButtons: utils.initializer.request(function() {
			ui.deathScreen.homeButton = new ui.buttons.ArchedDoorButton(
				175, 570, 150, 100, "H o m e",
				function() {
					game.transitions.dir = "fade-out";
					game.transitions.color = "rgb(0, 0, 0)";
					game.transitions.nextScreen = "home";
				},
				{
					textY: 617.5,
					maxUnderlineWidth: 50
				}
			);
			ui.deathScreen.retryButton = new ui.buttons.ArchedDoorButton(
				625, 570, 150, 100, "R e t r y",
				function() {
					game.transitions.dir = "fade-out";
					game.transitions.color = "rgb(0, 0, 0)";
					game.transitions.nextScreen = "class-select";
				},
				{
					textY: 617.5,
					maxUnderlineWidth: 50
				}
			);
			ui.deathScreen.initializedButtons = true;
		})
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

		initializedButtons: utils.initializer.request(function() {
			ui.highscoresScreen.homeButton = new ui.buttons.TextButton(
				70, 60, 80, 40,
				"H o m e",
				function() {
					game.transitions.dir = "fade-out";
					game.transitions.color = "rgb(0, 0, 0)";
					game.transitions.nextScreen = "home";
				},
				{
					textY: 60,
					maxUnderlineWidth: 40
				}
			);
		})
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

			var pressingUpButton = utils.mouseInRect(770, 800 - this.y - this.upButton.y, 20, 20) && this.destY < 40;
			c.fillStyle = pressingUpButton ? "rgb(59, 67, 70)" : "rgb(200, 200, 200)";
			c.strokeStyle = "rgb(59, 67, 70)";
			c.fillRect(770, 800 - this.y - this.upButton.y, 20, 20);
			c.strokeRect(770, 800 - this.y - this.upButton.y, 20, 20);
			displayButtonIcon(770, 800 - this.y - this.upButton.y, "arrow-up", null, pressingUpButton);

			var pressingDownButton = utils.mouseInRect(740, 800 - this.y - this.downButton.y, 20, 20) && this.destY > 0;
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
						c.fillArc(0, 0, 5, Math.rad(180), Math.rad(270), true);

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
						var loc = graphics3D.point3D(game.dungeon[game.inRoom].content[i].x, game.dungeon[game.inRoom].content[i].y, 0.9);
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

utils.initializer.initializeEverything();

var p = new Player();
p.loadScores();

if(TESTING_MODE) {
	debugging.activateDebuggingSettings();
}

/** FRAMES **/
function timer() {
	if(TESTING_MODE) {
		p.health = p.maxHealth;
		p.mana = p.maxMana;
	}
	c.globalAlpha = 1;
	io.cursor = "auto";
	utils.frameCount ++;
	utils.resizeCanvas();
	c.fillStyle = "rgb(100, 100, 100)";
	c.fillCanvas();

	if(game.onScreen === "play") {
		game.dungeon[game.theRoom].renderingObjects = [];
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
		if(p.y + p.hitbox.bottom > 900 && !game.transitions.isTransitioning()) {
			game.transitions.dir = "fade-out";
			game.transitions.color = "rgb(0, 0, 0)";
			game.transitions.onScreenChange = function() {
				p.roomsExplored ++;
				game.inRoom = game.numRooms;
				game.camera.x = 0;
				game.camera.y = 0;
				p.x = 500;
				p.y = -100;
				p.velocity.y = 2;
				p.fallDmg = Math.round(Math.randomInRange(40, 50));
				game.dungeon.push(
					new Room(
						"ambient1",
						[
							new Pillar(200, 500, Math.randomInRange(200, 300)),
							new Pillar(400, 500, Math.randomInRange(200, 300)),
							new Pillar(600, 500, Math.randomInRange(200, 300)),
							new Pillar(800, 500, Math.randomInRange(200, 300)),
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
			};
		}

		game.dungeon[game.inRoom].display();
		game.dungeon[game.inRoom].displayShadowEffect();

		var locationBeforeOffset = { x: p.x, y: p.y };
		p.x += game.camera.getOffsetX();
		p.y += game.camera.getOffsetY();
		p.display();
		p.x = locationBeforeOffset.x;
		p.y = locationBeforeOffset.y;
		debugging.displayHitboxes();

		p.gui();
		ui.infoBar.calculateActions();
		ui.infoBar.display();
		ui.infoBar.resetActions();
	}
	else if(game.onScreen === "home") {
		ui.homeScreen.update();
		ui.homeScreen.display();
	}
	else if(game.onScreen === "class-select") {
		ui.classSelectScreen.update();
		ui.classSelectScreen.display();
	}
	else if(game.onScreen === "dead") {
		ui.deathScreen.update();
		ui.deathScreen.display();
	}
	else if(game.onScreen === "how") {
		game.tutorial.exist();
	}
	else if(game.onScreen === "scores") {
		ui.highscoresScreen.update();
		ui.highscoresScreen.display();
	}

	game.transitions.update();
	game.transitions.display();

	if(game.onScreen !== "play" && game.onScreen !== "how") {
		(new Room()).displayShadowEffect();
	}

	if(TESTING_MODE) {
		debugging.displayFPS();
		if(utils.frameCount % 10 === 0) {
			debugging.calculateFPS();
		}
	}
	utils.pastInputs.update();
	document.body.style.cursor = io.cursor;
	window.setTimeout(timer, 1000 / FPS);
};
window.setTimeout(timer, 1000 / FPS);
