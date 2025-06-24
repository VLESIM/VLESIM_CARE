FROM node:20 as build

WORKDIR /app
COPY . .
RUN npm install
RUN npm run build
RUN pwd

# Production stage with Nginx
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]