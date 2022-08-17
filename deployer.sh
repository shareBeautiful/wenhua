#!/bin/bash
git pull;
git add *;
sleep 1;
git commit -m "foxue";
sleep 2;
git push -u origin master
echo "部署成功";
sleep 3;

