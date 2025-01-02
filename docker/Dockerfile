# ------------------------------------------------------------------------------
# Final Stage
# ------------------------------------------------------------------------------
  FROM alpine:latest
  WORKDIR /home/myapp/
  RUN mkdir data
  RUN mkdir web
  RUN mkdir conf
  RUN mkdir music
  COPY ../build/web ./web
  COPY ../build/musicflow .
  CMD ["./musicflow"]