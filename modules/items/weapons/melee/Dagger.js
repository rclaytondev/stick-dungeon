function Dagger(modifier) {
	MeleeWeapon.call(this, modifier);
	this.name = "dagger";
	this.damLow = p.class === "warrior" ? 60 : 50;
	this.damHigh = p.class === "warrior" ? 80 : 70;
	this.range = 30;
	this.power = 2;
};
Dagger.extend(MeleeWeapon);
Dagger.method("getDesc", function() {
	var desc = [
		{
			content: ((this.modifier === "none") ? "" : this.modifier.substr(0, 1).toUpperCase() + this.modifier.substr(1, this.modifier.length) + " ")
			+ "Dagger" +
			((this.element === "none") ? "" : (" of " + this.element.substr(0, 1).toUpperCase() + this.element.substr(1, this.element.length))),
			font: "bold 10pt Cursive",
			color: "rgb(255, 255, 255)"
		},
		{
			content: "Damage: " + this.damLow + "-" + this.damHigh,
			font: "10pt monospace",
			color: "rgb(255, 255, 255)"
		},
		{
			content: "Range: Very Short",
			font: "10pt monospace",
			color: "rgb(255, 255, 255)"
		},
		{
			content: "Attack Speed: " + this.attackSpeed.substr(0, 1).toUpperCase() + this.attackSpeed.substr(1, Infinity),
			font: "10pt monospace",
			color: "rgb(255, 255, 255)"
		},
		{
			content: "A small dagger, the kind used for stabbing in the dark.",
			font: "10pt Cursive",
			color: "rgb(150, 150, 150)"
		}
	];
	return desc;
});
Dagger.method("display", function(type) {
	type = type || "item";
	c.fillStyle = "rgb(139, 69, 19)";
	if(type !== "attacking") {
		c.translate(-13, 13);
		c.rotate(Math.rad(45));
	}
	c.fillPoly(
		/* dagger hilt */
		{ x: -1, y: -3 },
		{ x: 1, y: -3 },
		{ x: 3, y: -10 },
		{ x: -3, y: -10 }
	);
	c.fillStyle = "rgb(255, 255, 255)";
	c.fillPoly(
		/* dagger blade */
		{ x: -3, y: -10 },
		{ x: 3, y: -10 },
		{ x: 0, y: -30 }
	);
});
