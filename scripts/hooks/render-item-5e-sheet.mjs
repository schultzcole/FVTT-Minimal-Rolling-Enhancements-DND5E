import { MODULE_NAME } from "../const.mjs";
import { FormulaGroupConfig } from "../apps/formula-group-config.mjs";

Hooks.on("renderItemSheet5e", (itemSheet, html, _) => {
    // Add formula group config button
    const tooltip = game.i18n.localize(`${MODULE_NAME}.FORMULA-GROUP.DialogTitle`);
    html.find(".tab.details .damage-header").prepend(`<a title="${tooltip}" class="config-formula-groups"><i class="fas fa-tasks"></i></a>`);

    // Open the formula group config when the user clicks on the button
    html.find(".config-formula-groups").click(() => new FormulaGroupConfig(itemSheet.entity, { editable: itemSheet.isEditable }).render(true) );

    // Remove versatile fields
    html.find(`.tab.details input[name="data.damage.versatile"]`).closest(".form-group").remove();

    // Add auto-roll checkbox buttons
    if (itemSheet.item.data.data.actionType?.length) {
        // Only show the auto-roll checkbox button if actionType is populated
        const actionType = html.find(`.tab.details`).find(`[name="data.actionType"]`);
        actionType.wrap(`<div class="form-fields">`);
        actionType.after(_makeAutoRollCheckboxElement(itemSheet.entity, "Attack", true));
    }

    const damageHeader = html.find(".tab.details .damage-header");
    damageHeader.wrap(`<div class="mre-damage-header-container">`);
    damageHeader.after(_makeAutoRollCheckboxElement(itemSheet.entity, "Damage", true));

    const otherFormula = html.find(`.tab.details`).find(`[name="data.formula"]`);
    otherFormula.after(_makeAutoRollCheckboxElement(itemSheet.entity, "Other", false));

    // Handle "checkbox" button clicks
    html.find(`.tab.details button.checkbox`).click((event) => _handleCheckboxButtonPress(event, itemSheet));
});

function _makeAutoRollCheckboxElement(item, target, threeWay) {
    const text = game.i18n.localize(`${MODULE_NAME}.AUTO-ROLL.AutoRoll`);
    const element = $(`<div class="mre-auto-roll"><button class="checkbox"></button><span class="label">${text}</span></div>`);

    const flag = item.getFlag(MODULE_NAME, `autoRoll${target}`);
    const state = threeWay ? _stateFromNullableBoolean(flag) : _stateFromBoolean(flag);

    const button = element.find("button")
        .addClass(`${state.state}`)
        .attr("data-auto-roll-target", target)
        .attr("title", game.i18n.localize(state.tooltip));
    if (threeWay) button.addClass("three-way");

    return element;
}

function _stateFromBoolean(bool) {
    return {
        state: bool ? "checked" : "unchecked",
        tooltip: bool ? `${MODULE_NAME}.AUTO-ROLL.True` : `${MODULE_NAME}.AUTO-ROLL.False`
    }
}

const _threeWayTooltipKeys = {
    "unchecked": `${MODULE_NAME}.AUTO-ROLL.OverrideFalse`,
    "indeterminate": `${MODULE_NAME}.AUTO-ROLL.Default`,
    "checked": `${MODULE_NAME}.AUTO-ROLL.OverrideTrue`,
}

function _stateFromNullableBoolean(bool) {
    const state= bool === undefined ? "indeterminate" : ( bool ? "checked" : "unchecked" );
    return { state, tooltip: _threeWayTooltipKeys[state], };
}

function _handleCheckboxButtonPress(event, itemSheet) {
    const el = event.currentTarget;
    const target = el.dataset.autoRollTarget;
    const button = $(el);

    let newState;
    if (button.hasClass("checked")) {
        newState = "unchecked";
    } else if (button.hasClass("indeterminate")) {
        newState = "checked";
    } else {
        newState = "indeterminate";
    }

    switch (newState) {
        case "unchecked": itemSheet.entity.setFlag(MODULE_NAME, `autoRoll${target}`, false); break;
        case "indeterminate": itemSheet.entity.unsetFlag(MODULE_NAME, `autoRoll${target}`); break;
        case "checked": itemSheet.entity.setFlag(MODULE_NAME, `autoRoll${target}`, true); break;
        default: throw new Error(`Unrecognized button checkbox state ${newState}`);
    }
}
