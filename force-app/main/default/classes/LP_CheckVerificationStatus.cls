/**
 * Controller for Login Flow - checks if user needs to set up verification
 * Checks all three method flags to determine setup status and routing
 */
public class LP_CheckVerificationStatus {

    @InvocableMethod(label='Check User Verification Status' description='Checks if user has any verification method enabled')
    public static List<VerificationStatus> checkVerificationStatus(List<CheckRequest> requests) {
        List<VerificationStatus> results = new List<VerificationStatus>();

        if (requests == null || requests.isEmpty()) {
            return results;
        }

        CheckRequest request = requests[0];
        User currentUser = [SELECT Id, LP_MFA_Enabled__c, LP_SMS_Enabled__c,
                            LP_Email_Verification_Enabled__c, LP_SMS_Verification_Enabled__c,
                            LP_Authenticator_Verification_Enabled__c
                            FROM User
                            WHERE Id = :request.userId
                            LIMIT 1];

        VerificationStatus status = new VerificationStatus();
        status.userId = currentUser.Id;
        status.needsSetup = !currentUser.LP_Email_Verification_Enabled__c
                         && !currentUser.LP_SMS_Verification_Enabled__c
                         && !currentUser.LP_Authenticator_Verification_Enabled__c;
        status.hasMfaEnabled = currentUser.LP_MFA_Enabled__c;
        status.hasSmsEnabled = currentUser.LP_SMS_Verification_Enabled__c;
        status.hasEmailEnabled = currentUser.LP_Email_Verification_Enabled__c;
        status.hasAuthenticatorEnabled = currentUser.LP_Authenticator_Verification_Enabled__c;

        results.add(status);
        return results;
    }

    public class CheckRequest {
        @InvocableVariable(label='User ID' required=true)
        public Id userId;
    }

    public class VerificationStatus {
        @InvocableVariable(label='User ID' required=true)
        public Id userId;

        @InvocableVariable(label='Needs Setup' required=true)
        public Boolean needsSetup;

        @InvocableVariable(label='Has MFA Enabled' required=true)
        public Boolean hasMfaEnabled;

        @InvocableVariable(label='Has SMS Enabled' required=true)
        public Boolean hasSmsEnabled;

        @InvocableVariable(label='Has Email Enabled' required=true)
        public Boolean hasEmailEnabled;

        @InvocableVariable(label='Has Authenticator Enabled' required=true)
        public Boolean hasAuthenticatorEnabled;
    }
}
