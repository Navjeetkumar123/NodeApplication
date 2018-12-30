function dashboardController($scope,$rootScope,$location,$http,$window){
            console.log("dashboardController");
            $rootScope.dashboard="Dashboard";
            $http.get('/get_dashboard_tableData').success(function(data)
            {
                $scope.dashboardTableData=[
                {
                    "dealId":"Deal_ID",
                    "pledger":"Pledger",
                    "pledgee":"Pledgee",
                    "rqv":"RQV",
                    "currency":"USD",
                    "marginCallDate": "13-10-2017",
                     "dealStatus":"approve",
                     "allocationStatus":"reject", 
                     "last_allocationDate":"reject"    
                }
                ]
            });
}
function submitAllocationController($scope,$rootScope,$location,$http,$window){
      $rootScope.dashboard="Submit Allocation Request";
      console.log("submitAllocationController");
      $scope.submitFile=function()
      {
        console.log("submitFile");
        var file = $scope.myFile;
        var fd = new FormData();
        fd.append('file', file);
        var fileName = file.name;
          var extn = fileName.substr(fileName.lastIndexOf('.') + 1);
            if (extn != "pdf") {
                alert("Please select only .pdf files")
                return;
            }
            var request = {
                method: 'POST',
                url: '/uploadFile',
                data: fd,
                //transfrom request is very necesssary if using express
                transformRequest: angular.identity,
                headers: {
                    'Content-Type': undefined
                }
            };
            $http(request).success(function(data) {
                alert("submitted");
                $window.location.reload();
            })
      }
}

function transactionHistoryController($scope,$rootScope,$location,$http,$window){
        $rootScope.dashboard="Transaction History";
    
        console.log("transactionHistoryController");
          
           
           
            $scope.sub_transcation_history2=function() 
                {
                    
                   console.log("sub_transcation_history2"); 
                $location.url('/transact_history2');

                var fd = new FormData();
                fd.append('dealId', $scope.dealId);
                fd.append('currency', $scope.currency);
                fd.append('pledger',$scope.pledger);
                fd.append('pledgee', $scope.pledgee)
                console.log($scope.dealId);
                console.log($scope.currency);
                console.log($scope.pledger);
                console.log($scope.pledgee);
                var request={
                    method:'POST',
                    url: '/submitTransactionHistory',
                    data: fd,
                    transformRequest: angular.identity,
                    headers: {
                        'Content-Type': undefined
                                }
                }
                $http(request)
                    .success(function(data)
                    {
                       
                        $location.url("/");

                    })
                $http.get("/get_transaction_hist2_dealData").success(function(data) {
                           $scope.transaction_history_TableData_2=[
                            {
                                "dealId":"Deal_ID",
                                "pledger":"Pledger",
                                "pledgee":"Pledgee",
                                "rqv":"RQV",
                                "currency":"USD",
                                "marginCallDate": "13-10-2017",
                                 "dealStatus":"approve",
                                 "applicationStatus":"reject" 
                            }
                            ]
                    });
                }

                 $scope.sub_transcation_history3=function() 
                {
                   $http.get("/Get_transaction_hist3_dealData").success(function(data) {
                         $scope.transaction_hist_Dealtable_3=
                            {
                                "dealId":"Deal_ID",
                                "pledger":"Pledger",
                                "pledgerLongboxAcc":"11000345",
                                "pledgee":"Pledgee",
                                "pledgeeSegAcc":"1187800034",
                            }

                   });
                    $http.get("/Get_transaction_hist3_security_data").success(function(data) {
                         $scope.transaction_history_TableData_3=[
                                {
                                    "security":"Security",
                                    "secId":"Security id_123",
                                    "type":"longbox",
                                    "quantity":"1300",
                                     "collForm":"Form",
                                     "mtm":"MTM",
                                     "mrginCallDate":"10-5-2017",
                                    "valuation":"80",
                                    "effValue":"10,000",
                                    "totalValue":"INR",
                                    "currency":"USD"
                                }
                                ]
                    });

                $location.url('/transact_history3');
            
                }

}
function viewAccDetailsController($scope, $rootScope,$location, $http, $window) {
                     $rootScope.dashboard="View Account Details";
                    console.log("viewAccDetailsController");

                      $scope.viewLongboxAccDetails=function(){
                        console.log("viewLongboxAccDetails"); 

                        $http.get("/get_Acc_holder_details").success(function(data) {
                            $scope.viewAcc_holder_details =
                                    {
                                        "accountHolderName":"ABC",
                                        "accountNumber":"11000354764",
                                        "accountType":"longbox",
                                        "accountBalnace":"50,000",
                                        "currency":"USD",
                                        "pledgerName":"XYZ Bank"
                                        
                                    }  

                        });
                        $location.url('/viewAccountdetails2');
                    }
                     $scope.viewSegAccDetails=function(){
                        console.log("viewLongboxAccDetails"); 
                        $http.get("/get_Acc_security_data").success(function(data) {
                             $scope.transaction_history_TableData_3=[
                            {
                                "security":"Security",
                                "secId":"Security id_123",
                                "type":"longbox",
                                "quantity":"1300",
                                 "collForm":"Form",
                                 "mtm":"MTM",
                                 "mrginCallDate":"10-5-2017",
                                "valuation":"80",
                                "effValue":"10,000",
                                "totalValue":"INR",
                                "currency":"USD"
                            }
                            ]
                        });
                        $location.url('/viewAccountdetails3');
                    }
            $http.get("/get_longbox_accountDetails").success(function(data) {
                $scope.accountDetailsTable_1=
                {
                    "longboxAccNo":"110003384",
                    "longboxAccBal":"1,00000",
                    "currency":"USD"
                    
                }
            });
            $http.get("/get_seg_acc_details").success(function(data) {
                $scope.accountDetailsTable_2=[
                {
                    "segAccNo":"110003384",
                    "segAccBal":"1,00000",
                    "currency":"USD",
                    "pledger": "ABC Bank"
                    
                }]
            });
              
               
}

