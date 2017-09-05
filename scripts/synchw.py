###
# (C) Copyright (2012-2017) Hewlett Packard Enterprise Development LP
#
# Permission is hereby granted, free of charge, to any person obtaining a copy
# of this software and associated documentation files (the "Software"), to deal
# in the Software without restriction, including without limitation the rights
# to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
# copies of the Software, and to permit persons to whom the Software is
# furnished to do so, subject to the following conditions:
#
# The above copyright notice and this permission notice shall be included in
# all copies or substantial portions of the Software.
#
# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
# IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
# FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
# AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
# LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
# OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
# THE SOFTWARE.
###
# Dependencies
# pip --proxy http://proxy.xyz.net:8080 install http
# pip --proxy http://proxy.xyz.net:8080 install openssl
# pip --proxy http://proxy.xyz.net:8080 install elasticsearch

from hpOneView.oneview_client import OneViewClient
from hpOneView.exceptions import HPOneViewException

import json
import requests
import elasticsearch
import sys
import re

## ServiceNOW specific API sets
instance = 'https://devxxxx.service-now.com/'
url = 'api/now/table/'
srv_table = 'cmdb_ci_server'
model_table = 'cmdb_model'
company_table = 'core_company'

# ServiceNOW credentials
user = 'admin'
pwd = 'admin'

# OneView credentials
config = {
    'ip': '10.10.10.10',
    'api_version' : 300,
    'credentials': {
        'userName': 'Administrator',
        'password': 'administrator'
    }
}

# Use proxies within HPE
proxies = {
  'http': 'http://proxy.xyz.net:8080/',
  'https': 'http://proxy.xyz.net:8080/',
}

# Set proper headers
headers = {'content-type':'application/json','Accept': 'application/json'}

# Elastic Search
es = None
configObj = None

# OneView Client variable
ov_client = ''

#Create Index's in ES for cmdb_ci_server
cmdb_ci_server = {
    'index': 'cmdb_ci_server',
    'type': 'cmdb_ci_server',
    'id': 'cmdb_ci_server',
    'body': {
      'settings': {
        'number_of_shards': 1,
        'number_of_replicas': 1
      },
      'mappings': {
        'cmdb_ci_server': {
          '_all': {
            'analyzer': 'edgengram_analyzer',
            'search_analyzer': 'whitespace_analyzer_truncate_25'
          },
          'properties': {
            'uri': {
              'type': 'string',
              'include_in_all': False
            }
          }
        }
      }
    }
  }

server_hardware_sync = {
    'index': 'server_hardware_sync',
    'type': 'server_hardware_sync',
    'id': 'server_hardware_sync',
    'body': {
      'settings': {
        'number_of_shards': 1,
        'number_of_replicas': 1
      },
      'mappings': {
        'server_hardware_sync': {
          '_all': {
            'analyzer': 'edgengram_analyzer',
            'search_analyzer': 'whitespace_analyzer_truncate_25'
          },
          'properties': {
            'oneview': {
              'type': 'string',
              'include_in_all': False
            }
          }
        }
      }
    }
  }

def cmp(d1, d2, NO_KEY='<KEYNOTFOUND>'):
    both = d1.keys() & d2.keys()
    diff = {k:(d1[k], d2[k]) for k in both if d1[k] != d2[k]}
    diff.update({k:(d1[k], NO_KEY) for k in d1.keys() - both})
    diff.update({k:(NO_KEY, d2[k]) for k in d2.keys() - both})
    return diff

def createESIndex(index_name, index_obj):
    try:
        res = es.indices.create(index=index_name, body=index_obj)
        #print ("response - CREATE %s index %s: " % (index_name, res))
    except Exception as e:
        print ("Index creation exception")
        print("Exception : %s " % str(e))

