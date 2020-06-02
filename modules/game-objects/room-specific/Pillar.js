function Pillar(x, y, h) {
	this.x = x;
	this.y = y;
	this.h = h;
};
Pillar.method("display", function() {
	/* Base */
	graphics3D.cube(this.x - 30, this.y - 20, 60, 10, 0.9, 1.1, null, null, { obscuresLight: true, lightBlockingEdges: ["left", "right", "top"] });
	graphics3D.cube(this.x - 40, this.y - 10, 80, 10, 0.9, 1.1, null, null, { obscuresLight: true, lightBlockingEdges: ["left", "right", "top"] });
	/* Top */
	graphics3D.cube(this.x - 41, this.y - this.h, 80, 12, 0.9, 1.1, null, null, { obscuresLight: true, obscurity: 0.5 });
	graphics3D.cube(this.x - 30, this.y - this.h + 10, 60, 10, 0.9, 1.1, null, null, { obscuresLight: true, obscurity: 0.5, lightBlockingEdges: ["left", "right", "bottom"] });
	/* Pillar */
	var pillarObscuresLight = (Math.dist(this.x, p.x + game.camera.getOffsetX()) > 30);
	graphics3D.cube(this.x - 20, this.y - this.h + 20, 40, this.h - 40, 0.95, 1.05, null, null, { obscuresLight: pillarObscuresLight, obscurity: 0.5 });
	/* manual override to make sure enemies and stuff get displayed in front of the pillar (even though the pillar is technically in front) */
	game.dungeon[game.theRoom].renderingObjects.lastItem().depth = 1;
	game.dungeon[game.theRoom].renderingObjects.lastItem().zOrder = -1;
});
Pillar.method("update", function() {
	/* Base collisions */
	collisions.solids.rect(this.x - 30, this.y - 20, 60, 21, {illegalHandling: "teleport"});
	collisions.solids.rect(this.x - 40, this.y - 10, 80, 10, {illegalHandling: "teleport"});
	/* Top collisions */
	collisions.solids.rect(this.x - 41, this.y - this.h, 80, 12);
	collisions.solids.rect(this.x - 30, this.y - this.h + 10, 60, 10);
});
