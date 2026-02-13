/**
 * lpDonutChart
 * Chart.js-based donut chart for fund allocation visualization
 *
 * Displays fund allocation as a donut chart with:
 * - Color-coded segments for each fund
 * - Center showing total commitments
 * - Legend with fund names, percentages, and amounts
 * - Touch-friendly interactions
 *
 * Props:
 * - allocationData: Array of { fundId, fundName, allocation, value, color }
 * - totalValue: Total portfolio value for center display
 */

import { LightningElement, api, track } from 'lwc';
import { loadScript } from 'lightning/platformResourceLoader';
import chartjs from '@salesforce/resourceUrl/chartjs';
import { formatCurrency, formatPercentage } from 'c/lpStaticDataService';

export default class LpDonutChart extends LightningElement {
    @api allocationData = []; // Array of fund allocation data
    @api totalValue = 0; // Total commitments value

    @track hasError = false;

    chart = null;
    chartjsInitialized = false;

    /**
     * Lifecycle: Rendered callback
     * Initialize Chart.js after DOM is ready
     */
    renderedCallback() {
        if (this.chartjsInitialized) {
            return;
        }
        this.chartjsInitialized = true;

        loadScript(this, chartjs)
            .then(() => {
                this.initializeChart();
            })
            .catch(error => {
                console.error('Error loading Chart.js:', error);
                this.hasError = true;
            });
    }

    /**
     * Initialize the Chart.js doughnut chart
     */
    initializeChart() {
        const canvas = this.refs.donutCanvas;
        if (!canvas) {
            console.error('Canvas element not found');
            return;
        }

        const ctx = canvas.getContext('2d');

        // Prepare data for Chart.js
        const chartData = this.prepareChartData();

        // Center text plugin
        const centerTextPlugin = {
            id: 'centerText',
            beforeDraw: (chart) => {
                const { width, height, ctx: context } = chart;
                context.restore();

                // Draw value first (larger, on top)
                const valueFontSize = Math.min(width, height) / 8;
                context.font = `600 ${valueFontSize}px Roboto, sans-serif`;
                context.fillStyle = '#1A1C1E';
                context.textBaseline = 'middle';
                context.textAlign = 'center';
                context.fillText(formatCurrency(this.totalValue), width / 2, height / 2 - valueFontSize / 3);

                // Draw "Total Commitments" label below
                const labelFontSize = Math.min(width, height) / 14;
                context.font = `500 ${labelFontSize}px Roboto, sans-serif`;
                context.fillStyle = '#3F4946';
                context.fillText('Total Commitments', width / 2, height / 2 + valueFontSize / 2);

                context.save();
            }
        };

        // Bind this for the plugin
        centerTextPlugin.beforeDraw = centerTextPlugin.beforeDraw.bind(this);

        // Create chart
        this.chart = new window.Chart(ctx, {
            type: 'doughnut',
            data: chartData,
            options: {
                responsive: true,
                maintainAspectRatio: true,
                cutout: '65%',
                plugins: {
                    legend: {
                        display: false // We use custom legend
                    },
                    tooltip: {
                        enabled: true,
                        backgroundColor: '#1A1C1E',
                        titleColor: '#FFFFFF',
                        bodyColor: '#FFFFFF',
                        padding: 12,
                        cornerRadius: 8,
                        displayColors: true,
                        callbacks: {
                            label: (context) => {
                                const fund = this.allocationData[context.dataIndex];
                                return [
                                    `${formatPercentage(fund.allocation)}`,
                                    `${formatCurrency(fund.value)}`
                                ];
                            }
                        }
                    }
                },
                animation: {
                    animateRotate: true,
                    animateScale: false,
                    duration: 800,
                    easing: 'easeOutQuart'
                },
                onClick: (event, elements) => {
                    if (elements && elements.length > 0) {
                        const index = elements[0].index;
                        const fund = this.allocationData[index];
                        if (fund) {
                            this.fireSegmentClickEvent(fund.fundId);
                        }
                    }
                },
                onHover: (event, elements) => {
                    const canvas = event.native.target;
                    canvas.style.cursor = elements.length > 0 ? 'pointer' : 'default';
                }
            },
            plugins: [centerTextPlugin]
        });
    }

    /**
     * Prepare data for Chart.js format
     */
    prepareChartData() {
        if (!this.allocationData || this.allocationData.length === 0) {
            return {
                labels: [],
                datasets: [{
                    data: [],
                    backgroundColor: [],
                    borderWidth: 0
                }]
            };
        }

        return {
            labels: this.allocationData.map(fund => fund.fundName),
            datasets: [{
                data: this.allocationData.map(fund => fund.allocation),
                backgroundColor: this.allocationData.map(fund => fund.color),
                borderWidth: 0,
                hoverOffset: 8,
                hoverBorderWidth: 0
            }]
        };
    }

    /**
     * Legend items for fund list
     */
    get legendItems() {
        if (!this.allocationData || this.allocationData.length === 0) {
            return [];
        }

        return this.allocationData.map(fund => ({
            fundId: fund.fundId,
            fundName: fund.fundName,
            percentage: formatPercentage(fund.allocation),
            amount: formatCurrency(fund.value),
            colorStyle: `background-color: ${fund.color};`
        }));
    }

    /**
     * Handle legend item hover - highlight chart segment
     */
    handleLegendHover(event) {
        const fundId = event.currentTarget.dataset.fundId;
        const index = this.allocationData.findIndex(f => f.fundId === fundId);

        if (this.chart && index >= 0) {
            this.chart.setActiveElements([{ datasetIndex: 0, index: index }]);
            this.chart.update('none');
        }
    }

    /**
     * Handle legend item hover leave
     */
    handleLegendLeave() {
        if (this.chart) {
            this.chart.setActiveElements([]);
            this.chart.update('none');
        }
    }

    /**
     * Handle legend item click
     */
    handleLegendClick(event) {
        const fundId = event.currentTarget.dataset.fundId;
        this.fireSegmentClickEvent(fundId);
    }

    /**
     * Fire custom event when segment/legend is clicked
     */
    fireSegmentClickEvent(fundId) {
        const clickEvent = new CustomEvent('segmentclick', {
            detail: { fundId }
        });
        this.dispatchEvent(clickEvent);
    }

    /**
     * Public API to update chart data
     */
    @api
    updateData(newAllocationData, newTotalValue) {
        this.allocationData = newAllocationData;
        this.totalValue = newTotalValue;

        if (this.chart) {
            const chartData = this.prepareChartData();
            this.chart.data = chartData;
            this.chart.update('active');
        }
    }

    /**
     * Cleanup when component is removed
     */
    disconnectedCallback() {
        if (this.chart) {
            this.chart.destroy();
            this.chart = null;
        }
    }

    /**
     * Error boundary - handle chart rendering errors gracefully
     */
    errorCallback(error, stack) {
        console.error('Donut Chart Error:', error);
        console.error('Stack:', stack);
        this.hasError = true;
    }
}
