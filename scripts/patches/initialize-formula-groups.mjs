import { libWrapper } from "../../lib/libWrapper/shim.js";
import { MODULE_NAME } from "../const.mjs";
import { createNewFormulaGroup } from "../formula-group.mjs";

export function patchItemPrepareData() {
    libWrapper.register(MODULE_NAME, "CONFIG.Item.entityClass.prototype.prepareData", function patchedPrepareData(wrapped, ...args) {
        wrapped(...args);
        const updates = _createMreFlags(this.data);
        if (updates) mergeObject(this.data, updates);
    }, "WRAPPER");
}

export function patchItemSheetGetData() {
    libWrapper.register(MODULE_NAME, "game.dnd5e.applications.ItemSheet5e.prototype.getData", async function patchedGetData(wrapped, ...args) {
        if (this.isEditable) await initializeFormulaGroups(this.entity);
        return wrapped(...args);
    }, "WRAPPER");
}

export async function initializeFormulaGroups(item) {
    const updates = _createMreFlags(item._data);
    if (updates) return item.update(updates);
}

function _createMreFlags(itemData) {
    const type = itemData.type;
    let mreFlags = duplicate(itemData.flags?.[MODULE_NAME] ?? {});
    const updates = {
        [`flags.${MODULE_NAME}`]: mreFlags
    };
    const itemDamage = duplicate(itemData.data?.damage ?? {});
    let changed = false;

    if (["loot", "class", "backpack"].includes(type)) return null;

    // If the item doesn't already have formula groups initialized, initialize with a default group that uses every damage formula.
    if (!mreFlags.formulaGroups || !(mreFlags.formulaGroups instanceof Array) || !mreFlags.formulaGroups.length) {
        const formulae = itemDamage?.parts;
        const initialSet = formulae ? Array.from(formulae.keys()) : [0];
        mreFlags.formulaGroups = [createNewFormulaGroup({ index: 0, initialSet })];

        changed = true;
    }

    // If the item has a versatile damage value that hasn't been migrated to a formula group yet, migrate it to a formula group
    if (itemDamage?.versatile?.trim()?.length > 0 && !mreFlags.migratedVersatile) {
        updates.data = {
            "damage.parts": [...itemDamage.parts, [itemDamage.versatile, itemDamage.parts[0]?.[1] ?? "none"]],
        }
        let verstatileFormulaGroup = createNewFormulaGroup({ label: game.i18n.localize("DND5E.Versatile"), initialSet: [itemDamage.parts.length] });
        mreFlags.formulaGroups.push(verstatileFormulaGroup);

        mreFlags.migratedVersatile = true;
        changed = true;
    }

    return changed ? updates : null;
}
