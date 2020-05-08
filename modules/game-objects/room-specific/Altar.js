function Altar(x, y, type) {
	/* Only represents the particles of the altar. The actual stairs + platform are created using Blocks and Stairs. */
	this.x = x;
	this.y = y;
	this.type = type;
	this.particles = [];
	this.used = false;
};
Altar.method("update", function() {
	var self = this;
	if(!this.used && p.x + p.hitbox.right > this.x - 20 && p.x + p.hitbox.left < this.x + 20 && p.y + p.hitbox.bottom > this.y - 20 && p.y + p.hitbox.top < this.y + 20) {
		if(this.type === "health") {
			p.health += 10;
			p.maxHealth += 10;
		}
		else if(this.type === "mana") {
			p.mana += 10;
			p.maxMana += 10;
		}
		this.used = true;
		this.particles.forEach(particle => {
			particle.opacityDecay = 0;

			particle.movement = "seek";
			particle.velocity = { x: 0, y: Math.dist(particle.x, particle.y, this.x - 50, this.y + 50) / 5 }; // speed of 5 when moving toward health bar
			if(this.type === "health") {
				/* move particles to player health bar */
				particle.destination = { x: 662.5, y: 25 };
			}
			else if(this.type === "mana") {
				particle.destination = { x: 662.5, y: 62.5 };
			}

			particle.absolutePosition = true;
			particle.x += game.camera.getOffsetX();
			particle.y += game.camera.getOffsetY();

			particle.removalCriteria = function() {
				return Math.dist(this.x, this.y, this.destination.x, this.destination.y) <= Math.dist(0, 0, this.velocity.x, this.velocity.y);
			};
			particle.remove = function() {
				if(self.type === "health") {
					p.healthBarAnimation = 1;
				}
				else if(self.type === "mana") {
					p.manaBarAnimation = 1;
				}
			};

			game.dungeon[game.theRoom].content = game.dungeon[game.theRoom].content.concat(this.particles);
			this.particles = [];
		});
	}
	this.particles.forEach(particle => { particle.update(); });
	this.particles = this.particles.filter(particle => particle.opacity > 0);
});
Altar.method("display", function() {
	if(!this.used) {
		for(var i = 0; i < 5; i ++) {
			var location = Math.randomPointInCircle(this.x, this.y, 30)
			this.particles.push(new Particle(
				location.x, location.y,
				{
					color: (this.type === "health") ? "rgb(255, 0, 0)" : "rgb(0, 0, 255)",
					brightnessVariance: 30,
					shape: "polygon-3",
					velocity: 1,
					size: 15
				}
			));
		}
	}
	this.particles.forEach(particle => { particle.display(); });
});
Altar.method("remove", function() {
	game.dungeon[game.theRoom].content = game.dungeon[game.theRoom].content.concat(this.particles);
});
Altar.method("translate", function(x, y) {
	this.x += x;
	this.y += y;
	this.particles.filter(particle => !particle.absolutePosition).forEach(particle => {
		particle.x += x, particle.y += y;
	})
});
