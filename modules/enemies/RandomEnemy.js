function RandomEnemy(x, y, notEnemy) {
	this.x = x;
	this.y = y;
	this.notEnemy = notEnemy; // use this to specify any enemy BUT a certain enemy
};
RandomEnemy.method("update", function() {
	if(!this.toBeRemoved) {
		this.generate();
	}
});
RandomEnemy.method("generate", function() {
	if(game.enemies.length === 0) {
		if(debugging.settings.DEBUGGING_MODE) {
			/* the developer has probably emptied the enemy array to remove enemies from the game (no error necessary) */
			this.toBeRemoved = true;
			return;
		}
		else {
			/* there are no enemies to generate; this isn't supposed to ever happen in-game -> throw error */
			throw new Error("No enemies were found that could be generated.");
		}
	}
	/* Wait until the decorations are resolved before generating enemy */
	for(var i = 0; i < game.dungeon[game.theRoom].content.length; i ++) {
		if(game.dungeon[game.theRoom].content[i] instanceof Decoration) {
			return; // wait until the decorations resolve before deciding which enemy
		}
	}
	var possibleEnemies = game.enemies.clone();
	/* Remove dragonlings + trolls if they are in a room where they wouldn't match the decorations */
	for(var i = 0; i < game.dungeon[game.theRoom].content.length; i ++) {
		if(game.dungeon[game.theRoom].content[i] instanceof Torch) {
			for(var j = 0; j < possibleEnemies.length; j ++) {
				if(possibleEnemies[j] === Dragonling) {
					possibleEnemies.splice(j, 1);
					break;
				}
			}
			break;
		}
		else if(game.dungeon[game.theRoom].content[i] instanceof Banner) {
			for(var j = 0; j < possibleEnemies.length; j ++) {
				if(possibleEnemies[j] === Troll) {
					possibleEnemies.splice(j, 1);
					break;
				}
			}
		}
	}
	/* If this isn't supposed to be a particular enemy, remove that one */
	for(var i = 0; i < possibleEnemies.length; i ++) {
		if(possibleEnemies[i] === this.notEnemy) {
			possibleEnemies.splice(i, 1);
			break;
		}
	}
	/* Pick an enemy and add it to the game */
	var enemyIndex = possibleEnemies.randomIndex();
	game.dungeon[game.inRoom].content.push(new possibleEnemies[enemyIndex](this.x, this.y - new possibleEnemies[enemyIndex]().hitbox.bottom));

	this.toBeRemoved = true;
});
