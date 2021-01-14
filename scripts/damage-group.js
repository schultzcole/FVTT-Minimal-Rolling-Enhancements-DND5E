import { MODULE_NAME } from "./const.js";

/**
 * @typedef {{ label: String, formulaSet: int[] }} DamageGroup
 * @property {String} label - The label shown on the damage button for this damage group on the item card
 * @property {int[]} formulaSet - The set of damage formulae on this item that belong to this damage group
 */

/**
 * @param {int} index - The index of the newly created damage group in its containing item
 * @param {String} label
 * @param {int[]} initialSet - A set of damage formula indices to initialize with
 * @returns {DamageGroup}
 */
export function createNewDamageGroup({ index=undefined, label=undefined, initialSet=[] }={}) {
    return {
        label: label ?? game.i18n.localize(damageGroupNameKeys[index] ?? `${MODULE_NAME}.DAMAGE-GROUP.NewDamageGroup`),
        formulaSet: duplicate(initialSet),
    }
}

export const damageGroupNameKeys = ["Primary", "Secondary", "Tertiary"].map(s => MODULE_NAME + ".DAMAGE-GROUP." + s);
