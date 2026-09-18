import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "../api";
import { QueryState } from "../components/feedback/QueryState";

const dateTime = (value: string | null) =>
  value ? new Date(value).toLocaleString("pt-BR") : "—";

export function SyncPage() {
  const [page, setPage] = useState(1);
  const [feedback, setFeedback] = useState("");
  const queryClient = useQueryClient();
  const status = useQuery({
    queryKey: ["sync-status"],
    queryFn: api.syncStatus,
    refetchInterval: (query) =>
      query.state.data?.some((item) => item.status === "running") ? 5_000 : false,
  });
  const runs = useQuery({
    queryKey: ["sync-runs", page],
    queryFn: () => api.syncRuns(page),
    refetchInterval: status.data?.some((item) => item.status === "running")
      ? 5_000
      : false,
  });
  const sync = useMutation({
    mutationFn: ({ resource, full }: { resource: string; full: boolean }) =>
      api.sync(resource, full),
    onMutate: ({ resource }) => {
      setFeedback(
        resource === "all"
          ? "Solicitando a sincronização completa…"
          : "Solicitando a atualização de pedidos e envios…"
      );
    },
    onSuccess: async (_data, variables) => {
      setFeedback(
        variables.resource === "all"
          ? "Sincronizar tudo foi iniciado. Acompanhe o recurso em andamento abaixo."
          : "Sincronização de pedidos e envios iniciada."
      );
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["sync-status"] }),
        queryClient.invalidateQueries({ queryKey: ["sync-runs"] }),
      ]);
    },
  });
  const cancel = useMutation({
    mutationFn: () => api.cancelSync(),
    onMutate: () => setFeedback("Solicitando a interrupção…"),
    onSuccess: async () => {
      setFeedback("Interrupção solicitada com sucesso.");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["sync-status"] }),
        queryClient.invalidateQueries({ queryKey: ["sync-runs"] }),
      ]);
    },
  });
  const runningOnServer = status.data?.some((item) => item.status === "running") || false;
  const running = runningOnServer || sync.isPending;
  const activeResource = sync.isPending ? sync.variables?.resource : null;

  return (
    <div className="page-stack">
      <article className="module-card">
        <div className="module-heading">
          <div>
            <h2>Sincronização Tray</h2>
            <p>
              A primeira carga completa percorre todos os dados disponíveis na integração.
              Depois dela, use a sincronização incremental de pedidos. Se aparecer 429, espere
              3–5 minutos e clique só em <strong>Sincronizar pedidos</strong>
              — não dispare “Sincronizar tudo” de novo enquanto a Tray
              estiver limitada.
            </p>
          </div>
          <fieldset className="sync-actions">
            <legend className="sr-only">Ações de sincronização</legend>
            <button
              type="button"
              className="sync-action secondary"
              disabled={running}
              aria-busy={activeResource === "orders"}
              onClick={() => sync.mutate({ resource: "orders", full: false })}
            >
              {activeResource === "orders" && <span className="button-spinner" aria-hidden="true" />}
              <span>
                <strong>{activeResource === "orders" ? "Iniciando…" : "Sincronizar pedidos"}</strong>
                <small>Atualiza pedidos, itens e envios</small>
              </span>
            </button>
            <button
              type="button"
              className="sync-action primary"
              disabled={running}
              aria-busy={activeResource === "all"}
              onClick={() => sync.mutate({ resource: "all", full: true })}
            >
              {activeResource === "all" && <span className="button-spinner" aria-hidden="true" />}
              <span>
                <strong>{activeResource === "all" ? "Iniciando tudo…" : "Sincronizar tudo"}</strong>
                <small>Catálogo, clientes, logística e pedidos</small>
              </span>
            </button>
            <button
              type="button"
              className="sync-action danger compact"
              disabled={!runningOnServer || cancel.isPending}
              aria-busy={cancel.isPending}
              onClick={() => cancel.mutate()}
            >
              {cancel.isPending && <span className="button-spinner" aria-hidden="true" />}
              <span><strong>{cancel.isPending ? "Interrompendo…" : "Interromper"}</strong></span>
            </button>
          </fieldset>
        </div>
        {feedback && <div className="sync-feedback" role="status">{feedback}</div>}
        {sync.error && <div className="state-panel error">{sync.error.message}</div>}
        {cancel.error && <div className="state-panel error">{cancel.error.message}</div>}
        <QueryState
          loading={status.isLoading}
          error={status.error as Error | null}
          empty={status.data?.length === 0}
          onRetry={() => void status.refetch()}
        />
        {status.data && status.data.length > 0 && (
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr><th>Recurso</th><th>Status</th><th>Registros</th><th>Último sucesso</th><th>Erro</th></tr>
              </thead>
              <tbody>
                {status.data.map((item) => (
                  <tr key={item.resource}>
                    <td>{item.resource}</td>
                    <td>{item.status}</td>
                    <td>{item.records?.toLocaleString("pt-BR") || 0}</td>
                    <td>{dateTime(item.lastSuccessAt)}</td>
                    <td>{item.error || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </article>

      <article className="module-card table-module">
        <div className="module-heading">
          <div><h2>Histórico auditável</h2><p>Cursores, volumes, falhas e duração de cada execução.</p></div>
        </div>
        <QueryState
          loading={runs.isLoading}
          error={runs.error as Error | null}
          empty={runs.data?.totalItems === 0}
          onRetry={() => void runs.refetch()}
        />
        {runs.data && runs.data.totalItems > 0 && (
          <>
            <div className="data-table-wrap">
              <table className="data-table">
                <thead>
                  <tr><th>Início</th><th>Recurso</th><th>Modo</th><th>Status</th><th>Páginas</th><th>Recebidos</th><th>Persistidos</th><th>Falhas</th><th>Duração</th></tr>
                </thead>
                <tbody>
                  {runs.data.items.map((run) => {
                    const duration = run.finishedAt
                      ? Math.max(
                          0,
                          (new Date(run.finishedAt).getTime() -
                            new Date(run.startedAt).getTime()) /
                            1000
                        )
                      : null;
                    return (
                      <tr key={run.id}>
                        <td>{dateTime(run.startedAt)}</td>
                        <td>{run.resource}</td>
                        <td>{run.mode}</td>
                        <td>{run.status}</td>
                        <td>{run.pages}</td>
                        <td>{run.received}</td>
                        <td>{run.persisted}</td>
                        <td>{run.failed}</td>
                        <td>{duration == null ? "Em andamento" : `${duration.toFixed(1)}s`}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="table-pagination">
              <span>{runs.data.totalItems.toLocaleString("pt-BR")} execuções</span>
              <button type="button" disabled={page === 1} onClick={() => setPage((value) => value - 1)}>Anterior</button>
              <button type="button" disabled={page >= runs.data.totalPages} onClick={() => setPage((value) => value + 1)}>Próxima</button>
            </div>
          </>
        )}
      </article>
    </div>
  );
}
