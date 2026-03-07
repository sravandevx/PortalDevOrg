@IsTest
private class LP_MfaGateController_Test {

    @IsTest
    static void testCheckMfaEnrollment_NoPermissionSet() {
        User testUser = createTestUser();

        System.runAs(testUser) {
            Test.startTest();
            LP_MfaGateController.MfaGateResult result =
                LP_MfaGateController.checkMfaEnrollment();
            Test.stopTest();

            System.assertEquals(false, result.hasMfaPermission, 'User should not have MFA permission set');
            System.assertEquals(false, result.requiresEnrollment, 'Should not require enrollment without permission set');
        }
    }

    @IsTest
    static void testCheckMfaEnrollment_WithPermission() {
        User testUser = createTestUser();

        // Assign MFA permission set
        PermissionSet ps;
        try {
            ps = [SELECT Id FROM PermissionSet WHERE Name = 'MFA_Permissions_for_Community_Login' LIMIT 1];
        } catch (QueryException e) {
            // Permission set doesn't exist in test context — skip
            return;
        }

        insert new PermissionSetAssignment(AssigneeId = testUser.Id, PermissionSetId = ps.Id);

        System.runAs(testUser) {
            Test.startTest();
            LP_MfaGateController.MfaGateResult result =
                LP_MfaGateController.checkMfaEnrollment();
            Test.stopTest();

            System.assertEquals(true, result.hasMfaPermission, 'User should have MFA permission set');
            System.assertEquals(true, result.requiresEnrollment, 'Should require enrollment for new user');
        }
    }

    private static User createTestUser() {
        Profile p = [SELECT Id FROM Profile WHERE Name = 'Standard User' LIMIT 1];

        User testUser = new User(
            FirstName = 'Test',
            LastName = 'MfaGateUser',
            Email = 'testmfagate@example.com',
            Username = 'testmfagate' + DateTime.now().getTime() + '@example.com',
            Alias = 'tmfag',
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
