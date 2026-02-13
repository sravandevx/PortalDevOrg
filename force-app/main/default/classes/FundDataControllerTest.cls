@IsTest
private class FundDataControllerTest {

    @TestSetup
    static void setup() {
        Account lpAccount = new Account(Name = 'Test LP Firm');
        insert lpAccount;

        Contact lpContact = new Contact(
            FirstName = 'Test',
            LastName = 'LP User',
            AccountId = lpAccount.Id,
            Email = 'testlp@testlp.com'
        );
        insert lpContact;

        Fund__c testFund = new Fund__c(
            Name = 'Test Growth Fund',
            Fund_Type__c = 'Venture Capital',
            Status__c = 'Investing',
            Target_Size__c = 10000000
        );
        insert testFund;

        Investment__c testInvestment = new Investment__c(
            Fund__c = testFund.Id,
            Investor__c = lpContact.Id,
            Investor_Account__c = lpAccount.Id,
            Commitment_Amount__c = 500000,
            Called_Amount__c = 300000,
            Net_Asset_Value__c = 350000,
            Investment_Date__c = Date.today().addYears(-1),
            Status__c = 'Active'
        );
        insert testInvestment;
    }

    @IsTest
    static void testGetFundsForPartnerNoContact() {
        // No testContactId set — simulates user with no Contact (e.g. admin)
        Test.startTest();
        List<FundDataController.FundData> result = FundDataController.getFundsForPartner();
        Test.stopTest();

        Assert.areEqual(0, result.size(), 'Should return empty list when user has no Contact');
    }

    @IsTest
    static void testGetFundsForPartnerWithContact() {
        Contact lpContact = [SELECT Id FROM Contact WHERE LastName = 'LP User' LIMIT 1];
        FundDataController.testContactId = lpContact.Id;

        Test.startTest();
        List<FundDataController.FundData> funds = FundDataController.getFundsForPartner();
        Test.stopTest();

        Assert.areEqual(1, funds.size(), 'Should return 1 fund for this LP');
        Assert.areEqual('Test Growth Fund', funds[0].fundName);
        Assert.areEqual('Venture Capital', funds[0].fundType);
        Assert.areEqual(300000, funds[0].totalInvested);
        Assert.areEqual(350000, funds[0].currentValuation);
        Assert.areEqual(200000, funds[0].pendingAmount); // 500000 - 300000
        Assert.areEqual('Active', funds[0].fundStatus);
        Assert.isTrue(funds[0].returnPercentage > 0); // (350000 - 300000) / 300000 * 100 = 16.67
    }

    @IsTest
    static void testGetFundStatistics() {
        Contact lpContact = [SELECT Id FROM Contact WHERE LastName = 'LP User' LIMIT 1];
        FundDataController.testContactId = lpContact.Id;

        Test.startTest();
        Map<String, Decimal> stats = FundDataController.getFundStatistics();
        Test.stopTest();

        Assert.areEqual(300000, stats.get('totalInvested'));
        Assert.areEqual(350000, stats.get('totalValuation'));
        Assert.areEqual(200000, stats.get('totalPending'));
        Assert.areEqual(50000, stats.get('totalReturn')); // 350000 - 300000
        Assert.areEqual(1, stats.get('fundCount').intValue());
    }

    @IsTest
    static void testGetFundStatisticsNoContact() {
        Test.startTest();
        Map<String, Decimal> stats = FundDataController.getFundStatistics();
        Test.stopTest();

        Assert.areEqual(0, stats.get('totalInvested'));
        Assert.areEqual(0, stats.get('fundCount').intValue());
    }

    @IsTest
    static void testGetInvestmentChartData() {
        Contact lpContact = [SELECT Id FROM Contact WHERE LastName = 'LP User' LIMIT 1];
        FundDataController.testContactId = lpContact.Id;

        Test.startTest();
        List<Map<String, Object>> chartData = FundDataController.getInvestmentChartData();
        Test.stopTest();

        Assert.areEqual(1, chartData.size());
        Assert.areEqual('Test Growth Fund', (String) chartData[0].get('name'));
        Assert.areEqual(300000, (Decimal) chartData[0].get('invested'));
        Assert.areEqual(200000, (Decimal) chartData[0].get('pending'));
        Assert.areEqual(350000, (Decimal) chartData[0].get('valuation'));
    }

    @IsTest
    static void testGetInvestmentChartDataNoContact() {
        Test.startTest();
        List<Map<String, Object>> chartData = FundDataController.getInvestmentChartData();
        Test.stopTest();

        Assert.areEqual(0, chartData.size());
    }

    @IsTest
    static void testFundStatusMapping() {
        Contact lpContact = [SELECT Id FROM Contact WHERE LastName = 'LP User' LIMIT 1];
        Fund__c fundraisingFund = new Fund__c(
            Name = 'Fundraising Fund',
            Fund_Type__c = 'Private Equity',
            Status__c = 'Fundraising'
        );
        insert fundraisingFund;
        Investment__c inv = new Investment__c(
            Fund__c = fundraisingFund.Id,
            Investor__c = lpContact.Id,
            Commitment_Amount__c = 100000,
            Called_Amount__c = 0,
            Net_Asset_Value__c = 0,
            Status__c = 'Active'
        );
        insert inv;

        FundDataController.testContactId = lpContact.Id;

        Test.startTest();
        List<FundDataController.FundData> funds = FundDataController.getFundsForPartner();
        Test.stopTest();

        // Find the fundraising fund entry
        FundDataController.FundData fundraisingEntry = null;
        for (FundDataController.FundData fd : funds) {
            if (fd.fundName == 'Fundraising Fund') {
                fundraisingEntry = fd;
            }
        }
        Assert.isNotNull(fundraisingEntry);
        Assert.areEqual('Pending', fundraisingEntry.fundStatus);
    }
}
