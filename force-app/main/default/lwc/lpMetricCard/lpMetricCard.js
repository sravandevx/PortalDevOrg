/**
 * lpMetricCard
 * @author: Claude Sonnet 4.5
 * @date: 27th January 2026
 * @Description: Reusable metric card component for FundPanel LP Portal
 *
 * Displays a single portfolio metric (e.g., Total Commitments, TVPI) with:
 * - Label (e.g., "Total Commitments")
 * - Value (e.g., "$618,886,450.23" or "1.33")
 * - Optional change indicator (e.g., "+2.5%" in green)
 *
 * Material Design 3 styling with responsive typography
 *
 * Usage:
 * <c-lp-metric-card
 *     label="Total Commitments"
 *     value="618886450.23"
 *     format-type="currency"
 *     change-value="2.5"
 * ></c-lp-metric-card>
 */

import { LightningElement, api } from 'lwc';
import { formatCurrency, formatPercentage, formatTVPI } from 'c/lpStaticDataService';

export default class LpMetricCard extends LightningElement {
    @api label; // Metric label (e.g., "Total Commitments")
    @api value; // Numeric value
    @api formatType = 'currency'; // 'currency', 'percentage', 'tvpi', or 'number'
    @api changeValue; // Optional: percentage change value (e.g., 2.5 for +2.5%)

    /**
     * Generate unique ID for label (accessibility)
     */
    get labelId() {
        if (!this.label) {
            return 'metric-label-default';
        }
        return `metric-label-${this.label.replace(/\s+/g, '-').toLowerCase()}`;
    }

    /**
     * Format display value based on format type
     */
    get displayValue() {
        if (this.value === null || this.value === undefined) {
            return '--';
        }

        const numValue = typeof this.value === 'string' ? parseFloat(this.value) : this.value;

        switch (this.formatType) {
            case 'currency':
                return formatCurrency(numValue);
            case 'percentage':
                return formatPercentage(numValue);
            case 'tvpi':
                return formatTVPI(numValue);
            case 'number':
            default:
                return numValue.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                });
        }
    }

    /**
     * ARIA label for value (screen readers)
     */
    get valueAriaLabel() {
        return `${this.label} value: ${this.displayValue}`;
    }

    /**
     * Whether to show change indicator
     */
    get showChange() {
        return this.changeValue !== null && this.changeValue !== undefined;
    }

    /**
     * Change text with + or - prefix
     */
    get changeText() {
        if (!this.showChange) return '';

        const change = typeof this.changeValue === 'string'
            ? parseFloat(this.changeValue)
            : this.changeValue;

        const prefix = change >= 0 ? '+' : '';
        return `${prefix}${formatPercentage(Math.abs(change))}`;
    }

    /**
     * CSS class for change indicator (positive = green, negative = red)
     */
    get changeClass() {
        const change = typeof this.changeValue === 'string'
            ? parseFloat(this.changeValue)
            : this.changeValue;

        return `metric-change ${change >= 0 ? 'positive' : 'negative'}`;
    }

    /**
     * ARIA label for change value
     */
    get changeAriaLabel() {
        if (!this.showChange) return '';

        const change = typeof this.changeValue === 'string'
            ? parseFloat(this.changeValue)
            : this.changeValue;

        const direction = change >= 0 ? 'increased' : 'decreased';
        return `${direction} by ${this.changeText}`;
    }
}