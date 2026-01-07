# Use Node 20 as the base image
FROM node:20

# Create app directory
WORKDIR /usr/src/app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of your server code
COPY . .

# Match the port in your index.js (5000)
EXPOSE 5000

# Start the server
CMD ["node", "index.js"]