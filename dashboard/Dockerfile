# Build Stage
FROM node:18-alpine as build
WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Add the API URL as a build-time argument
ARG REACT_APP_API_URL
ENV REACT_APP_API_URL=$REACT_APP_API_URL

# Build for production
RUN npm run build

# Serve Stage (using nginx)
FROM nginx:alpine

# Copy the build output to nginx's html folder
COPY --from=build /app/build /usr/share/nginx/html

# Ensure a wildcard fallback for React Router and configure CORS
RUN echo "server { \
    listen 80; \
    location / { \
    root /usr/share/nginx/html; \
    index index.html index.htm; \
    try_files \$uri \$uri/ /index.html; \
    add_header Access-Control-Allow-Origin *; \
    } \
    }" > /etc/nginx/conf.d/default.conf

# Expose port (80 for nginx)
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
