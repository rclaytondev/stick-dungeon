function WizardHat(modifier) {
	Equipable.call(this, modifier);
	this.name = "hat";
	this.defLow = (this.modifier === "none") ? 5 : (this.modifier === "empowering" ? 0 : 10);
	this.defHigh = (this.modifier === "none") ? 10 : (this.modifier === "empowering" ? 5 : 15);
	this.manaRegen = (this.modifier === "none") ? 15 : (this.modifier === "empowering" ? 20 : 10);
	this.power = 3;
};
WizardHat.extends(Equipable);
WizardHat.method("display", function() {
	c.fillStyle = "rgb(109, 99, 79)";
	c.fillPoly(
		-30, 20,
		30, 20,
		10, 15,
		0, -20,
		-10, 15
	);
});
WizardHat.method("getDesc", function() {
	return [
		{
			content: ((this.modifier === "none") ? "" : this.modifier.substr(0, 1).toUpperCase() + this.modifier.substr(1, Infinity) + " ") + "Wizard Hat",
			color: "rgb(255, 255, 255)",
			font: "bolder 10pt Cursive"
		},
		{
			content: "Defense: " + this.defLow + "-" + this.defHigh,
			color: "rgb(255, 255, 255)",
			font: "10pt monospace"
		},
		{
			content: "Mana Regen: " + this.manaRegen + "%",
			color: "rgb(255, 255, 255)",
			font: "10pt monospace"
		},
		{
			content: "An old, weathered pointy hat.",
			color: "rgb(150, 150, 150)",
			font: "10pt Cursive"
		}
	];
});
