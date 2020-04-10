/** ROOM DATA **/
function Room(type, content, id, minWorldY, background) {
	this.type = type;
	this.content = content || [];
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
