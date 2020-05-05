function Test(config) {
	this.run = config.run || function() {};
	this.unitTested = config.unitTested || config.unit;
	if(typeof this.unitTested !== "string") {
		if(typeof Test.previousUnitTestAdded === "string") {
			this.unitTested = Test.previousUnitTestAdded;
		}
		else {
			throw new Error("Test must be given a unit or have a previous test to recieve unit name from.");
		}
	}
	else {
		Test.previousUnitTestAdded = this.unitTested;
	}
	this.name = config.name;

	this.result = null; // null, "passed", or "failed"
	this.index = testing.tests.length; // index of test in tests array

	var scripts = document.getElementsByTagName("script");
	this.sourceFilePath = scripts[scripts.length - 1].src;
	this.sourceFile = this.sourceFilePath.substring(this.sourceFilePath.lastIndexOf("/") + 1, this.sourceFilePath.length);
};
Test.prototype.getResult = function() {
	try {
		this.run();
		this.result = "passed";
		return "passed";
	}
	catch(error) {
		this.result = "failed";
		return "failed";
	}
};
Test.prototype.getResultHTML = function() {
	if(this.result !== "passed" && this.result !== "failed") {
		throw new Error("Cannot call getResultHTML() on a test that has not been run yet; must call getResult() first.");
	}
	var listItem = document.createElement("li");
	var resultText = document.createElement("span");
	resultText.classList.add("test-" + this.result); // "test-passed" or "test-failed"
	resultText.innerHTML = "Test " + (this.index + 1) + " of " + testing.tests.length + " " + this.result; // "Test 1 of 2 passed" or "Test 1 of 2 failed"
	listItem.appendChild(resultText);
	var testName = document.createElement("span");
	testName.innerHTML = ": " + this.unitTested + " - " + this.name;
	listItem.appendChild(testName);
	return listItem;
};

