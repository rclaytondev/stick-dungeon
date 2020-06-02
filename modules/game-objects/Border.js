function Border(type, location) {
	if(!["floor", "ceiling", "wall-to-left", "wall-to-right", "floor-to-left", "floor-to-right", "ceiling-to-left", "ceiling-to-right"].includes(type)) {
		throw new Error("Invalid border type of '" + type + "'");
	}
	this.type = type;
	this.x = location.x;
	this.y = location.y;
};
Border.LARGE_NUMBER = 10000;
Border.OFFSCREEN_BUFFER = 100;
Border.method("display", function() {
	var location = this.getDisplayBounds();
	if(location.width > 0 && location.height > 0) {
		graphics3D.cube(location.x, location.y, location.w, location.h, 0.9, 1.1);
	}
});
Border.method("update", function() {
	var location = this.getCollisionBounds();
	if(location.width > 0 && location.height > 0) {
		collisions.solids.rect(location.x, location.y, location.w, location.h);
	}
});
Border.method("getDisplayBounds", function() {
	if(this.type === "floor") {
		return new utils.geom.Rectangle({ left: -Border.OFFSCREEN_BUFFER, right: canvas.width + Border.OFFSCREEN_BUFFER, top: this.y, bottom: canvas.height + Border.OFFSCREEN_BUFFER });
	}
	else if(this.type === "ceiling") {
		return new utils.geom.Rectangle({ left: -Border.OFFSCREEN_BUFFER, right: canvas.width + Border.OFFSCREEN_BUFFER, top: -Border.OFFSCREEN_BUFFER, bottom: this.y });
	}
	else if(this.type === "wall-to-left") {
		return new utils.geom.Rectangle({ left: -Border.OFFSCREEN_BUFFER, right: this.x, top: -Border.OFFSCREEN_BUFFER, bottom: canvas.height + Border.OFFSCREEN_BUFFER });
	}
	else if(this.type === "wall-to-right") {
		return new utils.geom.Rectangle({ left: this.x, right: canvas.width + Border.OFFSCREEN_BUFFER, top: -Border.OFFSCREEN_BUFFER, bottom: canvas.height + Border.OFFSCREEN_BUFFER });
	}
	else if(this.type === "floor-to-left") {
		return new utils.geom.Rectangle({ left: -Border.OFFSCREEN_BUFFER, right: this.x, top: this.y, bottom: canvas.height + Border.OFFSCREEN_BUFFER });
	}
	else if(this.type === "floor-to-right") {
		return new utils.geom.Rectangle({ left: this.x, right: canvas.width + Border.OFFSCREEN_BUFFER, top: this.y, bottom: canvas.height + Border.OFFSCREEN_BUFFER });
	}
	else if(this.type === "ceiling-to-left") {
		return new utils.geom.Rectangle({ left: -Border.OFFSCREEN_BUFFER, right: this.x, top: -Border.OFFSCREEN_BUFFER, bottom: this.y });
	}
	else if(this.type === "ceiling-to-right") {
		return new utils.geom.Rectangle({ left: this.x, right: canvas.width + Border.OFFSCREEN_BUFFER, top: -Border.OFFSCREEN_BUFFER, bottom: this.y });
	}
});
Border.method("getCollisionBounds", function() {
	if(this.type === "wall-to-left") {
		return new utils.geom.Rectangle({ left: this.x - Border.LARGE_NUMBER, right: this.x, top: -Border.LARGE_NUMBER, bottom: Border.LARGE_NUMBER });
	}
	else if(this.type === "wall-to-right") {
		return new utils.geom.Rectangle({ left: this.x, right: this.x + Border.LARGE_NUMBER, top: -Border.LARGE_NUMBER, bottom: Border.LARGE_NUMBER });
	}
	else if(this.type === "floor") {
		return new utils.geom.Rectangle({ left: -Border.LARGE_NUMBER, right: Border.LARGE_NUMBER, top: this.y, bottom: this.y + Border.LARGE_NUMBER });
	}
	else if(this.type === "ceiling") {
		return new utils.geom.Rectangle({ left: -Border.LARGE_NUMBER, right: Border.LARGE_NUMBER, top: this.y - Border.LARGE_NUMBER, bottom: this.y })
	}
	else if(this.type === "floor-to-left") {
		return new utils.geom.Rectangle({ left: this.x - Border.LARGE_NUMBER, right: this.x, top: this.y, bottom: this.y + Border.LARGE_NUMBER });
	}
	else if(this.type === "floor-to-right") {
		return new utils.geom.Rectangle({ left: this.x, right: this.x + Border.LARGE_NUMBER, top: this.y, bottom: this.y + Border.LARGE_NUMBER });
	}
	else if(this.type === "ceiling-to-left") {
		return new utils.geom.Rectangle({ left: this.x - Border.LARGE_NUMBER, right: this.x, top: this.y - Border.LARGE_NUMBER, bottom: this.y });
	}
	else if(this.type === "ceiling-to-right") {
		return new utils.geom.Rectangle({ left: this.x, right: this.x + Border.LARGE_NUMBER, top: this.y - Border.LARGE_NUMBER, bottom: this.y });
	}
});
Border.method("getIntersection", function(border) {
	/*
	Do not use this function to get the intersection between any two arbitrary borders!!! It is designed for a very specific use case and will probably not work otherwise.
	This is used to generate the outline of all the borders in the room for the lighting algorithm.
	If the borders do not intersect, it will return a polygon connecting them through the top or bottom of the screen, attempting to go around clockwise.
	*/
	var verticalSegment, horizontalSegment;
	[horizontalSegment, verticalSegment] = this.getSegments();
	var otherVerticalSegment, otherHorizontalSegment;
	[otherHorizontalSegment, otherVerticalSegment] = border.getSegments();

	/* apply depth scaling to make it be at the front of the border */
	var allSegments = [horizontalSegment, verticalSegment, otherHorizontalSegment, otherVerticalSegment].removeAll(undefined);
	allSegments.forEach(segment => {
		segment.endPoint1 = graphics3D.point3D(segment.endPoint1.x, segment.endPoint1.y, 1.1);
		segment.endPoint2 = graphics3D.point3D(segment.endPoint2.x, segment.endPoint2.y, 1.1);
	});

	if(Object.typeof(verticalSegment) === "object" && Object.typeof(otherHorizontalSegment) === "object") {
		var intersection1 = collisions.segmentIntersectsSegment(
			verticalSegment.endPoint1, verticalSegment.endPoint2,
			otherHorizontalSegment.endPoint1, otherHorizontalSegment.endPoint2
		);
		if(intersection1 !== null) {
			return intersection1;
		}
	}
	if(Object.typeof(otherVerticalSegment) === "object" && Object.typeof(horizontalSegment) === "object") {
		var intersection2 = collisions.segmentIntersectsSegment(
			otherVerticalSegment.endPoint1, otherVerticalSegment.endPoint2,
			horizontalSegment.endPoint1, horizontalSegment.endPoint2
		);
		if(intersection2 !== null) {
			return intersection2;
		}
	}

	var cameraOffset = {
		x: game.camera.getOffsetX(),
		y: game.camera.getOffsetY()
	};
	var screenTop = 0;
	var screenBottom = canvas.height;
	if(["wall-to-right", "floor-to-right"].includes(this.type) && ["wall-to-left", "floor-to-left"].includes(border.type)) {
		return [
			graphics3D.point3D(this.x + cameraOffset.x, this.y + cameraOffset.y, 1.1),
			graphics3D.point3D(this.x + cameraOffset.x, screenBottom + Border.LARGE_NUMBER, 1.1),
			graphics3D.point3D(border.x + cameraOffset.x, screenBottom + Border.LARGE_NUMBER, 1.1),
			graphics3D.point3D(border.x + cameraOffset.x, border.y + cameraOffset.y, 1.1)
		];
	}
	if(this.type === "floor-to-right" && border.type === "floor-to-left") {
		return [
			graphics3D.point3D(border.x + cameraOffset.x, border.y + cameraOffset.y, 1.1),
			graphics3D.point3D(border.x + cameraOffset.x, screenTop - Border.LARGE_NUMBER, 1.1),
			graphics3D.point3D(this.x + cameraOffset.x, screenTop - Border.LARGE_NUMBER, 1.1),
			graphics3D.point3D(this.x + cameraOffset.x, this.y + cameraOffset.y, 1.1)
		];
	}
	if(this.type === "ceiling-to-left" && border.type === "ceiling-to-right") {
		return [
			graphics3D.point3D(this.x + cameraOffset.x, this.y + cameraOffset.y, 1.1),
			graphics3D.point3D(this.x + cameraOffset.x, screenTop - Border.LARGE_NUMBER, 1.1),
			graphics3D.point3D(border.x + cameraOffset.x, screenTop - Border.LARGE_NUMBER, 1.1),
			graphics3D.point3D(border.x + cameraOffset.x, border.y + cameraOffset.y, 1.1)
		];
	}
	if(this.type === "wall-to-left" && border.type === "wall-to-right") {
		return [
			graphics3D.point3D(this.x + cameraOffset.x, screenTop - Border.LARGE_NUMBER, 1.1),
			graphics3D.point3D(border.x + cameraOffset.x, screenTop - Border.LARGE_NUMBER, 1.1)
		];
	}
});
Border.method("getSegments", function() {
	/*
	This function returns (in an array) the horizontal and/or vertical segments that make up the border.
	It should return them in the form [horizontal, vertical]. For example, this means if there is no horizontal segment, the first item in the array should be undefined.
	*/
	var cameraOffset = {
		x: game.camera.getOffsetX(),
		y: game.camera.getOffsetY()
	};
	if(this.type === "floor" || this.type === "ceiling") {
		return [{
			endPoint1: { x: -Border.LARGE_NUMBER, y: this.y + cameraOffset.y },
			endPoint2: { x: canvas.width + Border.LARGE_NUMBER, y: this.y + cameraOffset.y }
		}];
	}
	else if(this.type === "wall-to-right" || this.type === "wall-to-left") {
		return [, {
			endPoint1: { x: this.x + cameraOffset.x, y: -Border.LARGE_NUMBER },
			endPoint2: { x: this.x + cameraOffset.x, y: canvas.height + Border.LARGE_NUMBER }
		}]
	}
	else if(["floor-to-left", "floor-to-right", "ceiling-to-left", "ceiling-to-right"].includes(this.type)) {
		var lines = [
			{
				endPoint1: { x: this.x, y: this.y },
				endPoint2: { x: (this.type.endsWith("-to-left")) ? -Border.LARGE_NUMBER : canvas.width + Border.LARGE_NUMBER, y: this.y }
			},
			{
				endPoint1: { x: this.x, y: this.y },
				endPoint2: { x: this.x, y: (this.type.startsWith("ceiling")) ? -Border.LARGE_NUMBER : canvas.height + Border.LARGE_NUMBER }
			}
		];
		lines.forEach(line => {
			line.endPoint1.x += cameraOffset.x;
			line.endPoint1.y += cameraOffset.y;
			line.endPoint2.x += cameraOffset.x;
			line.endPoint2.y += cameraOffset.y;
		});
		return lines;
	}
});
Border.method("reflect", function() {
	if(this.type === "floor" || this.type === "ceiling") {
		return this;
	}
	var reflected = this.clone();
	if(this.type === "wall-to-left" || this.type === "wall-to-right") {
		return new Border(this.type === "wall-to-left" ? "wall-to-right" : "wall-to-left", { x: -this.x });
	}
	else if(this.type === "floor-to-left" || this.type === "floor-to-right") {
		return new Border(this.type === "floor-to-left" ? "floor-to-right" : "floor-to-left", { x: -this.x, y: this.y });
	}
	else if(this.type === "ceiling-to-left" || this.type === "ceiling-to-right") {
		return new Border(this.type === "ceiling-to-left" ? "ceiling-to-right" : "ceiling-to-left", { x: -this.x, y: this.y });
	}
});
