#!/bin/bash

DATE=$(date +"%Y-%m-%d_%H%M%S")

fswebcam --device /dev/video0 -r 640x480 --jpeg 75 /home/pi/koti/webcam0/$DATE.jpg
ln -sf /home/pi/koti/webcam0/$DATE.jpg /home/pi/koti/webcam0/latest

fswebcam --device /dev/video1 -r 640x480 --jpeg 75 /home/pi/koti/webcam1/$DATE.jpg
ln -sf /home/pi/koti/webcam1/$DATE.jpg /home/pi/koti/webcam1/latest
