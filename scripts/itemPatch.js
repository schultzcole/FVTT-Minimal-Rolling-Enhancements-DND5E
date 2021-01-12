import { libWrapper } from "../lib/libWrapper/shim.js";
import { MODULE_NAME } from "./const.js";
import { getSettingLocalOrDefault } from "./settings.js";

export function patchItemRollDamage() {
    libWrapper.register(MODULE_NAME, "CONFIG.Item.entityClass.prototype.rollDamage", async function (wrapped, ...args) {
        let {critical=false, /** @type MouseEvent */ event=null, options={}} = args[0];

        let noFastForwardModifier = getSettingLocalOrDefault("showRollDialogModifier");

        const optionsOverride = {
            fastForward: !event[noFastForwardModifier],
        };

        args[0].options = mergeObject(optionsOverride, critical, options);

        const itemDamageParts = this.data.data.damage.parts;
        if (itemDamageParts.length > 0) {
            const partRolls = await _rollDamageParts(this, wrapped, args[0]);
            const renderedRolls = await _renderCombinedDamageRollCard(partRolls);

            const messageData = await _createCombinedDamageMessageData(this, renderedRolls, critical, options);

            // Show DSN 3d dice if available
            if (game.dice3d) {
                const rollAnims =
                    partRolls.map(part => game.dice3d.showForRoll(part.roll, game.user, true, messageData.whisper, messageData.blind));
                await Promise.all(rollAnims);
            }

            await ChatMessage.create(messageData);

            // Return the array of Roll objects
            return partRolls;
        }
    }, "WRAPPER");
}

async function _rollDamageParts(item, innerRollDamage, { critical, event, spellLevel, versatile, options }) {
    const itemDamageParts = item.data.data.damage.parts;
    const partRolls = [];

    // Roll each of the item's damage parts separately.
    // Store the Roll results in `partRolls`, and the rendered roll html in `renderedRolls`
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

async function _renderCombinedDamageRollCard(rolls) {
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

    return content.prop("outerHTML");
}

async function _createCombinedDamageMessageData(item, content, critical, options) {
    // This decoy roll is used to convince foundry that the message has ROLL type
    const decoyRoll = new Roll("0").roll();

    // Set up data for the final message to be sent
    const messageData = {
        user: game.user._id,
        content,
        flavor: `${item.name} - ${game.i18n.localize("DND5E.DamageRoll")}`,
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

    const rollMode = options.rollMode ?? game.settings.get("core", "rollMode");
    ChatMessage.applyRollMode(messageData, rollMode);

    // Merge with data passed into the function call
    mergeObject(messageData, options, { insertKeys: false });
    mergeObject(messageData, options.messageData);

    return messageData;
}

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
