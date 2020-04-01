function Spear(modifier) {
	MeleeWeapon.call(this, modifier);
	this.name = "spear";
	this.damLow = p.class === "warrior" ? 80 : 70;
	this.damHigh = p.class === "warrior" ? 110 : 100;
	this.range = 60;
	this.power = 3;
};
Spear.extends(MeleeWeapon);
Spear.method("display", function(type) {
	type = type || "item";
	c.save(); {
		if(type !== "attacking") {
			c.translate(-5, 5);
			c.rotate(Math.rad(45));
		}
		else {
			c.translate(0, 5);
			c.scale(1, 1.5);
		}
		c.fillStyle = "rgb(139, 69, 19)";
		c.fillRect(-2, -20, 4, 40);
		c.fillStyle = "rgb(255, 255, 255)";
		c.fillPoly(
			/* pointy part of spear */
			{ x: -6, y: -18 },
			{ x: 0, y: -20 },
			{ x: 6, y: -18 },
			{ x: 0, y: -35 }
		);
	} c.restore();
});
Spear.method("getDesc", function() {
	return [
		{
			content: ((this.modifier === "none") ? "" : this.modifier.substr(0, 1).toUpperCase() + this.modifier.substr(1, this.modifier.length) + " ")
			+ "Spear" +
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
			content: "It's a spear. You can stab people with it",
			font: "10pt Cursive",
			color: "rgb(150, 150, 150)"
		}
	];
});
