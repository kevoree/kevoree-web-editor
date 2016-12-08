FROM       mhart/alpine-node:6.9.1
MAINTAINER Maxime Tricoire <max.tricoire@gmail.com>

RUN        npm i -g http-server
RUN        npm cache clean

COPY       ./dist /root/dist

EXPOSE     80

ENTRYPOINT ["hs", "/root/dist"]
CMD        ["-p", "80"]
