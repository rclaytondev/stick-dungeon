function Torch(x, y) {
	this.x = x;
	this.y = y;
	this.lit = false;
	this.fireParticles = [];
};
Torch.method("display", function() {
	graphics3D.cube(this.x - 5, this.y - 20, 10, 20, 0.9, 0.95);
	graphics3D.cube(this.x - 10, this.y - 25, 20, 6, 0.9, 0.97);
	var self = this;
	game.dungeon[game.theRoom].render(
		new RenderingOrderObject(
			function() {
				game.dungeon[game.theRoom].displayImmediately(function() {
					for(var i = 0; i < self.fireParticles.length; i ++) {
						self.fireParticles[i].display();
					}
				});
			},
			0.97,
			1
		)
	);
});
Torch.method("update", function() {
	if(this.color === "?" || this.color === undefined) {
		if(game.dungeon[game.theRoom].colorScheme === "red") {
			this.color = "rgb(255, 128, 0)";
		}
		else if(game.dungeon[game.theRoom].colorScheme === "green") {
			this.color = "rgb(0, 255, 0)";
		}
		else {
			this.color = "rgb(0, 255, 255)";
		}
	}

	if(Math.dist(this.x, p.x) < 10) {
		this.lit = true;
	}
	if(this.lit) {
		this.fireParticles.push(new Particle(this.color, this.x, this.y - 27, Math.random(), Math.randomInRange(-3, 0), Math.randomInRange(5, 10)));
		this.fireParticles.lastItem().z = Math.randomInRange(0.94, 0.96);
	}
	for(var i = 0; i < this.fireParticles.length; i ++) {
		this.fireParticles[i].update();
	}
	this.fireParticles = this.fireParticles.filter(function(particle) { return !particle.toBeRemoved; });
});
Torch.method("translate", function(x, y) {
	this.x += x;
	this.y += y;
	for(var i = 0; i < this.fireParticles.length; i ++) {
		var particle = this.fireParticles[i];
		particle.x += x;
		particle.y += y;
	}
});
