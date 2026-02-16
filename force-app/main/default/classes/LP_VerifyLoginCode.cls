/**
 * Verifies the verification code during login without changing any method flags.
 * Used for returning users who already have a verification method enabled.
 * Only validates the code and clears temporary fields on success.
 */
public class LP_VerifyLoginCode {

    @InvocableMethod(label='Verify Login Code' description='Verifies code during login without changing verification flags')
    public static List<VerifyResult> verifyLoginCode(List<VerifyRequest> requests) {
        List<VerifyResult> results = new List<VerifyResult>();

        if (requests == null || requests.isEmpty()) {
            return results;
        }

        VerifyRequest request = requests[0];
        VerifyResult result = new VerifyResult();

        try {
            System.debug('request.userId $$$ '+request.userId);
            System.debug('request.enteredCode $$$ '+request.enteredCode);
            User u = [SELECT Id, LP_SMS_Verification_Code__c, LP_SMS_Code_Expiry__c
                      FROM User WHERE Id = :request.userId LIMIT 1];

            if (String.isBlank(u.LP_SMS_Verification_Code__c)) {
                result.isValid = false;
                result.message = 'No verification code found. Please go back and request a new code.';
                results.add(result);
                return results;
            }

            if (u.LP_SMS_Code_Expiry__c != null && u.LP_SMS_Code_Expiry__c < DateTime.now()) {
                result.isValid = false;
                result.message = 'Verification code has expired. Please go back and request a new code.';
                User clearUser = new User(Id = request.userId);
                clearUser.LP_SMS_Verification_Code__c = null;
                clearUser.LP_SMS_Code_Expiry__c = null;
                update clearUser;
                results.add(result);
                return results;
            }

            if (u.LP_SMS_Verification_Code__c == request.enteredCode) {
                result.isValid = true;
                result.message = 'Verification successful!';

                // Only clear temp fields - do NOT modify any verification flags
                User updateUser = new User(Id = request.userId);
                updateUser.LP_SMS_Verification_Code__c = null;
                updateUser.LP_SMS_Code_Expiry__c = null;
                update updateUser;
            } else {
                result.isValid = false;
                result.message = 'Invalid verification code. Please try again.';
            }
        } catch (Exception e) {
            result.isValid = false;
            result.message = 'Error verifying code: ' + e.getMessage();
        }

        results.add(result);
        return results;
    }

    public class VerifyRequest {
        @InvocableVariable(label='User ID' required=true)
        public Id userId;

        @InvocableVariable(label='Entered Code' required=true)
        public String enteredCode;
    }

    public class VerifyResult {
        @InvocableVariable(label='Is Valid' required=true)
        public Boolean isValid;

        @InvocableVariable(label='Message' required=true)
        public String message;
    }
}
