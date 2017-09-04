# HPE OneView to Service-Now Integration
The code within this repository builds an integration between HPE OneView and an instance of Service NOW.

The following use cases are supported by this integration.

## Use case #1: Incident management

- Listen on alerts indentified by HPE OneView
- Filter alerts based on SNMP and post only specific alerts as either incidents or events in ServiceNow 
- Update existing incidents as ongoing activities change status
- Close incident in ServiceNow to clear associated alerts in HPE OneView ( by directional integration )

## Use case #2: Configuration management

- Update Configuration Items (CI) in ServiceNow
- Keep CI items in sync with periodic refresh using a scheduler of your choice

## Use case #3: Service catalog offering

- Design and present an HPE Synergy service offering in the service catalog
- Provision bare metal server when requested from the service catalog. 

## Pre-requisites ( Software dependancies to run this integration )

- HPE OneView 3.0 or above ( tested on 3.0, it should work with 3.1 by passing correct X-API-Version )
- Service NOW - Helsinki  or above version ( tested on Helsinki )
- VM ( tested on Linux flavor of VM ) to run the code. Need following packages on the VM
    1. ElasticSearch v2.4.3
    2. Install OneView Python Library (https://github.com/HewlettPackard/python-hpOneView)
    3. Node.js v5.11 
    4. ServiceNow MID server for version Helsinki
    5. Java 1.8
    6. Python3 and pip3
    7. Rundeck ( job scheduler to sync servers inventory )
- For filtering the alerts ( for example : which one should go to incident table and which one should land on events table ), prepare
  the trap list ( .csv file ). A sample filtered trap list file can be found at ./scripts/traps folder. This file is being load and read
  by script during runtime.

## Build Instructions (How to setup )
1. clone the repo onto your PC or VM
2. cd to servicenow-oneview directory
3. run "npm install" command to install javascript dependent modules.
4. If elasticsearch instance is running on localhost, no need to update the esPersistance.js else update the esPersistance.js for IP address/hostname of elasticsearch. 
5. configure MID server with your servicenow instance and start the service
5. Define outbound REST message APIs on servicenow instance to communicate with integration pack instance. Here are the high level steps:
    - login to your servicenow instance, then go to outbound REST message. 
    - Let us create 3 REST message APIs as shown in the below picture. 
    - ![Sample REST Message APIs](https://github.com/HewlettPackard/servicenow-oneview/blob/master/images/REST_Messages%20_%20ServiceNow.png)
        -POST <base url>:3000/arrow/v1/incident
            sample playload and headers are in the below picture
            ![Sample POST /arrow/v1/incident](https://github.com/HewlettPackard/servicenow-oneview/blob/master/images/REST_POST_ALERT_%20ServiceNow.png)
        -POST <base url>:3000/arrow/v1/login-sessions
            sample playload and headers are in the below picture
            ![Sample POST /arrow/v1/login-sessions](https://github.com/HewlettPackard/servicenow-oneview/blob/master/images/REST_POST_LOGIN-SESSIONS_%20ServiceNow.png)
        -POST <base url>:3000/arrow/v1/provision-server
            sample playload and headers are in the below picture
            ![Sample POST /arrow/v1/provision-server](https://github.com/HewlettPackard/servicenow-oneview/blob/master/images/REST_POST_SERVER_PROVISION_%20ServiceNow.png)
6. configure business rules on the incidents. You can copy business rule code from ServiceNow/incidents_business_rules.txt and edit IP address and MID server name. The rule will execute when user closes incident on server. This rule makes REST call to integration server and then active alert on oneview would get closed.
7. create workflow design with custom run script. You can copy custom workflow runscript code from ServiceNow/workflow-script.txt and edit the IP address and MID server name. The sample workflow will get executed when requested service catalog item is approved. Here is sample workflow design.
    ![Sample Workflow Design](https://github.com/HewlettPackard/servicenow-oneview/blob/master/images/Workflow_Design_ServiceNow.png)
7. Edit servicenow-oneview/arguments.json with your servicenow instance credentials

## How to run the application  
1. start the elasticsearch instance
2. cd to servicenow-oneview, run "node server.js |  ./node_modules/.bin/bunyan" command to start the nodejs server
3. check the trap list file (.csv ) in in ./scripts/traps folder. This csv file is being read and alerts are filtered based on this list
4. cd to servicenow-oneview/scripts and run scmb python script with below command
   >python3 ovincidents.py -i <path to arguments.json>

## How to test and troubleshoot
### Use Case #1
    1. Simulate or generate "active" alert on oneview
    2. You should see an new incidents on servicenow ( if incident already exists, it updated with new alert. One incident per server hardware ). Depending on the filtered trap list, you will alerts landing in Incident table or events table.
    3. If you close an incident in servicenow, the alert will be cleared on oneview
    4. Review arrow.log and OVSB.log for additional troubleshooting ( if you run into any issues )
### Use Case #3
    1. Request service catalog if you have design service catalog request
    2. Approve the request
    3. You should bare metal server getting provisioned in OneView
### Use Case #2
    1. Run scripts/synchw.py through Run deck or manually
    2. After running the above scripts, records in CMDB should be updated.
## Assumptions
1. Initial HPE servers records should be created in the ServiceNow CMDB
2. Service catalog request offering should be created for running use case # 2
3. Optionally configure the run deck to run the sync script automatically
4. Image Streamer feature is used for OS provisioning
