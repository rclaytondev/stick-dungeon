function Block(x, y, w, h) {
	this.x = x;
	this.y = y;
	this.w = w;
	this.h = h;
};
Block.method("update", function() {
	collisions.solids.rect(this.x, this.y, this.w, this.h, {illegalHandling: utils.tempVars.partOfAStair ? "teleport" : "collide"} );
});
Block.method("display", function() {
	graphics3D.cube(this.x, this.y, this.w, this.h, 0.9, 1.1);
});