function homeController($scope, $location, $rootScope, $http, $window){
        console.log("homeController");
        $rootScope.dashboard="Home";
    $http.get("/get_bank_record").success(function(data) {
        $scope.bankRecord={
            "longboxAccountNumber":"11078432",
            "currency":"USD",
            "triPartyAgent":"triparty"
            }
       
            });
        
         $scope.view_pending_req=function() 
            {
                $http.get("/get_view_Pending_Request").success(function(data) {
                $scope.pending_request_table=[
                {
                    "dealId":"Deal_ID",
                    "pledgee":"Pledgee",
                    "rqv":"RQV",
                    "currency":"USD",
                    "issueDate": "13-10-2017"
                         
                }
                ]
          
                    });
            
               $location.url('/p_pendingRequest'); 
            }
}

function myLongboxAccController($scope, $location, $http, $rootScope, $window){
                    console.log("myLongboxAccController");
                    $rootScope.dashboard="My Longbox Account";

                    $scope.addSecurity=function() 
                {
                    console.log("addSecurity");
                    $location.url('/p_addSecurity'); 
                }
            $http.get("/get_longBoxAcc_record").success(function(data) {
                        $scope.longBoxRecord={
                "name":"Wipro",
                "accountNo":"1100002534",
                "accType":"longbox",
                 "accBal":"10,000",
                "currency":"INR"
            }
        });
    $http.get("/get_longBox_security_tableData").success(function(data) {
            $scope.longBoxTableData=[
            {
                "security":"Security",
                "secId":"Security id_123",
                "type":"longbox",
                "quantity":"1300",
                 "collForm":"Form",
                 "mtm":"MTM",
                "valuation":"80",
                "effValue":"10,000",
                "totalValue":"INR",
                "currency":"USD"
            }
            ]
        });
            
}

