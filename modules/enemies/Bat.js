function Bat(x, y) {
	Enemy.call(this, x, y);
	this.wings = 0;
	this.wingDir = 4;

	/* hitbox */
	this.hitbox = new utils.geom.Rectangle({
		left: -53,
		right: 53,
		top: -12,
		bottom: 12
	});

	/* stats */
	this.health = 50;
	this.maxHealth = 50;
	this.defLow = 20;
	this.defHigh = 30;
	this.damLow = 20;
	this.damHigh = 30;
	this.name = "a bat";
};
Bat.extends(Enemy);
Bat.method("display", function() {
	var self = this;
	game.dungeon[game.theRoom].render(new RenderingOrderObject(
		function() {
			c.globalAlpha = Math.constrain(self.opacity, 0, 1);
			c.fillStyle = "rgb(0, 0, 0)";
			c.fillCircle(self.x, self.y, 10);

			c.fillStyle = "rgb(255, 0, 0)";
			c.fillCircle(self.x - 2, self.y - 4, 2);
			c.fillCircle(self.x + 2, self.y - 4, 2);

			c.fillStyle = "rgb(0, 0, 0)";
			for(var scale = -1; scale <= 1; scale += 2) {
				c.save(); {
					c.translate(self.x + (5 * scale), self.y);
					c.rotate(Math.rad(self.wings * scale));
					c.scale(scale, 1);
					c.fillPoly(
						0, 0,
						10, -10,
						50, 0,
						10, 10
					);
				} c.restore();
			}
		},
		1
	));
});
Bat.method("update", function(dest) {
	this.wings += this.wingDir;
	if(this.wings > 5) {
		this.wingDir = -5;
	}
	else if(this.wings < -15) {
		this.wingDir = 5;
	}
	if(dest === "player") {
		if(this.x < p.x) {
			this.velocity.x += 0.1;
		}
		else if(this.x > p.x) {
			this.velocity.x -= 0.1;
		}
		if(this.y < p.y) {
			this.velocity.y += 0.1;
		}
		else if(this.y > p.y) {
			this.velocity.y -= 0.1;
		}
		this.x += this.velocity.x;
		this.y += this.velocity.y;
	}
	else {
		if(this.x < dest.x) {
			this.velocity.x += 0.1;
		}
		else if(this.x > dest.x) {
			this.velocity.x -= 0.1;
		}
		if(this.y < dest.y) {
			this.velocity.y += 0.1;
		}
		else if(this.y > dest.y) {
			this.velocity.y -= 0.1;
		}
		this.x += this.velocity.x;
		this.y += this.velocity.y;
	}
});
Bat.method("handleCollision", function(direction, platform) {
	if(direction === "floor") {
		this.velocity.y = -Math.abs(this.velocity.y);
	}
	else if(direction === "ceiling") {
		this.velocity.y = Math.abs(this.velocity.y);
	}
	else if(direction === "wall-to-left") {
		this.velocity.x = Math.abs(this.velocity.x);
	}
	else if(direction === "wall-to-right") {
		this.velocity.x = -Math.abs(this.velocity.x);
	}
});
