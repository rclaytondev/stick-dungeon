function Sword(modifier) {
	MeleeWeapon.call(this, modifier);
	this.name = "sword";
	this.damLow = p.class === "warrior" ? 80 : 70;
	this.damHigh = p.class === "warrior" ? 110 : 100;
	this.range = 60;
	this.power = 3;
};
Sword.extends(MeleeWeapon);
Sword.method("display", function(type) {
	type = type || "item";
	c.save(); {
		// debugger;
		c.globalAlpha = Math.max(this.opacity, 0);
		c.fillStyle = "rgb(139, 69, 19)";
		if(type === "holding" || type === "item") {
			c.translate(-20, 20);
			c.rotate(Math.rad(45));
		}
		c.fillPoly(
			/* sword handle */
			{ x: 0, y: 0 },
			{ x: -5, y: -10 },
			{ x: 5, y: -10 }
		);
		c.fillStyle = "rgb(255, 255, 255)";
		c.fillPoly(
			/* sword blade */
			{ x: -3, y: -10 },
			{ x: 3, y: -10 },
			{ x: 0, y: -60 }
		);
		c.globalAlpha = 1;
	} c.restore();
});
Sword.method("getDesc", function() {
	var desc = [
		{
			content: ((this.modifier === "none") ? "" : this.modifier.substr(0, 1).toUpperCase() + this.modifier.substr(1, this.modifier.length) + " ")
			+ "Sword" +
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
			content: "Range: Short",
			font: "10pt monospace",
			color: "rgb(255, 255, 255)"
		},
		{
			content: "Attack Speed: " + this.attackSpeed.substr(0, 1).toUpperCase() + this.attackSpeed.substr(1, Infinity),
			font: "10pt monospace",
			color: "rgb(255, 255, 255)"
		},
		{
			content: "A nice, solid weapon.",
			font: "10pt Cursive",
			color: "rgb(150, 150, 150)"
		}
	];
	return desc;
});
