#!/bin/bash
git pull;
git add *;
sleep 1;
git commit -m "wenhua";
sleep 2;
git push -u origin main
echo "部署成功";
sleep 3000;

