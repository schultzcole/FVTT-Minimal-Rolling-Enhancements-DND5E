/**
 * Combines multiple Roll objects into a single merged Roll.
 * @param {Roll} rolls
 */
export function combineRolls(...rolls) {
    const roll = new Roll("0");
    roll.data = foundry.utils.deepClone(rolls[0].data);
    roll.options = foundry.utils.deepClone(rolls[0].options);
    roll.terms = rolls.reduce((prev, next) => prev.length ? prev.concat(plus(), next.terms) : next.terms, []);
    roll._dice = rolls.reduce((prev, next) => prev.length ? prev.concat(plus(), next._dice) : next._dice, []);
    roll._formula = rolls.map(r => r._formula).join(" + ");
    roll._evaluated = true;
    roll._total = rolls.reduce((acc, next) => acc + next._total, 0);
    return roll;
}

function plus() {
    const term = new OperatorTerm({ operator: "+" });
    term.evaluate();
    return term;
}