function mySegAccController($scope, $rootScope, $location, $http, $window){
                console.log("mySegAccController");
                $rootScope.dashboard="My Segregated Account";
        $http.get("/get_seg_Acc_Record").success(function(data) {
                  $scope.segAccRecord=[{
                    "segregatedAccNo":"1100020011100",
                    "segregatedAccBalance":"20,000",
                    "currency":"INR",
                    "pledger":"longbox"
                    }]
                });
         $scope.viewSegAccDetails=function() 
            {
                console.log("p_SegAcc2");
            $http.get("/get_seg_acc_holder_record").success(function(data) {
                 $scope.segAccount2_table2={
                        "name":"Wipro",
                        "accountNo":"1100002534",
                        "accType":"longbox",
                         "accBal":"10,000",
                        "currency":"INR"
                    }
            });

             $http.get("/get_seg_acc_security_record").success(function(data) {
                   $scope.segAccount2_table=[
                        {
                            "security":"Security",
                            "secId":"Security id_123",
                            "type":"longbox",
                            "quantity":"1300",
                             "collForm":"Form",
                             "mtm":"MTM",
                            "valuation":"80",
                            "effValue":"10,000",
                            "totalValue":"INR",
                            "currency":"USD"
                        }
                        ]
            });
               $location.url('/p_SegAcc2'); 
            }
         
         
}
function allocationHistoryController($scope, $rootScope, $location, $http, $window){
    $rootScope.dashboard="Allocation History";
     $http.get("/get_alloc_hist_table").success(function(data) {
                $scope.alloc_hist_table=[
            {
                "dealId":"Deal_ID",
                "pledgee":"Pledgee",
                "rqv":"RQV",
                "currency":"USD",
                "issueDate": "13-10-2017",
                 "dealStatus":"approve",
                 "allocationStatus":"reject"    
            }
            ]
           
           });
          $scope.submitAllocationHistory2=function() 
            {
                console.log("submitAllocationHistory2");
              $http.get("/get_alloc_hist2_deal_data").success(function(data) {
                     $scope.alloc_Dealhist_table=
                        {
                            "dealId":"Deal_ID",
                            "pledgee":"Pledgee",
                            "pledgeeSegAcc":"1100000344",
                             "rqv":"RQV",
                            "currency":"USD",    
                        }
              });
            $http.get("/get_alloc_hist2_security_data").success(function(data) {
                 $scope.alloc_hist_table_2=[
                    {
                        "security":"Security",
                        "secId":"Security id_123",
                        "type":"longbox",
                        "quantity":"1300",
                         "collForm":"Form",
                         "mtm":"MTM",
                        "valuation":"80",
                        "effValue":"10,000",
                        "totalValue":"INR",
                        "currency":"USD"
                    }
                    ]

              });


               $location.url('/p_allocationHistory2'); 
            }
}
function myTransactionController($scope,$rootScope, $location, $http, $window){
    $rootScope.dashboard="My Transaction";
         $scope.submitMyTransaction2=function() 
            {
                        console.log("submitMyTransaction");
                        var fd = new FormData();
                        fd.append('pledgee', $scope.pledgee)
                        fd.append('c_role', $scope.c_role)
                        fd.append('dealId', $scope.dealId)
                        fd.append('sel_c_party', $scope.sel_c_party)
                        fd.append('sel_currency', $scope.sel_currency)
                        console.log($scope.pledgee);
                         console.log($scope.c_role);
                          console.log($scope.dealId);
                           console.log($scope.sel_c_party);
                            console.log($scope.sel_currency);
                         var request = {
                            method: 'POST',
                            url: '/submitTransaction',
                            data: fd,
                                 //transfrom request is very necesssary if using express
                                 transformRequest: angular.identity,
                                 headers: {
                                    'Content-Type': undefined
                                 }
                            };
                
                            $http(request)
                            .success(function(data) {
                                $scope.myTransactionData = data;    
                             $location.url("/p_myTransaction2");
                          
                         })
                            .error(function() {
                                alert('Error in creation of instance. Try again.');
                             console.log('data was not inserted successfully');
                             $location.url("/p_myTransaction2");
                         });
                               // $location.url('/p_myTransaction2'); 
                    $http.get("/get_trans_hist2_deal_data").success(function(data) {
                          $scope.trans_hist_table=[
                            {
                                "dealId":"Deal_ID",
                                "pledgee":"Pledgee",
                                "rqv":"RQV",
                                "currency":"USD",
                                "issueDate": "13-10-2017",
                                 "dealStatus":"approve",
                                 "allocationStatus":"reject"    
                            }
                            ]
                                    });

                    }


                     $scope.submitMyTransaction3=function() 
                    {
                        console.log("submitMyTransaction3");
                        $http.get("/get_trans_hist3_deal_data").success(function(data) {
                             $scope.alloc_Dealhist_table=
                                    {
                                        "dealId":"Deal_ID",
                                        "pledgee":"Pledgee",
                                        "pledgeeSegAcc":"1100000344",
                                         "rqv":"RQV",
                                        "currency":"USD",    
                                    }
                        });
                        $http.get("/get_trans_hist3_security_data").success(function(data) {
                             $scope.alloc_hist_table_2=[
                                {
                                    "security":"Security",
                                    "secId":"Security id_123",
                                    "type":"longbox",
                                    "quantity":"1300",
                                     "collForm":"Form",
                                     "mtm":"MTM",
                                    "valuation":"80",
                                    "effValue":"10,000",
                                    "totalValue":"INR",
                                    "currency":"USD"
                                }
                                ]
                        });

                       $location.url('/p_myTransaction3'); 
                    }
            
             
            
    }