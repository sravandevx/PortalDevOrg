/**
 * lpPortalDashboard
 * @author: Claude Sonnet 4.5
 * @date: 27th January 2026
 * @Description: Main dashboard container for FundPanel LP Portal
 *
 * Orchestrates all child components:
 * - lpFilterBar: Filter controls
 * - lpMetricCard (5 instances): Key portfolio metrics
 * - lpDonutChart: Fund allocation visualization
 * - lpPerformanceChart: Performance over time
 * - lpReportsModal: Tabular data view
 *
 * Manages:
 * - Filter state (vehicleId, fundId)
 * - Instant filter updates (<300ms target)
 * - Data synchronization across all components
 * - Modal interactions
 */

import { LightningElement, track } from 'lwc';
import {
    getPortfolioMetrics,
    getFundAllocation,
    getPerformanceData,
    getInvestmentVehicles,
    getFunds
} from 'c/lpStaticDataService';

export default class LpPortalDashboard extends LightningElement {
    // Filter state
    @track currentVehicleId = 'all';
    @track currentFundId = 'all';

    // Portfolio data
    @track metrics = {};
    @track allocationData = [];
    @track performanceData = [];

    // UI state
    @track isLoading = false;

    // Track pending operations to prevent race conditions
    pendingTimeout = null;

    /**
     * Initialize dashboard on component load
     */
    connectedCallback() {
        this.loadDashboardData();
    }

    /**
     * Load all dashboard data based on current filter state
     */
    loadDashboardData() {
        // Get metrics for current filter
        this.metrics = getPortfolioMetrics(this.currentVehicleId, this.currentFundId);

        // Get fund allocation for donut chart
        this.allocationData = getFundAllocation(this.currentVehicleId, this.currentFundId);

        // Get performance data for line chart
        this.performanceData = getPerformanceData(this.currentVehicleId, this.currentFundId);
    }

    /**
     * Handle filter change from lpFilterBar
     * Implements instant filter application (<300ms target)
     */
    handleFilterChange(event) {
        const { vehicleId, fundId } = event.detail;

        // Cancel any pending operation to prevent race conditions
        if (this.pendingTimeout) {
            clearTimeout(this.pendingTimeout);
            this.pendingTimeout = null;
        }

        // Show loading indicator briefly for visual feedback
        this.isLoading = true;

        // Update filter state
        this.currentVehicleId = vehicleId;
        this.currentFundId = fundId;

        // Use setTimeout to ensure smooth transition
        // In production with real API, this would be replaced with actual API call
        this.pendingTimeout = setTimeout(() => {
            this.loadDashboardData();
            this.isLoading = false;
            this.pendingTimeout = null;
        }, 100); // Simulated delay, well under 300ms target
    }

    /**
     * Handle fund segment click from donut chart
     * Auto-applies fund filter when user clicks a fund segment
     */
    handleFundClick(event) {
        const { fundId } = event.detail;

        if (fundId && fundId !== this.currentFundId) {
            // Cancel any pending operation to prevent race conditions
            if (this.pendingTimeout) {
                clearTimeout(this.pendingTimeout);
                this.pendingTimeout = null;
            }

            // Get fund details to also set vehicle filter
            const funds = getFunds();
            const selectedFund = funds.find(f => f.id === fundId);

            if (selectedFund) {
                this.isLoading = true;

                // Update both filters
                this.currentVehicleId = selectedFund.vehicleId;
                this.currentFundId = fundId;

                this.pendingTimeout = setTimeout(() => {
                    this.loadDashboardData();

                    // Update filter bar UI to reflect new selection
                    const filterBar = this.template.querySelector('c-lp-filter-bar');
                    if (filterBar) {
                        filterBar.setFilters(this.currentVehicleId, this.currentFundId);
                    }

                    this.isLoading = false;
                    this.pendingTimeout = null;
                }, 100);
            }
        }
    }

    /**
     * Handle "View Reports" button click
     * Opens modal with tabular data
     */
    handleViewReportsClick() {
        const modal = this.template.querySelector('c-lp-reports-modal');

        if (modal) {
            // Pass current metrics and filter state to modal
            const filterState = {
                vehicleId: this.currentVehicleId,
                fundId: this.currentFundId
            };

            modal.open(this.metrics, filterState);
        }
    }

    /**
     * Handle modal close event
     */
    handleModalClose() {
        // Modal closed, no action needed
        // Could add analytics tracking here
    }

    /**
     * Get current filter state description for accessibility
     */
    get filterStateDescription() {
        if (this.currentVehicleId === 'all' && this.currentFundId === 'all') {
            return 'Showing all investments';
        }

        const vehicles = getInvestmentVehicles();
        const funds = getFunds();

        const parts = [];

        if (this.currentVehicleId !== 'all') {
            const vehicle = vehicles.find(v => v.id === this.currentVehicleId);
            if (vehicle) {
                parts.push(`Vehicle: ${vehicle.name}`);
            }
        }

        if (this.currentFundId !== 'all') {
            const fund = funds.find(f => f.id === this.currentFundId);
            if (fund) {
                parts.push(`Fund: ${fund.name}`);
            }
        }

        return `Showing ${parts.join(', ')}`;
    }

    /**
     * Public API method to reset all filters
     */
    resetFilters() {
        this.currentVehicleId = 'all';
        this.currentFundId = 'all';
        this.loadDashboardData();

        // Update filter bar UI
        const filterBar = this.template.querySelector('c-lp-filter-bar');
        if (filterBar) {
            filterBar.setFilters('all', 'all');
        }
    }

    /**
     * Public API method to apply specific filter
     */
    applyFilter(vehicleId, fundId) {
        this.currentVehicleId = vehicleId || 'all';
        this.currentFundId = fundId || 'all';
        this.loadDashboardData();

        // Update filter bar UI
        const filterBar = this.template.querySelector('c-lp-filter-bar');
        if (filterBar) {
            filterBar.setFilters(this.currentVehicleId, this.currentFundId);
        }
    }

    /**
     * Public API method to refresh dashboard data
     * Useful when data source updates (future API integration)
     */
    refreshData() {
        this.isLoading = true;

        setTimeout(() => {
            this.loadDashboardData();
            this.isLoading = false;
        }, 500);
    }

    /**
     * Error boundary - handle errors in child components
     */
    errorCallback(error, stack) {
        console.error('Dashboard Error:', error);
        console.error('Stack:', stack);

        // Hide loading state if error occurs
        this.isLoading = false;

        // In production, could show user-friendly error message or
        // fire event to parent for centralized error handling
    }
}