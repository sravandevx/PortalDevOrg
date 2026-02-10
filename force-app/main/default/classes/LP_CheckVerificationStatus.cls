/**
 * Controller for Login Flow - checks if user needs to set up verification
 */
public class LP_CheckVerificationStatus {

    /**
     * Check if the current user needs to set up a verification method
     * Called at the start of the login flow
     */
    @InvocableMethod(label='Check User Verification Status' description='Checks if user has any verification method enabled')
    public static List<VerificationStatus> checkVerificationStatus(List<Id> userIds) {
        List<VerificationStatus> results = new List<VerificationStatus>();

        if (userIds == null || userIds.isEmpty()) {
            return results;
        }

        User currentUser = [SELECT Id,
                                   LP_Email_Verification_Enabled__c,
                                   LP_SMS_Verification_Enabled__c,
                                   LP_Authenticator_Verification_Enabled__c
                            FROM User
                            WHERE Id = :userIds[0]
                            LIMIT 1];

        VerificationStatus status = new VerificationStatus();
        status.userId = currentUser.Id;
        status.needsSetup = !currentUser.LP_Email_Verification_Enabled__c &&
                            !currentUser.LP_SMS_Verification_Enabled__c &&
                            !currentUser.LP_Authenticator_Verification_Enabled__c;
        status.hasEmailVerification = currentUser.LP_Email_Verification_Enabled__c;
        status.hasSmsVerification = currentUser.LP_SMS_Verification_Enabled__c;
        status.hasAuthenticatorVerification = currentUser.LP_Authenticator_Verification_Enabled__c;

        results.add(status);
        return results;
    }

    /**
     * Inner class for verification status response
     */
    public class VerificationStatus {
        @InvocableVariable(label='User ID' required=true)
        public Id userId;

        @InvocableVariable(label='Needs Setup' required=true)
        public Boolean needsSetup;

        @InvocableVariable(label='Has Email Verification' required=true)
        public Boolean hasEmailVerification;

        @InvocableVariable(label='Has SMS Verification' required=true)
        public Boolean hasSmsVerification;

        @InvocableVariable(label='Has Authenticator Verification' required=true)
        public Boolean hasAuthenticatorVerification;
    }
}
