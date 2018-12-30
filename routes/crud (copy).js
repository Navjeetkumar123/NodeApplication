process.env['GOPATH'] = __dirname;
var hfc = require("hfc");
var util = require('util');
var variables = require("../variables.js");
var chain, poChaincodeID, dealChaincodeID, accountChaincodeID, shipmentChaincodeID;
chain = hfc.newChain(variables.chain);
var eh = chain.getEventHub();
chain.setMemberServicesUrl(variables.MEMBERSRVC_ADDRESS);
chain.addPeer(variables.PEER_ADDRESS);
chain.eventHubConnect(variables.EVENT_ADDRESS);
chain.setDevMode(variables.DEV_MODE);
//Deploy will take much longer in network mode
chain.setDeployWaitTime(variables.DeployWaitTime);
chain.setInvokeWaitTime(variables.InvokeWaitTime);
var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();
var session = require('express-session');
var cookieParser = require('cookie-parser');
var fs = require('fs');
var path = require('path');
var request = require('request');
//var requestOrg = require('request');
//var request = requestOrg.defaults({'proxy':'http://na326813:man@326813@proxy1.wipro.com:8080'});
var http = require('http');
var async = require('async');
var assert = require('assert');
var MongoClient = require('mongodb').MongoClient;
var ObjectIdVar = require('mongodb').ObjectID;
var SHA256 = require("crypto-js/sha256");
var chaincodeIDPath = __dirname + "/chaincodeID";
console.log("chaincodeIDPath: "+ chaincodeIDPath);
var KeyValStorePath = __dirname + "/"+ variables.KeyValStore;
console.log("KeyValStorePath: ")
console.log(KeyValStorePath);
chain.setKeyValStore(hfc.newFileKeyValStore(KeyValStorePath));
module.exports = function(app) {
var userObj, adminInfo;
//var variables = require('../variables')
//var url = 'mongodb://localhost:27017/tradeinfo';
var chainCodeURL = 'http://' + variables.chainCodeIPAddress + ':' + variables.chainCodePort + '/chaincode'
console.log(chainCodeURL)
var authenticate = function(req, res, next) {
    var isAuthenticated = true;
    //console.log(req.session);
    //console.log(req.session.username);
    if (typeof req.session.username == 'undefined') {
        isAuthenticated = false;
    }
    if (isAuthenticated) {
        //console.log("Authenticated " + req.session.username);
        next();
    } else {
        // redirect user to authentication page
        console.log("Authentication Failed, Sending to login");
        res.redirect('/login');
    }
};
app.get("/getUserName", function(req, res) {
    res.setHeader('Content-Type', 'application/json');
    res.json({
        username: req.session.username,
        name: req.session.name,
        type: req.session.type
        //name:req.session.name
    });
});
app.post("/BankDetailsBuyer", multipartMiddleware, function(req, res, next) {
    console.log("BankDetailsBuyer");
    MongoClient.connect(variables.url, function(err, db) {
        console.log("connected to DB")
        if (err) throw err;
        var collection = db.collection('myuser');
        collection.find({
            type: 'buyerBank'
        }).toArray(function(err, result) {
            if (err) {
                console.log(err)
            }
            console.log(result)
            res.setHeader('Content-Type', 'application/json');
            res.json(result);
        })
    });
})
app.post("/BankDetailsSeller", multipartMiddleware, function(req, res, next) {
    console.log("BankDetailsSeller");
    MongoClient.connect(variables.url, function(err, db) {
        console.log("connected to DB")
        if (err) throw err;
        var collection = db.collection('myuser');
        collection.find({
            "type": 'sellerBank'
        }).toArray(function(err, result) {
            if (err) {
                console.log(err)
            }
            console.log(result)
            res.setHeader('Content-Type', 'application/json');
            res.json(result);
        });
    });
})
function fileExists(filepath){
    try{
        return fs.statSync(filepath).isFile();
    } catch(err){
        return false;
    }
}
app.post("/userLogin", multipartMiddleware, function(req, res, next) {
    console.log("userLogin");
    MongoClient.connect(variables.url, function(err, db) {
        console.log("connected to DB")
        if (err) throw err;
        //console.log(req.body.username)
        var collection = db.collection('myuser');
        collection.findOne({
            username: req.body.username
        }, function(err, result) {
            if (result != null) {
                console.log('result');
                if (result.password == req.body.pass) {
                    console.log("userLogin " + result.type + "\n username: " + result.username);
                    console.log("password  matched");
                    req.session.username = result.username;
                    req.session.type = result.type;
                    req.session.user_id = result._id;
                    if (fileExists(chaincodeIDPath)) {
                        // Read chaincodeID and use this for sub sequent Invokes/Queries
                        chaincodeID = fs.readFileSync(chaincodeIDPath, 'utf8');
                        chain.getUser(req.session.username, function(err, user) {
                            if (err)
                                throw Error(" Failed to register and enroll " + req.session.username + ": " + err);
                            userObj = user;
                        });
                    } else {
                        if (result.type == "buyer") {
                            req.session.buyerName = result.username;
                            registerAndEnrollUsers(req.session.username);
                            res.redirect('/buyer');
                        } else if (result.type == "seller") {
                            req.session.sellerName = result.username;
                            registerAndEnrollUsers(req.session.username);
                            res.redirect('/seller');
                        } else if (result.type == "portAuthority") {
                            req.session.agreementPortAuth_name = result.username;
                            registerAndEnrollUsers(req.session.username);
                            res.redirect('/portAuthority');
                        } else if (result.type == "customAuthority") {
                            req.session.customAuthName = result.username;
                            registerAndEnrollUsers(req.session.username);
                            res.redirect('/customAuthority');
                        } else if (result.type == "shipper") {
                            req.session.shipperName = result.username;
                            registerAndEnrollUsers(req.session.username);
                            res.redirect('/shipper');
                        } else if (result.type == "buyerBank") {
                            req.session.buyerBank = result.username;
                            registerAndEnrollUsers(req.session.username);
                            res.redirect('/buyerBank');
                        } else if (result.type == "sellerBank") {
                            req.session.sellerBank = result.username;
                            registerAndEnrollUsers(req.session.username);
                            res.redirect('/sellerBank');
                        }
                    }
                } else {
                    console.log("password do not match");
                    res.redirect('/userLogin?valid=y');
                    //res.json('<script type="text/javascript">alert("I am an alert box!");</script>');
                }
            } else {
                console.log("username do not match");
                //console.log(result)
                res.redirect('/userLogin?valid=y');
                //res.json('<script type="text/javascript">alert("I am an alert box!");</script>');
                console.log(err);
            }
            db.close();
        });
    });
});
app.all("/buyer", function(req, res, next) {
    res.render('buyer');
})
// if user is not registered
function registerAndEnrollUsers(username) {
    // WebAppAdmin DJY27pEnl16d
    // admin Xurw3yU9zI0l
    chain.enroll("admin", "Xurw3yU9zI0l", function(err, admin) {
        if (err) {
            console.log("ERROR: failed to register admin: %s", err);
            process.exit(1);
        }
        // Set this user as the chain's registrar which is authorized to register other users.
        chain.setRegistrar(admin);
        console.log("\n Admin enrolled Successfully.\n")
        console.log(username);
        // registrationRequest
        var registrationRequest = {
            enrollmentID: username,
            affiliation: variables.AFFILIATION
        };
        console.log("registrationRequest: ")
        console.log(registrationRequest);
        // register a new user
        chain.registerAndEnroll(registrationRequest, function(error, user) {
            if (error) throw Error(" Failed to register and enroll " + username + ": " + error);
            console.log("Enrolled %s successfully\n", user);
            //req.session.user = user;
            //callback(user);
        });
    });
}
// create a new account
app.post("/createAccount", multipartMiddleware, function(req, res, next) {
    console.log('/createAccount: creating an account');
    var now = new Date();
    var timeStamp = Date.now();
    var accountId = timeStamp;
    //console.log(accountId)
    var args = [accountId, req.body.accountName, req.body.accountNumber, req.body.accountType, req.body.totalValue, req.body.currency, req.body.securities]
    console.log(arg);
    // Construct the Invoke request
    var invokeRequest = {
        // Name (hash) required for invoke
        chaincodeID: variables.accountChaincodeID,
        // Function to trigger
        fcn: "create_account",
        // Parameters for the invoke function
        args: args
    };
    console.log(invokeRequest);
    // Get user info from chain
    chain.getUser(req.session.username, function(err, user) {
        if (err) throw Error("/createAccount: Failed to register and enroll" + req.session.username + ": " + err);
        userObj = user;
    })
    //console.log("userObj: " + userObj);
    var transHash;
    // Invoke the request from the user object and wait for events to occur.
    var tx = userObj.invoke(invokeRequest);
    // Listen for the 'submitted' event
    tx.on('submitted', function(results) {
        console.log("/createAccount: submitted invoke: %j", results);
        //      callback(results);
    });
    // Listen for the 'complete' event.
    tx.on('complete', function(results) {
        console.log("/createAccount: completed invoke: %j", results);
        transHash = results.result;;
    });
    // Listen for the 'error' event.
    tx.on('error', function(err) {
        console.log("/createAccount: error on invoke: %j", err);
        res.json(err)
    });
    var regid = eh.registerChaincodeEvent(variables.accountChaincodeID, "evtsender", function(event) {
        console.log("/createAccount: Custom event received, payload: %j\n", event.payload.toString());
        eh.unregisterChaincodeEvent(regid);
        var x = JSON.parse(event.payload.toString());
        x.transHash = transHash;
        res.json(x);
    });
    var regid1 = eh.registerChaincodeEvent(variables.accountChaincodeID, "errEvent", function(event) {
        console.log("/createAccount: Custom Error event received, payload: %j\n", event.payload.toString());
        eh.unregisterChaincodeEvent(regid1);
        var x = JSON.parse(event.payload.toString());
        x.transHash = transHash;
        res.json(x);
    });
});
app.post("/createDeal", multipartMiddleware, function(req, res, next) {
    console.log('/createDeal: Creating a new Deal');
    var now = new Date();
    var timeStamp = Date.now();
    var dealId = timeStamp;
    var issueDate = timeStamp;
    //console.log(paymentId)
    var args = [dealId,req.body.pledger, req.body.pledgee, req.body.maxValue, req.body.totalValueLongBoxAccount, req.body.totalValueSegregatedAccount,issueDate.toString(), req.body.lastSuccessfulAllocationDate, req.body.transactions]
    // Construct the Invoke request
    console.log("args: " + args);

    var invokeRequest = {
        // Name (hash) required for invoke
        chaincodeID: variables.dealChaincodeID,
        // Function to trigger
        fcn: "create_deal",
        // Parameters for the invoke function
        args: args
    };
    console.log(invokeRequest);
    //
    chain.getUser(req.session.username, function(err, user) {
        if (err) throw Error("/createDeal: Failed to register and enroll" + req.session.username + ": " + err);
        userObj = user;
    })

    // Invoke the request from the user object and wait for events to occur.
    var tx = userObj.invoke(invokeRequest);
    var transHash;
    // Listen for the 'submitted' event
    tx.on('submitted', function(results) {
        console.log("/createDeal: submitted invoke: %j", results);
        //      callback(results);
    });
    // Listen for the 'complete' event.
    tx.on('complete', function(results) {
        console.log("/createDeal: completed invoke: %j", results);
        transHash = results.result;;
        // transHash = results.result;
        //res.json(results)
        //      callback(results);
    });
    // Listen for the 'error' event.
    tx.on('error', function(err) {
        console.log("/createDeal: error on invoke: %j", err);
        res.json(err)
        //callback(err);
    });
    var regid = eh.registerChaincodeEvent(variables.dealChaincodeID, "evtsender", function(event) {
        console.log("/createDeal: Custom event received, payload: %j\n", event.payload.toString());
        eh.unregisterChaincodeEvent(regid);
        var x = JSON.parse(event.payload.toString());
        x.transHash = transHash;
        x.paymentId = paymentId;
        //console.log(x.accountId);
        res.json(x);
        
        //callback(event.payload.toString());
    });
    var regid1 = eh.registerChaincodeEvent(variables.dealChaincodeID, "errEvent", function(event) {
        console.log("/createDeal: Custom Error event received, payload: %j\n", event.payload.toString());
        eh.unregisterChaincodeEvent(regid1);
        var x = JSON.parse(event.payload.toString());
        x.transHash = transHash;
        x.paymentId = paymentId;
        //console.log(x.accountId);
        res.json(x);
        //callback(event.payload.toString());
    });
    // });
});
app.post("/startAllocation", multipartMiddleware, function(req, res, next) {
    console.log('/createShipment: creating Shipment');
    var now = new Date();
    var timeStamp = Date.now();
    var shipmentId = 'Shipment' + timeStamp;
    //console.log(paymentId)
    var shipment_date = timeStamp;
    var shipment_status = "Shipment initiated";
    var source = "Bangalore";
    var destination = "New Delhi";
    var data=JSON.parse(req.body.shipment);
    console.log(data)
    var args = [shipmentId, data.accountId, data.agreementId, shipment_status, source, destination, data.delivery_date, shipment_date.toString(), data.shipper_name]
    console.log(args);
    // Construct the Invoke request
    var invokeRequest = {
        // Name (hash) required for invoke
        chaincodeID: variables.shipmentChaincodeID,
        // Function to trigger
        fcn: "create_shipment",
        // Parameters for the invoke function
        args: args
    };
    console.log(invokeRequest);
    // Invoke the request from the user object and wait for events to occur.
    chain.getUser(req.session.username, function(err, user) {
        if (err) throw Error("/createShipment: Failed to register and enroll" + req.session.username + ": " + err);
        userObj = user;
    })
    
    var tx = userObj.invoke(invokeRequest);
    var transHash;
    // Listen for the 'submitted' event
    tx.on('submitted', function(results) {
        console.log("/createShipment: submitted invoke: %j", results);
        //      callback(results);
    });
    // Listen for the 'complete' event.
    tx.on('complete', function(results) {
        console.log("/createShipment: completed invoke: %j", results);
        transHash = results.result;;
        //transHash = results.result;
        //res.json(results)
        //      callback(results);
    });
    // Listen for the 'error' event.
    tx.on('error', function(err) {
        console.log("/createShipment: error on invoke: %j", err);
        res.json(err)
        //callback(err);
    });
    var regid = eh.registerChaincodeEvent(variables.shipmentChaincodeID, "evtsender", function(event) {
        console.log("/createShipment: Custom event received, payload: %j\n", event.payload.toString());
        eh.unregisterChaincodeEvent(regid);
        var x = JSON.parse(event.payload.toString());
        x.transHash = transHash;
        x.shipmentId = shipmentId;
        res.json(x);
        //callback(event.payload.toString());
    });
    var regid1 = eh.registerChaincodeEvent(variables.shipmentChaincodeID, "errEvent", function(event) {
        console.log("/createShipment: Custom Error event received, payload: %j\n", event.payload.toString());
        eh.unregisterChaincodeEvent(regid1);
        var x = JSON.parse(event.payload.toString());
        x.transHash = transHash;
        x.shipmentId = shipmentId;
        //console.log(x.accountId);
        res.json(x);
        //callback(event.payload.toString());
    });
    // });
});

app.post("/updateAccount", multipartMiddleware, function(req, res, next) {
    console.log('/updateAccount: Updating Account ');
    var args = [req.body.accountId, req.body.accountName, req.body.accountNumber, req.body.accountType, req.body.totalValue, req.body.currency, req.body.securities]
    console.log("args: "+ args);
    // Construct the Invoke request
    var invokeRequest = {
        // Name (hash) required for invoke
        chaincodeID: variables.accountChaincodeID,
        // Function to trigger
        fcn: "update_account",
        // Parameters for the invoke function
        args: args
    };
    console.log(invokeRequest);
    //
    // Invoke the request from the user object and wait for events to occur.
    chain.getUser(req.session.username, function(err, user) {
        if (err) throw Error("/updateAccount: Failed to register and enroll" + req.session.username + ": " + err);
        userObj = user;
    })

    var tx = userObj.invoke(invokeRequest);
    var transHash;
    // Listen for the 'submitted' event
    tx.on('submitted', function(results) {
        console.log("/updateAccount: submitted invoke: %j", results);
        //      callback(results);
    });
    // Listen for the 'complete' event.
    tx.on('complete', function(results) {
        console.log("/updateAccount: completed invoke: %j", results);
        transHash = results.result;;
        //transHash = results.result;
        //res.json(results)
        //      callback(results);
    });
    // Listen for the 'error' event.
    tx.on('error', function(err) {
        console.log("/updateAccount: error on invoke: %j", err);
        res.json(err)
        //callback(err);
    });
    var regid = eh.registerChaincodeEvent(variables.accountChaincodeID, "evtsender", function(event) {
        console.log("/updateAccount: Custom event received, payload: %j\n", event.payload.toString());
        eh.unregisterChaincodeEvent(regid);
        var x = JSON.parse(event.payload.toString());
        x.transHash = transHash;
        res.json(x);
        //callback(event.payload.toString());
    });
    var regid1 = eh.registerChaincodeEvent(variables.accountChaincodeID, "errEvent", function(event) {
        console.log("/updateAccount: Custom Error event received, payload: %j\n", event.payload.toString());
        eh.unregisterChaincodeEvent(regid1);
        var x = JSON.parse(event.payload.toString());
        x.transHash = transHash;
        //console.log(x.accountId);
        res.json(x);
        //callback(event.payload.toString());
    });
    // });
});
app.post("/updateDeal", multipartMiddleware, function(req, res, next) {
    console.log("/createAgreement: file management");
    console.log('files::::' + req.files.file);
    var fileName = req.files.file.name;
    var now = new Date();
    var timeStamp = Date.now();
    fileName = timeStamp + '_' + fileName;

    var tempPath = req.files.file.path;
    var relative_target_path = './public/Documents/';
    var target_path_wo_fileName = path.resolve(relative_target_path).replace(/\\/g, '/') + '/';
    var target_path = target_path_wo_fileName + fileName;
    fs.readFile(tempPath, function(err, data) {
        if (err) {
            console.log("Error in readFile" + err);
            res.sendStatus(500);
        } else {
            fs.writeFile(target_path, data, function(err) {
                //console.log('data::'+data);
                if (err) {
                    console.log("File not uploaded");
                    console.log("Error in writeFile " + err);
                    console.log("Document upload: Error while writing Document: " + target_path);
                    res.sendStatus(500);
                } else {
                    console.log("FileSystem document upload successful at " + timeStamp);
                }
            });
        }
    });
    // deployAgreement(function(data){
    console.log('/createAgreement: creating Agreement');
    //console.log(variables.agreementRegisterAddress)
    var now = new Date();
    var timeStamp = Date.now();
    var agreementId = 'Agreement' + timeStamp;
    //console.log(agreementId)
    var agreementCU_date = timeStamp;
    //console.log(agreementCU_date)
    //var args =  agreementId,req.body.accountId, req.body.agreement_status,req.session.buyerName,req.body.sellerName,req.body.shipper_name,req.body.bb_name,req.body.sb_name,req.body.agreementPortAuth_name,agreementCU_date.toString(),req.body.items_id,req.body.items_name,req.body.items_quantity,req.body.total_value,req.body.document_name,req.body.document_url,req.body.tc_text,"true","false", "false","false";              
    var args = [agreementId, req.body.accountId, req.body.agreement_status, req.session.username, req.body.seller_name, req.body.shipper_name, req.body.bb_name, req.body.sb_name, req.body.agreementPortAuth_name, agreementCU_date.toString(), req.body.items_id, req.body.items_name, req.body.items_quantity, req.body.totalPrice, req.body.delivery_date, req.body.extraCharges, req.body.shipperFees, fileName, target_path_wo_fileName, req.body.tc_text, "true", "false", "false", "false", req.body.industry, req.body.goodsPrice]
    // Construct the Invoke request
    var invokeRequest = {
        // Name (hash) required for invoke
        chaincodeID: variables.accountChaincodeID,
        // Function to trigger
        fcn: "create_agreement",
        // Parameters for the invoke function
        args: args
    };
    console.log(invokeRequest);
    //
    chain.getUser(req.session.username, function(err, user) {
        if (err) throw Error("Failed to register and enroll" + req.session.username + ": " + err);
        userObj = user;
    })

    // Invoke the request from the user object and wait for events to occur.
    var tx = userObj.invoke(invokeRequest);
    var transHash;
    // Listen for the 'submitted' event
    tx.on('submitted', function(results) {
        console.log("submitted invoke: %j", results);
        //      callback(results);
    });
    // Listen for the 'complete' event.
    tx.on('complete', function(results) {
        console.log("completed invoke: %j", results);
        transHash = results.result;
        //res.json(results)
        //      callback(results);
    });
    // Listen for the 'error' event.
    tx.on('error', function(err) {
        console.log("error on invoke: %j", err);
        res.json(err)
        //callback(err);
    });
    var regid = eh.registerChaincodeEvent(variables.accountChaincodeID, "evtsender", function(event) {
        console.log("Custom event received, payload: %j\n", event.payload.toString());
        eh.unregisterChaincodeEvent(regid);
        var x = JSON.parse(event.payload.toString());
        x.transHash = transHash;
        x.agreementId = agreementId;
        //console.log(x.accountId);
        res.json(x);
    });
    var regid1 = eh.registerChaincodeEvent(variables.accountChaincodeID, "errEvent", function(event) {
        console.log("Custom Error event received, payload: %j\n", event.payload.toString());
        eh.unregisterChaincodeEvent(regid1);
        var x = JSON.parse(event.payload.toString());
        x.transHash = transHash;
        x.agreementId = agreementId;
        //console.log(x.accountId);
        res.json(x);
        
    });
    //});
});
app.post("/resumeAllocation", multipartMiddleware, function(req, res, next) {
    console.log('/resumeAllocation: Resuming Allocation');
    var args = [req.body.allocationId];
    console.log("args: "+ args);
    // Construct the Invoke request
    var invokeRequest = {
        // Name (hash) required for invoke
        chaincodeID: variables.allocationChaincodeID,
        // Function to trigger
        fcn: "resumeAllocation",
        // Parameters for the invoke function
        args: args
    };
    console.log(invokeRequest);
    //
    chain.getUser(req.session.username, function(err, user) {
        if (err) throw Error("/resumeAllocation: Failed to register and enroll" + req.session.username + ": " + err);
        userObj = user;
    })

    // Invoke the request from the user object and wait for events to occur.
    var tx = userObj.invoke(invokeRequest);
    var transHash;
    // Listen for the 'submitted' event
    tx.on('submitted', function(results) {
        console.log("/resumeAllocation: submitted invoke: %j", results);
        //      callback(results);
    });
    // Listen for the 'complete' event.
    tx.on('complete', function(results) {
        console.log("/resumeAllocation: completed invoke: %j", results);
        transHash = results.result;;
        transHash = results.result;
        //res.json(results)
        //      callback(results);
    });
    // Listen for the 'error' event.
    tx.on('error', function(err) {
        console.log("/resumeAllocation: error on invoke: %j", err);
        res.json(err)
        //callback(err);
    });
    var regid = eh.registerChaincodeEvent(variables.allocationChaincodeID, "evtsender", function(event) {
        console.log("/resumeAllocation: Custom event received, payload: %j\n", event.payload.toString());
        eh.unregisterChaincodeEvent(regid);
        var x = JSON.parse(event.payload.toString());
        x.transHash = transHash;
        x.accountId = args;
        //console.log(x.accountId);
        res.json(x);
        
    });
    var regid1 = eh.registerChaincodeEvent(variables.allocationChaincodeID, "errEvent", function(event) {
        console.log("/resumeAllocation: Custom Error event received, payload: %j\n", event.payload.toString());
        eh.unregisterChaincodeEvent(regid1);
        var x = JSON.parse(event.payload.toString());
        x.transHash = transHash;
        x.accountId = args;
        //console.log(x.accountId);
        res.json(x);
        
    });
});
app.post("/addSecurity", multipartMiddleware, function(req, res, next) {
    console.log('/addSecurity: Adding security');
    var now = new Date();
    var timeStamp = Date.now();
    var securityId = timeStamp;
    var args = [securityId, req.body.accountNumber, req.body.securityName, req.body.securityQuantity, req.body.securityType, req.body.category, req.body.totalvalue, req.body.valuePercentage, req.body.mtm, req.body.effectivePercentage]
    console.log("args: "+args)
    // Construct the Invoke request
    var invokeRequest = {
        // Name (hash) required for invoke
        chaincodeID: variables.accountChaincodeID,
        // Function to trigger
        fcn: "add_security",
        // Parameters for the invoke function
        args: args
    };
    console.log(invokeRequest);
    // getting user info from chain
    chain.getUser(req.session.username, function(err, user) {
        if (err) throw Error("/addSecurity: Failed to register and enroll" + req.session.username + ": " + err);
        userObj = user;
    })

    // Invoke the request from the user object and wait for events to occur.
    var tx = userObj.invoke(invokeRequest);
    var transHash;
    // Listen for the 'submitted' event
    tx.on('submitted', function(results) {
        console.log("/addSecurity: submitted invoke: %j", results);
        //      callback(results);
    });
    // Listen for the 'complete' event.
    tx.on('complete', function(results) {
        console.log("/addSecurity: completed invoke: %j", results);
        transHash = results.result;;
        //res.json(results)
        //      callback(results);
    });
    // Listen for the 'error' event.
    tx.on('error', function(err) {
        console.log("/addSecurity: error on invoke: %j", err);
        res.json(err)
        //callback(err);
    });
    var regid = eh.registerChaincodeEvent(variables.accountChaincodeID, "evtsender", function(event) {
        console.log("/addSecurity: Custom event received, payload: %j\n", event.payload.toString());
        eh.unregisterChaincodeEvent(regid);
        var x = JSON.parse(event.payload.toString());
        x.transHash = transHash;
        res.json(x);
        
    });
    var regid1 = eh.registerChaincodeEvent(variables.accountChaincodeID, "errEvent", function(event) {
        console.log("/addSecurity: Custom Error event received, payload: %j\n", event.payload.toString());
        eh.unregisterChaincodeEvent(regid1);
        var x = JSON.parse(event.payload.toString());
        x.transHash = transHash;
        res.json(x);
        
    });
});
app.post("/removeSecuritiesFromAccount", multipartMiddleware, function(req, res, next) {
    console.log('/removeSecuritiesFromAccount: Removing Securities from Account');
    var args = [req.body.accountNumber];
    console.log("args: "+args);
    // Construct the Invoke request
    var invokeRequest = {
        // Name (hash) required for invoke
        chaincodeID: variables.accountChaincodeID,
        // Function to trigger
        fcn: "remove_securitiesFromAccount",
        // Parameters for the invoke function
        args: args
    };
    console.log(invokeRequest);
    //
    // Invoke the request from the user object and wait for events to occur.
    chain.getUser(req.session.username, function(err, user) {
        if (err) throw Error("/removeSecuritiesFromAccount: Failed to register and enroll" + req.session.username + ": " + err);
        userObj = user;
    })

    var tx = userObj.invoke(invokeRequest);
    var transHash;
    // Listen for the 'submitted' event
    tx.on('submitted', function(results) {
        console.log("/removeSecuritiesFromAccount: submitted invoke: %j", results);
        //      callback(results);
    });
    // Listen for the 'complete' event.
    tx.on('complete', function(results) {
        console.log("/removeSecuritiesFromAccount: completed invoke: %j", results);
        transHash = results.result;
        //res.json(results)
        //      callback(results);
    });
    // Listen for the 'error' event.
    tx.on('error', function(err) {
        console.log("/removeSecuritiesFromAccount: error on invoke: %j", err);
        res.json(err)
        //callback(err);
    });
    var regid = eh.registerChaincodeEvent(variables.accountChaincodeID, "evtsender", function(event) {
        console.log("/removeSecuritiesFromAccount: Custom event received, payload: %j\n", event.payload.toString());
        eh.unregisterChaincodeEvent(regid);
        var x = JSON.parse(event.payload.toString());
        x.transHash = transHash;
        //console.log(x.accountId);
        res.json(x);
        
    });
    var regid1 = eh.registerChaincodeEvent(variables.accountChaincodeID, "errEvent", function(event) {
        console.log("/removeSecuritiesFromAccount: Custom Error event received, payload: %j\n", event.payload.toStrifng());
        eh.unregisterChaincodeEvent(regid1);
        var x = JSON.parse(event.payload.toString());
        x.transHash = transHash;
        //console.log(x.accountId);
        res.json(x);
        
    });
});
app.post("/getSecurities_byAccount", multipartMiddleware, function(req, res, next) {
    console.log('/getSecurities_byAccount: getting Securities by Account');
    var args = [req.body.accountNumber];
    console.log("args: "+args);
    // Construct the Invoke request
    var invokeRequest = {
        // Name (hash) required for invoke
        chaincodeID: variables.accountChaincodeID,
        // Function to trigger
        fcn: "getSecurities_byAccount",
        // Parameters for the invoke function
        args: args
    };
    console.log(invokeRequest);
    //
    // Invoke the request from the user object and wait for events to occur.
    chain.getUser(req.session.username, function(err, user) {
        if (err) throw Error("/getSecurities_byAccount: Failed to register and enroll" + req.session.username + ": " + err);
        userObj = user;
    })

    var tx = userObj.invoke(invokeRequest);
    var transHash;
    // Listen for the 'submitted' event
    tx.on('submitted', function(results) {
        console.log("/getSecurities_byAccount: submitted invoke: %j", results);
        //      callback(results);
    });
    // Listen for the 'complete' event.
    tx.on('complete', function(results) {
        console.log("/getSecurities_byAccount: completed invoke: %j", results);
        transHash = results.result;
        //res.json(results)
        //      callback(results);
    });
    // Listen for the 'error' event.
    tx.on('error', function(err) {
        console.log("/getSecurities_byAccount: error on invoke: %j", err);
        res.json(err)
        //callback(err);
    });
    var regid = eh.registerChaincodeEvent(variables.accountChaincodeID, "evtsender", function(event) {
        console.log("/getSecurities_byAccount: Custom event received, payload: %j\n", event.payload.toString());
        eh.unregisterChaincodeEvent(regid);
        var x = JSON.parse(event.payload.toString());
        x.transHash = transHash;
        //console.log(x.accountId);
        res.json(x);
        
    });
    var regid1 = eh.registerChaincodeEvent(variables.accountChaincodeID, "errEvent", function(event) {
        console.log("/getSecurities_byAccount: Custom Error event received, payload: %j\n", event.payload.toStrifng());
        eh.unregisterChaincodeEvent(regid1);
        var x = JSON.parse(event.payload.toString());
        x.transHash = transHash;
        //console.log(x.accountId);
        res.json(x);
        
    });
});
app.post("/getAccountByName", multipartMiddleware, function(req, res, next) {
    console.log('/getAccountByName: Getting Account by Account Name');
    var args = [req.body.accountName];
    console.log("args: "+args);
    var queryRequest = {
        // Name (hash) required for query
        chaincodeID: variables.accountChaincodeID,
        // Function to trigger
        fcn: "getAccount_byName",
        // Existing state variable to retrieve
        args: args
    };
    chain.getUser(req.session.username, function(err, user) {
        if (err) throw Error("/getAccountByName: Failed to register and enroll" + req.session.username + ": " + err);
        userObj = user;
    })

    // Trigger the query transaction
    var queryTx = userObj.query(queryRequest);
    queryTx.on('complete', function(results) {
        // Query completed successfully
        console.log("/getAccountByName: Successfully queried  chaincode function: request=%j, value=%s \n", queryRequest, results.result.toString());
        //               callback(results);
        //////res.json(results);
        //process.exit(0);
        var x = JSON.parse(results.result.toString());
        console.log(x)
        res.json(x);
    });
    queryTx.on('error', function(err) {
        // Query failed
        console.log("/getAccountByName: Failed to query chaincode, function: request=%j, error=%j \n", queryRequest, err);
        //               callback(err);
        //var x= JSON.parse(err.msg.toString());
        //console.log(x)
        res.json(err);
        //process.exit(0);
    });
});
app.get("/getAccountByType", multipartMiddleware, function(req, res, next) {
    console.log('/getAccountByType: Getting account by Account Type');
    var args = [req.session.accountType];
    console.log("args: "+args);
    var queryRequest = {
        // Name (hash) required for query
        chaincodeID: variables.accountChaincodeID,
        // Function to trigger
        fcn: "getAccount_byType",
        // Existing state variable to retrieve
        args: args
    };
    chain.getUser(req.session.username, function(err, user) {
        if (err) throw Error("/getAccountByType: Failed to register and enroll" + req.session.username + ": " + err);
        userObj = user;
    })

    // Trigger the query transaction
    var queryTx = userObj.query(queryRequest);
    queryTx.on('complete', function(results) {
        // Query completed successfully
        console.log("/getAccountByType: Successfully queried  chaincode function: request=%j, value=%s \n", queryRequest, results.result.toString());
        var x = JSON.parse(results.result.toString());
        console.log(x)
        res.json(x);
    });
    queryTx.on('error', function(err) {
        // Query failed
        console.log("/getAccountByType: Failed to query chaincode, function: request=%j, error=%j \n", queryRequest, err);
        res.json(err);
    });
});

app.get("/getAccountByNumber", multipartMiddleware, function(req, res, next) {
    console.log('/getAccountByNumber: getting Account by Account Number');
    var args  = [req.body.accountNumber];
    console.log("args: "+ args);
    var queryRequest = {
        // Name (hash) required for query
        chaincodeID: variables.accountChaincodeID,
        // Function to trigger
        fcn: "getAccount_byNumber",
        // Existing state variable to retrieve
        args: args
    };
    chain.getUser(req.session.username, function(err, user) {
        if (err) throw Error("/getAccountByNumber: Failed to register and enroll" + req.session.username + ": " + err);
        userObj = user;
    })

    // Trigger the query transaction
    var queryTx = userObj.query(queryRequest);
    queryTx.on('complete', function(results) {
        // Query completed successfully
        console.log("/getAccountByNumber: Successfully queried  chaincode function: request=%j, value=%s \n", queryRequest, results.result.toString());
        //               callback(results);
        //////res.json(results);
        //process.exit(0);
        var x = JSON.parse(results.result.toString());
        console.log(x)
        res.json(x);
    });
    queryTx.on('error', function(err) {
        // Query failed
        console.log("/getAccountByNumber: Failed to query chaincode, function: request=%j, error=%j \n", queryRequest, err);
        //               callback(err);
        //var x= JSON.parse(err.msg.toString());
        //console.log(x)
        res.json(err);
        //process.exit(0);
    });
});
// get Account by Account Holder Name
app.get("/getAccount_byAccountHolderName", multipartMiddleware, function(req, res, next) {
    console.log('/getAccount_byAccountHolderName: getting Agreement by sellerName');
    var args  = [ req.session.username];
    var queryRequest = {
        // Name (hash) required for query
        chaincodeID: variables.accountChaincodeID,
        // Function to trigger
        fcn: "getAgreement_bySeller",
        // Existing state variable to retrieve
        args: args
    };
    chain.getUser(req.session.username, function(err, user) {
        if (err) throw Error("/getAccount_byAccountHolderName: Failed to register and enroll" + req.session.username + ": " + err);
        userObj = user;
    })
    // Trigger the query transaction
    var queryTx = userObj.query(queryRequest);
    queryTx.on('complete', function(results) {
        // Query completed successfully
        console.log("/getAccount_byAccountHolderName: Successfully queried  chaincode function: request=%j, value=%s \n", queryRequest, results.result.toString());
        //               callback(results);
        var x = JSON.parse(results.result.toString());
        console.log(x)
        res.json(x);

        //process.exit(0);
    });
    queryTx.on('error', function(err) {
        // Query failed
        console.log("/getAccount_byAccountHolderName: Failed to query chaincode, function: request=%j, error=%j \n", queryRequest, err);
        //               callback(err);
        //var x= JSON.parse(err.msg.toString());
        //console.log(x)
        res.json(err);
        //process.exit(0);
    });
});
app.get("/get_AllAccount", multipartMiddleware, function(req, res, next) {
    console.log('/get_AllAccount: Getting all Account');
    var args=[" "]
    var queryRequest = {
        // Name (hash) required for query
        chaincodeID: variables.accountChaincodeID,
        // Function to trigger
        fcn: "get_AllAccount",
        // Existing state variable to retrieve
        args: args
    };
    chain.getUser(req.session.username, function(err, user) {
        if (err) throw Error("/get_AllAccount: Failed to register and enroll" + req.session.username + ": " + err);
        userObj = user;
    })
    // Trigger the query transaction
    var queryTx = userObj.query(queryRequest);
    queryTx.on('complete', function(results) {
        // Query completed successfully
        console.log("/get_AllAccount: Successfully queried  chaincode function: request=%j, value=%s \n", queryRequest, results.result.toString());
        //               callback(results);
        //////res.json(results);
        //process.exit(0);
        var x = JSON.parse(results.result.toString());
        console.log(x)
        res.json(x);

    });
    queryTx.on('error', function(err) {
        // Query failed
        console.log("/get_AllAccount: Failed to query chaincode, function: request=%j, error=%j \n", queryRequest, err);
        //callback(err);
        //var x= JSON.parse(err.msg.toString());
        console.log(err)
        res.json(err);
        //process.exit(0);
    });
});
// according to controller
app.get("/get_dashboard_tableData", multipartMiddleware, function(req, res, next) {
    console.log('/getAccountByNumber: getting Account by Account Number');
    var args  = [req.body.accountNumber];
    console.log("args: "+ args);
    var queryRequest = {
        // Name (hash) required for query
        chaincodeID: variables.accountChaincodeID,
        // Function to trigger
        fcn: "getAccount_byNumber",
        // Existing state variable to retrieve
        args: args
    };
    chain.getUser(req.session.username, function(err, user) {
        if (err) throw Error("/getAccountByNumber: Failed to register and enroll" + req.session.username + ": " + err);
        userObj = user;
    })

    // Trigger the query transaction
    var queryTx = userObj.query(queryRequest);
    queryTx.on('complete', function(results) {
        // Query completed successfully
        console.log("/getAccountByNumber: Successfully queried  chaincode function: request=%j, value=%s \n", queryRequest, results.result.toString());
        //               callback(results);
        //////res.json(results);
        //process.exit(0);
        var x = JSON.parse(results.result.toString());
        console.log(x)
        res.json(x);
    });
    queryTx.on('error', function(err) {
        // Query failed
        console.log("/getAccountByNumber: Failed to query chaincode, function: request=%j, error=%j \n", queryRequest, err);
        //               callback(err);
        //var x= JSON.parse(err.msg.toString());
        //console.log(x)
        res.json(err);
        //process.exit(0);
    });
});
app.get("/get_transaction_hist2_dealData", multipartMiddleware, function(req, res, next) {
    console.log('/getAccountByNumber: getting Account by Account Number');
    var args  = [req.body.accountNumber];
    console.log("args: "+ args);
    var queryRequest = {
        // Name (hash) required for query
        chaincodeID: variables.accountChaincodeID,
        // Function to trigger
        fcn: "getAccount_byNumber",
        // Existing state variable to retrieve
        args: args
    };
    chain.getUser(req.session.username, function(err, user) {
        if (err) throw Error("/getAccountByNumber: Failed to register and enroll" + req.session.username + ": " + err);
        userObj = user;
    })

    // Trigger the query transaction
    var queryTx = userObj.query(queryRequest);
    queryTx.on('complete', function(results) {
        // Query completed successfully
        console.log("/getAccountByNumber: Successfully queried  chaincode function: request=%j, value=%s \n", queryRequest, results.result.toString());
        //               callback(results);
        //////res.json(results);
        //process.exit(0);
        var x = JSON.parse(results.result.toString());
        console.log(x)
        res.json(x);
    });
    queryTx.on('error', function(err) {
        // Query failed
        console.log("/getAccountByNumber: Failed to query chaincode, function: request=%j, error=%j \n", queryRequest, err);
        //               callback(err);
        //var x= JSON.parse(err.msg.toString());
        //console.log(x)
        res.json(err);
        //process.exit(0);
    });
});
app.get("/Get_transaction_hist3_dealData", multipartMiddleware, function(req, res, next) {
    console.log('/getAccountByNumber: getting Account by Account Number');
    var args  = [req.body.accountNumber];
    console.log("args: "+ args);
    var queryRequest = {
        // Name (hash) required for query
        chaincodeID: variables.accountChaincodeID,
        // Function to trigger
        fcn: "getAccount_byNumber",
        // Existing state variable to retrieve
        args: args
    };
    chain.getUser(req.session.username, function(err, user) {
        if (err) throw Error("/getAccountByNumber: Failed to register and enroll" + req.session.username + ": " + err);
        userObj = user;
    })

    // Trigger the query transaction
    var queryTx = userObj.query(queryRequest);
    queryTx.on('complete', function(results) {
        // Query completed successfully
        console.log("/getAccountByNumber: Successfully queried  chaincode function: request=%j, value=%s \n", queryRequest, results.result.toString());
        //               callback(results);
        //////res.json(results);
        //process.exit(0);
        var x = JSON.parse(results.result.toString());
        console.log(x)
        res.json(x);
    });
    queryTx.on('error', function(err) {
        // Query failed
        console.log("/getAccountByNumber: Failed to query chaincode, function: request=%j, error=%j \n", queryRequest, err);
        //               callback(err);
        //var x= JSON.parse(err.msg.toString());
        //console.log(x)
        res.json(err);
        //process.exit(0);
    });
});
app.get("/Get_transaction_hist3_security_data", multipartMiddleware, function(req, res, next) {
    console.log('/getAccountByNumber: getting Account by Account Number');
    var args  = [req.body.accountNumber];
    console.log("args: "+ args);
    var queryRequest = {
        // Name (hash) required for query
        chaincodeID: variables.accountChaincodeID,
        // Function to trigger
        fcn: "getAccount_byNumber",
        // Existing state variable to retrieve
        args: args
    };
    chain.getUser(req.session.username, function(err, user) {
        if (err) throw Error("/getAccountByNumber: Failed to register and enroll" + req.session.username + ": " + err);
        userObj = user;
    })

    // Trigger the query transaction
    var queryTx = userObj.query(queryRequest);
    queryTx.on('complete', function(results) {
        // Query completed successfully
        console.log("/getAccountByNumber: Successfully queried  chaincode function: request=%j, value=%s \n", queryRequest, results.result.toString());
        //               callback(results);
        //////res.json(results);
        //process.exit(0);
        var x = JSON.parse(results.result.toString());
        console.log(x)
        res.json(x);
    });
    queryTx.on('error', function(err) {
        // Query failed
        console.log("/getAccountByNumber: Failed to query chaincode, function: request=%j, error=%j \n", queryRequest, err);
        //               callback(err);
        //var x= JSON.parse(err.msg.toString());
        //console.log(x)
        res.json(err);
        //process.exit(0);
    });
});
app.get("/get_Acc_holder_details", multipartMiddleware, function(req, res, next) {
    console.log('/getAccountByNumber: getting Account by Account Number');
    var args  = [req.body.accountNumber];
    console.log("args: "+ args);
    var queryRequest = {
        // Name (hash) required for query
        chaincodeID: variables.accountChaincodeID,
        // Function to trigger
        fcn: "getAccount_byNumber",
        // Existing state variable to retrieve
        args: args
    };
    chain.getUser(req.session.username, function(err, user) {
        if (err) throw Error("/getAccountByNumber: Failed to register and enroll" + req.session.username + ": " + err);
        userObj = user;
    })

    // Trigger the query transaction
    var queryTx = userObj.query(queryRequest);
    queryTx.on('complete', function(results) {
        // Query completed successfully
        console.log("/getAccountByNumber: Successfully queried  chaincode function: request=%j, value=%s \n", queryRequest, results.result.toString());
        //               callback(results);
        //////res.json(results);
        //process.exit(0);
        var x = JSON.parse(results.result.toString());
        console.log(x)
        res.json(x);
    });
    queryTx.on('error', function(err) {
        // Query failed
        console.log("/getAccountByNumber: Failed to query chaincode, function: request=%j, error=%j \n", queryRequest, err);
        //               callback(err);
        //var x= JSON.parse(err.msg.toString());
        //console.log(x)
        res.json(err);
        //process.exit(0);
    });
});
app.get("/get_Acc_security_data", multipartMiddleware, function(req, res, next) {
    console.log('/getAccountByNumber: getting Account by Account Number');
    var args  = [req.body.accountNumber];
    console.log("args: "+ args);
    var queryRequest = {
        // Name (hash) required for query
        chaincodeID: variables.accountChaincodeID,
        // Function to trigger
        fcn: "getAccount_byNumber",
        // Existing state variable to retrieve
        args: args
    };
    chain.getUser(req.session.username, function(err, user) {
        if (err) throw Error("/getAccountByNumber: Failed to register and enroll" + req.session.username + ": " + err);
        userObj = user;
    })

    // Trigger the query transaction
    var queryTx = userObj.query(queryRequest);
    queryTx.on('complete', function(results) {
        // Query completed successfully
        console.log("/getAccountByNumber: Successfully queried  chaincode function: request=%j, value=%s \n", queryRequest, results.result.toString());
        //               callback(results);
        //////res.json(results);
        //process.exit(0);
        var x = JSON.parse(results.result.toString());
        console.log(x)
        res.json(x);
    });
    queryTx.on('error', function(err) {
        // Query failed
        console.log("/getAccountByNumber: Failed to query chaincode, function: request=%j, error=%j \n", queryRequest, err);
        //               callback(err);
        //var x= JSON.parse(err.msg.toString());
        //console.log(x)
        res.json(err);
        //process.exit(0);
    });
});
app.get("/get_longbox_accountDetails", multipartMiddleware, function(req, res, next) {
    console.log('/getAccountByNumber: getting Account by Account Number');
    var args  = [req.body.accountNumber];
    console.log("args: "+ args);
    var queryRequest = {
        // Name (hash) required for query
        chaincodeID: variables.accountChaincodeID,
        // Function to trigger
        fcn: "getAccount_byNumber",
        // Existing state variable to retrieve
        args: args
    };
    chain.getUser(req.session.username, function(err, user) {
        if (err) throw Error("/getAccountByNumber: Failed to register and enroll" + req.session.username + ": " + err);
        userObj = user;
    })

    // Trigger the query transaction
    var queryTx = userObj.query(queryRequest);
    queryTx.on('complete', function(results) {
        // Query completed successfully
        console.log("/getAccountByNumber: Successfully queried  chaincode function: request=%j, value=%s \n", queryRequest, results.result.toString());
        //               callback(results);
        //////res.json(results);
        //process.exit(0);
        var x = JSON.parse(results.result.toString());
        console.log(x)
        res.json(x);
    });
    queryTx.on('error', function(err) {
        // Query failed
        console.log("/getAccountByNumber: Failed to query chaincode, function: request=%j, error=%j \n", queryRequest, err);
        //               callback(err);
        //var x= JSON.parse(err.msg.toString());
        //console.log(x)
        res.json(err);
        //process.exit(0);
    });
});
app.get("/Get_transaction_hist3_security_data", multipartMiddleware, function(req, res, next) {
    console.log('/getAccountByNumber: getting Account by Account Number');
    var args  = [req.body.accountNumber];
    console.log("args: "+ args);
    var queryRequest = {
        // Name (hash) required for query
        chaincodeID: variables.accountChaincodeID,
        // Function to trigger
        fcn: "getAccount_byNumber",
        // Existing state variable to retrieve
        args: args
    };
    chain.getUser(req.session.username, function(err, user) {
        if (err) throw Error("/getAccountByNumber: Failed to register and enroll" + req.session.username + ": " + err);
        userObj = user;
    })

    // Trigger the query transaction
    var queryTx = userObj.query(queryRequest);
    queryTx.on('complete', function(results) {
        // Query completed successfully
        console.log("/getAccountByNumber: Successfully queried  chaincode function: request=%j, value=%s \n", queryRequest, results.result.toString());
        //               callback(results);
        //////res.json(results);
        //process.exit(0);
        var x = JSON.parse(results.result.toString());
        console.log(x)
        res.json(x);
    });
    queryTx.on('error', function(err) {
        // Query failed
        console.log("/getAccountByNumber: Failed to query chaincode, function: request=%j, error=%j \n", queryRequest, err);
        //               callback(err);
        //var x= JSON.parse(err.msg.toString());
        //console.log(x)
        res.json(err);
        //process.exit(0);
    });
});
}