/**
 * Controller for MFA Enrollment Banner
 * Checks user's MFA registration status and manages enrollment reminder dismissal
 */
public with sharing class LP_MfaStatusController {

    /**
     * Check if the current user has any MFA method registered
     * @return Map with hasMfa (boolean) and shouldShowBanner (boolean)
     */
    @AuraEnabled(cacheable=true)
    public static Map<String, Object> getMfaStatus() {
        try {
            Id userId = UserInfo.getUserId();

            // Check if user has any registered MFA methods
            Boolean hasMfa = checkUserHasMfa(userId);

            // Check if banner should be shown (not dismissed or dismissed > 7 days ago)
            Boolean shouldShowBanner = !hasMfa && shouldShowReminderBanner(userId);

            return new Map<String, Object>{
                'hasMfa' => hasMfa,
                'shouldShowBanner' => shouldShowBanner,
                'userId' => userId
            };
        } catch (Exception e) {
            throw new AuraHandledException('Error checking MFA status: ' + e.getMessage());
        }
    }

    /**
     * Check if user has registered any MFA method (TOTP, SMS, or Email)
     *
     * NOTE: Currently returns false to always show the banner.
     * TwoFactorMethodsInfo can contain orphaned/inactive records, making it unreliable.
     * For production, consider checking User.MfaIdentity or using a custom setting.
     */
    private static Boolean checkUserHasMfa(Id userId) {
        // TODO: Implement proper MFA check when a reliable method is identified
        // For now, always return false so banner shows for all users without MFA
        return false;
    }

    /**
     * Check if the reminder banner should be shown
     * Show if never dismissed, or dismissed more than 7 days ago
     */
    private static Boolean shouldShowReminderBanner(Id userId) {
        User currentUser = [
            SELECT LP_MFA_Reminder_Dismissed__c
            FROM User
            WHERE Id = :userId
            LIMIT 1
        ];

        // If never dismissed, show banner
        if (currentUser.LP_MFA_Reminder_Dismissed__c == null) {
            return true;
        }

        // If dismissed more than 7 days ago, show banner again
        DateTime dismissedDate = currentUser.LP_MFA_Reminder_Dismissed__c;
        DateTime sevenDaysAgo = DateTime.now().addDays(-7);

        return dismissedDate < sevenDaysAgo;
    }

    /**
     * Dismiss the MFA enrollment reminder
     * Updates the LP_MFA_Reminder_Dismissed__c field to current timestamp
     */
    @AuraEnabled
    public static void dismissReminder() {
        try {
            Id userId = UserInfo.getUserId();

            User currentUser = new User(
                Id = userId,
                LP_MFA_Reminder_Dismissed__c = DateTime.now()
            );

            update currentUser;
        } catch (Exception e) {
            throw new AuraHandledException('Error dismissing reminder: ' + e.getMessage());
        }
    }

    /**
     * Get the enrollment URL for MFA setup
     * Returns the URL to Salesforce's Identity Verification setup page
     */
    @AuraEnabled(cacheable=true)
    public static String getMfaEnrollmentUrl() {
        // Return URL to user's verification methods setup page
        return '/lightning/settings/personal/VerificationMethodsSetupPage';
    }
}
