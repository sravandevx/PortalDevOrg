/**
 * Handler class for User Verification Trigger
 * Manages permission set assignments based on user's selected verification method
 */
public class LP_UserVerificationHandler {

    // Permission Set API Names
    private static final String PS_EMAIL = 'LP_Email_Verification_Required';
    private static final String PS_SMS = 'LP_SMS_Verification_Required';
    private static final String PS_AUTHENTICATOR = 'LP_MFA_Authenticator_Required';

    /**
     * Main handler method - processes verification field changes
     */
    public static void handleVerificationChanges(List<User> newUsers, Map<Id, User> oldUserMap) {
        // Collect users whose verification settings changed
        List<User> usersToProcess = new List<User>();

        for (User user : newUsers) {
            User oldUser = oldUserMap != null ? oldUserMap.get(user.Id) : null;

            // Check if any verification field changed
            if (hasVerificationChanged(user, oldUser)) {
                usersToProcess.add(user);
            }
        }

        if (!usersToProcess.isEmpty()) {
            // Process asynchronously to avoid mixed DML operation errors
            System.enqueueJob(new VerificationPermissionSetQueueable(usersToProcess));
        }
    }

    /**
     * Check if any verification field has changed
     */
    private static Boolean hasVerificationChanged(User newUser, User oldUser) {
        if (oldUser == null) {
            // Insert - check if any verification is enabled
            return newUser.LP_Email_Verification_Enabled__c ||
                   newUser.LP_SMS_Verification_Enabled__c ||
                   newUser.LP_Authenticator_Verification_Enabled__c;
        }

        // Update - check if any field value changed
        return newUser.LP_Email_Verification_Enabled__c != oldUser.LP_Email_Verification_Enabled__c ||
               newUser.LP_SMS_Verification_Enabled__c != oldUser.LP_SMS_Verification_Enabled__c ||
               newUser.LP_Authenticator_Verification_Enabled__c != oldUser.LP_Authenticator_Verification_Enabled__c;
    }

    /**
     * Queueable class to handle permission set assignments asynchronously
     * This avoids mixed DML operation errors (User DML + Setup DML)
     */
    public class VerificationPermissionSetQueueable implements Queueable {
        private List<User> usersToProcess;

        public VerificationPermissionSetQueueable(List<User> users) {
            this.usersToProcess = users;
        }

        public void execute(QueueableContext context) {
            // Get permission set IDs
            Map<String, Id> permissionSetMap = getPermissionSetIds();

            // Get existing permission set assignments
            Set<Id> userIds = new Set<Id>();
            for (User u : usersToProcess) {
                userIds.add(u.Id);
            }

            Map<Id, Set<Id>> existingAssignments = getExistingAssignments(userIds, new Set<Id>(permissionSetMap.values()));

            // Lists for DML operations
            List<PermissionSetAssignment> toInsert = new List<PermissionSetAssignment>();
            List<PermissionSetAssignment> toDelete = new List<PermissionSetAssignment>();

            // Process each user
            for (User user : usersToProcess) {
                String selectedPermissionSet = getSelectedPermissionSet(user);
                Set<Id> currentAssignments = existingAssignments.get(user.Id);

                if (currentAssignments == null) {
                    currentAssignments = new Set<Id>();
                }

                // Remove all verification permission sets first
                for (Id psId : permissionSetMap.values()) {
                    if (currentAssignments.contains(psId)) {
                        toDelete.add(new PermissionSetAssignment(
                            AssigneeId = user.Id,
                            PermissionSetId = psId
                        ));
                    }
                }

                // Add the selected permission set
                if (selectedPermissionSet != null && permissionSetMap.containsKey(selectedPermissionSet)) {
                    Id psId = permissionSetMap.get(selectedPermissionSet);
                    if (!currentAssignments.contains(psId)) {
                        toInsert.add(new PermissionSetAssignment(
                            AssigneeId = user.Id,
                            PermissionSetId = psId
                        ));
                    }
                }
            }

            // Perform DML operations
            if (!toDelete.isEmpty()) {
                delete toDelete;
            }

            if (!toInsert.isEmpty()) {
                insert toInsert;
            }
        }

        /**
         * Get permission set IDs by API name
         */
        private Map<String, Id> getPermissionSetIds() {
            Map<String, Id> psMap = new Map<String, Id>();

            for (PermissionSet ps : [SELECT Id, Name FROM PermissionSet
                                     WHERE Name IN (:PS_EMAIL, :PS_SMS, :PS_AUTHENTICATOR)]) {
                psMap.put(ps.Name, ps.Id);
            }

            return psMap;
        }

        /**
         * Get existing permission set assignments for users
         */
        private Map<Id, Set<Id>> getExistingAssignments(Set<Id> userIds, Set<Id> permissionSetIds) {
            Map<Id, Set<Id>> assignments = new Map<Id, Set<Id>>();

            for (PermissionSetAssignment psa : [SELECT AssigneeId, PermissionSetId
                                                FROM PermissionSetAssignment
                                                WHERE AssigneeId IN :userIds
                                                AND PermissionSetId IN :permissionSetIds]) {
                if (!assignments.containsKey(psa.AssigneeId)) {
                    assignments.put(psa.AssigneeId, new Set<Id>());
                }
                assignments.get(psa.AssigneeId).add(psa.PermissionSetId);
            }

            return assignments;
        }

        /**
         * Determine which permission set should be assigned based on user's verification settings
         */
        private String getSelectedPermissionSet(User user) {
            // Priority: Authenticator > SMS > Email
            if (user.LP_Authenticator_Verification_Enabled__c) {
                return PS_AUTHENTICATOR;
            } else if (user.LP_SMS_Verification_Enabled__c) {
                return PS_SMS;
            } else if (user.LP_Email_Verification_Enabled__c) {
                return PS_EMAIL;
            }
            return null;
        }
    }
}
