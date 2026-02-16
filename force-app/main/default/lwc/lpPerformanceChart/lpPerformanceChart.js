/**
 * lpPerformanceChart
 * Chart.js-based multi-line chart for performance over time
 *
 * Displays 3 data series:
 * - Total Value (blue)
 * - Capital Called (green)
 * - TVPI (orange) - on secondary Y-axis
 *
 * Props:
 * - performanceData: Array of { date, totalValue, capitalCalled, tvpi }
 */

import { LightningElement, api, track } from 'lwc';
import { loadScript } from 'lightning/platformResourceLoader';
import chartjs from '@salesforce/resourceUrl/chartjs';
import { formatCurrency, formatTVPI } from 'c/lpStaticDataService';

export default class LpPerformanceChart extends LightningElement {
    @api performanceData = []; // Array of performance data points

    @track hasError = false;

    chart = null;
    chartjsInitialized = false;

    // Chart colors
    colors = {
        totalValue: '#1976D2',    // Blue
        capitalCalled: '#388E3C', // Green
        tvpi: '#F57C00'           // Orange
    };

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
     * Initialize the Chart.js line chart
     */
    initializeChart() {
        const canvas = this.refs.lineCanvas;
        if (!canvas) {
            console.error('Canvas element not found');
            return;
        }

        const ctx = canvas.getContext('2d');

        // Prepare data for Chart.js
        const chartData = this.prepareChartData();

        // Create chart
        this.chart = new window.Chart(ctx, {
            type: 'line',
            data: chartData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false
                },
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
                            title: (context) => {
                                return this.formatDate(context[0].label);
                            },
                            label: (context) => {
                                const label = context.dataset.label;
                                const value = context.raw;

                                if (label === 'TVPI') {
                                    return `${label}: ${formatTVPI(value)}`;
                                }
                                return `${label}: ${formatCurrency(value)}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        display: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)',
                            drawBorder: false
                        },
                        ticks: {
                            color: '#3F4946',
                            font: {
                                size: 11,
                                family: 'Roboto, sans-serif'
                            },
                            callback: (value, index) => {
                                // Show every 2nd label to avoid crowding
                                if (index % 2 === 0) {
                                    return this.formatDate(this.performanceData[index]?.date);
                                }
                                return '';
                            }
                        }
                    },
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)',
                            drawBorder: false
                        },
                        ticks: {
                            color: '#3F4946',
                            font: {
                                size: 11,
                                family: 'Roboto, sans-serif'
                            },
                            callback: (value) => {
                                return this.formatYAxisValue(value);
                            }
                        }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        grid: {
                            drawOnChartArea: false
                        },
                        ticks: {
                            color: this.colors.tvpi,
                            font: {
                                size: 11,
                                family: 'Roboto, sans-serif'
                            },
                            callback: (value) => {
                                return `${value.toFixed(2)}x`;
                            }
                        }
                    }
                },
                animation: {
                    duration: 800,
                    easing: 'easeOutQuart'
                },
                elements: {
                    point: {
                        radius: 4,
                        hoverRadius: 6,
                        hitRadius: 10
                    },
                    line: {
                        tension: 0.3, // Smooth curves
                        borderWidth: 3
                    }
                }
            }
        });
    }

    /**
     * Prepare data for Chart.js format
     */
    prepareChartData() {
        if (!this.performanceData || this.performanceData.length === 0) {
            return {
                labels: [],
                datasets: []
            };
        }

        return {
            labels: this.performanceData.map(d => d.date),
            datasets: [
                {
                    label: 'Total Value',
                    data: this.performanceData.map(d => d.totalValue),
                    borderColor: this.colors.totalValue,
                    backgroundColor: `${this.colors.totalValue}20`,
                    fill: false,
                    yAxisID: 'y'
                },
                {
                    label: 'Capital Called',
                    data: this.performanceData.map(d => d.capitalCalled),
                    borderColor: this.colors.capitalCalled,
                    backgroundColor: `${this.colors.capitalCalled}20`,
                    fill: false,
                    yAxisID: 'y'
                },
                {
                    label: 'TVPI',
                    data: this.performanceData.map(d => d.tvpi),
                    borderColor: this.colors.tvpi,
                    backgroundColor: `${this.colors.tvpi}20`,
                    fill: false,
                    yAxisID: 'y1'
                }
            ]
        };
    }

    /**
     * Legend items
     */
    get legendItems() {
        return [
            {
                series: 'totalValue',
                label: 'Total Value',
                colorStyle: `background-color: ${this.colors.totalValue};`
            },
            {
                series: 'capitalCalled',
                label: 'Capital Called',
                colorStyle: `background-color: ${this.colors.capitalCalled};`
            },
            {
                series: 'tvpi',
                label: 'TVPI',
                colorStyle: `background-color: ${this.colors.tvpi};`
            }
        ];
    }

    /**
     * Format Y-axis value
     */
    formatYAxisValue(value) {
        if (value >= 1000000) {
            return `$${(value / 1000000).toFixed(0)}M`;
        } else if (value >= 1000) {
            return `$${(value / 1000).toFixed(0)}K`;
        }
        return formatCurrency(value);
    }

    /**
     * Format date for display
     */
    formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString + '-01'); // Add day to parse YYYY-MM
        return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    }

    /**
     * Public API to update chart data
     */
    @api
    updateData(newPerformanceData) {
        this.performanceData = newPerformanceData;

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
        console.error('Performance Chart Error:', error);
        console.error('Stack:', stack);
        this.hasError = true;
    }
}