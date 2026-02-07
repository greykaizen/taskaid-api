# SMTP Configuration Options

To send emails from `tasks@taskaid.com.au`, you need valid SMTP credentials.

## Option 1: GoDaddy Professional Email (Recommended)

If you have email hosting with GoDaddy (Microsoft 365):

- **SMTP_HOST**: `smtp.office365.com`
- **SMTP_PORT**: `587`
- **SMTP_SECURE**: `false` (uses STARTTLS)
- **SMTP_USER**: `tasks@taskaid.com.au`
- **SMTP_PASS**: *(Your email password)*

## Option 2: cPanel Email

If you use cPanel's built-in email:

- **SMTP_HOST**: `mail.taskaid.com.au` (or check cPanel > Email Accounts > Connect Devices)
- **SMTP_PORT**: `465`
- **SMTP_SECURE**: `true`
- **SMTP_USER**: `tasks@taskaid.com.au`
- **SMTP_PASS**: *(Your email password)*

## Option 3: Brevo (Free Alternative)

If you don't have email hosting yet, sign up for [Brevo](https://www.brevo.com/) (free tier: 300 emails/day).

- **SMTP_HOST**: `smtp-relay.brevo.com`
- **SMTP_PORT**: `587`
- **SMTP_SECURE**: `false`
- **SMTP_USER**: *(Provided by Brevo)*
- **SMTP_PASS**: *(Provided by Brevo)*

## Option 4: Gmail (Development Only)

For testing purposes only (not recommended for production). You need an App Password.

- **SMTP_HOST**: `smtp.gmail.com`
- **SMTP_PORT**: `465`
- **SMTP_SECURE**: `true`
- **SMTP_USER**: `your-gmail@gmail.com`
- **SMTP_PASS**: *(Your App Password)*
