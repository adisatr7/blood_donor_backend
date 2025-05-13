# Use the Bun image as the base image
FROM oven/bun:latest

# Set the working directory in the container
WORKDIR /app

# Copy the current directory contents into the container at /app
COPY . .

# Install openssl which is required for Prisma
RUN apt-get update -y && apt-get install -y openssl

# Install the dependencies using Bun
RUN bun install --no-cache

# Run Prisma generate
RUN bunx prisma generate

# Expose the port on which the API will listen
EXPOSE 3000

# Run the server when the container launches
CMD ["bun", "app.ts"]
