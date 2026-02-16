/**
 * Generates and sends a 6-digit SMS verification code
 * Currently sends via email as placeholder - replace sendCodeEmail() with SMS provider for production
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
            // Determine phone number - use provided or fall back to stored MobilePhone
            String phone = request.phoneNumber;
            if (String.isBlank(phone)) {
                User u = [SELECT MobilePhone FROM User WHERE Id = :request.userId LIMIT 1];
                phone = u.MobilePhone;
            }

            if (String.isBlank(phone)) {
                result.success = false;
                result.message = 'No phone number found. Please contact your administrator.';
                results.add(result);
                return results;
            }

            // Generate 6-digit code
            String code = generateCode();

            // Store code and expiry on user record, save phone number
            User userToUpdate = new User(Id = request.userId);
            userToUpdate.LP_SMS_Verification_Code__c = code;
            userToUpdate.LP_SMS_Code_Expiry__c = DateTime.now().addMinutes(10);
            userToUpdate.MobilePhone = phone;
            update userToUpdate;

            // Send code via email (placeholder - replace this method with SMS provider)
            String sendError = sendCodeEmail(request.userId, code);

            if (String.isNotBlank(sendError)) {
                result.success = false;
                result.message = 'Failed to send code: ' + sendError;
            } else {
                result.success = true;
                result.message = 'Verification code sent to ' + maskPhoneNumber(phone);
            }
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

    /**
     * Sends verification code via email (placeholder for SMS).
     * Returns null on success, error message on failure.
     */
    private static String sendCodeEmail(Id userId, String code) {
        User u = [SELECT Id, Email, Name FROM User WHERE Id = :userId LIMIT 1];

        if (String.isBlank(u.Email)) {
            return 'No email address found on user record.';
        }

        Messaging.SingleEmailMessage email = new Messaging.SingleEmailMessage();
        email.setToAddresses(new List<String>{ u.Email });
        email.setSaveAsActivity(false);
        email.setSubject('Your LP Fund Portal Verification Code');
        email.setPlainTextBody(
            'Hello ' + u.Name + ',\n\n' +
            'Your verification code is: ' + code + '\n\n' +
            'This code expires in 10 minutes.\n\n' +
            'If you did not request this code, please ignore this email.'
        );
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

        List<Messaging.SendEmailResult> sendResults = Messaging.sendEmail(
            new List<Messaging.SingleEmailMessage>{ email }, false
        );

        if (!sendResults.isEmpty() && !sendResults[0].isSuccess()) {
            List<Messaging.SendEmailError> errors = sendResults[0].getErrors();
            if (!errors.isEmpty()) {
                return errors[0].getMessage();
            }
            return 'Unknown email delivery error.';
        }

        return null;
    }

    public class SendCodeRequest {
        @InvocableVariable(label='User ID' required=true)
        public Id userId;

        @InvocableVariable(label='Phone Number' required=false)
        public String phoneNumber;
    }

    public class SendCodeResult {
        @InvocableVariable(label='Success' required=true)
        public Boolean success;

        @InvocableVariable(label='Message' required=true)
        public String message;
    }
}
