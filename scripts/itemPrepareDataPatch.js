import { libWrapper } from "../lib/libWrapper/shim.js";
import { MODULE_NAME } from "./const.js";
import { createEmptyDamageGroup } from "./damage-group.js";

export function patchItemPrepareData() {
    libWrapper.register(MODULE_NAME, "CONFIG.Item.entityClass.prototype.prepareData", function(wrapped, ...args) {
        wrapped(...args);
        if (["loot", "class", "backpack"].includes(this.type)) return;

        /** @type {{ damageGroups: DamageGroup[] }} */
        let mreFlags = this.data.flags[MODULE_NAME];
        if (!mreFlags) {
            this.data.flags[MODULE_NAME] = mreFlags = {};
        }
        if (!mreFlags.damageGroups || !(mreFlags.damageGroups instanceof Array) || !mreFlags.damageGroups.length) {
            const formulae = this.data.data.damage.parts;
            mreFlags.damageGroups = [ createEmptyDamageGroup(0, Array.from(formulae.keys())) ];
        }
    }, "WRAPPER");
}

