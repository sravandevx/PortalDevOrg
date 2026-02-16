/**
 * Controller for Login Flow - sets user's selected verification method
 */
public class LP_SetVerificationMethod {

    /**
     * Update user's selected verification method
     * Called when user selects a verification method in the flow
     */
    @InvocableMethod(label='Set User Verification Method' description='Sets the selected verification method for the user')
    public static List<UpdateResult> setVerificationMethod(List<VerificationMethodRequest> requests) {
        List<UpdateResult> results = new List<UpdateResult>();

        if (requests == null || requests.isEmpty()) {
            return results;
        }

        VerificationMethodRequest request = requests[0];
        User userToUpdate = new User(Id = request.userId);

        // Reset all verification flags
        userToUpdate.LP_Email_Verification_Enabled__c = false;
        userToUpdate.LP_SMS_Verification_Enabled__c = false;
        userToUpdate.LP_Authenticator_Verification_Enabled__c = false;

        // Set the selected verification method and toggle master flags
        if (request.selectedMethod == 'Email') {
            userToUpdate.LP_Email_Verification_Enabled__c = true;
            userToUpdate.LP_MFA_Enabled__c = true;
            userToUpdate.LP_SMS_Enabled__c = false;
        } else if (request.selectedMethod == 'SMS') {
            userToUpdate.LP_SMS_Verification_Enabled__c = true;
            userToUpdate.LP_SMS_Enabled__c = true;
            userToUpdate.LP_MFA_Enabled__c = false;
        } else if (request.selectedMethod == 'Authenticator') {
            userToUpdate.LP_Authenticator_Verification_Enabled__c = true;
            userToUpdate.LP_MFA_Enabled__c = true;
            userToUpdate.LP_SMS_Enabled__c = false;
        }

        try {
            update userToUpdate;

            UpdateResult result = new UpdateResult();
            result.success = true;
            result.message = 'Verification method set successfully';
            result.enrollmentUrl = getEnrollmentUrl(request.selectedMethod);
            results.add(result);
        } catch (Exception e) {
            UpdateResult result = new UpdateResult();
            result.success = false;
            result.message = 'Error setting verification method: ' + e.getMessage();
            results.add(result);
        }

        return results;
    }

    /**
     * Get the enrollment URL for the selected verification method
     */
    private static String getEnrollmentUrl(String method) {
        if (method == 'Email') {
            return '/lightning/settings/personal/EmailVerificationSetup';
        } else if (method == 'SMS') {
            return '/lightning/settings/personal/PhoneVerificationSetup';
        } else if (method == 'Authenticator') {
            return '/lightning/settings/personal/VerificationMethodsSetupPage';
        }
        return '/lightning/settings/personal/VerificationMethodsSetupPage';
    }

    /**
     * Inner class for verification method request
     */
    public class VerificationMethodRequest {
        @InvocableVariable(label='User ID' required=true)
        public Id userId;

        @InvocableVariable(label='Selected Method' required=true description='Email, SMS, or Authenticator')
        public String selectedMethod;
    }

    /**
     * Inner class for update result
     */
    public class UpdateResult {
        @InvocableVariable(label='Success' required=true)
        public Boolean success;

        @InvocableVariable(label='Message' required=true)
        public String message;

        @InvocableVariable(label='Enrollment URL')
        public String enrollmentUrl;
    }
}
