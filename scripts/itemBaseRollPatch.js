import { libWrapper } from "../lib/libWrapper/shim.js";
import { MODULE_NAME } from "./const.js";
import { pause } from "./utils.js";

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
    document.addEventListener("mouseup", () => {
        modifiers.clientX = null;
        modifiers.clientY = null;
    });

    libWrapper.register(MODULE_NAME, "CONFIG.Item.entityClass.prototype.roll", async function (wrapped, ...args) {
        const capturedModifiers = duplicate(modifiers);

        const autoRollCheck = game.settings.get(MODULE_NAME, "autoCheck");
        const autoRollDamage = game.settings.get(MODULE_NAME, "autoDamage");

        const extraOptions = { createMessage: false };
        if (args.length) {
            mergeObject(args[0], extraOptions);
        } else {
            args.push(extraOptions);
        }

        const messageData = await wrapped(...args);

        await pause(0);

        let damagePromise;
        if (autoRollCheck) {
            let checkRoll, title;
            if (this.hasAttack) {
                checkRoll = await this.rollAttack({ event: capturedModifiers, chatMessage: false });
                title = _createWeaponTitle(this, checkRoll);
            } else if (this.type === "tool") {
                checkRoll = await this.rollToolCheck({ event: capturedModifiers, chatMessage: false  });
                title = _createToolTitle(this, checkRoll);
            }

            await _replaceAbilityCheckButtonWithRollResult(messageData, checkRoll, title);

            messageData.flavor = undefined;
            messageData.roll = checkRoll;
            messageData.type = CONST.CHAT_MESSAGE_TYPES.ROLL;
        }
        const result = ChatMessage.create(messageData);

        if (this.hasDamage && autoRollDamage) {
            damagePromise = this.rollDamage({ event: capturedModifiers });
        }

        await Promise.all([damagePromise]);

        return result;
    }, "WRAPPER");
}

function _createWeaponTitle(item, roll) {
    let title = `${item.name} - ${game.i18n.localize("DND5E.AttackRoll")}`;

    const itemData = item.data.data;
    const consume = itemData.consume;
    if (consume?.type === "ammo") {
        const ammo = item.actor.items.get(consume.target);
        if (ammo) {
            title += ` [${ammo.name}]`;
        }
    }

    if (roll.terms[0].options.advantage) {
        title += ` (${game.i18n.localize("DND5E.Advantage")})`;
    } else if (roll.terms[0].options.disadvantage) {
        title += ` (${game.i18n.localize("DND5E.Disadvantage")})`;
    }

    return title;
}

function _createToolTitle(item, roll) {
    let title = `Tool: ${item.name}`;

    if (roll.terms[0].options.advantage) {
        title += ` (${game.i18n.localize("DND5E.Advantage")})`;
    } else if (roll.terms[0].options.disadvantage) {
        title += ` (${game.i18n.localize("DND5E.Disadvantage")})`;
    }

    return title;
}

async function _replaceAbilityCheckButtonWithRollResult(messageData, roll, title) {
    const content = $(messageData.content);
    const cardContent = content.find(".card-content");
    cardContent.after(await roll.render());
    cardContent.after(`<span class="flavor-text">${title}</span>`);
    cardContent.after("<hr />");
    const buttonContainer = content.find(".card-buttons");
    if (buttonContainer.find("button").length > 1) buttonContainer.before("<hr />");
    content.find("[data-action=attack],[data-action=toolCheck]").remove();

    messageData.content = content.prop("outerHTML");
}
