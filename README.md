# pihole-youtube-updater
Updates the custom list in pihole 5 to block ads on youtube

# Quick start
Copy the .js file to your pi and edit it. You will need to change the IP Address and path to your local custom.list.
Run it using `sudo node youtube-updater.js` or schedule a cron job. The file looks at all requests from up to eleven minutes ago. A cronjob running every ten minutes should be fine. 
