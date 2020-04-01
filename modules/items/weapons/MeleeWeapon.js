function MeleeWeapon(modifier) {
	Weapon.call(this, modifier);
	this.attackSpeed = (this.modifier === "none") ? "normal" : (this.modifier === "light" ? "fast" : "slow");
	this.attackSpeed = "normal";
};
MeleeWeapon.extends(Weapon);
MeleeWeapon.method("attack", function() {
	p.attackingWith = this;
});
