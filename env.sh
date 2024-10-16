#!/bin/sh
# https://stackoverflow.com/questions/70617812/change-environmet-variables-at-runtime-react-vite-with-docker-and-nginx
# replacing Vite's static env vars with injected one
vars=$(printenv | grep '^VITE_' | awk -F= '{print $1}')
find "/usr/share/nginx/html" -type f -name "*.js" | while read file; do
    for var in $vars; do
        echo "Replacing $var in $file"
        sed -i "s/\($var:\"\)[^\"]*\"/\1$(printenv "$var")\"/g" $file
    done
done

exec "$@"
