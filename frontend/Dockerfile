# Use Node.js with Alpine Linux (lightweight alternative to Ubuntu)
FROM node:22-alpine

WORKDIR /app
COPY package*.json ./
RUN npm install && npm install -g vite@latest
COPY . .
ARG VITE_REACT_APP_BASE_URL
ENV VITE_REACT_APP_BASE_URL=$VITE_REACT_APP_BASE_URL

RUN npm run build

EXPOSE 3000
CMD ["npx", "serve", "-s", "build", "-l", "3000"]
# CHANGE