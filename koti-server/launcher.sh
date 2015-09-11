#!/bin/sh
# launcher.sh

# set PATH
SHELL=/bin/sh
PATH=/usr/local/sbin:/usr/local/bin:/sbin:/bin:/usr/sbin:/usr/bin

# start PM2 with koti-client
su - tipi -c "pm2 start /home/tipi/koti-server/index.js --watch --name koti-server"
