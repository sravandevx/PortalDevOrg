/**
 * lpReportsModal
 * @author: Claude Sonnet 4.5
 * @date: 27th January 2026
 * @Description: Modal component for displaying portfolio metrics in tabular format
 *
 * Displays the 5 key metrics in a clean table suitable for screenshots and record-keeping:
 * - Total Commitments
 * - Total Called
 * - Total Distributions
 * - Estimated Value
 * - Estimated TVPI
 *
 * Props:
 * - metrics: Object with { totalCommitments, totalCalled, totalDistributions, estimatedValue, estimatedTVPI }
 * - filterState: Object with { vehicleId, fundId } to show filter context
 */

import { LightningElement, api, track } from 'lwc';
import { formatCurrency, formatTVPI } from 'c/lpStaticDataService';

export default class LpReportsModal extends LightningElement {
    @track isOpen = false;
    @api metrics = {}; // Portfolio metrics object
    @api filterState = { vehicleId: 'all', fundId: 'all' }; // Current filter state

    /**
     * Metrics data formatted for table display
     */
    get metricsData() {
        if (!this.metrics) {
            return [];
        }

        return [
            {
                key: 'total-commitments',
                name: 'Total Commitments',
                value: formatCurrency(this.metrics.totalCommitments || 0)
            },
            {
                key: 'total-called',
                name: 'Total Called',
                value: formatCurrency(this.metrics.totalCalled || 0)
            },
            {
                key: 'total-distributions',
                name: 'Total Distributions',
                value: formatCurrency(this.metrics.totalDistributions || 0)
            },
            {
                key: 'estimated-value',
                name: 'Estimated Value',
                value: formatCurrency(this.metrics.estimatedValue || 0)
            },
            {
                key: 'estimated-tvpi',
                name: 'Estimated TVPI',
                value: formatTVPI(this.metrics.estimatedTVPI || 0)
            }
        ];
    }

    /**
     * Check if any filters are active
     */
    get hasActiveFilters() {
        return this.filterState &&
               (this.filterState.vehicleId !== 'all' || this.filterState.fundId !== 'all');
    }

    /**
     * Filter description text
     */
    get filterDescription() {
        if (!this.hasActiveFilters) {
            return '';
        }

        const parts = [];

        if (this.filterState.vehicleId !== 'all') {
            parts.push(`Investment Vehicle: ${this.filterState.vehicleId}`);
        }

        if (this.filterState.fundId !== 'all') {
            parts.push(`Fund: ${this.filterState.fundId}`);
        }

        return parts.join(', ');
    }

    /**
     * Public API method to open modal
     */
    @api
    open(metrics, filterState) {
        if (metrics) {
            this.metrics = metrics;
        }

        if (filterState) {
            this.filterState = filterState;
        }

        this.isOpen = true;

        // Set focus to modal after animation
        setTimeout(() => {
            const closeButton = this.template.querySelector('.close-button');
            if (closeButton) {
                closeButton.focus();
            }
        }, 300);
    }

    /**
     * Public API method to close modal
     */
    @api
    close() {
        this.isOpen = false;

        // Fire close event
        this.dispatchEvent(new CustomEvent('close'));
    }

    /**
     * Handle close button click
     */
    handleClose() {
        this.close();
    }

    /**
     * Handle backdrop click to close modal
     */
    handleBackdropClick() {
        this.close();
    }

    /**
     * Handle keyboard events (ESC to close)
     */
    connectedCallback() {
        this.boundHandleKeyDown = this.handleKeyDown.bind(this);
        this.isEventListenerAttached = true;
        document.addEventListener('keydown', this.boundHandleKeyDown);
    }

    disconnectedCallback() {
        // Ensure event listener is properly removed
        if (this.isEventListenerAttached && this.boundHandleKeyDown) {
            document.removeEventListener('keydown', this.boundHandleKeyDown);
            this.isEventListenerAttached = false;
        }
    }

    handleKeyDown(event) {
        if (this.isOpen && event.key === 'Escape') {
            this.close();
        }
    }
}
