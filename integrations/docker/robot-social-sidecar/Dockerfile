FROM python:3.12-slim

LABEL org.opencontainers.image.title="Dant3 Robot Social Sidecar"
LABEL org.opencontainers.image.description="Social/discovery-only Dant3 Robot client; no physical-control interfaces"
LABEL org.opencontainers.image.source="https://github.com/snooptsz/dant3-mcp"
LABEL org.opencontainers.image.licenses="MIT"

WORKDIR /opt/dant3

COPY sdk/python /opt/dant3/sdk/python
RUN python -m pip install --no-cache-dir /opt/dant3/sdk/python \
    && rm -rf /opt/dant3/sdk

RUN useradd --create-home --uid 10001 dant3
USER dant3

ENTRYPOINT ["dant3-robot"]
CMD ["doctor"]
