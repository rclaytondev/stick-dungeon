function BoulderVoid(x, y) {
	this.x = x;
	this.y = y;
	this.opacity = 1;
};
BoulderVoid.method("exist", function() {
	var p1b = graphics3D.point3D(this.x - 40, this.y, 0.9);
	var p2b = graphics3D.point3D(this.x + 40, this.y, 0.9);
	var p3b = graphics3D.point3D(this.x, this.y - 100, 0.9);
	var p1f = graphics3D.point3D(this.x - 40, this.y, 1.1);
	var p2f = graphics3D.point3D(this.x + 40, this.y, 1.1);
	var p3f = graphics3D.point3D(this.x, this.y - 100, 1.1);
	c.save(); {
		c.globalAlpha = Math.max(this.opacity, 0);
		c.fillStyle = "rgb(110, 110, 110)";
		c.fillPoly(p1f, p2f, p2b, p1b);
	} c.restore();
	if(!game.dungeon[game.inRoom].content.containsInstanceOf(Boulder)) {
		this.opacity -= 0.05;
	}
	if(this.opacity < 0) {
		this.toBeRemoved = true;
	}
	graphics3D.boxFronts.push({
		type: "boulder void",
		opacity: this.opacity,
		pos1: p1b,
		pos2: p3b,
		pos3: p3f,
		pos4: p1f
	});
	graphics3D.boxFronts.push({
		type: "boulder void",
		opacity: this.opacity,
		pos1: p2b,
		pos2: p3b,
		pos3: p3f,
		pos4: p2f
	});
});
