################################
## BUILD ENVIRONMENT ###########
################################

FROM node:20-alpine AS build

WORKDIR /usr/src/app

COPY package*.json package-lock.json ./

RUN npm ci --verbose

COPY ./ ./

RUN npm run build

################################
#### PRODUCTION ENVIRONMENT ####
################################

FROM nginx:stable-alpine AS production

COPY --from=build /usr/src/app/nginx /etc/nginx/conf.d

COPY --from=build /usr/src/app/dist /usr/share/nginx/html

EXPOSE 80

ENTRYPOINT ["nginx", "-g", "daemon off;"]
