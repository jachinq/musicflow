# ------------------------------------------------------------------------------
# Final Stage
# ------------------------------------------------------------------------------
  FROM alpine:latest
  WORKDIR /home/myapp/
  RUN mkdir data
  RUN mkdir web
  RUN mkdir conf
  RUN mkdir music
  COPY web ./web
  COPY server .
  CMD ["./server"]