function WindBurst(x, y, dir, noDisplay) {
	this.x = x;
	this.y = y;
	this.dir = dir;
	this.velocity = {
		x: (dir === "right" ? 5 : -5),
		y: 0
	};
	this.noDisplay = noDisplay || false;
	this.opacity = 1;
	if(dir === "right") {
		this.hitbox = new utils.geom.Rectangle({ left: 0, right: 49, top: -34, bottom: 0 });
	}
	else {
		this.hitbox = new utils.geom.Rectangle({ left: -49, right: 0, top: -34, bottom: 0 });
	}
};
WindBurst.method("exist", function() {
	this.display();
	this.update();
});
WindBurst.method("display", function() {
	if(this.noDisplay) {
		return;
	}
	c.save(); {
		c.globalAlpha = Math.max(this.opacity, 0);
		c.strokeStyle = "rgb(150, 150, 150)";
		c.lineWidth = 4;
		c.translate(this.x, this.y);
		c.scale(this.dir === "right" ? -1 : 1, 1);
		/* large wind graphic */
		c.strokeLine(0, 0, 32, 0);
		c.strokeArc(17, 0 - 17, 17, Math.rad(90), Math.rad(360));
		/* small wind graphic */
		c.strokeLine(0, 0 - 5, 30, 0 - 5);
		c.strokeArc(17, 0 - 12, 7, Math.rad(90), Math.rad(360));
	} c.restore();
});
WindBurst.method("update", function() {
	this.x += this.velocity.x;
	this.velocity.x *= 0.98;
	this.opacity -= 0.05;
	game.dungeon[game.inRoom].getInstancesOf(Enemy).filter(enemy => !(enemy instanceof Wraith)).forEach(enemy => {
		if(collisions.objectIntersectsObject(this, enemy)) {
			enemy.velocity.x = (this.dir === "left") ? -3 : 3;
			enemy.x += this.velocity.x;
			collisions.collisions.filter(collision => collision.settings.creator !== enemy).forEach(collision => {
				while(collision.intersectsRect(enemy.x + enemy.hitbox.left, enemy.y + enemy.hitbox.top, enemy.hitbox.right - enemy.hitbox.left, enemy.hitbox.bottom - enemy.hitbox.top, 5)) {
					var oppositeDirection = Math.normalize(this.velocity.x, this.velocity.y);
					oppositeDirection.x *= -1, oppositeDirection.y *= -1;
					enemy.x += oppositeDirection.x, enemy.y += oppositeDirection.y;
				}
			});
		}
	});
	if(this.opacity < 0) {
		this.toBeRemoved = true;
	}
});
