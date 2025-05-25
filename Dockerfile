# Use the Node image as the base image because Prisma by default uses `npm`
FROM node:slim

# Install Bun for better performance
RUN npm install -g bun@latest

# Set the working directory in the container
WORKDIR /app

# Copy the current directory contents into the container at /app
COPY . .

# Install openssl which is required for Prisma
RUN apt-get update -y && apt-get install -y openssl && apt-get clean && rm -rf /var/lib/apt/lists/*

# Install the dependencies using Bun
RUN bun install --no-cache

# Run Prisma generate
RUN bunx prisma generate

# Expose the port on which the API will listen
EXPOSE 3000
