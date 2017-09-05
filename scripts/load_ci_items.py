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

#Dependencies
#pip --proxyhttp://proxy.xyz.net:8080 install http
#pip --proxyhttp://proxy.xyz.net:8080 install openssl

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
"ip":"10.10.10.10",
"credentials":{
"userName":"Administrator",
"password":"administrator"
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

