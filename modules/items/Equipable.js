function Equipable(modifier) {
	Item.call(this);
	this.equipable = true;
	this.modifier = modifier || "none";
};
Equipable.extend(Item);
