import { libWrapper } from "../../lib/libWrapper/shim.js";
import { MODULE_NAME } from "../const.mjs";
import { SETTING_NAMES } from "../settings.mjs";
import { modifiers } from "../modifiers.mjs";
import { initializeFormulaGroups } from "./initialize-formula-groups.mjs";
import { pause } from "../utils.mjs";

export function patchItemBaseRoll() {
    libWrapper.register(MODULE_NAME, "CONFIG.Item.entityClass.prototype.roll", async function patchedRoll(wrapped, ...args) {
        await initializeFormulaGroups(this);

        const capturedModifiers = duplicate(modifiers);

        const autoRollCheckSetting = game.settings.get(MODULE_NAME, SETTING_NAMES.AUTO_CHECK);
        const autoRollDamageSetting = game.settings.get(MODULE_NAME, SETTING_NAMES.AUTO_DMG);
        const autoRollCheckWithOverride = this.getFlag(MODULE_NAME, "autoRollAttack") ?? autoRollCheckSetting;
        const autoRollDamageWithOverride = this.getFlag(MODULE_NAME, "autoRollDamage") ?? autoRollDamageSetting;
        const autoRollOther = this.getFlag(MODULE_NAME, "autoRollOther");

        // Force our call to the original Item5e#roll to not show a chat card, but remember whether *our* caller wants a chat message or not
        // If the caller above us set createMessage to false, we should not create a chat card and instead just return our message data.
        let originalCreateMessage = true;
        if (args.length) {
            originalCreateMessage = args[0].createMessage ?? originalCreateMessage;
            mergeObject(args[0], { createMessage: false });
        } else {
            args.push({ createMessage: false });
        }

        // Call the original Item5e#roll and get the resulting message data
        const messageData = await wrapped(...args);

        // User quit out of the dialog workflow early (or some other failure)
        if (!messageData) return;

        // Make a roll if auto rolls is on, and replace the appropriate button in the item card with the rendered roll results
        let checkRoll;
        let expectRoll;
        if (autoRollCheckWithOverride) {
            let title;
            if (this.hasAttack) {
                expectRoll = true;
                checkRoll = await this.rollAttack({ event: capturedModifiers, chatMessage: false });
                if (checkRoll) title = _createWeaponTitle(this, checkRoll);
            } else if (this.type === "tool") {
                expectRoll = true;
                checkRoll = await this.rollToolCheck({ event: capturedModifiers, chatMessage: false  });
                if (checkRoll) title = _createToolTitle(this, checkRoll);
            }

            if (checkRoll) {
                await _replaceAbilityCheckButtonWithRollResult(messageData, this, checkRoll, title);

                messageData.flavor = undefined;
                messageData.roll = checkRoll;
                messageData.type = CONST.CHAT_MESSAGE_TYPES.ROLL;
                messageData.sound = CONFIG.sounds.dice;
            } else if (expectRoll) {
                return;
            }
        }

        if (this.hasDamage) _replaceDamageButtons(messageData, this);

        const result = originalCreateMessage ? await ChatMessage.create(messageData) : messageData;

        if (this.hasDamage && autoRollDamageWithOverride) {
            await pause(100);

            // Extract spell level from the message data created by the wrapped call to Item#roll
            const spellLevel = parseInt($(messageData.content).attr("data-spell-level"));

            const options = { event: capturedModifiers, spellLevel };
            if (args.length && Number.isNumeric(args[0].spellLevel)) options.spellLevel = args[0].spellLevel;
            if (checkRoll) {
                options.critical = checkRoll.results[0] >= checkRoll.terms[0].options.critical;
            }
            await this.rollDamage(options);
        }

        if (this.data.data.formula?.length && autoRollOther) {
            await pause(100);
            await this.rollFormula({ event: capturedModifiers });
        }

        return result;
    }, "WRAPPER");
}

function _createWeaponTitle(item, roll) {
    let title = game.i18n.localize("DND5E.AttackRoll");

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
    let title = game.i18n.localize("DND5E.ToolCheck");

    if (roll.terms[0].options.advantage) {
        title += ` (${game.i18n.localize("DND5E.Advantage")})`;
    } else if (roll.terms[0].options.disadvantage) {
        title += ` (${game.i18n.localize("DND5E.Disadvantage")})`;
    }

    return title;
}

async function _replaceAbilityCheckButtonWithRollResult(messageData, item, roll, title) {
    const content = $(messageData.content);
    content.find(".chat-card").addClass("mre-item-card");
    const cardContent = content.find(".card-content");

    // Remove existing attack and tool check buttons
    content.find("[data-action=attack],[data-action=toolCheck]").remove();

    // Add separator between item description and roll
    cardContent.append("<hr />");

    // Add the attack roll to the card
    const cardRoll = $(`<div class="card-roll">`);
    cardRoll.append(`<span class="flavor-text">${title}</span>`);
    cardRoll.append(await roll.render());
    cardContent.after(cardRoll);

    // Add separator between roll and roll buttons
    const cardButtons = content.find(".card-buttons");
    if (cardButtons.find("button").length > 0) cardButtons.before("<hr />");

    messageData.content = content.prop("outerHTML");
}

function _replaceDamageButtons(messageData, item) {
    const content = $(messageData.content);
    content.find(".chat-card").addClass("mre-item-card");

    // Remove existing damage and versatile buttons
    content.find("[data-action=damage],[data-action=versatile]").remove();

    // Create formula group buttons
    const formulaGroups = item.getFlag(MODULE_NAME, "formulaGroups");
    const damageText = game.i18n.localize("DND5E.Damage");
    const healingText = game.i18n.localize("DND5E.Healing");
    const damageButtons = formulaGroups.map((group, i) => {
        let buttonText = item.data.data.actionType === "heal" ? healingText : damageText;
        if (formulaGroups.length > 1) buttonText += ` (${group.label})`;
        return $(`<button data-action="formula-group" data-formula-group="${i}">${buttonText}</button>`);
    });

    // Inject formula group buttons
    const attackButton = content.find("[data-action=attack],[data-action=toolCheck]").last();
    const cardButtons = content.find(".card-buttons");
    if (attackButton.length) {
        attackButton.after(damageButtons);
    } else {
        cardButtons.prepend(damageButtons);
    }

    messageData.content = content.prop("outerHTML");
}
