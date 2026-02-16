/**
 * Generates and sends a 6-digit verification code to the user's email address.
 * Reuses LP_SMS_Verification_Code__c and LP_SMS_Code_Expiry__c for temporary storage.
 */
public class LP_SendEmailCode {

    @InvocableMethod(label='Send Email Verification Code' description='Generates and sends a 6-digit verification code to user email')
    public static List<SendEmailCodeResult> sendEmailCode(List<SendEmailCodeRequest> requests) {
        List<SendEmailCodeResult> results = new List<SendEmailCodeResult>();

        if (requests == null || requests.isEmpty()) {
            return results;
        }

        SendEmailCodeRequest request = requests[0];
        SendEmailCodeResult result = new SendEmailCodeResult();

        try {
            User u = [SELECT Id, Email, Name FROM User WHERE Id = :request.userId LIMIT 1];

            if (String.isBlank(u.Email)) {
                result.success = false;
                result.message = 'No email address found. Please contact your administrator.';
                results.add(result);
                return results;
            }

            // Generate 6-digit code
            String code = generateCode();

            // Store code and expiry on user record
            User userToUpdate = new User(Id = request.userId);
            userToUpdate.LP_SMS_Verification_Code__c = code;
            userToUpdate.LP_SMS_Code_Expiry__c = DateTime.now().addMinutes(10);
            update userToUpdate;

            // Send code via email using setToAddresses for reliable delivery
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
                '<h2 style="color: #032D60;">LP Fund Portal - Email Verification</h2>' +
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
                String errorMsg = !errors.isEmpty() ? errors[0].getMessage() : 'Unknown error';
                result.success = false;
                result.message = 'Failed to send email: ' + errorMsg;
            } else {
                result.success = true;
                result.message = 'Verification code sent to ' + maskEmail(u.Email);
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

    private static String maskEmail(String email) {
        if (String.isBlank(email)) return '***';
        Integer atIndex = email.indexOf('@');
        if (atIndex <= 1) return '***' + email.substring(atIndex);
        return email.substring(0, 1) + '***' + email.substring(atIndex);
    }

    public class SendEmailCodeRequest {
        @InvocableVariable(label='User ID' required=true)
        public Id userId;
    }

    public class SendEmailCodeResult {
        @InvocableVariable(label='Success' required=true)
        public Boolean success;

        @InvocableVariable(label='Message' required=true)
        public String message;
    }
}
