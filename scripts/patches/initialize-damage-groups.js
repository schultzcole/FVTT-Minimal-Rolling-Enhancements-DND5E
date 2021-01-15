import { libWrapper } from "../../lib/libWrapper/shim.js";
import { MODULE_NAME } from "../const.js";
import { createNewDamageGroup } from "../damage-group.js";

export function patchItemPrepareData() {
    libWrapper.register(MODULE_NAME, "CONFIG.Item.entityClass.prototype.prepareData", function patchedPrepareData(wrapped, ...args) {
        wrapped(...args);
        const mreFlags = _createMreFlags(this.data);
        if (mreFlags) this.data.flags[MODULE_NAME] = mreFlags;
    }, "WRAPPER");
}

export async function initializeDamageGroups(item) {
    const mreFlags = _createMreFlags(item._data);
    if (mreFlags) return item.update({ [`flags.${MODULE_NAME}`]: mreFlags });
}

function _createMreFlags(itemData) {
    const type = itemData.type;
    let mreFlags = itemData.flags?.[MODULE_NAME] ?? {};
    const itemDamage = itemData.data?.damage;
    let changed = false;

    if (["loot", "class", "backpack"].includes(type)) return null;

    // If the item doesn't already have damage groups initialized, initialize with a default group that uses every damage formula.
    if (!mreFlags.damageGroups || !(mreFlags.damageGroups instanceof Array) || !mreFlags.damageGroups.length) {
        const formulae = itemDamage?.parts;
        const initialSet = formulae ? Array.from(formulae.keys()) : [0];
        mreFlags.damageGroups = [createNewDamageGroup({ index: 0, initialSet })];

        changed = true;
    }

    // If the item has a versatile damage value that hasn't been migrated to a damage group yet, migrate it to a damage group
    if (itemDamage?.versatile?.length > 0 && !mreFlags.migratedVersatile) {
        const len = itemDamage.parts.push([itemDamage.versatile, itemDamage.parts[0][1]]);
        let verstatileDamageGroup = createNewDamageGroup({ label: game.i18n.localize("DND5E.Versatile"), initialSet: [len - 1] });
        mreFlags.damageGroups.push(verstatileDamageGroup);

        mreFlags.migratedVersatile = true;
        changed = true;
    }
    return changed ? mreFlags : null;
}