var testing = {
	assert: function(value) {
		if(!value) {
			throw new Error("Assertion failed. Expected '" + value + "' to be truthy, but it was not.");
		}
	},
	assertEqual: function(value1, value2) {
		if(value1 !== value2) {
			throw new Error("Assertion failed. Expected '" + value1 + "' to be equal to '" + value2 + "', but it was not.");
		}
	},
	assertEqualApprox: function(value1, value2) {
		if(Object.typeof(value1) !== "number" || Object.typeof(value2) !== "number") {
			throw new Error("arguments to assertEqualApprox() must be numbers. values of '" + value1 + "' or '" + value2 + "' are invalid.");
		}
		const MAXIMUM_DISTANCE = Math.pow(10, -12);
		if(Math.dist(value1, value2) > MAXIMUM_DISTANCE) {
			throw new Error("assertion failed. expected " + value1 + " to be at least approximately equal to " + value2);
		}
	},
	assertThrows: function(callback) {
		var threwError = false;
		try {
			callback();
		}
		catch(e) {
			threwError = true;
		}
		if(!threwError) {
			this.error("Expected " + callback + " to throw an error, but it did not");
		}
	},

	numTests: 0,
	tests: [],
	addTest: function(test) {
		if(test instanceof Test) {
			this.tests.push(test);
		}
		else if(typeof test === "object") {
			this.tests.push(new Test(test));
		}
	},
	testAll: function() {
		this.removeEventHandlers(); {
			this.tests.forEach(test => {
				test.getResult();
			});
		} this.reAddEventHandlers();
		if(this.testsFailed().length !== 0) {
			this.resultFormatter.showResults();
		}
		else {
			console["lo" + "g"]("%cAll tests passed!", "color: rgb(0, 192, 64)"); // strange naming used so that searching for console printing statements doesn't show this
		}
	},
	runTestByID: function(testID) {
		var test = this.tests[testID];
		this.runTest(test);
	},
	runTestByName: function(lookup) {
		var unit, name;
		[unit, name] = lookup.split(":");
		this.tests.forEach((test, index) => {
			if(test.unitTested === unit && (test.name === name || typeof name !== "string")) {
				this.runTest(test);
			}
		});
	},
	runTest: function(test) {
		this.removeEventHandlers(); {
			test.run(); // no try-catch here so that it will throw the error to the console
			var text = "%cTest passed: %c" + test.unitTested + " - " + test.name; // if code reaches this point, test must have succeeded
			console["lo" + "g"](text, "color: rgb(0, 192, 64)", "color: white;"); // strange naming used so that searching for console printing statements doesn't show this
		} this.reAddEventHandlers();
	},

	testsFailed: function() {
		return this.tests.filter(function(test) { return test.result === "failed"; });
	},
	testsPassed: function() {
		return this.tests.filter(function(test) { return test.result === "passed"; });
	},

	eventHandlers: {},
	removeEventHandlers: function() {
		/*
		This function is used so that the game won't be trying to detect user input while tests are running.
		*/
		if(Object.keys(this.eventHandlers).length === 0) {
			["onkeydown", "onkeyup", "onmousedown", "onmouseup", "onmousemove"].forEach(handlerName => {
				this.eventHandlers[handlerName] = document.body[handlerName];
				document.body.handlerName = null;
			});
		}
	},
	reAddEventHandlers: function() {
		["onkeydown", "onkeyup", "onmousedown", "onmouseup", "onmousemove"].forEach(handlerName => {
			if(typeof this.eventHandlers[handlerName] === "function") {
				document.body[handlerName] = this.eventHandlers[handlerName];
			}
			delete this.eventHandlers[handlerName];
		});
	},

	runFrames: function(numFrames) {
		for(var i = 0; i < numFrames; i ++) {
			timer();
		}
	},

	resetter: {
		saveGameState: function() {
			var variablesToSave = ["game", "p", "collisions", "io", "ui", "debugging"];
			variablesToSave.forEach(varName => {
				this.initialGameState[varName] = window[varName].clone();
			});

			this.initialGameState.p.clearInventory();
			this.initialGameState.p.x = 0;
			this.initialGameState.p.y = -p.hitbox.bottom;
			this.initialGameState.game.onScreen = "play";
		},
		resetGameState: function() {
			for(var i in this.initialGameState) {
				if(this.initialGameState.hasOwnProperty(i)) {
					window[i] = this.initialGameState[i].clone();
				}
			}
		},
		initialGameState: {}
	},
	utils: {
		emptyRoom: function(width, height) {
			if(arguments[0] === "floor-only") {
				return new Room(
					"testing",
					[
						new Border("floor", { y: 0 })
					]
				);
			}
			width = width || 800;
			height = height || 800;
			var room = new Room(
				"testing",
				[
					new Border("floor", { y: 0 }),
					new Border("ceiling", { y: -height }),
					new Border("wall-to-left", { x: -(width / 2) }),
					new Border("wall-to-right", { x: width / 2 })
				]
			);
			return room;
		},
		addRoomFromDoor: function(roomID, entranceDoor) {
			testing.resetter.initialGameState.game.rooms[roomID].add();
			var addedRoom = game.dungeon.lastItem();
			entranceDoor.dest = addedRoom.index;
			var exitDoor = addedRoom.getInstancesOf(Door).randomItem();
			exitDoor.dest = entranceDoor.containingRoomID;
		},
		exit: function() {
			/*
			This is a function that restores control to the user for manual testing.
			*/
			testing.reAddEventHandlers();
			window.setInterval(timer, 1000 / FPS);
		}
	},

	resultFormatter: {
		htmlOpener: {
			open: function(html) {
				/*
				This function puts the code into a onmousemove handler, then immediately calls the handler and deletes it to avoid browser security features that disallow window.open() unless it's in a user input handler.
				*/
				var previousInputHandler = document.body.onmousemove;
				document.body.onmousemove = function() {
					var tab = window.open("");
					tab.document.head = html.head;
					tab.document.body = html.body;

					document.body.onmousemove = previousInputHandler;
				};
				document.body.onmousemove();
			},

			createDefaultHTML: function() {
				var html = document.createElement("html");
				var head = document.createElement("head");
				var body = document.createElement("body");
				html.appendChild(head);
				html.appendChild(body);
				html.head = head;
				html.body = body;
				return html;
			}
		},

		getIndividualTestCode: function(test) {
			/*
			Returns JS code as a string that could be used to run the test individually.
			*/
		},

		generateTestResultHTML: function() {
			/* generate content */
			var html = this.htmlOpener.createDefaultHTML();
			var head = html.childNodes[0];
			var body = html.childNodes[1];
			var summaryTitle = document.createElement("h1");
			summaryTitle.innerHTML = "Test Results Summary";
			body.appendChild(summaryTitle);

			var title = document.createElement("title");
			title.innerHTML = "Unit Test Results";
			head.appendChild(title);

			var summaryText = document.createElement("p");
			if(testing.testsFailed().length === 0) {
				summaryText.classList.add("test-passed");
				summaryText.innerHTML = "All tests passed!";
				body.appendChild(summaryText);
			}
			else {
				var percentage = Math.round(testing.testsPassed().length / testing.tests.length * 100);
				summaryText.innerHTML = testing.testsPassed().length + " out of " + testing.tests.length + " tests passed. [" + percentage + "%]. Tests failed: ";
				body.appendChild(summaryText);
				testing.testsFailed().forEach(test => {
					body.appendChild(test.getResultHTML());
				});
			}

			var detailTitle = document.createElement("h1");
			detailTitle.innerHTML = "Test Results Details";
			body.appendChild(detailTitle);
			testing.tests.forEach((test, index) => {
				if(index === 0 || testing.tests[index - 1].sourceFile !== test.sourceFile) {
					/* add a heading for this file */
					var fileHeading = document.createElement("h2");
					fileHeading.innerHTML = test.sourceFile;
					body.appendChild(fileHeading);
				}
				if(index === 0 || testing.tests[index - 1].unitTested !== test.unitTested) {
					/* add a heading for this unit */
					var unitHeading = document.createElement("h3");
					unitHeading.innerHTML = test.unitTested;
					body.appendChild(unitHeading);
				}
				body.appendChild(test.getResultHTML());
			});
			return html;
		},
		styleResultHTML: function(html) {
			var body = html.childNodes[1];
			var css = `
				body {
					margin: 25px;
					background-color: rgb(230, 230, 230);
					color: rgb(59, 67, 70);
					font-family: cursive;
					font-weight: 900;
				}
				h1, h2, h3, h4, h5, h6 {
					font-family: monospace;
				}
				h1 {
					padding: 10px 20px;
					border: 3px solid grey;
				}
				li {
					margin-left: 10px;
				}
				code {
					font-family: monospace;
				}
				.test-failed {
					color: red;
				}
				.test-passed {
					color: green;
				}
			`;
			var style = document.createElement("style");
			style.innerHTML = css;
			body.appendChild(style);
			return html;
		},
		showResults: function() {
			var html = this.generateTestResultHTML();
			html = this.styleResultHTML(html);
			this.htmlOpener.open(html);
		}
	}
};
