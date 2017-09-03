# oneview-arrow
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

- HPE OneView 3.0
- Service NOW - Helsinki  or above version
- VM ( tested on Linux flavor of VM ) to run the code. Need following packages on the VM
    1. ElasticSearch v2.4.3
    2. Install OneView Python Library (https://github.com/HewlettPackard/python-hpOneView)
    3. Node.js v5.11 
    4. ServiceNow MID server for version Helsinki
    5. Java 1.8
    6. Python3 and pip3
    7. Rundeck ( job scheduler to sync servers inventory )

## Build Instructions (How to setup )
1. clone the repo onto your PC or server
2. cd to oneview-arrow directory
3. run "npm install" command to install javascript dependent modules.
4. update the esPersistance.js for IP address/hostname of elasticsearch. If it is running on localhost, no need to update the file
5. configure MID server with your servicenow instance and start the service
6. configure business rules on the incidents. You can copy code from ServiceNow/incidents_business_rules.txt and edit IP address and MID server names
7. Edit oneview-arrow/creds.js according to your environment ( for snow credentials, oneview credentials...etc )
8. Edit oneview-arrow/scripts/arguments.json with your snow instance credentials

## How to run the arrow application  
1. start the elasticsearch instance
2. cd to oneview-arrow, run "node server.js |  ./node_modules/.bin/bunyan" command to start the nodejs server
3. cd to oneview-arrow/scripts and run scmb python script with below command
   python3 ovincidents.py -i arguments.json

## How to test and troubleshoot
1. Simulate or generate "active" alert on oneview
2. You should see an new incidents on snow ( if incident already exists, it updated with new alert. One incident per server hardware )
3. If you close an incident in snow, the alert will be cleared on oneview
4. Review arrow.log and OVSB.log for additional troubleshooting ( if you run into any issues )