# Initialize Arrow ES index
def arrowInit() :
    global es
    es = elasticsearch.Elasticsearch([{'host': 'localhost', 'port': 9200}])

    global configObj
    configObj = json.loads(json.dumps(config))

    # Create an ES index
    if es.indices.exists('cmdb_ci_server'):
        try:
            # delete the index and recreate it
            res = es.indices.delete(index='cmdb_ci_server')
            createESIndex('cmdb_ci_server',cmdb_ci_server)
        except Exception as e:

            print("Exception : %s " % str(e))
    else:
        createESIndex('cmdb_ci_server',cmdb_ci_server)

    if es.indices.exists('server_hardware_sync'):
        try:
            # delete the index and recreate it
            res = es.indices.delete(index='server_hardware_sync')
            createESIndex('server_hardware_sync', server_hardware_sync)
        except Exception as e:
            print ("Index deletion exception")
            print("Exception : %s " % str(e))
    else:
        createESIndex('server_hardware_sync', server_hardware_sync)



# HTTP API bindings to connect to ServiceNOW
def getRequest(uri):
    # Do the HTTP request
    response = requests.get(uri, auth=(user, pwd), headers=headers, proxies=proxies)

    # Check for HTTP codes other than 200
    if response.status_code != 200:
        print('Status:', response.status_code, 'Headers:', response.headers, 'Error Response:', response.json())
        exit()

    # Decode the JSON response into a dictionary and use the data
    #print('Cookies', response.cookies)
    #print('Status:', response.status_code)
    #print('Headers:', response.headers)
    #print ('resp:', response.json())
    return response.json()

# HTTP API bindings to connect to ServiceNOW
def putRequest(uri,data_in):

    # Do the HTTP request
    response = requests.put(uri, auth=(user, pwd), headers=headers,data=data_in, proxies=proxies)

    # Check for HTTP codes other than 200
    if response.status_code != 200:
        print('Status:', response.status_code, 'Headers:', response.headers, 'Error Response:', response.json())
        exit()

    # Decode the JSON response into a dictionary and use the data
    #print('Cookies', response.cookies)
    #print('Status:', response.status_code)
    #print('Headers:', response.headers)
    #print ('resp:', response.json())
    return response.json()

# update the CI items in SNOW cmdb_ci_server to remove the OS fields
def updateSNOW(records_in):
    for record in records_in:
        update_uri = instance + url + srv_table + '/' + record['sys_id']
        #print json.dumps(getRequest(update_uri)['result'],indent=4)
        # update the OS fields
        data_update = {
                      "os": record['os'],
                      "os_version": record['os_version'],
                      "os_domain" : record['os_domain']
                    }
        update_str = json.dumps(data_update)
        putRequest(update_uri,update_str)['result']
        print ('SNOW CI item %s updated '% record['name'])

def updateES(record_in):
    # print update ES record for CMDB
    print('DO NOTHING: Updating needed for server_hardware_sync index with latest from CMDB')

def getOSDetail(server_profile_uri):
    global ov_client
    golden_image_name = ''
    if server_profile_uri is not None:
        server_profile = ov_client.server_profiles.get(server_profile_uri)
        #print('server profile : %s'% server_profile['name'])
        os_deployment_uri = server_profile['osDeploymentSettings']['osDeploymentPlanUri']
        if os_deployment_uri is not None:
            os_deployment_plan = ov_client.os_deployment_plans.get(os_deployment_uri)
            #print("Deployment plan : %s "%os_deployment_plan['name'])
            image_streamer_ip = os_deployment_plan['deploymentApplianceIpv4']
            image_steamer_dp_uri = os_deployment_plan['nativePlanUri']

            # Create a connection agent
            config['image_streamer_ip'] = image_streamer_ip
            connect = OneViewClient(config)
            image_streamer_client = connect.create_image_streamer_client()

            # Image Steamer Client is now available
            deployment_plan = image_streamer_client.deployment_plans.get(image_steamer_dp_uri)

            golden_image_uri = deployment_plan['goldenImageURI']
            if len(golden_image_uri) > 0:
                golden_image = image_streamer_client.golden_images.get(golden_image_uri)
                golden_image_name = golden_image['name']

    print('Golden image : %s ' %golden_image_name)
    os_detail = re.split(' |-',golden_image_name)

    os_dict = ''

    if len(os_detail) >= 2:
        os = ''
        if os_detail[0].lower() == 'rhel':
            os = 'Linux Red Hat'
        elif os_detail[0].lower() == 'sles':
            os = 'Linux SuSE'
        os_dict = {
            'os' : os,
            'os_version' : os_detail[1]
        }
        #print ("OS : %s : Version : %s" % (os_dict['os'], os_dict['os_version']))
    return os_dict

# Function will look at each OV record and compare with
def verifyOVwithES(server_in):
    # Verify json H/W record with ES data
    # update ES record with OV data if data does not match
    page = es.search(index='cmdb_ci_server', doc_type='cmdb_ci_server',
                     body={"query": {"match_phrase": {"asset_tag": server_in['uuid']}},
                           "_source" : ["name","os_domain","sys_id","os","os_version","asset_tag"]})

    # The following reduces the dictionaries to a specific set of values
    reduced_server = {key: server_in.get(key, None) for key in ('name','state', 'uuid')}

    os = ''
    # If an SP is set, look for associated Golden Image
    # if(server_in['serverProfileUri']):
    #     os = getOSDetail(server_in['serverProfileUri'])

    operating_system = ''
    operating_system_version = ''

    if 'os' in os:
        operating_system = os['os']

    if 'os_version' in os:
        operating_system_version = os['os_version']

    server_dict = {
        'name' : server_in['name'],
        'asset_tag' : server_in['uuid'],
        'os_version' : operating_system_version,
        'os_domain' : server_in['state'],
        'os' : operating_system
    }

    cmdb_keys = page['hits']['hits'][0]['_source']
    cmdb_dict = {key: cmdb_keys.get(key, None) for key in ('name','asset_tag', 'os_domain')}

    ret = cmp(cmdb_dict, server_dict)
    ret_len = len(ret)

    if ret_len >= 1:
        server_dict['sys_id'] = cmdb_keys['sys_id']

    # Return the object containing all the dict items that need to be updated in CMDB
    return server_dict

def refreshESfromSNOW():
    # Find Synergy Servers in the CMDB CMDB_CI_Server class only
    #uri = instance + url + srv_table + '?sysparm_query=manufacturerLIKEHewlett^model_idLIKEsy^sys_class_name=cmdb_ci_server'
    uri = instance + url + srv_table + '?manufacturer=Hewlett%20Packard%20Enterprise'
    synergy_servers = getRequest(uri)  # already a json object

    synergy_count = len(synergy_servers['result'])
    print('HPE Synergy servers in SNOW CMDB : %d '% synergy_count)

    for synergy in synergy_servers['result']:
        # Add records into ES
        try:
            # Add the oneview field to identify record
            synergy['oneview'] = configObj['ip']
            es.index(index='cmdb_ci_server', doc_type='cmdb_ci_server', body=synergy)
        except Exception as e:
            print("Record did not add %s : " %(synergy['name']))
            print("Exception : %s "%str(e))

def getServerHW():
    no_of_servers = []
    global ov_client
    # connect to the client
    ov_client = OneViewClient(config)
    try:
         server_hw = ov_client.server_hardware.get_all()
         # Iterate through each server and validate info in ES
         for server in server_hw:
             # Update each ES record with data from Server H/W and keep track
             server['oneview'] = configObj['ip']
             server['os'] = ''
             server['os_version'] = ''
             es.index(index='server_hardware_sync', doc_type='server_hardware_sync', body=server)
             server_return = verifyOVwithES(server)

             # Check if Sys id is entered
             if 'sys_id' in server_return:
                no_of_servers.append(server_return)

    except HPOneViewException as e:
         print("Exception : " % (e.msg))

    return no_of_servers

if __name__ == "__main__":
    # Initialize the ES index
    arrowInit()
    refreshESfromSNOW() # Fresh data from SNOW to be refreshed into the CMDB_CI_Server index

    # Retrieve data from OneView and update corresponding ES CI records with up to date information
    array_of_ci_items = []
    array_of_ci_items = getServerHW()
    print ('SNOW CI Items to update : %d '%len(array_of_ci_items))

    # Push updates to SNOW for items that have changed.
    if(len(array_of_ci_items) > 0):
        updateSNOW(array_of_ci_items)
        print ("SNOW CI Items update complete")
    else:
        print("SNOW CI items NOT updated")

    # Execution complete - Wake up and do it again
    sys.exit(0)








