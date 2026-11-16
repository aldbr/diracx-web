# Minimize the size and complexity of the final Docker image by separating the
# build stage and the runtime stage into two different steps

# Stage 1: Build the Next.js application
FROM --platform=$BUILDPLATFORM node:24-alpine AS build
WORKDIR /app

# Copy the package.json and package-lock.json files to the working directory
COPY package*.json ./
COPY packages/diracx-web/package*.json ./packages/diracx-web/
COPY packages/diracx-web-components/package*.json ./packages/diracx-web-components/
# Install the project dependencies
RUN npm ci && npm cache clean --force
# Copy the application to the working directory
COPY . .
# Build the static export with telemetry disabled (https://nextjs.org/telemetry)
RUN NEXT_TELEMETRY_DISABLED=1 npm run build

# Stage 2: Copy the website from the previous container to a Nginx container
FROM nginxinc/nginx-unprivileged:1.31-alpine
# Without these, the image inherits the nginx base image labels, and Renovate
# would link nginx release notes into the diracx-web version bump PRs.
LABEL org.opencontainers.image.source="https://github.com/DIRACGrid/diracx-web" \
      org.opencontainers.image.title="diracx-web" \
      org.opencontainers.image.description="DiracX web interface" \
      org.opencontainers.image.licenses="GPL-3.0-only" \
      org.opencontainers.image.url="https://github.com/DIRACGrid/diracx-web"
EXPOSE 8080
COPY --from=build /app/out /usr/share/nginx/html
COPY ./config/nginx/default.conf /etc/nginx/conf.d/default.conf
