import { libWrapper } from "../lib/libWrapper/shim.js";
import { MODULE_NAME } from "./const.js";
import { getModifierSettingLocalOrDefault } from "./settings.js";

export function patchItemBaseRoll() {
    // A hacky way to determine if modifier keys are pressed
    const modifiers = {
        altKey: false,
        ctrlKey: false,
        shiftKey: false,
        clientX: null,
        clientY: null,
    }

    const updateModifiers = event => {
        modifiers.altKey = event.altKey;
        modifiers.ctrlKey = event.ctrlKey;
        modifiers.shiftKey = event.shiftKey;
    }

    document.addEventListener("keydown", updateModifiers);
    document.addEventListener("keyup", updateModifiers);
    document.addEventListener("mousedown", event => {
        modifiers.clientX = event.clientX;
        modifiers.clientY = event.clientY;
    });
    document.addEventListener("mouseup", event => {
        modifiers.clientX = null;
        modifiers.clientY = null;
    });

    libWrapper.register(MODULE_NAME, "CONFIG.Item.entityClass.prototype.roll", async function (wrapped, ...args) {
        const capturedModifiers = duplicate(modifiers);

        const autoRollCheck = game.settings.get(MODULE_NAME, "autoCheck");
        const autoRollDamage = game.settings.get(MODULE_NAME, "autoDamage");
        const showDialogModifier = getModifierSettingLocalOrDefault("showRollDialogModifier");
        const shouldShowDialog = capturedModifiers[showDialogModifier];
        const wrappedResult = await wrapped(...args);
        console.log("MRE Base item roll", wrappedResult);

        let checkPromise, damagePromise;
        if (autoRollCheck) {
            if (this.hasAttack) {
                // Need to get the interaction event that caused the item to be rolled so we can tell whether to show the dialog or roll with adv/disadv
                // noinspection JSDeprecatedSymbols
                checkPromise = this.rollAttack({ event: capturedModifiers });

                if (this.hasDamage && autoRollDamage) {
                    if (shouldShowDialog) await checkPromise;

                    // Need to get the interaction event that caused the item to be rolled so we can tell whether to show the dialog
                    // noinspection JSDeprecatedSymbols
                    damagePromise = this.rollDamage({ event: capturedModifiers });
                }
            } else if (this.type === "tool") {
                checkPromise = this.rollToolCheck({ event: capturedModifiers });
            }
        }

        await Promise.all([checkPromise, damagePromise]);

        return wrappedResult;
    }, "WRAPPER");
}
