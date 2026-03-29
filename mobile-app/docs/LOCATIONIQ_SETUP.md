# LocationIQ API Key Setup

Address autocomplete uses LocationIQ by default (free tier: 5,000 requests/day).

## Steps to Create Your API Key

1. **Sign up**  
   Go to [https://my.locationiq.com/register](https://my.locationiq.com/register) and create an account.  
   Provide your email, name, and use case.

2. **Log in**  
   Use [https://my.locationiq.com/dashboard/login](https://my.locationiq.com/dashboard/login).  
   You can log in with:
   - Email (magic link)
   - Google account
   - Password (create one in the dashboard if needed)

3. **Get your API key**  
   In the dashboard, open the **API Access Tokens** tab.  
   Copy your access token (API key).

4. **Add to your app**  
   Add to `.env` or your environment config:
   ```
   LOCATIONIQ_API_KEY=your_token_here
   ```
   For React Native, use `react-native-config` and rebuild.

## Free Tier

- 5,000 requests per day
- No credit card required
- Geocoding, autocomplete, and related APIs included
