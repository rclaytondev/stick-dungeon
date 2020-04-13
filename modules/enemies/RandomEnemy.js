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
	if(game.dungeon[game.theRoom].getInstancesOf(Decoration).length !== 0) {
		return;
	}
	var possibleEnemies = game.enemies.clone();
	/* Remove enemies that cannot generate in the room */
	possibleEnemies = possibleEnemies.filter(enemy => {
		if(typeof enemy.generationCriteria !== "function") { return true; }
		return enemy.generationCriteria();
	});
	/* If this isn't supposed to be a particular enemy, remove that one */
	possibleEnemies = possibleEnemies.removeAll(this.notEnemy);
	/* Pick an enemy and add it to the game */
	var enemyIndex = possibleEnemies.randomIndex();
	game.dungeon[game.inRoom].content.push(new possibleEnemies[enemyIndex](this.x, this.y - new possibleEnemies[enemyIndex]().hitbox.bottom));

	this.toBeRemoved = true;
});
