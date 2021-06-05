import { MODULE_NAME } from "./const.mjs";

/**
 * @typedef {{ label: String, formulaSet: int[] }} FormulaGroup
 * @property {String} label - The label shown on the damage button for this formula group on the item card
 * @property {int[]} formulaSet - The set of damage formulae on this item that belong to this formula group
 */

/**
 * @param {String} label - A label to give to the group
 * @param {int} index - The index of the newly created formula group in its containing item. Used to write a
 * @param {int[]} initialSet - A set of damage formula indices to initialize with
 * @returns {FormulaGroup}
 */
export function createNewFormulaGroup({  label=undefined, index=undefined, initialSet=[] }={}) {
    return {
        label: label ?? game.i18n.localize(formulaGroupNameKeys[index] ?? `${MODULE_NAME}.FORMULA-GROUP.NewFormulaGroup`),
        formulaSet: foundry.utils.deepClone(initialSet),
    }
}

export const formulaGroupNameKeys = ["Primary", "Secondary", "Tertiary"].map(s => MODULE_NAME + ".FORMULA-GROUP." + s);
