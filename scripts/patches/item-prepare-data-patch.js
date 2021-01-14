import { libWrapper } from "../../lib/libWrapper/shim.js";
import { MODULE_NAME } from "../const.js";
import { createNewDamageGroup } from "../damage-group.js";

export function patchItemPrepareData() {
    libWrapper.register(MODULE_NAME, "CONFIG.Item.entityClass.prototype.prepareData", function(wrapped, ...args) {
        wrapped(...args);
        if (["loot", "class", "backpack"].includes(this.type)) return;

        /** @type {{ damageGroups: DamageGroup[], migratedVersatile: Boolean }} */
        let mreFlags = this.data.flags[MODULE_NAME];
        const itemDamage = this.data.data.damage;
        if (!mreFlags) {
            this.data.flags[MODULE_NAME] = mreFlags = {};
        }
        if (!mreFlags.damageGroups || !(mreFlags.damageGroups instanceof Array) || !mreFlags.damageGroups.length) {
            const formulae = itemDamage.parts;
            mreFlags.damageGroups = [createNewDamageGroup({ index: 0, initialSet: Array.from(formulae.keys()) })];
        }

        // If the item has a versatile damage value that hasn't been migrated to a damage group yet, migrate it to a damage group
        if (itemDamage.versatile?.length > 0 && !mreFlags.migratedVersatile) {
            this.data.flags[MODULE_NAME].migratedVersatile = true;
            const len = itemDamage.parts.push([itemDamage.versatile, itemDamage.parts[0][1]]);
            let verstatileDamageGroup = createNewDamageGroup({ label: game.i18n.localize("DND5E.Versatile"), initialSet: [len - 1] });
            mreFlags.damageGroups.push(verstatileDamageGroup);
        }
    }, "WRAPPER");
}

