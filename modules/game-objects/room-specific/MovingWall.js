function MovingWall(x, y, w, h, startZ) {
	this.x = x;
	this.y = y;
	this.w = w;
	this.h = h;
	this.z = startZ || 0.9;
	this.zDir = 0;
};
MovingWall.method("display", function() {
	if(this.z > 0.9) {
		var color = Math.map(this.z, 0.9, 1.1, 100, 110);
		color = (color > 110) ? 110 : color;
		graphics3D.cube(this.x, this.y, this.w, this.h, 0.9, this.z, "rgb(" + color + ", " + color + ", " + color + ")", "rgb(150, 150, 150)");
	}
});
MovingWall.method("update", function() {
	if(this.z >= 1) {
		collisions.solids.rect(this.x, this.y, this.w, this.h);
	}
	this.z += this.zDir;
	this.z = Math.constrain(this.z, 0.9, 1.1);
});
