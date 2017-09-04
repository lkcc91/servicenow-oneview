#!/usr/bin/env python3

###
# (C) Copyright (2012-2015) Hewlett Packard Enterprise Development LP
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

# Info on Elasticsearch support in Python is available
# at https://www.elastic.co/guide/en/elasticsearch/client/python-api/current/index.html


### DEPENDENCIES####
#$ pip install pyopenssl
#$ pip install
#$ pip install elasticsearch


import sys
#print sys.path
#if sys.version_info < (3, 4):
 #   raise Exception('Must use Python 3.4 or later')
# from Crypto.Cipher import AES
# from Crypto.Util import Counter
from hpOneView import *
from functools import partial
import amqp
import json
import ssl
import datetime
import OpenSSL
import subprocess
import os
import http.client
import logging
import os
import sys
import io
import requests
import schedule
import time
import csv

# For passing the host IP to the callback function
global_host = ""
es = None
trapsdict = {}

def callback(channel, msg):
    logging.info("ovincidents : callback : Start")
    logging.info("ovincidents : callback : msg.delivery_tag: %s",msg.delivery_tag)
    logging.info("ovincidents : callback : msg.consumer_tag: %s", msg.consumer_tag)

    # ACK receipt of message
    channel.basic_ack(msg.delivery_tag)

    # Convert from json into a Python dictionary
    content = json.loads(msg.body)
    # Add a new attribute so that the server side can recognize from which appliance it is this message comes from.
    content['messageHost'] = global_host;
    headers = {"Content-Type" : "application/json", "Accept" : "application/json"}

    logging.info("CONTENT %s", content)

    ## integrating with service now
    # service_now_integration(content)
    handle_ovalert(content)
    
    # Cancel this callback
    if msg.body == 'quit':
        channel.basic_cancel(msg.consumer_tag)

    logging.info("ovincidents : callback : End")

            
def recv(host, route):
    logging.info("ovincidents : recv:  Start: %s", route)

    # Create and bind to queue
    EXCHANGE_NAME = 'scmb'
    dest = host + ':5671'

    # Setup our ssl options
    ssl_options = ({'ca_certs': 'certs/' + host + '-caroot.pem',
                    'certfile': 'certs/' + host + '-client.pem',
                    'keyfile': 'certs/' + host + '-key.pem',
                    'cert_reqs': ssl.CERT_REQUIRED,
                    'ssl_version' : ssl.PROTOCOL_TLSv1_1,
                    'server_side': False})

    logging.info("ovincidents : recv: ssl_options %s", ssl_options)

    # Connect to RabbitMQ
    conn = amqp.Connection(dest, login_method='EXTERNAL', ssl=ssl_options)
    
    ch = conn.channel()
    qname, _, _ = ch.queue_declare()
    routeArray = route.split(';')
    for each in routeArray:
        logging.info("SCMB bind to " + each)
        ch.queue_bind(qname, EXCHANGE_NAME, each)
    ch.basic_consume(qname, callback=partial(callback, ch))

    # Start listening for messages
    while ch.callbacks:
        ch.wait()

    ch.close()
    conn.close()
    logging.info("ovincidents : recv :End")

# This code written based on info provided by https://www.rabbitmq.com/consumer-cancel.html
def stopSCMB(host):
    logging.info("ovincidents: stopSCMB: Start")

    EXCHANGE_NAME = 'scmb'
    dest = host + ':5671'

    # Setup our ssl options
    ssl_options = ({'ca_certs': 'certs/' + host + '-caroot.pem',
                    'certfile': 'certs/' + host + '-client.pem',
                    'keyfile': 'certs/' + host + '-key.pem',
                    'cert_reqs': ssl.CERT_REQUIRED,
                    'ssl_version' : ssl.PROTOCOL_TLSv1_1,
                    'server_side': False})

    logging.info("ovincidents : recv: ssl_options %s", ssl_options)

        # Connect to RabbitMQ
    conn = amqp.Connection(dest, login_method='EXTERNAL', ssl=ssl_options)

    ch = conn.channel()
    qname, _, _ = ch.queue_declare()
    ch.queue_bind(qname, EXCHANGE_NAME, 'scmb.#')

    # Send a message to end this queue
    # This code written based on info provided by https://www.rabbitmq.com/consumer-cancel.html
    # basic_cancel(msg.consumer_tag)
    print(ch)
    ch.basic_cancel(None, None)
    ch.close()

    logging.info("ovincidents: stopSCMB: End")


def login(con, credential):
    logging.info('ovincidents: login: before login')
    # Login with givin credentials
    try:
        con.login(credential)
    except:
        logging.error('ovincidents: login: Login failed')


def acceptEULA(con):
    logging.info("ovincidents: acceptEULA: Start")
    # See if we need to accept the EULA before we try to log in
    con.get_eula_status()
    try:
        if con.get_eula_status() is True:
            con.set_eula('no')
    except Exception as e:
        logging.error('ovincidents: acceptEULA: EXCEPTION')
        logging.error("ovincidents: acceptEULA: %s", e)

# def getPKCS12(sec, host):

    # cert = sec.get_rabbitmq_kp()
    # # certx509 =  x509.load_pem_x509_certificate(cert[base64SSLCertData], default_backend())
    # # ca.write(cert['base64SSLCertData'])
    # # Now create pkcs12 file using the certificate and the key
    # # print(cert.type())
    # print("Cert: " + cert['base64SSLCertData'])
    # print("KEY: " + cert['base64SSLKeyData'])
    # logging.info("Cert: %s", cert['base64SSLCertData'])
    # logging.info("KEY: %s", cert['base64SSLKeyData'])
    # p12 = OpenSSL.crypto.PKCS12()
    # # Load a certificate (X509) from the string buffer encoded with the type PEM.
    # cert1 = OpenSSL.crypto.load_certificate(OpenSSL.crypto.FILETYPE_PEM, cert['base64SSLCertData'])
    # p12.set_certificate(cert1)
    # # Load a private key (PKey) from the string buffer encoded with PEM
    # pkey1 = OpenSSL.crypto.load_privatekey(OpenSSL.crypto.FILETYPE_PEM, cert['base64SSLKeyData'])
    # p12.set_privatekey( pkey1 )
    # # Now save PKCS12 certificate to file prefixed with OneView appliance IP/hostname
    # open( "certs/" + host + "-container.pfx", 'wb' ).write( p12.export() )
    # # open( "certs/" + host + ".p12", 'w' ).write( cert )


def getCertCa(sec, host):
    logging.info('ovincidents: getCertCa: Start')
    cert = sec.get_cert_ca()
    ca = open('certs/' + host + '-caroot.pem', 'w+')
    ca.write(cert)
    ca.close()


def genRabbitCa(sec):
    logging.info('ovincidents: getRabbitCa: Start')
    sec.gen_rabbitmq_internal_signed_ca()



def getRabbitKp(sec, host):
    logging.info('ovincidents: getRabbitKp: Start')
    cert = sec.get_rabbitmq_kp()
    ca = open('certs/' + host + '-client.pem', 'w+')
    ca.write(cert['base64SSLCertData'])
    ca.close()
    ca = open('certs/' + host + '-key.pem', 'w+')
    ca.write(cert['base64SSLKeyData'])
    ca.close()

def job():
    logging.info("ovincidents: job: I'm working...")

def main():
    logging.info("ovincidents: Main: Start")
    global  trapsdict
    
    parser = argparse.ArgumentParser(add_help=True, description='Usage')
    parser.add_argument('-i','--input_file',dest='input_file', required=True,
                        help='Json file containing input arguments')
                            
    input=parser.parse_args()   
    
    with open(input.input_file) as data_file:    
        args = json.load(data_file)   
    
    logging.info("ovincidents: Main: Host: %s", args["oneview"]["host"])
    logging.info("ovincidents: Main: action: %s", args["oneview"]["action"])
    logging.info("ovincidents: Main: instance: %s",  args["servicenow"]["instance"])
    logging.info("ovincidents: Main: username: %s",  args["servicenow"]["username"])
	    
    #args.passwd = dec.decrypt(bytes.fromhex(args.passwd)).decode('utf8')[:int(args.plen)]
    global global_host
    global_host = args["oneview"]["host"]
    CI_LOG_PATH = '.'

    logfilepath = os.getcwd() + os.sep + 'OVSB.log'
    logging.info("ovincidents: Main: cwd: %s", os.getcwd())
    logging.info("ovincidents: Main: logfilepath: %s", logfilepath)
    
    dat=time.strftime("%d-%m-%Y")
    tim=time.strftime("%H-%M")
    
    logging.basicConfig(filename=logfilepath, level=logging.DEBUG)
    
    # Create certs directory for storing the OV certificates
    certpath=os.getcwd() + os.sep + "certs"
    if not os.path.exists(certpath):
        if os.path.isfile(logfilepath):
            os.makedirs(certpath)

    # if args["action"] == "start":
    logging.info("ovincidents: Main: Attempting to establish connection with OV SCMB")

    if args["oneview"]["user"] == "" or args["oneview"]["passwd"] == "":
        # Error - missing credentials
        logging.error("ovincidents: Main: Error - missing username and password. \n Usage: python logstash.py -a <OneView IP addr> -u <username> -p <password> -c start")
        sys.exit(main())

    # Start the SCMB connection for this appliance
    credential = {'userName': args["oneview"]["user"], 'password': args["oneview"]["passwd"]}
    logging.info("ovincidents: Main: global_host : %s", global_host)
    con = connection(args["oneview"]["host"])
    sec = security(con)

    try:
        login(con, credential)
        acceptEULA(con)
    except HPOneViewException as e:
        logging.error("ovincidents: Main: Error connecting to appliance: msg: %s", e.msg)
        sys.exit()

    # Generate the RabbitMQ keypair (only needs to be done one time)
    try:
        genRabbitCa(sec)
    except:
        logging.warning("ovincidents: Main: The cert already exist. Hence create cert failed....")

    # Download the certificates
    getCertCa(sec, args["oneview"]["host"])
    getRabbitKp(sec, args["oneview"]["host"])

    # load input csv files into dictionary
    traps_file_dir = './traps'
    trapsdict = load_csv(traps_file_dir)

    # Initialize servicenow session
    servicenow_init(args["servicenow"])

    # Add a scheduler
    schedule.every(10).minutes.do(job)
    
    # Start receiving messages from OneView
    recv(args["oneview"]["host"], args["oneview"]["route"])
   

##### loading csv files into dictionary ######
def load_csv(filePath):
    dict = readFiles(filePath)
    return dict

def readFiles(filePath):
    global  trapsdict
    #get all csv files in a given folder
    fileList = os.listdir(filePath)
    for myFile in fileList:
        myFilePath = os.path.join(filePath, myFile)
        #check if file is not sub dir
        if (os.path.isfile(myFilePath)) and myFilePath.endswith(".csv"):
            with open(myFilePath, mode='r') as infile:
                reader = csv.reader(infile)
                trapsdict = {rows[1]:rows[3] for rows in reader}

    return trapsdict

############################# ServiceNow REST API calls ##################################
#### Reference links 
#### http://wiki.servicenow.com/index.php?title=Table_API_Python_Examples#gsc.tab=0
#### http://wiki.servicenow.com/index.php?title=Python_Web_Services_Client_Examples#gsc.tab=0
#### https://github.com/rbw0/python-servicenow-rest

from requests.auth import HTTPBasicAuth

# GLOBAL VARIABLES
SERVICE_NOW_INSTANCE_URL = "https://<>.service-now.com"
INCIDENT_TABLE_URI = "/api/now/table/incident"
EM_ALERTS_TABLE_URI = "/api/now/table/em_alert"
SERVICE_NOW_USER = ""
SERVICE_NOW_PWD = ""
CMDB_CI_TABLE_URI = "/api/now/table/cmdb_ci"
USER_TABLE_URI = "/api/now/table/sys_user"
USER_SYS_ID_IN_SNOW = ""

# The field in ServiceNow Incident table where the Alert ID is stored for correlation between alerts and incidents
ALERT_CORRELATION_FIELD="correlation_id"

def servicenow_init(servicenow_json):
    logging.info("ovincidents: servicenow_init: Start")
    logging.info("ovincidents: servicenow_init: servicenow_json: %s ", servicenow_json)

    global SERVICE_NOW_INSTANCE_URL
    global SERVICE_NOW_USER
    global SERVICE_NOW_PWD
    global USER_SYS_ID_IN_SNOW

    SERVICE_NOW_INSTANCE_URL = SERVICE_NOW_INSTANCE_URL.replace("<>", servicenow_json["instance"])
    SERVICE_NOW_USER = servicenow_json["username"]
    SERVICE_NOW_PWD = servicenow_json["password"]

    logging.info("ovincidents: servicenow_init: before servicenow get request for user : %s" , SERVICE_NOW_USER)

    # All incidents will be created in the name of (caller) the user used by this script
    # to communicate with SNOW. So get the current user's ID for SNOW 
    result = servicenow_rest_get({"user_name": SERVICE_NOW_USER}, USER_TABLE_URI)
    logging.info("ovincidents: servicenow_init: User sys_id: %s ", result[0]["sys_id"])
    USER_SYS_ID_IN_SNOW = result[0]["sys_id"]
    logging.info("ovincidents: servicenow_init: End")

def servicenow_getsession():

    s = requests.Session()
    s.auth = HTTPBasicAuth(SERVICE_NOW_USER, SERVICE_NOW_PWD)
    s.headers.update({'content-type': 'application/json', 'accept': 'application/json'})

    return s

def servicenow_handle_response(request, method):
    # Check for errors in the server response and return the serialized output
    logging.info("ovincidents: servicenow_handle_response: Start")
    
    try:
        result = request.json()
    except ValueError:
        logging.error("ovincidents: servicenow_handle_response: request.json(): check the servicenow instance")

    logging.debug("ovincidents: servicenow_handle_response: servicenow rest response:  %s", request.json())
    logging.debug("ovincidents: servicenow_handle_response: status_code: %s", request.status_code)    

    if request.status_code == 404 :
        result['result'] = []
    elif 'error' in result:
        raise UnexpectedResponse("ServiceNow responded (%i): %s" % (request.status_code,
                                        result['error']['message']))

    return_code = request.status_code

    logging.debug("ovincidents: servicenow_handle_response: before return: %s", result['result'])
    return result['result']

# queryjson is a json data containing query params
def servicenow_rest_get(queryjson, tableuri):
    # Add code here
    logging.debug("ovincidents: servicenow_rest_get: Start: queryjson: %s", queryjson)
    
    headers = {"Content-Type":"application/json","Accept":"application/json"}
    url = SERVICE_NOW_INSTANCE_URL+tableuri
    # service_id_response=requests.get(url, auth=(user, pwd), headers=headers  )

    logging.debug("ovincidents: servicenow_rest_get: url: %s", url)

    request = servicenow_getsession().get(url, params = queryjson )

    logging.debug("ovincidents: servicenow_rest_get: request: %s", request)

    return servicenow_handle_response(request, "get")

def servicenow_rest_post(jsondata, tablename):
    # Add code here
    logging.info("ovincidents: servicenow_rest_post: Start")

    headers = {"Content-Type":"application/json","Accept":"application/json"}

    url = SERVICE_NOW_INSTANCE_URL+tablename

    request = servicenow_getsession().post(url, data = json.dumps(jsondata))

    return servicenow_handle_response(request, "post")

def servicenow_rest_udpate(sys_id, jsondata):
    # Add code here
    logging.info("ovincidents: servicenow_rest_put: Start")

    headers = {"Content-Type":"application/json","Accept":"application/json"}

    url = SERVICE_NOW_INSTANCE_URL+INCIDENT_TABLE_URI + '/'+ sys_id

    request = servicenow_getsession().put(url, data = json.dumps(jsondata))

    return servicenow_handle_response(request, "post")

