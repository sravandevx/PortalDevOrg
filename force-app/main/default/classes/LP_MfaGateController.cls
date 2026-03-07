public without sharing class LP_MfaGateController {

    @AuraEnabled(cacheable=false)
    public static MfaGateResult checkMfaEnrollment() {
        MfaGateResult result = new MfaGateResult();
        Id userId = UserInfo.getUserId();
        result.userId = userId;

        // Check if user has MFA permission set assigned
        Integer psaCount = [
            SELECT COUNT()
            FROM PermissionSetAssignment
            WHERE AssigneeId = :userId
            AND PermissionSet.Name = 'MFA_Permissions_for_Community_Login'
        ];
        result.hasMfaPermission = (psaCount > 0);

        if (!result.hasMfaPermission) {
            result.requiresEnrollment = false;
            return result;
        }

        // Check if user has registered any MFA verification method
        List<TwoFactorMethodsInfo> methods = [
            SELECT Id, HasTotp, HasSalesforceAuthenticator,
                   HasUserVerifiedMobileNumber, HasUserVerifiedEmailAddress
            FROM TwoFactorMethodsInfo
            WHERE UserId = :userId
            LIMIT 1
        ];

        if (methods.isEmpty()) {
            result.hasRegisteredMfa = false;
            result.requiresEnrollment = true;
        } else {
            TwoFactorMethodsInfo info = methods[0];
            result.hasTotp = info.HasTotp;
            result.hasSalesforceAuthenticator = info.HasSalesforceAuthenticator;
            result.hasRegisteredMfa = info.HasTotp || info.HasSalesforceAuthenticator;
            result.requiresEnrollment = !result.hasRegisteredMfa;
        }

        return result;
    }

    public class MfaGateResult {
        @AuraEnabled public String userId;
        @AuraEnabled public Boolean hasMfaPermission;
        @AuraEnabled public Boolean hasRegisteredMfa;
        @AuraEnabled public Boolean hasTotp;
        @AuraEnabled public Boolean hasSalesforceAuthenticator;
        @AuraEnabled public Boolean requiresEnrollment;
    }
}
