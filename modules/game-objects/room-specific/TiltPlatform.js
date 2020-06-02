function TiltPlatform(x, y) {
	this.x = x;
	this.y = y;
	this.ORIGINAL_X = x;
	this.ORIGINAL_Y = y;
	this.platformX = x;
	this.platformY = y;
	this.tilt = 0;
	this.tiltDir = 0;
	this.interact = true;
	this.dir = null;
	this.velocity = { x: 0, y: 0 };
};
TiltPlatform.method("display", function() {
	graphics3D.cube(this.x - 5, this.y + 10, 10, 8000, 0.99, 1.01);
	graphics3D.polygon3D("rgb(110, 110, 110)", "rgb(150, 150, 150)", 0.9, 1.1, [
		{
			x: this.p1.x + this.platformX,
			y: this.p1.y + this.platformY
		},
		{
			x: this.p2.x + this.platformX,
			y: this.p2.y + this.platformY
		},
		{
			x: -(this.p1.x) + this.platformX,
			y: -(this.p1.y) + this.platformY
		},
		{
			x: -(this.p2.x) + this.platformX,
			y: -(this.p2.y) + this.platformY
		}
	], { obscuresLight: true });
});
TiltPlatform.method("update", function() {
	this.p1 = Math.rotate(-75, -10, Math.floor(this.tilt));
	this.p2 = Math.rotate(75, -10, Math.floor(this.tilt));
	/* hitbox */
	collisions.solids.line(this.p1.x + this.platformX, this.p1.y + this.platformY, this.p2.x + this.platformX, this.p2.y + this.platformY, {illegalHandling: "teleport"});
	/* tilting */
	if(p.x + p.hitbox.right > this.x - 75 && p.x + p.hitbox.left < this.x + 75 && p.canJump && this.interact) {
		if(p.x > this.x) {
			this.tiltDir += 0.2;
		}
		else {
			this.tiltDir -= 0.2;
		}
	}
	else {
		this.tiltDir *= 0.99;
	}
	this.tilt += this.tiltDir;
	this.tilt = Math.modulateIntoRange(this.tilt, 0, 360);
	/* falling */
	this.collides = function() {
		c.beginPath();
		c.moveTo(this.p1.x + this.platformX, this.p1.y + this.platformY);
		c.lineTo(this.p2.x + this.platformX, this.p2.y + this.platformY);
		c.lineTo(-this.p1.x + this.platformX, -this.p1.y + this.platformY);
		c.lineTo(-this.p2.x + this.platformX, -this.p2.y + this.platformY);
		for(var x = -5; x <= 5; x += 10) {
			if(c.isPointInPath(this.ORIGINAL_X + x, this.ORIGINAL_Y + 10)) {
				return true;
			}
		}
		return false;
	};
	this.platformY += 5;
	while(this.collides()) {
		this.platformY --;
	};
	if(this.tilt > 45 && this.tilt < 90 && this.x < this.ORIGINAL_X + 10) {
		this.velocity.x += 0.1;
	}
	if(this.tilt < 315 && this.tilt > 270 && this.x > this.ORIGINAL_X - 10) {
		this.velocity.x -= 0.1;
	}
	if(this.y - this.ORIGINAL_Y > 800) {
		this.platformX = -8000; // move offscreen
	}
	this.platformX += this.velocity.x;
	this.platformY += this.velocity.y;
});
TiltPlatform.method("collides", function(x, y) {
	var p1 = graphics3D.point3D(this.p1.x + this.platformX, this.p1.y + this.platformY, 1.1);
	var p2 = graphics3D.point3D(this.p2.x + this.platformX, this.p2.y + this.platformY, 1.1);
	var p3 = graphics3D.point3D(-this.p1.x + this.platformX, -this.p1.y + this.platformY, 1.1);
	var p4 = graphics3D.point3D(-this.p2.x + this.platformX, -this.p2.y + this.platformY, 1.1);
	c.beginPath();
	c.polygon(
		{ x: p1.x, y: -800 },
		{ x: p2.x, y: -800 },
		p3,
		p4
	);
	return c.isPointInPath(x, y);
});
TiltPlatform.method("translate", function(x, y) {
	this.x += x;
	this.y += y;
	this.platformX += x;
	this.platformY += y;
});
TiltPlatform.method("reflect", function() {
	var reflected = this.clone();
	reflected.ORIGINAL_X = -reflected.ORIGINAL_X;
	reflected.platformX = -reflected.platformX;
	reflected.x = -reflected.x;
	return reflected;
});
