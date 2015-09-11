#!/bin/bash
say() { local IFS=+;/usr/bin/mplayer -ao alsa -noconsolecontrols "http://translate.google.com/translate_tts?tl=en&q=$*"; }
say $*
