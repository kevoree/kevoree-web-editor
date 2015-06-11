#!/usr/bin/env bash
rsync -urltv --chmod=o+r --delete --rsh="ssh -l $1 -p $3" ./dist/* $1@$2:~/www/editor