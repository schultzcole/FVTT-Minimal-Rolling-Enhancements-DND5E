import { MODULE_NAME } from "./const.js";
import { libWrapper } from "../lib/libWrapper/shim.js";
import { getSettingLocalOrDefault } from "./settings.js";

export function patchItemRollAttack() {
    libWrapper.register(MODULE_NAME, "CONFIG.Item.entityClass.prototype.rollAttack", function(wrapper, ...args) {
        let options = args[0];

        let noFastForwardModifier = getSettingLocalOrDefault("showRollDialogModifier");
        let advModifier = getSettingLocalOrDefault("advModifier");
        let disAdvModifier = getSettingLocalOrDefault("disAdvModifier");

        const optionsOverride = {
            fastForward: !options.event[noFastForwardModifier],
            advantage: options.event[advModifier],
            disadvantage: options.event[disAdvModifier],
        };

        options = mergeObject(optionsOverride, options, { inplace: false });

        return wrapper(options);
    }, "WRAPPER");
}
