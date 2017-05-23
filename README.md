# servicenow-oneview

### Coming soon -- Please check back in a few days. 

The code within this repository builds an integration between HPE OneView and an instance of Service NOW.
The following use cases are supported by this integration.

**Use case #1: Configuration management**

- Auto-discover available servers with HPE OneView
- Update Configuration Items (CI) in ServiceNow
- Keep CI items in sync with periodic refresh using a scheduler of your choice

**Use case #2: Incident management**

- Listen on alerts indentified by HPE OneView
- Filter alerts based on SNMP and post only specific alerts as incidents in ServiceNow 
- Update existing incidents as ongoing activities change status
- Backsync - Close incident in ServiceNow to clear associated alerts in HPE OneView

**Use case #3: Service catalog offering**

- Design and present an HPE Synergy service in the service catalog
- Provision a composable resource when requested from the service catalog. 

**Pre-requisites**

- HPE OneView 3.0
- Service NOW - Helsinki version
- VM to execute the code within this repository

**Build Instructions**

- Will be updated, when code is released.






