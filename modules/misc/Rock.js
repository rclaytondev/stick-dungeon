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
	if(!this.hitSomething) {
		c.save(); {
			c.globalAlpha = this.opacity;
			c.fillStyle = "rgb(140, 140, 140)";
			c.fillCircle(this.x, this.y, 20);
		} c.restore();
	}
	else {
		c.save(); {
			c.fillStyle = "rgb(140, 140, 140)";
			for(var i = 0; i < this.fragments.length; i ++) {
				c.globalAlpha = this.fragments[i].opacity;
				c.fillCircle(this.fragments[i].x, this.fragments[i].y, 5);
			}
		} c.restore();
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
			for(var i = 0; i < this.fragments.length; i ++) {
				this.fragments[i].x += this.fragments[i].velocity.x;
				this.fragments[i].y += this.fragments[i].velocity.y;
				this.fragments[i].velocity.y += 0.1;
				this.fragments[i].opacity -= 0.05;
				if(this.fragments[i].opacity <= 0) {
					this.toBeRemoved = true;
				}
			}
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
	for(var i = 0; i < this.fragments.length; i ++) {
		var particle = this.fragments[i];
		particle.x += x;
		particle.y += y;
	}
});
