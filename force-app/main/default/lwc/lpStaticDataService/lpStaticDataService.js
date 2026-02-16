/**
 * lpStaticDataService
 * @author: Claude Sonnet 4.5
 * @date: 27th January 2026
 * @Description: Static data service for FundPanel LP Portal MVP
 *
 * Provides static portfolio data with clear interfaces for future backend integration.
 * Data structure matches PRD and UX Design Specification requirements.
 *
 * Data Interfaces:
 * - InvestmentMetrics: 5 key portfolio metrics (Commitments, Called, Distributions, Value, TVPI)
 * - FundAllocation: Fund-level allocation data for donut chart
 * - PerformanceDataPoint: Time-series data for performance chart
 * - InvestmentVehicle: Vehicle-level groupings
 */

/**
 * Investment Vehicles data
 * @returns {Array<{id: string, name: string}>}
 */
export function getInvestmentVehicles() {
    return [
        { id: 'all', name: 'All Investment Vehicles' },
        { id: 'iv1', name: 'Investment Vehicle 1' },
        { id: 'iv2', name: 'Investment Vehicle 2' }
    ];
}

/**
 * Funds data with allocation percentages (dynamically calculated)
 * @returns {Array<{id: string, name: string, vehicleId: string, allocation: number, color: string}>}
 */
export function getFunds() {
    // Get total commitments for percentage calculation
    const totalPortfolioCommitments = getPortfolioMetrics('all', 'all').totalCommitments;

    // Fund base data (allocation percentages calculated dynamically)
    const fundBaseData = [
        { id: 'pbventures', name: 'PB Ventures Fund', vehicleId: 'iv1', color: '#1976D2' },
        { id: 'norton', name: 'Norton Ventures', vehicleId: 'iv1', color: '#388E3C' },
        { id: 'wanye', name: 'Wanye', vehicleId: 'iv2', color: '#F57C00' },
        { id: 'violet', name: 'Violet', vehicleId: 'iv2', color: '#7B1FA2' },
        { id: '123', name: '123', vehicleId: 'iv2', color: '#C2185B' },
        { id: 'mjk', name: 'MJK', vehicleId: 'iv1', color: '#0097A7' }
    ];

    // Calculate allocation percentages from commitments
    return fundBaseData.map(fund => {
        const fundMetrics = getPortfolioMetrics('all', fund.id);
        const allocation = (fundMetrics.totalCommitments / totalPortfolioCommitments) * 100;
        return {
            ...fund,
            allocation: Math.round(allocation * 100) / 100 // Round to 2 decimals
        };
    });
}

/**
 * Portfolio metrics for full portfolio or filtered view
 * @param {string} vehicleId - Investment Vehicle ID or 'all'
 * @param {string} fundId - Fund ID or 'all'
 * @returns {Object} InvestmentMetrics object
 */
