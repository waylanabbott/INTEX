#!/usr/bin/env bash
# .platform/hooks/postdeploy/00_get_certificate.sh
sudo certbot -n -d http://ellarises-2-5.is404.net --nginx --agree-tos --email samjen@byu.edu