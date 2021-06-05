import { libWrapper } from "../../lib/libWrapper/shim.js";
import { MODULE_NAME } from "../const.mjs";
import { getSettingLocalOrDefault, SETTING_NAMES } from "../settings.mjs";
import { modifiers } from "../modifiers.mjs";

const d20RollsToPatch = [
    { path: "CONFIG.Item.documentClass.prototype.rollAttack", optionsIndex: 0 },
    { path: "CONFIG.Item.documentClass.prototype.rollToolCheck", optionsIndex: 0 },
    { path: "CONFIG.Actor.documentClass.prototype.rollSkill", optionsIndex: 1 },
    { path: "CONFIG.Actor.documentClass.prototype.rollAbilityTest", optionsIndex: 1 },
    { path: "CONFIG.Actor.documentClass.prototype.rollAbilitySave", optionsIndex: 1 },
    { path: "CONFIG.Actor.documentClass.prototype.rollDeathSave", optionsIndex: 0 },
]

export function patchAbilityChecks() {
    for (let method of d20RollsToPatch) {
        libWrapper.register(MODULE_NAME, method.path, generateD20RollPatch(method.optionsIndex), "WRAPPER");
    }
}

// Patches a d20 roll to use the modifier hotkeys set in the module settings
function generateD20RollPatch(optionsIndex) {
    return function(wrapper, ...args) {
        let options = args[optionsIndex];
        if (!options) args[optionsIndex] = options = {};

        let dialogBehaviorSetting = getSettingLocalOrDefault(SETTING_NAMES.ROLL_DLG_BHVR);
        let noFastForwardModifier = getSettingLocalOrDefault(SETTING_NAMES.SHOW_ROLL_DLG_MOD);
        let advModifier = getSettingLocalOrDefault(SETTING_NAMES.ADV_MOD);
        let disAdvModifier = getSettingLocalOrDefault(SETTING_NAMES.DISADV_MOD);

        if (!options.event) options.event = duplicate(modifiers);

        const optionsOverride = {
            advantage: options.event[advModifier],
            disadvantage: options.event[disAdvModifier],
        }

        // The wrapped call will set the position of the dialog using dialogOptions, however if clientX and clientY are not defined,
        // It will place it in a weird location. For this reason, when clientX and Y are not defined, we override the dialog to be at
        // null, null, which will place it in the center of the window.
        if (!options.event?.clientX || !options.event?.clientY) {
            optionsOverride.dialogOptions = { top: null, left: null };
        }
        mergeObject(options, optionsOverride, { overwrite: false });

        let fastForward = dialogBehaviorSetting === "skip"
            ? !options.event[noFastForwardModifier]
            : null;

        options.fastForward = options.advantage || options.disadvantage || fastForward;

        return wrapper(...args);
    }
}
