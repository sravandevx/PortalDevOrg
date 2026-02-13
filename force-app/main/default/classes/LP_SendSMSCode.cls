/**
 * Generates and sends a 6-digit SMS verification code
 * Currently sends via email as placeholder - integrate SMS provider (Twilio etc.) for production
 */
public class LP_SendSMSCode {

    @InvocableMethod(label='Send SMS Verification Code' description='Generates and sends a 6-digit verification code to the user')
    public static List<SendCodeResult> sendSMSCode(List<SendCodeRequest> requests) {
        List<SendCodeResult> results = new List<SendCodeResult>();

        if (requests == null || requests.isEmpty()) {
            return results;
        }

        SendCodeRequest request = requests[0];
        SendCodeResult result = new SendCodeResult();

        try {
            // Generate 6-digit code
            String code = generateCode();

            // Store code and expiry on user record, save phone number
            User userToUpdate = new User(Id = request.userId);
            userToUpdate.LP_SMS_Verification_Code__c = code;
            userToUpdate.LP_SMS_Code_Expiry__c = DateTime.now().addMinutes(10);
            userToUpdate.MobilePhone = request.phoneNumber;
            update userToUpdate;

            // Send code via email (placeholder for SMS provider integration)
            sendCodeEmail(request.userId, request.phoneNumber, code);

            result.success = true;
            result.message = 'Verification code sent to ' + maskPhoneNumber(request.phoneNumber);
        } catch (Exception e) {
            result.success = false;
            result.message = 'Error sending code: ' + e.getMessage();
        }

        results.add(result);
        return results;
    }

    private static String generateCode() {
        Integer code = Integer.valueOf(Math.floor(Math.random() * 900000) + 100000);
        return String.valueOf(code);
    }

    private static String maskPhoneNumber(String phone) {
        if (phone == null || phone.length() < 4) {
            return '****';
        }
        return '***-***-' + phone.substring(phone.length() - 4);
    }

    private static void sendCodeEmail(Id userId, String phoneNumber, String code) {
        User u = [SELECT Id, Email, Name FROM User WHERE Id = :userId LIMIT 1];

        Messaging.SingleEmailMessage email = new Messaging.SingleEmailMessage();
        email.setTargetObjectId(userId);
        email.setSaveAsActivity(false);
        email.setSubject('Your LP Fund Portal Verification Code');
        email.setHtmlBody(
            '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">' +
            '<h2 style="color: #032D60;">LP Fund Portal - Verification Code</h2>' +
            '<p>Hello ' + u.Name + ',</p>' +
            '<p>Your verification code is:</p>' +
            '<div style="background: #f4f6f9; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">' +
            '<span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #032D60;">' + code + '</span>' +
            '</div>' +
            '<p>This code expires in <strong>10 minutes</strong>.</p>' +
            '<p style="color: #706E6B; font-size: 12px;">If you did not request this code, please ignore this email.</p>' +
            '</div>'
        );

        Messaging.sendEmail(new List<Messaging.SingleEmailMessage>{email});
    }

    public class SendCodeRequest {
        @InvocableVariable(label='User ID' required=true)
        public Id userId;

        @InvocableVariable(label='Phone Number' required=true)
        public String phoneNumber;
    }

    public class SendCodeResult {
        @InvocableVariable(label='Success' required=true)
        public Boolean success;

        @InvocableVariable(label='Message' required=true)
        public String message;
    }
}
