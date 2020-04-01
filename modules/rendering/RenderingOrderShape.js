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
