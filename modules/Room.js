/** ROOM DATA **/
function Room(type, content, background) {
	this.type = type;
	this.content = content || [];
	this.index = null;
	this.pathScore = null;
	this.background = background || null;
	this.colorScheme = null;
	this.renderingObjects = [];
	this.lightingObjects = [];
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
	this.lightingObjects = [];
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
	/*
	add the following objects into `lightingObjects`:
	 - all RenderingOrderShapes with `obscuresLight = true`
	 - all RenderingOrderShapes with `obscuresLight = true` within RenderingOrderGroups
	*/
	this.lightingObjects = this.lightingObjects.concat(
		this.renderingObjects.filter(obj => (obj instanceof RenderingOrderShape && obj.obscuresLight)),
		(() => {
			/* extract RenderingOrderShapes from within RenderingOrderGroups */
			var result = [];
			this.renderingObjects.filter(obj => obj instanceof RenderingOrderGroup).forEach((group) => {
				result = result.concat(group.objects.filter(obj => obj instanceof RenderingOrderShape && obj.obscuresLight));
			});
			return result;
		}) (),
	);
	this.renderAll();


	this.content.filter(obj => !obj.absolutePosition).forEach(obj => {
		if(typeof obj.translate === "function") {
			obj.translate(-game.camera.getOffsetX(), -game.camera.getOffsetY());
		}
		else {
			obj.x -= game.camera.getOffsetX();
			obj.y -= game.camera.getOffsetY();
		}
	});
	this.displayShadowEffect();

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
Room.method("getVisibilityPolygon", function(offset, brightness = 1) {
	/* generate an array of shapes from RenderingOrderShapes in the game */
	var shapes = this.lightingObjects.filter(obj => !(obj instanceof RenderingOrderShape));
	this.lightingObjects.filter(obj => obj instanceof RenderingOrderShape).forEach(shape => {
		if(shape.type === "rect") {
			shapes.push({
				type: "rect",
				x: shape.location.x,
				y: shape.location.y,
				w: shape.location.w,
				h: shape.location.h,
				lightBlockingEdges: shape.lightBlockingEdges.clone(),
				rayVertices: shape.rayVertices.clone(),
				isBeingDebugged: shape.isBeingDebugged,
				obscurity: shape.obscurity
			});
		}
		else if(shape.type === "polygon") {
			shapes.push({
				type: "polygon",
				vertices: shape.location,
				obscurity: shape.obscurity
			});
		}
	});
	shapes.push(this.getBorderLightBoundaries());

	/* remove polygons that are not obscure enough to block the light (this is used so some objects can let a bit of light through) */
	shapes = shapes.filter(shape => {
		shape.obscurity = (typeof shape.obscurity === "number") ? shape.obscurity : 1;
		return (shape.obscurity >= brightness);
	});

	/* remove polygons / rectangles that are entirely off-screen */
	shapes = shapes.filter(shape => {
		if(shape.isBorderPolygon) { return true; }
		if(shape.type === "rect") {
			return (shape.x + shape.w >= 0 && shape.x <= canvas.width && shape.y + shape.h >= 0 && shape.y <= canvas.height);
		}
		else if(shape.type === "polygon") {
			return shape.vertices.some(vertex => vertex.x >= 0 && vertex.x <= canvas.width && vertex.y >= 0 && vertex.y <= canvas.height);
		}
	});

	/* constrain all shapes to be on-screen (only vertically) */
	shapes.forEach(shape => {
		if(shape.type === "polygon") {
			shape.vertices.forEach(vertex => {
				vertex.y = Math.constrain(vertex.y, 0, canvas.height);
			});
		}
		else if(shape.type === "rect") {
			var topLeft = { x: shape.x, y: shape.y };
			var bottomRight = { x: shape.x + shape.w, y: shape.y + shape.h };
			topLeft.y = Math.constrain(topLeft.y, 0, canvas.height);
			bottomRight.y = Math.constrain(bottomRight.y, 0, canvas.height);
			shape.y = topLeft.y;
			shape.h = bottomRight.y - topLeft.y;
		}
	});

	/* remove duplicate vertices from polygons (duplicates may have been created by constraining them onto the screen) */
	shapes.filter(shape => shape.type === "polygon").forEach(polygon => {
		polygon.vertices = polygon.vertices.filter((vertex, index) => {
			var nextVertex = polygon.vertices[(index + 1) % polygon.vertices.length];
			return (vertex.x !== nextVertex.x || vertex.y !== nextVertex.y);
		});
	});

	/* generate a list of vertices to shoot rays at */
	var raycastCenter = {
		x: p.x + game.camera.getOffsetX() + offset.x,
		y: p.y + game.camera.getOffsetY() + offset.y
	};
	var rayVertices = [];
	shapes.forEach(shape => {
		if(shape.type === "polygon") {
			shape.vertices.forEach(vertex => { vertex.container = shape; });
			rayVertices = rayVertices.concat(shape.vertices);
		}
		else if(shape.type === "rect") {
			var corners = [
				{ location: "top-left", x: shape.x, y: shape.y },
				{ location: "bottom-left", x: shape.x, y: shape.y + shape.h },
				{ location: "top-right", x: shape.x + shape.w, y: shape.y },
				{ location: "bottom-right", x: shape.x + shape.w, y: shape.y + shape.h }
			];
			corners.forEach(corner => { corner.container = shape; });
			corners = corners.filter(corner => shape.rayVertices.includes(corner.location));
			/* remove corners on the opposite side of the rectangle */
			if(shape.x + shape.w > raycastCenter.x) {
				if(shape.y + shape.h > raycastCenter.y) {
					corners = corners.filter(corner => corner.location !== "bottom-right");
				}
				if(shape.y < raycastCenter.y) {
					corners = corners.filter(corner => corner.location !== "top-right");
				}
			}
			if(shape.x < raycastCenter.x) {
				if(shape.y + shape.h > raycastCenter.y) {
					corners = corners.filter(corner => corner.location !== "bottom-left");
				}
				if(shape.y < raycastCenter.y) {
					corners = corners.filter(corner => corner.location !== "top-left");
				}
			}
			rayVertices = rayVertices.concat(corners);
		}
	});

	/* remove away-facing sides of rectangles for performance */
	shapes.filter(shape => shape.type === "rect").forEach(rect => {
		if(rect.x < raycastCenter.x) {
			rect.lightBlockingEdges.remove("left");
		}
		if(rect.x + rect.w > raycastCenter.x) {
			rect.lightBlockingEdges.remove("right");
		}
		if(rect.y < raycastCenter.y) {
			rect.lightBlockingEdges.remove("top");
		}
		if(rect.y + rect.h > raycastCenter.y) {
			rect.lightBlockingEdges.remove("bottom");
		}
	});

	/* display light-blocking polygons for debugging */
	if(debugging.settings.SHOW_LIGHTING_POLYGONS) {
		c.strokeStyle = "red";
		c.lineWidth = 5;
		shapes.forEach(shape => {
			if(shape.type === "rect") {
				if(Object.typeof(shape.lightBlockingEdges) !== "array") {
					c.strokeRect(shape.x, shape.y, shape.w, shape.h);
				}
				else {
					/* only show the edges that are being used */
					if(shape.lightBlockingEdges.includes("left")) {
						c.strokeLine(shape.x, shape.y, shape.x, shape.y + shape.h);
					}
					if(shape.lightBlockingEdges.includes("right")) {
						c.strokeLine(shape.x + shape.w, shape.y, shape.x + shape.w, shape.y + shape.h);
					}
					if(shape.lightBlockingEdges.includes("top")) {
						c.strokeLine(shape.x, shape.y, shape.x + shape.w, shape.y);
					}
					if(shape.lightBlockingEdges.includes("bottom")) {
						c.strokeLine(shape.x, shape.y + shape.h, shape.x + shape.w, shape.y + shape.h);
					}
				}
			}
			else if(shape.type === "polygon") {
				if(shape.nonCyclic) {
					for(var i = 0; i < shape.vertices.length - 1; i ++) {
						var current = shape.vertices[i], next = shape.vertices[i + 1];
						c.strokeLine(current, next);
					}
				}
				else {
					c.strokePoly(shape.vertices);
				}
			}
		});
		rayVertices.forEach(ray => {
			c.fillStyle = "red";
			c.fillCircle(ray.x, ray.y, 5);
		});

		c.fillStyle = "rgb(128, 0, 0)";
		c.fillCircle(raycastCenter.x, raycastCenter.y, 5);
	}

	/* cast rays at every vertex */
	var raycastIntersections = [];
	var raysCast = 0;
	function castRayAtPoint(point, shape) {
		/*
		This function calls the raycast() function to shoot a ray at the point, and also two more, very slightly clockwise and counterclockwise of that point.
		*/
		var intersection = raycast({ x: point.x - raycastCenter.x, y: point.y - raycastCenter.y })
		raycastIntersections.push(intersection);
		if(Object.typeof(intersection) === "object" || true) {
			if(shape.type === "polygon") {
				var vertices = shape.vertices;
			}
			else {
				var vertices = [
					{ x: shape.x, y: shape.y },
					{ x: shape.x + shape.w, y: shape.y },
					{ x: shape.x + shape.w, y: shape.y + shape.h },
					{ x: shape.x, y: shape.y + shape.h }
				];
			}
			/* get previous and next vertices */
			for(var i = 0; i < vertices.length; i ++) {
				var vertex = vertices[i];
				if(vertex.x === point.x && vertex.y === point.y) {
					var previous = vertices[i === 0 ? vertices.length - 1 : i - 1];
					var next = vertices[(i + 1) % vertices.length];
					break;
				}
			}
			/* cast another ray to just barely go past the corner */
			var closestVertex = (Math.distSq(previous.x, previous.y, point.x, point.y) < Math.distSq(next.x, next.y, point.x, point.y)) ? previous : next;
			const OFFSET_RAY_DISTANCE = 1;
			var direction1 = Math.normalize(vertex.x - closestVertex.x, vertex.y - closestVertex.y);
			direction1.x *= OFFSET_RAY_DISTANCE;
			direction1.y *= OFFSET_RAY_DISTANCE;
			raycastIntersections.push(raycast({ x: (vertex.x + direction1.x) - raycastCenter.x, y: (vertex.y + direction1.y) - raycastCenter.y }));
		}
	};
	function raycast(direction) {
		raysCast ++;
		var intersections = [];
		shapes.forEach(shape => {
			if(shape.type === "rect") {
				var intersection = collisions.rayIntersectsRectangle(
					raycastCenter,
					direction,
					shape
				);
				intersections.push(intersection);
			}
			else if(shape.type === "polygon") {
				for(var i = 0; i < shape.vertices.length; i ++) {
					if(shape.nonCyclic && i === shape.vertices.length - 1) {
						break;
					}
					var currentEndPoint = shape.vertices[i];
					var nextEndPoint = shape.vertices[(i + 1) % shape.vertices.length];
					var intersection = collisions.rayIntersectsSegment(
						raycastCenter,
						direction,
						currentEndPoint, nextEndPoint
					);
					intersections.push(intersection);
				}
			}
		});
		intersections = intersections.filter(intersection => intersection != null);

		if(intersections.some(intersection => isNaN(intersection.x) || isNaN(intersection.y))) {
			return null;
		}
		var closestIntersection = intersections.min(intersection => Math.distSq(intersection.x, intersection.y, raycastCenter.x, raycastCenter.y));
		return closestIntersection;
	};
	rayVertices.forEach(vertex => {
		castRayAtPoint(vertex, vertex.container);
	});
	raycastIntersections = raycastIntersections.removeAll(undefined, null);
	if(debugging.settings.SHOW_LIGHTING_ALGORITHM) {
		console.log("cast", raysCast, "rays in total");
	}
	if(debugging.settings.SHOW_LIGHTING_RAYS) {
		c.fillStyle = "yellow";
		c.strokeStyle = "yellow";
		raycastIntersections.forEach(intersection => {
			c.strokeLine(intersection, raycastCenter);
			c.fillCircle(intersection.x, intersection.y, 5);
		});
	}

	/* sort intersections by angle clockwise */
	raycastIntersections.forEach(intersection => {
		intersection.angle = Math.atan2(intersection.y - raycastCenter.y, intersection.x - raycastCenter.x);
		intersection.angle = Math.deg(intersection.angle);
	});
	raycastIntersections = raycastIntersections.sort((a, b) => a.angle - b.angle);

	return raycastIntersections;
});
Room.method("displayShadowEffect", function() {
	var centralPolygon = this.getVisibilityPolygon({ x: 0, y: 0 }, 1);
	if(!debugging.settings.DISABLE_LIGHTING_SHADOW) {
		c.fillStyle = "rgb(0, 0, 0)";
		c.beginPath();
		c.polygon(centralPolygon);
		c.invertPath();
		c.fill("evenodd");
	}

	/* extra semi-transparent shadow polygons for cooler shadow graphics */
	const NUM_EXTRA_POLYGONS = 6; // higher number = more detailed shadows, but slower FPS
	const LIGHT_SOURCE_OFFSET_DISTANCE = 30;
	if(NUM_EXTRA_POLYGONS !== 0) {
		var polygons = [];
		var brightness = 0;
		for(var angle = 0; angle < 360; angle += (360 / NUM_EXTRA_POLYGONS)) {
			brightness = (brightness === 0 ? 1 : 0);
			var location = Math.rotate(LIGHT_SOURCE_OFFSET_DISTANCE, 0, angle);

			/* move the light source so that it doesn't overlap any CollisionRects (to avoid creating light source in walls) */
			collisions.collisions.filter(collision => collision instanceof CollisionRect).forEach(collision => {
				var collisionPos = {
					x: collision.x + game.camera.getOffsetX(),
					y: collision.y + game.camera.getOffsetY()
				};
				var originPos = {
					x: p.x + game.camera.getOffsetX() + location.x,
					y: p.y + game.camera.getOffsetY() + location.y
				};
				while((location.x !== 0 || location.y !== 0) && collisions.pointIntersectsRectangle(originPos, { x: collisionPos.x, y: collisionPos.y, w: collision.w, h: collision.h })) {
					/* move light source toward player */
					var direction = Math.normalize(location.x, location.y);
					location.x -= direction.x, location.y -= direction.y;
					originPos = {
						x: p.x + game.camera.getOffsetX() + location.x,
						y: p.y + game.camera.getOffsetY() + location.y
					};
				}
			});

			polygons.push(this.getVisibilityPolygon(location, brightness));
		}
		if(!debugging.settings.DISABLE_LIGHTING_SHADOW) {
			c.fillStyle = "rgba(0, 0, 0, 0.3)";
			polygons.forEach(polygon => {
				c.beginPath();
				c.polygon(polygon);
				c.invertPath();
				c.fill("evenodd");
			});
		}
	}


	if(!debugging.settings.DISABLE_RADIAL_SHADOWS) {
		var gradient = c.createRadialGradient(400, 400, 0, 400, 400, 450);
		c.globalAlpha = 1;
		gradient.addColorStop(0, "rgba(0, 0, 0, 0)");
		gradient.addColorStop(1, "rgba(0, 0, 0, 255)");
		c.fillStyle = gradient;
		c.fillCanvas();
	}
});
Room.method("getBorderLightBoundaries", function() {
	/*
	Returns a polygon that all of the Border objects form. Used for calculating light.

	This function assumes that every room contains at least a left and right wall, as well as a floor.
	*/
	var borders = this.getInstancesOf(Border);
	borders = [].concat(
		borders.filter(border => border.type === "ceiling-to-right"),
		borders.filter(border => border.type === "wall-to-right"),
		borders.filter(border => border.type === "floor-to-right"),
		borders.filter(border => border.type === "floor"),
		borders.filter(border => border.type === "floor-to-left"),
		borders.filter(border => border.type === "wall-to-left"),
		borders.filter(border => border.type === "ceiling-to-left"),
		borders.filter(border => border.type === "ceiling")
	);
	var polygon = [];
	for(var i = 0; i < borders.length; i ++) {
		var current = borders[i];
		var next = borders[(i + 1) % borders.length];
		var intersection = current.getIntersection(next);
		if(Object.typeof(current.x) === "number" && Object.typeof(current.y) === "number") {
			polygon.push(graphics3D.point3D(current.x + game.camera.getOffsetX(), current.y + game.camera.getOffsetY(), 1.1));
		}
		if(Object.typeof(intersection) === "array") {
			polygon = polygon.concat(intersection);
		}
		else if(Object.typeof(intersection) === "object") {
			polygon.push(intersection);
		}
	}
	/* remove consecutive duplicates */
	polygon = polygon.filter((object, index) => {
		var next = polygon[(index + 1) % polygon.length];
		return (object.x !== next.x || object.y !== next.y);
	});

	return {
		type: "polygon",
		vertices: polygon,
		isBorderPolygon: true
	};
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
