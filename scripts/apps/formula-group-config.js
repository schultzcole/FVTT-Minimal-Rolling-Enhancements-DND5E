import { MODULE_NAME } from "../const.js";
import { createNewFormulaGroup } from "../formula-group.js";

const MAX_FORMULA_GROUPS = 7;

export class FormulaGroupConfig extends BaseEntitySheet {
    /** @override */
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            classes: [ "dnd5e", "mre-formula-group-config" ],
            template: "modules/mre-dnd5e/templates/formula-group-config.hbs",
            width: "auto",
            height: "auto",
            closeOnSubmit: false,
            submitOnClose: true,
            submitOnChange: true,
        });
    }

    /** @override */
    get title() { return `${game.i18n.localize(`${MODULE_NAME}.FORMULA-GROUP.DialogTitle`)}: ${this.entity.name}`; }

    /** @override */
    getData(options) {
        const itemData = this.entity.data.data;
        const formulaGroupData = this._getFormulaGroupData();
        const emptyString = game.i18n.localize(`${MODULE_NAME}.FORMULA-GROUP.Empty`)
        return {
            formulas: itemData.damage.parts.map(p => ({
                formula: p[0]?.trim()?.length ? p[0] : `<${emptyString}>`,
                type: p[1],
                typeLabel: CONFIG.DND5E.damageTypes[p[1]] ?? CONFIG.DND5E.healingTypes[p[1]] ?? game.i18n.localize("DND5E.None"),
            })),
            formulaGroups: formulaGroupData,
            canAdd: formulaGroupData.length < MAX_FORMULA_GROUPS,
        };
    }

    _getFormulaGroupData() {
        /** @type FormulaGroup[] */
        const groups = duplicate(this.entity.getFlag(MODULE_NAME, "formulaGroups"));
        const totalFormulaCount = this.entity.data.data.damage.parts.length;
        return groups.map(g => ({
            label: g.label,
            containsFormula: (new Array(totalFormulaCount)).fill(false).map((_, i) => g.formulaSet.includes(i)),
        }));
    }

    /** @override */
    _getHeaderButtons() {
        const existing = super._getHeaderButtons()
        if (!this.isEditable) return existing;

        // Remove all buttons except for the "Close" button, and re-label it to "Save & Close"
        const closeButton = existing[existing.length - 1];
        closeButton.label = game.i18n.localize(`${MODULE_NAME}.FORMULA-GROUP.SaveAndClose`);
        return [closeButton];
    }

    /** @override */
    activateListeners(html) {
        super.activateListeners(html);

        if (this.isEditable) {
            html.find(".add-formula-group").click(this._handleAddFormulaGroup.bind(this));
            html.find(".delete-formula-group").click(this._handleDeleteFormulaGroup.bind(this));
        }
    }

    async _handleAddFormulaGroup() {
        const groups = duplicate(this.entity.data.flags[MODULE_NAME].formulaGroups);
        groups.push(createNewFormulaGroup({ index: groups.length }));
        await this.entity.update({ [`flags.${MODULE_NAME}.formulaGroups`]: groups });
        this.position.width = "auto";
        this.render(false);
    }

    async _handleDeleteFormulaGroup(event) {
        const index = event.currentTarget.dataset.groupIndex;
        const groups = duplicate(this.entity.data.flags[MODULE_NAME].formulaGroups);
        groups.splice(index, 1);
        await this.entity.update({ [`flags.${MODULE_NAME}.formulaGroups`]: groups });
        this.position.width = "auto";
        this.render(false);
    }

    /** @override */
    async _updateObject(event, formData) {
        if (!this.isEditable) return;
        const groups = [];
        for (let [key, value] of Object.entries(formData)) {
            // key is expected to be of the form formulaGroups[x].label OR formulaGroups[x].containsFormula[y]
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
        const formulaGroups = groups.map(group => ({
            label: group.label,
            formulaSet: group.containsFormula.reduce((acc, next, idx) => {
                    if (next) acc.push(idx);
                    return acc;
                }, []),
        }));
        await this.entity.setFlag(MODULE_NAME, "formulaGroups", formulaGroups);
        this.position.width = "auto";
        this.render(true);
    }
}
