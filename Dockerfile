# Use Node.js LTS
FROM node:18-alpine

# Create app directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install all dependencies including devDependencies
RUN npm install

# Install nodemon globally for development
RUN npm install -g nodemon

# Copy app source
COPY . .

# Expose the port
EXPOSE 3000

# Run development server with nodemon
CMD ["npm", "run", "dev"]
