import { MODULE_NAME } from "./const.js";

export function registerSettings() {
    _registerAutoRollsSettings();
    _registerModifierKeySettings();
}

export function getModifierSettingLocalOrDefault(settingKey) {
    const localKey = `${settingKey}Local`;
    const globalKey = `${settingKey}Global`;
    const value = game.settings.get(MODULE_NAME, localKey);
    return value === "default" ? game.settings.get(MODULE_NAME, globalKey) : value;
}

function _registerModifierKeySettings() {
    const globalDefault = game.i18n.localize(`${MODULE_NAME}.SETTINGS.GlobalDefault`);
    const localOverride = game.i18n.localize(`${MODULE_NAME}.SETTINGS.LocalOverride`);

    const globalHint = game.i18n.localize(`${MODULE_NAME}.SETTINGS.GlobalHint`);
    const localHint = game.i18n.localize(`${MODULE_NAME}.SETTINGS.LocalHint`);

    const showRollDialogLabel = game.i18n.localize(`${MODULE_NAME}.SETTINGS.ModifierShowRollDialogLabel`);
    const showRollDialogHint = game.i18n.localize(`${MODULE_NAME}.SETTINGS.ModifierShowRollDialogHint`);
    const advModifierLabel = game.i18n.localize(`${MODULE_NAME}.SETTINGS.ModifierAdvLabel`);
    const advModifierHint = game.i18n.localize(`${MODULE_NAME}.SETTINGS.ModifierAdvHint`);
    const disAdvModifierLabel = game.i18n.localize(`${MODULE_NAME}.SETTINGS.ModifierDisAdvLabel`);
    const disAdvModifierHint = game.i18n.localize(`${MODULE_NAME}.SETTINGS.ModifierDisAdvHint`);


    const globalModifierChoices = {
        "altKey": game.i18n.localize(`${MODULE_NAME}.MODIFIERS.altKey`),
        "ctrlKey": game.i18n.localize(`${MODULE_NAME}.MODIFIERS.ctrlKey`),
        "metaKey": game.i18n.localize(`${MODULE_NAME}.MODIFIERS.metaKey`),
        "shiftKey": game.i18n.localize(`${MODULE_NAME}.MODIFIERS.shiftKey`),
    };

    const localModifierChoices = mergeObject(
        { "default": game.i18n.localize(`${MODULE_NAME}.MODIFIERS.default`) },
        globalModifierChoices,
        { inplace: false },
    );

    const makeName = (name, modifier) => `${name} (${modifier})`;
    const makeHint = (hint, modifier) => `${hint} ${modifier}`;

    function _registerModifier(key, label, hint, isGlobal, defaultValue) {
        game.settings.register(MODULE_NAME, key, {
            name: makeName(label, isGlobal ? globalDefault : localOverride),
            hint: makeHint(hint, isGlobal ? globalHint : localHint),
            scope: isGlobal ? "world" : "client",
            config: true,
            type: String,
            default: defaultValue,
            choices: isGlobal ? globalModifierChoices : localModifierChoices,
        });
    }

    _registerModifier("showRollDialogModifierGlobal", showRollDialogLabel, showRollDialogHint, true, "shiftKey");
    _registerModifier("advModifierGlobal", advModifierLabel, advModifierHint, true, "altKey");
    _registerModifier("disAdvModifierGlobal", disAdvModifierLabel, disAdvModifierHint, true, "ctrlKey");

    _registerModifier("showRollDialogModifierLocal", showRollDialogLabel, showRollDialogHint, false, "default");
    _registerModifier("advModifierLocal", advModifierLabel, advModifierHint, false, "default");
    _registerModifier("disAdvModifierLocal", disAdvModifierLabel, disAdvModifierHint, false, "default");
}


function _registerAutoRollsSettings() {
    game.settings.register(MODULE_NAME, "autoCheck", {
        name: game.i18n.localize(`${MODULE_NAME}.SETTINGS.AutoRollChecksLabel`),
        hint: game.i18n.localize(`${MODULE_NAME}.SETTINGS.AutoRollChecksHint`),
        scope: "world",
        config: true,
        type: Boolean,
        default: false,
    });

    game.settings.register(MODULE_NAME, "autoDamage", {
        name: game.i18n.localize(`${MODULE_NAME}.SETTINGS.AutoRollDamageLabel`),
        hint: game.i18n.localize(`${MODULE_NAME}.SETTINGS.AutoRollDamageHint`),
        scope: "world",
        config: true,
        type: Boolean,
        default: false,
    });
}
