function Platform(x, y, w) {
	this.x = x;
	this.y = y;
	this.w = w;
};
Platform.method("update", function() {
	collisions.solids.rect(this.x, this.y, this.w, 3, {walls: ["top"]});
});
Platform.method("display", function() {
	graphics3D.cube(this.x, this.y, this.w, 3, 0.9, 1.1, "rgb(139, 69, 19)", "rgb(159, 89, 39", { obscuresLight: true });
});
