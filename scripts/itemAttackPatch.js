import { MODULE_NAME } from "./const.js";
import { libWrapper } from "../lib/libWrapper/shim.js";
import { getModifierSettingLocalOrDefault } from "./settings.js";

export function patchItemRollAttack() {
    libWrapper.register(MODULE_NAME, "CONFIG.Item.entityClass.prototype.rollAttack", function(wrapper, ...args) {
        let options = args[0];

        let noFastForwardModifier = getModifierSettingLocalOrDefault("showRollDialogModifier");
        let advModifier = getModifierSettingLocalOrDefault("advModifier");
        let disAdvModifier = getModifierSettingLocalOrDefault("disAdvModifier");

        const optionsOverride = {
            fastForward: !options.event[noFastForwardModifier],
            advantage: options.event[advModifier],
            disadvantage: options.event[disAdvModifier],
        };

        mergeObject(options, optionsOverride);

        return wrapper(options);
    }, "WRAPPER");
}
