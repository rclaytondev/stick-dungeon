function ShotArrow(x, y, velX, velY, damage, shotBy, element, name) {
	this.x = x;
	this.y = y;
	this.velocity = { x: velX, y: velY };
	this.shotBy = shotBy;
	this.opacity = 1;
	this.damage = damage;
	this.element = element;
	this.name = name;
	this.hitSomething = false;
	this.hitbox = new utils.geom.Rectangle({ left: -1, right: 1, top: -1, bottom: 1 });
};
ShotArrow.method("exist", function() {
	this.update();
	this.display();
});
ShotArrow.method("display", function() {
	var self = this;
	game.dungeon[game.theRoom].render(new RenderingOrderObject(
		function() {
			var angle = Math.atan2(self.velocity.x, self.velocity.y);
			c.save(); {
				c.globalAlpha = Math.max(0, self.opacity);
				c.translate(self.x, self.y);
				c.rotate(Math.rad(90) - angle);
				c.strokeStyle = "rgb(139, 69, 19)";
				c.lineWidth = 4;
				c.strokeLine(-28, 0, 0, 0);
				for(var x = 0; x < 10; x += 3) {
					c.lineWidth = 1;
					c.strokeLine(
						-x - 10, 0,
						-x - 16, -6
					);
					c.strokeLine(
						-x - 10, 0,
						-x - 16, 6
					);
				}
				c.fillStyle = "rgb(255, 255, 255)";
				c.fillPoly(
					0, 0,
					-6, -6,
					14, 0,
					-6, 6
				);
			} c.restore();
		},
		1
	));
});
ShotArrow.method("update", function() {
	if(!this.hitSomething) {
		this.x += this.velocity.x;
		this.y += this.velocity.y;
		this.velocity.y += 0.1;
		if(this.shotBy === "player") {
			game.dungeon[game.theRoom].getInstancesOf(Enemy).forEach((enemy) => {
				if(collisions.objectIntersectsObject(this, enemy)) {
					if(this.ORIGINAL_X === undefined) {
						enemy.hurt(this.damage);
					}
					else {
						enemy.hurt(this.damage + Math.round(Math.dist(this.x, this.ORIGINAL_X) / 50));
					}
					if(["fire", "water", "earth", "air"].includes(this.element)) {
						Weapon.applyElementalEffect(this.element, enemy, (this.velocity.x > 0) ? "right" : "left", { x: this.x, y: this.y }, false);
					}
					this.hitSomething = true;
				}
			});
		}
		else if(game.inRoom === game.theRoom && this.shotBy === "enemy" && collisions.objectIntersectsObject(this, p)) {
			p.hurt(this.damage, this.name);
			this.hitSomething = true;
		}
	}
	else {
		this.opacity -= 0.05;
		if(this.opacity <= 0) {
			this.toBeRemoved = true;
		}
	}
});
ShotArrow.method("handleCollision", function(direction, collision) {
	this.hitSomething = true;
});
