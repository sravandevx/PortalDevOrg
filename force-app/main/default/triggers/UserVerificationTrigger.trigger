/**
 * Trigger to manage verification method permission sets based on User field changes
 */
trigger UserVerificationTrigger on User (after insert, after update) {
    LP_UserVerificationHandler.handleVerificationChanges(Trigger.new, Trigger.oldMap);
}
