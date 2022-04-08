import { libWrapper } from "../../lib/libWrapper/shim.js";
import { MODULE_NAME } from "../const.mjs";
import { createNewFormulaGroup } from "../formula-group.mjs";

export function patchItemPrepareData() {
    libWrapper.register(MODULE_NAME, "CONFIG.Item.documentClass.prototype.prepareData", function patchedPrepareData(wrapped, ...args) {
        wrapped(...args);
        const updates = _createMreFlags(this.data);
        if (updates) foundry.utils.mergeObject(this.data, updates);
    }, "WRAPPER");
}

export function patchItemSheetGetData() {
    libWrapper.register(MODULE_NAME, `game.${game.system.id}.applications.ItemSheet5e.prototype.getData`, async function patchedGetData(wrapped, ...args) {
        if (this.isEditable && this.document.id != null) await initializeFormulaGroups(this.document);
        return wrapped(...args);
    }, "WRAPPER");
}

export async function initializeFormulaGroups(item) {
    const updates = _createMreFlags(item.data._source);
    if (updates) return item.update(updates);
}

function _createMreFlags(itemData) {
    const type = itemData.type;
    let mreFlags = foundry.utils.deepClone(itemData.flags?.[MODULE_NAME] ?? {});
    const updates = {
        [`flags.${MODULE_NAME}`]: mreFlags
    };

    /** @type {{ parts: string[], versatile: string }} */
    const itemDamage = foundry.utils.deepClone(itemData.data?.damage ?? {});
    let changed = false;

    if (["loot", "class", "backpack"].includes(type)) return null;

    // If the item doesn't already have formula groups initialized, initialize a new empty formula group
    if (!mreFlags.formulaGroups || !(mreFlags.formulaGroups instanceof Array) || !mreFlags.formulaGroups.length) {
        mreFlags.formulaGroups = [createNewFormulaGroup({ index: 0 })];

        changed = true;
    }

    // If the item has formula groups and none of them contain any formulae, but there are formulae on the item, add all of the formulae to the first formula group.
    const allGroupsEmpty = mreFlags.formulaGroups.every(fg => !fg.formulaSet.length);
    if (allGroupsEmpty && itemDamage?.parts?.length && mreFlags.formulaGroups?.length) {
        mreFlags.formulaGroups[0].formulaSet = Array.from(itemDamage.parts.keys());
        changed = true;
    }

    // If the item has a versatile damage value that hasn't been migrated to a formula group yet, migrate it to a formula group
    if (itemDamage?.versatile?.trim()?.length > 0 && !mreFlags.migratedVersatile) {
        // Add versatile damage as a new damage part, using the same damage type as the first damage part
        itemDamage.parts = [...itemDamage.parts, [itemDamage.versatile, itemDamage.parts[0]?.[1] ?? "none"]];
        updates["data.damage.parts"] = itemDamage.parts;

        // Add a new "versatile" formula group containing the newly added versatile damage part
        let verstatileFormulaGroup = createNewFormulaGroup({ label: game.i18n.localize("DND5E.Versatile"), initialSet: [itemDamage.parts.length - 1] });
        mreFlags.formulaGroups.push(verstatileFormulaGroup);

        mreFlags.migratedVersatile = true;
        changed = true;
    }

    return changed ? updates : null;
}
