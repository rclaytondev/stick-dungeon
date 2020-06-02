var debugging = {
	/*
	This object provides methods + properties so that you can disable certain aspects of the game for manual testing + debugging.
	*/
	settings: {
		DEBUGGING_MODE: false, // master switch to let you toggle off all other settings
		ABILITY_KEYS: false, // special keys to give you abilities (see `debugging.keyAbilities`)
		INFINITE_HEALTH: false, // also includes infinite mana

		SHOW_HITBOXES: false,
		SHOW_FPS: false,

		SHOW_LIGHTING_POLYGONS: false,
		SHOW_LIGHTING_ALGORITHM: false, // used for miscellaneous lighting algorithm info
		SHOW_LIGHTING_RAYS: false,
		DISABLE_LIGHTING_SHADOW: false,
		DISABLE_RADIAL_SHADOWS: false,

		START_SCREEN: "home",
		START_ROOM_ID: "ambient1",
		PLAYER_CLASS: "warrior",
		ITEMS: game.items,
		ENEMIES: game.enemies, // set to an empty array to disable enemy spawning
		ROOMS: game.rooms, // usually an array of strings (room IDs), but you can also set it to the value of game.rooms to keep it random
		GIVE_FREE_ITEMS: function() { },
		GIVE_ALL_FREE_ITEMS: false,

		/* individual object settings to override randomization. Any of the properties below can be set to null to keep it randomized, like normal. */
		BANNER_TYPE: null, // values: "border" or "gradient"
		DECORATION_TYPE: null, // values: "torch", "banner", or "window"
		CEILING_TYPE: null, // values: "none", "flat", "sloped", or "curved"
		START_ROOM_DOOR_DESTINATIONS: ["ambient", "combat", "parkour", "secret"], // which room types the doors in the first room will take you to
		ROOM_COLOR: null, // "red", "blue", or "green" (mostly just changes the decoration colors)
		REFLECT_ROOMS: null, // true, false, or null (random)
		ALWAYS_ITEMS_IN_CHESTS: false // always give a real item from the chest, never coins or arrows
	},




	loadRoom: function(id) {
		game.dungeon = [];
		game.rooms[id].add();
		if(
			(debugging.settings.DEBUGGING_MODE && debugging.settings.REFLECT_ROOMS === true) ||
			((debugging.settings.REFLECT_ROOMS === null || !debugging.settings.DEBUGGING_MODE) && Math.random() < 0.5)
		) {
			game.dungeon.lastItem().reflect();
		}
		var room = game.dungeon[0];
		var entranceDoor = room.getInstancesOf(Door)[0];
		if(entranceDoor instanceof Door) {
			p.x = entranceDoor.x;
			p.y = entranceDoor.y - p.hitbox.bottom;
		}
		else {
			p.x = 0, p.y = 0;
		}
		if(game.rooms[id].colorScheme === "all") {
			room.colorScheme = ["red", "green", "blue"].randomItem();
			if(debugging.settings.ROOM_COLOR !== null) {
				room.colorScheme = debugging.settings.ROOM_COLOR;
			}
		}
		else if(game.rooms[id].colorScheme !== null && !game.rooms[id].colorScheme.includes("|")) {
			room.colorScheme = game.rooms[id].colorScheme;
		}
		room.getInstancesOf(Door).forEach(obj => { obj.containingRoomID = 0; });
	},
	setGeneratableRooms: function(roomIDs) {
		if(roomIDs === game.rooms || roomIDs === null) {
			return;
		}
		var allRooms = game.rooms.getAllRooms();
		allRooms.forEach((room) => {
			if(!roomIDs.includes(room.name)) {
				delete game.rooms[room.name];
			}
		});
	},

	activateDebuggingSettings: function() {
		game.onScreen = debugging.settings.START_SCREEN;
		if(typeof debugging.settings.START_ROOM_ID === "string") {
			debugging.loadRoom(debugging.settings.START_ROOM_ID);
		}
		debugging.setGeneratableRooms(debugging.settings.ROOMS);
		if(debugging.settings.ITEMS !== null) {
			game.items = debugging.settings.ITEMS;
		}
		if(debugging.settings.ENEMIES !== null) {
			game.enemies = debugging.settings.ENEMIES;
		}
		if(debugging.settings.START_ROOM_DOOR_DESTINATIONS !== null) {
			game.dungeon[0].getInstancesOf(Door).forEach((door) => {
				door.dest = debugging.settings.START_ROOM_DOOR_DESTINATIONS;
			});
		}
		p.class = debugging.settings.PLAYER_CLASS;
		debugging.settings.GIVE_FREE_ITEMS();
		if(debugging.settings.GIVE_ALL_FREE_ITEMS) {
			game.items.forEach((item) => { p.addItem(new item()); });
		}
	},



	hitboxes: [],
	displayHitboxes: function() {
		var colorIntensity = Math.map(
			Math.sin(utils.frameCount / 30),
			-1, 1,
			225, 255
		);
		const COLORS = {
			"light blue": "rgb(0, " + colorIntensity + ", " + colorIntensity + ")",
			"dark blue": "rgb(0, 0, " + colorIntensity + ")",
			"green": "rgb(0, " + colorIntensity + ", 0)"
		};
		debugging.hitboxes.forEach((hitbox) => {
			c.strokeStyle = COLORS[hitbox.color];
			c.lineWidth = 5;
			if(hitbox.hasOwnProperties("x", "y", "r")) {
				c.strokeCircle(hitbox.x + game.camera.getOffsetX(), hitbox.y + game.camera.getOffsetY(), hitbox.r);
			}
			else if(hitbox.hasOwnProperties("x", "y", "w", "h")) {
				c.strokeRect(hitbox.x + game.camera.getOffsetX(), hitbox.y + game.camera.getOffsetY(), hitbox.w, hitbox.h);
			}
		});
	},

	drawPoint: function() {
		/* Puts a point at the location. (Used for visualizing graphic functions) */
		c.save(); {
			c.fillStyle = "rgb(255, 0, 0)";
			var size = Math.sin(utils.frameCount / 10) * 5 + 5;
			if(typeof arguments[0] === "number") {
				c.fillCircle(arguments[0], arguments[1], size);
			}
			else {
				c.fillCircle(arguments[0].x, arguments[0].y, size);
			}
		} c.restore();
	},
	clearSlot: function(id) {
		/* Clears the specified slot of the player's inventory */
		if(Object.typeof(id) !== "number") {
			p.invSlots.forEach((slot) => { slot.content = "empty"; });
		}
		else {
			p.invSlots[id].content = "empty";
		}
	},

	fps: {
		recalculate: function() {
			var timeNow = new Date().getTime();
			var timePassed = timeNow - this.timeOfLastCall;
			var framesNow = utils.frameCount;
			var framesPassed = framesNow - this.frameOfLastCall;
			this.fps = Math.round(framesPassed / timePassed * 1000);

			this.timeOfLastCall = timeNow;
			this.frameOfLastCall = framesNow;
		},
		display: function() {
			c.fillStyle = "rgb(255, 255, 255)";
			c.textAlign = "left";
			c.fillText(this.fps + " fps", 0, 10);
		},

		timeOfLastCall: 0,
		frameOfLastCall: 0,
		fps: 0,
	},
	keyAbilities: {
		/*
		This object is used for special abilities given while testing. (You have to enable ABILITY_KEYS to turn these on)
		 - Ability to cycle through all the doors in a room, teleporting the player to the next / previous door
		 - Ability to enter a door and skip the fading screen animation
		 - Ability to kill all enemies in the room
		 - Ability to kill all enemies in all rooms
		Plus some others, not listed here.
		To add a new key ability, define a method on the `keyBinds` object below to return whether or not to activate the key ability for a given keyset. Then define a function on this object (with the same name) that should be run when the keys are pressed.
		*/
		keyBinds: {
			goToNextDoor: (keySet) => keySet.Tab && !(keySet.ShiftLeft || keySet.ShiftRight),
			goToPreviousDoor: (keySet) => keySet.Tab && (keySet.ShiftLeft || keySet.ShiftRight),
			enterDoorWithoutTransition: (keySet) => keySet.KeyQ,
			killEnemiesInRoom: (keySet) => keySet.KeyW && !(keySet.ShiftLeft || keySet.ShiftRight),
			killAllEnemies: (keySet) => keySet.KeyW && (keySet.ShiftLeft || keySet.ShiftRight),
			toggleFlight: (keySet) => keySet.KeyF,
			openAllChests: (keySet) => (keySet === io.keys) ? keySet.KeyC : false
		},

		checkForKeyAbilities: function() {
			for(var i in this.keyBinds) {
				if(this.keyBinds.hasOwnProperty(i) && this.keyBinds[i](io.keys) && !this.keyBinds[i](utils.pastInputs.keys)) {
					this[i](); // call method with same name on this object
				}
			}
		},

		getNearestDoorIndex: function() {
			var nearestDoor = game.dungeon[game.inRoom].getInstancesOf(Door).min((door) => Math.dist(door.x, door.y, p.x, p.y));
			var nearestDoorIndex = game.dungeon[game.inRoom].content.indexOf(nearestDoor);
			return nearestDoorIndex;
		},
		movePlayerToDoor: function(door) {
			p.x = door.x;
			p.y = door.y - p.hitbox.bottom;
		},
		goToNextDoor: function() {
			var nearestDoorIndex = this.getNearestDoorIndex();
			var nearestDoor = game.dungeon[game.inRoom].content[nearestDoorIndex];
			var doors = game.dungeon[game.inRoom].getInstancesOf(Door);
			nearestDoorIndex = doors.indexOf(nearestDoor);
			var nextDoorIndex = nearestDoorIndex + 1;
			if(nextDoorIndex >= doors.length) { nextDoorIndex = 0; }
			this.movePlayerToDoor(doors[nextDoorIndex]);
		},
		goToPreviousDoor: function() {
			var nearestDoorIndex = this.getNearestDoorIndex();
			var nearestDoor = game.dungeon[game.inRoom].content[nearestDoorIndex];
			var doors = game.dungeon[game.inRoom].getInstancesOf(Door);
			nearestDoorIndex = doors.indexOf(nearestDoor);
			var nearestDoorIndex = nearestDoorIndex - 1;
			if(nearestDoorIndex < 0) { nearestDoorIndex = doors.length - 1; }
			this.movePlayerToDoor(doors[nearestDoorIndex]);
		},

		enterDoorWithoutTransition: function() {
			var nearestDoorIndex = this.getNearestDoorIndex();
			var nearestDoor = game.dungeon[game.inRoom].content[nearestDoorIndex];
			nearestDoor.enter(p);
		},

		killEnemiesInRoom: function() {
			game.dungeon[game.inRoom].content.filter(obj => obj instanceof Enemy).forEach((enemy) => { enemy.hurt(10000); });
		},
		killAllEnemies: function() {
			game.dungeon.forEach((room) => {
				room.content.filter(obj => obj instanceof Enemy).forEach((enemy) => { enemy.hurt(10000); });
			});
		},

		toggleFlight: function() {
			debugging.keyAbilities.isFlying = !debugging.keyAbilities.isFlying;
			p.velocity = { x: 0, y: 0 };
		},
		isFlying: false,
		HORIZONTAL_FLIGHT_SPEED: 8,
		VERTICAL_FLIGHT_SPEED: 10,

		openAllChests: function() {
			var chests = game.dungeon[game.inRoom].getInstancesOf(Chest);
			chests = chests.filter(chest => !chest.opening);
			if(chests.length !== 0) {
				chests[0].opening = true;
			}
		}
	}
};
testing.resetter.saveGameState();
if(debugging.settings.DEBUGGING_MODE) {
	debugging.activateDebuggingSettings();
}
