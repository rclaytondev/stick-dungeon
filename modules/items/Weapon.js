function Weapon(modifier) {
	Item.call(this);
	this.equipable = false;
	this.modifier = modifier || "none";
	this.element = "none";
	this.particles = [];
};
Weapon.extend(Item);
Weapon.method("displayParticles", function() {
	if(this.element === null || this.element === "none") {
		return;
	}
	for(var i = 0; i < 5; i ++) {
		var color = "rgb(255, 255, 255)"; // default color
		if(this.element === "fire") {
			color = "rgb(255, 128, 0)";
		}
		else if(this.element === "water") {
			color = "rgb(0, 255, 255)";
		}
		else if(this.element === "earth") {
			color = "rgb(0, 255, 0)";
		}
		else if(this.element === "air") {
			color = "rgb(255, 255, 255)";
		}
		this.particles.push(new Particle(
			Math.randomInRange(10, 60),
			Math.randomInRange(10, 60),
			{
				color: color,
				velocity: 2,
				opacity: 0.25,
				size: Math.randomInRange(5, 6)
			}
		));
	}
	game.dungeon[game.theRoom].displayImmediately(function() {
		this.particles.forEach(particle => {
			particle.display();
		})
	}, this);
	this.particles.forEach(particle => { particle.update(); });
	this.particles = this.particles.filter(particle => !particle.toBeRemoved);
});
Weapon.applyElementalEffect = function(element, enemy, direction, location, bonusEffects) {
	/*
	Arguments:
	 - "element": the element of the attacking weapon. ("fire", "water", "earth", "air")
	 - "enemy": the enemy being attacked
	 - "direction": whether the attacking object (whether it be melee weapon, an arrow, or a magic charge) is facing "left" or "right".
	 - "location": the location of the attacking object (melee weapon, arrow, magic charge)
	 - "bonusEffects": whether to increase all the effects by a small amount. (Currently used by elemental magic charges)
	*/
	if(element === "fire") {
		enemy.timeBurning = (enemy.timeBurning <= 0) ? (FPS * (bonusEffects ? 3 : 2)) : enemy.timeBurning;
		enemy.burnDmg = (bonusEffects ? 20 : 10);
	}
	else if(element === "water") {
		enemy.timeFrozen = (enemy.timeFrozen < 0) ? (FPS * (bonusEffects ? 4 : 2)) : enemy.timeFrozen;
	}
	else if(element === "earth" && p.canUseEarth) {
		EarthCrystal.addBoulderAbove(enemy.x, enemy.y);
	}
	else if(element === "air") {
		game.dungeon[game.theRoom].content.push(new WindBurst(location.x, location.y, direction, true));
	}
};
