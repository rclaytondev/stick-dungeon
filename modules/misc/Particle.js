function Particle(color, x, y, velX, velY, size) {
	this.color = color;
	this.x = x;
	this.y = y;
	this.z = 1;
	this.velocity = { x: velX, y: velY };
	this.size = size;
	this.opacity = 1;
};
Particle.method("display", function() {
	var self = this;
	var center = graphics3D.point3D(this.x, this.y, this.z);
	var radius = this.size * this.z;
	var display = function() {
		c.save(); {
			c.fillStyle = self.color;
			c.globalAlpha = Math.max(self.opacity, 0);
			c.fillCircle(center.x, center.y, radius);
		} c.restore();
	};
	game.dungeon[game.theRoom].render(
		new RenderingOrderObject(
			display,
			this.z
		)
	);
});
Particle.method("update", function() {
	this.x += this.velocity.x;
	this.y += this.velocity.y;
	this.opacity -= 0.05;
	this.toBeRemoved = (this.opacity <= 0);
});
