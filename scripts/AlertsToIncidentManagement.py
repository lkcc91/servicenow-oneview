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
#from elasticsearch import Elasticsearch
import http.client
import logging
import os
import sys
import io
import requests
import schedule
import time

# For passing the host IP to the callback function
global_host = ""
es = None
# SERVICE_NOW_INSTANCE_URL = "https://tietosrvautodemo.service-now.com"
SERVICE_NOW_INSTANCE_URL = "https://<>.service-now.com"
INCIDENT_TABLE_URI = "/api/now/table/incident"


def callback(channel, msg):
    logging.info("callback.......")
    logging.info("msg.delivery_tag: %s",msg.delivery_tag)
    logging.info("msg.consumer_tag: %s", msg.consumer_tag)

    # ACK receipt of message
    channel.basic_ack(msg.delivery_tag)

    # Convert from json into a Python dictionary
    content = json.loads(msg.body)
    # Add a new attribute so that the server side can recognize from which appliance it is this message comes from.
    content['messageHost'] = global_host;
    headers = {"Content-Type" : "application/json", "Accept" : "application/json"}

    logging.info("CONTENT %s", content)

    ## integrating with service now
    service_now_integration(content)
    
    # Cancel this callback
    if msg.body == 'quit':
        channel.basic_cancel(msg.consumer_tag)

def handle_ovalert():
    # Add code here

def servicenow_rest_get():
    # Add code here


def servicenow_rest_post():
    # Add code here

def service_now_integration(body):
    
    # Eg. User name="admin", Password="admin" for this code sample.
    user = 'hpe.vikram.fernandes'
    pwd = 'gseteam'

    
    resource = body['resource']

    if 'alertState' in list(resource.keys()):
        logging.info('')
        logging.info('original OneView alert:')
        logging.info('------------------------------------------')
        logging.info('changeType: %s' % (body['changeType']))
        logging.info('data: %s' % (body['data']))
        logging.info('eTag: %s' % (body['eTag']))
        logging.info('newState: %s' % (body['newState']))
        logging.info('resourceUri: %s' % (body['resourceUri']))
        logging.info('resource:')
        logging.info('------------------------------------------')
        logging.info('    alertState: %s' % (resource['alertState']))
        logging.info('    alertTypeID: %s' % (resource['alertTypeID']))
        logging.info('    description: %s' % (resource['description']))
        logging.info('    changeLog: %s' % (resource['changeLog']))
        logging.info('    severity: %s' % (resource['severity']))
        logging.info('    resourceName: %s'
              % (resource['associatedResource']['resourceName']))
        logging.info('    resourceCategory: %s'
              % (resource['associatedResource']['resourceCategory']))
        logging.info('    uri: %s' % (resource['uri']))
        # The timestamp from the appliance is in ISO 8601 format, convert
        # it to a Python datetime format instead
        atime = (datetime.datetime.strptime(body['timestamp'],
                                            '%Y-%m-%dT%H:%M:%S.%fZ'))
        # Print the timestamp is a simple format (still in UTC)
        logging.info('timestamp: %s' % (atime.strftime('%Y-%m-%d %H:%M:%S')))
        logging.info('resourceUri: %s' % (body['resourceUri']))
        logging.info('')
        
    #Get the sevice_id from the incident table/incident
    # Set proper headers
    headers = {"Content-Type":"application/json","Accept":"application/json"}
    url = SERVICE_NOW_INSTANCE_URL+INCIDENT_TABLE_URI+'?sysparm_query=number='+ resource['uri']
    service_id_response=requests.get(url, auth=(user, pwd), headers=headers  )
    result=service_id_response.json()
    result_array=result['result']
    logging.info(result)
    if not result_array:
        if (('Active' == resource['alertState'] or 'Locked' == resource['alertState'] or 'Error' == resource['alertState'])):       
            
            url=url = SERVICE_NOW_INSTANCE_URL+INCIDENT_TABLE_URI
            #get on the table to get the assignment group
            headers = {"Content-Type":"application/json","Accept":"application/json"}
            # Set proper headers
            headers = {"Content-Type":"application/xml","Accept":"application/xml"}
            response = None
            category=''
            resourceuri=resource['resourceUri']
            if ("server-hardware" in resourceuri or "enclosures" in resourceuri):
                category='Hardware'
            elif( "interconnects" in resourceuri):
                category='Network'
            else:
                category='--None--'
                
            # Do the HTTP request
            if('Critical' == resource['severity']):
                response = requests.post(url, auth=(user, pwd), headers=headers ,data="<request><entry><number>"+ resource['uri']+ 
                "</number><short_description>" + resource['description']+ 
                "</short_description><urgency>1</urgency><impact>1</impact><comments>The alert has been raised in one view appliance.\nUri of the alert:https://"
                +global_host+"/#/activity/r"+resource['uri']+ " \ncorrectiveAction:" + resource['correctiveAction'] +
                "\nresourceUri:"+resource['resourceUri']+"</comments><category>"+category+"</category></entry></request>")
            
            if('Warning' == resource['severity']):
                response = requests.post(url, auth=(user, pwd), headers=headers ,data="<request><entry><number>"+ resource['uri']+ 
                "</number><short_description>" + resource['description']+ 
                "</short_description><urgency>2</urgency><impact>2</impact><comments>The alert has been raised in one view appliance.\nUri of the alert:https://"
                +global_host+"/#/activity/r"+resource['uri']+ " \ncorrectiveAction:" + resource['correctiveAction'] +
                "\nresourceUri:"+resource['resourceUri']+"</comments><category>"+category+"</category></entry></request>")
            
            logging.info(response.status_code)
            # Check for HTTP codes other than 200
            if response != None and  response.status_code != 200: 
                #print('Status:', response.status_code, 'Headers:', response.headers, 'Error Response:',response.json())
                logging.info(response)
    else:
        url = SERVICE_NOW_INSTANCE_URL+INCIDENT_TABLE_URI + result_array[0]['sys_id']
        headers = {"Content-Type":"application/xml","Accept":"application/xml"}
        #short_description = result_array[0]['short_description']
        #short_description = resource['description'] + '\n' + short_description
        response=requests.put(url, auth=(user, pwd), headers=headers ,data="<request><entry><comments>Alert has been cleared in OneView</comments></entry></request>")
        if response != None and  response.status_code != 200: 
            logging.info(response)
            
