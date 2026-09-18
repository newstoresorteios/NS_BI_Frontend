# NS BI Frontend

Painel de Business Intelligence da New Store, baseado no modelo XNaMai e
conectado ao `NS_BI_Backend`.

Inclui visão geral, pedidos, produtos, clientes, retenção e LTV, vendedores,
estoque, análises geográficas, CRM, análise de varejo, qualidade de dados,
exportações e acompanhamento da sincronização Tray.

## Execução local

```bash
npm install
copy .env.example .env
npm run dev
```

Configure `VITE_BI_API_URL` com a URL pública do backend. A autenticação usa
cookie seguro; nenhuma chave do BI deve ser incluída no frontend.

## Produção

O projeto pode ser publicado na Vercel ou no Render. Cadastre apenas:

```env
VITE_BI_API_URL=https://ns-bi-backend.onrender.com
```
