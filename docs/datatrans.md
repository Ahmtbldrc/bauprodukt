# **Comprehensive Integration Guide for the Datatrans Payment Gateway**

## **Introduction**

### **Overview of Datatrans AG**

Datatrans AG is a premier Swiss Payment Service Provider (PSP) specializing in the technical processing of online payments for e-commerce, mobile commerce, and backend applications. A key characteristic of the Datatrans model is its strategic independence from financial institutions and acquirers. Datatrans focuses purely on the technical aspects of payment processing, acting as a robust and flexible gateway. This architecture provides merchants with the freedom to connect to a wide array of financial partners through a single, stable integration, thereby optimizing their payment infrastructure without being locked into a specific vendor.1 The platform is engineered for high availability and security, boasting a 99.9996% API availability rate and continuous development that incorporates new standards like PSD2 and 3-D Secure with minimal maintenance effort required from merchants.1

### **Purpose and Structure of this Guide**

The purpose of this document is to serve as a single, authoritative, and exhaustive technical resource for developers integrating the Datatrans payment gateway. It consolidates information from official documentation and technical references into a logical, step-by-step guide. The structure is designed to walk a developer through the entire integration lifecycle, from initial account setup and understanding core concepts to implementing specific integration methods for web and mobile, managing the full transaction lifecycle via the server-to-server API, implementing robust security and validation protocols, and finally, executing a thorough testing and go-live strategy.

### **Critical Clarification: Datatrans AG (.ch) vs. DataTrans Solutions (.com)**

Before proceeding, it is imperative to address a significant point of potential confusion. The digital landscape contains two distinct and unrelated companies operating under a similar name:

1. **Datatrans AG (datatrans.ch):** The Swiss Payment Service Provider (PSP) that is the exclusive subject of this integration guide. This company provides a payment gateway for processing online transactions.3
2. **DataTrans Solutions (datatrans-inc.com):** A U.S.-based company specializing in Electronic Data Interchange (EDI) and supply chain automation solutions.5

A developer searching for "Datatrans integration" may encounter documentation related to EDI, WebEDI, and supply chain management.8 This information pertains to DataTrans Solutions and is entirely irrelevant to the payment gateway integration process. Misinterpreting these sources can lead to significant delays and incorrect implementation.

**This guide pertains exclusively to the services and APIs provided by the Swiss PSP, Datatrans AG.**

---

## **Section 1: Getting Started \- Account Setup and Core Concepts**

This section covers the foundational knowledge and initial setup steps required before writing any code. Understanding the Datatrans ecosystem, acquiring the necessary credentials, and grasping the core payment flows are essential prerequisites for a successful integration.

### **1.1 The Datatrans Ecosystem: Test vs. Production Environments**

Datatrans operates a dual-environment system, which is standard practice for payment processors to ensure safe and thorough development and testing before handling live financial transactions.

- **Test/Sandbox Environment:** This is a fully functional replica of the production environment that processes transactions without moving real money. It is the primary environment for all development and testing activities. The administration panel for the test environment is accessible at https://admin.sandbox.datatrans.com/ or https://pilot.datatrans.biz/.11 Test merchant accounts are free and can be requested directly from Datatrans.14
- **Production/Live Environment:** This is the live environment where real financial transactions are processed. Access to this environment is granted after a contract is established with Datatrans. The administration panel for the production environment is located at https://admin.datatrans.com/.12

It is critical to use the appropriate environment and corresponding credentials for each phase of the project.

### **1.2 Your Merchant Account: Acquiring and Navigating the Webadmin Tool**

The first step in the integration process is to obtain a merchant account. For development, a test account should be requested from the Datatrans website.15 This will provide access to the test Webadmin Tool, the central hub for configuring your integration.

The Webadmin Tool is where all critical settings are managed. The most important section for developers is the **UPP Administration** (Universal Payment Page Administration) area. Within this section, you will find subsections for "UPP Data" and "Security," which house the essential credentials and configuration options needed for the integration.11

### **1.3 Essential Credentials and Where to Find Them**

A successful integration relies on three key pieces of information from your Datatrans account. The following table details what these credentials are, where to find them within the Webadmin Tool, and their primary purpose.

