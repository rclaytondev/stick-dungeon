function CollisionRect(x, y, w, h, settings) {
	/*
	This object represents a collision - the kind where when the player hits it, they bounce back.
	*/
	this.x = x;
	this.y = y;
	this.w = w;
	this.h = h;
	settings = settings || {};
	this.settings = settings;
	this.settings.velocity = settings.velocity || { x: 0, y: 0 }; // used to increase collision buffer to prevent clipping through the surface at high speeds
	this.settings.walls = this.settings.walls || ["top", "bottom", "left", "right"]; // used to only collide on certain surfaces of the rectangle
	this.settings.illegalHandling = this.settings.illegalHandling || "collide"; // values: "collide" or "teleport". allows you to have the player teleport to the top of the block when hitting the side (for things like stairs).
	this.settings.onCollision = settings.onCollision || function() {}; // a function to be run when an object hits a side of the rectangle
	this.settings.collisionCriteria = settings.collisionCriteria || function(obj) { return true; }; // a function to determine which objects this should collide with
	this.settings.noPositionLimits = settings.noPositionLimits || false; // whether or not to move the object until it no longer intersects the rectangle
};
CollisionRect.method("collide", function(obj) {
	if(Object.typeof(obj) === "object" || Object.typeof(obj) === "instance") {
		if(!this.settings.collisionCriteria(obj)) {
			return;
		}
		const MINIMUM_COLLISION_BUFFER = 5;
		var collisionBuffer = {
			left: Math.max(MINIMUM_COLLISION_BUFFER, obj.velocity.x - this.settings.velocity.x),
			right: Math.max(MINIMUM_COLLISION_BUFFER, this.settings.velocity.x - obj.velocity.x),
			top: Math.max(MINIMUM_COLLISION_BUFFER, obj.velocity.y - this.settings.velocity.y),
			bottom: Math.max(MINIMUM_COLLISION_BUFFER, this.settings.velocity.y - obj.velocity.y)
		};
		/* check if obj is directly above / below this (floor + ceiling collisions) */
		if(obj.x + obj.hitbox.right > this.x && obj.x + obj.hitbox.left < this.x + this.w) {
			if(this.settings.walls.includes("top") && obj.y + obj.hitbox.bottom >= this.y && obj.y + obj.hitbox.bottom < this.y + collisionBuffer.top) {
				obj.handleCollision("floor", this);
				if(!this.settings.noPositionLimits) {
					obj.y = Math.min(obj.y, this.y - obj.hitbox.bottom);
				}
				this.settings.onCollision(obj, "floor");
			}
			if(this.settings.walls.includes("bottom") && obj.y + obj.hitbox.top < this.y + this.h && obj.y + obj.hitbox.top > this.y + this.h - collisionBuffer.bottom) {
				obj.handleCollision("ceiling", this);
				if(!this.settings.noPositionLimits) {
					obj.y = Math.max(obj.y, this.y + this.h + Math.abs(obj.hitbox.top));
				}
				this.settings.onCollision(obj, "ceiling");
			}
		}
		/* check if obj is directly to left / to right of this (wall collisions) */
		if(obj.y + obj.hitbox.bottom > this.y && obj.y + obj.hitbox.top < this.y + this.h) {
			if(this.settings.walls.includes("left") && obj.x + obj.hitbox.right > this.x && obj.x + obj.hitbox.right < this.x + collisionBuffer.left) {
				if(this.settings.illegalHandling === "collide" || obj.noTeleportCollisions) {
					obj.handleCollision("wall-to-right", this);
					if(!this.settings.noPositionLimits) {
						obj.x = Math.min(obj.x, this.x - obj.hitbox.right);
					}
				}
				else if(this.settings.illegalHandling === "teleport") {
					obj.y = Math.min(obj.y, this.y - obj.hitbox.bottom);
				}
				this.settings.onCollision(obj, "wall-to-right");
			}
			if(this.settings.walls.includes("right") && obj.x + obj.hitbox.left < this.x + this.w && obj.x + obj.hitbox.left > this.x + this.w - collisionBuffer.right) {
				if(this.settings.illegalHandling === "collide" || obj.noTeleportCollisions) {
					obj.handleCollision("wall-to-left", this);
					if(!this.settings.noPositionLimits) {
						obj.x = Math.max(obj.x, this.x + this.w + Math.abs(obj.hitbox.left));
					}
				}
				else if(this.settings.illegalHandling === "teleport") {
					obj.y = Math.min(obj.y, this.y - obj.hitbox.bottom);
				}
				this.settings.onCollision("wall-to-left");
			}
		}
	}
	else {
		if(debugging.settings.DEBUGGING_MODE && debugging.settings.SHOW_HITBOXES) {
			debugging.hitboxes.push({x: this.x, y: this.y, w: this.w, h: this.h, color: this.settings.illegalHandling === "teleport" ? "dark blue" : "light blue"});
		}
		/* collide with objects */
		game.dungeon[game.theRoom].content.forEach((obj) => {
			if(obj.hitbox instanceof utils.geom.Rectangle && Object.typeof(obj.handleCollision) === "function") {
				this.collide(obj);
			}
		});
		this.collide(p);
	}
});
