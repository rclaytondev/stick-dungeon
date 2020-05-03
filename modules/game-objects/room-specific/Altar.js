function Altar(x, y, type) {
	/* Only represents the particles of the altar. The actual stairs + platform are created using Blocks and Stairs. */
	this.x = x;
	this.y = y;
	this.type = type;
	this.particles = [];
};
Altar.method("update", function() {
	if(p.x + p.hitbox.right > this.x - 20 && p.x + p.hitbox.left < this.x + 20 && p.y + p.hitbox.bottom > this.y - 20 && p.y + p.hitbox.top < this.y + 20) {
		if(this.type === "health") {
			p.health += 10;
			p.maxHealth += 10;
		}
		else if(this.type === "mana") {
			p.mana += 10;
			p.maxMana += 10;
		}
		this.toBeRemoved = true;
	}
	this.particles.forEach(particle => { particle.update(); });
	this.particles = this.particles.filter(particle => particle.opacity > 0);
});
Altar.method("display", function() {
	for(var i = 0; i < 5; i ++) {
		this.particles.push(new Particle(
			this.x + Math.randomInRange(-20, 20),
			this.y + Math.randomInRange(-20, 20),
			{
				color: (this.type === "health") ? "rgb(255, 0, 0)" : "rgb(0, 0, 255)",
				velocity: 1,
				size: 10
			}
		));
	}
	this.particles.forEach(particle => { particle.display(); });
});
Altar.method("remove", function() {
	game.dungeon[game.theRoom].content = game.dungeon[game.theRoom].content.concat(this.particles);
});
Altar.method("translate", function(x, y) {
	this.x += x;
	this.y += y;
	this.particles.forEach(particle => {
		particle.x += x, particle.y += y;
	})
});
