function Roof(x, y, w) {
	this.x = x;
	this.y = y;
	this.w = w;
	this.type = null;
};
Roof.method("update", function() {
	if(this.type === null) {
		this.type = ["none", "flat", "sloped", "curved"].randomItem();
		if(debugging.settings.DEBUGGING_MODE && debugging.settings.CEILING_TYPE !== null) {
			this.type = debugging.settings.CEILING_TYPE;
		}
	}
	if(this.type === "flat") {
		collisions.solids.rect(-Border.LARGE_NUMBER, this.y - 100 - Border.LARGE_NUMBER, Border.LARGE_NUMBER * 2, Border.LARGE_NUMBER);
	}
	else if(this.type === "sloped") {
		collisions.solids.line(this.x - this.w, this.y, this.x - (this.w / 3), this.y - 100, { illegalHandling: "collide" });
		collisions.solids.line(this.x + this.w, this.y, this.x + (this.w / 3), this.y - 100, { illegalHandling: "collide" });
		collisions.solids.rect(this.x - this.w, this.y - 200, 2 * this.w, 100, { illegalHandling: "collide" });
	}
	else if(this.type === "curved") {
		if(game.inRoom === game.theRoom) {
			var playerPosScaled = Math.scaleAboutPoint(p.x, p.y + p.hitbox.top, this.x, this.y, 1, 2); // scale player vertically by 2 to scale from the oval-shaped roof onto the circle-shaped roof
			while(Math.distSq(playerPosScaled.x, playerPosScaled.y, this.x, this.y) > (this.w * this.w) && p.y + p.hitbox.top < this.y) {
				p.velocity.y = Math.max(p.velocity.y, 2);
				p.y ++;
				playerPosScaled = Math.scaleAboutPoint(p.x, p.y + p.hitbox.top, this.x, this.y, 1, 2);
			}
		}
	}
});
Roof.method("display", function() {
	if(this.type === "flat") {
		graphics3D.cube(this.x - this.w, this.y - 1100, this.w * 2, 1000, 0.9, 1.1, null, null, { obscuresLight: true });
	}
	else if(this.type === "sloped") {
		graphics3D.polygon3D("rgb(110, 110, 110)", "rgb(150, 150, 150)", 0.9, 1.1, [
			{
				x: -100,
				y: -100
			},
			{
				x: -100,
				y: this.y
			},
			{
				x: this.x - this.w,
				y: this.y
			},
			{
				x: this.x - (this.w / 3),
				y: this.y - 100
			},
			{
				x: this.x + (this.w / 3),
				y: this.y - 100
			},
			{
				x: this.x + this.w,
				y: this.y
			},
			{
				x: 900,
				y: this.y - 100
			},
			{
				x: 900,
				y: -100
			}
		], { obscuresLight: true });
	}
	else if(this.type === "curved") {
		if(this.points === undefined) {
			this.points = Math.findPointsCircular(0, 0, this.w, [4, 1]);
			for(var i = 0; i < this.points.length; i += 1) {
				this.points[i].y /= 2;
				this.points[i].x += this.x;
				this.points[i].y += this.y;
			}
		}
		var array = [];
		for(var i = 0; i < this.points.length; i += (this.points.length / 36)) {
			array.push({x: this.points[Math.floor(i)].x, y: this.points[Math.floor(i)].y});
		}
		for(var i = 1; i < array.length; i ++) {
			collisions.solids.line(array[i].x, array[i].y, array[i - 1].x, array[i - 1].y);
		}
		array.splice(0, 0, {x: -100, y: -100}, {x: -100, y: this.y}, {x: this.x - this.w, y: this.y});
		array.push({x: this.x + this.w, y: this.y});
		array.push({x: canvas.width + 100, y: this.y});
		array.push({x: canvas.width + 100, y: -100});
		graphics3D.polygon3D("rgb(110, 110, 110)", "rgb(150, 150, 150)", 0.9, 1.1, array, { obscuresLight: true });
	}
});
Roof.method("translate", function(x, y) {
	this.x += x;
	this.y += y;
	if(this.type === "curved" && Object.typeof(this.points) === "array") {
		this.points.forEach(point => {
			point.x += x, point.y += y;
		});
	}
});