| Credential                    | Location in Webadmin Tool                                             | Primary Use Case                                                                                                                                                                                                                                             |
| :---------------------------- | :-------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Merchant ID**               | UPP Administration \> UPP Data                                        | A unique 10-digit number identifying your account.18 It is used in nearly every API call and serves as the username for HTTP Basic Authentication.19 Production IDs typically start with a '3', while test IDs start with a '1'.12                           |
| **Server-to-Server Password** | UPP Administration \> Security \> "Server-to-Server service security" | The password used for HTTP Basic Authentication for all direct server-to-server API calls. You must check the box "Protect server-to-server services with password" to enable and generate this password.12                                                  |
| **HMAC Key**                  | UPP Administration \> Security \> "Security signature"                | A secret cryptographic key (hex-encoded string) used to generate and verify HMAC-SHA256 signatures. This ensures the authenticity and integrity of data exchanged between your server and Datatrans, particularly for webhooks and payment page callbacks.11 |

### **1.4 Fundamental Payment Flows**

Datatrans categorizes all transactions into two primary flows, which dictate the nature of the integration and the interaction model with the customer.3

- **Customer-Initiated Payments:** These are transactions where the customer is actively present and provides their payment details to initiate the payment. This is the standard flow for e-commerce checkouts on websites or within mobile applications. The process involves the merchant's system initializing a transaction, after which the customer is guided through the payment process.3 Optionally, payment information can be saved (tokenized) during this flow for future use.3
- **Merchant-Initiated Payments:** These are transactions initiated by the merchant's backend system without the customer's direct involvement at the time of the charge. This flow is used for subscriptions, recurring billing, or any scenario where a customer's saved payment details are charged on a schedule or in response to a backend event. This flow relies on a token or alias that was created during a prior customer-initiated transaction.3

### **1.5 Overview of Integration Paths: Choosing the Right Method**

Datatrans offers a spectrum of integration methods, each with different implications for user experience, implementation complexity, and PCI DSS (Payment Card Industry Data Security Standard) compliance scope. Choosing the right path is a critical architectural decision that should be made at the outset of the project.

| Integration Method      | PCI Scope (SAQ Level) | User Experience                                                     | Implementation Effort | Key Use Case                                                                                                    |
| :---------------------- | :-------------------- | :------------------------------------------------------------------ | :-------------------- | :-------------------------------------------------------------------------------------------------------------- |
| **Redirect & Lightbox** | Lowest (SAQ-A)        | **Redirect:** User leaves the site. **Lightbox:** Seamless overlay. | Low                   | Standard web checkouts where minimizing PCI scope is the top priority.2                                         |
| **Secure Fields**       | Low (SAQ A-EP)        | Fully integrated and customizable within your own checkout form.    | Medium                | Merchants desiring a fully branded and seamless checkout experience without handling raw card data directly.3   |
| **Mobile SDK**          | Lowest (SAQ-A)        | Native, platform-optimized payment flow within iOS/Android apps.    | Medium                | In-app purchases for native mobile applications, offering features like card scanning and wallet integration.23 |
| **API Endpoints**       | Highest (SAQ-D)       | Entirely backend-driven, no UI provided by Datatrans.               | High                  | Server-to-server operations like settling funds, issuing refunds, and processing merchant-initiated payments.3  |

---

## **Section 2: Web Integration \- Payment Pages (Redirect & Lightbox)**

The Payment Pages integration is the most common and straightforward method for web-based e-commerce. It is designed to maximize security and minimize the merchant's PCI compliance burden by ensuring that sensitive payment data is entered directly onto pages hosted by Datatrans.

### **2.1 Architecture and User Flow: How It Works**

The core principle of this method is outsourcing the collection of payment information. Your server initiates a transaction with Datatrans, and the customer's browser is then directed to a secure Datatrans environment to complete the payment. This ensures that sensitive cardholder data never passes through or is stored on your servers.2 Datatrans offers two modes for this interaction.22

- **Redirect Mode:** In this mode, the user's browser is fully redirected away from your website to a payment page hosted on a datatrans.com domain. After the payment is completed, canceled, or fails, the user is redirected back to one of the corresponding URLs you specified (successUrl, cancelUrl, errorUrl).
  - **Pros:** This is the most secure and simplest method to implement, as it creates a clear separation between the merchant's site and the payment environment.22
  - **Cons:** The user experience can be slightly jarring as the customer visibly leaves your site, which may impact conversion rates for some users.22
