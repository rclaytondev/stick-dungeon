function Block(x, y, w, h, settings) {
	this.x = x;
	this.y = y;
	this.w = w;
	this.h = h;
	settings = settings || {};
	this.obscuresLight = (typeof settings.obscuresLight === "boolean") ? settings.obscuresLight : true;
	this.lightBlockingEdges = settings.lightBlockingEdges || ["left", "right", "top", "bottom"];
	this.rayVertices = settings.rayVertices || ["top-left", "top-right", "bottom-left", "bottom-right"];
};
Block.method("update", function() {
	collisions.solids.rect(this.x, this.y, this.w, this.h, {illegalHandling: utils.tempVars.partOfAStair ? "teleport" : "collide"} );
});
Block.method("display", function() {
	graphics3D.cube(
		this.x, this.y, this.w, this.h,
		0.9, 1.1,
		null, null, // default colors
		{
			obscuresLight: this.obscuresLight,
			lightBlockingEdges: this.lightBlockingEdges,
			rayVertices: this.rayVertices,
			isBeingDebugged: this.isBeingDebugged
		}
	);
});
Block.method("reflect", function() {
	return new Block(-(this.x + this.w), this.y, this.w, this.h);
});
