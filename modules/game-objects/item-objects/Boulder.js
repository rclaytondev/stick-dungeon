function Boulder(x, y, damage) {
	this.x = x;
	this.y = y;
	this.velocity = { x: 0, y: 2 };
	this.damage = damage;
	this.hitSomething = false;
	this.opacity = 1;
	this.hitbox = new utils.geom.Rectangle({ left: -40, right: 40, top: -1, bottom: 1 });
};
Boulder.method("exist", function() {
	var p1b = graphics3D.point3D(this.x - 40, this.y, 0.9);
	var p2b = graphics3D.point3D(this.x + 40, this.y, 0.9);
	var p3b = graphics3D.point3D(this.x, this.y - 100, 0.9);
	var p1f = graphics3D.point3D(this.x - 40, this.y, 1.1);
	var p2f = graphics3D.point3D(this.x + 40, this.y, 1.1);
	var p3f = graphics3D.point3D(this.x, this.y - 100, 1.1);

	/* sides */
	c.globalAlpha = Math.max(this.opacity, 0);
	c.fillStyle = "rgb(150, 150, 150)";
	c.fillPoly(p1b, p2b, p2f, p1f);
	c.fillPoly(p2b, p3b, p3f, p2f);
	c.fillPoly(p1b, p3b, p3f, p1f);

	/* front */
	c.fillStyle = "rgb(110, 110, 110)";
	c.fillPoly(p1f, p2f, p3f);

	if(!this.hitSomething) {
		this.velocity.y += 0.1;
		this.y += this.velocity.y;
		game.dungeon[game.inRoom].content.forEach(obj => {
			if(obj instanceof Block && this.x + 40 > obj.x && this.x - 40 < obj.x + obj.w && this.y > obj.y && this.y < obj.y + 10) {
				this.hitSomeobj = true;
			}
			else if(obj instanceof Enemy && collisions.objectIntersectsObject(this, obj) && !this.hitAnEnemy) {
				obj.hurt(this.damage, true);
				this.hitAnEnemy = true;
			}
			if(game.inRoom === game.theRoom && collisions.objectIntersectsObject(this, p) && !this.hitAPlayer) {
				p.hurt(this.damage, "a chunk of rock");
				this.hitAPlayer = true;
			}
		});
	}
	else {
		this.opacity -= 0.05;
	}
	if(this.opacity < 0) {
		this.toBeRemoved = true;
	}
});
