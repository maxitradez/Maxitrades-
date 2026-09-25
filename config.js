/* Maxi Trades — config.js
   Get a free API key at https://twelvedata.com/register (no card required,
   800 requests/day on the free plan). The shared "demo" key below is only
   for a first look — it does not reliably support XAU/USD, so swap in your
   own key before you rely on this page.

   For Google Analytics: create a GA4 property at analytics.google.com,
   then Admin → Data Streams → your web stream → copy the "Measurement ID"
   (looks like "G-XXXXXXXXXX") and paste it below. Leave the placeholder as
   it is if you don't want analytics running yet — it stays off until you
   put in a real ID.
*/
window.MAXI_CONFIG = {
  TWELVE_DATA_API_KEY: "demo",
  SYMBOL: "XAU/USD",
  GA_MEASUREMENT_ID: "G-7LSECL5MWV"
};
