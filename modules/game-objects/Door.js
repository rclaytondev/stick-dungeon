function Door(x, y, dest, noEntry, invertEntries, type) {
	this.x = x;
	this.y = y;
	this.dest = dest;
	this.noEntry = noEntry || false;
	this.invertEntries = invertEntries || false;
	this.type = type || "same";
	this.onPath = false;

	if(window["game"] === undefined) {
		/* the game is being initialized -> this must in the first room (room #0) */
		this.containingRoomID = 0;
	}
	else {
		this.containingRoomID = game.dungeon.length;
	}
};
Door.method("getInfo", function() {
	/* returns the text to display when the user is holding a map */
	if(!(p.invSlots[p.activeSlot].content instanceof Map)) {
		return ""; //not holding a map -> no explanatory text
	}
	if(typeof this.dest === "object") {
		return "?"; //unexplored -> "?"
	}
	var isDeadEnd = (game.dungeon[this.dest].getInstancesOf(Door).length > 0);
	if(isDeadEnd) {
		return "x"; // "x" if no doors in the room
	}
	var indices = [game.theRoom];
	function isUnknown(index) {
		if(indices.includes(index)) {
			return false;
		}
		indices.push(index);
		var containsUnknown = false;
		game.dungeon[index].getInstancesOf(Door).forEach(door => {
			if(typeof door.dest === "object") {
				return true;
			}
			else {
				var leadsToUnknown = isUnknown(door.dest);
				if(leadsToUnknown) {
					return true;
				}
			}
		})
		return false;
	};
	var leadsToUnexplored = isUnknown(this.dest);
	if(leadsToUnexplored) {
		return "^";
	}
	game.dungeon.forEach(room => { delete room.pathScore; });
	return "x";
});
Door.method("display", function() {
	/* Graphics */
	var self = this;
	var topLeft = graphics3D.point3D(this.x - 30, this.y - 60, 0.9);
	var bottomRight = graphics3D.point3D(this.x + 30, this.y, 0.9);
	var middle = graphics3D.point3D(this.x, this.y, 0.9);
	game.dungeon[game.theRoom].render(
		new RenderingOrderObject(
			function() {
				if(self.type === "arch") {
					c.fillStyle = "rgb(20, 20, 20)";
					c.fillRect(topLeft.x, topLeft.y, bottomRight.x - topLeft.x, bottomRight.y - topLeft.y);
					c.fillCircle(middle.x, topLeft.y, 27);
				}
				else if(self.type === "lintel") {
					c.fillStyle = "rgb(20, 20, 20)";
					c.fillRect(topLeft.x, topLeft.y - (30 * 0.9), bottomRight.x - topLeft.x, (bottomRight.y - topLeft.y) + (30 * 0.9));
				}
				if(self.barricaded) {
					c.save(); {
						c.lineWidth = 2;
						function displayWoodenBoard() {
							c.fillStyle = "rgb(139, 69, 19)";
							c.fillRect(-40, -10, 80, 20);
							function displayScrew(x, y) {
								c.fillStyle = "rgb(200, 200, 200)";
								c.strokeStyle = "rgb(255, 255, 255)";
								c.fillCircle(x, y, 5);
								c.strokeLine(x - 5, y, x + 5, y);
								c.strokeLine(x, y - 5, x, y + 5);
							};
							displayScrew(-30, 0);
							displayScrew(30, 0);
						};
						var doorWidth = (bottomRight.x - topLeft.x) / 2;
						for(var y = -20; y >= -60; y -= 20) {
							c.save(); {
								c.translate(middle.x, bottomRight.y + y);
								c.rotate((y === -40) ? Math.rad(-22) : Math.rad(22));
								displayWoodenBoard();
							} c.restore();
						}
					} c.restore();
				}
				if(p.invSlots[p.activeSlot].content instanceof Map) {
					/* Symbols for maps */
					var symbol = self.getInfo();
					var mapSymbolLocation = graphics3D.point3D(self.x, self.y - 40, 0.9);
					c.font = "15pt monospace";
					c.fillStyle = "rgb(255, 255, 255)";
					c.textAlign = "center";
					if(symbol !== ">" || true) {
						c.fillText(symbol, mapSymbolLocation.x, mapSymbolLocation.y);
					}
					else {
						if(p.x > this.x) {
							c.fillText("<", mapSymbolLocation.x, mapSymbolLocation.y);
						}
						else {
							c.fillText(">", mapSymbolLocation.x, mapSymbolLocation.y);
						}
					}
				}
			},
			0.9,
			-1
		)
	);
	if(this.type === "lintel") {
		graphics3D.cube(this.x - 45, this.y - 110, 90, 20, 0.9, 0.91, "rgb(110, 110, 110)", "rgb(150, 150, 150)");
	}
});
Door.method("update", function() {
	/* Resolve type (arched top vs. lintel) */
	if(this.type === "same" || this.type === "toggle") {
		if(this.type === "same") {
			this.type = p.doorType;
		}
		else {
			this.type = (p.doorType === "arch") ? "lintel" : "arch";
		}
	}
	/* Room Transition */
	var topLeft = graphics3D.point3D(this.x - 30, this.y - 60, 0.9);
	var bottomRight = graphics3D.point3D(this.x + 30, this.y, 0.9);
	if(collisions.objectIntersectsRect(p, { x: this.x - 30, y: this.y - 60, w: 60, h: 60}) && p.canJump && !p.enteringDoor && !p.exitingDoor && p.guiOpen === "none" && !this.barricaded) {
		if(io.keys.KeyS) {
			p.enteringDoor = true;
			this.entering = true;
		}
		ui.infoBar.actions.s = "enter door";
	}
	if(game.transitions.opacity > 0.95 && this.entering && !this.barricaded && !p.exitingDoor) {
		p.doorType = this.type;
		if(typeof this.dest !== "number") {
			game.generateNewRoom(this);
		}
		this.enter(p);
		this.entering = false;
	}
});
Door.method("isEnemyNear", function(enemy) {
	return collisions.objectIntersectsRect(enemy, { left: this.x - 30, right: this.x + 30, top: this.y - 60, bottom: this.y + 3});
});
Door.method("enter", function(obj) {
	if(obj instanceof Player) {
		if(Object.typeof(this.dest) === "array") {
			game.generateNewRoom(this);
		}
		var destinationDoor = this.getDestinationDoor();
		game.inRoom = this.dest;
		p.x = destinationDoor.x;
		p.y = destinationDoor.y - p.hitbox.bottom;
		p.enteringDoor = false;
		p.exitingDoor = true;
	}
	else if(obj instanceof Enemy) {
		var destinationRoom = this.getDestinationRoom();
		var destinationDoor = this.getDestinationDoor();
		var enemy = obj.clone();
		obj.toBeRemoved = true;
		enemy.x = destinationDoor.x;
		enemy.y = destinationDoor.y - enemy.hitbox.bottom;
		enemy.velocity = { x: 0, y: 0 };
		enemy.seesPlayer = false;
		enemy.opacity = 0;
		enemy.fadingIn = true;
		if(typeof enemy.onDoorEntry === "function") {
			enemy.onDoorEntry();
		}
		destinationRoom.content.push(enemy);
	}
	else {
		throw new Error("Only enemies and players can enter doors");
	}
});
Door.method("getDestinationRoom", function() {
	if(Object.typeof(this.dest) === "array") {
		return null; // no destination room if the door hasn't generated yet
	}
	return game.dungeon[this.dest];
});
Door.method("getDestinationDoor", function() {
	var destinationRoom = this.getDestinationRoom();
	return destinationRoom.content.filter(obj => obj instanceof Door && obj.dest === this.containingRoomID).onlyItem();
});
