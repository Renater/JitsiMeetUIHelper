#!/bin/bash

FILE_CERT="/config/apache.pem"
FILE_HTTP_CONFIG="/config/httpp_uihelper.conf"
FILE_UI_CONFIG="/config/config.json"

SERVER_NAME="uihelper.rendez-vous.renater.fr"
if [ ! -f "$FILE_CERT" ]; then
    echo "Custom $FILE_CERT does not exist. Generate a selfsigned certificate"
    openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 10000 -nodes -subj '/CN='$SERVER_NAME
    cat key.pem cert.pem > apache.pem
    cp apache.pem  /config
    mv apache.pem  /etc/apache2
    rm key.pem cert.pem
fi

if [ -f "$FILE_HTTP_CONFIG" ]; then
    echo "Custom $FILE_HTTP_CONFIG found use it"
    cp $FILE_HTTP_CONFIG /etc/apache2/sites-available/uihelper.conf

if [ f "$FILE_UI_CONFIG" ]; then
    echo "Custom $FILE_UI_CONFIG found use it"
    cp $FILE_UI_CONFIG /var/UIhelper/src/config.json
fi



#Start Apache
/usr/sbin/apache2ctl -DFOREGROUND
