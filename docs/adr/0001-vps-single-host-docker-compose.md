# 0001: VPS Single Host com Docker Compose e Nginx Reverse Proxy

A infraestrutura de produção da SwiftPay opera em uma única VPS Contabo Ubuntu 24.04 orquestrada por Docker Compose e Nginx Reverse Proxy com SSL Let's Encrypt.
Decidimos por esta topologia para unificar banco de dados, mensageria, storage MinIO e microsserviços em rede interna com latência sub-milissegundo, eliminando custos excessivos de nuvens gerenciadas na fase atual da plataforma.
