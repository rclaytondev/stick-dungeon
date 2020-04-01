function Helmet(modifier) {
	Equipable.call(this, modifier);
	this.name = "helmet";
	this.defLow = (this.modifier === "none") ? 20 : (this.modifier === "empowering" ? 10 : 30);
	this.defHigh = (this.modifier === "none") ? 30 : (this.modifier === "empowering" ? 20 : 40);
	this.healthRegen = (this.modifier === "none") ? 15 : (this.modifier === "empowering" ? 20 : 10);
	this.power = 3;
};
Helmet.extends(Equipable);
Helmet.method("display", function() {
	c.save(); {
		c.translate(0, -7);
		c.scale(0.4, 0.4);

		/* helmet background */
		c.fillStyle = "rgb(170, 170, 170)";
		c.fillRect(-40, -10, 80, 70);
		/* cutout for helmet mask */
		c.beginPath();
		c.polygon(
			-10, 90,
			-10, 40,
			-30, 30,
			-30, -10,
			0, 0,
			30, -10,
			30, 30,
			10, 40,
			10, 90
		);
		c.invertPath();
		c.clip("evenodd");
		/* helmet shape */
		c.fillStyle = "rgb(200, 200, 200)";
		c.fillPoly(
			-60, -40,
			-60, 80,
			-10, 90,
			10, 90,
			60, 80,
			60, -40,
			0, -50
		);

	} c.restore();
});
Helmet.method("getDesc", function() {
	return [
		{
			content: ((this.modifier === "none") ? "" : (this.modifier.substr(0, 1).toUpperCase() + this.modifier.substr(1, Infinity + " "))) + " Helmet of Regeneration",
			color: "rgb(255, 255, 255)",
			font: "bolder 10pt Cursive"
		},
		{
			content: "Defense: " + this.defLow + "-" + this.defHigh,
			color: "rgb(255, 255, 255)",
			font: "10pt monospace"
		},
		{
			content: "Health Regen: " + this.healthRegen + "%",
			color: "rgb(255, 255, 255)",
			font: "10pt monospace"
		},
		{
			content: "This helmet not only shields the user from harm, but also actively heals past wounds.",
			color: "rgb(150, 150, 150)",
			font: "10pt Cursive"
		}
	];
});
