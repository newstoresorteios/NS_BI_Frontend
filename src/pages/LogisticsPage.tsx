import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { analyticsApi } from "../api/client";
import { MetadataStatus, QueryState } from "../components/feedback/QueryState";
import type { AnalyticsFilters } from "../types/analytics";

const money = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const STATUS_LABELS: Record<string, string> = {
  awaiting_shipment: "Aguardando envio",
  shipped: "Enviado",
  delivered: "Entregue",
  not_informed: "Sem informação",
};

const dateTime = (value: string | null) =>
  value ? new Date(value).toLocaleString("pt-BR") : "—";

const days = (value: number | null) =>
  value == null
    ? "Indisponível"
    : `${value.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} dias`;

export function LogisticsPage({ filters }: { filters: AnalyticsFilters }) {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [searchDraft, setSearchDraft] = useState("");
  const [search, setSearch] = useState("");
  const query = useQuery({
    queryKey: ["analytics", "logistics", filters, page, status, search],
    queryFn: () =>
      analyticsApi.logistics(filters, {
        page,
        pageSize: 50,
        search,
        status: status || undefined,
        sort: "issued_at",
        order: "desc",
      }),
  });

  if (query.isError || !query.data) {
    return (
      <QueryState
        loading={query.isLoading}
        error={query.error as Error | null}
        onRetry={() => void query.refetch()}
      />
    );
  }

  const { summary } = query.data;
  return (
    <div className="page-stack logistics-page">
      <MetadataStatus metadata={query.data.metadata} />

      <section className="metric-grid logistics-metrics">
        <article className="metric-card">
          <span>Pedidos com frete</span>
          <strong>{summary.withShipping.toLocaleString("pt-BR")}</strong>
          <small>{summary.shippingCoveragePct.toLocaleString("pt-BR")}% dos pedidos</small>
          <p>Pedidos válidos com modalidade, custo ou movimentação de envio.</p>
        </article>
        <article className="metric-card">
          <span>Aguardando envio</span>
          <strong>{summary.awaitingShipment.toLocaleString("pt-BR")}</strong>
          <small>Fila operacional atual</small>
          <p>Frete identificado, mas ainda sem data ou código de postagem.</p>
        </article>
        <article className="metric-card">
          <span>Enviados</span>
          <strong>{summary.shipped.toLocaleString("pt-BR")}</strong>
          <small>{summary.trackingCoveragePct.toLocaleString("pt-BR")}% rastreáveis</small>
          <p>Pedidos postados e ainda não confirmados como entregues.</p>
        </article>
        <article className="metric-card">
          <span>Entregues</span>
          <strong>{summary.delivered.toLocaleString("pt-BR")}</strong>
          <small>{summary.deliveryRatePct.toLocaleString("pt-BR")}% dos movimentados</small>
          <p>Entrega confirmada nos dados disponibilizados pela Tray.</p>
        </article>
        <article className="metric-card">
          <span>Frete total</span>
          <strong>{money.format(summary.totalShippingCost)}</strong>
          <small>Média {money.format(summary.averageShippingCost)}</small>
          <p>Valores de frete informados nos pedidos filtrados.</p>
        </article>
        <article className="metric-card">
          <span>Tempo até postagem</span>
          <strong>{days(summary.averageFulfillmentDays)}</strong>
          <small>Pedido até envio</small>
          <p>Média calculada apenas quando as duas datas existem.</p>
        </article>
        <article className="metric-card">
          <span>Tempo em transporte</span>
          <strong>{days(summary.averageDeliveryDays)}</strong>
          <small>Envio até entrega</small>
          <p>Média calculada apenas em pedidos entregues com datas completas.</p>
        </article>
      </section>

      <section className="module-card logistics-status-card">
        <div className="module-heading">
          <div>
            <h2>Fluxo logístico</h2>
            <p>Clique em uma etapa para filtrar os envios.</p>
          </div>
        </div>
        <div className="logistics-status-grid">
          <button
            type="button"
            className={status === "" ? "active" : ""}
            onClick={() => {
              setStatus("");
              setPage(1);
            }}
          >
            <span>Todos</span>
            <strong>{summary.orders.toLocaleString("pt-BR")}</strong>
          </button>
          {query.data.byStatus.map((item) => (
            <button
              type="button"
              key={item.status}
              className={status === item.status ? "active" : ""}
              onClick={() => {
                setStatus(item.status);
                setPage(1);
              }}
            >
              <span>{STATUS_LABELS[item.status] || item.status}</span>
              <strong>{item.orders.toLocaleString("pt-BR")}</strong>
              <small>{item.sharePct.toLocaleString("pt-BR")}%</small>
            </button>
          ))}
        </div>
      </section>

      <section className="module-card table-module">
        <div className="module-heading">
          <div>
            <h2>Desempenho por modalidade</h2>
            <p>Volume, participação, entrega e custo de cada forma de envio.</p>
          </div>
        </div>
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Modalidade</th>
                <th>Pedidos</th>
                <th>Participação</th>
                <th>Entregues</th>
                <th>Taxa de entrega</th>
                <th>Frete total</th>
                <th>Frete médio</th>
              </tr>
            </thead>
            <tbody>
              {query.data.byMethod.map((item) => (
                <tr key={item.method}>
                  <td>{item.method}</td>
                  <td>{item.orders.toLocaleString("pt-BR")}</td>
                  <td>{item.sharePct.toLocaleString("pt-BR")}%</td>
                  <td>{item.delivered.toLocaleString("pt-BR")}</td>
                  <td>{item.deliveryRatePct.toLocaleString("pt-BR")}%</td>
                  <td>{money.format(item.shippingCost)}</td>
                  <td>{money.format(item.averageShippingCost)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="module-card table-module">
        <div className="module-heading logistics-table-heading">
          <div>
            <h2>Envios</h2>
            <p>Rastreio e datas operacionais por pedido.</p>
          </div>
          <form
            className="logistics-search"
            onSubmit={(event) => {
              event.preventDefault();
              setSearch(searchDraft.trim());
              setPage(1);
            }}
          >
            <input
              value={searchDraft}
              onChange={(event) => setSearchDraft(event.target.value)}
              placeholder="Pedido, cliente, rastreio ou modalidade"
              aria-label="Buscar envios"
            />
            <button type="submit" className="row-action-solid">Buscar</button>
          </form>
        </div>
        {query.data.items.length === 0 ? (
          <div className="state-panel">Nenhum envio encontrado para os filtros.</div>
        ) : (
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Pedido</th>
                  <th>Cliente</th>
                  <th>Status</th>
                  <th>Modalidade</th>
                  <th>Frete</th>
                  <th>Rastreio</th>
                  <th>Envio</th>
                  <th>Entrega</th>
                  <th>Destino</th>
                </tr>
              </thead>
              <tbody>
                {query.data.items.map((item) => (
                  <tr key={item.id}>
                    <td>#{item.number}</td>
                    <td>{item.customerName || "—"}</td>
                    <td><span className={`shipment-badge ${item.shipmentStatus}`}>{STATUS_LABELS[item.shipmentStatus]}</span></td>
                    <td>{item.shippingMethod || "—"}</td>
                    <td>{item.shippingCost == null ? "—" : money.format(item.shippingCost)}</td>
                    <td>
                      {item.trackingUrl ? (
                        <a href={item.trackingUrl} target="_blank" rel="noreferrer">
                          {item.trackingCode || "Abrir rastreio"}
                        </a>
                      ) : item.trackingCode || "—"}
                    </td>
                    <td>{dateTime(item.shippedAt)}</td>
                    <td>{dateTime(item.deliveredAt)}</td>
                    <td>{[item.city, item.state].filter(Boolean).join("/") || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="table-pagination">
          <span>{query.data.totalItems.toLocaleString("pt-BR")} envios</span>
          <button type="button" disabled={page === 1} onClick={() => setPage((value) => value - 1)}>Anterior</button>
          <strong>Página {page} de {query.data.totalPages}</strong>
          <button type="button" disabled={page >= query.data.totalPages} onClick={() => setPage((value) => value + 1)}>Próxima</button>
        </div>
      </section>
    </div>
  );
}
