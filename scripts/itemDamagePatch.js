import { MODULE_NAME } from "./const.js";
import { libWrapper } from "../lib/libWrapper/shim.js";
import { getModifierSettingLocalOrDefault } from "./settings.js";

export function patchItemRollDamage() {
    libWrapper.register(MODULE_NAME, "CONFIG.Item.entityClass.prototype.rollDamage", async function (wrapped, ...args) {
        let {/** @type MouseEvent */ event=null, options={}} = args[0];

        let showDamageDialog = getModifierSettingLocalOrDefault("showRollDialogModifier");

        const title = `${this.name} - ${game.i18n.localize("DND5E.DamageRoll")}`;
        let rollMode = options.rollMode ?? game.settings.get("core", "rollMode");
        let critical = false;
        let bonus = null;

        // Show a custom dialog that applies to all damage parts
        if (event[showDamageDialog]) {
            const dialogOptions = {
                top: event ? event.clientY - 80 : null,
                left: window.innerWidth - 710,
            };
            const dialogData = await _damageDialog({ title, rollMode, dialogOptions });

            if (!dialogData) return null;

            critical = dialogData?.critical ?? critical;
            rollMode = dialogData?.rollMode ?? rollMode;
            bonus = dialogData?.bonus ?? bonus;
        }

        // Skip core dnd5e dialog
        if (!args[0].options) args[0].options = {};
        args[0].options.fastForward = true;
        args[0].critical = critical;

        if (!this.data.data.damage?.parts) throw new Error("You cannot roll damage for this item.");

        // Roll each individual damage formula
        const partRolls = await _rollDamageParts(this, wrapped, args[0]);

        // Add a situational bonus if one was provided
        if (bonus) {
            const bonusRoll = new Roll(bonus);
            if (critical) {
                bonusRoll.alter(2, 0);
            }
            partRolls.push({ roll: bonusRoll.roll(), flavor: game.i18n.localize("DND5E.RollSituationalBonus").slice(0, -1) })
        }

        // Prepare the chat message content
        const renderedContent = await _renderCombinedDamageRollContent(partRolls);

        const messageData = await _createCombinedDamageMessageData(this, title, renderedContent, critical, rollMode, options);

        // Show DSN 3d dice if available
        if (game.dice3d) {
            const rollAnims =
                partRolls.map(part => game.dice3d.showForRoll(part.roll, game.user, true, messageData.whisper, messageData.blind));
            await Promise.all(rollAnims);
        }

        await ChatMessage.create(messageData);

        // Return the array of Roll objects
        return partRolls;
    }, "MIXED");
}

/**
 * @returns {Promise<{ critical: Boolean, bonus: Number, rollMode: String }>}
 * @private
 */
async function _damageDialog({ title, rollMode, dialogOptions }={}) {
    const template = "systems/dnd5e/templates/chat/roll-dialog.html";
    const dialogData = {
        formula: "",
        rollMode: rollMode,
        rollModes: CONFIG.Dice.rollModes,
    };
    const content = $(await renderTemplate(template, dialogData));

    content.find("[name=formula]").closest(".form-group").remove();

    return new Promise(resolve => {
        new Dialog({
            title,
            content: content.prop("outerHTML"),
            buttons: {
                critical: {
                    label: game.i18n.localize("DND5E.CriticalHit"),
                    callback: html => resolve({ critical: true, ..._parseDamageDialog(html[0].querySelector("form")) })
                },
                normal: {
                    label: game.i18n.localize("DND5E.Normal"),
                    callback: html => resolve({ critical: false, ..._parseDamageDialog(html[0].querySelector("form")) })
                },
            },
            default: "normal",
            close: () => resolve(null)
        }, dialogOptions).render(true);
    });
}

function _parseDamageDialog(form) {
    return form ? {
        bonus: form.bonus.value,
        rollMode: form.rollMode.value,
    } : {};
}

async function _rollDamageParts(item, innerRollDamage, { critical, event, spellLevel, versatile, options }) {
    const itemDamageParts = item.data.data.damage.parts;
    const partRolls = [];

    // Roll each of the item's damage parts separately.
    for (let [formula, type] of itemDamageParts) {
        const partOptions = {
            parts: [formula],
            flavor: `${CONFIG.DND5E.damageTypes[type] ?? CONFIG.DND5E.healingTypes[type]}`,
            chatMessage: false,
        };
        /** @type Roll */ const roll = await innerRollDamage({
            critical,
            event,
            spellLevel,
            versatile,
            options: mergeObject(options, partOptions, { inplace: false }),
        });
        if (!roll) continue;
        partRolls.push({ roll, flavor: partOptions.flavor });
    }
    return partRolls;
}

async function _renderCombinedDamageRollContent(rolls) {
    const renderedRolls = [];

    // Render all each of the rolls to html
    for (let part of rolls) {
        const rendered = $(await part.roll.render());
        const formulaElement = rendered.find(".dice-total");
        formulaElement.attr("data-damage-type", part.flavor);
        renderedRolls.push(rendered);
    }

    // Assemble them under one container div
    const content = $("<div class=\"mre-damage-card\">");
    content.append(renderedRolls);
    content.find(".dice-roll:not(:last-child)").after("<hr />");

    return content.prop("outerHTML");
}

async function _createCombinedDamageMessageData(item, flavor, content, critical, rollMode, options) {
    // This decoy roll is used to convince foundry that the message has ROLL type
    const decoyRoll = new Roll("0").roll();

    // Set up data for the final message to be sent
    const messageData = {
        user: game.user._id,
        content,
        flavor,
        roll: decoyRoll,
        speaker: ChatMessage.getSpeaker({actor: item.actor}),
        type: CONST.CHAT_MESSAGE_TYPES.ROLL,
        "flags.dnd5e.roll": {type: "damage", itemId: item.id },
    };

    if (!game.dice3d) messageData.sound = CONFIG.sounds.dice;

    if (critical) {
        messageData.flavor += ` (${game.i18n.localize("DND5E.Critical")})`;
        messageData["flags.dnd5e.roll"].critical = true;
    }

    ChatMessage.applyRollMode(messageData, rollMode);

    // Merge with data passed into the function call
    mergeObject(messageData, options, { insertKeys: false });
    mergeObject(messageData, options.messageData);

    return messageData;
}
