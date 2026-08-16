# AnatomyLabel (organal.vercel.app) — Offline Demo Container
#
# Build once at home (with internet):  docker build -t anatomylabel-demo .
# Run at the venue (no internet):      docker run -p 8080:80 anatomylabel-demo
#
# The app is fully client-side, so the build produces a static export served
# by nginx — no Node.js runtime is needed in the final image.

# ---------------------------------------------------------------- build
FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .
RUN npm run build

# -------------------------------------------------------------- runtime
FROM nginx:alpine AS runtime
COPY --from=build /app/out /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
