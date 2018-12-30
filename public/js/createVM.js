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

var zone = gce.zone('asia-east1-c');
var name = 'test-ghjgh';

console.log("initiating");

var vm = zone.vm(name);

var request12 = { "name": name, "zone": zone, "machineType": "projects/blockchain-1384/zones/asia-east1-c/machineTypes/n1-standard-1", "metadata": { "items": [] }, "tags": { "items": [ "http-server", "https-server" ] }, "disks": [ { "type": "PERSISTENT", "boot": true, "mode": "READ_WRITE", "autoDelete": true, "deviceName": "instance-1", "initializeParams": { "sourceImage": "https://www.googleapis.com/compute/v1/projects/ubuntu-os-cloud/global/images/ubuntu-1604-xenial-v20160907a", "diskType": "projects/blockchain-1384/zones/asia-east1-c/diskTypes/pd-standard", "diskSizeGb": "10" } } ], "canIpForward": false, "networkInterfaces": [ { "network": "projects/blockchain-1384/global/networks/default", "subnetwork": "projects/blockchain-1384/regions/asia-east1/subnetworks/default", "accessConfigs": [ { "name": "External NAT", "type": "ONE_TO_ONE_NAT" } ] } ], "description": "", "scheduling": { "preemptible": false, "onHostMaintenance": "MIGRATE", "automaticRestart": true }, "serviceAccounts": [ { "email": "default", "scopes": [ "https://www.googleapis.com/auth/devstorage.read_only", "https://www.googleapis.com/auth/logging.write", "https://www.googleapis.com/auth/monitoring.write", "https://www.googleapis.com/auth/servicecontrol", "https://www.googleapis.com/auth/service.management.readonly" ] } ] }

  vm.create(request12, function(err, result, operation, apiResponse) {
    if (err) {
      console.log(err);
    } else {
      console.log(result);
    }


    
  operation
    .on('error', function(err) {
    	console.log(err);
    })
    .on('running', function(metadata) {
    	console.log(metadata);
    })
    .on('complete', function(metadata) {
      // Virtual machine created!
      console.log("done!");
      console.log(metadata);
  });
  });



/*zone.createVM(name, { os: 'ubuntu' }, function(err, vm, operation) {
  // `operation` lets you check the status of long-running tasks.
  console.log(err);
  operation
    .on('error', function(err) {
    	console.log(err);
    })
    .on('running', function(metadata) {
    	console.log(metadata);
    })
    .on('complete', function(metadata) {
      // Virtual machine created!
      console.log("done!");
      console.log(metadata);

    });
});*/

console.log("initiating done");