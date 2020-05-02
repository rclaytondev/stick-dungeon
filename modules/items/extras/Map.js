function Map() {
	Extra.call(this);
};
Map.extend(Extra);
Map.method("display", function() {
	c.save(); {

		c.fillStyle = "rgb(255, 255, 200)";
		c.fillRect(-20, -20, 40, 40);

		c.fillStyle = "rgb(255, 0, 0)";
		c.fillText("x", 10, -10);

		c.strokeStyle = "rgb(0, 0, 0)";
		c.setLineDash([3, 3]);
		c.lineWidth = 1;
		c.strokeLine(
			10, -5,
			10, 5,
			-5, 5,
			-20, 20
		)
	} c.restore();
});
Map.method("getDesc", function() {
	return [
		{
			content: "Map",
			font: "bolder 10pt Cursive",
			color: "rgb(255, 255, 255)"
		},
		{
			content: "Shows you the way",
			font: "10pt monospace",
			color: "rgb(255, 255, 255)"
		},
		{
			content: "Dead ends are marked with x's. Unexplored doors are marked with a '?'. Doors eventually leading to unexplored doors are marked with arrows.",
			font: "10pt Cursive",
			color: "rgb(150, 150, 150)"
		}
	];
});
