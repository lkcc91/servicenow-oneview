# HPE OneView to Service-Now Integration
The code within this repository builds an integration between HPE OneView and an instance of Service NOW.
The following use cases are supported by this integration.

## Use case #1: Configuration management

- Auto-discover available servers with HPE OneView
- Update Configuration Items (CI) in ServiceNow
- Keep CI items in sync with periodic refresh using a scheduler of your choice

## Use case #2: Incident management

- Listen on alerts indentified by HPE OneView
- Filter alerts based on SNMP and post only specific alerts as incidents in ServiceNow 
- Update existing incidents as ongoing activities change status
- Backsync - Close incident in ServiceNow to clear associated alerts in HPE OneView

## Use case #3: Service catalog offering

- Design and present an HPE Synergy service in the service catalog
- Provision a composable resource when requested from the service catalog. 

## Pre-requisites

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

## Build Instructions (How to setup )
1. clone the repo onto your PC or VM
2. cd to servicenow-oneview directory
3. run "npm install" command to install javascript dependent modules.
4. If elasticsearch instance is running on localhost, no need to update the esPersistance.js else update the esPersistance.js for IP address/hostname of elasticsearch. 
5. configure MID server with your servicenow instance and start the service
5. Define outbound REST message APIs on servicenow instance to communicate with integration pack instance. Here are the high level steps:
 - login to your servicenow instance, then go to outbound REST message. 
 - Let us create 3 REST message APIs as shown in the below picture. 
 - ![https://github.com/HewlettPackard/servicenow-oneview/images/REST_Messages_ServiceNow.png]
6. configure business rules on the incidents. You can copy code from ServiceNow/incidents_business_rules.txt and edit IP address and MID server names. The rule will execute when user closes incident on server. This rule makes REST call to integration server and then active alert on oneview would get closed.
7. Edit servicenow-oneview/arguments.json with your servicenow instance credentials

## How to run the application  
1. start the elasticsearch instance
2. cd to servicenow-oneview, run "node server.js |  ./node_modules/.bin/bunyan" command to start the nodejs server
3. cd to servicenow-oneview/scripts and run scmb python script with below command
   >python3 ovincidents.py -i <path to arguments.json>

## How to test and troubleshoot
1. Simulate or generate "active" alert on oneview
2. You should see an new incidents on servicenow ( if incident already exists, it updated with new alert. One incident per server hardware )
3. If you close an incident in servicenow, the alert will be cleared on oneview
4. Review arrow.log and OVSB.log for additional troubleshooting ( if you run into any issues )

