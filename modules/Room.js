/** ROOM DATA **/
function Room(type, content, background) {
	this.type = type;
	this.content = content || [];
	this.index = null;
	this.pathScore = null;
	this.background = background || null;
	this.colorScheme = null;
	this.renderingObjects = [];
};
Room.method("update", function(index) {
	if(this.background === null) {
		this.background = ["plain", "bricks-1", "bricks-2", "bricks-3", "bricks-4"].randomItem();
	}
	graphics3D.boxFronts = [];
	debugging.hitboxes = [];
	collisions.collisions = [];
	p.canUseEarth = true;
	/* load all types of items */
	for(var i = 0; i < this.content.length; i ++) {
		var obj = this.content[i];
		if(!obj.initialized && typeof obj.init === "function") {
			obj.init();
		}
		if(obj instanceof Enemy) {
			Enemy.prototype.update.call(obj);
			if(debugging.settings.DEBUGGING_MODE && debugging.settings.SHOW_HITBOXES) {
				debugging.hitboxes.push({x: obj.x + obj.hitbox.left, y: obj.y + obj.hitbox.top, w: Math.dist(obj.hitbox.left, obj.hitbox.right), h: Math.dist(obj.hitbox.top, obj.hitbox.bottom), color: "green"});
			}
		}
		else if(typeof obj.update === "function") {
			obj.update();
		}
		if(obj.toBeRemoved || (typeof obj.removalCriteria === "function" && obj.removalCriteria())) {
			if(typeof obj.remove === "function") {
				obj.remove();
			}
			this.content.splice(i, 1);
			i --;
			continue;
		}
	}
	/* Collisions */
	if(game.inRoom === index) {
		p.canJump = false;
	}
	collisions.collisions.forEach(collision => { collision.collide(); });
});
Room.method("display", function() {
	c.fillCanvas("rgb(100, 100, 100)");
	if(this.background.startsWith("bricks")) {
		this.displayBackground();
	}

	this.content.filter(obj => !obj.absolutePosition).forEach(obj => {
		if(typeof obj.translate === "function") {
			obj.translate(game.camera.getOffsetX(), game.camera.getOffsetY());
		}
		else {
			obj.x += game.camera.getOffsetX();
			obj.y += game.camera.getOffsetY();
		}
	});
	this.content.filter(obj => !obj.absolutePosition).forEach(
		function(obj) {
			if(obj instanceof Item) {
				Item.prototype.display.call(obj);
			}
			else if(obj instanceof Enemy) {
				Enemy.prototype.display.call(obj);
			}
			else if(typeof obj.display === "function") {
				obj.display();
			}
		}
	);
	this.renderAll();

	/* display absolutely positioned objects in front of everything else */
	this.renderingObjects = [];
	this.content.filter(obj => obj.absolutePosition).forEach(obj => {
		if(obj instanceof Item) {
			Item.prototype.display.call(obj);
		}
		else if(obj instanceof Enemy) {
			Enemy.prototype.display.call(obj);
		}
		else if(typeof obj.display === "function") {
			obj.display();
		}
	});
	this.renderAll();


	/* add player hitbox + display hitboxes */
	p.displayHitbox();

	this.content.filter(obj => !obj.absolutePosition).forEach(obj => {
		if(typeof obj.translate === "function") {
			obj.translate(-game.camera.getOffsetX(), -game.camera.getOffsetY());
		}
		else {
			obj.x -= game.camera.getOffsetX();
			obj.y -= game.camera.getOffsetY();
		}
	});
});
Room.method("displayBackground", function() {
	const BRICK_SIZE = 20;
	const BRICK_PATTERNS = [
		{
			/* standard interlocking bricks (all 1x2 horizontal) */
			id: "bricks-1",
			width: BRICK_SIZE * 4,
			height: BRICK_SIZE * 2,
			getPattern: function(patternCanvas) {
				/* horizontal lines */
				patternCanvas.strokeLine(0, 0, 4, 0);
				patternCanvas.strokeLine(0, 1, 4, 1);
				/* vertical lines - top layer */
				patternCanvas.strokeLine(1, 0, 1, 1);
				patternCanvas.strokeLine(3, 0, 3, 1);
				/* vertical lines - bottom layer */
				patternCanvas.strokeLine(2, 1, 2, 2);
				patternCanvas.strokeLine(4, 1, 4, 2);
				return patternCanvas;
			}
		},
		{
			/* wide (1x3 units) and square (1x1 units) bricks in rows ("flemish bond" brick pattern) */
			id: "bricks-2",
			width: BRICK_SIZE * 4,
			height: BRICK_SIZE * 2,
			getPattern: function(patternCanvas) {
				/* horizontal lines */
				patternCanvas.strokeLine(0, 0, 4, 0);
				patternCanvas.strokeLine(0, 1, 4, 1);
				/* vertical lines - top layer */
				patternCanvas.strokeLine(1, 0, 1, 1);
				patternCanvas.strokeLine(4, 0, 4, 1);
				/* vertical lines - bottom layer */
				patternCanvas.strokeLine(2, 1, 2, 2);
				patternCanvas.strokeLine(3, 1, 3, 2);
				return patternCanvas;
			}
		},
		{
			/* tiled 3x3 grids of 2x1 / 1x2 bricks rotated around a central 1x1 brick ("spanish bond" brick pattern) */
			id: "bricks-3",
			width: BRICK_SIZE * 3,
			height: BRICK_SIZE * 3,
			getPattern: function(patternCanvas) {
				patternCanvas.strokeRect(0, 0, 2, 1);
				patternCanvas.strokeRect(2, 0, 1, 2);
				patternCanvas.strokeRect(0, 1, 1, 2);
				patternCanvas.strokeRect(1, 2, 2, 1);
				return patternCanvas;
			}
		},
		{
			/* 4x4 patterns, tiled to fill screen - "boxed basketweave" brick pattern */
			id: "bricks-4",
			width: BRICK_SIZE * 8,
			height: BRICK_SIZE * 8,
			getPattern: function(patternCanvas) {
				function displayPatternUnit(x, y, rotated) {
					patternCanvas.save(); {
						patternCanvas.translate(x + 2, y + 2);
						if(rotated) {
							patternCanvas.rotate(Math.rad(90));
						}
						patternCanvas.translate(-2, -2);
						patternCanvas.strokeRect(0, 0, 2, 1);
						patternCanvas.strokeRect(2, 0, 2, 1);
						patternCanvas.strokeRect(0, 1, 1, 2);
						patternCanvas.strokeRect(3, 1, 1, 2);
						patternCanvas.strokeRect(1, 1, 2, 1);
						patternCanvas.strokeRect(1, 2, 2, 1);
						patternCanvas.strokeRect(0, 3, 2, 1);
						patternCanvas.strokeRect(2, 3, 2, 1);
					} patternCanvas.restore();
				};
				displayPatternUnit(0, 0, false);
				displayPatternUnit(4, 0, true);
				displayPatternUnit(0, 4, true);
				displayPatternUnit(4, 4, false);
				return patternCanvas;
			}
		}
	];
	var pattern = BRICK_PATTERNS.find(pattern => pattern.id === this.background);
	if(pattern == undefined) {
		throw new Error("Invalid room background value of '" + this.background + "'.");
	}
	var patternCanvasElement = document.createElement("canvas");
	patternCanvasElement.width = pattern.width;
	patternCanvasElement.height = pattern.height;
	var patternCanvas = patternCanvasElement.getContext("2d");
	patternCanvas.fillCanvas("rgb(100, 100, 100)");
	patternCanvas.strokeStyle = "rgb(110, 110, 110)";
	patternCanvas.lineWidth = 2 / BRICK_SIZE;
	patternCanvas.scale(BRICK_SIZE, BRICK_SIZE);
	patternCanvas = pattern.getPattern(patternCanvas);
	var patternObject = c.createPattern(patternCanvasElement, "repeat");
	var patternOffset = {
		x: (-game.camera.x * 0.9) % pattern.width,
		y: (-game.camera.y * 0.9) % pattern.height
	};
	c.fillStyle = patternObject;
	c.save(); {
		c.translate(patternOffset.x, patternOffset.y);
		c.fillRect(-patternOffset.x, -patternOffset.y, canvas.width, canvas.height);
	} c.restore();
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
		this.renderingObjects.lastItem().objects.push(object);
		this.renderingObjects.lastItem().depth = object.depth;
	}
	else {
		this.renderingObjects.push(object);
	}
	this.renderingObjects.lastItem().renderingStyle = this.renderingStyle;
});
Room.method("renderAll", function() {
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
	this.renderingObjects.forEach(obj => {
		c.save(); {
			if(typeof obj.transform === "function") {
				obj.transform();
			}
			if(typeof obj.renderingStyle === "function") {
				obj.renderingStyle();
			}
			obj.display();
		} c.restore();
	});
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
	return this.content.filter(obj => obj instanceof type);
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
Room.method("reflect", function() {
	this.content = this.content.map((obj) => {
		if(typeof obj.reflect === "function") {
			return obj.reflect();
		}
		else {
			var reflected = obj.clone();
			reflected.x = -reflected.x;
			return reflected;
		}
	});
});
Room.method("containsUnexploredDoor", function() {
	var unexploredDoor = this.getInstancesOf(Door).find(door => typeof door.dest !== "number");
	return unexploredDoor !== undefined;
});
