public with sharing class CustomLoginController {

    @AuraEnabled
    public static String login(String username, String password, String startUrl) {
        try {
            ApexPages.PageReference lgn = Site.login(username, password, startUrl);
            if (lgn != null) {
                return lgn.getUrl();
            }
            throw new AuraHandledException('Invalid username or password.');
        } catch (Exception ex) {
            throw new AuraHandledException(ex.getMessage());
        }
    }
}
