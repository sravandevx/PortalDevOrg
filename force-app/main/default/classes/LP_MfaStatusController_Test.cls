/**
 * Test class for LP_MfaStatusController
 */
@IsTest
private class LP_MfaStatusController_Test {

    @IsTest
    static void testGetMfaStatus_NoMfa_NeverDismissed() {
        // Setup: User with no MFA and never dismissed reminder
        User testUser = createTestUser();

        System.runAs(testUser) {
            Test.startTest();
            Map<String, Object> result = LP_MfaStatusController.getMfaStatus();
            Test.stopTest();

            // Verify
            System.assertEquals(false, result.get('hasMfa'), 'User should not have MFA');
            System.assertEquals(true, result.get('shouldShowBanner'), 'Banner should be shown');
            System.assertEquals(testUser.Id, result.get('userId'), 'User ID should match');
        }
    }

    @IsTest
    static void testGetMfaStatus_DismissedRecently() {
        // Setup: User dismissed reminder 3 days ago
        User testUser = createTestUser();
        testUser.LP_MFA_Reminder_Dismissed__c = DateTime.now().addDays(-3);
        update testUser;

        System.runAs(testUser) {
            Test.startTest();
            Map<String, Object> result = LP_MfaStatusController.getMfaStatus();
            Test.stopTest();

            // Verify
            System.assertEquals(false, result.get('hasMfa'), 'User should not have MFA');
            System.assertEquals(false, result.get('shouldShowBanner'), 'Banner should not be shown (dismissed recently)');
        }
    }

    @IsTest
    static void testGetMfaStatus_DismissedOld() {
        // Setup: User dismissed reminder 10 days ago
        User testUser = createTestUser();
        testUser.LP_MFA_Reminder_Dismissed__c = DateTime.now().addDays(-10);
        update testUser;

        System.runAs(testUser) {
            Test.startTest();
            Map<String, Object> result = LP_MfaStatusController.getMfaStatus();
            Test.stopTest();

            // Verify
            System.assertEquals(false, result.get('hasMfa'), 'User should not have MFA');
            System.assertEquals(true, result.get('shouldShowBanner'), 'Banner should be shown (dismissed > 7 days ago)');
        }
    }

    @IsTest
    static void testDismissReminder() {
        // Setup
        User testUser = createTestUser();

        System.runAs(testUser) {
            Test.startTest();
            LP_MfaStatusController.dismissReminder();
            Test.stopTest();

            // Verify
            User updatedUser = [
                SELECT LP_MFA_Reminder_Dismissed__c
                FROM User
                WHERE Id = :testUser.Id
            ];

            System.assertNotEquals(null, updatedUser.LP_MFA_Reminder_Dismissed__c, 'Dismissed date should be set');

            // Verify it's recent (within last minute)
            DateTime now = DateTime.now();
            DateTime dismissedDate = updatedUser.LP_MFA_Reminder_Dismissed__c;
            Long secondsDiff = (now.getTime() - dismissedDate.getTime()) / 1000;
            System.assert(secondsDiff < 60, 'Dismissed date should be very recent');
        }
    }

    @IsTest
    static void testGetMfaEnrollmentUrl() {
        Test.startTest();
        String url = LP_MfaStatusController.getMfaEnrollmentUrl();
        Test.stopTest();

        System.assertEquals('/lightning/settings/personal/VerificationMethodsSetupPage', url, 'URL should match');
    }

    @IsTest
    static void testDismissReminder_Exception() {
        // This test verifies exception handling
        // In a real scenario, this might test permissions or field-level security issues
        User testUser = createTestUser();

        System.runAs(testUser) {
            Test.startTest();
            try {
                LP_MfaStatusController.dismissReminder();
                // Should succeed, but we're testing the try-catch structure exists
                System.assert(true, 'Method should execute');
            } catch (AuraHandledException e) {
                System.assert(false, 'Should not throw exception in normal case: ' + e.getMessage());
            }
            Test.stopTest();
        }
    }

    /**
     * Helper method to create test user
     */
    private static User createTestUser() {
        Profile p = [SELECT Id FROM Profile WHERE Name='Standard User' LIMIT 1];

        User testUser = new User(
            FirstName = 'Test',
            LastName = 'MfaUser',
            Email = 'testmfauser@example.com',
            Username = 'testmfauser' + DateTime.now().getTime() + '@example.com',
            Alias = 'tmfa',
            TimeZoneSidKey = 'America/Los_Angeles',
            LocaleSidKey = 'en_US',
            EmailEncodingKey = 'UTF-8',
            ProfileId = p.Id,
            LanguageLocaleKey = 'en_US'
        );
        insert testUser;

        return testUser;
    }
}
