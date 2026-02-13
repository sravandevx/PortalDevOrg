public without sharing class FundDataController {

    public class FundData {
        @AuraEnabled public String fundId { get; set; }
        @AuraEnabled public String fundName { get; set; }
        @AuraEnabled public String fundType { get; set; }
        @AuraEnabled public Decimal totalInvested { get; set; }
        @AuraEnabled public Decimal currentValuation { get; set; }
        @AuraEnabled public Decimal pendingAmount { get; set; }
        @AuraEnabled public Decimal returnPercentage { get; set; }
        @AuraEnabled public String investmentDate { get; set; }
        @AuraEnabled public String fundStatus { get; set; }
    }

    @AuraEnabled(cacheable=true)
    public static List<FundData> getFundsForPartner() {
        try {
            Id contactId = getContactId();
            if (contactId == null) {
                return new List<FundData>();
            }

            List<Investment__c> investments = [
                SELECT Id,
                       Fund__c,
                       Fund__r.Name,
                       Fund__r.Fund_Type__c,
                       Fund__r.Status__c,
                       Called_Amount__c,
                       Net_Asset_Value__c,
                       Commitment_Amount__c,
                       Investment_Date__c,
                       Status__c
                FROM Investment__c
                WHERE Investor__c = :contactId
                ORDER BY Investment_Date__c DESC
            ];

            List<FundData> funds = new List<FundData>();
            for (Investment__c inv : investments) {
                FundData fd = new FundData();
                fd.fundId = inv.Fund__c;
                fd.fundName = inv.Fund__r.Name;
                fd.fundType = inv.Fund__r.Fund_Type__c;

                Decimal called = inv.Called_Amount__c != null ? inv.Called_Amount__c : 0;
                Decimal committed = inv.Commitment_Amount__c != null ? inv.Commitment_Amount__c : 0;
                Decimal nav = inv.Net_Asset_Value__c != null ? inv.Net_Asset_Value__c : 0;

                fd.totalInvested = called;
                fd.currentValuation = nav;
                fd.pendingAmount = committed > called ? committed - called : 0;
                fd.returnPercentage = called > 0
                    ? ((nav - called) / called * 100).setScale(2)
                    : 0;
                fd.investmentDate = inv.Investment_Date__c != null
                    ? String.valueOf(inv.Investment_Date__c)
                    : '';

                String fundStatus = inv.Fund__r.Status__c;
                fd.fundStatus = (fundStatus == 'Investing' || fundStatus == 'Harvesting') ? 'Active'
                              : (fundStatus == 'Fundraising') ? 'Pending'
                              : 'Closed';

                funds.add(fd);
            }

            return funds;
        } catch (Exception e) {
            throw new AuraHandledException('Error fetching fund data: ' + e.getMessage());
        }
    }

    @AuraEnabled(cacheable=true)
    public static Map<String, Decimal> getFundStatistics() {
        try {
            List<FundData> funds = getFundsForPartner();
            Map<String, Decimal> stats = new Map<String, Decimal>();

            Decimal totalInvested = 0;
            Decimal totalValuation = 0;
            Decimal totalPending = 0;

            for (FundData fund : funds) {
                totalInvested += fund.totalInvested;
                totalValuation += fund.currentValuation;
                totalPending += fund.pendingAmount;
            }

            stats.put('totalInvested', totalInvested);
            stats.put('totalValuation', totalValuation);
            stats.put('totalPending', totalPending);
            stats.put('totalReturn', totalValuation - totalInvested);
            stats.put('fundCount', (Decimal)funds.size());

            return stats;
        } catch (Exception e) {
            throw new AuraHandledException('Error fetching statistics: ' + e.getMessage());
        }
    }

    @AuraEnabled(cacheable=true)
    public static List<Map<String, Object>> getInvestmentChartData() {
        try {
            List<FundData> funds = getFundsForPartner();
            List<Map<String, Object>> chartData = new List<Map<String, Object>>();

            for (FundData fund : funds) {
                Map<String, Object> dataPoint = new Map<String, Object>();
                dataPoint.put('name', fund.fundName);
                dataPoint.put('invested', fund.totalInvested);
                dataPoint.put('pending', fund.pendingAmount);
                dataPoint.put('valuation', fund.currentValuation);
                chartData.add(dataPoint);
            }

            return chartData;
        } catch (Exception e) {
            throw new AuraHandledException('Error fetching chart data: ' + e.getMessage());
        }
    }

    @TestVisible
    private static Id testContactId;

    private static Id getContactId() {
        if (Test.isRunningTest() && testContactId != null) {
            return testContactId;
        }
        User currentUser = [SELECT ContactId FROM User WHERE Id = :UserInfo.getUserId() LIMIT 1];
        return currentUser.ContactId;
    }
}
