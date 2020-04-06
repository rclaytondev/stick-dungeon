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
	if(this.type === "wall-to-left" || this.type === "wall-to-right") {
		return new utils.geom.Rectangle({ left: this.x - 1, right: this.x + 1, top: -Border.LARGE_NUMBER, bottom: Border.LARGE_NUMBER });
	}
	else if(this.type === "floor" || this.type === "ceiling") {
		return new utils.geom.Rectangle({ left: -Border.LARGE_NUMBER, right: Border.LARGE_NUMBER, top: this.y - 1, bottom: this.y + 1 });
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
