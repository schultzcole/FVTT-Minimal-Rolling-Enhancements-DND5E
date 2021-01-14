import { MODULE_NAME } from "../const.js";
import { createEmptyDamageGroup } from "../damage-group.js";

export class DamageGroupConfig extends BaseEntitySheet {
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            classes: [ "dnd5e", "mre-damage-group-config" ],
            template: "modules/mre-dnd5e/templates/damage-group-config.hbs",
            width: "auto",
            height: "auto",
            closeOnSubmit: false,
            submitOnClose: true,
            submitOnChange: true,
        });
    }

    get title() { return `${game.i18n.localize(`${MODULE_NAME}.DAMAGE-GROUP.DialogTitle`)}: ${this.entity.name}`; }

    getData(options) {
        const itemData = this.entity.data.data;
        const dmgGroupData = this._getDamageGroupData();
        console.log("getDamageGroupData", dmgGroupData);
        return {
            formulas: itemData.damage.parts.map(p => ({
                formula: p[0]?.trim()?.length ? p[0] : "<Empty>",
                type: p[1],
                typeLabel: CONFIG.DND5E.damageTypes[p[1]] ?? CONFIG.DND5E.healingTypes[p[1]] ?? game.i18n.localize("DND5E.None"),
            })),
            damageGroups: dmgGroupData,
        };
    }

    _getDamageGroupData() {
        /** @type DamageGroup[] */
        const groups = duplicate(this.entity.getFlag(MODULE_NAME, "damageGroups"));
        const totalFormulaCount = this.entity.data.data.damage.parts.length;
        return groups.map(g => ({
            label: g.label,
            containsFormula: (new Array(totalFormulaCount)).fill(false).map((_, i) => g.formulaSet.includes(i)),
        }));
    }

    _getHeaderButtons() {
        const existing = super._getHeaderButtons();
        existing[0].label = game.i18n.localize(`${MODULE_NAME}.DAMAGE-GROUP.SaveAndClose`);
        return existing;
    }

    activateListeners(html) {
        super.activateListeners(html);

        html.find(".add-damage-group").click(this._handleAddDamageGroup.bind(this));
        html.find(".delete-damage-group").click(this._handleDeleteDamageGroup.bind(this));
    }

    async _handleAddDamageGroup() {
        const groups = duplicate(this.entity.data.flags[MODULE_NAME].damageGroups);
        groups.push(createEmptyDamageGroup(groups.length));
        await this.entity.update({ [`flags.${MODULE_NAME}.damageGroups`]: groups });
        this.position.width = "auto";
        this.render(false);
    }

    async _handleDeleteDamageGroup(event) {
        const index = event.currentTarget.dataset.groupIndex;
        const groups = duplicate(this.entity.data.flags[MODULE_NAME].damageGroups);
        groups.splice(index, 1);
        await this.entity.update({ [`flags.${MODULE_NAME}.damageGroups`]: groups });
        this.position.width = "auto";
        this.render(false);
    }

    async _updateObject(event, formData) {
        console.log(formData);
        const groups = [];
        for (let [key, value] of Object.entries(formData)) {
            // key is expected to be of the form damageGroup[x].label OR damageGroup[x].containsFormula[y]
            const [groupIdx, groupProp, formulaIdx] = key.split(/[.|\[\]]/).filter(s => s.trim().length).slice(1);
            const parsedGroupIdx = parseInt(groupIdx);
            const parsedFormulaIdx = parseInt(formulaIdx);
            let group = groups[parsedGroupIdx] ?? {};

            // No formula index provided, property must not be an array
            if (isNaN(parsedFormulaIdx)) {
                group[groupProp] = value;

            // A formula index was provided, meaning that this property must be an array
            } else {
                if (!group[groupProp]) group[groupProp] = [];
                group[groupProp][parsedFormulaIdx] = value;
            }

            groups[parsedGroupIdx] = group;
        }
        const damageGroups = groups.map(group => ({
            label: group.label,
            formulaSet: group.containsFormula.reduce((acc, next, idx) => {
                    if (next) acc.push(idx);
                    return acc;
                }, []),
        }));
        console.log(damageGroups);
        await this.entity.setFlag(MODULE_NAME, "damageGroups", damageGroups);
        this.position.width = "auto";
        this.render(true);
    }
}
