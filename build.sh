#!/bin/sh
echo "Environment to build: $1"

if [ "$1" != "dev" ] && [ "$1" != "prod" ]; then
    echo "Invalid environment: should pass dev or prod as argument"
    exit 1
fi

echo "Building for $1"

cp .env.$1 .env.production

docker build -t manumura/nginx-react-auth-rbac-starter:$1 .

rm .env.production

docker push manumura/nginx-react-auth-rbac-starter:$1

# docker run -d --rm -p 80:80 --name nginx-react-auth-rbac-starter manumura/nginx-react-auth-rbac-starter:$1
