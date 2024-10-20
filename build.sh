#!/bin/sh
echo "Environment to build: $1"

if [ "$1" = "dev" ]; then
    echo "Building for development"
    cp .env.dev .env.production

    docker build -t manumura/nginx-react-auth-rbac-starter:dev .

    docker push manumura/nginx-react-auth-rbac-starter:dev

elif [ "$1" = "prod" ]; then
    echo "Building for production"
    cp .env.prod .env.production

    docker build -t manumura/nginx-react-auth-rbac-starter:prod .

    docker push manumura/nginx-react-auth-rbac-starter:prod

else
    echo "Invalid environment: should pass dev or prod as argument"
    exit 1
fi

# docker run -d --rm -p 80:80 --name nginx-react-auth-rbac-starter manumura/nginx-react-auth-rbac-starter:dev
rm .env.production