def recv(host, route):
    logging.info("recv - Entry %s", route)

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

    logging.info(ssl_options)
    print("before conn: ")
    print(ssl_options)

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
    logging.info("recv - Exit")

# This code written based on info provided by https://www.rabbitmq.com/consumer-cancel.html
def stopSCMB(host):
    logging.info("stopSCMB: stopping SCMB")

    EXCHANGE_NAME = 'scmb'
    dest = host + ':5671'

    # Setup our ssl options
    ssl_options = ({'ca_certs': 'certs/' + host + '-caroot.pem',
                    'certfile': 'certs/' + host + '-client.pem',
                    'keyfile': 'certs/' + host + '-key.pem',
                    'cert_reqs': ssl.CERT_REQUIRED,
                    'ssl_version' : ssl.PROTOCOL_TLSv1_1,
                    'server_side': False})

    logging.info(ssl_options)

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


def login(con, credential):
    logging.info('login')
    # Login with givin credentials
    try:
        con.login(credential)
    except:
        logging.error('Login failed')


def acceptEULA(con):
    logging.info('acceptEULA')
    # See if we need to accept the EULA before we try to log in
    con.get_eula_status()
    try:
        if con.get_eula_status() is True:
            con.set_eula('no')
    except Exception as e:
        logging.error('EXCEPTION:')
        logging.error(e)

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
    logging.info('getCertCa')
    cert = sec.get_cert_ca()
    ca = open('certs/' + host + '-caroot.pem', 'w+')
    ca.write(cert)
    ca.close()


def genRabbitCa(sec):
    logging.info('getRabbitCa')
    sec.gen_rabbitmq_internal_signed_ca()



def getRabbitKp(sec, host):
    logging.info('getRabbitKp')
    cert = sec.get_rabbitmq_kp()
    ca = open('certs/' + host + '-client.pem', 'w+')
    ca.write(cert['base64SSLCertData'])
    ca.close()
    ca = open('certs/' + host + '-key.pem', 'w+')
    ca.write(cert['base64SSLKeyData'])
    ca.close()

def job():
    print("I'm working...")

