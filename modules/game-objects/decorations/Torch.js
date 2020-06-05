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
					self.fireParticles.forEach(particle => { particle.display(); });
				}, null, true);
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
		this.fireParticles.push(new Particle(
			this.x, this.y - 27,
			{
				color: this.color,
				velocity: {
					x: Math.random(),
					y: Math.randomInRange(-3, 0),
				},
				size: Math.randomInRange(5, 10),
				depth: Math.randomInRange(0.94, 0.96)
			}
		));
	}
	this.fireParticles.forEach(particle => { particle.update(); });
	this.fireParticles = this.fireParticles.filter(particle => !particle.toBeRemoved);
});
Torch.method("translate", function(x, y) {
	this.x += x;
	this.y += y;
	this.fireParticles.forEach(particle => {
		particle.x += x, particle.y += y;
	})
});