export function getPortfolioMetrics(vehicleId = 'all', fundId = 'all') {
    // Full portfolio metrics (unfiltered)
    const fullMetrics = {
        totalCommitments: 618886450.23,
        totalCalled: 130575585.29,
        totalDistributions: 12756900.14,
        estimatedValue: 160335942.14,
        estimatedTVPI: 1.33
    };

    // Fund-specific metrics for filtering
    const fundMetrics = {
        pbventures: {
            totalCommitments: 194628458.10,
            totalCalled: 41065941.08,
            totalDistributions: 4012695.04,
            estimatedValue: 50425624.79,
            estimatedTVPI: 1.45
        },
        norton: {
            totalCommitments: 137997718.40,
            totalCalled: 29118396.52,
            totalDistributions: 2844788.43,
            estimatedValue: 35754895.27,
            estimatedTVPI: 1.38
        },
        wanye: {
            totalCommitments: 116038209.42,
            totalCalled: 24482922.24,
            totalDistributions: 2391918.78,
            estimatedValue: 30062989.28,
            estimatedTVPI: 1.28
        },
        violet: {
            totalCommitments: 87878875.83,
            totalCalled: 18541733.12,
            totalDistributions: 1811479.82,
            estimatedValue: 22767703.84,
            estimatedTVPI: 1.25
        },
        '123': {
            totalCommitments: 50129802.47,
            totalCalled: 10576622.39,
            totalDistributions: 1033309.11,
            estimatedValue: 12987225.32,
            estimatedTVPI: 1.18
        },
        mjk: {
            totalCommitments: 32213385.01,
            totalCalled: 6789970.94,
            totalDistributions: 662709.96,
            estimatedValue: 8337503.64,
            estimatedTVPI: 1.42
        }
    };

    // Vehicle-specific metrics (aggregated from funds)
    const vehicleMetrics = {
        iv1: {
            totalCommitments: 364839561.51,
            totalCalled: 77022308.54,
            totalDistributions: 7520193.43,
            estimatedValue: 94518023.70,
            estimatedTVPI: 1.41
        },
        iv2: {
            totalCommitments: 254046887.72,
            totalCalled: 53553277.75,
            totalDistributions: 5236707.71,
            estimatedValue: 65817918.44,
            estimatedTVPI: 1.26
        }
    };

    // Return filtered metrics based on selection
    if (fundId !== 'all') {
        return fundMetrics[fundId] || fullMetrics;
    }

    if (vehicleId !== 'all') {
        return vehicleMetrics[vehicleId] || fullMetrics;
    }

    return fullMetrics;
}

/**
 * Fund allocation data for donut chart
 * @param {string} vehicleId - Investment Vehicle ID or 'all'
 * @param {string} fundId - Fund ID or 'all'
 * @returns {Array<{fundId: string, fundName: string, allocation: number, value: number, color: string}>}
 */
export function getFundAllocation(vehicleId = 'all', fundId = 'all') {
    const funds = getFunds();
    let filteredFunds = funds;

    // Filter by vehicle if specified
    if (vehicleId !== 'all') {
        filteredFunds = funds.filter(f => f.vehicleId === vehicleId);
    }

    // If specific fund selected, return only that fund at 100%
    if (fundId !== 'all') {
        const selectedFund = funds.find(f => f.id === fundId);
        if (selectedFund) {
            const metrics = getPortfolioMetrics(vehicleId, fundId);
            return [{
                fundId: selectedFund.id,
                fundName: selectedFund.name,
                allocation: 100,
                value: metrics.totalCommitments,
                color: selectedFund.color
            }];
        }
    }

    // Calculate total for filtered funds to get percentages
    const total = filteredFunds.reduce((sum, f) => sum + f.allocation, 0);

    // Return allocation data for donut chart
    return filteredFunds.map(fund => {
        const fundMetrics = getPortfolioMetrics('all', fund.id);
        return {
            fundId: fund.id,
            fundName: fund.name,
            allocation: vehicleId === 'all' ? fund.allocation : (fund.allocation / total) * 100,
            value: fundMetrics.totalCommitments,
            color: fund.color
        };
    });
}

/**
 * Performance time-series data for line chart
 * @param {string} vehicleId - Investment Vehicle ID or 'all'
 * @param {string} fundId - Fund ID or 'all'
 * @returns {Array<{date: string, totalValue: number, capitalCalled: number, tvpi: number}>}
 */
