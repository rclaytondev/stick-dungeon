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
testing.addTest({
	run: function() {
		var str = "the fat cat sat";
		testing.assert(str.splitAtIndices(3).equals(["the", "fat cat sat"]));
		testing.assert(str.splitAtIndices(3, 7).equals(["the", "fat", "cat sat"]));
		testing.assert(str.splitAtIndices(3, 7, 11).equals(["the", "fat", "cat", "sat"]));
	},
	unit: "String.splitAtIndices()",
	name: "basic functionality"
});
testing.addTest({
	run: function() {
		var str = "the fat cat sat";
		testing.assert(str.splitAtIndices(0).equals(["he fat cat sat"]));
		testing.assert(str.splitAtIndices(-10).equals(["the fat cat sat"]));
		testing.assert(str.splitAtIndices(10000).equals(["the fat cat sat"]));
		testing.assert(str.splitAtIndices().equals(["the fat cat sat"]));
	},
	unit: "String.splitAtIndices()",
	name: "edge cases"
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
testing.addTest({
	run: function() {
		var foo = Function.overload({
			"number, string": function(num, str) { return "one"; },
			"string, number": function(str, num) { return "two"; },
			"boolean, boolean": function(bool, bool) { return "three"; },
			"object, object": function(obj1, obj2) { return "four"; }
		});
		testing.assert(foo(3.14, "zipow") === "one");
		testing.assert(foo("blargh", 579) === "two");
		testing.assert(foo(true, false) === "three");
		testing.assert(foo({}, {}) === "four");
		testing.assertThrows(function() { foo(123, 456); });
	},
	unit: "Function.overload()",
	name: "basic functionality"
});
testing.addTest({
	run: function() {
		var foo = Function.overload({
			"int, int": function(int, int) { return "one"; },
			"number, number": function(num, num) { return "two"; }
		});
		testing.assert(foo(12, 34) === "one");
		testing.assert(foo(1.2, 3.4) === "two");
	},
	unit: "Function.overload()",
	name: "custom 'int' type"
});
testing.addTest({
	run: function() {
		var foo = Function.overload({
			"Bar, Bar": function() { return "one"; },
			"Qux, Qux": function() { return "two"; }
		});
		function Bar() {};
		function Qux() {};
		testing.assert(foo(new Bar(), new Bar()) === "one");
		testing.assert(foo(new Qux(), new Qux()) === "two");
	},
	unit: "Function.overload()",
	name: "instance type checking"
});
testing.addTest({
	run: function() {
		var foo = Function.overload({
			"number...": function(numbers) { return "numbers"; },
			"string...": function(strings) { return "strings"; },
		});
		testing.assert(foo(1) === "numbers");
		testing.assert(foo(1, 2) === "numbers");
		testing.assert(foo(1, 2, 3, 4, 5, 6, 7) === "numbers");
		testing.assert(foo("a") === "strings");
		testing.assert(foo("a", "b") === "strings");
		testing.assert(foo("a", "b", "c", "d", "e", "f") === "strings");
	},
	unit: "Function.overload()",
	name: "repeating arguments"
});
testing.addTest({
	run: function() {
		function Thing() {};
		var foo = Function.overload({
			"*": function() { return "wildcard"; }
		});
		testing.assert(foo(123) === "wildcard");
		testing.assert(foo({}) === "wildcard");
		testing.assert(foo(new Thing()) === "wildcard");
		testing.assertThrows(function() { foo(1, 2, 3); });
	},
	unit: "Function.overload()",
	name: "wildcard arguments"
});
testing.addTest({
	run: function() {
		var foo = Function.overload({
			"object { a, b, c }": function() { return "one"; },
			"object { d, e, f }": function() { return "two"; }
		});
		testing.assert(foo({ a: 1, b: 2, c: 3 }) === "one");
		testing.assert(foo({ d: 4, e: 5, f: 6 }) === "two");
		testing.assertThrows(function() { foo({ a: 1 }) });
		testing.assertThrows(function() { foo({ x: 10, y: 11, z: 12 }) });
	},
	unit: "Function.overload()",
	name: "property requirements"
});
testing.addTest({
	run: function() {
		var foo = Function.overload({
			"Bar, Qux {something}, number...": function() { return "one"; },
			"Bar {something}, *...": function() { return "two"; }
		});

		function Bar() {};
		Bar.method("setProp", function() {
			this.something = true;
			return this;
		});
		function Qux() {};
		Qux.method("setProp", function() {
			this.something = false;
			return this;
		});

		testing.assert(foo(new Bar(), new Qux().setProp(), 1, 2, 3) === "one");
		testing.assert(foo(new Bar(), new Qux().setProp(), 1, 2, 3, 4, 5, 6, 7, 8, 9, 10) === "one");
		testing.assert(foo(new Bar().setProp(), "abc", "def", "ghi") === "two");
		testing.assertThrows(function() { foo(new Bar(), new Qux(), 1, 2, 3); });
	},
	unit: "Function.overload()",
	name: "all features combined"
});
Function.method("extend", function(superclass) {
	/* copy prototype to inherit methods */
	this.prototype = Object.create(superclass.prototype);
	this.prototype.constructor = this;
	return this;
});
Function.method("extends", function(superclass) {
	/* return whether or not this function is a subclass of the other */
	var prototype = this.prototype;
	while(prototype != null) {
		if(prototype.constructor.name === superclass.name) {
			return true;
		}
		prototype = prototype.__proto__;
	}
	return false;
});
Function.method("insertCodeBefore", function(codeToRunBefore) {
	/*
	Returns a new function that will first run `codeToRunBefore` and then do whatever this function used to do.
	This is the equivalent of inserting the code in `codeToRunBefore` before the first lines of this function.
	*/
	var code = this;
	return function() {
		codeToRunBefore.apply(this, arguments);
		code.apply(this, arguments);
	};
});
HTMLElement.method("forEachDescendant", function(func) {
	for(var i = 0; i < this.childNodes.length; i ++) {
		var child = this.childNodes[i];
		func(child);
		if(child instanceof HTMLElement) {
			child.forEachDescendant(func);
		}
	}
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
testing.addTest({
	run: function() {
		testing.assertEqual(Math.dist(3, 10), 7);
		testing.assertEqual(Math.dist(-5, 10), 15);
	},
	unit: "Math.dist()",
	name: "1D distance"
});
testing.addTest({
	run: function() {
		testing.assertEqual(Math.dist(0, 0, 3, 4), 5);
		testing.assertEqual(Math.dist(0, 0, 5, 12), 13);
		testing.assertEqual(Math.dist(0, 0, 5, 5), Math.sqrt(50));
		testing.assertEqual(Math.dist(-5, 5, -7, 7), Math.sqrt(8));
	},
	unit: "Math.dist()",
	name: "2D distance"
});
Math.distSq = function(x1, y1, x2, y2) {
	/*
	Returns the distance between ('x1', 'y1') and ('x2', 'y2') squared for better performance
	*/
	return (x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2);
};
testing.addTest({
	run: function() {
		testing.assertEqual(Math.distSq(0, 0, 5, 5), 50);
		testing.assertEqual(Math.distSq(5, 5, 7, 7), 8);
	},
	unit: "Math.distSq()",
	name: "all functionality"
})
Math.constrain = function(num, min, max) {
	num = Math.min(num, max);
	num = Math.max(num, min);
	return num;
};
testing.addTest({
	run: function() {
		testing.assertEqual(Math.constrain(-100, -5, 5), -5);
		testing.assertEqual(Math.constrain(2, -5, 5), 2);
		testing.assertEqual(Math.constrain(100, -5, 5), 5);
	},
	unit: "Math.constrain()",
	name: "all functionality"
})
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
testing.addTest({
	run: function() {
		testing.assertEqual(Math.modulateIntoRange(375, 0, 100), 75);
		testing.assertEqual(Math.modulateIntoRange(-610, 0, 100), 90);
	},
	unit: "Math.modulateIntoRange()",
	name: "all functionality"
});
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
testing.addTest({
	run: function() {
		for(var i = 0; i < 10; i ++) {
			var x = Math.randomInRange(-100, 100);
			var y = Math.randomInRange(-100, 100);
			var normalized = Math.normalize(x, y);
			testing.assertEqualApprox(Math.dist(0, 0, normalized.x, normalized.y), 1);
			testing.assertEqualApprox(x / y, normalized.x / normalized.y);
		}
	},
	unit: "Math.normalize()",
	name: "all functionality"
});
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
testing.addTest({
	run: function() {
		testing.assertEqual(Math.map(5, 0, 10, 0, 100), 50);
		testing.assertEqual(Math.map(-5, 0, 10, 0, 100), -50);
		testing.assertEqual(Math.map(Math.PI, 0, Math.TWO_PI, 0, 360), 180);
		testing.assertEqual(Math.map(500, 32, 212, 0, 100), 260);
	},
	unit: "Math.map()",
	name: "all functionality"
})
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
testing.addTest({
	run: function() {
		var rotated = Math.rotate(5, 0, -90);
		testing.assertEqualApprox(rotated.x, 0);
		testing.assertEqualApprox(rotated.y, -5);

		rotated = Math.rotate(10, 10, 90);
		testing.assertEqualApprox(rotated.x, -10);
		testing.assertEqualApprox(rotated.y, 10);

		rotated = Math.rotate(0, 1, 45);
		testing.assertEqualApprox(rotated.x, -1 / Math.sqrt(2));
		testing.assertEqualApprox(rotated.y, 1 / Math.sqrt(2));
	},
	unit: "Math.rotate()",
	name: "rotation about origin"
});
testing.addTest({
	run: function() {
		var rotated = Math.rotate(0, 0, 180, 0, -10);
		testing.assertEqualApprox(rotated.x, 0);
		testing.assertEqualApprox(rotated.y, -20);

		var rotated = Math.rotate(1, 1, 90, 2, 2);
		testing.assertEqualApprox(rotated.x, 3);
		testing.assertEqualApprox(rotated.y, 1);
	},
	unit: "Math.rotate()",
	name: "rotation about arbitrary points"
});
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
testing.addTest({
	run: function() {
		testing.assert(Math.scale(1, 2, 10).equals({ x: 10, y: 20 }));
		testing.assert(Math.scale(-5, -7, 100, 1000).equals({ x: -500, y: -7000 }));
		testing.assert(Math.scale(3, 9, 2).equals({ x: 6, y: 18 }));
	},
	unit: "Math.scale()",
	name: "all functionality"
})
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
testing.addTest({
	run: function() {
		testing.assert(Math.scaleAboutPoint(5, 5, 10, 10, 2).equals({ x: 0, y: 0 }));
		testing.assert(Math.scaleAboutPoint(0, 5, 20, 20, 0.5, 1).equals({ x: 10, y: 5 }));
	},
	unit: "Math.scaleAboutPoint()",
	name: "all functionality"
});
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
testing.addTest({
	run: function() {
		var points = Math.findPointsCircular(0, 0, 100);
		points.forEach(point => {
			var distance = Math.dist(point.x, point.y, 0, 0);
			testing.assert(Math.dist(distance, 100) <= 1);
		});
		var rightPoint = points[Math.round(points.length * 1/4)];
		testing.assert(Math.dist(Math.atan2(rightPoint.y, rightPoint.x), Math.rad(0)) <= 1);
		var bottomPoint = points[Math.round(points.length * 2/4)];
		testing.assert(Math.dist(Math.atan2(bottomPoint.y, bottomPoint.x), Math.rad(90)) <= 1);
		var leftPoint = points[Math.round(points.length * 3/4)];
		testing.assert(Math.dist(Math.atan2(leftPoint.y, leftPoint.x), Math.rad(180)) <= 1);
		var topPoint = points[0];
		testing.assert(Math.dist(Math.atan2(topPoint.y, topPoint.x), Math.rad(-90)) <= 1);
	},
	unit: "Math.findPointsCircular()",
	name: "basic functionality"
});
testing.addTest({
	run: function() {
		var points = Math.findPointsCircular(0, 0, 100, [4, 1]);
		points.forEach(point => {
			var distance = Math.dist(point.x, point.y, 0, 0);
			testing.assert(Math.dist(distance, 100) <= 1);
		});
		var leftPoint = points[0];
		testing.assert(Math.dist(Math.atan2(leftPoint.y, leftPoint.x), Math.rad(180)) <= 1);
		var topPoint = points[Math.round(points.length / 2)];
		testing.assert(Math.dist(Math.atan2(topPoint.y, topPoint.x), Math.rad(-90)) <= 1);
		var rightPoint = points[points.length - 1];
		testing.assert(Math.dist(Math.atan2(rightPoint.y, rightPoint.x), Math.rad(0)) <= 1);
	},
	unit: "Math.findPointsCircular()",
	name: "limited to certain quadrants"
});
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
testing.addTest({
	run: function() {
		var points = Math.findPointsLinear(-5, 5, 10, -10); // bottom-left --> top-right
		var previousPoint = null;
		for(var i = 0; i < points.length; i ++) {
			var point = points[i];
			if(previousPoint !== null) {
				testing.assert(point.x <= previousPoint.x);
				testing.assert(point.y >= previousPoint.y);
			}
			previousPoint = point;
		}
	},
	unit: "Math.findPointsLinear()",
	name: "basic functionality"
});
testing.addTest({
	run: function() {
		/*
		This test is here because vertical lines have a slope of undefined, so findPointsLinear() has a workaround to avoid them.
		*/
		var points = Math.findPointsLinear(0, -10, 0, 10);
		var previousPoint = null;
		for(var i = 0; i < points.length; i ++) {
			var point = points[i];
			testing.assert(point.x === 0);
			if(previousPoint !== null) {
				testing.assert(point.y > previousPoint.y);
			}
			previousPoint = point;
		}
		testing.assert(Math.dist(points.length, 20) <= 1);
	},
	unit: "Math.findPointsLinear()",
	name: "vertical lines"
});
Math.calculateDegrees = function(x, y) {
	/*
	Returns the corrected arctangent of ('x', 'y').
	*/
	return Math.deg(Math.atan2(y, x));
};
testing.addTest({
	run: function() {
		testing.assertEqual(Math.calculateDegrees(100, 0), 0);
		testing.assertEqual(Math.calculateDegrees(100, -100), -45);
		testing.assertEqual(Math.calculateDegrees(-100, -100), -(90 + 45));
	},
	unit: "Math.calculateDegrees()",
	name: "all functionality"
});
Math.randomInRange = function(min, max) {
	return Math.random() * (max - min) + min;
};
Array.method("min", function(func, thisArg) {
	/*
	Returns the lowest item, or the item for which func() returns the lowest value.
	*/
	thisArg = thisArg || this;
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
testing.addTest({
	run: function() {
		testing.assertEqual([1, 2.3, 10, 4, 8].min(), 1);
		testing.assertEqual([1.23, 2, -10, 4, -8].min(), -10);
	},
	unit: "Array.min()",
	name: "basic functionality"
});
testing.addTest({
	run: function() {
		var testArray = [
			{ x: 4 },
			{ x: 2 },
			{ x: 300 },
			{ x: -17 },
			{ x: -5 }
		];
		testing.assert(testArray.min((obj) => obj.x).equals({ x: -17 }));
		testing.assert(testArray.min((obj, index) => index).equals({ x: 4 }));
		testing.assert(testArray.min((obj, index, array) => array[index].x).equals({ x: -17 }));
	},
	unit: "Array.min()",
	name: "callback functions"
});
Array.method("max", function(func, thisArg) {
	thisArg = thisArg || this;
	/*
	Returns the highest item, or the item for which func() returns the highest value.
	*/
	if(typeof func === "function") {
		var highestIndex = 0;
		var highestValue = -Infinity;
		for(var i = 0; i < this.length; i ++) {
			var value = func.call(thisArg, this[i], i, this);
			if(value > highestValue) {
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
			if(this[i] > highestValue) {
				highestIndex = i;
				highestValue = this[i];
			}
		}
		return this[highestIndex];
	}
});
testing.addTest({
	run: function() {
		testing.assertEqual([1, 2.3, 10, 4, 8].max(), 10);
		testing.assertEqual([1.23, 2, -10, 4, -8].max(), 4);
	},
	unit: "Array.max()",
	name: "basic functionality"
});
testing.addTest({
	run: function() {
		var testArray = [
			{ x: 4 },
			{ x: 2 },
			{ x: 300 },
			{ x: -17 },
			{ x: -5 }
		];
		testing.assert(testArray.max((obj) => obj.x).equals({ x: 300 }));
		testing.assert(testArray.max((obj, index) => index).equals({ x: -5 }));
		testing.assert(testArray.max((obj, index, array) => array[index].x).equals({ x: 300 }));
	},
	unit: "Array.max()",
	name: "callback functions"
})
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
testing.addTest({
	run: function() {
		testing.assertEqual([1, 2, 3, 4].sum(), 1 + 2 + 3 + 4);
		testing.assertEqual([-3, 5].sum(), -3 + 5);
	},
	unit: "Array.sum()",
	name: "basic functionality"
});
testing.addTest({
	run: function() {
		var testArray = [
			{ x: 10 },
			{ x: -10 },
			{ x: 5 },
			{ x: 15 },
		];
		var expectedSum = testArray[0].x + testArray[1].x + testArray[2].x + testArray[3].x;
		var sumOfIndices = 0 + 1 + 2 + 3; // to test passing indices to callback function
		testing.assertEqual(testArray.sum((obj) => obj.x), expectedSum);
		testing.assertEqual(testArray.sum((obj, index) => index), sumOfIndices);
		testing.assertEqual(testArray.sum((obj, index, array) => array[index].x), expectedSum);
	},
	unit: "Array.sum()",
	name: "callback functions"
});
Array.method("containsInstanceOf", function(constructor) {
	for(var i = 0; i < this.length; i ++) {
		if(this[i] instanceof constructor) {
			return true;
		}
	}
	return false;
});
testing.addTest({
	run: function() {
		testing.assert([{}, {}, {}].containsInstanceOf(Object));
		testing.assert([[], [], []].containsInstanceOf(Array));
		function ObjectFoo() {};
		testing.assert([new ObjectFoo(), new ObjectFoo()].containsInstanceOf(ObjectFoo));
	},
	unit: "Array.containsInstanceOf()",
	name: "all functionality"
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
testing.addTest({
	run: function() {
		var testString = "the cat sat on the mat";
		testing.assert(testString.startsWith("the cat"));
		testing.assert(!testString.startsWith("the dog sat"));
	},
	unit: "String.startsWith()",
	name: "all functionality"
});
String.method("replaceWith", function(search, replace) {
	return this.split(search).join(replace);
});
testing.addTest({
	run: function() {
		testing.assert("the cat is a cat".replaceWith("cat", "dog") === "the dog is a dog")
		testing.assert("hello, friends. say hello".replaceWith("hello", "goodbye") === "goodbye, friends. say goodbye");
	},
	unit: "String.replaceWith()",
	name: "all functionality"
})
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
testing.addTest({
	run: function() {
		var foo = { x: 5 };
		var bar = foo.clone();
		testing.assertEqual(foo.x, bar.x);
		testing.assert(foo !== bar); // not references
		testing.assertEqual(foo.__proto__,  bar.__proto__); // prototypes are references

		/* deep clone (multiple nested objects) */
		var foo = { x: { y: { z: 1 }}};
		var bar = foo.clone();
		testing.assertEqual(foo.x.y.z, bar.x.y.z);
		testing.assert(foo.x.y !== bar.x.y); // nested objects are not references (deep clone)
	},
	unit: "Object.clone()",
	name: "all functionality"
});
Object.method("equals", function(obj) {
    for(var i in this) {
        var prop1 = this[i];
        var prop2 = obj[i];
        var type1 = Object.typeof(prop1);
        var type2 = Object.typeof(prop2);
        if(type1 !== type2) {
            return false;
        }
        else if(type1 === "object" || type1 === "array" || type1 === "instance") {
            if(!prop1.equals(prop2)) {
                return false;
            }
        }
        else if(prop1 !== prop2) {
            return false;
        }
    }
    return true;
});
testing.addTest({
	run: function() {
		testing.assert({ x: 1 }.equals({ x: 1 }));
		testing.assert({ x: { y: { z: 1 }}}.equals({ x: { y: { z: 1 }}}));
		testing.assert(!{ x: 1 }.equals({ x: 2 }));
		testing.assert(!{ x: { y: { z: 1 }}}.equals({ x: { y: { z: 2 }}}));
	},
	unit: "Object.equals()",
	name: "all functionality"
})
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
testing.addTest({
	run: function() {
		testing.assertEqual(Object.typeof(NaN), "NaN");
		testing.assertEqual(Object.typeof(null), "null");
		testing.assertEqual(Object.typeof([]), "array");
		function ObjectFoo() {};
		testing.assertEqual(Object.typeof(new ObjectFoo()), "instance");
	},
	unit: "Object.typeof()",
	name: "all functionality"
})
Object.watch = function(object, property) {
	/* this function pauses the debugger when the property is changed. */
	var value = object[property];
	Object.defineProperty(object, property, {
		get: function() { return value; },
		set: function(newValue) { debugger; value = newValue; }
	});
};
