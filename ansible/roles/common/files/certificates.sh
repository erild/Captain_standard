#!/bin/bash

cd /usr/share/ca-certificates/
mkdir cacert.org && cd cacert.org
wget "http://www.cacert.org/certs/root.crt" 
wget "http://www.cacert.org/certs/class3.crt" 
update-ca-certificates