def handle_ovalert(content):
    # Add code here
    logging.debug("ovincidents: handle_ovalert: Start: content: %s", content)
    global trapsdict
    resource = content['resource']
    logging.debug("ovincidents: handle_ovalert: resource: %s", resource)
    global global_host

    # The correlation_id is the field in ServiceNow Incident table that has 
    # OneView Alert reference 
    #correlation_id = resource['uri'] + "-" + global_host
    # Prakash: let us use location of Incident table field to store OV alert uri
    location = resource['uri'] + "-" + global_host
    resourceUri = resource['resourceUri'].split('/')[3]
    correlation_id = resourceUri + "-" + global_host

    # if resource['alertState'] in ['Active', 'Locked']:
    if 'alertState' in list(resource.keys()):
        logging.info("ovincidents: handle_ovalert: it is indeed an alert!")        
        logging.debug("ovincidents: handle_ovalert: alert URI is: %s", resource["uri"])
        #print("ovincidents: alert received: handle_ovalert: alert is: %s", resource)
        print("ovincidents: alert received: handle_ovalert: alert URI is: %s", resource["uri"])

        if resource['alertState'] in ['Active']:
            #check the trap is present in the dictionary
            alertTypeID = resource["alertTypeID"]
            # from oneview, 'alertTypeID': 'Trap.cpqHe4FltTolPowerSupplyDegraded',
            # remove Trap. from the value
            print("alertTypeId: ", alertTypeID[5:])
            trapName = alertTypeID[5:]
            #if trap if found in the subset of the list ( .csv file ), then
            # send it to SNOW incident table, everything else should go to events table
            if trapName in trapsdict:
                print("trap name : %s is found in the dictionary..... ", trapName)
                logging.debug("ovincidents: handle_ovalert: trap name is found in the dictionary: %s", trapName)

                #  First check ServiceNow if a record is already created for this alert in Incidents
                # result = servicenow_rest_get({"correlation_id": correlation_id, "sysparm_fields": "sys_id"}, INCIDENT_TABLE_URI)
                result = servicenow_rest_get({"correlation_id": correlation_id}, INCIDENT_TABLE_URI)

                # if a record exists already then update it, else create new incident record
                if len(result) > 0 and len(result[0]["sys_id"]) > 0:
                    # logging.info("Incident record found with number: %s", result[0]["number"])
                    logging.info("ovincidents: handle_ovalert: Incident record found with number sys_id: %s", result[0]["sys_id"])
                    logging.info("ovincidents: handle_ovalert: Incident record found with number sys_id: %s", result[0])
                    print("ovincidents: handle_ovalert: Incident record found with resource uri: %s", result[0]['correlation_id'])
                    #print("result[state]: %s", result[0]['state'])

                    # Update Incident table with comments about the changes in the alert info
                    incidentbody = servicenow_convert_ovalert(resource)
                    logging.debug("ovincidents: handle_ovalert: incidentbody: %s", incidentbody)

                    logging.debug("ovincidents: handle_ovalert: New Alert State: %s", resource['alertState']);
                    # if cleared or made active again
                    #if 'Cleared' in resource['alertState']:
                    #if resource['alertState'] in ['Active']:
                    incidentbody = {}
                    changeLogLength = len(resource['changeLog'])
                    changelognotes = ""
                    if changeLogLength > 0:
                        changelognotes = resource['changeLog'][0]['notes']
                    incidentbody['comments'] = "Description: " + resource['description'] + "\n" + "OneView Resource Uri: " + \
                                               resource['uri'] + "\n" + "Modified on OneView at :" + resource['modified'] + "\n" + \
                                               "OneView Address: " + global_host + "\n" + \
                                               "chanege log notes: " + changelognotes
                    # incidentbody['sys_id'] = result[0]["sys_id"]
                    incidentbody['state'] = result[0]['state']

                    logging.info("ovincidents: handle_ovalert: incident update body: %s", json.dumps(incidentbody))

                    #if same incident in snow is in closed state (=7), then change the state to "In Progress = 2"
                    if incidentbody['state'] == 7:
                        print('current state of the incident is in "closed" state, it is update with "In Progress" state')
                        incidentbody['state'] = "2"

                    servicenow_rest_udpate(result[0]["sys_id"], incidentbody)


                else:
                    logging.info("ovincidents: handle_ovalert: No record existing in Incident table for this alert, going to creaate new incident in service now")
                    print("ovincidents: handle_ovalert: No record existing in Incident table for this alert, going to creaate new incident in service now")

                    if resource['alertState'] in ['Active', 'Locked']:
                        logging.info("New incident creation!");
                        incidentbody = servicenow_convert_ovalert(resource)
                        result = servicenow_rest_post(incidentbody, INCIDENT_TABLE_URI)
                    else:
                        logging.info("ovincidents: handle_ovalert: No incident created for the alert <" + resource['uri'] + "> as the alert state is: " + resource['alertState'])
            else:
                logging.debug("ovincidents: handle_ovalert: trap : %s is not part of filtered list, send it to events table on service now " % trapName)
                print("ovincidents: handle_ovalert: trap : %s is not part of filtered list, send it to events table on service now " % trapName)
                eventsbody = servicenow_convert_ovalert_events(resource)
                result = servicenow_rest_post(eventsbody, EM_ALERTS_TABLE_URI)
                print("ovincidents: handle_ovalert: trap : %s is posted em_alert table on service now " % trapName)
                logging.debug("ovincidents: handle_ovalert: trap : %s is posted to em_alerts table on service now " % trapName)
                logging.debug("ovincidents: handle_ovalert: result after posting to em_alerts table on service now : %s " % result)


