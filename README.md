# Minimal Rolling Enhancements (MRE) for D&D5e

Some minimalist enhancements to the core D&D5e rolling workflow.
Attempts to stay as close to core behavior as possible while improving convenience.
A key philosophy for this module is to remain as non-disruptive as possible to minimize conflicts with system and core updates.

## Planned Features

### Attack Rolls

- ✅ Setting: Auto roll attacks (global setting with per-item overrides).
- ✅ In-card attack rolls.

### Damage Rolls

- ✅ Damage Groups: assign any combination of damage formulae to a nameable damage group.
  In the chat card, choose from any of the available damage groups to roll.
  - The versatile formula field is hidden (but not deleted), as the versatile damage can simply be added as a damage group.
    A migration macro is provided to convert all core versatile formulae to damage groups.
- ✅ Setting: Auto roll damage (global setting with per-item overrides).
- ✅ Each damage formula rolled separately (rather than being combined into a single roll) and displayed in a combined card.
  - This is done so that different damage types are not combined into a single roll and can therefore be applied selectively to account for resistances, etc.

### Other

- ✅ Default to fast-forward for all ability checks (skip the dialog unless a modifier key is pressed).
- ✅ Configurable modifier keys for advantage, disadvantage, and fast-forward.

## Compatibility

Not compatible with other modules which modify D&D5e item rolls, period.

Minimal Rolling Enhancements is compatible with [libWrapper](https://foundryvtt.com/packages/lib-wrapper/),
however installing the libWrapper module is *optional*.
You are not required to install libWrapper for MRE to work correctly.

## License

Licensed under the GPLv3 License (see [LICENSE](LICENSE)).
