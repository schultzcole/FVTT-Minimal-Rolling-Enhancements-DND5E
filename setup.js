import { MODULE_TITLE, MODULE_TITLE_SHORT } from "./scripts/const.js";
import { patchChatLogContextMenu } from "./scripts/chatLogPatch.js";
import { patchAbilityChecks } from "./scripts/abilityCheckPatches.js";
import { patchItemBaseRoll } from "./scripts/itemBaseRollPatch.js";
import { patchItemRollDamage } from "./scripts/itemDamagePatch.js";
import { registerSettings } from "./scripts/settings.js";

Hooks.on("setup", () => {
    console.log(`${MODULE_TITLE_SHORT} | Initializing ${MODULE_TITLE}`);
    registerSettings();
    patchItemBaseRoll()
    patchItemRollDamage();
    patchAbilityChecks()
    // TODO Having some trouble getting the context menus to work, will revisit
    // patchChatLogContextMenu();
});