export function getPerformanceData(vehicleId = 'all', fundId = 'all') {
    // Generate 12 months of historical data (current month back 11 months)
    const months = [];
    const currentDate = new Date();

    for (let i = 11; i >= 0; i--) {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        months.push(date.toISOString().slice(0, 7)); // YYYY-MM format
    }

    // Full portfolio performance data
    const fullPerformance = [
        { date: months[0], totalValue: 145000000, capitalCalled: 118000000, tvpi: 1.23 },
        { date: months[1], totalValue: 147500000, capitalCalled: 120000000, tvpi: 1.24 },
        { date: months[2], totalValue: 150200000, capitalCalled: 122500000, tvpi: 1.26 },
        { date: months[3], totalValue: 152800000, capitalCalled: 124000000, tvpi: 1.27 },
        { date: months[4], totalValue: 154500000, capitalCalled: 125800000, tvpi: 1.28 },
        { date: months[5], totalValue: 156200000, capitalCalled: 127200000, tvpi: 1.29 },
        { date: months[6], totalValue: 157800000, capitalCalled: 128500000, tvpi: 1.30 },
        { date: months[7], totalValue: 158900000, capitalCalled: 129400000, tvpi: 1.31 },
        { date: months[8], totalValue: 159800000, capitalCalled: 130100000, tvpi: 1.32 },
        { date: months[9], totalValue: 160100000, capitalCalled: 130400000, tvpi: 1.32 },
        { date: months[10], totalValue: 160200000, capitalCalled: 130500000, tvpi: 1.33 },
        { date: months[11], totalValue: 160335942.14, capitalCalled: 130575585.29, tvpi: 1.33 }
    ];

    // Fund-specific performance multipliers (relative to full portfolio)
    const fundMultipliers = {
        pbventures: { valueMultiplier: 1.09, calledMultiplier: 0.95, tvpiOffset: 0.12 },
        norton: { valueMultiplier: 1.04, calledMultiplier: 0.92, tvpiOffset: 0.05 },
        wanye: { valueMultiplier: 0.96, calledMultiplier: 1.02, tvpiOffset: -0.05 },
        violet: { valueMultiplier: 0.94, calledMultiplier: 1.05, tvpiOffset: -0.08 },
        '123': { valueMultiplier: 0.89, calledMultiplier: 1.08, tvpiOffset: -0.15 },
        mjk: { valueMultiplier: 1.07, calledMultiplier: 0.98, tvpiOffset: 0.09 }
    };

    // Vehicle-specific performance (weighted average of constituent funds)
    const vehicleMultipliers = {
        iv1: { valueMultiplier: 1.06, calledMultiplier: 0.96, tvpiOffset: 0.08 },
        iv2: { valueMultiplier: 0.95, calledMultiplier: 1.04, tvpiOffset: -0.07 }
    };

    // Return filtered performance data
    let multipliers = { valueMultiplier: 1, calledMultiplier: 1, tvpiOffset: 0 };

    if (fundId !== 'all') {
        multipliers = fundMultipliers[fundId] || multipliers;
    } else if (vehicleId !== 'all') {
        multipliers = vehicleMultipliers[vehicleId] || multipliers;
    }

    return fullPerformance.map(dataPoint => ({
        date: dataPoint.date,
        totalValue: Math.round(dataPoint.totalValue * multipliers.valueMultiplier * 100) / 100,
        capitalCalled: Math.round(dataPoint.capitalCalled * multipliers.calledMultiplier * 100) / 100,
        tvpi: Math.round((dataPoint.tvpi + multipliers.tvpiOffset) * 100) / 100
    }));
}

/**
 * Format currency value for display
 * @param {number} value - Numeric value
 * @returns {string} Formatted currency string (e.g., "$618,886,450.23")
 */
export function formatCurrency(value) {
    if (value === null || value === undefined) return '$0.00';
    return '$' + value.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

/**
 * Format percentage value for display
 * @param {number} value - Numeric percentage value
 * @returns {string} Formatted percentage string (e.g., "31.45%")
 */
export function formatPercentage(value) {
    if (value === null || value === undefined) return '0.00%';
    return value.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }) + '%';
}

/**
 * Format TVPI value for display
 * @param {number} value - Numeric TVPI value
 * @returns {string} Formatted TVPI string (e.g., "1.33")
 */
export function formatTVPI(value) {
    if (value === null || value === undefined) return '0.00';
    return value.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}