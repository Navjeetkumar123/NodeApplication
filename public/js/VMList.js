'use strict';

// By default, the client will authenticate using the service account file
// specified by the GOOGLE_APPLICATION_CREDENTIALS environment variable and use
// the project specified by the GCLOUD_PROJECT environment variable. See
// https://googlecloudplatform.github.io/gcloud-node/#/docs/google-cloud/latest/guides/authentication
/*var Compute = require('/home/block/node_modules/@google-cloud/compute');
*/

var http = require('http');
var request = require('request');
var net = require('net');

var gcloud = require('/home/block/node_modules/google-cloud');
var gce = gcloud.compute({
  projectId: 'blockchain-1384',
  keyFilename: 'keyFile.json'
});

function getVmsExample (callback) {
  // In this example we only want one VM per page
  var options = {
    maxResults: 10
  };
  gce.getVMs(options, function (err, vms) {
    if (err) {
      console.log(err);
    }

    console.log('VMs:', vms);
/*    callback(null, vms);
*/  });
}

getVmsExample();