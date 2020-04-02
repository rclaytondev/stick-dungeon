function Forge(x, y) {
	this.x = x;
	this.y = y;
	this.used = false;
	this.init = false;
	this.particles = [];

	this.DEPTH = 0.99;
};
Forge.method("display", function() {
	/* fire */
	for(var i = 0; i < this.particles.length; i ++) {
		this.particles[i].display();
	}

	var self = this;
	function displayForge() {
		for(var scale = -1; scale <= 1; scale += (1 * 2)) {
			c.save(); {
				c.scale(scale, 1);
				c.fillRect(50, -76, 50, 76);
				c.fillArc(50, -75, 50, Math.rad(-90), Math.rad(0), true);
			} c.restore();
		}
		c.fillRect(-50 - 1, -300 - 1, 100 + 2, 200);
		// c.fillRect(-50, -60, 100, 20);
		c.fillRect(-50, -10, 100, 10);
		for(var x = -30; x <= 30; x += 30) {
			c.fillRect(x - 10, -40 - 1, 20, 40 + 1);
		}
	};
	/* sides of forge */
	game.dungeon[game.theRoom].render(
		new RenderingOrderObject(
			function() {
				// return;
				c.save(); {
					var location = graphics3D.point3D(self.x, self.y, 0.9);
					c.translate(location.x, location.y);
					c.scale(0.9, 0.9);
					c.fillStyle = "rgb(150, 150, 150)";
					displayForge();
				} c.restore();
			},
			0.9
		)
	);
	graphics3D.cube(this.x - 50, this.y - 60, 100, 20, 0.9, this.DEPTH);
	for(var x = -30; x <= 30; x += 30) {
		// c.fillRect(x - 10, -40 - 1, 20, 40 + 1);
		graphics3D.cube(this.x + x - 10, this.y - 40 - 1, 20, 40 + 1, 0.9, this.DEPTH);
	}
	/* front of forge */
	game.dungeon[game.theRoom].render(
		new RenderingOrderObject(
			function() {
				// return;
				c.save(); {
					var location = graphics3D.point3D(self.x, self.y, self.DEPTH);
					c.translate(location.x, location.y);
					c.scale(self.DEPTH, self.DEPTH);
					c.fillStyle = "rgb(110, 110, 110)";
					displayForge();
				} c.restore();
			},
			this.DEPTH
		)
	);
	/* crop out dark gray parts on side of forge */
	graphics3D.plane3D(this.x + 50, this.y - 75, this.x + 50, this.y - 125, 0.9, this.DEPTH, "rgb(150, 150, 150)");
	graphics3D.plane3D(this.x - 50, this.y - 75, this.x - 50, this.y - 125, 0.9, this.DEPTH, "rgb(150, 150, 150)");
});
Forge.method("update", function() {
	if(Math.dist(this.x, p.x) <= 100 && !this.used && p.guiOpen === "none") {
		ui.infoBar.actions.s = "use forge";
		if(io.keys.KeyS) {
			p.guiOpen = "reforge-item";
		}
	}
	for(var i = 0; i < this.particles.length; i ++) {
		this.particles[i].update();
		if(this.particles[i].toBeRemoved) {
			this.particles.splice(i, 1);
			continue;
		}
	}
	if(!this.used) {
		for(var i = 0; i < 5; i ++) {
			this.particles.push(new Particle("rgb(255, 128, 0)", this.x + Math.randomInRange(-50, 50), this.y - 10, Math.randomInRange(-1, 1), Math.randomInRange(-2, 0), 10));
			this.particles.lastItem().z = Math.randomInRange(this.DEPTH - 0.15, this.DEPTH);
		}
		for(var i = 0; i < 5; i ++) {
			this.particles.push(new Particle("rgb(255, 128, 0)", this.x + Math.randomInRange(-50, 50), this.y - 60, Math.randomInRange(-1, 1), Math.randomInRange(-2, 0), 10));
			this.particles.lastItem().z = Math.randomInRange(this.DEPTH - 0.15, this.DEPTH);
		}
	}
});
Forge.method("translate", function(x, y) {
	this.x += x;
	this.y += y;
	for(var i = 0; i < this.particles.length; i ++) {
		var particle = this.particles[i];
		particle.x += x;
		particle.y += y;
	}
});
