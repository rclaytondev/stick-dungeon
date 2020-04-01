function Crystal() {
	Extra.call(this);
	this.consumed = false;
};
Crystal.extends(Extra);
Crystal.method("graphics", function(type) {
	/* called in the subclass's method 'display' */
	if(type === "holding") {
		c.translate(0, 13);
	}
	c.lineWidth = 2;

	/* crystal shape / outline */
	c.beginPath();
	c.polygon(
		/* lower half of crystal */
		0, 0,
		-15, -15,
		15, -15
	);
	c.polygon(
		/* upper half of crystal */
		-15, -15,
		0, -15 - 8,
		15, -15
	);
	c.fill();
	c.stroke();
	/* inner lines inside crystal */
	c.strokePoly(
		0, 0,
		-8, -15,
		8, -15
	);
	c.strokePoly(
		-8, -15,
		0, -15 - 8,
		8, -15
	);
	c.strokeLine(0, 0, 0, -23);
});
Crystal.method("use", function() {
	p.guiOpen = "crystal-infusion";
	p.infusedGui = (this instanceof FireCrystal || this instanceof WaterCrystal) ? (this instanceof FireCrystal ? "fire" : "water") : (this instanceof EarthCrystal ? "earth" : "air");
	this.toBeConsumed = true;
});
