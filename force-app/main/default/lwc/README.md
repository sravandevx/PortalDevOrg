# FundPortal - Limited Partners Investment Portal

## Overview
FundPortal is a Lightning Web Runtime (LWR) site built for Limited Partners to view and manage their fund investments. The portal provides comprehensive visibility into fund performance, valuations, and investment commitments.

## Features

### 📊 Dashboard
- **Summary Statistics**: View total invested, current valuations, returns, and pending amounts
- **Fund Count**: Track active and total funds in your portfolio
- **Quick Metrics**: Easy access to key performance indicators

### 📈 Funds List
- **Comprehensive Table**: View all funds with key metrics
- **Fund Details**: 
  - Fund Name and Type
  - Invested Amount
  - Current Valuation
  - Pending Commitments
  - Return Percentage
  - Fund Status (Active/Pending)

### 📊 Investment Charts
- **Visual Breakdown**: Bar charts showing invested vs pending vs valuation
- **Performance Analysis**: Understand capital deployment across funds
- **Color-Coded**: Different colors for invested (blue), pending (orange), and valuation (green)

## Technical Stack
- **Framework**: Lightning Web Runtime (LWR)
- **Components**: Lightning Web Components (LWC)
- **Backend**: Apex Controllers
- **API**: salesforce/apex decorators for data fetching
- **Styling**: Lightning Design System (SLDS) classes with custom CSS

## Components

### fundPortalDashboard
Main dashboard component that orchestrates the entire portal. Features:
- Wire decorators to fetch fund data and statistics
- Responsive layout with statistics cards
- Currency formatting utilities
- Integration with child components

### fundsList
Displays all fund investments in a sortable table format:
- Color-coded status badges
- Formatted currency values
- Responsive table design
- Fund type classification

### investmentChart
Visual representation of investment portfolio:
- Dynamic bar chart generation
- Multi-metric comparison per fund
- SVG-based visualization
- Responsive scaling

## Data Model

### FundData (Class)
```
- fundId: String
- fundName: String
- fundType: String (e.g., Growth Equity, Real Estate, Infrastructure)
- totalInvested: Decimal
- currentValuation: Decimal
- pendingAmount: Decimal
- returnPercentage: Decimal
- investmentDate: String
- fundStatus: String (Active/Pending)
```

## Available Methods

### FundDataController

#### getFundsForPartner() `@AuraEnabled(cacheable=true)`
Returns a list of all funds for the currently logged-in limited partner with full fund data.

#### getFundStatistics() `@AuraEnabled(cacheable=true)`
Returns aggregated statistics:
- Total Invested Amount
- Total Current Valuation
- Total Pending Commitments
- Total Return
- Fund Count

#### getInvestmentChartData() `@AuraEnabled(cacheable=true)`
Returns formatted data for chart visualization including invested, pending, and valuation amounts per fund.

## Deployment

1. **Deploy to Org**:
   ```bash
   sf project deploy start
   ```

2. **Create LWR Site** in Salesforce:
   - Navigate to Setup > Digital Experiences > Sites
   - Create new LWR site
   - Select `fundPortalDashboard` as the main component
   - Configure site URL (e.g., fundportal)
   - Publish

3. **Set Permissions**:
   - Ensure Limited Partner users have access to the Apex class
   - Add FundDataController to permission sets

## Configuration

### Environment-Specific Settings
The site is configured to work with:
- **API Version**: 65.0
- **Base Path**: /sites/fundportal
- **URL Path Prefix**: fundportal

### Customization

To integrate with actual fund data:

1. **Modify FundDataController.cls**:
   - Replace sample data generation with actual SOQL queries
   - Query custom objects or standard objects as needed
   - Implement security filters for data access

2. **Update Data Model**:
   - Create Fund__c custom object if using custom objects
   - Map fields to match your org's data structure

3. **Adjust Data Points**:
   - Modify chart metrics by updating `getInvestmentChartData()`
   - Add/remove statistics by updating `getFundStatistics()`

## Security

- **Cacheable Apex**: Secure methods with `cacheable=true` for performance
- **Data Filtering**: Controller filters data based on current user's limited partner profile
- **Sharing Rules**: Implement appropriate org-wide defaults and sharing rules

## Browser Support
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Performance Considerations
- Apex methods are cacheable for improved performance
- CSS is optimized for responsive design
- SVG-based charts for scalable graphics
- Efficient data fetching with wire decorators

## Future Enhancements
- Real-time notifications for fund updates
- Export to PDF functionality
- Detailed fund prospectus documents
- Historical performance tracking
- Advanced filtering and search
- Mobile app version

## Support
For issues or feature requests, contact the Salesforce development team.
