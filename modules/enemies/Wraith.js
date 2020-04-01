function Wraith(x, y) {
	Enemy.call(this, x, y);
	this.particles = [];
	this.timeSinceAttack = 0;

	/* hitbox */
	this.hitbox = new utils.geom.Rectangle({
		left: -50,
		right: 50,
		top: -50,
		bottom: 50
	});

	/* stats */
	this.health = 150;
	this.maxHealth = 150;
	this.damLow = 40;
	this.damHigh = 50;
	this.defLow = 40;
	this.defHigh = 50;
	this.complexAttack = true;
	this.name = "a wraith of shadow";
};
Wraith.extends(Enemy);
Wraith.method("display", function() {
	/* particle graphics */
	for(var i = 0; i < this.particles.length; i ++) {
		this.particles[i].display();
		if(this.particles[i].opacity <= 0) {
			this.particles.splice(i, 1);
		}
	}
	for(var i = 0; i < 10; i ++) {
		var pos = Math.randomInRange(0, 50);
		this.particles.push(new Particle("rgb(0, 0, 0)", this.x + Math.randomInRange(-pos, pos), this.y + 50 - pos * 2, Math.randomInRange(-1, 1), Math.randomInRange(-1, 1), Math.randomInRange(6, 10)));
		this.particles.push(new Particle("rgb(255, 0, 0)", this.x - 10, this.y - 25, Math.randomInRange(0, 0.5), Math.randomInRange(0, 0.5), Math.randomInRange(2, 4)));
		this.particles.push(new Particle("rgb(255, 0, 0)", this.x + 10, this.y - 25, Math.randomInRange(0, 0.5), Math.randomInRange(0, 0.5), Math.randomInRange(2, 4)));
	}
});
Wraith.method("update", function(dest) {
	this.timeFrozen = 0; // wraiths are immune to these effects
	this.timeBurning = 0;

	if(dest === "player") {
		/* movement */
		if(Math.dist(this.x, this.y, p.x, p.y) <= 100) {
			var idealX = (this.x < p.x) ? p.x - 150 : p.x + 150;
			this.x += (idealX - this.x) / 60;
		}
		this.timeSinceAttack ++;
	}
	else {
		this.x = (this.x < dest.x) ? this.x + 2 : this.x - 2;
		this.y = (this.y < dest.y) ? this.y + 2 : this.y - 2;
	}

	this.particles.forEach((particle) => { particle.update(); });
});
Wraith.method("attack", function() {
	/* attacking */
	if(this.timeSinceAttack > 60) {
		var velocity = Math.normalize(p.x - (this.x), p.y - (this.y));
		velocity.x *= 10;
		velocity.y *= 10;
		game.dungeon[game.theRoom].content.push(new MagicCharge(this.x, this.y, velocity.x, velocity.y, "shadow", Math.randomInRange(this.damLow, this.damHigh)));
		this.timeSinceAttack = 0;
	}
});
Wraith.method("handleCollision", function(direction, collision) {

});
Wraith.method("translate", function(x, y) {
	this.x += x;
	this.y += y;
	for(var i = 0; i < this.particles.length; i ++) {
		var particle = this.particles[i];
		particle.x += x;
		particle.y += y;
	}
});
