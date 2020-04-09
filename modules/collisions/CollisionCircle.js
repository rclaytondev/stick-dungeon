function CollisionCircle(x, y, r, settings) {
	/*
	('x', 'y') is center, not top-left corner. Radius is 'r'
	*/
	this.x = x;
	this.y = y;
	this.r = r;
};
CollisionCircle.method("collide", function(obj) {
	if(Object.typeof(obj) === "object" || Object.typeof(obj) === "instance") {
		var intersection = this.getIntersectionPoint(obj);
		var collided = false;
		var slope;
		while(intersection !== null) {
			/* move the player away from the center of the circle (in the direction they are already in) until they no longer intersect */
			slope = slope || Math.normalize(obj.x - this.x, obj.y - this.y);
			if(Math.abs(slope.y / slope.x) > 0.75) {
				/* slope is shallow enough to not have things slide down -> only move vertically */
				obj.y --;
			}
			else {
				obj.x += slope.x;
				obj.y += slope.y;
			}
			intersection = this.getIntersectionPoint(obj);
			collided = true;
		}
		if(collided) {
			if(Math.abs(slope.y / slope.x) > 0.75) {
				obj.handleCollision((obj.y < this.y ? "floor" : "ceiling"), this);
			}
			else {
				obj.handleCollision((obj.x > this.x ? "left" : "right"), this);
			}
		}
	}
	else {
		if(debugging.settings.DEBUGGING_MODE && debugging.settings.SHOW_HITBOXES) {
			debugging.hitboxes.push({x: this.x, y: this.y, r: this.r, color: "dark blue"});
		}
		/* collide with objects */
		for(var i = 0; i < game.dungeon[game.theRoom].content.length; i ++) {
			var obj = game.dungeon[game.theRoom].content[i];
			if(obj.hitbox instanceof utils.geom.Rectangle && Object.typeof(obj.handleCollision) === "function") {
				this.collide(obj);
			}
		}
		this.collide(p);
	}
});
CollisionCircle.method("getIntersectionPoint", function(obj) {
	var point = {
		x: Math.constrain(this.x, obj.x + obj.hitbox.left, obj.x + obj.hitbox.right),
		y: Math.constrain(this.y, obj.y + obj.hitbox.top, obj.y + obj.hitbox.bottom)
	};
	if(Math.distSq(this.x, this.y, point.x, point.y) < this.r * this.r) {
		return point;
	}
	else {
		return null;
	}
});
