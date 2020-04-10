function Spider(x, y) {
	Enemy.call(this, x, y);
	this.legs = 0;
	this.legDir = 2;

	/* hitbox */
	this.hitbox = new utils.geom.Rectangle({
		left: -45,
		right: 45,
		top: -22,
		bottom: 22
	});

	/* stats */
	this.health = 50;
	this.maxHealth = 50;
	this.defLow = 20;
	this.defHigh = 30;
	this.damLow = 20;
	this.damHigh = 30;
	this.name = "a giant spider";
};
Spider.extends(Enemy);
Spider.method("display", function() {
	var self = this;
	game.dungeon[game.theRoom].render(new RenderingOrderObject(
		function() {
			c.globalAlpha = Math.constrain(self.opacity, 0, 1);
			c.lineWidth = 4;
			c.fillStyle = "rgb(0, 0, 0)";
			c.strokeStyle = "rgb(0, 0, 0)";
			c.fillCircle(self.x, self.y, 20);

			for(var scale = -1; scale <= 1; scale += (1 - (-1)) ) {
				/* scaling is used to flip the legs (for left + right pairs of legs) */
				for(var rotation = -self.legs; rotation <= self.legs; rotation += (self.legs === 0 ? Infinity : (self.legs * 2)) ) {
					for(var legSize = 10; legSize <= 20; legSize += (20 - 10)) {
						c.save(); {
							c.translate(
								self.x + (scale * (legSize === 10 ? 14 : 16)),
								self.y + (legSize === 10 ? 14 : 4)
							);
							c.rotate(Math.rad(rotation));
							c.scale(scale, 1);

							c.strokeLine(
								0, 0,
								legSize, 0,
								legSize, legSize
							);
						} c.restore();
					}
				}
			}
			/* eyes */
			c.fillStyle = "rgb(255, 0, 0)";
			c.fillCircle(self.x - 10, self.y - 10, 5);
			c.fillCircle(self.x + 10, self.y - 10, 5);
		},
		1
	));
});
Spider.method("update", function(dest) {
	if(dest === "player") {
		if(this.x < p.x) {
			this.velocity.x = 2;
		}
		else {
			this.velocity.x = -2;
		}
		if(this.legs > 15) {
			this.legDir = -2;
		}
		if(this.legs <= 0) {
			this.legDir = 2;
		}
		else {
			this.legDir = (this.legs < 8) ? 2 : -2;
			if(Math.dist(this.legs, 8) <= 2) {
				this.legs = 8;
			}
		}
		this.legs += this.legDir;
		this.x += this.velocity.x;
		if(this.canJump && Math.dist(this.x, p.x) <= 130 && Math.dist(this.x, p.x) >= 120) {
			this.velocity.y = -4;
		}
	}
	else {
		if(this.x < dest.x) {
			this.velocity.x = 2;
		}
		else {
			this.velocity.x = -2;
		}
	}
	this.y += this.velocity.y;
	this.velocity.y += 0.1;
	this.canJump = false;
});
Spider.method("handleCollision", function(direction, collision) {
	if(direction === "floor") {
		this.canJump = true;
	}
});
