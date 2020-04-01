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
	for(var i = 0; i < this.particles.length; i ++) {
		this.particles[i].update();
		if(this.particles[i].opacity <= 0) {
			this.particles.splice(i, 1);
			continue;
		}
	}
});
Altar.method("display", function() {
	for(var i = 0; i < 5; i ++) {
		this.particles.push(new Particle(this.type === "health" ? "rgb(255, 0, 0)" : "rgb(0, 0, 255)", this.x + Math.randomInRange(-20, 20), this.y + Math.randomInRange(-20, 20), Math.randomInRange(-1, 1), Math.randomInRange(-1, 1), 10));
	}
	for(var i = 0; i < this.particles.length; i ++) {
		this.particles[i].display();
	}
});
Altar.method("remove", function() {
	game.dungeon[game.theRoom].content = game.dungeon[game.theRoom].content.concat(this.particles);
});
Altar.method("translate", function(x, y) {
	this.x += x;
	this.y += y;
	for(var i = 0; i < this.particles.length; i ++) {
		var particle = this.particles[i];
		particle.x += x;
		particle.y += y;
	}
});