- **Lightbox Mode:** This mode offers a more integrated user experience. Instead of a full-page redirect, the Datatrans payment page is displayed as a modal window or an overlay on top of your existing checkout page. The browser's URL bar continues to show your website's domain.21
  - **Pros:** Provides a more seamless checkout flow, as the customer feels they are still within your site's environment, which can improve trust and conversion.21
  - **Cons:** It can be susceptible to minor UI glitches on older mobile devices. Furthermore, certain payment methods that require their own authentication flow (like 3D Secure for cards or PayPal) will still trigger a full redirect away from the lightbox, negating some of its seamlessness.22

### **2.2 Implementation Guide: Step-by-Step**

Implementing the Payment Pages integration involves the following server-side and client-side steps:

1. **Server-Side Transaction Initialization:** When the customer proceeds to checkout, your server must prepare a set of parameters to send to Datatrans. The essential parameters include your merchantId, the amount (in the currency's smallest unit, e.g., 1000 for 10.00 CHF), the currency (as a 3-letter ISO code), and a unique refno (your internal reference for the order).20
2. **Specify Return URLs:** You must also provide three critical URLs: successUrl, errorUrl, and cancelUrl. These URLs dictate where the customer's browser will be redirected after the transaction is processed.
3. **Client-Side Action:**
   - For **Redirect Mode**, your server generates an HTML form that POSTs these parameters to the Datatrans payment URL, or simply constructs a redirect URL and sends a 302 redirect response to the user's browser.
   - For **Lightbox Mode**, you will include a Datatrans JavaScript library on your page. Your server will still need to generate the transaction parameters, which are then passed to the JavaScript function that initializes and displays the lightbox.

### **2.3 Customization and Styling**

To maintain brand consistency and user trust, Datatrans allows for significant customization of the Payment Pages. Within the Webadmin Tool, you can configure various visual elements 17:

- **Colors:** You can specify hexadecimal color codes for the primary brand color, text color, and button colors to align with your site's theme.
- **Logo:** You can upload your company logo and choose its display style (e.g., circle or rectangle) and border color.
- **Header & Footer:** The content of the header and footer on the payment page can be configured to include your own branding or links.2

These customizations help create a more professional and seamless experience, reassuring the customer that they are in a trusted payment environment.

### **2.4 Security and PCI Compliance**

The primary advantage of using the Redirect or Lightbox integration is the drastic reduction in PCI DSS compliance scope. Because all sensitive cardholder data is entered and processed on Datatrans's secure servers, your systems never touch this data. This typically qualifies a merchant for the simplest PCI DSS validation type, the Self-Assessment Questionnaire A (SAQ-A).24 This saves significant time, effort, and cost associated with achieving and maintaining PCI compliance.26

### **2.5 Handling Callbacks and Post URLs**

A robust integration must correctly handle the information returned by Datatrans after a payment attempt. There are two distinct mechanisms for this, and it is critical to understand their different roles.

- **Client-Side Redirects (successUrl, errorUrl, cancelUrl):** These are the URLs to which the user's browser is sent after the transaction concludes. They are essential for guiding the user to the correct confirmation or error page. However, these should **not** be used as the definitive trigger for fulfilling an order. A user could successfully complete a payment but close their browser before the redirect to the successUrl is complete. Relying solely on this client-side event would result in a lost order.
- **Server-Side Notification (URL Post / Webhook):** This is a direct, server-to-server communication from Datatrans to your backend. In the "UPP Data" section of the Webadmin Tool, you can configure a "URL Post".12 After every transaction, Datatrans will send a POST request to this URL containing the full details and final status of the transaction. This webhook is the authoritative source of truth for the transaction's outcome. Your backend logic for order fulfillment, sending confirmation emails, and updating inventory should be triggered exclusively by the successful receipt and validation of this server-side notification. This design ensures that your system is resilient to client-side issues like network interruptions or premature browser closure.

---

## **Section 3: Mobile Integration \- Native SDKs for iOS & Android**

For merchants with native mobile applications, the Datatrans Mobile SDKs for iOS and Android provide the optimal solution for in-app payments. They are designed to offer a seamless, secure, and platform-native user experience while offloading the complexities of payment processing and PCI compliance.

### **3.1 SDK Architecture: The mobileToken Flow**

The architecture of the Mobile SDK integration is designed with security as a primary concern, specifically to prevent sensitive credentials from being stored or exposed within the mobile application itself. The process involves a server-to-client tokenization flow 23:

1. **Server-Side Initialization:** When the user is ready to pay in the app, the mobile app sends a request to your own backend server.
2. **mobileToken Generation:** Your backend server makes an authenticated server-to-server call to the Datatrans /init endpoint. This request includes the transaction details (amount, currency, etc.) and an option to returnMobileToken.23 Datatrans responds with a  
   mobileToken, which is a unique, single-use, and short-lived (valid for 30 minutes) identifier for this specific transaction.20
3. **Token Delivery to App:** Your server passes this mobileToken back to the mobile application.
4. **SDK Initialization:** The mobile app uses the mobileToken to initialize the Datatrans SDK. The SDK then takes over, securely displaying the native payment UI and handling the entire payment process.23

This two-step flow ensures that your Datatrans merchantId and server-to-server password are never present in the mobile app's code, protecting them from reverse engineering.

### **3.2 iOS Integration Deep Dive**

Integrating the Datatrans SDK into an iOS application involves these key steps:

- **Dependencies:** The SDK can be added to an Xcode project using either Swift Package Manager by pointing to the repository github.com/datatrans/ios-sdk, or via CocoaPods using pod 'Datatrans'.23 For specialized use cases like App Clips, you can select only the required packages to minimize the app's size.23
- **Configuration (Info.plist):** Your app's Info.plist file must be configured to support SDK features. This includes adding a Privacy \- Camera Usage Description if you plan to use the card scanning feature. More importantly, to support app-switching for third-party payment apps (like TWINT, PayPal, Klarna), you must add the LSApplicationQueriesSchemes array and list the specific URL schemes for each payment app you intend to support.23
- **Implementation:** The core implementation involves obtaining the mobileToken from your server and then calling the SDK's transaction function with this token. You will also implement the SDK's delegate protocol to receive callbacks for successful transactions (transactionDidSucceed), errors (transactionDidFail), or user cancellations (transactionDidCancel).23

### **3.3 Android Integration Deep Dive**

The process for integrating the SDK into an Android application is analogous to iOS:

- **Dependencies:** You add the Datatrans repository to your project's build.gradle file and then include the necessary SDK dependencies.23 Similar to iOS, you can exclude optional dependencies for Instant Apps to reduce the final package size.23
- **Configuration (AndroidManifest.xml):** The manifest file may require configuration for specific payment methods. For example, PayPal requires defining a Datatrans relay activity with an intent filter for a unique URI scheme to handle the return redirect correctly.23
- **Implementation:** After retrieving the mobileToken from your server, you start the payment process by calling the SDK's library function. You will implement a listener or use callbacks to handle the results of the transaction, receiving either the success data, an error object, or a cancellation event.23

### **3.4 Core SDK Features and Benefits**

The Mobile SDKs are more than just a simple payment form; they provide a suite of features designed to enhance the user experience and simplify development:

- **Native UI:** The SDKs provide award-winning, platform-idiomatic UI components that feel like a natural part of the iOS or Android ecosystem. This includes fluid animations and an optimized layout for one-handed use.29
- **Card Scanning:** A built-in feature allows users to scan their credit card with the device's camera, automatically populating the card number and expiry date, which reduces friction and input errors.27
- **Automated 3DS & App-Switching:** The SDKs automatically manage the entire 3D Secure 2.0 challenge flow, redirecting the user to their bank's authentication page and back to the app seamlessly. They also handle the complexities of switching to external payment apps (e.g., TWINT, PayPal) and returning to your app upon completion.23
- **Simplified PCI Compliance:** As with the Payment Pages, the Mobile SDKs are designed so that sensitive cardholder data is transmitted directly to Datatrans servers, never touching your own. This qualifies your application for the SAQ-A level of PCI compliance, the simplest to achieve.24

### **3.5 Advanced Features**

Beyond the core functionality, the SDKs offer advanced capabilities for sophisticated mobile commerce applications:

- **Tokenization & Fast Checkouts:** The SDKs fully support the tokenization of payment methods. You can save a customer's card or other payment details as a secure alias after a successful transaction. On subsequent purchases, you can pass this alias to the SDK to enable a "one-tap" checkout experience, dramatically speeding up the process for returning customers.23
- **Custom Styling:** While the default UI is platform-optimized, you can customize various theme elements, such as background and button colors, to align the payment flow with your app's branding.23
- **Wallet Support:** Integration with Apple Pay and Google Pay is included out-of-the-box, allowing you to offer these popular and convenient payment methods with minimal additional development effort.24

---

## **Section 4: Server-to-Server Integration \- The JSON API**

The Datatrans server-to-server JSON API provides direct, programmatic access to the payment gateway's core functionalities. This integration path offers the highest degree of control and flexibility, making it ideal for managing the post-authorization lifecycle of a transaction, implementing custom payment flows, and building subscription or recurring payment systems.

### **4.1 API Authentication**

All server-to-server API requests must be authenticated using **HTTP Basic Authentication**. The authentication credentials are a combination of your merchantId (as the username) and your server-to-server password (as the password), which is configured in the Webadmin Tool.19 The combined credentials must be Base64 encoded and sent in the

Authorization header of each request. For security, all API communication must occur over HTTPS using TLS version 1.2 or higher.19

Example Authorization header:  
Authorization: Basic MTEwMDAwNzI4MzpobDJST1NScUN2am5EVlJL  
(where the string is the Base64 encoding of merchantId:password)

### **4.2 The Transaction Lifecycle via API**

The API provides a set of endpoints that map directly to the key stages of a payment transaction's lifecycle after it has been authorized. These are primarily used for managing funds and handling post-payment operations.

- **Authorize (/v1/transactions/authorize):** This endpoint is used to process a **merchant-initiated payment**. You provide a previously saved token (alias) along with the amount and currency to charge the customer's payment method. This is the core operation for recurring payments and subscriptions.19
- **Settle (Capture) (/v1/transactions/{transactionId}/settle):** When a transaction is first authorized, the funds are reserved but not yet transferred. The settle operation captures these funds, initiating the transfer from the customer's account to yours. This is a required step for most payment methods unless you have configured auto-settlement.3
- **Cancel (Void) (/v1/transactions/{transactionId}/cancel):** This operation is used to release a previously authorized transaction. It can only be performed on transactions that have been authorized but not yet settled. This is effectively a void and prevents any funds from being captured.3
- **Refund (/v1/transactions/{transactionId}/refund):** This operation is used to return funds to a customer for a transaction that has already been settled. You can perform full or partial refunds up to the original settled amount.3

| Action                 | HTTP Method | Endpoint                                | Description                                                |
| :--------------------- | :---------- | :-------------------------------------- | :--------------------------------------------------------- |
| **Authorize Payment**  | POST        | /v1/transactions/authorize              | Charges a saved payment method (merchant-initiated).       |
| **Settle Transaction** | POST        | /v1/transactions/{transactionId}/settle | Captures the funds for an authorized transaction.          |
| **Cancel Transaction** | POST        | /v1/transactions/{transactionId}/cancel | Voids an authorized transaction before settlement.         |
| **Refund Transaction** | POST        | /v1/transactions/{transactionId}/refund | Returns funds to the customer for a settled transaction.   |
| **Check Status**       | GET         | /v1/transactions/{transactionId}        | Retrieves the current status and details of a transaction. |

### **4.3 Managing Recurring Payments and Subscriptions**

The server-to-server API is the foundation for any recurring payment model. The typical flow is as follows:

1. **Initial Tokenization:** The customer performs an initial customer-initiated payment (via Payment Pages or Mobile SDK) with an option enabled to save their payment information. This process creates a secure token (alias) representing their payment method, which is returned to your server via webhook or status call.3
2. **Store the Token:** Your server securely stores this token in your database, associated with the customer's subscription or account.
3. **Subsequent Charges:** For each subsequent billing cycle, your backend system makes a POST request to the /v1/transactions/authorize endpoint, providing the stored token, amount, and currency. This charges the customer without requiring their interaction.3

### **4.4 Ensuring Reliability: Idempotency**

Building a reliable payment system requires accounting for network instability. A common failure scenario involves your server sending a payment request, but a network timeout prevents it from receiving a response. The server does not know if the payment was processed or not. Simply retrying the request could lead to a dangerous double charge for the customer.

To prevent this, the Datatrans API supports **idempotency** for all POST requests. This is achieved by including a unique Idempotency-Key in the HTTP header of your request.19

- **How it works:** You generate a unique key (e.g., a UUID v4) for every operation on your server.
  - If Datatrans receives a request with a new idempotency key, it processes it as a new operation.
  - If the request succeeds and you retry it with the _same_ idempotency key within 60 minutes, Datatrans will not process a new transaction. Instead, it will recognize the key and simply return the original successful response.
  - If the original request is still being processed when a retry with the same key arrives, Datatrans will return a 409 Conflict error, indicating that you should wait and retry later.

The use of an Idempotency-Key is not merely an optional feature; it is a fundamental best practice for any production-grade server-to-server integration. It transforms an unsafe retry operation into a safe one, ensuring that network failures do not result in duplicate financial transactions.

---

## **Section 5: Security and Validation**

Ensuring the security and integrity of payment transactions is paramount. Datatrans provides a multi-layered approach to security and validation, allowing merchants to verify the authenticity of every transaction and secure their communication channels.

### **5.1 Securing Communications: HMAC-SHA256 Signature Validation**

A Hash-based Message Authentication Code (HMAC) is a cryptographic mechanism used to verify both the **data integrity** and the **authenticity** of a message.30 It involves a cryptographic hash function (SHA-256 in this case) and a secret key, which is your HMAC key from the Webadmin Tool.

Datatrans uses HMAC signatures to secure asynchronous communications like payment page callbacks and webhooks. When Datatrans sends data to one of your URLs, it includes a calculated signature. Your server must then independently recalculate the signature using the same data and your secret key. If the calculated signature matches the one sent by Datatrans, you can be certain that the message genuinely came from Datatrans and that its contents have not been altered in transit.32

### **5.2 Asynchronous Confirmation: Setting Up and Verifying Webhooks**

As established, webhooks (configured via the "URL Post" field) are the most reliable method for receiving the final status of a transaction. However, to trust the data received at your webhook endpoint, you must verify its signature.

- **Setup:** In the Datatrans Webadmin Tool, navigate to "UPP Administration" \> "UPP Data" and enter your publicly accessible webhook endpoint URL in the "URL Post" field.12 Then, in "UPP Administration" \> "Security" \> "Security signature", ensure that HMAC signing is enabled and you have generated an HMAC key.15
- **Verification Process:** When webhook signing is active, Datatrans will include a Datatrans-Signature HTTP header in every webhook request. This header contains two components: a timestamp t and the signature s0.19 To verify the webhook, your server must perform the following steps:
  1. Receive the raw POST body (the payload) of the webhook request.
  2. Extract the timestamp t and the signature s0 from the Datatrans-Signature header.
  3. Concatenate the timestamp string with the raw payload string.
  4. Calculate an HMAC-SHA256 hash of the concatenated string from step 3, using your secret HMAC key.
  5. Compare your calculated hash (in hexadecimal format) with the s0 signature received from Datatrans.
  6. If they match exactly, the webhook is authentic and can be trusted. If they do not match, the request should be discarded as it may have been tampered with or did not originate from Datatrans.19

### **5.3 Real-time Verification: Using the Status API**

In addition to passive webhook verification, Datatrans provides a proactive method for confirming a transaction's status: the **Status API**. This is a simple, authenticated GET request to /v1/transactions/{transactionId}.32

This method is recommended by Datatrans as a straightforward and highly reliable validation technique.32 After receiving a callback or webhook, your server can make a direct API call to Datatrans using the

transactionId from the notification. The response from the Status API provides the definitive and current state of the transaction directly from the source.

A robust, defense-in-depth validation strategy would involve using the verified webhook as the primary trigger for order processing, and then, as a final confirmation step before fulfillment, making a Status API call to double-check the transaction amount and status. This combined approach provides the highest level of assurance.

### **5.4 Advanced Security Topics**

- **3-D Secure (3DS):** 3-D Secure (and its successor, Strong Customer Authentication or SCA) is a security protocol that provides an additional layer of authentication for card-not-present transactions. Datatrans integrations like the Payment Pages and Mobile SDKs are designed to handle the 3DS flow automatically. The solutions will detect when a 3DS challenge is required by the issuing bank and will seamlessly redirect the user to complete the authentication before finalizing the transaction.1
- **PSD2 Compliance:** The second Payment Services Directive (PSD2) is a European regulation that mandates SCA for many online payments. Datatrans solutions are fully compliant with PSD2, ensuring that merchants meet these regulatory requirements without needing to implement the complex logic themselves.1
- **Content Security Policy (CSP):** If your website implements a strict CSP to prevent cross-site scripting (XSS) attacks, you must explicitly whitelist Datatrans domains to allow its scripts and iframes to load. The following domains should be added to your script-src and frame-src directives 34:
  - pay.datatrans.com (for production)
  - pay.sandbox.datatrans.com (for testing)
  - Note: If using Lightbox mode, the frame-src directive may need to be set to \* to accommodate redirects to various third-party 3DS pages.34

---

## **Section 6: Testing and Go-Live**

Thorough testing is the final and most critical phase before launching a payment integration. This section provides the tools, data, and procedures needed to validate every aspect of your integration, handle potential errors gracefully, and confidently transition to the production environment.

### **6.1 The Sandbox Environment**

All development and testing must be conducted in the Datatrans sandbox environment. This environment allows you to perform end-to-end tests of your entire payment flow—from transaction initiation to webhook validation—using test payment credentials without any real funds being moved.11 Ensure that you are using your test

merchantId and test API credentials throughout this phase.

### **6.2 Test Credentials and Card Numbers**

Datatrans provides a comprehensive set of test card numbers that can be used to simulate a wide variety of transaction outcomes. This allows you to test not only the "happy path" (a successful payment) but also various failure scenarios, ensuring your application can handle them correctly.

A key feature of the Datatrans test environment is its use of transaction amounts to trigger specific responses for cards marked with "Limit \= Yes". This allows for precise testing of decline and error conditions.36

| Card Brand                         | Card Number      | CVC  | Amount Range (in smallest unit) | Expected Outcome                    |
| :--------------------------------- | :--------------- | :--- | :------------------------------ | :---------------------------------- |
| Visa (with limit)                  | 4242424242424242 | 123  | 0 \- 9000                       | Authorized                          |
| Visa (with limit)                  | 4242424242424242 | 123  | 9001 \- 10000                   | Declined (e.g., insufficient limit) |
| Visa (with limit)                  | 4242424242424242 | 123  | 10001 \- 11000                  | Referral (contact acquirer)         |
| Visa (with limit)                  | 4242424242424242 | 123  | \>= 11001                       | Declined (card blocked/stolen)      |
| Mastercard (with limit)            | 5404000000000001 | 123  | _(Same amount rules as above)_  | _(Same outcomes as above)_          |
| Amex (with limit)                  | 375811111111115  | 1234 | _(Same amount rules as above)_  | _(Same outcomes as above)_          |
| Visa (3DS Challenge Auth)          | 4000001000000018 | 123  | Any                             | Authorized after 3DS challenge      |
| Visa (3DS Frictionless Auth)       | 4000001000000034 | 123  | Any                             | Authorized (frictionless 3DS)       |
| Mastercard (3DS Challenge Decline) | 5100001000000014 | 123  | Any                             | Declined after 3DS challenge        |

This table represents a subset of available test cards. A more exhaustive list can be found in the official Datatrans documentation.37 Systematically testing these scenarios is crucial for building a robust application.

### **6.3 Comprehensive Error Handling**

Your application must be prepared to handle a variety of errors from the Datatrans API. A resilient system will log these errors for debugging and, where appropriate, provide clear feedback to the user.

| Error Code                 | Explanation                                                                                                                                   | Recommended Developer Action                                                                                                                                                                     |
| :------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| DECLINED                   | The transaction was declined by the issuing bank or payment provider for various reasons (e.g., insufficient funds, suspected fraud).39       | Inform the customer that their payment was declined and ask them to try another payment method. Do not retry the same card automatically.                                                        |
| INVALID_TRANSACTION_STATUS | You are attempting an action that is not valid for the transaction's current state (e.g., trying to settle an already settled transaction).39 | This typically indicates a logic error in your backend. Log the transactionId and the attempted action for investigation.                                                                        |
| DUPLICATE_REFNO            | The refno you provided for a new transaction has already been used for a previous transaction with your merchantId.39                         | Ensure your system generates a unique refno for every new transaction attempt. If a request fails due to a network error, generate a new refno before retrying, unless using an idempotency key. |
| UNAUTHORIZED               | Your merchantId is not authorized to use the requested API endpoint, or your authentication credentials are incorrect.39                      | Verify that your merchantId and server-to-server password are correct and that your account is enabled for the feature you are trying to access.                                                 |
| SOFT_DECLINED              | A card transaction was attempted without 3DS, but the bank requires it. This is a signal to re-attempt the transaction with 3DS enabled.39    | If using a direct API integration, re-initiate the transaction through a 3DS-enabled flow. Hosted and SDK solutions handle this automatically.                                                   |
| INVALID_JSON_PAYLOAD       | The JSON body of your API request is malformed or contains a syntax error.39                                                                  | Check the structure of your JSON request against the API documentation. Ensure all required fields are present and correctly formatted.                                                          |

### **6.4 Pre-Launch Checklist**

Before switching your integration to the live production environment, complete the following checklist to ensure a smooth transition and prevent common go-live issues.41

- **\[ \] Finalize Testing:** Confirm that all test scenarios, including successful payments, various declines, 3DS challenges, and refunds, have been executed successfully in the sandbox environment.
- **\[ \] Switch Credentials:** Replace all test credentials (merchantId, server-to-server password, HMAC key) in your application's configuration with the production credentials provided by Datatrans.
- **\[ \] Update Endpoints:** Verify that all API calls and form posts are pointing to the production Datatrans URLs (e.g., pay.datatrans.com), not the sandbox URLs.
- **\[ \] Configure Production Webhooks:** Ensure that your URL Post (webhook) endpoint is correctly configured in your _production_ Datatrans Webadmin Tool and that the endpoint is publicly accessible from the internet.
- **\[ \] Verify Production Security Settings:** Log in to the production Webadmin Tool and double-check that "Protect server-to-server services with password" and HMAC signature validation are enabled and configured as expected.
- **\[ \] Implement Logging and Monitoring:** Ensure you have robust logging in place for all interactions with the Datatrans API, including requests, responses, and errors. Set up monitoring and alerts for critical failures.
- **\[ \] Perform a Live Test Transaction:** Conduct at least one small-value end-to-end transaction in the live environment using a real credit card to confirm that the entire flow—from payment to settlement to webhook notification—is functioning correctly.
- **\[ \] Review Go-Live Plan:** Have a clear plan for deployment and a rollback strategy in case of unforeseen issues. Notify all relevant stakeholders before, during, and after the launch.

---

## **Appendix**

### **A. Supported Payment Methods**

Datatrans supports a wide array of payment methods through its single integration interface, catering to both international and local preferences. Key supported methods include:

- **Credit & Debit Cards:** All major international brands, including Visa, Mastercard, American Express, Diners Club, Discover, JCB, and China Union Pay.44
- **Digital Wallets:** Popular wallet solutions that offer a fast and secure checkout experience, such as Apple Pay and Google Pay.29
- **Local Swiss Methods:** Essential payment methods for the Swiss market, including TWINT and PostFinance Card.29
- **Other Methods:** Support for additional payment options like PayPal, Alipay+, and various loyalty and gift cards.44

### **B. Full List of API Response & Error Codes**

For a complete and exhaustive reference, developers should consult the official Datatrans documentation. The legacy API used a numerical code system, while the modern JSON API uses descriptive string-based error codes.

Modern API Error Codes (Partial List) 39:

- DECLINED
- SOFT_DECLINED
- UNKNOWN_ERROR
- UNAUTHORIZED
- INVALID_TRANSACTION_STATUS
- TRANSACTION_NOT_FOUND
- INVALID_JSON_PAYLOAD
- EXPIRED_CARD
- INVALID_CARD
- BLOCKED_CARD
- DUPLICATE_REFNO

Legacy API Response Codes (Partial List) 40:

- 1: transaction ready for settlement (authorized)
- 4: transaction declined or other error
- 9: canceled by user
- 1001: required parameter missing
- 1004: card number is not valid
- 1006: card expired
- 1007: access denied by sign control
- 3001: IP address declined by fraud management

### **C. Code Snippets and Examples**

**HMAC-SHA256 Signature Verification (PHP Example)**

This snippet demonstrates how to verify an incoming webhook signature in PHP.

PHP

\<?php  
// Your secret HMAC key from the Datatrans Webadmin Tool  
$hmacKey \= 'YOUR_SECRET_HEX_ENCODED_HMAC_KEY';

// Get the signature header from the incoming request  
$datatransSignatureHeader \= $\_SERVER;

// Parse the header to get the timestamp (t) and signature (s0)  
list($t, $s0) \= sscanf($datatransSignatureHeader, "t=%d,s0=%s");  
$timestamp \= $t;  
$expectedSignature \= $s0;

// Get the raw POST body  
$payload \= file_get_contents('php://input');

// Concatenate the timestamp and payload  
$dataToSign \= $timestamp. $payload;

// Calculate your own signature  
$calculatedSignature \= hash\_hmac('sha256', $dataToSign, hex2bin($hmacKey));

// Compare the signatures in a timing-attack-safe way  
if (hash_equals($expectedSignature, $calculatedSignature)) {  
 // Signature is valid. Process the webhook.  
 http_response_code(200);  
 echo "Webhook processed successfully.";  
} else {  
 // Signature is invalid. Discard the request.  
 http_response_code(401);  
 echo "Invalid signature.";  
}  
?\>

Based on logic from 34
