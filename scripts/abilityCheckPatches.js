import { MODULE_NAME } from "./const.js";
import { libWrapper } from "../lib/libWrapper/shim.js";
import { getModifierSettingLocalOrDefault } from "./settings.js";

const d20RollsToPatch = [
    { path: "CONFIG.Item.entityClass.prototype.rollAttack", optionsIndex: 0 },
    { path: "CONFIG.Item.entityClass.prototype.rollToolCheck", optionsIndex: 0 },
    { path: "CONFIG.Actor.entityClass.prototype.rollSkill", optionsIndex: 1 },
    { path: "CONFIG.Actor.entityClass.prototype.rollAbilityTest", optionsIndex: 1 },
    { path: "CONFIG.Actor.entityClass.prototype.rollAbilitySave", optionsIndex: 1 },
    { path: "CONFIG.Actor.entityClass.prototype.rollDeathSave", optionsIndex: 0 },
]

export function patchAbilityChecks() {
    for (let method of d20RollsToPatch) {
        libWrapper.register(MODULE_NAME, method.path, generateD20RollPatch(method.optionsIndex), "WRAPPER");
    }
}

function generateD20RollPatch(optionsIndex) {
    return function(wrapper, ...args) {
        let options = args[optionsIndex];

        let noFastForwardModifier = getModifierSettingLocalOrDefault("showRollDialogModifier");
        let advModifier = getModifierSettingLocalOrDefault("advModifier");
        let disAdvModifier = getModifierSettingLocalOrDefault("disAdvModifier");

        const optionsOverride = {}
        if (options.event) {
            optionsOverride.fastForward = !options.event[noFastForwardModifier];
            optionsOverride.advantage = options.event[advModifier];
            optionsOverride.disadvantage = options.event[disAdvModifier];

            if (!options.event?.clientX || !options.event?.clientY) {
                optionsOverride.dialogOptions = { top: null, left: null };
            }
        }

        mergeObject(options, optionsOverride);

        return wrapper(...args);
    }
}
