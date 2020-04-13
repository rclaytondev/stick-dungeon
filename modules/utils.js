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
		linearPoints.forEach(point => {
			[point.x, point.y] = [point.y, point.x];
		});
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
Array.method("min", function(func, thisArg) {
	/*
	Returns the lowest item, or the item for which func() returns the lowest value.
	*/
	if(typeof func === "function") {
		var lowestIndex = 0;
		var lowestValue = Infinity;
		for(var i = 0; i < this.length; i ++) {
			var value = func.call(thisArg, this[i], i, this);
			if(value < lowestValue) {
				lowestIndex = i;
				lowestValue = value;
			}
		}
		return this[lowestIndex];
	}
	else {
		var lowestIndex = 0;
		var lowestValue = Infinity;
		for(var i = 0; i < this.length; i ++) {
			if(this[i] < lowestValue) {
				lowestIndex = i;
				lowestValue = this[i];
			}
		}
		return this[lowestIndex];
	}
});
Array.method("max", function(func) {
	/*
	Returns the highest item, or the item for which func() returns the highest value.
	*/
	if(typeof func === "function") {
		var highestIndex = 0;
		var highestValue = -Infinity;
		for(var i = 0; i < this.length; i ++) {
			var value = func.call(thisArg, this[i], i, this);
			if(value < highestValue) {
				highestIndex = i;
				highestValue = value;
			}
		}
		return this[highestIndex];
	}
	else {
		var highestIndex = 0;
		var highestValue = -Infinity;
		for(var i = 0; i < this.length; i ++) {
			if(this[i] < highestValue) {
				highestIndex = i;
				highestValue = this[i];
			}
		}
		return this[highestIndex];
	}
});
Array.method("sum", function(func, thisArg) {
	if(typeof func === "function") {
		var sum = 0;
		this.forEach((item, index, array) => {
			var result = func.call(thisArg, item, index, array);
			if(typeof result === "number" && !isNaN(result)) {
				sum += result;
			}
		});
		return sum;
	}
	else {
		return this.reduce((sum, item) => sum + item);
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
Array.method("onlyItem", function() {
	if(this.length !== 1) {
		throw new Error("Expected the array to have only one item, but instead the length was '" + this.length + "'");
	}
	return this[0];
});
Array.method("randomItem", function() {
	return this[this.randomIndex()];
});
Array.method("randomIndex", function() {
	return Math.floor(Math.random() * this.length);
});
Array.method("removeAll", function(item) {
	return this.filter(currentItem => currentItem !== item);
});
String.method("startsWith", function(substring) {
	return this.substring(0, substring.length) === substring;
});
Object.method("clone", function() {
	if(Array.isArray(this)) {
		var clone = [];
	}
	else {
		var clone = Object.create(this.__proto__);
	}
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
