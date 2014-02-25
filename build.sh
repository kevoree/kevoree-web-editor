#!/bin/sh
mvn -N validate
mvn -version
mvn clean deploy --settings settings.xml 