def servicenow_convert_ovalert(ovalert_json):
    # OV alert is inputted in JSON format
    logging.info("ovincidents: servicenow_convert_ovalert: Start: ovalert_json: %s", ovalert_json)
    servicenow_incident = ""
    datajson = {}
    global global_host
    global USER_SYS_ID_IN_SNOW
    global CMDB_CI_TABLE_URI
    # get the server-hardware uri from the alert data
    # all alerts related single server-hardware should be grouped 
    # under single incident on SNOW
    # parse the resourceUri and get the uuid

    resourceUri = ovalert_json["resourceUri"].split('/')[3]
    logging.debug("ovincidents: servicenow_convert_ovalert: resourceUri : %s", resourceUri)
    datajson["correlation_id"] = resourceUri + "-" + global_host
    # Prakash: let us use location of Incident table field to store OV alert uri
    datajson['location'] = ovalert_json['uri'] + "-" + global_host
    datajson["short_description"] = ovalert_json["description"]

    description = "The " + ovalert_json['associatedResource']['resourceCategory'] \
                        + "\"" + ovalert_json['associatedResource']['resourceName'] +"\" " \
                        + "raised an alert with desciption \"" \
                        + ovalert_json['description'] + "\".\n" \
                        + "The URL to access the OneView Alert is: https://" \
                        + global_host + "/#/activity/r" + ovalert_json['uri'] + "."


    datajson['caller_id'] = USER_SYS_ID_IN_SNOW
    datajson['comments'] = description

    datajson['assignment_group'] = "Hardware"

    resourceuri=ovalert_json['resourceUri']
    category = ""
    if ("server-hardware" in resourceuri or "enclosures" in resourceuri):
        category='Hardware'
    elif( "interconnects" in resourceuri):
        category='Network'
    else:
        category='--None--'

    datajson["category"] = category

    severity = ovalert_json["severity"]

    if "Critical" in severity:
        datajson["impact"] = 1
        datajson["urgency"] = 1
        datajson["priority"] = 1
    elif "Warning" in severity:
        datajson["impact"] = 2
        datajson["urgency"] = 2
        datajson["priority"] = 2

    # Incident states
    #  1 - New
    #  2 - In Progress
    #  7 - Closed    

    #get the configuration_item sys_id 
    # and current state of the incident
    result = servicenow_rest_get({"name": ovalert_json["associatedResource"]["resourceName"]}, CMDB_CI_TABLE_URI)
    if len(result) > 0:
        datajson["cmdb_ci"] = result[0]["sys_id"]        

    logging.debug("ovincidents: servicenow_convert_ovalert: description: %s", description)
    logging.debug("ovincidents: servicenow_convert_ovalert: datajson: %s", json.dumps(datajson))

    return datajson

def servicenow_convert_ovalert_events(ovalert_json):
    # OV alert is inputted in JSON format
    logging.info("ovincidents: servicenow_convert_ovalert_events: Start: ovalert_json: %s", ovalert_json)
    servicenow_incident = ""
    datajson = {}
    global global_host
    global USER_SYS_ID_IN_SNOW
    global CMDB_CI_TABLE_URI
    
    resourceUri = ovalert_json["resourceUri"].split('/')[3]
    logging.debug("ovincidents: servicenow_convert_ovalert: resourceUri : %s", resourceUri)
    datajson["short_description"] = ovalert_json["description"]

    description = "The " + ovalert_json['associatedResource']['resourceCategory'] \
                        + "\"" + ovalert_json['associatedResource']['resourceName'] +"\" " \
                        + "raised an alert with desciption \"" \
                        + ovalert_json['description'] + "\".\n" \
                        + "The URL to access the OneView Alert is: https://" \
                        + global_host + "/#/activity/r" + ovalert_json['uri'] + "."


    datajson['description'] = description
    resourceuri=ovalert_json['resourceUri']
    datajson["resource"]=ovalert_json['resourceUri']

    category = ""
    if ("server-hardware" in resourceuri or "enclosures" in resourceuri):
        category='Hardware'
    elif( "interconnects" in resourceuri):
        category='Network'
    else:
        category='--None--'

    datajson["category"] = category

    datajson["node"] = ovalert_json['associatedResource']['resourceName']
    datajson["cmdb_ci"] = ovalert_json['associatedResource']['resourceName']
    datajson["source"] = global_host

    #TODO : Hard coding to Open now
    # there are options in servicenow. Need to build some logic here
    datajson["state"] = "Open"

    severity = ovalert_json["severity"]

    if "Critical" in severity:
        datajson["severity"] = "Critical"
    elif "Warning" in severity:
        datajson["severity"] = "Warning"

    logging.debug("ovincidents: servicenow_convert_ovalert: description: %s", description)
    logging.debug("ovincidents: servicenow_convert_ovalert: datajson: %s", json.dumps(datajson))

    return datajson


############################# END - ServiceNow REST API calls ##################################


if __name__ == '__main__':
    logging.info('ovincidents: Main 0')
    import sys
    import argparse
    sys.exit(main())

# vim:set shiftwidth=4 tabstop=4 expandtab textwidth=79:



