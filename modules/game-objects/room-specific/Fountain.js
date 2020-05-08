function Fountain(x, y, color) {
	this.x = x;
	this.y = y;
	this.waterAnimations = [];
	for(var y = -50; y < 225; y += 30) {
		this.waterAnimations.push({ x: Math.randomInRange(-50, 50), y: y });
	}
	this.color = color || null;
};
Fountain.method("display", function() {
	/* water slot */
	graphics3D.cutoutRect(this.x - 50, this.y - 160, 100, 10, "rgba(0, 0, 0, 0)", "rgba(150, 150, 150)", 0.8, 0.9);

	var center = graphics3D.point3D(this.x, this.y, 0.9);
	game.dungeon[game.theRoom].setRenderingStyle(function() {
		c.beginPath();
		c.rect(center.x - (50 * 0.9), center.y - (160 * 0.9), (100 * 0.9), (160 * 0.9));
		c.clip();
	});
	c.save(); {
		/* water */
		graphics3D.cube(this.x - 50, this.y - 150, 100, 10, 0.8, 0.92, this.color1, this.color1);
		graphics3D.cube(this.x - 50, this.y - 150, 100, 150, 0.9, 0.92, "rgba(0, 0, 0, 0)", this.color1);
		graphics3D.cube(this.x - 50, this.y - 150, 100, 150, 0.9, 0.92, this.color1, this.color1);
		/*
		Each water graphic's y-value is on a scale from 0 to 250. Each one is 50 tall. The corner of the fountain is at 100, so any value less than 100 is on the horizontal section and anything greater than 100 is on the vertical section.
		*/
		var self = this;
		const HORIZONTAL_FOUNTAIN_HEIGHT = 100;
		const TOTAL_FOUNTAIN_HEIGHT = 250;
		const WATER_ANIMATION_HEIGHT = 50;
		function displayWaterGraphic(p1, p2) {
			/*
			This function uses currying to avoid the problem that arises when creating functions in loops where the function only has access to the current value of the loop variable, instead of being able to take a snapshot of that value.
			*/
			return function() {
				c.strokeStyle = self.color2;
				c.lineWidth = 3;
				c.strokeLine(p1, p2);
			};
		};
		function calculatePosition(x, y) {
			/*
			Returns the three-dimensional location of a water animation at ('x', 'y')
			*/
			if(y < HORIZONTAL_FOUNTAIN_HEIGHT) {
				return {
					x: self.x + x,
					y: self.y - 150,
					z: Math.map(y, 0, HORIZONTAL_FOUNTAIN_HEIGHT, 0.8, 0.92)
				};
			}
			else {
				return {
					x: self.x + x,
					y: self.y - 150 + Math.map(y, HORIZONTAL_FOUNTAIN_HEIGHT, TOTAL_FOUNTAIN_HEIGHT, 0, 150),
					z: 0.92
				};
			}
		};
		this.waterAnimations = this.waterAnimations.filter(waterAnimation => waterAnimation.y <= 225);
		this.waterAnimations.forEach(waterAnimation => {
			var topY = waterAnimation.y;
			var bottomY = waterAnimation.y + 50;
			var p1 = calculatePosition(waterAnimation.x, waterAnimation.y);
			var corner = calculatePosition(waterAnimation.x, HORIZONTAL_FOUNTAIN_HEIGHT);
			var p2 = calculatePosition(waterAnimation.x, waterAnimation.y + 50);
			p1.z = Math.constrain(p1.z, 0.8, 0.92);
			p2.z = Math.constrain(p2.z, 0.8, 0.92);
			if(topY < HORIZONTAL_FOUNTAIN_HEIGHT && bottomY > HORIZONTAL_FOUNTAIN_HEIGHT) {
				game.dungeon[game.theRoom].render(new RenderingOrderObject(
					displayWaterGraphic(graphics3D.point3D(p1.x, p1.y, p1.z), graphics3D.point3D(corner.x, corner.y, corner.z)),
					p1.z,
					1
				));
				game.dungeon[game.theRoom].render(new RenderingOrderObject(
					displayWaterGraphic(graphics3D.point3D(corner.x, corner.y - 1, corner.z), graphics3D.point3D(p2.x, p2.y, p2.z)),
					corner.z,
					1
				));
			}
			else {
				game.dungeon[game.theRoom].render(new RenderingOrderObject(
					displayWaterGraphic(graphics3D.point3D(p1.x, p1.y, p1.z), graphics3D.point3D(p2.x, p2.y, p2.z)),
					Math.min(p1.z, p2.z),
					1
				));
			}
		});
	} c.restore();
	/* base */
	game.dungeon[game.theRoom].clearRenderingStyle();
	graphics3D.cube(this.x - 100, this.y - 50, 10, 50, 0.9, 1);
	graphics3D.cube(this.x + 90, this.y - 50, 10, 50, 0.9, 1);
	graphics3D.cube(this.x - 100, this.y - 50, 200, 50, 0.98, 1);
});
Fountain.method("update", function() {
	if(this.color === null) {
		this.color = game.dungeon[game.theRoom].colorScheme;
		const COLORS_1 = {
			"red": "rgb(255, 128, 0)",
			"green": "rgb(0, 255, 100)",
			"blue": "rgb(100, 100, 255)"
		};
		this.color1 = COLORS_1[this.color];
		const COLORS_2 = {
			"red": "rgb(255, 158, 30)",
			"green": "rgb(0, 220, 70)",
			"blue": "rgb(120, 120, 255)"
		};
		this.color2 = COLORS_2[this.color];
	}
	this.waterAnimations.forEach(waterAnimation => { waterAnimation.y += 2; });
	if(utils.frameCount % 15 === 0) {
		this.waterAnimations.push( {x: Math.randomInRange(-50, 50), y: -50} );
	}
});
