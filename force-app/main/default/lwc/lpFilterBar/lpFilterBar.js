/**
 * lpFilterBar
 * @author: Claude Sonnet 4.5
 * @date: 27th January 2026
 * @Description: Filter bar component for FundPanel LP Portal
 *
 * Provides dropdown filters for:
 * - Investment Vehicle selection
 * - Fund selection
 *
 * Implements instant filter application (<300ms target) with no "Apply" button.
 * Fires custom events when filters change for parent dashboard to update views.
 *
 * Events:
 * - filterchange: Fired when any filter changes
 *   detail: { vehicleId: string, fundId: string }
 */

import { LightningElement, track } from 'lwc';
import { getInvestmentVehicles, getFunds } from 'c/lpStaticDataService';

export default class LpFilterBar extends LightningElement {
    @track selectedVehicleId = 'all';
    @track selectedFundId = 'all';

    /**
     * Get investment vehicle options for dropdown
     */
    get vehicleOptions() {
        const vehicles = getInvestmentVehicles();
        return vehicles.map(vehicle => ({
            label: vehicle.name,
            value: vehicle.id
        }));
    }

    /**
     * Get fund options for dropdown
     * If vehicle is selected, filter funds by vehicle
     */
    get fundOptions() {
        const funds = getFunds();
        let filteredFunds = funds;

        // Filter funds by selected vehicle
        if (this.selectedVehicleId !== 'all') {
            filteredFunds = funds.filter(fund => fund.vehicleId === this.selectedVehicleId);
        }

        // Add "All Funds" option at the top
        const options = [{
            label: 'All Funds',
            value: 'all'
        }];

        // Add fund options
        filteredFunds.forEach(fund => {
            options.push({
                label: fund.name,
                value: fund.id
            });
        });

        return options;
    }

    /**
     * Check if any filters are active (not "all")
     */
    get hasActiveFilters() {
        return this.selectedVehicleId !== 'all' || this.selectedFundId !== 'all';
    }

    /**
     * Count of active filters
     */
    get activeFilterCount() {
        let count = 0;
        if (this.selectedVehicleId !== 'all') count++;
        if (this.selectedFundId !== 'all') count++;
        return count;
    }

    /**
     * Pluralize filter count text
     */
    get activeFilterCountPlural() {
        return this.activeFilterCount === 1 ? '' : 's';
    }

    /**
     * Handle investment vehicle selection change
     */
    handleVehicleChange(event) {
        const newVehicleId = event.detail.value;

        // If vehicle changed, check if current fund is still valid
        if (newVehicleId !== this.selectedVehicleId) {
            this.selectedVehicleId = newVehicleId;

            // Reset fund filter if current fund doesn't belong to new vehicle
            if (this.selectedFundId !== 'all') {
                const funds = getFunds();
                const currentFund = funds.find(f => f.id === this.selectedFundId);

                if (currentFund && currentFund.vehicleId !== newVehicleId && newVehicleId !== 'all') {
                    this.selectedFundId = 'all';
                }
            }

            this.fireFilterChangeEvent();
        }
    }

    /**
     * Handle fund selection change
     */
    handleFundChange(event) {
        const newFundId = event.detail.value;

        if (newFundId !== this.selectedFundId) {
            this.selectedFundId = newFundId;

            // If fund is selected, auto-select its vehicle if "all" is selected
            if (newFundId !== 'all' && this.selectedVehicleId === 'all') {
                const funds = getFunds();
                const selectedFund = funds.find(f => f.id === newFundId);

                if (selectedFund) {
                    this.selectedVehicleId = selectedFund.vehicleId;
                }
            }

            this.fireFilterChangeEvent();
        }
    }

    /**
     * Handle clear filters button click
     */
    handleClearFilters() {
        this.selectedVehicleId = 'all';
        this.selectedFundId = 'all';
        this.fireFilterChangeEvent();
    }

    /**
     * Fire custom event to notify parent of filter changes
     */
    fireFilterChangeEvent() {
        const filterChangeEvent = new CustomEvent('filterchange', {
            detail: {
                vehicleId: this.selectedVehicleId,
                fundId: this.selectedFundId
            }
        });

        this.dispatchEvent(filterChangeEvent);
    }

    /**
     * Public API method to get current filter state
     */
    getFilterState() {
        return {
            vehicleId: this.selectedVehicleId,
            fundId: this.selectedFundId
        };
    }

    /**
     * Public API method to programmatically set filters
     */
    setFilters(vehicleId, fundId) {
        let changed = false;

        if (vehicleId && vehicleId !== this.selectedVehicleId) {
            this.selectedVehicleId = vehicleId;
            changed = true;
        }

        if (fundId && fundId !== this.selectedFundId) {
            this.selectedFundId = fundId;
            changed = true;
        }

        if (changed) {
            this.fireFilterChangeEvent();
        }
    }
}
