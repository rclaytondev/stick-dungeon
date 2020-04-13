function Rock(x, y, velX, velY) {
	this.x = x;
	this.y = y;
	this.velocity = { x: velX, y: velY };
	this.hitSomething = false;
	this.hitPlayer = false;
	this.opacity = 1;
	this.fragments = [];
	this.hitbox = new utils.geom.Rectangle({ left: -20, right: 20, top: -20, bottom: 20 });
};
Rock.method("display", function() {
	var self = this;
	if(!this.hitSomething) {
		c.save(); {
			game.dungeon[game.theRoom].render(new RenderingOrderObject(
				function() {
					c.globalAlpha = self.opacity;
					c.fillStyle = "rgb(140, 140, 140)";
					c.fillCircle(self.x, self.y, 20);
				},
				1
			))
		} c.restore();
	}
	else {
		game.dungeon[game.theRoom].render(new RenderingOrderObject(
			function() {
				c.fillStyle = "rgb(140, 140, 140)";
				self.fragments.forEach(fragment => {
					c.globalAlpha = fragment.opacity;
					c.fillCircle(fragment.x, fragment.y, 5);
				});
			},
			1
		));
	}
});
Rock.method("update", function() {
	if(!this.hitSomething) {
		this.x += this.velocity.x;
		this.y += this.velocity.y;
		this.velocity.y += 0.1;
	}
	else {
		c.save(); {
			c.fillStyle = "rgb(140, 140, 140)";
			this.fragments.forEach(fragment => {
				fragment.x += fragment.velocity.x;
				fragment.y += fragment.velocity.y;
				fragment.velocity.y += 0.1;
				fragment.opacity -= 0.05;
				if(fragment.opacity <= 0) {
					this.toBeRemoved = true;
				}
			});
		} c.restore();
	}
	if(!this.hitPlayer && collisions.objectIntersectsObject(this, p)) {
		p.hurt(Math.randomInRange(40, 50), "a troll");
		this.hitPlayer = true;
	}
});
Rock.method("handleCollision", function(direction, collision) {
	if(!this.hitSomething) {
		this.hitSomething = true;
		for(var j = 0; j < 10; j ++) {
			this.fragments.push({
				x: this.x + (Math.randomInRange(-5, 5)), y: this.y + (Math.randomInRange(-5, 5)),
				velocity: {
					x: Math.randomInRange(-1, 1),
					y: Math.randomInRange(-1, 1)
				},
				opacity: 2
			});
		}
	}
});
Rock.method("translate", function(x, y) {
	this.x += x;
	this.y += y;
	this.fragments.forEach(fragment => {
		fragment.x += x, fragment.y += y;
	})
});
