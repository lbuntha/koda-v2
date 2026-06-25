# Koda Email Verification Template

Firebase Auth controls the built-in verification email body. Update it in:

Firebase Console -> Authentication -> Templates -> Email address verification

## Subject

Verify your Koda email

## Message

Hi,

Welcome to Koda. Please verify your email address so you can finish setting up your parent account.

Verify your email:

%LINK%

If you did not create a Koda account, you can ignore this email.

Thanks,
The Koda Team

## Spam Reduction Checklist

- Use a clear sender name, such as `Koda`.
- Use a verified custom sending domain when available.
- Avoid promotional language, emojis, all-caps text, and too many links.
- Keep the subject short and direct.
- Make sure the app domain is added to Firebase Authentication authorized domains.
- Test with Gmail, iCloud Mail, Outlook, and Yahoo before launch.
