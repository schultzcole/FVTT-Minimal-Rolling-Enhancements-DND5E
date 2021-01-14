import { MODULE_TITLE, MODULE_TITLE_SHORT } from "./scripts/const.js";
import { patchChatLogContextMenu } from "./scripts/chatLogPatch.js";
import { patchAbilityChecks } from "./scripts/abilityCheckPatches.js";
import { patchItemBaseRoll } from "./scripts/itemBaseRollPatch.js";
import { patchItemRollDamage } from "./scripts/itemDamagePatch.js";
import { patchItemPrepareData } from "./scripts/itemPrepareDataPatch.js";
import { registerSettings } from "./scripts/settings.js";

Hooks.on("setup", () => {
    console.log(`${MODULE_TITLE_SHORT} | Initializing ${MODULE_TITLE}`);
    registerSettings();
    patchAbilityChecks();
    patchItemBaseRoll()
    patchItemRollDamage();
    patchItemPrepareData();
    // TODO Having some trouble getting the context menus to work, will revisit
    patchChatLogContextMenu();
});
