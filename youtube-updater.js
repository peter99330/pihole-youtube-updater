#!/usr/bin/env node

const http = require('http');
const fs = require('fs');

// Set the path to the pihole custom list file
const pathToCustomListFile = '/home/pi/pihole/etc-pihole/custom.list';

// Found by running nslookup on one of the xx.googlevideo.com domains
const youtubeIp = '216.58.213.206';
// Get current unix time in seconds
const currentTime = Date.now()/1000;
// Get unix time eleven minutes ago
const tenMinutesAgo = currentTime - 660;
// Create an url to query the pihole API on localhost
const url = `http://127.0.0.1/admin/api.php?getAllQueries&from=${tenMinutesAgo}&until=${currentTime}&auth=d593b727684a228b0e12b163d723196b524c28e7633b543773dfe3111d1b1555`;
// Create a regex pattern to match all ad googlevideo urls
const domainRegex = /.+---.+-.+\.googlevideo\.com/g;

// Query the API
http.get(url, (resp) => {
  let data = '';

  resp.on('data', (chunk) => {
    data += chunk;
  });

  // Continue once all data has beeen received from the API
  resp.on('end', () => {
    let parsedData = JSON.parse(data);
    // Remove all domains from the received domain list which do not match the
    // regex pattern
    let youtubeDomains = parsedData.data.filter(function(dnsRequest) {
      return dnsRequest[2].match(domainRegex);
    })

    // Get just the url from the pihole result array
    let youtubeDomainsStrings = [];
    for (i=0;i<youtubeDomains.length;i++) {
       youtubeDomainsStrings.push(youtubeDomains[i][2]);
    }

    // Create a line reader to read the current pihole custom list file
    const lineReader = require('readline').createInterface({
      input: require('fs').createReadStream(pathToCustomListFile)
    });

    let nonYouTubeDomains = [];
    // Read each line in the current pihole custom list file
    lineReader.on('line', function (line) {
      // Check whether the url from the list matches the url regex
      if (line.match(domainRegex)) {
        // Add the domain to the existing array from the API call
        youtubeDomainsStrings.push(line.substr(youtubeIp.length+1));
      } else {
        // Save all other domains with their respective IP adresses
        nonYouTubeDomains.push(line);
      }
    });

    // Continue once the last line has been processed
    lineReader.on('close', function() {
      // Remove duplicate urls from the array
      let youtubeDomainsStringsUnique = [...new Set(youtubeDomainsStrings)];
      // Create a string for the new custom list file
      let newDomainsString = '';
      for (i=0;i<youtubeDomainsStringsUnique.length;i++) {
        newDomainsString += youtubeIp + ' ' + youtubeDomainsStringsUnique[i] + '\n';
      }
      for (i=0;i<nonYouTubeDomains.length;i++) {
        newDomainsString += nonYouTubeDomains[i] + '\n';
      }

      // Write the new custom list to disk
      fs.writeFileSync(pathToCustomListFile, newDomainsString);
      console.debug('DONE');
    })
  });

}).on("error", (err) => {
  console.info("Error: " + err.message);
});
