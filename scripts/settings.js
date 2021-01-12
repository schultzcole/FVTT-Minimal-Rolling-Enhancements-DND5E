import { MODULE_NAME } from "./const.js";

export function registerSettings() {
    _registerModifierKeySettings();
}

function _registerModifierKeySettings() {
    const globalDefault = game.i18n.localize(`${MODULE_NAME}.SETTINGS.GlobalDefault`);
    const localOverride = game.i18n.localize(`${MODULE_NAME}.SETTINGS.LocalOverride`);

    const globalHint = game.i18n.localize(`${MODULE_NAME}.SETTINGS.GlobalHint`);
    const localHint = game.i18n.localize(`${MODULE_NAME}.SETTINGS.LocalHint`);

    const showRollDialogLabel = game.i18n.localize(`${MODULE_NAME}.SETTINGS.ShowRollDialogLabel`);
    const showRollDialogHint = game.i18n.localize(`${MODULE_NAME}.SETTINGS.ShowRollDialogHint`);
    const advModifierLabel = game.i18n.localize(`${MODULE_NAME}.SETTINGS.AdvModifierLabel`);
    const advModifierHint = game.i18n.localize(`${MODULE_NAME}.SETTINGS.AdvModifierHint`);
    const disAdvModifierLabel = game.i18n.localize(`${MODULE_NAME}.SETTINGS.DisAdvModifierLabel`);
    const disAdvModifierHint = game.i18n.localize(`${MODULE_NAME}.SETTINGS.DisAdvModifierHint`);

    const makeName = (name, modifier) => `${name} (${modifier})`;
    const makeHint = (hint, modifier) => `${hint} ${modifier}`;

    const globalModifierChoices = {
        "altKey": game.i18n.localize(`${MODULE_NAME}.SETTINGS.altKey`),
        "ctrlKey": game.i18n.localize(`${MODULE_NAME}.SETTINGS.ctrlKey`),
        "shiftKey": game.i18n.localize(`${MODULE_NAME}.SETTINGS.shiftKey`),
    };

    const localModifierChoices = mergeObject(
        globalModifierChoices,
        { "default": game.i18n.localize(`${MODULE_NAME}.SETTINGS.default`) },
        { inplace: false },
    );

    game.settings.register(MODULE_NAME, "showRollDialogModifierGlobal", {
        name: makeName(showRollDialogLabel, globalDefault),
        hint: makeHint(showRollDialogHint, globalHint),
        scope: "world",
        config: true,
        type: String,
        default: "shiftKey",
        choices: globalModifierChoices,
    });

    game.settings.register(MODULE_NAME, "advModifierGlobal", {
        name: makeName(advModifierLabel, globalDefault),
        hint: makeHint(advModifierHint, globalHint),
        scope: "world",
        config: true,
        type: String,
        default: "altKey",
        choices: globalModifierChoices,
    });

    game.settings.register(MODULE_NAME, "disAdvModifierGlobal", {
        name: makeName(disAdvModifierLabel, globalDefault),
        hint: makeHint(disAdvModifierHint, globalHint),
        scope: "world",
        config: true,
        type: String,
        default: "ctrlKey",
        choices: globalModifierChoices,
    });

    game.settings.register(MODULE_NAME, "showRollDialogModifierLocal", {
        name: makeName(showRollDialogLabel, localOverride),
        hint: makeHint(showRollDialogHint, localHint),
        scope: "client",
        config: true,
        type: String,
        default: "default",
        choices: localModifierChoices,
    });

    game.settings.register(MODULE_NAME, "advModifierLocal", {
        name: makeName(advModifierLabel, localOverride),
        hint: makeHint(advModifierHint, localHint),
        scope: "client",
        config: true,
        type: String,
        default: "default",
        choices: localModifierChoices,
    });

    game.settings.register(MODULE_NAME, "disAdvModifierLocal", {
        name: makeName(disAdvModifierLabel, localOverride),
        hint: makeHint(disAdvModifierHint, localHint),
        scope: "client",
        config: true,
        type: String,
        default: "default",
        choices: localModifierChoices,
    });
}

export function getSettingLocalOrDefault(settingKey) {
    const localKey = `${settingKey}Local`;
    const globalKey = `${settingKey}Global`;
    const value = game.settings.get(MODULE_NAME, localKey);
    return value === "default" ? game.settings.get(MODULE_NAME, globalKey) : value;
}