def main():
    print('Main')
   # iv = 'asdfasdfasdfasdf'
    #key = 'MjM4NTI2NjYzMjkxwF0LlH0wVYxxSlmQzktiyly2t025WbVo'
    # with io.open("/ci/hubble/iv", 'r', encoding='utf8') as f:
        # iv = f.read()
    # with io.open("/ci/hubble/key", 'r', encoding='utf8') as f:
        # key = f.read()
    #dec = AES.new(key=key, mode=AES.MODE_CBC, IV=iv)
    parser = argparse.ArgumentParser(add_help=True, description='Usage')
    parser.add_argument('-i','--input_file',dest='input_file', required=True,
                        help='Json file containing input arguments')
    #parser.add_argument('-a', '--appliance', dest='host', required=True,
    #                    help='HP OneView Appliance hostname or IP')
    #parser.add_argument('-u', '--user', dest='user', required=False,
    #                    default='Administrator', help='HP OneView Username')
    #parser.add_argument('-p', '--pass', dest='passwd', required=False,
    #                    help='HP OneView Password')
    #parser.add_argument('-r', '--route', dest='route', required=False,
    #                    default='scmb.alerts.#', help='AMQP Routing Key')
    #parser.add_argument('-c', '--action', dest='action', required=True,
    #                    default='', help='Takes values start or stop as action')
                        
    input=parser.parse_args()   
    
    with open(input.input_file) as data_file:    
        args = json.load(data_file)   
    print (args["oneview"]["host"])
    print (args["oneview"]["action"])
    print (args["oneview"]["route"])
	
    sys.exit()

    action = args["action"]
    #args.passwd = dec.decrypt(bytes.fromhex(args.passwd)).decode('utf8')[:int(args.plen)]
    global global_host
    global_host = args["host"]
    CI_LOG_PATH = '.'

    # logfilepath = os.getcwd() + os.sep + global_host + '-OVSB.log'
    #logfilepath = CI_LOG_PATH + os.sep + global_host + '-OVSB.log'
    logfilepath = os.getcwd() + os.sep + 'OVSB.log'
    print(logfilepath)
    print(os.getcwd())

    dat=time.strftime("%d-%m-%Y")
    tim=time.strftime("%H-%M")
    # os.rename(logfilepath,os.getcwd() + os.sep + global_host + "_" + dat + "_" + tim + "-OVSB.log")
    #os.rename(logfilepath, CI_LOG_PATH + os.sep + global_host + "_" + dat + "_" + tim + "-OVSB.log")

    logging.basicConfig(filename=logfilepath, level=logging.DEBUG)
    logging.info('Input args: host = %s, route = %s, action = %s', args["host"], args["route"], args["action"])

    # Create certs directory for storing the OV certificates
    certpath=os.getcwd() + os.sep + "certs"
    if not os.path.exists(certpath):
        if os.path.isfile(logfilepath):
            os.makedirs(certpath)

    if args["action"] == "start":
        print("Attempting to establish connection with OV SCMB")

        if args["user"] == "" or args["passwd"] == "":
            # Error - missing credentials
            print("Error - missing username and password. \n Usage: python logstash.py -a <OneView IP addr> -u <username> -p <password> -c start")
            sys.exit(main())

        # Start the SCMB connection for this appliance
        credential = {'userName': args["user"], 'password': args["passwd"]}
        logging.info(global_host)
        con = connection(args["host"])
        sec = security(con)

        try:
            login(con, credential)
            acceptEULA(con)
        except HPOneViewException as e:
            logging.error("Error connecting to appliance: msg: %s", e.msg)
            sys.exit()

        # Generate the RabbitMQ keypair (only needs to be done one time)
        try:
            genRabbitCa(sec)
        except:
            logging.warning("The cert already exist. Hence create cert failed....")

        # Download the certificates
        getCertCa(sec, args["host"])
        getRabbitKp(sec, args["host"])
        # Add a scheduler
        
        schedule.every(10).minutes.do(job)
        
        # Start receiving messages from OneView
        recv(args["host"], args["route"])

    elif args["action"] == "stop":
        # Stop SCMB connection for this appliance
        logging.info("TODO: stop action implementation")
        # stopSCMB(args.host)
    else:
        # Do nothing and exit
        logging.error("Missing or invalid command-line option value for -c")






if __name__ == '__main__':
    print('Main 0')
    import sys
    import argparse
    sys.exit(main())

# vim:set shiftwidth=4 tabstop=4 expandtab textwidth=79:
