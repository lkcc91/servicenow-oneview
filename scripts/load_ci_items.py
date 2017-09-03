#Dependencies
#pip--proxyhttp://proxy.houston.hpecorp.net:8080installhttp
#pip--proxyhttp://proxy.houston.hpecorp.net:8080installopenssl

from hpOneView.oneview_client import OneViewClient
from hpOneView.exceptions import HPOneViewException

from flask import jsonify
import sys
import json

import os
import http.client
import logging
import requests
#import OpenSSL

config={
"ip":"10.188.29.1",
"credentials":{
"userName":"Administrator",
"password":"P@ssw0rd1"
}
}
#connecttotheclient
ov_client=OneViewClient(config)

print("GetServer-hardware details")
try:
    server_hw=ov_client.server_hardware.get_all()

    print('Name|Assettag|Manufacturer|Company|Serial number|ModelID|RAM|CPU manufacturer|CPU type|CPU speed(MHz)|CPU count|CPU core count')

    for serv in server_hw:
        #print(json.dumps(serv, indent=4))
        print('%s|%s|%s|%s|%s|%s|%s|%s|%s|%s|%s|%s'%(serv['name'],serv['uuid'],'Hewlett Packard Enterprise','Hewlett Packard Enterprise',serv['serialNumber'],serv['model'],serv['memoryMb'],'Intel',serv['processorType'],serv['processorSpeedMhz'],
                                                     serv['processorCount'],serv['processorCoreCount']))

except HPOneViewException as e:
    print(e.msg)

