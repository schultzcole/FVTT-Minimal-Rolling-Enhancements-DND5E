# CHANGELOG

## [0.1.3] 2021-01-18

### ADDED

- When the "Advantage/Critical" modifier key is held while clicking on a damage roll, the damage will be rolled as a critical

### FIXED

- Fix an issue that would cause damage buttons to appear in item cards for items with no damage formulae defined

## [0.1.2] 2021-01-17

### CHANGED

- If an item damage formula does not have a type defined, default to "Damage" for the damage type in the damage chat card.
- Prevent a user from adding more formula groups to an item if it already has 7 or more formula groups.

### FIXED

- Fix an issue that could occur if an item had a versatile formula defined, but no damage parts defined.

## [0.1.1] 2021-01-16

### ADDED

- You can now right click on individual damage rolls within an individual damage card to selectively apply damage for that roll only.

### CHANGED

- Changed the icon for the "revert to default" state of the auto rolls 3-way checkboxes to an open circle.

### FIXED

- Fixed an issue caused by programmatically calling rollAttack or rollDamage with no arguments.
- Fixed the damage type for a damage formula of type "None" displaying as "undefined".

## [0.1.0] 2021-01-15

First release!
