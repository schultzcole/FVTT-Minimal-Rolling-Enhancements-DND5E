export const pause = (millis) => new Promise(resolve => setTimeout(resolve, millis));

/**
 * Combines multiple Roll objects into a single merged Roll.
 * @param {Roll} rolls
 */
export function combineRolls(...rolls) {
    const roll = new Roll("0");
    roll.data = foundry.utils.deepClone(rolls[0].data);
    roll.results = rolls.reduce((prev, next) => prev.length ? [...prev, "+", ...next.results] : next.results, []);
    roll.terms = rolls.reduce((prev, next) => prev.length ? [...prev, "+", ...next.terms] : next.terms, []);
    roll._dice = rolls.reduce((prev, next) => prev.length ? [...prev, "+", ...next._dice] : next._dice, []);
    roll._formula = rolls.map(r => r._formula).join(" + ");
    roll._rolled = true;
    roll._total = rolls.reduce((acc, next) => acc + next._total, 0);
    return roll;
}
