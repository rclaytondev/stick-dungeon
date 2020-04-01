function RenderingOrderObject(display, depth, zOrder) {
	this.display = display; // a function to be called when this object is displayed
	if(Object.typeof(depth) !== "number") {
		throw new Error("Cannot construct RenderingOrderObject without depth argument; value '" + depth + "' is invalid.");
	}
	this.depth = depth; // how far back the polygon is
	this.zOrder = zOrder || 0; // only used when 2 polygons have the same depth
};
